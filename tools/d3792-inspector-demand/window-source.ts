// DISPOSABLE D3815 requested-family/selected-endpoint source-owner prototype, not production.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePgn, makePgn } from "chessops/pgn";
import { branchPath, recordedSemanticPathExecution, assertDeclaredEvidence, type DrillRun, type VersionedEvidenceId } from "../../packages/runtime/src/index.js";
import { recordedPathEvaluatorRows, type RecordedSemanticPathExecution, type RecordedPathWindowReceipt } from "../../packages/runtime/src/recorded-semantic-path.js";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../packages/runtime/src/semantic-validation.js";
import type { SemanticEvidenceEvent } from "../../packages/runtime/src/semantic-evidence.js";
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
for (const [fixtureIndex, fixture] of RECORDED_SOURCE_CASES.entries()) {
  for (const mirrored of [false, true]) {
    const run = recordedSourceRun(`d3815-window-${fixtureIndex}-${mirrored}`,
      mirrored ? mirrorSemanticFen(fixture.fen, "color_and_vertical") : fixture.fen,
      mirrored ? fixture.moves.map(move => mirrorSemanticUci(move, "color_and_vertical")) : fixture.moves);
    const branchId = run.activeCursor.branchId, path = branchPath(run, branchId), saved = JSON.stringify(run);
    const full = recordedSemanticPathExecution(run, branchId);
    assert.equal(full.result.kind, "available");
    if (full.result.kind !== "available") assert.fail("canonical source refused");
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
