import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  GLICKO2_CONSTANTS,
  RATED_OPPONENT_CALIBRATION,
  glicko2Update,
  initialRating,
  type GlickoResult,
  type RatingState,
} from "../../packages/runtime/src/rating.ts";

const ROOT = resolve(process.cwd());
const RESULT_FILE = resolve(ROOT, "planning/learner-rating/ac7-bracket-results.json");
const REPORT_FILE = resolve(ROOT, "planning/learner-rating/ac7-bracket-results.md");
const PREREGISTRATION = "planning/learner-rating/ac7-bracket-preregistration.md";
const METHOD_VERSION = "learner-rating-ac7@1";
const TRIALS = 2_000;
const MAX_PERIODS = 104;
const TRUE_RATINGS = Object.freeze(Array.from({ length: 13 }, (_, index) => 950 + index * 100));
const MODELS = Object.freeze(["logistic", "thurstone", "draw_floor"] as const);
const ARRIVALS = Object.freeze([
  Object.freeze({ id: "count_closing", gamesPerWeek: 12 }),
  Object.freeze({ id: "clock_closing", gamesPerWeek: 3 }),
] as const);

type Model = (typeof MODELS)[number];

interface Cell {
  readonly trueRating: number;
  readonly model: Model;
  readonly arrival: (typeof ARRIVALS)[number]["id"];
  readonly trials: number;
  readonly ready: number;
  readonly neverReady: number;
  readonly covered: number;
  readonly coverage: number;
  readonly coverageWilson95: readonly [number, number];
  readonly periodsToReady: Readonly<{ p50: number | null; p90: number | null; max: number | null }>;
  readonly clears: boolean;
  readonly borderline: boolean;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function sourceDigest(): string {
  return sha256([
    readFileSync(resolve(ROOT, "tools/learner-rating-bracket-harness/simulate.ts"), "utf8"),
    readFileSync(resolve(ROOT, "packages/runtime/src/rating.ts"), "utf8"),
  ].join("\n-- rating source --\n"));
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = state + 0x6d2b79f5 | 0;
    let value = Math.imul(state ^ state >>> 15, 1 | state);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4_294_967_296;
  };
}

function trialSeed(trueRating: number, arrival: string, trial: number): number {
  return createHash("sha256").update(`${METHOD_VERSION}\0${trueRating}\0${arrival}\0${trial}`).digest().readUInt32BE(0);
}

function erf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - polynomial * Math.exp(-x * x));
}

function winProbability(model: Model, learner: number, opponent: number): number {
  const difference = learner - opponent;
  if (model === "thurstone") {
    // sigma matches the normal-ogive slope at equality to ln(10)/1600, the Elo-logistic slope.
    const sigma = 800 / (Math.log(10) * Math.sqrt(Math.PI));
    return 0.5 * (1 + erf(difference / (2 * sigma)));
  }
  return 1 / (1 + 10 ** (-difference / 400));
}

function sampledScore(model: Model, learner: number, opponent: number, unit: number): 0 | 0.5 | 1 {
  const win = winProbability(model, learner, opponent);
  if (model !== "draw_floor") return unit < win ? 1 : 0;
  const draw = 0.2;
  const lossBoundary = (1 - draw) * (1 - win);
  if (unit < lossBoundary) return 0;
  if (unit < lossBoundary + draw) return 0.5;
  return 1;
}

function quantile(values: readonly number[], probability: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(probability * sorted.length) - 1)]!;
}

function wilson(successes: number, total: number): readonly [number, number] {
  if (total === 0) return Object.freeze([0, 0]);
  const z = 1.959963984540054;
  const p = successes / total;
  const denominator = 1 + z * z / total;
  const center = (p + z * z / (2 * total)) / denominator;
  const spread = z * Math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator;
  return Object.freeze([center - spread, center + spread]);
}

function simulateCell(trueRating: number, model: Model, arrival: (typeof ARRIVALS)[number]): Cell {
  const readyPeriods: number[] = [];
  let covered = 0;
  for (let trial = 0; trial < TRIALS; trial += 1) {
    const random = mulberry32(trialSeed(trueRating, arrival.id, trial));
    let state: RatingState = initialRating();
    const offset = trial % RATED_OPPONENT_CALIBRATION.rungs.length;
    let readyAt: number | undefined;
    for (let period = 1; period <= MAX_PERIODS; period += 1) {
      const results: GlickoResult[] = [];
      for (let game = 0; game < arrival.gamesPerWeek; game += 1) {
        const index = (offset + (period - 1) * arrival.gamesPerWeek + game) % RATED_OPPONENT_CALIBRATION.rungs.length;
        const opponent = RATED_OPPONENT_CALIBRATION.rungs[index]!;
        results.push({
          opponentRating: opponent.rating,
          opponentRd: opponent.rd,
          score: sampledScore(model, trueRating, opponent.rating, random()),
        });
      }
      state = glicko2Update(state, results);
      if (state.rd <= GLICKO2_CONSTANTS.publicationRd) {
        readyAt = period;
        if (state.rating - 2 * state.rd <= trueRating && trueRating <= state.rating + 2 * state.rd) covered += 1;
        break;
      }
    }
    if (readyAt !== undefined) readyPeriods.push(readyAt);
  }
  const ready = readyPeriods.length;
  const coverage = ready === 0 ? 0 : covered / ready;
  const bounds = wilson(covered, ready);
  return Object.freeze({
    trueRating,
    model,
    arrival: arrival.id,
    trials: TRIALS,
    ready,
    neverReady: TRIALS - ready,
    covered,
    coverage,
    coverageWilson95: bounds,
    periodsToReady: Object.freeze({ p50: quantile(readyPeriods, 0.5), p90: quantile(readyPeriods, 0.9), max: quantile(readyPeriods, 1) }),
    clears: ready === TRIALS && coverage >= 0.9,
    borderline: ready === TRIALS && coverage >= 0.9 && bounds[0] < 0.9,
  });
}

