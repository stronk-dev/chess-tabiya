import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2620-campaign-fourth-fresh-review/contract.test.ts"],
    testTimeout: 10_000,
  },
});
