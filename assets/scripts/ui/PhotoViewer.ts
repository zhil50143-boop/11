import { Node, UITransform, Graphics, isValid, Label } from 'cc';
import { text, container } from './UIFactory';
import type { InteractionStoryNode } from '../story/StoryNode';
import { ReadingSettings } from './ReadingSettings';
import { artSurface, paperButton, setPaperButtonEnabled } from './ArtSurface';
import { objectPaper, objectImage, firstChapterProps } from './ObjectSurface';
import { DocumentPanel } from './DocumentPanel';

export class PhotoViewer {
  show(root: Node, node: InteractionStoryNode, done: () => void, initiallyBack = false, flipped: (back: boolean) => void = () => {},
    reading: { offset: number; changed: (offset: number) => void; readOnly?: boolean } = { offset: 0, changed: () => {} }): void {
    objectPaper(root);
    let back = initiallyBack;
    const front = container(root, 'PhotoFront'); front.active = !back;
    const prop = firstChapterProps[node.id];
    if (node.resource || prop) {
      if (node.resource) {
        const matte = container(front, 'PhotoMatte', 290); matte.getComponent(UITransform)!.setContentSize(920, 640);
        const g = matte.addComponent(Graphics); g.fillColor = ReadingSettings.paper; g.rect(-460, -320, 920, 640); g.fill();
        artSurface(matte, 'paper_v1', 0, 0, 920, 640, false, ReadingSettings.current.theme === 'night' ? '#465047' : '#e5decb');
      }
      const failure = text(front, '', 290, 420, ReadingSettings.bodySize(46)); failure.color = ReadingSettings.ink;
      objectImage(front, node.resource ?? 'images/visual-v2/' + prop + '/spriteFrame', 0, 290,
        prop === 'mp3_v1' ? 440 : 870, 580, node.resource ? 'Photograph' : 'OldObject', success => {
          if (!success && isValid(failure, true)) failure.string = node.resource ? '照片暂时没能打开。下面仍可读文字。' : '旧物图片暂时没能打开。下面仍可读文字。';
        });
      if (prop === 'bus_ticket_v1') { const route = text(front, '17路', 290, 90, 38); route.color = ReadingSettings.mutedInk; route.horizontalAlign = Label.HorizontalAlign.CENTER; }
      new DocumentPanel().show(front, node.text, reading.offset, reading.changed, () => {}, { height: 360, y: -230 });
    } else {
      // Do not fabricate an image for a source that only has text.
      new DocumentPanel().show(front, node.text, reading.offset, reading.changed, () => {});
    }
    const paper = container(root, 'PhotoBack', 290); paper.active = back;
    paper.getComponent(UITransform)!.setContentSize(920, 640);
    const surface = paper.addComponent(Graphics); surface.fillColor = ReadingSettings.paper; surface.rect(-460, -320, 920, 640); surface.fill();
    artSurface(paper, 'paper_v1', 0, 0, 920, 640, false, ReadingSettings.current.theme === 'night' ? '#465047' : '#e5decb');
    const backCaption = text(paper, node.backText ?? '', 0, 530, ReadingSettings.bodySize(46)); backCaption.color = ReadingSettings.ink;
    const finish = paperButton(root, reading.readOnly ? '返回相册' : '放回去', -650, done);
    if (node.backText) {
      setPaperButtonEnabled(finish, back || !!reading.readOnly);
      paperButton(root, '翻面', -490, () => {
        back = !back; flipped(back); paper.active = back; front.active = !back; setPaperButtonEnabled(finish, true);
      });
    }
  }
}
