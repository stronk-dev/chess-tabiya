import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d1664-component-adapter-harness/**/*.test.ts"],
    environment: "node",
  },
});
