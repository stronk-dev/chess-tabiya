// Historical clock transport grammar. Received data never becomes a private source/actor seal.
import { evidenceDigest } from "./evidence-contract.js";
import { parsePresentationReceipt, type PresentationReceipt } from "./presentation-contract.js";
import { presentationWordCount } from "./presentation-word-count.js";
import { s } from "./presentation-schema.js";
import { assertClockDeliveryData, recordedClockSubjectSchema, parseRecordedClockReading, parseRecordedClockDecision } from "./recorded-clock-presentation.js";
import { RECORDED_CLOCK_USE_ABSTENTION_REASONS, type RecordedClockUseAbstentionReason } from "./recorded-clocks.js";
import type { RecordedClockReading, RecordedClockDecision } from "./recorded-clock-operands.js";

export interface RecordedClockSelection { readonly runId: string; readonly branchId: string; readonly nodeId: string }
type SourceReason = "missing_context" | "source_failed";
type ClockSubject = RecordedClockReading["subject"];
export type RecordedClockView =
  | Readonly<{ protocol: "recorded-clock-view@1";
      subject: Readonly<{ kind: "resolved" } & ClockSubject>;
      reading: Readonly<{ kind: "available"; value: RecordedClockReading }>;
      use: Readonly<{ kind: "available"; value: RecordedClockDecision }> | Readonly<{ kind: "unavailable"; reason: RecordedClockUseAbstentionReason }>;
      presentation: PresentationReceipt }>
  | Readonly<{ protocol: "recorded-clock-view@1";
      subject: Readonly<{ kind: "unresolved" } & RecordedClockSelection & { readonly eventHead: ClockSubject["eventHead"] }>;
      reading: Readonly<{ kind: "unavailable"; reason: SourceReason }>;
      use: Readonly<{ kind: "unavailable"; reason: SourceReason }>;
      presentation: PresentationReceipt }>;

const positive = (input: unknown, label: string): number => { const n = s.nat(input, label); if (n === 0) throw new TypeError("Clock event head must be positive"); return n; };
const unresolved = s.obj({ kind: s.lit("unresolved"), runId: s.str, branchId: s.str, nodeId: s.str,
  eventHead: s.obj({ seq: positive, digest: s.digest }) });
const absent = s.obj({ kind: s.lit("unavailable"), reason: s.lit("missing_context", "source_failed") });
const reading = s.obj({ kind: s.lit("available"), value: parseRecordedClockReading });
const use = s.union("kind", {
  available: s.obj({ kind: s.lit("available"), value: parseRecordedClockDecision }),
  unavailable: s.obj({ kind: s.lit("unavailable"), reason: s.lit(...RECORDED_CLOCK_USE_ABSTENTION_REASONS) }),
});
function exact(input: unknown, keys: readonly string[]): Record<string, unknown> {
  if (input === null || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length !== keys.length
    || keys.some(key => !Object.hasOwn(input, key))) throw new TypeError("Recorded clock response has an invalid closed shape");
  return input as Record<string, unknown>;
}

