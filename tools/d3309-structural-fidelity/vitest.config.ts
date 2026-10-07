// DISPOSABLE D3309 research. This is not a production projection migration.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: [
    { find: /^chessops\/(.*)$/u, replacement: `${fileURLToPath(new URL("../../packages/runtime/node_modules/chessops/dist/esm/", import.meta.url))}$1.js` },
    { find: /^@chess-tabiya\/runtime$/u, replacement: fileURLToPath(new URL("../../packages/runtime/src/index.ts", import.meta.url)) },
  ] },
  test: { include: ["tools/d3309-structural-fidelity/*.test.ts"], maxWorkers: 1 },
});
