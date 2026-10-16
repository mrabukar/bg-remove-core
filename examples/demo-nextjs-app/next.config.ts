import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for bg-remove-core (ONNX Runtime Web / SharedArrayBuffer)
  async headers(): Promise<
    Array<{ source: string; headers: Array<{ key: string; value: string }> }>
  > {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
