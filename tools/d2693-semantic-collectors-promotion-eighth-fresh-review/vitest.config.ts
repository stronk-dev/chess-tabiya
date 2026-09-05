import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2693-semantic-collectors-promotion-eighth-fresh-review/**/*.test.ts"],
    environment: "node",
  },
});
