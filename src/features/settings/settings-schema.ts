import { z } from "zod";

export const settingsSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string(),
  model: z.string().trim().min(1, "请输入模型名称"),
  endpointMode: z.enum(["base_url", "full_endpoint"]),
  imageTransport: z.enum(["auto", "data_url", "source_url", "text_only"]),
  hoverEnabled: z.boolean(),
  theme: z.enum(["system", "light", "dark"])
});

export type Settings = z.infer<typeof settingsSchema>;
export type ExportedSettings = Omit<Settings, "apiKey">;

export const DEFAULT_SETTINGS: Settings = {
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o",
  endpointMode: "base_url",
  imageTransport: "auto",
  hoverEnabled: false,
  theme: "system"
};

export function exportSettings(settings: Settings): ExportedSettings {
  return {
    apiUrl: settings.apiUrl,
    model: settings.model,
    endpointMode: settings.endpointMode,
    imageTransport: settings.imageTransport,
    hoverEnabled: settings.hoverEnabled,
    theme: settings.theme
  };
}
