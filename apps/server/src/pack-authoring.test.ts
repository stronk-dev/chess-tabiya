import { resolvePackPath } from "@chess-tabiya/schema/pack-path";

import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  FEEDBACK_POLICIES,
  type DrillPackDefinition,
} from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it } from "vitest";

import { checkPackFile, formatPackIssue } from "./pack-check.js";
import {
  DECLARED_UNIMPLEMENTED_POLICY_MODES,
  SUPPORTED_POLICY_MODES,
} from "./capabilities.js";
import { PackRegistry, SIDECAR_BASENAMES } from "./pack-registry.js";
import { assessmentAdmissionCode, validatePackDocument } from "./pack-validation.js";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";

const fixture = JSON.parse(
  readFileSync(
    new URL("../../../schemas/drill_pack.example.json", import.meta.url),
    "utf8",
  ),
) as DrillPackDefinition;
const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "chess-tabiya-pack-authoring-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("pack authoring validation", () => {
  it("loads all six verified endgame drafts through the development registry admission path", async () => {
    const registry = await PackRegistry.loadDefault({ development: true });
    for (const id of [
      "lucena-bridge-convert",
      "philidor-third-rank-hold",
      "pawn-opposition-convert",
      "pawn-breakthrough-convert",
      "opposite-bishops-fortress-hold",
      "queen-vs-pawn-seventh-convert",
    ]) {
      expect(registry.required(id).assessmentGrounding, id).toBe("ledger_verified");
    }
  });

  it("keeps declared pack vocabularies aligned with executable capabilities", () => {
    const schema = JSON.parse(
      readFileSync(
        new URL("../../../schemas/drill_pack.schema.json", import.meta.url),
        "utf8",
      ),
    ) as any;
    expect(new Set(schema.$defs.opponentPolicy.properties.mode.enum)).toEqual(
      new Set([
        ...SUPPORTED_POLICY_MODES,
        ...DECLARED_UNIMPLEMENTED_POLICY_MODES.map((entry) => entry.mode),
      ]),
    );
    const supportedModes = new Set<string>(SUPPORTED_POLICY_MODES);
    expect(
      DECLARED_UNIMPLEMENTED_POLICY_MODES.some((entry) =>
        supportedModes.has(entry.mode),
      ),
    ).toBe(false);
    expect(schema.properties.feedbackPolicy.enum).toEqual([...FEEDBACK_POLICIES]);
  });

  it("refuses perfect tablebase resistance above the seven-piece boundary", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate.start as { fen: string }).fen = "4k3/8/8/8/8/8/PPPP4/R3K2R w - - 0 1";
    (candidate.opponentPolicy as { mode: string }).mode = "perfect_tablebase";
    expect(validatePackDocument(candidate).issues).toContainEqual(expect.objectContaining({
      code: "PERFECT_TABLEBASE_OUT_OF_RANGE",
      path: "/opponentPolicy/mode",
    }));
  });

  it("admits practical resistance only inside the classifier boundary", () => {
    const admitted = structuredClone(fixture) as DrillPackDefinition;
    (admitted.start as { fen: string }).fen = "8/8/8/8/8/2k5/4K3/7R b - - 0 1";
    (admitted.opponentPolicy as { mode: string }).mode = "practical_resistance";
    expect(validatePackDocument(admitted).issues.some((issue) => issue.code === "UNSUPPORTED_OPPONENT_POLICY")).toBe(false);

    const refused = structuredClone(fixture) as DrillPackDefinition;
    (refused.opponentPolicy as { mode: string }).mode = "practical_resistance";
    expect(validatePackDocument(refused).issues).toContainEqual(expect.objectContaining({
      code: "PRACTICAL_RESISTANCE_OUT_OF_RANGE",
      path: "/opponentPolicy/mode",
    }));
  });

  it("reports living-schema failures with JSON pointers", () => {
    const { title: _title, ...missingTitle } = structuredClone(
      fixture as unknown as Record<string, unknown>,
    );
    const result = validatePackDocument(missingTitle);

    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        source: "schema",
        severity: "error",
        code: "SCHEMA_REQUIRED",
        path: "/title",
      }),
    );
  });

  it("combines shipped chess lints and executable-policy checks", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate.spine![0] as { moveUci: string }).moveUci = "a1a8";
    (
      (candidate as unknown as Record<string, unknown>)
        .opponentPolicy as Record<string, unknown>
    ).mode = "plan_defense";
    const result = validatePackDocument(candidate);

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "lint",
          code: "ILLEGAL_SPINE_MOVE",
          path: "/spine/0/moveUci",
        }),
        expect.objectContaining({
          source: "runtime",
          code: "UNSUPPORTED_OPPONENT_POLICY",
          path: "/opponentPolicy/mode",
        }),
      ]),
    );
  });

  it("rejects immediate blunder feedback at the schema stage", () => {
    const candidate = structuredClone(fixture) as unknown as Record<string, unknown>;
    candidate.feedbackPolicy = "immediate_blunder_guard";
    const result = validatePackDocument(candidate);
    expect(result.issues).toEqual([
      expect.objectContaining({
        source: "schema",
        code: "SCHEMA_ENUM",
        path: "/feedbackPolicy",
      }),
    ]);
  });

  it("accepts immediate_guard but rejects guard tuning on another policy", () => {
    const accepted = structuredClone(fixture) as DrillPackDefinition;
    (accepted as unknown as Record<string, unknown>).feedbackPolicy = "immediate_guard";
    (accepted as unknown as Record<string, unknown>).guard = { evalSwingCp: 250 };
    expect(validatePackDocument(accepted).valid).toBe(true);

    const rejected = structuredClone(fixture) as DrillPackDefinition;
    (rejected as unknown as Record<string, unknown>).guard = { evalSwingCp: null };
    expect(validatePackDocument(rejected).issues).toContainEqual(
      expect.objectContaining({ code: "GUARD_WITHOUT_IMMEDIATE_GUARD", path: "/guard" }),
    );
  });

  it("validates guard windows, overrides, and the all-disabled refusal", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as any).feedbackPolicy = "immediate_guard";
    (candidate as any).guard = { window: { fromPly: 4, toPly: 2 }, overrides: [{ at: { spineNodeId: "missing" }, evalSwingCp: 100 }, { at: { atStart: true }, evalSwingCp: null }, { at: { atStart: true }, fireOnMate: false }], rulesTier: false, evalSwingCp: null, fireOnMate: false };
    const codes = validatePackDocument(candidate).issues.map((issue) => issue.code);
    expect(codes).toEqual(expect.arrayContaining(["GUARD_WINDOW_EMPTY", "GUARD_OVERRIDE_ANCHOR_UNKNOWN", "GUARD_OVERRIDE_DUPLICATE", "GUARD_DISABLES_EVERYTHING"]));
  });

  it("uses explicit conditions in both guard validation copies", () => {
    const candidate = structuredClone(fixture) as any;
    candidate.feedbackPolicy = "immediate_guard";
    candidate.guard = {
      rulesTier: false,
      evalSwingCp: null,
      fireOnMate: false,
      conditions: [{ kind: "engine_eval_swing", cp: 120 }],
    };
    candidate.deviations[0].class = "tactical_error";
    candidate.deviations[0].mistake = ["tactical"];
    candidate.deviations[0].cost = { kind: "cp", loss: 130, basis: "engine" };
    const codes = validatePackDocument(candidate).issues.map((issue) => issue.code);
    expect(codes).not.toContain("GUARD_DISABLES_EVERYTHING");
    expect(codes).not.toContain("GUARD_CANNOT_REACH_DEVIATION");
  });

  it("validates deviation mistake, timing, cost, and move-scoped guard declarations", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as any).feedbackPolicy = "immediate_guard";
    (candidate as any).guard = {
      evalSwingCp: 150,
      overrides: [
        { at: { atStart: true }, evalSwingCp: 120 },
        { at: { atStart: true }, moveUci: "c1e3", evalSwingCp: 50 },
        { at: { atStart: true }, moveUci: "a1a8", evalSwingCp: 50 },
      ],
    };
    Object.assign((candidate.deviations as any[])[0], {
      class: "tactical_error",
      mistake: ["timing", "tactical"],
      cost: { kind: "cp", basis: "engine", loss: 20 },
      timingWindowId: "najdorf-race",
    });
    const result = validatePackDocument(candidate);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "GUARD_OVERRIDE_MOVE_ILLEGAL", path: "/guard/overrides/2/moveUci" }),
      expect.objectContaining({ code: "GUARD_CANNOT_REACH_DEVIATION", severity: "warning" }),
    ]));
    expect(result.issues.some((issue) => issue.code === "GUARD_OVERRIDE_DUPLICATE")).toBe(false);
    expect(result.issues.some((issue) => issue.code === "DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE")).toBe(false);

    const wrongWindow = structuredClone(candidate) as any;
    wrongWindow.guard.overrides.pop();
    wrongWindow.deviations[0].mistake = ["plan"];
    wrongWindow.deviations[0].timingWindowId = "missing";
    const wrongIssues = validatePackDocument(wrongWindow).issues;
    expect(wrongIssues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "DEVIATION_WINDOW_WITHOUT_TIMING_MISTAKE", path: "/deviations/0/timingWindowId" }),
      expect.objectContaining({ code: "TIMING_WINDOW_UNKNOWN", path: "/deviations/0/timingWindowId" }),
    ]));
  });

  it("warns narrowly for deviation mistake declarations without refusing the pack", () => {
    const accepted = structuredClone(fixture) as any;
    accepted.deviations[0].mistake = ["timing"];
    const acceptedResult = validatePackDocument(accepted);
    expect(acceptedResult.valid).toBe(true);
    expect(acceptedResult.issues).toContainEqual(expect.objectContaining({ code: "DEVIATION_MISTAKE_ON_ACCEPTED", severity: "warning" }));

    const redundant = structuredClone(fixture) as any;
    redundant.deviations[0].class = "tactical_error";
    redundant.deviations[0].mistake = ["tactical"];
    expect(validatePackDocument(redundant).issues).toContainEqual(expect.objectContaining({ code: "DEVIATION_MISTAKE_TACTICAL_REDUNDANT" }));
    redundant.deviations[0].mistake = ["timing", "tactical"];
    expect(validatePackDocument(redundant).issues.some((issue) => issue.code === "DEVIATION_MISTAKE_TACTICAL_REDUNDANT")).toBe(false);
  });

  it("loads a covered transition condition and refuses an uncovered positive condition", () => {
    const covered = structuredClone(fixture) as any;
    covered.objective.successConditions = [{
      kind: "transition_feature",
      transition: { kind: "feature", feature: { kind: "move_irreversibility", subkind: "clock_zeroed" } },
    }];
    expect(validatePackDocument(covered).issues.some((issue) => issue.code === "TRANSITION_EXPRESSION_NEVER_PRESENT")).toBe(false);

    const uncovered = structuredClone(fixture) as any;
    uncovered.objective.successConditions = [{
      kind: "transition_feature",
      transition: { kind: "feature", feature: { kind: "move_irreversibility", subkind: "castled" } },
    }];
    expect(validatePackDocument(uncovered).issues).toContainEqual(expect.objectContaining({
      code: "TRANSITION_EXPRESSION_NEVER_PRESENT",
      path: "/objective/successConditions/0/transition",
    }));
  });

  it("pins transition-expression authoring bounds and constant-condition diagnostics", () => {
    const outOfRange = structuredClone(fixture) as any;
    outOfRange.objective.successConditions = [{
      kind: "transition_feature",
      transition: { kind: "feature", feature: { kind: "attacked_squares_changed", color: "white", direction: "gained", comparison: "atLeast", count: 5 } },
    }];
    expect(validatePackDocument(outOfRange).issues).toContainEqual(expect.objectContaining({
      code: "TRANSITION_COUNT_OUT_OF_RANGE",
      path: "/objective/successConditions/0/transition/feature/count",
    }));

    const tooDeep = structuredClone(fixture) as any;
    tooDeep.objective.successConditions = [{
      kind: "transition_feature",
      transition: {
        kind: "not",
        of: { kind: "not", of: { kind: "not", of: { kind: "not", of: { kind: "not", of: { kind: "feature", feature: { kind: "move_irreversibility", subkind: "clock_zeroed" } } } } } },
      },
    }];
    expect(validatePackDocument(tooDeep).issues).toContainEqual(expect.objectContaining({
      code: "TRANSITION_EXPRESSION_TOO_DEEP",
    }));

    const tautology = {
      kind: "feature",
      feature: { kind: "attacked_squares_changed", color: "white", direction: "gained", comparison: "atLeast", count: 0 },
    };
    const alwaysPositive = structuredClone(fixture) as any;
    alwaysPositive.objective.successConditions = [{ kind: "transition_feature", transition: tautology }];
    expect(validatePackDocument(alwaysPositive).issues).toContainEqual(expect.objectContaining({
      code: "TRANSITION_EXPRESSION_ALWAYS_PRESENT",
      severity: "warning",
    }));

    const neverNegative = structuredClone(fixture) as any;
    neverNegative.objective.successConditions = [{ kind: "transition_feature", transition: tautology, to: "degraded" }];
    expect(validatePackDocument(neverNegative).issues).toContainEqual(expect.objectContaining({
      code: "TRANSITION_EXPRESSION_NEVER_ABSENT",
    }));
  });

  it("admits the authored negative transition condition demonstrated by a deviation edge", () => {
    const pack = JSON.parse(readFileSync(resolvePackPath("mate-k-q-technique"), "utf8")) as DrillPackDefinition;
    const issues = validatePackDocument(pack).issues;
    expect(issues.some((issue) => issue.code === "TRANSITION_EXPRESSION_NEVER_ABSENT")).toBe(false);
    expect(issues.some((issue) => issue.code === "TRANSITION_EXPRESSION_NEVER_PRESENT")).toBe(false);
  });

  it("proves root-after-move variants and refuses false or absent siblings", () => {
    const sibling = JSON.parse(readFileSync(resolvePackPath("philidor-third-rank-hold"), "utf8")) as DrillPackDefinition;
    const candidate = JSON.parse(readFileSync(resolvePackPath("philidor-passive-rook-convert"), "utf8")) as DrillPackDefinition;
    const packs = new Map([[sibling.id, { start: sibling.start, objective: { type: sibling.objective.type } }]]);
    expect(validatePackDocument(candidate, { packs }).issues.filter((issue) => issue.code.startsWith("VARIANT_"))).toEqual([]);
    const board = Chess.fromSetup(parseFen(sibling.start.fen).unwrap()).unwrap();
    const alternatives = [...board.allDests()].flatMap(([from, destinations]) => [...destinations].map((to) => makeUci({ from, to }))).filter((move) => move !== "h6h8").slice(0, 15);
    expect(alternatives).toHaveLength(15);
    for (const moveUci of alternatives) {
      const wrong = structuredClone(candidate) as any;
      wrong.variantOf.relation.moveUci = moveUci;
      expect(validatePackDocument(wrong, { packs }).issues, moveUci).toContainEqual(expect.objectContaining({ code: "VARIANT_RELATION_UNPROVEN" }));
    }
    const absent = structuredClone(candidate) as any;
    absent.variantOf.packId = "absent";
    expect(validatePackDocument(absent, { packs }).issues).toContainEqual(expect.objectContaining({ code: "VARIANT_PACK_UNKNOWN" }));
    expect(validatePackDocument(absent).issues.some((issue) => issue.code === "VARIANT_PACK_UNKNOWN")).toBe(false);

    const mate = JSON.parse(readFileSync(resolvePackPath("mate-bishop-knight"), "utf8")) as DrillPackDefinition;
    const trajectory = JSON.parse(readFileSync(resolvePackPath("trajectory-mate-bishop-knight"), "utf8")) as DrillPackDefinition;
    const trajectoryPacks = new Map([[mate.id, { start: mate.start, objective: { type: mate.objective.type } }]]);
    expect(validatePackDocument(trajectory, { packs: trajectoryPacks }).issues.filter((issue) => issue.code.startsWith("VARIANT_"))).toEqual([]);
  });

  it("refuses self-referential variants", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as any).variantOf = {
      packId: candidate.id,
      relation: { kind: "same_root_other_side" },
    };
    expect(validatePackDocument(candidate).issues).toContainEqual(
      expect.objectContaining({ code: "VARIANT_SELF_REFERENCE" }),
    );
  });

  it("admits a budgeted blessed loss and refuses cursed-win conversion", () => {
    const outcome = structuredClone(fixture) as DrillPackDefinition;
    Object.assign(outcome as any, {
      mode: "outcome",
      start: { fen: "4k3/8/8/8/8/8/4P3/4K3 w - - 82 1", side: "white" },
      difficulty: { branchLengthTarget: 18 },
      checkpoints: [{ id: "resolution", trigger: { atPly: 1 }, actions: [] }],
      objective: {
        type: "hold",
        summary: "Fixture",
        grading: {
          assessedBy: { kind: "syzygy", category: "blessed-loss", pieceCount: 3, sourceId: "syzygy", retrievedAt: "2026-08-15T00:00:00.000Z" },
          resolveAt: { kind: "terminal" },
        },
      },
    });
    delete (outcome as any).authoredBoundary;
    delete (outcome as any).deviations;
    delete (outcome as any).spine;
    delete (outcome as any).timingWindows;
    const admitted = validatePackDocument(outcome);
    expect(admitted.valid, JSON.stringify(admitted.issues)).toBe(true);
    (outcome.objective as any).type = "win";
    (outcome.objective.grading!.assessedBy as any).category = "cursed-win";
    expect(validatePackDocument(outcome).issues).toContainEqual(expect.objectContaining({ code: "CURSED_WIN_CANNOT_ROOT_WIN" }));
    (outcome as any).difficulty.branchLengthTarget = 8;
    expect(validatePackDocument(outcome).issues).toContainEqual(expect.objectContaining({ code: "RULE_DRAW_ROOT_NEEDS_SEGMENT_BUDGET" }));
  });

  it("pins all assessment admission refusal families", () => {
    expect(assessmentAdmissionCode("hold", "unknown")).toBe(
      "ASSESSMENT_CATEGORY_INDETERMINATE",
    );
    expect(assessmentAdmissionCode("win", "blessed-loss")).toBe(
      "ASSESSMENT_CATEGORY_MISMATCH",
    );
    expect(assessmentAdmissionCode("win", "cursed-win")).toBe(
      "CURSED_WIN_CANNOT_ROOT_WIN",
    );
  });

  it("carves out atStart and permits it as a top-level window opening", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as any).checkpoints = [{ id: "root", trigger: { atStart: true }, actions: [] }];
    expect(validatePackDocument(candidate).issues.some((issue) => issue.code === "CHECKPOINT_TRUE_AT_ROOT")).toBe(false);
    (candidate as any).timingWindows = [{ id: "root-window", opens: { onTrigger: { atStart: true } }, closes: [{ kind: "deadline", afterLearnerMoves: 2 }], readiness: { mode: "any", of: [{ moveUci: "e2e4" }] }, luxuryMoveBudget: 0 }];
    expect(validatePackDocument(candidate).issues.some((issue) => issue.code === "START_TRIGGER_IN_WINDOW")).toBe(false);
  });

  it("refuses atStart as a later trajectory entry and over-budget leg totals", () => {
    const candidate = JSON.parse(
      readFileSync(resolvePackPath("trajectory-mate-bishop-knight"), "utf8"),
    ) as DrillPackDefinition;
    const entryId = candidate.legs![1]!.entryCheckpointId!;
    const checkpoint = candidate.checkpoints.find((value) => value.id === entryId)!;
    (checkpoint as any).trigger = { atStart: true };
    const issues = validatePackDocument(candidate).issues;
    expect(issues).toContainEqual(
      expect.objectContaining({ code: "START_TRIGGER_NOT_FIRST_LEG" }),
    );

    (checkpoint as any).trigger = { atPly: 8 };
    (candidate as any).difficulty.branchLengthTarget = 2;
    for (const leg of candidate.legs!) (leg as any).branchLengthTarget = 2;
    expect(validatePackDocument(candidate).issues).toContainEqual(
      expect.objectContaining({ code: "TRAJECTORY_LENGTHS_EXCEED_PACK" }),
    );
  });

  it("allows draft packs with no sources or reviewers", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as unknown as Record<string, unknown>).provenance = {
      reviewStatus: "draft",
      sources: [],
      reviewers: [],
    };

    expect(validatePackDocument(candidate).valid).toBe(true);
  });

  it("rejects the removed reviewed status at the schema boundary", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as unknown as Record<string, unknown>).provenance = {
      reviewStatus: "reviewed",
      sources: ["Reviewed source"],
      reviewers: [],
    };

    const result = validatePackDocument(candidate);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({
      source: "schema",
      code: "SCHEMA_ENUM",
      path: "/provenance/reviewStatus",
    }));
  });

  it("allows a published pack with sources without implying a reviewer gate", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate as unknown as Record<string, unknown>).provenance = {
      reviewStatus: "published",
      sources: ["Reviewed source"],
      reviewers: ["Named reviewer"],
    };

    expect(validatePackDocument(candidate).valid).toBe(true);
  });

  it("rejects checkpoint actions the client cannot execute", () => {
    const candidate = structuredClone(fixture) as DrillPackDefinition;
    (candidate.checkpoints[0] as unknown as Record<string, unknown>).actions = [
      "stop",
    ];

    const result = validatePackDocument(candidate);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual({
      severity: "error",
      source: "runtime",
      code: "UNSUPPORTED_CHECKPOINT_ACTION",
      path: "/checkpoints/0/actions/0",
      message:
        'checkpoint action "stop" is unsupported; allowed actions: compare_branches',
    });
  });

  it.each([{ actions: [] }, { actions: ["compare_branches"] }])(
    "accepts the executable checkpoint action set %j",
    ({ actions }) => {
      const candidate = structuredClone(fixture) as DrillPackDefinition;
      (candidate.checkpoints[0] as unknown as Record<string, unknown>).actions =
        actions;

      expect(validatePackDocument(candidate).valid).toBe(true);
    },
  );

  it("checks files without stack traces and keeps warnings non-fatal", async () => {
    const directory = await temporaryDirectory();
    const invalidPath = join(directory, "invalid.json");
    await writeFile(invalidPath, "{ not json", "utf8");
    const invalid = await checkPackFile(invalidPath);
    expect(invalid.valid).toBe(false);
    expect(formatPackIssue(invalid.issues[0]!)).toMatch(
      /^ERROR \/ \[INVALID_JSON\] /,
    );
    expect(formatPackIssue(invalid.issues[0]!)).not.toContain("\n");

    const warningPath = join(directory, "warning.json");
    const prediction = fixture.checkpoints.find(
      (checkpoint) => checkpoint.interaction?.type === "prediction",
    )!;
    await writeFile(
      warningPath,
      JSON.stringify({
        ...fixture,
        id: "warning-pack",
        checkpoints: [
          ...fixture.checkpoints,
          { ...prediction, id: "prediction-two" },
          { ...prediction, id: "prediction-three" },
        ],
      }),
      "utf8",
    );
    const warning = await checkPackFile(warningPath);
    expect(warning.valid).toBe(true);
    expect(warning.issues).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        code: "TOO_MANY_PREDICTIONS",
        path: "/checkpoints",
      }),
    );
  });

  it("refuses reserved sidecar names as pack files", async () => {
    const directory = await temporaryDirectory();
    const sidecar = join(directory, "evidence.json");
    await writeFile(sidecar, JSON.stringify(fixture), "utf8");
    const result = await checkPackFile(sidecar);
    expect(result).toMatchObject({ valid: false });
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "PACK_FILE_IS_RESERVED_SIDECAR_NAME" }),
    );
  });
});

