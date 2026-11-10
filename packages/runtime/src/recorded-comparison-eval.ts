// Numerical differences of historical reports, never validated engine changes or move grades.
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { recordedComparisonColumn, type RecordedComparisonSource } from "./recorded-comparison.js";
import type { RecordedInspectorPacket } from "./recorded-inspector.js";
import { digestRunEvidenceItem } from "./run-subject.js";
import { STORY_PIVOT_CP } from "./story.js";
import type { EvidenceAttachedEvent, Node } from "./types.js";

export interface RecordedCompareEvalDelta {
  readonly before: number;
  readonly after: number;
  readonly delta: number;
  readonly plyOffset: number;
  readonly frame: "recorded_cp_numbers";
  readonly comparability: "provider_not_established";
}
export interface RecordedCompareEvalDeltaInput {
  readonly before: DeclaredEvidence<RecordedInspectorPacket<"eval">>;
  readonly after: DeclaredEvidence<RecordedInspectorPacket<"eval">>;
  readonly comparison: RecordedComparisonSource;
  readonly branchId: string;
}

/** The same original recorded trail for source acquisition and pair admission. No engine claim. */
export function recordedComparisonEvalTrail(comparison: RecordedComparisonSource, branchId: string): readonly Readonly<{
  event: EvidenceAttachedEvent; node: Node; plyOffset: number;
}>[] {
  const { run, authority, path } = recordedComparisonColumn(comparison, branchId);
  const forkIndex = path.findIndex(entry => entry.node.id === authority.forkNodeId), forkPly = path[forkIndex]!.node.ply;
  const nodes = new Map(path.slice(forkIndex).map(entry => [entry.node.id, entry.node]));
  return Object.freeze(run.events.flatMap(event => {
    if (event.type !== "evidence.attached" || event.data.payload.kind !== "eval" || event.data.payload.source !== "engine_validated") return [];
    const node = nodes.get(event.data.nodeId), values = event.data.payload.values;
    if (node === undefined || (!Number.isSafeInteger(values.centipawns) && !Number.isSafeInteger(values.mateIn))) return [];
    return [Object.freeze({ event, node, plyOffset: node.ply - forkPly })];
  }).sort((left, right) => left.plyOffset - right.plyOffset || left.event.seq - right.event.seq));
}

/** Both original packets must belong to this exact complete head and granted column. */
export function recordedComparisonEvalDeltaValue(input: RecordedCompareEvalDeltaInput): RecordedCompareEvalDelta | undefined {
  const { run, authority, path } = recordedComparisonColumn(input.comparison, input.branchId);
  const forkIndex = path.findIndex(entry => entry.node.id === authority.forkNodeId);
  const nodes = new Map(path.slice(forkIndex).map(entry => [entry.node.id, entry.node]));
  function original(record: DeclaredEvidence<RecordedInspectorPacket<"eval">>): EvidenceAttachedEvent {
    assertDeclaredEvidence(record);
    const receipt = evidenceValueReceipt(record), packet = record.payload;
    if (record.projection.id !== "recorded.inspector.eval_packet" || record.projection.version !== 1
      || receipt.factory !== "createRecordedInspectorEvalPacketV1Evidence" || receipt.inputDigest !== evidenceDigest(packet)) {
      throw new TypeError("Recorded numerical difference requires genuine exact eval packets");
    }
    const { subject, event } = packet, node = nodes.get(subject.nodeId);
    if (packet.authority !== "recorded_report_only" || subject.runId !== run.id || subject.eventHeadDigest !== authority.eventHeadDigest
      || subject.branchId !== input.branchId || node === undefined || subject.fen !== node.fen
      || event.data.nodeId !== node.id || event.data.payload.kind !== "eval"
      || evidenceDigest(run.events[event.seq - 1]) !== evidenceDigest(event)
      || packet.itemDigest !== digestRunEvidenceItem({ runId: run.id, eventHeadDigest: subject.eventHeadDigest, eventSeq: event.seq, event })) {
      throw new TypeError("Recorded eval packet crosses its original head, event or granted comparison path");
    }
    return event;
  }
  // Validate both even when the first cannot produce a numerical witness.
  const before = original(input.before), after = original(input.after);
  // Match the existing overlay exactly: cp first, otherwise typed mate; uninterpretable rows do
  // not enter that trail. Mate entries remain between their neighbours and cannot turn into cp.
  const trail = recordedComparisonEvalTrail(input.comparison, input.branchId);
  const index = trail.findIndex(entry => entry.event.seq === before.seq);
  if (index < 0 || trail[index + 1]?.event.seq !== after.seq) return undefined;
  const beforeCp = before.data.payload.values.centipawns, afterCp = after.data.payload.values.centipawns;
  if (!Number.isSafeInteger(beforeCp) || !Number.isSafeInteger(afterCp)) return undefined;
  const delta = (afterCp as number) - (beforeCp as number);
  if (!Number.isSafeInteger(delta) || Math.abs(delta) < STORY_PIVOT_CP) return undefined;
  return { before: beforeCp as number, after: afterCp as number, delta, plyOffset: trail[index + 1]!.plyOffset,
    frame: "recorded_cp_numbers", comparability: "provider_not_established" };
}
