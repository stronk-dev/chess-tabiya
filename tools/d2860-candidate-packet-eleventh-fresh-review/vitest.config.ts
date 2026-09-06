import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2860-candidate-packet-eleventh-fresh-review/review.test.ts"],
    testTimeout: 15_000,
  },
});
