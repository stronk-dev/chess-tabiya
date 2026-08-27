import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1917-semantic-register-review-harness/**/*.test.ts"],
    pool: "forks",
    maxWorkers: 1,
  },
});
