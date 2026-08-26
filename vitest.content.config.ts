import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

import { CONTENT_CONTRACT_TESTS } from "./tools/test-tiers.mjs";

export default defineConfig({
  plugins: [svelte({ configFile: "apps/web/svelte.config.js" })],
  resolve: { conditions: ["browser"] },
  test: {
    coverage: {
      reportsDirectory: ".cache/coverage/content",
    },
    include: [...CONTENT_CONTRACT_TESTS],
    // These contracts intentionally load and cross-check the committed corpus in
    // parallel. Product latency belongs to vitest.performance.config.ts; this is
    // an integration-suite deadlock ceiling, not a performance assertion.
    testTimeout: 30_000,
  },
});
