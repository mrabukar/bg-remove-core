import type { ProgressInfo, RemoveBackgroundOptions } from "./types";

function toStage(key: string): ProgressInfo["stage"] {
  if (key.includes("fetch")) return "fetching-model";
  if (key.includes("inference")) return "processing";
  return "unknown";
}

/**
 * Removes the background from an image entirely in the browser (ONNX/WASM
 * inference via @imgly/background-removal). The image never leaves the
 * client. Must run in a browser with SharedArrayBuffer available
 * (COOP: same-origin / COEP: require-corp headers, secure context).
 */
export async function removeBackground(
  file: File | Blob,
  options: RemoveBackgroundOptions = {},
): Promise<Blob> {
  const { onProgress } = options;

  // Dynamic import keeps the heavy ONNX/WASM bundle out of callers' initial chunk.
  const { removeBackground: imglyRemoveBackground } =
    await import("@imgly/background-removal");

  return imglyRemoveBackground(file, {
    progress: (key: string, current: number, total: number): void => {
      if (!onProgress) return;
      const fraction = total > 0 ? current / total : 0;
      onProgress({ stage: toStage(key), fraction, key });
    },
  });
}
