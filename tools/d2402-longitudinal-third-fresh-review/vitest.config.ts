import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2402-longitudinal-third-fresh-review/**/*.test.ts"] },
});
