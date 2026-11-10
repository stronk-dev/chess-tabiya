// Accepted module-registration §§4.10/4.11a: Review's independent pinned historical reports.
// Package-private publication by the service source owner, never a value-factory input or wire grant.
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertEvidenceConsumerExecutionManifestV2 } from "./evidence-binding-execution.js";
import { moduleConsumerCeilings } from "./module-policy.js";
import { assertRecordedPositionInvocation } from "./internal/evidence-value-routes.js";
import { assertRecordedMeasurementInvocation, type invokeRecordedMeasurementReading } from "./recorded-measurement.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "./recorded-review-boundary.js";
import type { RecordedGradePermission } from "./recorded-grade-source.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import type { SourcingLedgerRecord } from "./recorded-reading.js";
import type { RecordedPosition } from "./review-points.js";
import type { RecordedReading } from "./voice.js";
import { parseFinalizedAssistanceV1 } from "./assistance-exchange.js";

export const REVIEW_LEDGER_REFS = Object.freeze(["recorded.engine.eval@1", "recorded.tablebase.result@1"] as const);
export type ReviewLedgerRef = (typeof REVIEW_LEDGER_REFS)[number];
type Absence = "source_absent";
type Failure = "source_contract_invalid" | "source_lookup_failed";
type SourceLink = Readonly<{ sourceId: string; retrievedAt: string }>;
type Abstention = SourceLink & Readonly<{ kind: string; reason: "out_of_range" | "source_unavailable" | "no_data_at_band" | "licence_withheld" }>;

/** Structural read view of the original immutable registry object; the full object is retained,
 * not reconstructed from this interface or used to mint a second registry source. */
export interface ReviewLedgerPopulation {
  readonly position: DeclaredEvidence<RecordedPosition>;
  readonly projection: ReviewLedgerRef;
  readonly fen: string;
  readonly artifact: Readonly<{ document: Readonly<{ id: string; version: string }>; packDigest: string;
    ledgerDigest: string; manifestDigest: string;
    ledger: Readonly<{ packId?: string; packVersion?: string; packDigest?: string; records: readonly SourcingLedgerRecord[]; abstentions: readonly Abstention[] }>;
    manifest: Readonly<{ entries: readonly SourceLink[] }> }>;
  readonly records: readonly Readonly<{ ordinal: number; sourceOrdinal: number; record: SourcingLedgerRecord; source: SourceLink;
    invocation: ReturnType<typeof invokeRecordedMeasurementReading> }>[];
  readonly abstentions: readonly Readonly<{ ordinal: number; sourceOrdinal: number; abstention: Abstention; source: SourceLink }>[];
  readonly readings: readonly DeclaredEvidence<RecordedReading>[];
  readonly counts: Readonly<{ matchedRecords: number; admittedRecords: number; notAdmittedRecords: number;
    abstentions: Readonly<Record<Abstention["reason"], number>> }>;
  readonly outcome: Readonly<{ kind: "available"; collected: number } | { kind: "no_witness" }
    | { kind: "unavailable"; reason: "recorded_measurement_unavailable" }>;
}

export type ReviewLedgerCapture = Readonly<{ projection: ReviewLedgerRef; source:
  | Readonly<{ kind: "population"; read: () => ReviewLedgerPopulation }>
  | Readonly<{ kind: "unavailable"; reason: Absence }>
  | Readonly<{ kind: "failed"; reason: Failure }> }>;
interface Capture {
  readonly boundary: RecordedReviewBoundary;
  readonly permission: RecordedGradePermission;
  readonly signal: AbortSignal;
  readonly rows: readonly Readonly<{ position: DeclaredEvidence<RecordedPosition>; slots: readonly ReviewLedgerCapture[] }>[];
}
declare const recordedReviewLedgerBrand: unique symbol;
export interface RecordedReviewLedgerSource { readonly [recordedReviewLedgerBrand]: true }
interface Slot {
  readonly projection: ReviewLedgerRef;
  readonly data: ReviewLedgerPopulation | null;
  readonly outcome: ReviewLedgerPopulation["outcome"] | Readonly<{ kind: "unavailable"; reason: Absence }> | Readonly<{ kind: "failed"; reason: Failure }>;
  readonly read: (() => ReviewLedgerPopulation) | null;
}
interface Image {
  readonly boundary: ReturnType<typeof readRecordedReviewBoundary>;
  readonly permission: RecordedGradePermission;
  readonly rows: readonly Readonly<{ position: DeclaredEvidence<RecordedPosition>; slots: readonly Slot[] }>[];
}
const sources = new WeakMap<object, Readonly<{ boundary: RecordedReviewBoundary; signal: AbortSignal; image: Image; current: () => void }>>();
const refuse = (message: string): never => { throw new TypeError(`Recorded Review ledger: ${message}`); };
const current = (check: () => void) => { if (typeof check !== "function" || check() !== undefined) refuse("requires its source owner's live check, not a source-valid flag"); };
const exact = (value: unknown, keys: readonly string[]) => value !== null && typeof value === "object"
  && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => { const field = Object.getOwnPropertyDescriptor(value, key); return field?.enumerable && "value" in field; });
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child); Object.freeze(value);
  }
  return value;
}

