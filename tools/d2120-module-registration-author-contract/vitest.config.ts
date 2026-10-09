import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const chessops = fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url));

export default defineConfig({
  resolve: { alias: [
    { find: /^chessops$/, replacement: `${chessops}index.js` },
    { find: /^chessops\/(.*)$/, replacement: `${chessops}$1.js` },
  ] },
  test: {
    include: ["tools/d2120-module-registration-author-contract/*.test.ts"],
    environment: "node",
  },
});
