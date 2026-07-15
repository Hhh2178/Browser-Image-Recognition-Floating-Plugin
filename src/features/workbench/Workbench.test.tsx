import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";

it("renders only as a floating window and clamps a stale position", async () => {
  render(
    <Workbench
      initialResult="analysis result"
      source={null}
      initialPosition={{ x: 5000, y: 5000 }}
      onAnalyze={vi.fn()}
      onOpenSettings={vi.fn()}
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
      onOpenSettings={vi.fn()}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "从当前页面选择图片" }));
  expect(onPickImage).toHaveBeenCalledOnce();
});
