// One engine-report interpretation for the private endpoint selector and Compare point issuer.
import { readRecordedReadingInvocation } from "./evidence-value-routes.js";
import type { invokeRecordedMeasurementReading } from "../recorded-measurement.js";
import type { SourcingLedgerRecord } from "../recorded-reading.js";
import type { SourceEntry } from "../recorded-source-manifest.js";
import type { ReviewEngineScore, ReviewSearchBound } from "../review-points.js";

export type RecordedEngineInstrument = Readonly<{ origin: "provider_delivery"; engineVersion: string; generation: number }>
  | Readonly<{ origin: "offline_engine"; engineVersion: string; profile: { readonly threads: number; readonly hashMb: number; readonly multiPv: 1 } }>;
export type RecordedEngineRequestedBound = Readonly<{ kind: "depth"; requestedDepth: number }>
  | Readonly<{ kind: "movetime"; requestedMs: number }> | Readonly<{ kind: "nodes"; requestedNodes: number }>;
export interface RecordedEngineAvailable {
  readonly kind: "available";
  readonly engineId: string;
  readonly score: ReviewEngineScore;
  readonly instrument: RecordedEngineInstrument;
  readonly bound: RecordedEngineRequestedBound;
}
export interface RecordedEngineCandidate {
  readonly ordinal: number;
  readonly sourceOrdinal: number;
  readonly record: SourcingLedgerRecord;
  readonly source: SourceEntry;
  readonly invocation: ReturnType<typeof invokeRecordedMeasurementReading>;
}
export function recordedEngineRequestedBound(bound: ReviewSearchBound): RecordedEngineRequestedBound {
  return Object.freeze(bound.kind === "depth" ? { kind: "depth", requestedDepth: bound.requestedDepth }
    : bound.kind === "movetime" ? { kind: "movetime", requestedMs: bound.requestedMs } : { kind: "nodes", requestedNodes: bound.requestedNodes });
}
const positive = (value: number) => Number.isSafeInteger(value) && value > 0;
const invalid = (message: string): never => { throw new TypeError(message); };
/** The original invocation, not a copied reading or a caller's selected numeric payload. */
export function recordedOfflineEngineEndpoint(row: RecordedEngineCandidate): RecordedEngineAvailable | null {
  const invocation = readRecordedReadingInvocation(row.invocation.result);
  if (invocation.ledger !== row.invocation.ledger || row.invocation.ledger.payload !== row.record
    || invocation.route !== "recorded.engine.eval@1" || row.source.sourceId !== row.record.sourceId
    || row.source.retrievedAt !== row.record.retrievedAt) return invalid("Engine endpoint lost its original source/ledger/reading join");
  const origin = row.source.origin;
  if (origin.kind === "engine" && origin.evidenceKind !== "engine_eval") return invalid("Engine endpoint has a conflicting original source evidence kind");
  if (row.invocation.result.kind !== "available") return null;
  const reading = row.invocation.result.value.payload;
  if (reading.kind !== "engine_eval") return invalid("Engine endpoint has a crossed reading kind");
  if (origin.kind !== "engine") return null;
  const values = reading.values;
  if (origin.engineId !== values.engineId || origin.engineVersion !== values.engineVersion
    || (origin.engineName !== null && origin.engineName !== values.engineName)) return invalid("Engine endpoint report conflicts with its original instrument identity");
  if (!positive(origin.profile.threads) || !positive(origin.profile.hashMb) || origin.profile.multiPv !== 1) return null;
  const budget = origin.budget;
  if (Object.keys(budget).length !== 1) return invalid("Engine endpoint requested budget is ambiguous");
  const bound: RecordedEngineRequestedBound = "depth" in budget ? { kind: "depth", requestedDepth: budget.depth } : { kind: "movetime", requestedMs: budget.movetimeMs };
  if (!positive("depth" in budget ? budget.depth : budget.movetimeMs)) return null;
  let score: ReviewEngineScore;
  if (values.centipawns !== undefined) score = { kind: "centipawns", value: values.centipawns };
  else {
    const mate = values.mateIn;
    if (mate === undefined || !Number.isSafeInteger(mate) || mate === 0) return null;
    score = { kind: "mate", side: mate > 0 ? "white" : "black", distance: Math.abs(mate), unit: "moves" };
  }
  return Object.freeze({ kind: "available", engineId: values.engineId, score: Object.freeze(score), bound: Object.freeze(bound),
    instrument: Object.freeze({ origin: "offline_engine", engineVersion: origin.engineVersion,
      profile: Object.freeze({ threads: origin.profile.threads, hashMb: origin.profile.hashMb, multiPv: 1 as const }) }) });
}
