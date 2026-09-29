import { _decorator, Component, JsonAsset, resources } from 'cc';
import type { GameStateData } from '../core/GameState';
import { SaveManager } from '../save/SaveManager';
import { applyEffects } from './StoryEffects';
import type {
  ChoiceStoryNode,
  ConditionStoryNode,
  EpisodeData,
  StoryNode,
  TextStoryNode,
} from './StoryNode';

const { ccclass } = _decorator;

interface ChapterManifest {
  chapterId: string;
  episodes: Array<{ id: string; name: string; resource: string; startNode: string }>;
}

export type StoryEvent =
  | { type: 'text'; node: TextStoryNode }
  | { type: 'choice'; node: ChoiceStoryNode }
  | { type: 'special'; node: StoryNode }
  | { type: 'end'; message: string }
  | { type: 'error'; message: string };

@ccclass('StoryManager')
export class StoryManager extends Component {
  state!: GameStateData;
  private episode: EpisodeData | null = null;
  private manifest: ChapterManifest | null = null;
  private nodes = new Map<string, StoryNode>();

  start(): void {
    this.state = SaveManager.load();
  }

  async loadEpisode(resourcePath: string): Promise<void> {
    this.state ??= SaveManager.load();
    const asset = await this.loadJson(resourcePath);
    const episode = asset.json as EpisodeData;
    if (!episode || !Array.isArray(episode.nodes) || !episode.startNode) {
      throw new Error('Invalid episode JSON: ' + resourcePath);
    }

    const nextNodes = new Map<string, StoryNode>();
    for (const node of episode.nodes) {
      if (!node.id || nextNodes.has(node.id)) throw new Error('Missing or duplicate story node id: ' + node.id);
      nextNodes.set(node.id, node);
    }
    if (!nextNodes.has(episode.startNode)) throw new Error('Episode start node not found: ' + episode.startNode);

    this.episode = episode;
    this.nodes = nextNodes;
    this.state.progress.episodeId = episode.episodeId;
    if (!this.nodes.has(this.state.progress.nodeId)) this.state.progress.nodeId = episode.startNode;
    SaveManager.save(this.state);
  }

  async loadChapterManifest(resourcePath: string): Promise<void> {
    this.state ??= SaveManager.load();
    const asset = await this.loadJson(resourcePath);
    const manifest = asset.json as ChapterManifest;
    if (!manifest?.chapterId || !Array.isArray(manifest.episodes) || !manifest.episodes.length) {
      throw new Error('Invalid chapter manifest: ' + resourcePath);
    }
    this.manifest = manifest;
    this.state.progress.chapterId = manifest.chapterId;
    const current = manifest.episodes.find(item => item.id === this.state.progress.episodeId)
      ?? manifest.episodes[0];
    await this.loadEpisode(current.resource);
    this.state.progress.episodeId = current.id;
    SaveManager.save(this.state);
  }

  current(): StoryEvent {
    if (!this.state || !this.episode) return { type: 'error', message: 'Story has not been initialized.' };
    const event = this.resolveNode(this.state.progress.nodeId);
    if (event.type === 'text') this.markRead(event.node.id);
    return event;
  }

  advance(): StoryEvent {
    const node = this.nodes.get(this.state.progress.nodeId);
    if (!node) return { type: 'error', message: 'Missing node: ' + this.state.progress.nodeId };

    if (node.type === 'dialogue' || node.type === 'narration') {
      this.markRead(node.id);
      if (!node.next) return { type: 'error', message: 'Text node has no next: ' + node.id };
      this.goto(node.next);
      return this.current();
    }
    return this.resolveNode(node.id);
  }

  choose(optionId: string): StoryEvent {
    const node = this.nodes.get(this.state.progress.nodeId);
    if (!node || node.type !== 'choice') return { type: 'error', message: 'Current node is not a choice.' };
    const option = (node as ChoiceStoryNode).options.find(item => item.id === optionId);
    if (!option) return { type: 'error', message: 'Unknown choice option: ' + optionId };

    applyEffects(this.state, option.effects, option.setFlags);
    this.markRead(node.id);
    this.goto(option.next);
    return this.current();
  }

