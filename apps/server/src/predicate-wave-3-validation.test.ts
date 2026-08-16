import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { readFileSync } from "node:fs";

import type { DrillPackDefinition, StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { objectiveRules, planSignatureResolver } from "./pack-orchestrator.js";
import { structuralIssues, validatePackDocument, type PackShapeLookup } from "./pack-validation.js";

const json = (relative: string): any => JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
const pack = json(resolvePackPath("carlsbad-minority-attack")) as DrillPackDefinition;
const carlsbad = json("../../../content/shapes/carlsbad.json");
const lookup = (document = carlsbad): PackShapeLookup => ({ get: (id) => id === "carlsbad" ? { document } : undefined });
const codes = (value: unknown, shapes?: PackShapeLookup) => validatePackDocument(value, shapes === undefined ? {} : { shapes }).issues.map((issue) => issue.code);

describe("predicate wave 3 validation", () => {
  it("resolves the Carlsbad plan consequence and refuses every unresolved form", () => {
    const planPack = structuredClone(pack) as DrillPackDefinition;
    (planPack.objective as any).successConditions = [{ kind: "plan_consequence", planClassId: "minority-attack", to: "achieved" }];
    expect(validatePackDocument(planPack, { shapes: lookup() }).valid).toBe(true);
    const resolved = planSignatureResolver(planPack, lookup());
    expect(objectiveRules(planPack, planPack.objective, "/objective", resolved)[0]?.evidenceRefs).toEqual([
      "planClass#minority-attack",
      "rules:structure-backward-pawn",
      "rules:structure-half-open-file",
    ]);

    const unknown = structuredClone(planPack) as any;
    unknown.objective.successConditions[0].planClassId = "missing";
    expect(codes(unknown, lookup())).toContain("PLAN_CONSEQUENCE_UNKNOWN_PLAN_CLASS");

    const unbound = structuredClone(planPack) as any;
    delete unbound.planClasses[0].shapePlan;
    expect(codes(unbound, lookup())).toContain("PLAN_CONSEQUENCE_NO_SHAPE_PLAN");

    const uncheckable = structuredClone(planPack) as any;
    uncheckable.objective.successConditions[0].planClassId = "central-break";
    const uncheckableShape = structuredClone(carlsbad);
    uncheckableShape.plans.find((plan: any) => plan.id === "white-central-break").success = { note: "No structural signature is authored.", signature: null };
    expect(codes(uncheckable, lookup(uncheckableShape))).toContain("PLAN_CONSEQUENCE_NOT_COMPUTABLE");

    const impossibleShape = structuredClone(carlsbad);
    impossibleShape.plans[0].success.signature = { kind: "pieceOnSquare", square: "a1", piece: { color: "black", role: "queen" } };
    expect(codes(planPack, lookup(impossibleShape))).toContain("PLAN_CONSEQUENCE_SIGNATURE_NEVER_PRESENT");
  });

  it("refuses impossible distance queries and warns on the two deprecated forms", () => {
    const expression = (feature: unknown) => ({ kind: "feature", feature }) as StructuralExpression;
    expect(structuralIssues(expression({ kind: "piece_count", color: "white", role: "king", basis: "count", comparison: "equal", count: 2 })).map((issue) => issue.code)).toContain("PIECE_COUNT_OUT_OF_RANGE");
    expect(structuralIssues(expression({ kind: "piece_distance", color: "white", role: "rook", target: { kind: "square", square: "a1" }, comparison: "atLeast", count: 3 })).map((issue) => issue.code)).toContain("PIECE_DISTANCE_OUT_OF_RANGE");
    expect(structuralIssues(expression({ kind: "piece_distance", color: "white", role: "king", target: { kind: "piece", color: "white", role: "king" }, comparison: "equal", count: 0 })).map((issue) => issue.code)).toContain("PIECE_DISTANCE_SELF_TARGET");
    expect(structuralIssues(expression({ kind: "piece_distance", color: "white", role: "pawn", target: { kind: "square", square: "a8" }, comparison: "equal", count: 1 })).map((issue) => issue.code)).toContain("PIECE_DISTANCE_ROLE_UNSUPPORTED");
    expect(structuralIssues(expression({ kind: "pawn_count", color: "white", basis: "count", comparison: "equal", count: 1 })).map((issue) => issue.code)).toContain("PAWN_COUNT_DEPRECATED");
    expect(structuralIssues(expression({ kind: "piece_reach_count", color: "white", role: "bishop", scope: "every", comparison: "atLeast", count: 0 })).map((issue) => issue.code)).toContain("PIECE_REACH_SCOPE_EVERY_DEPRECATED");
  });

  it("normalizes shape reference relations and refuses duplicate or absent present references", () => {
    const duplicate = structuredClone(pack) as any;
    duplicate.shapes = ["carlsbad", { shape: "carlsbad", relation: "prospective" }];
    expect(codes(duplicate, lookup())).toContain("SHAPE_REFERENCE_DUPLICATE");

    const absent = structuredClone(pack) as any;
    const never = structuredClone(carlsbad);
    never.trigger = { kind: "pieceOnSquare", square: "a1", piece: { color: "black", role: "queen" } };
    expect(codes(absent, lookup(never))).toContain("SHAPE_REFERENCE_NEVER_PRESENT");
  });
});
