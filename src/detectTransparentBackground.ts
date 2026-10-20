import type { TransparencyReport } from "./types";

/** Sampled pixels at or below this alpha count as clear. */
const CLEAR_ALPHA = 32;

/** A cutout, not a stray transparent pixel. */
const CLEAR_FRACTION = 0.02;

/** Longest edge of the sample. Large photos are not read in full. */
const SAMPLE_EDGE = 128;

/**
 * Reports whether an image already has a transparent background.
 *
 * JPEG is always opaque. PNG, WebP, and GIF are decoded in the browser and
 * sampled. A white backdrop or a checkerboard painted into the pixels is
 * opaque, so those stay false. Does not run the removal model.
 */
export async function detectTransparentBackground(file: Blob): Promise<TransparencyReport> {
  if (file.type === "image/jpeg") {
    return { hasTransparentBackground: false, clearFraction: 0 };
  }

  const bitmap = await decodeImage(file);
  try {
    const clearFraction = clearFractionOf(samplePixels(bitmap));
    return {
      hasTransparentBackground: clearFraction >= CLEAR_FRACTION,
      clearFraction,
    };
  } finally {
    bitmap.close();
  }
}

async function decodeImage(file: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== "function") {
    throw new Error("detectTransparentBackground requires createImageBitmap in a browser.");
  }
  return createImageBitmap(file);
}

function samplePixels(bitmap: ImageBitmap): Uint8ClampedArray {
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > SAMPLE_EDGE ? SAMPLE_EDGE / longest : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const context = drawingContext(width, height);

  context.imageSmoothingEnabled = false;
  context.drawImage(bitmap, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}

function drawingContext(
  width: number,
  height: number
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  if (typeof OffscreenCanvas === "function") {
    const context = new OffscreenCanvas(width, height).getContext("2d", { willReadFrequently: true });
    if (context) return context;
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) return context;
  }

  throw new Error("detectTransparentBackground could not read image pixels.");
}

function clearFractionOf(pixels: Uint8ClampedArray): number {
  const count = pixels.length / 4;
  if (count === 0) return 0;

  let clear = 0;
  for (let index = 3; index < pixels.length; index += 4) {
    const alpha = pixels[index];
    if (alpha !== undefined && alpha < CLEAR_ALPHA) clear += 1;
  }
  return clear / count;
}
