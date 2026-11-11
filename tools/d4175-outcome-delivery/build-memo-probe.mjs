// DISPOSABLE D4225 instrumentation. Append observers to ACTUAL private maps; do not
// substitute a cache/collector implementation or modify any production source file.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

export const PROBE_KEY = "__TABIYA_RESEARCH_MEMO_PROBES__";
export const SITES = Object.freeze([
  { path: "packages/runtime/src/fen-memo.ts", name: "readings", anchor: "const CACHES = new Map<string, Map<string, unknown>>();",
    counts: "[...CACHES].map(([name, entries]) => ({ name, entries: entries.size })).sort((a,b) => a.name.localeCompare(b.name))", clear: "CACHES.clear()" },
  { path: "packages/runtime/src/evidence-factories.ts", name: "factories", anchor: "const MEMO = new Map<string, unknown>();",
    counts: "[{ name: 'factoryMemo', entries: MEMO.size }]", clear: "MEMO.clear()" },
  { path: "packages/runtime/src/position-cache.ts", name: "positions", anchor: "const TEMPLATES = new Map<string, Chess>();",
    counts: "[{ name: 'positionTemplates', entries: TEMPLATES.size }]", clear: "TEMPLATES.clear()" },
]);

export function appendProbe(path, source) {
  const site = SITES.find(site => site.path === path);
  assert(site, `Unknown diagnostic source ${path}`);
  assert.equal(source.split(site.anchor).length, 2, `Expected one actual cache declaration: ${path}`);
  assert(!source.includes(PROBE_KEY), `Diagnostic already present: ${path}`);
  return source + `\n// D4225 disposable observer over the original lexical cache.\n{
    const probes = globalThis[${JSON.stringify(PROBE_KEY)}] ??= Object.create(null);
    if (Object.hasOwn(probes, ${JSON.stringify(site.name)})) throw Error('Duplicate D4225 cache observer');
    probes[${JSON.stringify(site.name)}] = Object.freeze({ counts: () => ${site.counts}, clear: () => ${site.clear} });
  }\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await build({ entryPoints: ["tools/d4175-outcome-delivery/measure.ts"], bundle: true,
    platform: "node", format: "esm", external: ["typescript"],
    outfile: ".cache/outcome-delivery-cost/memo-probe.mjs", logLevel: "warning",
    plugins: [{ name: "D4225-private-cache-observer", setup(build) {
      build.onLoad({ filter: /(?:fen-memo|evidence-factories|position-cache)\.ts$/ }, args => {
        const site = SITES.find(site => resolve(site.path) === args.path);
        assert(site, `Unexpected diagnostic module ${args.path}`);
        return { contents: appendProbe(site.path, readFileSync(args.path, "utf8")), loader: "ts" };
      });
    } }],
  });
}