export function parseRecordedClockView(input: unknown, expected: RecordedClockSelection & { readonly eventHeadSeq?: number;
  readonly afterFen?: string; readonly beforeFen?: string; readonly sourcePly?: number; readonly moveUci?: string;
  readonly side?: "white" | "black"; readonly parentNodeId?: string; readonly rootNodeId?: string;
  readonly previousSample?: Readonly<{ nodeId: string; sourcePly: number; moveUci: string; side: "white" | "black" }> }): RecordedClockView {
  assertClockDeliveryData(input);
  const raw = exact(input, ["protocol", "subject", "reading", "use", "presentation"]);
  if (raw.protocol !== "recorded-clock-view@1") throw new TypeError("Unknown recorded clock protocol");
  const subjectRaw = raw.subject as { readonly kind?: unknown } | null;
  let result: Omit<RecordedClockView, "presentation">;
  if (subjectRaw?.kind === "unresolved") {
    const subject = unresolved(raw.subject, "clock subject"), r = absent(raw.reading, "clock reading"), u = absent(raw.use, "clock use");
    if (r.reason !== u.reason) throw new TypeError("Unresolved clock source has crossed statuses");
    result = { protocol: "recorded-clock-view@1", subject, reading: r, use: u };
  } else {
    const full = exact(raw.subject, ["kind", "runId", "branchId", "nodeId", "sourceNodeId", "sourcePly", "eventHead"]);
    if (full.kind !== "resolved") throw new TypeError("Unknown recorded clock subject status");
    const { kind: _kind, ...fields } = full, subject = { kind: "resolved" as const, ...recordedClockSubjectSchema(fields, "clock subject") };
    const r = reading(raw.reading, "clock reading"), u = use(raw.use, "clock use");
    if (evidenceDigest(r.value.subject) !== evidenceDigest(fields)) throw new TypeError("Clock reading crosses its response subject");
    if (expected.afterFen !== undefined && r.value.original.afterFen !== expected.afterFen
      || expected.beforeFen !== undefined && r.value.original.beforeFen !== expected.beforeFen
      || expected.sourcePly !== undefined && r.value.subject.sourcePly !== expected.sourcePly
      || expected.moveUci !== undefined && r.value.original.moveUci !== expected.moveUci
      || expected.side !== undefined && r.value.original.side !== expected.side
      || expected.parentNodeId !== undefined && r.value.original.beforeNodeId !== expected.parentNodeId) throw new TypeError("Clock reading crosses the known selected historical move");
    if (u.kind === "available") {
      const d = u.value;
      if (evidenceDigest(d.subject) !== evidenceDigest(fields) || r.value.sample.kind !== "available"
        || evidenceDigest(d.current) !== evidenceDigest(r.value.sample.sample) || evidenceDigest(d.control) !== evidenceDigest(r.value.control)
        || d.actor.side !== r.value.original.side || d.decision.nodeId !== r.value.original.beforeNodeId
        || d.decision.eventSeq !== r.value.original.eventSeq || d.decision.beforeFen !== r.value.original.beforeFen) throw new TypeError("Clock use crosses its original reading/mover/parent/control");
      if (d.previous.kind === "initial_base" && expected.rootNodeId !== undefined && d.previous.nodeId !== expected.rootNodeId) throw new TypeError("Clock initial base crosses the known original root");
      if (d.previous.kind === "sample" && expected.previousSample !== undefined && (d.previous.nodeId !== expected.previousSample.nodeId
        || d.previous.sample.sourcePly !== expected.previousSample.sourcePly || d.previous.sample.side !== expected.previousSample.side
        || d.previous.sample.moveUci !== expected.previousSample.moveUci)) throw new TypeError("Clock prior sample crosses the known same-side original move");
    } else {
      if (r.value.sample.kind !== "available" && u.reason !== "current_sample_unavailable"
        || r.value.sample.kind === "available" && u.reason === "current_sample_unavailable") throw new TypeError("Clock use absence disagrees with its current sample");
      if (r.value.sample.kind === "available") {
        const c = r.value.control.kind;
        if (c !== "supported" && u.reason !== `control_${c}` || c === "supported" && u.reason.startsWith("control_")) throw new TypeError("Clock use absence disagrees with its control");
        if (u.reason === "initial_base_unproven" && subject.sourcePly > 2
          || u.reason === "previous_same_side_sample_unavailable" && subject.sourcePly <= 2
          || u.reason === "nonpositive_available" && r.value.control.kind === "supported" && r.value.control.incrementMs > 0) throw new TypeError("Clock use absence contradicts its public source operands");
      }
    }
    result = { protocol: "recorded-clock-view@1", subject: Object.freeze(subject), reading: r, use: u };
  }
  if (result.subject.runId !== expected.runId || result.subject.branchId !== expected.branchId || result.subject.nodeId !== expected.nodeId
    || expected.eventHeadSeq !== undefined && result.subject.eventHead.seq !== expected.eventHeadSeq) throw new TypeError("Recorded clock response does not match the selected historical subject");
  const items = parsePresentationReceipt(raw.presentation);
  const values = result.reading.kind === "available" ? [result.reading.value, ...(result.use.kind === "available" ? [result.use.value] : [])] : [];
  if (items.length !== values.length || items.length > 2) throw new TypeError("Recorded clock receipt has missing or surplus facts");
  let words = 0;
  for (const [i, item] of items.entries()) {
    const projection = i === 0 ? "run.record.clock_reading" : "run.record.clock_decision";
    const ref = item.evidenceRef, component = item.component;
    if (item.adapter.consumer.id !== "review.recorded_clock" || item.adapter.consumer.version !== 1
      || item.adapter.projection.id !== projection || item.adapter.projection.version !== 1
      || ref === null || ref.producer.id !== "run.record" || ref.producer.version !== 1
      || ref.projection.id !== projection || ref.projection.version !== 1 || ref.evidenceDigest !== `sha256:${evidenceDigest(values[i])}`
      || component.id !== "fact_statement" || component.operand.rendererId !== (i === 0 ? "review.clock_remaining@1" : "review.clock_used@1")
      || evidenceDigest(component.operand.operands) !== evidenceDigest(values[i])) throw new TypeError("Recorded clock receipt crosses its source/consumer/renderer/retained operands");
    words += presentationWordCount(component.operand.renderedText);
  }
  if (words > 50) throw new TypeError("Recorded clock receipt exceeds its fixed word budget");
  // Canonical JSON delivery only: this object does not carry a process-private evidence seal.
  const presentation = JSON.parse(JSON.stringify(raw.presentation)) as PresentationReceipt;
  const freeze = (value: unknown): void => {
    if (value !== null && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  };
  freeze(presentation);
  return Object.freeze({ ...result, presentation }) as RecordedClockView;
}
