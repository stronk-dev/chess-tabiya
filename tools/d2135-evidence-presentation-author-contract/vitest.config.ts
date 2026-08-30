import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2135-evidence-presentation-author-contract/**/*.test.ts"], pool: "forks", maxWorkers: 1 },
});
