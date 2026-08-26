import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1601-bot-card-contract-harness/**/*.test.ts"],
  },
});
