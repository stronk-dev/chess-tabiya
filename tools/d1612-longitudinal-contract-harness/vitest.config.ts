import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d1612-longitudinal-contract-harness/**/*.test.ts"] },
});
