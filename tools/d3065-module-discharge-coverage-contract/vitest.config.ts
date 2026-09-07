import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3065-module-discharge-coverage-contract/*.test.ts"],
  },
});
