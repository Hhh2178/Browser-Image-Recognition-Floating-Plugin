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

  remove(id: string): Promise<void> {
    return historyDb.history.delete(id);
  },

  clear(): Promise<void> {
    return historyDb.history.clear();
  }
};
