# @mrabukar/bg-remove-core

Framework-independent, browser-side background removal, extracted from the
[CutOut](https://github.com/mrabukar/bg-remover) app. Runs ONNX inference entirely in the browser via
[`@imgly/background-removal`](https://www.npmjs.com/package/@imgly/background-removal)
(WASM / optionally WebGPU) — **no server, no upload of the user's image.**

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
- A CSP that allows `connect-src https://staticimgly.com` (or your own
  self-hosted copy of the model/WASM assets) if you set a strict CSP — the
  library fetches ONNX/WASM weights (~40–80 MB) from IMG.LY's CDN on first
  use, cached by the browser afterward.

No environment variables, API keys, or server endpoints are required.

## Licensing — read before using this in another product

This package is licensed **AGPL-3.0-only** (see `LICENSE.md`), matching its
dependency [`@imgly/background-removal`](https://www.npmjs.com/package/@imgly/background-removal),
which is itself AGPL-3.0. That dependency is the actual background-removal
engine this package wraps.

What that means for you as a consumer:

- Using it **client-side, in a browser** — code shipped to the browser, the
  image processed on the user's own machine, nothing uploaded — carries the
  same posture as CutOut itself already has in production.
- If you plan to use this inside a **closed-source commercial product or a
  hosted service**, read AGPL-3.0 carefully (particularly its network-use
  clause) or talk to [IMG.LY](https://img.ly) about a commercial license for
  `@imgly/background-removal` — they explicitly offer one for this situation.
  This README is not legal advice.
- Do **not** wrap this package in a server/API that processes other people's
  images on your infrastructure without resolving the licensing question
  first — that is the scenario AGPL's network clause is specifically aimed at.

## Local development

```bash
npm install
npm run build        # tsc build + type emit
npm run type-check
```

See `examples/demo-nextjs-app` for a separate Next.js app that consumes the
published package (`npm install` inside that folder, then `npm run dev`).
