import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2892-semantic-collectors-promotion-fourteenth-fresh-review/review.test.ts"],
    environment: "node",
  },
});
