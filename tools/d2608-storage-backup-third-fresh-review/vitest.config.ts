import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tools/d2608-storage-backup-third-fresh-review/review.test.ts"],
  },
});
