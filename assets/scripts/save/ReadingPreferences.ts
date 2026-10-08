export type ReadingPreferences = {
  version: 1;
  font: 'standard' | 'large' | 'extra';
  theme: 'paper' | 'night';
  volume: 0 | 0.5 | 1;
  reducedMotion: boolean;
};
type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem'>;
export const readingPreferencesKey = 'yushengweiji.reading.v1';
export const defaultReadingPreferences = (): ReadingPreferences => ({
  version: 1, font: 'standard', theme: 'paper', volume: 1, reducedMotion: false,
});

// This key contains presentation only; story saves and evidence are never touched.
export class ReadingPreferencesStore {
  private value: ReadingPreferences = defaultReadingPreferences();
  private future = false;
  warning = false;
  constructor(private readonly storage: Storage) {
    try {
      const raw = storage.getItem(readingPreferencesKey);
      if (raw === null) return;
      const data: unknown = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) { this.warning = true; return; }
      const p = data as Record<string, unknown>;
      if (typeof p.version === 'number' && p.version > 1) { this.future = true; this.warning = true; return; }
      if (p.version !== 1) { this.warning = true; return; }
      this.value = {
        version: 1,
        font: p.font === 'large' || p.font === 'extra' ? p.font : 'standard',
        theme: p.theme === 'night' ? 'night' : 'paper',
        volume: p.volume === 0 || p.volume === 0.5 ? p.volume : 1,
        reducedMotion: p.reducedMotion === true,
      };
    } catch { this.warning = true; }
  }
  get current(): ReadingPreferences { return { ...this.value }; }
  update(next: ReadingPreferences): boolean {
    this.value = { ...next, version: 1 };
    // An old build must not replace preferences written by a newer one.
    if (this.future) { this.warning = true; return false; }
    try { this.storage.setItem(readingPreferencesKey, JSON.stringify(this.value)); this.warning = false; return true; }
    catch { this.warning = true; return false; }
  }
}
