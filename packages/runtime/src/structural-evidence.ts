import {
  assertConsumerEvidenceView,
  evidenceForConsumer,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
} from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import {
  matchesStructuralExpression,
  mirrorExpression,
  type StructuralExpression,
  type StructuralFeature,
} from "./structure.js";

const RESULT_PRODUCER = Object.freeze({ id: "derived.structural", version: 1 });
const CONDITION_PROJECTION = Object.freeze({ id: "authored.structural_condition.input", version: 1 });
const RESULT_PROJECTION = Object.freeze({ id: "derived.structural.predicate_result", version: 1 });

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

export interface AuthoredStructuralCondition {
  readonly source: "pack" | "shape";
  readonly documentId: string;
  readonly pointer: string;
  readonly expression: StructuralExpression;
}

export interface StructuralFeaturePredicateResult {
  readonly fen: string;
  readonly feature: StructuralFeature;
  readonly matched: boolean;
}

export type StructuralPredicateEvidencePayload =
  | AuthoredStructuralCondition
  | StructuralPredicateResult
  | StructuralFeaturePredicateResult;

export interface DeclaredStructuralPredicateEvidence {
  readonly condition: DeclaredEvidence<AuthoredStructuralCondition>;
  readonly result: DeclaredEvidence<StructuralPredicateResult>;
  readonly featureResults: readonly DeclaredEvidence<StructuralFeaturePredicateResult>[];
}

function evaluateNode(
  fen: string,
  authored: StructuralExpression,
  effective: StructuralExpression,
  path: string,
  trace: StructuralPredicateTraceNode[],
  features?: StructuralFeature[],
): boolean {
  let matched: boolean;
  if (authored.kind === "all" && effective.kind === "all") {
    matched = true;
    for (let index = 0; index < authored.of.length; index += 1) {
      const child = effective.of[index];
      if (child === undefined || !evaluateNode(fen, authored.of[index]!, child, `${path}.of.${index}`, trace, features)) {
        matched = false;
        break;
      }
    }
  } else if (authored.kind === "any" && effective.kind === "any") {
    matched = false;
    for (let index = 0; index < authored.of.length; index += 1) {
      const child = effective.of[index];
      if (child !== undefined && evaluateNode(fen, authored.of[index]!, child, `${path}.of.${index}`, trace, features)) {
        matched = true;
        break;
      }
    }
  } else if (authored.kind === "not" && effective.kind === "not") {
    matched = !evaluateNode(fen, authored.of, effective.of, `${path}.of`, trace, features);
  } else if (authored.kind === "mirrored") {
    const transformed = effective.kind === "mirrored"
      ? mirrorExpression(effective.of, effective.axis)
      : effective;
    matched = evaluateNode(fen, authored.of, transformed, `${path}.of`, trace, features);
  } else {
    matched = matchesStructuralExpression(fen, effective);
    if (effective.kind === "feature") features?.push(effective.feature);
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

/** The effective (mirror-expanded) feature leaves the evaluator actually tested. */
function evaluatedFeatures(fen: string, condition: StructuralExpression): readonly StructuralFeature[] {
  const features: StructuralFeature[] = [];
  evaluateNode(fen, condition, condition, "$", [], features);
  return Object.freeze(features);
}

/**
 * Seals the authored condition, then derives the predicate result from exactly that sealed
 * condition, and computes each evaluated feature leaf through its own predicate factory.
 */
export function declareStructuralPredicateEvidence(
  fen: string,
  condition: StructuralExpression,
  origin: Omit<AuthoredStructuralCondition, "expression">,
): DeclaredStructuralPredicateEvidence {
  const sealedCondition = invokeEvidenceValueRoute("authored.structural_condition.input@1", { source: origin.source, documentId: origin.documentId, pointer: origin.pointer, expression: condition as unknown as Readonly<Record<string, unknown>> }) as DeclaredEvidence<AuthoredStructuralCondition>;
  const result = invokeEvidenceValueRoute("derived.structural.predicate_result@1", { condition: sealedCondition as never, fen }) as DeclaredEvidence<StructuralPredicateResult>;
  const featureResults = evaluatedFeatures(fen, condition).map((feature) => invokeEvidenceValueRoute(`rules.structural.predicate.${feature.kind}@1`, { fen, feature }) as DeclaredEvidence<StructuralFeaturePredicateResult>);
  return Object.freeze({
    condition: sealedCondition,
    result,
    featureResults: Object.freeze(featureResults),
  });
}

export function matchesDeclaredStructuralPredicate(
  evidence: DeclaredEvidence<StructuralPredicateResult>,
): boolean {
  if (evidence.producer.id !== RESULT_PRODUCER.id || evidence.producer.version !== 1
    || evidence.projection.id !== RESULT_PROJECTION.id || evidence.projection.version !== 1) {
    throw new TypeError("Expected derived.structural.predicate_result@1 declared evidence");
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

export function structuralEvidenceForObjective(
  view: ConsumerEvidenceView<StructuralPredicateResult>,
): boolean {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "runtime.objective_condition" || view.consumer.version !== 1) {
    throw new TypeError("Expected runtime.objective_condition@1 consumer view");
  }
  const result = view.items.find((item) => item.projection.id === RESULT_PROJECTION.id);
  if (result === undefined) throw new TypeError("Objective structural evidence requires a computed result");
  return matchesDeclaredStructuralPredicate(result);
}

export function evaluateAuthoredStructuralPredicate(
  fen: string,
  condition: StructuralExpression,
  origin: Omit<AuthoredStructuralCondition, "expression">,
): boolean {
  const evidence = declareStructuralPredicateEvidence(fen, condition, origin);
  const view = evidenceForConsumer<StructuralPredicateEvidencePayload>(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "authoring.predicate", version: 1 },
    [evidence.condition, evidence.result, ...evidence.featureResults],
  );
  structuralEvidenceForAuthoring(view);
  return evidence.result.payload.matched;
}
