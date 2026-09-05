import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2864-semantic-collectors-promotion-thirteenth-author-repair/contract.test.ts"],
    pool: "forks",
    fileParallelism: false,
  },
});
