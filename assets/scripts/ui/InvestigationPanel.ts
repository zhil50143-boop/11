import { Node, Label, UITransform, Graphics } from 'cc';
import { container, text, clear } from './UIFactory';
import { artSurface, paperButton, setPaperButtonEnabled } from './ArtSurface';
import { objectImage, firstChapterProps } from './ObjectSurface';
import type { InteractionStoryNode } from '../story/StoryNode';

export class InvestigationPanel {
  show(root: Node, node: InteractionStoryNode, flags: Record<string, boolean>,
    inspect: (id: string) => void, done: () => void, initialPage = 0, paged: (page: number) => void = () => {}): void {
    artSurface(root, 'desk_2037_v1', 0, 0, 1080, 1920, true);
    artSurface(root, 'archive_folder_v1', 0, 180, 1040, 693);
    text(root, node.text, 635, 100, 42);
    const ready = node.requiredFlags?.every(f => flags[f]) ?? true;
    if (!ready) text(root, node.requiredHint ?? '先看看照片和信封。', 530, 80, 30);
    const items = node.items ?? [], pages = Math.max(1, Math.ceil(items.length / 4));
    let page = Math.max(0, Math.min(pages - 1, initialPage));
    const objects = container(root, 'InvestigationObjects');
    const navigation = container(root, 'ObjectPages');
    const renderPage = () => {
      clear(objects); clear(navigation); paged(page);
      items.slice(page * 4, page * 4 + 4).forEach((item, i) => {
        const title = item.text + (flags[item.viewedFlag] ? '（看过）' : '');
        const x = i % 2 ? 235 : -235, y = i < 2 ? 290 : -100;
        const control = paperButton(objects, title, y, () => inspect(item.id), 440);
        control.node.setPosition(x, y); control.node.getComponent(UITransform)!.setContentSize(440, 340);
        // The touch target contains both the object and its paper label.
        const surface = control.node.getComponent(Graphics)!; surface.clear();
        surface.rect(-220, -165, 440, 106); surface.fill();
        const label = control.node.children.find(c => c.getComponent(Label))!;
        label.setPosition(0, -112); label.getComponent(UITransform)!.setContentSize(420, 106);
        const l = label.getComponent(Label)!; l.fontSize = 38; l.lineHeight = 50;
        const strip = control.node.children.find(c => c.name === 'Art-paper_v1')!;
        strip.setPosition(0, -112); strip.getComponent(UITransform)!.setContentSize(440, 106);
        strip.children[0].getComponent(UITransform)!.setContentSize(440, 106);
        const prop = firstChapterProps[item.next] ?? (item.id === 'letter' ? 'envelope_v1' : undefined);
        if (item.id === 'photo') objectImage(control.node, 'images/graduation_old/spriteFrame', 0, 48, 330, 215, 'Object-photo');
        else if (prop) objectImage(control.node, 'images/visual-v2/' + prop + '/spriteFrame', 0, 48,
          prop === 'mp3_v1' ? 165 : 360, 220, 'Object-' + item.id);
        if (item.id === 'ticket') {
          const route = text(control.node, '17路', 48, 60, 26);
          route.color.fromHEX('#69736b'); route.horizontalAlign = Label.HorizontalAlign.CENTER;
        }
      });
      if (page > 0) { const previous = paperButton(navigation, '前面几件', -490, () => { page--; renderPage(); }, 440); previous.node.setPosition(-235, -490); }
      if (page + 1 < pages) { const next = paperButton(navigation, '其余旧物', -490, () => { page++; renderPage(); }, 440); next.node.setPosition(235, -490); }
    };
    renderPage();
    const finish = paperButton(root, node.doneText ?? '收好纸箱', -650, done); setPaperButtonEnabled(finish, ready);
  }
}
