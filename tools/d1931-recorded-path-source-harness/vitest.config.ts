// DISPOSABLE research harness — D1931. Not production code.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const runtime = fileURLToPath(new URL("../../packages/runtime/src/index.ts", import.meta.url));
const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));

export default defineConfig({
  resolve: { alias: [
    { find: /^@chess-tabiya\/runtime$/, replacement: runtime },
    { find: /^chessops$/, replacement: `${chessops}index.js` },
    { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
  ] },
  test: {
    include: ["tools/d1931-recorded-path-source-harness/**/*.test.ts"],
    testTimeout: 600_000,
    pool: "forks",
    maxWorkers: 1,
    disableConsoleIntercept: true,
  },
});
