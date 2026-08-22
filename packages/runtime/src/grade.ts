import type { ComparisonScore } from "./compare.js";

export type MoveQualityClass = "inaccuracy" | "mistake" | "blunder";
export type MoveQualityArm = "eval_delta" | "mate_lost" | "mate_allowed";
export type GradeContext = "drill" | "review" | "imported_analysis";
export type GradeLane = "recorded" | "live";
export type GradeSide = "white" | "black";
export type MoveQualityAbstentionReason =
  | "input_abstained"
  | "missing_eval"
  | "unequal_instrument"
  | "mate_score_inconsistent";

export interface CitedGradeConstant {
  readonly value: number;
  readonly source: string;
  readonly pinnedAt: string;
}

const ADVICE_SOURCE = "https://github.com/lichess-org/scalachess/blob/master/core/src/main/scala/eval/Advice.scala";
const PRACTICE_SOURCE = "https://github.com/lichess-org/lila/blob/master/ui/analyse/src/practice/practiceCtrl.ts";
const WIN_CHANCES_SOURCE = "https://github.com/lichess-org/lila/blob/master/ui/lib/src/ceval/winningChances.ts";
const PINNED_AT = "2026-08-22";
const cited = (value: number, source: string): CitedGradeConstant => Object.freeze({ value, source, pinnedAt: PINNED_AT });

export const GRADE_CONVENTION = Object.freeze({
  id: "grade-convention" as const,
  version: 1 as const,
  constants: Object.freeze({
    reportInaccuracy: cited(5, ADVICE_SOURCE),
    reportMistake: cited(10, ADVICE_SOURCE),
    reportBlunder: cited(15, ADVICE_SOURCE),
    practiceInaccuracy: cited(2.5, PRACTICE_SOURCE),
    practiceMistake: cited(6, PRACTICE_SOURCE),
    practiceBlunder: cited(14, PRACTICE_SOURCE),
    mateLostInaccuracy: cited(999, ADVICE_SOURCE),
    mateLostMistake: cited(700, ADVICE_SOURCE),
    mateAllowedInaccuracy: cited(-999, ADVICE_SOURCE),
    mateAllowedMistake: cited(-700, ADVICE_SOURCE),
    centipawnClamp: cited(1000, WIN_CHANCES_SOURCE),
    logisticCoefficient: cited(0.00368208, WIN_CHANCES_SOURCE),
  }),
  contexts: Object.freeze({
    drill: "practice" as const,
    review: "report" as const,
    imported_analysis: "report" as const,
  }),
});

interface GradeEvaluationBase {
  readonly engineId: string;
  readonly score: ComparisonScore;
  readonly sideToMove: GradeSide;
  readonly depth?: number;
  readonly requestedMovetimeMs?: number;
}

export type GradeEvaluation = GradeEvaluationBase & (
  | { readonly lane: "recorded"; readonly perspective: "white" }
  | { readonly lane: "live"; readonly perspective: "side_to_move" }
);

export interface AbstainedGradeEvaluation {
  readonly abstained: true;
}

export interface GradeScore {
  readonly score: ComparisonScore;
  readonly winPercent: number;
}

export interface MoveQualityGrade {
  readonly klass: MoveQualityClass;
  readonly arm: MoveQualityArm;
  readonly before: GradeScore;
  readonly after: GradeScore;
  readonly dropWinPercent: number;
  readonly thresholdCrossed: number | "mate_lost_tier" | "mate_allowed_tier";
  readonly convention: { readonly id: "grade-convention"; readonly version: 1; readonly context: GradeContext };
  readonly engineId: string;
  readonly lane: GradeLane;
  readonly depth?: number;
  readonly requestedMovetimeMs?: number;
}

export interface MoveQualityAbstention {
  readonly abstained: true;
  readonly reason: MoveQualityAbstentionReason;
}

export type MoveQualityResult = MoveQualityGrade | MoveQualityAbstention | undefined;

const clampCp = (cp: number): number => Math.max(-GRADE_CONVENTION.constants.centipawnClamp.value, Math.min(GRADE_CONVENTION.constants.centipawnClamp.value, cp));

