import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2718-longitudinal-eighth-author-repair/contract.test.ts"] },
});
