import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2552-deflection-check-source-fresh-review/contract.test.ts"] },
});
