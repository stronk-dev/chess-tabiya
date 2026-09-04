import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2536-deflection-check-authority-fresh-review/contract.test.ts"] },
});
