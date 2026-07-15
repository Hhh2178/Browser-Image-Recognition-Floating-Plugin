import type { CanvasAdapter } from "./canvas-adapter";
import { validateMedia } from "./media-schema";

const MAX_EDGE = 2048;
const MAX_BYTES = 4_000_000;

export async function prepareImage(input: Blob, adapter: CanvasAdapter) {
  const decoded = await adapter.decode(input);
  const validation = validateMedia({
    mimeType: input.type,
    width: decoded.width,
    height: decoded.height,
    bytes: input.size
  });
  if (!validation.ok) {
    throw Object.assign(new Error(validation.code), { code: validation.code });
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height));
  const width = Math.round(decoded.width * scale);
  const height = Math.round(decoded.height * scale);

  for (const quality of [0.9, 0.8, 0.7, 0.6]) {
    const blob = await adapter.encode(decoded.source, width, height, quality);
    if (blob.size <= MAX_BYTES) {
      return { blob, width, height, quality };
    }
  }

  throw Object.assign(
    new Error("压缩后的图片仍超过 4 MB"),
    { code: "IMAGE_ENCODE_TOO_LARGE" }
  );
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("图片读取结果不是 Data URL"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("图片读取失败"));
    reader.readAsDataURL(blob);
  });
}
