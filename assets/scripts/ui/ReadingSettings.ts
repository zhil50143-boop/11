import { Color, sys } from 'cc';
import { ReadingPreferencesStore } from '../save/ReadingPreferences';
export class ReadingSettings {
  private static instance: ReadingPreferencesStore | undefined;
  static get store(): ReadingPreferencesStore {
    return this.instance ?? (this.instance = new ReadingPreferencesStore(sys.localStorage));
  }
  static get current() { return this.store.current; }
  static get scale(): number {
    return this.current.font === 'extra' ? 1.3 : this.current.font === 'large' ? 1.17 : 1;
  }
  static bodySize(base: number): number { return Math.round(base * this.scale); }
  static get ink(): Color { return this.current.theme === 'night' ? new Color(228, 230, 221) : new Color(53, 59, 57); }
  static get mutedInk(): Color { return this.current.theme === 'night' ? new Color(173, 183, 175) : new Color(104, 115, 111); }
  static get paper(): Color { return this.current.theme === 'night' ? new Color(38, 45, 42) : new Color(240, 235, 223); }
  static get paperTint(): string { return this.current.theme === 'night' ? '#292f2c' : '#f0ebdf'; }
}
