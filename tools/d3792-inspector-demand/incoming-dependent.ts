// DISPOSABLE D3836/D3847 source reconstruction, NOT Inspector, permission or qualification.
// Execute the existing five exact factories from actual recorded incoming edges. No production
// file is rewritten, no whole candidate closure is used, and no raw recording is saved.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePgn, makePgn } from "chessops/pgn";
import { parseUci } from "chessops/util";
import { branchPath, resolveBranchPath, rewind, fork, commitMove,
  assertDeclaredEvidence, type DeclaredEvidence, type DrillRun, type Node } from "../../packages/runtime/src/index.js";
import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { evidenceDigest, evidenceValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import type { OverloadedDefenderConflict } from "../../packages/runtime/src/tactics.js";
import { overloadedDefenderResponseConflict } from "../../packages/runtime/src/tactics.js";
import { transitionSemanticFacts } from "../../packages/runtime/src/transition.js";
import { recordedEdgePayload, assertRecordedEdgeEvidence } from "../../packages/runtime/src/recorded-edge.js";
import { invokeEvidenceValueRoute as invoke, type EvidenceValueRoute, type EvidenceValueRouteInputs,
  type EvidenceValueRouteResults } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { MODULE_CONSUMER_ACCEPTS } from "../../packages/runtime/src/evidence-catalog.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../packages/runtime/src/semantic-validation.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";
import { RunService } from "../../apps/server/src/service.js";
import { loadConceptRegistry } from "../../apps/server/src/concept-registry-loader.js";
import { recordedSourceRun } from "./recorded-source-cases.js";

const refs = ["derived.tactic.discovered_executed@1", "derived.tactic.fork_survives_reply@1",
  "derived.tactic.overloaded_defender_response_conflict@1",
  "rules.tactic.consequence.forced_mate_after_move@1", "rules.tactic.consequence.forced_mate_after_move@2"] as const;
type Ref = typeof refs[number];
for (const ref of refs) assert(MODULE_CONSUMER_ACCEPTS.full_inspector.some(row => `${row.id}@${row.version}` === ref));
type Edge = Readonly<{ beforeFen: string; moveUci: string; afterFen: string }>;
type Result = Readonly<{ kind: "available"; items: readonly DeclaredEvidence<unknown>[] } |
  { kind: "unavailable"; reason: string } | { kind: "missing_context"; reason: "no_incoming_edge" }>;
const counts = new Map<string, { requests: number; items: number; maxMs: number; maxNodes: number; states: Set<string> }>();
let trace: string[] = [], controls = 0, requests = 0;
let overloadLiteralInputs = 0, overloadHypotheticalCaptures = 0, overloadReplyPositions = 0;
let computedOverloadComparisons = 0;
// Disposable construction recipe, not a new evidence factory. Validate even quiet edges;
// the old pure helper intentionally returns clear before validation when capture is absent.
function computedOverload(edge: Edge) {
  const position = positionFromFen(edge.beforeFen), move = parseUci(edge.moveUci);
  assert.equal(canonicalFen(position), edge.beforeFen);
  assert(move !== undefined && position.isLegal(move)); position.play(move);
  assert.equal(canonicalFen(position), edge.afterFen);
  const capture = transitionSemanticFacts(edge.beforeFen, edge.moveUci, edge.afterFen).find(fact => fact.family === "capture");
  return overloadedDefenderResponseConflict(edge.beforeFen, edge.moveUci, edge.afterFen, capture);
}
function call<Route extends EvidenceValueRoute>(ref: Route, input: EvidenceValueRouteInputs[Route]): EvidenceValueRouteResults[Route] {
  trace.push(ref); return invoke(ref, input);
}
const checked = (test: () => void) => { test(); controls++; };

function selectedEdge(run: DrillRun, branchId: string, nodeId: string): Edge | null {
  const original = resolveBranchPath(run, branchId);
  if (original.kind !== "resolved") throw new Error(original.reason);
  // Admission validation of the ORIGINAL path precedes narrowing; this is not a filtered Run.
  for (let index = 0; index < original.nodes.length; index++) {
    const node: Node = original.nodes[index]!;
    assert.equal(canonicalFen(positionFromFen(node.fen)), node.fen);
    if (index === 0) continue;
    const parent: Node = original.nodes[index - 1]!;
    recordedEdgePayload(run, parent, node); // existing exact UCI/SAN/FEN/ply authority, not a second implementation
  }
  const end = original.nodes.findIndex(node => node.id === nodeId);
  assert(end >= 0, "selected node must be on the exact original branch");
  if (end === 0) return null;
  const node = original.nodes[end]!, parent = original.nodes[end - 1]!;
  const recorded = call("run.record.edge@1", { run, parent, child: node });
  assertRecordedEdgeEvidence(recorded);
  assert.equal(recorded.payload.runId, run.id);
  assert.equal(recorded.payload.beforeNodeId, parent.id); assert.equal(recorded.payload.afterNodeId, nodeId);
  const { beforeFen, moveUci, afterFen } = recorded.payload;
  return Object.freeze({ beforeFen, moveUci, afterFen });
}

function items(result: unknown): Result {
  assert(result !== null && typeof result === "object");
  if (!Array.isArray(result) && "kind" in result) {
    if (result.kind === "unavailable") {
      assert("reason" in result && typeof result.reason === "string");
      return { kind: "unavailable", reason: result.reason };
    }
    if (result.kind === "available") { assert("value" in result); return items(result.value); }
  }
  const found = (Array.isArray(result) ? result : [result]).map(row => {
    assert(row !== null && typeof row === "object");
    const value = "evidence" in row ? row.evidence : row;
    assertDeclaredEvidence(value as DeclaredEvidence<unknown>);
    assert(evidenceValueReceipt(value as DeclaredEvidence<unknown>));
    return value as DeclaredEvidence<unknown>;
  });
  return { kind: "available", items: Object.freeze(found) };
}

function execute(run: DrillRun, branchId: string, nodeId: string, ref: Ref, horizon = 4): Result {
  trace = [];
  const edge = selectedEdge(run, branchId, nodeId);
  if (edge === null) return { kind: "missing_context", reason: "no_incoming_edge" };
  const started = performance.now();
  let result: Result;
  switch (ref) {
    case "derived.tactic.discovered_executed@1": {
      const latency = call("rules.tactic.reading.discovered_latency@1", { fen: edge.beforeFen });
      const rays = call("rules.transition.event.slider_ray@1", edge);
      result = items(call(ref, { latency, rays })); break;
    }
    case "derived.tactic.fork_survives_reply@1": {
      const attacks = call("rules.tactic.event.double_attack@1", edge);
      if (attacks.length === 0) { result = { kind: "available", items: [] }; break; }
      assert.equal(attacks.length, 1, "the existing same-move double-attack source must be singular");
      const breadth = call("rules.tactic.consequence.reply_breadth@1", edge);
      result = items(call(ref, { doubleAttack: attacks[0]!, breadth })); break;
    }
    case "derived.tactic.overloaded_defender_response_conflict@1": {
      const computed = computedOverload(edge); computedOverloadComparisons++;
      const captures = call("rules.transition.event.capture@1", edge);
      if (captures.length === 0) {
        assert.deepEqual(computed, { kind: "clear", conflicts: [] });
        result = { kind: "available", items: [] }; break;
      }
      assert.equal(captures.length, 1);
      const duties = call("rules.tactic.reading.defender_duty_set@1", { fen: edge.beforeFen });
      const capture = captures[0]!;
      assert.equal(evidenceValueReceipt(duties).inputDigest, evidenceDigest({ fen: edge.beforeFen }));
      assert.equal(evidenceValueReceipt(capture).inputDigest, evidenceDigest(edge));
      const outcome = call(ref, { capture, duties });
      result = items(outcome);
      if (outcome.kind === "unavailable") assert.deepEqual(computed, { kind: "unavailable", reason: outcome.reason, conflicts: [] });
      else {
        assert.notEqual(computed.kind, "unavailable");
        assert.deepEqual(computed.conflicts, outcome.value.map(value => value.payload));
      }
      if (outcome.kind === "available") for (const value of outcome.value) {
        assert.deepEqual(evidenceValueReceipt(value).sourceDigests,
          [duties, capture].map(input => evidenceValueReceipt(input).payloadDigest));
        overloadLiteralInputs++;
        const payload = value.payload as OverloadedDefenderConflict;
        assert(payload.legalRecaptures.length > 0 && payload.positiveCaptures.length > 0);
        assert.deepEqual([payload.beforeFen, payload.candidate, payload.afterFen],
          [edge.beforeFen, edge.moveUci, edge.afterFen]);
        for (const recapture of payload.legalRecaptures) {
          const position = positionFromFen(edge.afterFen), move = parseUci(recapture);
          assert(move !== undefined && position.isLegal(move)); position.play(move);
          const replyFen = canonicalFen(position);
          const witnesses = payload.positiveCaptures.filter(row => row.recapture === recapture);
          assert(witnesses.length > 0, "every recapture must expose a retained target");
          for (const witness of witnesses) {
            assert(payload.retainedTargets.some(target => evidenceDigest(target) === evidenceDigest(witness.target)));
            assert(witness.captures.length > 0);
            for (const exchange of witness.captures) {
              assert.equal(exchange.beforeFen, replyFen, "hypothetical capture belongs AFTER its named legal recapture");
              assert.deepEqual(exchange.captured, { square: witness.target.square,
                color: witness.target.piece.color, role: witness.target.piece.role });
              assert.notEqual(exchange.beforeFen, edge.beforeFen, "a played-edge exchange is not this authority");
              assert(exchange.resultUnits > 0);
              const actual = invoke("rules.exchange.predicate.legal_exchange@1", { fen: replyFen, captureUci: exchange.captureUci });
              assert.equal(actual.length, 1, "retained hypothetical exchange must have one actual capture result");
              assert.deepEqual(actual[0]!.payload, exchange); overloadHypotheticalCaptures++;
            }
          }
          overloadReplyPositions++;
        }
      }
      break;
    }
    default: {
      const breadth = call("rules.tactic.consequence.reply_breadth@1", edge);
      result = items(call(ref, { beforeFen: edge.beforeFen, breadth, maxAttackerMoves: horizon }));
    }
  }
  const metricKey = `${ref}${ref.startsWith("rules.tactic.consequence.forced_mate") ? `/h${horizon}` : ""}`;
  const metric = counts.get(metricKey) ?? { requests: 0, items: 0, maxMs: 0, maxNodes: 0, states: new Set<string>() };
  metric.requests++; metric.maxMs = Math.max(metric.maxMs, performance.now() - started);
  if (result.kind === "available") for (const value of result.items) {
    assert.equal(`${value.projection.id}@${value.projection.version}`, ref);
    metric.items++;
    const payload = value.payload as Record<string, unknown>;
    if (ref.startsWith("rules.tactic.consequence.forced_mate")) {
      assert.equal(payload.beforeFen, edge.beforeFen); assert.equal(payload.afterFen, edge.afterFen);
      assert.equal(payload.candidate, edge.moveUci); assert.equal(payload.maxAttackerMoves, horizon);
      assert(["proved", "refuted", "budget_exhausted"].includes(String(payload.proofStatus)));
      metric.states.add(String(payload.proofStatus)); metric.maxNodes = Math.max(metric.maxNodes, Number(payload.nodes));
      if (ref.endsWith("@2")) assert.deepEqual(Object.keys(payload).sort(),
        ["beforeFen", "candidate", "afterFen", "attacker", "maxAttackerMoves", "proofStatus", "proofDigest", "rootReplies", "nodes"].sort());
    }
  }
  if (result.kind !== "available") metric.states.add(result.kind);
  else if (result.items.length === 0) metric.states.add("complete_empty");
  counts.set(metricKey, metric); requests++;
  assert(!trace.some(ref => /^(live\.|human\.|derived\.pivotal\.|derived\.story\.)/u.test(ref)));
  return result;
}

const fixtures = [
  { name: "discovered", fen: "7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", move: "f3h4", positive: refs[0] },
  { name: "fork", fen: "4k3/8/8/8/1n6/8/8/R3K3 b - - 0 1", move: "b4c2", positive: refs[1] },
  { name: "overload", fen: "1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", move: "b8a7", positive: refs[2] },
  { name: "overload-clear", fen: "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", move: "b8a7", positive: null },
  { name: "mate", fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", move: "f7g7", positive: refs[3] },
  { name: "opening", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", move: "e2e4", positive: null },
  { name: "overload-pinned", fen: "1Bk5/r2pq3/2n5/8/8/8/8/2R1R1K1 w - - 0 1", move: "b8a7", positive: null },
  { name: "en-passant-overload", fen: "k2r2r1/8/8/3pP3/8/8/8/1K4R1 w - d6 0 2", move: "e5d6", positive: refs[2] },
] as const;
for (const fixture of fixtures) for (const mirrored of [false, true]) {
  const run = recordedSourceRun(`d3836-${fixture.name}-${mirrored}`,
    mirrored ? mirrorSemanticFen(fixture.fen, "color_and_vertical") : fixture.fen,
    [mirrored ? mirrorSemanticUci(fixture.move, "color_and_vertical") : fixture.move]);
  const branchId = run.activeCursor.branchId, path = branchPath(run, branchId), saved = JSON.stringify(run);
  for (const ref of refs) {
    checked(() => { assert.deepEqual(execute(run, branchId, path[0]!.id, ref), { kind: "missing_context", reason: "no_incoming_edge" }); assert.deepEqual(trace, []); });
    const horizons = ref.startsWith("rules.tactic.consequence.forced_mate") ? [1, 2, 3, 4] : [4];
    for (const horizon of horizons) checked(() => {
      const result = execute(run, branchId, path[1]!.id, ref, horizon);
      if (fixture.name === "overload-pinned" && ref === refs[2]) {
        assert.deepEqual(result, { kind: "unavailable", reason: "no_legal_recapture" });
        assert.equal(JSON.stringify(run), saved); return;
      }
      assert.equal(result.kind, "available");
      if (result.kind !== "available") throw new Error("canonical source unavailable");
      if (fixture.positive === ref) assert(result.items.length > 0, "canonical witness is required");
      if (fixture.name === "overload-clear" && ref === refs[2]) assert.deepEqual(result.items, []);
      if (fixture.name === "en-passant-overload" && ref === refs[2])
        assert.equal((result.items[0]!.payload as { capturedTarget: { square: string } }).capturedTarget.square, mirrored ? "d4" : "d5");
      if ((fixture.name === "mate" || fixture.name === "opening" && horizon === 1) && ref.startsWith("rules.tactic.consequence.forced_mate"))
        assert.equal((result.items[0]!.payload as { proofStatus: string }).proofStatus, fixture.name === "mate" ? "proved" : "refuted");
      if (!ref.startsWith("rules.tactic.consequence.forced_mate")) assert(!trace.some(value => value.startsWith("rules.tactic.consequence.forced_mate")));
      assert.equal(JSON.stringify(run), saved);
    });
  }
  console.log(JSON.stringify({ fixture: fixture.name, mirrored, controls, requests }));
}
// Factory-level unavailability is not successful absence. The proposed wire refuses horizon 5
// before acquisition; this separately preserves the unchanged factory's own closed refusal arm.
const limited = recordedSourceRun("d3836-horizon-limit", fixtures[4].fen, [fixtures[4].move]);
for (const ref of [refs[3], refs[4]]) checked(() => {
  assert.deepEqual(execute(limited, limited.activeCursor.branchId, limited.activeCursor.nodeId, ref, 5),
    { kind: "unavailable", reason: "horizon_above_four" });
});

const storage = new SQLiteRunStorage(":memory:", { concepts: { registry: loadConceptRegistry(resolve("content/concepts")) }, onMigration: () => {} });
let importedGames = 0, importedEdges = 0;
try {
  const service = new RunService(storage);
  const games = parsePgn(readFileSync("tools/r2-selection-harness/imported-sample.pgn", "utf8")).slice(0, 2);
  assert.equal(games.length, 2);
  for (const [index, game] of games.entries()) {
    const id = `d3836-import-${index}`;
    await service.importGame({ id, side: index === 0 ? "white" : "black", opponentPolicy: { mode: "human_common" },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1,
      source: { kind: "pgn", pgn: makePgn(game) }, createdAt: "2026-10-15T00:00:00.000Z" }, "d3836-source-writer");
    const run = storage.read(id)!.run, branchId = run.activeCursor.branchId, path = branchPath(run, branchId), saved = JSON.stringify(run);
    assert.equal(run.sessionKind, "imported");
    for (const node of path.slice(1, 4)) {
      for (const ref of refs) checked(() => { execute(run, branchId, node.id, ref); });
      importedEdges++;
    }
    assert.equal(JSON.stringify(storage.read(id)!.run), saved); importedGames++;
  }
} finally { storage.close(); }

const at = "2026-10-15T00:00:00.000Z";
let branched = recordedSourceRun("d3836-branches", fixtures[5].fen, ["e2e4", "e7e5", "g1f3", "b8c6"]);
const main = branched.activeCursor.branchId, mainPath = branchPath(branched, main), shared = mainPath[2]!;
branched = rewind(branched, shared.id, at).run;
branched = fork(branched, shared.id, { at }).run;
const child = branched.activeCursor.branchId;
for (const move of ["f1c4", "g8f6"]) branched = commitMove(branched, move, { at }).run;
for (const ref of refs) {
  checked(() => assert.deepEqual(execute(branched, child, shared.id, ref, 1), execute(branched, main, shared.id, ref, 1)));
  checked(() => { assert.throws(() => execute(branched, child, mainPath[3]!.id, ref)); assert.deepEqual(trace, []); });
  const tip = branchPath(branched, child).at(-1)!;
  for (const invalid of [
    { ...branched, nodes: [...branched.nodes, tip] },
    { ...branched, nodes: branched.nodes.map(node => node.id === tip.id ? { ...node, parentId: "missing" } : node) },
    { ...branched, nodes: branched.nodes.map(node => node.id === tip.id ? { ...node, fen: "invalid" } : node) },
    { ...branched, nodes: branched.nodes.map(node => node.id === tip.id ? { ...node, fen: fixtures[5].fen } : node) },
  ]) checked(() => { assert.throws(() => execute(invalid, child, shared.id, ref)); assert.deepEqual(trace, []); });
}
const report = { scope: "D3836/D3847 source diagnostic; timings include added reconstruction checks, NOT production latency/admission/qualification",
  controls, requests, importedGames, importedEdges,
  overloadLiteralInputs, overloadHypotheticalCaptures, overloadReplyPositions, computedOverloadComparisons,
  rows: [...counts].map(([source, value]) => ({ source, ...value, maxMs: Math.round(value.maxMs * 1000) / 1000, states: [...value.states].sort() })) };
assert(Buffer.byteLength(JSON.stringify(report)) < 16 * 1024);
const quietEdge = selectedEdge(branched, main, mainPath[1]!.id)!;
const invalidQuietEdges = [
  { ...quietEdge, beforeFen: "not-a-fen" },
  { ...quietEdge, moveUci: "e2e5" },
  { ...quietEdge, afterFen: quietEdge.beforeFen },
];
for (const edge of invalidQuietEdges) {
  assert.deepEqual(overloadedDefenderResponseConflict(edge.beforeFen, edge.moveUci, edge.afterFen, undefined), { kind: "clear", conflicts: [] });
  assert.throws(() => computedOverload(edge), "the new computed recipe must validate before its no-capture path");
}
console.log(JSON.stringify({ scope: "D3852 direct computed-edge recipe only; no new source mint/adoption",
  computedOverloadComparisons, invalidQuietEdgeRefusals: invalidQuietEdges.length, sealedPrerequisitesUsedByRecipe: 0 }));
console.log(JSON.stringify(report, null, 2));