describe("development draft registry", () => {
  it("keeps the official record when an unreviewed draft reuses its id", async () => {
    const official = { ...structuredClone(fixture), title: "Official title" };
    const draft = {
      ...structuredClone(fixture),
      title: "Draft title",
      provenance: { ...structuredClone(fixture.provenance), reviewStatus: "draft" },
    };

    for (const documents of [
      [
        { source: "official.json", value: official, channel: "official" as const },
        { source: "draft.json", value: draft, channel: "community" as const },
      ],
      [
        { source: "draft.json", value: draft, channel: "community" as const },
        { source: "official.json", value: official, channel: "official" as const },
      ],
    ]) {
      const registry = await PackRegistry.fromDocuments(documents);
      expect(registry.required(fixture.id).summary).toMatchObject({
        title: "Official title",
        channel: "official",
      });
    }
  });

  it("uses one sidecar vocabulary for recursive discovery", async () => {
    const directory = await temporaryDirectory();
    const nested = join(directory, "candidate");
    await import("node:fs/promises").then(({ mkdir }) => mkdir(nested));
    await writeFile(
      join(nested, "pack.json"),
      JSON.stringify({ ...structuredClone(fixture), id: "sidecar-pack" }),
      "utf8",
    );
    for (const name of SIDECAR_BASENAMES) {
      await writeFile(join(nested, name), "{}", "utf8");
    }
    const registry = await PackRegistry.loadDefault({
      development: true,
      draftsDirectory: directory,
    });
    expect(registry.get("sidecar-pack")).toBeDefined();
    expect(registry.list().filter((pack) => pack.id === "sidecar-pack")).toHaveLength(1);
  });

  it("loads the committed sourcing candidates without mistaking sidecars for packs", async () => {
    const candidates = new URL("../../../content/candidates/", import.meta.url);
    const { readdir } = await import("node:fs/promises");
    const { access } = await import("node:fs/promises");
    const packDirs = (await Promise.all(
      (await readdir(candidates, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => {
          try { await access(new URL(`${entry.name}/pack.json`, candidates)); return 1 as const; }
          catch { return 0 as const; }
        }),
    )).reduce<number>((sum, n) => sum + n, 0);
    const registry = await PackRegistry.loadDefault({
      development: true,
      draftsDirectory: candidates.pathname,
    });
    // Derived, not hand-pinned (the D4 lesson): one registry entry per dir
    // that actually contains a pack.json. The schema example is validation
    // input, never learner content.
    expect(registry.list()).toHaveLength(packDirs);
    expect(registry.list().filter((entry) => entry.reviewStatus === "draft")).toHaveLength(packDirs);
  });

  it("serves committed drafts as disclosed community content in every environment", async () => {
    const directory = await temporaryDirectory();
    const draft = {
      ...structuredClone(fixture),
      id: "development-only-pack",
      title: "Development-only pack",
      provenance: { ...structuredClone(fixture.provenance), reviewStatus: "draft" },
    };
    await writeFile(join(directory, "draft.json"), JSON.stringify(draft), "utf8");

    const production = await PackRegistry.loadDefault({
      development: false,
      draftsDirectory: directory,
    });
    expect(production.required(draft.id).summary).toMatchObject({ title: draft.title, reviewStatus: "draft", channel: "community" });

    const development = await PackRegistry.loadDefault({
      development: true,
      draftsDirectory: directory,
    });
    expect(development.required(draft.id).summary.title).toBe(draft.title);
  });

  it("lets an explicit development draft replace its published id", async () => {
    const directory = await temporaryDirectory();
    const draftPath = join(directory, "replacement.json");
    await writeFile(
      draftPath,
      JSON.stringify({ ...structuredClone(fixture), title: "Draft replacement" }),
      "utf8",
    );

    const registry = await PackRegistry.loadDefault({
      development: true,
      draftsDirectory: join(directory, "empty"),
      draftFile: draftPath,
    });
    expect(registry.required(fixture.id).summary.title).toBe("Draft replacement");
    await expect(
      PackRegistry.loadDefault({ development: false, draftFile: draftPath }),
    ).rejects.toThrow("Draft packs may only be loaded in development mode");
  });
});
