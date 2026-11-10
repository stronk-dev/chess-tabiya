// Stored synthetic reports test occurrence delivery, not real engine/tablebase qualification.
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, branchPath, commitMove, compileAssistanceRequest, fork, moduleDecisionStamp, revealFeedback, rewind, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import { recordedInspectorRun } from "../../../packages/runtime/src/testing/recorded-inspector-fixture.js";
import * as packets from "../../../packages/runtime/src/inspector-packet-source.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import type { EvidencePayload } from "../../../packages/runtime/src/types.js";
import type { InspectorPacketSource } from "./inspector-packet-source.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T18:00:00.000Z", owner = { learnerId: "packet-owner", handle: "packet-owner" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const reports: readonly EvidencePayload[] = [
  { kind: "eval", source: "engine_validated", values: { centipawns: -31, identity: "synthetic-saved-report" } },
  { kind: "wdl", source: "engine_validated", values: { win: 100, draw: 400, loss: 500 } },
  { kind: "bestline", source: "engine_validated", values: { movesUci: ["e2e4", "e7e5"] } },
  { kind: "tablebase", source: "tablebase_exact", values: { category: "cursed-win", dtz: -7, preciseDtz: null, dtm: 15 } },
];
const kindFor = (route: packets.InspectorPacketProjection): EvidencePayload["kind"] => route.includes("tablebase") ? "tablebase" : route.includes("eval") ? "eval" : route.includes("wdl") ? "wdl" : "bestline";
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
function fixture(black = false, payloads = reports) {
  let run = recordedInspectorRun();
  if (black) run = commitMove(run, "e2e4", { at }).run;
  const selected = branchPath(run, run.activeCursor.branchId).at(-1)!;
  for (const payload of payloads) run = attachEvidence(run, selected.id, ["synthetic:saved-inspector"], payload, at).run;
  for (const move of black ? ["e7e5", "g1f3"] : ["e2e4", "e7e5"]) run = commitMove(run, move, { at }).run;
  run = revealFeedback(run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "packet-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage), controller = new AbortController();
  const context = (nodeId = selected.id, kind: "position" | "incoming_edge" = "position") => service.resolveInspectorRecordedContext(run.id, owner, requested, availability,
    { branchId: run.activeCursor.branchId, nodeId, decisionDigest: moduleDecisionStamp(run).digest, context: { kind } }, controller.signal);
  const acquire = (projection: packets.InspectorPacketProjection, token = context()) => service.readInspectorPacketSource(service.acquireInspectorPacketSource(token, projection, controller.signal));
  return { run, selected, storage, service, lease, controller, context, acquire };
}

describe("saved Inspector packets through actual current RunService/SQLite grants", () => {
  it.each(packets.INSPECTOR_PACKET_PROJECTIONS.flatMap(projection => [false, true].map(black => ({ projection, black }))))("supplies exact $projection without upgrading authority, selected black=$black", ({ projection, black }) => {
    const f = fixture(black), saved = JSON.stringify(f.storage.read(f.run.id));
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), source = f.acquire(projection), row = source.collection.occurrences[0]!;
    expect(source.outcome).toEqual({ kind: "available", collected: 1 });
    expect(row.source.payload).toMatchObject({ authority: "recorded_report_only",
      subject: { kind: "run_node", runId: f.run.id, nodeId: f.selected.id, fen: f.selected.fen },
      event: { type: "evidence.attached", data: { payload: reports.find(report => report.kind === kindFor(projection)) } } });
    expect(dispatch.mock.calls.map(call => call[0])).toEqual(projection.startsWith("derived.") ? ["recorded.inspector.tablebase_packet@1", projection] : [projection]);
    expect(row.source).toBe(dispatch.mock.results[0]!.value); expect(row.value).toBe(dispatch.mock.results.at(-1)!.value);
    expect(f.acquire(projection).sourceKey).toBe(source.sourceKey);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(saved);
  });

  it.each(["derived.inspector.tablebase_category@1", "derived.inspector.tablebase_distance@1"] as const)("refuses a genuine foreign packet before deriving %s", projection => {
    const own = fixture(), foreign = fixture(true), other = foreign.acquire("recorded.inspector.tablebase_packet@1").collection.occurrences[0]!.source;
    const original = routes.invokeEvidenceValueRoute;
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: unknown) => {
      if (route === "recorded.inspector.tablebase_packet@1") return other;
      return original(route as never, input as never);
    }) as typeof routes.invokeEvidenceValueRoute);
    expect(own.acquire(projection).outcome).toEqual({ kind: "failed", reason: "source_contract_invalid" });
    expect(dispatch.mock.calls.map(call => call[0])).toEqual(["recorded.inspector.tablebase_packet@1"]);
  });

  it.each(["node", "head", "projection"] as const)("rejoins a genuine foreign %s collection to the current grant before publishing", kind => {
    const f = fixture(), changed: readonly EvidencePayload[] = [{ ...reports[0]!, values: { centipawns: 99 } }, ...reports.slice(1)];
    const other = kind === "node" ? fixture(true).acquire("recorded.inspector.eval_packet@1").collection
      : kind === "head" ? fixture(false, changed).acquire("recorded.inspector.eval_packet@1").collection : fixture().acquire("recorded.inspector.wdl_packet@1").collection;
    const collect = vi.spyOn(packets, "collectInspectorRecordedPackets").mockReturnValueOnce(other);
    expect(() => f.acquire("recorded.inspector.eval_packet@1")).toThrow(expect.objectContaining({ reason: "source_contract_invalid" }));
    expect(collect).toHaveBeenCalledTimes(1);
  });

  it.each(packets.INSPECTOR_PACKET_PROJECTIONS)("retains complete duplicate %s occurrences and original event ordinals without sampling unrelated/model reports", projection => {
    const payload = reports.find(report => report.kind === kindFor(projection))!, other = reports.find(report => report.kind !== payload.kind)!;
    const f = fixture(false, [payload, other, { ...payload, source: "human_model_predicted" }, payload]);
    const source = f.acquire(projection), rows = source.collection.occurrences;
    expect(source.outcome).toEqual({ kind: "available", collected: 2 }); expect(rows).toHaveLength(2);
    expect(rows.map(row => row.ordinal)).toEqual(f.run.events.flatMap((event, index) => event.type === "evidence.attached"
      && event.data.nodeId === f.selected.id && event.data.payload.kind === payload.kind && event.data.payload.source !== "human_model_predicted" ? [index] : []));
    expect(rows[0]!.ordinal).toBeLessThan(rows[1]!.ordinal); expect(rows[0]!.itemDigest).not.toBe(rows[1]!.itemDigest);
    expect(rows.map(row => row.eventSeq)).toEqual(rows.map(row => row.ordinal + 1));
    expect(rows[0]!.source.payload.event.data.payload).toEqual(rows[1]!.source.payload.event.data.payload);
    expect(Object.isFrozen(source.collection.occurrences)).toBe(true); expect(rows.every(Object.isFrozen)).toBe(true);
  });

  it.each(packets.INSPECTOR_PACKET_PROJECTIONS)("does not invent %s when only a model-labelled packet or another-node report exists", projection => {
    const payload = reports.find(report => report.kind === kindFor(projection))!, f = fixture(false, [{ ...payload, source: "human_model_predicted" }]);
    const current = f.storage.read(f.run.id)!, changed = attachEvidence(current.run, current.run.activeCursor.nodeId, ["synthetic:other-node"], payload, at).run;
    f.storage.save(changed, f.lease);
    const context = f.service.resolveInspectorRecordedContext(changed.id, owner, requested, availability,
      { branchId: changed.activeCursor.branchId, nodeId: f.selected.id, decisionDigest: moduleDecisionStamp(changed).digest, context: { kind: "position" } }, f.controller.signal);
    const dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute"), image = f.acquire(projection, context);
    expect(image.outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
    expect(image.collection.occurrences).toEqual([]); expect(image.sourceKey).toBeNull(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each([
    [{}, { category: { kind: "not_recorded" }, dtz: { kind: "not_recorded" }, preciseDtz: { kind: "not_recorded" }, dtm: { kind: "not_recorded" } }],
    [{ category: "made-up", dtz: "7", preciseDtz: 0.5, dtm: Number.MAX_SAFE_INTEGER + 1 }, { category: { kind: "uninterpretable" }, dtz: { kind: "uninterpretable" }, preciseDtz: { kind: "uninterpretable" }, dtm: { kind: "uninterpretable" } }],
    [{ category: "cursed-win", dtz: -7, preciseDtz: null, dtm: 0 }, { category: { kind: "reported", value: "cursed-win" }, dtz: { kind: "reported", value: -7 }, preciseDtz: { kind: "reported", value: null }, dtm: { kind: "reported", value: 0 } }],
  ] as const)("retains reported/absent/uninterpretable tablebase fields: %j", (values, fields) => {
    const f = fixture(false, [{ kind: "tablebase", source: "tablebase_exact", values }]), image = f.acquire("derived.inspector.tablebase_distance@1");
    expect(image.outcome.kind).toBe("available");
    expect(image.collection.occurrences[0]!.value.payload).toMatchObject(fields);
    expect(image.collection.occurrences[0]!.source.payload.event.data.payload.values).toEqual(values);
  });

  it("does not borrow an equal-FEN node's saved report on a different attempt", () => {
    const f = fixture(true), root = branchPath(f.run, f.run.activeCursor.branchId)[0]!;
    let changed = fork(rewind(f.run, root.id, at).run, root.id, { at }).run;
    changed = revealFeedback(commitMove(changed, "e2e4", { at }).run, at).run;
    const selected = branchPath(changed, changed.activeCursor.branchId).at(-1)!;
    expect(selected.fen).toBe(f.selected.fen); expect(selected.id).not.toBe(f.selected.id);
    f.storage.save(changed, f.lease);
    const context = f.service.resolveInspectorRecordedContext(changed.id, owner, requested, availability,
      { branchId: changed.activeCursor.branchId, nodeId: selected.id, decisionDigest: moduleDecisionStamp(changed).digest, context: { kind: "position" } }, f.controller.signal);
    expect(f.acquire("recorded.inspector.eval_packet@1", context).outcome).toEqual({ kind: "unavailable", reason: "source_absent" });
  });

  it("retains the same inherited attachment with its distinct currently granted subject", () => {
    const f = fixture(true), initial = f.acquire("recorded.inspector.eval_packet@1");
    const changed = revealFeedback(fork(rewind(f.run, f.selected.id, at).run, f.selected.id, { at }).run, at).run;
    f.storage.save(changed, f.lease);
    const context = f.service.resolveInspectorRecordedContext(changed.id, owner, requested, availability,
      { branchId: changed.activeCursor.branchId, nodeId: f.selected.id, decisionDigest: moduleDecisionStamp(changed).digest, context: { kind: "position" } }, f.controller.signal);
    const inherited = f.acquire("recorded.inspector.eval_packet@1", context), row = inherited.collection.occurrences[0]!;
    expect(row.source.payload.subject.branchId).toBe(changed.activeCursor.branchId);
    expect(row.source.payload.event).toEqual(initial.collection.occurrences[0]!.source.payload.event);
    expect(inherited.sourceKey).not.toBe(initial.sourceKey);
  });

  it.each(["throw", "copy", "later-partial"] as const)("retains %s source failure rather than success/absence", fault => {
    const payload = reports[0]!, f = fixture(false, fault === "later-partial" ? [payload, payload] : [payload]);
    const original = routes.invokeEvidenceValueRoute, dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(f.acquire("recorded.inspector.eval_packet@1").outcome.kind).toBe("available"); expect(dispatch).toHaveBeenCalled(); dispatch.mockClear();
    let calls = 0;
    dispatch.mockImplementation(((route: string, input: unknown) => {
      if (route === "recorded.inspector.eval_packet@1") {
        calls++;
        if (fault === "copy") return { ...original(route as never, input as never) as object };
        if (fault === "throw" || calls === 2) throw new Error("PRIVATE DIAGNOSTIC RUN FEN");
      }
      return original(route as never, input as never);
    }) as typeof routes.invokeEvidenceValueRoute);
    const image = f.acquire("recorded.inspector.eval_packet@1");
    expect(image.outcome).toEqual({ kind: "failed", reason: "source_contract_invalid" });
    expect(image.collection.occurrences).toEqual([]); expect(image.sourceKey).toBeNull();
    expect(calls).toBe(fault === "later-partial" ? 2 : 1); expect(JSON.stringify(image.outcome)).not.toContain("PRIVATE");
  });

  it("refuses foreign/copied contexts, non-position scope and unknown refs before packet work", () => {
    const f = fixture(), context = f.context(), collect = vi.spyOn(packets, "collectInspectorRecordedPackets"), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const coerce = vi.fn(() => "recorded.inspector.eval_packet@1");
    for (const projection of ["constructor", "__proto__", "live.stockfish.eval@1", "recorded.inspector.eval_packet@2", { [Symbol.toPrimitive]: coerce }]) expect(() => f.acquire(projection as never, context)).toThrow();
    expect(coerce).not.toHaveBeenCalled();
    expect(() => f.acquire("recorded.inspector.eval_packet@1", f.context(undefined, "incoming_edge"))).toThrow();
    expect(() => f.acquire("recorded.inspector.eval_packet@1", { ...context } as never)).toThrow();
    expect(() => new RunService(f.storage).acquireInspectorPacketSource(context, "recorded.inspector.eval_packet@1", f.controller.signal)).toThrow();
    f.controller.abort(); expect(() => f.acquire("recorded.inspector.eval_packet@1", context)).toThrow();
    expect(collect).not.toHaveBeenCalled(); expect(dispatch).not.toHaveBeenCalled();
  });

  it.each(["advance", "cancel"] as const)("rechecks the original current grant after %s during real packet work", kind => {
    const f = fixture(), context = f.context(), original = packets.collectInspectorRecordedPackets;
    const collect = vi.spyOn(packets, "collectInspectorRecordedPackets").mockImplementationOnce((...args) => {
      const result = original(...args);
      if (kind === "cancel") f.controller.abort(); else f.storage.save(revealFeedback(commitMove(f.run, "g1f3", { at }).run, at).run, f.lease);
      return result;
    });
    const act = () => f.acquire("recorded.inspector.eval_packet@1", context);
    if (kind === "advance") expect(act).toThrow(expect.objectContaining({ reason: "stale" })); else expect(act).toThrow();
    expect(collect).toHaveBeenCalledTimes(1);
  });

  it("owns retained reads and checks actual disclosure reclosure", () => {
    const f = fixture(), token = f.service.acquireInspectorPacketSource(f.context(), "recorded.inspector.eval_packet@1", f.controller.signal), image = f.service.readInspectorPacketSource(token);
    for (const forged of [{ ...token }, JSON.parse(JSON.stringify(token)), Object.create(token), image]) expect(() => f.service.readInspectorPacketSource(forged as InspectorPacketSource)).toThrow();
    expect(() => new RunService(f.storage).readInspectorPacketSource(token)).toThrow();
    f.storage.save(commitMove(f.run, "g1f3", { at }).run, f.lease);
    expect(() => f.service.readInspectorPacketSource(token)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
  });
});
