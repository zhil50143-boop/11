import { _decorator, Component, director } from 'cc';

const { ccclass } = _decorator;

/** Boot scene entry: move to the main menu without requiring Tap APIs. */
@ccclass('Boot')
export class Boot extends Component {
  start(): void {
    director.loadScene('Main');
  }
}
