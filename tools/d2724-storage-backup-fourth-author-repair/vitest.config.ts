import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/d2724-storage-backup-fourth-author-repair/contract.test.ts"] },
});
