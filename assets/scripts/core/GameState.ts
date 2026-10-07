export interface StoryStats {
  nostalgia: number;
  reality: number;
  regret: number;
  understandingXia: number;
  understandingPartner: number;
  selfReflection: number;
  honesty: number;
  avoidance: number;
}

export interface StoryProgress {
  chapterId: string;
  episodeId: string;
  nodeId: string;
  readingOffset: number;
}

export type LifeStage = 'student' | 'graduate' | 'working' | 'parent' | 'middleAge';
export type MemoryStatus = 'fragmentary' | 'contradictory' | 'reinterpreted' | 'complete';
export interface StoryTime {
  year: number;
  month: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  label: string;
  location: string;
  timeline: 'present' | 'memory';
}
export interface MemoryRecord { title: string; status: MemoryStatus; evidence: string[] }
export interface LifeState {
  time: StoryTime;
  stage: LifeStage;
  relationships: Record<string, string>;
  memoryRecords: Record<string, MemoryRecord>;
}
export interface LifeContext {
  time?: StoryTime;
  stage?: LifeStage;
  relationships?: Record<string, string>;
  memory?: { id: string; title: string; status: MemoryStatus; evidence: string[] };
}

export interface GameStateData {
  saveVersion: number;
  playCount: number;
  progress: StoryProgress;
  life: LifeState;
  stats: StoryStats;
  flags: Record<string, boolean>;
  metaFlags: Record<string, boolean>;
  memories: Record<string, number>;
  cg: Record<string, boolean>;
  endings: Record<string, boolean>;
  readNodeIds: string[];
  updatedAt: number;
}

export function createInitialState(): GameStateData {
  return {
    saveVersion: 2,
    playCount: 1,
    progress: {
      chapterId: 'CH01',
      episodeId: 'CH01_EP01',
      nodeId: 'CH01_EP01_N001',
      readingOffset: 0,
    },
    life: {
      time: { year: 2037, month: 9, season: 'autumn', label: '2037 · 秋', location: '家中', timeline: 'present' },
      stage: 'middleAge',
      relationships: {},
      memoryRecords: {},
    },
    stats: {
      nostalgia: 0,
      reality: 0,
      regret: 0,
      understandingXia: 0,
      understandingPartner: 0,
      selfReflection: 0,
      honesty: 0,
      avoidance: 0,
    },
    flags: {},
    metaFlags: {},
    memories: {},
    cg: {},
    endings: {},
    readNodeIds: [],
    updatedAt: Date.now(),
  };
}
