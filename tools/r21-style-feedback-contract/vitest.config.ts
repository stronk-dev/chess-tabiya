import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/r21-style-feedback-contract/style-contract.test.ts"],
  },
});
