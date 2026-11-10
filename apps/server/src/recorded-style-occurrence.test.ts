import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { commitMove, createRun, fork, rewind, canonicalRunStart } from "@chess-tabiya/runtime";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../../packages/runtime/src/semantic-validation.js";
import { evidenceDigest, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { readRecordedStyleOccurrence, readContextualFoundationOccurrence } from "../../../packages/runtime/src/recorded-foundation-occurrence.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { LiveSessionService } from "./live-session.js";
import { normativeDecisions } from "./longitudinal-decisions.js";

const at = "2026-11-05T00:00:00.000Z", principal = { learnerId: "style-owner", handle: "style-owner" };
const lease = { learnerId: principal.learnerId, writerId: "style-writer" };
const config = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
// Four literal setups/screens, a queen candidate and a central pawn candidate. No chess judgement.
const FEN = "r3k2r/pb3pbp/1pn2np1/8/8/1PN2NP1/PBQ1PPBP/R3K2R w KQkq - 0 1";
const stores: SQLiteRunStorage[] = [], directories: string[] = [], sqls: DatabaseSync[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const sql of sqls.splice(0)) sql.close(); for (const store of stores.splice(0)) store.close(); for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
function available<T>(value: { kind: "available"; value: T } | { kind: "unavailable"; reason: string }): T {
  if (value.kind !== "available") throw Error(value.reason); return value.value;
}
async function fixture(black = false, imported = false, coached = false, file = ":memory:") {
  const fen = black ? mirrorSemanticFen(FEN, "color_and_vertical") : FEN;
  const side = black ? "black" as const : "white" as const, move = black ? mirrorSemanticUci("c2c1", "color_and_vertical") : "c2c1";
  let run = createRun({ id: `recorded-style-${black}-${imported}`, session: { kind: "position", start: { fen, side },
    feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: "sha256:" + "a".repeat(64), policyConfig: config, seed: 1, createdAt: at });
  const initial = run;
  run = commitMove(run, move, { at, actor: "user" }).run;
  const storage = new SQLiteRunStorage(file, { onMigration: () => {}, now: () => at }); stores.push(storage);
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const service = new RunService(storage);
  if (imported) {
    const pgn = `[SetUp "1"]\n[FEN "${fen}"]\n\n${black ? "1..." : "1."} ${run.nodes.at(-1)!.moveSan} *`;
    run = (await service.importGame({ id: run.id, side, source: { kind: "pgn", pgn }, opponentPolicy: { mode: "human_common" },
      policyConfig: config, seed: 1, createdAt: at }, lease)).run;
  } else if (coached) {
    storage.create(initial, lease);
    storage.createClassroom({ id: "style-class", ownerLearnerId: principal.learnerId, name: "Actual teacher fixture", createdAt: at, archivedAt: null });
    new LiveSessionService(storage, { runService: service, now: () => at }).create(principal,
      { runId: run.id, kind: "academy", title: "Recorded demonstration", classroomId: "style-class" });
    storage.save(run, lease);
  } else storage.create(run, lease);
  const abort = new AbortController();
  const prefix = service.resolveFoundationRecordedPrefix(run.id, principal, { branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId }, abort.signal);
  const decision = service.resolveFoundationRecordedDecision(prefix, run.nodes[0]!.id);
  const legal = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
  const role = available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position: legal, moveUci: move }));
  const pawn = available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position: legal, moveUci: black ? mirrorSemanticUci("e2e4", "color_and_vertical") : "e2e4" }));
  const centre = available(invokeEvidenceValueRoute("rules.mobility.reading.pawn_extended_center_destination@1", { source: pawn }))[0]!;
  const queen = available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision, candidate: role }))[0]!;
  const setup = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen });
  const screen = available(invokeEvidenceValueRoute("rules.structural.reading.fianchetto_knight_screen@1", { source: setup }));
  const baseline = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix }));
  return { run, storage, service, abort, prefix, decision, role, pawn, centre, queen, setup, screen, baseline, move, side };
}

