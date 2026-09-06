import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2892-semantic-collectors-promotion-fourteenth-author-repair/contract.test.ts"],
    environment: "node",
  },
});
