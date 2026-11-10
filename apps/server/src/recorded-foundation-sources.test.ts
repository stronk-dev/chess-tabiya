import { afterEach, describe, expect, it, vi } from "vitest";
import { commitMove, createRun, fork, rewind, branchPath, readBackReplay } from "@chess-tabiya/runtime";
import { canonicalRunBytes } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { canonicalFen, positionFromFen } from "../../../packages/runtime/src/position-cache.js";
import { declareEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute, originalRecordedStyleValueInput } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { readFoundationRecordedPrefix, readFoundationRecordedDecision } from "../../../packages/runtime/src/recorded-foundation-source.js";
import { readRecordedFoundationInvocation } from "../../../packages/runtime/src/evidence-factories.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-04T00:00:00.000Z", owner = { learnerId: "foundation-owner", handle: "foundation-owner" };
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const QUEENS = "7k/5q2/8/8/8/8/2Q5/K7 w - - 0 50";
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });
function newRun(fen = QUEENS, side: "white" | "black" = "white", id = "recorded-foundation") {
  return createRun({ id, session: { kind: "position", start: { fen: canonicalFen(positionFromFen(fen)), side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: "sha256:" + "a".repeat(64), policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
}
function fixture(run = newRun()) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  const lease = { learnerId: owner.learnerId, writerId: "foundation-writer" }; storage.create(run, lease);
  const service = new RunService(storage), abort = new AbortController();
  const prefix = (nodeId = run.activeCursor.nodeId, branchId = run.activeCursor.branchId) => service.resolveFoundationRecordedPrefix(run.id, owner, { branchId, throughNodeId: nodeId }, abort.signal);
  return { storage, service, abort, prefix, run, lease };
}
function available<T>(result: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (result.kind !== "available") throw new Error(result.reason); return result.value;
}
function candidate(fen: string, moveUci: string) {
  const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
  return available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position, moveUci }));
}
function reseal<T>(value: DeclaredEvidence<T>): DeclaredEvidence<T> {
  const r = evidenceValueReceipt(value); return declareEvidence(value.producer, value.projection, value.payload,
    { factory: r.factory, inputDigest: r.inputDigest, sourceDigests: r.sourceDigests, ...(r.convention === undefined ? {} : { convention: r.convention }) });
}

