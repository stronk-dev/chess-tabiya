import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2323-rating-pool-research/*.test.ts"],
  },
});
