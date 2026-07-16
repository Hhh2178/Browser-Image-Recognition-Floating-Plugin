import { historyDb, type HistoryRecord } from "./history-db";

export const historyRepository = {
  async add(record: HistoryRecord): Promise<void> {
    await historyDb.transaction("rw", historyDb.history, async () => {
      await historyDb.history.put(record);
      const overflow = Math.max(0, (await historyDb.history.count()) - 50);
      if (overflow > 0) {
        const oldest = await historyDb.history
          .orderBy("createdAt")
          .limit(overflow)
          .primaryKeys();
        await historyDb.history.bulkDelete(oldest);
      }
    });
  },

  list(): Promise<HistoryRecord[]> {
    return historyDb.history.orderBy("createdAt").reverse().toArray();
  },

  async listPendingExport(): Promise<HistoryRecord[]> {
    const records = await historyDb.history.orderBy("createdAt").toArray();
    return records.filter((record) => !record.exportedAt && record.result.trim());
  },

  async markExported(ids: string[], exportedAt: number): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await historyDb.transaction("rw", historyDb.history, async () => {
      const records = (await historyDb.history.bulkGet(ids))
        .filter((record): record is HistoryRecord => Boolean(record));
      await historyDb.history.bulkPut(records.map((record) => ({
        ...record,
        exportedAt
      })));
    });
  },

  remove(id: string): Promise<void> {
    return historyDb.history.delete(id);
  },

  clear(): Promise<void> {
    return historyDb.history.clear();
  }
};
