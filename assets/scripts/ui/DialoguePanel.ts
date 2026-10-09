import { Node } from 'cc';
import { text } from './UIFactory';
import { objectPaper } from './ObjectSurface';
import { paperButton } from './ArtSurface';
import type { TextStoryNode } from '../story/StoryNode';
import { ReadingSettings } from './ReadingSettings';
export class DialoguePanel {
  show(root: Node, node: TextStoryNode, speaker: string, next: () => void): void {
    objectPaper(root);
    if (speaker) text(root, speaker, 420, 100, 32).color = ReadingSettings.mutedInk;
    text(root, node.text, 120, 600, ReadingSettings.bodySize(46)).color = ReadingSettings.ink;
    paperButton(root, '继续', -650, next);
  }
}
