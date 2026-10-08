import { Node, Sprite, SpriteFrame, UITransform, Mask, Color, resources, isValid, Button, Graphics, Label } from 'cc';
import { container, button } from './UIFactory';

// Runtime only composes generated assets; story text and touch targets stay separate.
export function artSurface(parent: Node, id: string, x: number, y: number,
  width: number, height: number, cover = false, tint?: string, loaded?: (success: boolean) => void): Node {
  const bounds = container(parent, 'Art-' + id, y);
  bounds.setPosition(x, y); bounds.getComponent(UITransform)!.setContentSize(width, height);
  if (cover) bounds.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
  const image = container(bounds, 'GeneratedImage');
  image.getComponent(UITransform)!.setContentSize(width, height);
  const sprite = image.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  if (tint) sprite.color = new Color().fromHEX(tint);
  resources.load('images/visual-v2/' + id + '/spriteFrame', SpriteFrame, (error, frame) => {
    if (!isValid(bounds, true) || !isValid(image, true)) return;
    if (error || !frame) { loaded?.(false); return; }
    sprite.spriteFrame = frame;
    if (cover) {
      const size = frame.originalSize, scale = Math.max(width / size.width, height / size.height);
      image.getComponent(UITransform)!.setContentSize(size.width * scale, size.height * scale);
    }
    loaded?.(true);
  });
  return bounds;
}

export function paperButton(parent: Node, title: string, y: number, action: () => void): Button {
  const control = button(parent, title, y, action);
  // Native solid surface remains a fallback if this optional texture cannot load.
  const graphics = control.node.getComponent(Graphics)!;
  graphics.clear(); graphics.fillColor = new Color(213, 207, 190);
  graphics.rect(-450, -66, 900, 132); graphics.fill();
  const paper = artSurface(control.node, 'paper_v1', 0, 0, 900, 132, false, '#d4cfbe'); paper.setSiblingIndex(0);
  control.node.children.find(n => n.getComponent(Label))!.getComponent(Label)!.color = new Color(53, 59, 57);
  return control;
}
