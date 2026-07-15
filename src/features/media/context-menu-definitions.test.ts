import { expect, it } from "vitest";
import { CONTEXT_MENU_DEFINITIONS, IMAGE_MENU_ID } from "./context-menu-definitions";

it("offers one floating-window command for images and linked thumbnails", () => {
  const analyze = CONTEXT_MENU_DEFINITIONS.find((item) => item.id === IMAGE_MENU_ID);

  expect(CONTEXT_MENU_DEFINITIONS).toHaveLength(1);
  expect(analyze?.title).toBe("Hhh：悬浮窗分析图片");
  expect(analyze?.contexts).toEqual(["image", "link"]);
});
