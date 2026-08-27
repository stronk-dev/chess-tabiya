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
    include: ["tools/d1927-recorded-path-review-harness/**/*.test.ts"],
    pool: "forks",
    maxWorkers: 1,
  },
});
