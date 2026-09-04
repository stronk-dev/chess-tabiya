import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2553-deflection-check-seal-fresh-review/contract.test.ts"] },
});