export function winPercentFromCp(cp: number): number {
  return 100 / (1 + Math.exp(-GRADE_CONVENTION.constants.logisticCoefficient.value * clampCp(cp)));
}

function normalizeScore(reading: GradeEvaluation, learnerSide: GradeSide): GradeScore {
  const factor = reading.perspective === "white"
    ? learnerSide === "white" ? 1 : -1
    : reading.sideToMove === learnerSide ? 1 : -1;
  const score: ComparisonScore = reading.score.kind === "cp"
    ? Object.freeze({ kind: "cp", value: reading.score.value * factor })
    : Object.freeze({ kind: "mate", movesTo: reading.score.movesTo * factor });
  const winPercent = score.kind === "cp" ? winPercentFromCp(score.value) : score.movesTo > 0 ? 100 : 0;
  return Object.freeze({ score, winPercent });
}

function abstention(reason: MoveQualityAbstentionReason): MoveQualityAbstention {
  return Object.freeze({ abstained: true, reason });
}

function classFromThresholds(drop: number, context: GradeContext): { klass: MoveQualityClass; threshold: number } | undefined {
  const prefix = GRADE_CONVENTION.contexts[context] === "practice" ? "practice" : "report";
  const values = prefix === "practice"
    ? { inaccuracy: GRADE_CONVENTION.constants.practiceInaccuracy.value, mistake: GRADE_CONVENTION.constants.practiceMistake.value, blunder: GRADE_CONVENTION.constants.practiceBlunder.value }
    : { inaccuracy: GRADE_CONVENTION.constants.reportInaccuracy.value, mistake: GRADE_CONVENTION.constants.reportMistake.value, blunder: GRADE_CONVENTION.constants.reportBlunder.value };
  if (drop >= values.blunder) return { klass: "blunder", threshold: values.blunder };
  if (drop >= values.mistake) return { klass: "mistake", threshold: values.mistake };
  if (drop >= values.inaccuracy) return { klass: "inaccuracy", threshold: values.inaccuracy };
  return undefined;
}

function instrument(before: GradeEvaluation, after: GradeEvaluation): { readonly depth?: number; readonly requestedMovetimeMs?: number } | undefined {
  if (before.lane !== after.lane || before.engineId !== after.engineId) return undefined;
  if (before.depth !== undefined && after.depth !== undefined) return before.depth === after.depth ? { depth: before.depth } : undefined;
  if (before.requestedMovetimeMs !== undefined && after.requestedMovetimeMs !== undefined) {
    return before.requestedMovetimeMs === after.requestedMovetimeMs ? { requestedMovetimeMs: before.requestedMovetimeMs } : undefined;
  }
  return undefined;
}

function grade(
  klass: MoveQualityClass,
  arm: MoveQualityArm,
  before: GradeScore,
  after: GradeScore,
  thresholdCrossed: MoveQualityGrade["thresholdCrossed"],
  context: GradeContext,
  source: GradeEvaluation,
  limit: { readonly depth?: number; readonly requestedMovetimeMs?: number },
): MoveQualityGrade {
  return Object.freeze({
    klass, arm, before, after, dropWinPercent: before.winPercent - after.winPercent,
    thresholdCrossed, convention: Object.freeze({ id: "grade-convention", version: 1, context }),
    engineId: source.engineId, lane: source.lane, ...limit,
  });
}

