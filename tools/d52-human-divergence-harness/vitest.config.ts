import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d52-human-divergence-harness/*.test.ts"],
  },
});
