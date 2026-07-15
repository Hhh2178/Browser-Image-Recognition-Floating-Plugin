import { describe, expect, it } from "vitest";
import { APP_NAME } from "./app-meta";

describe("app metadata", () => {
  it("exposes the product name", () => {
    expect(APP_NAME).toBe("Hhh Prompt Studio Next");
  });
});
