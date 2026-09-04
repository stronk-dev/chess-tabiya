import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2552-deflection-check-source-author-repair/contract.test.ts"] },
});
