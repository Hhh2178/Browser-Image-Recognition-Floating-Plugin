import type { ImageTransport } from "../settings/settings-schema";
import type { WorkbenchSource } from "../workbench/workbench-types";
import { browserCanvasAdapter, type CanvasAdapter } from "./canvas-adapter";
import { blobToDataUrl, prepareImage } from "./prepare-image";

interface PrepareSourceDependencies {
  fetchImpl?: typeof fetch;
  adapter?: CanvasAdapter;
  toDataUrl?: (blob: Blob) => Promise<string>;
}

export async function prepareSourceImage(
  source: WorkbenchSource,
  imageTransport: ImageTransport,
  dependencies: PrepareSourceDependencies = {}
): Promise<WorkbenchSource> {
  if (
    source.sourceType !== "image"
    || source.imageDataUrl
    || imageTransport === "source_url"
    || imageTransport === "text_only"
  ) {
    return source;
  }
  if (!source.sourceUrl) {
    throw new Error("当前图片没有可读取的源地址，请重新选择图片。");
  }

  let response: Response;
  try {
    response = await (dependencies.fetchImpl ?? fetch)(source.sourceUrl, {
      credentials: "omit",
      cache: "force-cache"
    });
  } catch {
    throw new Error("无法读取网页图片，请打开原图后重试，或将图片传输改为源地址。");
  }
  if (!response.ok) {
    throw new Error(`网页图片读取失败：HTTP ${response.status}`);
  }

  const prepared = await prepareImage(
    await response.blob(),
    dependencies.adapter ?? browserCanvasAdapter
  );
  const imageDataUrl = await (dependencies.toDataUrl ?? blobToDataUrl)(prepared.blob);
  return { ...source, imageDataUrl };
}
