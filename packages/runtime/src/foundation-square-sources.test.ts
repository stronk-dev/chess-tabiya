import { describe, expect, it } from "vitest";
import { declareEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { directProjectionConventions } from "./evidence-convention-closure.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { matchesStructuralFeature } from "./structure.js";

function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (result.kind !== "available") throw Error(result.reason);
  return result.value;
}
const legal = (fen: string) => invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
const future = (position: ReturnType<typeof legal>) => available(invokeEvidenceValueRoute("derived.square.reading.future_file_challenge@1", { position }));
const migration = (position: ReturnType<typeof legal>) => available(invokeEvidenceValueRoute("derived.square.reading.capture_migration_reach@1", { position }));
function sources(fen: string) {
  const position = legal(fen), control = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen: position.payload.fen });
  const f = future(position), m = migration(position);
  const candidates = available(invokeEvidenceValueRoute("derived.structural.reading.outpost_candidate@1", { control, future: f }));
  const occupied = available(invokeEvidenceValueRoute("derived.structural.reading.occupied_outpost@1", { source: candidates }));
  return { position, control, future: f, migration: m, candidates, occupied };
}
function reseal<T>(source: DeclaredEvidence<T>): DeclaredEvidence<T> {
  const receipt = evidenceValueReceipt(source);
  return declareEvidence(source.producer, source.projection, source.payload, { factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests, ...(receipt.convention === undefined ? {} : { convention: receipt.convention }) });
}

