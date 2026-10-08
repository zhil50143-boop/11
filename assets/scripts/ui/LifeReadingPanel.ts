import { Node, UITransform, Label, ScrollView, Mask, Vec2, Color, Graphics } from 'cc';
import { container, text } from './UIFactory';
import { artSurface, paperButton } from './ArtSurface';
import type { PassageStoryNode } from '../story/StoryNode';
import type { StoryTime } from '../core/GameState';

// First visual slice only: assets never determine facts, evidence, choices or time.
export class LifeReadingPanel {
  static background(time: StoryTime): string | undefined {
    if (time.year === 2037 && time.timeline === 'present' && time.location === '家中') return 'home_2037_v1';
    if (time.year === 2007 && time.location.includes('公交')) return 'bus_2007_v1';
    return undefined;
  }
  show(root: Node, node: PassageStoryNode, speakers: Record<string, string>, time: StoryTime,
    memoryCaption: string | undefined, warning: boolean, offset: number,
    changed: (offset: number) => void, next: () => void): void {
    const backdrop = container(root, 'ReadingPaper');
    backdrop.getComponent(UITransform)!.setContentSize(1080, 1920);
    const surface = backdrop.addComponent(Graphics); surface.fillColor = new Color(240, 235, 223);
    surface.rect(-540, -960, 1080, 1920); surface.fill();
    artSurface(backdrop, 'paper_v1', 0, 0, 1080, 1920, false, time.timeline === 'present' ? '#eceee9' : '#fff9ef');
    artSurface(root, LifeReadingPanel.background(time)!, 0, 642, 1080, 636, true);
    const ink = new Color(53, 59, 57), muted = new Color(104, 115, 111);
    const heading = (value: string, y: number, height: number, size: number) => {
      const label = text(root, value, y, height, size); label.color = muted;
      label.overflow = Label.Overflow.CLAMP; label.lineHeight = size + 16;
      return label;
    };
    heading(time.label + ' · ' + time.location, 260, 62, 30);
    if (memoryCaption) heading(memoryCaption, 201, 52, 26);
    const title = heading(node.title, memoryCaption ? 105 : 145, 100, 56); title.color = ink;
    const height = warning ? 550 : 790, center = warning ? -320 : -372;
    const area = container(root, 'Reading', center); area.getComponent(UITransform)!.setContentSize(940, height);
    const viewport = container(area, 'Viewport'); viewport.getComponent(UITransform)!.setContentSize(940, height);
    viewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    const content = container(viewport, 'Content'), transform = content.getComponent(UITransform)!;
    transform.setAnchorPoint(.5, 1); content.setPosition(0, height / 2);
    let top = 8;
    const paragraph = (value: string, size: number, color: Color) => {
      const part = container(content, 'Paragraph'), box = part.getComponent(UITransform)!;
      box.setAnchorPoint(.5, 1); box.setContentSize(870, 100); part.setPosition(0, -top);
      const label = part.addComponent(Label); label.string = value; label.fontSize = size;
      label.lineHeight = Math.round(size * 1.75); label.enableWrapText = true;
      label.overflow = Label.Overflow.RESIZE_HEIGHT; label.horizontalAlign = Label.HorizontalAlign.LEFT;
      label.verticalAlign = Label.VerticalAlign.TOP; label.color = color; label.updateRenderData(true);
      top += box.height + (size === 32 ? 16 : 36);
    };
    for (const part of node.paragraphs) {
      if (part.speaker) paragraph(speakers[part.speaker] ?? part.speaker, 32, muted);
      paragraph(part.text, 46, ink);
    }
    transform.setContentSize(940, Math.max(height, top));
    const scroll = area.addComponent(ScrollView); scroll.content = content; scroll.horizontal = false; scroll.vertical = true;
    scroll.node.on(ScrollView.EventType.SCROLLING, () => {
      const max = scroll.getMaxScrollOffset().y; changed(max > 0 ? Math.max(0, Math.min(1, scroll.getScrollOffset().y / max)) : 0);
    });
    scroll.scrollToOffset(new Vec2(0, scroll.getMaxScrollOffset().y * offset), 0);
    paperButton(root, '继续', warning ? -650 : -820, next);
  }
}
