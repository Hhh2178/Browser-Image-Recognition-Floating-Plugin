import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  AnalysisResponse,
  RuntimeMessage,
  WorkbenchOpenMessage
} from "../../src/contracts/messages";
import { HistoryDrawer } from "../../src/features/history/HistoryDrawer";
import type { HistoryRecord } from "../../src/features/history/history-db";
import { findBestPageImage } from "../../src/features/media/page-image-target";
import { findLinkedPageImage } from "../../src/features/media/linked-image-target";
import { listPrompts } from "../../src/features/prompts/prompt-repository";
import { renderPrompt, type PromptPreset } from "../../src/features/prompts/prompt-schema";
import { loadSettings } from "../../src/features/settings/settings-repository";
import type { Settings } from "../../src/features/settings/settings-schema";
import { Workbench } from "../../src/features/workbench/Workbench";
import type {
  AnalyzeSelection,
  LayoutMode,
  WorkbenchSource
} from "../../src/features/workbench/workbench-types";
import "./style.css";

const LAYOUT_KEY = "hhhLayoutMode";
const POSITION_KEY = "hhhFloatPosition";

export default defineContentScript({
  registration: "runtime",
  cssInjectionMode: "ui",
  async main(ctx) {
    type UiMessage = WorkbenchOpenMessage
      | { type: "workbench/pick-image" }
      | { type: "workbench/open-linked-image"; payload: { linkUrl: string } };
    const subscribers = new Set<(message: UiMessage) => void>();
    let pendingMessage: UiMessage | null = null;
    chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
      if (message.type === "workbench/ping") {
        sendResponse({ ready: true });
        return false;
      }
      if (
        message.type === "workbench/open"
        || message.type === "workbench/open-screenshot"
        || message.type === "workbench/show"
        || message.type === "workbench/pick-image"
        || message.type === "workbench/open-linked-image"
      ) {
        if (subscribers.size === 0) {
          pendingMessage = message;
        } else {
          subscribers.forEach((subscriber) => subscriber(message));
        }
      }
      return false;
    });

    const ui = await createShadowRootUi(ctx, {
      name: "hhh-workbench",
      position: "inline",
      anchor: "body",
      onMount(container) {
        const root = createRoot(container);
        root.render(<ContentApp subscribe={(listener) => {
          subscribers.add(listener);
          if (pendingMessage) {
            const message = pendingMessage;
            pendingMessage = null;
            queueMicrotask(() => listener(message));
          }
          return () => subscribers.delete(listener);
        }} />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      }
    });
    ui.mount();
  }
});

