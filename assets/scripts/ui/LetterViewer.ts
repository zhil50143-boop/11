import { Node } from 'cc';
import { button } from './UIFactory';
import type { InteractionStoryNode } from '../story/StoryNode';
import { DocumentPanel } from './DocumentPanel';
export class LetterViewer {
  show(root: Node, node: InteractionStoryNode, done: () => void, offset = 0, changed: (offset: number) => void = () => {},
    initiallyOpen = false, opened: () => void = () => {}): void {
    const finish = button(root, '放回去', -650, done); finish.interactable = false;
    const showDocument = () => {
      open.node.active = false; opened();
      new DocumentPanel().show(root, node.text, offset, changed, () => { finish.interactable = true });
      if (!node.requireReadToEnd) finish.interactable = true;
    };
    const open = button(root, node.actionText ?? '查看', -470, showDocument);
    if (initiallyOpen) showDocument();
  }
}
