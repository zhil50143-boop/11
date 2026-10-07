import { sys } from 'cc';
import { GameConfig } from '../core/GameConfig';
import type { GameStateData } from '../core/GameState';
import { LocalSave } from './LocalSave';
export class SaveManager {
  private static local = new LocalSave(sys.localStorage, GameConfig.saveKey);
  static get warning(): string { return this.local.warning }
  static load(): GameStateData { return this.local.load() }
  static save(state: GameStateData): boolean { return this.local.save(state) }
  static clear(): boolean { return this.local.clear() }
}
