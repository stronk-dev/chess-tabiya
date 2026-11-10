// Request-owned rules source over the existing current full-run grant, not a new evidence mint.
import { assertInspectorLocalSourceEvents, collectInspectorLocalEdge, collectInspectorLocalPosition, inspectorLocalScope, type InspectorLocalProjection } from "../../../packages/runtime/src/inspector-local-source.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import { presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { InspectorContextError, InspectorRecordedContextOwner, type InspectorRecordedContext } from "./inspector-recorded-context.js";

import type { SemanticEvidenceEvent } from "../../../packages/runtime/src/semantic-evidence.js";

declare const localSourceBrand: unique symbol;
export interface InspectorLocalSource { readonly [localSourceBrand]: true }
type LocalInput = Readonly<{ fen: string }> | Readonly<{ beforeFen: string; moveUci: string; afterFen: string }>;
interface LocalImage {
  readonly context: InspectorRecordedContext;
  readonly projection: InspectorLocalProjection;
  readonly sourceKey: string | null;
  readonly input: LocalInput | null;
  readonly outcome: Readonly<{ kind: "available"; collected: number }> | Readonly<{ kind: "no_witness" }> | Readonly<{ kind: "missing_context"; reason: "no_incoming_edge" }>;
  readonly values: readonly DeclaredEvidence<unknown>[];
  readonly semanticEvents: readonly SemanticEvidenceEvent[] | null;
}
export class InspectorLocalSourceOwner {
  readonly #sources = new WeakMap<object, { image: LocalImage; signal: AbortSignal }>();
  constructor(readonly contexts: InspectorRecordedContextOwner) {}

  acquire(context: InspectorRecordedContext, projection: InspectorLocalProjection, signal: AbortSignal): InspectorLocalSource {
    signal.throwIfAborted();
    const scope = inspectorLocalScope(projection), current = this.contexts.read(context);
    if (current.selection.context.kind !== scope) throw new InspectorContextError("source_contract_invalid");
    const nodes = current.paths[0]!.nodes;
    const missing = scope === "incoming_edge" && nodes.length < 2;
    const input: LocalInput | null = missing ? null : scope === "position" ? Object.freeze({ fen: current.selected.fen })
      : Object.freeze({ beforeFen: nodes[0]!.fen, moveUci: current.selected.moveUci!, afterFen: current.selected.fen });
    const edgeResult = input !== null && !("fen" in input) ? collectInspectorLocalEdge(projection, input) : null;
    const values = edgeResult !== null ? edgeResult.values : input !== null && "fen" in input
      ? collectInspectorLocalPosition(projection, input.fen) : Object.freeze([]);
    const semanticEvents = edgeResult?.semanticEvents ?? null;
    assertInspectorLocalSourceEvents({ projection, input, values, semanticEvents });
    const sourceKey = missing ? null : presentationDigest("inspector.source@1", {
      runId: current.run.id, decision: current.decision, selection: current.selection,
      viewer: { learnerId: current.principal.learnerId, role: current.role },
      requestedConfigDigest: current.assistance.requestedDigest, effectiveConfigDigest: current.assistance.finalDigest,
      projection, input, values: values.map(value => evidenceValueReceipt(value)),
      ...(semanticEvents === null ? {} : { semanticEvents: semanticEvents.map(event => ({ id: event.id, anchor: event.anchor, sign: event.sign })) }),
    });
    const outcome: LocalImage["outcome"] = missing ? Object.freeze({ kind: "missing_context", reason: "no_incoming_edge" })
      : values.length === 0 ? Object.freeze({ kind: "no_witness" }) : Object.freeze({ kind: "available", collected: values.length });
    const image = Object.freeze({ context, projection, sourceKey, input, outcome, values, semanticEvents });
    const token = Object.freeze({}) as InspectorLocalSource;
    this.#sources.set(token, { image, signal });
    this.read(token); // current access/config/source and cancellation checked again after collector work
    return token;
  }

  read(source: InspectorLocalSource): LocalImage {
    const owned = source !== null && typeof source === "object" ? this.#sources.get(source) : undefined;
    if (owned === undefined) throw new InspectorContextError("source_contract_invalid");
    owned.signal.throwIfAborted(); this.contexts.read(owned.image.context); owned.signal.throwIfAborted();
    assertInspectorLocalSourceEvents(owned.image);
    return owned.image;
  }
}