function ContentApp(props: {
  subscribe(
    listener: (
      message: WorkbenchOpenMessage
        | { type: "workbench/pick-image" }
        | { type: "workbench/open-linked-image"; payload: { linkUrl: string } }
    ) => void
  ): () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [source, setSource] = useState<WorkbenchSource | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [prompts, setPrompts] = useState<PromptPreset[]>([]);
  const [mode, setMode] = useState<LayoutMode>("float");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [restored, setRestored] = useState<HistoryRecord | null>(null);

  useEffect(() => {
    void Promise.all([
      loadSettings(),
      listPrompts(),
      chrome.storage.local.get([LAYOUT_KEY, POSITION_KEY])
    ]).then(([nextSettings, nextPrompts, layout]) => {
      setSettings(nextSettings);
      setPrompts(nextPrompts);
      setMode(layout[LAYOUT_KEY] === "dock" ? "dock" : "float");
      const storedPosition: unknown = layout[POSITION_KEY];
      if (
        storedPosition
        && typeof storedPosition === "object"
        && typeof (storedPosition as { x?: unknown }).x === "number"
        && typeof (storedPosition as { y?: unknown }).y === "number"
      ) {
        setPosition(storedPosition as { x: number; y: number });
      }
    });
  }, []);

  useEffect(() => props.subscribe((message) => {
    if (message.type === "workbench/open-linked-image") {
      const image = findLinkedPageImage(message.payload.linkUrl);
      if (image) {
        openPageImage(image);
      } else {
        startImagePicker();
      }
      return;
    }
    if (message.type === "workbench/pick-image") {
      startImagePicker();
      return;
    }
    setVisible(true);
    setRestored(null);
    if (message.type === "workbench/open") {
      setSource({
        sourceType: "image",
        previewUrl: message.payload.sourceUrl,
        imageDataUrl: "",
        sourceUrl: message.payload.sourceUrl,
        pageUrl: message.payload.pageUrl,
        pageTitle: message.payload.pageTitle
      });
    }
    if (message.type === "workbench/open-screenshot") {
      setSource({
        sourceType: "screenshot",
        previewUrl: message.payload.imageDataUrl,
        imageDataUrl: message.payload.imageDataUrl,
        pageUrl: message.payload.pageUrl,
        pageTitle: message.payload.pageTitle
      });
    }
  }), [props]);

  const analyze = async (selection: AnalyzeSelection) => {
    if (!settings) {
      throw new Error("设置仍在加载，请稍后重试。");
    }
    if (
      settings.imageTransport === "data_url"
      && !selection.source.imageDataUrl
    ) {
      throw new Error("当前网页图片无法转换为 Data URL，请将图片传输方式改为自动或源地址。");
    }
    const prompt = renderPrompt(selection.prompt.content, {
      outputFormat: selection.outputFormat,
      sourceType: selection.source.sourceType,
      pageTitle: selection.source.pageTitle
    });
    const response: AnalysisResponse = await chrome.runtime.sendMessage({
      type: "analysis/run",
      payload: {
        sourceType: selection.source.sourceType,
        ...(selection.source.sourceUrl ? { sourceUrl: selection.source.sourceUrl } : {}),
        imageDataUrl: selection.source.imageDataUrl,
        prompt,
        outputFormat: selection.outputFormat,
        model: settings.model,
        pageUrl: selection.source.pageUrl,
        pageTitle: selection.source.pageTitle
      }
    } satisfies RuntimeMessage);

    if (!response.ok) {
      throw new Error(response.error.message);
    }
    const record: HistoryRecord = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      sourceType: selection.source.sourceType,
      thumbnail: selection.source.previewUrl,
      templateId: selection.prompt.id,
      model: settings.model,
      outputFormat: selection.outputFormat,
      result: response.content,
      pageUrl: selection.source.pageUrl
    };
    await chrome.runtime.sendMessage({
      type: "history/add",
      payload: record
    } satisfies RuntimeMessage);
    return { content: response.content, durationMs: response.durationMs };
  };

  const openHistory = async () => {
    const records: HistoryRecord[] = await chrome.runtime.sendMessage({
      type: "history/list"
    } satisfies RuntimeMessage);
    setHistory(records);
    setHistoryOpen(true);
  };

  const deleteHistory = async (id: string) => {
    if (!window.confirm("删除这条历史记录？")) {
      return;
    }
    await chrome.runtime.sendMessage({
      type: "history/remove",
      payload: { id }
    } satisfies RuntimeMessage);
    setHistory((records) => records.filter((record) => record.id !== id));
  };

  const clearHistory = async () => {
    if (!window.confirm("清空全部分析历史？此操作无法撤销。")) {
      return;
    }
    await chrome.runtime.sendMessage({ type: "history/clear" } satisfies RuntimeMessage);
    setHistory([]);
  };

  const restoreHistory = (record: HistoryRecord) => {
    setRestored(record);
    setSource({
      sourceType: record.sourceType,
      previewUrl: record.thumbnail,
      imageDataUrl: record.thumbnail.startsWith("data:") ? record.thumbnail : "",
      ...(record.thumbnail.startsWith("http") ? { sourceUrl: record.thumbnail } : {}),
      pageUrl: record.pageUrl,
      pageTitle: new URL(record.pageUrl).hostname
    });
    setHistoryOpen(false);
  };

  const openPageImage = (image: HTMLImageElement) => {
    const sourceUrl = image.currentSrc || image.src;
    setSource({
      sourceType: "image",
      previewUrl: sourceUrl,
      imageDataUrl: "",
      sourceUrl,
      pageUrl: location.href,
      pageTitle: document.title
    });
    setRestored(null);
    setVisible(true);
  };

  const startImagePicker = () => {
    setVisible(false);
    let highlighted: HTMLImageElement | null = null;
    let originalOutline = "";
    let originalOutlineOffset = "";
    const originalCursor = document.documentElement.style.cursor;
    const hint = document.createElement("div");
    hint.textContent = "点击一张图片进行分析 · Esc 取消";
    Object.assign(hint.style, {
      position: "fixed",
      top: "14px",
      left: "50%",
      zIndex: "2147483647",
      transform: "translateX(-50%)",
      border: "1px solid rgb(255 255 255 / 35%)",
      borderRadius: "6px",
      background: "#18202b",
      color: "#ffffff",
      padding: "9px 13px",
      font: '13px/1.4 "Segoe UI", sans-serif',
      boxShadow: "0 8px 24px rgb(15 23 42 / 22%)",
      pointerEvents: "none"
    });
    document.documentElement.append(hint);
    document.documentElement.style.cursor = "crosshair";

    const restoreHighlight = () => {
      if (highlighted) {
        highlighted.style.outline = originalOutline;
        highlighted.style.outlineOffset = originalOutlineOffset;
      }
      highlighted = null;
    };

    const cleanupPicker = () => {
      restoreHighlight();
      hint.remove();
      document.documentElement.style.cursor = originalCursor;
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const image = findBestPageImage(event.target, event);
      if (
        !image
        || image === highlighted
      ) {
        return;
      }
      restoreHighlight();
      highlighted = image;
      originalOutline = image.style.outline;
      originalOutlineOffset = image.style.outlineOffset;
      image.style.outline = "3px solid #2563eb";
      image.style.outlineOffset = "3px";
    };

    const handleClick = (event: MouseEvent) => {
      const image = findBestPageImage(event.target, event) ?? highlighted;
      if (!image) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      cleanupPicker();
      openPageImage(image);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cleanupPicker();
        setVisible(true);
      }
    };

    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("keydown", handleKeyDown, true);
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <Workbench
        key={restored?.id ?? "active"}
        initialMode={mode}
        {...(restored ? { initialResult: restored.result } : {})}
        source={source}
        {...(prompts.length ? { prompts } : {})}
        modelName={settings?.model ?? ""}
        theme={settings?.theme ?? "system"}
        {...(position ? { initialPosition: position } : {})}
        onAnalyze={analyze}
        onPickImage={startImagePicker}
        onOpenSettings={() => void chrome.runtime.sendMessage({ type: "settings/open" })}
        onOpenHistory={() => void openHistory()}
        onManagePrompts={() => void chrome.runtime.openOptionsPage()}
        onClose={() => setVisible(false)}
        saveLayout={(nextMode) => {
          setMode(nextMode);
          void chrome.storage.local.set({ [LAYOUT_KEY]: nextMode });
        }}
        savePosition={(nextPosition) => {
          setPosition(nextPosition);
          void chrome.storage.local.set({ [POSITION_KEY]: nextPosition });
        }}
      />
      {historyOpen ? (
        <HistoryDrawer
          records={history}
          onRestore={restoreHistory}
          onDelete={(id) => void deleteHistory(id)}
          onClear={() => void clearHistory()}
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}
    </>
  );
}
