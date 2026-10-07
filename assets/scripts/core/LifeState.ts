import type { LifeContext, LifeState, MemoryStatus, StoryTime } from './GameState';

const order: MemoryStatus[] = ['fragmentary', 'contradictory', 'reinterpreted', 'complete'];
export function applyLifeContext(life: LifeState, context?: LifeContext): boolean {
  if (!context) return false;
  let changed = false;
  if (context.time && (Object.keys(context.time) as (keyof StoryTime)[]).some(k => life.time[k] !== context.time![k])) {
    life.time = { ...context.time }; changed = true;
  }
  if (context.stage && life.stage !== context.stage) { life.stage = context.stage; changed = true }
  for (const [id, status] of Object.entries(context.relationships ?? {})) {
    if (life.relationships[id] !== status) { life.relationships[id] = status; changed = true }
  }
  const update = context.memory;
  if (update) {
    const previous = life.memoryRecords[update.id];
    const evidence = Array.from(new Set([...(previous?.evidence ?? []), ...update.evidence]));
    const status = previous && order.indexOf(previous.status) > order.indexOf(update.status) ? previous.status : update.status;
    if (!previous || previous.title !== update.title || previous.status !== status || previous.evidence.length !== evidence.length) {
      life.memoryRecords[update.id] = { title: update.title, status, evidence }; changed = true;
    }
  }
  return changed;
}
