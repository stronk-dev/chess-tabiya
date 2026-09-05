import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2835-semantic-collectors-promotion-twelfth-fresh-review/review.test.ts"],
    testTimeout: 20_000,
  },
});
