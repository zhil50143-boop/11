import { Node } from 'cc';
import { text, button } from './UIFactory';
import type { TextStoryNode } from '../story/StoryNode';
export class DialoguePanel {
  show(root: Node, node: TextStoryNode, speaker: string, next: () => void): void {
    if (speaker) text(root, speaker, 420, 100, 36);
    text(root, node.text, 120, 600); button(root, '继续', -650, next);
  }
}
