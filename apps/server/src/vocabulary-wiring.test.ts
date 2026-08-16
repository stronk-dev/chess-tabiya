import { readFileSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { commitMove, createRun, lineMembership, matchesStructuralExpression } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { checkpointMatches, expandPackAuthoredBoundary, objectiveRules, planSignatureResolver } from "./pack-orchestrator.js";
import { constructReachReport } from "./pack-check.js";
import { validatePackDocument, type PackShapeLookup } from "./pack-validation.js";
import { validateShapeEntry } from "./shape-validation.js";

const json = (relative: string): any => JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
const sourcePack = json("../../../content/drafts/carlsbad-minority-attack.json") as DrillPackDefinition;
const sourceShape = json("../../../content/shapes/carlsbad.json");
const lookup = (document = sourceShape): PackShapeLookup => ({ get: (id) => id === "carlsbad" ? { document } : undefined });

describe("vocabulary wiring", () => {
  it("compiles plan_consequence and plan_signature to the same predicate and evidence", () => {
    const legacy = structuredClone(sourcePack) as any;
    legacy.objective.successConditions = [{ kind: "plan_consequence", planClassId: "minority-attack", to: "achieved" }];
    const merged = structuredClone(sourcePack) as any;
    merged.objective.successConditions = [{ kind: "structural_feature", feature: { kind: "plan_signature", planClassId: "minority-attack" }, to: "achieved" }];
    const legacyRule = objectiveRules(legacy, legacy.objective, "/objective", planSignatureResolver(legacy, lookup()))[0]!;
    const mergedRule = objectiveRules(merged, merged.objective, "/objective", planSignatureResolver(merged, lookup()))[0]!;
    expect(mergedRule.when).toEqual(legacyRule.when);
    expect(mergedRule.evidenceRefs).toEqual(legacyRule.evidenceRefs);
    expect(mergedRule.evidenceRefs).toContain("planClass#minority-attack");
    expect(validatePackDocument(legacy, { shapes: lookup() }).issues).toContainEqual(expect.objectContaining({ code: "PLAN_CONSEQUENCE_DEPRECATED" }));
  });

  it("preserves root firing through the position-predicate form", () => {
    const shape = structuredClone(sourceShape);
    shape.plans.find((plan: any) => plan.id === "white-minority-attack").success.signature = {
      kind: "pieceOnSquare", square: "g8", piece: { color: "black", role: "king" },
    };
    const pack = structuredClone(sourcePack) as any;
    pack.objective.successConditions = [{ kind: "structural_feature", feature: { kind: "plan_signature", planClassId: "minority-attack" }, to: "achieved" }];
    const rule = objectiveRules(pack, pack.objective, "/objective", planSignatureResolver(pack, lookup(shape)))[0]!;
    if (rule.when.type !== "fenPredicate" || rule.when.predicate.type !== "structuralFeature") throw new TypeError("expected structural predicate");
    expect(matchesStructuralExpression(pack.start.fen, rule.when.predicate.feature)).toBe(true);
  });

  it("expands plan_signature inside a transition position node and attributes it", () => {
    const pack = structuredClone(sourcePack) as any;
    pack.objective.successConditions = [{
      kind: "transition_feature",
      transition: { kind: "position", at: "after", expression: { kind: "plan_signature", planClassId: "minority-attack" } },
      to: "achieved",
    }];
    const rule = objectiveRules(pack, pack.objective, "/objective", planSignatureResolver(pack, lookup()))[0]!;
    expect(rule.evidenceRefs).toContain("planClass#minority-attack");
    expect(JSON.stringify(rule.when)).not.toContain("plan_signature");
    expect(() => validatePackDocument(pack, { shapes: lookup() })).not.toThrow();
  });

  it("expands plan_signature before checkpoint and boundary validation", () => {
    const pack = structuredClone(sourcePack) as any;
    pack.checkpoints = [{
      id: "plan-reached",
      trigger: {
        fenPredicate: {
          type: "structuralFeature",
          feature: { kind: "plan_signature", planClassId: "minority-attack" },
        },
      },
    }];
    pack.authoredBoundary = {
      plyHorizon: 20,
      fenPredicates: [{
        type: "structuralFeature",
        feature: { kind: "plan_signature", planClassId: "minority-attack" },
      }],
    };
    const validation = validatePackDocument(pack, { shapes: lookup() });
    expect(validation.issues).not.toContainEqual(expect.objectContaining({ code: "START_POSITION_UNRUNNABLE" }));

    const rootShape = structuredClone(sourceShape);
    rootShape.plans.find((plan: any) => plan.id === "white-minority-attack").success.signature = {
      kind: "pieceOnSquare", square: "g8", piece: { color: "black", role: "king" },
    };
    const run = createRun({
      id: "plan-signature-checkpoint",
      session: {
        kind: "pack",
        packId: pack.id,
        packDigest: `sha256:${"0".repeat(64)}`,
        start: pack.start,
        feedbackPolicy: "delayed_checkpoint",
        opponentPolicy: { mode: "human_common" },
      },
      sessionDigest: `sha256:${"0".repeat(64)}`,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 0,
      createdAt: "2000-01-01T00:00:00.000Z",
    });
    expect(checkpointMatches(
      pack,
      run,
      pack.checkpoints[0],
      planSignatureResolver(pack, lookup(rootShape)),
      "/checkpoints/0/trigger",
    )).toBe(true);

    const played = commitMove(run, pack.spine[0].moveUci, {
      at: "2000-01-01T00:00:01.000Z",
    }).run;
    const runtimePack = expandPackAuthoredBoundary(
      pack,
      planSignatureResolver(pack, lookup(rootShape)),
    );
    expect(lineMembership(runtimePack, played, played.activeCursor.nodeId).at(-1)).toMatchObject({
      insideBoundary: true,
    });
  });

  it("warns on the real inline plan signature and refuses nested registry references", () => {
    const result = validatePackDocument(sourcePack, { shapes: lookup() });
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "PLAN_SIGNATURE_INLINED",
      path: "/objective/successConditions/0/transition/of/1/expression",
      message: expect.stringContaining("minority-attack"),
    }));

    const nested = structuredClone(sourceShape);
    nested.plans.find((plan: any) => plan.id === "white-minority-attack").success.signature = { kind: "plan_signature", planClassId: "minority-attack" };
    expect(validateShapeEntry(nested).issues).toContainEqual(expect.objectContaining({ code: "PLAN_SIGNATURE_NESTED" }));
    expect(validatePackDocument(sourcePack, { shapes: lookup(nested) }).issues).toContainEqual(expect.objectContaining({ code: "PLAN_SIGNATURE_NESTED" }));
  });

  it("keeps a repo-level reach census for admitted constructs", async () => {
    const rows = await constructReachReport();
    expect(rows.map((row) => row.construct)).toEqual([
      "variantOf", "retryVariants", "plan_consequence", "tempo:in_time", "tempo:too_slow", "tempo:premature", "tempo:outpaced", "tempo:over_budget",
    ]);
    expect(rows.find((row) => row.construct === "variantOf")?.count).toBeGreaterThanOrEqual(2);
    expect(rows.every((row) => Number.isInteger(row.count) && row.count >= 0)).toBe(true);
  });
});
