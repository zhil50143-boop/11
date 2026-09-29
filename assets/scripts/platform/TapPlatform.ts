import type { PlatformService, CloudSaveResult, RewardedAdResult } from './PlatformService';

/**
 * Tap H5 adapter placeholder.
 * Do not let StoryManager depend on Tap APIs directly.
 * Fill concrete SDK calls only after the exact Tap H5 runtime API is verified.
 */
export class TapPlatform implements PlatformService {
  readonly name = 'tap';

  async initialize(): Promise<void> {
    // TODO: initialize verified Tap H5 SDK here.
  }

  isLoggedIn(): boolean {
    return false;
  }

  async login(): Promise<boolean> {
    // TODO: verified Tap login implementation.
    return false;
  }

  async saveCloud(_payload: string): Promise<CloudSaveResult> {
    // TODO: write local first, then sync cloud with throttling.
    return { ok: false, message: 'Tap cloud save not connected yet.' };
  }

  async loadCloud(): Promise<string | null> {
    return null;
  }

  async showRewardedAd(_placementId: string): Promise<RewardedAdResult> {
    // Reward only after the platform confirms complete viewing.
    return { success: false, isEnded: false, message: 'Tap rewarded ad not connected yet.' };
  }
}
