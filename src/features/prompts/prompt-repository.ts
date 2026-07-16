import { BUILTIN_PROMPTS } from "./builtins";
import { promptSchema, type PromptPreset } from "./prompt-schema";

const KEY = "hhhCustomPrompts";
const LEGACY_KEY = "comflyPromptTemplatePresets";
const MIGRATION_KEY = "hhhLegacyPromptMigrationV1";

export async function listPrompts(): Promise<PromptPreset[]> {
  const custom = await loadAndMigrateCustomPrompts();
  return [...BUILTIN_PROMPTS, ...custom];
}

export async function savePrompt(prompt: PromptPreset): Promise<void> {
  const parsed = promptSchema.parse(prompt);
  if (parsed.source !== "custom") {
    throw new Error("内置模板只读");
  }
  const custom = (await listPrompts())
    .filter((item) => item.source === "custom" && item.id !== parsed.id);
  await chrome.storage.local.set({ [KEY]: [...custom, parsed] });
}

export async function deletePrompt(id: string): Promise<void> {
  const custom = (await listPrompts())
    .filter((item) => item.source === "custom" && item.id !== id);
  await chrome.storage.local.set({ [KEY]: custom });
}

export function duplicatePrompt(prompt: PromptPreset): PromptPreset {
  const now = Date.now();
  return {
    ...prompt,
    id: crypto.randomUUID(),
    name: `${prompt.name} 副本`,
    source: "custom",
    createdAt: now,
    updatedAt: now
  };
}

async function loadAndMigrateCustomPrompts(): Promise<PromptPreset[]> {
  const stored = await chrome.storage.local.get([KEY, LEGACY_KEY, MIGRATION_KEY]);
  const current = parseCustomPrompts(stored[KEY]);
  if (stored[MIGRATION_KEY] === true) {
    return current;
  }

  const existingIds = new Set(current.map((prompt) => prompt.id));
  const now = Date.now();
  const migrated = Array.isArray(stored[LEGACY_KEY])
    ? stored[LEGACY_KEY]
      .map((value, index) => migrateLegacyPrompt(value, index, now))
      .filter((value): value is PromptPreset => Boolean(value))
      .filter((prompt) => !existingIds.has(prompt.id))
    : [];
  const next = [...current, ...migrated];
  await chrome.storage.local.set({
    [KEY]: next,
    [MIGRATION_KEY]: true
  });
  return next;
}

function parseCustomPrompts(value: unknown): PromptPreset[] {
  const parsed = promptSchema.array().safeParse(value ?? []);
  return parsed.success
    ? parsed.data.filter((prompt) => prompt.source === "custom")
    : [];
}

function migrateLegacyPrompt(value: unknown, index: number, now: number): PromptPreset | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const legacy = value as Record<string, unknown>;
  const task = typeof legacy.task === "string" ? legacy.task : "";
  const content = typeof legacy.content === "string" ? legacy.content.trim() : "";
  const name = typeof legacy.name === "string" ? legacy.name.trim() : "";
  if (!content || !name || !["image_analysis", "screenshot_analysis", "art_brief"].includes(task)) {
    return null;
  }
  const legacyId = typeof legacy.id === "string" && legacy.id.trim()
    ? legacy.id.trim()
    : `${task}-${index}`;
  const jsonOnly = task === "art_brief";
  return promptSchema.parse({
    id: `legacy:codex-promo:${legacyId}`,
    name,
    taskType: task === "screenshot_analysis" ? "screenshot_analysis" : "image_analysis",
    description: "从旧版 codex-promo 自动迁移的自定义预设。",
    tags: ["旧版迁移", task],
    content,
    supportedFormats: jsonOnly ? ["json"] : ["zh", "en", "json"],
    source: "custom",
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now
  });
}
