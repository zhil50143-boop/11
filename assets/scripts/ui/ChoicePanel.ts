import { Node, Label } from 'cc';
import { text, button } from './UIFactory';
import type { ChoiceStoryNode } from '../story/StoryNode';
import { ReadingSettings } from './ReadingSettings';
import type { StoryTime } from '../core/GameState';
import { LifeReadingPanel } from './LifeReadingPanel';
import { artSurface, paperButton } from './ArtSurface';
import { objectPaper } from './ObjectSurface';
export class ChoicePanel {
  show(root: Node, node: ChoiceStoryNode, choose: (id: string) => void, time?: StoryTime): void {
    const background = time && LifeReadingPanel.background(time);
    if (background) {
      objectPaper(root); artSurface(root, background, 0, 642, 1080, 636, true);
      const heading = text(root, '决定', 260, 70, 32); heading.color = ReadingSettings.mutedInk;
      const prompt = text(root, node.prompt, 65, 260, ReadingSettings.bodySize(46)); prompt.color = ReadingSettings.ink;
      node.options.forEach((option, i) => {
        const control = paperButton(root, option.text, -180 - i * 185, () => choose(option.id));
        control.node.children.find(c => c.getComponent(Label))!.getComponent(Label)!.fontSize = ReadingSettings.bodySize(42);
      });
      return;
    }
    text(root, '决定', 580, 100, 32);
    text(root, node.prompt, 380, 230, ReadingSettings.bodySize(46));
    node.options.forEach((o, i) => button(root, o.text, 140 - i * 155, () => choose(o.id)));
  }
}
