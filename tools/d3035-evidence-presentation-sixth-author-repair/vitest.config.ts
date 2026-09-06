import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3035-evidence-presentation-sixth-author-repair/contract.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
