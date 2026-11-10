// Accepted module-registration §4.11a/D3815: permission and recorded-window source scope stay separate.
import { recordedSemanticWindowSource, type RecordedSemanticWindowResult } from "../../../packages/runtime/src/recorded-semantic-window.js";
import { RECORDED_SEQUENCE_HORIZONS, type RecordedSequenceRoute } from "../../../packages/runtime/src/recorded-sequence-window.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

declare const windowSourceBrand: unique symbol;
export interface InspectorWindowSource { readonly [windowSourceBrand]: true }
type WindowOutcome = Readonly<{ kind: "available"; collected: number }> | Readonly<{ kind: "no_witness" }>
  | Readonly<{ kind: "missing_context"; reason: "no_recorded_window" }>
  | Readonly<{ kind: "failed"; reason: "source_contract_invalid" | "source_lookup_failed" }>
  | Readonly<{ kind: "unavailable"; reason: "source_version_held"; dependency: string }>;
interface WindowImage {
  readonly context: InspectorRecordedContext;
  readonly projection: RecordedSequenceRoute;
  readonly result: RecordedSemanticWindowResult;
  readonly sourceKey: string | null;
  readonly outcome: WindowOutcome;
}
export class InspectorWindowSourceOwner {
  readonly #sources = new WeakMap<object, { image: WindowImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner) {}

  acquire(context: InspectorRecordedContext, projection: RecordedSequenceRoute, signal: AbortSignal): InspectorWindowSource {
    if (!(signal instanceof AbortSignal)) throw new TypeError("Inspector window source requires an AbortSignal");
    signal.throwIfAborted();
    // Inspector admits the ten exact @3 successors, not the generic supplier's trade@2 sibling.
    if (typeof projection !== "string" || !Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, projection)) throw new InspectorContextError("source_contract_invalid");
    const current = this.contexts.read(context);
    if (current.selection.context.kind !== "recorded_window") throw new InspectorContextError("source_contract_invalid");
    const requested = { id: projection.slice(0, -2), version: 3 };
    const result = recordedSemanticWindowSource({ run: current.run, branchId: current.selection.branchId,
      throughNodeId: current.selected.id, projection: requested });
    if (result.kind !== "window_refused" && (result.scope.runId !== current.run.id
      || result.scope.branchId !== current.selection.branchId || result.scope.throughNodeId !== current.selected.id
      || result.scope.projection.id !== requested.id || result.scope.projection.version !== requested.version)) throw new InspectorContextError("source_contract_invalid");
    let outcome: WindowOutcome;
    if (result.kind === "window_available") outcome = result.events.length === 0 ? Object.freeze({ kind: "no_witness" })
      : Object.freeze({ kind: "available", collected: result.events.length });
    else if (result.kind === "window_missing") outcome = Object.freeze({ kind: "missing_context", reason: "no_recorded_window" });
    else if (result.reason === "source_contract_invalid" || result.reason === "source_lookup_failed") outcome = Object.freeze({ kind: "failed", reason: result.reason });
    else if (result.reason === "source_version_held") outcome = Object.freeze({ kind: "unavailable", reason: result.reason, dependency: result.dependency });
    else throw new InspectorContextError("source_contract_invalid"); // graph/request refusal is never source absence
    const sourceKey = result.kind !== "window_available" ? null : presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection, sourceIdentity: result.identity,
    });
    const image = Object.freeze({ context, projection, result, sourceKey, outcome });
    const token = Object.freeze({}) as InspectorWindowSource;
    this.#sources.set(token, { image, signal });
    this.read(token);
    return token;
  }

  read(source: InspectorWindowSource): WindowImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context); owned.signal.throwIfAborted();
    return owned.image;
  }
}
