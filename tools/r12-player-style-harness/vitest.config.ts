// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const chessops = fileURLToPath(
  new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: [
      { find: /^chessops$/, replacement: `${chessops}index.js` },
      { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
    ],
  },
  test: {
    include: ["tools/r12-player-style-harness/*.test.ts"],
    testTimeout: 600_000,
    disableConsoleIntercept: true,
    sequence: { concurrent: false },
  },
});
