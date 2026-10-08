import { createInitialState, type GameStateData } from '../core/GameState';

export const ENDING_IDS = ['REUNION', 'GOODBYE', 'UNDERSTAND', 'IF_THEN', 'TOGETHER', 'UNSENT'] as const;
export type EndingId = typeof ENDING_IDS[number];
export const ENDING_NAMES: Record<EndingId, string> = {
  REUNION: '好久不见', GOODBYE: '不要再见了', UNDERSTAND: '后来我才懂',
  IF_THEN: '如果那年', TOGETHER: '谢谢你陪我走到这里', UNSENT: '余生未寄',
};
export function endingCount(state: GameStateData): number {
  return ENDING_IDS.filter(id => state.endings[id] === true).length;
}
export function hasCoreEvidence(state: GameStateData): boolean {
  return ['READ_FULL_LETTER', 'FOUND_FULL_RECORDING', 'CH08_COMPARED_DATES', 'CH08_HEARD_CHEN_CONTEXT', 'UNDERSTOOD_BREAKUP_TRUTH']
    .every(flag => state.flags[flag] === true);
}
export function scoreAcceptPast(state: GameStateData): number {
  const s = state.stats;
  return s.selfReflection * .35 + s.reality * .25 + s.understandingXia * .20 + s.honesty * .15 - s.avoidance * .20 - s.regret * .10;
}
export function resolveEnding(state: GameStateData): EndingId {
  const f = state.flags, s = state.stats;
  const heardPlans = ['CH03_DISCUSS_PLANS', 'CH04_ASKED_SUMMER_PLAN', 'CH05_TALKED_JOB_CONDITIONS'].filter(flag => f[flag]).length;
  const rebuilt = ['FIRST_MEETING', 'GRADUATION', 'BREAKUP'].every(id => state.life.memoryRecords[id]?.status === 'complete');
  const candidates: { id: EndingId; priority: number; score: number }[] = [];
  if (state.playCount >= 2 && endingCount(state) >= 3 && hasCoreEvidence(state) && rebuilt && f.MET_XIA && f.CH09_CHECKED_FIRST_PAGE && f.CH10_READ_OWN_LETTER)
    candidates.push({ id: 'UNSENT', priority: 100, score: 0 });
  if (f.CONTACTED_XIA && f.MET_XIA && f.TOLD_PARTNER_BEFORE_CONTACT && f.PARTNER_AWARE_MEETING && heardPlans >= 2)
    candidates.push({ id: 'REUNION', priority: 20, score: s.honesty * .2 + s.understandingXia * .2 });
  if (f.CONTACTED_XIA && f.CH09_DECLINED_MEETING && f.CH09_CONTACT_CLOSED && f.CH10_LEFT_CONTACT_CLOSED)
    candidates.push({ id: 'GOODBYE', priority: 20, score: s.reality * .3 + s.honesty * .2 });
  if (hasCoreEvidence(state) && f.CH10_SORTED_OWN_PAPERS)
    candidates.push({ id: 'UNDERSTAND', priority: 10, score: scoreAcceptPast(state) });
  if (f.CH07_PLANNED_CARE_TOGETHER && f.CH10_SHARED_WEEK && f.CH10_READY_CURRENT_LIFE)
    candidates.push({ id: 'TOGETHER', priority: 10, score: s.understandingPartner * .45 + s.reality * .2 + s.honesty * .1 - s.avoidance * .1 + .5 });
  candidates.push({ id: 'IF_THEN', priority: 0, score: s.nostalgia * .3 + s.regret * .2 });
  // Stable configured order resolves an exact tie. Facts are checked before scores.
  candidates.sort((a, b) => b.priority - a.priority || b.score - a.score || ENDING_IDS.indexOf(a.id) - ENDING_IDS.indexOf(b.id));
  return candidates[0].id;
}
export function recordEnding(state: GameStateData, id: EndingId): void {
  if (!ENDING_IDS.includes(id)) throw new Error('Unknown ending');
  if (state.flags.ROUND_COMPLETED) {
    if (!state.flags['ROUND_END_' + id]) throw new Error('Round already completed');
    return;
  }
  if (resolveEnding(state) !== id) throw new Error('Ending facts changed');
  state.endings[id] = true;
  state.flags.ROUND_COMPLETED = true;
  state.flags['ROUND_END_' + id] = true;
  if (hasCoreEvidence(state)) state.metaFlags.CORE_EVIDENCE_READ = true;
}
export function createNextRound(previous: GameStateData, requireCompleted = true): GameStateData {
  if (requireCompleted && !previous.flags.ROUND_COMPLETED) throw new Error('This round has not finished');
  const next = createInitialState();
  next.endings = { ...previous.endings };
  next.metaFlags = { ...previous.metaFlags };
  // Restarting an unfinished round retains its number and completed meta progress.
  next.playCount = previous.playCount + (previous.flags.ROUND_COMPLETED ? 1 : 0);
  return next;
}
