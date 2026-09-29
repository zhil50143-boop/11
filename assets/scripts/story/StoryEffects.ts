import type { GameStateData } from '../core/GameState';
import type { StoryEffectMap } from './StoryNode';

export function applyEffects(
  state: GameStateData,
  effects?: StoryEffectMap,
  setFlags?: string[],
): void {
  if (effects) {
    for (const [key, delta] of Object.entries(effects)) {
      if (key in state.stats) {
        const current = state.stats[key as keyof typeof state.stats];
        state.stats[key as keyof typeof state.stats] = Math.max(0, Math.min(100, current + delta));
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
