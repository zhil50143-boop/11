import { Node, JsonAsset, resources, isValid } from 'cc';
import type { InteractionStoryNode, EpisodeData, PassageStoryNode } from '../story/StoryNode';
import { objectPaper } from './ObjectSurface';
import { artSurface, paperButton, setPaperButtonEnabled } from './ArtSurface';
import { DocumentPanel } from './DocumentPanel';

// Only an already-read recollection and the current gated record are shown.
// A missing presentation source falls back to the current original text.
export class MemoryComparisonPanel {
  show(root: Node, node: InteractionStoryNode, recallRead: boolean, done: () => void, offset: number,
    changed: (offset: number) => void, initiallyOpen: boolean, opened: () => void): void {
    objectPaper(root);
    const folder = artSurface(root, 'archive_folder_v1', 0, 170, 900, 530);
    const finish = paperButton(root, '放回去', -650, done); setPaperButtonEnabled(finish, false);
    const display = (recall?: string) => {
      if (!isValid(root, true)) return;
      new DocumentPanel().show(root, node.text, offset, changed, () => setPaperButtonEnabled(finish, true),
        { height: 1110, y: 0, recall });
      if (!node.requireReadToEnd) setPaperButtonEnabled(finish, true);
    };
    const show = () => {
      open.node.active = false; folder.active = false; opened();
      if (!recallRead) { display(); return; }
      resources.load('data/story/chapter08/ep05_put_back', JsonAsset, (error, asset) => {
        if (!isValid(root, true)) return;
        const source = !error && asset ? (asset.json as EpisodeData).nodes?.find(n => n.id === 'CH08_EP05_N001') as PassageStoryNode | undefined : undefined;
        const paragraph = source?.paragraphs?.[2]?.text;
        display(paragraph ? paragraph.split('。')[0] + '。' : undefined);
      });
    };
    const open = paperButton(root, node.actionText ?? '查看', -470, show);
    if (initiallyOpen) show();
  }
}
