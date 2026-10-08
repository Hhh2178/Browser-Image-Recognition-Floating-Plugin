import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  exportSettings,
  parseStoredSettings,
  settingsSchema
} from "./settings-schema";

describe("settings schema", () => {
  it("rejects an invalid provider API URL", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.providers[0]!.apiUrl = "not-a-url";
    expect(settingsSchema.safeParse(settings).success).toBe(false);
  });

  it("migrates a legacy single-model configuration", () => {
    const migrated = parseStoredSettings({
      apiUrl: "https://api.example.com/v1",
      apiKey: "legacy-secret",
      model: "legacy-vision",
      endpointMode: "base_url",
      imageTransport: "auto",
      hoverEnabled: true,
      theme: "dark"
    });

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.providers[0]?.apiKey).toBe("legacy-secret");
    expect(migrated.providers[0]?.models[0]?.model).toBe("legacy-vision");
    expect(migrated.activeModelId).toBe("model-migrated");
  });

  it("never exports provider API keys", () => {
    const settings = structuredClone(DEFAULT_SETTINGS);
    settings.providers[0]!.apiKey = "secret";
    const exported = exportSettings(settings);

    expect(exported.providers[0]).not.toHaveProperty("apiKey");
  });

  it("ships migrated presets as safe defaults", () => {
    expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
    expect(DEFAULT_SETTINGS.providers.every((provider) => provider.apiKey === "")).toBe(true);

    expect(DEFAULT_SETTINGS.activeProviderId).toBe("provider-modelscope");
    const active = DEFAULT_SETTINGS.providers.find((provider) => provider.id === "provider-modelscope");
    expect(active?.enabled).toBe(true);
    expect(active?.models.map((model) => model.model)).toEqual([
      "Qwen/Qwen3.8-Flash-Next",
      "deepseek-ai/DeepSeek-V4.1-Flash",
      "Qwen/Qwen3.8-27B"
    ]);
    expect(active?.models.every((model) => model.dailyLimit === 50)).toBe(true);

    expect(DEFAULT_SETTINGS.providers.find((provider) => provider.id === "provider-openai")?.enabled)
      .toBe(false);
    const qwen27b = DEFAULT_SETTINGS.providers
      .flatMap((provider) => provider.models)
      .filter((model) => model.model === "Qwen/Qwen3.8-27B");
    expect(qwen27b).toHaveLength(1);
  });
});