function population(data: ReviewLedgerPopulation, position: DeclaredEvidence<RecordedPosition>, projection: ReviewLedgerRef, image: Image["boundary"]): void {
  const artifact = data.artifact, pack = image.run;
  if (pack.sessionKind !== "pack" || data.position !== position || data.projection !== projection || data.fen !== position.payload.fen
    || artifact.packDigest !== pack.packDigest || artifact.document.id !== pack.packId
    || artifact.ledger.packId !== pack.packId || artifact.ledger.packVersion !== artifact.document.version
    || artifact.ledger.packDigest !== pack.packDigest) return refuse("population crosses its original position/projection/pinned pack");
  const kind = projection === REVIEW_LEDGER_REFS[0] ? "engine_eval" : "tablebase_result";
  let previous = -1;
  const readings: DeclaredEvidence<RecordedReading>[] = [];
  for (const row of data.records) {
    if (!Number.isSafeInteger(row.ordinal) || row.ordinal <= previous || artifact.ledger.records[row.ordinal] !== row.record
      || !Number.isSafeInteger(row.sourceOrdinal) || row.sourceOrdinal < 0
      || artifact.manifest.entries[row.sourceOrdinal] !== row.source || row.record.kind !== kind
      || row.source.sourceId !== row.record.sourceId || row.source.retrievedAt !== row.record.retrievedAt) return refuse("record lost original ordinal/source identity");
    previous = row.ordinal;
    assertRecordedMeasurementInvocation(row.record, row.invocation);
    if (row.invocation.result.kind === "available") {
      if (row.invocation.result.value.payload.fen !== data.fen) return refuse("reading crosses the exact six-field position");
      readings.push(row.invocation.result.value);
    }
  }
  previous = -1;
  const abstentions = { out_of_range: 0, source_unavailable: 0, no_data_at_band: 0, licence_withheld: 0 };
  for (const row of data.abstentions) {
    if (!Number.isSafeInteger(row.ordinal) || row.ordinal <= previous || artifact.ledger.abstentions[row.ordinal] !== row.abstention
      || !Number.isSafeInteger(row.sourceOrdinal) || row.sourceOrdinal < 0
      || artifact.manifest.entries[row.sourceOrdinal] !== row.source || row.abstention.kind !== kind
      || row.source.sourceId !== row.abstention.sourceId || row.source.retrievedAt !== row.abstention.retrievedAt
      || !Object.hasOwn(abstentions, row.abstention.reason)) return refuse("abstention lost original ordinal/source identity");
    previous = row.ordinal; abstentions[row.abstention.reason]++;
  }
  if (data.readings.length !== readings.length || readings.some((value, index) => data.readings[index] !== value)
    || data.counts.matchedRecords !== data.records.length || data.counts.admittedRecords !== readings.length
    || data.counts.notAdmittedRecords !== data.records.length - readings.length
    || Object.entries(abstentions).some(([key, value]) => data.counts.abstentions[key as Abstention["reason"]] !== value)) return refuse("population dropped original readings/refusals/abstentions");
  if (readings.length > 0 ? data.outcome.kind !== "available" || data.outcome.collected !== readings.length
    : data.records.length + data.abstentions.length > 0 ? data.outcome.kind !== "unavailable" || data.outcome.reason !== "recorded_measurement_unavailable"
    : data.outcome.kind !== "no_witness") return refuse("population changed the original measurement outcome");
}

