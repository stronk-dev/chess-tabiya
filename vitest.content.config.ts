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
    // These files repeatedly load and cross-check the same committed corpus. A
    // fixed small pool prevents CPU/memory contention from turning the per-test
    // deadlock ceiling into a machine-size lottery in local runs and CI.
    maxWorkers: 2,
    // Product latency belongs to vitest.performance.config.ts; this remains an
    // integration-suite deadlock ceiling, not a performance assertion.
    testTimeout: 30_000,
  },
});
