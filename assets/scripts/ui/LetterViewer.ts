import { Node } from 'cc';
import type { InteractionStoryNode } from '../story/StoryNode';
import { DocumentPanel } from './DocumentPanel';
import { artSurface, paperButton, setPaperButtonEnabled } from './ArtSurface';
import { objectPaper } from './ObjectSurface';
export class LetterViewer {
  show(root: Node, node: InteractionStoryNode, done: () => void, offset = 0, changed: (offset: number) => void = () => {},
    initiallyOpen = false, opened: () => void = () => {}): void {
    objectPaper(root);
    const envelope = artSurface(root, node.actionText?.includes('信') ? 'envelope_v1' : 'paper_v1', 0, 150, 900, 450);
    const finish = paperButton(root, '放回去', -650, done); setPaperButtonEnabled(finish, false);
    const showDocument = () => {
      open.node.active = false; envelope.active = false; opened();
      new DocumentPanel().show(root, node.text, offset, changed, () => { setPaperButtonEnabled(finish, true) });
      if (!node.requireReadToEnd) setPaperButtonEnabled(finish, true);
    };
    const open = paperButton(root, node.actionText ?? '查看', -470, showDocument);
    if (initiallyOpen) showDocument();
  }
}
