import { afterEach, describe, expect, it, vi } from "vitest";
import { appendEvents, commitMove, createRun } from "@chess-tabiya/runtime";
import { digestRunEventHead, digestRunEvidenceItem, type EvidenceAvailabilitySubjectRef } from "@chess-tabiya/runtime/run-subject";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-10-04T10:00:00.000Z";
const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const host = { learnerId: "host", handle: "host" };
const stranger = { learnerId: "stranger", handle: "stranger" };
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

function fixture() {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [host, stranger]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const initial = createRun({ id: "authorized-subject", packId: "pack", packDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    startFen: initialFen, seed: 1, createdAt: at });
  const moved = commitMove(initial, "e2e4", { at }).run;
  const current = appendEvents(moved, [{ type: "evidence.attached", at, data: { nodeId: moved.activeCursor.nodeId, evidenceRefs: ["eval"], payload: { kind: "eval", source: "engine_validated", values: { centipawns: 20 } } } }]);
  storage.create(current, { writerId: "writer", learnerId: host.learnerId });
  const ref: EvidenceAvailabilitySubjectRef = { kind: "run_prefix", runId: current.id, eventHeadDigest: digestRunEventHead({ runId: current.id, headSeq: current.events.length, events: current.events }) };
  return { storage, service: new RunService(storage), initial, moved, current, ref };
}

describe("authorized exact run-subject service boundary", () => {
  it("rechecks current read grants on every request instead of retaining an authorization cache", () => {
    const { storage, service, current, ref } = fixture();
    const actor = { writerId: "writer", learnerId: host.learnerId };
    storage.grantRole(current.id, stranger.learnerId, "spectator", actor, at);
    expect(service.evidenceSubjectAccess(stranger, ref).run.id).toBe(current.id);
    storage.revokeGrant(current.id, stranger.learnerId, actor);
    expect(() => service.evidenceSubjectAccess(stranger, ref)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("projects a historical head instead of borrowing the current cursor/snapshot", () => {
    const { service, initial, current } = fixture();
    const ref = { kind: "run_node" as const, runId: current.id, eventHeadDigest: digestRunEventHead({ runId: current.id, headSeq: 1, events: current.events }), branchId: initial.activeCursor.branchId, nodeId: initial.activeCursor.nodeId };
    const resolved = service.evidenceSubjectAccess(host, ref);
    expect(resolved.headSeq).toBe(1);
    expect(resolved.run.activeCursor).toEqual(initial.activeCursor);
    expect(resolved.subject).toEqual({ ...ref, fen: initialFen });
    expect(() => service.evidenceSubjectAccess(host, { ...ref, nodeId: current.activeCursor.nodeId })).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("settles authorization before accessing any event or source identity", () => {
    const { storage, service, current, ref } = fixture();
    const stored = storage.read(current.id)!;
    let eventReads = 0;
    const run = new Proxy(current, { get(target, property, receiver) { if (property === "events") { eventReads += 1; throw new Error("Unauthorized event read"); } return Reflect.get(target, property, receiver); } });
    vi.spyOn(storage, "read").mockReturnValue({ ...stored, run });
    expect(() => service.evidenceSubjectAccess(stranger, ref)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    expect(eventReads).toBe(0);
  });

  it("uses one generic not-found outcome for absent, crossed and corrupt stored heads", () => {
    const { service, storage, current, ref } = fixture();
    expect(() => service.evidenceSubjectAccess(host, { ...ref, runId: "missing" })).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    expect(() => service.evidenceSubjectAccess(host, { ...ref, eventHeadDigest: `sha256:${"0".repeat(64)}` as typeof ref.eventHeadDigest })).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    const stored = storage.read(current.id)!;
    vi.spyOn(storage, "read").mockReturnValue({ ...stored, run: { ...current, events: current.events.map((event, i) => i === 1 ? { ...event, seq: 1 } : event) } });
    expect(() => service.evidenceSubjectAccess(host, ref)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("recomputes a recorded item from the authorized prefix and rejects crossed/post-head items", () => {
    const { service, current, ref } = fixture();
    const event = current.events.at(-1)!;
    if (event.type !== "evidence.attached") throw new Error("Fixture must attach evidence");
    const item = digestRunEvidenceItem({ runId: current.id, eventHeadDigest: ref.eventHeadDigest, eventSeq: event.seq, event });
    expect(service.evidenceItemAccess(host, ref, item)).toEqual(event);
    const historical = { ...ref, eventHeadDigest: digestRunEventHead({ runId: current.id, headSeq: 1, events: current.events }) };
    expect(() => service.evidenceItemAccess(host, historical, item)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    expect(() => service.evidenceItemAccess(stranger, ref, item)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("refuses malformed references/caller FENs rather than repairing them", () => {
    const { service, ref } = fixture();
    expect(() => service.evidenceSubjectAccess(host, { ...ref, eventHeadDigest: "bad" as typeof ref.eventHeadDigest })).toThrow(expect.objectContaining({ code: "INVALID_REQUEST" }));
    expect(() => service.evidenceSubjectAccess(host, { ...ref, fen: initialFen } as EvidenceAvailabilitySubjectRef)).toThrow(expect.objectContaining({ code: "INVALID_REQUEST" }));
  });
});
