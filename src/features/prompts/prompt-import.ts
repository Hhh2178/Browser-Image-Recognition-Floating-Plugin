import { promptSchema, type PromptPreset } from "./prompt-schema";

interface ImportError {
  index: number;
  message: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function importPromptBundle(raw: string): {
  imported: PromptPreset[];
  errors: ImportError[];
} {
  const parsed: unknown = JSON.parse(raw);
  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray(asRecord(parsed).prompts)
      ? asRecord(parsed).prompts as unknown[]
      : [];
  const imported: PromptPreset[] = [];
  const errors: ImportError[] = [];
  const now = Date.now();

  rows.forEach((value, index) => {
    const row = asRecord(value);
    const result = promptSchema.safeParse({
      id: asString(row.id),
      name: asString(row.name),
      taskType: row.taskType ?? "image_analysis",
      description: asString(row.description),
      tags: Array.isArray(row.tags) ? row.tags : [],
      content: row.content ?? row.prompt,
      supportedFormats: row.supportedFormats ?? ["zh", "en", "json"],
      source: "custom",
      schemaVersion: 1,
      createdAt: typeof row.createdAt === "number" ? row.createdAt : now,
      updatedAt: now
    });
    if (result.success) {
      imported.push(result.data);
    } else {
      errors.push({ index, message: result.error.issues[0]?.message ?? "模板无效" });
    }
  });

  return { imported, errors };
}
