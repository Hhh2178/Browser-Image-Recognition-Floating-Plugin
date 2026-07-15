import { expect, it } from "vitest";
import { CONTEXT_MENU_DEFINITIONS, PICK_MENU_ID } from "./context-menu-definitions";

it("offers page image selection for links such as image-grid cards", () => {
  const picker = CONTEXT_MENU_DEFINITIONS.find((item) => item.id === PICK_MENU_ID);

  expect(picker?.contexts).toEqual(["page", "link"]);
});
