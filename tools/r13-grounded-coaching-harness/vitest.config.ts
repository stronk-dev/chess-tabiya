import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/r13-grounded-coaching-harness/*.test.ts"],
    testTimeout: 30_000,
  },
});

