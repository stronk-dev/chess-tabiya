import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { readFileSync, readdirSync } from "node:fs";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { validatePackDocument } from "./pack-validation.js";

function document(path: string): DrillPackDefinition {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as DrillPackDefinition;
}

const example = document("../../../schemas/drill_pack.example.json");
const trajectory = document(resolvePackPath("trajectory-mate-bishop-knight"));
const line = document(resolvePackPath("anti-caro-advance"));
const outcome = document(resolvePackPath("rook-4v3-same-side"));
const reasoning = document("../../../content/drafts/stated-reasoning.browser.json");

function clone(value: DrillPackDefinition): any {
  return structuredClone(value);
}

function codes(value: unknown, options: Parameters<typeof validatePackDocument>[1] = {}): readonly string[] {
  return validatePackDocument(value, options).issues.map((issue) => issue.code);
}

function has(value: unknown, code: string, options: Parameters<typeof validatePackDocument>[1] = {}): void {
  expect(codes(value, options), code).toContain(code);
}

function testSources(directory: URL): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const url = new URL(entry.name, directory);
    if (entry.isDirectory()) return testSources(new URL(`${entry.name}/`, directory));
    return entry.isFile() && entry.name.endsWith(".test.ts")
      ? [readFileSync(url, "utf8")]
      : [];
  });
}

function productionSources(directory: URL): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const url = new URL(entry.name, directory);
    if (entry.name === "node_modules") return [];
    if (entry.isDirectory()) return productionSources(new URL(`${entry.name}/`, directory));
    return entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")
      ? [readFileSync(url, "utf8")]
      : [];
  });
}

