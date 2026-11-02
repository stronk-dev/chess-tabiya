// Accepted grades §2a / F2 §2.3a: original engine operands shared by independently authorized
// workflows. This reader issues no permission, grade, evidence or provider request.
import { canonicalFen, positionFromFen } from "../chess.js";
import { evidenceDigest, type DeclaredEvidence } from "../evidence-contract.js";
import { recordedMeasurementPosition } from "../recorded-measurement.js";
import type { SourcingLedgerRecord } from "../recorded-reading.js";
import type { SourceManifest } from "../recorded-source-manifest.js";
import { reviewPointComparability } from "../review-points.js";
import { readRecordedEngineAttachments, type RecordedEngineAttachments } from "./recorded-engine-attachments.js";
import { recordedOfflineEngineEndpoint, recordedEngineRequestedBound, type RecordedEngineCandidate, type RecordedEngineAvailable } from "./recorded-engine-endpoint-values.js";

interface SourceAbstention { readonly kind: string; readonly anchor: Readonly<Record<string, string>>; readonly sourceId: string; readonly retrievedAt: string; readonly reason: string; readonly detail: string }
export interface RecordedEngineOfflineCapture {
  readonly packDigest: string;
  readonly ledgerDigest: string;
  readonly manifestDigest: string;
  readonly ledger: Readonly<{ schema: "tabiya.sourcing.evidence.v1"; packId?: string; packVersion?: string; packDigest?: string; sourcedAt: string;
    records: readonly SourcingLedgerRecord[]; abstentions: readonly SourceAbstention[]; claimBindings?: readonly unknown[] }>;
  readonly manifest: SourceManifest;
  readonly candidates: readonly RecordedEngineCandidate[];
  readonly abstentions: readonly Readonly<{ ordinal: number; sourceOrdinal: number; abstention: SourceAbstention; source: SourceManifest["entries"][number] }>[];
}
export interface RecordedEngineNodeCapture {
  readonly attachments: RecordedEngineAttachments;
  readonly nodeId: string;
  readonly offline: RecordedEngineOfflineCapture | null;
  readonly pending: object | null;
}
const refuse = (message: string): never => { throw new TypeError(`Recorded engine node: ${message}`); };

/** Recheck the complete original population before choosing the fixed first eligible report.
 * Equal FEN or score bytes alone never attest an original position, source or reading. */
export function readRecordedEngineNode(input: RecordedEngineNodeCapture) {
  if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype
    || Reflect.ownKeys(input).length !== 4 || !["attachments", "nodeId", "offline", "pending"].every(key => {
      const field = Object.getOwnPropertyDescriptor(input, key); return field?.enumerable && "value" in field;
    })) return refuse("requires exactly {attachments,nodeId,offline,pending}");
  const { boundary, rows } = readRecordedEngineAttachments(input.attachments), { run } = boundary;
  const row = rows.find(value => value.position.payload.nodeId === input.nodeId);
  if (row === undefined) return refuse("node is outside the original granted prefix");
  const positionOrigin = recordedMeasurementPosition(row.position);
  if (positionOrigin.runId !== run.id || positionOrigin.headDigest !== evidenceDigest(run.events)) return refuse("foreign original position invocation");
  let selected: RecordedEngineAvailable | null = null, selectedOperand: DeclaredEvidence<unknown> | null = null;
  let unavailable: "source_pending" | "missing_eval" | "input_abstained" = "missing_eval";
  let selectedOrdinal: number | null = null;
  if (row.selected !== null) {
    if (input.offline !== null || input.pending !== null) return refuse("modern point cannot fall back or carry a second endpoint");
    const delivery = row.selected.occurrence.evaluation.payload, generation = delivery.acquisition.generation;
    if (generation === null) return refuse("modern generation is missing");
    selected = Object.freeze({ kind: "available", score: delivery.payload.score, engineId: delivery.acquisition.actualIdentity.id,
      instrument: Object.freeze({ origin: "provider_delivery", engineVersion: delivery.acquisition.actualIdentity.version, generation }), bound: recordedEngineRequestedBound(delivery.payload.bound) });
    selectedOperand = row.selected.point;
  } else if (input.pending !== null) {
    if (!Object.isFrozen(input.pending)) return refuse("pending identity is not an immutable owner token");
    if (input.offline !== null) return refuse("pending modern request cannot use an offline fallback");
    unavailable = "source_pending";
  } else if (input.offline !== null) {
    const offline = input.offline;
    if (positionOrigin.pack?.digest !== offline.packDigest || run.packDigest !== offline.packDigest) return refuse("crossed pinned artifact");
    if (offline.ledgerDigest !== `sha256:${evidenceDigest(offline.ledger)}` || offline.manifestDigest !== `sha256:${evidenceDigest(offline.manifest)}`
      || offline.ledger.packDigest !== offline.packDigest || offline.ledger.packId !== positionOrigin.pack.id) return refuse("crossed complete artifact identity");
    const sourceFor = (record: SourcingLedgerRecord | SourceAbstention) => {
      const index = offline.manifest.entries.findIndex(source => source.sourceId === record.sourceId && source.retrievedAt === record.retrievedAt);
      if (index < 0) return refuse("record has no exact original manifest occurrence");
      return { source: offline.manifest.entries[index]!, index };
    };
    const fenFor = (record: SourcingLedgerRecord | SourceAbstention) => {
      const fen = fullFen(record.anchor.fen), { source } = sourceFor(record);
      if (source.origin.kind === "engine" && source.origin.evidenceKind !== record.kind) return refuse("conflicting original source evidence kind");
      if (("values" in record && Object.hasOwn(record.values, "fen") && fullFen(record.values.fen) !== fen)
        || (source.origin.kind === "engine" && fullFen(source.origin.fen) !== fen)) return refuse("conflicting original position claims");
      return fen;
    };
    const records = offline.ledger.records.flatMap((record, ordinal) => record.kind !== "engine_eval" ? []
      : fenFor(record) === row.position.payload.fen ? [{ record, ordinal, ...sourceFor(record) }] : []);
    const abstentions = offline.ledger.abstentions.flatMap((record, ordinal) => record.kind !== "engine_eval" ? []
      : fenFor(record) === row.position.payload.fen ? [{ record, ordinal, ...sourceFor(record) }] : []);
    if (records.length !== offline.candidates.length || abstentions.length !== offline.abstentions.length) return refuse("incomplete original candidate/abstention population");
    for (const [index, original] of records.entries()) {
      const candidate = offline.candidates[index]!;
      if (candidate.ordinal !== original.ordinal || candidate.record !== original.record || candidate.sourceOrdinal !== original.index
        || candidate.source !== original.source) return refuse("reordered or crossed original candidate");
    }
    for (const [index, original] of abstentions.entries()) {
      const entry = offline.abstentions[index]!;
      if (entry.ordinal !== original.ordinal || entry.abstention !== original.record || entry.sourceOrdinal !== original.index || entry.source !== original.source) return refuse("reordered or crossed original abstention");
    }
    const normalized = offline.candidates.map(recordedOfflineEngineEndpoint), index = normalized.findIndex(value => value !== null);
    if (index >= 0) {
      const candidate = offline.candidates[index]!;
      selected = normalized[index]!; selectedOrdinal = candidate.ordinal;
      selectedOperand = candidate.invocation.result.kind === "available" ? candidate.invocation.result.value : null;
    } else if (offline.candidates.length > 0 || offline.abstentions.length > 0) unavailable = "input_abstained";
  }
  readRecordedEngineAttachments(input.attachments);
  return Object.freeze({ boundary, row, selected, selectedOperand, selectedOrdinal, unavailable });
}

