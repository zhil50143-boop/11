import { Node, Label } from 'cc';
import { text } from './UIFactory';
import type { ChoiceStoryNode } from '../story/StoryNode';
import { ReadingSettings } from './ReadingSettings';
import type { StoryTime } from '../core/GameState';
import { LifeReadingPanel } from './LifeReadingPanel';
import { artSurface, paperButton } from './ArtSurface';
import { objectPaper } from './ObjectSurface';
export class ChoicePanel {
  show(root: Node, node: ChoiceStoryNode, choose: (id: string) => void, time?: StoryTime, memoryCaption?: string): void {
    const background = time && LifeReadingPanel.background(time, node.id);
    objectPaper(root);
    if (background) {
      artSurface(root, background, 0, 642, 1080, 636, true);
      text(root, time!.label + ' · ' + time!.location, 270, 60, 30).color = ReadingSettings.mutedInk;
      if (memoryCaption) text(root, memoryCaption, 210, 40, 26).color = ReadingSettings.mutedInk;
      const heading = text(root, '决定', memoryCaption ? 150 : 190, 50, 32); heading.color = ReadingSettings.mutedInk;
      const prompt = text(root, node.prompt, memoryCaption ? -20 : 20, 150, ReadingSettings.bodySize(46)); prompt.color = ReadingSettings.ink;
      node.options.forEach((option, i) => {
        const control = paperButton(root, option.text, -200 - i * 208, () => choose(option.id), 900, 176);
        const label = control.node.children.find(c => c.getComponent(Label))!.getComponent(Label)!;
        label.fontSize = ReadingSettings.bodySize(42); label.lineHeight = Math.round(label.fontSize * 1.3);
      });
      return;
    }
    text(root, '决定', 650, 70, 32).color = ReadingSettings.mutedInk;
    text(root, node.prompt, 410, 320, ReadingSettings.bodySize(46)).color = ReadingSettings.ink;
    node.options.forEach((o, i) => {
      const control = paperButton(root, o.text, 140 - i * 208, () => choose(o.id), 900, 176);
      const label = control.node.children.find(c => c.getComponent(Label))!.getComponent(Label)!;
      label.fontSize = ReadingSettings.bodySize(42); label.lineHeight = Math.round(label.fontSize * 1.3);
    });
  }
}
