// Disposable D3670 source-to-Profile characterization, not production or qualification.
import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import base from "../../playwright.config.js";

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "probe.spec.ts",
  outputDir: "../../test-results/profile-numbering-research",
  reporter: [["list"]],
  webServer: { ...base.webServer as object, cwd: fileURLToPath(new URL("../../", import.meta.url)) },
});
