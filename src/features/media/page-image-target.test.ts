import { expect, it, vi } from "vitest";
import { findBestPageImage } from "./page-image-target";

it("finds an image behind an overlay element", () => {
  const card = document.createElement("div");
  const image = document.createElement("img");
  image.src = "https://example.com/image.jpg";
  card.append(image);
  document.body.append(card);
  vi.spyOn(image, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 320,
    bottom: 240,
    width: 320,
    height: 240,
    toJSON: () => ({})
  });

  const result = findBestPageImage(card, {
    clientX: 100,
    clientY: 100,
    composedPath: () => [card, image]
  });

  expect(result).toBe(image);
});
