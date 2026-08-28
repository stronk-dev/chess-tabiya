// DISPOSABLE RFC review harness — D1962-D1967. Not production code.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));

export default defineConfig({
  resolve: { alias: [
    { find: /^chessops$/, replacement: `${chessops}index.js` },
    { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
  ] },
  test: {
    include: ["tools/d1962-bounded-target-repeat-review/*.test.ts"],
    disableConsoleIntercept: true,
  },
});
