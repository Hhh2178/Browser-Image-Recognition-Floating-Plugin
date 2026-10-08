import { describe, expect, it } from "vitest";
import { BUILTIN_PROMPTS } from "./builtins";
import { promptSchema, renderPrompt } from "./prompt-schema";

const EXPECTED_IDS = [
  "builtin:image-analysis",
  "builtin:screenshot-analysis",
  "builtin:ecommerce-poster-reverse",
  "builtin:legacy-high-fidelity-image",
  "builtin:legacy-screenshot-visual",
  "builtin:legacy-art-blueprint"
];

const MARKER_PROTOCOL = "不要输出解释、分析过程";
const MARKER_CLOSING = "最终只返回可直接复用的结果";
const MARKER_SAFETY_VALVE = "不需要为了满足字数刻意扩写";
const MARKER_BLUEPRINT_SAFETY = "不为凑满字数虚构细节";

describe("builtin prompt templates", () => {
  it("keeps a stable id set", () => {
    expect(BUILTIN_PROMPTS.map((prompt) => prompt.id).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it("passes every template through the schema", () => {
    expect(promptSchema.array().safeParse(BUILTIN_PROMPTS).success).toBe(true);
  });

  it.each(EXPECTED_IDS)("renders %s without leftover variables", (id) => {
    const preset = BUILTIN_PROMPTS.find((prompt) => prompt.id === id);
    expect(preset).toBeDefined();
    for (const outputFormat of ["zh", "json"] as const) {
      const rendered = renderPrompt(preset!.content, {
        outputFormat,
        sourceType: "screenshot",
        pageTitle: "测试页面"
      });
      expect(rendered).not.toContain("{{");
      expect(rendered.length).toBeGreaterThan(1000);
    }
  });

  it.each(EXPECTED_IDS)("keeps the six-part discipline in %s", (id) => {
    const preset = BUILTIN_PROMPTS.find((prompt) => prompt.id === id)!;
    expect(preset.content).toContain(MARKER_PROTOCOL);
    expect(preset.content).toContain(MARKER_CLOSING);
    if (id === "builtin:legacy-art-blueprint") {
      expect(preset.content).toContain(MARKER_BLUEPRINT_SAFETY);
    } else {
      expect(preset.content).toContain(MARKER_SAFETY_VALVE);
    }
  });

  it("declares a JSON skeleton in json-capable templates", () => {
    for (const preset of BUILTIN_PROMPTS) {
      if (!preset.supportedFormats.includes("json")) {
        continue;
      }
      if (preset.id === "builtin:legacy-art-blueprint") {
        expect(preset.content).toContain('"reversePrompt"');
      } else {
        expect(preset.content).toContain('"quality"');
      }
    }
  });
});
