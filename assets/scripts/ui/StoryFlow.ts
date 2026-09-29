import { _decorator, Component, Node } from 'cc';
import { StoryManager, type StoryEvent } from '../story/StoryManager';
import { DialoguePanel } from './DialoguePanel';
import { ChoicePanel } from './ChoicePanel';
import { MemoryInteractionPanel } from './MemoryInteractionPanel';

const { ccclass, property } = _decorator;

const SPEAKERS: Record<string, string> = {
  ZHOUXU: '周叙',
  ANRAN: '程安然',
  ZHOUMAN: '周满',
  XIA_17: '许知夏',
  ZHOUXU_17: '周叙',
  XIA_17_RECORDING: '许知夏（录音）',
};

/** Scene adapter. It renders StoryManager events and never owns plot state. */
@ccclass('StoryFlow')
export class StoryFlow extends Component {
  @property(StoryManager) manager: StoryManager | null = null;
  @property(DialoguePanel) dialogue: DialoguePanel | null = null;
  @property(ChoicePanel) choices: ChoicePanel | null = null;
  @property(Node) interactionPanel: Node | null = null;
  @property(MemoryInteractionPanel) memoryPanel: MemoryInteractionPanel | null = null;
  @property(Node) continueButton: Node | null = null;

  private busy = false;

  async start(): Promise<void> {
    if (!this.manager) return this.showError('StoryManager 未绑定。');
    this.continueButton?.on(Node.EventType.TOUCH_END, this.onContinue, this);
    this.interactionPanel?.on(Node.EventType.TOUCH_END, this.onCompleteSpecial, this);
    try {
      await this.manager.loadChapterManifest('data/story/chapter01/chapter01_manifest');
      this.render(this.manager.current());
    } catch (error) {
      this.showError(error instanceof Error ? error.message : String(error));
    }
  }

  onDestroy(): void {
    this.continueButton?.off(Node.EventType.TOUCH_END, this.onContinue, this);
    this.interactionPanel?.off(Node.EventType.TOUCH_END, this.onCompleteSpecial, this);
  }

  private onContinue(): void {
    if (this.busy || !this.manager) return;
    this.render(this.manager.advance());
  }

  private onCompleteSpecial(): void {
    if (!this.manager) return;
    this.render(this.manager.completeSpecial());
  }

  private render(event: StoryEvent): void {
    this.choices?.clear();
    if (this.interactionPanel) this.interactionPanel.active = false;
    if (this.memoryPanel) this.memoryPanel.node.active = false;

    if (event.type === 'text') {
      this.dialogue?.render(event.node, SPEAKERS);
      if (this.continueButton) this.continueButton.active = true;
      return;
    }
    this.dialogue?.clear();
    if (this.continueButton) this.continueButton.active = false;

    if (event.type === 'choice') {
      this.choices?.render(event.node.options, id => {
        if (this.manager) this.render(this.manager.choose(id));
      });
    } else if (event.type === 'special') {
      this.renderSpecial(event.node);
    } else if (event.type === 'end') {
      this.node.emit('chapter-slice-end', event.message);
    } else if (event.type === 'error') {
      this.showError(event.message);
    }
  }

  private renderSpecial(node: { id: string; type: string; [key: string]: unknown }): void {
    if (node.type === 'episodeEnd') {
      this.busy = true;
      void this.loadNextEpisode().finally(() => { this.busy = false; });
      return;
    }

    if (this.interactionPanel) this.interactionPanel.active = true;
    const label = node.type === 'photo' ? '翻看照片'
      : node.type === 'letter' ? '展开信件'
      : node.type === 'audioInteraction' ? '播放录音'
      : node.type === 'investigation' ? '调查旧物'
      : node.type === 'transition' ? '继续回到记忆'
      : '继续';
    this.memoryPanel?.render(node, label);
    this.interactionPanel?.emit('story-special', { node, label });
  }

  private async loadNextEpisode(): Promise<void> {
    if (!this.manager) return;
    this.render(await this.manager.advanceEpisode());
  }

  private showError(message: string): void {
    console.error('[StoryFlow]', message);
    this.node.emit('story-error', message);
  }
}
