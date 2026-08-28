import { svelte } from "@sveltejs/vite-plugin-svelte";
import { configDefaults, defineConfig } from "vitest/config";

import { CONTENT_CONTRACT_TESTS, PERFORMANCE_CONTRACT_TESTS } from "./tools/test-tiers.mjs";

export default defineConfig({
  plugins: [svelte({ configFile: "apps/web/svelte.config.js" })],
  resolve: { conditions: ["browser"] },
  test: {
    coverage: {
      reportsDirectory: ".cache/coverage/software",
    },
    // Several files compile schemas, traverse the corpus, migrate SQLite or launch Stockfish.
    // Unbounded file workers oversubscribe developer/CI hosts and turn their functional timeouts
    // into load-dependent failures. Performance contracts remain isolated in their own tier.
    maxWorkers: 4,
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: [...configDefaults.exclude, ...CONTENT_CONTRACT_TESTS, ...PERFORMANCE_CONTRACT_TESTS],
  },
});
