// Opt-in D3799 observation of the unchanged permanent source factory controls.
import { defineConfig } from "vitest/config";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const factoryPath = fileURLToPath(new URL("../../packages/runtime/src/evidence-factories.ts", import.meta.url));
const observerPath = fileURLToPath(new URL("./mint-input-observer.ts", import.meta.url));
export default defineConfig({
  plugins: [{ name: "disposable-d3847-successful-mint-inputs", enforce: "pre", transform(source, id) {
    if (id.split("?")[0] !== factoryPath) return;
    const before = `  return declareEvidence(projection.producer, { id: projection.id, version: projection.version }, present(payload, route), {
    factory: symbol,
    inputDigest: authorityDigest(authority),
    sourceDigests: sources.map(sourceDigest),
    convention: mintConventionReceipt(route, sources, instance),
  });`;
    assert.equal(source.split(before).length, 2, "D3847 sole mint anchor changed; no unguarded instrumentation");
    const after = before.replace("return declareEvidence", "const result = declareEvidence")
      + "\n  observeSuccessfulMint(route, sources);\n  return result;";
    return { code: `import { observeSuccessfulMint } from ${JSON.stringify(observerPath)};\n${source.replace(before, after)}`, map: null };
  } }],
  test: {
    include: ["packages/runtime/src/evidence-value-authority.test.ts"],
    setupFiles: ["tools/d3792-inspector-demand/source-observer.ts"],
    maxWorkers: 1,
  },
});
