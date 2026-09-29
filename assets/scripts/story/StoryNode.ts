export type StoryNodeType =
  | 'dialogue'
  | 'narration'
  | 'choice'
  | 'condition'
  | 'background'
  | 'character'
  | 'music'
  | 'sound'
  | 'investigation'
  | 'photo'
  | 'letter'
  | 'audioInteraction'
  | 'transition'
  | 'save'
  | 'episodeEnd';

export interface StoryEffectMap {
  [key: string]: number;
}

export interface ChoiceOption {
  id: string;
  text: string;
  effects?: StoryEffectMap;
  setFlags?: string[];
  next: string;
}

export interface StoryConditionBranch {
  flag?: string;
  equals?: boolean;
  stat?: string;
  operator?: '>=' | '>' | '<=' | '<' | '==';
  value?: number;
  next: string;
}

export interface BaseStoryNode {
  id: string;
  type: StoryNodeType;
  next?: string;
}

export interface TextStoryNode extends BaseStoryNode {
  type: 'dialogue' | 'narration';
  speaker?: string;
  expression?: string;
  position?: 'left' | 'center' | 'right';
  text: string;
}

export interface ChoiceStoryNode extends BaseStoryNode {
  type: 'choice';
  options: ChoiceOption[];
}

export interface ConditionStoryNode extends BaseStoryNode {
  type: 'condition';
  branches: StoryConditionBranch[];
  fallback: string;
}

export type StoryNode =
  | TextStoryNode
  | ChoiceStoryNode
  | ConditionStoryNode
  | (BaseStoryNode & Record<string, unknown>);

export interface EpisodeData {
  episodeId: string;
  name: string;
  startNode: string;
  nodes: StoryNode[];
}
