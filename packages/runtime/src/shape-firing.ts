import { matchesStructuralExpression, type StructuralExpression } from "./structure.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertConsumerEvidenceView, declareEvidence, evidenceForConsumer, type ConsumerEvidenceView, type DeclaredEvidence } from "./evidence-contract.js";

export interface ShapeTriggerSource {
  readonly id: string;
  readonly trigger: StructuralExpression;
}

export interface ShapeFiring {
  readonly entryId: string;
  readonly firstNodeId: string;
  readonly lastNodeId: string;
  readonly openEnded: boolean;
}

export function shapeFirings(
  entries: readonly ShapeTriggerSource[],
  path: readonly { readonly id: string; readonly fen: string }[],
): readonly ShapeFiring[] {
  const output: ShapeFiring[] = [];
  for (const entry of [...entries].sort((left, right) => left.id.localeCompare(right.id))) {
    let start = -1;
    for (let index = 0; index <= path.length; index += 1) {
      const matches = index < path.length && matchesStructuralExpression(path[index]!.fen, entry.trigger);
      if (matches && start < 0) start = index;
      if (!matches && start >= 0) {
        const end = index - 1;
        output.push(Object.freeze({ entryId: entry.id, firstNodeId: path[start]!.id, lastNodeId: path[end]!.id, openEnded: end === path.length - 1 }));
        start = -1;
      }
    }
  }
  return Object.freeze(output);
}

export function declareShapeFiringEvidence(
  firings: readonly ShapeFiring[],
): readonly DeclaredEvidence<ShapeFiring>[] {
  return Object.freeze(firings.map((firing) => declareEvidence(
    { id: "theory.shapes", version: 1 },
    { id: "theory.shapes.firing", version: 1 },
    firing,
  )));
}

export function consumeShapeFiring(
  view: ConsumerEvidenceView<ShapeFiring>,
): readonly ShapeFiring[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "theory.shape_firing" || view.consumer.version !== 1) {
    throw new TypeError("Expected theory.shape_firing@1 consumer view");
  }
  return Object.freeze(view.items.map((item) => item.payload));
}

export function shapeFiringEvidence(firings: readonly ShapeFiring[]): readonly ShapeFiring[] {
  return consumeShapeFiring(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "theory.shape_firing", version: 1 },
    declareShapeFiringEvidence(firings),
  ));
}
