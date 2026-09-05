import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2748-semantic-collectors-promotion-ninth-author-repair/contract.test.ts"],
    environment: "node",
  },
});
