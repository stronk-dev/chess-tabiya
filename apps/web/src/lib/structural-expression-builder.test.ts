import { describe, expect, it } from "vitest";
import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import {
  STRUCTURAL_EXPRESSION_KINDS,
  defaultStructuralExpression,
  defaultStructuralFeature,
  readShapeExpressions,
  setShapePlanSignature,
  setShapeTrigger,
  structuralBuilderFeatureKinds,
  structuralExpressionKind,
} from "./structural-expression-builder.js";

const shape = JSON.stringify({
  id: "shape-one",
  trigger: { kind: "feature", feature: { kind: "named_structure", id: "carlsbad" } },
  plans: [
    { id: "break", label: "Prepare the break", success: { note: "A position check." } },
    { id: "hold", label: "Hold", success: { note: "Time-bound.", signature: null } },
  ],
  provenance: { licence: "CC-BY-SA-4.0" },
});

describe("structural expression authoring", () => {
  it("stays set-equal to the schema's complete 18-feature vocabulary", () => {
    expect(structuralBuilderFeatureKinds()).toEqual(STRUCTURAL_FEATURE_KINDS);
    expect(STRUCTURAL_FEATURE_KINDS).toHaveLength(18);
    expect(STRUCTURAL_FEATURE_KINDS.map((kind) => defaultStructuralFeature(kind).kind)).toEqual(STRUCTURAL_FEATURE_KINDS);
  });

  it("constructs every recursive expression branch with a truthful kind", () => {
    expect(STRUCTURAL_EXPRESSION_KINDS.map((kind) => structuralExpressionKind(defaultStructuralExpression(kind)))).toEqual(STRUCTURAL_EXPRESSION_KINDS);
  });

  it("rewrites only the selected trigger or plan signature", () => {
    const trigger = { kind: "not" as const, of: defaultStructuralExpression("feature") };
    const withTrigger = setShapeTrigger(shape, trigger);
    expect(readShapeExpressions(withTrigger).trigger).toEqual(trigger);
    expect(JSON.parse(withTrigger).plans).toEqual(JSON.parse(shape).plans);

    const signature = defaultStructuralExpression("quantified_files");
    const withSignature = setShapePlanSignature(withTrigger, 0, signature);
    const parsed = JSON.parse(withSignature);
    expect(parsed.trigger).toEqual(trigger);
    expect(parsed.plans[0]).toEqual({ id: "break", label: "Prepare the break", success: { note: "A position check.", signature } });
    expect(parsed.plans[1].success).toEqual({ note: "Time-bound.", signature: null });
  });

  it("fails closed on malformed shape bytes", () => {
    expect(readShapeExpressions("{ nope")).toEqual({ valid: false, plans: [] });
  });
});
