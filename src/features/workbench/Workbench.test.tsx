import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
