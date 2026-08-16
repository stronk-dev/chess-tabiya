// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 (2026-08-16). Not production code.
// The shipped playwright.config.ts starts its own server on the schema-example
// fixture; this one attaches to the already-running harness server so the arm
// under measurement is stated rather than implied.
import { defineConfig } from "@playwright/test";

const port = Number(process.env.K9_PORT ?? 4180);

export default defineConfig({
  testDir: ".",
  testMatch: /browser-arm\.spec\.ts/,
  outputDir: "/tmp/k9-playwright",
  timeout: 900_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    actionTimeout: 20_000,
    navigationTimeout: 20_000,
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
