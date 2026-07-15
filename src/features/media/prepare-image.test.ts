import { describe, expect, it, vi } from "vitest";
import { prepareImage } from "./prepare-image";
import { validateMedia } from "./media-schema";

describe("media preparation", () => {
  it("rejects oversized decoded dimensions", () => {
    expect(validateMedia({
      mimeType: "image/png",
      width: 12_000,
      height: 8_000,
      bytes: 2_000_000
    })).toEqual({ ok: false, code: "IMAGE_DIMENSIONS_TOO_LARGE" });
  });

  it("resizes the longest edge to 2048 pixels", async () => {
    const encode = vi.fn().mockResolvedValue(new Blob(["small"], { type: "image/jpeg" }));
    const result = await prepareImage(
      new Blob(["image"], { type: "image/png" }),
      {
        decode: vi.fn().mockResolvedValue({
          width: 4096,
          height: 2048,
          source: {} as CanvasImageSource
        }),
        encode
      }
    );

    expect(encode).toHaveBeenCalledWith(expect.anything(), 2048, 1024, 0.9);
    expect(result).toMatchObject({ width: 2048, height: 1024, quality: 0.9 });
  });
});
