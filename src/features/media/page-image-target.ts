interface PointerLike {
  clientX?: number;
  clientY?: number;
  composedPath?: () => EventTarget[];
}

export function findBestPageImage(
  target: EventTarget | null,
  event: PointerLike
): HTMLImageElement | null {
  const pointerX = typeof event.clientX === "number" ? event.clientX : null;
  const pointerY = typeof event.clientY === "number" ? event.clientY : null;
  const candidates = collectImageCandidates(target, event, pointerX, pointerY);
  let bestImage: HTMLImageElement | null = null;
  let bestScore = -Infinity;

  for (const image of candidates) {
    if (!isEligiblePageImage(image)) {
      continue;
    }
    const rect = image.getBoundingClientRect();
    const containsPointer = pointerX !== null
      && pointerY !== null
      && pointerX >= rect.left
      && pointerX <= rect.right
      && pointerY >= rect.top
      && pointerY <= rect.bottom;
    const score = (containsPointer ? 1_000_000 : 0) + rect.width * rect.height;
    if (score > bestScore) {
      bestScore = score;
      bestImage = image;
    }
  }

  return bestImage;
}

function collectImageCandidates(
  target: EventTarget | null,
  event: PointerLike,
  clientX: number | null,
  clientY: number | null
): HTMLImageElement[] {
  const candidates: HTMLImageElement[] = [];
  const seen = new Set<HTMLImageElement>();

  const pushImage = (value: Element | null | undefined) => {
    if (value instanceof HTMLImageElement && !seen.has(value)) {
      seen.add(value);
      candidates.push(value);
    }
  };
  const pushFromElement = (element: Element) => {
    pushImage(element);
    pushImage(element.closest("img"));
    pushImage(element.querySelector("img"));
  };

  if (target instanceof Element) {
    pushFromElement(target);
  }
  for (const value of event.composedPath?.() ?? []) {
    if (value instanceof Element) {
      pushFromElement(value);
    }
  }
  if (
    clientX !== null
    && clientY !== null
    && typeof document.elementsFromPoint === "function"
  ) {
    for (const element of document.elementsFromPoint(clientX, clientY)) {
      pushFromElement(element);
    }
  }

  return candidates;
}

function isEligiblePageImage(image: HTMLImageElement): boolean {
  if (!image.isConnected || !(image.currentSrc || image.src)) {
    return false;
  }
  const style = window.getComputedStyle(image);
  if (
    style.display === "none"
    || style.visibility === "hidden"
    || Number(style.opacity || 1) < 0.05
  ) {
    return false;
  }
  const rect = image.getBoundingClientRect();
  if (rect.width < 80 || rect.height < 60) {
    return false;
  }
  return !(
    rect.bottom < 0
    || rect.right < 0
    || rect.top > window.innerHeight
    || rect.left > window.innerWidth
  );
}
