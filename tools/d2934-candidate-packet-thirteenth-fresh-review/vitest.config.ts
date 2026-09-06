import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2934-candidate-packet-thirteenth-fresh-review/review.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
