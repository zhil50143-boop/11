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
}

export interface GameStateData {
  saveVersion: number;
  playCount: number;
  progress: StoryProgress;
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
    saveVersion: 1,
    playCount: 1,
    progress: {
      chapterId: 'CH01',
      episodeId: 'CH01_EP01',
      nodeId: 'CH01_EP01_N001',
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
