import { describe, expect, it } from "vitest";
import { buildChatPayload } from "./build-request";
import { redactDiagnostic } from "./diagnostics";
import { normalizeEndpoint } from "./endpoint";
import { parseAnalysisResponse } from "./parse-response";

describe("analysis core", () => {
  it("normalizes base and full endpoints", () => {
    expect(normalizeEndpoint("https://api.example.com/v1/", "base_url"))
      .toBe("https://api.example.com/v1/chat/completions");
    expect(normalizeEndpoint(
      "https://api.example.com/custom/chat/completions/",
      "full_endpoint"
    )).toBe("https://api.example.com/custom/chat/completions");
  });

  it("builds a multimodal chat payload", () => {
    const payload = buildChatPayload({
      model: "vision-model",
      prompt: "Analyze",
      imageDataUrl: "data:image/jpeg;base64,abc",
      sourceUrl: "https://site.test/image.jpg",
      imageTransport: "data_url"
    });

    expect(payload.messages[0]?.content).toEqual([
      { type: "text", text: "Analyze" },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,abc" } }
    ]);
  });

  it("parses common response shapes", () => {
    expect(parseAnalysisResponse({
      choices: [{ message: { content: " result " } }]
    })).toBe("result");
    expect(parseAnalysisResponse({ output_text: "alternate" })).toBe("alternate");
  });

  it("redacts secrets and image data", () => {
    expect(redactDiagnostic({
      authorization: "Bearer secret",
      image: "data:image/png;base64,abc",
      model: "vision-model"
    })).toEqual({
      authorization: "[REDACTED]",
      image: "[IMAGE_DATA]",
      model: "vision-model"
    });
  });
});
