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
  if (value.saveVersion !== undefined && value.saveVersion !== 1 && value.saveVersion !== 2) throw new Error('Unsupported save version');
  const p = value.progress;
  if (record(p) && ['chapterId','episodeId','nodeId'].every(k => typeof p[k] === 'string')) {
    base.progress = { chapterId: p.chapterId as string, episodeId: p.episodeId as string, nodeId: p.nodeId as string,
      readingOffset: typeof p.readingOffset === 'number' && Number.isFinite(p.readingOffset) ? Math.max(0, Math.min(1, p.readingOffset)) : 0 };
  }
  const life = value.life;
  if (record(life)) {
    const time = life.time;
    if (record(time) && typeof time.year === 'number' && Number.isInteger(time.year) && typeof time.month === 'number' && Number.isInteger(time.month) && time.month >= 1 && time.month <= 12 && ['spring','summer','autumn','winter'].includes(String(time.season)) && ['present','memory'].includes(String(time.timeline)) && typeof time.label === 'string' && typeof time.location === 'string') {
      base.life.time = { year: time.year, month: time.month, season: time.season as typeof base.life.time.season, label: time.label, location: time.location, timeline: time.timeline as typeof base.life.time.timeline };
    }
    if (['student','graduate','working','parent','middleAge'].includes(String(life.stage))) base.life.stage = life.stage as typeof base.life.stage;
    if (record(life.relationships)) base.life.relationships = Object.fromEntries(Object.entries(life.relationships).filter(([k,v]) => !['__proto__','constructor','prototype'].includes(k) && typeof v === 'string')) as Record<string,string>;
    if (record(life.memoryRecords)) for (const [id,memory] of Object.entries(life.memoryRecords)) {
      if (['__proto__','constructor','prototype'].includes(id) || !record(memory) || typeof memory.title !== 'string' || !['fragmentary','contradictory','reinterpreted','complete'].includes(String(memory.status)) || !Array.isArray(memory.evidence)) continue;
      base.life.memoryRecords[id] = { title: memory.title, status: memory.status as typeof base.life.memoryRecords[string]['status'], evidence: Array.from(new Set(memory.evidence.filter((v): v is string => typeof v === 'string'))) };
    }
  }
  if (record(value.stats)) for (const key of Object.keys(base.stats) as (keyof typeof base.stats)[]) {
    const n = value.stats[key];
    if (typeof n === 'number' && Number.isFinite(n)) base.stats[key] = Math.max(0, Math.min(100, n));
  }
  for (const key of ['flags','metaFlags','cg','endings'] as const) base[key] = boolMap(value[key]);
  if (record(value.memories)) base.memories = Object.fromEntries(Object.entries(value.memories).filter(([k,v]) => !['__proto__','constructor','prototype'].includes(k) && typeof v === 'number' && Number.isFinite(v))) as Record<string, number>;
  if (Array.isArray(value.readNodeIds)) base.readNodeIds = Array.from(new Set(value.readNodeIds.filter((v): v is string => typeof v === 'string')));
  if (typeof value.playCount === 'number' && Number.isInteger(value.playCount) && value.playCount > 0) base.playCount = value.playCount;
  if (typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)) base.updatedAt = value.updatedAt;
  return base;
}
export class LocalSave {
  private blocked = false;
  warning = '';
  constructor(private readonly storage: StoragePort, private readonly key: string) {}
  peek(): GameStateData {
    // Read-only viewers must not migrate, back up, reset or save player progress.
    const raw = this.storage.getItem(this.key);
    return raw ? normalizeSave(JSON.parse(raw)) : createInitialState();
  }
  load(): GameStateData {
    this.warning = ''; this.blocked = false;
    let raw: string | null;
    try { raw = this.storage.getItem(this.key); }
    catch { this.warning = '此浏览器暂时无法读取存档。'; return createInitialState(); }
    if (!raw) return createInitialState();
    try {
      const parsed: unknown = JSON.parse(raw);
      if (record(parsed) && typeof parsed.saveVersion === 'number' && parsed.saveVersion > 2) {
        this.blocked = true; throw new Error('存档来自较新版本，请使用对应版本继续。');
      }
      const state = normalizeSave(parsed);
      if (record(parsed) && parsed.saveVersion !== 2) {
        try { if (!this.storage.getItem(this.key + '.v1.backup')) this.storage.setItem(this.key + '.v1.backup', raw) }
        catch { this.blocked = true; throw new Error('旧版本存档无法备份，已保留原记录。') }
      }
      if (record(parsed) && parsed.saveVersion === 2) {
        const invalidHistory = Array.isArray(parsed.readNodeIds) && parsed.readNodeIds.some(v => typeof v !== 'string');
        const records = record(parsed.life) && record(parsed.life.memoryRecords) ? parsed.life.memoryRecords : {};
        const invalidEvidence = Object.values(records).some(m => record(m) && Array.isArray(m.evidence) && m.evidence.some(v => typeof v !== 'string'));
        if (invalidHistory || invalidEvidence) {
          // Older H5 builds could serialize a Set as {}. Keep the original;
          // missing history cannot be invented from an empty object.
          try { if (!this.storage.getItem(this.key + '.v2.collections.backup')) this.storage.setItem(this.key + '.v2.collections.backup', raw) }
          catch { this.blocked = true; throw new Error('旧记录无法备份，已保留原存档。') }
        }
      }
      return state;
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
