import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3035-evidence-presentation-sixth-fresh-review/review.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
