import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));
const runtime = fileURLToPath(new URL("../../packages/runtime/src/index.ts", import.meta.url));

export default defineConfig({
  resolve: { alias: [
    { find: /^chessops$/, replacement: `${chessops}index.js` },
    { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
    { find: /^@chess-tabiya\/runtime$/, replacement: runtime },
  ] },
  test: { include: ["tools/r7-review-map-harness/*.test.ts"], testTimeout: 120_000 },
});
