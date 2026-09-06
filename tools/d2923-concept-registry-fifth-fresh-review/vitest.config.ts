import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@chess-tabiya/schema/drill-pack": fileURLToPath(
        new URL("../../packages/schema/src/drill-pack/index.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tools/d2923-concept-registry-fifth-fresh-review/review.test.ts"],
  },
});
