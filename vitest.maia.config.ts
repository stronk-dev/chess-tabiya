import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["apps/server/src/**/*.maia.integration.ts"],
    testTimeout: 120_000,
    hookTimeout: 30_000,
  },
});
