import { Node, JsonAsset, resources, isValid } from 'cc';
import type { GameStateData } from '../core/GameState';
import type { EpisodeData, InteractionStoryNode } from '../story/StoryNode';
import { container, clear, text } from './UIFactory';
import { objectPaper } from './ObjectSurface';
import { artSurface, paperButton } from './ArtSurface';
import { ReadingSettings } from './ReadingSettings';
import { PhotoViewer } from './PhotoViewer';
import { albumPhotos } from '../story/PhotoCatalog';

// Only completed photo interactions in this round are available. No StoryManager,
// save action, evidence mutation or unlock is invoked by a lookback.
export class PhotoAlbum {
  private offsets: Record<string, number> = {};
  show(canvas: Node, state: GameStateData, close: () => void): void {
    clear(canvas);
    const page = container(canvas, 'PhotoAlbum'); objectPaper(page);
    text(page, '相册', 760, 90, 52).color = ReadingSettings.ink;
    artSurface(page, 'album_v1', 0, 520, 450, 280);
    const available = albumPhotos.filter(photo => state.flags[photo.flag] === true);
    if (!available.length) text(page, '还没有放进来的照片。', 100, 180, ReadingSettings.bodySize(46)).color = ReadingSettings.ink;
    available.forEach((photo, index) => paperButton(page, photo.title, 240 - index * 190, () => {
      clear(canvas);
      const viewer = container(canvas, 'AlbumPhoto'); objectPaper(viewer);
      const message = text(viewer, '正在打开……', 100, 180, ReadingSettings.bodySize(46)); message.color = ReadingSettings.ink;
      const back = paperButton(viewer, '返回相册', -650, () => this.show(canvas, state, close));
      resources.load(photo.resource, JsonAsset, (error, asset) => {
        if (!isValid(viewer, true)) return;
        const node = !error && asset ? (asset.json as EpisodeData).nodes?.find(n => n.id === photo.node) : undefined;
        if (!node || node.type !== 'photo') { message.string = '这张照片暂时没能打开，请稍后再看。'; return; }
        message.node.destroy(); back.node.destroy();
        new PhotoViewer().show(viewer, node as InteractionStoryNode, () => this.show(canvas, state, close), false, () => {},
          { offset: this.offsets[node.id] ?? 0, changed: offset => { this.offsets[node.id] = offset; }, readOnly: true });
      });
    }));
    paperButton(page, '返回书桌', -835, close);
  }
}
