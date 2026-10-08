import { Node, UITransform, Label, ScrollView, Mask, Vec2, Color, Graphics } from 'cc';
import { container } from './UIFactory';

// A readable physical document; the same text remains available if audio fails.
export class DocumentPanel {
  show(root: Node, value: string, offset: number, changed: (offset: number) => void,
    reachedEnd: () => void): ScrollView {
    const area = container(root, 'Document');
    area.getComponent(UITransform)!.setContentSize(900, 1110);
    const paper = area.addComponent(Graphics);
    paper.fillColor = new Color(239, 237, 230); paper.rect(-450, -555, 900, 1110); paper.fill();
    const viewport = container(area, 'Viewport');
    viewport.getComponent(UITransform)!.setContentSize(900, 1110);
    viewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    const content = container(viewport, 'Content');
    const transform = content.getComponent(UITransform)!; transform.setAnchorPoint(0.5, 1);
    const body = container(content, 'DocumentText');
    const box = body.getComponent(UITransform)!; box.setAnchorPoint(0.5, 1); box.setContentSize(804, 100); body.setPosition(0, -44);
    const label = body.addComponent(Label); label.string = value; label.fontSize = 46; label.lineHeight = 74;
    label.enableWrapText = true; label.overflow = Label.Overflow.RESIZE_HEIGHT;
    label.horizontalAlign = Label.HorizontalAlign.LEFT; label.verticalAlign = Label.VerticalAlign.TOP;
    label.color = new Color(44, 45, 43); label.updateRenderData(true);
    transform.setContentSize(900, Math.max(1110, box.height + 88)); content.setPosition(0, 555);
    const scroll = area.addComponent(ScrollView); scroll.content = content;
    scroll.horizontal = false; scroll.vertical = true; scroll.inertia = true;
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
