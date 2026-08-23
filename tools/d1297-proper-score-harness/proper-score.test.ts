// DISPOSABLE research harness — D1297. Seen-population model development only.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const INPUT = process.env.TABIYA_D1297_FEATURE_CACHE;
const WRITE = process.env.TABIYA_D1297_WRITE === "1";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1297-proper-score-results.json", import.meta.url);
const REPORT = new URL("../../planning/platform-alignment/bot-policy/d1297-proper-score-results.md", import.meta.url);
const GUARD_INPUT = process.env.TABIYA_D1312_FEATURE_CACHE;
const GUARD_WRITE = process.env.TABIYA_D1312_WRITE === "1";
const GUARD_RESULT = new URL("../../planning/platform-alignment/bot-policy/d1312-guard-composition-results.json", import.meta.url);
const GUARD_REPORT = new URL("../../planning/platform-alignment/bot-policy/d1312-guard-composition-results.md", import.meta.url);
const LAMBDAS = [0.01, 0.1, 1, 10, 100] as const;
const TRANSFORMS = ["raw", "projection-balanced"] as const;
const ARMS = ["engine", "evidence", "combined"] as const;
const TRAIN_FOLDS = new Set([0, 1, 2]);
const TRAIN_VALIDATION_FOLDS = new Set([0, 1, 2, 3]);
const ALL_FOLDS = new Set([0, 1, 2, 3, 4]);

type Transform = (typeof TRANSFORMS)[number];
type Arm = (typeof ARMS)[number];
type Sparse = readonly (readonly [number, number])[];
interface CacheCandidate { readonly moveUci: string; readonly scoreCp: number; readonly raw: readonly (readonly [string, number])[] }
interface CachePosition {
  readonly id: string;
  readonly gameId: string;
  readonly fold: number;
  readonly ratingBand: string;
  readonly speed: string;
  readonly ply: number;
  readonly fen: string;
  readonly playedUci: string;
  readonly candidates: readonly CacheCandidate[];
}
interface Cache {
  readonly schema: string;
  readonly representationCommit: string;
  readonly inputs: Readonly<Record<string, string>>;
  readonly positions: readonly CachePosition[];
  readonly cacheDigest: string;
  readonly vocabularySize: number;
  readonly nonZeroValues: number;
}
interface CacheHeader {
  readonly schema: string;
  readonly representationCommit: string;
  readonly inputs: Readonly<Record<string, string>>;
  readonly names: readonly string[];
  readonly nonZeroValues: number;
}
interface EncodedCandidate extends Omit<CacheCandidate, "raw"> { readonly raw: readonly (readonly [number, number])[] }
interface EncodedPosition extends Omit<CachePosition, "candidates"> { readonly candidates: readonly EncodedCandidate[] }
interface ModelPosition {
  readonly source: CachePosition;
  readonly playedIndex: number;
  readonly candidates: readonly Sparse[];
}
interface Preprocessing {
  readonly names: readonly string[];
  readonly means: readonly number[];
  readonly deviations: readonly number[];
  readonly blockScales: readonly number[];
}
interface Prepared { readonly positions: readonly ModelPosition[]; readonly preprocessing: Preprocessing }
interface ChoiceMeasure {
  readonly id: string;
  readonly gameId: string;
  readonly playedMass: number;
  readonly crossEntropy: number;
  readonly topAgreement: number;
  readonly expectedLossCp: number;
  readonly severe250: number;
}

