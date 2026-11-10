import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { commitMove, fork } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readRecordedClockSource, type RecordedClockSource } from "../../../packages/runtime/src/recorded-clock-source.js";
import { readFoundationRecordedDecision } from "../../../packages/runtime/src/recorded-foundation-source.js";
import { recordedClockUseOperands } from "../../../packages/runtime/src/recorded-clock-operands.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { declareEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import { readRecordedClockInvocation } from "../../../packages/runtime/src/evidence-factories.js";
import { contextualizeImportedClockDecision, readContextualFoundationOccurrence, readRecordedStyleOccurrence, type ContextualFoundationOccurrence } from "../../../packages/runtime/src/recorded-foundation-occurrence.js";
import { RecordedClockSourceOwner, recordedClockOperation } from "./recorded-clock-operation.js";
import { consumeRecordedClockEvidence, preflightRecordedClockConsumer } from "../../../packages/runtime/src/recorded-clock-review.js";
import { parseRecordedClockReading, parseRecordedClockDecision, recordedClockTime } from "../../../packages/runtime/src/recorded-clock-presentation.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { parsePresentationReceipt } from "../../../packages/runtime/src/presentation-contract.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const AT = "2026-11-05T00:00:00.000Z", principal = { learnerId: "clock-owner", handle: "clock-owner" };
const lease = { learnerId: principal.learnerId, writerId: "clock-writer" };
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const PGN = '[TimeControl "300+2"]\n\n1. e4 {[%clk 0:04:59]} e5 {[%clk 0:04:57]} 2. Nf3 {[%clk 0:04:58]} Nc6 3. Bb5 {[%clk 0:04:56]} a6 {[%clk 0:04:54]} *';
const stores: SQLiteRunStorage[] = [], sqls: DatabaseSync[] = [], directories: string[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const sql of sqls.splice(0)) sql.close(); for (const storage of stores.splice(0)) storage.close(); for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
async function fixture(pgn = PGN, side: "white" | "black" = "white") {
  const dir = mkdtempSync(join(tmpdir(), "clock-source-")); directories.push(dir);
  const file = join(dir, "tabiya.sqlite"), storage = new SQLiteRunStorage(file, { onMigration: () => {}, now: () => AT }); stores.push(storage);
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: AT });
  const result = await new RunService(storage).importGame({ id: "original-clock", side, source: { kind: "pgn", pgn }, opponentPolicy: { mode: "human_common" }, policyConfig, seed: 1, createdAt: AT }, lease);
  const sql = new DatabaseSync(file); sqls.push(sql);
  const owner = new RecordedClockSourceOwner(storage), abort = new AbortController();
  const query = (ply: number, branchId = result.run.branches[0]!.id) => ({ runId: result.run.id, branchId, nodeId: result.run.nodes[ply]!.id });
  const source = (ply: number) => {
    const resolved = owner.resolve(query(ply), principal, abort.signal);
    if (resolved.kind !== "available") throw new Error(resolved.reason);
    return resolved.source;
  };
  return { ...result, file, storage, sql, owner, abort, query, source };
}

