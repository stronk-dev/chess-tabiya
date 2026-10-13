// Disposable D3600 research tooling: no ordinary CI gate or production behavior.
import { defineConfig } from "@playwright/test";
import base from "../../playwright.config.js";
import { fileURLToPath } from "node:url";

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "profile.spec.ts",
  outputDir: "../../test-results/arrival-profile",
  reporter: [["list"]],
  projects: [base.projects![0]!],
  use: { ...base.use, trace: "off", screenshot: "off" },
  webServer: { ...base.webServer as object, cwd: fileURLToPath(new URL("../../", import.meta.url)) },
});
