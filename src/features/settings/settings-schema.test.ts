import { describe, expect, it } from "vitest";
import { exportSettings, settingsSchema } from "./settings-schema";

describe("settings schema", () => {
  it("rejects an invalid API URL", () => {
    expect(settingsSchema.safeParse({
      apiUrl: "not-a-url",
      apiKey: "",
      model: "gpt-4o",
      endpointMode: "base_url",
      imageTransport: "auto",
      hoverEnabled: false,
      theme: "system"
    }).success).toBe(false);
  });

  it("never exports the API key", () => {
    const exported = exportSettings({
      apiUrl: "https://api.example.com/v1",
      apiKey: "secret",
      model: "gpt-4o",
      endpointMode: "base_url",
      imageTransport: "auto",
      hoverEnabled: false,
      theme: "system"
    });

    expect(exported).not.toHaveProperty("apiKey");
  });
});
