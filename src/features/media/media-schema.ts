const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

export type MediaValidation =
  | { ok: true }
  | {
      ok: false;
      code:
        | "UNSUPPORTED_IMAGE_TYPE"
        | "IMAGE_DIMENSIONS_TOO_LARGE"
        | "IMAGE_FILE_TOO_LARGE";
    };

export function validateMedia(input: {
  mimeType: string;
  width: number;
  height: number;
  bytes: number;
}): MediaValidation {
  if (!SUPPORTED_MIME_TYPES.has(input.mimeType)) {
    return { ok: false, code: "UNSUPPORTED_IMAGE_TYPE" };
  }
  if (input.width * input.height > 40_000_000) {
    return { ok: false, code: "IMAGE_DIMENSIONS_TOO_LARGE" };
  }
  if (input.bytes > 20_000_000) {
    return { ok: false, code: "IMAGE_FILE_TOO_LARGE" };
  }
  return { ok: true };
}
