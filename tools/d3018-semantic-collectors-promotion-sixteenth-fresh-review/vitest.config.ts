import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d3018-semantic-collectors-promotion-sixteenth-fresh-review/review.test.ts"],
    environment: "node",
  },
});
