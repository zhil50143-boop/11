import { _decorator, Component, director } from 'cc';
import { LocalPlatform } from '../platform/LocalPlatform';
import { makeCanvas, text, button } from '../ui/UIFactory';
const { ccclass } = _decorator;
@ccclass('Boot')
export class Boot extends Component {
  async start(): Promise<void> {
    const canvas = makeCanvas(this.node); const label = text(canvas, '遗憾', 100);
    await new LocalPlatform().initialize();
    if (!this.isValid) return;
    const open = () => director.loadScene('Main', error => {
      if (error && this.isValid) { label.string = '暂时无法打开。'; button(canvas, '重试', -650, open) }
    });
    open();
  }
}