describe("original recorded foundation input authority", () => {
  it("retains all six exact original style source chains without minting actor context", () => {
    const f = fixture(), prefix = f.prefix(), decision = f.service.resolveFoundationRecordedDecision(prefix, f.run.activeCursor.nodeId);
    const queen = candidate(f.run.start.fen, "c2c3");
    const early = available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: queen }))[0]!;
    const pawn = candidate(START, "e2e4");
    const centre = available(invokeEvidenceValueRoute("rules.mobility.reading.pawn_extended_center_destination@1", { source: pawn }))[0]!;
    const setup = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen: f.run.start.fen });
    const screen = available(invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: setup }));
    const baseline = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix }));
    const values: readonly DeclaredEvidence<unknown>[] = [queen, centre, early, setup, screen, baseline];
    for (const value of values) {
      const original = originalRecordedStyleValueInput(value);
      expect(Object.isFrozen(original)).toBe(true);
      expect(original.route).toBe(`${value.projection.id}@${value.projection.version}`);
      expect(original).not.toHaveProperty("actorClass");
      for (const forged of [{ ...value }, reseal(value), JSON.parse(JSON.stringify(value))]) {
        expect(() => originalRecordedStyleValueInput(forged)).toThrow();
      }
    }
    const candidateInput = originalRecordedStyleValueInput(queen);
    if (candidateInput.kind !== "candidate") throw Error("Missing candidate input");
    expect(candidateInput.candidate).toBe(queen);
    expect(candidateInput.position.payload.fen).toBe(f.run.start.fen);
    const centreInput = originalRecordedStyleValueInput(centre);
    if (centreInput.kind !== "candidate") throw Error("Missing centre candidate");
    expect(centreInput.candidate).toBe(pawn); expect(centreInput.fen).toBe(START);
    const earlyInput = originalRecordedStyleValueInput(early);
    if (earlyInput.kind !== "candidate") throw Error("Missing recorded candidate");
    expect(earlyInput.decision).toBe(decision); expect(earlyInput.candidate).toBe(queen);
    const screenInput = originalRecordedStyleValueInput(screen);
    if (screenInput.kind !== "position") throw Error("Missing setup input");
    expect(screenInput.setup).toBe(setup); expect(setup.payload.setups).toEqual([]);
    const baselineInput = originalRecordedStyleValueInput(baseline);
    if (baselineInput.kind !== "baseline") throw Error("Missing first-decision input");
    expect(baselineInput.prefix).toBe(prefix);
    expect(() => originalRecordedStyleValueInput(invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: START }))).toThrow(/six exact/u);
    f.abort.abort();
    expect(() => originalRecordedStyleValueInput(early)).toThrow();
    expect(() => originalRecordedStyleValueInput(baseline)).toThrow();
  });
  it("refuses fabricated principal/selection/signal operands before storage capture", () => {
    const f = fixture(), read = vi.spyOn(f.storage, "read"), query = { branchId: f.run.activeCursor.branchId, throughNodeId: f.run.activeCursor.nodeId };
    expect(() => f.service.resolveFoundationRecordedPrefix(f.run.id, owner, { ...query, sourcePly: 0 } as never, f.abort.signal)).toThrow();
    expect(() => f.service.resolveFoundationRecordedPrefix(f.run.id, { ...owner, color: "black" } as never, query, f.abort.signal)).toThrow();
    expect(() => f.service.resolveFoundationRecordedPrefix(f.run.id, owner, query, { throwIfAborted() {} } as never)).toThrow();
    expect(read).not.toHaveBeenCalled();
  });
  it("binds an unplayed alternate queen candidate to rooted index0, never FEN move50 or an actual choice", () => {
    const f = fixture(), prefix = f.prefix(), decision = f.service.resolveFoundationRecordedDecision(prefix, f.run.activeCursor.nodeId);
    const c = candidate(f.run.start.fen, "c2c3"), value = available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: c }))[0]!;
    expect(value.payload).toMatchObject({ sourcePly: 0, beforeNodeId: f.run.activeCursor.nodeId, moveUci: "c2c3", sourcePiece: { role: "queen" } });
    const p = readFoundationRecordedPrefix(prefix).authority, d = readFoundationRecordedDecision(decision).authority, receipt = evidenceValueReceipt(value);
    expect(p.path[0]!.creation).toEqual({ ordinal: 0, seq: f.run.events[0]!.seq, type: "run.started" });
    expect(receipt.inputDigest).toBe(evidenceDigest({ decision: d, candidate: { sealed: evidenceValueReceipt(c).payloadDigest } }));
    expect(receipt.inputDigest).not.toBe(evidenceDigest({ decision: {}, candidate: { sealed: evidenceValueReceipt(c).payloadDigest } }));
    expect(receipt.sourceDigests).toEqual([evidenceValueReceipt(c).payloadDigest]);
    expect(receipt.convention?.refs).toContainEqual({ id: "early-queen-ply", version: 1 });
    expect(readRecordedFoundationInvocation(value).decision).toBe(decision);
    expect(JSON.stringify(f.storage.read(f.run.id)!.run)).toBe(JSON.stringify(f.run));
    expect(Object.isFrozen(d.selected.creation)).toBe(true);
  });
  it("uses the15/16 boundary and keeps identical FENs at different original rooted indices distinct", () => {
    let run = newRun();
    const walk = ["a1b1", "h8g8", "b1c1", "g8f8", "c1d1", "f8e8", "d1e1", "e8d8", "e1d1", "d8e8", "d1c1", "e8f8", "c1b1", "f8g8", "b1a1", "g8h8"];
    for (let i = 0; i < walk.length; i++) run = commitMove(run, walk[i]!, { at, actor: i % 2 === 0 ? "user" : "system" }).run;
    const f = fixture(run), path = branchPath(run, run.activeCursor.branchId), p = f.prefix(), d15 = f.service.resolveFoundationRecordedDecision(p, path[15]!.id), d16 = f.service.resolveFoundationRecordedDecision(p, path[16]!.id);
    const c15 = candidate(path[15]!.fen, "f7f6"), c16 = candidate(path[16]!.fen, "c2c3");
    expect(available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision: d15, candidate: c15 }))).toHaveLength(1);
    expect(available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision: d16, candidate: c16 }))).toEqual([]);
    const other = fixture(newRun(path[16]!.fen, "white", "same-fen-new-root")), d0 = other.service.resolveFoundationRecordedDecision(other.prefix(), other.run.activeCursor.nodeId);
    expect(available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision: d0, candidate: c16 }))[0]!.payload.sourcePly).toBe(0);
    expect(() => f.service.resolveFoundationRecordedDecision(f.prefix(path[15]!.id), path[16]!.id)).toThrow();
  });
  it("authenticates copies, foreign issuers, extra caller operands and negative candidates before returning empty", () => {
    const f = fixture(), prefix = f.prefix(), decision = f.service.resolveFoundationRecordedDecision(prefix, f.run.activeCursor.nodeId), c = candidate(f.run.start.fen, "a1b1");
    expect(available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: c }))).toEqual([]);
    for (const counterfeit of [{ ...decision }, JSON.parse(JSON.stringify(decision))]) expect(() => invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision: counterfeit, candidate: c } as never)).toThrow();
    for (const bad of [reseal(c), { ...c }]) expect(() => invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: bad })).toThrow();
    expect(() => invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: c, ply: 0 } as never)).toThrow();
    const foreign = new RunService(f.storage);
    expect(() => foreign.resolveFoundationRecordedDecision(prefix, f.run.activeCursor.nodeId)).toThrow(/foreign/);
    f.abort.abort();
    expect(() => invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: c })).toThrow();
  });
  it("does not reclassify a promotion-to-queen source pawn as a queen move", () => {
    const f = fixture(newRun("7k/P7/8/8/8/8/8/K7 w - - 0 1")), decision = f.service.resolveFoundationRecordedDecision(f.prefix(), f.run.activeCursor.nodeId);
    const c = candidate(f.run.start.fen, "a7a8q"); expect(c.payload.sourcePiece.role).toBe("pawn");
    expect(available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: c }))).toEqual([]);
  });
  it("rejects a genuine candidate from another canonical position before an otherwise matching queen result", () => {
    const f = fixture(), decision = f.service.resolveFoundationRecordedDecision(f.prefix(), f.run.activeCursor.nodeId);
    const other = candidate("7k/8/8/8/8/8/2Q5/K7 w - - 0 1", "c2c3");
    expect(() => invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: other })).toThrow(/original recorded position/);
  });
  it("checks an illegal unselected branch before narrowing to a clean root", () => {
    let run = commitMove(newRun(), "a1b1", { at }).run;
    run = commitMove(fork(rewind(run, run.nodes[0]!.id, at).run, run.nodes[0]!.id, { at }).run, "a1b2", { at }).run;
    const f = fixture(run), corrupt = structuredClone(run), childId = run.nodes[1]!.id;
    const badNode = corrupt.nodes.find(node => node.id === childId)!;
    Object.assign(badNode, { moveSan: "Kb2" });
    for (const event of corrupt.events) if (event.type === "move.committed" && event.data.node.id === childId) Object.assign(event.data.node, { moveSan: "Kb2" });
    // Full replay alone agrees: the explicit legal/SAN pass on every branch must do the work.
    expect(canonicalRunBytes(readBackReplay(corrupt.events).run)).toBe(canonicalRunBytes(corrupt));
    const stored = f.storage.read(run.id)!; vi.spyOn(f.storage, "read").mockReturnValue({ ...stored, run: corrupt });
    expect(() => f.prefix(run.nodes[0]!.id)).toThrow();
  });
  it("rechecks original storage after the real boundary capture, before issuing a prefix", () => {
    const f = fixture(), original = f.storage.importedGame.bind(f.storage); let changed = false;
    vi.spyOn(f.storage, "importedGame").mockImplementation(id => {
      if (!changed) { changed = true; f.storage.save(commitMove(f.run, "a1b1", { at }).run, f.lease); }
      return original(id);
    });
    expect(() => f.prefix()).toThrow(/changed/);
  });
  it("retains actual imported prefix boundaries and refuses missing or replaced import identity", async () => {
    const f = fixture(), imported = await f.service.importGame({ id: "recorded-foundation-import", side: "black", opponentPolicy: { mode: "human_common" },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1,
      source: { kind: "pgn", pgn: '[Result "*"]\n\n1. e4 e5 *' }, createdAt: at }, f.lease);
    const path = branchPath(imported.run, imported.run.activeCursor.branchId);
    const prefixAt = (nodeId: string) => f.service.resolveFoundationRecordedPrefix(imported.run.id, owner,
      { branchId: imported.run.activeCursor.branchId, throughNodeId: nodeId }, f.abort.signal);
    expect(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix: prefixAt(path[0]!.id) })).toMatchObject({ kind: "unavailable" });
    const prefix = prefixAt(path[1]!.id), value = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix }));
    expect(readRecordedFoundationInvocation(value).prefix).toBe(prefix);
    expect(value.payload).toMatchObject({ learnerColor: "black", sourcePly: 1, firstDecisionNodeId: path[1]!.id, rights: { kingside: true, queenside: true } });
    expect(() => f.service.resolveFoundationRecordedDecision(prefix, path[2]!.id)).toThrow();
    const record = f.storage.importedGame(imported.run.id)!;
    const read = vi.spyOn(f.storage, "importedGame").mockReturnValue(undefined);
    expect(() => readRecordedFoundationInvocation(value)).toThrow();
    expect(() => invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix })).toThrow();
    read.mockReturnValue({ ...record, movetextDigest: "sha256:" + "b".repeat(64) });
    expect(() => readRecordedFoundationInvocation(value)).toThrow();
    expect(() => invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix })).toThrow();
  });
  it.each(["abort", "role", "account", "head"] as const)("retires original prefix and decision after %s changes", change => {
    const f = fixture(), guest = { learnerId: "foundation-guest", handle: "foundation-guest" };
    if (change === "role") {
      f.storage.createLearner({ id: guest.learnerId, handle: guest.handle, passwordHash: "!", createdAt: at });
      f.storage.grantRole(f.run.id, guest.learnerId, "spectator", f.lease, at);
    }
    const prefix = f.service.resolveFoundationRecordedPrefix(f.run.id, change === "role" ? guest : owner,
      { branchId: f.run.activeCursor.branchId, throughNodeId: f.run.activeCursor.nodeId }, f.abort.signal);
    const decision = f.service.resolveFoundationRecordedDecision(prefix, f.run.activeCursor.nodeId), c = candidate(f.run.start.fen, "c2c3");
    const queen = available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: c }))[0]!;
    const castling = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix }));
    expect(readRecordedFoundationInvocation(queen).decision).toBe(decision);
    expect(readRecordedFoundationInvocation(castling).prefix).toBe(prefix);
    if (change === "abort") f.abort.abort();
    else if (change === "account") f.storage.deleteLearner(owner.learnerId, at);
    else if (change === "role") f.storage.revokeGrant(f.run.id, guest.learnerId, f.lease);
    else f.storage.save(commitMove(f.run, "a1b1", { at }).run, f.lease);
    expect(() => readRecordedFoundationInvocation(queen)).toThrow();
    expect(() => readRecordedFoundationInvocation(castling)).toThrow();
    expect(() => invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: c })).toThrow();
    expect(() => invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix })).toThrow();
  });
});

