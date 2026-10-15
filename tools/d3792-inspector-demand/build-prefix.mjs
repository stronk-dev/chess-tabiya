// DISPOSABLE D3815: guarded in-memory source-owner experiment. No production file is edited.
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const destination = resolve(".cache/d3792-inspector-demand");
mkdirSync(destination, { recursive: true });
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`D3815 source-owner anchor changed: ${before.slice(0, 90)}`);
  return source.replace(before, after);
}
for (const variant of ["prefix_baseline", "prefix_candidate", "window_candidate"]) {
  await build({ entryPoints: [resolve(`tools/d3792-inspector-demand/${variant === "window_candidate" ? "window-source" : "prefix-source"}.ts`)],
    outfile: resolve(destination, `${variant}.mjs`), bundle: true, platform: "node", format: "esm",
    nodePaths: [resolve("packages/runtime/node_modules")],
    plugins: variant === "prefix_baseline" ? [] : [{ name: "disposable-recorded-prefix-owner", setup(builder) {
      builder.onLoad({ filter: /\/recorded-semantic-path\.ts$/ }, args => {
        let source = readFileSync(args.path, "utf8");
        source = replaceOnce(source, 'readonly preparation?: "exact" | "eager"',
          'readonly preparation?: "exact" | "eager"; readonly researchThroughNodeId?: string; readonly researchProjection?: VersionedEvidenceId');
        source = replaceOnce(source, '  const path = resolution.nodes;', `
  const throughNodeId = options.researchThroughNodeId;
  const endpointIndex = throughNodeId === undefined ? resolution.nodes.length - 1
    : resolution.nodes.findIndex(node => node.id === throughNodeId);
  if (endpointIndex < 0) return finish(Object.freeze({ kind: "refused", branchId,
    reason: "research_endpoint_not_on_branch", detail: "D3815 research endpoint is not on the original path" }), now() - started, 0, 0, 0, 0, 0);
  const path = resolution.nodes.slice(0, endpointIndex + 1);
  const requestedProjection = options.researchProjection;
  const selectedRows = requestedProjection === undefined ? EVALUATOR_ROWS
    : EVALUATOR_ROWS.filter(row => refKey(row.projection) === refKey(requestedProjection));
  if (requestedProjection !== undefined && selectedRows.length === 0) throw new TypeError("D3815 projection has no exact source-owner row");`);
        source = replaceOnce(source, '  const prepared = prepare(path, edges, options.preparation ?? "exact", work);', `
  const completeRows = selectedRows.filter(row => row.horizon <= edges.length);
  const preparationStart = requestedProjection === undefined ? 0 : completeRows.length === 0 ? edges.length
    : edges.length - Math.max(...completeRows.map(row => row.horizon));
  const needed = completeRows.map(row => row.family);
  const researchNeedsCapture = needed.some(family => ["trade_completed", "deflection", "attraction", "check_zwischenzug", "overload_exploitation"].includes(family));
  const researchNeedsCheck = needed.some(family => ["deflection", "attraction", "check_zwischenzug"].includes(family));
  const prepared = prepare(path.slice(preparationStart), edges.slice(preparationStart), options.preparation ?? "exact", work,
    requestedProjection === undefined ? undefined : { capture: researchNeedsCapture, check: researchNeedsCheck });`);
        source = replaceOnce(source, 'mode: "exact" | "eager", work: WorkCounters): readonly PreparedEdge[]',
          'mode: "exact" | "eager", work: WorkCounters, researchNeeds?: { capture: boolean; check: boolean }): readonly PreparedEdge[]');
        source = replaceOnce(source, '      work.transitionCompiles += 1;', '      if (researchNeeds === undefined || researchNeeds.capture) {\n      work.transitionCompiles += 1;');
        source = replaceOnce(source, '      work.checkProbes += 1;', '      }\n      if (researchNeeds === undefined || researchNeeds.check) {\n      work.checkProbes += 1;');
        source = replaceOnce(source, '    } else {\n      work.localFanOut', '      }\n    } else {\n      work.localFanOut');
        source = replaceOnce(source, '    for (const row of EVALUATOR_ROWS) {',
          '    for (const row of selectedRows) {\n      if (requestedProjection !== undefined && start + row.horizon !== prepared.length) continue;');
        source = replaceOnce(source, '    operation: "recorded-semantic-path@1",',
          '    operation: requestedProjection !== undefined ? "research.recorded-window@0" : throughNodeId === undefined ? "recorded-semantic-path@1" : "research.recorded-prefix@0",\n    ...(requestedProjection === undefined ? {} : { requestedProjection }),');
        source = replaceOnce(source, '    kind: "available",\n    branchId,',
          '    kind: "available",\n    ...(throughNodeId === undefined ? {} : { researchScope: Object.freeze({ protocol: requestedProjection === undefined ? "research.recorded-prefix@0" : "research.recorded-window@0", throughNodeId, ...(requestedProjection === undefined ? {} : { projection: requestedProjection, incompleteHorizons: selectedRows.filter(row => row.horizon > edges.length).map(row => row.horizon), validatedEdges: edges.length }) }) }),\n    branchId,');
        return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
      });
    } }],
  });
}
console.log("D3815: baseline, prefix and requested-window research bundles built; production unchanged");
const baseline = spawnSync(process.execPath, [resolve(destination, "prefix_baseline.mjs"), "baseline"], { encoding: "utf8" });
assert.equal(baseline.status, 1, "unchanged whole-branch operation unexpectedly satisfies prefix control");
assert.match(baseline.stderr, /whole-tip source is not prefix acquisition/u,
  "baseline must fail on the specific bounded-work assertion, not an unrelated startup failure");
console.log("D3815: unchanged baseline fails the exact zero-edge prefix control as expected");
await build({ entryPoints: [resolve("tools/d3792-inspector-demand/recorded-origin.ts")],
  outfile: resolve(destination, "recorded-origin.mjs"), bundle: true, platform: "node", format: "esm",
  nodePaths: [resolve("packages/runtime/node_modules")] });
