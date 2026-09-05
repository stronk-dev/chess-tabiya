import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2835-semantic-collectors-promotion-twelfth-author-repair/contract.test.ts"],
    pool: "forks",
    fileParallelism: false,
  },
});
