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

it("accepts a visible thumbnail while rejecting a small icon", () => {
  const thumbnail = document.createElement("img");
  thumbnail.src = "https://example.com/thumbnail.jpg";
  const icon = document.createElement("img");
  icon.src = "https://example.com/icon.png";
  document.body.append(thumbnail, icon);
  vi.spyOn(thumbnail, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 64,
    bottom: 64,
    width: 64,
    height: 64,
    toJSON: () => ({})
  });
  vi.spyOn(icon, "getBoundingClientRect").mockReturnValue({
    x: 80,
    y: 0,
    top: 0,
    left: 80,
    right: 112,
    bottom: 32,
    width: 32,
    height: 32,
    toJSON: () => ({})
  });

  expect(findBestPageImage(thumbnail, { clientX: 20, clientY: 20 })).toBe(thumbnail);
  expect(findBestPageImage(icon, { clientX: 90, clientY: 10 })).toBeNull();
});
