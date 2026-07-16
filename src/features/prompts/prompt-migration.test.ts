import { beforeEach, describe, expect, it, vi } from "vitest";
import { BUILTIN_PROMPTS } from "./builtins";
import { listPrompts } from "./prompt-repository";
import { promptSchema } from "./prompt-schema";

const storage: Record<string, unknown> = {};

beforeEach(() => {
  for (const key of Object.keys(storage)) {
    delete storage[key];
  }
  Object.assign(globalThis, {
    chrome: {
      storage: {
        local: {
          get: vi.fn((keys: string | string[]) => {
            const list = Array.isArray(keys) ? keys : [keys];
            return Promise.resolve(Object.fromEntries(list.map((key) => [key, storage[key]])));
          }),
          set: vi.fn((value: Record<string, unknown>) => {
            Object.assign(storage, value);
            return Promise.resolve();
          })
        }
      }
    }
  });
});

describe("legacy prompt migration", () => {
  it("ships legacy-derived built-ins that satisfy the current schema", () => {
    expect(promptSchema.array().safeParse(BUILTIN_PROMPTS).success).toBe(true);
    expect(BUILTIN_PROMPTS.map((prompt) => prompt.name)).toEqual(expect.arrayContaining([
      "高保真图片反推",
      "网页截图视觉拆解",
      "全维度美术蓝图"
    ]));
  });

  it("migrates supported legacy custom presets once without overwriting current prompts", async () => {
    storage.hhhCustomPrompts = [{
      id: "current-custom",
      name: "当前模板",
      taskType: "image_analysis",
      description: "keep",
      tags: [],
      content: "保留当前模板",
      supportedFormats: ["zh"],
      source: "custom",
      schemaVersion: 1,
      createdAt: 1,
      updatedAt: 1
    }];
    storage.comflyPromptTemplatePresets = [
      { id: "legacy-image", task: "image_analysis", name: "旧图片模板", content: "旧图片内容" },
      { id: "legacy-art", task: "art_brief", name: "旧美术模板", content: "只返回 JSON" },
      { id: "legacy-video", task: "video_analysis", name: "旧视频模板", content: "视频内容" }
    ];

    const first = await listPrompts();
    const second = await listPrompts();

    expect(first.find((prompt) => prompt.id === "current-custom")?.content).toBe("保留当前模板");
    expect(first.find((prompt) => prompt.id === "legacy:codex-promo:legacy-image")).toBeDefined();
    expect(first.find((prompt) => prompt.id === "legacy:codex-promo:legacy-art")?.supportedFormats).toEqual(["json"]);
    expect(first.some((prompt) => prompt.id.includes("legacy-video"))).toBe(false);
    expect(second.filter((prompt) => prompt.id === "legacy:codex-promo:legacy-image")).toHaveLength(1);
    expect(storage.hhhLegacyPromptMigrationV1).toBe(true);
  });
});
