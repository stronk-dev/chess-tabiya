import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2857-provider-health-eighth-author-repair/contract.test.ts"] },
});
