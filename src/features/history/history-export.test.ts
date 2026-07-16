import { describe, expect, it, vi } from "vitest";
import type { HistoryRecord } from "./history-db";
import { createHistoryExportFilename, formatHistoryExport } from "./history-export";

const record: HistoryRecord = {
  id: "record-1",
  createdAt: new Date("2026-07-15T10:00:00+08:00").getTime(),
  sourceType: "image",
  thumbnail: "data:image/jpeg;base64,thumb",
  templateId: "builtin:image-analysis",
  model: "Qwen/Qwen3-VL-8B-Instruct",
  outputFormat: "zh",
  result: "  完整反推提示词  ",
  pageUrl: "https://example.com/image"
};

describe("history export", () => {
  it("formats complete records as UTF-8 friendly plain text", () => {
    vi.spyOn(Date, "now").mockReturnValue(record.createdAt);
    const text = formatHistoryExport([record]);

    expect(text).toContain("记录数量：1");
    expect(text).toContain("模型：Qwen/Qwen3-VL-8B-Instruct");
    expect(text).toContain("来源：https://example.com/image");
    expect(text).toContain("\r\n完整反推提示词");
  });

  it("creates a filesystem-safe txt filename", () => {
    expect(createHistoryExportFilename(
      new Date("2026-07-15T10:20:30+08:00").getTime()
    )).toMatch(/^hhh-prompt-export-\d{8}-\d{6}\.txt$/);
  });
});
