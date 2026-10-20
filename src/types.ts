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

export interface TransparencyReport {
  /** True when at least 2% of sampled pixels are nearly clear (alpha below 32). */
  readonly hasTransparentBackground: boolean;
  /** Share of sampled pixels with alpha below 32, from 0 to 1. */
  readonly clearFraction: number;
}
