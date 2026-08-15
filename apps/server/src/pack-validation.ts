import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  CHECKPOINT_ACTIONS,
  FEEDBACK_POLICIES,
  lintDrillPack,
  type DrillPackDefinition,
  type StructuralExpression,
  type StructuralFeature,
} from "@chess-tabiya/schema/drill-pack";
import { createRun, matchesStructuralExpression, transposeKey } from "@chess-tabiya/runtime";
import { between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseSquare } from "chessops/util";
import { parseUci } from "chessops/util";
import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import {
  DECLARED_UNIMPLEMENTED_POLICY_MODES,
  SUPPORTED_POLICY_MODES,
} from "./capabilities.js";
import {
  checkpointMatches,
  objectiveRules,
  PackCompileError,
} from "./pack-orchestrator.js";
import { countFenPieces } from "./sourcing/chess-facts.js";
import {
  ASSESSMENT_CATEGORIES,
  invertTablebaseCategory,
  OBJECTIVE_ASSESSMENT_SETS,
  type TablebaseCategory,
} from "./tablebase.js";

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

export interface PackSiblingLookup {
  get(id: string): {
    readonly start: { readonly fen: string; readonly side: "white" | "black" };
    readonly objective: { readonly type: string };
  } | undefined;
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

export function assessmentAdmissionCode(
  objective: string,
  category: string,
): string | undefined {
  if (!(ASSESSMENT_CATEGORIES as readonly string[]).includes(category)) {
    return "ASSESSMENT_CATEGORY_INDETERMINATE";
  }
  if (objective === "win" && category === "cursed-win") {
    return "CURSED_WIN_CANNOT_ROOT_WIN";
  }
  const admitted = OBJECTIVE_ASSESSMENT_SETS[
    objective as keyof typeof OBJECTIVE_ASSESSMENT_SETS
  ] as readonly TablebaseCategory[] | undefined;
  if (admitted !== undefined && !admitted.includes(category as TablebaseCategory)) {
    return ["win", "loss", "draw"].includes(category)
      ? "SYZYGY_ASSESSMENT_MISMATCH"
      : "ASSESSMENT_CATEGORY_MISMATCH";
  }
  return undefined;
}

const PLAN_OBJECTIVES = new Set([
  "reach_structure", "preserve_plan_window", "execute_break",
  "prevent_opponent_plan", "transition_to_endgame",
]);
const KEY_POINT_JUDGEMENTS = new Set(["weak", "strong", "good", "bad", "better", "worse", "advantage", "winning", "losing", "should", "must", "best", "worst", "mistake", "blunder", "punish", "wins", "loses"]);

function reasoningCheckpointFen(pack: DrillPackDefinition, checkpoint: DrillPackDefinition["checkpoints"][number]): string | undefined {
  const trigger = checkpoint.trigger;
  if ("windowOpens" in trigger || (!("atSpineNode" in trigger) && !("atPly" in trigger))) return undefined;
  const root = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  const found: string[] = [];
  const visit = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[], position: Chess, ply: number): void => {
    for (const node of nodes) {
      const next = position.clone();
      const move = parseUci(node.moveUci);
      if (move === undefined || !next.isLegal(move)) continue;
      next.play(move);
      const nextPly = ply + 1;
      if (("atSpineNode" in trigger && trigger.atSpineNode === node.id) || ("atPly" in trigger && trigger.atPly === nextPly)) found.push(makeFen(next.toSetup()));
      visit(node.children, next, nextPly);
    }
  };
  visit(pack.spine ?? [], root, 0);
  return found.length === 1 ? found[0] : undefined;
}

