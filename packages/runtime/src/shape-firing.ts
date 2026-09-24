import { matchesStructuralExpression, type StructuralExpression } from "./structure.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertConsumerEvidenceView, evidenceForConsumer, type ConsumerEvidenceView, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

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

const SHAPE_LABEL_TOKENS: Readonly<Record<string, string>> = Object.freeze({
  iqp: "IQP",
  kid: "King's Indian",
});

/** Renders an exact shape firing as learner copy while retaining the catalogue id in evidence. */
export function renderShapeFiring(firing: Pick<ShapeFiring, "entryId">): readonly string[] {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(firing.entryId)) {
    throw new TypeError("Shape firing omitted a valid catalogue identity");
  }
  const words = firing.entryId.split("-").map((word) => SHAPE_LABEL_TOKENS[word] ?? word);
  const first = words[0]!;
  words[0] = SHAPE_LABEL_TOKENS[first.toLowerCase()] ?? `${first[0]!.toUpperCase()}${first.slice(1)}`;
  return Object.freeze([`Recognized position pattern: ${words.join(" ")}.`]);
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

/** Shape firings minted by the theory.shapes.firing factory from registered triggers and a recorded path. */
export function declareShapeFiringEvidence(
  entries: readonly ShapeTriggerSource[],
  path: readonly { readonly id: string; readonly fen: string }[],
): readonly DeclaredEvidence<ShapeFiring>[] {
  return invokeEvidenceValueRoute("theory.shapes.firing@1", { entries, path: path.map((node) => ({ id: node.id, fen: node.fen })) }) as readonly DeclaredEvidence<ShapeFiring>[];
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

export function shapeFiringEvidence(
  entries: readonly ShapeTriggerSource[],
  path: readonly { readonly id: string; readonly fen: string }[],
): readonly ShapeFiring[] {
  return consumeShapeFiring(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "theory.shape_firing", version: 1 },
    declareShapeFiringEvidence(entries, path),
  ));
}
