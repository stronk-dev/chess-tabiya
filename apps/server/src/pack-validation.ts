import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  CHECKPOINT_ACTIONS,
  FEEDBACK_POLICIES,
  lintDrillPack,
  type DrillPackDefinition,
} from "@chess-tabiya/schema/drill-pack";
import { createRun } from "@chess-tabiya/runtime";
import { between } from "chessops/attacks";
import { parseSquare } from "chessops/util";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  DECLARED_UNIMPLEMENTED_POLICY_MODES,
  SUPPORTED_POLICY_MODES,
} from "./capabilities.js";
import { checkpointMatches, objectiveRules } from "./pack-orchestrator.js";
import { countFenPieces } from "./sourcing/chess-facts.js";

export interface PackValidationIssue {
  readonly severity: "error" | "warning";
  readonly source: "schema" | "lint" | "runtime";
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface PackValidationResult {
  readonly valid: boolean;
  readonly issues: readonly PackValidationIssue[];
  readonly document?: DrillPackDefinition;
}

export interface PackShapeLookup {
  get(id: string): { readonly document: { readonly plans: readonly { readonly id: string }[] } } | undefined;
}

let schemaValidator: ValidateFunction | undefined;

function validator(): ValidateFunction {
  if (schemaValidator !== undefined) return schemaValidator;
  const schemaPath = fileURLToPath(
    new URL("../../../schemas/drill_pack.schema.json", import.meta.url),
  );
  const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as Record<
    string,
    unknown
  >;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  schemaValidator = ajv.compile(schema);
  return schemaValidator;
}

function pointerToken(value: string): string {
  return value.replaceAll("~", "~0").replaceAll("/", "~1");
}

function schemaPath(error: ErrorObject): string {
  if (error.keyword !== "required") return error.instancePath || "/";
  const missing = error.params.missingProperty;
  return typeof missing === "string"
    ? `${error.instancePath}/${pointerToken(missing)}` || "/"
    : error.instancePath || "/";
}

function schemaIssue(error: ErrorObject): PackValidationIssue {
  return Object.freeze({
    severity: "error",
    source: "schema",
    code: `SCHEMA_${error.keyword.toUpperCase()}`,
    path: schemaPath(error),
    message: error.message ?? `failed ${error.keyword}`,
  });
}

function runtimeIssue(
  code: string,
  path: string,
  message: string,
): PackValidationIssue {
  return Object.freeze({ severity: "error", source: "runtime", code, path, message });
}

const PLAN_OBJECTIVES = new Set([
  "reach_structure", "preserve_plan_window", "execute_break",
  "prevent_opponent_plan", "transition_to_endgame",
]);

export function structuralIssues(value: unknown, path = "", depth = 0): readonly PackValidationIssue[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [];
  const object = value as Record<string, unknown>;
  const issues: PackValidationIssue[] = [];
  if (["all", "any"].includes(String(object.kind)) && Array.isArray(object.of)) {
    if (depth >= 4) issues.push(runtimeIssue("STRUCTURAL_EXPRESSION_TOO_DEEP", path || "/", "structural expressions may be nested at most four levels"));
    object.of.forEach((child, index) => issues.push(...structuralIssues(child, `${path}/of/${index}`, depth + 1)));
  } else if (object.kind === "not") {
    if (depth >= 4) issues.push(runtimeIssue("STRUCTURAL_EXPRESSION_TOO_DEEP", path || "/", "structural expressions may be nested at most four levels"));
    issues.push(...structuralIssues(object.of, `${path}/of`, depth + 1));
  } else if (object.kind === "feature") {
    issues.push(...structuralIssues(object.feature, `${path}/feature`, depth));
  } else if (object.kind === "line_blockers") {
    const from = parseSquare(String(object.from)); const to = parseSquare(String(object.to));
    if (from === undefined || to === undefined || between(from, to).isEmpty()) issues.push(runtimeIssue("LINE_SPAN_EMPTY", path || "/", "line blocker endpoints must be distinct, aligned, and non-adjacent"));
    if (typeof object.count === "number" && object.count < 0) issues.push(runtimeIssue("NEGATIVE_FEATURE_COUNT", `${path}/count`, "feature counts cannot be negative"));
  } else if (object.kind === "outpost") {
    const square = parseSquare(String(object.square));
    if (square !== undefined) { const rank = Math.floor(square / 8); const relative = object.color === "white" ? rank + 1 : 8 - rank; if (relative < 4 || relative > 6) issues.push(runtimeIssue("OUTPOST_RANK_OUT_OF_RANGE", `${path}/square`, "Tabiya's strict outpost detector applies only to relative ranks four through six")); }
  } else if (["direct_attack_count", "piece_reach_count"].includes(String(object.kind))) {
    if (typeof object.count === "number" && object.count < 0) issues.push(runtimeIssue("NEGATIVE_FEATURE_COUNT", `${path}/count`, "feature counts cannot be negative"));
  }
  return Object.freeze(issues);
}

function structuralIssuesInPack(pack: DrillPackDefinition): readonly PackValidationIssue[] {
  const issues: PackValidationIssue[] = [];
  const visit = (value: unknown, path: string): void => {
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach((item, index) => visit(item, `${path}/${index}`)); return; }
    const object = value as Record<string, unknown>;
    if (object.kind === "structural_feature" || object.type === "structuralFeature") issues.push(...structuralIssues(object.feature, `${path}/feature`));
    for (const [key, child] of Object.entries(object)) visit(child, `${path}/${pointerToken(key)}`);
  };
  visit(pack, "");
  return Object.freeze(issues);
}

