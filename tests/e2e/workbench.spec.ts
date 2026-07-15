import fs from "node:fs/promises";
import { configureFixtureApi, injectAndOpenImage } from "./helpers";
import { expect, test } from "./extension.fixture";

test("analyzes an image, docks without losing the result, and records history", async ({
  page,
  serviceWorker
}) => {
  await configureFixtureApi(serviceWorker);
  await page.goto("http://127.0.0.1:43118/");
  await injectAndOpenImage(page, serviceWorker);

  const shell = page.getByTestId("workbench-shell");
  await expect(shell.getByText("视觉分析", { exact: true })).toBeVisible();
  await expect(shell.getByText("视觉分析扩展测试页", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "开始分析" }).click();
  await expect(page.getByText("测试分析结果：主体居中，冷灰背景，柔和侧光。")).toBeVisible();

  await page.getByRole("button", { name: "停靠到右侧" }).click();
  await expect(shell).toHaveAttribute("data-mode", "dock");
  await expect(page.getByText("测试分析结果：主体居中，冷灰背景，柔和侧光。")).toBeVisible();
  await fs.mkdir("output/playwright", { recursive: true });
  await page.screenshot({
    path: "output/playwright/workbench-docked.png",
    fullPage: false
  });

  await page.getByRole("button", { name: "分析历史" }).click();
  await expect(page.getByRole("region", { name: "分析历史" })).toBeVisible();
  await expect(page.getByText("fixture-vision").first()).toBeVisible();

  await page.getByRole("button", { name: "关闭历史" }).click();
  await page.setViewportSize({ width: 760, height: 800 });
  const narrowBox = await shell.boundingBox();
  if (!narrowBox) {
    throw new Error("Workbench is not visible at narrow viewport");
  }
  expect(narrowBox.x).toBeGreaterThanOrEqual(0);
  expect(narrowBox.width).toBeLessThanOrEqual(760);
  await page.screenshot({
    path: "output/playwright/workbench-narrow.png",
    fullPage: false
  });

  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(shell).toBeVisible();
  await page.screenshot({
    path: "output/playwright/workbench-wide.png",
    fullPage: false
  });
});

test("opens the extension options page", async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.getByRole("heading", { name: "模型与接口" })).toBeVisible();
  await page.getByRole("button", { name: "提示词模板" }).click();
  await expect(page.getByText("通用图片反推").first()).toBeVisible();
  await fs.mkdir("output/playwright", { recursive: true });
  await page.screenshot({
    path: "output/playwright/options-prompts.png",
    fullPage: false
  });
});
