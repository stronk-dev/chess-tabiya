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
    include: ["tools/d1923-semantic-declarations-harness/**/*.test.ts"],
    pool: "forks",
    maxWorkers: 1,
  },
});
