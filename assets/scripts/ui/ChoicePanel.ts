import { _decorator, Button, Component, Label, Node } from 'cc';
import type { ChoiceOption } from '../story/StoryNode';

const { ccclass, property } = _decorator;

/** Binds authored choice data to editor-wired buttons. */
@ccclass('ChoicePanel')
export class ChoicePanel extends Component {
  @property([Button]) buttons: Button[] = [];
  @property([Label]) labels: Label[] = [];

  private onChoose: ((id: string) => void) | null = null;

  render(options: ChoiceOption[], choose: (id: string) => void): void {
    this.onChoose = choose;
    this.node.active = true;
    this.buttons.forEach((button, index) => {
      const option = options[index];
      button.node.active = !!option;
      if (!option) return;
      if (this.labels[index]) this.labels[index].string = option.text;
      button.node.off(Node.EventType.TOUCH_END, this.handleButton, this);
      button.node.on(Node.EventType.TOUCH_END, this.handleButton, this);
      button.node.name = option.id;
    });
  }

  clear(): void {
    this.onChoose = null;
    this.buttons.forEach(button => {
      button.node.off(Node.EventType.TOUCH_END, this.handleButton, this);
      button.node.active = false;
    });
    this.node.active = false;
  }

  private handleButton(event: { currentTarget: Node }): void {
    this.onChoose?.(event.currentTarget.name);
  }
}
