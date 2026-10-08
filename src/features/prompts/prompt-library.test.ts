import { describe, expect, it } from "vitest";
import { BUILTIN_PROMPTS } from "./builtins";
import { importPromptBundle } from "./prompt-import";
import { promptSchema, renderPrompt } from "./prompt-schema";

describe("prompt library", () => {
  it("renders supported variables", () => {
    expect(renderPrompt("Return {{outputFormat}} for {{sourceType}}", {
      outputFormat: "json",
      sourceType: "image",
      pageTitle: "Reference"
    })).toBe("Return json for image");
  });

  it("rejects unknown variables", () => {
    expect(() => renderPrompt("{{unknown}}", {
      outputFormat: "zh",
      sourceType: "image",
      pageTitle: ""
    })).toThrow("未知模板变量：unknown");
  });

  it("imports the old prompt field", () => {
    const result = importPromptBundle(JSON.stringify([
      { id: "old", name: "旧模板", prompt: "Analyze the image" }
    ]));

    expect(result.imported[0]).toMatchObject({
      id: "old",
      name: "旧模板",
      content: "Analyze the image",
      source: "custom"
    });
    expect(result.errors).toEqual([]);
  });

  it("ships the e-commerce poster template as a builtin", () => {
    const preset = BUILTIN_PROMPTS.find((item) => item.id === "builtin:ecommerce-poster-reverse");
    expect(preset).toBeDefined();
    expect(promptSchema.safeParse(preset).success).toBe(true);
    expect(preset?.name).toBe("电商海报类反推");
    expect((preset?.content.length ?? 0)).toBeGreaterThan(5000);

    const rendered = renderPrompt(preset!.content, {
      outputFormat: "json",
      sourceType: "image",
      pageTitle: "测试页"
    });
    expect(rendered).not.toContain("{{");
  });
});