export function structuralIssues(value: unknown, path = "", depth = 0): readonly PackValidationIssue[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [];
  const issues: PackValidationIssue[] = [];
  const leaf = (feature: StructuralFeature, featurePath: string, underMirror: boolean): void => {
    if (feature.kind === "line_blockers") {
      const from = parseSquare(feature.from), to = parseSquare(feature.to);
      if (from === undefined || to === undefined || between(from, to).isEmpty()) issues.push(runtimeIssue("LINE_SPAN_EMPTY", featurePath || "/", "line blocker endpoints must be distinct, aligned, and non-adjacent"));
      if (feature.count < 0) issues.push(runtimeIssue("NEGATIVE_FEATURE_COUNT", `${featurePath}/count`, "feature counts cannot be negative"));
      return;
    }
    if (feature.kind === "outpost") {
      const square = parseSquare(feature.square);
      if (square !== undefined) { const rank = Math.floor(square / 8); const relative = feature.color === "white" ? rank + 1 : 8 - rank; if (relative < 4 || relative > 6) issues.push(runtimeIssue("OUTPOST_RANK_OUT_OF_RANGE", `${featurePath}/square`, "Tabiya's strict outpost detector applies only to relative ranks four through six")); }
      return;
    }
    if (feature.kind === "direct_attack_count" || feature.kind === "piece_reach_count") {
      if (feature.count < 0) issues.push(runtimeIssue("NEGATIVE_FEATURE_COUNT", `${featurePath}/count`, "feature counts cannot be negative"));
      return;
    }
    if (feature.kind === "pawn_count") {
      const valid = feature.basis === "count" ? feature.count >= 0 && feature.count <= 8 : feature.count >= -8 && feature.count <= 8;
      if (!valid) issues.push(runtimeIssue("PAWN_COUNT_OUT_OF_RANGE", `${featurePath}/count`, "pawn count must be attainable for its basis"));
      return;
    }
    if (feature.kind === "named_structure") {
      if (underMirror) issues.push(runtimeIssue("MIRRORED_NAMED_STRUCTURE", featurePath, "named structures cannot appear under mirrored"));
      return;
    }
    if (feature.kind === "pawn_safe_square" || feature.kind === "backward_pawn" || feature.kind === "isolated_pawn" || feature.kind === "doubled_pawn" || feature.kind === "passed_pawn" || feature.kind === "open_file" || feature.kind === "half_open_file" || feature.kind === "bishop_on_shade" || feature.kind === "king_opposition") return;
    const exhaustive: never = feature;
    issues.push(runtimeIssue("STRUCTURAL_KIND_UNRECOGNISED", featurePath || "/", `unhandled structural feature ${JSON.stringify(exhaustive)}`));
  };
  const visit = (expression: StructuralExpression, expressionPath: string, expressionDepth: number, underMirror = false): void => {
    if (expression.kind === "all" || expression.kind === "any") {
      if (expressionDepth >= 4) issues.push(runtimeIssue("STRUCTURAL_EXPRESSION_TOO_DEEP", expressionPath || "/", "structural expressions may be nested at most four levels"));
      expression.of.forEach((child, index) => visit(child, `${expressionPath}/of/${index}`, expressionDepth + 1, underMirror));
      return;
    }
    if (expression.kind === "not" || expression.kind === "mirrored") {
      if (expressionDepth >= 4) issues.push(runtimeIssue("STRUCTURAL_EXPRESSION_TOO_DEEP", expressionPath || "/", "structural expressions may be nested at most four levels"));
      visit(expression.of, `${expressionPath}/of`, expressionDepth + 1, underMirror || expression.kind === "mirrored");
      return;
    }
    if (expression.kind === "feature") { leaf(expression.feature, `${expressionPath}/feature`, underMirror); return; }
    if (expression.kind === "pieceOnSquare") return;
    if (expression.kind === "quantified") {
      if (expressionDepth >= 4) issues.push(runtimeIssue("STRUCTURAL_EXPRESSION_TOO_DEEP", expressionPath || "/", "structural expressions may be nested at most four levels"));
      if ("files" in expression.over) {
        if (expression.over.files.from > expression.over.files.to) issues.push(runtimeIssue("QUANTIFIED_DOMAIN_EMPTY", `${expressionPath}/over/files`, "quantified file ranges must be ordered and non-empty"));
      } else {
        const region = expression.over.squares;
        if (region.files.from > region.files.to || region.ranks.from > region.ranks.to) issues.push(runtimeIssue("QUANTIFIED_DOMAIN_EMPTY", `${expressionPath}/over/squares`, "quantified square regions must be ordered and non-empty"));
        if (expression.feature.kind === "outpost") {
          const color = expression.feature.color;
          const ranks = Array.from({ length: Math.max(0, region.ranks.to - region.ranks.from + 1) }, (_, index) => region.ranks.from + index);
          const possible = ranks.some((rank) => { const relative = color === "white" ? rank : 9 - rank; return relative >= 4 && relative <= 6; });
          if (!possible) issues.push(runtimeIssue("OUTPOST_RANK_OUT_OF_RANGE", `${expressionPath}/over/squares/ranks`, "quantified outpost regions must overlap relative ranks four through six"));
        }
      }
      if (expression.feature.kind === "direct_attack_count" && expression.feature.count < 0) issues.push(runtimeIssue("NEGATIVE_FEATURE_COUNT", `${expressionPath}/feature/count`, "feature counts cannot be negative"));
      return;
    }
    const exhaustive: never = expression;
    issues.push(runtimeIssue("STRUCTURAL_KIND_UNRECOGNISED", expressionPath || "/", `unhandled structural expression ${JSON.stringify(exhaustive)}`));
  };
  const object = value as Record<string, unknown>;
  if (object.kind === "feature" || object.kind === "pieceOnSquare" || object.kind === "all" || object.kind === "any" || object.kind === "not" || object.kind === "mirrored" || object.kind === "quantified") {
    visit(value as StructuralExpression, path, depth);
  } else {
    leaf(value as StructuralFeature, path, false);
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

type ObjectiveDefinition = DrillPackDefinition["objective"];
type ObjectiveCompiler = (
  pack: DrillPackDefinition,
  objective?: ObjectiveDefinition,
  pointerPrefix?: string,
) => readonly unknown[];

export function objectiveIssues(
  pack: DrillPackDefinition,
  objective: ObjectiveDefinition,
  pointerPrefix: string,
  checkpoints: ReadonlySet<string>,
  compile: ObjectiveCompiler = objectiveRules,
): readonly PackValidationIssue[] {
  const issues: PackValidationIssue[] = [];
  const conditions = objective.successConditions;
  const outcomeObjective = ["win", "hold", "save", "resist"].includes(
    objective.type,
  );
  const theoryObjective = objective.type === "follow_theory";
  const trajectoryObjective = objective.type === "run_trajectory";
  const grading = objective.grading;
  const effectiveObjectiveType = trajectoryObjective
    ? pack.legs?.at(-1)?.objective.type
    : objective.type;

  if (outcomeObjective && grading === undefined) {
    issues.push(runtimeIssue("OBJECTIVE_GRADING_REQUIRED", `${pointerPrefix}/grading`, `${objective.type} objectives require grading`));
  }
  if (!outcomeObjective && !trajectoryObjective && grading !== undefined) {
    issues.push(runtimeIssue("OBJECTIVE_GRADING_UNSUPPORTED", `${pointerPrefix}/grading`, `grading is unsupported for ${objective.type} objectives`));
  }
  if (trajectoryObjective && grading?.resolveAt.kind === "checkpoint") {
    issues.push(runtimeIssue("TRAJECTORY_GRADING_RESOLUTION_UNSUPPORTED", `${pointerPrefix}/grading/resolveAt`, "run_trajectory root grading may resolve only at terminal"));
  }
  if (grading?.resolveAt.kind === "checkpoint" && !checkpoints.has(grading.resolveAt.checkpointId)) {
    issues.push(runtimeIssue("OBJECTIVE_RESOLUTION_UNKNOWN", `${pointerPrefix}/grading/resolveAt/checkpointId`, `unknown resolution checkpoint ${grading.resolveAt.checkpointId}`));
  }
  if (objective.type === "resist" && grading?.resolveAt.kind === "terminal") {
    issues.push(runtimeIssue("OBJECTIVE_RESIST_NEEDS_CHECKPOINT", `${pointerPrefix}/grading/resolveAt`, "resist requires a checkpoint resolution so survival is measurable"));
  }

  try {
    const rules = compile(pack, objective, pointerPrefix);
    if (PLAN_OBJECTIVES.has(objective.type) && rules.length === 0) {
      issues.push(runtimeIssue("OBJECTIVE_GRADES_NOTHING", pointerPrefix, `${objective.type} declares a plan objective but compiles to no transition rules`));
    }
  } catch (error) {
    if (error instanceof PackCompileError) {
      issues.push(runtimeIssue(error.code, error.pointer, error.message));
    } else {
      issues.push(runtimeIssue("OBJECTIVE_RULES_UNCOMPILABLE", pointerPrefix, error instanceof Error ? error.message : String(error)));
    }
  }

  if (Array.isArray(conditions)) {
    for (const [index, condition] of conditions.entries()) {
      const conditionPointer = `${pointerPrefix}/successConditions/${index}`;
      if (condition.kind === "reach_checkpoint" && !checkpoints.has(condition.checkpointId)) {
        issues.push(runtimeIssue("UNSUPPORTED_OBJECTIVE_CONDITION", conditionPointer, `unknown checkpoint ${condition.checkpointId}`));
      }
      const to = condition.to ?? "achieved";
      if (theoryObjective && ["achieved", "failed", "transitioned"].includes(to)) {
        issues.push(runtimeIssue("THEORY_ABSORBING_UNSUPPORTED", `${conditionPointer}/to`, "follow_theory cannot enter an absorbing objective state"));
      }
      if (condition.from?.includes(to as "active" | "preserved" | "degraded")) {
        issues.push(runtimeIssue("OBJECTIVE_SELF_TRANSITION", `${conditionPointer}/from`, `from may not contain target state ${to}`));
      }
      if (outcomeObjective && ["achieved", "failed", "transitioned"].includes(to) && condition.kind !== "outcome" && !(condition.kind === "rules_fact" && condition.fact === "draw")) {
        issues.push(runtimeIssue("OBJECTIVE_ABSORBING_WITHOUT_OUTCOME", `${conditionPointer}/to`, "outcome objectives may enter an absorbing state only from an outcome condition"));
      }
      if (outcomeObjective && condition.kind === "outcome" && !["achieved", "failed"].includes(to)) {
        issues.push(runtimeIssue("OBJECTIVE_OUTCOME_TARGET_INVALID", `${conditionPointer}/to`, "outcome conditions may target only achieved or failed"));
      }
      if ((outcomeObjective || theoryObjective) && to === "preserved" && condition.from?.includes("degraded")) {
        issues.push(runtimeIssue("OBJECTIVE_DEGRADED_IS_ONE_WAY", `${conditionPointer}/from`, "degraded outcome objectives may not return to preserved"));
      }
      if (condition.kind === "material_balance" && condition.comparison === "equal" && !Number.isInteger(condition.value)) {
        issues.push(runtimeIssue("MATERIAL_EQUALITY_UNSATISFIABLE", `${conditionPointer}/value`, `material balance is an integer difference of piece values, so an equal comparison against ${condition.value} can never be true`));
      }
      if (condition.kind === "rules_fact" && condition.winner !== undefined && condition.fact !== "checkmate") {
        issues.push(runtimeIssue("RULES_FACT_WINNER_UNSUPPORTED", `${conditionPointer}/winner`, `winner is only meaningful for fact checkmate; ${condition.fact} has no winner`));
      }
    }
  }

  const isLeg = pointerPrefix.startsWith("/legs/");
  if (!isLeg && grading?.assessedBy.kind === "syzygy") {
    const count = countFenPieces(pack.start.fen);
    if (count > 7 || grading.assessedBy.pieceCount !== count) {
      issues.push(runtimeIssue("SYZYGY_ASSESSMENT_OUT_OF_RANGE", `${pointerPrefix}/grading/assessedBy/pieceCount`, `Syzygy assessment declares ${grading.assessedBy.pieceCount} pieces; FEN has ${count}`));
    }
    const sideToMove = pack.start.fen.split(" ")[1] === "b" ? "black" : "white";
    const category = pack.start.side === sideToMove
      ? grading.assessedBy.category
      : invertTablebaseCategory(grading.assessedBy.category);
    if (trajectoryObjective && !["win", "hold", "save", "resist"].includes(effectiveObjectiveType ?? "")) {
      issues.push(runtimeIssue("TRAJECTORY_ASSESSMENT_NEEDS_OUTCOME_LEG", `${pointerPrefix}/grading/assessedBy/category`, "run_trajectory root assessment requires a final outcome leg"));
    } else {
      const admissionCode = assessmentAdmissionCode(effectiveObjectiveType ?? objective.type, category);
      if (admissionCode === "ASSESSMENT_CATEGORY_INDETERMINATE") {
        issues.push(runtimeIssue(admissionCode, `${pointerPrefix}/grading/assessedBy/category`, `${category} is not a determinate root assessment`));
      } else if (admissionCode === "CURSED_WIN_CANNOT_ROOT_WIN") {
        issues.push(runtimeIssue(admissionCode, `${pointerPrefix}/grading/assessedBy/category`, "the fifty-move rule makes a cursed-win conversion unreachable for a win objective"));
      } else if (admissionCode !== undefined) {
        issues.push(runtimeIssue(admissionCode, `${pointerPrefix}/grading/assessedBy/category`, `${effectiveObjectiveType} does not admit learner-perspective category ${category}`));
      }
    }
    if (category === "cursed-win" || category === "blessed-loss") {
      const halfmoves = Number.parseInt(pack.start.fen.split(" ")[4] ?? "0", 10);
      const needed = Math.max(0, 100 - halfmoves);
      const target = (pack as unknown as { readonly difficulty?: { readonly branchLengthTarget?: number } }).difficulty?.branchLengthTarget;
      if (target === undefined || target < needed) {
        issues.push(runtimeIssue("RULE_DRAW_ROOT_NEEDS_SEGMENT_BUDGET", "/difficulty/branchLengthTarget", `rule-drawn root needs at least ${needed} plies to reach halfmove 100`));
      }
    }
  }
  return Object.freeze(issues);
}

function runtimeIssues(
  pack: DrillPackDefinition,
  shapes?: PackShapeLookup,
  packs?: PackSiblingLookup,
  compile: ObjectiveCompiler = objectiveRules,
): readonly PackValidationIssue[] {
  const issues: PackValidationIssue[] = [];
  issues.push(...structuralIssuesInPack(pack));
  const raw = pack as unknown as Record<string, unknown>;
  const difficulty = (raw.difficulty ?? {}) as { readonly branchLengthTarget?: number };
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
  const spineIds = new Set<string>();
  const collectSpine = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[]): void => { for (const node of nodes) { spineIds.add(node.id); collectSpine(node.children); } };
  collectSpine(pack.spine ?? []);
  if (pack.variantOf !== undefined) {
    const path = "/variantOf";
    if (pack.variantOf.packId === pack.id) {
      issues.push(runtimeIssue("VARIANT_SELF_REFERENCE", `${path}/packId`, "a pack cannot be a variant of itself"));
    } else if (packs !== undefined) {
      const sibling = packs.get(pack.variantOf.packId);
      if (sibling === undefined) {
        issues.push(runtimeIssue("VARIANT_PACK_UNKNOWN", `${path}/packId`, `unknown sibling pack ${pack.variantOf.packId}`));
      } else {
        const relation = pack.variantOf.relation;
        let proven = false;
        if (relation.kind === "root_after_move") {
          const position = Chess.fromSetup(parseFen(sibling.start.fen).unwrap()).unwrap();
          const move = parseUci(relation.moveUci);
          if (move !== undefined && position.isLegal(move)) {
            position.play(move);
            proven = transposeKey(makeFen(position.toSetup())) === transposeKey(pack.start.fen);
          }
        } else if (relation.kind === "same_root_other_side") {
          proven = transposeKey(sibling.start.fen) === transposeKey(pack.start.fen) && sibling.start.side !== pack.start.side;
        } else {
          proven = transposeKey(sibling.start.fen) === transposeKey(pack.start.fen) && sibling.start.side === pack.start.side && sibling.objective.type !== pack.objective.type;
        }
        if (!proven) issues.push(runtimeIssue("VARIANT_RELATION_UNPROVEN", `${path}/relation`, `relation ${relation.kind} is not proven by the two pack roots`));
      }
    }
  }
  const claimIds = new Set((pack.feedbackClaims ?? []).map((claim) => claim.id));
  for (const [checkpointIndex, checkpoint] of pack.checkpoints.entries()) {
    if (checkpoint.interaction?.type !== "stated_reasoning") continue;
    if (pack.feedbackPolicy === "segment_end") {
      const trigger = checkpoint.trigger;
      const proven = !(
        "windowOpens" in trigger || (!("atPly" in trigger) && !("atSpineNode" in trigger))
      ) && pack.checkpoints.some((earlier) => {
        if (earlier === checkpoint || "windowOpens" in earlier.trigger) return false;
        if ("atPly" in trigger && "atPly" in earlier.trigger) return earlier.trigger.atPly < trigger.atPly;
        if ("atSpineNode" in trigger && "atSpineNode" in earlier.trigger) {
          const target = trigger.atSpineNode;
          const ancestor = earlier.trigger.atSpineNode;
          const contains = (nodes: readonly import("@chess-tabiya/schema/drill-pack").SpineNode[], seen = false): boolean => nodes.some((node) => node.id === target ? seen : contains(node.children, seen || node.id === ancestor));
          return contains(pack.spine ?? []);
        }
        return false;
      });
      if (!proven) issues.push(runtimeIssue("REASONING_SEGMENT_END_UNPROVEN", `/checkpoints/${checkpointIndex}/interaction`, "segment_end reasoning must be statically proven to end a segment"));
    }
    const ids = new Set<string>();
    const phrases = new Map<string, string>();
    const checkpointFen = reasoningCheckpointFen(pack, checkpoint);
    for (const [pointIndex, point] of checkpoint.interaction.keyPoints.entries()) {
      const pointPath = `/checkpoints/${checkpointIndex}/interaction/keyPoints/${pointIndex}`;
      if (ids.has(point.id)) issues.push(runtimeIssue("KEY_POINT_GROUND_UNRESOLVED", `${pointPath}/id`, `duplicate key point id ${point.id}`));
      ids.add(point.id);
      for (const [phraseIndex, phrase] of point.phrases.entries()) {
        const normalized = phrase.normalize("NFKC").toLocaleLowerCase("en-US").replaceAll(/\s+/g, " ").trim();
        const previous = phrases.get(normalized);
        if (previous !== undefined && previous !== point.id) issues.push(runtimeIssue("KEY_POINT_PHRASES_COLLIDE", `${pointPath}/phrases/${phraseIndex}`, `phrase collides with key point ${previous}`));
        else phrases.set(normalized, point.id);
        const words = normalized.match(/[a-z]+/g) ?? [];
        if (words.length > 0 && words.every((word) => KEY_POINT_JUDGEMENTS.has(word))) issues.push(Object.freeze({ severity: "warning" as const, source: "runtime" as const, code: "KEY_POINT_PHRASE_IS_JUDGEMENT", path: `${pointPath}/phrases/${phraseIndex}`, message: "phrase contains only judgement vocabulary" }));
      }
      const ground = point.ground;
      if (ground.kind === "shape_plan") {
        const entry = shapes?.get(ground.shape);
        if (!new Set(pack.shapes ?? []).has(ground.shape) || entry === undefined || !entry.document.plans.some((plan) => plan.id === ground.plan)) issues.push(runtimeIssue("KEY_POINT_GROUND_UNRESOLVED", `${pointPath}/ground`, `shape plan ${ground.shape}/${ground.plan} is not resolvable`));
      } else if (ground.kind === "spine_move" && !spineIds.has(ground.spineNodeId)) issues.push(runtimeIssue("KEY_POINT_GROUND_UNRESOLVED", `${pointPath}/ground/spineNodeId`, `unknown spine node ${ground.spineNodeId}`));
      else if (ground.kind === "claim" && !claimIds.has(ground.claimId)) issues.push(runtimeIssue("KEY_POINT_GROUND_UNRESOLVED", `${pointPath}/ground/claimId`, `unknown feedback claim ${ground.claimId}`));
      else if (ground.kind === "structural" && checkpointFen !== undefined && !matchesStructuralExpression(checkpointFen, ground.expression)) issues.push(runtimeIssue("KEY_POINT_GROUND_FALSE_AT_CHECKPOINT", `${pointPath}/ground/expression`, "structural ground is false at the statically resolved checkpoint position"));
    }
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
  if (raw.guard !== undefined && feedbackPolicy !== "immediate_guard") {
    issues.push(
      runtimeIssue(
        "GUARD_WITHOUT_IMMEDIATE_GUARD",
        "/guard",
        "guard tuning requires feedbackPolicy immediate_guard",
      ),
    );
  }
  if (pack.guard?.window !== undefined && pack.guard.window.fromPly > pack.guard.window.toPly) {
    issues.push(runtimeIssue("GUARD_WINDOW_EMPTY", "/guard/window", "guard window fromPly must not exceed toPly"));
  }
  const overrideKeys = new Set<string>();
  for (const [index, override] of (pack.guard?.overrides ?? []).entries()) {
    const key = "atStart" in override.at ? "start" : "fen" in override.at ? `fen:${transposeKey(override.at.fen)}` : `spine:${override.at.spineNodeId}`;
    if ("spineNodeId" in override.at && !spineIds.has(override.at.spineNodeId)) {
      issues.push(runtimeIssue("GUARD_OVERRIDE_ANCHOR_UNKNOWN", `/guard/overrides/${index}/at/spineNodeId`, `unknown spine node ${override.at.spineNodeId}`));
    }
    if (overrideKeys.has(key)) issues.push(runtimeIssue("GUARD_OVERRIDE_DUPLICATE", `/guard/overrides/${index}/at`, "guard overrides may not repeat an anchor"));
    overrideKeys.add(key);
  }
  if (pack.guard?.rulesTier === false && pack.guard.evalSwingCp === null && pack.guard.fireOnMate === false) {
    issues.push(runtimeIssue("GUARD_DISABLES_EVERYTHING", "/guard", "guard tuning disables rules, centipawn, and mate detection"));
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
  if (opponentMode === "perfect_tablebase" && countFenPieces(pack.start.fen) > 7) {
    issues.push(runtimeIssue("PERFECT_TABLEBASE_OUT_OF_RANGE", "/opponentPolicy/mode", "perfect_tablebase requires a root with at most seven pieces"));
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
        if (checkpoint !== undefined && !("windowOpens" in checkpoint.trigger) && "atStart" in checkpoint.trigger) issues.push(runtimeIssue("START_TRIGGER_NOT_FIRST_LEG", `/legs/${index}/entryCheckpointId`, "atStart cannot enter a later trajectory leg"));
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
    if (difficulty.branchLengthTarget !== undefined) {
      const sum = legs.reduce((total, leg) => total + (leg.branchLengthTarget ?? 0), 0);
      if (sum > difficulty.branchLengthTarget) issues.push(runtimeIssue("TRAJECTORY_LENGTHS_EXCEED_PACK", "/legs", `leg targets total ${sum} plies but the pack declares ${difficulty.branchLengthTarget}`));
    }
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

  const topLevelTheoryObjective = pack.objective.type === "follow_theory";
  const theoryObjective = topLevelTheoryObjective || (pack.legs ?? []).some(
    (leg) => leg.objective.type === "follow_theory",
  );
  const boundary = pack.authoredBoundary;
  const boundaryCheckpoints = pack.checkpoints.filter(
    (checkpoint) =>
      !("windowOpens" in checkpoint.trigger) &&
      "atAuthoredBoundary" in checkpoint.trigger,
  );
  if (topLevelTheoryObjective && mode !== "line") {
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

  issues.push(...objectiveIssues(pack, pack.objective, "/objective", checkpoints, compile));
  for (const [index, leg] of (pack.legs ?? []).entries()) {
    issues.push(...objectiveIssues(pack, leg.objective, `/legs/${index}/objective`, checkpoints, compile));
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
      if ("windowOpens" in trigger && ("atStart" in trigger.windowOpens || "atStart" in trigger.windowCloses)) {
        issues.push(runtimeIssue("START_TRIGGER_IN_WINDOW", `/checkpoints/${index}/trigger`, "atStart cannot open or close a timing window"));
        continue;
      }
      if ("atPly" in trigger && trigger.atPly === 0) {
        issues.push(
          runtimeIssue(
            "CHECKPOINT_UNREACHABLE_AT_ROOT",
            `/checkpoints/${index}/trigger/atPly`,
            "atPly 0 can never be evaluated after a commit; use atStart for the root position",
          ),
        );
      } else if (!("atStart" in trigger) && checkpointMatches(pack, root, checkpoint)) {
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

export function validatePackDocument(value: unknown, options: {
  readonly shapes?: PackShapeLookup;
  readonly packs?: PackSiblingLookup;
  readonly compileObjectiveRules?: ObjectiveCompiler;
} = {}): PackValidationResult {
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
    ...runtimeIssues(document, options.shapes, options.packs, options.compileObjectiveRules),
  ];
  return Object.freeze({
    valid: !issues.some((issue) => issue.severity === "error"),
    issues: Object.freeze(issues),
    document,
  });
}
