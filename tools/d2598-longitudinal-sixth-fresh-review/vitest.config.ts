import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2598-longitudinal-sixth-fresh-review/contract.test.ts"],
    environment: "node",
  },
});
