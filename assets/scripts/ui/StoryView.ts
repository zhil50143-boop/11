import { _decorator, Component, Node, UIOpacity, tween, Tween, JsonAsset, resources, game, Game } from 'cc';
import { StoryManager, type StoryEvent } from '../story/StoryManager';
import { SaveManager } from '../save/SaveManager';
import { makeCanvas, container, text, button, clear } from './UIFactory';
import { DialoguePanel } from './DialoguePanel';
import { PassagePanel } from './PassagePanel';
import { ChoicePanel } from './ChoicePanel';
import { PhotoViewer } from './PhotoViewer';
import { LetterViewer } from './LetterViewer';
import { AudioPlayer } from './AudioPlayer';
import type { InteractionStoryNode } from '../story/StoryNode';
const { ccclass } = _decorator;
@ccclass('StoryView')
export class StoryView extends Component {
  private manager!: StoryManager;
  private root!: Node;
  private status!: Node;
  private audio = new AudioPlayer();
  private speakers: Record<string, string> = {};
  private presentLabel = ''; private memoryLabel = '';
  private onChange = (event: StoryEvent) => this.render(event);
  private onShow = () => { if (this.manager?.hasState()) void this.manager.refresh() };
  private onHide = () => {
    this.audio.dispose();
    if (this.manager) this.manager.retrySave();
  };
  async start(): Promise<void> {
    const canvas = makeCanvas(this.node);
    this.status = container(canvas, 'Status'); this.root = container(canvas, 'Story');
    text(this.root, '正在打开……', 0);
    this.manager = this.node.addComponent(StoryManager);
    this.manager.events.on('change', this.onChange); game.on(Game.EVENT_HIDE, this.onHide); game.on(Game.EVENT_SHOW, this.onShow);
    try {
      const asset = await new Promise<JsonAsset>((resolve,reject) => resources.load('data/presentation', JsonAsset, (e,a) => e || !a ? reject(e) : resolve(a)));
      if (!this.isValid) return;
      const config = asset.json;
      if (!config || !config.speakers || typeof config.speakers !== 'object' || typeof config.present !== 'string' || typeof config.memory !== 'string' || Object.values(config.speakers).some(v => typeof v !== 'string')) throw new Error('Invalid presentation JSON');
      this.speakers = config.speakers; this.presentLabel = config.present; this.memoryLabel = config.memory;
      await this.manager.initialize();
    } catch { if (this.isValid) this.render({type:'error', message:'暂时无法打开。请重试。'}) }
  }
  private render(event: StoryEvent): void {
    this.audio.dispose();
    const opacity = this.root.getComponent(UIOpacity);
    if (opacity) { Tween.stopAllByTarget(opacity); opacity.opacity = 255; }
    clear(this.root); clear(this.status);
    if (event.type === 'error') {
      text(this.root, event.message, 100);
      button(this.root, '重试', -650, () => {
        if (!this.manager.hasState()) void this.manager.initialize(); else void this.manager.refresh();
      }); return;
    }
    const life = this.manager.state.life;
    text(this.status, life.time.label + ' · ' + life.time.location, 800, 100, 30);
    const memoryId = event.type === 'node' ? event.node.lifeContext?.memory?.id : undefined;
    const memory = life.time.timeline === 'memory'
      ? (memoryId ? life.memoryRecords[memoryId] : Object.values(life.memoryRecords)[0]) : undefined;
    if (memory) {
      const names = {fragmentary:'残缺',contradictory:'出现矛盾',reinterpreted:'重新理解',complete:'完整'};
      text(this.status, memory.title + ' · ' + names[memory.status], 735, 70, 26);
    }
    if (SaveManager.warning) {
      text(this.status, SaveManager.warning, -800, 70, 26);
      button(this.status, '重试保存', -890, () => { this.manager.retrySave(); void this.manager.refresh() });
    }
    if (event.type === 'end') {
      text(this.root, '当前内容读完了。', 100);
      text(this.root, '可以退出，稍后从这里继续。', -100, 160, 32); return;
    }
    const node = event.node;
    switch (node.type) {
      case 'passage': case 'phone':
        new PassagePanel().show(this.root, node, this.speakers, this.manager.state.progress.readingOffset,
          offset => this.manager.setReadingOffset(node.id, offset), () => void this.manager.advance(node.id)); break;
      case 'dialogue': case 'narration':
        new DialoguePanel().show(this.root, node, node.speaker ? this.speakers[node.speaker] ?? node.speaker : '', () => void this.manager.advance(node.id)); break;
      case 'choice':
        new ChoicePanel().show(this.root, node, id => void this.manager.choose(id, node.id)); break;
      case 'photo': new PhotoViewer().show(this.root, node, () => void this.manager.complete(node.id)); break;
      case 'letter': new LetterViewer().show(this.root, node, () => void this.manager.complete(node.id)); break;
      case 'audioInteraction': this.audio.show(this.root, node, () => void this.manager.complete(node.id)); break;
      case 'investigation': this.investigation(node); break;
      case 'transition': {
        text(this.root, node.to ?? node.text, 80);
        const opacity = this.root.getComponent(UIOpacity) ?? this.root.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.45, {opacity:255}).call(() => {
          if (this.isValid) button(this.root, '继续', -650, () => void this.manager.complete(node.id));
        }).start(); break;
      }
      default: text(this.root, '该片段暂时无法继续。', 0);
    }
  }
  private investigation(node: InteractionStoryNode): void {
    text(this.root, node.text, 500, 160);
    if (!node.requiredFlags?.every(f => this.manager.state.flags[f])) text(this.root, '先看看照片和信封。', 365, 70, 30);
    node.items?.forEach((item, i) => {
      const viewed = this.manager.state.flags[item.viewedFlag] ? '（看过）' : '';
      button(this.root, item.text + viewed, 200 - i * 155, () => void this.manager.inspect(item.id, node.id));
    });
    const done = button(this.root, '收好纸箱', -650, () => void this.manager.complete(node.id));
    done.interactable = node.requiredFlags?.every(f => this.manager.state.flags[f]) ?? true;
  }
  onDestroy(): void {
    this.audio.dispose(); this.manager?.events.off('change', this.onChange);
    game.off(Game.EVENT_HIDE, this.onHide); game.off(Game.EVENT_SHOW, this.onShow);
  }
}
