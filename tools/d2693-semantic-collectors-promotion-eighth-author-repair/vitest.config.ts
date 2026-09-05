import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2693-semantic-collectors-promotion-eighth-author-repair/**/*.test.ts"],
    environment: "node",
  },
});