describe("first represented stored-color castling baseline", () => {
  it("uses the stored Black color at a Black-to-move custom root without caller color operands", () => {
    const f = fixture(newRun("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 7", "black")), prefix = f.prefix();
    expect(available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix })).payload).toMatchObject({ learnerColor: "black", sourcePly: 0, rights: { kingside: true, queenside: true } });
    expect(() => invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix, color: "white" } as never)).toThrow();
  });
  it.each([START, "1k2r3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "1k6/8/8/8/8/8/8/R2K1R2 w FA - 0 1"])("retains blocked/checked/Chess960 rights from original root %s", fen => {
    const f = fixture(newRun(fen)), prefix = f.prefix(), result = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix }));
    expect(result.payload).toMatchObject({ learnerColor: "white", firstDecisionNodeId: f.run.activeCursor.nodeId, sourcePly: 0, rights: { kingside: true, queenside: true } });
    expect(evidenceValueReceipt(result).sourceDigests).toEqual([]);
    expect(evidenceValueReceipt(result).inputDigest).toBe(evidenceDigest({ prefix: readFoundationRecordedPrefix(prefix).authority }));
    expect(evidenceValueReceipt(result).convention?.refs).toContainEqual({ id: "castling-first-decision", version: 1 });
  });
  it("distinguishes no represented Black turn from a real all-false baseline, including pending endpoints", () => {
    const start = newRun(QUEENS, "black"), f = fixture(start);
    expect(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix: f.prefix() })).toMatchObject({ kind: "unavailable", reason: "first_decision_not_represented" });
    const played = commitMove(start, "a1b1", { at }).run; f.storage.save(played, f.lease);
    const prefix = f.prefix(played.activeCursor.nodeId), result = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix }));
    expect(result.payload).toMatchObject({ learnerColor: "black", sourcePly: 1, firstDecisionNodeId: played.activeCursor.nodeId, rights: { kingside: false, queenside: false } });
    expect(() => invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix: { ...prefix } } as never)).toThrow();
  });
  it("retains the first baseline across later rights loss and inherited forks", () => {
    let run = newRun(START); for (const [uci, actor] of [["e2e4", "user"], ["a7a6", "system"], ["e1e2", "user"]] as const) run = commitMove(run, uci, { actor, at }).run;
    run = commitMove(fork(rewind(run, run.nodes[1]!.id, at).run, run.nodes[1]!.id, { at }).run, "b7b6", { actor: "system", at }).run;
    const f = fixture(run), value = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix: f.prefix() }));
    expect(value.payload).toMatchObject({ firstDecisionNodeId: run.nodes[0]!.id, sourcePly: 0, rights: { kingside: true, queenside: true } });
  });
});
