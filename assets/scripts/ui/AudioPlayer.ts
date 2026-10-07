import { AudioSource, AudioClip, resources, Node } from 'cc';
import { text, button } from './UIFactory';
import type { InteractionStoryNode } from '../story/StoryNode';
export class AudioPlayer {
  private generation = 0;
  private source: AudioSource | null = null;
  dispose(): void {
    this.generation++; this.source?.stop(); this.source = null;
  }
  show(root: Node, node: InteractionStoryNode, done: () => void): void {
    this.dispose();
    const generation = this.generation;
    const label = text(root, node.text, 250, 300);
    const finish = button(root, '继续', -650, () => { this.dispose(); done() }); finish.interactable = false;
    const play = button(root, '播放', -300, () => {
      if (!node.resource) {
        label.string = '录音暂时无法播放。可以读文字继续。';
        finish.interactable = true; play.interactable = false; return;
      }
      play.interactable = false;
      resources.load(node.resource, AudioClip, (error, clip) => {
        if (generation !== this.generation || !root.isValid) return;
        if (error || !clip) {
          label.string = '录音暂时无法播放。可以读文字继续。'; finish.interactable = true; return;
        }
        this.source = root.addComponent(AudioSource); this.source.clip = clip;
        try { this.source.play(); finish.interactable = true }
        catch { label.string = '点按播放，或读文字继续。'; play.interactable = true; finish.interactable = true }
      });
    });
    button(root, '暂停 / 继续播放', -460, () => {
      if (!this.source) return;
      if (this.source.playing) this.source.pause(); else this.source.play();
    });
  }
}
