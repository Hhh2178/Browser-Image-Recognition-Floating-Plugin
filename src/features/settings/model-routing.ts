import type {
  ModelConfig,
  ProviderConfig,
  Settings
} from "./settings-schema";

const USAGE_KEY = "hhhDailyModelUsage";

export interface DailyUsageEntry {
  date: string;
  count: number;
}

export type DailyUsage = Record<string, DailyUsageEntry>;

export interface ResolvedAnalysisTarget {
  provider: ProviderConfig;
  model: ModelConfig;
  usageKey: string;
  usedToday: number;
}

export class ModelRoutingError extends Error {
  constructor(
    public readonly code: "CONFIG_MISSING" | "DAILY_LIMIT_REACHED",
    message: string
  ) {
    super(message);
  }
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function chooseAnalysisTarget(
  settings: Settings,
  usage: DailyUsage,
  preferredModelId = settings.activeModelId,
  today = localDateKey()
): ResolvedAnalysisTarget {
  const candidates = settings.providers
    .filter((provider) => provider.enabled)
    .flatMap((provider) => provider.models
      .filter((model) => model.enabled)
      .map((model) => ({ provider, model })));
  const preferred = candidates.find(({ model }) => model.id === preferredModelId)
    ?? candidates.find(({ model }) => model.id === settings.activeModelId)
    ?? candidates[0];
  if (!preferred) {
    throw new ModelRoutingError("CONFIG_MISSING", "没有可用的服务商或模型");
  }
  if (!preferred.provider.apiKey) {
    throw new ModelRoutingError("CONFIG_MISSING", `请先配置 ${preferred.provider.name} 的 API Key`);
  }
  const preferredUsageKey = `${preferred.provider.id}:${preferred.model.id}`;
  const preferredCount = usage[preferredUsageKey]?.date === today
    ? usage[preferredUsageKey].count
    : 0;
  if (preferred.model.dailyLimit === null || preferredCount < preferred.model.dailyLimit) {
    return {
      ...preferred,
      usageKey: preferredUsageKey,
      usedToday: preferredCount
    };
  }

  const fallback = candidates.find(({ provider, model }) => {
    if (model.id === preferred.model.id || !provider.apiKey) {
      return false;
    }
    if (model.dailyLimit === null) {
      return true;
    }
    const key = `${provider.id}:${model.id}`;
    const count = usage[key]?.date === today ? usage[key].count : 0;
    return count < model.dailyLimit;
  });
  if (!fallback) {
    throw new ModelRoutingError("DAILY_LIMIT_REACHED", "已配置每日上限的模型均已用完，且没有可用的备用模型");
  }
  const usageKey = `${fallback.provider.id}:${fallback.model.id}`;
  return {
    ...fallback,
    usageKey,
    usedToday: usage[usageKey]?.date === today ? usage[usageKey].count : 0
  };
}

let reservationQueue: Promise<void> = Promise.resolve();

export async function reserveAnalysisTarget(
  settings: Settings,
  preferredModelId?: string
): Promise<ResolvedAnalysisTarget> {
  let result: ResolvedAnalysisTarget | undefined;
  let failure: unknown;
  reservationQueue = reservationQueue.then(async () => {
    try {
      const stored = await chrome.storage.local.get(USAGE_KEY);
      const usage = isDailyUsage(stored[USAGE_KEY]) ? stored[USAGE_KEY] : {};
      const today = localDateKey();
      result = chooseAnalysisTarget(settings, usage, preferredModelId, today);
      if (result.model.dailyLimit !== null) {
        usage[result.usageKey] = { date: today, count: result.usedToday + 1 };
        await chrome.storage.local.set({ [USAGE_KEY]: usage });
      }
    } catch (error) {
      failure = error;
    }
  });
  await reservationQueue;
  if (failure) {
    throw failure instanceof Error ? failure : new Error("模型额度预占失败");
  }
  return result!;
}

export async function loadDailyUsage(): Promise<DailyUsage> {
  const stored = await chrome.storage.local.get(USAGE_KEY);
  return isDailyUsage(stored[USAGE_KEY]) ? stored[USAGE_KEY] : {};
}

function isDailyUsage(value: unknown): value is DailyUsage {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
