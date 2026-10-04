import { afterEach, describe, expect, it, vi } from "vitest";
import { occurrencePage, occurrenceRef, occurrenceRun } from "../../../packages/runtime/src/testing/maia-occurrence-fixture.js";
import { digestRunEventHead } from "@chess-tabiya/runtime/run-subject";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-10-04T10:00:00.000Z";
const host = { learnerId: "host", handle: "host" };
const guest = { learnerId: "guest", handle: "guest" };
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
function fixture() {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [host, guest]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const run = occurrenceRun();
  storage.create(run, { writerId: "writer", learnerId: host.learnerId });
  return { storage, service: new RunService(storage), run, ref: occurrenceRef(run),
    page: occurrencePage({ kind: "history_conditioned", startFen: run.start.fen, historyUci: [] }) };
}

describe("authenticated Maia occurrence service boundary", () => {
  it("joins actual stored history through the production service, with current read grants", () => {
    const { service, storage, ref, run, page } = fixture();
    const actor = { writerId: "writer", learnerId: host.learnerId };
    expect(service.maiaRunMoveOccurrence(host, ref, page).payload.run.playedMoveUci).toBe("e2e4");
    expect(() => service.maiaRunMoveOccurrence(guest, ref, page)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    storage.grantRole(run.id, guest.learnerId, "spectator", actor, at);
    expect(service.maiaRunMoveOccurrence(guest, ref, page).payload.run.eventHeadDigest).toBe(ref.eventHeadDigest);
    storage.revokeGrant(run.id, guest.learnerId, actor);
    expect(() => service.maiaRunMoveOccurrence(guest, ref, page)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("authorizes before reading the page, and refuses forged pages after authorization", () => {
    const { service, ref, page } = fixture();
    let reads = 0;
    const poisoned = new Proxy(page, { get() { reads += 1; throw new Error("Unauthorized page read"); } });
    expect(() => service.maiaRunMoveOccurrence(guest, ref, poisoned)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    expect(reads).toBe(0);
    expect(() => service.maiaRunMoveOccurrence(host, ref, { ...page })).toThrow();
  });

  it("does not substitute the current node for an edge missing at the selected historical head", () => {
    const { service, ref, run, page } = fixture();
    const earlier = occurrenceRun([], run.id);
    const eventHeadDigest = digestRunEventHead({ runId: run.id, headSeq: 1, events: earlier.events });
    expect(() => service.maiaRunMoveOccurrence(host, { ...ref, eventHeadDigest }, page)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });
});
