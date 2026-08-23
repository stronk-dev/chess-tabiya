import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [{
      find: /^chessops\/(.+)$/u,
      replacement: `${fileURLToPath(new URL("../../apps/server/node_modules/chessops/dist/esm", import.meta.url))}/$1.js`,
    }],
  },
  test: {
    include: ["tools/d1329-data-readiness-harness/**/*.test.ts"],
    testTimeout: 120_000,
  },
});