describe("actual original clock authority and registered source factories", () => {
  it("consumes only exact original occurrences into two bounded source-specific clock statements", async () => {
    const f = await fixture(PGN, "black"), collect = recordedClockOperation(f.storage);
    for (const ply of [1, 2, 3, 4, 5, 6]) {
      const original = collect(f.query(ply), principal, f.abort.signal);
      if (original.kind !== "available") throw new Error(original.reason);
      const page = consumeRecordedClockEvidence(original), items = parsePresentationReceipt(JSON.parse(JSON.stringify(page.presentation)));
      expect(page.reading.value.subject.sourcePly).toBe(ply);
      expect(items).toHaveLength(original.decision.kind === "available" ? 2 : 1);
      expect(items[0]!.component).toMatchObject({ id: "fact_statement", operand: { rendererId: "review.clock_remaining@1", binding: "recorded_run" } });
      if (page.use.kind === "available") {
        if (original.decision.kind !== "available") throw new Error("Clock use requires its original occurrence");
        const occurrence = original.decision.occurrence;
        expect(() => readRecordedStyleOccurrence(occurrence)).toThrow(/recorded-style/u);
        expect(page.use.value.actor).toEqual({ kind: "imported", side: ply % 2 ? "white" : "black" });
        expect(items[1]!.component).toMatchObject({ id: "fact_statement", operand: { rendererId: "review.clock_used@1", convention: "clock-spend-input@1" } });
      }
      if (ply === 4) expect(page.use).toEqual({ kind: "unavailable", reason: "current_sample_unavailable" });
      if (ply === 6) expect(page.use).toEqual({ kind: "unavailable", reason: "previous_same_side_sample_unavailable" });
    }
    const value = collect(f.query(1), principal, f.abort.signal);
    if (value.kind !== "available" || value.decision.kind !== "available") throw new Error("clock fixture");
    const bare = readContextualFoundationOccurrence(value.decision.occurrence).value;
    expect(() => consumeRecordedClockEvidence({ ...value, decision: { kind: "available", value: bare } } as never)).toThrow();
    expect(() => consumeRecordedClockEvidence({ ...value, decision: { kind: "unavailable", reason: "control_absent" } })).toThrow(/actual original/);
    f.abort.abort(); expect(() => consumeRecordedClockEvidence(value)).toThrow();
  });

  it("refuses incomplete or disabled consumer images before a collector can be used", () => {
    const manifest = PRIMARY_EVIDENCE_MANIFEST;
    expect(() => preflightRecordedClockConsumer()).not.toThrow();
    expect(() => preflightRecordedClockConsumer({ ...manifest, consumers: manifest.consumers.filter(row => row.id !== "review.recorded_clock") })).toThrow();
    expect(() => preflightRecordedClockConsumer({ ...manifest, bindings: manifest.bindings.filter(row => row.consumer.id !== "review.recorded_clock" || row.projection.id !== "run.record.clock_decision") })).toThrow();
    expect(() => preflightRecordedClockConsumer({ ...manifest, consumers: manifest.consumers.map(row => row.id === "review.recorded_clock" ? { ...row, disposition: { kind: "retired", reason: "test disabled" } } : row) })).toThrow(/disabled/);
  });

  it("strict clock operands refuse aliases, hidden fields, crossed subjects and impossible arithmetic", async () => {
    const f = await fixture(), result = recordedClockOperation(f.storage)(f.query(1), principal, f.abort.signal);
    if (result.kind !== "available" || result.decision.kind !== "available") throw new Error("clock fixture");
    const reading = result.reading.payload, decision = readContextualFoundationOccurrence(result.decision.occurrence).value.payload;
    expect(parseRecordedClockReading(JSON.parse(JSON.stringify(reading)), "fixture")).toEqual(reading);
    expect(parseRecordedClockDecision(JSON.parse(JSON.stringify(decision)), "fixture")).toEqual(decision);
    expect(recordedClockTime(0)).toBe("0:00:00.000"); expect(recordedClockTime(123)).toBe("0:00:00.123");
    for (const sample of [{ kind: "available", sample: { ...reading.sample.kind === "available" ? reading.sample.sample : {}, remainingMs: -1 } },
      { kind: "no_retained_sample", remainingMs: 0 }, { kind: "unknown_historical_retention" }]) expect(() => parseRecordedClockReading({ ...reading, sample }, "mutant")).toThrow();
    for (const value of [{ ...decision, clockUsedMs: decision.clockUsedMs + 1 }, { ...decision, actor: { kind: "learner", side: "white" } },
      { ...decision, subject: { ...decision.subject, sourcePly: 2 } }, { ...decision, availableMs: Number.MAX_SAFE_INTEGER + 1 },
      { ...decision, control: { ...decision.control, canonical: "300+3" } }, { ...decision, phase: { ...decision.phase, phase: "endgame" } }]) expect(() => parseRecordedClockDecision(value, "mutant")).toThrow();
    for (const value of [Object.create(reading), Object.defineProperty({ ...reading }, "hidden", { value: 1 }),
      { ...reading, subject: Object.create(reading.subject) }]) expect(() => parseRecordedClockReading(value, "nonplain")).toThrow();
  });

  it("the actual authorized operation collects real values and changes no run/cursor/events or providers", async () => {
    const f = await fixture(), collect = recordedClockOperation(f.storage), before = JSON.stringify(f.storage.read(f.run.id)!.run);
    const databaseRows = () => f.storage.applicationTableNames().map(name => [name, f.sql.prepare(`SELECT * FROM "${name}"`).all()]);
    const beforeRows = databaseRows();
    const result = collect(f.query(1), principal, f.abort.signal);
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error(result.reason);
    expect(result.reading.payload.sample).toMatchObject({ kind: "available", sample: { sourcePly: 1, remainingMs: 299000 } });
    expect(result.decision.kind).toBe("available");
    if (result.decision.kind !== "available") throw new Error(result.decision.reason);
    expect(readContextualFoundationOccurrence(result.decision.occurrence).value.payload).toMatchObject({ actor: { kind: "imported", side: "white" }, clockUsedMs: 3000 });
    expect(readRecordedClockInvocation(result.reading)).toHaveProperty("source");
    expect(JSON.stringify(f.storage.read(f.run.id)!.run)).toBe(before);
    expect(collect(f.query(0), principal, f.abort.signal)).toEqual({ kind: "unavailable", reason: "missing_context" });
    expect(databaseRows()).toEqual(beforeRows);
  });

  it("seals imported/game actor occurrences to exact post-mint source receipt and original event/parent decision", async () => {
    const f = await fixture(PGN, "black"), result = recordedClockOperation(f.storage)(f.query(1), principal, f.abort.signal);
    if (result.kind !== "available" || result.decision.kind !== "available") throw new Error("genuine original clock decision required");
    const occurrence = result.decision.occurrence, data = readContextualFoundationOccurrence(occurrence);
    expect(data.image).toMatchObject({ runId: f.run.id, actorClass: "imported", actorSide: "white", decisionClass: "game",
      decisionNodeId: f.run.nodes[0]!.id, eventSeq: data.value.payload.decision.eventSeq,
      sourceProjection: { id: "run.record.clock_decision", version: 1 }, sourceReceiptDigest: evidenceDigest(evidenceValueReceipt(data.value)) });
    expect(data.image.eventHead).toEqual(data.value.payload.subject.eventHead);
    expect(data.image.eventId).toBe(`${f.run.id}:event:${data.value.payload.decision.eventSeq}`);
    for (const changes of [{ actorClass: "learner" }, { actorSide: "black" }, { decisionClass: "played" },
      { decisionId: "other" }, { eventHead: { seq: 0, digest: "wrong" } }, { sourceProjection: { id: "run.record.clock_reading", version: 1 } }, { sourceReceiptDigest: "wrong" }]) {
      expect(() => readContextualFoundationOccurrence({ ...occurrence, image: { ...data.image, ...changes } } as unknown as ContextualFoundationOccurrence)).toThrow();
    }
    expect(() => Object.assign(data.image, { actorClass: "learner" })).toThrow();
    expect(() => contextualizeImportedClockDecision(result.reading as never)).toThrow(/decision factory/);
    const value = data.value, r = evidenceValueReceipt(value);
    const resealed = declareEvidence(value.producer, value.projection, value.payload, { factory: r.factory, inputDigest: r.inputDigest, sourceDigests: r.sourceDigests, convention: r.convention! });
    expect(() => contextualizeImportedClockDecision(resealed)).toThrow(/original factory/);
    f.abort.abort();
    expect(() => readContextualFoundationOccurrence(occurrence)).toThrow();
    expect(() => contextualizeImportedClockDecision(value)).toThrow();
  });

  it("mints actual reading/decision factories with exact private image and genuine before-phase ancestry", async () => {
    const f = await fixture(), source = f.source(1), a = f.owner.read(source).authority;
    const phase = invokeEvidenceValueRoute("rules.phase.reading@2", { fen: a.original.beforeFen });
    const reading = invokeEvidenceValueRoute("run.record.clock_reading@1", { source });
    const decision = invokeEvidenceValueRoute("run.record.clock_decision@1", { source, phase });
    expect(reading.payload).toMatchObject({ sample: { kind: "available", sample: { remainingMs: 299000 } }, control: { canonical: "300+2" } });
    expect(evidenceValueReceipt(reading).inputDigest).toBe(evidenceDigest({ clock: a }));
    expect(evidenceValueReceipt(reading).sourceDigests).toEqual([]);
    expect(decision.kind).toBe("available");
    if (decision.kind !== "available") throw new Error(decision.reason);
    expect(decision.value.payload).toMatchObject({ actor: { kind: "imported", side: "white" }, decision: { nodeId: f.run.nodes[0]!.id, rootedIndex: 0 },
      phase: phase.payload, availableMs: 302000, clockUsedMs: 3000 });
    expect(evidenceValueReceipt(decision.value).inputDigest).toBe(evidenceDigest({ clock: a, phase: evidenceValueReceipt(phase).payloadDigest }));
    expect(evidenceValueReceipt(decision.value).sourceDigests).toEqual([evidenceValueReceipt(phase).payloadDigest]);
    expect(evidenceValueReceipt(decision.value).convention?.refs).toEqual([{ id: "clock-spend-input", version: 1 }, { id: "phase-bands", version: 1 }]);
    expect(readRecordedClockInvocation(decision.value)).toEqual({ source, phase });
    expect(readRecordedClockInvocation(reading)).toEqual({ source });
  });

  it("the reading factory keeps genuine complete empty frames; decision checks original phase before abstaining", async () => {
    const f = await fixture("1. e4 *"), source = f.source(1), a = f.owner.read(source).authority;
    const phase = invokeEvidenceValueRoute("rules.phase.reading@2", { fen: a.original.beforeFen });
    expect(invokeEvidenceValueRoute("run.record.clock_reading@1", { source }).payload).toMatchObject({ sample: { kind: "no_retained_sample" }, control: { kind: "absent" } });
    expect(invokeEvidenceValueRoute("run.record.clock_decision@1", { source, phase })).toEqual({ kind: "unavailable", reason: "current_sample_unavailable" });
    const wrong = invokeEvidenceValueRoute("rules.phase.reading@2", { fen: a.original.afterFen });
    expect(() => invokeEvidenceValueRoute("run.record.clock_decision@1", { source, phase: wrong })).toThrow(/BEFORE/);
    const receipt = evidenceValueReceipt(phase);
    const resealed = declareEvidence(phase.producer, phase.projection, phase.payload, { factory: receipt.factory, inputDigest: receipt.inputDigest, sourceDigests: receipt.sourceDigests, convention: receipt.convention! });
    expect(evidenceValueReceipt(resealed).payloadDigest).toBe(receipt.payloadDigest);
    expect(() => invokeEvidenceValueRoute("run.record.clock_decision@1", { source, phase: resealed })).toThrow();
  });

  it("refuses injected operands, token/value copies and retired inputs before available or empty mint", async () => {
    const f = await fixture(), source = f.source(1), a = f.owner.read(source).authority;
    const phase = invokeEvidenceValueRoute("rules.phase.reading@2", { fen: a.original.beforeFen });
    expect(() => invokeEvidenceValueRoute("run.record.clock_reading@1", { source: { ...source } } as never)).toThrow();
    expect(() => invokeEvidenceValueRoute("run.record.clock_decision@1", { source, phase, currentMs: 0 } as never)).toThrow();
    const reading = invokeEvidenceValueRoute("run.record.clock_reading@1", { source }), r = evidenceValueReceipt(reading);
    const copy: DeclaredEvidence<unknown> = declareEvidence(reading.producer, reading.projection, reading.payload, { factory: r.factory, inputDigest: r.inputDigest, sourceDigests: r.sourceDigests, ...(r.convention === undefined ? {} : { convention: r.convention }) });
    expect(() => readRecordedClockInvocation(copy)).toThrow(/original factory/);
    f.abort.abort();
    expect(() => readRecordedClockInvocation(reading)).toThrow();
    expect(() => invokeEvidenceValueRoute("run.record.clock_decision@1", { source, phase })).toThrow();
  });

  it("computes exact recorded use for first White/Black and adjacent samples, including real zero", async () => {
    const f = await fixture();
    for (const [ply, expected] of [[1, 3000], [2, 5000], [3, 3000], [5, 4000]] as const) {
      const value = recordedClockUseOperands(f.source(ply));
      expect(value.kind).toBe("available");
      if (value.kind === "available") {
        expect(value.value.clockUsedMs).toBe(expected);
        expect(value.value.availableMs - value.value.current.remainingMs).toBe(expected);
        expect(value.value.previous.kind).toBe(ply <= 2 ? "initial_base" : "sample");
      }
    }
    const zero = await fixture('[TimeControl "300+2"]\n\n1. e4 {[%clk 0:05:02]} *');
    expect(recordedClockUseOperands(zero.source(1))).toMatchObject({ kind: "available", value: { availableMs: 302000, clockUsedMs: 0 } });
  });

  it.each([
    ['1. e4 *', 1, "current_sample_unavailable"],
    ['1. e4 {[%clk 0:00:01]} *', 1, "control_absent"],
    ['[TimeControl "0+0"]\n\n1. e4 {[%clk 0:00:01]} *', 1, "control_invalid"],
    ['[TimeControl "40/7200:3600"]\n\n1. e4 {[%clk 0:00:01]} *', 1, "control_unsupported"],
    ['[Variant "From Position"]\n' + PGN, 1, "initial_base_unproven"],
    [PGN, 6, "previous_same_side_sample_unavailable"],
    ['[TimeControl "300+0"]\n\n1. e4 {[%clk 0:00:00]} e5 2. Nf3 {[%clk 0:00:00]} *', 3, "nonpositive_available"],
    ['[TimeControl "300+0"]\n\n1. e4 {[%clk 0:00:01]} e5 2. Nf3 {[%clk 0:00:02]} *', 3, "current_exceeds_available"],
  ] as const)("abstains honestly on %s at original ply %i", async (pgn, ply, reason) => {
    const f = await fixture(pgn);
    expect(recordedClockUseOperands(f.source(ply))).toEqual({ kind: "unavailable", reason });
  });

  it("refuses unsafe available arithmetic over genuine maximum-safe clock samples", async () => {
    const ms = BigInt(Number.MAX_SAFE_INTEGER), hours = ms / 3600000n, minutes = (ms / 60000n) % 60n, seconds = (ms / 1000n) % 60n;
    const token = `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(ms % 1000n).padStart(3, "0")}`;
    const f = await fixture(`[TimeControl "1+1"]\n\n1. e4 {[%clk ${token}]} e5 2. Nf3 {[%clk 0:00:00]} *`);
    expect(f.owner.read(f.source(3)).authority.previous?.remainingMs).toBe(Number.MAX_SAFE_INTEGER);
    expect(recordedClockUseOperands(f.source(3))).toEqual({ kind: "unavailable", reason: "unsafe_arithmetic" });
  });

  it("uses adjacent recorded pairs at a custom Black-to-move root while refusing initial base", async () => {
    const f = await fixture('[SetUp "1"]\n[FEN "7k/7p/8/8/8/8/8/K7 b - - 0 87"]\n[TimeControl "60+1"]\n\n87... Kg8 {[%clk 0:01:00]} 88. Kb1 h6 {[%clk 0:00:59]} *');
    expect(recordedClockUseOperands(f.source(1))).toEqual({ kind: "unavailable", reason: "initial_base_unproven" });
    expect(recordedClockUseOperands(f.source(3))).toMatchObject({ kind: "available", value: { availableMs: 61000, clockUsedMs: 2000,
      previous: { kind: "sample", sample: { sourcePly: 1, side: "black", moveUci: "h8g8" } } } });
  });

  it.each(["white", "black"] as const)("binds both original movers independently of selected side %s and uses the incoming move's parent decision", async side => {
    const f = await fixture(PGN, side), before = JSON.stringify(f.storage.read(f.run.id)!.run);
    for (const ply of [1, 2]) {
      const value = f.owner.read(f.source(ply)), d = readFoundationRecordedDecision(value.decision).authority;
      expect(value.authority.subject).toMatchObject({ runId: f.run.id, branchId: f.run.branches[0]!.id, nodeId: f.run.nodes[ply]!.id, sourceNodeId: f.run.nodes[ply]!.id, sourcePly: ply });
      expect(value.authority.original).toMatchObject({ beforeNodeId: f.run.nodes[ply - 1]!.id, beforeFen: f.run.nodes[ply - 1]!.fen,
        moveUci: f.run.nodes[ply]!.moveUci, side: ply === 1 ? "white" : "black", decisionIndex: ply - 1 });
      expect(d.selected.nodeId).toBe(f.run.nodes[ply - 1]!.id);
      expect(d.selected.sourcePly).toBe(ply - 1);
      expect(value.authority.sample.kind).toBe("available");
      expect(value.authority.control).toEqual({ kind: "supported", baseMs: 300000, incrementMs: 2000, canonical: "300+2" });
      expect(value.authority.initialBaseEligible).toBe(true);
      expect(value.authority.previous).toBeNull();
    }
    expect(JSON.stringify(f.storage.read(f.run.id)!.run)).toBe(before);
  });

  it("retains only the adjacent same-side sample; an older tag cannot bridge a gap", async () => {
    const f = await fixture();
    expect(f.owner.read(f.source(5)).authority.previous).toEqual({ sourcePly: 3, side: "white", moveUci: "g1f3", remainingMs: 298000 });
    expect(f.owner.read(f.source(6)).authority.previous).toBeNull();
    expect(f.owner.read(f.source(6)).authority.sample).toMatchObject({ kind: "available", sample: { sourcePly: 6, remainingMs: 294000 } });
    expect(f.owner.read(f.source(6)).authority.initialBaseEligible).toBe(false);
  });

  it("keeps complete missing/invalid/unknown samples separate from absent control", async () => {
    const f = await fixture('1. e4 {[%clk bad]} e5 *');
    expect(f.owner.read(f.source(1)).authority).toMatchObject({ sample: { kind: "invalid_or_duplicate_sample", issue: { sourcePly: 1, reason: "invalid_clock" } }, control: { kind: "absent" } });
    expect(f.owner.read(f.source(2)).authority.sample).toEqual({ kind: "no_retained_sample" });
    f.sql.exec("UPDATE imported_games SET clock_document_json=NULL");
    expect(f.owner.read(f.source(2)).authority.sample).toEqual({ kind: "unknown_historical_retention" });
  });

  it("does not license initial base at a setup root even when its FEN equals the standard initial board", async () => {
    const f = await fixture('[SetUp "1"]\n[FEN "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"]\n[TimeControl "300+2"]\n\n1. e4 {[%clk 0:04:59]} *');
    expect(f.owner.read(f.source(1)).authority).toMatchObject({ initialBaseEligible: false,
      initialStart: { setupHeader: "1", fenHeader: f.run.start.fen, rootFen: f.run.start.fen } });
  });

  it("D4127 From Position declaration cannot establish initial-game base, while explicit Standard can", async () => {
    const fromPosition = await fixture('[Variant "From Position"]\n' + PGN);
    const unknownStart = fromPosition.owner.read(fromPosition.source(1)).authority;
    expect(unknownStart.sample.kind).toBe("available");
    expect(unknownStart.control.kind).toBe("supported");
    expect(unknownStart.initialBaseEligible).toBe(false);
    const standard = await fixture('[Variant "Standard"]\n' + PGN);
    expect(standard.owner.read(standard.source(1)).authority.initialBaseEligible).toBe(true);
  });

  it("refuses arbitrary selection/principal/signal operands and unauthorized acquisition", async () => {
    const f = await fixture(), read = vi.spyOn(f.storage, "read"), ensure = vi.spyOn(f.storage, "ensureRecordedClockDocument"), record = vi.spyOn(f.storage, "importedGame");
    expect(() => f.owner.resolve({ ...f.query(1), fen: f.run.nodes[0]!.fen } as never, principal, f.abort.signal)).toThrow();
    expect(() => f.owner.resolve(f.query(1), { ...principal, side: "white" } as never, f.abort.signal)).toThrow();
    expect(() => f.owner.resolve(f.query(1), principal, { throwIfAborted() {} } as never)).toThrow();
    expect(read).not.toHaveBeenCalled();
    expect(() => f.owner.resolve(f.query(1), { learnerId: "outsider", handle: "outsider" }, f.abort.signal)).toThrow();
    expect(ensure).not.toHaveBeenCalled(); expect(record).not.toHaveBeenCalled();
  });

  it("root and equal-FEN alternative have no incoming original sample; genuine inherited original ancestors survive", async () => {
    const f = await fixture();
    expect(f.owner.resolve(f.query(0), principal, f.abort.signal)).toEqual({ kind: "unavailable", reason: "missing_context" });
    const forked = fork(f.run, f.run.nodes[1]!.id, { label: "repeat", at: AT }).run;
    const alternate = commitMove(forked, "e7e5", { at: AT }).run;
    f.storage.save(alternate, lease);
    const branchId = alternate.activeCursor.branchId;
    expect(alternate.nodes.at(-1)!.fen).toBe(f.run.nodes[2]!.fen);
    expect(f.owner.resolve({ runId: f.run.id, branchId, nodeId: alternate.activeCursor.nodeId }, principal, f.abort.signal)).toEqual({ kind: "unavailable", reason: "missing_context" });
    const inherited = f.owner.resolve(f.query(1, branchId), principal, f.abort.signal);
    expect(inherited.kind).toBe("available");
    if (inherited.kind === "available") expect(f.owner.read(inherited.source).authority.subject.sourcePly).toBe(1);
  });

  it("rejects token copies, foreign owner adoption and mutation of the retained numeric image", async () => {
    const f = await fixture(), source = f.source(1), data = f.owner.read(source);
    for (const forged of [{ ...source }, JSON.parse(JSON.stringify(source)), { authority: data.authority }]) expect(() => readRecordedClockSource(forged as RecordedClockSource)).toThrow();
    expect(() => new RecordedClockSourceOwner(f.storage).read(source)).toThrow(/different owner/);
    expect(() => Object.assign(data.authority.original, { side: "black" })).toThrow();
    expect(f.owner.read(source).authority.original.side).toBe("white");
  });

  it("D4128 rechecks full clock source after nested original-prefix reads and keeps retirement sticky", async () => {
    const f = await fixture(), source = f.source(1), original = f.storage.importedGame.bind(f.storage);
    let reads = 0, mutations = 0;
    const intercepted = vi.spyOn(f.storage, "importedGame").mockImplementation(id => {
      const record = original(id);
      // First clock-owner check reads prefix, decision and full record; the next actual
      // SQL getter belongs to a nested foundation check that owns only the narrow import image.
      if (++reads === 4) {
        f.sql.prepare("UPDATE imported_games SET headers_json=?").run(JSON.stringify({ ...f.importRecord.headers, TimeControl: "600+2" }));
        mutations++;
      }
      return record;
    });
    expect(() => f.owner.read(source)).toThrow();
    expect(mutations).toBe(1);
    intercepted.mockRestore();
    f.sql.prepare("UPDATE imported_games SET headers_json=?").run(JSON.stringify(f.importRecord.headers));
    expect(() => f.owner.read(source)).toThrow(/retired/);
  });

  it.each(["abort", "run", "import", "account", "role"] as const)("permanently retires capture after observed %s change", async change => {
    const f = await fixture(), viewer = { learnerId: "clock-viewer", handle: "clock-viewer" };
    f.storage.createLearner({ id: viewer.learnerId, handle: viewer.handle, passwordHash: "!", createdAt: AT });
    if (change === "role") f.storage.grantRole(f.run.id, viewer.learnerId, "spectator", lease, AT);
    const subject = change === "role" ? viewer : principal;
    const resolved = f.owner.resolve(f.query(1), subject, f.abort.signal);
    if (resolved.kind !== "available") throw new Error(resolved.reason);
    const source = resolved.source;
    if (change === "abort") f.abort.abort();
    if (change === "run") f.storage.save(fork(f.run, f.run.nodes[0]!.id, { label: "later", at: AT }).run, lease);
    if (change === "import") f.sql.prepare("UPDATE imported_games SET headers_json=?").run(JSON.stringify({ ...f.importRecord.headers, TimeControl: "600+2" }));
    if (change === "account") f.storage.deleteLearner(principal.learnerId, AT);
    if (change === "role") f.storage.revokeGrant(f.run.id, viewer.learnerId, lease);
    expect(() => f.owner.read(source)).toThrow();
    if (change === "role") f.storage.grantRole(f.run.id, viewer.learnerId, "spectator", lease, AT);
    if (change === "import") f.sql.prepare("UPDATE imported_games SET headers_json=?").run(JSON.stringify(f.importRecord.headers));
    expect(() => f.owner.read(source)).toThrow(/retired/);
  });
});
