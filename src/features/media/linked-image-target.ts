import { isEligiblePageImage } from "./page-image-target";

export function findLinkedPageImage(linkUrl: string): HTMLImageElement | null {
  let normalizedUrl: string;
  try {
    normalizedUrl = new URL(linkUrl, location.href).href;
  } catch {
    return null;
  }

  let bestImage: HTMLImageElement | null = null;
  let bestArea = -1;
  for (const link of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    if (link.href !== normalizedUrl) {
      continue;
    }
    for (const image of link.querySelectorAll<HTMLImageElement>("img")) {
      if (!isEligiblePageImage(image)) {
        continue;
      }
      const rect = image.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > bestArea) {
        bestArea = area;
        bestImage = image;
      }
    }
  }
  return bestImage;
}
