// Exact recorded arithmetic, not deliberation, move quality, spend-share or actor attribution.
import type { EvidenceAvailability } from "./evidence-factories.js";
import { readRecordedClockSource, type RecordedClockSource, type RecordedClockAuthority } from "./recorded-clock-source.js";
import { readFoundationRecordedPrefix } from "./recorded-foundation-source.js";
import type { ParsedTimeControl, RecordedClockSample, RecordedClockUseAbstentionReason } from "./recorded-clocks.js";
import type { PhaseBandReadingV2 } from "./phase.js";

export type RecordedClockReading = Readonly<Pick<RecordedClockAuthority, "subject" | "original" | "retention" | "sample" | "control">>;
export interface RecordedClockDecision extends RecordedClockUseOperands {
  readonly subject: RecordedClockAuthority["subject"];
  readonly actor: Readonly<{ kind: "imported"; side: "white" | "black" }>;
  readonly decision: Readonly<{ nodeId: string; rootedIndex: number; eventSeq: number; moveUci: string; beforeFen: string }>;
  readonly phase: PhaseBandReadingV2;
}

export interface RecordedClockUseOperands {
  readonly current: RecordedClockSample;
  readonly previous:
    | Readonly<{ kind: "sample"; nodeId: string; sample: RecordedClockSample }>
    | Readonly<{ kind: "initial_base"; nodeId: string; sourcePly: 0; remainingMs: number; proof: RecordedClockAuthority["initialStart"] }>;
  readonly control: Extract<ParsedTimeControl, { kind: "supported" }>;
  readonly availableMs: number;
  readonly clockUsedMs: number;
}
export function recordedClockUseOperands(source: RecordedClockSource): EvidenceAvailability<RecordedClockUseOperands> {
  const data = readRecordedClockSource(source), a = data.authority;
  const missing = (reason: RecordedClockUseAbstentionReason): EvidenceAvailability<RecordedClockUseOperands> => {
    readRecordedClockSource(source); return Object.freeze({ kind: "unavailable", reason });
  };
  if (a.sample.kind !== "available") return missing("current_sample_unavailable");
  if (a.control.kind === "absent") return missing("control_absent");
  if (a.control.kind === "invalid") return missing("control_invalid");
  if (a.control.kind === "unsupported") return missing("control_unsupported");
  const path = readFoundationRecordedPrefix(data.prefix).authority.path;
  const initial = a.subject.sourcePly <= 2 && a.initialStart.fenHeader === null
    && (a.initialStart.setupHeader === null || a.initialStart.setupHeader === "0")
    && (a.initialStart.variantHeader === null || a.initialStart.variantHeader === "Standard")
    && a.initialStart.rootFen === "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  if (initial !== a.initialBaseEligible) throw new TypeError("Clock initial-base proof differs from its literal operands");
  let previous: RecordedClockUseOperands["previous"];
  if (a.previous !== null) {
    const priorPly = a.subject.sourcePly - 2, member = path[priorPly];
    if (member === undefined || a.previous.sourcePly !== priorPly || a.previous.side !== a.original.side) throw new TypeError("Clock predecessor is not the adjacent original same-side decision");
    previous = Object.freeze({ kind: "sample", nodeId: member.nodeId, sample: a.previous });
  } else {
    if (!initial) return missing(a.subject.sourcePly <= 2 ? "initial_base_unproven" : "previous_same_side_sample_unavailable");
    previous = Object.freeze({ kind: "initial_base", nodeId: path[0]!.nodeId, sourcePly: 0, remainingMs: a.control.baseMs, proof: a.initialStart });
  }
  const previousMs = previous.kind === "sample" ? previous.sample.remainingMs : previous.remainingMs;
  const availableMs = previousMs + a.control.incrementMs;
  if (!Number.isSafeInteger(availableMs)) return missing("unsafe_arithmetic");
  if (availableMs <= 0) return missing("nonpositive_available");
  const clockUsedMs = availableMs - a.sample.sample.remainingMs;
  if (clockUsedMs < 0) return missing("current_exceeds_available");
  if (!Number.isSafeInteger(clockUsedMs)) return missing("unsafe_arithmetic");
  readRecordedClockSource(source);
  return Object.freeze({ kind: "available", value: Object.freeze({ current: a.sample.sample, previous, control: a.control, availableMs, clockUsedMs }) });
}
