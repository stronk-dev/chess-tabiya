import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2718-longitudinal-seventh-fresh-review/contract.test.ts"] },
});
