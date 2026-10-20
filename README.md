# bg-remove-core

Browser-side AI image background removal for JavaScript and TypeScript using ONNX Runtime, WebAssembly and optional WebGPU. Process images locally without uploading them to a server.

Extracted from the [CutOut](https://github.com/mrabukar/bg-remover) app.

## Install

```bash
npm install bg-remove-core
```

## API

```ts
import {
  detectTransparentBackground,
  removeBackground,
  validateImageFile,
} from "bg-remove-core";

const validation = validateImageFile(file); // { valid, errorMessage }
if (!validation.valid) {
  // show validation.errorMessage
}

const transparency = await detectTransparentBackground(file);
if (transparency.hasTransparentBackground) {
  // Already a cutout. clearFraction is 0..1.
  // Skip removeBackground, or call it anyway.
}

const resultBlob: Blob = await removeBackground(file, {
  onProgress: ({ stage, fraction }) => {
    // stage: "fetching-model" | "processing" | "unknown"
    // fraction: 0..1 within that stage
  },
});

const url = URL.createObjectURL(resultBlob); // PNG with transparent background
```

`removeBackground(file, options?)` accepts a `File` or `Blob` and resolves to
a PNG `Blob` with the background removed. `validateImageFile(file, options?)`
checks MIME type (`image/png|jpeg|webp|gif` by default) and size (20 MB
default max) before you bother processing.

`detectTransparentBackground(file)` resolves to
`{ hasTransparentBackground, clearFraction }`. JPEG is always opaque. PNG,
WebP, and GIF are decoded in the browser and sampled down to a 128-pixel
edge. `hasTransparentBackground` is true when at least 2% of those pixels
have alpha below 32. A white backdrop or a checkerboard painted into the
pixels is still opaque. This does not run the removal model, and
`removeBackground` does not call it.

## Browser requirements

This library needs, in the consuming app:

- **Secure context** (HTTPS or `localhost`) — required for `SharedArrayBuffer`.
- **COOP/COEP headers** on the pages that use it:
  ```
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  ```
  (see `examples/demo-nextjs-app/next.config.ts` in this repo for a working
  example).
- A CSP that allows `connect-src https://staticimgly.com` if you set a strict
  CSP — the model/WASM weights (~40–80 MB) are fetched from that CDN on first
  use, then cached by the browser.

No environment variables, API keys, or server endpoints are required.

## Local development

```bash
npm install
npm run build        # tsc build + type emit
npm run type-check
```

See `examples/demo-nextjs-app` for a separate Next.js app that consumes the
published package (`npm install` inside that folder, then `npm run dev`).
