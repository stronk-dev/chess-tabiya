export const RATED_OPPONENT_BANDS = Object.freeze([1000, 1400, 1800, 2200] as const);
export type RatedOpponentBand = (typeof RATED_OPPONENT_BANDS)[number];

export interface RatedOpponentRung {
  readonly band: RatedOpponentBand;
  readonly rating: number;
  readonly rd: number;
  readonly measuredElo: number;
  readonly halfWidth: number;
}

export interface RatedOpponentCalibration {
  readonly id: string;
  readonly measuredBy: string;
  readonly engine: { readonly id: string; readonly name: string; readonly modelId: string; readonly containerDigest: string };
  readonly origin: { readonly band: RatedOpponentBand; readonly rating: number };
  readonly minStartPieceCount: number;
  readonly rungs: readonly RatedOpponentRung[];
}

export const RATED_OPPONENT_CALIBRATION = Object.freeze({
  id: "maia3-5m-band-ladder-2026-08-16",
  measuredBy: "design/research/maia-band-outcome-transfer.md §5 (full-material ladder)",
  engine: Object.freeze({
    id: "maia-5m",
    name: "Maia3",
    modelId: "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe",
    containerDigest: "1e13597c42d4858b7cfd7cfdae01e297263364b2",
  }),
  origin: Object.freeze({ band: 1400 as const, rating: 1500 }),
  minStartPieceCount: 21,
  rungs: Object.freeze([
    Object.freeze({ band: 1000 as const, rating: 1312.4, rd: 24.1, measuredElo: -187.6, halfWidth: 18.9 }),
    Object.freeze({ band: 1400 as const, rating: 1500, rd: 24.1, measuredElo: -3.4, halfWidth: 24.1 }),
    Object.freeze({ band: 1800 as const, rating: 1622.6, rd: 24.1, measuredElo: 122.6, halfWidth: 20.6 }),
    Object.freeze({ band: 2200 as const, rating: 1792.2, rd: 24.1, measuredElo: 292.2, halfWidth: 16.2 }),
  ] satisfies readonly RatedOpponentRung[]),
});

export const GLICKO2_CONSTANTS = Object.freeze({
  initialRating: 1500,
  initialRd: 350,
  initialVolatility: 0.06,
  tau: 0.5,
  scale: 173.7178,
  publicationRd: 60,
  abandonmentShareLimit: 0.25,
  bracketLow: 1500,
  bracketHigh: 1800,
});

export interface RatingState {
  readonly rating: number;
  readonly rd: number;
  readonly volatility: number;
}

export interface GlickoResult {
  readonly opponentRating: number;
  readonly opponentRd: number;
  readonly score: 0 | 0.5 | 1;
}

export interface LearnerRatingState extends RatingState {
  readonly calibrationId: string;
  readonly ratedGames: number;
  readonly voidedGames: number;
  readonly abandonedGames: number;
}

export type PublishedBandValue =
  | { readonly kind: "band"; readonly value: number }
  | { readonly kind: "below"; readonly band: number }
  | { readonly kind: "above"; readonly band: number };

export interface RatingPublication {
  readonly state: "provisional" | "published" | "bounded";
  readonly interval: readonly [PublishedBandValue, PublishedBandValue];
  readonly ratedGames: number;
  readonly abandonedGames: number;
  readonly pointEstimate?: PublishedBandValue;
}

export const RATING_DISCLOSURES = Object.freeze([
  "Band-calibrated scale (BCS); not FIDE, Lichess, or Chess.com.",
  "An interval is shown with every published estimate.",
  "Rated games and abandoned games are shown together.",
  "The band ladder from 1000 to 2200 spans about 480 BCS at full material and about 346.8 across the authored corpus; 100 band points correspond to about 40 BCS at full material.",
  "Server-routed assistance was withheld; browser-rendered assistance and help outside this tab cannot be detected.",
  "These games were played alone against a bot and nobody witnessed them.",
  "Point estimates are published only inside the multi-model-supported 1500–1800 BCS bracket; outside it, only a bound is shown.",
] as const);

