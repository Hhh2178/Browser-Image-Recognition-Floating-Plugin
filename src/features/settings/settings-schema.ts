import { z } from "zod";

export const endpointModeSchema = z.enum(["base_url", "full_endpoint"]);
export const imageTransportSchema = z.enum(["auto", "data_url", "source_url", "text_only"]);

export const modelConfigSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "请输入模型名称"),
  model: z.string().trim().min(1, "请输入模型标识"),
  enabled: z.boolean(),
  dailyLimit: z.number().int().positive().nullable()
});

export const providerConfigSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1, "请输入服务商名称"),
  apiUrl: z.string().url("请输入有效的 API 地址"),
  apiKey: z.string(),
  endpointMode: endpointModeSchema,
  imageTransport: imageTransportSchema,
  enabled: z.boolean(),
  models: z.array(modelConfigSchema).min(1, "至少保留一个模型")
});

export const settingsSchema = z.object({
  schemaVersion: z.literal(2),
  providers: z.array(providerConfigSchema).min(1, "至少保留一个服务商"),
  activeProviderId: z.string().trim().min(1),
  activeModelId: z.string().trim().min(1),
  hoverEnabled: z.boolean(),
  theme: z.enum(["system", "light", "dark"])
}).superRefine((settings, context) => {
  const provider = settings.providers.find((item) => item.id === settings.activeProviderId);
  if (!provider) {
    context.addIssue({ code: "custom", path: ["activeProviderId"], message: "当前服务商不存在" });
    return;
  }
  if (!provider.models.some((model) => model.id === settings.activeModelId)) {
    context.addIssue({ code: "custom", path: ["activeModelId"], message: "当前模型不存在" });
  }
});

const legacySettingsSchema = z.object({
  apiUrl: z.string().url(),
  apiKey: z.string(),
  model: z.string().trim().min(1),
  endpointMode: endpointModeSchema,
  imageTransport: imageTransportSchema,
  hoverEnabled: z.boolean(),
  theme: z.enum(["system", "light", "dark"])
});

export type Settings = z.infer<typeof settingsSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type ModelConfig = z.infer<typeof modelConfigSchema>;
export type EndpointMode = z.infer<typeof endpointModeSchema>;
export type ImageTransport = z.infer<typeof imageTransportSchema>;
export type ExportedSettings = Omit<Settings, "providers"> & {
  providers: Array<Omit<ProviderConfig, "apiKey">>;
};

export const DEFAULT_SETTINGS: Settings = {
  schemaVersion: 2,
  providers: [
    {
      id: "provider-openai",
      name: "OpenAI",
      apiUrl: "https://api.openai.com/v1",
      apiKey: "",
      endpointMode: "base_url",
      imageTransport: "auto",
      enabled: true,
      models: [{
        id: "model-gpt-4o",
        name: "GPT-4o",
        model: "gpt-4o",
        enabled: true,
        dailyLimit: null
      }]
    },
    {
      id: "provider-modelscope",
      name: "ModelScope 魔搭",
      apiUrl: "https://api-inference.modelscope.cn/v1",
      apiKey: "",
      endpointMode: "base_url",
      imageTransport: "auto",
      enabled: false,
      models: [{
        id: "model-modelscope-qwen-vl",
        name: "Qwen VL",
        model: "Qwen/Qwen2.5-VL-72B-Instruct",
        enabled: true,
        dailyLimit: null
      }]
    }
  ],
  activeProviderId: "provider-openai",
  activeModelId: "model-gpt-4o",
  hoverEnabled: false,
  theme: "system"
};

export function parseStoredSettings(value: unknown): Settings {
  const current = settingsSchema.safeParse(value);
  if (current.success) {
    return current.data;
  }
  const legacy = legacySettingsSchema.safeParse(value);
  if (!legacy.success) {
    return structuredClone(DEFAULT_SETTINGS);
  }
  return {
    schemaVersion: 2,
    providers: [{
      id: "provider-migrated",
      name: "原有服务商",
      apiUrl: legacy.data.apiUrl,
      apiKey: legacy.data.apiKey,
      endpointMode: legacy.data.endpointMode,
      imageTransport: legacy.data.imageTransport,
      enabled: true,
      models: [{
        id: "model-migrated",
        name: legacy.data.model,
        model: legacy.data.model,
        enabled: true,
        dailyLimit: null
      }]
    }],
    activeProviderId: "provider-migrated",
    activeModelId: "model-migrated",
    hoverEnabled: legacy.data.hoverEnabled,
    theme: legacy.data.theme
  };
}

export function exportSettings(settings: Settings): ExportedSettings {
  return {
    schemaVersion: 2,
    providers: settings.providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      apiUrl: provider.apiUrl,
      endpointMode: provider.endpointMode,
      imageTransport: provider.imageTransport,
      enabled: provider.enabled,
      models: provider.models
    })),
    activeProviderId: settings.activeProviderId,
    activeModelId: settings.activeModelId,
    hoverEnabled: settings.hoverEnabled,
    theme: settings.theme
  };
}

export function getActiveProvider(settings: Settings): ProviderConfig {
  return settings.providers.find((provider) => provider.id === settings.activeProviderId)
    ?? settings.providers[0]!;
}

export function getActiveModel(settings: Settings): ModelConfig {
  const provider = getActiveProvider(settings);
  return provider.models.find((model) => model.id === settings.activeModelId)
    ?? provider.models[0]!;
}
