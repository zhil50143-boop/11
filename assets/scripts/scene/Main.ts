import { _decorator, Component, director, Node } from 'cc';
import { SaveManager } from '../save/SaveManager';

const { ccclass, property } = _decorator;

/** Main menu controls. Wire Start/Continue buttons in the Main scene. */
@ccclass('Main')
export class Main extends Component {
  @property(Node) startButton: Node | null = null;
  @property(Node) continueButton: Node | null = null;
  @property(Node) newGameButton: Node | null = null;

  onEnable(): void {
    this.startButton?.on(Node.EventType.TOUCH_END, this.openStory, this);
    this.continueButton?.on(Node.EventType.TOUCH_END, this.openStory, this);
    this.newGameButton?.on(Node.EventType.TOUCH_END, this.startNewGame, this);
  }

  onDisable(): void {
    this.startButton?.off(Node.EventType.TOUCH_END, this.openStory, this);
    this.continueButton?.off(Node.EventType.TOUCH_END, this.openStory, this);
    this.newGameButton?.off(Node.EventType.TOUCH_END, this.startNewGame, this);
  }

  private openStory(): void {
    director.loadScene('Story');
  }

  private startNewGame(): void {
    SaveManager.clear();
    director.loadScene('Story');
  }
}