export class RatingContractError extends TypeError {
  constructor(readonly code: "RATING_CALIBRATION_INVALID" | "RATING_UPDATE_INVALID", message: string) {
    super(`${code}: ${message}`);
    this.name = "RatingContractError";
  }
}

export function assertRatedOpponentCalibration(value: RatedOpponentCalibration = RATED_OPPONENT_CALIBRATION): void {
  if (value.id !== "maia3-5m-band-ladder-2026-08-16" || value.minStartPieceCount !== 21 || value.rungs.length !== 4) {
    throw new RatingContractError("RATING_CALIBRATION_INVALID", "calibration identity, material floor, and four-rung closure are fixed together");
  }
  for (const [index, band] of RATED_OPPONENT_BANDS.entries()) {
    const rung = value.rungs[index];
    if (rung?.band !== band || rung.rd !== Math.max(rung.halfWidth, 24.1) || (band === 1400 ? rung.rating !== 1500 : rung.rating !== 1500 + rung.measuredElo)) {
      throw new RatingContractError("RATING_CALIBRATION_INVALID", `invalid measured rung ${band}`);
    }
  }
}

assertRatedOpponentCalibration();

export function ratedOpponentRung(band: number): RatedOpponentRung | undefined {
  return RATED_OPPONENT_CALIBRATION.rungs.find((rung) => rung.band === band);
}

export function initialRating(seedBand?: RatedOpponentBand): RatingState {
  const rating = seedBand === undefined ? GLICKO2_CONSTANTS.initialRating : ratedOpponentRung(seedBand)!.rating;
  return Object.freeze({ rating, rd: GLICKO2_CONSTANTS.initialRd, volatility: GLICKO2_CONSTANTS.initialVolatility });
}

const square = (value: number): number => value * value;
const g = (phi: number): number => 1 / Math.sqrt(1 + 3 * square(phi) / square(Math.PI));
const expected = (mu: number, opponentMu: number, opponentPhi: number): number => 1 / (1 + Math.exp(-g(opponentPhi) * (mu - opponentMu)));

function assertFiniteState(state: RatingState, results: readonly GlickoResult[]): void {
  if (![state.rating, state.rd, state.volatility].every(Number.isFinite) || state.rd <= 0 || state.volatility <= 0 || results.some((result) => ![result.opponentRating, result.opponentRd, result.score].every(Number.isFinite) || result.opponentRd <= 0 || ![0, 0.5, 1].includes(result.score))) {
    throw new RatingContractError("RATING_UPDATE_INVALID", "rating state and game results must be finite and inside their domains");
  }
}

function nextVolatility(phi: number, volatility: number, variance: number, delta: number, tau: number): number {
  const a = Math.log(square(volatility));
  const f = (x: number): number => {
    const exponent = Math.exp(x);
    return exponent * (square(delta) - square(phi) - variance - exponent) / (2 * square(square(phi) + variance + exponent)) - (x - a) / square(tau);
  };
  let lower = a;
  let upper: number;
  if (square(delta) > square(phi) + variance) upper = Math.log(square(delta) - square(phi) - variance);
  else {
    let k = 1;
    while (f(a - k * tau) < 0) k += 1;
    upper = a - k * tau;
  }
  let fLower = f(lower);
  let fUpper = f(upper);
  while (Math.abs(upper - lower) > 0.000001) {
    const candidate = lower + (lower - upper) * fLower / (fUpper - fLower);
    const fCandidate = f(candidate);
    if (fCandidate * fUpper < 0) {
      lower = upper;
      fLower = fUpper;
    } else fLower /= 2;
    upper = candidate;
    fUpper = fCandidate;
  }
  return Math.exp(lower / 2);
}

