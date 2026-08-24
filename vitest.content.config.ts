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
  },
});
