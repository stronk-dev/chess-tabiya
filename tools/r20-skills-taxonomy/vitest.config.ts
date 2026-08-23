import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^chessops$/, replacement: `${chessops}index.js` },
      { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
      { find: /^@chess-tabiya\/schema\/drill-pack$/, replacement: fileURLToPath(new URL("../../packages/schema/src/drill-pack/index.ts", import.meta.url)) },
    ],
  },
  test: {
    include: ["tools/r20-skills-taxonomy/**/*.test.ts"],
    disableConsoleIntercept: true,
  },
});
