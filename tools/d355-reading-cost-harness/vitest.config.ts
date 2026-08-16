// DISPOSABLE research harness — D355 (design/BACKLOG.md). Not production code.
// chessops and the workspace packages are not root dependencies, so they are aliased here.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));
const runtime = fileURLToPath(new URL("../../packages/runtime/src/index.ts", import.meta.url));
const schemaDrillPack = fileURLToPath(new URL("../../packages/schema/src/drill-pack/index.ts", import.meta.url));
const schema = fileURLToPath(new URL("../../packages/schema/src/index.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^chessops$/, replacement: `${chessops}index.js` },
      { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
      { find: /^@chess-tabiya\/runtime$/, replacement: runtime },
      { find: /^@chess-tabiya\/schema\/drill-pack$/, replacement: schemaDrillPack },
      { find: /^@chess-tabiya\/schema$/, replacement: schema },
    ],
  },
  test: { include: ["tools/d355-reading-cost-harness/*.test.ts"], testTimeout: 3600000, disableConsoleIntercept: true },
});
