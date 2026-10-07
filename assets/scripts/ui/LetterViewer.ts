import { Node } from 'cc';
import { text, button } from './UIFactory';
import type { InteractionStoryNode } from '../story/StoryNode';
export class LetterViewer {
  show(root: Node, node: InteractionStoryNode, done: () => void): void {
    const caption = text(root, '', 100, 850);
    const finish = button(root, '放回去', -650, done); finish.interactable = false;
    const open = button(root, node.actionText ?? '查看', -470, () => {
      caption.string = node.text; open.node.active = false; finish.interactable = true;
    });
  }
}
