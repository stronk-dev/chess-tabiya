import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2815-provider-health-sixth-fresh-review/review.test.ts"],
    environment: "node",
  },
});
