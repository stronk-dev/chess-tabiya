// Actual current Full2 image and service sources only. No synthetic manifest, view or issuer.
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, branchPath, fork, rewind, commitMove, compileAssistanceRequest, moduleDecisionStamp, revealFeedback, serverAvailabilityFromProviders, type DrillRun } from "@chess-tabiya/runtime";
import { recordedSequenceWindowFixture } from "../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { STRUCTURAL_EVENT_FAMILIES } from "../../../packages/runtime/src/evidence-catalog.js";
import { recordedInspectorRun } from "../../../packages/runtime/src/testing/recorded-inspector-fixture.js";
import { recordedComparisonFixture } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { INSPECTOR_SOURCE_TOPICS, type InspectorQueryView, type InspectorSourceContext } from "../../../packages/runtime/src/inspector-query-contract.js";
import { INSPECTOR_DETAIL_SOURCES } from "../../../packages/runtime/src/inspector-detail.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { MODULE_CURRENT_IMAGE, PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { parsePresentationReceipt, presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import type { InspectorQueryPage } from "../../../packages/runtime/src/inspector-query-contract.js";
import { compileProjectionExecutionV2, executionPlanDigest } from "../../../packages/runtime/src/evidence-execution-v2.js";
import * as localSources from "../../../packages/runtime/src/inspector-local-source.js";
import * as recordedWindows from "../../../packages/runtime/src/recorded-semantic-window.js";
import { assertInspectorSourcePagePreflight } from "./inspector-query.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T23:30:00.000Z";
const owner = { learnerId: "independent-inspector-query-owner", handle: "independent-inspector-query-owner" };
const stranger = { learnerId: "independent-inspector-query-stranger", handle: "independent-inspector-query-stranger" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const assistance = (contextHint: "position" | "pack" = "position") => compileAssistanceRequest({ contextHint,
  preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
const expectedRoots = [...INSPECTOR_SOURCE_TOPICS.map(topic => topic.projection),
  ...Object.keys(INSPECTOR_DETAIL_SOURCES).map(kind => `derived.inspector.detail.${kind}@1`)];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
function fixture(revealed = true, reports = 0, inputRun: DrillRun = recordedInspectorRun()) {
  let initial = inputRun;
  for (let index = 0; index < reports; index++) initial = attachEvidence(initial, initial.activeCursor.nodeId, ["synthetic:independent-page"],
    { kind: "eval", source: "engine_validated", values: { centipawns: 20 } }, at).run;
  const run = revealed ? revealFeedback(initial, at).run : initial;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, stranger]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "independent-inspector-query-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage), controller = new AbortController();
  const acquisitions = [vi.spyOn(service, "acquireInspectorQuerySource"), vi.spyOn(service, "acquireInspectorLocalSource"),
    vi.spyOn(service, "acquireInspectorMaiaSource"), vi.spyOn(service, "acquireInspectorExplorerSource"), vi.spyOn(service, "acquireInspectorLedgerSource")];
  const request = (view: InspectorQueryView = { kind: "inventory", start: 0 }) => ({ protocol: "inspector.query_page@1", assistance: assistance(),
    query: { branchId: run.activeCursor.branchId, nodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(run).digest, view } });
  return { service, run, storage, lease, controller, acquisitions, request };
}
function page(value: InspectorQueryPage): Extract<InspectorQueryPage, { kind: "page" }> {
  expect(value.kind).toBe("page"); if (value.kind !== "page") throw new Error(`Expected actual page, received ${value.code}`);
  const { digest, ...receipt } = value.disclosure;
  expect(digest).toBe(presentationDigest("inspector.disclosure_receipt@1", receipt));
  expect(value.disclosure.decisionDigest).toBe(value.decision.digest);
  return value;
}

const currentStructuralRefs = [
  ...STRUCTURAL_EVENT_FAMILIES.filter(value => ["king_zone", "passed_pawn", "piece_count", "direct_attack_count"].includes(value)).map(family => `rules.structural.event.${family}@1`),
  "rules.structural.event.backward_pawn@2", "rules.structural.event.king_opposition@2", "rules.structural.event.pawn_islands@2",
  "derived.structural.event.pawn_file_group@1", "rules.transition.event.slider_ray@2", "derived.activity.event.file_state@1", "derived.activity.event.file_access_revealed@1",
] as localSources.InspectorLocalProjection[];

describe("independent current-image Inspector query boundary", () => {
  for (const projection of currentStructuralRefs) for (const black of [false, true]) {
    it(`D4060 retains original root, inherited and repeated ${projection} edges, mirrored=${black}`, async () => {
      const at = "2026-11-04T00:00:00.000Z";
      const original = recordedSequenceWindowFixture({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves: ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3"] }, black);
      const originalPath = branchPath(original, original.activeCursor.branchId);
      let initial = fork(rewind(original, originalPath[1]!.id, at).run, originalPath[1]!.id, { at }).run;
      for (const node of originalPath.slice(2)) initial = commitMove(initial, node.moveUci!, { at }).run;
      const f = fixture(true, 0, initial), path = branchPath(f.run, f.run.activeCursor.branchId), saved = JSON.stringify(f.storage.read(f.run.id));
      expect(path[1]!.branchId).not.toBe(f.run.activeCursor.branchId);
      expect(path[1]!.fen.split(" ")[0]).toBe(path[5]!.fen.split(" ")[0]); expect(path[1]!.fen).not.toBe(path[5]!.fen);
      const collector = vi.spyOn(localSources, "collectInspectorLocalEdge"), collectionKeys: string[] = [];
      for (const index of [0, 1, 5]) {
        const node = path[index]!, request = f.request({ kind: "source", projection, context: { kind: "incoming_edge" }, start: 0, collectionKey: null });
        request.query.branchId = f.run.activeCursor.branchId; request.query.nodeId = node.id;
        const calls = collector.mock.calls.length;
        const result = page(await f.service.queryInspectorSources(f.run.id, owner, request, availability, f.controller.signal));
        if (result.body.kind !== "source") throw Error("Expected actual structural source");
        if (index === 0) {
          expect(result.body.outcome).toEqual({ kind: "missing_context", reason: "no_incoming_edge" });
          expect(collector).toHaveBeenCalledTimes(calls); continue;
        }
        const edge = { beforeFen: path[index - 1]!.fen, moveUci: node.moveUci!, afterFen: node.fen };
        expect(collector.mock.calls.slice(calls)).toEqual([[projection, edge]]);
        const expected = collector.mock.results.at(-1)!.value as ReturnType<typeof localSources.collectInspectorLocalEdge>;
        const retained = f.service.readInspectorLocalSource(f.acquisitions[1]!.mock.results.at(-1)!.value);
        expect(retained.values).toBe(expected.values);
        expect(retained.semanticEvents).toBe(expected.semanticEvents);
        if (expected.semanticEvents !== null) {
          expected.semanticEvents.forEach((event, index) => expect(retained.values[index]).toBe(event.evidence));
          const current = f.service.readInspectorRecordedContext(retained.context);
          expect(retained.sourceKey).toBe(presentationDigest("inspector.source@1", {
            runId: current.run.id, decision: current.decision, selection: current.selection,
            viewer: { learnerId: current.principal.learnerId, role: current.role },
            requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
            projection, input: retained.input, values: expected.values.map(value => evidenceValueReceipt(value)),
            semanticEvents: expected.semanticEvents.map(event => ({ id: event.id, anchor: event.anchor, sign: event.sign })),
          }));
        }
        const outcome = result.body.outcome;
        if (expected.values.length === 0) expect(outcome).toEqual({ kind: "no_witness" });
        else {
          expect(outcome).toMatchObject({ kind: "available", collected: expected.values.length });
          if (outcome.kind !== "available") throw Error("Original population lost");
          expect(result.disclosure.sourceOrdinals).toEqual(Array.from({ length: outcome.range.count }, (_, i) => i));
          collectionKeys.push(result.disclosure.collectionKey!);
        }
      }
      if (collectionKeys.length === 2) expect(collectionKeys[0]).not.toBe(collectionKeys[1]);
      expect(JSON.stringify(f.storage.read(f.run.id))).toBe(saved);
      collector.mockRestore();
    });
  }
  it.each(currentStructuralRefs)("current %s refuses access/disclosure/cancel before collection and preserves source failure", async projection => {
    const initial = recordedSequenceWindowFixture({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves: ["g1f3"] });
    const f = fixture(true, 0, initial);
    const view = { kind: "source", projection, context: { kind: "incoming_edge" }, start: 0, collectionKey: null } as const;
    const collect = vi.spyOn(localSources, "collectInspectorLocalEdge");
    expect(await f.service.queryInspectorSources(f.run.id, stranger, f.request(view), availability, f.controller.signal)).toMatchObject({ kind: "refused", code: "not_found" });
    const silent = fixture(false);
    expect(await silent.service.queryInspectorSources(silent.run.id, owner, silent.request(view), availability, silent.controller.signal)).toMatchObject({ kind: "refused", code: "withheld" });
    const cancelled = new AbortController(); cancelled.abort(new Error("retired structural request"));
    await expect(f.service.queryInspectorSources(f.run.id, owner, f.request(view), availability, cancelled.signal)).rejects.toThrow("retired structural request");
    expect(collect).not.toHaveBeenCalled();
    collect.mockImplementationOnce(() => { throw new TypeError("original structural source failed"); });
    const result = page(await f.service.queryInspectorSources(f.run.id, owner, f.request(view), availability, f.controller.signal));
    expect(result.body).toMatchObject({ kind: "source", outcome: { kind: "failed", reason: "source_contract_invalid" } });
    expect(result.disclosure.sourceKeys).toEqual([]); expect(result.disclosure.componentDigests).toEqual([]);
    expect(collect).toHaveBeenCalledTimes(1);
  });
  it("retains the complete89-topic/fifteen-detail root image without duplicate or historical aliases", () => {
    expect(expectedRoots).toHaveLength(104); expect(new Set(expectedRoots).size).toBe(104);
  });

  it.each(expectedRoots)("compiles the actual complete source graph for %s without fake consumer bindings", projection => {
    const split = projection.lastIndexOf("@"), ref = { id: projection.slice(0, split), version: Number(projection.slice(split + 1)) };
    const original = PRIMARY_EVIDENCE_MANIFEST.projections.filter(candidate => candidate.id === ref.id && candidate.version === ref.version);
    expect(original).toHaveLength(1);
    const plan = compileProjectionExecutionV2(PRIMARY_EVIDENCE_MANIFEST, ref);
    expect(executionPlanDigest(plan)).toMatch(/^(?:sha256:)?[a-f0-9]{64}$/u);
  });

  it("preflights the real complete current104 image and exact operation", () => {
    const current = MODULE_CURRENT_IMAGE.find(row => row.moduleId === "full_inspector")!;
    expect(current.consumer).toEqual({ id: "module.full_inspector", version: 2 });
    expect(current.implementation).toBe("compileInspectorSourcePage");
    expect(current.accepts.map(ref => `${ref.id}@${ref.version}`)).toEqual(expectedRoots);
    expect(assertInspectorSourcePagePreflight).not.toThrow();
  });

  it.each(INSPECTOR_SOURCE_TOPICS)("executes the actual demanded $projection source without invented version holds or hidden sibling acquisition", async topic => {
    const base = recordedComparisonFixture(false, "independent-whole-inspector-demand"), f = fixture(true, 0, base.run);
    const kind = topic.contexts[0]!, nodeId = base.mainPath.at(-1)!.id;
    const context: InspectorSourceContext = kind === "branch" || kind === "recorded_review" ? { kind, throughNodeId: nodeId }
      : kind === "comparison" ? { kind, otherBranchId: base.peer, otherNodeId: base.peerPath.at(-1)!.id } : { kind };
    const projection = topic.projection;
    const view: InspectorQueryView = projection === "rules.tactic.consequence.forced_mate_after_move@1" || projection === "rules.tactic.consequence.forced_mate_after_move@2"
      ? { kind: "source", projection, context, start: 0, collectionKey: null, parameters: { kind: "forced_mate", maxAttackerMoves: 1 } }
      : { kind: "source", projection, context, start: 0, collectionKey: null };
    const request = f.request(view); request.query.branchId = base.main; request.query.nodeId = nodeId;
    const result = page(await f.service.queryInspectorSources(f.run.id, owner, request, availability, f.controller.signal));
    if (result.body.kind !== "source") throw new Error("Expected exactly requested source body");
    expect(result.body.projection).toBe(projection); expect(result.body.context).toEqual(context);
    expect(result.body.outcome.kind, JSON.stringify(result.body.outcome)).not.toBe("failed");
    if (result.body.outcome.kind === "unavailable") expect(result.body.outcome.reason).not.toBe("source_version_held");
    if (result.body.outcome.kind === "available") {
      expect(result.body.outcome.collected).toBeGreaterThan(0);
      expect(result.body.outcome.displayed + result.body.outcome.deferred).toBe(result.body.outcome.range.count);
      parsePresentationReceipt(JSON.parse(JSON.stringify(result.body.outcome.presentation)));
    }
    expect(f.acquisitions[0]).toHaveBeenCalledOnce();
    if (topic.family !== "maia") expect(f.acquisitions[2]).not.toHaveBeenCalled();
    if (topic.family !== "explorer") expect(f.acquisitions[3]).not.toHaveBeenCalled();
    if (projection !== "recorded.engine.eval@1" && projection !== "recorded.tablebase.result@1") expect(f.acquisitions[4]).not.toHaveBeenCalled();
  });

  it("enumerates all89 original topics in bounded inventory pages without acquiring anything", async () => {
    const f = fixture(), before = JSON.stringify(f.storage.read(f.run.id)), seen: string[] = [];
    for (let start = 0; start < INSPECTOR_SOURCE_TOPICS.length; start += 8) {
      const result = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "inventory", start }), availability, f.controller.signal));
      if (result.body.kind !== "inventory") throw new Error("Expected actual inventory");
      const { range, topics } = result.body;
      expect(range).toEqual({ start, count: Math.min(8, 89 - start), total: 89, next: start + 8 < 89 ? start + 8 : null });
      expect(topics.every(topic => topic.state === "not_requested")).toBe(true);
      seen.push(...topics.map(topic => topic.projection));
      expect(result.disclosure).toMatchObject({ range, sourceKeys: [], sourceOrdinals: [], componentDigests: [], sourceOutcome: null, recordedCoverage: null });
    }
    expect(seen).toEqual(INSPECTOR_SOURCE_TOPICS.map(topic => topic.projection));
    f.acquisitions.forEach(acquire => expect(acquire).not.toHaveBeenCalled());
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it("publishes an actual exact local page and registered receiver-readable presentation without provider acquisition", async () => {
    const f = fixture(), view = { kind: "source", projection: "rules.castling.reading.rights@1", context: { kind: "position" }, start: 0, collectionKey: null } as const;
    const result = page(await f.service.queryInspectorSources(f.run.id, owner, f.request(view), availability, f.controller.signal));
    if (result.body.kind !== "source" || result.body.outcome.kind !== "available") throw new Error("Expected complete available castling source");
    const outcome = result.body.outcome;
    expect(outcome).toMatchObject({ collected: 1, displayed: 1, deferred: 0, range: { start: 0, count: 1, total: 1, next: null } });
    expect(parsePresentationReceipt(JSON.parse(JSON.stringify(outcome.presentation)))).toHaveLength(outcome.presentation.items.length);
    expect(outcome.presentation.items.length).toBeGreaterThan(0);
    expect(result.disclosure.componentDigests).toEqual(outcome.presentation.items.map(item => item.componentDigest));
    expect(result.disclosure.sourceKeys).toEqual(outcome.facts.map(fact => fact.sourceKey));
    expect(result.disclosure.sourceOutcome).toEqual({ kind: "available" });
    expect(result.disclosure.recordedCoverage).toBeNull();
    f.acquisitions.slice(2).forEach(acquire => expect(acquire).not.toHaveBeenCalled());
  });

  it("retains every repeated original saved occurrence across source pages with distinct receipt keys", async () => {
    const f = fixture(true, 11), projection = "recorded.inspector.eval_packet@1" as const;
    const first = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "position" }, start: 0, collectionKey: null }), availability, f.controller.signal));
    if (first.body.kind !== "source" || first.body.outcome.kind !== "available") throw new Error("Expected saved source page");
    const a = first.body.outcome;
    expect(a).toMatchObject({ collected: 11, range: { start: 0, count: 8, total: 11, next: 8 } });
    const second = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "position" }, start: 8, collectionKey: a.collectionKey }), availability, f.controller.signal));
    if (second.body.kind !== "source" || second.body.outcome.kind !== "available") throw new Error("Expected source continuation");
    const b = second.body.outcome;
    expect(b).toMatchObject({ collected: 11, collectionKey: a.collectionKey, range: { start: 8, count: 3, total: 11, next: null } });
    expect(new Set([...a.facts, ...b.facts].map(fact => fact.sourceKey)).size).toBe(11);
    expect([...first.disclosure.sourceOrdinals, ...second.disclosure.sourceOrdinals]).toEqual(f.run.events.flatMap((event, ordinal) => event.type === "evidence.attached" ? [ordinal] : []));
    for (const outcome of [a, b]) expect(outcome.displayed + outcome.deferred).toBe(outcome.range.count);
    await expect(f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "position" }, start: 8, collectionKey: "foreign-source-collection" }), availability, f.controller.signal))
      .resolves.toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "stale" });
  });

  it("keeps genuine source absence fact-free and refuses a noninitial absent continuation", async () => {
    const f = fixture(), projection = "recorded.inspector.eval_packet@1" as const;
    const result = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "position" }, start: 0, collectionKey: null }), availability, f.controller.signal));
    expect(result.body).toMatchObject({ kind: "source", outcome: { kind: "unavailable", reason: "source_absent" }, recordedCoverage: null });
    expect(result.disclosure).toMatchObject({ range: null, collectionKey: null, sourceKeys: [], sourceOrdinals: [], componentDigests: [], sourceOutcome: { kind: "unavailable", reason: "source_absent" } });
    await expect(f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "position" }, start: 1, collectionKey: "previous-source" }), availability, f.controller.signal))
      .resolves.toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "stale" });
  });

  it("opens complete square-control detail from the actual original source occurrence and retains focused original ordinals", async () => {
    const f = fixture(), projection = "rules.square.reading.control@1" as const;
    const original = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "position" }, start: 0, collectionKey: null }), availability, f.controller.signal));
    if (original.body.kind !== "source" || original.body.outcome.kind !== "available") throw new Error("Expected complete control source");
    const fact = original.body.outcome.facts[0]!;
    expect(fact.detail).toBe("derived.inspector.detail.square_control@1");
    const whole = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "detail", projection, context: { kind: "position" }, sourceKey: fact.sourceKey, scope: { kind: "whole" }, start: 0 }), availability, f.controller.signal));
    if (whole.body.kind !== "detail") throw new Error("Expected genuine bounded control detail");
    expect(whole.body.range.count).toBeGreaterThan(0); expect(whole.body.range.count).toBeLessThanOrEqual(8);
    expect(whole.body.range.total).toBe(whole.body.fullSourceTotal);
    expect(whole.body.sourceOrdinals).toEqual(Array.from({ length: whole.body.range.count }, (_, index) => index));
    expect(whole.disclosure.sourceKeys).toEqual([fact.sourceKey]);
    expect(whole.disclosure.sourceOrdinals).toEqual(whole.body.sourceOrdinals);
    expect(whole.disclosure.detailProjection).toBe("derived.inspector.detail.square_control@1");
    expect(parsePresentationReceipt(JSON.parse(JSON.stringify(whole.body.presentation)))).toHaveLength(whole.body.presentation.items.length);
    const focus = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "detail", projection, context: { kind: "position" }, sourceKey: fact.sourceKey,
      scope: { kind: "control_target", color: "white", mode: "geometric", target: "e4" }, start: 0 }), availability, f.controller.signal));
    if (focus.body.kind !== "detail") throw new Error("Expected genuine focused detail");
    expect(focus.body.fullSourceTotal).toBe(whole.body.fullSourceTotal);
    expect(focus.body.range.total).toBeGreaterThan(0); expect(focus.body.range.total).toBeLessThan(whole.body.range.total);
    expect(focus.body.sourceOrdinals[0]).toBeGreaterThan(0);
    expect(focus.disclosure.sourceOrdinals).toEqual(focus.body.sourceOrdinals);
    await expect(f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "detail", projection, context: { kind: "position" }, sourceKey: "foreign-source-key", scope: { kind: "whole" }, start: 0 }), availability, f.controller.signal))
      .resolves.toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "stale" });
  });

  it("reports an actual collector exception fact-free while keeping failed continuations stale", async () => {
    const f = fixture(), projection = "rules.castling.reading.rights@1" as const;
    const collect = vi.spyOn(localSources, "collectInspectorLocalPosition").mockImplementation(() => { throw new TypeError("PRIVATE SYNTHETIC SOURCE DIAGNOSTIC"); });
    const result = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "position" }, start: 0, collectionKey: null }), availability, f.controller.signal));
    expect(collect).toHaveBeenCalled();
    expect(result.body).toMatchObject({ kind: "source", outcome: { kind: "failed", reason: "source_contract_invalid" }, recordedCoverage: null });
    expect(result.disclosure).toMatchObject({ range: null, collectionKey: null, sourceKeys: [], sourceOrdinals: [], componentDigests: [],
      sourceOutcome: { kind: "failed", reason: "source_contract_invalid" } });
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    await expect(f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "position" }, start: 1, collectionKey: "retained-previous-source" }), availability, f.controller.signal))
      .resolves.toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "stale" });
  });

  it("refuses real grant revocation during actual source collection instead of publishing or masking it as source failure", async () => {
    const f = fixture(), projection = "rules.castling.reading.rights@1" as const;
    f.storage.grantRole(f.run.id, stranger.learnerId, "host", f.lease, at);
    const original = localSources.collectInspectorLocalPosition;
    const collect = vi.spyOn(localSources, "collectInspectorLocalPosition").mockImplementationOnce((ref, fen) => {
      const result = original(ref, fen); f.storage.revokeGrant(f.run.id, stranger.learnerId, f.lease); return result;
    });
    await expect(f.service.queryInspectorSources(f.run.id, stranger, f.request({ kind: "source", projection, context: { kind: "position" }, start: 0, collectionKey: null }), availability, f.controller.signal))
      .resolves.toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "not_found" });
    expect(collect).toHaveBeenCalledOnce();
  });

  it.each(["unregistered-private-owner", "runtime-opening-identity", "semantic-convention-provenance"])("fails an injected %s version hold over a genuinely working source without leaking dependency metadata", async dependency => {
    const base = recordedComparisonFixture(false, "independent-injected-source-hold"), f = fixture(true, 0, base.run);
    const original = recordedWindows.recordedSemanticWindowSource;
    const collect = vi.spyOn(recordedWindows, "recordedSemanticWindowSource").mockImplementationOnce(input => {
      const genuine = original(input);
      expect(genuine.kind).toBe("window_available"); // Actual complete source succeeds before fault injection.
      return Object.freeze({ kind: "window_refused", reason: "source_version_held", dependency });
    });
    const view = { kind: "source", projection: "derived.pawn.sequence.harassment_pressure@3", context: { kind: "recorded_window" }, start: 0, collectionKey: null } as const;
    const request = f.request(view); request.query.branchId = base.main; request.query.nodeId = base.mainPath.at(-1)!.id;
    const result = page(await f.service.queryInspectorSources(f.run.id, owner, request, availability, f.controller.signal));
    expect(collect).toHaveBeenCalledOnce();
    expect(result.body).toMatchObject({ kind: "source", outcome: { kind: "failed", reason: "source_contract_invalid" }, recordedCoverage: null });
    expect(result.disclosure).toMatchObject({ range: null, collectionKey: null, sourceKeys: [], sourceOrdinals: [], componentDigests: [],
      sourceOutcome: { kind: "failed", reason: "source_contract_invalid" } });
    expect(JSON.stringify(result)).not.toContain(dependency);
  });

  it("returns closed withheld for an actual unrevealed owned line, rather than leaking a service exception", async () => {
    const f = fixture(false);
    await expect(f.service.queryInspectorSources(f.run.id, owner, f.request(), availability, f.controller.signal))
      .resolves.toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "withheld" });
    f.acquisitions.forEach(acquire => expect(acquire).not.toHaveBeenCalled());
  });

  it("returns a closed refusal for a non-existent requested branch before any source acquisition", async () => {
    const f = fixture(), request = f.request(); request.query.branchId = "absent-recorded-branch";
    await expect(f.service.queryInspectorSources(f.run.id, owner, request, availability, f.controller.signal))
      .resolves.toMatchObject({ protocol: "inspector.query_page@1", kind: "refused" });
    f.acquisitions.forEach(acquire => expect(acquire).not.toHaveBeenCalled());
  });

  it("returns closed invalid_request for genuine assistance intent compiled for the wrong actual run context", async () => {
    const f = fixture(), request = { ...f.request(), assistance: assistance("pack") };
    await expect(f.service.queryInspectorSources(f.run.id, owner, request, availability, f.controller.signal))
      .resolves.toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "invalid_request" });
    f.acquisitions.forEach(acquire => expect(acquire).not.toHaveBeenCalled());
  });

  it("does not disclose version availability to a real account without access to the run", async () => {
    const f = fixture();
    await expect(f.service.queryInspectorSources(f.run.id, stranger, f.request(), availability, f.controller.signal))
      .resolves.toEqual({ protocol: "inspector.query_page@1", kind: "refused", code: "not_found" });
    f.acquisitions.forEach(acquire => expect(acquire).not.toHaveBeenCalled());
  });

  it("propagates actual cancellation rather than converting it to source absence or a successful refusal", async () => {
    const f = fixture(); f.controller.abort(new Error("cancelled actual Inspector request"));
    await expect(f.service.queryInspectorSources(f.run.id, owner, f.request(), availability, f.controller.signal)).rejects.toThrow("cancelled actual Inspector request");
    f.acquisitions.forEach(acquire => expect(acquire).not.toHaveBeenCalled());
  });
});