function rounded(value: number): number { return Number(value.toFixed(6)); }
function digest(value: unknown): string { return `sha256:${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`; }
function readCache(path: string): Cache {
  const text = readFileSync(path, "utf8");
  const [headerLine, ...positionLines] = text.trim().split("\n");
  const header = JSON.parse(headerLine!) as CacheHeader;
  const positions = positionLines.map((line): CachePosition => {
    const encoded = JSON.parse(line) as EncodedPosition;
    return {
      ...encoded,
      candidates: encoded.candidates.map((candidate) => ({
        ...candidate,
        raw: candidate.raw.map(([index, value]) => {
          const name = header.names[index];
          if (name === undefined) throw new Error(`feature index ${String(index)} escaped vocabulary`);
          return [name, value] as const;
        }),
      })),
    };
  });
  return { ...header, positions, vocabularySize: header.names.length, cacheDigest: `sha256:${createHash("sha256").update(text).digest("hex")}` };
}
function projectionFor(name: string): string {
  if (name === "num:engine.loss_cp") return "engine";
  return /^[^:]+:(.+?@\d+)/u.exec(name)?.[1] ?? `unscoped:${name}`;
}
const RAW_MAPS = new WeakMap<object, ReadonlyMap<string, number>>();
function candidateRaw(candidate: CacheCandidate): ReadonlyMap<string, number> {
  const cached = RAW_MAPS.get(candidate);
  if (cached !== undefined) return cached;
  const created = new Map(candidate.raw);
  RAW_MAPS.set(candidate, created);
  return created;
}
function rawValue(position: CachePosition, candidate: CacheCandidate, name: string): number {
  return name === "num:engine.loss_cp" ? Math.max(...position.candidates.map((row) => row.scoreCp)) - candidate.scoreCp :
    candidateRaw(candidate).get(name) ?? 0;
}
function prepare(cache: Cache, trainingFolds: ReadonlySet<number>, arm: Arm, transform: Transform): Prepared {
  const training = cache.positions.filter((position) => trainingFolds.has(position.fold));
  const categoricalPositions = new Map<string, Set<string>>();
  const admitted = new Set<string>();
  for (const position of training) for (const candidate of position.candidates) for (const [name] of candidate.raw) {
    if (name.startsWith("cat:")) {
      const found = categoricalPositions.get(name) ?? new Set<string>();
      found.add(position.fen);
      categoricalPositions.set(name, found);
    } else admitted.add(name);
  }
  const minimum = Math.ceil(training.length * 0.05);
  for (const [name, fens] of categoricalPositions) if (fens.size >= minimum) admitted.add(name);
  if (arm !== "evidence") admitted.add("num:engine.loss_cp");
  if (arm === "engine") for (const name of [...admitted]) if (name !== "num:engine.loss_cp") admitted.delete(name);
  const names = [...admitted].sort();
  const nameIndex = new Map(names.map((name, index) => [name, index]));
  const means = Array.from({ length: names.length }, () => 0);
  const deviations = Array.from({ length: names.length }, () => 1);
  const trainingCandidates = training.flatMap((position) => position.candidates.map((candidate) => ({ position, candidate })));
  for (let index = 0; index < names.length; index += 1) if (names[index]!.startsWith("num:")) {
    const values = trainingCandidates.map(({ position, candidate }) => rawValue(position, candidate, names[index]!));
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length - 1));
    means[index] = mean;
    deviations[index] = deviation || 1;
  }
  const blockCounts = new Map<string, number>();
  for (const name of names) {
    const projection = projectionFor(name);
    if (projection !== "engine") blockCounts.set(projection, (blockCounts.get(projection) ?? 0) + 1);
  }
  const blockScales = names.map((name) => {
    const projection = projectionFor(name);
    return transform === "projection-balanced" && projection !== "engine" ? 1 / Math.sqrt(blockCounts.get(projection) ?? 1) : 1;
  });
  const positions = cache.positions.map((position): ModelPosition => {
    const playedIndex = position.candidates.findIndex((candidate) => candidate.moveUci === position.playedUci);
    if (playedIndex < 0) throw new Error(`played move absent at ${position.id}`);
    return {
      source: position,
      playedIndex,
      candidates: position.candidates.map((candidate) => {
        const sparse: [number, number][] = [];
        for (const name of names) {
          const index = nameIndex.get(name)!;
          let value = rawValue(position, candidate, name);
          if (name.startsWith("num:")) value = Math.max(-8, Math.min(8, (value - means[index]!) / deviations[index]!));
          value *= blockScales[index]!;
          if (value !== 0) sparse.push([index, value]);
        }
        return sparse;
      }),
    };
  });
  return { positions, preprocessing: { names, means, deviations, blockScales } };
}
function dot(weights: Float64Array, values: Sparse): number {
  let result = 0;
  for (const [index, value] of values) result += weights[index]! * value;
  return result;
}
function probabilities(position: ModelPosition, weights: Float64Array): readonly number[] {
  const scores = position.candidates.map((candidate) => dot(weights, candidate));
  const maximum = Math.max(...scores);
  const exp = scores.map((score) => Math.exp(score - maximum));
  const total = exp.reduce((sum, value) => sum + value, 0);
  const result = exp.map((value) => value / total);
  if (result.some((value) => !Number.isFinite(value))) throw new Error(`non-finite probability at ${position.source.id}`);
  return result;
}
function objective(rows: readonly ModelPosition[], weights: Float64Array, lambda: number, gradient?: Float64Array): number {
  if (gradient !== undefined) gradient.fill(0);
  const byGame = new Map<string, number>();
  for (const row of rows) byGame.set(row.source.gameId, (byGame.get(row.source.gameId) ?? 0) + 1);
  const gameCount = byGame.size;
  let loss = 0;
  for (const row of rows) {
    const rowWeight = 1 / (gameCount * byGame.get(row.source.gameId)!);
    const predicted = probabilities(row, weights);
    loss -= rowWeight * Math.log(Math.max(1e-300, predicted[row.playedIndex]!));
    if (gradient !== undefined) {
      for (let candidateIndex = 0; candidateIndex < row.candidates.length; candidateIndex += 1) {
        const multiplier = rowWeight * (predicted[candidateIndex]! - (candidateIndex === row.playedIndex ? 1 : 0));
        for (const [featureIndex, value] of row.candidates[candidateIndex]!) gradient[featureIndex] += multiplier * value;
      }
    }
  }
  for (let index = 0; index < weights.length; index += 1) {
    loss += lambda * weights[index]! * weights[index]! / 2;
    if (gradient !== undefined) gradient[index] += lambda * weights[index]!;
  }
  if (!Number.isFinite(loss)) throw new Error("non-finite conditional-choice objective");
  return loss;
}
function vectorDot(left: Float64Array, right: Float64Array): number {
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result += left[index]! * right[index]!;
  return result;
}
function addScaled(base: Float64Array, direction: Float64Array, scale: number): Float64Array {
  return Float64Array.from(base, (value, index) => value + scale * direction[index]!);
}
function fit(rows: readonly ModelPosition[], featureCount: number, lambda: number, iterations = 80): { readonly weights: Float64Array; readonly initialLoss: number; readonly finalLoss: number; readonly iterations: number; readonly gradientInfinity: number } {
  const weights = new Float64Array(featureCount);
  const gradient = new Float64Array(featureCount);
  let loss = objective(rows, weights, lambda, gradient);
  const initialLoss = loss;
  const history: { readonly s: Float64Array; readonly y: Float64Array; readonly rho: number }[] = [];
  let completed = 0;
  for (; completed < iterations; completed += 1) {
    if (Math.max(...gradient.map(Math.abs)) <= 1e-6) break;
    const q = Float64Array.from(gradient);
    const alphas: number[] = [];
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const item = history[index]!;
      const alpha = item.rho * vectorDot(item.s, q);
      alphas[index] = alpha;
      for (let feature = 0; feature < q.length; feature += 1) q[feature] -= alpha * item.y[feature]!;
    }
    const latest = history.at(-1);
    const scale = latest === undefined ? 1 : vectorDot(latest.s, latest.y) / Math.max(1e-12, vectorDot(latest.y, latest.y));
    const direction = Float64Array.from(q, (value) => value * scale);
    for (let index = 0; index < history.length; index += 1) {
      const item = history[index]!;
      const beta = item.rho * vectorDot(item.y, direction);
      for (let feature = 0; feature < direction.length; feature += 1) direction[feature] += item.s[feature]! * (alphas[index]! - beta);
    }
    for (let feature = 0; feature < direction.length; feature += 1) direction[feature] = -direction[feature]!;
    let directional = vectorDot(gradient, direction);
    if (!(directional < 0)) {
      for (let feature = 0; feature < direction.length; feature += 1) direction[feature] = -gradient[feature]!;
      directional = -vectorDot(gradient, gradient);
    }
    let step = 1;
    let nextWeights = addScaled(weights, direction, step);
    let nextLoss = objective(rows, nextWeights, lambda);
    let searches = 0;
    while (nextLoss > loss + 1e-4 * step * directional && searches < 20) {
      step *= 0.5;
      nextWeights = addScaled(weights, direction, step);
      nextLoss = objective(rows, nextWeights, lambda);
      searches += 1;
    }
    if (!(nextLoss < loss) || !Number.isFinite(nextLoss)) throw new Error("L-BFGS line search failed to decrease objective");
    const nextGradient = new Float64Array(featureCount);
    objective(rows, nextWeights, lambda, nextGradient);
    const s = Float64Array.from(weights, (value, index) => nextWeights[index]! - value);
    const y = Float64Array.from(gradient, (value, index) => nextGradient[index]! - value);
    const curvature = vectorDot(s, y);
    if (curvature > 1e-12) {
      history.push({ s, y, rho: 1 / curvature });
      if (history.length > 10) history.shift();
    }
    weights.set(nextWeights);
    gradient.set(nextGradient);
    loss = nextLoss;
    if (weights.some((value) => !Number.isFinite(value))) throw new Error("non-finite conditional-choice coefficient");
  }
  return { weights, initialLoss, finalLoss: loss, iterations: completed, gradientInfinity: Math.max(...gradient.map(Math.abs)) };
}
function measures(prepared: Prepared, weights: Float64Array, folds: ReadonlySet<number>): readonly ChoiceMeasure[] {
  return prepared.positions.filter((row) => folds.has(row.source.fold)).map((row) => {
    const predicted = probabilities(row, weights);
    const bestCp = Math.max(...row.source.candidates.map((candidate) => candidate.scoreCp));
    let expectedLossCp = 0;
    let severe250 = 0;
    for (let index = 0; index < predicted.length; index += 1) {
      const loss = bestCp - row.source.candidates[index]!.scoreCp;
      expectedLossCp += predicted[index]! * loss;
      if (loss > 250) severe250 += predicted[index]!;
    }
    return {
      id: row.source.id,
      gameId: row.source.gameId,
      playedMass: predicted[row.playedIndex]!,
      crossEntropy: -Math.log(Math.max(1e-300, predicted[row.playedIndex]!)),
      topAgreement: predicted.indexOf(Math.max(...predicted)) === row.playedIndex ? 1 : 0,
      expectedLossCp,
      severe250,
    };
  });
}
function gameMetric(rows: readonly ChoiceMeasure[], key: keyof Pick<ChoiceMeasure, "playedMass" | "crossEntropy" | "topAgreement" | "expectedLossCp" | "severe250">): number {
  const games = new Map<string, number[]>();
  for (const row of rows) {
    const found = games.get(row.gameId) ?? [];
    found.push(row[key]);
    games.set(row.gameId, found);
  }
  const means = [...games.values()].map((values) => values.reduce((sum, value) => sum + value, 0) / values.length);
  return means.reduce((sum, value) => sum + value, 0) / means.length;
}
function quantile(values: readonly number[], probability: number): number {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.floor(probability * ordered.length))]!;
}
function summarize(rows: readonly ChoiceMeasure[]) {
  const mass = rows.map((row) => row.playedMass);
  return {
    games: new Set(rows.map((row) => row.gameId)).size,
    decisions: rows.length,
    playedMass: rounded(gameMetric(rows, "playedMass")),
    crossEntropy: rounded(gameMetric(rows, "crossEntropy")),
    topAgreement: rounded(gameMetric(rows, "topAgreement")),
    expectedLossCp: rounded(gameMetric(rows, "expectedLossCp")),
    severe250: rounded(gameMetric(rows, "severe250")),
    playedMassTail: {
      minimum: rounded(Math.min(...mass)), p10: rounded(quantile(mass, 0.1)), median: rounded(quantile(mass, 0.5)), p90: rounded(quantile(mass, 0.9)), maximum: rounded(Math.max(...mass)),
      below1e6: rounded(mass.filter((value) => value < 1e-6).length / mass.length),
      below1e4: rounded(mass.filter((value) => value < 1e-4).length / mass.length),
      below1e2: rounded(mass.filter((value) => value < 1e-2).length / mass.length),
    },
  };
}
function baselineUniform(cache: Cache, folds: ReadonlySet<number>): readonly ChoiceMeasure[] {
  const prepared = prepare(cache, TRAIN_FOLDS, "engine", "raw");
  return prepared.positions.filter((row) => folds.has(row.source.fold)).map((row) => {
    const predicted = Array.from({ length: row.candidates.length }, () => 1 / row.candidates.length);
    const bestCp = Math.max(...row.source.candidates.map((candidate) => candidate.scoreCp));
    let expectedLossCp = 0;
    let severe250 = 0;
    for (let index = 0; index < predicted.length; index += 1) {
      const loss = bestCp - row.source.candidates[index]!.scoreCp;
      expectedLossCp += predicted[index]! * loss;
      if (loss > 250) severe250 += predicted[index]!;
    }
    return { id: row.source.id, gameId: row.source.gameId, playedMass: predicted[row.playedIndex]!, crossEntropy: -Math.log(predicted[row.playedIndex]!), topAgreement: 0, expectedLossCp, severe250 };
  });
}
function eligible(summary: Readonly<Record<string, ReturnType<typeof summarize>>>): boolean {
  return summary.evidence!.crossEntropy < summary.uniform!.crossEntropy &&
    summary.combined!.crossEntropy < summary.engine!.crossEntropy &&
    summary.combined!.expectedLossCp - summary.engine!.expectedLossCp <= 35 &&
    summary.combined!.severe250 - summary.engine!.severe250 <= 0.01 &&
    summary.combined!.topAgreement >= summary.engine!.topAgreement - 0.05;
}
function run(cache: Cache) {
  if (cache.schema !== "tabiya.research.d1297-feature-cache.v1" || cache.representationCommit !== "633f541e245edd1737ee9224c6ed90c26fa009a9") throw new Error("feature cache identity changed");
  const validationFold = new Set([3]);
  const confirmationFold = new Set([4]);
  const tuning: Record<string, readonly { readonly transform: Transform; readonly lambda: number; readonly crossEntropy: number }[]> = {};
  const selected: Record<Arm, { readonly transform: Transform; readonly lambda: number }> = {} as Record<Arm, { readonly transform: Transform; readonly lambda: number }>;
  for (const arm of ARMS) {
    const transforms: readonly Transform[] = arm === "engine" ? ["raw"] : TRANSFORMS;
    const candidates: { transform: Transform; lambda: number; crossEntropy: number }[] = [];
    for (const transform of transforms) {
      const prepared = prepare(cache, TRAIN_FOLDS, arm, transform);
      const train = prepared.positions.filter((row) => TRAIN_FOLDS.has(row.source.fold));
      for (const lambda of LAMBDAS) {
        const fitted = fit(train, prepared.preprocessing.names.length, lambda);
        candidates.push({ transform, lambda, crossEntropy: gameMetric(measures(prepared, fitted.weights, validationFold), "crossEntropy") });
      }
    }
    candidates.sort((left, right) => left.crossEntropy - right.crossEntropy || right.lambda - left.lambda ||
      (left.transform === right.transform ? 0 : left.transform === "projection-balanced" ? -1 : 1));
    tuning[arm] = candidates.map((row) => ({ transform: row.transform, lambda: row.lambda, crossEntropy: rounded(row.crossEntropy) }));
    selected[arm] = { transform: candidates[0]!.transform, lambda: candidates[0]!.lambda };
  }
  const evaluate = (trainingFolds: ReadonlySet<number>, evaluationFolds: ReadonlySet<number>) => {
    const result: Record<string, ReturnType<typeof summarize>> = { uniform: summarize(baselineUniform(cache, evaluationFolds)) };
    for (const arm of ARMS) {
      const choice = selected[arm]!;
      const prepared = prepare(cache, trainingFolds, arm, choice.transform);
      const fitted = fit(prepared.positions.filter((row) => trainingFolds.has(row.source.fold)), prepared.preprocessing.names.length, choice.lambda);
      result[arm] = summarize(measures(prepared, fitted.weights, evaluationFolds));
    }
    return result;
  };
  const validation = evaluate(TRAIN_FOLDS, validationFold);
  const confirmation = evaluate(TRAIN_VALIDATION_FOLDS, confirmationFold);
  const frozenModels: Record<string, unknown> = {};
  for (const arm of ARMS) {
    const choice = selected[arm]!;
    const prepared = prepare(cache, ALL_FOLDS, arm, choice.transform);
    const fitted = fit(prepared.positions, prepared.preprocessing.names.length, choice.lambda);
    const model = { arm, ...choice, preprocessing: prepared.preprocessing, weights: [...fitted.weights].map(rounded), optimization: { initialLoss: rounded(fitted.initialLoss), finalLoss: rounded(fitted.finalLoss), iterations: fitted.iterations, gradientInfinity: rounded(fitted.gradientInfinity) } };
    frozenModels[arm] = { ...model, digest: digest(model) };
  }
  const freeze = eligible(validation) && eligible(confirmation);
  return {
    measuredAt: new Date().toISOString(), cache: { digest: cache.cacheDigest, representationCommit: cache.representationCommit, inputs: cache.inputs, games: new Set(cache.positions.map((row) => row.gameId)).size, decisions: cache.positions.length, candidates: cache.positions.reduce((sum, row) => sum + row.candidates.length, 0), vocabularySize: cache.vocabularySize, nonZeroValues: cache.nonZeroValues },
    optimizer: { kind: "conditional_logit_lbfgs", memory: 10, maxIterations: 80, gradientInfinityTolerance: 1e-6, armijo: 1e-4, backtracking: 0.5, maxLineSearchSteps: 20, lambdas: LAMBDAS },
    split: { train: [0, 1, 2], validation: 3, confirmation: 4 },
    tuning, selected, validation, confirmation, freeze, frozenModels,
  };
}
function markdown(result: ReturnType<typeof run>): string {
  const row = (name: string, values: ReturnType<typeof summarize>) => `| ${name} | ${values.crossEntropy.toFixed(6)} | ${(100 * values.topAgreement).toFixed(1)}% | ${values.expectedLossCp.toFixed(1)} | ${(100 * values.severe250).toFixed(1)}% |`;
  const optimization = Object.entries(result.frozenModels).map(([name, value]) => {
    const model = value as { readonly transform: string; readonly lambda: number; readonly optimization: { readonly iterations: number; readonly gradientInfinity: number } };
    return `| ${name} | ${model.transform} | ${model.lambda} | ${model.optimization.iterations} | ${model.optimization.gradientInfinity.toExponential(3)} |`;
  }).join("\n");
  return `# D1297 proper-score selector development\n\nFreeze verdict: **${result.freeze ? "eligible" : "refuted"}**. This is seen-population development, not final clearance.\n\nThe proper model repairs D1297's probability-tail pathology, but the combined arm exceeds the independently declared severe-loss budget on both held-out folds. No third population was opened.\n\n## Validation\n\n| arm | cross entropy | top choice | expected loss cp | >250 cp mass |\n|---|---:|---:|---:|---:|\n${Object.entries(result.validation).map(([name, values]) => row(name, values)).join("\n")}\n\n## Once-read confirmation\n\n| arm | cross entropy | top choice | expected loss cp | >250 cp mass |\n|---|---:|---:|---:|---:|\n${Object.entries(result.confirmation).map(([name, values]) => row(name, values)).join("\n")}\n\n## Full-development optimizer audit\n\n| arm | transform | lambda | iterations | final gradient infinity norm |\n|---|---|---:|---:|---:|\n${optimization}\n\nThe engine fit met the stopping target. Evidence and combined reached the declared 80-iteration bound above the \`1e-6\` tolerance; because the freeze gate already failed, none is promoted as a frozen production model.\n`;
}

