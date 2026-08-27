import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1910-provider-health-review-harness/**/*.test.ts"],
    pool: "forks",
    maxWorkers: 1,
  },
});
