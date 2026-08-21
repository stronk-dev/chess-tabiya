import {
  assertConsumerEvidenceView,
  declareEvidence,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
} from "./evidence-contract.js";
import {
  matchesStructuralExpression,
  mirrorExpression,
  type StructuralExpression,
  type StructuralFeature,
} from "./structure.js";

const RULES_PRODUCER = Object.freeze({ id: "rules.structural", version: 1 });
const AUTHORED_PRODUCER = Object.freeze({ id: "pack.authored", version: 1 });
const CONDITION_PROJECTION = Object.freeze({ id: "pack.authored.structural_condition", version: 1 });
const RESULT_PROJECTION = Object.freeze({ id: "rules.structural.predicate.result", version: 1 });

export interface StructuralPredicateTraceNode {
  readonly path: string;
  readonly expression: StructuralExpression;
  readonly matched: boolean;
}

export interface StructuralPredicateResult {
  readonly fen: string;
  readonly condition: StructuralExpression;
  readonly matched: boolean;
  readonly trace: readonly StructuralPredicateTraceNode[];
}

export interface StructuralFeaturePredicateResult {
  readonly fen: string;
  readonly feature: StructuralFeature;
  readonly matched: boolean;
}

export type StructuralPredicateEvidencePayload =
  | StructuralExpression
  | StructuralPredicateResult
  | StructuralFeaturePredicateResult;

export interface DeclaredStructuralPredicateEvidence {
  readonly condition: DeclaredEvidence<StructuralExpression>;
  readonly result: DeclaredEvidence<StructuralPredicateResult>;
  readonly featureResults: readonly DeclaredEvidence<StructuralFeaturePredicateResult>[];
}

function evaluateNode(
  fen: string,
  authored: StructuralExpression,
  effective: StructuralExpression,
  path: string,
  trace: StructuralPredicateTraceNode[],
): boolean {
  let matched: boolean;
  if (authored.kind === "all" && effective.kind === "all") {
    matched = true;
    for (let index = 0; index < authored.of.length; index += 1) {
      const child = effective.of[index];
      if (child === undefined || !evaluateNode(fen, authored.of[index]!, child, `${path}.of.${index}`, trace)) {
        matched = false;
        break;
      }
    }
  } else if (authored.kind === "any" && effective.kind === "any") {
    matched = false;
    for (let index = 0; index < authored.of.length; index += 1) {
      const child = effective.of[index];
      if (child !== undefined && evaluateNode(fen, authored.of[index]!, child, `${path}.of.${index}`, trace)) {
        matched = true;
        break;
      }
    }
  } else if (authored.kind === "not" && effective.kind === "not") {
    matched = !evaluateNode(fen, authored.of, effective.of, `${path}.of`, trace);
  } else if (authored.kind === "mirrored") {
    const transformed = effective.kind === "mirrored"
      ? mirrorExpression(effective.of, effective.axis)
      : effective;
    matched = evaluateNode(fen, authored.of, transformed, `${path}.of`, trace);
  } else {
    matched = matchesStructuralExpression(fen, effective);
  }
  trace.push(Object.freeze({ path, expression: authored, matched }));
  return matched;
}

export function evaluateStructuralPredicate(
  fen: string,
  condition: StructuralExpression,
): StructuralPredicateResult {
  const trace: StructuralPredicateTraceNode[] = [];
  const matched = evaluateNode(fen, condition, condition, "$", trace);
  return Object.freeze({ fen, condition, matched, trace: Object.freeze(trace) });
}

export function declareStructuralPredicateEvidence(
  fen: string,
  condition: StructuralExpression,
): DeclaredStructuralPredicateEvidence {
  const result = evaluateStructuralPredicate(fen, condition);
  const featureResults = result.trace.flatMap((node) => node.expression.kind === "feature"
    ? [declareEvidence(
      RULES_PRODUCER,
      { id: `rules.structural.predicate.${node.expression.feature.kind}`, version: 1 },
      { fen, feature: node.expression.feature, matched: node.matched },
    )]
    : []);
  return Object.freeze({
    condition: declareEvidence(AUTHORED_PRODUCER, CONDITION_PROJECTION, condition),
    result: declareEvidence(RULES_PRODUCER, RESULT_PROJECTION, result),
    featureResults: Object.freeze(featureResults),
  });
}

export function matchesDeclaredStructuralPredicate(
  evidence: DeclaredEvidence<StructuralPredicateResult>,
): boolean {
  if (evidence.producer.id !== RULES_PRODUCER.id || evidence.producer.version !== 1
    || evidence.projection.id !== RESULT_PROJECTION.id || evidence.projection.version !== 1) {
    throw new TypeError("Expected rules.structural.predicate.result@1 declared evidence");
  }
  return evidence.payload.matched;
}

export function structuralEvidenceForAuthoring(
  view: ConsumerEvidenceView<StructuralPredicateEvidencePayload>,
): readonly DeclaredEvidence<StructuralPredicateEvidencePayload>[] {
  assertConsumerEvidenceView(view);
  const ids = new Set(view.items.map((item) => item.projection.id));
  if (!ids.has(CONDITION_PROJECTION.id) || !ids.has(RESULT_PROJECTION.id)) {
    throw new TypeError("Authoring structural evidence requires both the authored condition and computed result");
  }
  return view.items;
}
