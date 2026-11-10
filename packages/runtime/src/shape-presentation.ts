// D4054: registered recognition is separate from authored catalogue plans and navigation metadata.
// Core shape producers must not import this module: the presentation registry uses their renderer.
import { compileEvidenceConsumerExecution } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertConsumerEvidenceView, evidenceForConsumer, type ConsumerEvidenceView } from "./evidence-contract.js";
import { declareShapeFiringEvidence, type ShapeFiring, type ShapeTriggerSource } from "./shape-firing.js";
import { PresentationError, presentEvidenceItems, serializePresentedEvidence, type PresentedEvidenceItem } from "./presentation-contract.js";
import { invokeEvidenceValueRoute, readCurrentShapeFiringInvocation } from "./internal/evidence-value-routes.js";
import type { RegisteredShapeScan } from "./internal/registered-shape-scan.js";
import type { GuidedShapePage, GuidedShapeFiringValue } from "./guided-shape-query.js";

export const CURRENT_SHAPE_CONSUMER = Object.freeze({ id: "theory.shape_firing", version: 2 });
export function consumeCurrentShapeFiring(view: ConsumerEvidenceView<GuidedShapeFiringValue>): GuidedShapePage["firings"] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== CURRENT_SHAPE_CONSUMER.id || view.consumer.version !== CURRENT_SHAPE_CONSUMER.version) throw new TypeError("Expected exact current registered shape consumer");
  return Object.freeze(view.items.map(evidence => Object.freeze({ value: evidence.payload,
    presentation: serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CURRENT_SHAPE_CONSUMER, [evidence]))) })));
}
export function currentShapeFiringsForGuidance(scan: RegisteredShapeScan): GuidedShapePage["firings"] {
  compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, CURRENT_SHAPE_CONSUMER);
  const result = invokeEvidenceValueRoute("theory.shapes.firing@3", { scan });
  readCurrentShapeFiringInvocation(result, scan);
  return consumeCurrentShapeFiring(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CURRENT_SHAPE_CONSUMER, result));
}

const CONSUMER = Object.freeze({ id: "theory.shape_firing", version: 1 });
export type PresentedShapeFiring = Readonly<{
  firing: ShapeFiring;
  presentation: Readonly<{ kind: "ready"; items: readonly PresentedEvidenceItem[] } | { kind: "failed" }>;
}>;

export function consumeShapeFiring(view: ConsumerEvidenceView<ShapeFiring>): readonly PresentedShapeFiring[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== CONSUMER.id || view.consumer.version !== CONSUMER.version) {
    throw new TypeError("Expected theory.shape_firing@1 consumer view");
  }
  return Object.freeze(view.items.map(evidence => {
    try {
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CONSUMER, [evidence]));
      return Object.freeze({ firing: evidence.payload, presentation: Object.freeze({ kind: "ready" as const, items }) });
    } catch (error) {
      if (!(error instanceof PresentationError && error.code === "PRESENTATION_INVALID")) throw error;
      return Object.freeze({ firing: evidence.payload, presentation: Object.freeze({ kind: "failed" as const }) });
    }
  }));
}

export function shapeFiringEvidence(entries: readonly ShapeTriggerSource[],
  path: readonly { readonly id: string; readonly fen: string }[]): readonly PresentedShapeFiring[] {
  compileEvidenceConsumerExecution(PRIMARY_EVIDENCE_MANIFEST, CONSUMER);
  return consumeShapeFiring(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, CONSUMER, declareShapeFiringEvidence(entries, path)));
}
