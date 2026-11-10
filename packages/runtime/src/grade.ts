import type { ComparisonScore } from "./compare.js";
import type { RecordedEngineAvailable, RecordedEngineInstrument, RecordedEngineRequestedBound } from "./internal/recorded-engine-endpoint-values.js";

export type MoveQualityClass = "inaccuracy" | "mistake" | "blunder";
export type MoveQualityArm = "eval_delta" | "mate_lost" | "mate_allowed";
export type GradeContext = "drill" | "review" | "imported_analysis";
export type GradeSide = "white" | "black";
export type MoveQualityAbstentionReason =
  | "input_abstained"
  | "source_pending"
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
  version: 2 as const,
  constants: Object.freeze({
    inaccuracy: cited(2.5, PRACTICE_SOURCE),
    mistake: cited(10, ADVICE_SOURCE),
    blunder: cited(15, ADVICE_SOURCE),
    mateLostInaccuracy: cited(999, ADVICE_SOURCE),
    mateLostMistake: cited(700, ADVICE_SOURCE),
    mateAllowedInaccuracy: cited(-999, ADVICE_SOURCE),
    mateAllowedMistake: cited(-700, ADVICE_SOURCE),
    centipawnClamp: cited(1000, WIN_CHANCES_SOURCE),
    logisticCoefficient: cited(0.00368208, WIN_CHANCES_SOURCE),
  }),
});

/** Learner-facing attribution; the exact machine convention remains in every typed grade. */
export const GRADE_CONVENTION_LABEL = `single move-loss convention, version ${GRADE_CONVENTION.version}`;

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
  readonly convention: { readonly id: "grade-convention"; readonly version: 2 };
  readonly engineId: string;
  readonly lane: "recorded";
  readonly bound: RecordedEngineRequestedBound;
  readonly instrument: RecordedEngineInstrument;
}
export type MoveQualityGradeV2 = MoveQualityGrade;

export interface MoveQualityAbstention {
  readonly abstained: true;
  readonly reason: MoveQualityAbstentionReason;
}

export type MoveQualityResult = MoveQualityGrade | MoveQualityAbstention | undefined;

const clampCp = (cp: number): number => Math.max(-GRADE_CONVENTION.constants.centipawnClamp.value, Math.min(GRADE_CONVENTION.constants.centipawnClamp.value, cp));

export function winPercentFromCp(cp: number): number {
  return 100 / (1 + Math.exp(-GRADE_CONVENTION.constants.logisticCoefficient.value * clampCp(cp)));
}

export function recordedGradeScore(reading: RecordedEngineAvailable, mover: GradeSide): GradeScore {
  const factor = mover === "white" ? 1 : -1;
  const score: ComparisonScore = reading.score.kind === "centipawns"
    ? Object.freeze({ kind: "cp", value: reading.score.value === 0 ? 0 : reading.score.value * factor })
    : Object.freeze({ kind: "mate", movesTo: reading.score.distance * (reading.score.side === mover ? 1 : -1) });
  const winPercent = score.kind === "cp" ? winPercentFromCp(score.value) : score.movesTo > 0 ? 100 : 0;
  return Object.freeze({ score, winPercent });
}

function abstention(reason: MoveQualityAbstentionReason): MoveQualityAbstention {
  return Object.freeze({ abstained: true, reason });
}

export function classifyWinPercentLoss(drop: number): { klass: MoveQualityClass; threshold: number } | undefined {
  if (!Number.isFinite(drop)) throw new TypeError("Grade loss must be finite");
  const { inaccuracy, mistake, blunder } = GRADE_CONVENTION.constants;
  if (drop >= blunder.value) return { klass: "blunder", threshold: blunder.value };
  if (drop >= mistake.value) return { klass: "mistake", threshold: mistake.value };
  if (drop >= inaccuracy.value) return { klass: "inaccuracy", threshold: inaccuracy.value };
  return undefined;
}

function sameInstrument(before: RecordedEngineAvailable, after: RecordedEngineAvailable): boolean {
  const a = before.instrument, b = after.instrument, x = before.bound, y = after.bound;
  const sameBudget = x.kind === "depth" && y.kind === "depth" ? x.requestedDepth === y.requestedDepth
    : x.kind === "movetime" && y.kind === "movetime" ? x.requestedMs === y.requestedMs
      : x.kind === "nodes" && y.kind === "nodes" && x.requestedNodes === y.requestedNodes;
  return sameBudget && before.engineId === after.engineId && a.engineVersion === b.engineVersion
    && (a.origin === "provider_delivery" && b.origin === "provider_delivery" ? a.generation === b.generation
      : a.origin === "offline_engine" && b.origin === "offline_engine" && a.profile.threads === b.profile.threads
        && a.profile.hashMb === b.profile.hashMb && a.profile.multiPv === b.profile.multiPv);
}

