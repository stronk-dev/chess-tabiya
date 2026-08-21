// DISPOSABLE research probe config — CR1 empty-intersection diagnosis.
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
      { find: /^@chess-tabiya\/runtime$/, replacement: `${root}packages/runtime/src/index.ts` },
      { find: /^@chess-tabiya\/schema\/drill-pack$/, replacement: `${root}packages/schema/src/drill-pack/index.ts` },
      { find: /^@chess-tabiya\/schema\/pack-path$/, replacement: `${root}packages/schema/src/pack-path.ts` },
      { find: /^@chess-tabiya\/schema\/shape-entry$/, replacement: `${root}packages/schema/src/shape-entry/index.ts` },
      { find: /^@chess-tabiya\/schema\/principle-entry$/, replacement: `${root}packages/schema/src/principle-entry/index.ts` },
      { find: /^@chess-tabiya\/schema$/, replacement: `${root}packages/schema/src/index.ts` },
    ],
  },
  test: {
    include: ["tools/cr1-diagnosis-probe/*.test.ts"],
    testTimeout: 3_600_000,
    disableConsoleIntercept: true,
  },
});
