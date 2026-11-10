// Recorded-clocks §6: closed delivery operands, never a source/actor issuer.
import { parseUci } from "chessops/util";
import { positionFromFen, canonicalFen } from "./chess.js";
import { evidenceDigest } from "./evidence-contract.js";
import { phaseBandReading, type PhaseBandReadingV2 } from "./phase.js";
import { parseDeclaredTimeControl, type ParsedTimeControl } from "./recorded-clocks.js";
import type { RecordedClockReading, RecordedClockDecision } from "./recorded-clock-operands.js";
import type { ComponentValue, PresentedEvidenceRef } from "./presentation-contract.js";
import { PresentationSchemaError, s, side, type Parser } from "./presentation-schema.js";

const fail = (message: string): never => { throw new PresentationSchemaError(`Recorded clock ${message}`); };
const positive: Parser<number> = (input, label) => { const n = s.nat(input, label); return n > 0 ? n : fail(`${label} must be positive`); };
export const recordedClockSubjectSchema = s.obj({ runId: s.str, branchId: s.str, nodeId: s.str, sourceNodeId: s.str,
  sourcePly: positive, eventHead: s.obj({ seq: positive, digest: s.digest }) });
const originalSchema = s.obj({ beforeNodeId: s.str, beforeFen: s.str, afterFen: s.str, moveUci: s.uci,
  side: s.color, eventSeq: positive, decisionIndex: s.nat });
const sampleSchema = s.obj({ sourcePly: positive, side: s.color, moveUci: s.uci, remainingMs: s.nat });
const sampleStateSchema = s.union("kind", {
  available: s.obj({ kind: s.lit("available"), sample: sampleSchema }),
  no_retained_sample: s.obj({ kind: s.lit("no_retained_sample") }),
  unknown_historical_retention: s.obj({ kind: s.lit("unknown_historical_retention") }),
  invalid_or_duplicate_sample: s.obj({ kind: s.lit("invalid_or_duplicate_sample"),
    issue: s.obj({ sourcePly: positive, reason: s.lit("invalid_clock", "duplicate_clock", "unsupported_precision", "unsafe_operand") }) }),
});
const controlSchema = s.union("kind", {
  supported: s.obj({ kind: s.lit("supported"), baseMs: s.nat, incrementMs: s.nat, canonical: s.str }),
  absent: s.obj({ kind: s.lit("absent") }),
  invalid: s.obj({ kind: s.lit("invalid"), reason: s.lit("syntax", "unsafe_operand", "nonpositive_budget") }),
  unsupported: s.obj({ kind: s.lit("unsupported"), reason: s.lit("unknown", "unlimited", "staged_or_other") }),
});
export const parseRecordedClockControl: Parser<ParsedTimeControl> = (input, label) => {
  const control = controlSchema(input, label);
  if (control.kind === "supported" && evidenceDigest(parseDeclaredTimeControl(control.canonical)) !== evidenceDigest(control)) return fail("declared control has inconsistent units/canonical operands");
  return control;
};

// JSON delivery must not borrow inherited fields, invoke getters, hide extra keys or contain holes.
// This checks data grammar only; it cannot reproduce the server-private source/occurrence seal.
export function assertClockDeliveryData(input: unknown, active = new WeakSet<object>()): void {
  if (input === null) return;
  if (typeof input !== "object") {
    if (!["string", "number", "boolean"].includes(typeof input) || typeof input === "number" && !Number.isFinite(input)) fail("contains non-JSON data");
    return;
  }
  const array = Array.isArray(input);
  if (Object.getPrototypeOf(input) !== (array ? Array.prototype : Object.prototype) || active.has(input)) fail("contains nonplain or cyclic data");
  active.add(input);
  try {
    if (array && Reflect.ownKeys(input).length !== input.length + 1) fail("array has extra keys or holes");
    for (const key of Reflect.ownKeys(input)) {
      const field = Object.getOwnPropertyDescriptor(input, key)!;
      if (typeof key !== "string" || !("value" in field) || !field.enumerable && !(array && key === "length")) fail("contains a hidden/inherited/accessor field");
      assertClockDeliveryData(field.value, active);
    }
    if (array) for (let i = 0; i < input.length; i++) if (!Object.hasOwn(input, i)) fail("array has a hole");
  } finally { active.delete(input); }
}
const readingSchema = s.obj({ subject: recordedClockSubjectSchema, original: originalSchema,
  retention: s.lit("extracted_before_strip", "legacy_stored_pgn"), sample: sampleStateSchema, control: parseRecordedClockControl });
