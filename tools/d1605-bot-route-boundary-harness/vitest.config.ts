import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1605-bot-route-boundary-harness/**/*.test.ts"],
  },
});
