import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";

beforeEach(() => {
  Object.assign(globalThis, {
    chrome: {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
          set: vi.fn().mockResolvedValue(undefined)
        }
      },
      permissions: {
        request: vi.fn().mockResolvedValue(true),
        remove: vi.fn().mockResolvedValue(true)
      },
      scripting: {
        getRegisteredContentScripts: vi.fn().mockResolvedValue([]),
        registerContentScripts: vi.fn().mockResolvedValue(undefined),
        unregisterContentScripts: vi.fn().mockResolvedValue(undefined)
      },
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({ ok: true, content: "连接正常" })
      }
    }
  });
});

it("renders only as a floating window and clamps a stale position", async () => {
  render(
    <Workbench
      initialResult="analysis result"
      source={null}
      initialPosition={{ x: 5000, y: 5000 }}
      onAnalyze={vi.fn()}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
    />
  );

  expect(screen.getByText("analysis result")).toBeVisible();
  expect(screen.queryByRole("button", { name: "停靠到右侧" })).not.toBeInTheDocument();
  const shell = screen.getByTestId("workbench-shell");
  await waitFor(() => {
    expect(Number.parseFloat(shell.style.left)).toBeLessThan(window.innerWidth);
    expect(Number.parseFloat(shell.style.top)).toBeLessThan(window.innerHeight);
  });
});

it("starts page image picking from the empty source state", () => {
  const onPickImage = vi.fn();
  render(
    <Workbench
      source={null}
      onAnalyze={vi.fn()}
      onPickImage={onPickImage}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "从当前页面选择图片" }));
  expect(onPickImage).toHaveBeenCalledOnce();
});

it("opens settings as a secondary view inside the floating window", async () => {
  render(
    <Workbench
      source={null}
      onAnalyze={vi.fn()}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "打开设置" }));

  const shell = screen.getByTestId("workbench-shell");
  expect(await screen.findByRole("heading", { name: "模型与接口" })).toBeVisible();
  expect(shell).toContainElement(screen.getByRole("heading", { name: "模型与接口" }));
  expect(screen.getByRole("button", { name: "返回分析" })).toBeVisible();
});

it("moves with a transform and saves its position only after pointer release", () => {
  const savePosition = vi.fn();
  render(
    <Workbench
      source={null}
      onAnalyze={vi.fn()}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
      savePosition={savePosition}
    />
  );

  const shell = screen.getByTestId("workbench-shell");
  const header = screen.getByRole("banner");
  fireEvent.pointerDown(header, { clientX: 100, clientY: 100 });
  fireEvent.pointerMove(window, { clientX: 150, clientY: 150 });

  expect(shell.style.transform).toContain("translate3d");
  expect(savePosition).not.toHaveBeenCalled();

  fireEvent.pointerUp(window);
  expect(savePosition).toHaveBeenCalledOnce();
});

it("clamps its initial size to the supported desktop range", () => {
  render(
    <Workbench
      source={null}
      initialSize={{ width: 1200, height: 200 }}
      onAnalyze={vi.fn()}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
    />
  );

  const shell = screen.getByTestId("workbench-shell");
  expect(Number.parseFloat(shell.style.width)).toBeLessThanOrEqual(860);
  expect(Number.parseFloat(shell.style.height)).toBeGreaterThanOrEqual(420);
});

it("uses the compact default width and clamps to the reduced minimum", () => {
  const commonProps = {
    source: null,
    onAnalyze: vi.fn(),
    onOpenHistory: vi.fn(),
    onClose: vi.fn()
  };
  const { rerender } = render(<Workbench {...commonProps} />);
  expect(screen.getByTestId("workbench-shell").style.width).toBe("400px");

  rerender(<Workbench {...commonProps} initialSize={{ width: 120, height: 500 }} />);
  expect(screen.getByTestId("workbench-shell").style.width).toBe("336px");
});

it("persists a resized shell only after pointer release", () => {
  let resizeCallback: ResizeObserverCallback | undefined;
  class ResizeObserverMock {
    constructor(callback: ResizeObserverCallback) {
      resizeCallback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  const saveSize = vi.fn();
  render(
    <Workbench
      source={null}
      onAnalyze={vi.fn()}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
      saveSize={saveSize}
    />
  );

  act(() => {
    resizeCallback?.([{
      borderBoxSize: [{ inlineSize: 720, blockSize: 600 }],
      contentRect: { width: 720, height: 600 }
    } as unknown as ResizeObserverEntry], {} as ResizeObserver);
  });
  expect(saveSize).not.toHaveBeenCalled();

  fireEvent.pointerUp(window);
  expect(saveSize).toHaveBeenCalledWith({ width: 720, height: 600 });
  vi.unstubAllGlobals();
});

it("applies size and position restored after the first render", () => {
  const commonProps = {
    source: null,
    onAnalyze: vi.fn(),
    onOpenHistory: vi.fn(),
    onClose: vi.fn()
  };
  const { rerender } = render(<Workbench {...commonProps} />);

  rerender(
    <Workbench
      {...commonProps}
      initialSize={{ width: 700, height: 620 }}
      initialPosition={{ x: 24, y: 30 }}
    />
  );

  const shell = screen.getByTestId("workbench-shell");
  expect(shell.style.width).toBe("700px");
  expect(shell.style.height).toBe("620px");
  expect(shell.style.left).toBe("24px");
  expect(shell.style.top).toBe("30px");
});

it("submits multiple analyses without waiting and tracks them in the queue", async () => {
  const resolvers: Array<(value: {
    content: string;
    durationMs: number;
    providerName: string;
    modelName: string;
  }) => void> = [];
  const onAnalyze = vi.fn(() => new Promise<{
    content: string;
    durationMs: number;
    providerName: string;
    modelName: string;
  }>((resolve) => resolvers.push(resolve)));
  render(
    <Workbench
      source={{
        sourceType: "image",
        previewUrl: "https://site.test/image.jpg",
        imageDataUrl: "",
        sourceUrl: "https://site.test/image.jpg",
        pageUrl: "https://site.test/page",
        pageTitle: "Queue fixture"
      }}
      modelName="Primary model"
      onAnalyze={onAnalyze}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "开始分析" }));
  await waitFor(() => expect(onAnalyze).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "加入分析队列" }));
  await waitFor(() => expect(onAnalyze).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("region", { name: "分析任务队列" })).toBeVisible();
  expect(screen.getAllByText("分析中")).toHaveLength(2);

  act(() => {
    resolvers[0]?.({ content: "First result", durationMs: 800, providerName: "A", modelName: "A1" });
    resolvers[1]?.({ content: "Second result", durationMs: 900, providerName: "B", modelName: "B1" });
  });
  expect(await screen.findByText("Second result")).toBeVisible();
  expect(screen.getByText("2 已完成")).toBeVisible();
});

it("configures an optional daily model limit in inline settings", async () => {
  render(
    <Workbench
      source={null}
      onAnalyze={vi.fn()}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "打开设置" }));
  expect(await screen.findByText("模型库")).toBeVisible();
  fireEvent.click(screen.getByRole("checkbox", { name: "每日使用上限" }));
  expect(screen.getByRole("spinbutton")).toHaveValue(100);
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "25" } });
  expect(screen.getByRole("spinbutton")).toHaveValue(25);
});
