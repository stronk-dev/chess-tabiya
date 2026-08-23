import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1297-proper-score-harness/**/*.test.ts"],
    testTimeout: 1_200_000,
  },
});
