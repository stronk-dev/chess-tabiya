// DISPOSABLE D3825: source-owner scope experiment. Production and v1 factories stay unchanged.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";

const destination = resolve(".cache/d3792-inspector-demand");
mkdirSync(destination, { recursive: true });
for (const candidate of [false, true]) {
  let sites = 0;
  await build({ entryPoints: [resolve("tools/d3792-inspector-demand/pivotal-source.ts")],
    outfile: resolve(destination, `pivotal-${candidate ? "candidate" : "baseline"}.mjs`),
    bundle: true, platform: "node", format: "esm", nodePaths: [resolve("packages/runtime/node_modules")],
    plugins: [{ name: "d3825-existing-corpus-location", setup(builder) {
      builder.onLoad({ filter: /\/tools\/research-chess\/populations\.ts$/ }, args => {
        const source = readFileSync(args.path, "utf8");
        const anchor = 'const IMPORTED = new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url).pathname;';
        assert.equal(source.split(anchor).length, 2, "D3825 existing corpus locator changed");
        return { contents: source.replace(anchor, `const IMPORTED = ${JSON.stringify(resolve("tools/r2-selection-harness/imported-sample.pgn"))};`),
          loader: "ts", resolveDir: resolve(args.path, "..") };
      });
    } }, ...(candidate ? [{ name: "d3825-pivotal-prefix-owner", setup(builder) {
      builder.onLoad({ filter: /\/packages\/runtime\/src\/pivotal\.ts$/ }, args => {
        let source = readFileSync(args.path, "utf8");
        const replace = (before, after) => {
          assert.equal(source.split(before).length, 2, "D3825 original source anchor changed");
          source = source.replace(before, after);
        };
        replace('export function pivotalMarkerPayloads(run: DrillRun, branchId: string): readonly PivotalMarker[] {',
          'export function pivotalMarkerPayloads(run: DrillRun, branchId: string, researchThroughNodeId?: string): readonly PivotalMarker[] {');
        replace('  const path = branchPath(run, branchId), markers: PivotalMarker[] = [];', `
  const original = branchPath(run, branchId);
  const endpoint = researchThroughNodeId === undefined ? original.length - 1
    : original.findIndex(node => node.id === researchThroughNodeId);
  if (endpoint < 0) throw new TypeError("D3825 endpoint is not on the original branch");
  const path = original.slice(0, endpoint + 1), markers: PivotalMarker[] = [];`);
        sites++;
        return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
      });
    } }] : [])],
  });
  assert.equal(sites, candidate ? 1 : 0);
}
const baseline = spawnSync(process.execPath, [resolve(destination, "pivotal-baseline.mjs"), "baseline"], { encoding: "utf8" });
assert.equal(baseline.status, 1);
assert.match(baseline.stderr, /whole-tip pivotal source is not requested-prefix acquisition/u,
  "baseline must fail the exact scope assertion, not an unrelated loading error");
console.log("D3825: whole-tip source fails the endpoint assertion; guarded candidate built, production unchanged");
