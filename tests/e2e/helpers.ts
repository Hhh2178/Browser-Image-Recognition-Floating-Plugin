import type { Page, Worker } from "@playwright/test";

export async function configureFixtureApi(worker: Worker): Promise<void> {
  await worker.evaluate(async () => {
    await chrome.storage.local.set({
      hhhSettings: {
        schemaVersion: 2,
        providers: [{
          id: "provider-fixture",
          name: "Fixture Provider",
          apiUrl: "http://127.0.0.1:43118/v1",
          apiKey: "fixture-key",
          endpointMode: "base_url",
          imageTransport: "source_url",
          enabled: true,
          models: [{
            id: "model-fixture",
            name: "fixture-vision",
            model: "fixture-vision",
            enabled: true,
            dailyLimit: null
          }]
        }],
        activeProviderId: "provider-fixture",
        activeModelId: "model-fixture",
        hoverEnabled: false,
        theme: "light"
      }
    });
  });
}

export async function injectAndOpenImage(
  page: Page,
  worker: Worker
): Promise<void> {
  const pageUrl = page.url();
  await worker.evaluate(async ({ pageUrl }) => {
    const [tab] = await chrome.tabs.query({ url: pageUrl });
    if (!tab?.id) {
      throw new Error("Fixture tab not found");
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/content.js"]
    });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const response: unknown = await chrome.tabs.sendMessage(tab.id, {
          type: "workbench/ping"
        });
        if (
          response
          && typeof response === "object"
          && (response as { ready?: unknown }).ready === true
        ) {
          break;
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    await chrome.tabs.sendMessage(tab.id, {
      type: "workbench/open",
      payload: {
        sourceType: "image",
        sourceUrl: "http://127.0.0.1:43118/reference.png",
        pageUrl,
        pageTitle: "视觉分析扩展测试页"
      }
    });
  }, { pageUrl });
}

export async function injectAndShowWorkbench(
  page: Page,
  worker: Worker
): Promise<void> {
  const pageUrl = page.url();
  await worker.evaluate(async ({ pageUrl }) => {
    const [tab] = await chrome.tabs.query({ url: pageUrl });
    if (!tab?.id) {
      throw new Error("Fixture tab not found");
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/content.js"]
    });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const response: unknown = await chrome.tabs.sendMessage(tab.id, {
          type: "workbench/ping"
        });
        if (
          response
          && typeof response === "object"
          && (response as { ready?: unknown }).ready === true
        ) {
          break;
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    await chrome.tabs.sendMessage(tab.id, { type: "workbench/show" });
  }, { pageUrl });
}

export async function injectAndOpenLinkedImage(
  page: Page,
  worker: Worker
): Promise<void> {
  const pageUrl = page.url();
  await worker.evaluate(async ({ pageUrl }) => {
    const [tab] = await chrome.tabs.query({ url: pageUrl });
    if (!tab?.id) {
      throw new Error("Fixture tab not found");
    }
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/content.js"]
    });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const response: unknown = await chrome.tabs.sendMessage(tab.id, {
          type: "workbench/ping"
        });
        if (
          response
          && typeof response === "object"
          && (response as { ready?: unknown }).ready === true
        ) {
          break;
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    await chrome.tabs.sendMessage(tab.id, {
      type: "workbench/open-linked-image",
      payload: { linkUrl: new URL("/pin/fixture", pageUrl).href }
    });
  }, { pageUrl });
}

export async function injectAndOpenScreenshot(
  page: Page,
  worker: Worker
): Promise<void> {
  const pageUrl = page.url();
  await worker.evaluate(async ({ pageUrl }) => {
    const [tab] = await chrome.tabs.query({ url: pageUrl });
    if (!tab?.id) {
      throw new Error("Fixture tab not found");
    }
    const imageDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png"
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-scripts/content.js"]
    });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        const response: unknown = await chrome.tabs.sendMessage(tab.id, {
          type: "workbench/ping"
        });
        if (
          response
          && typeof response === "object"
          && (response as { ready?: unknown }).ready === true
        ) {
          break;
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
    await chrome.tabs.sendMessage(tab.id, {
      type: "workbench/open-screenshot",
      payload: {
        sourceType: "screenshot",
        imageDataUrl,
        pageUrl,
        pageTitle: "视觉分析扩展测试页"
      }
    });
  }, { pageUrl });
}
