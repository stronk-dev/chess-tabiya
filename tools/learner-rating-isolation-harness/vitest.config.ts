import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("../../", import.meta.url));
const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));

export default defineConfig({
  root,
  resolve: {
    alias: [
      { find: /^chessops$/, replacement: `${chessops}index.js` },
      { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
      { find: /^@chess-tabiya\/runtime\/rating$/, replacement: `${root}packages/runtime/src/rating.ts` },
      { find: /^@chess-tabiya\/runtime$/, replacement: `${root}packages/runtime/src/index.ts` },
      { find: /^@chess-tabiya\/schema\/drill-pack$/, replacement: `${root}packages/schema/src/drill-pack/index.ts` },
    ],
  },
  test: {
    include: ["tools/learner-rating-isolation-harness/rendering.test.ts"],
    environment: "node",
  },
});
