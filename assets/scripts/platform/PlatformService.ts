export interface CloudSaveResult {
  ok: boolean;
  message?: string;
}

export interface RewardedAdResult {
  success: boolean;
  isEnded: boolean;
  message?: string;
}

export interface PlatformService {
  readonly name: string;
  initialize(): Promise<void>;
  isLoggedIn(): boolean;
  login(): Promise<boolean>;
  saveCloud(payload: string): Promise<CloudSaveResult>;
  loadCloud(): Promise<string | null>;
  showRewardedAd(placementId: string): Promise<RewardedAdResult>;
}
