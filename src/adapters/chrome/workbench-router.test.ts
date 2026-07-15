import { expect, it, vi } from "vitest";
import { createWorkbenchRouter } from "./workbench-router";

it("normalizes an image context menu event", async () => {
  const send = vi.fn().mockResolvedValue(undefined);
  const router = createWorkbenchRouter({ ensureAndSend: send });

  await router.openImage({
    tabId: 7,
    sourceUrl: "https://site.test/photo.jpg",
    pageUrl: "https://site.test/",
    pageTitle: "Fixture"
  });

  expect(send).toHaveBeenCalledWith(7, {
    type: "workbench/open",
    payload: {
      sourceType: "image",
      sourceUrl: "https://site.test/photo.jpg",
      pageUrl: "https://site.test/",
      pageTitle: "Fixture"
    }
  });
});
