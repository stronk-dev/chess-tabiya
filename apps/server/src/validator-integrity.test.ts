import { readFileSync } from "node:fs";

import {
  OBJECTIVE_TYPES,
  type DrillPackDefinition,
  type ObjectiveType,
} from "@chess-tabiya/schema/drill-pack";
import { commitMove, createRun, lineMembership } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { objectiveRules } from "./pack-orchestrator.js";
import { PackRegistry } from "./pack-registry.js";
import { validatePackDocument } from "./pack-validation.js";

const example = JSON.parse(
  readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"),
) as DrillPackDefinition;
const trajectory = JSON.parse(
  readFileSync(new URL("../../../content/drafts/trajectory-mate-bishop-knight.json", import.meta.url), "utf8"),
) as DrillPackDefinition;

function issue(document: DrillPackDefinition, code: string, path?: string) {
  return validatePackDocument(document).issues.find(
    (candidate) => candidate.code === code && (path === undefined || candidate.path === path),
  );
}

function objectiveDocument(type: ObjectiveType): DrillPackDefinition {
  const document = structuredClone(example) as DrillPackDefinition;
  const checkpointId = document.checkpoints[0]!.id;
  (document as any).objective = {
    type,
    summary: `${type} compiler fixture`,
    successConditions: [{ kind: "reach_checkpoint", checkpointId, to: "preserved" }],
  };
  if (["win", "hold", "save", "resist"].includes(type)) {
    (document.objective as any).grading = {
      assessedBy: { kind: "authored", note: "Fixture assessment." },
      resolveAt: type === "resist"
        ? { kind: "checkpoint", checkpointId }
        : { kind: "terminal" },
    };
  }
  if (type === "follow_theory") {
    (document as any).mode = "line";
    (document as any).checkpoints = [
      ...document.checkpoints,
      { id: "past-the-book", trigger: { atAuthoredBoundary: "crossed" }, actions: [] },
    ];
  }
  if (type === "run_trajectory") {
    (document as any).mode = "trajectory";
    (document as any).objective = { type, summary: `${type} compiler fixture` };
    (document as any).legs = [{
      id: "only-leg",
      objective: {
        type: "play_until_checkpoint",
        summary: "Compiler fixture leg.",
        successConditions: [{ kind: "reach_checkpoint", checkpointId }],
      },
    }];
  }
  return document;
}

