import { _decorator, Component, Label } from 'cc';

const { ccclass, property } = _decorator;

interface SpecialStoryNode {
  id: string;
  type: string;
  title?: string;
  text?: string;
  track?: string;
  objects?: string[];
}

/** Lightweight, local-first viewer for photos, letters, investigation and MP3 story beats. */
@ccclass('MemoryInteractionPanel')
export class MemoryInteractionPanel extends Component {
  @property(Label) titleLabel: Label | null = null;
  @property(Label) bodyLabel: Label | null = null;
  @property(Label) actionLabel: Label | null = null;

  render(node: SpecialStoryNode, action: string): void {
    const title = node.title ?? this.titleFor(node.type);
    const detail = node.text ?? '';
    this.titleLabel && (this.titleLabel.string = title);
    this.bodyLabel && (this.bodyLabel.string = detail);
    this.actionLabel && (this.actionLabel.string = action);
    this.node.active = true;
  }

  private titleFor(type: string): string {
    switch (type) {
      case 'investigation': return '旧物调查';
      case 'photo': return '旧照片';
      case 'letter': return '信件';
      case 'audioInteraction': return '旧 MP3';
      case 'transition': return '记忆重构';
      default: return '记忆片段';
    }
  }
}