describe("complete geometric challenge sources", () => {
  it("retains every root pawn and current-zero/future counts separately for both colors", () => {
    const s = sources("4k3/7p/8/8/8/8/P7/4K3 w - - 0 1");
    expect(s.future.payload.pawnDomain).toEqual([{ color: "white", square: "a2" }, { color: "black", square: "h7" }]);
    expect(s.future.payload.challenges).toContainEqual({ pawn: { color: "white", square: "a2" }, target: "b3", pushes: 0 });
    expect(s.future.payload.challenges).toContainEqual({ pawn: { color: "white", square: "a2" }, target: "b8", pushes: 5 });
    expect(s.future.payload.challenges).toContainEqual({ pawn: { color: "black", square: "h7" }, target: "g6", pushes: 0 });
    expect(s.future.payload.challenges).toContainEqual({ pawn: { color: "black", square: "h7" }, target: "g1", pushes: 5 });
    expect(s.future.payload.challenges).toHaveLength(12);
    expect(s.future.payload.challenges.some(row => row.pawn.square === "a2" && row.target[0] === "h")).toBe(false);
  });

  it("ignores blockers, turn and pinned-controller legality without inventing a legal line", () => {
    const blocked = sources("4k3/7p/8/8/8/P7/P7/4K3 w - - 0 1");
    expect(blocked.future.payload.challenges).toContainEqual({ pawn: { color: "white", square: "a2" }, target: "b5", pushes: 2 });
    const otherTurn = sources("4k3/7p/8/8/8/P7/P7/4K3 b - - 0 1");
    expect(otherTurn.future.payload.challenges).toEqual(blocked.future.payload.challenges);
    const pinned = sources("4k3/4p3/8/8/8/8/8/4R2K w - - 0 1");
    expect(pinned.future.payload.challenges).toContainEqual({ pawn: { color: "black", square: "e7" }, target: "d6", pushes: 0 });
  });

  it("enumerates distinct hypothetical capture/push counts without duplicate file paths", () => {
    const s = sources("4k3/8/8/8/8/8/P7/4K3 w - - 0 1");
    expect(s.future.payload.challenges.some(row => row.target === "c5")).toBe(false);
    expect(s.migration.payload.reaches.filter(row => row.target === "c5")).toEqual([
      { pawn: { color: "white", square: "a2" }, target: "c5", captures: 1, pushes: 1 },
    ]);
    // Two captures can return to the original file, but remain capture-migration evidence.
    expect(s.migration.payload.reaches).toContainEqual({ pawn: { color: "white", square: "a2" }, target: "b5", captures: 2, pushes: 0 });
    expect(s.migration.payload.reaches.some(row => row.target === "b3")).toBe(false);
    expect(new Set(s.migration.payload.reaches.map(row => JSON.stringify(row))).size).toBe(s.migration.payload.reaches.length);
    expect(s.migration.payload.reaches.every(row => row.captures >= 1 && row.pushes >= 0)).toBe(true);
  });

  it("retains complete empty snapshots rather than missing positive populations", () => {
    const s = sources("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
    expect(s.future.payload).toEqual({ fen: s.position.payload.fen, pawnDomain: [], challenges: [] });
    expect(s.migration.payload).toEqual({ fen: s.position.payload.fen, pawnDomain: [], reaches: [] });
    expect(s.candidates.payload).toEqual({ fen: s.position.payload.fen, basis: "future_file", candidates: [] });
    expect(s.occupied.payload).toEqual({ fen: s.position.payload.fen, basis: "future_file", occupied: [] });
    for (const value of [s.future, s.migration, s.candidates, s.occupied]) expect(Object.isFrozen(value.payload)).toBe(true);
  });
});

describe("fixed future-file outposts and actual occupation", () => {
  const fen = "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1";
  it("admits capture-migration-only challenge while the legacy maximal-union outpost refuses", () => {
    const s = sources(fen);
    expect(s.future.payload.challenges.some(row => row.pawn.color === "black" && row.target === "e5")).toBe(false);
    expect(s.migration.payload.reaches).toContainEqual({ pawn: { color: "black", square: "c7" }, target: "e5", captures: 1, pushes: 0 });
    expect(s.candidates.payload.candidates.find(row => row.square === "e5")).toEqual({ color: "white", square: "e5", relativeRank: 5, supportPawns: [{ color: "white", square: "d4" }], challengers: [] });
    expect(matchesStructuralFeature(fen, { kind: "outpost", color: "white", square: "e5" })).toBe(false);
    expect(s.occupied.payload.occupied.find(row => row.candidate.square === "e5")?.occupant).toEqual({ color: "white", role: "knight", square: "e5" });
    expect(evidenceValueReceipt(s.candidates).sourceDigests).toEqual([evidenceValueReceipt(s.control).payloadDigest, evidenceValueReceipt(s.future).payloadDigest]);
    expect(evidenceValueReceipt(s.candidates).sourceDigests).not.toContain(evidenceValueReceipt(s.migration).payloadDigest);
  });

  it("does not conflate candidacy with empty, own occupied or enemy occupied squares", () => {
    for (const [piece, expected] of [["4N3", 1], ["8", 0], ["4n3", 0], ["4P3", 0]] as const) {
      const s = sources(fen.replace("4N3", piece));
      expect(s.candidates.payload.candidates.some(row => row.square === "e5")).toBe(true);
      expect(s.occupied.payload.occupied.filter(row => row.candidate.square === "e5")).toHaveLength(expected);
    }
  });

  it("excludes zero-push and future same-file challenges but not by occupancy", () => {
    for (const blackRank of ["5p2", "8"]) {
      const at = blackRank === "8" ? "7k/5p2/8/4N3/3P4/8/8/7K w - - 0 1" : "7k/8/5p2/4N3/3P4/8/8/7K w - - 0 1";
      const s = sources(at);
      expect(s.future.payload.challenges.some(row => row.target === "e5" && row.pawn.color === "black")).toBe(true);
      expect(s.candidates.payload.candidates.some(row => row.square === "e5")).toBe(false);
    }
  });

  it("retains all support identities and applies rank4..6 boundaries for both colors", () => {
    const s = sources("7k/8/8/8/3P1P2/8/8/7K w - - 0 1");
    expect(s.candidates.payload.candidates.find(row => row.square === "e5")?.supportPawns).toEqual([{ color: "white", square: "d4" }, { color: "white", square: "f4" }]);
    expect(s.candidates.payload.candidates.every(row => row.relativeRank >= 4 && row.relativeRank <= 6)).toBe(true);
    const black = sources("7k/8/8/3p1p2/8/8/8/7K b - - 0 1");
    expect(black.candidates.payload.candidates.find(row => row.square === "e4")).toMatchObject({ color: "black", relativeRank: 5, supportPawns: [{ color: "black", square: "d5" }, { color: "black", square: "f5" }] });
    expect(sources("7k/8/3P4/8/8/8/3P4/7K w - - 0 1").candidates.payload.candidates).toEqual([]);
  });

  it("rejects resealed/forged roots, mismatched positions, wrong versions and caller basis/lists", () => {
    const a = sources(fen), b = sources(fen.replace("2p5", "8"));
    for (const route of ["derived.square.reading.future_file_challenge@1", "derived.square.reading.capture_migration_reach@1"] as const) {
      for (const position of [{ ...a.position }, reseal(a.position)]) expect(() => invokeEvidenceValueRoute(route, { position } as never)).toThrow();
      expect(() => invokeEvidenceValueRoute(route, { position: a.position, fen } as never)).toThrow();
    }
    for (const input of [{ control: a.control, future: b.future }, { control: reseal(a.control), future: a.future }, { control: a.control, future: reseal(a.future) }, { control: a.control, future: a.future, basis: "maximal" }, { control: a.control, future: a.future, migration: a.migration }, { control: a.control, future: a.migration }]) {
      expect(() => invokeEvidenceValueRoute("derived.structural.reading.outpost_candidate@1", input as never)).toThrow();
    }
    expect(() => invokeEvidenceValueRoute("derived.structural.reading.occupied_outpost@1", { source: reseal(a.candidates) })).toThrow();
    expect(() => invokeEvidenceValueRoute("derived.structural.reading.occupied_outpost@1", { source: a.candidates, occupied: [] } as never)).toThrow();
  });

  it("inherits only actual source conventions and keeps candidates independent of optional migration computation", () => {
    const s = sources(fen);
    const again = available(invokeEvidenceValueRoute("derived.structural.reading.outpost_candidate@1", { control: s.control, future: s.future }));
    expect(again.payload).toEqual(s.candidates.payload);
    expect(evidenceValueReceipt(s.candidates).convention?.refs.map(ref => ref.id)).not.toContain("capture-migration-reach");
    expect(directProjectionConventions("derived.structural.reading.outpost_candidate@1").map(ref => ref.id)).toContain("outpost-candidate");
    expect(evidenceValueReceipt(s.occupied).sourceDigests).toEqual([evidenceValueReceipt(s.candidates).payloadDigest]);
  });
});
