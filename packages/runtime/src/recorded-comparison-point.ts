// Package-private point authority. Issuance is exported only through the server-owner subpath.
import { branchPath } from "./branch-path.js";
import { parseFinalizedAssistanceV1, type FinalizedAssistanceV1 } from "./assistance-exchange.js";
import { assertEvidenceConsumerExecutionManifestV2, type CompiledEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { evidenceDigest, type DeclaredEvidence, type EvidenceRole } from "./evidence-contract.js";
import { modulePolicy } from "./module-policy.js";
import { recordedComparisonColumn, type RecordedComparisonSource } from "./recorded-comparison.js";
import { recordedMeasurementPosition } from "./recorded-measurement.js";
import type { SourcingLedgerRecord } from "./recorded-reading.js";
import type { SourceManifest } from "./recorded-source-manifest.js";
import type { ReviewEngineScore } from "./review-points.js";
import { readRecordedEngineAttachments, type RecordedEngineAttachments } from "./internal/recorded-engine-attachments.js";
import { recordedOfflineEngineEndpoint, recordedEngineRequestedBound, type RecordedEngineCandidate, type RecordedEngineAvailable, type RecordedEngineInstrument, type RecordedEngineRequestedBound } from "./internal/recorded-engine-endpoint-values.js";

export interface RecordedComparisonPermission {
  readonly principal: Readonly<{ learnerId: string; handle: string }>;
  readonly role: EvidenceRole;
  readonly assistance: FinalizedAssistanceV1;
  readonly timing: "checkpoint" | "review";
  readonly execution: CompiledEvidenceConsumerExecutionV2;
}
export interface RecordedComparisonOfflineCapture {
  readonly packDigest: string;
  readonly ledgerDigest: string;
  readonly manifestDigest: string;
  readonly ledger: Readonly<{ schema: "tabiya.sourcing.evidence.v1"; packId?: string; packVersion?: string; packDigest?: string; sourcedAt: string;
    records: readonly SourcingLedgerRecord[]; abstentions: readonly RecordedSourceAbstention[]; claimBindings?: readonly unknown[] }>;
  readonly manifest: SourceManifest;
  readonly candidates: readonly RecordedEngineCandidate[];
  readonly abstentions: readonly Readonly<{ ordinal: number; sourceOrdinal: number; abstention: RecordedSourceAbstention; source: SourceManifest["entries"][number] }>[];
}
interface RecordedSourceAbstention { readonly kind: string; readonly anchor: Readonly<Record<string, string>>; readonly sourceId: string; readonly retrievedAt: string; readonly reason: string; readonly detail: string }
export interface RecordedComparisonPointCapture {
  readonly comparison: RecordedComparisonSource;
  readonly branchId: string;
  readonly nodeId: string;
  readonly permission: RecordedComparisonPermission;
  readonly attachments: RecordedEngineAttachments;
  readonly offline: RecordedComparisonOfflineCapture | null;
  readonly pending: object | null;
  readonly signal: AbortSignal;
}
export interface RecordedComparisonEnginePoint {
  readonly nodeId: string;
  readonly plyOffset: number;
  readonly whiteScore: ReviewEngineScore;
  readonly engineId: string;
  readonly instrument: RecordedEngineInstrument;
  readonly bound: RecordedEngineRequestedBound;
}
declare const comparisonPointBrand: unique symbol;
export interface RecordedComparisonPointSource { readonly [comparisonPointBrand]: true }
type PointData = ReturnType<typeof compute>;
const points = new WeakMap<object, { readonly capture: RecordedComparisonPointCapture; readonly data: PointData }>();
const refuse = (message: string): never => { throw new TypeError(`Comparison point: ${message}`); };
const exact = (value: unknown, keys: readonly string[]) => value !== null && typeof value === "object"
  && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => { const field = Object.getOwnPropertyDescriptor(value, key); return field?.enumerable && "value" in field; });

