import { AudioSource, AudioClip, resources, Node } from 'cc';
import { text, button } from './UIFactory';
import type { InteractionStoryNode } from '../story/StoryNode';
import { DocumentPanel } from './DocumentPanel';
import { ReadingSettings } from './ReadingSettings';
export class AudioPlayer {
  private generation = 0;
  private source: AudioSource | null = null;
  private ended: { root: Node; callback: () => void } | null = null;
  pause(): void { if (this.source?.playing) this.source.pause(); }
  applyVolume(): void { if (this.source) this.source.volume = ReadingSettings.current.volume; }
  dispose(): void {
    this.generation++;
    if (this.ended) {
      this.ended.root.off(AudioSource.EventType.ENDED, this.ended.callback);
      this.ended = null;
    }
    this.source?.stop(); this.source?.destroy(); this.source = null;
  }
  show(root: Node, node: InteractionStoryNode, done: () => void, offset = 0, changed: (offset: number) => void = () => {},
    transcriptOpen = false, opened: () => void = () => {}): void {
    this.dispose(); const generation = this.generation;
    const label = text(root, node.text, 250, 300);
    const finish = button(root, '继续', -650, () => { this.dispose(); done() }); finish.interactable = !!node.requireReadToEnd && offset >= .99;
    const play = button(root, '播放', -300, () => {
      if (!this.source) {
        label.string = node.transcript ? '录音暂时无法播放。可以查看完整录音文字。' : '录音暂时无法播放。可以读文字继续。';
        finish.interactable = !node.requireReadToEnd; return;
      }
      // Called directly inside the player's touch gesture after preloading.
      try { this.source.play(); finish.interactable = !node.requireReadToEnd }
      catch { label.string = '录音暂时无法播放。可以读文字继续。'; finish.interactable = !node.requireReadToEnd }
    });
    const pause = button(root, '暂停 / 继续播放', -460, () => {
      if (!this.source) return;
      if (this.source.playing) this.source.pause(); else this.source.play();
    });
    pause.interactable = false;
    if (node.transcript) {
      const showTranscript = () => {
        opened();
        this.source?.pause(); label.node.active = false; play.node.active = false; pause.node.active = false; read.node.active = false;
        new DocumentPanel().show(root, node.transcript!, offset, changed, () => { finish.interactable = true });
      };
      const read = button(root, '查看录音文字', -150, showTranscript);
      if (transcriptOpen) { showTranscript(); return; }
    }
    if (!node.resource) return;
    play.interactable = false; label.string = node.text + '\n正在读取录音……';
    resources.load(node.resource, AudioClip, (error, clip) => {
      if (generation !== this.generation || !root.isValid) return;
      play.interactable = true;
      if (error || !clip) { label.string = '录音暂时无法播放。可以读文字继续。'; return }
      this.source = root.addComponent(AudioSource); this.source.clip = clip;
      this.applyVolume();
      const ended = () => {
        if (generation !== this.generation || !root.isValid) return;
        this.ended = null;
        changed(1); finish.interactable = true;
      };
      this.ended = { root, callback: ended };
      root.once(AudioSource.EventType.ENDED, ended);
      label.string = node.text; pause.interactable = true;
    });
  }
}
