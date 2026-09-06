import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2934-candidate-packet-thirteenth-author-repair/contract.test.ts"],
    environment: "node",
  },
});
