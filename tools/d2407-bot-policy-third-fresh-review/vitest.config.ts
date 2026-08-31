import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2407-bot-policy-third-fresh-review/**/*.test.ts"] },
});
