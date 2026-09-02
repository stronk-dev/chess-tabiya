import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2420-campaign-fourth-author-repair/contract.test.ts"] },
});
