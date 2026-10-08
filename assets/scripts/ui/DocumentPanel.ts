import { Node, UITransform, Label, ScrollView, Mask, Vec2, Color, Graphics } from 'cc';
import { container } from './UIFactory';
import { artSurface } from './ArtSurface';
import { ReadingSettings } from './ReadingSettings';

// A readable physical document; the same text remains available if audio fails.
export class DocumentPanel {
  show(root: Node, value: string, offset: number, changed: (offset: number) => void,
    reachedEnd: () => void): ScrollView {
    const area = container(root, 'Document');
    area.getComponent(UITransform)!.setContentSize(900, 1110);
    const paper = area.addComponent(Graphics);
    paper.fillColor = ReadingSettings.paper; paper.rect(-450, -555, 900, 1110); paper.fill();
    artSurface(area, 'paper_v1', 0, 0, 900, 1110, false, ReadingSettings.paperTint);
    const viewport = container(area, 'Viewport');
    viewport.getComponent(UITransform)!.setContentSize(900, 1110);
    viewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    const content = container(viewport, 'Content');
    const transform = content.getComponent(UITransform)!; transform.setAnchorPoint(0.5, 1);
    const size = ReadingSettings.bodySize(46), lineHeight = Math.round(size * 1.61);
    let top = 44;
    // One giant Label can exceed the WebGL canvas texture height and stretch
    // glyphs. Keep the source's own line/paragraph boundaries in separate labels.
    for (const paragraph of value.split('\n')) {
      if (!paragraph) { top += lineHeight; continue; }
      const body = container(content, 'DocumentText');
      const box = body.getComponent(UITransform)!; box.setAnchorPoint(0.5, 1); box.setContentSize(804, 100); body.setPosition(0, -top);
      const label = body.addComponent(Label); label.string = paragraph; label.fontSize = size; label.lineHeight = lineHeight;
      label.enableWrapText = true; label.overflow = Label.Overflow.RESIZE_HEIGHT;
      label.horizontalAlign = Label.HorizontalAlign.LEFT; label.verticalAlign = Label.VerticalAlign.TOP;
      label.color = ReadingSettings.ink; label.updateRenderData(true);
      top += box.height;
    }
    transform.setContentSize(900, Math.max(1110, top + 44)); content.setPosition(0, 555);
    const scroll = area.addComponent(ScrollView); scroll.content = content;
    scroll.horizontal = false; scroll.vertical = true; scroll.inertia = !ReadingSettings.current.reducedMotion;
    const update = () => {
      const max = scroll.getMaxScrollOffset().y;
      const fraction = max > 0 ? Math.max(0, Math.min(1, scroll.getScrollOffset().y / max)) : 1;
      changed(fraction); if (fraction >= 0.99) reachedEnd();
    };
    scroll.node.on(ScrollView.EventType.SCROLLING, update);
    scroll.scrollToOffset(new Vec2(0, scroll.getMaxScrollOffset().y * offset), 0); update();
    return scroll;
  }
}
