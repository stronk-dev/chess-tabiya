import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2912-provider-health-tenth-fresh-review/review.test.ts"],
  },
});
