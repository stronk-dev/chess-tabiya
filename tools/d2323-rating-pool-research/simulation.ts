import { glicko2Update, type GlickoResult, type RatingState } from "../../packages/runtime/src/rating.ts";

export interface SimulatedLearner {
  readonly id: string;
  readonly trueRating: number;
  readonly state: RatingState;
  readonly humanGames: number;
  readonly directAnchorGames: number;
}

export interface PoolSimulationOptions {
  readonly periods: number;
  readonly seed: number;
  readonly initialOffset?: number;
  readonly componentSizes?: readonly number[];
  readonly anchorEvery?: number;
  readonly anchorLearners?: readonly string[];
}

const INITIAL: RatingState = Object.freeze({ rating: 1500, rd: 350, volatility: 0.06 });
const ANCHOR = Object.freeze({ rating: 1500, rd: 24.1, trueRating: 1500 });

function uniform(seed: number, label: string): number {
  let value = seed >>> 0;
  for (const character of label) {
    value ^= character.codePointAt(0) ?? 0;
    value = Math.imul(value, 16777619) >>> 0;
    value ^= value >>> 13;
  }
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 0x1_0000_0000;
}

function outcome(white: SimulatedLearner, black: Pick<SimulatedLearner, "id" | "trueRating">, seed: number, period: number): 0 | 0.5 | 1 {
  const difference = white.trueRating - black.trueRating;
  const decisiveWhite = 1 / (1 + 10 ** (-difference / 400));
  const draw = 0.28 * Math.exp(-Math.abs(difference) / 500);
  const sample = uniform(seed, `${period}:${white.id}:${black.id}`);
  if (sample < draw) return 0.5;
  return sample < draw + (1 - draw) * decisiveWhite ? 1 : 0;
}

function components(sizes: readonly number[]): readonly (readonly number[])[] {
  const result: number[][] = [];
  let cursor = 0;
  for (const size of sizes) {
    if (!Number.isSafeInteger(size) || size < 2 || size % 2 !== 0) throw new TypeError("component sizes must be even integers >= 2");
    result.push(Array.from({ length: size }, (_, index) => cursor + index));
    cursor += size;
  }
  return Object.freeze(result.map((component) => Object.freeze(component)));
}

function componentPairings(component: readonly number[], period: number): readonly (readonly [number, number])[] {
  const rotation = period % (component.length - 1);
  const fixed = component[0]!;
  const tail = component.slice(1);
  const rotated = [...tail.slice(rotation), ...tail.slice(0, rotation)];
  const order = [fixed, ...rotated];
  return Object.freeze(Array.from({ length: component.length / 2 }, (_, index) =>
    Object.freeze([order[index]!, order[order.length - 1 - index]!] as const)));
}

export function simulatePool(options: PoolSimulationOptions): readonly SimulatedLearner[] {
  if (!Number.isSafeInteger(options.periods) || options.periods < 1) throw new TypeError("periods must be a positive integer");
  const sizes = options.componentSizes ?? [8];
  const groups = components(sizes);
  const count = sizes.reduce((sum, size) => sum + size, 0);
  const anchorLearners = new Set(options.anchorLearners ?? []);
  let learners: SimulatedLearner[] = Array.from({ length: count }, (_, index) => Object.freeze({
    id: `p${index}`,
    trueRating: 1260 + index * (480 / Math.max(1, count - 1)),
    state: Object.freeze({ ...INITIAL, rating: INITIAL.rating + (options.initialOffset ?? 0) }),
    humanGames: 0,
    directAnchorGames: 0,
  }));

  for (let period = 0; period < options.periods; period += 1) {
    const snapshots = learners.map((learner) => learner.state);
    const results = learners.map((): GlickoResult[] => []);
    const humanCounts = learners.map(() => 0);
    const anchorCounts = learners.map(() => 0);
    for (const group of groups) {
      for (const [whiteIndex, blackIndex] of componentPairings(group, period)) {
        const white = learners[whiteIndex]!;
        const black = learners[blackIndex]!;
        const score = outcome(white, black, options.seed, period);
        results[whiteIndex]!.push({ opponentRating: snapshots[blackIndex]!.rating, opponentRd: snapshots[blackIndex]!.rd, score });
        results[blackIndex]!.push({ opponentRating: snapshots[whiteIndex]!.rating, opponentRd: snapshots[whiteIndex]!.rd, score: score === 0.5 ? 0.5 : score === 1 ? 0 : 1 });
        humanCounts[whiteIndex]! += 1;
        humanCounts[blackIndex]! += 1;
      }
    }
    if (options.anchorEvery !== undefined && period % options.anchorEvery === 0) {
      for (const [index, learner] of learners.entries()) {
        if (!anchorLearners.has(learner.id)) continue;
        const score = outcome(learner, { id: "calibrated-bot", trueRating: ANCHOR.trueRating }, options.seed, period);
        results[index]!.push({ opponentRating: ANCHOR.rating, opponentRd: ANCHOR.rd, score });
        anchorCounts[index]! += 1;
      }
    }
    learners = learners.map((learner, index) => Object.freeze({
      ...learner,
      state: glicko2Update(snapshots[index]!, results[index]!),
      humanGames: learner.humanGames + humanCounts[index]!,
      directAnchorGames: learner.directAnchorGames + anchorCounts[index]!,
    }));
  }
  return Object.freeze(learners);
}

