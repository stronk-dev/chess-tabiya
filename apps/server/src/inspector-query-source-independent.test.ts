// Independent production-boundary controls. Synthetic stored measurements test source
// delivery, not engine quality, chess significance, permission issuance or Full2 completion.
import { afterEach, describe, expect, it, vi } from "vitest";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { appendOpponentPly, attachEvidence, branchPath, commitMove, compileAssistanceRequest, createRun,
  fork, moduleDecisionStamp, reachCheckpoint, revealFeedback, rewind, serverAvailabilityFromProviders,
  type DrillRun, type OpponentSelection } from "@chess-tabiya/runtime";
import { recordedInspectorRun } from "../../../packages/runtime/src/testing/recorded-inspector-fixture.js";
import { humanObservationRun, recordHumanObservation, splitCandidates } from "../../../packages/runtime/src/testing/recorded-human-divergence-fixture.js";
import type { InspectorSourceContext } from "../../../packages/runtime/src/inspector-query-contract.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry } from "./pack-registry.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T18:00:00.000Z";
const owner = { learnerId: "query-source-owner", handle: "query-source-owner" };
const host = { learnerId: "query-source-host", handle: "query-source-host" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

function saved(input: DrillRun, registry?: PackRegistry) {
  const run = input.feedbackPolicy === "attempt_end" ? revealFeedback(input, at).run : input;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, host]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "query-source-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage, registry === undefined ? {} : { packRegistry: registry }), controller = new AbortController();
  const requested = compileAssistanceRequest({ contextHint: run.sessionKind, preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  function context(scope: InspectorSourceContext = { kind: "position" }, nodeId = run.activeCursor.nodeId, principal = owner) {
    return service.resolveInspectorRecordedContext(run.id, principal, requested, availability,
      { branchId: run.activeCursor.branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest, context: scope }, controller.signal);
  }
  return { run, storage, lease, service, controller, context };
}

async function ledgerFixture(state: "mixed" | "refused" | "abstained" | "zero" | "missing" = "mixed") {
  const fen = "4k3/7p/8/8/8/8/P7/4K3 w - - 0 1";
  const document = withDerivedRequires({ id: "independent-query-measurement", version: "1.0.0", title: "Synthetic source composition",
    mode: "outcome", phase: "endgame", start: { fen, side: "white" },
    objective: { type: "hold", summary: "Synthetic source delivery, not chess content", grading: {
      assessedBy: { kind: "authored", note: "Synthetic only" }, resolveAt: { kind: "checkpoint", checkpointId: "done" } }, successConditions: [] },
    checkpoints: [{ id: "done", trigger: { atStart: true }, actions: [] }], opponentPolicy: { mode: "human_common" }, feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "schema_example", sources: [] } });
  const digest = await digestDrillPack(document);
  const record = { kind: "engine_eval", anchor: { fen }, sourceId: "measurement", retrievedAt: at, grounds: "machine_validation", supports: [],
    values: { fen, centipawns: 20, depth: 8, multiPv: 1, perspective: "white", engineId: "fixture", engineName: "Synthetic fixture", engineVersion: "fixture" } };
  const records = [structuredClone(record), { ...structuredClone(record), sourceId: "text", grounds: "citable_source" }, structuredClone(record)];
  if (state === "refused") for (const row of records) row.grounds = "citable_source";
  if (state === "abstained" || state === "zero") for (const row of records) row.kind = "citable_text";
  const ledger = { schema: "tabiya.sourcing.evidence.v1", packId: document.id, packVersion: document.version, packDigest: digest, sourcedAt: at, records,
    abstentions: [{ kind: state === "zero" || state === "refused" ? "tablebase_result" : "engine_eval", anchor: { fen }, sourceId: "text", retrievedAt: at, reason: "source_unavailable", detail: "Synthetic abstention" }] };
  const licence = { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null };
  const manifest = { schema: "tabiya.sourcing.manifest.v1", entries: [
    { sourceId: "text", retrievedAt: at, licence, origin: { kind: "local-file", path: "synthetic.txt", sha256: digest, bytes: 1 } },
    { sourceId: "measurement", retrievedAt: at, licence, origin: { kind: "engine", engineId: "fixture", engineName: "Synthetic fixture", engineVersion: "fixture",
      profile: { threads: 1, hashMb: 16, multiPv: 1 }, budget: { depth: 8 }, fen, evidenceKind: "engine_eval" } },
  ] };
  const registry = await PackRegistry.fromDocuments([{ source: "synthetic", value: document, ...(state === "missing" ? {} : { ledger, manifest }) }]);
  const run = reachCheckpoint(createRun({ id: "independent-query-ledger", session: { kind: "pack", packId: document.id, packDigest: digest,
    start: { fen, side: "white" }, feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }), "done", at).run;
  return { ...saved(run, registry), registry, document, digest };
}

const ledgerView = { kind: "source", projection: "recorded.engine.eval@1", context: { kind: "position" }, start: 0, collectionKey: null } as const;
const packetView = { kind: "source", projection: "recorded.inspector.eval_packet@1", context: { kind: "position" }, start: 0, collectionKey: null } as const;

describe("independent actual Inspector source composition", () => {
  it("preserves admitted ledger multiplicity and sparse original ordinals beside refused rows and abstentions", async () => {
    const f = await ledgerFixture(), reader = vi.spyOn(f.service, "readInspectorLedgerSource");
    const source = await f.service.acquireInspectorQuerySource(f.context(), ledgerView, f.controller.signal);
    const data = source.read(), original = reader.mock.results.at(-1)!.value;
    expect(data.outcome).toEqual({ kind: "available", collected: 2 });
    expect(data.occurrences.map(row => row.sourceOrdinal)).toEqual([0, 2]);
    expect(original.population!.readings).toHaveLength(2);
    data.occurrences.forEach((row, index) => expect(row.evidence).toBe(original.population!.readings[index]));
    expect(data.recordedCoverage).toEqual({ sourceKey: data.sourceKey, matchedRecords: 3, admittedRecords: 2, notAdmittedRecords: 1,
      abstentions: { out_of_range: 0, source_unavailable: 1, no_data_at_band: 0, licence_withheld: 0 } });
    expect(source.read()).toEqual(data);
    expect(f.storage.read(f.run.id)!.run).toEqual(f.run);
  });

  it.each(["refused", "abstained", "zero", "missing"] as const)("retains truthful %s ledger coverage instead of converting all zero-admission states to no_witness", async state => {
    const f = await ledgerFixture(state), source = await f.service.acquireInspectorQuerySource(f.context(), ledgerView, f.controller.signal), data = source.read();
    expect(data.occurrences).toEqual([]);
    if (state === "missing") {
      expect(data.outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
      expect(data.recordedCoverage).toBeNull(); expect(data.sourceKey).toBeNull();
    } else {
      expect(data.outcome).toEqual(state === "zero" ? { kind: "no_witness" } : { kind: "unavailable", reason: "recorded_measurement_unavailable" });
      expect(data.recordedCoverage).toEqual({ sourceKey: data.sourceKey, matchedRecords: state === "refused" ? 3 : 0, admittedRecords: 0, notAdmittedRecords: state === "refused" ? 3 : 0,
        abstentions: { out_of_range: 0, source_unavailable: state === "abstained" ? 1 : 0, no_data_at_band: 0, licence_withheld: 0 } });
      expect(data.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
    }
  });

  it.each(["mixed", "refused", "abstained", "zero", "missing"] as const)("publishes the real Full2 %s ledger outcome and complete coverage without exposing private records", async state => {
    const f = await ledgerFixture(state), context = f.context();
    const original = (await f.service.acquireInspectorQuerySource(context, ledgerView, f.controller.signal)).read();
    const assistance = compileAssistanceRequest({ contextHint: "pack", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
    const result = await f.service.queryInspectorSources(f.run.id, owner, { protocol: "inspector.query_page@1", assistance,
      query: { branchId: f.run.activeCursor.branchId, nodeId: f.run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(f.run).digest, view: ledgerView } }, availability, f.controller.signal);
    expect(result.kind).toBe("page"); if (result.kind !== "page" || result.body.kind !== "source") throw new Error("Expected actual Full2 ledger source page");
    expect(result.body.recordedCoverage).toEqual(original.recordedCoverage);
    expect(result.disclosure.recordedCoverage).toEqual(original.recordedCoverage);
    if (state === "mixed") {
      expect(result.body.outcome).toMatchObject({ kind: "available", collected: 2, range: { start: 0, count: 2, total: 2, next: null } });
      expect(result.disclosure.sourceOrdinals).toEqual([0, 2]);
      if (result.body.outcome.kind !== "available") throw new Error("Expected actual mixed page");
      expect(new Set(result.body.outcome.facts.map(fact => fact.sourceKey)).size).toBe(2);
    } else {
      expect(result.body.outcome).toEqual(original.outcome);
      expect(result.disclosure).toMatchObject({ range: null, collectionKey: null, sourceKeys: [], sourceOrdinals: [], componentDigests: [] });
    }
    expect(Object.keys(result.body).sort()).toEqual(["context", "kind", "outcome", "projection", "recordedCoverage"]);
    expect(JSON.stringify(result)).not.toContain("Synthetic abstention");
    expect(JSON.stringify(result)).not.toContain("synthetic.txt");
  });

  it("retains repeated saved packets in original event-stream order rather than payload or filtered-index identities", async () => {
    let run = recordedInspectorRun(), nodeId = run.activeCursor.nodeId;
    const report = { kind: "eval", source: "engine_validated", values: { centipawns: -31 } } as const;
    run = attachEvidence(run, nodeId, ["synthetic:first"], report, at).run;
    run = attachEvidence(run, nodeId, ["synthetic:intervening"], { kind: "wdl", source: "engine_validated", values: { win: 100, draw: 400, loss: 500 } }, at).run;
    run = attachEvidence(run, nodeId, ["synthetic:repeat"], report, at).run;
    run = commitMove(run, "e2e4", { at }).run;
    const f = saved(run), reader = vi.spyOn(f.service, "readInspectorPacketSource");
    const source = await f.service.acquireInspectorQuerySource(f.context({ kind: "position" }, nodeId), packetView, f.controller.signal);
    const data = source.read(), original = reader.mock.results.at(-1)!.value;
    const ordinals = f.run.events.flatMap((event, ordinal) => event.type === "evidence.attached" && event.data.payload.kind === "eval" ? [ordinal] : []);
    expect(ordinals).toHaveLength(2); expect(ordinals[1]! - ordinals[0]!).toBeGreaterThan(1);
    expect(data.occurrences.map(row => row.sourceOrdinal)).toEqual(ordinals);
    expect(data.outcome).toEqual({ kind: "available", collected: 2 }); expect(data.recordedCoverage).toBeNull();
    data.occurrences.forEach((row, index) => expect(row.evidence).toBe(original.collection.occurrences[index]!.value));
  });

  it("keeps a missing incoming edge separate from a successful empty edge collection", async () => {
    const f = saved(commitMove(recordedInspectorRun(), "e2e4", { at }).run), root = branchPath(f.run, f.run.activeCursor.branchId)[0]!.id;
    const view = { kind: "source", projection: "rules.tactic.event.defender_removed@1", context: { kind: "incoming_edge" }, start: 0, collectionKey: null } as const;
    const missing = (await f.service.acquireInspectorQuerySource(f.context(view.context, root), view, f.controller.signal)).read();
    const empty = (await f.service.acquireInspectorQuerySource(f.context(view.context), view, f.controller.signal)).read();
    expect(missing).toMatchObject({ sourceKey: null, outcome: { kind: "missing_context", reason: "no_incoming_edge" }, occurrences: [], recordedCoverage: null });
    expect(empty).toMatchObject({ outcome: { kind: "no_witness" }, occurrences: [], recordedCoverage: null });
    expect(empty.sourceKey).not.toBeNull();
  });

  it.each(["retire", "revoke", "cancel", "advance"] as const)("rechecks actual retained %s state rather than serving a flattened ledger snapshot", async change => {
    const f = await ledgerFixture(); f.storage.grantRole(f.run.id, host.learnerId, "host", f.lease, at);
    const signal = new AbortController(), context = f.context({ kind: "position" }, f.run.activeCursor.nodeId, host);
    const source = await f.service.acquireInspectorQuerySource(context, ledgerView, signal.signal);
    expect(source.read().outcome.kind).toBe("available");
    if (change === "retire") f.registry.addPlaytest(f.registry.required(f.document.id).document, f.digest);
    else if (change === "revoke") f.storage.revokeGrant(f.run.id, host.learnerId, f.lease);
    else if (change === "cancel") signal.abort();
    else f.storage.save(commitMove(f.run, "e1d1", { at }).run, f.lease);
    expect(() => source.read()).toThrow();
    if (change === "cancel") expect(() => f.service.readInspectorRecordedContext(context)).not.toThrow();
  });

  it("keeps mixed historical human evidence unavailable rather than publishing its valid subset as a complete topic", async () => {
    function played(run: DrillRun, candidates: OpponentSelection["candidates"]) {
      const event = recordHumanObservation(run, candidates).events.at(-1)!;
      if (event.type !== "opponent.move_selected") throw new Error("Expected actual synthetic selection event");
      return appendOpponentPly(run, event.data.selection, { at }).run;
    }
    let run = played(humanObservationRun(false, 1450), splitCandidates()), root = run.nodes[0]!.id;
    run = fork(rewind(run, root, at, undefined, run.activeCursor.branchId).run, root, { at }).run;
    run = played(run, undefined);
    const f = saved(run), scope = { kind: "branch", throughNodeId: f.run.activeCursor.nodeId } as const;
    const view = { kind: "source", projection: "derived.pivotal.human_divergence@2", context: scope, start: 0, collectionKey: null } as const;
    const data = (await f.service.acquireInspectorQuerySource(f.context(scope), view, f.controller.signal)).read();
    expect(data.outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
    expect(data.occurrences).toHaveLength(1); // Private original witness remains; no available source claim.
    expect(data.recordedCoverage).toBeNull();
  });

  it.each([false, true])("normalizes actual Maia absence without leaking private supplier disclosure, terminal=%s", async terminal => {
    const run = terminal ? commitMove(createRun({ id: "query-source-ended", session: { kind: "position", start: {
      fen: "7k/5Q2/5K2/8/8/8/8/8 w - - 0 1", side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }), "f7g7", { at }).run
      : recordedInspectorRun();
    const f = saved(run), reader = vi.spyOn(f.service, "readInspectorMaiaSource");
    const view = { kind: "source", projection: "derived.maia.node_candidate_wdl@1", context: { kind: "position" }, start: 0, collectionKey: null } as const;
    const data = (await f.service.acquireInspectorQuerySource(f.context(), view, f.controller.signal)).read();
    expect(data).toMatchObject({ sourceKey: null, occurrences: [], recordedCoverage: null });
    expect(data.outcome).toEqual({ kind: "unavailable", reason: terminal ? "source_absent" : "provider_unavailable" });
    if (terminal) expect(reader.mock.results.at(-1)!.value.outcome).toHaveProperty("disclosure");
    expect(Object.keys(data.outcome).sort()).toEqual(["kind", "reason"]);
    expect(JSON.stringify(data.outcome)).not.toContain("model window");
  });

  it("acquires only the selected actual local source, without eager ledger/model/population/review work", async () => {
    const f = saved(recordedInspectorRun());
    const otherAcquisitions = [vi.spyOn(f.service, "acquireInspectorLedgerSource"), vi.spyOn(f.service, "acquireInspectorMaiaSource"),
      vi.spyOn(f.service, "acquireInspectorExplorerSource"), vi.spyOn(f.service, "acquireInspectorStorySource"), vi.spyOn(f.service, "acquireInspectorComparisonSource")];
    const view = { kind: "source", projection: "rules.square.reading.control@1", context: { kind: "position" }, start: 0, collectionKey: null } as const;
    const data = (await f.service.acquireInspectorQuerySource(f.context(), view, f.controller.signal)).read();
    expect(data.outcome).toEqual({ kind: "available", collected: 1 });
    expect(data.occurrences[0]!.evidence.projection).toEqual({ id: "rules.square.reading.control", version: 1 });
    otherAcquisitions.forEach(acquire => expect(acquire).not.toHaveBeenCalled());
  });

  it("refuses mismatched source scope and foreign context before any real ledger acquisition", async () => {
    const f = await ledgerFixture(), collect = vi.spyOn(f.registry, "collectRecordedMeasurements");
    const branch = { kind: "branch", throughNodeId: f.run.activeCursor.nodeId } as const;
    await expect(f.service.acquireInspectorQuerySource(f.context(branch), ledgerView, f.controller.signal)).rejects.toThrow();
    await expect(new RunService(f.storage, { packRegistry: f.registry }).acquireInspectorQuerySource(f.context(), ledgerView, f.controller.signal)).rejects.toThrow();
    expect(collect).not.toHaveBeenCalled();
  });
});
