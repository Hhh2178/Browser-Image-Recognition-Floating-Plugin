import Dexie, { type EntityTable } from "dexie";
import type { OutputFormat, SourceType } from "../../contracts/analysis";

export interface HistoryRecord {
  id: string;
  createdAt: number;
  sourceType: SourceType;
  thumbnail: string;
  templateId: string;
  model: string;
  outputFormat: OutputFormat;
  result: string;
  pageUrl: string;
  exportedAt?: number;
}

// Keep the original database identifier so existing users do not lose history
// when the public product name changes.
export const historyDb = new Dexie("hhh-prompt-studio-next") as Dexie & {
  history: EntityTable<HistoryRecord, "id">;
};

historyDb.version(1).stores({
  history: "id, createdAt, templateId, model, outputFormat"
});
