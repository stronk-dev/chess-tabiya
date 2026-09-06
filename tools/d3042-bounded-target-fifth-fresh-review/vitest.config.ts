import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3042-bounded-target-fifth-fresh-review/review.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
