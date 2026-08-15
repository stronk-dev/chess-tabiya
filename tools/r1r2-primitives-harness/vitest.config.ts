// DISPOSABLE research harness — R1/R2 (planning/campaign-research-queue.md). Not production code.
// chessops is a dependency of packages/runtime, not of the workspace root, so it is aliased here.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^chessops$/, replacement: `${chessops}index.js` },
      { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
    ],
  },
  test: { include: ["tools/r1r2-primitives-harness/*.test.ts"], testTimeout: 600000, disableConsoleIntercept: true },
});
