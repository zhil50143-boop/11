import type { GameStateData } from '../core/GameState';
import { applyEffects } from './StoryEffects';
import { applyLifeContext } from '../core/LifeState';
import { resolveEnding, recordEnding } from './EndingResolver';
import type { EpisodeData, StoryNode, InteractionStoryNode } from './StoryNode';

const copyLife = (life: GameStateData['life']): GameStateData['life'] => ({
  ...life, time: { ...life.time }, relationships: { ...life.relationships },
  memoryRecords: Object.fromEntries(Object.entries(life.memoryRecords).map(([id, memory]) => [id, { ...memory, evidence: memory.evidence.slice() }])),
});
const copyState = (state: GameStateData): GameStateData => ({
  ...state, progress: { ...state.progress }, life: copyLife(state.life), stats: { ...state.stats },
  flags: { ...state.flags }, metaFlags: { ...state.metaFlags }, memories: { ...state.memories },
  cg: { ...state.cg }, endings: { ...state.endings }, readNodeIds: state.readNodeIds.slice(),
});

export class SaveWriteError extends Error {
  constructor() { super('未能保存。请保持页面打开，稍后重试。'); this.name = 'SaveWriteError'; }
}

export class StoryRuntime {
  private nodes = new Map<string, StoryNode>();
  private working?: GameStateData;
  private changed = false;
  constructor(private readonly committedState: GameStateData, private readonly persist: (state: GameStateData) => boolean) {}
  get state(): GameStateData { return this.working ?? this.committedState }
  load(episode: EpisodeData, chapterId = this.state.progress.chapterId): void { this.transact(() => this.loadData(episode, chapterId)) }
  advance(expected: string): StoryNode { return this.transact(() => this.advanceNode(expected)) }
  choose(id: string, expected: string): StoryNode { return this.transact(() => this.chooseNode(id, expected)) }
  inspect(id: string, expected: string): StoryNode { return this.transact(() => this.inspectNode(id, expected)) }
  complete(expected: string): StoryNode { return this.transact(() => this.completeNode(expected)) }
  finish(expected: string): void { this.transact(() => this.finishNode(expected)) }
  current(): StoryNode {
    if (this.working) return this.resolve();
    const node = this.nodes.get(this.state.progress.nodeId);
    if (!node) throw new Error('Missing node: ' + this.state.progress.nodeId);
    if (['endingRoute', 'condition', 'save'].includes(node.type)) return this.transact(() => this.resolve());
    // Repainting an unchanged passage does not clone or write the whole save.
    if (node.lifeContext) {
      const life = copyLife(this.state.life);
      if (applyLifeContext(life, node.lifeContext)) return this.transact(() => {
        this.state.life = life; this.changed = true; return node;
      });
    }
    return node;
  }
  private transact<T>(action: () => T): T {
    if (this.working) return action();
    const previousNodes = this.nodes;
    this.working = copyState(this.committedState);
    this.changed = false;
    try {
      const result = action();
      if (this.changed) {
        if (this.persist(this.working) !== true) throw new SaveWriteError();
        // Publish effects, evidence, cursor and timestamp only after the write.
        Object.assign(this.committedState, this.working);
      }
      return result;
    } catch (error) { this.nodes = previousNodes; throw error }
    finally { this.working = undefined; this.changed = false }
  }
  private loadData(episode: EpisodeData, chapterId: string): void {
    const nodes = new Map<string, StoryNode>();
    for (const node of episode.nodes) {
      if (nodes.has(node.id)) throw new Error('Duplicate node: ' + node.id);
      nodes.set(node.id, node);
    }
    if (!nodes.has(episode.startNode)) throw new Error('Missing start node');
    this.nodes = nodes;
    if (this.state.progress.episodeId !== episode.episodeId) {
      this.state.progress.nodeId = episode.startNode;
      this.state.progress.readingOffset = 0;
    } else if (!nodes.has(this.state.progress.nodeId)) {
      const alias = episode.nodeAliases?.[this.state.progress.nodeId];
      if (!alias || !nodes.has(alias)) throw new Error('Saved passage is not available: ' + this.state.progress.nodeId);
      this.state.progress.nodeId = alias;
      this.state.progress.readingOffset = 0;
    }
    this.state.progress.chapterId = chapterId;
    this.state.progress.episodeId = episode.episodeId;
    this.changed = true;
  }
  private resolve(): StoryNode {
    for (let guard = 0; guard < 64; guard++) {
      const node = this.nodes.get(this.state.progress.nodeId);
      if (!node) throw new Error('Missing node: ' + this.state.progress.nodeId);
      if (node.type === 'endingRoute') {
        this.go(node.targets[resolveEnding(this.state)]);
      } else if (node.type === 'condition') {
        const branch = node.branches.find(b => {
          if (b.flag) return !!this.state.flags[b.flag] === (b.equals ?? true);
          if (!b.stat || !b.operator || b.value === undefined) return false;
          const n = this.state.stats[b.stat as keyof typeof this.state.stats];
          switch (b.operator) {
            case '>=': return n >= b.value;
            case '>': return n > b.value;
            case '<=': return n <= b.value;
            case '<': return n < b.value;
            case '==': return n === b.value;
          }
        });
        this.go(branch?.next ?? node.fallback);
      } else if (node.type === 'save') {
        if (!node.next) throw new Error('Save node has no next');
        this.go(node.next);
      } else {
        if (applyLifeContext(this.state.life, node.lifeContext)) this.changed = true;
        return node;
      }
    }
    throw new Error('Automatic node cycle');
  }
  private advanceNode(expected: string): StoryNode {
    const node = this.expect(expected);
    if (!['dialogue', 'narration', 'passage', 'phone'].includes(node.type)) throw new Error('Advance requires text');
    if (!node.next) throw new Error('Text node has no next');
    this.requireTarget(node.next);
    if (!this.state.readNodeIds.includes(node.id)) applyEffects(this.state, undefined, node.setFlags);
    this.read(node.id); this.go(node.next); return this.current();
  }
  private chooseNode(id: string, expected: string): StoryNode {
    const node = this.expect(expected);
    if (node.type !== 'choice') throw new Error('Choice required');
    const option = node.options.find(o => o.id === id);
    if (!option) throw new Error('Unknown option: ' + id);
    this.requireTarget(option.next);
    applyEffects(this.state, option.effects, option.setFlags);
    this.read(node.id); this.go(option.next); return this.current();
  }
  private inspectNode(id: string, expected: string): StoryNode {
    const node = this.expect(expected);
    if (node.type !== 'investigation') throw new Error('Investigation required');
    const item = node.items?.find(i => i.id === id);
    if (!item) throw new Error('Unknown item');
    this.go(item.next); return this.current();
  }
  private completeNode(expected: string): StoryNode {
    const node = this.expect(expected);
    if (!['investigation', 'photo', 'letter', 'audioInteraction', 'transition'].includes(node.type)) {
      throw new Error('Interaction required');
    }
    const special = node as InteractionStoryNode;
    if (special.requireReadToEnd && this.state.progress.readingOffset < 0.99) {
      throw new Error('请先读到这一页的末尾。');
    }
    if (special.type === 'investigation' && !special.requiredFlags?.every(f => this.state.flags[f])) {
      throw new Error('Required items not viewed');
    }
    if (!special.next) throw new Error('Interaction has no next');
    this.requireTarget(special.next);
    if (!this.state.readNodeIds.includes(node.id)) applyEffects(this.state, special.effects, special.setFlags);
    this.read(node.id); this.go(special.next); return this.current();
  }
  private finishNode(expected: string): void {
    const node = this.expect(expected);
    if (node.type !== 'ending') throw new Error('Ending required');
    recordEnding(this.state, node.endingId);
    this.read(node.id); this.changed = true;
  }
  private expect(id: string): StoryNode {
    const node = this.current();
    if (node.id !== id) throw new Error('Stale input');
    return node;
  }
  private requireTarget(id: string): void {
    if (!this.nodes.has(id)) throw new Error('Missing target: ' + id);
  }
  private go(id: string): void {
    this.requireTarget(id); this.state.progress.nodeId = id; this.state.progress.readingOffset = 0; this.changed = true;
  }
  private read(id: string): void {
    if (!this.state.readNodeIds.includes(id)) this.state.readNodeIds.push(id);
  }
}
