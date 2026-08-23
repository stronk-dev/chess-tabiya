// DISPOSABLE research harness — D1297. Seen-population model development only.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const INPUT = process.env.TABIYA_D1297_FEATURE_CACHE;
const WRITE = process.env.TABIYA_D1297_WRITE === "1";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1297-proper-score-results.json", import.meta.url);
const REPORT = new URL("../../planning/platform-alignment/bot-policy/d1297-proper-score-results.md", import.meta.url);
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
}
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
function fit(rows: readonly ModelPosition[], featureCount: number, lambda: number, updates = 600): Float64Array {
  const weights = new Float64Array(featureCount);
  const first = new Float64Array(featureCount);
  const second = new Float64Array(featureCount);
  const gradient = new Float64Array(featureCount);
  for (let update = 1; update <= updates; update += 1) {
    objective(rows, weights, lambda, gradient);
    const norm = Math.sqrt(gradient.reduce((sum, value) => sum + value * value, 0));
    const scale = norm > 10 ? 10 / norm : 1;
    for (let index = 0; index < weights.length; index += 1) {
      const value = gradient[index]! * scale;
      first[index] = 0.9 * first[index]! + 0.1 * value;
      second[index] = 0.999 * second[index]! + 0.001 * value * value;
      const correctedFirst = first[index]! / (1 - 0.9 ** update);
      const correctedSecond = second[index]! / (1 - 0.999 ** update);
      weights[index] -= 0.03 * correctedFirst / (Math.sqrt(correctedSecond) + 1e-8);
      if (!Number.isFinite(weights[index])) throw new Error("non-finite conditional-choice coefficient");
    }
  }
  return weights;
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
        const weights = fit(train, prepared.preprocessing.names.length, lambda);
        candidates.push({ transform, lambda, crossEntropy: gameMetric(measures(prepared, weights, validationFold), "crossEntropy") });
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
      const weights = fit(prepared.positions.filter((row) => trainingFolds.has(row.source.fold)), prepared.preprocessing.names.length, choice.lambda);
      result[arm] = summarize(measures(prepared, weights, evaluationFolds));
    }
    return result;
  };
  const validation = evaluate(TRAIN_FOLDS, validationFold);
  const confirmation = evaluate(TRAIN_VALIDATION_FOLDS, confirmationFold);
  const frozenModels: Record<string, unknown> = {};
  for (const arm of ARMS) {
    const choice = selected[arm]!;
    const prepared = prepare(cache, ALL_FOLDS, arm, choice.transform);
    const weights = fit(prepared.positions, prepared.preprocessing.names.length, choice.lambda);
    const model = { arm, ...choice, preprocessing: prepared.preprocessing, weights: [...weights].map(rounded) };
    frozenModels[arm] = { ...model, digest: digest(model) };
  }
  const freeze = eligible(validation) && eligible(confirmation);
  return {
    measuredAt: new Date().toISOString(), cache: { digest: digest(cache), representationCommit: cache.representationCommit, inputs: cache.inputs, games: new Set(cache.positions.map((row) => row.gameId)).size, decisions: cache.positions.length },
    optimizer: { kind: "conditional_logit_full_batch_adam", updates: 600, learningRate: 0.03, beta1: 0.9, beta2: 0.999, epsilon: 1e-8, gradientClip: 10, lambdas: LAMBDAS },
    split: { train: [0, 1, 2], validation: 3, confirmation: 4 },
    tuning, selected, validation, confirmation, freeze, frozenModels,
  };
}
function markdown(result: ReturnType<typeof run>): string {
  const row = (name: string, values: ReturnType<typeof summarize>) => `| ${name} | ${values.crossEntropy.toFixed(6)} | ${(100 * values.topAgreement).toFixed(1)}% | ${values.expectedLossCp.toFixed(1)} | ${(100 * values.severe250).toFixed(1)}% |`;
  return `# D1297 proper-score selector development\n\nFreeze verdict: **${result.freeze ? "eligible" : "refuted"}**. This is seen-population development, not final clearance.\n\n## Validation\n\n| arm | cross entropy | top choice | expected loss cp | >250 cp mass |\n|---|---:|---:|---:|---:|\n${Object.entries(result.validation).map(([name, values]) => row(name, values)).join("\n")}\n\n## Once-read confirmation\n\n| arm | cross entropy | top choice | expected loss cp | >250 cp mass |\n|---|---:|---:|---:|---:|\n${Object.entries(result.confirmation).map(([name, values]) => row(name, values)).join("\n")}\n`;
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
    const fitted = fit([row], 1, 0.01, 200);
    expect(fitted[0]).toBeGreaterThan(0);
    expect(probabilities(row, fitted)[0]).toBeGreaterThan(0.5);
  });

  it.skipIf(INPUT === undefined)("runs the bounded seen-population development", () => {
    const cache = JSON.parse(readFileSync(INPUT!, "utf8")) as Cache;
    const result = run(cache);
    expect(result.cache).toMatchObject({ games: 108, decisions: 515 });
    if (WRITE) {
      writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(REPORT, markdown(result));
    }
  });
});
