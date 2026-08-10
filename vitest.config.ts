import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reportsDirectory: ".cache/coverage",
    },
    include: ["apps/**/*.test.ts", "packages/**/*.test.ts"],
  },
});
