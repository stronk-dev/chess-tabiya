import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1162-evidence-head-harness/**/*.test.ts"],
    testTimeout: 600_000,
  },
});
