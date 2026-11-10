// Accepted F2 §2.3a/module-registration §4.11a: saved reports, never fresh provider computation.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertDeclaredEvidence, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { RecordedInspectorPacket } from "./recorded-inspector.js";
import { digestRunEventHead, digestRunEvidenceItem, resolveRunSubject, type ResolvedRunSubject, type RunEvidenceItemDigest } from "./run-subject.js";
import type { DrillRun } from "./types.js";

const KINDS = Object.freeze({
  "recorded.inspector.eval_packet@1": "eval", "recorded.inspector.wdl_packet@1": "wdl",
  "recorded.inspector.pv_packet@1": "bestline", "recorded.inspector.tablebase_packet@1": "tablebase",
  "derived.inspector.tablebase_category@1": "tablebase", "derived.inspector.tablebase_distance@1": "tablebase",
} as const);
export type InspectorPacketProjection = keyof typeof KINDS;
export const INSPECTOR_PACKET_PROJECTIONS = Object.freeze(Object.keys(KINDS) as InspectorPacketProjection[]);
export function assertInspectorPacketProjection(projection: unknown): asserts projection is InspectorPacketProjection {
  if (typeof projection !== "string" || !Object.hasOwn(KINDS, projection)) throw new TypeError("Unknown exact saved Inspector topic");
}
interface PacketOccurrence {
  /** Original ordinal in the complete recorded event stream, not a filtered population index. */
  readonly ordinal: number;
  readonly eventSeq: number;
  readonly itemDigest: RunEvidenceItemDigest;
  readonly source: DeclaredEvidence<RecordedInspectorPacket>;
  readonly value: DeclaredEvidence<unknown>;
}
export interface InspectorPacketCollection {
  readonly projection: InspectorPacketProjection;
  readonly resolved: ResolvedRunSubject;
  readonly occurrences: readonly PacketOccurrence[];
  readonly outcome: Readonly<{ kind: "available"; collected: number }>
    | Readonly<{ kind: "unavailable"; reason: "source_absent" }>
    | Readonly<{ kind: "failed"; reason: "source_contract_invalid" }>;
}
/** The server supplies its unchanged current granted run; the resolved subject is not permission. */
export function collectInspectorRecordedPackets(run: DrillRun, branchId: string, nodeId: string, projection: InspectorPacketProjection): InspectorPacketCollection {
  assertInspectorPacketProjection(projection);
  const resolved = resolveRunSubject(run, { kind: "run_node", runId: run.id, branchId, nodeId,
    eventHeadDigest: digestRunEventHead({ runId: run.id, headSeq: run.events.length, events: run.events }) });
  const occurrences: PacketOccurrence[] = [];
  try {
    for (const [ordinal, event] of resolved.run.events.entries()) {
      if (event.type !== "evidence.attached" || event.data.nodeId !== nodeId || event.data.payload.kind !== KINDS[projection]
        || event.data.payload.source === "human_model_predicted") continue;
      const itemDigest = digestRunEvidenceItem({ runId: run.id, eventHeadDigest: resolved.subject.eventHeadDigest, eventSeq: event.seq, event });
      const checkPacket = (packet: DeclaredEvidence<RecordedInspectorPacket>, ref: string) => {
        assertDeclaredEvidence(packet);
        if (`${packet.projection.id}@${packet.projection.version}` !== ref
          || canonicalizeJson(packet.payload) !== canonicalizeJson({ subject: resolved.subject, itemDigest, event, authority: "recorded_report_only" })) throw new TypeError("Saved Inspector report crosses its exact recorded occurrence");
      };
      let source: DeclaredEvidence<RecordedInspectorPacket>, value: DeclaredEvidence<unknown>;
      if (projection === "derived.inspector.tablebase_category@1" || projection === "derived.inspector.tablebase_distance@1") {
        const packet = invokeEvidenceValueRoute("recorded.inspector.tablebase_packet@1", { resolved, itemDigest });
        checkPacket(packet, "recorded.inspector.tablebase_packet@1");
        source = packet; value = invokeEvidenceValueRoute(projection, { record: packet });
        if (canonicalizeJson((value.payload as { record: unknown }).record) !== canonicalizeJson(packet.payload)) throw new TypeError("Saved Inspector view crosses its actual packet");
      } else { source = value = invokeEvidenceValueRoute(projection, { resolved, itemDigest }); checkPacket(source, projection); }
      assertDeclaredEvidence(value);
      if (`${value.projection.id}@${value.projection.version}` !== projection) throw new TypeError("Saved Inspector value crosses its exact projection");
      occurrences.push(Object.freeze({ ordinal, eventSeq: event.seq, itemDigest, source, value }));
    }
  } catch {
    return Object.freeze({ projection, resolved, occurrences: Object.freeze([]), outcome: Object.freeze({ kind: "failed", reason: "source_contract_invalid" }) });
  }
  const outcome = occurrences.length === 0 ? Object.freeze({ kind: "unavailable" as const, reason: "source_absent" as const })
    : Object.freeze({ kind: "available" as const, collected: occurrences.length });
  return Object.freeze({ projection, resolved, occurrences: Object.freeze(occurrences), outcome });
}