/** Comparison only; caller-owned workflow source still establishes the actual recorded edge.
 * This cannot mint a grade, select another report, or turn graph coverage into pair coverage. */
export function recordedEngineNodesComparable(before: ReturnType<typeof readRecordedEngineNode>, after: ReturnType<typeof readRecordedEngineNode>): boolean {
  const a = before.selected, b = after.selected;
  if (a === null || b === null) return false;
  if (a.instrument.origin === "provider_delivery" && b.instrument.origin === "provider_delivery") {
    if (before.row.selected === null || after.row.selected === null) return refuse("comparable modern endpoint lost its original point");
    return reviewPointComparability(before.row.selected.point.payload, after.row.selected.point.payload) === "comparable";
  }
  if (a.instrument.origin !== "offline_engine" || b.instrument.origin !== "offline_engine") return false;
  const left = a.bound, right = b.bound;
  const sameBound = left.kind === "depth" && right.kind === "depth" ? left.requestedDepth === right.requestedDepth
    : left.kind === "movetime" && right.kind === "movetime" ? left.requestedMs === right.requestedMs
      : left.kind === "nodes" && right.kind === "nodes" && left.requestedNodes === right.requestedNodes;
  return a.engineId === b.engineId && a.instrument.engineVersion === b.instrument.engineVersion
    && a.instrument.profile.threads === b.instrument.profile.threads && a.instrument.profile.hashMb === b.instrument.profile.hashMb
    && a.instrument.profile.multiPv === b.instrument.profile.multiPv && sameBound;
}

/** Own the mutable envelopes, retaining the genuinely invoked record objects and their receipts. */
export function snapshotRecordedEngineOffline(input: RecordedEngineOfflineCapture | null): RecordedEngineOfflineCapture | null {
  if (input === null) return null;
  const manifest = structuredClone(input.manifest), candidates = new Set(input.candidates.map(row => row.record));
  const ledger = { ...structuredClone(input.ledger), records: input.ledger.records.map(record => candidates.has(record) ? record : structuredClone(record)) };
  return { ...input, manifest, ledger,
    candidates: input.candidates.map(row => ({ ...row, source: manifest.entries[row.sourceOrdinal]! })),
    abstentions: input.abstentions.map(row => ({ ...row, abstention: ledger.abstentions[row.ordinal]!, source: manifest.entries[row.sourceOrdinal]! })),
  };
}

function fullFen(value: unknown): string {
  if (typeof value !== "string" || value.trim().split(/\s+/u).length !== 6) return refuse("missing full six-field FEN");
  return canonicalFen(positionFromFen(value));
}
