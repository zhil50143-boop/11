import { Node, Sprite, SpriteFrame, UITransform, Mask, Color, resources, isValid, Button, Graphics, Label, UIOpacity } from 'cc';
import { container, button } from './UIFactory';
import { ReadingSettings } from './ReadingSettings';

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

export function paperButton(parent: Node, title: string, y: number, action: () => void, width = 900, height = 132): Button {
  const control = button(parent, title, y, action);
  control.node.getComponent(UITransform)!.setContentSize(width, height);
  // Native solid surface remains a fallback if this optional texture cannot load.
  const graphics = control.node.getComponent(Graphics)!;
  graphics.clear(); graphics.fillColor = ReadingSettings.current.theme === 'night' ? new Color(57, 65, 60) : new Color(213, 207, 190);
  graphics.rect(-width / 2, -height / 2, width, height); graphics.fill();
  const paper = artSurface(control.node, 'paper_v1', 0, 0, width, height, false, ReadingSettings.current.theme === 'night' ? '#3c443e' : '#d4cfbe'); paper.setSiblingIndex(0);
  const label = control.node.children.find(n => n.getComponent(Label))!.getComponent(Label)!;
  label.node.getComponent(UITransform)!.setContentSize(width - 20, height - 16); label.color = ReadingSettings.ink;
  return control;
}

export function setPaperButtonEnabled(control: Button, enabled: boolean): void {
  control.interactable = enabled;
  const opacity = control.node.getComponent(UIOpacity) ?? control.node.addComponent(UIOpacity);
  opacity.opacity = enabled ? 255 : 140;
}