export const parseRecordedClockReading: Parser<RecordedClockReading> = (input, label) => {
  assertClockDeliveryData(input);
  const value = readingSchema(input, label), { subject, original } = value;
  if (subject.nodeId !== subject.sourceNodeId || original.beforeNodeId === subject.nodeId
    || original.eventSeq > subject.eventHead.seq || original.decisionIndex !== subject.sourcePly - 1) return fail("reading crosses its original node/event/decision");
  const before = positionFromFen(original.beforeFen), after = positionFromFen(original.afterFen), move = parseUci(original.moveUci);
  if (canonicalFen(before) !== original.beforeFen || canonicalFen(after) !== original.afterFen || before.turn !== original.side
    || move === undefined || !before.isLegal(move)) return fail("original move is not legal at its exact parent");
  before.play(move);
  if (canonicalFen(before) !== original.afterFen) return fail("original move does not reach the selected node");
  if (value.sample.kind === "available" && (value.sample.sample.sourcePly !== subject.sourcePly
    || value.sample.sample.side !== original.side || value.sample.sample.moveUci !== original.moveUci)) return fail("sample crosses the selected incoming move");
  if (value.sample.kind === "invalid_or_duplicate_sample" && value.sample.issue.sourcePly !== subject.sourcePly) return fail("issue crosses its original ply");
  if (value.sample.kind === "unknown_historical_retention" && value.retention !== "legacy_stored_pgn"
    || value.sample.kind === "no_retained_sample" && value.retention !== "extracted_before_strip") return fail("retention and examined/unknown sample states disagree");
  return value;
};

const initialProofSchema = s.obj({ rootFen: s.str, setupHeader: s.nullable(s.str), fenHeader: s.nullable(s.str), variantHeader: s.nullable(s.str) });
const previousSchema = s.union("kind", {
  sample: s.obj({ kind: s.lit("sample"), nodeId: s.str, sample: sampleSchema }),
  initial_base: s.obj({ kind: s.lit("initial_base"), nodeId: s.str, sourcePly: s.lit(0), remainingMs: s.nat, proof: initialProofSchema }),
});
const phaseSchema: Parser<PhaseBandReadingV2> = (input, _label) => {
  if (input === null || typeof input !== "object" || !("fen" in input) || typeof input.fen !== "string") return fail("phase has no before FEN");
  const expected = phaseBandReading(input.fen);
  if (evidenceDigest(input) !== evidenceDigest(expected)) return fail("phase differs from its complete declared operands");
  return expected;
};
const decisionSchema = s.obj({ subject: recordedClockSubjectSchema, actor: s.obj({ kind: s.lit("imported"), side: s.color }),
  decision: s.obj({ nodeId: s.str, rootedIndex: s.nat, eventSeq: positive, moveUci: s.uci, beforeFen: s.str }),
  phase: phaseSchema, current: sampleSchema, previous: previousSchema, control: parseRecordedClockControl,
  availableMs: positive, clockUsedMs: s.nat });
