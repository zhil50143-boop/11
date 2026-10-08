import { Node } from 'cc';
import { text, button } from './UIFactory';
import type { TextStoryNode } from '../story/StoryNode';
import { ReadingSettings } from './ReadingSettings';
export class DialoguePanel {
  show(root: Node, node: TextStoryNode, speaker: string, next: () => void): void {
    if (speaker) text(root, speaker, 420, 100, 36);
    text(root, node.text, 120, 600, ReadingSettings.bodySize(46)); button(root, '继续', -650, next);
  }
}
