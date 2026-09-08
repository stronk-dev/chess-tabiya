import {
  STRUCTURAL_FEATURE_KINDS,
  type StructuralExpression,
  type StructuralFeature,
  type StructuralFeatureKind,
} from "@chess-tabiya/schema/drill-pack";

export const STRUCTURAL_EXPRESSION_KINDS = Object.freeze([
  "feature", "all", "any", "not", "mirrored", "quantified_files",
  "quantified_squares", "pieceOnSquare", "plan_signature",
] as const);

export type StructuralExpressionKind = (typeof STRUCTURAL_EXPRESSION_KINDS)[number];

const DEFAULT_FEATURES = Object.freeze({
  pawn_safe_square: () => ({ kind: "pawn_safe_square", color: "white", square: "e4" }),
  outpost: () => ({ kind: "outpost", color: "white", square: "e5" }),
  backward_pawn: () => ({ kind: "backward_pawn", color: "white", file: "d" }),
  isolated_pawn: () => ({ kind: "isolated_pawn", color: "white", file: "d" }),
  doubled_pawn: () => ({ kind: "doubled_pawn", color: "white", file: "d" }),
  passed_pawn: () => ({ kind: "passed_pawn", color: "white", square: "e5" }),
  open_file: () => ({ kind: "open_file", file: "d" }),
  half_open_file: () => ({ kind: "half_open_file", color: "white", file: "d" }),
  line_blockers: () => ({ kind: "line_blockers", from: "c1", to: "h6", comparison: "atMost", count: 0 }),
  direct_attack_count: () => ({ kind: "direct_attack_count", square: "e5", color: "white", comparison: "atLeast", count: 1 }),
  piece_reach_count: () => ({ kind: "piece_reach_count", color: "white", role: "knight", scope: "any", comparison: "atLeast", count: 1 }),
  named_structure: () => ({ kind: "named_structure", id: "carlsbad" }),
  bishop_on_shade: () => ({ kind: "bishop_on_shade", color: "white", shade: "dark" }),
  pawn_count: () => ({ kind: "pawn_count", color: "white", basis: "count", comparison: "atLeast", count: 1 }),
  king_opposition: () => ({ kind: "king_opposition", color: "white", form: "direct" }),
  piece_count: () => ({ kind: "piece_count", color: "white", role: "pawn", basis: "count", comparison: "atLeast", count: 1 }),
  king_zone: () => ({ kind: "king_zone", color: "white", zone: "edge" }),
  piece_distance: () => ({ kind: "piece_distance", color: "white", role: "king", target: { kind: "square", square: "e4" }, comparison: "atMost", count: 1 }),
} satisfies Record<StructuralFeatureKind, () => StructuralFeature>);

export function defaultStructuralFeature(kind: StructuralFeatureKind): StructuralFeature {
  return DEFAULT_FEATURES[kind]();
}

export function defaultStructuralExpression(kind: StructuralExpressionKind = "feature"): StructuralExpression {
  const leaf = (): StructuralExpression => ({ kind: "feature", feature: defaultStructuralFeature("named_structure") });
  if (kind === "feature") return leaf();
  if (kind === "all" || kind === "any") return { kind, of: [leaf()] };
  if (kind === "not") return { kind: "not", of: leaf() };
  if (kind === "mirrored") return { kind: "mirrored", axis: "both", of: leaf() };
  if (kind === "quantified_files") return { kind: "quantified", quantifier: "some", over: { files: { from: "a", to: "h" } }, feature: { kind: "open_file" } };
  if (kind === "quantified_squares") return { kind: "quantified", quantifier: "some", over: { squares: { files: { from: "a", to: "h" }, ranks: { from: 1, to: 8 } } }, feature: { kind: "piece", piece: null } };
  if (kind === "pieceOnSquare") return { kind: "pieceOnSquare", square: "e4", piece: null };
  return { kind: "plan_signature", planClassId: "plan-id" };
}

export function structuralExpressionKind(expression: StructuralExpression): StructuralExpressionKind {
  if (expression.kind !== "quantified") return expression.kind;
  return "files" in expression.over ? "quantified_files" : "quantified_squares";
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function shapeDocument(documentJson: string): Record<string, unknown> {
  const document = record(JSON.parse(documentJson));
  if (document === undefined) throw new TypeError("Shape JSON must be an object");
  return document;
}

function write(document: Record<string, unknown>): string {
  return JSON.stringify(document, null, 2);
}

export interface ShapeExpressionDraft {
  readonly valid: boolean;
  readonly trigger?: StructuralExpression;
  readonly plans: readonly {
    readonly id: string;
    readonly label: string;
    readonly note: string;
    readonly signature?: StructuralExpression | null;
  }[];
}

export function readShapeExpressions(documentJson: string): ShapeExpressionDraft {
  try {
    const document = shapeDocument(documentJson);
    const plans = Array.isArray(document.plans) ? document.plans : [];
    return {
      valid: record(document.trigger) !== undefined,
      ...(record(document.trigger) === undefined ? {} : { trigger: document.trigger as StructuralExpression }),
      plans: plans.map((value, index) => {
        const plan = record(value) ?? {};
        const success = record(plan.success) ?? {};
        return {
          id: typeof plan.id === "string" ? plan.id : `plan-${index + 1}`,
          label: typeof plan.label === "string" ? plan.label : `Plan ${index + 1}`,
          note: typeof success.note === "string" ? success.note : "",
          ...(success.signature === undefined ? {} : { signature: success.signature as StructuralExpression | null }),
        };
      }),
    };
  } catch {
    return { valid: false, plans: [] };
  }
}

export function setShapeTrigger(documentJson: string, expression: StructuralExpression): string {
  const document = shapeDocument(documentJson);
  document.trigger = expression;
  return write(document);
}

export function setShapePlanSignature(documentJson: string, index: number, expression: StructuralExpression): string {
  const document = shapeDocument(documentJson);
  if (!Array.isArray(document.plans)) return documentJson;
  const plans = [...document.plans];
  const plan = record(plans[index]);
  if (plan === undefined) return documentJson;
  plans[index] = { ...plan, success: { ...(record(plan.success) ?? {}), signature: expression } };
  document.plans = plans;
  return write(document);
}

export function structuralBuilderFeatureKinds(): readonly StructuralFeatureKind[] {
  return STRUCTURAL_FEATURE_KINDS;
}
