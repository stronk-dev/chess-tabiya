import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2929-semantic-collectors-promotion-fifteenth-fresh-review/review.test.ts"],
    environment: "node",
  },
});
