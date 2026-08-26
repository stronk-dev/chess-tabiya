// DISPOSABLE research harness — D1654/D1700. Not production code.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const runtime = fileURLToPath(new URL("../../packages/runtime/src/index.ts", import.meta.url));
const schemaDrillPack = fileURLToPath(new URL("../../packages/schema/src/drill-pack/index.ts", import.meta.url));
const schema = fileURLToPath(new URL("../../packages/schema/src/index.ts", import.meta.url));

export default defineConfig({
  resolve: { alias: [
    { find: /^@chess-tabiya\/runtime$/, replacement: runtime },
    { find: /^@chess-tabiya\/schema\/drill-pack$/, replacement: schemaDrillPack },
    { find: /^@chess-tabiya\/schema$/, replacement: schema },
  ] },
  test: {
    include: ["tools/d1700-evidence-execution-harness/*.test.ts"],
    disableConsoleIntercept: true,
  },
});
