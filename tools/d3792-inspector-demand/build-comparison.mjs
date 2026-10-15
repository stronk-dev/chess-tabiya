// D3820 disposable source-owner experiment. No production files or factory declarations change.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";
const directory = resolve(".cache/d3792-inspector-demand");
mkdirSync(directory, { recursive: true });
for (const variant of ["comparison_baseline", "comparison_candidate", "comparison_structural"]) {
  let sites = 0;
  let structuralSites = 0;
  await build({ entryPoints: [resolve("tools/d3792-inspector-demand/comparison-source.ts")],
    outfile: resolve(directory, `${variant}.mjs`), bundle: true, platform: "node", format: "esm",
    nodePaths: [resolve("packages/runtime/node_modules")],
    plugins: variant === "comparison_baseline" ? [] : [{ name: "d3820-prefix-source", setup(builder) {
      builder.onLoad({ filter: /\/packages\/runtime\/src\/evidence-factories\.ts$/ }, args => {
        const source = readFileSync(args.path, "utf8");
        // Count source reads before the factory's outer memo, not only detector cache misses.
        const anchor = "function cachedStructuralReading(fen: string): StructuralReading {";
        assert.equal(source.split(anchor).length, 2, "D3842 structural reader counter anchor changed");
        return { contents: source.replace(anchor, `${anchor}\n  Reflect.set(globalThis, "__d3842StructuralReads", (Reflect.get(globalThis, "__d3842StructuralReads") ?? 0) + 1);`),
          loader: "ts", resolveDir: resolve(args.path, "..") };
      });
      builder.onLoad({ filter: /\/packages\/runtime\/src\/compare\.ts$/ }, args => {
        let source = readFileSync(args.path, "utf8");
        const replace = (before, after) => { assert.equal(source.split(before).length, 2, "D3820 original source anchor changed"); source = source.replace(before, after); };
        replace('options: { readonly pack?: DrillPackDefinition } = {},',
          'options: { readonly pack?: DrillPackDefinition; readonly researchThroughNodeIds?: readonly string[] } = {},');
        replace('  const paths = branchIds.map((id) => branchPath(run, id));', `
  const originalPaths = branchIds.map((id) => branchPath(run, id));
  const endpoints = options.researchThroughNodeIds;
  if (endpoints !== undefined) for (const path of originalPaths) for (const node of path) researchPositionFromFen(node.fen);
  if (endpoints !== undefined && endpoints.length !== branchIds.length) throw new TypeError("D3820 endpoint arity");
  const paths = originalPaths.map((path, index) => {
    if (endpoints === undefined) return path;
    const endpointIndex = path.findIndex(node => node.id === endpoints[index]);
    if (endpointIndex < 0) throw new TypeError("D3820 endpoint not on original branch");
    const permitted = path.slice(0, endpointIndex + 1);
    if (!permitted.some(node => node.id === branches[index]!.forkNodeId)) throw new TypeError("D3820 endpoint precedes own fork");
    return permitted;
  });`);
        sites++;
        source = 'import { positionFromFen as researchPositionFromFen } from "./position-cache.js";\n' + source;
        return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
      });
      if (variant === "comparison_structural") builder.onLoad({ filter: /\/packages\/runtime\/src\/compare-strip-values\.ts$/ }, args => {
        let source = readFileSync(args.path, "utf8");
        for (const branch of ["column.branchId", "branchId"]) {
          const before = `branchPath(run, ${branch})`;
          assert.equal(source.split(before).length, 2, "D3820 structural owner anchor changed");
          source = source.replace(before, `researchComparisonPrefix(run, comparison, ${branch})`);
        }
        source += `
// D3842 experiment only: original graph AND every original FEN precede source-side narrowing.
function researchComparisonPrefix(run: DrillRun, comparison: BranchComparison, branchId: string) {
  const originals = comparison.columns.map(column => ({ branchId: column.branchId, path: branchPath(run, column.branchId) }));
  for (const value of originals) for (const node of value.path) researchPositionFromFen(node.fen);
  const original = originals.find(value => value.branchId === branchId)?.path;
  if (original === undefined) throw new TypeError("D3842 structural branch not in comparison");
  const endpoint = comparison.columns.find(column => column.branchId === branchId)?.leafNodeId;
  const index = original.findIndex(node => node.id === endpoint);
  if (index < 0) throw new TypeError("D3820 structural endpoint not on original branch");
  return original.slice(0, index + 1);
}
`;
        structuralSites++;
        source = 'import { positionFromFen as researchPositionFromFen } from "./position-cache.js";\n' + source;
        return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
      });
    } }],
  });
  assert.equal(sites, variant === "comparison_baseline" ? 0 : 1);
  assert.equal(structuralSites, variant === "comparison_structural" ? 1 : 0);
}
const baseline = spawnSync(process.execPath, [resolve(directory, "comparison_baseline.mjs"), "baseline"], { encoding: "utf8" });
assert.equal(baseline.status, 1);
assert.match(baseline.stderr, /whole-tip comparison is not requested-prefix acquisition/u,
  "baseline must fail the requested endpoint, not a build/startup error");
console.log("D3820: unchanged source fails exact endpoint control; candidate built without production edits");
