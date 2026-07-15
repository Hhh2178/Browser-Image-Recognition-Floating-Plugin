import { BUILTIN_PROMPTS } from "./builtins";
import { promptSchema, type PromptPreset } from "./prompt-schema";

const KEY = "hhhCustomPrompts";

export async function listPrompts(): Promise<PromptPreset[]> {
  const stored: unknown = (await chrome.storage.local.get(KEY))[KEY];
  const custom = stored ? promptSchema.array().parse(stored) : [];
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
