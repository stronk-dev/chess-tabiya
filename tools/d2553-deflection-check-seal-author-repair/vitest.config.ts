import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2553-deflection-check-seal-author-repair/contract.test.ts"] },
});