function applyGuard(probability: readonly number[], lossCp: readonly number[]) {
  const admitted = lossCp.map((loss) => loss <= 250);
  const retained = probability.reduce((sum, value, index) => sum + (admitted[index] ? value : 0), 0);
  if (!(retained > 0)) throw new Error("D1312 guard retained no probability mass");
  const normalized = probability.map((value, index) => admitted[index] ? value / retained : 0);
  if (normalized.some((value) => !Number.isFinite(value))) throw new Error("D1312 guard emitted non-finite probability");
  return { admitted, probability: normalized, removedMass: 1 - retained };
}

function groupedScalarMean(rows: readonly { readonly gameId: string; readonly value: number }[]): number {
  const games = new Map<string, number[]>();
  for (const row of rows) {
    const found = games.get(row.gameId) ?? [];
    found.push(row.value);
    games.set(row.gameId, found);
  }
  const means = [...games.values()].map((values) => values.reduce((sum, value) => sum + value, 0) / values.length);
  return means.reduce((sum, value) => sum + value, 0) / means.length;
}

function guardDevelopment(cache: Cache) {
  if (cache.schema !== "tabiya.research.d1297-feature-cache.v1" || cache.representationCommit !== "633f541e245edd1737ee9224c6ed90c26fa009a9") throw new Error("D1312 feature cache identity changed");
  const choices = {
    engine: { transform: "raw" as const, lambda: 0.01 },
    combined: { transform: "projection-balanced" as const, lambda: 0.01 },
  };
  const evaluate = (label: "validation" | "confirmation", trainingFolds: ReadonlySet<number>, evaluationFold: number) => {
    const fitted = Object.fromEntries((Object.keys(choices) as (keyof typeof choices)[]).map((arm) => {
      const choice = choices[arm];
      const prepared = prepare(cache, trainingFolds, arm, choice.transform);
      const training = prepared.positions.filter((row) => trainingFolds.has(row.source.fold));
      const model = fit(training, prepared.preprocessing.names.length, choice.lambda);
      return [arm, { choice, prepared, model }];
    })) as Record<keyof typeof choices, { readonly choice: (typeof choices)[keyof typeof choices]; readonly prepared: Prepared; readonly model: ReturnType<typeof fit> }>;
    const engineRows = fitted.engine.prepared.positions.filter((row) => row.source.fold === evaluationFold);
    const combinedRows = fitted.combined.prepared.positions.filter((row) => row.source.fold === evaluationFold);
    if (engineRows.length !== combinedRows.length || engineRows.some((row, index) => row.source.id !== combinedRows[index]!.source.id)) throw new Error(`${label} arm populations diverged`);

    const admittedHuman: { source: CachePosition; admitted: boolean }[] = [];
    const survivorCounts: number[] = [];
    const guardedMeasures: Record<keyof typeof choices, ChoiceMeasure[]> = { engine: [], combined: [] };
    const removedMass: Record<keyof typeof choices, { gameId: string; value: number }[]> = { engine: [], combined: [] };
    for (let rowIndex = 0; rowIndex < engineRows.length; rowIndex += 1) {
      const engineRow = engineRows[rowIndex]!;
      const combinedRow = combinedRows[rowIndex]!;
      const bestCp = Math.max(...engineRow.source.candidates.map((candidate) => candidate.scoreCp));
      const losses = engineRow.source.candidates.map((candidate) => bestCp - candidate.scoreCp);
      const survivors = losses.filter((loss) => loss <= 250).length;
      if (survivors === 0) throw new Error(`D1312 empty guard mask at ${engineRow.source.id}`);
      survivorCounts.push(survivors);
      const playedAdmitted = losses[engineRow.playedIndex]! <= 250;
      admittedHuman.push({ source: engineRow.source, admitted: playedAdmitted });
      for (const arm of Object.keys(choices) as (keyof typeof choices)[]) {
        const row = arm === "engine" ? engineRow : combinedRow;
        const raw = probabilities(row, fitted[arm].model.weights);
        const guarded = applyGuard(raw, losses);
        removedMass[arm].push({ gameId: row.source.gameId, value: guarded.removedMass });
        if (!playedAdmitted) continue;
        let expectedLossCp = 0;
        for (let index = 0; index < guarded.probability.length; index += 1) expectedLossCp += guarded.probability[index]! * losses[index]!;
        guardedMeasures[arm].push({
          id: row.source.id,
          gameId: row.source.gameId,
          playedMass: guarded.probability[row.playedIndex]!,
          crossEntropy: -Math.log(guarded.probability[row.playedIndex]!),
          topAgreement: guarded.probability.indexOf(Math.max(...guarded.probability)) === row.playedIndex ? 1 : 0,
          expectedLossCp,
          severe250: 0,
        });
      }
    }
    const survivalGroups = (key: "ratingBand" | "speed" | "ply") => Object.fromEntries([...new Set(admittedHuman.map((row) => String(row.source[key])))].sort().map((value) => {
      const rows = admittedHuman.filter((row) => String(row.source[key]) === value);
      const admitted = rows.filter((row) => row.admitted).length;
      return [value, { decisions: rows.length, admitted, rate: rounded(admitted / rows.length) }];
    }));
    const admitted = admittedHuman.filter((row) => row.admitted).length;
    const survival = {
      pooled: { decisions: admittedHuman.length, admitted, rate: rounded(admitted / admittedHuman.length) },
      ratingBand: survivalGroups("ratingBand"),
      speed: survivalGroups("speed"),
      ply: survivalGroups("ply"),
    };
    const guarded = { engine: summarize(guardedMeasures.engine), combined: summarize(guardedMeasures.combined) };
    const gate = {
      pooledHumanSurvival: survival.pooled.rate >= 0.9,
      ratingBandFloor: Object.values(survival.ratingBand).every((row) => row.rate >= 0.85),
      conditionalCrossEntropy: guarded.combined.crossEntropy < guarded.engine.crossEntropy,
      expectedLoss: guarded.combined.expectedLossCp - guarded.engine.expectedLossCp <= 35,
      topChoice: guarded.combined.topAgreement >= guarded.engine.topAgreement - 0.05,
      nonemptyMask: survivorCounts.every((count) => count > 0),
    };
    return {
      survival,
      survivorCounts: {
        minimum: Math.min(...survivorCounts),
        median: quantile(survivorCounts, 0.5),
        p90: quantile(survivorCounts, 0.9),
        maximum: Math.max(...survivorCounts),
        singletonRate: rounded(survivorCounts.filter((count) => count === 1).length / survivorCounts.length),
      },
      arms: Object.fromEntries((Object.keys(choices) as (keyof typeof choices)[]).map((arm) => [arm, {
        unguarded: summarize(measures(fitted[arm].prepared, fitted[arm].model.weights, new Set([evaluationFold]))),
        guardedConditional: guarded[arm],
        removedMass: rounded(groupedScalarMean(removedMass[arm])),
        optimization: {
          iterations: fitted[arm].model.iterations,
          gradientInfinity: rounded(fitted[arm].model.gradientInfinity),
          finalLoss: rounded(fitted[arm].model.finalLoss),
        },
        modelDigest: digest({ choice: choices[arm], preprocessing: fitted[arm].prepared.preprocessing, weights: [...fitted[arm].model.weights].map(rounded) }),
      }])),
      gate,
      eligible: Object.values(gate).every(Boolean),
    };
  };
  const validation = evaluate("validation", TRAIN_FOLDS, 3);
  const confirmation = evaluate("confirmation", TRAIN_VALIDATION_FOLDS, 4);
  return {
    schema: "tabiya.research.d1312-guard-composition.v1",
    measuredAt: new Date().toISOString(),
    cache: { digest: cache.cacheDigest, representationCommit: cache.representationCommit, games: new Set(cache.positions.map((row) => row.gameId)).size, decisions: cache.positions.length },
    guard: { thresholdCp: 250, inclusive: true, fallbackPermitted: false },
    validation,
    confirmation,
    eligible: validation.eligible && confirmation.eligible,
  };
}

