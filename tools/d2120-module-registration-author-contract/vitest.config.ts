import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2120-module-registration-author-contract/*.test.ts"],
    environment: "node",
  },
});