export const parseRecordedClockDecision: Parser<RecordedClockDecision> = (input, label) => {
  assertClockDeliveryData(input);
  const value = decisionSchema(input, label), { subject, current, previous, decision, actor, control } = value;
  if (control.kind !== "supported") return fail("available clock use has no supported control");
  if (subject.nodeId !== subject.sourceNodeId || decision.nodeId === subject.nodeId || previous.nodeId === subject.nodeId
    || decision.rootedIndex !== subject.sourcePly - 1 || decision.eventSeq > subject.eventHead.seq
    || current.sourcePly !== subject.sourcePly || current.side !== actor.side || current.moveUci !== decision.moveUci
    || positionFromFen(decision.beforeFen).turn !== actor.side || value.phase.fen !== decision.beforeFen) return fail("decision crosses its original actor/parent/phase/sample");
  const pos = positionFromFen(decision.beforeFen), move = parseUci(decision.moveUci);
  if (canonicalFen(pos) !== decision.beforeFen || move === undefined || !pos.isLegal(move)) return fail("decision move is not legal at its original parent");
  if (previous.kind === "sample") {
    if (previous.sample.sourcePly !== subject.sourcePly - 2 || previous.sample.side !== actor.side
      || previous.nodeId === decision.nodeId) return fail("previous clock is not the adjacent same-side sample");
  } else if (subject.sourcePly > 2 || previous.remainingMs !== control.baseMs
    || previous.proof.rootFen !== "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    || previous.proof.fenHeader !== null || ![null, "0"].includes(previous.proof.setupHeader)
    || ![null, "Standard"].includes(previous.proof.variantHeader)) return fail("initial clock base is unproved");
  if (previous.kind === "initial_base") {
    if (subject.sourcePly === 1 && (previous.nodeId !== decision.nodeId || decision.beforeFen !== previous.proof.rootFen || actor.side !== "white")) return fail("first decision is not its proved initial root/mover");
    if (subject.sourcePly === 2) {
      const root = positionFromFen(previous.proof.rootFen);
      let reached = false;
      for (const [from, destinations] of root.allDests()) for (const to of destinations) {
        const next = root.clone(), firstMove = { from, to }; next.play(firstMove);
        if (canonicalFen(next) === decision.beforeFen) reached = true;
      }
      if (previous.nodeId === decision.nodeId || actor.side !== "black" || !reached) return fail("second decision is not one legal move after its Standard root");
    }
  }
  const prior = previous.kind === "sample" ? previous.sample.remainingMs : previous.remainingMs;
  const available = prior + control.incrementMs;
  if (!Number.isSafeInteger(available) || available <= 0 || available !== value.availableMs
    || available - current.remainingMs !== value.clockUsedMs) return fail("clock arithmetic is impossible or unsafe");
  return value as RecordedClockDecision;
};

/** Numeric formatter retains every millisecond, including true zero; never ticks. */
export function recordedClockTime(ms: number): string {
  s.nat(ms, "clock milliseconds");
  const hours = Math.floor(ms / 3600000), minutes = Math.floor(ms % 3600000 / 60000), seconds = Math.floor(ms % 60000 / 1000), fraction = ms % 1000;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(fraction).padStart(3, "0")}`;
}
export function recordedClockRemainingSentence(value: RecordedClockReading): string {
  const who = side(value.original.side);
  const control = value.control.kind === "supported" ? ` Declared control: ${value.control.baseMs / 1000} seconds + ${value.control.incrementMs / 1000} seconds per move.`
    : value.control.kind === "absent" ? " No time control was declared."
      : value.control.kind === "invalid" ? " The declared time control is invalid."
        : " The declared time control is not supported for clock-use arithmetic.";
  let sample: string;
  switch (value.sample.kind) {
    case "available": sample = `${who}: ${recordedClockTime(value.sample.sample.remainingMs)} remaining after this move.`; break;
    case "no_retained_sample": sample = `${who}: no clock annotation supplied for this move.`; break;
    case "unknown_historical_retention": sample = `${who}: this older import does not establish whether a clock annotation was supplied.`; break;
    case "invalid_or_duplicate_sample": sample = `${who}: the clock annotation for this move is invalid or repeated.`; break;
  }
  return sample + control;
}
export function recordedClockUsedSentence(value: RecordedClockDecision): string {
  const previous = value.previous.kind === "sample" ? value.previous.sample.remainingMs : value.previous.remainingMs;
  return `${side(value.actor.side)}: recorded clock use ${recordedClockTime(value.clockUsedMs)} (previous ${recordedClockTime(previous)} + increment ${recordedClockTime(value.control.incrementMs)} − remaining ${recordedClockTime(value.current.remainingMs)}).`;
}

export function assertRecordedClockStatement(component: ComponentValue, ref: PresentedEvidenceRef): void {
  const reading = ref.projection.id === "run.record.clock_reading", decision = ref.projection.id === "run.record.clock_decision";
  if ((!reading && !decision) || ref.projection.version !== 1 || ref.producer.id !== "run.record" || ref.producer.version !== 1
    || component.id !== "fact_statement" || component.operand.rendererId !== (reading ? "review.clock_remaining@1" : "review.clock_used@1")
    || component.operand.binding !== "recorded_run" || component.operand.convention !== (reading ? "recorded-run@1" : "clock-spend-input@1")) return fail("statement crosses its exact renderer/source/convention tuple");
  const value = reading ? parseRecordedClockReading(component.operand.operands, "clock statement") : parseRecordedClockDecision(component.operand.operands, "clock statement");
  if (`sha256:${evidenceDigest(value)}` !== ref.evidenceDigest) return fail("statement does not retain its complete source operands");
}
