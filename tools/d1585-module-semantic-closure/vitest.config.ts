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
    include: ["tools/d1585-module-semantic-closure/**/*.test.ts"],
  },
});
