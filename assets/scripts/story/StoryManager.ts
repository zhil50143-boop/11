import { _decorator, Component, JsonAsset, resources } from 'cc';
import mitt from '../vendor/mitt';
import { SaveManager } from '../save/SaveManager';
import { StoryRuntime } from './StoryRuntime';
import type { ChapterManifest, EpisodeData, StoryNode, StoryCatalog } from './StoryNode';
const { ccclass } = _decorator;
export type StoryEvent = { type: 'node'; node: StoryNode } | { type: 'end' } | { type: 'error'; message: string };
@ccclass('StoryManager')
export class StoryManager extends Component {
  readonly events = mitt<{ change: StoryEvent }>();
  private runtime!: StoryRuntime;
  private manifest!: ChapterManifest;
  private catalog!: StoryCatalog;
  private busy = false;
  private alive = true;
  private pending = new Map<string, Promise<JsonAsset>>();
  get state() { return this.runtime.state }
  hasState(): boolean { return !!this.runtime }
  private ready = false;
  private loadJSON(path: string): Promise<JsonAsset> {
    let request = this.pending.get(path);
    if (!request) {
      request = new Promise<JsonAsset>((resolve, reject) => resources.load(path, JsonAsset, (error, asset) => {
        if (error || !asset) reject(error ?? new Error('Missing JSON: ' + path)); else resolve(asset);
      }));
      this.pending.set(path, request);
      request.catch(() => this.pending.delete(path));
    }
    return request;
  }
  private async readManifest(chapterId: string): Promise<ChapterManifest> {
    const ref = this.catalog.chapters.find(chapter => chapter.id === chapterId);
    if (!ref) throw new Error('章节未登记：' + chapterId);
    const asset = await this.loadJSON(ref.resource);
    const manifest = asset.json as ChapterManifest;
    if (!manifest || manifest.chapterId !== chapterId || !Array.isArray(manifest.episodes) || !manifest.episodes.length) throw new Error('章节配置不可用：' + chapterId);
    return manifest;
  }
  private async openChapter(chapterId: string, resume = false): Promise<void> {
    const manifest = await this.readManifest(chapterId);
    const ref = resume ? manifest.episodes.find(e => e.id === this.state.progress.episodeId) : manifest.episodes[0];
    if (!ref) throw new Error('存档片段不可用。请保留存档并使用对应版本。');
    const episode = (await this.loadJSON(ref.resource)).json as EpisodeData;
    if (!this.alive) return;
    // Commit chapter, episode and node together, only after both assets loaded.
    this.runtime.load(episode, manifest.chapterId);
    this.manifest = manifest;
    this.preloadNext();
  }
  private preloadNext(): void {
    const index = this.manifest.episodes.findIndex(e => e.id === this.state.progress.episodeId);
    const next = this.manifest.episodes[index + 1];
    if (next) void this.loadJSON(next.resource).catch(() => {});
  }
  async initialize(): Promise<void> {
    await this.perform(async () => {
      this.runtime = new StoryRuntime(SaveManager.load(), state => SaveManager.save(state));
      this.catalog = (await this.loadJSON('data/story/catalog')).json as StoryCatalog;
      if (!this.catalog || !Array.isArray(this.catalog.chapters) || !this.catalog.chapters.length) throw new Error('剧情目录不可用。');
      await this.openChapter(this.state.progress.chapterId || this.catalog.startChapter, true);
      this.ready = true;
      await this.present();
    });
  }
  async loadEpisode(path: string): Promise<void> {
    const episode = (await this.loadJSON(path)).json as EpisodeData;
    if (!this.alive) return;
    this.runtime.load(episode, this.manifest.chapterId);
    this.preloadNext();
  }
  async advance(id: string): Promise<void> { await this.perform(async () => { this.runtime.advance(id); await this.present() }) }
  async choose(option: string, id: string): Promise<void> { await this.perform(async () => { this.runtime.choose(option, id); await this.present() }) }
  async inspect(item: string, id: string): Promise<void> { await this.perform(async () => { this.runtime.inspect(item, id); await this.present() }) }
  async complete(id: string): Promise<void> { await this.perform(async () => { this.runtime.complete(id); await this.present() }) }
  async refresh(): Promise<void> { if (!this.ready) { await this.initialize(); return; } await this.perform(() => this.present()) }
  retrySave(): boolean { return this.hasState() && SaveManager.save(this.state) }
  private saveReading = () => { this.retrySave() };
  setReadingOffset(id: string, offset: number): void {
    if (!this.hasState() || this.state.progress.nodeId !== id || !Number.isFinite(offset)) return;
    this.state.progress.readingOffset = Math.max(0, Math.min(1, offset));
    this.unschedule(this.saveReading); this.scheduleOnce(this.saveReading, 0.3);
  }
  private async present(): Promise<void> {
    if (!this.alive) return;
    let node = this.runtime.current();
    for (let guard = 0; node.type === 'episodeEnd' && guard < 16; guard++) {
      const ref = this.manifest.episodes.find(e => e.id === node.next);
      if (ref) await this.loadEpisode(ref.resource);
      else if (node.next === this.manifest.nextChapter) {
        if (node.next === this.catalog.pendingChapter) {
          SaveManager.save(this.state); this.events.emit('change', { type: 'end' }); return;
        }
        // A registered chapter failing to load is an error, never a fake ending.
        await this.openChapter(node.next);
      } else throw new Error('Unknown episode: ' + node.next);
      if (!this.alive) return;
      node = this.runtime.current();
    }
    if (node.type === 'episodeEnd') throw new Error('Episode end loop');
    this.events.emit('change', { type: 'node', node });
  }
  private async perform(action: () => Promise<void>): Promise<void> {
    if (this.busy || !this.alive) return;
    this.busy = true;
    try { await action() } catch (error) {
      if (this.alive) this.events.emit('change', { type: 'error', message: error instanceof Error ? error.message : String(error) });
    } finally { this.busy = false }
  }
  onDestroy(): void { this.alive = false; this.events.all.clear(); this.pending.clear() }
}