describe("validator integrity", () => {
  it("turns featureless structural compiler failures into pointed refusals for roots and legs", () => {
    const root = objectiveDocument("win");
    (root.objective as any).successConditions = [{
      kind: "structural_feature",
      feature: { kind: "pieceOnSquare", square: "a1", piece: null },
      to: "degraded",
    }];
    expect(issue(root, "STRUCTURAL_CONDITION_HAS_NO_FEATURE")).toMatchObject({
      path: "/objective/successConditions/0/feature",
    });

    const leg = structuredClone(trajectory) as DrillPackDefinition;
    (leg.legs![0]!.objective as any).successConditions = [{
      kind: "structural_feature",
      feature: {
        kind: "quantified",
        quantifier: "some",
        over: { squares: { files: { from: "a", to: "h" }, ranks: { from: 1, to: 8 } } },
        feature: { kind: "piece", piece: { color: "white", role: "bishop" } },
      },
      to: "preserved",
    }];
    expect(issue(leg, "STRUCTURAL_CONDITION_HAS_NO_FEATURE")).toMatchObject({
      path: "/legs/0/objective/successConditions/0/feature",
    });
  });

  it("validates the objective invariants on every trajectory leg", () => {
    const missing = structuredClone(trajectory) as DrillPackDefinition;
    (missing.legs![1] as any).objective = { type: "hold", summary: "Missing grading." };
    expect(issue(missing, "OBJECTIVE_GRADING_REQUIRED")).toMatchObject({
      path: "/legs/1/objective/grading",
      message: "hold objectives require grading",
    });

    const resist = structuredClone(trajectory) as DrillPackDefinition;
    (resist.legs![2] as any).objective = {
      type: "resist",
      summary: "Terminal resist is unmeasurable.",
      grading: {
        assessedBy: { kind: "authored", note: "Fixture assessment." },
        resolveAt: { kind: "terminal" },
      },
    };
    expect(issue(resist, "OBJECTIVE_RESIST_NEEDS_CHECKPOINT")).toMatchObject({
      path: "/legs/2/objective/grading/resolveAt",
    });

    const self = structuredClone(trajectory) as DrillPackDefinition;
    (self.legs![0]!.objective as any).successConditions = [{
      kind: "material_balance",
      perspective: "white",
      comparison: "atLeast",
      value: -99,
      to: "degraded",
      from: ["degraded"],
    }];
    expect(issue(self, "OBJECTIVE_SELF_TRANSITION")).toMatchObject({
      path: "/legs/0/objective/successConditions/0/from",
    });
  });

  it("compiles every declared objective type and converts unknown compiler failures", () => {
    for (const type of OBJECTIVE_TYPES) {
      const document = type === "run_trajectory"
        ? structuredClone(trajectory) as DrillPackDefinition
        : objectiveDocument(type);
      const compiled: string[] = [];
      validatePackDocument(document, {
        compileObjectiveRules: (_pack, objective) => {
          compiled.push(objective!.type);
          return objectiveRules(_pack, objective);
        },
      });
      expect(compiled, type).toContain(type);
    }

    const result = validatePackDocument(objectiveDocument("play_until_checkpoint"), {
      compileObjectiveRules: () => { throw new Error("compiler fixture"); },
    });
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "OBJECTIVE_RULES_UNCOMPILABLE",
      path: "/objective",
      message: "compiler fixture",
    }));
  });

  it("keeps objectiveIssues rebased on its argument rather than pack.objective", () => {
    const source = readFileSync(new URL("./pack-validation.ts", import.meta.url), "utf8");
    const body = source.slice(source.indexOf("export function objectiveIssues"), source.indexOf("function runtimeIssues"));
    expect(body).not.toContain("pack.objective");
  });

  it("admits only terminal root grounding for trajectories and checks the effective final leg", () => {
    expect(validatePackDocument(trajectory).valid).toBe(true);

    const checkpoint = structuredClone(trajectory) as DrillPackDefinition;
    (checkpoint.objective.grading as any).resolveAt = {
      kind: "checkpoint",
      checkpointId: "mate-or-stalemate",
    };
    expect(issue(checkpoint, "TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED")).toMatchObject({
      path: "/objective/grading/resolveAt",
    });

    const noOutcome = structuredClone(trajectory) as DrillPackDefinition;
    (noOutcome.legs!.at(-1) as any).objective = {
      type: "execute_break",
      summary: "No outcome leg.",
      successConditions: [{ kind: "reach_checkpoint", checkpointId: "mate-or-stalemate", to: "preserved" }],
    };
    const noOutcomeIssues = validatePackDocument(noOutcome).issues;
    expect(noOutcomeIssues).toContainEqual(expect.objectContaining({ code: "TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG" }));
    expect(noOutcomeIssues.some((candidate) => candidate.code === "SYZYGY_ASSESSMENT_MISMATCH")).toBe(false);

    const mismatch = structuredClone(trajectory) as DrillPackDefinition;
    (mismatch.legs!.at(-1)!.objective as any).type = "hold";
    expect(issue(mismatch, "SYZYGY_ASSESSMENT_MISMATCH")).toBeDefined();
  });

  it("refuses impossible material equality and meaningless rules winners at roots and legs", () => {
    const decimal = objectiveDocument("execute_break");
    (decimal.objective as any).successConditions = [{
      kind: "material_balance", perspective: "white", comparison: "equal", value: 1.5, to: "preserved",
    }];
    expect(issue(decimal, "MATERIAL_EQUALITY_UNSATISFIABLE")).toMatchObject({
      path: "/objective/successConditions/0/value",
    });
    (decimal.objective.successConditions![0] as any).value = 2;
    expect(issue(decimal, "MATERIAL_EQUALITY_UNSATISFIABLE")).toBeUndefined();

    const winner = structuredClone(trajectory) as DrillPackDefinition;
    (winner.legs![0]!.objective as any).successConditions = [{
      kind: "rules_fact", fact: "stalemate", winner: "white", to: "preserved",
    }];
    expect(issue(winner, "RULES_FACT_WINNER_UNSUPPORTED")).toMatchObject({
      path: "/legs/0/objective/successConditions/0/winner",
    });
    (winner.legs![0]!.objective.successConditions![0] as any).fact = "checkmate";
    expect(issue(winner, "RULES_FACT_WINNER_UNSUPPORTED")).toBeUndefined();
  });

  it("makes theory legs operational and keeps their pack-level refusals singular", () => {
    for (const file of [
      "trajectory-qgd-exchange-minority.json",
      "trajectory-caro-advance-chain-bishops.json",
    ]) {
      const document = JSON.parse(readFileSync(new URL(`../../../content/drafts/${file}`, import.meta.url), "utf8")) as DrillPackDefinition;
      expect(validatePackDocument(document).valid, file).toBe(true);
      const broken = structuredClone(document) as any;
      delete broken.authoredBoundary;
      broken.checkpoints = broken.checkpoints.filter(
        (checkpoint: any) => !("atAuthoredBoundary" in checkpoint.trigger),
      );
      const issues = validatePackDocument(broken).issues;
      for (const code of [
        "THEORY_NEEDS_AUTHORED_BOUNDARY",
        "BOUNDARY_NEEDS_PLY_HORIZON",
        "THEORY_NEEDS_BOUNDARY_CHECKPOINT",
      ]) {
        expect(issues.filter((candidate) => candidate.code === code), `${file}:${code}`).toHaveLength(1);
      }
      const checkpointOnly = structuredClone(document) as any;
      delete checkpointOnly.authoredBoundary;
      expect(validatePackDocument(checkpointOnly).issues.filter(
        (candidate) => candidate.code === "CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY",
      )).toHaveLength(1);
      expect(issues.some((candidate) => candidate.code === "THEORY_OBJECTIVE_NEEDS_LINE_MODE")).toBe(false);
    }

    const qgd = JSON.parse(readFileSync(new URL("../../../content/drafts/trajectory-qgd-exchange-minority.json", import.meta.url), "utf8")) as DrillPackDefinition;
    const root = createRun({
      id: "qgd-theory-membership",
      packId: qgd.id,
      packDigest: `sha256:${"1".repeat(64)}`,
      startFen: qgd.start.fen,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: "2026-08-15T00:00:00.000Z",
    });
    const run = commitMove(root, "d2d4", { at: "2026-08-15T00:00:01.000Z" }).run;
    expect(lineMembership(qgd, run, run.activeCursor.nodeId)).toContainEqual(expect.objectContaining({ verdict: "on_line" }));
  });

  it("loads the grounded B+N trajectory through the registry", async () => {
    const registry = await PackRegistry.loadDefault({ development: true });
    expect(registry.required("trajectory-mate-bishop-knight").assessmentGrounding).toBe("ledger_verified");
  });
});
