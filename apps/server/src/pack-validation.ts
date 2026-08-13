import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { lintDrillPack } from "@chess-tabiya/schema/drill-pack";
import { createRun } from "@chess-tabiya/runtime";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES,
  DECLARED_UNIMPLEMENTED_POLICY_MODES,
  SUPPORTED_POLICY_MODES,
} from "./capabilities.js";
import { checkpointMatches } from "./pack-orchestrator.js";
import { countFenPieces } from "./sourcing/chess-facts.js";

const SUPPORTED_CHECKPOINT_ACTIONS = Object.freeze(["compare_branches"] as const);

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

function runtimeIssues(pack: DrillPackDefinition): readonly PackValidationIssue[] {
  const issues: PackValidationIssue[] = [];
  const raw = pack as unknown as Record<string, unknown>;
  const mode = raw.mode;

  const provenance = raw.provenance as Record<string, unknown>;
  const reviewStatus = provenance.reviewStatus;
  if (reviewStatus === "reviewed" || reviewStatus === "published") {
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
    const reviewers = provenance.reviewers;
    if (!Array.isArray(reviewers) || reviewers.length === 0) {
      issues.push(
        runtimeIssue(
          "GRADUATION_REQUIRES_REVIEWERS",
          "/provenance/reviewers",
          `${reviewStatus} packs require at least one reviewer; see planning/content-era/plan.md §3b`,
        ),
      );
    }
  }

  const feedbackPolicy = raw.feedbackPolicy;
  if (feedbackPolicy === "immediate_blunder_guard") {
    const reason = DECLARED_UNIMPLEMENTED_FEEDBACK_POLICIES.find(
      (entry) => entry.mode === feedbackPolicy,
    )?.reason;
    issues.push(
      runtimeIssue(
        "UNSUPPORTED_FEEDBACK_POLICY",
        "/feedbackPolicy",
        reason ?? "immediate_blunder_guard is not supported in v1",
      ),
    );
  } else if (
    feedbackPolicy !== "delayed_checkpoint" &&
    feedbackPolicy !== "segment_end"
  ) {
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
  for (const [checkpointIndex, checkpoint] of pack.checkpoints.entries()) {
    const actions = checkpoint.actions;
    if (!Array.isArray(actions)) continue;
    for (const [actionIndex, action] of actions.entries()) {
      if (
        typeof action === "string" &&
        !SUPPORTED_CHECKPOINT_ACTIONS.some((supported) => supported === action)
      ) {
        issues.push(
          runtimeIssue(
            "UNSUPPORTED_CHECKPOINT_ACTION",
            `/checkpoints/${checkpointIndex}/actions/${actionIndex}`,
            `checkpoint action ${JSON.stringify(action)} is unsupported; allowed actions: ${SUPPORTED_CHECKPOINT_ACTIONS.join(", ")}`,
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
    const side = pack.start.side === "black" ? "black" : "white";
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

export function validatePackDocument(value: unknown): PackValidationResult {
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
    ...runtimeIssues(document),
  ];
  return Object.freeze({
    valid: !issues.some((issue) => issue.severity === "error"),
    issues: Object.freeze(issues),
    document,
  });
}
