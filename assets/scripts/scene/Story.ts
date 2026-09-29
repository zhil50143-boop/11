import { _decorator, Component } from 'cc';
import { StoryManager } from '../story/StoryManager';
import { StoryFlow } from '../ui/StoryFlow';

const { ccclass, property } = _decorator;

/** Story scene root verifies editor references; progression remains in StoryManager. */
@ccclass('Story')
export class Story extends Component {
  @property(StoryManager) manager: StoryManager | null = null;
  @property(StoryFlow) flow: StoryFlow | null = null;

  start(): void {
    if (!this.manager || !this.flow) {
      console.error('[Story] Bind StoryManager and StoryFlow in the Story scene.');
    }
  }
}
