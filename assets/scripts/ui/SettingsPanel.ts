import { BlockInputEvents, Graphics, Label, Node, UITransform } from 'cc';
import { container, text } from './UIFactory';
import { artSurface, paperButton } from './ArtSurface';
import { ReadingSettings } from './ReadingSettings';
import type { ReadingPreferences } from '../save/ReadingPreferences';

export class SettingsPanel {
  private overlay: Node;
  private content: Node;
  private layoutChanged = false;
  constructor(parent: Node, private closed: (layoutChanged: boolean) => void, private volumeChanged: () => void = () => {}) {
    this.overlay = container(parent, 'ReadingSettings');
    this.overlay.getComponent(UITransform)!.setContentSize(1080, 1920);
    this.overlay.addComponent(BlockInputEvents);
    this.content = container(this.overlay, 'SettingsContent');
    this.render();
  }
  private update(next: ReadingPreferences, layout = true): void {
    ReadingSettings.store.update(next);
    this.layoutChanged ||= layout;
    this.volumeChanged();
    this.render();
  }
  private render(): void {
    for (const child of this.content.children.slice()) { child.active = false; child.destroy(); }
    const root = container(this.content, 'SettingsPage');
    root.getComponent(UITransform)!.setContentSize(1080, 1920);
    const g = root.addComponent(Graphics); g.fillColor = ReadingSettings.paper;
    g.rect(-540, -960, 1080, 1920); g.fill();
    artSurface(root, 'paper_v1', 0, 0, 1080, 1920, false, ReadingSettings.paperTint);
    const title = text(root, '阅读设置', 750, 120, 56); title.color = ReadingSettings.ink;
    const hint = text(root, '点按下面的项目可切换。', 610, 100, 32); hint.color = ReadingSettings.mutedInk;
    const p = ReadingSettings.current;
    const fontNames = { standard: '标准', large: '较大', extra: '大字' };
    paperButton(root, '字号：' + fontNames[p.font], 420, () => this.update({ ...p, font: p.font === 'standard' ? 'large' : p.font === 'large' ? 'extra' : 'standard' }));
    paperButton(root, '纸面：' + (p.theme === 'paper' ? '日间' : '夜间'), 240, () => this.update({ ...p, theme: p.theme === 'paper' ? 'night' : 'paper' }));
    paperButton(root, '录音音量：' + (p.volume === 0 ? '静音' : p.volume === 0.5 ? '较轻' : '正常'), 60,
      () => this.update({ ...p, volume: p.volume === 1 ? 0.5 : p.volume === 0.5 ? 0 : 1 }, false));
    paperButton(root, '减少动态：' + (p.reducedMotion ? '开' : '关'), -120, () => this.update({ ...p, reducedMotion: !p.reducedMotion }));
    const sample = text(root, '雨停了。他把窗户开了一点，回去收桌上的碗。', -380, 300, ReadingSettings.bodySize(46));
    sample.color = ReadingSettings.ink; sample.overflow = Label.Overflow.CLAMP;
    sample.lineHeight = Math.round(sample.fontSize * 1.75);
    if (ReadingSettings.store.warning) {
      const warning = text(root, '阅读设置暂时不能保存，本页仍可使用。', -620, 140, 30);
      warning.color = ReadingSettings.mutedInk;
    }
    paperButton(root, '返回', -820, () => { this.destroy(); this.closed(this.layoutChanged); });
  }
  destroy(): void { this.overlay.destroy(); }
}
