import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2460-storage-backup-second-author-repair/**/*.test.ts"] },
});
