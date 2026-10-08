import type { LifeContext } from '../core/GameState';
export interface StoryEffectMap { [key: string]: number }
export interface ChoiceOption {
  id: string; text: string; next: string;
  effects?: StoryEffectMap; setFlags?: string[];
}
export interface StoryConditionBranch {
  flag?: string; equals?: boolean; stat?: string;
  operator?: '>=' | '>' | '<=' | '<' | '=='; value?: number; next: string;
}
export interface BaseStoryNode { id: string; next?: string; lifeContext?: LifeContext; setFlags?: string[] }
export interface StoryParagraph { text: string; speaker?: string }
export interface PassageStoryNode extends BaseStoryNode {
  type: 'passage' | 'phone'; title: string; paragraphs: StoryParagraph[];
  category: 'main' | 'daily' | 'npc' | 'time';
}
export interface TextStoryNode extends BaseStoryNode {
  type: 'dialogue' | 'narration'; text: string; speaker?: string;
  expression?: string; position?: 'left' | 'center' | 'right';
}
export interface ChoiceStoryNode extends BaseStoryNode { type: 'choice'; prompt: string; consequence: string; options: ChoiceOption[] }
export interface ConditionStoryNode extends BaseStoryNode {
  type: 'condition'; branches: StoryConditionBranch[]; fallback: string;
}
export interface InvestigationItem { id: string; text: string; next: string; viewedFlag: string }
export interface InteractionStoryNode extends BaseStoryNode {
  type: 'investigation' | 'photo' | 'letter' | 'audioInteraction' | 'transition';
  text: string; actionText?: string; backText?: string; resource?: string; from?: string; to?: string;
  transcript?: string; requireReadToEnd?: boolean; requiredHint?: string; doneText?: string; optional?: boolean;
  items?: InvestigationItem[]; requiredFlags?: string[];
  effects?: StoryEffectMap; setFlags?: string[];
}
export interface ControlStoryNode extends BaseStoryNode { type: 'save' | 'episodeEnd' }
export type StoryNode = PassageStoryNode | TextStoryNode | ChoiceStoryNode | ConditionStoryNode | InteractionStoryNode | ControlStoryNode;
export type StoryNodeType = StoryNode['type'];
export interface EpisodeData { episodeId: string; name: string; startNode: string; nodes: StoryNode[]; nodeAliases?: Record<string, string> }
export interface EpisodeRef { id: string; name: string; resource: string; startNode: string }
export interface ChapterManifest { chapterId: string; title: string; episodes: EpisodeRef[]; nextChapter: string }
export interface StoryCatalog { startChapter: string; chapters: { id: string; resource: string }[]; pendingChapter?: string }
