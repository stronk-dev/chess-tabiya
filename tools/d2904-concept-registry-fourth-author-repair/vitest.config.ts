import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@chess-tabiya/schema/drill-pack": fileURLToPath(new URL("../../packages/schema/src/drill-pack/index.ts", import.meta.url)),
    },
  },
  test: { include: ["tools/d2904-concept-registry-fourth-author-repair/**/*.test.ts"] },
});
