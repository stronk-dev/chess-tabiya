import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2730-safe-deployment-third-fresh-review/**/*.test.ts"] },
});
