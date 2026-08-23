import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: fileURLToPath(new URL("../../", import.meta.url)),
  test: { include: ["tools/d1163-engine-composed-bot-harness/*.test.ts"] },
});
