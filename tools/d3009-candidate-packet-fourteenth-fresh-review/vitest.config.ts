import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3009-candidate-packet-fourteenth-fresh-review/review.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