function largestContiguous(values: readonly number[]): readonly number[] {
  const runs: number[][] = [];
  for (const value of values) {
    const current = runs.at(-1);
    if (current !== undefined && current.at(-1)! + 100 === value) current.push(value);
    else runs.push([value]);
  }
  return Object.freeze((runs.sort((left, right) => right.length - left.length
    || Number(right.includes(1550)) - Number(left.includes(1550))
    || left[0]! - right[0]!)[0] ?? []).slice());
}

function buildResult(): Record<string, unknown> {
  const cells = TRUE_RATINGS.flatMap((trueRating) => MODELS.flatMap((model) => ARRIVALS.map((arrival) => simulateCell(trueRating, model, arrival))));
  const clearing = TRUE_RATINGS.filter((trueRating) => cells.filter((cell) => cell.trueRating === trueRating).every((cell) => cell.clears));
  const run = largestContiguous(clearing);
  const rounded = run.length === 0 ? null : Object.freeze({ low: Math.round(run[0]! / 100) * 100, high: Math.round(run.at(-1)! / 100) * 100 });
  const shippedRounded = Object.freeze({
    low: Math.round(GLICKO2_CONSTANTS.bracketLow / 100) * 100,
    high: Math.round(GLICKO2_CONSTANTS.bracketHigh / 100) * 100,
  });
  return {
    schema: "tabiya.learner-rating.ac7.v1",
    methodVersion: METHOD_VERSION,
    preregistration: PREREGISTRATION,
    sourceDigest: sourceDigest(),
    parameters: {
      trialsPerCell: TRIALS,
      maxPeriods: MAX_PERIODS,
      trueRatings: TRUE_RATINGS,
      models: MODELS,
      arrivals: ARRIVALS,
      opponents: RATED_OPPONENT_CALIBRATION.rungs.map(({ band, rating, rd }) => ({ band, rating, rd })),
      publicationRd: GLICKO2_CONSTANTS.publicationRd,
      coverageFloor: 0.9,
    },
    cells,
    decision: {
      clearingGridPoints: clearing,
      largestContiguousRun: run,
      supportedRoundedBracket: rounded,
      shippedExactBracket: { low: GLICKO2_CONSTANTS.bracketLow, high: GLICKO2_CONSTANTS.bracketHigh },
      shippedRoundedBracket: shippedRounded,
      agreesWithShippedRoundedBracket: rounded !== null && rounded.low === shippedRounded.low && rounded.high === shippedRounded.high,
      borderlineCells: cells.filter((cell) => cell.borderline).map((cell) => ({ trueRating: cell.trueRating, model: cell.model, arrival: cell.arrival })),
    },
  };
}

function pct(value: number): string { return `${(100 * value).toFixed(1)}%`; }

function markdown(result: any): string {
  const decision = result.decision;
  const rows = result.cells.map((cell: Cell) => `| ${cell.trueRating} | ${cell.model} | ${cell.arrival} | ${pct(cell.coverage)} | ${pct(cell.coverageWilson95[0])}–${pct(cell.coverageWilson95[1])} | ${cell.periodsToReady.p50 ?? "—"} | ${cell.periodsToReady.p90 ?? "—"} | ${cell.neverReady} | ${cell.clears ? "yes" : "no"} |`);
  return [
    "# Learner-rating AC-7 bracket simulation — results", "",
    `Preregistered method: \`${result.preregistration}\`. Source seal: \`${result.sourceDigest}\`.`, "",
    `**Verdict:** supported rounded bracket ${decision.supportedRoundedBracket === null ? "(none)" : `**${decision.supportedRoundedBracket.low}–${decision.supportedRoundedBracket.high} BCS**`}; shipped rounded bracket **${decision.shippedRoundedBracket.low}–${decision.shippedRoundedBracket.high} BCS**; ${decision.agreesWithShippedRoundedBracket ? "agreement" : "DISAGREEMENT — constants/copy must move"}.`, "",
    `Clearing grid points: ${decision.clearingGridPoints.join(", ") || "none"}. Borderline cells: ${decision.borderlineCells.length}.`, "",
    "Coverage is measured at the first period where the shipped update reaches RD ≤ 60. Period counts are weekly under both arrival arms; the count-closing arm has 12 games/week and the clock-closing arm 3.", "",
    "| true BCS | model | arrival | coverage | Wilson 95% | periods p50 | periods p90 | never ready | clears |",
    "|---:|---|---|---:|---:|---:|---:|---:|---|",
    ...rows, "",
    "The simulation does not validate opponent humanity, detect cheating, or estimate FIDE/Lichess/Chess.com rating. It tests only the published BCS interval and its readiness threshold.", "",
  ].join("\n");
}

const result = buildResult();
if (process.argv.includes("--update")) {
  writeFileSync(RESULT_FILE, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  writeFileSync(REPORT_FILE, markdown(result), "utf8");
} else if (process.argv.includes("--summary")) {
  process.stdout.write(`${JSON.stringify({
    sourceDigest: result.sourceDigest,
    resultDigest: sha256(JSON.stringify(result)),
    decision: result.decision,
  })}\n`);
} else {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
