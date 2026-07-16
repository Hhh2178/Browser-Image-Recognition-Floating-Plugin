import { describe, expect, it, vi } from "vitest";
import {
  endpointOriginPattern,
  requestEndpointPermission,
  requestEndpointPermissions
} from "./permissions";

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

  it("delegates endpoint permissions when the content script lacks the permissions API", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ granted: true });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    await expect(requestEndpointPermissions([
      "https://api.example.com/v1"
    ])).resolves.toBe(true);
    expect(sendMessage).toHaveBeenCalledWith({
      type: "permissions/request-endpoints",
      payload: { origins: ["https://api.example.com/*"] }
    });
    vi.unstubAllGlobals();
  });
});
