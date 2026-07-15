import fs from "node:fs/promises";
import {
  configureFixtureApi,
  injectAndOpenImage,
  injectAndOpenLinkedImage,
  injectAndOpenScreenshot,
  injectAndShowWorkbench
} from "./helpers";
import { expect, test } from "./extension.fixture";

test("analyzes an image in a floating window and records history", async ({
  page,
  serviceWorker
}) => {
  await configureFixtureApi(serviceWorker);
  await page.goto("http://127.0.0.1:43118/");
  await injectAndOpenImage(page, serviceWorker);

  const shell = page.getByTestId("workbench-shell");
  await expect(shell.getByText("视觉分析", { exact: true })).toBeVisible();
  await expect(shell.getByText("视觉分析扩展测试页", { exact: true })).toBeVisible();
  await expect(shell).toHaveCSS("position", "fixed");
  const initialBox = await shell.boundingBox();
  if (!initialBox) {
    throw new Error("Floating workbench is not visible");
  }
  expect(initialBox.width).toBeGreaterThan(360);
  expect(initialBox.x).toBeGreaterThanOrEqual(0);
  expect(initialBox.y).toBeGreaterThanOrEqual(0);
  expect(initialBox.x + initialBox.width).toBeLessThanOrEqual(1440);
  expect(initialBox.y + initialBox.height).toBeLessThanOrEqual(900);
  await page.getByRole("button", { name: "开始分析" }).click();
  await expect(page.getByText("测试分析结果：主体居中，冷灰背景，柔和侧光。")).toBeVisible();

  await expect(page.getByRole("button", { name: "停靠到右侧" })).toHaveCount(0);
  await expect(page.getByText("测试分析结果：主体居中，冷灰背景，柔和侧光。")).toBeVisible();
  await fs.mkdir("output/playwright", { recursive: true });
  await page.screenshot({
    path: "output/playwright/workbench-floating.png",
    fullPage: false
  });

  await page.getByRole("button", { name: "分析历史" }).click();
  const historyRegion = page.getByRole("region", { name: "分析历史" });
  await expect(historyRegion).toBeVisible();
  await expect(historyRegion.getByText("fixture-vision").first()).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "删除历史记录" }).click();
  await expect(historyRegion.getByText("fixture-vision")).toHaveCount(0);

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

test("captures and analyzes a visible screenshot", async ({ page, serviceWorker }) => {
  await configureFixtureApi(serviceWorker);
  await page.goto("http://127.0.0.1:43118/");
  await injectAndOpenScreenshot(page, serviceWorker);

  const shell = page.getByTestId("workbench-shell");
  await expect(shell.getByText("网页截图", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "开始分析" }).click();
  await expect(page.getByText("测试分析结果：主体居中，冷灰背景，柔和侧光。")).toBeVisible();
});

test("selects an image from the current page", async ({ page, serviceWorker }) => {
  await page.goto("http://127.0.0.1:43118/");
  await injectAndShowWorkbench(page, serviceWorker);

  await page.getByRole("button", { name: "从当前页面选择图片" }).click();
  await expect(page.getByText("点击一张图片进行分析 · Esc 取消", { exact: true })).toBeVisible();
  const image = page.locator("#reference-image");
  await image.hover();
  await image.click();

  const shell = page.getByTestId("workbench-shell");
  await expect(shell.getByText("视觉分析扩展测试页", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "开始分析" })).toBeEnabled();
});

test("opens a linked thumbnail directly from its context-menu URL", async ({
  page,
  serviceWorker
}) => {
  await page.goto("http://127.0.0.1:43118/");
  await injectAndOpenLinkedImage(page, serviceWorker);

  await expect(page.getByText("点击一张图片进行分析 · Esc 取消", { exact: true }))
    .toHaveCount(0);
  const shell = page.getByTestId("workbench-shell");
  await expect(shell.getByText("视觉分析扩展测试页", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "开始分析" })).toBeEnabled();
});

test("opens settings and prompt management inside the floating window", async ({
  page,
  serviceWorker
}) => {
  await page.goto("http://127.0.0.1:43118/");
  await injectAndShowWorkbench(page, serviceWorker);
  const pageUrl = page.url();

  await page.getByRole("button", { name: "打开设置" }).click();
  const shell = page.getByTestId("workbench-shell");
  await expect(shell.getByRole("heading", { name: "模型与接口" })).toBeVisible();
  expect(page.url()).toBe(pageUrl);
  await page.screenshot({
    path: "output/playwright/workbench-inline-settings.png",
    fullPage: false
  });

  await shell.getByRole("button", { name: "提示词" }).click();
  await expect(shell.getByText("内置模板", { exact: true })).toBeVisible();
  await expect(shell.getByText("通用图片反推", { exact: true }).first()).toBeVisible();
  await page.screenshot({
    path: "output/playwright/workbench-inline-prompts.png",
    fullPage: false
  });
});

test("opens the extension options page", async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.getByRole("heading", { name: "模型与接口" })).toBeVisible();
  await page.getByRole("button", { name: "提示词模板" }).click();
  await expect(page.getByText("通用图片反推").first()).toBeVisible();
  await page.locator(".prompt-catalog input[type=file]").setInputFiles({
    name: "legacy-prompts.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify([
      { id: "legacy-fixture", name: "旧模板导入测试", prompt: "分析画面" }
    ]))
  });
  await expect(page.getByText("旧模板导入测试", { exact: true })).toBeVisible();
  await fs.mkdir("output/playwright", { recursive: true });
  await page.screenshot({
    path: "output/playwright/options-prompts.png",
    fullPage: false
  });
});
