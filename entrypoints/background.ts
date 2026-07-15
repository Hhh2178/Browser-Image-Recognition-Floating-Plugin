import { createWorkbenchRouter } from "../src/adapters/chrome/workbench-router";
import type {
  AnalysisResponse,
  RuntimeMessage,
  WorkbenchOpenMessage
} from "../src/contracts/messages";
import { redactDiagnostic } from "../src/features/analysis/diagnostics";
import { executeAnalysisRequest } from "../src/features/analysis/execute-request";
import { AnalysisRequestError } from "../src/features/analysis/parse-response";
import { loadSettings } from "../src/features/settings/settings-repository";

const MENU_ID = "analyze-image";
const CONTENT_SCRIPT_FILE = "content-scripts/content.js";

export default defineBackground(() => {
  const router = createWorkbenchRouter({ ensureAndSend });

  chrome.runtime.onInstalled.addListener(registerMenu);
  chrome.runtime.onStartup.addListener(registerMenu);

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== MENU_ID || !tab?.id || !info.srcUrl) {
      return;
    }
    void router.openImage({
      tabId: tab.id,
      sourceUrl: info.srcUrl,
      pageUrl: tab.url ?? "",
      pageTitle: tab.title ?? ""
    }).catch(console.warn);
  });

  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      void router.show(tab.id, tab.url ?? "").catch(console.warn);
    }
  });

  chrome.commands.onCommand.addListener((command) => {
    if (command === "analyze-screenshot") {
      void openActiveScreenshot(router).catch(console.warn);
    }
  });

  chrome.runtime.onMessage.addListener((
    message: RuntimeMessage,
    sender,
    sendResponse
  ) => {
    if (message.type === "analysis/run") {
      void runAnalysis(message.payload).then(sendResponse);
      return true;
    }
    if (message.type === "settings/open") {
      void chrome.runtime.openOptionsPage();
      return false;
    }
    if (message.type === "workbench/open-from-hover" && sender.tab?.id) {
      void router.openImage({
        tabId: sender.tab.id,
        sourceUrl: message.payload.sourceUrl,
        pageUrl: message.payload.pageUrl,
        pageTitle: message.payload.pageTitle
      }).catch(console.warn);
    }
    return false;
  });
});

function registerMenu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: "分析这张图片",
      contexts: ["image"]
    });
  });
}

async function ensureAndSend(
  tabId: number,
  message: WorkbenchOpenMessage
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [CONTENT_SCRIPT_FILE]
    });
    await chrome.tabs.sendMessage(tabId, message);
  }
}

async function openActiveScreenshot(
  router: ReturnType<typeof createWorkbenchRouter>
): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }
  const imageDataUrl = await chrome.tabs.captureVisibleTab(
    tab.windowId,
    { format: "png" }
  );
  await router.openScreenshot({
    tabId: tab.id,
    imageDataUrl,
    pageUrl: tab.url ?? "",
    pageTitle: tab.title ?? ""
  });
}

async function runAnalysis(
  payload: Extract<RuntimeMessage, { type: "analysis/run" }>["payload"]
): Promise<AnalysisResponse> {
  const startedAt = performance.now();
  try {
    const settings = await loadSettings();
    if (!settings.apiKey) {
      throw new AnalysisRequestError("CONFIG_MISSING", "请先配置 API Key", false);
    }
    const content = await executeAnalysisRequest({
      settings,
      prompt: payload.prompt,
      imageDataUrl: payload.imageDataUrl,
      ...(payload.sourceUrl ? { sourceUrl: payload.sourceUrl } : {})
    });
    return {
      ok: true,
      content,
      durationMs: Math.round(performance.now() - startedAt)
    };
  } catch (error) {
    const normalized = error instanceof AnalysisRequestError
      ? error
      : new AnalysisRequestError(
          "RUNTIME_ERROR",
          error instanceof Error ? error.message : "分析失败",
          false
        );
    return {
      ok: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        retryable: normalized.retryable,
        diagnostic: redactDiagnostic({
          code: normalized.code,
          model: payload.model,
          durationMs: Math.round(performance.now() - startedAt),
          sourceType: payload.sourceType,
          pageUrl: payload.pageUrl
        })
      }
    };
  }
}
