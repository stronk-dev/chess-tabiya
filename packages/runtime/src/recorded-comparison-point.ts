// Package-private point authority. Issuance is exported only through the server-owner subpath.
import { branchPath } from "./branch-path.js";
import { parseFinalizedAssistanceV1, type FinalizedAssistanceV1 } from "./assistance-exchange.js";
import { assertEvidenceConsumerExecutionManifestV2, type CompiledEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import type { EvidenceRole } from "./evidence-contract.js";
import { modulePolicy } from "./module-policy.js";
import { recordedComparisonColumn, type RecordedComparisonSource } from "./recorded-comparison.js";
import type { ReviewEngineScore } from "./review-points.js";
import { readRecordedEngineAttachments, type RecordedEngineAttachments } from "./internal/recorded-engine-attachments.js";
import type { RecordedEngineInstrument, RecordedEngineRequestedBound } from "./internal/recorded-engine-endpoint-values.js";
import { readRecordedEngineNode, snapshotRecordedEngineOffline, type RecordedEngineOfflineCapture } from "./internal/recorded-engine-node.js";

export interface RecordedComparisonPermission {
  readonly principal: Readonly<{ learnerId: string; handle: string }>;
  readonly role: EvidenceRole;
  readonly assistance: FinalizedAssistanceV1;
  readonly timing: "checkpoint" | "review";
  readonly execution: CompiledEvidenceConsumerExecutionV2;
}
export interface RecordedComparisonPointCapture {
  readonly comparison: RecordedComparisonSource;
  readonly branchId: string;
  readonly nodeId: string;
  readonly permission: RecordedComparisonPermission;
  readonly attachments: RecordedEngineAttachments;
  readonly offline: RecordedEngineOfflineCapture | null;
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
const points = new WeakMap<object, { readonly capture: RecordedComparisonPointCapture; readonly data: PointData; readonly assertOwnerCurrent: () => void }>();
const refuse = (message: string): never => { throw new TypeError(`Comparison point: ${message}`); };
// Internal issuer lifetime only; it supplies no evidence or source-valid Boolean.
function assertOwnerCurrent(check: () => void): void {
  if (typeof check !== "function" || check() !== undefined) return refuse("requires the source owner's current access check");
}
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
  const { selected, selectedOperand, selectedOrdinal, unavailable } = readRecordedEngineNode({
    attachments: input.attachments, nodeId: input.nodeId, offline: input.offline, pending: input.pending,
  });
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
  owned.capture.signal.throwIfAborted();
  assertOwnerCurrent(owned.assertOwnerCurrent);
  compute(owned.capture); // original boundary, operands and cancellation before any empty shortcut
  assertOwnerCurrent(owned.assertOwnerCurrent);
  return owned.data;
}

/** Constructor authority is absent from both public barrels; census restricts its sole importer. */
export const RECORDED_COMPARISON_POINT_AUTHORITY = Object.freeze({
  issue(input: RecordedComparisonPointCapture, checkCurrentOwner: () => void): RecordedComparisonPointSource {
    if (!exact(input, ["comparison", "branchId", "nodeId", "permission", "attachments", "offline", "pending", "signal"])) return refuse("wrong constructor image");
    assertOwnerCurrent(checkCurrentOwner);
    compute(input); // validate original occurrence identities before making owned envelopes
    const assistance = parseFinalizedAssistanceV1(structuredClone(input.permission.assistance));
    const offline = snapshotRecordedEngineOffline(input.offline);
    const capture = Object.freeze({ ...input, offline, permission: Object.freeze({ ...input.permission,
      principal: Object.freeze({ ...input.permission.principal }), assistance }) });
    const data = freeze(compute(capture));
    assertOwnerCurrent(checkCurrentOwner);
    const source = Object.freeze({}) as RecordedComparisonPointSource;
    points.set(source, { capture, data, assertOwnerCurrent: checkCurrentOwner }); return source;
  },
});

function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value !== null && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    for (const child of Object.values(value)) freeze(child, seen);
    Object.freeze(value);
  }
  return value;
}
