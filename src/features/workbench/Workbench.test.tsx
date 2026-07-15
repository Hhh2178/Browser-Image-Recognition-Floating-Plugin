import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Workbench } from "./Workbench";

it("keeps a result when switching from float to dock", () => {
  const saveLayout = vi.fn();
  render(
    <Workbench
      initialMode="float"
      initialResult="analysis result"
      source={null}
      onAnalyze={vi.fn()}
      onOpenSettings={vi.fn()}
      onOpenHistory={vi.fn()}
      onClose={vi.fn()}
      saveLayout={saveLayout}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "停靠到右侧" }));

  expect(screen.getByText("analysis result")).toBeVisible();
  expect(screen.getByTestId("workbench-shell")).toHaveAttribute("data-mode", "dock");
  expect(saveLayout).toHaveBeenCalledWith("dock");
});
