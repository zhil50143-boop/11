import { _decorator, Component, Label, Node, UITransform, Vec3 } from 'cc';
import { StoryManager } from '../story/StoryManager';
import { StoryFlow } from '../ui/StoryFlow';
import { DialoguePanel } from '../ui/DialoguePanel';
import { ChoicePanel } from '../ui/ChoicePanel';
import { MemoryInteractionPanel } from '../ui/MemoryInteractionPanel';
import { Button } from 'cc';

const { ccclass, property } = _decorator;

/** Builds a playable portrait UI when no editor-authored panel references are present. */
@ccclass('Story')
export class Story extends Component {
  @property(StoryManager) manager: StoryManager | null = null;
  @property(StoryFlow) flow: StoryFlow | null = null;

  onLoad(): void {
    const rootTransform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    rootTransform.setContentSize(1080, 1920);

    this.manager ??= this.node.getComponent(StoryManager) ?? this.node.addComponent(StoryManager);
    this.flow ??= this.node.getComponent(StoryFlow) ?? this.node.addComponent(StoryFlow);
    this.flow.manager = this.manager;

    const dialogueNode = this.child('Dialogue', new Vec3(0, -420, 0), 940, 560);
    const dialogue = dialogueNode.getComponent(DialoguePanel) ?? dialogueNode.addComponent(DialoguePanel);
    dialogue.speakerLabel = this.label(dialogueNode, 'Speaker', '', new Vec3(0, 190, 0), 840, 64, 36);
    dialogue.bodyLabel = this.label(dialogueNode, 'Body', '故事正在载入……', new Vec3(0, -20, 0), 840, 320, 34);
    dialogue.continueHint = this.label(dialogueNode, 'TapHint', '轻触屏幕继续', new Vec3(0, -220, 0), 840, 64, 26).node;
    this.flow.dialogue = dialogue;

    const choiceNode = this.child('Choices', new Vec3(0, -390, 0), 940, 520);
    choiceNode.active = false;
    const choices = choiceNode.addComponent(ChoicePanel);
    choices.buttons = [];
    choices.labels = [];
    for (let i = 0; i < 3; i++) {
      const option = this.child('Choice' + (i + 1), new Vec3(0, 150 - i * 150, 0), 860, 112, choiceNode);
      const button = option.addComponent(Button);
      const label = option.addComponent(Label);
      label.fontSize = 30;
      label.lineHeight = 42;
      label.color.fromHEX('#F4EBDD');
      choices.buttons.push(button);
      choices.labels.push(label);
    }
    this.flow.choices = choices;

    const memoryNode = this.child('MemoryInteraction', new Vec3(0, -420, 0), 940, 700);
    memoryNode.active = false;
    const memory = memoryNode.addComponent(MemoryInteractionPanel);
    memory.titleLabel = this.label(memoryNode, 'Title', '', new Vec3(0, 230, 0), 840, 72, 38);
    memory.bodyLabel = this.label(memoryNode, 'Details', '', new Vec3(0, 10, 0), 840, 300, 32);
    memory.actionLabel = this.label(memoryNode, 'Action', '轻触继续', new Vec3(0, -260, 0), 840, 72, 28);
    this.flow.interactionPanel = memoryNode;
    this.flow.memoryPanel = memory;

    const continueNode = this.child('Continue', new Vec3(0, -770, 0), 940, 124);
    const continueLabel = continueNode.addComponent(Label);
    continueLabel.string = '继续';
    continueLabel.fontSize = 34;
    continueLabel.lineHeight = 48;
    continueLabel.color.fromHEX('#F4EBDD');
    continueNode.active = false;
    this.flow.continueButton = continueNode;
  }

  private child(name: string, position: Vec3, width: number, height: number, parent = this.node): Node {
    const node = new Node(name);
    node.layer = parent.layer;
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(width, height);
    parent.addChild(node);
    return node;
  }

  private label(parent: Node, name: string, text: string, position: Vec3, width: number, height: number, fontSize: number): Label {
    const node = this.child(name, position, width, height, parent);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize * 1.55;
    label.color.fromHEX('#F4EBDD');
    label.enableWrapText = true;
    return label;
  }
}
