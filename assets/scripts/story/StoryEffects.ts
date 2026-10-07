import { clamp } from '../core/NarrativeMath';
import type { GameStateData } from '../core/GameState';
import type { StoryEffectMap } from './StoryNode';

export function applyEffects(
  state: GameStateData,
  effects?: StoryEffectMap,
  setFlags?: string[],
): void {
  if (effects) {
    for (const [key, delta] of Object.entries(effects)) {
      if (Object.prototype.hasOwnProperty.call(state.stats, key) && Number.isFinite(delta)) {
        const current = state.stats[key as keyof typeof state.stats];
        state.stats[key as keyof typeof state.stats] = clamp(current + delta);
      }
    }
  }

  if (setFlags) {
    for (const flag of setFlags) {
      state.flags[flag] = true;
    }
  }

  state.updatedAt = Date.now();
}
