import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));

export default defineConfig({
  resolve: {
    conditions: ["node"],
    alias: [
      { find: /^chessops$/, replacement: `${chessops}index.js` },
      { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
    ],
  },
  test: {
    include: [
      "tools/d2903-human-endgame-reference/contract.test.ts",
      "tools/d2903-human-endgame-reference/measurement.test.ts",
    ],
    testTimeout: 120_000,
    pool: "forks",
    maxWorkers: 1,
  },
});
