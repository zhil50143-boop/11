import type { GameStateData } from '../core/GameState';
import { applyEffects } from './StoryEffects';
import { applyLifeContext } from '../core/LifeState';
import type { EpisodeData, StoryNode, InteractionStoryNode } from './StoryNode';

export class StoryRuntime {
  private nodes = new Map<string, StoryNode>();
  constructor(public readonly state: GameStateData, private readonly persist: (state: GameStateData) => void) {}
  load(episode: EpisodeData, chapterId = this.state.progress.chapterId): void {
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
    this.persist(this.state);
  }
  current(): StoryNode {
    for (let guard = 0; guard < 64; guard++) {
      const node = this.nodes.get(this.state.progress.nodeId);
      if (!node) throw new Error('Missing node: ' + this.state.progress.nodeId);
      if (node.type === 'condition') {
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
        if (applyLifeContext(this.state.life, node.lifeContext)) this.persist(this.state);
        return node;
      }
    }
    throw new Error('Automatic node cycle');
  }
  advance(expected: string): StoryNode {
    const node = this.expect(expected);
    if (!['dialogue', 'narration', 'passage', 'phone'].includes(node.type)) throw new Error('Advance requires text');
    if (!node.next) throw new Error('Text node has no next');
    this.read(node.id); this.go(node.next); return this.current();
  }
  choose(id: string, expected: string): StoryNode {
    const node = this.expect(expected);
    if (node.type !== 'choice') throw new Error('Choice required');
    const option = node.options.find(o => o.id === id);
    if (!option) throw new Error('Unknown option: ' + id);
    this.requireTarget(option.next);
    applyEffects(this.state, option.effects, option.setFlags);
    this.read(node.id); this.go(option.next); return this.current();
  }
  inspect(id: string, expected: string): StoryNode {
    const node = this.expect(expected);
    if (node.type !== 'investigation') throw new Error('Investigation required');
    const item = node.items?.find(i => i.id === id);
    if (!item) throw new Error('Unknown item');
    this.go(item.next); return this.current();
  }
  complete(expected: string): StoryNode {
    const node = this.expect(expected);
    if (!['investigation', 'photo', 'letter', 'audioInteraction', 'transition'].includes(node.type)) {
      throw new Error('Interaction required');
    }
    const special = node as InteractionStoryNode;
    if (special.type === 'investigation' && !special.requiredFlags?.every(f => this.state.flags[f])) {
      throw new Error('Required items not viewed');
    }
    if (!special.next) throw new Error('Interaction has no next');
    this.requireTarget(special.next);
    if (!this.state.readNodeIds.includes(node.id)) applyEffects(this.state, special.effects, special.setFlags);
    this.read(node.id); this.go(special.next); return this.current();
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
    this.requireTarget(id); this.state.progress.nodeId = id; this.state.progress.readingOffset = 0; this.persist(this.state);
  }
  private read(id: string): void {
    if (!this.state.readNodeIds.includes(id)) this.state.readNodeIds.push(id);
  }
}
