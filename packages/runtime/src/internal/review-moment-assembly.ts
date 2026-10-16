// Accepted Review §4.5. Shared unrendered assembly only: no presentation, rank, title or provider.
import { evidenceValueReceipt, type DeclaredEvidence } from "../evidence-contract.js";
import type { EndgameClassification } from "../endgame.js";
import { classifyPhase, type DetectedPhase } from "../phase.js";
import type { PivotalKind, PivotalMarker } from "../pivotal.js";
import { reviewScoreReceipt, type ReviewEvalDelta, type ReviewMateTransition, type ReviewScoreReceipt } from "../review-points.js";
import type { Node } from "../types.js";

export type StoryMomentKind = PivotalKind | "eval_pivot" | "mate_transition" | "last_level" | "endgame_entry" | "shape_span" | "outcome";
export const STORY_MOMENT_KINDS: readonly StoryMomentKind[] = Object.freeze(["human_divergence", "option_collapse", "irreversibility", "phase_change", "eval_pivot", "mate_transition", "last_level", "endgame_entry", "shape_span", "outcome"]);
export const STORY_PIVOT_CP = 150;
export interface UnrenderedReviewMoment {
  readonly nodeId: string;
  readonly decisionNodeId: string;
  readonly evidenceNodeId: string;
  readonly stopNodeId: string;
  readonly entryNodeId: string;
  readonly ply: number;
  readonly san: string | null;
  readonly fen: string;
  readonly kinds: readonly StoryMomentKind[];
  readonly evidence: readonly DeclaredEvidence<unknown>[];
  readonly evaluation: null | Readonly<{ before: ReviewScoreReceipt; after: ReviewScoreReceipt }>;
  readonly phase: DetectedPhase;
  readonly endgame?: EndgameClassification;
}

/** Existing packet order, shared with both actual source owners; never deduplicate occurrences. */
export function orderedReviewEvidence(items: readonly DeclaredEvidence<unknown>[]): readonly DeclaredEvidence<unknown>[] {
  const key = (item: DeclaredEvidence<unknown>) => `${item.projection.id}@${item.projection.version}`;
  return Object.freeze([...items].sort((left, right) => key(left).localeCompare(key(right))
    || evidenceValueReceipt(left).payloadDigest.localeCompare(evidenceValueReceipt(right).payloadDigest)));
}

// Both actual callers are migrating together. Exact identities, not a prefix or a latest alias.
const pivotalKinds: Readonly<Record<string, PivotalKind>> = Object.freeze({
  "derived.pivotal.irreversibility@1": "irreversibility",
  "derived.pivotal.phase_change@1": "phase_change", "derived.pivotal.phase_change@2": "phase_change",
  "derived.pivotal.human_divergence@1": "human_divergence", "derived.pivotal.human_divergence@2": "human_divergence",
  "derived.pivotal.option_collapse@1": "option_collapse", "derived.pivotal.option_collapse@2": "option_collapse",
});

/** Only source owners supply admitted path/items and an already authenticated last-level result. */
export function assembleReviewMoments(path: readonly Node[], nodes: readonly Readonly<{ nodeId: string; items: readonly DeclaredEvidence<unknown>[] }>[],
  lastLevel: readonly Readonly<{ nodeId: string; evidence: DeclaredEvidence<unknown> }>[]): readonly UnrenderedReviewMoment[] {
  const index = new Map(path.map((node, at) => [node.id, at]));
  if (index.size !== path.length || nodes.length !== path.length || nodes.some((node, at) => node.nodeId !== path[at]!.id)) throw new TypeError("Review assembly requires its complete ordered original path population");
  for (let at = 1; at < path.length; at++) if (path[at]!.parentId !== path[at - 1]!.id) throw new TypeError("Review assembly has no exact recorded edge on its path");
  const accum = new Map<string, { kinds: Set<StoryMomentKind>; evidence: DeclaredEvidence<unknown>[]; evaluation: UnrenderedReviewMoment["evaluation"]; endgame?: EndgameClassification }>();
  const at = (nodeId: string) => {
    if (!index.has(nodeId)) throw new TypeError("Review moment has no original source occurrence");
    let value = accum.get(nodeId);
    if (value === undefined) { value = { kinds: new Set(), evidence: [], evaluation: null }; accum.set(nodeId, value); }
    return value;
  };
  let endgameSeen = false;
  for (const node of nodes) for (const item of node.items) {
    const route = `${item.projection.id}@${item.projection.version}`, pivotal = pivotalKinds[route];
    if (pivotal !== undefined) {
      if ((item.payload as PivotalMarker).kind !== pivotal) throw new TypeError("Review pivotal kind differs from its exact source projection");
      const value = at(node.nodeId); value.kinds.add(pivotal); value.evidence.push(item);
    } else if (route === "derived.review.eval_delta@2") {
      const delta = item.payload as ReviewEvalDelta;
      if (Math.abs(delta.deltaCp) < STORY_PIVOT_CP) continue;
      const value = at(node.nodeId); value.kinds.add("eval_pivot"); value.evidence.push(item);
      value.evaluation = Object.freeze({ before: reviewScoreReceipt(delta.before.payload.evaluation.payload.payload.score), after: reviewScoreReceipt(delta.after.payload.evaluation.payload.payload.score) });
    } else if (route === "derived.review.mate_transition@2") {
      const transition = item.payload as ReviewMateTransition;
      const value = at(node.nodeId); value.kinds.add("mate_transition"); value.evidence.push(item);
      value.evaluation = Object.freeze({ before: reviewScoreReceipt(transition.before.payload.evaluation.payload.payload.score), after: reviewScoreReceipt(transition.after.payload.evaluation.payload.payload.score) });
    } else if (route === "rules.endgame.classification@1" && !endgameSeen) {
      endgameSeen = true;
      const value = at(node.nodeId); value.kinds.add("endgame_entry"); value.endgame = item.payload as EndgameClassification; value.evidence.push(item);
    } else if (route === "theory.shapes.firing@1") {
      const value = at(node.nodeId); value.kinds.add("shape_span"); value.evidence.push(item);
    } else if (route === "run.record.consequence@1" || route === "run.record.imported_result@1") {
      const value = at(node.nodeId); value.kinds.add("outcome"); value.evidence.push(item);
    }
  }
  for (const item of lastLevel) { const value = at(item.nodeId); value.kinds.add("last_level"); value.evidence.push(item.evidence); }
  return Object.freeze([...accum.entries()].flatMap(([nodeId, value]): UnrenderedReviewMoment[] => {
    const position = index.get(nodeId)!, node = path[position]!;
    if (position === 0) return [];
    const decision = path[position - 1]!;
    if (decision.id !== node.parentId) throw new TypeError(`Story moment ${nodeId} has no exact recorded edge on its path`);
    return [Object.freeze({ nodeId, decisionNodeId: decision.id, evidenceNodeId: nodeId, stopNodeId: nodeId, entryNodeId: decision.id,
      ply: node.ply, san: node.moveSan, fen: node.fen, kinds: Object.freeze([...value.kinds].sort()), evidence: Object.freeze([...value.evidence]),
      evaluation: value.evaluation, phase: classifyPhase(node.fen).phase, ...(value.endgame === undefined ? {} : { endgame: value.endgame }) })];
  }).sort((left, right) => left.ply - right.ply || left.nodeId.localeCompare(right.nodeId)));
}
