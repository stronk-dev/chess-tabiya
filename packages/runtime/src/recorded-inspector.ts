// Historical reports, not modern provider deliveries or chess/model qualification.
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { SYZYGY_TABLEBASE_CATEGORIES, type SyzygyTablebaseCategory } from "./provider-types.js";
import { assertResolvedRunSubject, resolveRunEvidenceItem, type EvidenceAvailabilitySubject, type ResolvedRunSubject, type RunEvidenceItemDigest } from "./run-subject.js";
import type { EvidenceAttachedEvent, EvidenceKind, OpponentMoveSelectedEvent } from "./types.js";

type NodeSubject = Extract<EvidenceAvailabilitySubject, { readonly kind: "run_node" }>;
export interface RecordedInspectorPacket<K extends EvidenceKind = EvidenceKind> {
  readonly subject: NodeSubject;
  readonly itemDigest: RunEvidenceItemDigest;
  readonly event: EvidenceAttachedEvent & { readonly data: EvidenceAttachedEvent["data"] & { readonly payload: EvidenceAttachedEvent["data"]["payload"] & { readonly kind: K } } };
  readonly authority: "recorded_report_only";
}
export interface RecordedInspectorSelection {
  readonly subject: NodeSubject;
  readonly event: OpponentMoveSelectedEvent;
  readonly requestedTargetElo: number | null;
  readonly authority: "recorded_report_only";
}
export type ReportedInspectorField<T> = Readonly<{ kind: "reported"; value: T }> | Readonly<{ kind: "not_recorded" }> | Readonly<{ kind: "uninterpretable" }>;
export interface RecordedInspectorTablebaseCategory {
  readonly record: RecordedInspectorPacket<"tablebase">;
  readonly category: ReportedInspectorField<SyzygyTablebaseCategory>;
}
export interface RecordedInspectorTablebaseDistance extends RecordedInspectorTablebaseCategory {
  readonly dtz: ReportedInspectorField<number | null>;
  readonly preciseDtz: ReportedInspectorField<number | null>;
  readonly dtm: ReportedInspectorField<number | null>;
}

export function isRecordedInspectorNode(candidate: unknown): candidate is ResolvedRunSubject {
  try { assertResolvedRunSubject(candidate as ResolvedRunSubject); return (candidate as ResolvedRunSubject).subject.kind === "run_node"; }
  catch { return false; }
}
function nodeSubject(resolved: ResolvedRunSubject): NodeSubject {
  assertResolvedRunSubject(resolved);
  if (resolved.subject.kind !== "run_node") throw new TypeError("Recorded Inspector requires an exact resolved run node");
  return resolved.subject;
}

/** Item lookup validates the full envelope/head, not an equal payload or current-board FEN. */
export function recordedInspectorPacketValue<K extends EvidenceKind>(resolved: ResolvedRunSubject, itemDigest: RunEvidenceItemDigest, kind: K): RecordedInspectorPacket<K> {
  const subject = nodeSubject(resolved), event = resolveRunEvidenceItem(resolved, itemDigest);
  if (event.data.nodeId !== subject.nodeId || event.data.payload.kind !== kind || event.data.payload.source === "human_model_predicted") {
    throw new TypeError("Recorded Inspector packet has a crossed node, kind or model source");
  }
  return { subject, itemDigest, event: event as RecordedInspectorPacket<K>["event"], authority: "recorded_report_only" };
}

/** Undefined means the selected recorded event omitted candidates, not an empty distribution. */
export function recordedInspectorSelectionValue(resolved: ResolvedRunSubject, eventSeq: number): RecordedInspectorSelection | undefined {
  const subject = nodeSubject(resolved);
  if (!Number.isSafeInteger(eventSeq) || eventSeq < 1 || eventSeq > resolved.headSeq) throw new TypeError("Recorded selection sequence is outside the selected head");
  const event = resolved.run.events[eventSeq - 1];
  if (event?.type !== "opponent.move_selected" || event.seq !== eventSeq || event.data.nodeId !== subject.nodeId || event.data.branchId !== subject.branchId || event.data.selection.policyModeApplied !== "human_common") {
    throw new TypeError("Recorded selection has a crossed event, node, branch or policy mode");
  }
  if (event.data.selection.candidates === undefined) return undefined;
  if (!Array.isArray(event.data.selection.candidates)) throw new TypeError("Recorded selection candidates must be an actual array");
  return { subject, event, requestedTargetElo: resolved.run.opponentPolicy.targetElo ?? null, authority: "recorded_report_only" };
}

function tablebaseRecord(record: DeclaredEvidence<RecordedInspectorPacket<"tablebase">>): RecordedInspectorPacket<"tablebase"> {
  assertDeclaredEvidence(record);
  const receipt = evidenceValueReceipt(record);
  if (record.projection.id !== "recorded.inspector.tablebase_packet" || record.projection.version !== 1 ||
    receipt.factory !== "createRecordedInspectorTablebasePacketV1Evidence" || receipt.inputDigest !== evidenceDigest(record.payload)) {
    throw new TypeError("Recorded tablebase views require the genuine exact packet source");
  }
  return record.payload;
}
function field<T>(values: Readonly<Record<string, unknown>>, key: string, accepts: (value: unknown) => value is T): ReportedInspectorField<T> {
  if (!Object.hasOwn(values, key)) return { kind: "not_recorded" };
  const value = values[key];
  return accepts(value) ? { kind: "reported", value } : { kind: "uninterpretable" };
}
const category = (value: unknown): value is SyzygyTablebaseCategory => typeof value === "string" && SYZYGY_TABLEBASE_CATEGORIES.includes(value as SyzygyTablebaseCategory);
const distance = (value: unknown): value is number | null => value === null || Number.isSafeInteger(value);
export function recordedInspectorCategoryValue(source: DeclaredEvidence<RecordedInspectorPacket<"tablebase">>): RecordedInspectorTablebaseCategory {
  const record = tablebaseRecord(source);
  return { record, category: field(record.event.data.payload.values, "category", category) };
}
export function recordedInspectorDistanceValue(source: DeclaredEvidence<RecordedInspectorPacket<"tablebase">>): RecordedInspectorTablebaseDistance {
  const result = recordedInspectorCategoryValue(source), values = result.record.event.data.payload.values;
  return { ...result, dtz: field(values, "dtz", distance), preciseDtz: field(values, "preciseDtz", distance), dtm: field(values, "dtm", distance) };
}
