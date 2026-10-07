import { createInitialState, type GameStateData } from '../core/GameState';
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function boolMap(v: unknown): Record<string, boolean> {
  return record(v) ? Object.fromEntries(Object.entries(v).filter(([k, x]) => !['__proto__','constructor','prototype'].includes(k) && typeof x === 'boolean')) as Record<string, boolean> : {};
}
export function normalizeSave(value: unknown): GameStateData {
  const base = createInitialState();
  if (!record(value)) throw new Error('Invalid save root');
  if (typeof value.saveVersion === 'number' && value.saveVersion > base.saveVersion) throw new Error('Save is from a newer version');
  if (value.saveVersion !== undefined && value.saveVersion !== 1) throw new Error('Unsupported save version');
  const p = value.progress;
  if (record(p) && ['chapterId','episodeId','nodeId'].every(k => typeof p[k] === 'string')) {
    base.progress = { chapterId: p.chapterId as string, episodeId: p.episodeId as string, nodeId: p.nodeId as string };
  }
  if (record(value.stats)) for (const key of Object.keys(base.stats) as (keyof typeof base.stats)[]) {
    const n = value.stats[key];
    if (typeof n === 'number' && Number.isFinite(n)) base.stats[key] = Math.max(0, Math.min(100, n));
  }
  for (const key of ['flags','metaFlags','cg','endings'] as const) base[key] = boolMap(value[key]);
  if (record(value.memories)) base.memories = Object.fromEntries(Object.entries(value.memories).filter(([k,v]) => !['__proto__','constructor','prototype'].includes(k) && typeof v === 'number' && Number.isFinite(v))) as Record<string, number>;
  if (Array.isArray(value.readNodeIds)) base.readNodeIds = [...new Set(value.readNodeIds.filter((v): v is string => typeof v === 'string'))];
  if (typeof value.playCount === 'number' && Number.isInteger(value.playCount) && value.playCount > 0) base.playCount = value.playCount;
  if (typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)) base.updatedAt = value.updatedAt;
  return base;
}
export class LocalSave {
  private blocked = false;
  warning = '';
  constructor(private readonly storage: StoragePort, private readonly key: string) {}
  load(): GameStateData {
    this.warning = ''; this.blocked = false;
    let raw: string | null;
    try { raw = this.storage.getItem(this.key); }
    catch { this.warning = '此浏览器暂时无法读取存档。'; return createInitialState(); }
    if (!raw) return createInitialState();
    try {
      const parsed: unknown = JSON.parse(raw);
      if (record(parsed) && typeof parsed.saveVersion === 'number' && parsed.saveVersion > 1) {
        this.blocked = true; throw new Error('存档来自较新版本，请使用对应版本继续。');
      }
      return normalizeSave(parsed);
    } catch (error) {
      if (this.blocked) throw error;
      try { this.storage.setItem(this.key + '.corrupt', raw); }
      catch { this.blocked = true; throw new Error('旧存档无法备份，已保留原记录。'); }
      this.warning = '旧存档无法读取，已保留备份。';
      return createInitialState();
    }
  }
  save(state: GameStateData): boolean {
    if (this.blocked) return false;
    try {
      state.updatedAt = Date.now();
      this.storage.setItem(this.key, JSON.stringify(state)); this.warning = ''; return true;
    } catch { this.warning = '未能保存。请保持页面打开，稍后重试。'; return false; }
  }
  clear(): boolean {
    try { this.storage.removeItem(this.key); this.blocked = false; this.warning = ''; return true; }
    catch { this.warning = '未能删除存档。'; return false; }
  }
}