/** Private issuer capability; the sole production caller is the service's current source owner. */
export const RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY = Object.freeze({
  issue(capture: Capture, checkCurrent: () => void): RecordedReviewLedgerSource {
    if (!exact(capture, ["boundary", "permission", "signal", "rows"])) return refuse("invalid capture");
    capture.signal.throwIfAborted(); current(checkCurrent);
    const boundary = readRecordedReviewBoundary(capture.boundary), permission = capture.permission;
    if (!exact(permission, ["principal", "role", "assistance", "timing", "session", "execution"])
      || !exact(permission.principal, ["learnerId", "handle"]) || ![permission.principal.learnerId, permission.principal.handle].every(value => typeof value === "string" && value.length > 0)) return refuse("invalid permission image");
    if (permission.assistance !== null) parseFinalizedAssistanceV1(permission.assistance);
    assertEvidenceConsumerExecutionManifestV2(permission.execution, PRIMARY_EVIDENCE_MANIFEST);
    const ceiling = moduleConsumerCeilings("review_map");
    if (permission.timing !== "review" || permission.execution.consumer.id !== "module.review_map" || permission.execution.consumer.version !== 2
      || !ceiling.roles.includes(permission.role) || !ceiling.sessions.includes(permission.session)
      || permission.assistance !== null && (!permission.assistance.modules.includes("review_map")
        || !permission.assistance.effects.some(effect => effect.moduleId === "review_map" && effect.timing === "review" && effect.subSurface === undefined))) return refuse("not this Review workflow's permission");
    if (!Array.isArray(capture.rows) || capture.rows.length !== boundary.path.length) return refuse("requires every original position including the root");
    const rows = capture.rows.map((row: Capture["rows"][number], index: number) => {
      if (!exact(row, ["position", "slots"])) return refuse("invalid position row");
      const node = boundary.path[index]!.node;
      assertRecordedPositionInvocation(row.position, boundary.run, node.id);
      if (!Array.isArray(row.slots) || row.slots.length !== 2 || row.slots.some((slot: ReviewLedgerCapture, i: number) => !exact(slot, ["projection", "source"]) || slot.projection !== REVIEW_LEDGER_REFS[i])) return refuse("requires both exact independent ledger sources");
      const slots = row.slots.map((slot: ReviewLedgerCapture): Slot => {
        if (slot.source.kind === "population") {
          if (!exact(slot.source, ["kind", "read"]) || typeof slot.source.read !== "function") return refuse("invalid population reader");
          const data = slot.source.read(); population(data, row.position, slot.projection, boundary);
          return Object.freeze({ projection: slot.projection, data, outcome: data.outcome, read: slot.source.read });
        }
        if (!exact(slot.source, ["kind", "reason"]) || (slot.source.kind === "unavailable" ? slot.source.reason !== "source_absent"
          : slot.source.kind !== "failed" || !["source_contract_invalid", "source_lookup_failed"].includes(slot.source.reason))) return refuse("invalid source outcome");
        return Object.freeze({ projection: slot.projection, data: null, outcome: Object.freeze({ ...slot.source }), read: null });
      });
      return Object.freeze({ position: row.position, slots: Object.freeze(slots) });
    });
    const image = Object.freeze({ boundary, permission: Object.freeze({ ...permission, principal: Object.freeze({ ...permission.principal }),
      assistance: freeze(structuredClone(permission.assistance)) }), rows: Object.freeze(rows) }), source = Object.freeze({}) as RecordedReviewLedgerSource;
    sources.set(source, Object.freeze({ boundary: capture.boundary, signal: capture.signal, image, current: checkCurrent }));
    readRecordedReviewLedgerSource(source); return source;
  },
});

/** No dispatch, provider call or source-valid flag. Retained reads consult the actual owners. */
export function readRecordedReviewLedgerSource(source: RecordedReviewLedgerSource): Image {
  const owned = source !== null && typeof source === "object" ? sources.get(source) : undefined;
  if (owned === undefined) return refuse("source was not issued by its actual owner");
  owned.signal.throwIfAborted(); current(owned.current);
  if (readRecordedReviewBoundary(owned.boundary) !== owned.image.boundary) return refuse("boundary was replaced");
  for (const row of owned.image.rows) for (const slot of row.slots) if (slot.read !== null) {
    if (slot.read() !== slot.data) return refuse("registry population was replaced");
    population(slot.data!, row.position, slot.projection, owned.image.boundary);
  }
  current(owned.current); owned.signal.throwIfAborted();
  return owned.image;
}
