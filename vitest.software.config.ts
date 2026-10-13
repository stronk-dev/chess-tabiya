import { svelte } from "@sveltejs/vite-plugin-svelte";
import { configDefaults, defineConfig } from "vitest/config";

import { CONTENT_CONTRACT_TESTS, PERFORMANCE_CONTRACT_TESTS, SERIAL_SOFTWARE_CONTRACT_TESTS } from "./tools/test-tiers.mjs";

export default defineConfig({
  plugins: [svelte({ configFile: "apps/web/svelte.config.js" })],
  resolve: { conditions: ["browser"] },
  test: {
    coverage: {
      reportsDirectory: ".cache/coverage/software",
    },
    // Keep native refusal→restart ownership out of the main pool's CPU/worker overlap, without
    // raising any test or production deadline. Both projects remain in the normal software run.
    projects: [
      {
        extends: true,
        test: {
          name: "software",
          maxWorkers: 2,
          include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
          exclude: [...configDefaults.exclude, ...CONTENT_CONTRACT_TESTS, ...PERFORMANCE_CONTRACT_TESTS, ...SERIAL_SOFTWARE_CONTRACT_TESTS],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: "native-startup",
          maxWorkers: 1,
          include: [...SERIAL_SOFTWARE_CONTRACT_TESTS],
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
});
