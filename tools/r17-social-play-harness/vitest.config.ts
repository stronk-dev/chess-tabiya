import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["tools/r17-social-play-harness/*.test.ts"] },
});
