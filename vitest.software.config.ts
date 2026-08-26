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
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
    exclude: [...configDefaults.exclude, ...CONTENT_CONTRACT_TESTS, ...PERFORMANCE_CONTRACT_TESTS],
  },
});
