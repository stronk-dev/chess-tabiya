import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1397-hint-relation-harness/**/*.test.ts"],
    environment: "node",
  },
});
