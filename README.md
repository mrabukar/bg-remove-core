# @mrabukar/bg-remove-core

Framework-independent, browser-side background removal, extracted from the
[CutOut](https://github.com/mrabukar/bg-remover) app. Runs ONNX inference
entirely in the browser (WASM / optionally WebGPU) — **no server, no upload
of the user's image.**

## Install

```bash
npm install @mrabukar/bg-remove-core
```

## API

```ts
import { removeBackground, validateImageFile } from "@mrabukar/bg-remove-core";

const validation = validateImageFile(file); // { valid, errorMessage }
if (!validation.valid) {
  // show validation.errorMessage
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
