import { Node, UITransform, Label, ScrollView, Mask, Vec2, Color } from 'cc';
import { container, text } from './UIFactory';
import { objectPaper } from './ObjectSurface';
import { paperButton } from './ArtSurface';
import type { PassageStoryNode } from '../story/StoryNode';
import { ReadingSettings } from './ReadingSettings';

export class PassagePanel {
  show(root: Node, node: PassageStoryNode, speakers: Record<string,string>, offset: number,
    changed: (offset: number) => void, next: () => void): ScrollView {
    objectPaper(root);
    text(root, node.title, 640, 100, 40).color = ReadingSettings.ink;
    const area = container(root, 'Reading', 0);
    area.getComponent(UITransform)!.setContentSize(940, 1110);
    const viewport = container(area, 'Viewport');
    viewport.getComponent(UITransform)!.setContentSize(940, 1110);
    viewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    const content = container(viewport, 'Content');
    const transform = content.getComponent(UITransform)!;
    transform.setAnchorPoint(0.5, 1);
    let top = 24;
    const line = (value: string, size: number, color: Color) => {
      const part = container(content, 'Paragraph');
      const box = part.getComponent(UITransform)!;
      box.setAnchorPoint(0.5, 1); box.setContentSize(872, 100); part.setPosition(0, -top);
      const label = part.addComponent(Label); label.string = value; label.fontSize = size; label.lineHeight = Math.round(size * 1.75);
      label.enableWrapText = true; label.overflow = Label.Overflow.RESIZE_HEIGHT;
      label.horizontalAlign = Label.HorizontalAlign.LEFT; label.verticalAlign = Label.VerticalAlign.TOP;
      label.color = color; label.updateRenderData(true);
      top += box.height + 30;
    };
    for (const paragraph of node.paragraphs) {
      if (paragraph.speaker) line(speakers[paragraph.speaker] ?? paragraph.speaker, 32, ReadingSettings.mutedInk);
      line(paragraph.text, ReadingSettings.bodySize(46), ReadingSettings.ink);
    }
    transform.setContentSize(940, Math.max(1110, top)); content.setPosition(0, 555);
    const scroll = area.addComponent(ScrollView); scroll.content = content;
    scroll.horizontal = false; scroll.vertical = true; scroll.inertia = !ReadingSettings.current.reducedMotion;
    scroll.node.on(ScrollView.EventType.SCROLLING, () => {
      const max = scroll.getMaxScrollOffset().y;
      changed(max > 0 ? Math.max(0, Math.min(1, scroll.getScrollOffset().y / max)) : 0);
    });
    scroll.scrollToOffset(new Vec2(0, scroll.getMaxScrollOffset().y * offset), 0);
    paperButton(root, '继续', -650, next);
    return scroll;
  }
}
