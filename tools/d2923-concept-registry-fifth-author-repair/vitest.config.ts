import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@chess-tabiya/runtime": fileURLToPath(new URL("../../packages/runtime/src/index.ts", import.meta.url)),
      "@chess-tabiya/schema/drill-pack": fileURLToPath(new URL("../../packages/schema/src/drill-pack/index.ts", import.meta.url)),
    },
  },
  test: { include: ["tools/d2923-concept-registry-fifth-author-repair/**/*.test.ts"] },
});
