import { Node } from 'cc';
import { text, button } from './UIFactory';
import type { ChoiceStoryNode } from '../story/StoryNode';
import { ReadingSettings } from './ReadingSettings';
export class ChoicePanel {
  show(root: Node, node: ChoiceStoryNode, choose: (id: string) => void): void {
    text(root, '决定', 580, 100, 32);
    text(root, node.prompt, 380, 230, ReadingSettings.bodySize(46));
    node.options.forEach((o, i) => button(root, o.text, 140 - i * 155, () => choose(o.id)));
  }
}