export function meanRating(learners: readonly SimulatedLearner[]): number {
  return learners.reduce((sum, learner) => sum + learner.state.rating, 0) / learners.length;
}

export function offsetSeparation(left: readonly SimulatedLearner[], right: readonly SimulatedLearner[]): readonly number[] {
  if (left.length !== right.length || left.some((learner, index) => learner.id !== right[index]?.id)) throw new TypeError("pool identities differ");
  return Object.freeze(left.map((learner, index) => right[index]!.state.rating - learner.state.rating));
}

export function summarize(values: readonly number[]): Readonly<{ min: number; median: number; max: number; mean: number }> {
  if (values.length === 0) throw new TypeError("cannot summarize an empty population");
  const sorted = [...values].sort((left, right) => left - right);
  return Object.freeze({
    min: sorted[0]!,
    median: sorted[Math.floor(sorted.length / 2)]!,
    max: sorted.at(-1)!,
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
  });
}

const rounded = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;
const roundedSummary = (values: readonly number[]): ReturnType<typeof summarize> => {
  const summary = summarize(values);
  return Object.freeze(Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, rounded(value)])) as unknown as ReturnType<typeof summarize>);
};

export function buildResearchReport(): Readonly<Record<string, unknown>> {
  const all = Array.from({ length: 8 }, (_, index) => `p${index}`);
  const closed = simulatePool({ periods: 500, seed: 11 });
  const closedShifted = simulatePool({ periods: 500, seed: 11, initialOffset: 200 });
  const centroids = Array.from({ length: 32 }, (_, seed) => meanRating(simulatePool({ periods: 500, seed })) - 1500);
  const anchorDose = Object.fromEntries([100, 20, 5].map((anchorEvery) => {
    const base = simulatePool({ periods: 600, seed: 23, anchorEvery, anchorLearners: all });
    const shifted = simulatePool({ periods: 600, seed: 23, initialOffset: 200, anchorEvery, anchorLearners: all });
    return [`every_${anchorEvery}`, Object.freeze({
      directAnchorShare: rounded(base[0]!.directAnchorGames / (base[0]!.humanGames + base[0]!.directAnchorGames)),
      remainingOffset: roundedSummary(offsetSeparation(base, shifted)),
    })];
  }));
  const graphOptions = { periods: 1000, seed: 41, componentSizes: [4, 4] as const, anchorEvery: 5, anchorLearners: ["p0"] };
  const graphBase = simulatePool(graphOptions);
  const graphShifted = simulatePool({ ...graphOptions, initialOffset: 200 });
  const graphSeparation = offsetSeparation(graphBase, graphShifted);
  return Object.freeze({
    schema: "tabiya.rating-pool-research.v1",
    shippedImplementation: "packages/runtime/src/rating.ts#glicko2Update",
    closedTranslation: roundedSummary(offsetSeparation(closed, closedShifted)),
    closedCentroidMovement: roundedSummary(centroids),
    anchorDose,
    graphPropagation: Object.freeze({
      directAnchorPlayer: Object.freeze({ id: "p0", games: graphBase[0]!.directAnchorGames, remainingOffset: rounded(graphSeparation[0]!) }),
      connectedZeroDirectAnchor: roundedSummary(graphSeparation.slice(1, 4)),
      disconnectedZeroDirectAnchor: roundedSummary(graphSeparation.slice(4)),
    }),
  });
}
