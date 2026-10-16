"use client";

import { useState } from "react";
import { removeBackground, validateImageFile } from "bg-remove-core";

/**
 * Stand-in for this project's *existing* upload handler (e.g. a call to its
 * own backend, S3, a form action, etc.). In a real project this already
 * exists — integration only wraps the file it receives.
 */
async function existingSaveImage(file: Blob): Promise<string> {
  return URL.createObjectURL(file);
}

export default function DemoUploadPage(): React.ReactElement {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  async function handleFileSelected(file: File): Promise<void> {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setStatus("error");
      setMessage(validation.errorMessage);
      return;
    }

    setStatus("working");
    setMessage("Removing background…");

    try {
      // New step inserted into the existing upload flow: strip the
      // background client-side before the file reaches the existing save step.
      const transparentPng = await removeBackground(file, {
        onProgress: ({ stage, fraction }) => {
          setMessage(`${stage} — ${Math.round(fraction * 100)}%`);
        },
      });

      const url = await existingSaveImage(transparentPng);
      setSavedUrl(url);
      setStatus("done");
      setMessage("Saved with transparent background.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Existing upload flow + @cutout/bg-remove-core</h1>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelected(file);
        }}
      />
      <p>{message}</p>
      {status === "done" && savedUrl && (
        <img src={savedUrl} alt="Background removed" style={{ maxWidth: 320 }} />
      )}
    </main>
  );
}
