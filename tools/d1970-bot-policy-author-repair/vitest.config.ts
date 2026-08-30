import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1970-bot-policy-author-repair/**/*.test.ts"],
    pool: "forks",
    maxWorkers: 1,
  },
});
