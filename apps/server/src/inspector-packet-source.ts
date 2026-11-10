// A saved packet cannot authorize current Inspector access or a new provider request.
import { assertInspectorPacketProjection, collectInspectorRecordedPackets, type InspectorPacketProjection, type InspectorPacketCollection } from "../../../packages/runtime/src/inspector-packet-source.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { assertResolvedRunSubject, digestRunEventHead } from "../../../packages/runtime/src/run-subject.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

declare const packetSourceBrand: unique symbol;
export interface InspectorPacketSource { readonly [packetSourceBrand]: true }
interface PacketImage {
  readonly context: InspectorRecordedContext;
  readonly projection: InspectorPacketProjection;
  readonly collection: InspectorPacketCollection;
  readonly sourceKey: string | null;
  readonly outcome: InspectorPacketCollection["outcome"];
}
export class InspectorPacketSourceOwner {
  readonly #sources = new WeakMap<object, { image: PacketImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner) {}

  acquire(context: InspectorRecordedContext, projection: InspectorPacketProjection, signal: AbortSignal): InspectorPacketSource {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector packet source requires an AbortSignal");
    signal.throwIfAborted(); assertInspectorPacketProjection(projection);
    const current = this.contexts.read(context);
    if (current.selection.context.kind !== "position") throw new InspectorContextError("source_contract_invalid");
    const collection = collectInspectorRecordedPackets(current.run, current.selection.branchId, current.selected.id, projection);
    assertResolvedRunSubject(collection.resolved);
    const subject = collection.resolved.subject;
    if (collection.projection !== projection || subject.kind !== "run_node" || subject.runId !== current.run.id
      || subject.branchId !== current.selection.branchId || subject.nodeId !== current.selected.id || subject.fen !== current.selected.fen
      || collection.resolved.headSeq !== current.run.events.length || subject.eventHeadDigest !== digestRunEventHead({ runId: current.run.id,
        headSeq: current.run.events.length, events: current.run.events })) throw new InspectorContextError("source_contract_invalid");
    const sourceKey = collection.outcome.kind !== "available" ? null : presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection, subject: collection.resolved.subjectDigest,
      occurrences: collection.occurrences.map(row => ({ ordinal: row.ordinal, eventSeq: row.eventSeq, itemDigest: row.itemDigest,
        source: evidenceValueReceipt(row.source), value: evidenceValueReceipt(row.value) })),
    });
    const image = Object.freeze({ context, projection, collection, sourceKey, outcome: collection.outcome });
    const token = Object.freeze({}) as InspectorPacketSource;
    this.#sources.set(token, { image, signal }); this.read(token);
    return token;
  }

  read(source: InspectorPacketSource): PacketImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context); owned.signal.throwIfAborted();
    return owned.image;
  }
}
