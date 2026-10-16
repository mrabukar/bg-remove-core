export type ProgressStage = "fetching-model" | "processing" | "unknown";

export interface ProgressInfo {
  readonly stage: ProgressStage;
  /** 0..1 completion fraction within the current stage. */
  readonly fraction: number;
  /** Raw progress key reported by the underlying engine, for callers that need it. */
  readonly key: string;
}

export interface RemoveBackgroundOptions {
  readonly onProgress?: (progress: ProgressInfo) => void;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errorMessage: string;
}