function compute(input: RecordedComparisonPointCapture) {
  input.signal.throwIfAborted();
  const { run, authority, path, column } = recordedComparisonColumn(input.comparison, input.branchId);
  if (authority.columns[1].branchId !== input.branchId || column.throughNodeId !== path.at(-1)!.node.id
    || authority.columns.some((value, index) => value.throughNodeId !== authority.paths[index]!.at(-1)!.node.id
      || value.throughNodeId !== branchPath(run, value.branchId).at(-1)!.id)) refuse("requires the actual peer and both complete granted tips");
  const span = path.slice(path.findIndex(entry => entry.node.id === authority.forkNodeId));
  const entry = span.find(value => value.node.id === input.nodeId);
  if (entry === undefined) return refuse("node is outside the peer fork-inclusive path");
  const permission = input.permission;
  assertEvidenceConsumerExecutionManifestV2(permission.execution, PRIMARY_EVIDENCE_MANIFEST);
  if (permission.execution.consumer.id !== "module.compare_coach" || permission.execution.consumer.version !== 2
    || permission.execution.bindings.length !== 8 || !modulePolicy("compare_coach").roles.includes(permission.role)
    || !permission.assistance.modules.includes("compare_coach") || !permission.assistance.effects.some(effect => effect.moduleId === "compare_coach"
      && effect.timing === permission.timing && effect.subSurface === undefined)) return refuse("wrong current consumer, role or assistance effect");
  const modern = readRecordedEngineAttachments(input.attachments);
  if (modern.boundary.run.id !== run.id || modern.boundary.eventHead.digest !== authority.eventHeadDigest
    || modern.boundary.request.branchId !== input.branchId || modern.boundary.request.throughNodeId !== column.throughNodeId) return refuse("crossed engine source boundary");
  const row = modern.rows.find(value => value.position.payload.nodeId === entry.node.id);
  if (row === undefined || row.position.payload.fen !== entry.node.fen) return refuse("missing exact original position");
  const positionOrigin = recordedMeasurementPosition(row.position);
  if (positionOrigin.runId !== run.id || positionOrigin.headDigest !== evidenceDigest(run.events)) return refuse("foreign original position invocation");
  let selected: RecordedEngineAvailable | null = null, selectedOperand: DeclaredEvidence<unknown> | null = null;
  let unavailable: "source_pending" | "missing_eval" | "input_abstained" = "missing_eval";
  let selectedOrdinal: number | null = null;
  if (row.selected !== null) {
    if (input.offline !== null || input.pending !== null) return refuse("modern point cannot fall back or carry a second endpoint");
    const delivery = row.selected.occurrence.evaluation.payload, generation = delivery.acquisition.generation;
    if (generation === null) return refuse("modern generation is missing");
    selected = { kind: "available", score: delivery.payload.score, engineId: delivery.acquisition.actualIdentity.id,
      instrument: { origin: "provider_delivery", engineVersion: delivery.acquisition.actualIdentity.version, generation }, bound: recordedEngineRequestedBound(delivery.payload.bound) };
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
    const sourceFor = (record: SourcingLedgerRecord | RecordedSourceAbstention) => {
      const index = offline.manifest.entries.findIndex(source => source.sourceId === record.sourceId && source.retrievedAt === record.retrievedAt);
      if (index < 0) return refuse("record has no exact original manifest occurrence");
      return { source: offline.manifest.entries[index]!, index };
    };
    const fenFor = (record: SourcingLedgerRecord | RecordedSourceAbstention) => {
      const fen = fullFen(record.anchor.fen), { source } = sourceFor(record);
      if (("values" in record && Object.hasOwn(record.values, "fen") && fullFen(record.values.fen) !== fen)
        || (source.origin.kind === "engine" && fullFen(source.origin.fen) !== fen)) return refuse("conflicting original position claims");
      return fen;
    };
    // Check every requested-kind source, including off-position and unselected rows, before
    // selecting. Exact full FEN includes clocks; no equal-position-key substitution.
    const records = offline.ledger.records.flatMap((record, ordinal) => record.kind !== "engine_eval" ? []
      : fenFor(record) === entry.node.fen ? [{ record, ordinal, ...sourceFor(record) }] : []);
    const abstentions = offline.ledger.abstentions.flatMap((record, ordinal) => record.kind !== "engine_eval" ? []
      : fenFor(record) === entry.node.fen ? [{ record, ordinal, ...sourceFor(record) }] : []);
    if (records.length !== offline.candidates.length || abstentions.length !== offline.abstentions.length) return refuse("incomplete original candidate/abstention population");
    for (const [index, original] of records.entries()) {
      const candidate = offline.candidates[index]!;
      if (candidate.ordinal !== original.ordinal || candidate.record !== original.record || candidate.sourceOrdinal !== original.index
        || candidate.source !== original.source) return refuse("reordered or crossed original candidate");
    }
    for (const [index, original] of abstentions.entries()) {
      const row = offline.abstentions[index]!;
      if (row.ordinal !== original.ordinal || row.abstention !== original.record || row.sourceOrdinal !== original.index || row.source !== original.source) return refuse("reordered or crossed original abstention");
    }
    const normalized = offline.candidates.map(candidate => {
      return recordedOfflineEngineEndpoint(candidate);
    });
    const index = normalized.findIndex(value => value !== null);
    if (index >= 0) {
      const candidate = offline.candidates[index]!;
      selected = normalized[index]!; selectedOrdinal = candidate.ordinal;
      selectedOperand = candidate.invocation.result.kind === "available" ? candidate.invocation.result.value : null;
    } else if (offline.candidates.length > 0 || offline.abstentions.length > 0) unavailable = "input_abstained";
  }
  const payload: RecordedComparisonEnginePoint | null = selected === null ? null : {
    nodeId: entry.node.id, plyOffset: entry.node.ply - span[0]!.node.ply, whiteScore: selected.score,
    engineId: selected.engineId, instrument: selected.instrument, bound: selected.bound,
  };
  const inputs = selectedOperand === null ? [] : [selectedOperand, row.position];
  return { payload, unavailable, inputs, authority: { permission: { ...permission, execution: permission.execution }, comparison: authority,
    branchId: input.branchId, throughNodeId: column.throughNodeId, node: entry, position: row.position,
    modern: row, offline: input.offline, pending: input.pending, selectedOrdinal, selected, unavailable } };
}
export function isRecordedComparisonPointSource(value: unknown): value is RecordedComparisonPointSource {
  return value !== null && typeof value === "object" && points.has(value);
}
/** Runtime-owned nominal read; current storage is checked by the original attachment owner. */
export function readRecordedComparisonPointSource(source: RecordedComparisonPointSource): PointData {
  if (!isRecordedComparisonPointSource(source)) return refuse("not issued by the sole source owner");
  const owned = points.get(source)!;
  compute(owned.capture); // original boundary, operands and cancellation before any empty shortcut
  return owned.data;
}

