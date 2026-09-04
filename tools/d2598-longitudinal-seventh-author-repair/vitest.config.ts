import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2598-longitudinal-seventh-author-repair/contract.test.ts"] },
});