function discoveredRefusalCodes(source: string): Set<string> {
  const patterns = [
    /new\s+(?:ServerError|SourcingError|RuntimeError|PackCompileError|PackRunPgnError|BranchQueryError)\s*\(\s*["']([A-Z][A-Z0-9_]+)["']/gu,
    /\bissue\s*\(\s*["']([A-Z][A-Z0-9_]+)["']/gu,
    /\bcode\s*:\s*["']([A-Z][A-Z0-9_]+)["']/gu,
  ];
  return new Set(patterns.flatMap((pattern) => [...source.matchAll(pattern)].map((match) => match[1]!)));
}

describe("fixed refusal-code coverage", () => {
  it("pins lint refusals whose shapes are otherwise easy to regress", () => {
    const duplicate = clone(example);
    duplicate.spine.push({ ...duplicate.spine[0], id: duplicate.spine[0].id });
    has(duplicate, "DUPLICATE_SPINE_NODE");

    const transposition = clone(example);
    transposition.spine.push({ ...transposition.spine[0], id: "same-position" });
    has(transposition, "SPINE_TRANSPOSITION_COLLISION");

    const unknown = clone(example);
    unknown.checkpoints[0].trigger = { atSpineNode: "missing-node" };
    has(unknown, "UNKNOWN_SPINE_NODE");

    const invalidFen = clone(example);
    invalidFen.start.fen = "not a fen";
    has(invalidFen, "INVALID_START_FEN");

    const concept = clone(example);
    concept.concepts = ["Not A Slug"];
    has(concept, "CONCEPT_KEY_NOT_SLUG");
  });

  it("pins boundary, root, publication, and structural refusals", () => {
    const noGrant = clone(line);
    noGrant.authoredBoundary = { plyHorizon: 2 };
    has(noGrant, "BOUNDARY_GRANTS_NOTHING");

    const beyond = clone(line);
    beyond.authoredBoundary = { spineNodeIds: [beyond.spine.at(-1)?.id ?? "missing"], plyHorizon: 0 };
    has(beyond, "BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT");

    const rootCheckpoint = clone(example);
    rootCheckpoint.checkpoints[0].trigger = { atPly: 0 };
    has(rootCheckpoint, "CHECKPOINT_UNREACHABLE_AT_ROOT");

    const published = clone(example);
    published.provenance = { reviewStatus: "published", sources: [], reviewers: [] };
    has(published, "GRADUATION_REQUIRES_SOURCES");

    const lineSpan = clone(example);
    lineSpan.authoredBoundary.fenPredicates = [{
      type: "structuralFeature",
      feature: { kind: "feature", feature: { kind: "line_blockers", from: "a1", to: "a2", comparison: "equal", count: 0 } },
    }];
    has(lineSpan, "LINE_SPAN_EMPTY");

  });

  it("pins objective transition and resolution refusals", () => {
    const admitted = clone(example);
    admitted.objective.grading = {
      assessedBy: { kind: "authored", note: "Fixture" }, resolveAt: { kind: "terminal" },
    };
    expect(codes(admitted)).not.toContain("OBJECTIVE_GRADING_UNSUPPORTED");
    admitted.objective.grading.resolveAt = { kind: "checkpoint", checkpointId: admitted.checkpoints[0].id };
    has(admitted, "OBJECTIVE_GRADING_RESOLUTION_INERT");

    const trajectoryLeg = structuredClone(JSON.parse(readFileSync(resolvePackPath("trajectory-mate-bishop-knight"), "utf8")));
    trajectoryLeg.legs[0].objective.grading = { assessedBy: { kind: "authored", note: "Fixture" }, resolveAt: { kind: "terminal" } };
    has(trajectoryLeg, "OBJECTIVE_GRADING_UNSUPPORTED");

    const rootOutcome = clone(outcome);
    rootOutcome.objective.grading.resolveAt = { kind: "checkpoint", checkpointId: "missing" };
    has(rootOutcome, "OBJECTIVE_RESOLUTION_UNKNOWN");

    const absorbing = clone(outcome);
    absorbing.objective.successConditions = [{
      kind: "reach_checkpoint", checkpointId: absorbing.checkpoints[0].id, to: "achieved",
    }];
    has(absorbing, "OBJECTIVE_ABSORBING_WITHOUT_OUTCOME");

    const invalidTarget = clone(outcome);
    invalidTarget.objective.successConditions = [{ kind: "outcome", result: "draw", to: "preserved" }];
    has(invalidTarget, "OBJECTIVE_OUTCOME_TARGET_INVALID");

    const backEdge = clone(outcome);
    backEdge.objective.successConditions = [{
      kind: "reach_checkpoint", checkpointId: backEdge.checkpoints[0].id,
      to: "preserved", from: ["degraded"],
    }];
    has(backEdge, "OBJECTIVE_DEGRADED_IS_ONE_WAY");

    const unknownCondition = clone(example);
    unknownCondition.objective.successConditions = [{ kind: "reach_checkpoint", checkpointId: "missing" }];
    has(unknownCondition, "UNSUPPORTED_OBJECTIVE_CONDITION");
  });

  it("pins stated-reasoning refusal families", () => {
    const unresolved = clone(reasoning);
    const points = unresolved.checkpoints.find((checkpoint: any) => checkpoint.interaction?.type === "stated_reasoning").interaction.keyPoints;
    points[1].id = points[0].id;
    has(unresolved, "KEY_POINT_GROUND_UNRESOLVED");

    const collision = clone(reasoning);
    const collisionPoints = collision.checkpoints.find((checkpoint: any) => checkpoint.interaction?.type === "stated_reasoning").interaction.keyPoints;
    collisionPoints[1].phrases = [collisionPoints[0].phrases[0]];
    has(collision, "KEY_POINT_PHRASES_COLLIDE");

    const judgement = clone(reasoning);
    const judgementPoints = judgement.checkpoints.find((checkpoint: any) => checkpoint.interaction?.type === "stated_reasoning").interaction.keyPoints;
    judgementPoints[0].phrases = ["brilliant"];
    has(judgement, "KEY_POINT_PHRASE_IS_JUDGEMENT");

    const falseGround = clone(reasoning);
    const falsePoints = falseGround.checkpoints.find((checkpoint: any) => checkpoint.interaction?.type === "stated_reasoning").interaction.keyPoints;
    falsePoints[0].ground = {
      kind: "structural",
      expression: { kind: "pieceOnSquare", square: "a8", piece: { color: "white", role: "king" } },
    };
    has(falseGround, "KEY_POINT_GROUND_FALSE_AT_CHECKPOINT");
  });

  it("pins trajectory shape and sequencing refusals", () => {
    const wrongMode = clone(trajectory);
    wrongMode.mode = "plan";
    has(wrongMode, "LEGS_NEED_TRAJECTORY_MODE");

    const wrongObjective = clone(trajectory);
    wrongObjective.objective = { type: "play_until_checkpoint", summary: "Fixture", successConditions: [{ kind: "reach_checkpoint", checkpointId: wrongObjective.checkpoints[0].id }] };
    has(wrongObjective, "LEGS_NEED_TRAJECTORY_OBJECTIVE");

    const topConditions = clone(trajectory);
    topConditions.objective.successConditions = [{ kind: "reach_checkpoint", checkpointId: topConditions.checkpoints[0].id }];
    has(topConditions, "TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED");

    const noLegs = clone(trajectory);
    delete noLegs.legs;
    has(noLegs, "TRAJECTORY_OBJECTIVE_NEEDS_LEGS");

    const duplicate = clone(trajectory);
    duplicate.legs[1].id = duplicate.legs[0].id;
    has(duplicate, "TRAJECTORY_DUPLICATE_LEG_ID");

    const noEntry = clone(trajectory);
    delete noEntry.legs[1].entryCheckpointId;
    has(noEntry, "TRAJECTORY_LEG_NEEDS_ENTRY");

    const reused = clone(trajectory);
    reused.legs[2].entryCheckpointId = reused.legs[1].entryCheckpointId;
    has(reused, "TRAJECTORY_LEG_ENTRY_REUSED");

    const coincident = clone(trajectory);
    const firstEntry = coincident.checkpoints.find((checkpoint: any) => checkpoint.id === coincident.legs[1].entryCheckpointId);
    const secondEntry = coincident.checkpoints.find((checkpoint: any) => checkpoint.id === coincident.legs[2].entryCheckpointId);
    firstEntry.trigger = { atPly: 8 };
    secondEntry.trigger = { atPly: 8 };
    has(coincident, "TRAJECTORY_LEG_ENTRIES_COINCIDE");

    const nonSimple = clone(trajectory);
    nonSimple.checkpoints.find((checkpoint: any) => checkpoint.id === nonSimple.legs[1].entryCheckpointId).trigger = {
      atWindow: { windowId: "missing", verdict: "in_time" },
    };
    has(nonSimple, "TRAJECTORY_LEG_ENTRY_NOT_SIMPLE");

    const nested = clone(trajectory);
    nested.legs[1].objective.type = "run_trajectory";
    has(nested, "TRAJECTORY_NESTED_UNSUPPORTED");

    const syzygyLeg = clone(trajectory);
    syzygyLeg.legs[2].objective.grading = {
      assessedBy: { kind: "syzygy", category: "win", pieceCount: 4, sourceId: "syzygy", retrievedAt: "2026-08-15T00:00:00.000Z" },
      resolveAt: { kind: "terminal" },
    };
    has(syzygyLeg, "TRAJECTORY_LEG_SYZYGY_UNSUPPORTED");

    const earlyTerminal = clone(trajectory);
    earlyTerminal.legs[0].objective.grading = {
      assessedBy: { kind: "authored", note: "Fixture" }, resolveAt: { kind: "terminal" },
    };
    has(earlyTerminal, "TRAJECTORY_NONFINAL_TERMINAL_RESOLUTION");

    const transitioned = clone(trajectory);
    transitioned.legs[0].objective.successConditions[0].to = "transitioned";
    has(transitioned, "TRAJECTORY_TRANSITIONED_UNSUPPORTED");

    const twoTheory = clone(trajectory);
    twoTheory.legs[0].objective.type = "follow_theory";
    twoTheory.legs[1].objective.type = "follow_theory";
    has(twoTheory, "TRAJECTORY_MULTIPLE_THEORY_LEGS");
  });

  it("pins theory, timing, start, and exact-assessment refusals", () => {
    const fenDeviation = clone(line);
    fenDeviation.deviations[0].at = { fen: fenDeviation.start.fen };
    has(fenDeviation, "THEORY_DEVIATION_NEEDS_SPINE_ANCHOR");

    const timing = clone(example);
    timing.timingWindows[0].closes = timing.timingWindows[0].closes.filter((close: any) => close.kind !== "deadline");
    timing.objective.successConditions = [{ kind: "timing_window", windowId: timing.timingWindows[0].id, verdict: "in_time" }];
    has(timing, "TIMING_WINDOW_NEVER_RESOLVES");

    const terminal = clone(example);
    terminal.start.fen = "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1";
    has(terminal, "START_POSITION_UNRUNNABLE");

    const syzygy = clone(outcome);
    syzygy.objective.grading.assessedBy = {
      kind: "syzygy", category: "draw", pieceCount: 7, sourceId: "syzygy", retrievedAt: "2026-08-15T00:00:00.000Z",
    };
    has(syzygy, "SYZYGY_ASSESSMENT_OUT_OF_RANGE");

    const inline = clone(example);
    inline.provenance.engineValidation = {};
    has(inline, "PROVENANCE_EVIDENCE_INLINE");

    const shallow = clone(example);
    shallow.objective.grading = { assessedBy: { kind: "engine", score: { kind: "cp", centipawns: 0 }, perspective: "white", depth: 21, engineId: "sf", engineVersion: "18", sourceId: "sf", retrievedAt: "2026-08-15T00:00:00.000Z" }, resolveAt: { kind: "terminal" } };
    has(shallow, "ENGINE_ASSESSMENT_DEPTH_BELOW_FLOOR");
    shallow.objective.grading.assessedBy.depth = 22;
    shallow.start.fen = "8/8/8/8/8/8/4k3/4K3 w - - 0 1";
    has(shallow, "ENGINE_ASSESSMENT_ON_TABLEBASE_ROOT");

    const engineLeg = structuredClone(JSON.parse(readFileSync(resolvePackPath("trajectory-mate-bishop-knight"), "utf8")));
    engineLeg.legs[0].objective.grading = { assessedBy: { kind: "authored", note: "Fixture" }, resolveAt: { kind: "terminal" } };
    engineLeg.legs[0].objective.grading.assessedBy = { kind: "engine", score: { kind: "cp", centipawns: 0 }, perspective: "white", depth: 22, engineId: "sf", engineVersion: "18", sourceId: "sf", retrievedAt: "2026-08-15T00:00:00.000Z" };
    has(engineLeg, "TRAJECTORY_LEG_ENGINE_UNSUPPORTED");
  });

  it("pins schema-shadowed defensive refusals as deliberate backstops", () => {
    const source = readFileSync(new URL("./pack-validation.ts", import.meta.url), "utf8");
    for (const code of [
      "NEGATIVE_FEATURE_COUNT",
      "STRUCTURAL_KIND_UNRECOGNISED",
      "TRANSITION_KIND_UNRECOGNISED",
      "UNSUPPORTED_FEEDBACK_POLICY",
    ] as const) {
      expect(source).toContain(`"${code}"`);
    }
    const schema = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.schema.json", import.meta.url), "utf8")) as any;
    expect(schema.properties.feedbackPolicy.enum).not.toContain("unsupported-fixture");
    expect(schema.$defs.structuralFeature.oneOf).toBeDefined();
  });

  it("requires every fixed authoring refusal to have a direct test disposition", () => {
    const emitters = [
      ...productionSources(new URL("./", import.meta.url)),
      ...productionSources(new URL("../../../packages/", import.meta.url)),
    ].join("\n");
    const fixedCodes = discoveredRefusalCodes(emitters);
    const corpus = [
      ...testSources(new URL("./", import.meta.url)),
      ...testSources(new URL("../../../packages/", import.meta.url)),
    ].join("\n");
    const register = JSON.parse(readFileSync(
      new URL("./fixtures/refusal-debt.fixture.json", import.meta.url),
      "utf8",
    )) as {
      readonly schema: string;
      readonly codes: readonly string[];
    };
    const ceiling = JSON.parse(readFileSync(
      new URL("./fixtures/refusal-debt-ceiling.fixture.json", import.meta.url),
      "utf8",
    )) as {
      readonly schema: string;
      readonly codes: readonly string[];
    };
    const debt = register.codes;
    const missing = [...fixedCodes]
      .filter((code) => !new RegExp(`\\b${code}\\b`, "u").test(corpus))
      .sort();
    expect(missing).toEqual(debt);
    expect(new Set(debt).size).toBe(debt.length);
    expect(register.schema).toBe("tabiya.test-fixture.refusal-debt.v2");
    expect(ceiling.schema).toBe("tabiya.test-fixture.refusal-debt-ceiling.v1");
    expect(new Set(ceiling.codes).size).toBe(ceiling.codes.length);
    expect(debt.every((code) => ceiling.codes.includes(code))).toBe(true);
    expect(fixedCodes.size).toBeGreaterThanOrEqual(190);
    for (const disposedByRegex of ["RATINGS_NOT_A_GROUP", "SPEEDS_NOT_A_SPEED", "WINDOW_INVALID"]) {
      expect(missing).not.toContain(disposedByRegex);
    }
  });
});
