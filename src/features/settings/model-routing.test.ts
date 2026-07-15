import { describe, expect, it, vi } from "vitest";
import type { Settings } from "./settings-schema";
import {
  chooseAnalysisTarget,
  ModelRoutingError,
  reserveAnalysisTarget
} from "./model-routing";

const settings: Settings = {
  schemaVersion: 2,
  providers: [
    {
      id: "provider-a",
      name: "Provider A",
      apiUrl: "https://a.example.com/v1",
      apiKey: "a-key",
      endpointMode: "base_url",
      imageTransport: "auto",
      enabled: true,
      models: [
        { id: "model-a", name: "Model A", model: "a", enabled: true, dailyLimit: 2 },
        { id: "model-b", name: "Model B", model: "b", enabled: true, dailyLimit: 1 }
      ]
    },
    {
      id: "provider-b",
      name: "Provider B",
      apiUrl: "https://b.example.com/v1",
      apiKey: "b-key",
      endpointMode: "base_url",
      imageTransport: "auto",
      enabled: true,
      models: [
        { id: "model-c", name: "Model C", model: "c", enabled: true, dailyLimit: null }
      ]
    }
  ],
  activeProviderId: "provider-a",
  activeModelId: "model-a",
  hoverEnabled: false,
  theme: "system"
};

describe("quota-aware model routing", () => {
  it("uses the active limited model while quota remains", () => {
    const target = chooseAnalysisTarget(settings, {
      "provider-a:model-a": { date: "2026-07-15", count: 1 }
    }, undefined, "2026-07-15");
    expect(target.model.id).toBe("model-a");
  });

  it("falls back when the active limited model is exhausted", () => {
    const target = chooseAnalysisTarget(settings, {
      "provider-a:model-a": { date: "2026-07-15", count: 2 }
    }, undefined, "2026-07-15");
    expect(target.model.id).toBe("model-b");
  });

  it("can fall back across providers to an unlimited model", () => {
    const target = chooseAnalysisTarget(settings, {
      "provider-a:model-a": { date: "2026-07-15", count: 2 },
      "provider-a:model-b": { date: "2026-07-15", count: 1 }
    }, undefined, "2026-07-15");
    expect(target.model.id).toBe("model-c");
    expect(target.provider.id).toBe("provider-b");
  });

  it("does not leave an unlimited active model", () => {
    const unlimitedSettings = structuredClone(settings);
    unlimitedSettings.activeProviderId = "provider-b";
    unlimitedSettings.activeModelId = "model-c";
    const target = chooseAnalysisTarget(unlimitedSettings, {
      "provider-b:model-c": { date: "2026-07-15", count: 999 }
    }, undefined, "2026-07-15");
    expect(target.model.id).toBe("model-c");
  });

  it("reports exhaustion when every limited candidate is used", () => {
    const limitedSettings = structuredClone(settings);
    limitedSettings.providers[1]!.models[0]!.dailyLimit = 1;
    expect(() => chooseAnalysisTarget(limitedSettings, {
      "provider-a:model-a": { date: "2026-07-15", count: 2 },
      "provider-a:model-b": { date: "2026-07-15", count: 1 },
      "provider-b:model-c": { date: "2026-07-15", count: 1 }
    }, undefined, "2026-07-15")).toThrow(ModelRoutingError);
  });

  it("serializes concurrent reservations so the last quota use is not oversubscribed", async () => {
    const limitedSettings = structuredClone(settings);
    limitedSettings.providers[0]!.models[0]!.dailyLimit = 1;
    const storage: Record<string, unknown> = {};
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn((key: string) => Promise.resolve({ [key]: storage[key] })),
          set: vi.fn((value: Record<string, unknown>) => Promise.resolve(Object.assign(storage, value)))
        }
      }
    });

    const [first, second] = await Promise.all([
      reserveAnalysisTarget(limitedSettings),
      reserveAnalysisTarget(limitedSettings)
    ]);

    expect(first.model.id).toBe("model-a");
    expect(second.model.id).toBe("model-b");
    vi.unstubAllGlobals();
  });
});