/** Constructor authority is absent from both public barrels; census restricts its sole importer. */
export const RECORDED_COMPARISON_POINT_AUTHORITY = Object.freeze({
  issue(input: RecordedComparisonPointCapture): RecordedComparisonPointSource {
    if (!exact(input, ["comparison", "branchId", "nodeId", "permission", "attachments", "offline", "pending", "signal"])) return refuse("wrong constructor image");
    compute(input); // validate original occurrence identities before making owned envelopes
    const assistance = parseFinalizedAssistanceV1(structuredClone(input.permission.assistance));
    const offline = snapshotOffline(input.offline);
    const capture = Object.freeze({ ...input, offline, permission: Object.freeze({ ...input.permission,
      principal: Object.freeze({ ...input.permission.principal }), assistance }) });
    const data = freeze(compute(capture));
    const source = Object.freeze({}) as RecordedComparisonPointSource;
    points.set(source, { capture, data }); return source;
  },
});

function fullFen(value: unknown): string {
  if (typeof value !== "string" || value.trim().split(/\s+/u).length !== 6) return refuse("missing full six-field FEN");
  return canonicalFen(positionFromFen(value));
}
function snapshotOffline(input: RecordedComparisonOfflineCapture | null): RecordedComparisonOfflineCapture | null {
  if (input === null) return null;
  const manifest = structuredClone(input.manifest);
  const candidates = new Set(input.candidates.map(row => row.record));
  const ledger = { ...structuredClone(input.ledger), records: input.ledger.records.map(record => candidates.has(record) ? record : structuredClone(record)) };
  return { ...input, manifest, ledger,
    candidates: input.candidates.map(row => ({ ...row, source: manifest.entries[row.sourceOrdinal]! })),
    abstentions: input.abstentions.map(row => ({ ...row, abstention: ledger.abstentions[row.ordinal]!, source: manifest.entries[row.sourceOrdinal]! })),
  };
}

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value !== null && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const child of Object.values(value)) freeze(child, seen);
    Object.freeze(value);
  }
  return value;
}