function guardMarkdown(result: ReturnType<typeof guardDevelopment>): string {
  const rows = (["validation", "confirmation"] as const).map((fold) => {
    const value = result[fold];
    return `| ${fold} | ${value.survival.pooled.admitted}/${value.survival.pooled.decisions} (${(100 * value.survival.pooled.rate).toFixed(1)}%) | ${value.arms.engine.guardedConditional.crossEntropy.toFixed(6)} | ${value.arms.combined.guardedConditional.crossEntropy.toFixed(6)} | ${value.arms.engine.removedMass.toFixed(4)} | ${value.arms.combined.removedMass.toFixed(4)} | ${value.eligible ? "pass" : "fail"} |`;
  }).join("\n");
  const bands = (["validation", "confirmation"] as const).flatMap((fold) => Object.entries(result[fold].survival.ratingBand).map(([band, value]) => `| ${fold} | ${band} | ${value.admitted}/${value.decisions} | ${(100 * value.rate).toFixed(1)}% |`)).join("\n");
  const failures = (["validation", "confirmation"] as const).map((fold) => {
    const failed = Object.entries(result[fold].gate).filter(([, passed]) => !passed).map(([name]) => name);
    return `- ${fold}: ${failed.length === 0 ? "none" : failed.join(", ")}`;
  }).join("\n");
  return `# D1312 declared error-guard composition\n\nDevelopment verdict: **${result.eligible ? "eligible" : "refuted"}**. This does not read the reserved third population.\n\n| fold | observed moves admitted | guarded engine CE | guarded combined CE | engine mass removed | combined mass removed | gate |\n|---|---:|---:|---:|---:|---:|---|\n${rows}\n\n## Rating-band survival\n\n| fold | rating band | admitted | rate |\n|---|---|---:|---:|\n${bands}\n\n## Failed clauses\n\n${failures}\n\nCross entropy is conditional on the observed move surviving the declared 250-cp mask. Excluded human moves are explicit refusals, not epsilon-smoothed predictions. Because different able-to-fail clauses fail on the two folds, this exact composition is returned rather than retuned. D1320 requires an owner/RFC disposition before the standing non-Maia-base goal can leave the 1.0 roster.\n`;
}

