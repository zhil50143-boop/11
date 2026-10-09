import { _decorator, Component, Node, UIOpacity, tween, Tween, JsonAsset, resources, game, Game, director, UITransform, ScrollView } from 'cc';
import { StoryManager, type StoryEvent } from '../story/StoryManager';
import { SaveManager } from '../save/SaveManager';
import { makeCanvas, container, text, button, clear } from './UIFactory';
import { DialoguePanel } from './DialoguePanel';
import { PassagePanel } from './PassagePanel';
import { LifeReadingPanel } from './LifeReadingPanel';
import { ChoicePanel } from './ChoicePanel';
import { PhotoViewer } from './PhotoViewer';
import { LetterViewer } from './LetterViewer';
import { AudioPlayer } from './AudioPlayer';
import type { InteractionStoryNode } from '../story/StoryNode';
import { paperButton, setPaperButtonEnabled } from './ArtSurface';
import { objectPaper } from './ObjectSurface';
import { ReadingSettings } from './ReadingSettings';
import { SettingsPanel } from './SettingsPanel';
import { InvestigationPanel } from './InvestigationPanel';
import { MemoryComparisonPanel } from './MemoryComparisonPanel';
const { ccclass } = _decorator;
@ccclass('StoryView')
export class StoryView extends Component {
  private manager!: StoryManager;
  private root!: Node;
  private status!: Node;
  private canvas!: Node;
  private settings?: SettingsPanel;
  private lastEvent?: StoryEvent;
  private viewNode = '';
  private investigationPages: Record<string, number> = {};
  private interactionView = { letterOpen: false, photoBack: false, transcriptOpen: false };
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
    this.canvas = makeCanvas(this.node);
    this.root = container(this.canvas, 'Story'); this.status = container(this.canvas, 'Status');
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
    this.lastEvent = event;
    const viewNode = event.type === 'node' ? event.node.id : '';
    if (viewNode !== this.viewNode) {
      this.viewNode = viewNode;
      this.interactionView = { letterOpen: false, photoBack: false, transcriptOpen: false };
    }
    this.settings?.destroy(); this.settings = undefined;
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
    const paperInteraction = event.type === 'node';
    const paperReading = event.type === 'node' && (event.node.type === 'phone' || (event.node.type === 'passage'
      && !!LifeReadingPanel.background(life.time, event.node.id)));
    const sceneChoice = event.type === 'node' && event.node.type === 'choice' && !!LifeReadingPanel.background(life.time, event.node.id);
    if (!paperReading && !sceneChoice) {
      const time = text(this.status, life.time.label + ' · ' + life.time.location, 785, 100, 30);
      time.node.setPosition(-100, 785); time.node.getComponent(UITransform)!.setContentSize(680, 100);
      const sceneCaption = event.type === 'node' && (event.node.id === 'CH01_EP02_C001'
        || (event.node.type === 'choice' && LifeReadingPanel.background(life.time, event.node.id)));
      if (paperInteraction && !sceneCaption) time.color = ReadingSettings.mutedInk;
    }
    const back = paperButton(this.status, '返回书桌', 884, () => {
      for (const scroll of this.root.getComponentsInChildren(ScrollView)) scroll.stopAutoScroll();
      this.audio.pause();
      if (!this.manager.retrySave()) {
        if (this.lastEvent) this.render(this.lastEvent);
        return;
      }
      director.loadScene('Main', error => {
        if (error && this.isValid) this.render({ type: 'error', message: '暂时无法返回。请重试。' });
      });
    }, 264);
    back.node.setPosition(-350, 884);
    const settings = paperButton(this.status, '阅读设置', 884, () => {
      if (this.settings) return;
      for (const scroll of this.root.getComponentsInChildren(ScrollView)) scroll.stopAutoScroll();
      this.audio.pause();
      this.settings = new SettingsPanel(this.canvas, changed => {
        this.settings = undefined;
        if (changed && this.isValid && this.lastEvent) this.render(this.lastEvent);
      }, () => this.audio.applyVolume());
    }, 216);
    settings.node.setPosition(388, 884);
    const memoryId = event.type === 'node' ? event.node.lifeContext?.memory?.id : undefined;
    const memory = life.time.timeline === 'memory'
      ? (memoryId ? life.memoryRecords[memoryId] : Object.values(life.memoryRecords)[0]) : undefined;
    let memoryCaption: string | undefined;
    if (memory) {
      const names = {fragmentary:'残缺',contradictory:'出现矛盾',reinterpreted:'重新理解',complete:'完整'};
      memoryCaption = memory.title + ' · ' + names[memory.status];
      if (!paperReading && !sceneChoice) { const caption = text(this.status, memoryCaption, 735, 70, 26); if (paperInteraction) caption.color = ReadingSettings.mutedInk; }
    }
    if (SaveManager.warning) {
      const warning = text(this.status, SaveManager.warning, -800, 70, 26);
      if (paperReading || paperInteraction) warning.color = ReadingSettings.ink;
      button(this.status, '重试保存', -890, () => { this.manager.retrySave(); void this.manager.refresh() });
    }
    if (event.type === 'end') {
      text(this.root, '当前内容读完了。', 100);
      text(this.root, '可以退出，稍后从这里继续。', -100, 160, 32); return;
    }
    const node = event.node;
    switch (node.type) {
      case 'passage': case 'phone':
        if (paperReading) {
          new LifeReadingPanel().show(this.root, node, this.speakers, life.time, memoryCaption, !!SaveManager.warning,
            this.manager.state.progress.readingOffset, offset => this.manager.setReadingOffset(node.id, offset),
            () => void this.manager.advance(node.id), node.type === 'phone'
              ? (life.time.year < 2014 ? 'phone_early_v2' : 'phone_current_v1') : undefined); break;
        }
        new PassagePanel().show(this.root, node, this.speakers, this.manager.state.progress.readingOffset,
          offset => this.manager.setReadingOffset(node.id, offset), () => void this.manager.advance(node.id)); break;
      case 'ending':
        if (this.manager.state.flags.ROUND_COMPLETED) {
          objectPaper(this.root);
          text(this.root, node.title, 350, 120, 48).color = ReadingSettings.ink;
          text(this.root, '这一页读完了。', 100, 100, 34).color = ReadingSettings.ink;
          paperButton(this.root, '再读一遍', -350, () => void this.manager.nextRound());
          paperButton(this.root, '回到首页', -530, () => director.loadScene('Main'));
        } else {
          new PassagePanel().show(this.root, { ...node, type: 'passage' }, this.speakers, this.manager.state.progress.readingOffset,
            offset => this.manager.setReadingOffset(node.id, offset), () => void this.manager.finish(node.id));
        }
        break;
      case 'dialogue': case 'narration':
        new DialoguePanel().show(this.root, node, node.speaker ? this.speakers[node.speaker] ?? node.speaker : '', () => void this.manager.advance(node.id)); break;
      case 'choice':
        new ChoicePanel().show(this.root, node, id => void this.manager.choose(id, node.id), life.time, memoryCaption); break;
      case 'photo': new PhotoViewer().show(this.root, node, () => void this.manager.complete(node.id), this.interactionView.photoBack,
        back => { this.interactionView.photoBack = back; },
        { offset: this.manager.state.progress.readingOffset, changed: offset => this.manager.setReadingOffset(node.id, offset) }); break;
      case 'letter':
        if (node.id === 'CH08_EP05_RECONSTRUCT') {
          new MemoryComparisonPanel().show(this.root, node, this.manager.state.readNodeIds.includes('CH08_EP05_N001'),
            () => void this.manager.complete(node.id), this.manager.state.progress.readingOffset,
            offset => this.manager.setReadingOffset(node.id, offset), this.interactionView.letterOpen,
            () => { this.interactionView.letterOpen = true; }); break;
        }
        new LetterViewer().show(this.root, node, () => void this.manager.complete(node.id), this.manager.state.progress.readingOffset,
        offset => this.manager.setReadingOffset(node.id, offset), this.interactionView.letterOpen,
        () => { this.interactionView.letterOpen = true; }); break;
      case 'audioInteraction': this.audio.show(this.root, node, () => void this.manager.complete(node.id), this.manager.state.progress.readingOffset,
        offset => this.manager.setReadingOffset(node.id, offset), this.interactionView.transcriptOpen,
        () => { this.interactionView.transcriptOpen = true; }); break;
      case 'investigation': this.investigation(node); break;
      case 'transition': {
        objectPaper(this.root);
        text(this.root, node.to ?? node.text, 80).color = ReadingSettings.ink;
        if (ReadingSettings.current.reducedMotion) {
          paperButton(this.root, '继续', -650, () => void this.manager.complete(node.id)); break;
        }
        const opacity = this.root.getComponent(UIOpacity) ?? this.root.addComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity).to(0.45, {opacity:255}).call(() => {
          if (this.isValid) paperButton(this.root, '继续', -650, () => void this.manager.complete(node.id));
        }).start(); break;
      }
      default: text(this.root, '该片段暂时无法继续。', 0);
    }
  }
  private investigation(node: InteractionStoryNode): void {
    if (node.id === 'CH01_EP02_C001') {
      new InvestigationPanel().show(this.root, node, this.manager.state.flags,
        id => void this.manager.inspect(id, node.id), () => void this.manager.complete(node.id),
        this.investigationPages[node.id] ?? 0, page => { this.investigationPages[node.id] = page; });
      return;
    }
    objectPaper(this.root);
    text(this.root, node.text, 500, 160).color = ReadingSettings.ink;
    if (!node.requiredFlags?.every(f => this.manager.state.flags[f])) text(this.root, node.requiredHint ?? '先看看照片和信封。', 365, 70, 30).color = ReadingSettings.mutedInk;
    node.items?.forEach((item, i) => {
      const viewed = this.manager.state.flags[item.viewedFlag] ? '（看过）' : '';
      paperButton(this.root, item.text + viewed, 200 - i * 155, () => void this.manager.inspect(item.id, node.id));
    });
    const done = paperButton(this.root, node.doneText ?? '收好纸箱', -650, () => void this.manager.complete(node.id));
    setPaperButtonEnabled(done, node.requiredFlags?.every(f => this.manager.state.flags[f]) ?? true);
  }
  onDestroy(): void {
    this.settings?.destroy();
    this.audio.dispose(); this.manager?.events.off('change', this.onChange);
    game.off(Game.EVENT_HIDE, this.onHide); game.off(Game.EVENT_SHOW, this.onShow);
  }
}
