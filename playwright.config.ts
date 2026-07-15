import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  workers: 1,
  use: {
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure"
  },
  webServer: {
    command: "node tests/fixtures/server.mjs",
    url: "http://127.0.0.1:43118/health",
    reuseExistingServer: true,
    timeout: 30_000
  }
});