describe("D1297 proper-score development", () => {
  it("checks the analytic gradient and learns a monotone synthetic choice", () => {
    const source = { id: "p", gameId: "g", fold: 0, candidates: [{ scoreCp: 0 }, { scoreCp: 0 }] } as unknown as CachePosition;
    const row: ModelPosition = { source, playedIndex: 0, candidates: [[[0, 1]], []] };
    const weights = new Float64Array([0.2]);
    const gradient = new Float64Array(1);
    objective([row], weights, 0.01, gradient);
    const epsilon = 1e-6;
    const plus = objective([row], new Float64Array([weights[0]! + epsilon]), 0.01);
    const minus = objective([row], new Float64Array([weights[0]! - epsilon]), 0.01);
    expect(gradient[0]).toBeCloseTo((plus - minus) / (2 * epsilon), 6);
    const fitted = fit([row], 1, 0.01, 80);
    expect(fitted.finalLoss).toBeLessThan(fitted.initialLoss);
    expect(fitted.gradientInfinity).toBeLessThan(1e-6);
    expect(fitted.weights[0]).toBeGreaterThan(0);
    expect(probabilities(row, fitted.weights)[0]).toBeGreaterThan(0.5);
  });

  it.skipIf(INPUT === undefined)("runs the bounded seen-population development", () => {
    const cache = readCache(INPUT!);
    const result = run(cache);
    expect(result.cache).toMatchObject({ games: 108, decisions: 515 });
    if (WRITE) {
      writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(REPORT, markdown(result));
    }
  });
});

describe("D1312 declared error-guard composition", () => {
  it("keeps the inclusive boundary, renormalizes, and refuses an empty mask", () => {
    const result = applyGuard([0.2, 0.3, 0.5], [0, 250, 251]);
    expect(result.admitted).toEqual([true, true, false]);
    expect(result.probability).toEqual([0.4, 0.6, 0]);
    expect(result.removedMass).toBeCloseTo(0.5);
    expect(() => applyGuard([0.5, 0.5], [251, 300])).toThrow("retained no probability mass");
  });

  it.skipIf(GUARD_INPUT === undefined)("measures the fixed composition on both held-out folds", () => {
    const cache = readCache(GUARD_INPUT!);
    const result = guardDevelopment(cache);
    expect(result.cache).toMatchObject({ games: 108, decisions: 515 });
    if (GUARD_WRITE) {
      writeFileSync(GUARD_RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(GUARD_REPORT, guardMarkdown(result));
    }
  });
});
