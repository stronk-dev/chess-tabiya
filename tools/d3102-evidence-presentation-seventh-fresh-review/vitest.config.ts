import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3102-evidence-presentation-seventh-fresh-review/review.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
