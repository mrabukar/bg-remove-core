import type { ValidationResult } from "./types";

export const DEFAULT_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const DEFAULT_ACCEPTED_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export interface ValidateFileOptions {
  readonly maxSizeBytes?: number;
  readonly acceptedTypes?: ReadonlySet<string>;
}

export function validateImageFile(
  file: File,
  options: ValidateFileOptions = {}
): ValidationResult {
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
  const acceptedTypes = options.acceptedTypes ?? DEFAULT_ACCEPTED_TYPES;

  if (!acceptedTypes.has(file.type)) {
    return {
      valid: false,
      errorMessage: "Unsupported file type. Please upload a PNG, JPG, or WEBP image.",
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      errorMessage: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${(
        maxSizeBytes /
        1024 /
        1024
      ).toFixed(0)} MB.`,
    };
  }

  return { valid: true, errorMessage: "" };
}
