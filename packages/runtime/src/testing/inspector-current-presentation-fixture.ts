import { collectFoundationSnapshotSource, collectFoundationAdvanceSource, type FoundationSnapshotSourceRef } from "../foundation-snapshot-source.js";
import { FOUNDATION_SNAPSHOT_STATEMENTS } from "../foundation-snapshot-presentation.js";
/** Test-only genuine current source handles. No copied/relabelled predecessor payloads,
 * fake consumer views or provider truth claims. Mechanical captures represent transport only. */
import { readFileSync } from "node:fs";
import type { DeclaredEvidence } from "../evidence-contract.js";
import { invokeEvidenceValueRoute } from "../internal/evidence-value-routes.js";
import { INSPECTOR_DETAIL_SOURCES, type InspectorDetailKind } from "../inspector-detail.js";
import { collectInspectorDetailSource } from "../inspector-detail-source.js";
import { INSPECTOR_SOURCE_TOPICS } from "../inspector-source-topics.js";
import { collectInspectorPivotalPrefix } from "../inspector-pivotal-source.js";
import { recordedPivotalFixture } from "./recorded-pivotal-fixture.js";
import { humanObservationRun, recordHumanObservation, splitCandidates } from "./recorded-human-divergence-fixture.js";
import { recordedInspectorAttachment, recordedInspectorSubject } from "./recorded-inspector-fixture.js";
import { recordedComparisonFixture } from "./recorded-comparison-fixture.js";
import { recordedComparisonEvalFixture } from "./recorded-comparison-eval-fixture.js";
import { collectComparisonStructuralPopulation } from "../comparison-structural-population.js";
import { recordedLastLevelFixture } from "./recorded-last-level-fixture.js";
import { collectRecordedReviewSourcePopulation } from "../review-evidence.js";
import { collectRecordedReviewMoments } from "../recorded-review-moments.js";
import { admitInstalledOpeningCatalogue } from "../opening-catalogue.js";
import { collectRecordedOpeningHistory } from "../recorded-opening-history.js";
import { nodeTask, occurrenceRun } from "./maia-occurrence-fixture.js";
import { normalizeProviderRequest } from "../provider-requests.js";
import { PROVIDER_EXCHANGE_AUTHORITY } from "../provider-exchange.js";
import { explorerRequest, explorerBody, httpCapture, FIXTURE_AT, START_FEN } from "../provider-test-fixtures.js";
import { registeredShapeFixture } from "./registered-shape-fixture.js";
import { sealedItems, inspectorFixtureEdges } from "./inspector-presentation-fixture.js";
import { collectFoundationEdgeEvents, type FoundationEdgeSourceRef } from "../foundation-edge-source.js";
import { FOUNDATION_EDGE_STATEMENTS } from "../foundation-edge-presentation.js";
import { importedRun, play, evaluationDelivery, lineDelivery, attachDelivery, REVIEW_AT } from "./review-evidence-fixture.js";
import { attachEvidence } from "../evidence.js";
import { collectRecordedAnalyzeLine } from "../recorded-analyze-line.js";
import { branchPath } from "../branch-path.js";

const collectSourceValues = (projection: FoundationEdgeSourceRef, edge: { beforeFen: string; moveUci: string; afterFen: string }) => collectFoundationEdgeEvents(edge, [projection]).map(event => event.evidence);

/** Complete current74 fixture image; local/edge/window inputs come from the real existing
 * factory corpus supplied by the caller. Missing positives fail, never skip a binding. */
