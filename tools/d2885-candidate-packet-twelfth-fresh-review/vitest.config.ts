import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2885-candidate-packet-twelfth-fresh-review/review.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
