import type { GameStateData, StoryStats } from './GameState';
export function clamp(value: number, min = 0, max = 100): number {
  if (![value,min,max].every(Number.isFinite) || min > max) throw new Error('Invalid numeric range');
  return Math.min(max, Math.max(min, value));
}
export type Condition =
  | { flag: string; equals?: boolean }
  | { stat: keyof StoryStats; min?: number; max?: number }
  | { all: Condition[] } | { any: Condition[] } | { not: Condition };
export function meets(state: GameStateData, condition: Condition): boolean {
  if ('all' in condition) return condition.all.every(c => meets(state,c));
  if ('any' in condition) return condition.any.some(c => meets(state,c));
  if ('not' in condition) return !meets(state,condition.not);
  if ('flag' in condition) return !!state.flags[condition.flag] === (condition.equals ?? true);
  const n = state.stats[condition.stat];
  return Number.isFinite(n) && (condition.min === undefined || n >= condition.min) && (condition.max === undefined || n <= condition.max);
}
export function weightedScore(state: GameStateData, weights: Partial<Record<keyof StoryStats, number>>, flagBonus: Record<string, number> = {}): number {
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (!Number.isFinite(weight)) throw new Error('Invalid weight');
    score += state.stats[key as keyof StoryStats] * weight!;
  }
  for (const [flag, bonus] of Object.entries(flagBonus)) {
    if (!Number.isFinite(bonus)) throw new Error('Invalid flag bonus');
    if (state.flags[flag]) score += bonus;
  }
  return score;
}
