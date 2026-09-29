import { _decorator, Component, Label, Node } from 'cc';
import type { TextStoryNode } from '../story/StoryNode';

const { ccclass, property } = _decorator;

/** Presentation only: story state stays in StoryManager. */
@ccclass('DialoguePanel')
export class DialoguePanel extends Component {
  @property(Label) speakerLabel: Label | null = null;
  @property(Label) bodyLabel: Label | null = null;
  @property(Node) continueHint: Node | null = null;

  render(node: TextStoryNode, speakerNames: Record<string, string> = {}): void {
    if (this.speakerLabel) {
      const key = node.speaker ?? '';
      this.speakerLabel.string = speakerNames[key] ?? key;
      this.speakerLabel.node.active = !!key;
    }
    if (this.bodyLabel) this.bodyLabel.string = node.text;
    if (this.continueHint) this.continueHint.active = true;
    this.node.active = true;
  }

  clear(): void {
    if (this.speakerLabel) this.speakerLabel.string = '';
    if (this.bodyLabel) this.bodyLabel.string = '';
    this.node.active = false;
  }
}
