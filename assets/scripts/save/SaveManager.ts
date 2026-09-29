import { sys } from 'cc';
import { GameConfig } from '../core/GameConfig';
import { createInitialState, type GameStateData } from '../core/GameState';

export class SaveManager {
  static load(): GameStateData {
    try {
      const raw = sys.localStorage.getItem(GameConfig.saveKey);
      if (!raw) return createInitialState();
      const parsed = JSON.parse(raw) as Partial<GameStateData>;
      const base = createInitialState();
      return {
        ...base,
        ...parsed,
        progress: { ...base.progress, ...(parsed.progress ?? {}) },
        stats: { ...base.stats, ...(parsed.stats ?? {}) },
        flags: parsed.flags ?? {},
        metaFlags: parsed.metaFlags ?? {},
        memories: parsed.memories ?? {},
        cg: parsed.cg ?? {},
        endings: parsed.endings ?? {},
        readNodeIds: parsed.readNodeIds ?? [],
      };
    } catch (error) {
      console.error('[SaveManager] load failed; using fresh save', error);
      return createInitialState();
    }
  }

  static save(state: GameStateData): void {
    try {
      state.updatedAt = Date.now();
      sys.localStorage.setItem(GameConfig.saveKey, JSON.stringify(state));
    } catch (error) {
      console.error('[SaveManager] save failed', error);
    }
  }

  static clear(): void {
    sys.localStorage.removeItem(GameConfig.saveKey);
  }
}
