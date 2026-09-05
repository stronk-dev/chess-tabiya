import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2753-provider-health-fifth-author-repair/**/*.test.ts"],
  },
});
