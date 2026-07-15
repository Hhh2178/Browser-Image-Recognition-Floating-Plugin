import type { AnalysisInput } from "./analysis";
import type { HistoryRecord } from "../features/history/history-db";

export type WorkbenchOpenMessage =
  | {
      type: "workbench/open";
      payload: {
        sourceType: "image";
        sourceUrl: string;
        pageUrl: string;
        pageTitle: string;
      };
    }
  | {
      type: "workbench/open-screenshot";
      payload: {
        sourceType: "screenshot";
        imageDataUrl: string;
        pageUrl: string;
        pageTitle: string;
      };
    }
  | { type: "workbench/show" };

export type RuntimeMessage =
  | WorkbenchOpenMessage
  | { type: "workbench/open-from-hover"; payload: {
      sourceUrl: string;
      pageUrl: string;
      pageTitle: string;
    } }
  | { type: "analysis/run"; payload: AnalysisInput }
  | { type: "history/add"; payload: HistoryRecord }
  | { type: "history/list" }
  | { type: "history/remove"; payload: { id: string } }
  | { type: "history/clear" }
  | { type: "settings/open" };

export type AnalysisResponse =
  | { ok: true; content: string; durationMs: number }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        retryable: boolean;
        diagnostic: Record<string, unknown>;
      };
    };
