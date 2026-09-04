import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2650-semantic-collectors-promotion-seventh-fresh-review/**/*.test.ts"],
    environment: "node",
  },
});