  /** Called after a photo, letter, investigation, audio, or transition panel is dismissed. */
  completeSpecial(): StoryEvent {
    const node = this.nodes.get(this.state.progress.nodeId);
    if (!node || ['dialogue', 'narration', 'choice', 'condition', 'episodeEnd'].includes(node.type)) {
      return { type: 'error', message: 'Current node is not a completable interaction.' };
    }
    const next = typeof node.next === 'string' ? node.next : '';
    if (!next) return { type: 'error', message: 'Interaction node has no next: ' + node.id };
    this.markRead(node.id);
    this.goto(next);
    return this.current();
  }

  /** Advances only when the current node is an episodeEnd. Local save is committed before loading the next JSON. */
  async advanceEpisode(): Promise<StoryEvent> {
    const node = this.nodes.get(this.state.progress.nodeId);
    if (!node || node.type !== 'episodeEnd') return { type: 'error', message: 'Current node is not an episode end.' };
    this.markRead(node.id);

    if (!this.manifest) {
      return { type: 'end', message: '本段剧情结束。' };
    }
    const nextId = typeof node.next === 'string' ? node.next : '';
    const next = this.manifest.episodes.find(item => item.id === nextId);
    if (!next) {
      this.state.progress.nodeId = node.id;
      this.state.flags.CH01_VERTICAL_SLICE_COMPLETE = true;
      SaveManager.save(this.state);
      return { type: 'end', message: 'Chapter 01 Vertical Slice 已完成。' };
    }

    this.state.progress.episodeId = next.id;
    this.state.progress.nodeId = next.startNode;
    SaveManager.save(this.state);
    try {
      await this.loadEpisode(next.resource);
      this.state.progress.episodeId = next.id;
      this.state.progress.nodeId = next.startNode;
      SaveManager.save(this.state);
      return this.current();
    } catch (error) {
      return { type: 'error', message: error instanceof Error ? error.message : String(error) };
    }
  }

  private async loadJson(path: string): Promise<JsonAsset> {
    return new Promise<JsonAsset>((resolve, reject) => {
      resources.load(path, JsonAsset, (err, loaded) => {
        if (err || !loaded) reject(err ?? new Error('Story JSON not found: ' + path));
        else resolve(loaded);
      });
    });
  }

  private resolveNode(nodeId: string): StoryEvent {
    let node = this.nodes.get(nodeId);
    let guard = 0;
    while (node && node.type === 'condition' && guard < 32) {
      const target = this.resolveCondition(node as ConditionStoryNode);
      this.goto(target, false);
      node = this.nodes.get(target);
      guard++;
    }
    if (!node) return { type: 'error', message: 'Missing node: ' + nodeId };
    if (guard >= 32) return { type: 'error', message: 'Condition chain exceeded guard limit.' };
    if (node.type === 'dialogue' || node.type === 'narration') return { type: 'text', node: node as TextStoryNode };
    if (node.type === 'choice') return { type: 'choice', node: node as ChoiceStoryNode };
    return { type: 'special', node };
  }

  private resolveCondition(node: ConditionStoryNode): string {
    for (const branch of node.branches) {
      if (branch.flag) {
        if (!!this.state.flags[branch.flag] === (branch.equals ?? true)) return branch.next;
      } else if (branch.stat && branch.operator && typeof branch.value === 'number') {
        const current = (this.state.stats as Record<string, number>)[branch.stat] ?? 0;
        if (this.compare(current, branch.operator, branch.value)) return branch.next;
      }
    }
    return node.fallback;
  }

  private compare(a: number, op: string, b: number): boolean {
    switch (op) {
      case '>=': return a >= b;
      case '>': return a > b;
      case '<=': return a <= b;
      case '<': return a < b;
      case '==': return a === b;
      default: return false;
    }
  }

  private goto(nodeId: string, save = true): void {
    this.state.progress.nodeId = nodeId;
    if (save) SaveManager.save(this.state);
  }

  private markRead(nodeId: string): void {
    if (!this.state.readNodeIds.includes(nodeId)) {
      this.state.readNodeIds.push(nodeId);
      SaveManager.save(this.state);
    }
  }
}