export function moveQualityGrade(
  beforeInput: GradeEvaluation | AbstainedGradeEvaluation | undefined,
  afterInput: GradeEvaluation | AbstainedGradeEvaluation | undefined,
  context: GradeContext,
  learnerSide: GradeSide,
): MoveQualityResult {
  if (beforeInput === undefined || afterInput === undefined) return abstention("missing_eval");
  if ("abstained" in beforeInput || "abstained" in afterInput) return abstention("input_abstained");
  const limit = instrument(beforeInput, afterInput);
  if (limit === undefined) return abstention("unequal_instrument");

  const before = normalizeScore(beforeInput, learnerSide);
  const after = normalizeScore(afterInput, learnerSide);
  if (before.score.kind === "cp" && after.score.kind === "cp") {
    const classified = classFromThresholds(before.winPercent - after.winPercent, context);
    return classified === undefined ? undefined : grade(classified.klass, "eval_delta", before, after, classified.threshold, context, beforeInput, limit);
  }
  if (before.score.kind === "mate" && before.score.movesTo > 0) {
    if (after.score.kind === "mate") {
      return after.score.movesTo < 0 ? grade("blunder", "mate_lost", before, after, "mate_lost_tier", context, beforeInput, limit) : undefined;
    }
    const klass: MoveQualityClass = after.score.value > GRADE_CONVENTION.constants.mateLostInaccuracy.value
      ? "inaccuracy"
      : after.score.value > GRADE_CONVENTION.constants.mateLostMistake.value ? "mistake" : "blunder";
    return grade(klass, "mate_lost", before, after, "mate_lost_tier", context, beforeInput, limit);
  }
  if (before.score.kind === "cp" && after.score.kind === "mate" && after.score.movesTo < 0) {
    const klass: MoveQualityClass = before.score.value < GRADE_CONVENTION.constants.mateAllowedInaccuracy.value
      ? "inaccuracy"
      : before.score.value < GRADE_CONVENTION.constants.mateAllowedMistake.value ? "mistake" : "blunder";
    return grade(klass, "mate_allowed", before, after, "mate_allowed_tier", context, beforeInput, limit);
  }
  if (before.score.kind === "mate" && before.score.movesTo < 0 && after.score.kind === "cp") return abstention("mate_score_inconsistent");
  return undefined;
}

const signedCp = (value: number): string => `${value >= 0 ? "+" : "−"}${(Math.abs(value) / 100).toFixed(2)}`;
const scoreText = (value: GradeScore): string => value.score.kind === "cp"
  ? `${signedCp(value.score.value)} (${value.winPercent.toFixed(1)}%)`
  : `${value.score.movesTo > 0 ? "mate" : "opponent mate"} #${Math.abs(value.score.movesTo)}`;
const titleCase = (value: string): string => `${value[0]!.toUpperCase()}${value.slice(1)}`;
const mateTierText = (value: MoveQualityGrade): string => value.arm === "mate_lost"
  ? value.klass === "inaccuracy" ? "above +9.99" : value.klass === "mistake" ? "inside +7.00..+9.99" : "at or below +7.00"
  : value.klass === "inaccuracy" ? "below −9.99" : value.klass === "mistake" ? "inside −9.99..−7.01" : "at or above −7.00";

export function renderMoveQualityGrade(value: MoveQualityGrade): string {
  const source = value.lane === "recorded" ? "recorded" : "live";
  const suffix = `grade-convention@1/${value.convention.context}`;
  if (value.arm === "eval_delta") {
    return `${titleCase(value.klass)} — the ${source} evaluation moved ${scoreText(value.before)} → ${scoreText(value.after)} across this move, a drop of ${value.dropWinPercent.toFixed(1)} win-points against a threshold of ${value.thresholdCrossed} (${suffix}).`;
  }
  if (value.arm === "mate_lost") {
    return `${titleCase(value.klass)} — the ${source} engine had ${scoreText(value.before)} before this move and reads ${scoreText(value.after)} afterward, a drop of ${value.dropWinPercent.toFixed(1)} win-points in the mate-lost tier ${mateTierText(value)} (${suffix}).`;
  }
  return `${titleCase(value.klass)} — the ${source} engine read ${scoreText(value.before)} before this move and reports ${scoreText(value.after)} afterward, a drop of ${value.dropWinPercent.toFixed(1)} win-points in the mate-allowed tier ${mateTierText(value)} (${suffix}).`;
}

export function assertMoveQualityGradeSentence(value: MoveQualityGrade, sentence: string): void {
  if (sentence !== renderMoveQualityGrade(value)) throw new TypeError("GRADE_RENDER_INCOMPLETE: grade sentences must retain every operand and convention");
}

export function renderMoveQualityResult(value: MoveQualityResult): readonly string[] {
  return value === undefined || "abstained" in value ? Object.freeze([]) : Object.freeze([renderMoveQualityGrade(value)]);
}
