"use client";

import { useEffect, useRef, useState } from "react";
import {
  detectTransparentBackground,
  removeBackground,
  validateImageFile,
  type ProgressStage,
} from "bg-remove-core";

/**
 * Stand-in for this project's existing upload handler (e.g. a call to its
 * own backend, S3, a form action, etc.). In a real project this already
 * exists — integration only wraps the file it receives.
 */
async function existingSaveImage(file: Blob): Promise<string> {
  return URL.createObjectURL(file);
}

type Status = "idle" | "checking" | "clear" | "working" | "done" | "error";

const STEPS: Array<{ id: ProgressStage; label: string }> = [
  { id: "fetching-model", label: "Downloading the background remover" },
  { id: "processing", label: "Cutting the subject" },
];

function stepState(step: ProgressStage, current: ProgressStage | null): "pending" | "active" | "done" {
  if (current === "processing" && step === "fetching-model") return "done";
  if (current === step) return "active";
  if (current === "unknown" && step === "processing") return "active";
  return "pending";
}

export default function DemoUploadPage(): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);
  const dragDepth = useRef(0);
  const focusOnIdle = useRef(false);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [stage, setStage] = useState<ProgressStage | null>(null);
  const [fraction, setFraction] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState(62);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    if (status === "idle" && focusOnIdle.current) {
      focusOnIdle.current = false;
      inputRef.current?.focus();
    }
  }, [status]);

  function track(url: string): string {
    urlsRef.current.push(url);
    return url;
  }

  function releaseUrls(): void {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.length = 0;
  }

  function reset(): void {
    focusOnIdle.current = true;
    releaseUrls();
    setStatus("idle");
    setError("");
    setStage(null);
    setFraction(0);
    setOriginalUrl(null);
    setResultUrl(null);
    setPendingFile(null);
    setPosition(62);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFileSelected(file: File): Promise<void> {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setStatus("error");
      setError(validation.errorMessage);
      setOriginalUrl(null);
      setResultUrl(null);
      return;
    }

    setError("");
    releaseUrls();
    setPendingFile(file);
    setOriginalUrl(track(URL.createObjectURL(file)));
    setResultUrl(null);
    setStatus("checking");

    try {
      const transparency = await detectTransparentBackground(file);
      if (transparency.hasTransparentBackground) {
        setStatus("clear");
        return;
      }
      await runRemoval(file);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function runRemoval(file: File): Promise<void> {
    setError("");
    setStatus("working");
    setStage("fetching-model");
    setFraction(0);

    try {
      const transparentPng = await removeBackground(file, {
        onProgress: ({ stage: nextStage, fraction: nextFraction }) => {
          setStage(nextStage);
          setFraction(nextFraction);
        },
      });

      const url = await existingSaveImage(transparentPng);
      setResultUrl(track(url));
      setPosition(62);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file && status !== "working" && status !== "checking") void handleFileSelected(file);
  }

  function onDrop(event: React.DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && status !== "working" && status !== "checking") void handleFileSelected(file);
  }

  const showDrop = status === "idle" || (status === "error" && !originalUrl);
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1 className="wordmark">bg-remove-core</h1>
          <p className="promise">Runs in this tab. Nothing is uploaded.</p>
        </div>
        <nav className="nav" aria-label="Package">
          <a href="https://www.npmjs.com/package/bg-remove-core">npm</a>
          <a href="https://github.com/mrabukar/bg-remove-core">GitHub</a>
        </nav>
      </header>

      <main className="studio">
        <section className="frame" aria-label="Image stage">
          {showDrop && (
            <label
              className="drop"
              data-drag={dragging ? "true" : "false"}
              onDragEnter={(event) => {
                event.preventDefault();
                dragDepth.current += 1;
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => {
                dragDepth.current -= 1;
                if (dragDepth.current <= 0) {
                  dragDepth.current = 0;
                  setDragging(false);
                }
              }}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                className="file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={onInputChange}
              />
              <svg className="drop-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                <path d="M7 16l3.2-3.2a1 1 0 0 1 1.4 0L17 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <h2>Drop a portrait, product, or pet.</h2>
              <span className="choose">Choose an image</span>
            </label>
          )}

          {(status === "checking" || status === "working") && originalUrl && (
            <div className="preview">
              <img src={originalUrl} alt="Original image, background still in place" />
            </div>
          )}

          {status === "clear" && originalUrl && (
            <div className="preview checkerboard">
              <img src={originalUrl} alt="Image that already has a transparent background" />
            </div>
          )}

          {status === "error" && originalUrl && (
            <div className="preview">
              <img src={originalUrl} alt="Original image" />
            </div>
          )}

          {status === "done" && originalUrl && resultUrl && (
            <div className="compare" style={{ ["--pos" as string]: position }}>
              <img className="before" src={originalUrl} alt="Original photograph" />
              <div className="after checkerboard">
                <img src={resultUrl} alt="Photograph with the background removed" />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={position}
                aria-label="Compare original and cutout"
                onChange={(event) => setPosition(Number(event.target.value))}
              />
              <div className="handle" />
              <p className="compare-caption">Drag to compare</p>
            </div>
          )}
        </section>

        <div className="status">
          {status === "checking" && <p className="notice">Checking for a transparent background.</p>}

          {status === "clear" && (
            <p className="notice">This image already has a transparent background.</p>
          )}

          {status === "working" && (
            <>
              <ol className="steps">
                {STEPS.map((step) => (
                  <li key={step.id} data-state={stepState(step.id, stage)}>
                    <span className="dot" aria-hidden="true" />
                    {step.label}
                  </li>
                ))}
              </ol>
              {stage === "fetching-model" && (
                <p className="hint">The first photo downloads it, about 40–80 MB. This browser keeps it after that.</p>
              )}
              <div
                className="bar"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label={STEPS.find((step) => step.id === stage)?.label ?? "Working"}
              >
                <div className="bar-fill" style={{ width: `${percent}%` }} />
              </div>
            </>
          )}

          {status === "error" && error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          {(status === "done" || status === "clear" || (status === "error" && originalUrl)) && (
            <div className="actions">
              {status === "done" && resultUrl && (
                <a className="button button-primary" href={resultUrl} download="cutout.png">
                  Download PNG
                </a>
              )}
              {status === "clear" && originalUrl && (
                <a className="button button-primary" href={originalUrl} download={pendingFile?.name || "cutout.png"}>
                  Download image
                </a>
              )}
              {status === "clear" && pendingFile && (
                <button type="button" className="button" onClick={() => void runRemoval(pendingFile)}>
                  Remove anyway
                </button>
              )}
              <button type="button" className="button" onClick={reset}>
                Try another
              </button>
            </div>
          )}
        </div>

        <ul className="facts">
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3l7 3v6c0 4.2-2.8 7.4-7 8.5C7.8 19.4 5 16.2 5 12V6l7-3z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span>On this device</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="4" width="7" height="7" fill="currentColor" />
              <rect x="13" y="4" width="7" height="7" fill="currentColor" opacity="0.35" />
              <rect x="4" y="13" width="7" height="7" fill="currentColor" opacity="0.35" />
              <rect x="13" y="13" width="7" height="7" fill="currentColor" />
            </svg>
            <span>Transparent PNG</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span>PNG, JPEG, WebP, GIF, up to 20 MB</span>
          </li>
        </ul>
      </main>
    </div>
  );
}
