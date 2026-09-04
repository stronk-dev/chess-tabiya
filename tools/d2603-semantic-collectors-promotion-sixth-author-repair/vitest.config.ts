import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2603-semantic-collectors-promotion-sixth-author-repair/**/*.test.ts"],
    environment: "node",
  },
});
