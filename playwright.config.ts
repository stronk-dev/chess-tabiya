import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

export default defineConfig({
  testDir: "tests/browser",
  outputDir: "test-results/playwright",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      `pnpm build && NODE_ENV=development ENGINE_MODE=mock TABIYA_COOKIE_SECURE=false DATABASE_PATH=:memory: ` +
      "DRAFT_PACK_FILES=schemas/drill_pack.example.json,schemas/fixtures/drill-pack/terminal-outcome.browser.json," +
      "content/drafts/immediate-guard.browser.json,content/drafts/line-boundary.browser.json," +
      "content/drafts/outcome-hold.browser.json,content/drafts/outcome-resist.browser.json," +
      "content/drafts/stated-reasoning.browser.json,content/drafts/trajectory-legs.browser.json " +
      `PORT=${port} ` +
      "node apps/server/dist/main.js",
    url: `http://127.0.0.1:${port}/healthz`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
