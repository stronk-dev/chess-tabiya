import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@chess-tabiya/runtime": fileURLToPath(new URL("../../packages/runtime/src/index.ts", import.meta.url)),
    },
  },
  test: { include: ["tools/d2878-concept-registry-third-author-repair/contract.test.ts"] },
});