function runtimeIssues(pack: DrillPackDefinition, shapes?: PackShapeLookup): readonly PackValidationIssue[] {
  const issues: PackValidationIssue[] = [];
  issues.push(...structuralIssuesInPack(pack));
  const raw = pack as unknown as Record<string, unknown>;
  const shapeIds = new Set(pack.shapes ?? []);
  for (const [index, shapeId] of (pack.shapes ?? []).entries()) {
    if (shapes !== undefined && shapes.get(shapeId) === undefined) issues.push(runtimeIssue("SHAPE_REFERENCE_UNKNOWN", `/shapes/${index}`, `unknown shape ${shapeId}`));
  }
  for (const [index, planClass] of (pack.planClasses ?? []).entries()) {
    if (planClass.shapePlan === undefined) continue;
    if (!shapeIds.has(planClass.shapePlan.shape)) issues.push(runtimeIssue("SHAPE_PLAN_REF_UNLISTED", `/planClasses/${index}/shapePlan`, `shape ${planClass.shapePlan.shape} is not listed in pack.shapes`));
    const entry = shapes?.get(planClass.shapePlan.shape);
    if (entry !== undefined && !entry.document.plans.some((plan) => plan.id === planClass.shapePlan!.plan)) issues.push(runtimeIssue("SHAPE_PLAN_UNKNOWN", `/planClasses/${index}/shapePlan`, `shape ${planClass.shapePlan.shape} has no plan ${planClass.shapePlan.plan}`));
  }
  const mode = raw.mode;

  const provenance = raw.provenance as Record<string, unknown>;
  const reviewStatus = provenance.reviewStatus;
  if (reviewStatus === "published") {
    const sources = provenance.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      issues.push(
        runtimeIssue(
          "GRADUATION_REQUIRES_SOURCES",
          "/provenance/sources",
          `${reviewStatus} packs require at least one provenance source; see planning/content-era/plan.md §3b`,
        ),
      );
    }
  }

  const feedbackPolicy = raw.feedbackPolicy;
  if (!FEEDBACK_POLICIES.some((policy) => policy === feedbackPolicy)) {
    issues.push(
      runtimeIssue(
        "UNSUPPORTED_FEEDBACK_POLICY",
        "/feedbackPolicy",
        `${String(feedbackPolicy)} is not a supported v1 feedback policy`,
      ),
    );
  }

  const opponentPolicy = raw.opponentPolicy as Record<string, unknown>;
  const opponentMode = opponentPolicy.mode;
  if (
    typeof opponentMode !== "string" ||
    !SUPPORTED_POLICY_MODES.some((mode) => mode === opponentMode)
  ) {
    const reason = DECLARED_UNIMPLEMENTED_POLICY_MODES.find(
      (entry) => entry.mode === opponentMode,
    )?.reason;
    issues.push(
      runtimeIssue(
        "UNSUPPORTED_OPPONENT_POLICY",
        "/opponentPolicy/mode",
        reason ?? `${String(opponentMode)} is not selectable in v1`,
      ),
    );
  }

  const checkpoints = new Set(pack.checkpoints.map((checkpoint) => checkpoint.id));
  const legs = pack.legs;
  if (legs !== undefined) {
    if (mode !== "trajectory") {
      issues.push(runtimeIssue("LEGS_NEED_TRAJECTORY_MODE", "/mode", "legs require mode trajectory"));
    }
    if (pack.objective.type !== "run_trajectory") {
      issues.push(runtimeIssue("LEGS_NEED_TRAJECTORY_OBJECTIVE", "/objective/type", "legs require run_trajectory"));
    }
    if ((pack.objective.successConditions?.length ?? 0) > 0) {
      issues.push(runtimeIssue("TRAJECTORY_TOP_LEVEL_CONDITIONS_UNSUPPORTED", "/objective/successConditions", "trajectory grading belongs to legs"));
    }
    const seenLegs = new Set<string>();
    const seenEntries = new Set<string>();
    let theoryCount = 0;
    for (const [index, leg] of legs.entries()) {
      if (seenLegs.has(leg.id)) issues.push(runtimeIssue("TRAJECTORY_DUPLICATE_LEG_ID", `/legs/${index}/id`, `duplicate leg id ${leg.id}`));
      seenLegs.add(leg.id);
      if (index === 0 && leg.entryCheckpointId !== undefined) {
        issues.push(runtimeIssue("TRAJECTORY_FIRST_LEG_HAS_ENTRY", "/legs/0/entryCheckpointId", "first leg begins at the run root"));
      }
      if (index > 0 && leg.entryCheckpointId === undefined) {
        issues.push(runtimeIssue("TRAJECTORY_LEG_NEEDS_ENTRY", `/legs/${index}/entryCheckpointId`, "later trajectory legs require an entry checkpoint"));
      }
      if (leg.entryCheckpointId !== undefined) {
        if (!checkpoints.has(leg.entryCheckpointId)) issues.push(runtimeIssue("TRAJECTORY_LEG_ENTRY_UNKNOWN", `/legs/${index}/entryCheckpointId`, `unknown checkpoint ${leg.entryCheckpointId}`));
        if (seenEntries.has(leg.entryCheckpointId)) issues.push(runtimeIssue("TRAJECTORY_LEG_ENTRY_REUSED", `/legs/${index}/entryCheckpointId`, `entry checkpoint ${leg.entryCheckpointId} is reused`));
        seenEntries.add(leg.entryCheckpointId);
        const checkpoint = pack.checkpoints.find((candidate) => candidate.id === leg.entryCheckpointId);
        if (checkpoint !== undefined && "windowOpens" in checkpoint.trigger) issues.push(runtimeIssue("TRAJECTORY_LEG_ENTRY_NOT_SIMPLE", `/legs/${index}/entryCheckpointId`, "timing windows cannot open a trajectory leg"));
      }
      if (leg.objective.type === "run_trajectory") issues.push(runtimeIssue("TRAJECTORY_NESTED_UNSUPPORTED", `/legs/${index}/objective/type`, "a trajectory leg cannot contain another trajectory"));
      if (leg.objective.type === "follow_theory") theoryCount += 1;
      if (leg.objective.grading?.assessedBy.kind === "syzygy") issues.push(runtimeIssue("TRAJECTORY_LEG_SYZYGY_UNSUPPORTED", `/legs/${index}/objective/grading/assessedBy`, "leg entry positions are not statically bound to a Syzygy record"));
      if (index < legs.length - 1 && leg.objective.grading?.resolveAt.kind === "terminal") issues.push(runtimeIssue("TRAJECTORY_NONFINAL_TERMINAL_RESOLUTION", `/legs/${index}/objective/grading/resolveAt`, "only the final trajectory leg may resolve at terminal"));
      for (const [conditionIndex, condition] of (leg.objective.successConditions ?? []).entries()) {
        const to = condition.to ?? "achieved";
        if (to === "transitioned") issues.push(runtimeIssue("TRAJECTORY_TRANSITIONED_UNSUPPORTED", `/legs/${index}/objective/successConditions/${conditionIndex}/to`, "trajectory legs reset to active instead of entering transitioned"));
        if (index < legs.length - 1 && (to === "achieved" || to === "failed") && condition.kind !== "outcome") issues.push(runtimeIssue("TRAJECTORY_NONFINAL_LEG_ABSORBING", `/legs/${index}/objective/successConditions/${conditionIndex}`, "a non-final leg may not stop play before a terminal outcome"));
        if (condition.kind === "reach_checkpoint") {
          const preceding = legs.slice(0, index + 1).some((candidate) => candidate.entryCheckpointId === condition.checkpointId);
          if (preceding) issues.push(runtimeIssue("TRAJECTORY_LEG_CONDITION_PRECEDES_ENTRY", `/legs/${index}/objective/successConditions/${conditionIndex}`, "condition is already true at or before this leg entry"));
        }
      }
    }
    if (theoryCount > 1) issues.push(runtimeIssue("TRAJECTORY_MULTIPLE_THEORY_LEGS", "/legs", "a trajectory may contain at most one theory leg"));
    const plyEntries = new Map<number, number>();
    for (const [index, leg] of legs.entries()) {
      const checkpoint = pack.checkpoints.find((candidate) => candidate.id === leg.entryCheckpointId);
      const trigger = checkpoint?.trigger;
      if (trigger !== undefined && !("windowOpens" in trigger) && "atPly" in trigger) {
        if (plyEntries.has(trigger.atPly)) issues.push(runtimeIssue("TRAJECTORY_LEG_ENTRIES_COINCIDE", `/legs/${index}/entryCheckpointId`, `another leg also enters at ply ${trigger.atPly}`));
        plyEntries.set(trigger.atPly, index);
      }
    }
  } else if (pack.objective.type === "run_trajectory") {
    issues.push(runtimeIssue("TRAJECTORY_OBJECTIVE_NEEDS_LEGS", "/legs", "run_trajectory requires authored legs"));
  }
  for (const [checkpointIndex, checkpoint] of pack.checkpoints.entries()) {
    const actions = checkpoint.actions;
    if (!Array.isArray(actions)) continue;
    for (const [actionIndex, action] of actions.entries()) {
      if (
        typeof action === "string" &&
        !CHECKPOINT_ACTIONS.some((supported) => supported === action)
      ) {
        issues.push(
          runtimeIssue(
            "UNSUPPORTED_CHECKPOINT_ACTION",
            `/checkpoints/${checkpointIndex}/actions/${actionIndex}`,
            `checkpoint action ${JSON.stringify(action)} is unsupported; allowed actions: ${CHECKPOINT_ACTIONS.join(", ")}`,
          ),
        );
      }
    }
  }

  const conditions = pack.objective.successConditions;
  const outcomeObjective = ["win", "hold", "save", "resist"].includes(
    pack.objective.type,
  );
  const grading = pack.objective.grading;
  const theoryObjective = pack.objective.type === "follow_theory";
  const boundary = pack.authoredBoundary;
  const boundaryCheckpoints = pack.checkpoints.filter(
    (checkpoint) =>
      !("windowOpens" in checkpoint.trigger) &&
      "atAuthoredBoundary" in checkpoint.trigger,
  );
  if (theoryObjective && mode !== "line") {
    issues.push(runtimeIssue("THEORY_OBJECTIVE_NEEDS_LINE_MODE", "/mode", "follow_theory requires mode line"));
  }
  if (theoryObjective && boundary === undefined) {
    issues.push(runtimeIssue("THEORY_NEEDS_AUTHORED_BOUNDARY", "/authoredBoundary", "follow_theory requires authoredBoundary"));
  }
  if (theoryObjective && boundary?.plyHorizon === undefined) {
    issues.push(runtimeIssue("BOUNDARY_NEEDS_PLY_HORIZON", "/authoredBoundary/plyHorizon", "follow_theory requires a finite plyHorizon cap"));
  }
  if (theoryObjective && boundary !== undefined && boundary.spineNodeIds === undefined && boundary.fenPredicates === undefined) {
    issues.push(runtimeIssue("BOUNDARY_GRANTS_NOTHING", "/authoredBoundary", "follow_theory boundary must grant spine nodes or FEN predicates"));
  }
  if (theoryObjective && boundaryCheckpoints.length !== 1) {
    issues.push(runtimeIssue("THEORY_NEEDS_BOUNDARY_CHECKPOINT", "/checkpoints", "follow_theory requires exactly one atAuthoredBoundary checkpoint"));
  }
  if (boundary === undefined && boundaryCheckpoints.length > 0) {
    issues.push(runtimeIssue("CHECKPOINT_BOUNDARY_WITHOUT_BOUNDARY", "/checkpoints", "atAuthoredBoundary requires authoredBoundary"));
  }
  if (theoryObjective) {
    for (const [index, deviation] of (pack.deviations ?? []).entries()) {
      if ("fen" in deviation.at) {
        issues.push(runtimeIssue("THEORY_DEVIATION_NEEDS_SPINE_ANCHOR", `/deviations/${index}/at`, "follow_theory deviations require a spineNodeId anchor"));
      }
    }
  }
  if (outcomeObjective && grading === undefined) {
    issues.push(
      runtimeIssue(
        "OBJECTIVE_GRADING_REQUIRED",
        "/objective/grading",
        `${pack.objective.type} objectives require grading`,
      ),
    );
  }
  if (!outcomeObjective && grading !== undefined) {
    issues.push(
      runtimeIssue(
        "OBJECTIVE_GRADING_UNSUPPORTED",
        "/objective/grading",
        `grading is unsupported for ${pack.objective.type} objectives`,
      ),
    );
  }
  if (grading?.resolveAt.kind === "checkpoint" && !checkpoints.has(grading.resolveAt.checkpointId)) {
    issues.push(
      runtimeIssue(
        "OBJECTIVE_RESOLUTION_UNKNOWN",
        "/objective/grading/resolveAt/checkpointId",
        `unknown resolution checkpoint ${grading.resolveAt.checkpointId}`,
      ),
    );
  }
  if (pack.objective.type === "resist" && grading?.resolveAt.kind === "terminal") {
    issues.push(
      runtimeIssue(
        "OBJECTIVE_RESIST_NEEDS_CHECKPOINT",
        "/objective/grading/resolveAt",
        "resist requires a checkpoint resolution so survival is measurable",
      ),
    );
  }

  if (PLAN_OBJECTIVES.has(pack.objective.type) && objectiveRules(pack).length === 0) {
    issues.push(runtimeIssue("OBJECTIVE_GRADES_NOTHING", "/objective", `${pack.objective.type} declares a plan objective but compiles to no transition rules`));
  }
  for (const [index, leg] of (pack.legs ?? []).entries()) {
    if (PLAN_OBJECTIVES.has(leg.objective.type) && objectiveRules(pack, leg.objective).length === 0) issues.push(runtimeIssue("OBJECTIVE_GRADES_NOTHING", `/legs/${index}/objective`, `${leg.objective.type} declares a plan objective but compiles to no transition rules`));
  }

  if (Array.isArray(conditions)) {
    for (const [index, value] of conditions.entries()) {
      const condition = value;
      if (condition.kind === "reach_checkpoint" && !checkpoints.has(condition.checkpointId)) {
        issues.push(
          runtimeIssue(
            "UNSUPPORTED_OBJECTIVE_CONDITION",
            `/objective/successConditions/${index}`,
            `unknown checkpoint ${condition.checkpointId}`,
          ),
        );
      }
      const to = condition.to ?? "achieved";
      if (theoryObjective && ["achieved", "failed", "transitioned"].includes(to)) {
        issues.push(runtimeIssue("THEORY_ABSORBING_UNSUPPORTED", `/objective/successConditions/${index}/to`, "follow_theory cannot enter an absorbing objective state"));
      }
      if (condition.from?.includes(to as "active" | "preserved" | "degraded")) {
        issues.push(
          runtimeIssue(
            "OBJECTIVE_SELF_TRANSITION",
            `/objective/successConditions/${index}/from`,
            `from may not contain target state ${to}`,
          ),
        );
      }
      if (
        outcomeObjective &&
        ["achieved", "failed", "transitioned"].includes(to) &&
        condition.kind !== "outcome"
      ) {
        issues.push(
          runtimeIssue(
            "OBJECTIVE_ABSORBING_WITHOUT_OUTCOME",
            `/objective/successConditions/${index}/to`,
            "outcome objectives may enter an absorbing state only from an outcome condition",
          ),
        );
      }
      if (
        outcomeObjective &&
        condition.kind === "outcome" &&
        !["achieved", "failed"].includes(to)
      ) {
        issues.push(
          runtimeIssue(
            "OBJECTIVE_OUTCOME_TARGET_INVALID",
            `/objective/successConditions/${index}/to`,
            "outcome conditions may target only achieved or failed",
          ),
        );
      }
      if (
        (outcomeObjective || theoryObjective) &&
        to === "preserved" &&
        condition.from?.includes("degraded")
      ) {
        issues.push(
          runtimeIssue(
            "OBJECTIVE_DEGRADED_IS_ONE_WAY",
            `/objective/successConditions/${index}/from`,
            "degraded outcome objectives may not return to preserved",
          ),
        );
      }
    }
  }

  if (
    theoryObjective &&
    boundary?.plyHorizon !== undefined &&
    boundary.fenPredicates === undefined &&
    boundary.spineNodeIds !== undefined
  ) {
    const depths = new Map<string, number>();
    const walk = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[], depth: number): void => {
      for (const node of nodes) {
        depths.set(node.id, depth);
        walk(node.children, depth + 1);
      }
    };
    walk(pack.spine ?? [], 1);
    if (boundary.spineNodeIds.every((id) => (depths.get(id) ?? Number.POSITIVE_INFINITY) > boundary.plyHorizon!)) {
      issues.push(runtimeIssue("BOUNDARY_HORIZON_EXCLUDES_EVERY_GRANT", "/authoredBoundary/plyHorizon", "plyHorizon excludes every declared boundary node"));
    }
  }

  if (grading?.assessedBy.kind === "syzygy") {
    const count = countFenPieces(pack.start.fen);
    if (count > 7 || grading.assessedBy.pieceCount !== count) {
      issues.push(
        runtimeIssue(
          "SYZYGY_ASSESSMENT_OUT_OF_RANGE",
          "/objective/grading/assessedBy/pieceCount",
          `Syzygy assessment declares ${grading.assessedBy.pieceCount} pieces; FEN has ${count}`,
        ),
      );
    }
    const sideToMove = pack.start.fen.split(" ")[1] === "b" ? "black" : "white";
    const learner = pack.start.side;
    const opposite = (value: "win" | "loss" | "draw") =>
      value === "win" ? "loss" : value === "loss" ? "win" : "draw";
    const category = learner === sideToMove
      ? grading.assessedBy.category
      : opposite(grading.assessedBy.category);
    const expected = pack.objective.type === "win"
      ? "win"
      : pack.objective.type === "hold"
        ? "draw"
        : "loss";
    if (category !== expected) {
      issues.push(
        runtimeIssue(
          "SYZYGY_ASSESSMENT_MISMATCH",
          "/objective/grading/assessedBy/category",
          `${pack.objective.type} expects ${expected} from the learner perspective; received ${category}`,
        ),
      );
    }
  }

  try {
    const side = pack.start.side;
    const root = createRun({
      id: "pack-validation",
      session: {
        kind: "pack",
        packId: pack.id,
        packDigest: `sha256:${"0".repeat(64)}`,
        start: { fen: pack.start.fen, side },
        feedbackPolicy: "delayed_checkpoint",
        opponentPolicy: { mode: "human_common" },
      },
      sessionDigest: `sha256:${"0".repeat(64)}`,
      policyConfig: {
        seedMode: "fixed",
        locus: { executedAt: "server", engineIds: [], modelIds: [] },
      },
      seed: 0,
      createdAt: "2000-01-01T00:00:00.000Z",
    });
    for (const [index, checkpoint] of pack.checkpoints.entries()) {
      const trigger = checkpoint.trigger;
      if ("atPly" in trigger && trigger.atPly === 0) {
        issues.push(
          runtimeIssue(
            "CHECKPOINT_UNREACHABLE_AT_ROOT",
            `/checkpoints/${index}/trigger/atPly`,
            "atPly 0 can never be evaluated because checkpoints run after a commit",
          ),
        );
      } else if (checkpointMatches(pack, root, checkpoint)) {
        issues.push(
          runtimeIssue(
            "CHECKPOINT_TRUE_AT_ROOT",
            `/checkpoints/${index}/trigger`,
            "checkpoint condition is already true at the start position",
          ),
        );
      }
    }
  } catch (error) {
    issues.push(
      runtimeIssue(
        "START_POSITION_UNRUNNABLE",
        "/start/fen",
        error instanceof Error ? error.message : String(error),
      ),
    );
  }
  return Object.freeze(issues);
}

export function validatePackDocument(value: unknown, options: { readonly shapes?: PackShapeLookup } = {}): PackValidationResult {
  const validate = validator();
  if (!validate(value)) {
    return Object.freeze({
      valid: false,
      issues: Object.freeze((validate.errors ?? []).map(schemaIssue)),
    });
  }

  const document = structuredClone(value) as DrillPackDefinition;
  const issues: PackValidationIssue[] = [
    ...lintDrillPack(document).map((issue) =>
      Object.freeze({
        severity: issue.severity,
        source: "lint" as const,
        code: issue.code,
        path: issue.path,
        message: issue.message,
      }),
    ),
    ...runtimeIssues(document, options.shapes),
  ];
  return Object.freeze({
    valid: !issues.some((issue) => issue.severity === "error"),
    issues: Object.freeze(issues),
    document,
  });
}
