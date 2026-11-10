// Current Inspector access stays server-owned; private factory dispatch stays inside the runtime.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertInspectorPivotalProjection, collectInspectorPivotalPrefix, readInspectorPivotalCollection, type InspectorPivotalCollection, type InspectorPivotalProjection } from "../../../packages/runtime/src/inspector-pivotal-source.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { digestRunEventHead } from "../../../packages/runtime/src/run-subject.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

declare const pivotalSourceBrand: unique symbol;
export interface InspectorPivotalSource { readonly [pivotalSourceBrand]: true }
interface PivotalImage extends InspectorPivotalCollection {
  readonly context: InspectorRecordedContext;
  readonly collection: InspectorPivotalCollection;
  readonly sourceKey: string;
}
export class InspectorPivotalSourceOwner {
  readonly #sources = new WeakMap<object, { image: PivotalImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner) {}

  acquire(context: InspectorRecordedContext, projection: InspectorPivotalProjection, signal: AbortSignal): InspectorPivotalSource {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector pivotal source requires an AbortSignal");
    signal.throwIfAborted(); assertInspectorPivotalProjection(projection);
    const current = this.contexts.read(context);
    if (current.selection.context.kind !== "branch") throw new InspectorContextError("source_contract_invalid");
    signal.throwIfAborted();
    const collection = collectInspectorPivotalPrefix(current.run, current.selection.branchId, current.selection.context.throughNodeId, projection, signal);
    const data = readInspectorPivotalCollection(collection), authority = data.authority;
    if (collection.projection !== projection || authority.runId !== current.run.id
      || authority.branchId !== current.selection.branchId || authority.throughNodeId !== current.selection.context.throughNodeId
      || authority.eventHeadDigest !== digestRunEventHead({ runId: current.run.id, headSeq: current.run.events.length, events: current.run.events })
      || canonicalizeJson(authority.decision) !== canonicalizeJson(current.decision)
      || canonicalizeJson(authority.path) !== canonicalizeJson(current.paths[0]!.nodes)
      || canonicalizeJson(data.run) !== canonicalizeJson(current.run)) throw new InspectorContextError("source_contract_invalid");
    const sourceKey = presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection, authority, outcome: collection.outcome, values: collection.result.map(item => evidenceValueReceipt(item.evidence)),
    });
    const image = Object.freeze({ ...collection, context, collection, sourceKey });
    const token = Object.freeze({}) as InspectorPivotalSource;
    this.#sources.set(token, { image, signal }); this.read(token);
    return token;
  }

  read(source: InspectorPivotalSource): PivotalImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context); owned.signal.throwIfAborted();
    return owned.image;
  }
}
