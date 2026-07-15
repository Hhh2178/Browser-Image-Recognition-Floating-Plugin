export type OutputFormat = "zh" | "en" | "json";
export type SourceType = "image" | "screenshot";

export interface AnalysisInput {
  sourceType: SourceType;
  sourceUrl?: string;
  imageDataUrl: string;
  prompt: string;
  outputFormat: OutputFormat;
  preferredModelId?: string;
  pageUrl: string;
  pageTitle: string;
}
