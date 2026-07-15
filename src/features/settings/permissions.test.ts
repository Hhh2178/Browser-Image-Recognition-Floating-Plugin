import { describe, expect, it, vi } from "vitest";
import { endpointOriginPattern, requestEndpointPermission } from "./permissions";

describe("optional permissions", () => {
  it("reduces an endpoint to its origin pattern", () => {
    expect(endpointOriginPattern(
      "https://api.example.com/v1/chat/completions"
    )).toBe("https://api.example.com/*");
  });

  it("requests only the configured endpoint origin", async () => {
    const request = vi.fn().mockResolvedValue(true);
    await requestEndpointPermission(
      "https://api.example.com/v1/chat/completions",
      request
    );

    expect(request).toHaveBeenCalledWith({
      origins: ["https://api.example.com/*"]
    });
  });
});
