// DISPOSABLE D3815 requested-family/selected-endpoint source-owner prototype, not production.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePgn, makePgn } from "chessops/pgn";
import { branchPath, recordedSemanticPathExecution, assertDeclaredEvidence, type DrillRun, type VersionedEvidenceId } from "../../packages/runtime/src/index.js";
import { recordedPathEvaluatorRows, type RecordedSemanticPathExecution, type RecordedPathWindowReceipt } from "../../packages/runtime/src/recorded-semantic-path.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../packages/runtime/src/semantic-validation.js";
import type { SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
import { evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import type { RecordedEdge } from "../../packages/runtime/src/recorded-edge.js";
import type { RecordedMoveAnchor } from "../../packages/runtime/src/pawn-dynamics.js";
import { RECORDED_DEFLECTION_CHECK } from "../../packages/runtime/src/testing/recorded-sequence-fixtures.js";
import { RECORDED_SOURCE_CASES, recordedSourceRun } from "./recorded-source-cases.js";
import { SQLiteRunStorage } from "../../apps/server/src/storage.js";
import { RunService } from "../../apps/server/src/service.js";
import { loadConceptRegistry } from "../../apps/server/src/concept-registry-loader.js";

type WindowExecution = Omit<RecordedSemanticPathExecution, "result"> & { result:
  | (Extract<RecordedSemanticPathExecution["result"], { kind: "available" }> & { researchScope: {
    protocol: "research.recorded-window@0"; throughNodeId: string; projection: VersionedEvidenceId;
    incompleteHorizons: readonly number[]; validatedEdges: number;
  } }) | { kind: "refused"; reason: string } };
const requested = (run: DrillRun, branchId: string, throughNodeId: string, projection: VersionedEvidenceId): WindowExecution =>
  Reflect.apply(recordedSemanticPathExecution, undefined, [run, branchId,
    { preparation: "exact", researchThroughNodeId: throughNodeId, researchProjection: projection }]) as WindowExecution;
let queries = 0, events = 0, missingContext = 0, noWitness = 0, maxPreparedEdges = 0;
let captureFreeSources = 0, checkFreeSources = 0;
const reached = new Set<string>();
// D3847: actual fixed tuples, finite horizons and bounded complete capture populations.
// Reinvoke only OLD factories from their genuine sources; no proposed successor is minted.
const E = "run.record.edge@1", M = "run.record.move@1", C = "rules.transition.event.capture@1";
const D = "rules.tactic.reading.defender_duty_set@1", K = "rules.tactic.event.check@1", X = "rules.exchange.predicate.legal_exchange@1";
const refKey = (value: DeclaredEvidence<unknown>) => `${value.projection.id}@${value.projection.version}`;
const tupleRows = new Map<string, { outputs: number; signatures: Set<string>; narrativeOutputs: number;
  samePayloadPopulations: number; changedPayloadPopulations: number }>();
let tupleReplays = 0, swappedEdgeRefusals = 0, swappedMoveRefusals = 0;
let incompleteCaptureAccepted = 0, reorderedCaptureAccepted = 0, capturePopulationChecks = 0;
let completeCaptureGuardPositives = 0, completeCaptureGuardNegatives = 0;
let indexedCaptureJoins = 0, indexedExchangeJoins = 0;
let sampleCapture: DeclaredEvidence<unknown> | undefined;
// Disposable prospective guard, not a changed old factory or an invented absence receipt.
// The source owner derives every eligible edge occurrence, including successful empty results.
function completeCaptureGuard(anchors: readonly RecordedMoveAnchor[], supplied: readonly DeclaredEvidence<unknown>[]) {
  const expected = anchors.flatMap(anchor => {
    const values = invokeEvidenceValueRoute("rules.transition.event.capture@1",
      { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen });
    assert(values.length <= 1, "one legal edge cannot have multiple capture events");
    return values;
  });
  assert.equal(supplied.length, expected.length, "capture population must be complete");
  for (const [index, value] of supplied.entries()) {
    assertDeclaredEvidence(value); assert.equal(refKey(value), C);
    const actualReceipt = evidenceValueReceipt(value), wantedReceipt = evidenceValueReceipt(expected[index]!);
    assert.equal(actualReceipt.factory, wantedReceipt.factory);
    assert.equal(actualReceipt.inputDigest, wantedReceipt.inputDigest, "capture source must match this exact ordered window edge");
    assert.deepEqual(value.payload, expected[index]!.payload);
  }
}
function inspectSequence(event: SemanticEvidenceEvent) {
  const inputs = event.derivationInputs;
  const edges = inputs.filter(value => refKey(value) === E) as readonly DeclaredEvidence<RecordedEdge>[];
  const n = edges.length;
  assert(n >= 2 && n <= 5);
  const anchors = edges.map(value => {
    assertDeclaredEvidence(value);
    const p = value.payload;
    return { beforeNodeId: p.beforeNodeId, afterNodeId: p.afterNodeId, beforeFen: p.beforeFen, moveUci: p.moveUci, afterFen: p.afterFen };
  });
  for (let index = 1; index < edges.length; index++) {
    assert.equal(edges[index]!.payload.runId, edges[0]!.payload.runId);
    assert.equal(edges[index - 1]!.payload.afterNodeId, edges[index]!.payload.beforeNodeId);
    assert.equal(edges[index - 1]!.payload.afterFen, edges[index]!.payload.beforeFen);
    assert.equal(edges[index - 1]!.payload.ply + 1, edges[index]!.payload.ply);
  }
  const byRef = (ref: string) => inputs.filter(value => refKey(value) === ref);
  const captures = byRef(C), duties = byRef(D), checks = byRef(K), exchanges = byRef(X);
  const captureAt = (value: DeclaredEvidence<unknown>, index: number) => {
    const anchor = anchors[index]!;
    const population = invokeEvidenceValueRoute("rules.transition.event.capture@1",
      { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen });
    assert.equal(population.length, 1, "required indexed edge must contain exactly one capture");
    assertDeclaredEvidence(value); assert.equal(refKey(value), C);
    assert.equal(evidenceValueReceipt(value).factory, evidenceValueReceipt(population[0]!).factory);
    assert.equal(evidenceValueReceipt(value).inputDigest, evidenceValueReceipt(population[0]!).inputDigest);
    assert.deepEqual(value.payload, population[0]!.payload); indexedCaptureJoins++;
  };
  sampleCapture ??= captures[0];
  const moves = anchors.map((_anchor, offset) => invokeEvidenceValueRoute("run.record.move@1", { path: anchors, offset }));
  const id = event.projection.id;
  let extras: Record<string, unknown> = {}, expected: readonly string[];
  let recorded: Record<string, unknown> = { edges }, narrative: Record<string, unknown> = { moves };
  if (id === "derived.exchange.trade_completed") {
    assert.equal(n, 2);
    captureAt(captures[0]!, 0); captureAt(captures[1]!, 1);
    expected = [C, C, E, E];
    recorded = { first: captures[0], second: captures[1], firstEdge: edges[0], secondEdge: edges[1] };
    narrative = { first: captures[0], second: captures[1], firstMove: moves[0], secondMove: moves[1] };
  } else if (id === "derived.pawn.sequence.contact_timing") {
    assert(n === 2 || n === 3); expected = Array(n).fill(E);
  } else if (id === "derived.pawn.sequence.harassment_pressure") {
    assert.equal(n, 2); expected = [E, E];
  } else if (["derived.tactic.sequence.defender_consequence", "derived.tactic.square_clearance_observed"].includes(id)) {
    assert.equal(n, 3); expected = [E, E, E];
  } else if (id === "derived.tactic.line_blocker_clearance_observed") {
    assert.equal(n, 3); expected = [E, E, E, X]; extras = { exchange: exchanges[0] };
  } else if (id === "derived.tactic.interference_observed") {
    assert.equal(n, 3); expected = [E, E, E, D, X]; extras = { duty: duties[0], exchange: exchanges[0] };
  } else if (id === "derived.tactic.check_zwischenzug_observed") {
    assert.equal(n, 4); expected = [E, E, E, E, C, K, X]; extras = { capture: captures[0], check: checks[0], exchange: exchanges[0] };
    captureAt(captures[0]!, 0);
    assert.equal((checks[0]!.payload as { triggeringMove: string }).triggeringMove, anchors[1]!.moveUci);
    assert.equal(evidenceValueReceipt(checks[0]!).inputDigest,
      evidenceDigest({ beforeFen: anchors[1]!.beforeFen, moveUci: anchors[1]!.moveUci, afterFen: anchors[1]!.afterFen }));
  } else if (id === "derived.tactic.overload_exploitation_observed") {
    assert.equal(n, 3); expected = [E, E, E, D, C, C, C, X]; extras = { duty: duties[0], captures, exchange: exchanges[0] };
  } else if (id === "derived.tactic.deflection_observed" || id === "derived.tactic.attraction_observed") {
    assert(id === "derived.tactic.deflection_observed" ? n === 3 : n === 3 || n === 5);
    assert(captures.length >= 1 && captures.length <= n); assert(checks.length <= 1);
    expected = [...Array(n).fill(E), ...(id === "derived.tactic.deflection_observed" ? [D] : []),
      ...Array(captures.length).fill(C), ...(id === "derived.tactic.deflection_observed" ? [X] : []), ...Array(checks.length).fill(K)];
    extras = { captures, ...(id === "derived.tactic.deflection_observed" ? { duty: duties[0], exchange: exchanges[0] } : {}),
      ...(checks.length ? { check: checks[0] } : {}) };
    if (checks.length) {
      const anchor = anchors[id === "derived.tactic.deflection_observed" ? 0 : 2]!;
      assert.equal((checks[0]!.payload as { triggeringMove: string }).triggeringMove, anchor.moveUci);
      assert.equal(evidenceValueReceipt(checks[0]!).inputDigest,
        evidenceDigest({ beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen }));
    }
  } else throw new TypeError(`Unclassified actual sequence ${id}`);
  assert.deepEqual(inputs.map(refKey), expected);
  assert.deepEqual(evidenceValueReceipt(event.evidence).sourceDigests, inputs.map(value => evidenceValueReceipt(value).payloadDigest));
  for (const duty of duties) {
    assert.equal((duty.payload as { fen: string }).fen, anchors[0]!.beforeFen);
    assert.equal(evidenceValueReceipt(duty).inputDigest, evidenceDigest({ fen: anchors[0]!.beforeFen }));
  }
  for (const exchange of exchanges) {
    const payload = event.operands as { targetCapture?: unknown; retainedRecapture?: unknown; secondTargetCapture?: unknown };
    const expected = id === "derived.tactic.check_zwischenzug_observed" ? payload.retainedRecapture
      : id === "derived.tactic.overload_exploitation_observed" ? payload.secondTargetCapture : payload.targetCapture;
    assert.deepEqual(exchange.payload, expected);
    const source = exchange.payload as { beforeFen: string; captureUci: string };
    const anchor = anchors.at(-1)!;
    assert.equal(source.beforeFen, anchor.beforeFen, "exchange must start on the required final window edge");
    assert.equal(source.captureUci, anchor.moveUci, "exchange must describe the required final window move");
    assert.equal(evidenceValueReceipt(exchange).inputDigest, evidenceDigest({ fen: anchor.beforeFen, captureUci: anchor.moveUci }));
    indexedExchangeJoins++;
  }
  if (["derived.tactic.deflection_observed", "derived.tactic.attraction_observed", "derived.tactic.overload_exploitation_observed"].includes(id)) {
    const complete = anchors.flatMap(anchor => invokeEvidenceValueRoute("rules.transition.event.capture@1",
      { beforeFen: anchor.beforeFen, moveUci: anchor.moveUci, afterFen: anchor.afterFen }));
    assert.deepEqual(captures.map(value => value.payload), complete.map(value => value.payload));
    assert.deepEqual(captures.map(value => evidenceValueReceipt(value).inputDigest), complete.map(value => evidenceValueReceipt(value).inputDigest));
    completeCaptureGuard(anchors, captures); completeCaptureGuardPositives++;
    assert.throws(() => completeCaptureGuard(anchors, captures.slice(1))); completeCaptureGuardNegatives++;
    assert.throws(() => completeCaptureGuard(anchors, [...captures, captures[0]!])); completeCaptureGuardNegatives++;
    if (captures.length > 1) {
      assert.throws(() => completeCaptureGuard(anchors, [...captures].reverse())); completeCaptureGuardNegatives++;
      assert.throws(() => completeCaptureGuard(anchors, [captures[0]!, captures[0]!, ...captures.slice(2)])); completeCaptureGuardNegatives++;
    }
    capturePopulationChecks++;
  }
  recorded = { ...recorded, ...extras }; narrative = { ...narrative, ...extras };
  const population = invokeEvidenceValueRoute(`${id}@2` as EvidenceValueRoute, recorded as never) as readonly DeclaredEvidence<unknown>[];
  assert(population.some(value => evidenceDigest(value.payload) === evidenceDigest(event.evidence.payload)));
  const legacy = invokeEvidenceValueRoute(`${id}@1` as EvidenceValueRoute, narrative as never) as readonly DeclaredEvidence<unknown>[];
  const legacyInputs = [...expected].map(ref => ref === E ? M : ref);
  let moveIndex = 0;
  const narrativeSources = inputs.map(value => refKey(value) === E ? moves[moveIndex++]! : value);
  assert.deepEqual(narrativeSources.map(refKey), legacyInputs);
  for (const value of legacy) assert.deepEqual(evidenceValueReceipt(value).sourceDigests,
    narrativeSources.map(source => evidenceValueReceipt(source).payloadDigest));
  assert.throws(() => invokeEvidenceValueRoute(`${id}@2` as EvidenceValueRoute,
    (id === "derived.exchange.trade_completed" ? { ...recorded, firstEdge: edges[1], secondEdge: edges[0] } : { ...recorded, edges: [...edges].reverse() }) as never));
  swappedEdgeRefusals++;
  assert.throws(() => invokeEvidenceValueRoute(`${id}@1` as EvidenceValueRoute,
    (id === "derived.exchange.trade_completed" ? { ...narrative, firstMove: moves[1], secondMove: moves[0] } : { ...narrative, moves: [...moves].reverse() }) as never));
  swappedMoveRefusals++;
  if (["derived.tactic.deflection_observed", "derived.tactic.attraction_observed"].includes(id) && captures.length > 1) {
    // Current factories accept these incomplete/reordered genuine window witnesses. Observe the
    // gap; do not quietly make an old version reject or call this a future-conformance pass.
    const omitted = invokeEvidenceValueRoute(`${id}@2` as EvidenceValueRoute, { ...recorded, captures: captures.slice(1) } as never) as readonly DeclaredEvidence<unknown>[];
    const reversed = invokeEvidenceValueRoute(`${id}@2` as EvidenceValueRoute, { ...recorded, captures: [...captures].reverse() } as never) as readonly DeclaredEvidence<unknown>[];
    assert.deepEqual(omitted.map(value => value.payload), population.map(value => value.payload)); incompleteCaptureAccepted++;
    assert.deepEqual(reversed.map(value => value.payload), population.map(value => value.payload)); reorderedCaptureAccepted++;
  }
  const row = tupleRows.get(id) ?? { outputs: 0, signatures: new Set<string>(), narrativeOutputs: 0, samePayloadPopulations: 0, changedPayloadPopulations: 0 };
  row.outputs++; row.signatures.add(expected.join(",")); row.narrativeOutputs += legacy.length;
  const equal = evidenceDigest(population.map(value => value.payload)) === evidenceDigest(legacy.map(value => value.payload));
  if (equal) row.samePayloadPopulations++; else row.changedPayloadPopulations++;
  tupleRows.set(id, row); tupleReplays++;
}
for (const [fixtureIndex, fixture] of RECORDED_SOURCE_CASES.entries()) {
  for (const mirrored of [false, true]) {
    const run = recordedSourceRun(`d3815-window-${fixtureIndex}-${mirrored}`,
      mirrored ? mirrorSemanticFen(fixture.fen, "color_and_vertical") : fixture.fen,
      mirrored ? fixture.moves.map(move => mirrorSemanticUci(move, "color_and_vertical")) : fixture.moves);
    const branchId = run.activeCursor.branchId, path = branchPath(run, branchId), saved = JSON.stringify(run);
    const full = recordedSemanticPathExecution(run, branchId);
    assert.equal(full.result.kind, "available");
    if (full.result.kind !== "available") assert.fail("canonical source refused");
    for (const event of full.result.events) inspectSequence(event);
    const projection = { id: fixture.projection, version: 2 };
    const rows = recordedPathEvaluatorRows().filter(row => row.projection.id === projection.id && row.projection.version === projection.version);
    assert(rows.length > 0);
    for (let end = 0; end < path.length; end++) {
      const endpoint = path[end]!.id;
      const execution = requested(run, branchId, endpoint, projection);
      assert.equal(execution.result.kind, "available");
      if (execution.result.kind !== "available") assert.fail("actual bounded source refused");
      const value = execution.result;
      const complete = rows.filter(row => row.horizon <= end);
      const incomplete = rows.filter(row => row.horizon > end).map(row => row.horizon);
      assert.deepEqual(value.researchScope, { protocol: "research.recorded-window@0", throughNodeId: endpoint,
        projection, incompleteHorizons: incomplete, validatedEdges: end });
      assert.deepEqual(value.pathNodeIds, path.slice(0, end + 1).map(node => node.id));
      const wantedWindows: readonly RecordedPathWindowReceipt[] = full.result.windows.filter(window =>
        window.endNodeId === endpoint && window.projection.id === projection.id && window.projection.version === projection.version);
      assert.deepEqual(value.windows, wantedWindows);
      const wantedIds = new Set(wantedWindows.flatMap(window => window.eventIds));
      const wantedEvents: readonly SemanticEvidenceEvent[] = full.result.events.filter(event => wantedIds.has(event.id));
      assert.deepEqual(value.events, wantedEvents);
      assert(value.events.every(event => event.anchor.nodeId === endpoint && event.projection.id === projection.id));
      for (const event of value.events) assertDeclaredEvidence(event.evidence);
      const prepared = complete.length === 0 ? 0 : Math.max(...complete.map(row => row.horizon));
      assert.equal(execution.work.preparedEdges, prepared);
      assert.equal(execution.work.localFanOut, 0);
      assert(prepared <= 5); maxPreparedEdges = Math.max(maxPreparedEdges, prepared);
      const needsCapture = rows.some(row => ["trade_completed", "deflection", "attraction", "check_zwischenzug", "overload_exploitation"].includes(row.family));
      const needsCheck = rows.some(row => ["deflection", "attraction", "check_zwischenzug"].includes(row.family));
      assert.equal(execution.work.transitionCompiles, needsCapture ? prepared : 0);
      assert.equal(execution.work.checkProbes, needsCheck ? prepared : 0);
      if (!needsCapture) captureFreeSources++;
      if (!needsCheck) checkFreeSources++;
      if (complete.length === 0) {
        assert.deepEqual(value.events, []); assert.deepEqual(value.windows, []);
        assert.equal(execution.work.defenderDutyReads, 0); missingContext++;
      } else if (value.events.length === 0) noWitness++;
      if (end === path.length - 1) {
        assert.equal(value.events.length > 0, fixture.emits);
        if (fixture.emits) reached.add(projection.id);
      }
      assert.equal(JSON.stringify(run), saved); events += value.events.length; queries++;
    }
    assert.throws(() => requested(run, branchId, path.at(-1)!.id, { id: fixture.projection, version: 1 }), /no exact source-owner row/u);
  }
}
assert.equal(reached.size, 11);
// The shared52-fixture source population omits check-induced deflection; require that arm too.
for (const mirrored of [false, true]) {
  const fixture = RECORDED_DEFLECTION_CHECK;
  const run = recordedSourceRun(`d3847-check-deflection-${mirrored}`,
    mirrored ? mirrorSemanticFen(fixture.fen, "color_and_vertical") : fixture.fen,
    mirrored ? fixture.moves.map(move => mirrorSemanticUci(move, "color_and_vertical")) : fixture.moves);
  const result = recordedSemanticPathExecution(run, run.activeCursor.branchId).result;
  assert.equal(result.kind, "available"); if (result.kind !== "available") assert.fail("check fixture refused");
  const events = result.events.filter(event => event.projection.id === "derived.tactic.deflection_observed");
  assert(events.length > 0 && events.every(event => event.derivationInputs.some(value => refKey(value) === K)));
  for (const event of events) inspectSequence(event);
}
assert.equal(tupleRows.size, 11);
assert(incompleteCaptureAccepted > 0 && reorderedCaptureAccepted > 0);
const quiet = recordedSourceRun("d3847-empty-capture-population",
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", ["a2a3", "h7h6", "b2b3"]);
const quietPath = branchPath(quiet, quiet.activeCursor.branchId);
const quietAnchors = quietPath.slice(1).map((node, index) => ({ beforeNodeId: quietPath[index]!.id,
  afterNodeId: node.id, beforeFen: quietPath[index]!.fen, moveUci: node.moveUci!, afterFen: node.fen }));
completeCaptureGuard(quietAnchors, []); completeCaptureGuardPositives++;
assert(sampleCapture); assert.throws(() => completeCaptureGuard(quietAnchors, [sampleCapture!])); completeCaptureGuardNegatives++;
console.log(JSON.stringify({ scope: "D3847 genuine sequence tuple/replay diagnostic; no corrected factories, lineage qualification or adoption",
  tupleReplays, swappedEdgeRefusals, swappedMoveRefusals, capturePopulationChecks,
  indexedCaptureJoins, indexedExchangeJoins,
  completeCaptureGuardPositives, completeCaptureGuardNegatives,
  incompleteCaptureAccepted, reorderedCaptureAccepted,
  rows: [...tupleRows].map(([projection, row]) => ({ projection, ...row, signatures: [...row.signatures].sort() })),
  narrativeNotRelabelledRecorded: true, historicalVersionsUnchanged: true }));
// Actual server imports and parsed stored sources, not a position-run imitation of a PGN.
// Test-only writer overload: no authentication/Review/API/native proof is inferred here.
let importedGames = 0, importedEdges = 0, importedQueries = 0, importedEvents = 0;
const storage = new SQLiteRunStorage(":memory:", {
  concepts: { registry: loadConceptRegistry(resolve("content/concepts")) }, onMigration: () => {},
});
try {
  const service = new RunService(storage);
  const games = parsePgn(readFileSync("tools/r2-selection-harness/imported-sample.pgn", "utf8")).slice(0, 8);
  assert.equal(games.length, 8);
  const refs = [...new Map(recordedPathEvaluatorRows().map(row => [`${row.projection.id}@${row.projection.version}`, row.projection])).values()];
  for (const [index, game] of games.entries()) {
    await service.importGame({ id: `d3815-import-${index}`, side: index % 2 === 0 ? "white" : "black",
      opponentPolicy: { mode: "human_common" }, policyConfig: { seedMode: "fixed",
        locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1,
      source: { kind: "pgn", pgn: makePgn(game) }, createdAt: "2026-10-14T00:00:00.000Z",
    }, "d3815-import-writer");
    const run = storage.read(`d3815-import-${index}`)!.run;
    assert.equal(run.sessionKind, "imported");
    const path = branchPath(run, run.activeCursor.branchId), saved = JSON.stringify(run);
    const full = recordedSemanticPathExecution(run, run.activeCursor.branchId);
    assert.equal(full.result.kind, "available");
    if (full.result.kind !== "available") assert.fail("actual imported source refused");
    for (const end of [2, Math.floor((path.length - 1) / 2), path.length - 1]) for (const ref of refs) {
      const result = requested(run, run.activeCursor.branchId, path[end]!.id, ref);
      assert.equal(result.result.kind, "available");
      if (result.result.kind !== "available") assert.fail("actual imported window refused");
      const windows: readonly RecordedPathWindowReceipt[] = full.result.windows.filter(window =>
        window.endNodeId === path[end]!.id && window.projection.id === ref.id && window.projection.version === ref.version);
      const ids = new Set(windows.flatMap(window => window.eventIds));
      assert.deepEqual(result.result.windows, windows);
      assert.deepEqual(result.result.events, full.result.events.filter(event => ids.has(event.id)));
      assert.equal(result.result.researchScope.validatedEdges, end);
      assert(result.work.preparedEdges <= 5);
      assert.equal(JSON.stringify(storage.read(run.id)!.run), saved);
      importedQueries++; importedEvents += result.result.events.length;
    }
    importedGames++; importedEdges += path.length - 1;
  }
} finally { storage.close(); }
console.log(JSON.stringify({ scope: "D3815 exact family/endpoint source acquisition prototype; NOT production or UI proof",
  queries, events, canonicalPositiveFamilies: reached.size, missingContext, noWitness, maxPreparedEdges,
  captureFreeSources, checkFreeSources, noHistoricalOrFutureWindows: true, unchangedSealedEventValues: true,
  v1NotRelabelled: true, graphValidationSeparateFromAtMostFiveEdgePreparation: true,
  importedGames, importedEdges, importedQueries, importedEvents }));
