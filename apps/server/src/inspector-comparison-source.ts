// Current access and exact explicit endpoint selection stay owned by the existing RunService grant.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { collectInspectorComparisonSource, readInspectorComparisonCollection, assertInspectorComparisonProjection,
  type InspectorComparisonCollection, type InspectorComparisonProjection } from "../../../packages/runtime/src/inspector-comparison-source.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { digestRunEventHead } from "@chess-tabiya/runtime/run-subject";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

declare const comparisonSourceBrand: unique symbol;
export interface InspectorComparisonSource { readonly [comparisonSourceBrand]: true }
interface ComparisonImage {
  readonly context: InspectorRecordedContext;
  readonly projection: InspectorComparisonProjection;
  readonly collection: InspectorComparisonCollection;
  readonly sourceKey: string;
  readonly outcome: InspectorComparisonCollection["outcome"];
}
export class InspectorComparisonSourceOwner {
  readonly #sources = new WeakMap<object, { image: ComparisonImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner) {}

  acquire(context: InspectorRecordedContext, projection: InspectorComparisonProjection, signal: AbortSignal): InspectorComparisonSource {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector comparison source requires an AbortSignal");
    signal.throwIfAborted(); assertInspectorComparisonProjection(projection);
    const current = this.contexts.read(context);
    if (current.selection.context.kind !== "comparison" || current.paths.length !== 2) throw new InspectorContextError("source_contract_invalid");
    const columns = [{ branchId: current.selection.branchId, throughNodeId: current.selection.nodeId },
      { branchId: current.selection.context.otherBranchId, throughNodeId: current.selection.context.otherNodeId }] as const;
    signal.throwIfAborted();
    const collection = collectInspectorComparisonSource(current.run, columns, projection, signal);
    const data = readInspectorComparisonCollection(collection), authority = data.authority;
    if (collection.projection !== projection || collection.branchId !== columns[0].branchId || authority.runId !== current.run.id
      || canonicalizeJson(data.run) !== canonicalizeJson(current.run) || canonicalizeJson(authority.columns) !== canonicalizeJson(columns)
      || canonicalizeJson(authority.decision) !== canonicalizeJson(current.decision)
      || authority.eventHeadDigest !== digestRunEventHead({ runId: current.run.id, headSeq: current.run.events.length, events: current.run.events })
      || authority.paths.some((path, index) => canonicalizeJson(path.map(entry => entry.node)) !== canonicalizeJson(current.paths[index]!.nodes))) throw new InspectorContextError("source_contract_invalid");
    signal.throwIfAborted(); this.contexts.read(context);
    const sourceKey = presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection, authority, outcome: collection.outcome,
      inputs: collection.projection === "derived.compare.structure_delta@2"
        ? { structuralImage: collection.proof.reduction.sourceImageDigest }
        : { trail: collection.trail.map((row, index) => ({ nodeId: row.node.id, eventSeq: row.event.seq,
            plyOffset: row.plyOffset, packet: evidenceValueReceipt(collection.packets[index]!) })),
          pairs: collection.invocations.map(row => ({ before: evidenceValueReceipt(row.input.before),
            after: evidenceValueReceipt(row.input.after), result: row.result.map(evidenceValueReceipt) })) },
      values: collection.result.map(item => ({ nodeId: item.nodeId, plyOffset: item.plyOffset, receipt: evidenceValueReceipt(item.evidence) })),
    });
    const image = Object.freeze({ context, projection, collection, sourceKey, outcome: collection.outcome }), token = Object.freeze({}) as InspectorComparisonSource;
    this.#sources.set(token, { image, signal }); this.read(token); return token;
  }

  read(source: InspectorComparisonSource): ComparisonImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context); owned.signal.throwIfAborted(); return owned.image;
  }
}