describe("current semantic source retention in the actual Inspector owner", () => {
  const cases = [
    ["rules.structural.event.king_opposition@2", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7"],
    ["rules.structural.event.backward_pawn@2", "7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
    ["derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/8/PP1P4/7K w - - 0 1", "a2a3"],
    ["rules.transition.event.slider_ray@2", "4k3/8/8/8/8/8/B7/R3K3 w - - 0 1", "a2b3"],
    ["derived.activity.event.file_state@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
    ["derived.activity.event.file_access_revealed@1", "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"],
    ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
  ] as const;
  for (const [projection, fen, move] of cases) for (const black of [false, true]) {
    it(`${projection} retains original nonempty events in the application source, mirrored=${black}`, async () => {
      const f = fixture(true, 0, recordedSequenceWindowFixture({ fen, moves: [move] }, black, `semantic-source-${projection}-${black}`));
      const result = page(await f.service.queryInspectorSources(f.run.id, owner, f.request({ kind: "source", projection, context: { kind: "incoming_edge" }, start: 0, collectionKey: null }), availability, f.controller.signal));
      if (result.body.kind !== "source") throw Error("An actual source page is required");
      expect(result.body.outcome.kind).toBe("available");
      const token = f.acquisitions[1]!.mock.results.at(-1)!.value;
      const source = f.service.readInspectorLocalSource(token);
      expect(source.semanticEvents).not.toBeNull(); expect(source.semanticEvents!.length).toBeGreaterThan(0);
      expect(source.values.length).toBe(source.semanticEvents!.length);
      source.semanticEvents!.forEach((event, index) => {
        expect(source.values[index]).toBe(event.evidence);
        expect(`${event.projection.id}@${event.projection.version}`).toBe(projection);
        expect(event.anchor).toMatchObject(source.input!);
      });
      expect(source.sourceKey).not.toBeNull();
      expect(Object.isFrozen(source)).toBe(true); expect(Object.isFrozen(source.values)).toBe(true); expect(Object.isFrozen(source.semanticEvents)).toBe(true);
      expect(Reflect.set(source.values, "0", source.values[0])).toBe(false);
      expect(Reflect.set(source.semanticEvents!, "length", 0)).toBe(false);
      expect(() => f.service.readInspectorLocalSource({ ...token })).toThrow();
      f.controller.abort();
      expect(() => f.service.readInspectorLocalSource(token)).toThrow();
    });
  }
});
