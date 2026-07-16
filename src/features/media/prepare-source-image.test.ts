import { describe, expect, it, vi } from "vitest";
import type { WorkbenchSource } from "../workbench/workbench-types";
import { prepareSourceImage } from "./prepare-source-image";

const source: WorkbenchSource = {
  sourceType: "image",
  previewUrl: "https://images.test/source.png",
  imageDataUrl: "",
  sourceUrl: "https://images.test/source.png",
  pageUrl: "https://site.test/page",
  pageTitle: "Page"
};

describe("prepareSourceImage", () => {
  it("converts remote page images to a compressed data URL for auto transport", async () => {
    const inputBlob = new Blob(["image"], { type: "image/png" });
    const fetchImpl = vi.fn(() => Promise.resolve({
      ok: true,
      status: 200,
      blob: () => Promise.resolve(inputBlob)
    } as Response)) as unknown as typeof fetch;
    const encode = vi.fn().mockResolvedValue(new Blob(["jpeg"], { type: "image/jpeg" }));

    const result = await prepareSourceImage(source, "auto", {
      fetchImpl,
      adapter: {
        decode: vi.fn().mockResolvedValue({
          width: 1200,
          height: 800,
          source: {} as CanvasImageSource
        }),
        encode
      },
      toDataUrl: vi.fn().mockResolvedValue("data:image/jpeg;base64,abc")
    });

    expect(fetchImpl).toHaveBeenCalledWith(source.sourceUrl, {
      credentials: "omit",
      cache: "force-cache"
    });
    expect(result.imageDataUrl).toBe("data:image/jpeg;base64,abc");
  });

  it("keeps the original URL when source URL transport is requested", async () => {
    expect(await prepareSourceImage(source, "source_url")).toBe(source);
  });
});