function grade(
  klass: MoveQualityClass,
  arm: MoveQualityArm,
  before: GradeScore,
  after: GradeScore,
  thresholdCrossed: MoveQualityGrade["thresholdCrossed"],
  source: RecordedEngineAvailable,
): MoveQualityGrade {
  return Object.freeze({
    klass, arm, before, after, dropWinPercent: before.winPercent - after.winPercent,
    thresholdCrossed, convention: Object.freeze({ id: "grade-convention", version: 2 }),
    engineId: source.engineId, lane: "recorded", bound: source.bound, instrument: source.instrument,
  });
}

export function moveQualityGrade(
  beforeInput: RecordedEngineAvailable | AbstainedGradeEvaluation | undefined,
  afterInput: RecordedEngineAvailable | AbstainedGradeEvaluation | undefined,
  mover: GradeSide,
): MoveQualityResult {
  if (beforeInput === undefined || afterInput === undefined) return abstention("missing_eval");
  if ("abstained" in beforeInput || "abstained" in afterInput) return abstention("input_abstained");
  if (!sameInstrument(beforeInput, afterInput)) return abstention("unequal_instrument");

  const before = recordedGradeScore(beforeInput, mover);
  const after = recordedGradeScore(afterInput, mover);
  if (before.score.kind === "cp" && after.score.kind === "cp") {
    const classified = classifyWinPercentLoss(before.winPercent - after.winPercent);
    return classified === undefined ? undefined : grade(classified.klass, "eval_delta", before, after, classified.threshold, beforeInput);
  }
  if (before.score.kind === "mate" && before.score.movesTo > 0) {
    if (after.score.kind === "mate") {
      return after.score.movesTo < 0 ? grade("blunder", "mate_lost", before, after, "mate_lost_tier", beforeInput) : undefined;
    }
    const klass: MoveQualityClass = after.score.value > GRADE_CONVENTION.constants.mateLostInaccuracy.value
      ? "inaccuracy"
      : after.score.value > GRADE_CONVENTION.constants.mateLostMistake.value ? "mistake" : "blunder";
    return grade(klass, "mate_lost", before, after, "mate_lost_tier", beforeInput);
  }
  if (before.score.kind === "cp" && after.score.kind === "mate" && after.score.movesTo < 0) {
    const klass: MoveQualityClass = before.score.value < GRADE_CONVENTION.constants.mateAllowedInaccuracy.value
      ? "inaccuracy"
      : before.score.value < GRADE_CONVENTION.constants.mateAllowedMistake.value ? "mistake" : "blunder";
    return grade(klass, "mate_allowed", before, after, "mate_allowed_tier", beforeInput);
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
  const source = "recorded";
  const instrument = value.instrument.origin === "provider_delivery" ? `recorded provider delivery, generation ${value.instrument.generation}`
    : `pinned pack report, Threads ${value.instrument.profile.threads}, Hash ${value.instrument.profile.hashMb} MiB, MultiPV ${value.instrument.profile.multiPv}`;
  const budget = value.bound.kind === "depth" ? `requested depth ${value.bound.requestedDepth}`
    : value.bound.kind === "movetime" ? `requested ${value.bound.requestedMs} ms` : `requested ${value.bound.requestedNodes} nodes`;
  const suffix = `${value.engineId} ${value.instrument.engineVersion}; ${instrument}; ${budget}; ${GRADE_CONVENTION_LABEL}`;
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

/** D3767/D4064: a registered view of an already emitted grade, never a second classifier. */
export function renderMoveQualityGradeSummary(value: MoveQualityGrade): string {
  const label = titleCase(value.klass);
  if (value.arm === "eval_delta") return `${label}: the recorded evaluation lost ${value.dropWinPercent.toFixed(1)} win-points.`;
  if (value.arm === "mate_lost") return `${label}: the recorded mate for the moving side was lost.`;
  return `${label}: the recorded reading now reports mate against the moving side.`;
}

export function renderMoveQualityResult(value: MoveQualityResult): readonly string[] {
  return value === undefined || "abstained" in value ? Object.freeze([]) : Object.freeze([renderMoveQualityGrade(value)]);
}
