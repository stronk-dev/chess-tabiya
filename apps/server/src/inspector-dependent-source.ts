// One request-owned dependent source over the existing current full-run Inspector grant.
import { collectInspectorDependentEdge, parseInspectorDependentRequest, type InspectorDependentRequest, type InspectorDependentCollection } from "../../../packages/runtime/src/inspector-dependent-source.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { openRetryEntry } from "../../../packages/runtime/src/review-branch-state.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

declare const dependentSourceBrand: unique symbol;
export interface InspectorDependentSource { readonly [dependentSourceBrand]: true }
interface DependentImage {
  readonly context: InspectorRecordedContext;
  readonly request: InspectorDependentRequest;
  readonly sourceKey: string | null;
  readonly collection: InspectorDependentCollection | null;
  readonly outcome: InspectorDependentCollection["outcome"] | Readonly<{ kind: "missing_context"; reason: "no_incoming_edge" }>;
}
export class InspectorDependentSourceOwner {
  readonly #sources = new WeakMap<object, { image: DependentImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner) {}

  acquire(context: InspectorRecordedContext, input: InspectorDependentRequest, signal: AbortSignal): InspectorDependentSource {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector dependent source requires an AbortSignal");
    signal.throwIfAborted();
    const request = parseInspectorDependentRequest(input), current = this.contexts.read(context);
    if (current.selection.context.kind !== "incoming_edge") throw new InspectorContextError("source_contract_invalid");
    const nodes = current.paths[0]!.nodes;
    if (request.projection === "derived.tactic.defender_exposure@2" && nodes.length >= 2
      && openRetryEntry(current.run, current.selection.branchId) === nodes[0]!.id) throw new InspectorContextError("withheld");
    const collection = nodes.length < 2 ? null : collectInspectorDependentEdge(current.run, nodes[0]!, current.selected, request);
    const sourceKey = collection === null ? null : presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      request, edge: evidenceValueReceipt(collection.edge), outcome: collection.outcome,
      dependencies: collection.dependencies.map(value => evidenceValueReceipt(value)),
      values: collection.values.map(value => evidenceValueReceipt(value)),
    });
    const outcome: DependentImage["outcome"] = collection?.outcome ?? Object.freeze({ kind: "missing_context", reason: "no_incoming_edge" });
    const image = Object.freeze({ context, request, sourceKey, collection, outcome });
    const token = Object.freeze({}) as InspectorDependentSource;
    this.#sources.set(token, { image, signal });
    this.read(token); // synchronous collectors cannot yield; reject stale/cancelled work before publishing
    return token;
  }

  read(source: InspectorDependentSource): DependentImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context); owned.signal.throwIfAborted();
    return owned.image;
  }
}
