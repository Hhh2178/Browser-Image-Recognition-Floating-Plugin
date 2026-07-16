import { beforeEach, describe, expect, it } from "vitest";
import { historyDb, type HistoryRecord } from "./history-db";
import { historyRepository } from "./history-repository";

function makeRecord(index: number): HistoryRecord {
  return {
    id: String(index),
    createdAt: index,
    sourceType: "image",
    thumbnail: "data:image/jpeg;base64,thumb",
    templateId: "builtin:image-analysis",
    model: "vision-model",
    outputFormat: "zh",
    result: `result ${index}`,
    pageUrl: "https://example.com/"
  };
}

describe("history repository", () => {
  beforeEach(async () => {
    await historyDb.history.clear();
  });

  it("keeps only the newest 50 records", async () => {
    for (let index = 0; index < 51; index += 1) {
      await historyRepository.add(makeRecord(index));
    }

    const records = await historyRepository.list();
    expect(records).toHaveLength(50);
    expect(records.at(-1)?.id).toBe("1");
    expect(records[0]?.id).toBe("50");
  });

  it("returns only unexported records and marks them after export", async () => {
    await historyRepository.add(makeRecord(1));
    await historyRepository.add({ ...makeRecord(2), exportedAt: 200 });
    await historyRepository.add(makeRecord(3));

    const pending = await historyRepository.listPendingExport();
    expect(pending.map((record) => record.id)).toEqual(["1", "3"]);

    await historyRepository.markExported(pending.map((record) => record.id), 300);
    expect(await historyRepository.listPendingExport()).toEqual([]);
    expect((await historyRepository.list()).map((record) => record.exportedAt))
      .toEqual([300, 200, 300]);
  });
});
