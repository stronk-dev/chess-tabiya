import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2678-candidate-packet-tenth-author-repair/contract.test.ts"],
    environment: "node",
  },
});
