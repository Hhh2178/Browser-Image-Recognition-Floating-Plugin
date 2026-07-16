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
import { setHoverPermission } from "../src/features/settings/permissions";
import {
  ModelRoutingError,
  reserveAnalysisTarget
} from "../src/features/settings/model-routing";
import { historyRepository } from "../src/features/history/history-repository";
import {
  createHistoryExportFilename,
  formatHistoryExport
} from "../src/features/history/history-export";
import {
  CONTEXT_MENU_DEFINITIONS,
  IMAGE_MENU_ID
} from "../src/features/media/context-menu-definitions";

const CONTENT_SCRIPT_FILE = "content-scripts/content.js";

export default defineBackground(() => {
  const router = createWorkbenchRouter({ ensureAndSend });

  registerMenu();
  chrome.runtime.onInstalled.addListener(registerMenu);
  chrome.runtime.onStartup.addListener(registerMenu);

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) {
      return;
    }
    if (info.menuItemId !== IMAGE_MENU_ID) {
      return;
    }
    if (info.srcUrl) {
      void router.openImage({
        tabId: tab.id,
        sourceUrl: info.srcUrl,
        pageUrl: tab.url ?? "",
        pageTitle: tab.title ?? ""
      }).catch(console.warn);
      return;
    }
    if (info.linkUrl) {
      void ensureAndSend(tab.id, {
        type: "workbench/open-linked-image",
        payload: { linkUrl: info.linkUrl }
      }).catch(console.warn);
      return;
    }
    void ensureAndSend(tab.id, { type: "workbench/pick-image" }).catch(console.warn);
  });

  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      void ensureAndSend(tab.id, { type: "workbench/pick-image" }).catch(console.warn);
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
    if (message.type === "permissions/request-endpoints") {
      const origins = message.payload.origins.filter((origin) => /^https?:\/\/[^/]+\/\*$/.test(origin));
      if (origins.length === 0) {
        sendResponse({ granted: true });
        return false;
      }
      void chrome.permissions.request({ origins })
        .then((granted) => sendResponse({ granted }))
        .catch(() => sendResponse({ granted: false }));
      return true;
    }
    if (message.type === "permissions/set-hover") {
      void setHoverPermission(message.payload.enabled)
        .then((granted) => sendResponse({ granted }))
        .catch(() => sendResponse({ granted: false }));
      return true;
    }
    if (message.type === "history/list") {
      void historyRepository.list().then(sendResponse);
      return true;
    }
    if (message.type === "history/add") {
      void historyRepository.add(message.payload).then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message.type === "history/export-pending") {
      void exportPendingHistory()
        .then(sendResponse)
        .catch((error) => sendResponse({
          ok: false,
          message: error instanceof Error ? error.message : "导出失败"
        }));
      return true;
    }
    if (message.type === "history/remove") {
      void historyRepository.remove(message.payload.id).then(() => sendResponse({ ok: true }));
      return true;
    }
    if (message.type === "history/clear") {
      void historyRepository.clear().then(() => sendResponse({ ok: true }));
      return true;
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

async function exportPendingHistory(): Promise<{
  ok: true;
  count: number;
  fileName: string;
}> {
  const records = await historyRepository.listPendingExport();
  if (records.length === 0) {
    return { ok: true, count: 0, fileName: "" };
  }

  const fileName = createHistoryExportFilename();
  const text = formatHistoryExport(records);
  const downloadId = await chrome.downloads.download({
    url: `data:text/plain;charset=utf-8,%EF%BB%BF${encodeURIComponent(text)}`,
    filename: fileName,
    conflictAction: "uniquify",
    saveAs: false
  });
  await waitForDownload(downloadId);
  await historyRepository.markExported(
    records.map((record) => record.id),
    Date.now()
  );
  return { ok: true, count: records.length, fileName };
}

function waitForDownload(downloadId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      finish(() => reject(new Error("下载超时，记录未标记为已导出")));
    }, 120_000);
    const handleChanged = (delta: chrome.downloads.DownloadDelta) => {
      if (delta.id !== downloadId) {
        return;
      }
      if (delta.state?.current === "complete") {
        finish(resolve);
      } else if (delta.state?.current === "interrupted") {
        finish(() => reject(new Error(
          delta.error?.current || "下载已中断，记录未标记为已导出"
        )));
      }
    };
    const finish = (complete: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      complete();
    };
    const cleanup = () => {
      clearTimeout(timeout);
      chrome.downloads.onChanged.removeListener(handleChanged);
    };
    chrome.downloads.onChanged.addListener(handleChanged);
    void chrome.downloads.search({ id: downloadId }).then(([item]) => {
      if (item?.state === "complete") {
        finish(resolve);
      } else if (item?.state === "interrupted") {
        finish(() => reject(new Error(item.error || "下载已中断，记录未标记为已导出")));
      }
    }).catch(() => {
      // The onChanged listener remains the source of truth if search fails.
    });
  });
}

function registerMenu(): void {
  chrome.contextMenus.removeAll(() => {
    for (const definition of CONTEXT_MENU_DEFINITIONS) {
      chrome.contextMenus.create(definition);
    }
  });
}

async function ensureAndSend(
  tabId: number,
  message: WorkbenchOpenMessage
    | { type: "workbench/pick-image" }
    | { type: "workbench/open-linked-image"; payload: { linkUrl: string } }
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [CONTENT_SCRIPT_FILE]
    });
    await waitForContentReady(tabId);
    await chrome.tabs.sendMessage(tabId, message);
  }
}

async function waitForContentReady(tabId: number): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response: unknown = await chrome.tabs.sendMessage(tabId, {
        type: "workbench/ping"
      } satisfies RuntimeMessage);
      if (
        response
        && typeof response === "object"
        && (response as { ready?: unknown }).ready === true
      ) {
        return;
      }
    } catch {
      // The content script is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("工作台注入后未能及时启动");
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
    const target = await reserveAnalysisTarget(settings, payload.preferredModelId);
    const content = await executeAnalysisRequest({
      target: {
        apiUrl: target.provider.apiUrl,
        apiKey: target.provider.apiKey,
        endpointMode: target.provider.endpointMode,
        imageTransport: target.provider.imageTransport,
        model: target.model.model
      },
      prompt: payload.prompt,
      imageDataUrl: payload.imageDataUrl,
      ...(payload.sourceUrl ? { sourceUrl: payload.sourceUrl } : {})
    });
    return {
      ok: true,
      content,
      durationMs: Math.round(performance.now() - startedAt),
      providerId: target.provider.id,
      providerName: target.provider.name,
      modelId: target.model.id,
      modelName: target.model.name
    };
  } catch (error) {
    const normalized = error instanceof ModelRoutingError
      ? new AnalysisRequestError(error.code, error.message, false)
      : error instanceof AnalysisRequestError
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
          model: payload.preferredModelId ?? "auto",
          durationMs: Math.round(performance.now() - startedAt),
          sourceType: payload.sourceType,
          pageUrl: payload.pageUrl
        })
      }
    };
  }
}