export async function inspectorCurrentPresentationFixtures(local: ReadonlyMap<string, readonly DeclaredEvidence<unknown>[]>) {
  const found = new Map(local);
  const put = (result: unknown) => {
    for (const value of sealedItems(result)) {
      const key = `${value.projection.id}@${value.projection.version}`;
      found.set(key, [...(found.get(key) ?? []), value]);
    }
  };
  for (const ref of Object.keys(FOUNDATION_EDGE_STATEMENTS) as FoundationEdgeSourceRef[]) {
    if (found.get(ref)?.length) continue;
    for (const edge of inspectorFixtureEdges()) put(collectSourceValues(ref, edge));
  }
  const signal = new AbortController().signal;
  for (const kind of ["irreversibility", "phase_change", "option_collapse", "human_divergence"] as const) {
    const run = kind === "human_divergence" ? recordHumanObservation(humanObservationRun(), splitCandidates()) : recordedPivotalFixture(kind);
    const version = kind === "irreversibility" ? 1 : 2;
    put(collectInspectorPivotalPrefix(run, run.activeCursor.branchId, run.activeCursor.nodeId, `derived.pivotal.${kind}@${version}` as Parameters<typeof collectInspectorPivotalPrefix>[3], signal).result);
  }
  for (const [kind, values, route] of [
    ["eval", { centipawns: 24, perspective: "white" }, "recorded.inspector.eval_packet@1"],
    ["wdl", { win: 350, draw: 400, loss: 250 }, "recorded.inspector.wdl_packet@1"],
    ["bestline", { movesUci: ["e2e4", "e7e5"] }, "recorded.inspector.pv_packet@1"],
    ["tablebase", { category: "win", dtz: 5, precise_dtz: 5, dtm: 9, pieceCount: 3 }, "recorded.inspector.tablebase_packet@1"],
  ] as const) {
    const f = recordedInspectorAttachment({ kind, source: kind === "tablebase" ? "tablebase_exact" : "engine_validated", values });
    if (route === "recorded.inspector.tablebase_packet@1") {
      const value = invokeEvidenceValueRoute(route, { resolved: f.resolved, itemDigest: f.itemDigest });
      put(value);
      put(invokeEvidenceValueRoute("derived.inspector.tablebase_category@1", { record: value }));
      put(invokeEvidenceValueRoute("derived.inspector.tablebase_distance@1", { record: value }));
    } else put(invokeEvidenceValueRoute(route, { resolved: f.resolved, itemDigest: f.itemDigest }));
  }
  const ledger = { anchor: { fen: START_FEN }, sourceId: "mechanical-report", retrievedAt: FIXTURE_AT, grounds: "machine_validation", supports: [] };
  put(invokeEvidenceValueRoute("recorded.engine.eval@1", { ledger: invokeEvidenceValueRoute("sourcing.ledger.engine_eval@1", { record: {
    ...ledger, kind: "engine_eval", values: { centipawns: 20, perspective: "white", depth: 12, multiPv: 1, engineId: "sf", engineName: "Stockfish", engineVersion: "fixture" },
  } }) }));
  put(invokeEvidenceValueRoute("recorded.tablebase.result@1", { ledger: invokeEvidenceValueRoute("sourcing.ledger.tablebase_result@1", { record: {
    ...ledger, kind: "tablebase_result", values: { category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 32, checkmate: false, stalemate: false, insufficient_material: false },
  } }) }));
  const nodeRun = occurrenceRun([]), resolved = recordedInspectorSubject(nodeRun), position = invokeEvidenceValueRoute("run.record.position@1", { run: nodeRun, nodeId: nodeRun.activeCursor.nodeId });
  const task = nodeTask({ kind: "history_conditioned", startFen: nodeRun.start.fen, historyUci: [] });
  put(invokeEvidenceValueRoute("derived.maia.node_distribution@1", { task, position, resolved }));
  put(invokeEvidenceValueRoute("derived.maia.node_candidate_wdl@1", { task, position, resolved }));
  const requestedIdentity = normalizeProviderRequest("lichess_explorer.position_page@1", explorerRequest());
  const capture = httpCapture("lichess_explorer.position_page@1", explorerBody({ white: 200, draws: 70, black: 100 }));
  const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation: "lichess_explorer.position_page@1", requestedIdentity, capture, requestedAt: FIXTURE_AT, retrievedAt: FIXTURE_AT });
  const { payload, payloadReceipt } = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
  const delivery = PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, payload, payloadReceipt, servedAt: FIXTURE_AT });
  const page = invokeEvidenceValueRoute("human.explorer.position_page@1", { delivery });
  put(invokeEvidenceValueRoute("derived.explorer.inspector_population@1", { page }));
  const structural = recordedComparisonFixture(), numerical = recordedComparisonEvalFixture();
  put(invokeEvidenceValueRoute("derived.compare.structure_delta@2", { population: collectComparisonStructuralPopulation({ comparison: structural.comparison }), branchId: structural.main }));
  put(invokeEvidenceValueRoute("derived.compare.eval_delta@2", { comparison: numerical.comparison, branchId: numerical.main, before: numerical.packets[0]!, after: numerical.packets[1]! }));
  const review = recordedLastLevelFixture(); review.deliver(0, "cp 20"); review.deliver(1, "cp 300");
  const ranked = invokeEvidenceValueRoute("derived.story.rank@3", { recordedReview: collectRecordedReviewMoments({ population: collectRecordedReviewSourcePopulation({ boundary: review.boundary(), context: { engine: review.engine, shapes: [] } }) }) });
  if (ranked.payload.rank.length === 0) throw new Error("Current Story fixture needs genuinely collected moments");
  put(ranked);
  // The three Analyze sources share no synthetic packet/consumer wrapper. Each collection
  // selects its own original recorded arm from the complete legal run before invoking its
  // exact accepted factory; a missing positive is an error, never a skipped source binding.
  const analyze = play(importedRun("current-inspector-analyze"), ["e2e4"]), analyzePath = branchPath(analyze, analyze.activeCursor.branchId);
  const parent = analyzePath[0]!, child = analyzePath[1]!;
  const typedAnalyze = attachDelivery(analyze, parent.id, evaluationDelivery(parent.fen, "cp 20"), lineDelivery(parent.fen, ["d2d4", "d7d5"], { maxPlies: 2 }));
  const savedAnalyze = attachEvidence(analyze, parent.id, ["recorded:presentation-fixture"], { kind: "bestline", source: "engine_validated", values: { movesUci: ["d2d4", "d7d5"], engineId: "saved-analysis-engine", requestedDepth: 12 } }, REVIEW_AT).run;
  const firstAnalyze = attachEvidence(analyze, parent.id, ["recorded:presentation-fixture"], { kind: "eval", source: "engine_validated", values: { bestMoveUci: "d2d4", engineId: "saved-analysis-engine", requestedNodes: 300 } }, REVIEW_AT).run;
  for (const [route, run] of [["derived.review.analysis_typed_pv@1", typedAnalyze], ["derived.review.analysis_recorded_pv@1", savedAnalyze], ["derived.review.analysis_recorded_first@1", firstAnalyze]] as const) {
    const source = collectRecordedAnalyzeLine(run, run.activeCursor.branchId, child.id, signal);
    const value = invokeEvidenceValueRoute(route, { source });
    if (value.kind !== "available") throw new Error(`No genuine available Analyze source for ${route}: ${value.reason}`);
    put(value);
  }
  const installation = admitInstalledOpeningCatalogue(JSON.parse(readFileSync(new URL("../../../../apps/server/artifacts/runtime-opening-catalogue.json", import.meta.url), "utf8")));
  if (installation.kind !== "available") throw new Error("Actual installed opening catalogue is unavailable");
  const opening = recordedLastLevelFixture("white", "*", "current-inspector-opening");
  put(invokeEvidenceValueRoute("theory.opening.catalogue_membership@1", { source: installation.source, position: invokeEvidenceValueRoute("run.record.position@1", { run: opening.run, nodeId: opening.path[1]!.id }) }));
  put(invokeEvidenceValueRoute("derived.opening.deepest_reached@2", { history: collectRecordedOpeningHistory({ source: installation.source, run: opening.run, branchId: opening.run.activeCursor.branchId, throughNodeId: opening.path.at(-1)!.id }) }));
  const { ShapeRegistry } = await import("../../../../apps/server/src/shape-registry.js");
  const registry = new ShapeRegistry(); await registry.add(registeredShapeFixture(), "official");
  const builder = await registry.beginCurrentShapeScan([{ id: opening.path[3]!.id, fen: opening.path[3]!.fen }], signal);
  for (;;) {
    const step = registry.advanceCurrentShapeScan(builder);
    if (step.kind === "complete") { put(invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: step.scan })); break; }
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  for (const ref of Object.keys(FOUNDATION_SNAPSHOT_STATEMENTS)) {
    if (ref === "derived.pawn.consequence.backward_pawn_legal_advance@1") {
      put(collectFoundationAdvanceSource({ beforeFen: "1r5k/8/8/p1p5/8/1P6/8/7K w - - 0 1", moveUci: "b3b4", afterFen: "1r5k/8/8/p1p5/1P6/8/8/7K b - - 0 1" }));
    } else put(collectFoundationSnapshotSource(ref as FoundationSnapshotSourceRef, START_FEN));
  }
  for (const kind of Object.keys(INSPECTOR_DETAIL_SOURCES) as InspectorDetailKind[]) {
    const original = found.get(INSPECTOR_DETAIL_SOURCES[kind])?.[0];
    if (original === undefined) throw new Error(`No genuine detail source for ${kind}`);
    put(collectInspectorDetailSource(original, `derived.inspector.detail.${kind}@1`, { kind: "whole" }, 0));
  }
  const expected = [...INSPECTOR_SOURCE_TOPICS.map(row => row.projection), ...Object.keys(INSPECTOR_DETAIL_SOURCES).map(kind => `derived.inspector.detail.${kind}@1`)];
  for (const route of expected) if (!(found.get(route)?.length)) throw new Error(`No genuine current Inspector fixture: ${route}`);
  return new Map(expected.map(route => [route, found.get(route)!]));
}
