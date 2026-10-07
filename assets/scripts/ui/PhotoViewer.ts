import { Node } from 'cc';
import { text, button } from './UIFactory';
import type { InteractionStoryNode } from '../story/StoryNode';
export class PhotoViewer {
  show(root: Node, node: InteractionStoryNode, done: () => void): void {
    // Text description is an honest placeholder, not a borrowed photograph.
    const caption = text(root, node.text, 150, 750);
    let back = false;
    const finish = button(root, '放回去', -650, done);
    if (node.backText) {
      finish.interactable = false;
      button(root, '翻面', -460, () => {
        back = !back; caption.string = back ? node.backText! : node.text;
        finish.interactable = true;
      });
    }
  }
}
