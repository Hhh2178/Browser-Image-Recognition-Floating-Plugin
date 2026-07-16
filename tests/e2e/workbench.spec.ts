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
  await serviceWorker.evaluate(async () => {
    await chrome.storage.local.remove(["hhhLegacyPromptMigrationV1", "hhhCustomPrompts"]);
    await chrome.storage.local.set({
      comflyPromptTemplatePresets: [{
        id: "e2e-legacy-image",
        task: "image_analysis",
        name: "旧版迁移模板",
        content: "从旧版迁移的图片分析提示词"
      }]
    });
  });
  await page.goto("http://127.0.0.1:43118/");
  await injectAndShowWorkbench(page, serviceWorker);
  const pageUrl = page.url();

  await page.getByRole("button", { name: "打开设置" }).click();
  const shell = page.getByTestId("workbench-shell");
  await expect(shell.getByRole("heading", { name: "模型与接口" })).toBeVisible();
  expect(page.url()).toBe(pageUrl);
  const providerNameInput = shell.getByRole("textbox", { name: "服务商名称" });
  await providerNameInput.fill("Saved Fixture Provider");
  await shell.getByRole("button", { name: "保存全部配置" }).click();
  await expect(shell.getByRole("status")).toContainText("设置已保存");
  const savedSettings: unknown = await serviceWorker.evaluate(async () => {
    const stored: Record<string, unknown> = await chrome.storage.local.get("hhhSettings");
    return stored["hhhSettings"];
  });
  if (!savedSettings || typeof savedSettings !== "object") {
    throw new Error("Saved settings are missing");
  }
  const providers = (savedSettings as { providers?: unknown }).providers;
  if (!Array.isArray(providers) || !providers[0] || typeof providers[0] !== "object") {
    throw new Error("Saved providers are missing");
  }
  const savedProviderName = (providers[0] as { name?: unknown }).name;
  expect(savedProviderName).toBe("Saved Fixture Provider");
  await page.screenshot({
    path: "output/playwright/workbench-inline-settings.png",
    fullPage: false
  });

  await shell.getByRole("button", { name: "新建服务商" }).click();
  await expect(shell.getByRole("heading", { name: "新服务商" })).toBeVisible();
  await shell.getByRole("button", { name: "添加模型" }).click();
  const dailyLimitToggles = shell.getByRole("checkbox", { name: "每日使用上限" });
  await expect(dailyLimitToggles).toHaveCount(2);
  await dailyLimitToggles.first().check();
  await shell.getByRole("spinbutton").fill("25");
  await expect(shell.getByText("今日 0/25")).toBeVisible();
  await page.screenshot({
    path: "output/playwright/workbench-provider-models.png",
    fullPage: false
  });

  await shell.getByRole("button", { name: "提示词" }).click();
  await expect(shell.getByText("内置模板", { exact: true })).toBeVisible();
  await expect(shell.getByText("通用图片反推", { exact: true }).first()).toBeVisible();
  await expect(shell.getByText("高保真图片反推", { exact: true }).first()).toBeVisible();
  await expect(shell.getByText("全维度美术蓝图", { exact: true }).first()).toBeVisible();
  await expect(shell.getByText("旧版迁移模板", { exact: true }).first()).toBeVisible();
  await page.screenshot({
    path: "output/playwright/workbench-inline-prompts.png",
    fullPage: false
  });
});

test("resizes within desktop bounds and reflows on narrow screens", async ({
  page,
  serviceWorker
}) => {
  await page.goto("http://127.0.0.1:43118/");
  await injectAndShowWorkbench(page, serviceWorker);
  const shell = page.getByTestId("workbench-shell");
  const initial = await shell.boundingBox();
  if (!initial) {
    throw new Error("Workbench is not visible");
  }

  await page.mouse.move(initial.x + initial.width - 2, initial.y + initial.height - 2);
  await page.mouse.down();
  await page.mouse.move(initial.x + initial.width + 120, initial.y + initial.height + 70, {
    steps: 8
  });
  await page.mouse.up();

  const resized = await shell.boundingBox();
  if (!resized) {
    throw new Error("Resized workbench is not visible");
  }
  expect(resized.width).toBeGreaterThan(initial.width + 50);
  expect(resized.width).toBeLessThanOrEqual(860);
  expect(resized.height).toBeGreaterThanOrEqual(420);
  expect(resized.y + resized.height).toBeLessThanOrEqual(900);

  await page.setViewportSize({ width: 520, height: 720 });
  await expect(shell).toHaveCSS("resize", "none");
  const narrow = await shell.boundingBox();
  if (!narrow) {
    throw new Error("Narrow workbench is not visible");
  }
  expect(narrow.x).toBeGreaterThanOrEqual(0);
  expect(narrow.x + narrow.width).toBeLessThanOrEqual(520);
  expect(narrow.y + narrow.height).toBeLessThanOrEqual(720);
  await fs.mkdir("output/playwright", { recursive: true });
  await page.screenshot({
    path: "output/playwright/workbench-resize-narrow.png",
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
