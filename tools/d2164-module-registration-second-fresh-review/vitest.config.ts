import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2164-module-registration-second-fresh-review/*.test.ts"],
  },
});
