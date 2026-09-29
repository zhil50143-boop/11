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

export type StoryEvent =
  | { type: 'text'; node: TextStoryNode }
  | { type: 'choice'; node: ChoiceStoryNode }
  | { type: 'special'; node: StoryNode }
  | { type: 'error'; message: string };

@ccclass('StoryManager')
export class StoryManager extends Component {
  state!: GameStateData;
  private episode: EpisodeData | null = null;
  private nodes = new Map<string, StoryNode>();

  start(): void {
    this.state = SaveManager.load();
  }

  async loadEpisode(resourcePath: string): Promise<void> {
    const asset = await new Promise<JsonAsset>((resolve, reject) => {
      resources.load(resourcePath, JsonAsset, (err, loaded) => {
        if (err || !loaded) {
          reject(err ?? new Error('Episode JSON not found: ' + resourcePath));
          return;
        }
        resolve(loaded);
      });
    });

    this.episode = asset.json as EpisodeData;
    this.nodes.clear();

    for (const node of this.episode.nodes) {
      if (this.nodes.has(node.id)) {
        throw new Error('Duplicate story node id: ' + node.id);
      }
      this.nodes.set(node.id, node);
    }

    this.state.progress.episodeId = this.episode.episodeId;
    if (!this.nodes.has(this.state.progress.nodeId)) {
      this.state.progress.nodeId = this.episode.startNode;
    }
    SaveManager.save(this.state);
  }

  current(): StoryEvent {
    return this.resolveNode(this.state.progress.nodeId);
  }

  advance(): StoryEvent {
    const node = this.nodes.get(this.state.progress.nodeId);
    if (!node) return { type: 'error', message: 'Missing node: ' + this.state.progress.nodeId };

    if (node.type === 'dialogue' || node.type === 'narration') {
      this.markRead(node.id);
      if (!node.next) return { type: 'error', message: 'Text node has no next: ' + node.id };
      this.goto(node.next);
      return this.resolveNode(this.state.progress.nodeId);
    }

    return this.resolveNode(node.id);
  }

  choose(optionId: string): StoryEvent {
    const node = this.nodes.get(this.state.progress.nodeId);
    if (!node || node.type !== 'choice') {
      return { type: 'error', message: 'Current node is not a choice.' };
    }

    const choice = node as ChoiceStoryNode;
    const option = choice.options.find(item => item.id === optionId);
    if (!option) return { type: 'error', message: 'Unknown choice option: ' + optionId };

    applyEffects(this.state, option.effects, option.setFlags);
    this.markRead(choice.id);
    this.goto(option.next);
    SaveManager.save(this.state);
    return this.resolveNode(this.state.progress.nodeId);
  }

  private resolveNode(nodeId: string): StoryEvent {
    let node = this.nodes.get(nodeId);
    let guard = 0;

    while (node && node.type === 'condition' && guard < 32) {
      const target = this.resolveCondition(node as ConditionStoryNode);
      this.goto(target, false);
      node = this.nodes.get(target);
      guard += 1;
    }

    if (!node) return { type: 'error', message: 'Missing node: ' + nodeId };
    if (guard >= 32) return { type: 'error', message: 'Condition chain exceeded guard limit.' };

    if (node.type === 'dialogue' || node.type === 'narration') {
      return { type: 'text', node: node as TextStoryNode };
    }
    if (node.type === 'choice') {
      return { type: 'choice', node: node as ChoiceStoryNode };
    }
    return { type: 'special', node };
  }

  private resolveCondition(node: ConditionStoryNode): string {
    for (const branch of node.branches) {
      if (branch.flag) {
        const actual = !!this.state.flags[branch.flag];
        if (actual === (branch.equals ?? true)) return branch.next;
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
    }
  }
}