function nativeMove(fen: string, moveUci: string) {
  const side = fen.split(" ")[1] === "w" ? "white" as const : "black" as const;
  let run = createRun({ id: "style-special-move", session: { kind: "position", start: canonicalRunStart({ fen, side }), feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: "sha256:" + "a".repeat(64), policyConfig: config, seed: 1, createdAt: at });
  run = commitMove(run, moveUci, { at, actor: "user" }).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at }); stores.push(storage);
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at }); storage.create(run, lease);
  const service = new RunService(storage), abort = new AbortController();
  const prefix = service.resolveFoundationRecordedPrefix(run.id, principal, { branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId }, abort.signal);
  const decision = service.resolveFoundationRecordedDecision(prefix, run.nodes[0]!.id);
  const position = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: run.start.fen });
  const value = available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position, moveUci }));
  return { run, storage, service, abort, prefix, decision, value, side };
}

describe("actual six-source recorded style occurrences", () => {
  for (const side of ["white", "black"] as const) for (const promotion of ["q", "r", "b", "n"] as const) {
    it(`retains the chosen ${side} ${promotion} promotion's original pawn role`, () => {
      const fen = side === "white" ? "7k/2P5/8/8/8/8/8/K7 w - - 0 1" : "7k/8/8/8/8/8/2p5/K7 b - - 0 1";
      const moveUci = (side === "white" ? "c7c8" : "c2c1") + promotion, f = nativeMove(fen, moveUci);
      const result = f.service.contextualizeFoundationRecordedValue(f.value, { kind: "candidate", decision: f.decision });
      expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
      expect(f.value.payload.sourcePiece.role).toBe("pawn");
      expect(readRecordedStyleOccurrence(result.occurrence).image).toMatchObject({ actorSide: side,
        subject: { kind: "legal_candidate", candidateUci: moveUci, chosenUci: moveUci, disposition: "chosen" } });
      expect(available(invokeEvidenceValueRoute("rules.mobility.reading.early_queen_move@1", { decision: f.decision, candidate: f.value }))).toEqual([]);
      for (const positionPhase of ["before", "after"] as const) {
        const node = positionPhase === "before" ? f.run.nodes[0]! : f.run.nodes.at(-1)!;
        const setup = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen: node.fen });
        expect(setup.payload.setups).toEqual([]);
        const observed = f.service.contextualizeFoundationRecordedValue(setup, { kind: "position", decision: f.decision, positionPhase });
        expect(observed.kind).toBe("available"); if (observed.kind !== "available") throw Error(observed.reason);
        expect(readRecordedStyleOccurrence(observed.occurrence).image.subject).toEqual({ kind: "actual_position", positionPhase, positionNodeId: node.id });
      }
    });
  }
  it.each([
    ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1h1", "g1"],
    ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1a1", "c1"],
    ["r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", "e8h8", "g8"],
    ["r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", "e8a8", "c8"],
    ["1k6/8/8/8/8/8/8/R2K1R2 w FA - 0 1", "d1f1", "g1"],
    ["1k6/8/8/8/8/8/8/R2K1R2 w FA - 0 1", "d1a1", "c1"],
  ] as const)("retains canonical castle %s %s with physical landing %s", (fen, moveUci, landing) => {
    const f = nativeMove(fen, moveUci), result = f.service.contextualizeFoundationRecordedValue(f.value, { kind: "candidate", decision: f.decision });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(f.value.payload.sourcePiece.role).toBe("king"); expect(f.value.payload.candidate.to).toBe(landing);
    expect(readRecordedStyleOccurrence(result.occurrence).image.subject).toEqual({ kind: "legal_candidate", candidateUci: moveUci, chosenUci: moveUci, disposition: "chosen" });
  });
  it("observes complete actual AFTER snapshots without assigning both colors to the moving actor", async () => {
    const f = await fixture(), position = f.run.nodes.at(-1)!;
    const setup = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen: position.fen });
    const result = f.service.contextualizeFoundationRecordedValue(setup, { kind: "position", decision: f.decision, positionPhase: "after" });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    const data = readRecordedStyleOccurrence(result.occurrence);
    expect(data.value).toBe(setup); expect(setup.payload.setups).toHaveLength(4);
    expect(new Set(setup.payload.setups.map(row => row.color))).toEqual(new Set(["white", "black"]));
    expect(data.image).toMatchObject({ actorSide: "white", subject: { kind: "actual_position", positionPhase: "after", positionNodeId: position.id } });
    expect(() => f.service.contextualizeFoundationRecordedValue(f.setup, { kind: "position", decision: f.decision, positionPhase: "after" })).toThrow(/position/u);
  });
  it.each(["abort", "head", "grant"] as const)("retires a genuine retained occurrence after actual %s change", async change => {
    const f = await fixture();
    const reader = { learnerId: "style-reader", handle: "style-reader" };
    let decision = f.decision;
    if (change === "grant") {
      f.storage.createLearner({ id: reader.learnerId, handle: reader.handle, passwordHash: "!", createdAt: at });
      f.storage.grantRole(f.run.id, reader.learnerId, "spectator", lease, at);
      const prefix = f.service.resolveFoundationRecordedPrefix(f.run.id, reader, { branchId: f.run.activeCursor.branchId, throughNodeId: f.run.activeCursor.nodeId }, f.abort.signal);
      decision = f.service.resolveFoundationRecordedDecision(prefix, f.run.nodes[0]!.id);
    }
    const result = f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(readRecordedStyleOccurrence(result.occurrence).image.actorClass).toBe("learner");
    if (change === "abort") f.abort.abort();
    if (change === "head") f.storage.save(commitMove(f.run, "a7a6", { at, actor: "system" }).run, lease);
    if (change === "grant") f.storage.revokeGrant(f.run.id, reader.learnerId, lease);
    expect(() => readRecordedStyleOccurrence(result.occurrence)).toThrow();
    if (change === "grant") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", lease, at);
    expect(() => readRecordedStyleOccurrence(result.occurrence)).toThrow(/retired/u);
  });
  it("keeps original imported actor evidence independent of later clock metadata backfill", async () => {
    const directory = mkdtempSync(join(tmpdir(), "recorded-style-clock-independent-")); directories.push(directory);
    const f = await fixture(false, true, false, join(directory, "tabiya.sqlite"));
    const sql = new DatabaseSync(f.storage.databasePath); sqls.push(sql);
    sql.prepare("UPDATE imported_games SET clock_document_json = NULL WHERE run_id = ?").run(f.run.id);
    const result = f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision: f.decision });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(f.storage.importedGame(f.run.id)!.clockDocument).toBeNull();
    const bytes = JSON.stringify(f.storage.read(f.run.id));
    f.storage.ensureRecordedClockDocument(f.run.id);
    expect(f.storage.importedGame(f.run.id)!.clockDocument?.status).toBe("ready");
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(bytes);
    expect(readRecordedStyleOccurrence(result.occurrence).image.actorClass).toBe("imported");
  });
  it("keeps genuinely matching pending contexts distinct from source absence", async () => {
    const f = await fixture(), fen = f.run.nodes.at(-1)!.fen;
    const endpoint = f.service.resolveFoundationRecordedDecision(f.prefix, f.run.activeCursor.nodeId);
    const legal = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen });
    const next = available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position: legal, moveUci: "a7a6" }));
    expect(f.service.contextualizeFoundationRecordedValue(next, { kind: "candidate", decision: endpoint }))
      .toEqual({ kind: "unavailable", reason: "pending_decision" });
    const position = invokeEvidenceValueRoute("rules.structural.reading.fianchetto_setup@1", { fen });
    for (const positionPhase of ["before", "after"] as const) expect(f.service.contextualizeFoundationRecordedValue(position,
      { kind: "position", decision: endpoint, positionPhase })).toEqual({ kind: "unavailable", reason: "pending_decision" });
    const rootPrefix = f.service.resolveFoundationRecordedPrefix(f.run.id, principal,
      { branchId: f.run.activeCursor.branchId, throughNodeId: f.run.nodes[0]!.id }, f.abort.signal);
    const baseline = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix: rootPrefix }));
    expect(f.service.contextualizeFoundationRecordedValue(baseline, { kind: "baseline", prefix: rootPrefix }))
      .toEqual({ kind: "unavailable", reason: "first_decision_pending" });
  });
  it("keeps the first baseline/event even after the owner later loses all castling rights", async () => {
    const f = await fixture();
    // Legal recorded fixture reply only; no opponent model selection is being asserted.
    let next = commitMove(f.run, "a7a6", { at, actor: "system" }).run;
    next = commitMove(next, "e1f1", { at, actor: "user" }).run; f.storage.save(next, lease);
    const prefix = f.service.resolveFoundationRecordedPrefix(next.id, principal,
      { branchId: next.activeCursor.branchId, throughNodeId: next.activeCursor.nodeId }, f.abort.signal);
    const value = available(invokeEvidenceValueRoute("run.record.castling_eligibility@1", { prefix }));
    expect(value.payload.rights).toEqual({ kingside: true, queenside: true });
    const result = f.service.contextualizeFoundationRecordedValue(value, { kind: "baseline", prefix });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(readRecordedStyleOccurrence(result.occurrence).image).toMatchObject({ eventSeq: f.run.events[1]!.seq,
      decisionNodeId: f.run.nodes[0]!.id, subject: { kind: "first_decision_baseline", sourcePly: 0 } });
  });
  it.each([false, true])("distinguishes imported play from an identical-looking owner rehearsal fork, black=%s", async black => {
    const f = await fixture(black, true), original = f.run.nodes.at(-1)!;
    const old = f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision: f.decision });
    expect(old.kind).toBe("available"); if (old.kind !== "available") throw Error(old.reason);
    expect(readRecordedStyleOccurrence(old.occurrence).image.actorClass).toBe("imported");
    let next = fork(rewind(f.run, f.run.nodes[0]!.id, at).run, f.run.nodes[0]!.id, { at }).run;
    next = commitMove(next, f.move, { at, actor: "user" }).run; f.storage.save(next, lease);
    const leaf = next.nodes.find(node => node.id === next.activeCursor.nodeId)!;
    expect(leaf.fen).toBe(original.fen); expect(leaf.moveUci).toBe(original.moveUci); expect(leaf.id).not.toBe(original.id);
    expect(() => readRecordedStyleOccurrence(old.occurrence)).toThrow();
    const prefix = f.service.resolveFoundationRecordedPrefix(next.id, principal,
      { branchId: next.activeCursor.branchId, throughNodeId: next.activeCursor.nodeId }, f.abort.signal);
    const decision = f.service.resolveFoundationRecordedDecision(prefix, f.run.nodes[0]!.id);
    const result = f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    const image = readRecordedStyleOccurrence(result.occurrence).image;
    expect(image).toMatchObject({ actorClass: "learner", decisionClass: "played", actorSide: f.side,
      subject: { candidateUci: f.move, chosenUci: f.move, disposition: "chosen" } });
    expect(image.eventSeq).not.toBe(f.run.events[1]!.seq);
  });
  it("rejects a same-byte source image from another actual store before actor admission", async () => {
    const f = await fixture(), other = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at }); stores.push(other);
    other.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
    other.create(f.run, lease);
    const foreign = other.longitudinalSourceImageV4(f.run.id, f.run.events.length);
    expect(JSON.stringify(foreign.runPrefix.events)).toBe(JSON.stringify(f.run.events));
    vi.spyOn(f.storage, "longitudinalSourceImageV4").mockReturnValue(foreign);
    expect(() => f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision: f.decision })).toThrow(/STORE|store/u);
  });
  it("rejects forged sources/selectors before historical author reads", async () => {
    const f = await fixture(), capture = vi.spyOn(f.storage, "longitudinalSourceImageV4");
    for (const selection of [
      { kind: "candidate", decision: f.decision, actorClass: "learner" },
      { kind: "candidate", decision: { ...f.decision } },
      { kind: "position", decision: f.decision, positionPhase: "later" },
      { get kind() { throw Error("getter executed"); }, decision: f.decision },
    ]) expect(() => f.service.contextualizeFoundationRecordedValue(f.role, selection as never)).toThrow();
    expect(() => f.service.contextualizeFoundationRecordedValue({ ...f.role }, { kind: "candidate", decision: f.decision })).toThrow();
    expect(capture).not.toHaveBeenCalled();
  });
  it("keeps an observed same-head actor failure retired even after exact source restoration", async () => {
    const directory = mkdtempSync(join(tmpdir(), "recorded-style-retirement-")); directories.push(directory);
    const f = await fixture(false, false, false, join(directory, "tabiya.sqlite"));
    const result = f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision: f.decision });
    expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
    expect(readRecordedStyleOccurrence(result.occurrence).image.actorClass).toBe("learner");
    const before = f.storage.longitudinalSourceImageV4(f.run.id, f.run.events.length);
    const beforeDigest = f.storage.longitudinalSourceDigestV4(before), bytes = JSON.stringify(f.storage.read(f.run.id));
    const session = new LiveSessionService(f.storage, { runService: f.service, now: () => at }).create(principal,
      { runId: f.run.id, kind: "stream", title: "Same-head journal mutation" });
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(bytes);
    expect(() => f.service.readFoundationRecordedDecision(f.decision)).not.toThrow();
    expect(() => readRecordedStyleOccurrence(result.occurrence)).toThrow(/actor|authority/u);
    // Deliberate rollback fault injection on this private temporary database. The OLD context
    // must remain retired even though a fresh context can prove the restored source image.
    const sql = new DatabaseSync(f.storage.databasePath); sqls.push(sql);
    sql.prepare("DELETE FROM live_sessions WHERE id = ?").run(session.id);
    sql.prepare("UPDATE drill_runs SET longitudinal_structure_attribution = 'single_player' WHERE id = ?").run(f.run.id);
    expect(f.storage.longitudinalSourceDigestV4(f.storage.longitudinalSourceImageV4(f.run.id, f.run.events.length))).toBe(beforeDigest);
    expect(() => f.service.readFoundationRecordedDecision(f.decision)).not.toThrow();
    expect(() => readRecordedStyleOccurrence(result.occurrence)).toThrow(/retired|actor|authority/u);
    const replacement = f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision: f.decision });
    expect(replacement.kind).toBe("available");
  });
  it("refuses a genuine wrong-position candidate before masking it as a pending decision", async () => {
    const f = await fixture(), endpoint = f.service.resolveFoundationRecordedDecision(f.prefix, f.run.activeCursor.nodeId);
    expect(f.role.payload.fen).not.toBe(f.run.nodes.at(-1)!.fen);
    expect(() => f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision: endpoint })).toThrow(/BEFORE|position|source/u);
  });
  it("refuses a crossed source before unknown actor attribution masks it", async () => {
    const f = await fixture();
    f.storage.createLearner({ id: "style-guest", handle: "style-guest", passwordHash: "!", createdAt: at });
    f.storage.grantRole(f.run.id, "style-guest", "participant", lease, at);
    const legal = invokeEvidenceValueRoute("rules.mobility.reading.legal_moves@1", { fen: f.run.nodes.at(-1)!.fen });
    const wrong = available(invokeEvidenceValueRoute("rules.mobility.reading.candidate_role@1", { position: legal, moveUci: "a7a6" }));
    expect(() => f.service.contextualizeFoundationRecordedValue(wrong, { kind: "candidate", decision: f.decision })).toThrow(/BEFORE|position|source/u);
  });
  it("does not label an actual academy teacher's proved owner move as a learner action", async () => {
    const f = await fixture(false, false, true);
    expect(f.storage.classroomMember("style-class", principal.learnerId)).toMatchObject({ memberRole: "teacher", state: "active" });
    const image = f.storage.longitudinalSourceImageV4(f.run.id, f.run.events.length);
    expect(normativeDecisions(image, f.run).some(row => row.ref.kind === "move" && row.ref.nodeId === f.run.activeCursor.nodeId)).toBe(true);
    expect(f.service.contextualizeFoundationRecordedValue(f.role, { kind: "candidate", decision: f.decision }))
      .toEqual({ kind: "unavailable", reason: "unsupported_actor_context" });
  });
  for (const black of [false, true]) for (const imported of [false, true]) {
    it(`seals original actual events, chosen/alternative and complete positions: black=${black}, imported=${imported}`, async () => {
      const f = await fixture(black, imported), saved = JSON.stringify(f.storage.read(f.run.id));
      const backfill = vi.spyOn(f.storage, "ensureRecordedClockDocument"), historical = vi.spyOn(f.storage, "longitudinalSourceImageV4");
      const rows = [
        { value: f.role, selection: { kind: "candidate", decision: f.decision } as const },
        { value: f.centre, selection: { kind: "candidate", decision: f.decision } as const },
        { value: f.queen, selection: { kind: "candidate", decision: f.decision } as const },
        { value: f.setup, selection: { kind: "position", decision: f.decision, positionPhase: "before" } as const },
        { value: f.screen, selection: { kind: "position", decision: f.decision, positionPhase: "before" } as const },
        { value: f.baseline, selection: { kind: "baseline", prefix: f.prefix } as const },
      ];
      for (const { value, selection } of rows) {
        const result = f.service.contextualizeFoundationRecordedValue(value, selection);
        expect(result.kind).toBe("available"); if (result.kind !== "available") throw Error(result.reason);
        const data = readRecordedStyleOccurrence(result.occurrence);
        expect(data.value).toBe(value);
        expect(data.image).toMatchObject({ runId: f.run.id, eventSeq: f.run.events[1]!.seq,
          eventId: `${f.run.id}:event:${f.run.events[1]!.seq}`, decisionNodeId: f.run.nodes[0]!.id,
          actorClass: imported ? "imported" : "learner", actorSide: f.side, decisionClass: imported ? "game" : "played",
          sourceProjection: value.projection, sourceReceiptDigest: evidenceDigest(evidenceValueReceipt(value)) });
        expect(() => readContextualFoundationOccurrence(result.occurrence)).toThrow(/clock/u);
        expect(() => readRecordedStyleOccurrence({ ...result.occurrence })).toThrow();
        if (selection.kind === "candidate") expect(data.image.subject).toEqual({ kind: "legal_candidate",
          candidateUci: value === f.centre ? f.pawn.payload.moveUci : f.move, chosenUci: f.move,
          disposition: value === f.centre ? "alternative" : "chosen" });
        if (selection.kind === "position") expect(data.image.subject).toEqual({ kind: "actual_position", positionPhase: "before", positionNodeId: f.run.nodes[0]!.id });
        if (selection.kind === "baseline") expect(data.image.subject).toEqual({ kind: "first_decision_baseline", firstDecisionNodeId: f.run.nodes[0]!.id, sourcePly: 0, side: f.side });
      }
      expect(f.setup.payload.setups).toHaveLength(4); expect(f.screen.payload.screens).toHaveLength(4);
      expect(backfill).not.toHaveBeenCalled(); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(saved);
      if (imported) expect(historical).not.toHaveBeenCalled(); else expect(historical).toHaveBeenCalled();
    });
  }
});
