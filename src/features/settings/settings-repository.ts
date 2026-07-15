import { DEFAULT_SETTINGS, settingsSchema, type Settings } from "./settings-schema";

const KEY = "hhhSettings";

export async function loadSettings(): Promise<Settings> {
  const value: unknown = (await chrome.storage.local.get(KEY))[KEY];
  return value ? settingsSchema.parse(value) : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [KEY]: settingsSchema.parse(settings) });
}
