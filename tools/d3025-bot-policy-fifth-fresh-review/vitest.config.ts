import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3025-bot-policy-fifth-fresh-review/review.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
