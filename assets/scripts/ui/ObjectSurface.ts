import { Node, UITransform, Graphics, Sprite, SpriteFrame, resources, isValid } from 'cc';
import { container } from './UIFactory';
import { artSurface } from './ArtSurface';
import { ReadingSettings } from './ReadingSettings';

// Objects share the reading paper; artwork and paging never grant facts.
export function objectPaper(root: Node): Node {
  const paper = container(root, 'ObjectPaper');
  paper.getComponent(UITransform)!.setContentSize(1080, 1920);
  const g = paper.addComponent(Graphics); g.fillColor = ReadingSettings.paper;
  g.rect(-540, -960, 1080, 1920); g.fill();
  artSurface(paper, 'paper_v1', 0, 0, 1080, 1920, false, ReadingSettings.paperTint);
  return paper;
}

export function objectImage(root: Node, resource: string, x: number, y: number,
  width: number, height: number, name = 'Photograph', loaded: (success: boolean) => void = () => {}): Node {
  const image = container(root, name, y); image.setPosition(x, y);
  image.getComponent(UITransform)!.setContentSize(width, height);
  const sprite = image.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  resources.load(resource, SpriteFrame, (error, frame) => {
    if (!isValid(image, true)) return;
    if (error || !frame) { loaded(false); return; }
    const scale = Math.min(width / frame.originalSize.width, height / frame.originalSize.height);
    image.getComponent(UITransform)!.setContentSize(frame.originalSize.width * scale, frame.originalSize.height * scale);
    sprite.spriteFrame = frame; loaded(true);
  });
  return image;
}

export const firstChapterProps: Record<string, string> = {
  CH01_EP02_TICKET: 'bus_ticket_v1', CH01_EP02_ROPE: 'wrist_cord_v1', CH01_EP02_MP3_001: 'mp3_v1',
};
