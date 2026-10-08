import { _decorator, Component, director, Color, Label, Graphics, UITransform } from 'cc';
import { SaveManager } from '../save/SaveManager';
import { makeCanvas, text, button } from '../ui/UIFactory';
import { createNextRound } from '../story/EndingResolver';
import { VisualDraft } from '../ui/VisualDraft';
import { artSurface, paperButton } from '../ui/ArtSurface';
const { ccclass } = _decorator;
@ccclass('Main')
export class Main extends Component {
  start(): void {
    const canvas = makeCanvas(this.node);
    const draft = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('visualDraft');
    if (draft && ['desk','home','bus','decision'].includes(draft)) { new VisualDraft(canvas).show(draft); return; }
    artSurface(canvas, 'desk_2037_v1', 0, 0, 1080, 1920, true);
    const title = text(canvas, '余生未寄', 755, 150, 64);
    title.node.setPosition(180, 755); title.node.getComponent(UITransform)!.setContentSize(560, 150);
    title.color = new Color(243, 237, 222); title.horizontalAlign = Label.HorizontalAlign.CENTER;
    const open = () => director.loadScene('Story', error => { if (error && this.isValid) title.string = '暂时无法打开，请重试。' });
    const resume = button(canvas, '继续', 190, open);
    resume.node.setPosition(55, 190); resume.node.getComponent(UITransform)!.setContentSize(735, 368);
    const fallback = resume.node.getComponent(Graphics)!; fallback.enabled = false;
    fallback.clear(); fallback.fillColor = new Color(240, 235, 223);
    fallback.rect(-367.5, -184, 735, 368); fallback.fill();
    artSurface(resume.node, 'envelope_v1', 0, 0, 735, 368, false, undefined,
      success => { fallback.enabled = !success }).setSiblingIndex(0);
    const resumeLabel = resume.node.children.find(n => n.getComponent(Label))!.getComponent(Label)!;
    resumeLabel.node.setPosition(0, -73); resumeLabel.color = new Color(53, 59, 57);
    // Keep an obvious text affordance even if an optional generated prop fails to load.
    let confirm = false;
    const notice = text(canvas, '', -230, 180, 32); notice.color = new Color(53, 59, 57);
    const fresh = paperButton(canvas, '从头开始', -480, () => {
      if (!confirm) {
        confirm = true; notice.string = '再次点按会从头读。已经读完的结局会保留。'; cancel.node.active = true; return;
      }
      try {
        const next = createNextRound(SaveManager.load(), false);
        if (SaveManager.save(next)) open(); else title.string = SaveManager.warning;
      } catch { title.string = '存档暂时无法读取。请保留原记录后重试。' }
    });
    const cancel = paperButton(canvas, '取消重新开始', -650, () => { confirm = false; notice.string = ''; cancel.node.active = false; fresh.interactable = true });
    cancel.node.active = false;
  }
}
