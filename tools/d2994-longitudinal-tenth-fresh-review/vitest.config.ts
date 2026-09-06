import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2994-longitudinal-tenth-fresh-review/review.test.ts"],
    fileParallelism: false,
  },
});
