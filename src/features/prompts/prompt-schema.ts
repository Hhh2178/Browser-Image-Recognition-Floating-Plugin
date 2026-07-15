import { z } from "zod";
import type { OutputFormat, SourceType } from "../../contracts/analysis";

export const promptSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "请输入模板名称"),
  taskType: z.enum(["image_analysis", "screenshot_analysis"]),
  description: z.string(),
  tags: z.array(z.string()),
  content: z.string().trim().min(1, "模板内容不能为空"),
  supportedFormats: z.array(z.enum(["zh", "en", "json"])).min(1),
  source: z.enum(["builtin", "custom"]),
  schemaVersion: z.literal(1),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type PromptPreset = z.infer<typeof promptSchema>;

export interface PromptVariables {
  outputFormat: OutputFormat;
  sourceType: SourceType;
  pageTitle: string;
}

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;
const ALLOWED_VARIABLES = new Set<keyof PromptVariables>([
  "outputFormat",
  "sourceType",
  "pageTitle"
]);

export function renderPrompt(content: string, variables: PromptVariables): string {
  return content.replace(VARIABLE_PATTERN, (_match, key: string) => {
    if (!ALLOWED_VARIABLES.has(key as keyof PromptVariables)) {
      throw new Error(`未知模板变量：${key}`);
    }
    return variables[key as keyof PromptVariables];
  });
}
