import type { OutputFormat, SourceType } from "../../contracts/analysis";
import type { PromptPreset } from "../prompts/prompt-schema";

export type LayoutMode = "float" | "dock";

export interface WorkbenchSource {
  sourceType: SourceType;
  previewUrl: string;
  imageDataUrl: string;
  sourceUrl?: string;
  pageUrl: string;
  pageTitle: string;
}

export interface AnalyzeSelection {
  source: WorkbenchSource;
  prompt: PromptPreset;
  outputFormat: OutputFormat;
}
