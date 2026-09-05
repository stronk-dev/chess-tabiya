import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2815-provider-health-sixth-author-repair/contract.test.ts"],
    environment: "node",
  },
});
