import type { PlatformService, CloudSaveResult, RewardedAdResult } from './PlatformService';

export class LocalPlatform implements PlatformService {
  readonly name = 'local';

  async initialize(): Promise<void> {}

  isLoggedIn(): boolean {
    return false;
  }

  async login(): Promise<boolean> {
    return false;
  }

  async saveCloud(_payload: string): Promise<CloudSaveResult> {
    return { ok: false, message: 'Cloud save unavailable in local mode.' };
  }

  async loadCloud(): Promise<string | null> {
    return null;
  }

  async showRewardedAd(_placementId: string): Promise<RewardedAdResult> {
    return {
      success: false,
      isEnded: false,
      message: 'Rewarded ads are disabled in local mode.',
    };
  }
}