export function glicko2Update(state: RatingState, results: readonly GlickoResult[], tau = GLICKO2_CONSTANTS.tau): RatingState {
  assertFiniteState(state, results);
  if (!Number.isFinite(tau) || tau <= 0) throw new RatingContractError("RATING_UPDATE_INVALID", "tau must be positive");
  const scale = GLICKO2_CONSTANTS.scale;
  const mu = (state.rating - 1500) / scale;
  const phi = state.rd / scale;
  if (results.length === 0) {
    return Object.freeze({ rating: state.rating, rd: Math.min(350, scale * Math.sqrt(square(phi) + square(state.volatility))), volatility: state.volatility });
  }
  const converted = results.map((result) => ({
    mu: (result.opponentRating - 1500) / scale,
    phi: result.opponentRd / scale,
    score: result.score,
  }));
  const variance = 1 / converted.reduce((sum, result) => {
    const chance = expected(mu, result.mu, result.phi);
    return sum + square(g(result.phi)) * chance * (1 - chance);
  }, 0);
  const delta = variance * converted.reduce((sum, result) => sum + g(result.phi) * (result.score - expected(mu, result.mu, result.phi)), 0);
  const volatility = nextVolatility(phi, state.volatility, variance, delta, tau);
  const preRatingPhi = Math.sqrt(square(phi) + square(volatility));
  const nextPhi = 1 / Math.sqrt(1 / square(preRatingPhi) + 1 / variance);
  const nextMu = mu + square(nextPhi) * converted.reduce((sum, result) => sum + g(result.phi) * (result.score - expected(mu, result.mu, result.phi)), 0);
  return Object.freeze({ rating: scale * nextMu + 1500, rd: Math.min(350, scale * nextPhi), volatility });
}

export function bandEquivalent(rating: number): PublishedBandValue {
  const rungs = RATED_OPPONENT_CALIBRATION.rungs;
  if (rating < rungs[0]!.rating) return Object.freeze({ kind: "below", band: 1000 });
  if (rating > rungs.at(-1)!.rating) return Object.freeze({ kind: "above", band: 2200 });
  for (let index = 1; index < rungs.length; index += 1) {
    const left = rungs[index - 1]!;
    const right = rungs[index]!;
    if (rating <= right.rating) {
      const fraction = (rating - left.rating) / (right.rating - left.rating);
      return Object.freeze({ kind: "band", value: left.band + fraction * (right.band - left.band) });
    }
  }
  return Object.freeze({ kind: "above", band: 2200 });
}

function publicationBound(direction: "low" | "high"): PublishedBandValue {
  const edge = bandEquivalent(direction === "low" ? GLICKO2_CONSTANTS.bracketLow : GLICKO2_CONSTANTS.bracketHigh);
  if (edge.kind === "below" || edge.kind === "above") return edge;
  return Object.freeze({ kind: direction === "low" ? "below" : "above", band: Math.round(edge.value) });
}

export function publishRating(value: LearnerRatingState, options: { readonly scoreSaturation?: "low" | "high" } = {}): RatingPublication | undefined {
  if (value.ratedGames === 0) return undefined;
  const interval = Object.freeze([bandEquivalent(value.rating - 2 * value.rd), bandEquivalent(value.rating + 2 * value.rd)] as const);
  const abandonedShare = value.abandonedGames / (value.ratedGames + value.abandonedGames);
  if (value.rd > GLICKO2_CONSTANTS.publicationRd || abandonedShare > GLICKO2_CONSTANTS.abandonmentShareLimit) {
    return Object.freeze({ state: "provisional", interval, ratedGames: value.ratedGames, abandonedGames: value.abandonedGames });
  }
  const boundDirection = options.scoreSaturation
    ?? (value.rating < GLICKO2_CONSTANTS.bracketLow ? "low" : value.rating > GLICKO2_CONSTANTS.bracketHigh ? "high" : undefined);
  if (boundDirection !== undefined) {
    return Object.freeze({ state: "bounded", interval, pointEstimate: publicationBound(boundDirection), ratedGames: value.ratedGames, abandonedGames: value.abandonedGames });
  }
  return Object.freeze({ state: "published", interval, pointEstimate: bandEquivalent(value.rating), ratedGames: value.ratedGames, abandonedGames: value.abandonedGames });
}
