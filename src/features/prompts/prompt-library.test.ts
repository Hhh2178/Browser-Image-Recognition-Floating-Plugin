import { describe, expect, it } from "vitest";
import { importPromptBundle } from "./prompt-import";
import { renderPrompt } from "./prompt-schema";

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
});
