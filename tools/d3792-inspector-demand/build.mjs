// Disposable D3791/D3792 author evidence, not production or a CI/release gate.
// Builds guarded in-memory variants of the actual query; never edits application sources.
import { readFileSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { build } from "esbuild";

const destination = resolve(".cache/d3792-inspector-demand");
mkdirSync(destination, { recursive: true });
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`D3792 candidate anchor changed: ${before.slice(0, 95)}`);
  return source.replace(before, after);
}
const windowRead = `
  const currentPath = resolveBranchPath(run, run.activeCursor.branchId);
  const branchId = currentPath.kind === "available" && currentPath.nodes.some(node => node.id === subject.node.id)
    ? run.activeCursor.branchId : subject.node.branchId;
  const recorded = recordedSemanticPath(run, branchId);`;
const windowRoute = `
      if (RECORDED_WINDOW_SOURCE_ROUTES.includes(name)) {
        if (recorded.kind === "refused") return Object.freeze({ kind: "unavailable", projection: name, reason: "input_abstained" });
        const items = recorded.events.filter(event => event.projection.id === ref.id && event.projection.version === ref.version
          && event.anchor.runId === run.id && event.anchor.nodeId === subject.node.id).map(event => event.evidence);
        return items.length === 0 ? Object.freeze({ kind: "no_witness", projection: name }) : Object.freeze({ kind: "available", projection: name, items: Object.freeze(items) });
      }`;
for (const variant of ["baseline", "acquired", "derived_family"]) {
  await build({
    entryPoints: [resolve("tools/d3792-inspector-demand/probe.ts")], outfile: resolve(destination, `${variant}.mjs`),
    bundle: true, platform: "node", format: "esm", nodePaths: [resolve("packages/runtime/node_modules")],
    plugins: variant === "baseline" ? [] : [{
      name: "disposable-inspector-window-candidate",
      setup(builder) {
        builder.onLoad({ filter: /module-query(?:-sources)?\.ts$/ }, args => {
          let source = readFileSync(args.path, "utf8");
          if (basename(args.path) === "module-query-sources.ts") {
            source = replaceOnce(source, 'import { evidenceValueRouteRegistry }', 'import { RECORDED_PATH_SUCCESSOR_REFS } from "./evidence-catalog.js";\nimport { evidenceValueRouteRegistry }');
            source = replaceOnce(source, 'const ROUTE_ARMS:', 'export const RECORDED_WINDOW_SOURCE_ROUTES = Object.freeze(RECORDED_PATH_SUCCESSOR_REFS.map(ref => `${ref.id}@${ref.version}`));\nconst ROUTE_ARMS:');
            source = replaceOnce(source, 'case "full_inspector": return accepted.filter((route) => routeReads(route, "fen")', 'case "full_inspector": return accepted.filter((route) => RECORDED_WINDOW_SOURCE_ROUTES.includes(route) || routeReads(route, "fen")');
          } else {
            source = replaceOnce(source, 'import { branchPath } from "./branch-path.js";', 'import { branchPath, resolveBranchPath } from "./branch-path.js";\nimport { recordedSemanticPath } from "./recorded-semantic-path.js";');
            source = replaceOnce(source, 'MODULE_QUERY_OPERATION, PACKET_ROUTE_KINDS, SIGHT_SOURCE_ROUTES,', 'MODULE_QUERY_OPERATION, PACKET_ROUTE_KINDS, RECORDED_WINDOW_SOURCE_ROUTES, SIGHT_SOURCE_ROUTES,');
            const packetRead = '  const packets = run.events.flatMap((event) => event.type === "evidence.attached" && event.data.nodeId === subject.node.id ? [event.data.payload] : []);';
            source = replaceOnce(source, packetRead, packetRead + windowRead);
            const routeStart = '    const name = `${ref.id}@${ref.version}`;\n    try {';
            source = replaceOnce(source, routeStart, routeStart + windowRoute);
            if (variant === "derived_family") {
              const pool = '    const evidence = scoped.filter(witnessed);';
              // Presentation-only feasibility: this filter is AFTER acquisition. It does not
              // prove demand-driven work, HTTP grammar, family lifecycle or production UI.
              source = replaceOnce(source, pool, '    const evidence = scoped.filter(item => module !== "full_inspector" || inspectorFamily(item.projection.id) === "derived").filter(witnessed);');
            }
          }
          return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
        });
      },
    }],
  });
}
console.log("D3792: three disposable bundles built; production sources unchanged");
await build({ entryPoints: [resolve("tools/d3792-inspector-demand/census.ts")], outfile: resolve(destination, "census.mjs"),
  bundle: true, platform: "node", format: "esm", nodePaths: [resolve("packages/runtime/node_modules")] });
