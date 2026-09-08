import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PRODUCTION_PORT ?? 4174);

export default defineConfig({
  testDir: "tests/browser",
  testMatch: "production.spec.ts",
  outputDir: "test-results/playwright-production",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/production", open: "never" }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    // This is the packaged default, not the authoring server: no NODE_ENV override
    // and no explicit draft/fixture path. ENGINE_MODE=mock matches `make up`.
    command:
      "pnpm build && ENGINE_MODE=mock TABIYA_COOKIE_SECURE=false DATABASE_PATH=:memory: " +
      `PORT=${port} node apps/server/dist/main.js`,
    url: `http://127.0.0.1:${port}/healthz`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
