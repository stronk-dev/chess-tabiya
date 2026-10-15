// DISPOSABLE D3829: preparation isolation over existing stored-run fixtures, not a scoped API.
// The baseline is one explicit committed source revision; no checkout, raw recording or store.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { build } from "esbuild";

const baselineRef = "2fd557b9";
const directory = resolve(".cache/d3792-inspector-demand");
mkdirSync(directory, { recursive: true });
const oldSource = file => execFileSync("git", ["show", `${baselineRef}:${file}`], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
function replaceOnce(source, before, after) {
  assert.equal(source.split(before).length, 2, `D3829 source anchor changed: ${before}`);
  return source.replace(before, after);
}
const probe = `
if (process.argv[2] === "family_probe") {
  const counters = (globalThis as unknown as { __d3829: Record<string, number> }).__d3829;
  const snapshots: Record<string, unknown> = {};
  const failures: Record<string, unknown> = {};
  const saved: Record<string, string> = {};
  const image = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  for (const run of runs) {
    const branchId = run.activeCursor.branchId;
    saved[run.id] = image(run);
    for (const kind of ["irreversibility", "phase_change", "human_divergence", "option_collapse"] as const) {
      for (const key of Object.keys(counters)) counters[key] = 0;
      const values = invokeEvidenceValueRoute(\`derived.pivotal.\${kind}@1\`, { run, branchId });
      const prepared = { ...counters };
      snapshots[\`\${run.id}:\${kind}\`] = {
        prepared, count: values.length,
        image: image(values.map(item => ({
          producer: item.evidence.producer, projection: item.evidence.projection,
          payload: item.evidence.payload, receipt: evidenceValueReceipt(item.evidence),
          inputs: item.inputs.map(input => ({ producer: input.producer, projection: input.projection,
            payload: input.payload, receipt: evidenceValueReceipt(input) })),
        }))),
      };
      const invalid = [
        { ...run, nodes: [...run.nodes, run.nodes.at(-1)!] },
        { ...run, nodes: run.nodes.map(node => node.id === run.nodes.at(-1)!.id ? { ...node, parentId: node.id } : node) },
        { ...run, nodes: run.nodes.map(node => node.id === run.nodes.at(-1)!.id ? { ...node, fen: "invalid FEN" } : node) },
      ];
      failures[\`\${run.id}:\${kind}\`] = invalid.map(value => {
        try { invokeEvidenceValueRoute(\`derived.pivotal.\${kind}@1\`, { run: value, branchId }); return null; }
        catch (error) { return { name: (error as Error).name, message: (error as Error).message }; }
      });
      assert.equal(image(run), saved[run.id]);
    }
  }
  process.stdout.write(JSON.stringify({ snapshots, failures, saved }));
  process.exit(0);
}
`;

const productionCandidate = readFileSync("packages/runtime/src/pivotal.ts", "utf8").includes("export function pivotalMarkerPayloadsForKind(");
for (const candidate of [false, true]) {
  await build({ entryPoints: [resolve("tools/d3792-inspector-demand/pivotal-source.ts")],
    outfile: resolve(directory, `pivotal-family-${candidate ? "candidate" : "baseline"}.mjs`),
    bundle: true, platform: "node", format: "esm", nodePaths: [resolve("packages/runtime/node_modules")],
    plugins: [{ name: "d3829-family-preparation", setup(builder) {
      builder.onLoad({ filter: /\/tools\/research-chess\/populations\.ts$/ }, args => {
        const source = replaceOnce(readFileSync(args.path, "utf8"),
          'const IMPORTED = new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url).pathname;',
          `const IMPORTED = ${JSON.stringify(resolve("tools/r2-selection-harness/imported-sample.pgn"))};`);
        return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
      });
      builder.onLoad({ filter: /\/tools\/d3792-inspector-demand\/pivotal-source\.ts$/ }, args => {
        let source = readFileSync(args.path, "utf8");
        source = 'import { createHash } from "node:crypto";\nimport { evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";\n' + source;
        source = replaceOnce(source, 'assert.equal(process.argv[2], "candidate");', 'assert.equal(process.argv[2], "family_probe");');
        source = replaceOnce(source, 'const directory = mkdtempSync(join(tmpdir(), "tabiya-d3825-pivotal-source-"));',
          probe + '\nconst directory = mkdtempSync(join(tmpdir(), "tabiya-d3825-pivotal-source-"));');
        return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
      });
      builder.onLoad({ filter: /\/packages\/runtime\/src\/pivotal\.ts$/ }, args => {
        let source = candidate && productionCandidate ? readFileSync(args.path, "utf8") : oldSource("packages/runtime/src/pivotal.ts");
        if (candidate && !productionCandidate) {
          source = replaceOnce(source, 'export function pivotalMarkerPayloads(run: DrillRun, branchId: string): readonly PivotalMarker[] {',
            'export function pivotalMarkerPayloads(run: DrillRun, branchId: string, researchKind?: PivotalKind): readonly PivotalMarker[] {');
          source = replaceOnce(source, '  let lastDefinite: Exclude<DetectedPhase, "unclear"> | undefined;',
            '  for (const node of path) positionFromFen(node.fen);\n  let lastDefinite: Exclude<DetectedPhase, "unclear"> | undefined;');
          source = replaceOnce(source, '    const phase = classifyPhase(node.fen).phase;',
            '    if (researchKind === undefined || researchKind === "phase_change") {\n    const phase = classifyPhase(node.fen).phase;');
          source = replaceOnce(source, '      lastDefinite = definite;\n    }\n    const parent',
            '      lastDefinite = definite;\n    }\n    }\n    const parent');
          source = replaceOnce(source, '    if (parent !== undefined && node.moveUci !== null)',
            '    if ((researchKind === undefined || researchKind === "irreversibility") && parent !== undefined && node.moveUci !== null)');
          source = replaceOnce(source, '  const decisions = path.map(',
            '  if (researchKind === undefined || researchKind === "option_collapse") {\n  const decisions = path.map(');
          source = replaceOnce(source, '  markers.push(...divergence(run, new Set(path.map((node) => node.id))));',
            '  }\n  if (researchKind === undefined || researchKind === "human_divergence") markers.push(...divergence(run, new Set(path.map((node) => node.id))));');
        }
        source = replaceOnce(source, '    const phase = classifyPhase(node.fen).phase;', '    globalThis.__d3829.phase++;\n    const phase = classifyPhase(node.fen).phase;');
        source = replaceOnce(source, ' const detail = irreversibility(parent.fen, node.moveUci, node.fen);', ' globalThis.__d3829.irreversibility++; const detail = irreversibility(parent.fen, node.moveUci, node.fen);');
        source = replaceOnce(source, '  return exactLegalMoves(fen).length;', '  globalThis.__d3829.legal++;\n  return exactLegalMoves(fen).length;');
        source = replaceOnce(source, 'function divergence(run: DrillRun, pathIds: ReadonlySet<string>): readonly PivotalMarker[] {',
          'function divergence(run: DrillRun, pathIds: ReadonlySet<string>): readonly PivotalMarker[] {\n  globalThis.__d3829.human++;');
        source = 'globalThis.__d3829 = { phase: 0, irreversibility: 0, legal: 0, human: 0 };\n' + source;
        return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
      });
      builder.onLoad({ filter: /\/packages\/runtime\/src\/evidence-factories\.ts$/ }, args => {
        let source = candidate && productionCandidate ? readFileSync(args.path, "utf8") : oldSource("packages/runtime/src/evidence-factories.ts");
        if (candidate && !productionCandidate) source = replaceOnce(source,
          'pivotalMarkerPayloads(run, branchId).filter((marker) => marker.kind === kind)',
          'pivotalMarkerPayloads(run, branchId, kind).filter((marker) => marker.kind === kind)');
        return { contents: source, loader: "ts", resolveDir: resolve(args.path, "..") };
      });
    } }],
  });
}
const reports = ["baseline", "candidate"].map(name => {
  const child = spawnSync(process.execPath, [resolve(directory, `pivotal-family-${name}.mjs`), "family_probe"], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 });
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout);
});
assert.deepEqual(reports[1].failures, reports[0].failures, "original graph/FEN refusals must remain");
const refusalChecks = Object.values(reports[0].failures).flat();
assert(refusalChecks.every(error => error !== null), "every corruption control must actually refuse");
assert.deepEqual(reports[1].saved, reports[0].saved, "fixture identities and saved bytes must remain");
const totals = reports.map(() => ({ phase: 0, irreversibility: 0, legal: 0, human: 0 }));
let items = 0;
for (const [key, original] of Object.entries(reports[0].snapshots)) {
  const candidate = reports[1].snapshots[key];
  assert.equal(candidate.image, original.image, `complete payload/input/value/convention receipt parity: ${key}`);
  assert.equal(candidate.count, original.count);
  items += candidate.count;
  const family = key.split(":").at(-1), wanted = { phase_change: "phase", irreversibility: "irreversibility", option_collapse: "legal", human_divergence: "human" }[family];
  for (const field of Object.keys(totals[0])) {
    assert.equal(candidate.prepared[field], field === wanted ? original.prepared[field] : 0, `only requested family prepares source: ${key}/${field}`);
    reports.forEach((report, index) => totals[index][field] += report.snapshots[key].prepared[field]);
  }
}
assert(items > 0);
console.log(JSON.stringify({ scope: "D3829 preparation/complete-output parity only; NOT scoped source, semantic qualification or latency proof",
  baselineRef, candidate: productionCandidate ? "actual current production" : "guarded in-memory prototype",
  fixtureRoutes: Object.keys(reports[0].snapshots).length, emittedItems: items,
  refusalChecks: refusalChecks.length,
  baselinePreparation: totals[0], candidatePreparation: totals[1], completeImagesEqual: true,
  originalRefusalsEqual: true, savedBytesEqual: true }));
