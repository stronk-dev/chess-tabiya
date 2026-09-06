import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2860-candidate-packet-eleventh-author-repair/contract.test.ts"],
    environment: "node",
    testTimeout: 15_000,
  },
});
