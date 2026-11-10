// DISPOSABLE D4082 exploration instrument. No production factory, content migration or release gate.
// Measures actual registered-document predicate dispatch over one existing legal PGN's prefixes.
// Only compact timings/counts are printed; no source values or raw research dumps are written.
import { readFile, writeFile } from "node:fs/promises";
import { Session } from "node:inspector/promises";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { cpuUsage, memoryUsage } from "node:process";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { ShapeRegistry } from "../../apps/server/src/shape-registry.js";
import { parsePgnMainline } from "../../apps/server/src/pgn-import.js";
import { shapeFirings, type ShapeFiring } from "../../packages/runtime/src/shape-firing.js";
import { selectAuthoredStructuralCondition } from "../../packages/runtime/src/internal/authored-structural-source.js";
import { declareCurrentStructuralPredicateEvidence } from "../../packages/runtime/src/structural-evidence.js";
import { captureAuthoredPredicatePopulation, readAuthoredPredicatePopulation, type AuthoredPredicatePopulation, type AuthoredPredicateObservation } from "../../packages/runtime/src/authored-predicate-population.js";
import { invokeEvidenceValueRoute, readCurrentShapeFiringInvocation } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { readRegisteredShapeScan } from "../../packages/runtime/src/internal/registered-shape-scan.js";
import { evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";

const profile = process.argv.includes("--profile");
const capturedOnly = process.argv.includes("--captured-only");
const currentOnly = process.argv.includes("--current-scan");
const file = process.argv.slice(2).find(value => !value.startsWith("--")) ?? "apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.pgn";
if ([profile, capturedOnly, currentOnly].filter(Boolean).length > 1) throw new Error("Select one measurement mode");
const parsed = parsePgnMainline(await readFile(resolve(file), "utf8"), { requireMoves: true });
const position = Chess.fromSetup(parseFen(parsed.rootFen).unwrap()).unwrap();
const path = [{ id: "root", fen: parsed.rootFen }];
for (const [index, move] of parsed.moves.entries()) {
  const legal = parseUci(move.uci);
  if (legal === undefined || !position.isLegal(legal)) throw new Error(`Illegal source PGN move ${index}`);
  position.play(legal); path.push({ id: `ply-${index + 1}`, fen: makeFen(position.toSetup()) });
}
const start = performance.now(), registry = await ShapeRegistry.loadDefault();
const admissionMs = performance.now() - start, captureStart = performance.now();
const registered = currentOnly ? null : await registry.captureRegisteredTriggers(new AbortController().signal);
const captureMs = performance.now() - captureStart;
const entries = registry.list().map(row => ({ id: row.id, trigger: registry.required(row.id).document.trigger }));
const sources = entries.map(entry => ({ id: entry.id, source: selectAuthoredStructuralCondition(registry.captureAuthoredStructuralDocument(entry.id)!, "/trigger") }));
type Value = Extract<ReturnType<typeof declareCurrentStructuralPredicateEvidence>, { kind: "available" }>["value"];
const prefixes = capturedOnly ? [path.length] : profile ? [Math.min(8, path.length)] : [...new Set([1, 8, 32, 64, path.length].filter(length => length <= path.length))];
const profiler = profile ? new Session() : undefined;
if (profiler !== undefined) { profiler.connect(); await profiler.post("Profiler.enable"); }
const round = (value: number) => Math.round(value * 100) / 100;
const mib = (bytes: number) => round(bytes / 1024 / 1024);
function appendIntervals(output: ShapeFiring[], id: string, matches: readonly boolean[], nodes: readonly { id: string; fen: string }[]): void {
  let first = -1;
  for (let index = 0; index <= nodes.length; index++) {
    const matched = index < nodes.length && matches[index]!;
    if (matched && first < 0) first = index;
    if (!matched && first >= 0) {
      output.push({ entryId: id, firstNodeId: nodes[first]!.id, lastNodeId: nodes[index - 1]!.id, openEnded: index === nodes.length });
      first = -1;
    }
  }
}
function observationImage(value: AuthoredPredicateObservation): string {
  return JSON.stringify({ fen: value.fen, source: { origin: value.source.origin, pointer: value.source.pointer },
    policy: value.policy, matched: value.matched, squares: value.squares,
    trace: value.trace.map(row => ({ path: row.path, expression: row.expression, matched: row.matched,
      leaf: row.leaf === undefined ? null : evidenceValueReceipt(row.leaf) })) });
}
console.log(JSON.stringify({ instrument: "disposable D4082", node: process.version, platform: process.platform, arch: process.arch,
  file, positions: path.length, shapes: entries.length, capturedOnly,
  admissionMs: round(admissionMs), captureMs: round(captureMs), perPrefixBudgetMs: 30_000,
  scope: "PGN position predicate scan only; not application/HTTP latency or qualification" }));
if (currentOnly) {
  const prepareStart = performance.now(), builder = await registry.beginCurrentShapeScan(path, new AbortController().signal);
  let chunks = 0, maxChunkMs = 0;
  for (;;) {
    const chunkStart = performance.now(), step = registry.advanceCurrentShapeScan(builder);
    maxChunkMs = Math.max(maxChunkMs, performance.now() - chunkStart); chunks++;
    if (step.kind === "complete") {
      const prepareMs = performance.now() - prepareStart, mintStart = performance.now();
      const values = invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: step.scan });
      const mintMs = performance.now() - mintStart, source = readRegisteredShapeScan(step.scan);
      readCurrentShapeFiringInvocation(values, step.scan);
      const expected = shapeFirings(entries, path);
      const parity = JSON.stringify(values.map(({ payload: { authority: _authority, ...firing } }) => firing)) === JSON.stringify(expected);
      if (!parity) throw new Error("Actual complete current firing/legacy no-ref intervals disagree");
      console.log(JSON.stringify({ mode: "actual_current_scan_and_factory", positions: path.length, shapes: entries.length,
        completedCells: source.rows.reduce((sum, row) => sum + row.cells.length, 0), intervals: values.length, chunks,
        maxChunkMs: round(maxChunkMs), prepareMs: round(prepareMs), mintMs: round(mintMs), parity,
        scope: "Real registry/finite scan/firing3 mint only; no application grant, HTTP/UI, qualification or general latency guarantee" }));
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 0));
  }
} else {
for (const length of prefixes) {
  const nodes = path.slice(0, length), matrix: Value[][] = [];
  let legacy: readonly ShapeFiring[] | undefined;
  if (!capturedOnly) {
  const legacyStart = performance.now(); legacy = shapeFirings(entries, nodes);
  const legacyMs = performance.now() - legacyStart;
  registry.assertRegisteredTriggersCurrent(registered!);
  if (profiler !== undefined) await profiler.post("Profiler.start");
  const before = memoryUsage(), cpu = cpuUsage(), scanStart = performance.now();
  const intervals: ShapeFiring[] = [];
  let complete = true, cells = 0;
  outer: for (const entry of sources) {
    const values: Value[] = []; matrix.push(values);
    for (const node of nodes) {
      if (performance.now() - scanStart > 30_000) { complete = false; break outer; }
      const result = declareCurrentStructuralPredicateEvidence(node.fen, entry.source);
      if (result.kind !== "available") throw new Error(`Unavailable ${entry.id}/${node.id}: ${result.reason}`);
      values.push(result.value); cells++;
    }
    // Disposable arithmetic over actual values, not a new production firing factory or proof.
    appendIntervals(intervals, entry.id, values.map(value => value.payload.observation.matched), nodes);
  }
  const scanMs = performance.now() - scanStart, used = cpuUsage(cpu), after = memoryUsage();
  registry.assertRegisteredTriggersCurrent(registered!);
  if (profiler !== undefined) {
    const captured = await profiler.post("Profiler.stop");
    await writeFile(resolve(".cache/profiles/d4082/registered-shape.cpuprofile"), JSON.stringify(captured.profile));
  }
  const parity = complete ? JSON.stringify(intervals) === JSON.stringify(legacy) : null;
  console.log(JSON.stringify({ mode: "aggregate_per_cell", positions: length, requiredCells: entries.length * length, completedCells: cells,
    complete, parity, intervals: complete ? intervals.length : null, legacyMs: round(legacyMs), scanMs: round(scanMs),
    cpuMs: round((used.user + used.system) / 1000), heapBeforeMiB: mib(before.heapUsed), heapRetainedMiB: mib(after.heapUsed),
    rssBeforeMiB: mib(before.rss), rssRetainedMiB: mib(after.rss), retainedValues: matrix.reduce((sum, row) => sum + row.length, 0) }));
  if (parity === false) throw new Error("Actual legacy/current interval parity failed");
  if (!complete) { console.log(JSON.stringify({ unmeasuredPrefixes: prefixes.filter(value => value > length) })); break; }
  }

  // Alternative source preparation, not an implemented/accepted firing3 factory or public view.
  // Reuse one genuine root per node; retain every original owned visitor population, including
  // negatives, without minting an unused position-result projection for each shape/node pair.
  const nativeStart = performance.now(), nativeCpu = cpuUsage(), nativeBefore = memoryUsage();
  const roots = nodes.map(node => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: node.fen }));
  const capturedRows: AuthoredPredicatePopulation[][] = [], nativeIntervals: ShapeFiring[] = [];
  let nativeComplete = true, nativeCells = 0;
  native: for (const entry of sources) {
    const row: AuthoredPredicatePopulation[] = []; capturedRows.push(row);
    for (const [index] of nodes.entries()) {
      if (performance.now() - nativeStart > 30_000) { nativeComplete = false; break native; }
      const captured = captureAuthoredPredicatePopulation(entry.source, roots[index]!);
      if (captured.kind !== "available") throw new Error(`Unavailable native capture ${entry.id}/${index}`);
      row.push(captured.value); nativeCells++;
    }
    appendIntervals(nativeIntervals, entry.id, row.map(value => readAuthoredPredicatePopulation(value).observation.matched), nodes);
  }
  const nativeMs = performance.now() - nativeStart, nativeUsed = cpuUsage(nativeCpu), nativeAfter = memoryUsage();
  registry.assertRegisteredTriggersCurrent(registered!);
  const nativeParity = nativeComplete ? JSON.stringify(nativeIntervals) === JSON.stringify(legacy ?? shapeFirings(entries, nodes)) : null;
  const traceParity = nativeComplete && !capturedOnly ? capturedRows.every((row, shapeIndex) => row.every((value, nodeIndex) =>
    observationImage(readAuthoredPredicatePopulation(value).observation) === observationImage(matrix[shapeIndex]![nodeIndex]!.payload.observation))) : null;
  console.log(JSON.stringify({ mode: "captured_shared_roots_prototype", positions: length, requiredCells: entries.length * length,
    completedCells: nativeCells, complete: nativeComplete, parity: nativeParity, traceParity, scanMs: round(nativeMs),
    cpuMs: round((nativeUsed.user + nativeUsed.system) / 1000), heapBeforeMiB: mib(nativeBefore.heapUsed), heapRetainedMiB: mib(nativeAfter.heapUsed),
    rssBeforeMiB: mib(nativeBefore.rss), rssRetainedMiB: mib(nativeAfter.rss), retainedCaptures: nativeCells,
    limit: capturedOnly ? "Fresh captured-only process; legacy reference computed afterwards; no firing3 mint/consumer/API"
      : "No firing3 mint/consumer/API; aggregate-first ordering warms shared implementation caches" }));
  if (nativeParity === false || traceParity === false) throw new Error("Actual captured-source interval/operand parity failed");
  if (!nativeComplete) break;
}
}
profiler?.disconnect();
