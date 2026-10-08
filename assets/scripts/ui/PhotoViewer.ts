import { Node, Sprite, SpriteFrame, UITransform, resources, Color, Graphics } from 'cc';
import { text, button, container } from './UIFactory';
import type { InteractionStoryNode } from '../story/StoryNode';
export class PhotoViewer {
  show(root: Node, node: InteractionStoryNode, done: () => void): void {
    const caption = text(root, node.text, 150, 750);
    let back = false;
    let loaded = false;
    const image = node.resource ? container(root, 'Photograph', 180) : undefined;
    if (image) {
      image.getComponent(UITransform)!.setContentSize(900, 600);
      const sprite = image.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      resources.load(node.resource!, SpriteFrame, (error, frame) => {
        if (!root.isValid || !image.isValid) return;
        if (error || !frame) { if (!back) caption.string = '照片暂时没能打开。\n\n' + node.text; return }
        sprite.spriteFrame = frame; loaded = true;
        const ratio = frame.originalSize.width / frame.originalSize.height;
        image.getComponent(UITransform)!.setContentSize(Math.min(900, 600 * ratio), Math.min(600, 900 / ratio));
        if (!back) { caption.node.setPosition(0, -240); caption.node.getComponent(UITransform)!.setContentSize(900, 220); caption.fontSize = 30; caption.lineHeight = 48 }
        image.active = !back;
      });
    }
    const paper = container(root, 'PhotoBack', 180); paper.active = false;
    paper.getComponent(UITransform)!.setContentSize(900, 600);
    const surface = paper.addComponent(Graphics); surface.fillColor = new Color(239,237,230); surface.rect(-450,-300,900,600); surface.fill();
    // Keep the ink separate from the generated image, preserving exact story text.
    const backCaption = text(paper, node.backText ?? '', 0, 500, 38); backCaption.color = new Color(44,45,43);
    const finish = button(root, '放回去', -650, done);
    if (node.backText) {
      finish.interactable = false;
      button(root, '翻面', -460, () => {
        back = !back; paper.active = back; caption.node.active = !back;
        if (image) image.active = !back && loaded;
        finish.interactable = true;
      });
    }
  }
}
