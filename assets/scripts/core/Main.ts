import { _decorator, Component, director } from 'cc';
import { SaveManager } from '../save/SaveManager';
import { makeCanvas, text, button } from '../ui/UIFactory';
import { createNextRound } from '../story/EndingResolver';
const { ccclass } = _decorator;
@ccclass('Main')
export class Main extends Component {
  start(): void {
    const canvas = makeCanvas(this.node); const title = text(canvas, '余生未寄', 400, 180, 64);
    const open = () => director.loadScene('Story', error => { if (error && this.isValid) title.string = '暂时无法打开，请重试。' });
    button(canvas, '继续', -250, open);
    let confirm = false;
    const notice = text(canvas, '', 0, 180, 32);
    const fresh = button(canvas, '从头开始', -440, () => {
      if (!confirm) {
        confirm = true; notice.string = '再次点按会从头读。已经读完的结局会保留。'; cancel.node.active = true; return;
      }
      try {
        const next = createNextRound(SaveManager.load(), false);
        if (SaveManager.save(next)) open(); else title.string = SaveManager.warning;
      } catch { title.string = '存档暂时无法读取。请保留原记录后重试。' }
    });
    const cancel = button(canvas, '取消重新开始', -620, () => { confirm = false; notice.string = ''; cancel.node.active = false; fresh.interactable = true });
    cancel.node.active = false;
  }
}
