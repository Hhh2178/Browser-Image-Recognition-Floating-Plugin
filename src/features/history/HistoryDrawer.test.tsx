import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { HistoryRecord } from "./history-db";
import { HistoryDrawer } from "./HistoryDrawer";

const record: HistoryRecord = {
  id: "record-1",
  createdAt: Date.now(),
  sourceType: "image",
  thumbnail: "data:image/jpeg;base64,thumb",
  templateId: "builtin:image-analysis",
  model: "vision-model",
  outputFormat: "zh",
  result: "反推提示词",
  pageUrl: "https://example.com/"
};

it("exports only pending history from the drawer action", async () => {
  const onExport = vi.fn().mockResolvedValue({
    count: 1,
    fileName: "hhh-prompt-export.txt"
  });
  render(
    <HistoryDrawer
      records={[record]}
      onRestore={vi.fn()}
      onDelete={vi.fn()}
      onClear={vi.fn()}
      onExport={onExport}
      onClose={vi.fn()}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "导出未导出内容 (1)" }));

  expect(onExport).toHaveBeenCalledOnce();
  await waitFor(() => expect(screen.getByRole("status"))
    .toHaveTextContent("已导出 1 条到 hhh-prompt-export.txt"));
});
