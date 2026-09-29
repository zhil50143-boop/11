import { _decorator, Component, director, Label, Node, UITransform, Vec3 } from 'cc';
import { SaveManager } from '../save/SaveManager';

const { ccclass, property } = _decorator;

/** Main menu controls. Inspector references are optional; missing controls are built at runtime. */
@ccclass('Main')
export class Main extends Component {
  @property(Node) startButton: Node | null = null;
  @property(Node) continueButton: Node | null = null;
  @property(Node) newGameButton: Node | null = null;

  onLoad(): void {
    const size = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    size.setContentSize(1080, 1920);
    this.startButton ??= this.makeButton('开始故事', new Vec3(0, 100, 0));
    this.continueButton ??= this.makeButton('继续', new Vec3(0, -40, 0));
    this.newGameButton ??= this.makeButton('新的开始', new Vec3(0, -180, 0));
  }

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

  private makeButton(text: string, position: Vec3): Node {
    const button = new Node(text);
    button.layer = this.node.layer;
    button.setPosition(position);
    button.addComponent(UITransform).setContentSize(720, 112);
    const label = button.addComponent(Label);
    label.string = text;
    label.fontSize = 40;
    label.lineHeight = 56;
    label.color.fromHEX('#F4EBDD');
    this.node.addChild(button);
    return button;
  }
}
