import { expect, it, vi } from "vitest";
import { findLinkedPageImage } from "./linked-image-target";

it("finds the visible thumbnail inside the context-menu link", () => {
  const link = document.createElement("a");
  link.href = "https://example.com/pin/123";
  const thumbnail = document.createElement("img");
  thumbnail.src = "https://example.com/thumb.jpg";
  link.append(thumbnail);
  document.body.append(link);
  vi.spyOn(thumbnail, "getBoundingClientRect").mockReturnValue({
    x: 10,
    y: 10,
    top: 10,
    left: 10,
    right: 210,
    bottom: 310,
    width: 200,
    height: 300,
    toJSON: () => ({})
  });

  expect(findLinkedPageImage("https://example.com/pin/123")).toBe(thumbnail);
});

it("does not mistake a small linked icon for content", () => {
  const link = document.createElement("a");
  link.href = "https://example.com/profile";
  const icon = document.createElement("img");
  icon.src = "https://example.com/avatar.jpg";
  link.append(icon);
  document.body.append(link);
  vi.spyOn(icon, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 32,
    bottom: 32,
    width: 32,
    height: 32,
    toJSON: () => ({})
  });

  expect(findLinkedPageImage("https://example.com/profile")).toBeNull();
});
