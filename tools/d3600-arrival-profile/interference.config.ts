// Disposable D3771 experiment: worker-scoped tracing belongs in project configuration.
import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import base from "../../playwright.config.js";

const arms = [
  { name: "trace-assertions-first", trace: true, assertionsFirst: true },
  { name: "no-trace-observation-first", trace: false, assertionsFirst: false },
  { name: "trace-observation-first", trace: true, assertionsFirst: false },
  { name: "no-trace-assertions-first", trace: false, assertionsFirst: true },
];

export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "interference.spec.ts",
  outputDir: "../../test-results/arrival-interference",
  reporter: [["list"]],
  projects: Array.from({ length: 4 }, (_, block) => [...arms.slice(block), ...arms.slice(0, block)].map(arm => ({
    ...base.projects![0]!,
    name: `block-${block}-${arm.name}`,
    metadata: { block, trace: arm.trace, assertionsFirst: arm.assertionsFirst },
    use: { ...base.projects![0]!.use, trace: arm.trace ? "retain-on-failure" as const : "off" as const, screenshot: "off" as const },
  }))).flat(),
  webServer: { ...base.webServer as object, cwd: fileURLToPath(new URL("../../", import.meta.url)) },
});
