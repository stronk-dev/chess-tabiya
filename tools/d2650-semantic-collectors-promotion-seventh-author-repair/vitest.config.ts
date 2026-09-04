import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2650-semantic-collectors-promotion-seventh-author-repair/**/*.test.ts"],
    environment: "node",
  },
});
