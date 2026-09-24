// rfc/review-map.md §3, §6: one reading of a recorded evaluation as a grade operand, shared by the
// `derived.grade.move_quality@1` producer (the single caller of the shipped grader) and the review
// map's accuracy figure, so both measure the same drop from the same normalised scores. It adds no
// constant: win percentages go through the one exported logistic in grade.ts.

import type { ComparisonScore } from "./compare.js";
import { winPercentFromCp, type AbstainedGradeEvaluation, type GradeEvaluation, type GradeSide } from "./grade.js";

const ABSTAINED: AbstainedGradeEvaluation = Object.freeze({ abstained: true as const });
const isRecord = (candidate: unknown): candidate is Readonly<Record<string, unknown>> => typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);

/**
 * Reads one sealed evaluation payload — a run's `engine_validated` eval packet or a pack ledger
 * `engine_eval` reading — as a White-perspective recorded grade operand. A reading without a declared
 * perspective follows the recorded-run convention (side to move). The instrument is the requested
 * search limit: a depth reached under a movetime limit is an outcome of the search, not its limit.
 */
export function gradeReadingFromPayload(payload: unknown, sideToMove: GradeSide): GradeEvaluation | AbstainedGradeEvaluation {
  if (!isRecord(payload) || !isRecord(payload.values)) return ABSTAINED;
  const values = payload.values;
  const ledger = payload.kind === "engine_eval";
  if (!ledger && payload.kind !== "eval") return ABSTAINED;
  const turn: GradeSide = ledger && typeof payload.fen === "string" ? (payload.fen.split(" ")[1] === "b" ? "black" : "white") : sideToMove;
  if (turn !== sideToMove) return ABSTAINED;
  const engineId = typeof values.engineId === "string" ? values.engineId : ledger ? payload.sourceId : undefined;
  if (typeof engineId !== "string" || engineId.trim() === "") return ABSTAINED;
  const toWhite = (value: number): number => values.perspective === "white" || turn === "white" ? value : -value;
  const score: ComparisonScore | undefined = Number.isSafeInteger(values.centipawns)
    ? Object.freeze({ kind: "cp" as const, value: toWhite(values.centipawns as number) })
    : Number.isSafeInteger(values.mateIn) && values.mateIn !== 0
      ? Object.freeze({ kind: "mate" as const, movesTo: toWhite(values.mateIn as number) })
      : undefined;
  if (score === undefined) return ABSTAINED;
  const limit = Number.isSafeInteger(values.requestedMovetimeMs)
    ? { requestedMovetimeMs: values.requestedMovetimeMs as number }
    : Number.isSafeInteger(values.requestedDepth)
      ? { depth: values.requestedDepth as number }
      : ledger && Number.isSafeInteger(values.depth) ? { depth: values.depth as number } : {};
  return Object.freeze({ engineId, score, sideToMove: turn, lane: "recorded" as const, perspective: "white" as const, ...limit });
}

/** The mover's win percentage for one White-perspective reading, through the shipped logistic. */
export function moverWinPercent(reading: GradeEvaluation, mover: GradeSide): number {
  const sign = mover === "white" ? 1 : -1;
  if (reading.score.kind === "cp") return winPercentFromCp(reading.score.value * sign);
  return reading.score.movesTo * sign > 0 ? 100 : 0;
}
