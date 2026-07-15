import { parseStoredSettings, settingsSchema, type Settings } from "./settings-schema";

const KEY = "hhhSettings";

export async function loadSettings(): Promise<Settings> {
  const value: unknown = (await chrome.storage.local.get(KEY))[KEY];
  const settings = parseStoredSettings(value);
  if (value && !settingsSchema.safeParse(value).success) {
    await chrome.storage.local.set({ [KEY]: settings });
  }
  return settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [KEY]: settingsSchema.parse(settings) });
}
