// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const METRICS = [
  "opening_surprisal",
  "opening_family_entropy",
  "fianchetto_setup_rate",
  "fianchetto_knight_screen_rate",
  "fianchetto_unblock_rate",
  "castle_kingside_rate",
  "castle_queenside_rate",
  "clock_spend_share:opening",
  "clock_spend_share:middlegame",
  "clock_spend_share:endgame",
  "pawn_choice_residual",
  "forcing_choice_residual",
  "center_pawn_choice_residual",
  "early_queen_choice_residual",
  "nonpawn_capture_residual",
  "opponent_reply_breadth_residual",
] as const;
const SIZES = [12, 25, 50, 100, 200] as const;
const CANDIDATES = "/private/tmp/r12-candidate-metrics.json";
const REFERENCE = "/private/tmp/r12-opening-reference.json";
const OUTPUT = "/private/tmp/r12-results.json";

type Metric = typeof METRICS[number];
type Color = "white" | "black";
interface SumCount { sum: number; n: number }
interface GameMetric {
  color: Color;
  eco?: string;
  opening: { key: string; uci: string; band: string }[];
  pairs: Record<string, SumCount>;
}
interface Account {
  id: string;
  band: string;
  medianRating: number;
  games: GameMetric[];
}

const candidateData = JSON.parse(readFileSync(CANDIDATES, "utf8"));
const reference = JSON.parse(readFileSync(REFERENCE, "utf8")).counts;
const accounts: Account[] = candidateData.selected;

function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function quantile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return Number.NaN;
  return sorted[Math.floor((sorted.length - 1) * p)]!;
}

function entropy(values: readonly string[]): number | undefined {
  if (values.length === 0) return undefined;
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  let result = 0;
  for (const count of counts.values()) {
    const p = count / values.length;
    result -= p * Math.log2(p);
  }
  return result;
}

function aggregateColor(account: Account, indices: readonly number[], metric: Metric, color: Color): number | undefined {
  const games = indices.map((index) => account.games[index]!).filter((game) => game.color === color);
  if (games.length === 0) return undefined;
  if (metric === "opening_family_entropy") return entropy(games.flatMap((game) => game.eco === undefined ? [] : [game.eco]));
  if (metric === "opening_surprisal") {
    const values: number[] = [];
    for (const decision of games.flatMap((game) => game.opening)) {
      const row = reference[decision.key]?.[decision.band];
      const count = row?.moves?.[decision.uci] ?? 0;
      if ((row?.total ?? 0) >= 50 && count > 0) values.push(-Math.log2(count / row.total));
    }
    return values.length === 0 ? undefined : values.reduce((a, b) => a + b, 0) / values.length;
  }
  let sum = 0;
  let n = 0;
  for (const game of games) {
    const value = game.pairs[metric];
    if (value === undefined) continue;
    sum += value.sum;
    n += value.n;
  }
  return n === 0 ? undefined : sum / n;
}

function aggregate(account: Account, indices: readonly number[], metric: Metric, color?: Color): number | undefined {
  if (color !== undefined) return aggregateColor(account, indices, metric, color);
  const white = aggregateColor(account, indices, metric, "white");
  const black = aggregateColor(account, indices, metric, "black");
  return white === undefined || black === undefined ? undefined : (white + black) / 2;
}

function ranks(values: readonly number[]): number[] {
  const ordered = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const result = new Array<number>(values.length);
  for (let i = 0; i < ordered.length;) {
    let j = i + 1;
    while (j < ordered.length && ordered[j]!.value === ordered[i]!.value) j += 1;
    const rank = (i + j - 1) / 2;
    for (let k = i; k < j; k += 1) result[ordered[k]!.index] = rank;
    i = j;
  }
  return result;
}

function correlation(xs: readonly number[], ys: readonly number[]): number | undefined {
  if (xs.length < 3 || ys.length !== xs.length) return undefined;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let covariance = 0, vx = 0, vy = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const dx = xs[i]! - mx, dy = ys[i]! - my;
    covariance += dx * dy;
    vx += dx * dx;
    vy += dy * dy;
  }
  return vx === 0 || vy === 0 ? undefined : covariance / Math.sqrt(vx * vy);
}

function spearman(xs: readonly number[], ys: readonly number[]): number | undefined {
  return correlation(ranks(xs), ranks(ys));
}

function rounded(value: number | undefined, digits = 4): number | null {
  return value === undefined || !Number.isFinite(value) ? null : Number(value.toFixed(digits));
}

function stabilityRows(metric: Metric, n: number, group: readonly Account[], color?: Color) {
  const first = Array.from({ length: n }, (_, index) => index).filter((index) => index % 2 === 0);
  const second = Array.from({ length: n }, (_, index) => index).filter((index) => index % 2 === 1);
  const all = Array.from({ length: n }, (_, index) => index);
  const rows = group.map((account) => ({
    account,
    a: aggregate(account, first, metric, color),
    b: aggregate(account, second, metric, color),
    full: aggregate(account, all, metric, color),
  })).filter((row) => row.a !== undefined && row.b !== undefined && row.full !== undefined) as {
    account: Account; a: number; b: number; full: number;
  }[];
  return rows;
}

function basic(metric: Metric, n: number, group: readonly Account[], color?: Color) {
  const rows = stabilityRows(metric, n, group, color);
  const rho = spearman(rows.map((row) => row.a), rows.map((row) => row.b));
  const mad = median(rows.map((row) => Math.abs(row.a - row.b)));
  let same = 0;
  for (const band of [...new Set(rows.map((row) => row.account.band))]) {
    const inBand = rows.filter((row) => row.account.band === band);
    const center = median(inBand.map((row) => row.full));
    same += inBand.filter((row) => (row.a - center) * (row.b - center) >= 0).length;
  }
  const definedShare = rows.length / group.length;
  const sameSide = rows.length === 0 ? 0 : same / rows.length;
  const differenceMax = metric === "opening_family_entropy" || metric === "opening_surprisal" ? 0.5 : 0.15;
  return {
    rows: rows.length,
    definedShare: rounded(definedShare),
    rho: rounded(rho),
    medianAbsoluteDifference: rounded(mad),
    sameSide: rounded(sameSide),
    pass: definedShare >= 0.75 && rho !== undefined && rho >= 0.70 && mad <= differenceMax && sameSide >= 0.75,
  };
}

function evaluate(metric: Metric, n: number) {
  const overall = basic(metric, n, accounts);
  const bands = Object.fromEntries([...new Set(accounts.map((account) => account.band))].map((band) => [
    band,
    basic(metric, n, accounts.filter((account) => account.band === band)),
  ]));
  const colors = { white: basic(metric, n, accounts, "white"), black: basic(metric, n, accounts, "black") };
  const bandPasses = Object.values(bands).filter((row) => row.pass).length;
  const noColorReversal = [colors.white.rho, colors.black.rho].every((rho) => rho !== null && rho >= 0);
  return { overall, bands, colors, bandPasses, noColorReversal, pass: overall.pass && bandPasses >= 2 && noColorReversal };
}

function residualizedVectors(subsets: readonly { account: Account; values: number[] }[]) {
  const dimensions = subsets[0]?.values.length ?? 0;
  const bandMeans = new Map<string, number[]>();
  for (const band of [...new Set(subsets.map((row) => row.account.band))]) {
    const rows = subsets.filter((row) => row.account.band === band);
    bandMeans.set(band, Array.from({ length: dimensions }, (_, j) => rows.reduce((sum, row) => sum + row.values[j]!, 0) / rows.length));
  }
  const residuals = subsets.map((row) => ({
    account: row.account,
    values: row.values.map((value, j) => value - bandMeans.get(row.account.band)![j]!),
  }));
  const scales = Array.from({ length: dimensions }, (_, j) => {
    const values = residuals.map((row) => row.values[j]!);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) || 1;
  });
  return residuals.map((row) => ({ account: row.account, values: row.values.map((value, j) => value / scales[j]!) }));
}

function cosine(a: readonly number[], b: readonly number[]): number {
  const dot = a.reduce((sum, value, i) => sum + value * b[i]!, 0);
  const na = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const nb = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return na === 0 || nb === 0 ? -1 : dot / (na * nb);
}

function solve(matrix: number[][], target: number[]): number[] {
  const a = matrix.map((row, i) => [...row, target[i]!]);
  for (let i = 0; i < a.length; i += 1) {
    let pivot = i;
    for (let j = i + 1; j < a.length; j += 1) if (Math.abs(a[j]![i]!) > Math.abs(a[pivot]![i]!)) pivot = j;
    [a[i], a[pivot]] = [a[pivot]!, a[i]!];
    const divisor = a[i]![i]! || 1e-12;
    for (let k = i; k <= a.length; k += 1) a[i]![k] /= divisor;
    for (let j = 0; j < a.length; j += 1) {
      if (j === i) continue;
      const factor = a[j]![i]!;
      for (let k = i; k <= a.length; k += 1) a[j]![k] -= factor * a[i]![k]!;
    }
  }
  return a.map((row) => row.at(-1)!);
}

function ridge(trainX: readonly number[][], trainY: readonly number[], lambda = 1): number[] {
  const x = trainX.map((row) => [1, ...row]);
  const p = x[0]!.length;
  const matrix = Array.from({ length: p }, (_, i) => Array.from({ length: p }, (_, j) =>
    x.reduce((sum, row) => sum + row[i]! * row[j]!, 0) + (i === j && i > 0 ? lambda : 0)
  ));
  const target = Array.from({ length: p }, (_, i) => x.reduce((sum, row, r) => sum + row[i]! * trainY[r]!, 0));
  return solve(matrix, target);
}

function crossValidatedR2(rows: readonly { account: Account; values: number[] }[]): number | undefined {
  if (rows.length < 10) return undefined;
  const bandRating = new Map<string, number>();
  for (const band of [...new Set(rows.map((row) => row.account.band))]) {
    const inBand = rows.filter((row) => row.account.band === band);
    bandRating.set(band, inBand.reduce((sum, row) => sum + row.account.medianRating, 0) / inBand.length);
  }
  const targets = rows.map((row) => row.account.medianRating - bandRating.get(row.account.band)!);
  const predictions = new Array<number>(rows.length);
  for (let fold = 0; fold < 5; fold += 1) {
    const test = rows.map((row, i) => ({ row, i })).filter(({ row }) => parseInt(row.account.id.slice(0, 8), 16) % 5 === fold);
    const train = rows.map((row, i) => ({ row, i })).filter(({ row }) => parseInt(row.account.id.slice(0, 8), 16) % 5 !== fold);
    if (test.length === 0 || train.length === 0) continue;
    const coefficients = ridge(train.map(({ row }) => row.values), train.map(({ i }) => targets[i]!));
    for (const { row, i } of test) predictions[i] = coefficients[0]! + row.values.reduce((sum, value, j) => sum + value * coefficients[j + 1]!, 0);
  }
  if (predictions.some((value) => value === undefined)) return undefined;
  const mean = targets.reduce((a, b) => a + b, 0) / targets.length;
  const sse = targets.reduce((sum, value, i) => sum + (value - predictions[i]!) ** 2, 0);
  const sst = targets.reduce((sum, value) => sum + (value - mean) ** 2, 0);
  return sst === 0 ? undefined : 1 - sse / sst;
}

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4_294_967_296;
  };
}

function squaredDistance(a: readonly number[], b: readonly number[]): number {
  return a.reduce((sum, value, i) => sum + (value - b[i]!) ** 2, 0);
}

function kmeans(vectors: readonly number[][], k: number, seed: number): number[] {
  const random = rng(seed);
  const centers: number[][] = [vectors[Math.floor(random() * vectors.length)]!.slice()];
  while (centers.length < k) {
    const weights = vectors.map((vector) => Math.min(...centers.map((center) => squaredDistance(vector, center))));
    const total = weights.reduce((a, b) => a + b, 0);
    let target = random() * total;
    let selected = 0;
    for (let i = 0; i < weights.length; i += 1) {
      target -= weights[i]!;
      if (target <= 0) { selected = i; break; }
    }
    centers.push(vectors[selected]!.slice());
  }
  let labels = new Array<number>(vectors.length).fill(0);
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const next = vectors.map((vector) => {
      let best = 0;
      for (let i = 1; i < centers.length; i += 1) {
        if (squaredDistance(vector, centers[i]!) < squaredDistance(vector, centers[best]!)) best = i;
      }
      return best;
    });
    if (iteration > 0 && next.every((label, i) => label === labels[i])) break;
    labels = next;
    for (let cluster = 0; cluster < k; cluster += 1) {
      const rows = vectors.filter((_, i) => labels[i] === cluster);
      centers[cluster] = rows.length === 0
        ? vectors[Math.floor(random() * vectors.length)]!.slice()
        : Array.from({ length: vectors[0]!.length }, (_, j) => rows.reduce((sum, row) => sum + row[j]!, 0) / rows.length);
    }
  }
  return labels;
}

function choose2(n: number): number { return n * (n - 1) / 2; }

function adjustedRand(left: readonly number[], right: readonly number[]): number {
  const n = left.length;
  const leftCounts = new Map<number, number>(), rightCounts = new Map<number, number>(), cells = new Map<string, number>();
  for (let i = 0; i < n; i += 1) {
    leftCounts.set(left[i]!, (leftCounts.get(left[i]!) ?? 0) + 1);
    rightCounts.set(right[i]!, (rightCounts.get(right[i]!) ?? 0) + 1);
    const key = `${left[i]}:${right[i]}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  const cellPairs = [...cells.values()].reduce((sum, count) => sum + choose2(count), 0);
  const leftPairs = [...leftCounts.values()].reduce((sum, count) => sum + choose2(count), 0);
  const rightPairs = [...rightCounts.values()].reduce((sum, count) => sum + choose2(count), 0);
  const totalPairs = choose2(n);
  const expected = totalPairs === 0 ? 0 : leftPairs * rightPairs / totalPairs;
  const maximum = (leftPairs + rightPairs) / 2;
  return maximum === expected ? 1 : (cellPairs - expected) / (maximum - expected);
}

function clusterStability(complete: readonly Account[], retained: readonly Metric[]) {
  const all = Array.from({ length: 200 }, (_, i) => i);
  const baselineRows = residualizedVectors(complete.map((account) => ({
    account,
    values: retained.map((metric) => aggregate(account, all, metric)!),
  })));
  const results = [];
  for (let k = 4; k <= 12; k += 1) {
    const baseline = kmeans(baselineRows.map((row) => row.values), k, 12_082_026 + k);
    const clusterSizes = Array.from({ length: k }, (_, cluster) => baseline.filter((label) => label === cluster).length);
    const aris: number[] = [];
    const random = rng(12_082_026 + k * 1000);
    for (let repeat = 0; repeat < 100; repeat += 1) {
      const sampledIndices = Array.from({ length: complete.length }, () => Math.floor(random() * complete.length));
      const sampled = sampledIndices.map((accountIndex) => {
        const account = complete[accountIndex]!;
        const gameIndices = Array.from({ length: 200 }, () => Math.floor(random() * 200));
        return { account, values: retained.map((metric) => aggregate(account, gameIndices, metric)!) };
      });
      const vectors = residualizedVectors(sampled);
      const labels = kmeans(vectors.map((row) => row.values), k, 12_082_026 + k * 1000 + repeat + 1);
      aris.push(adjustedRand(sampledIndices.map((index) => baseline[index]!), labels));
    }
    const medianAri = median(aris);
    const minimumShare = Math.min(...clusterSizes) / complete.length;
    results.push({ k, medianAri: rounded(medianAri), minimumShare: rounded(minimumShare), pass: medianAri >= 0.70 && minimumShare >= 0.05 });
  }
  return results;
}

describe("R12 player-style stability", () => {
  it("applies every predeclared gate without naming archetypes", () => {
    const stability = Object.fromEntries(METRICS.map((metric) => {
      const sizes = Object.fromEntries(SIZES.map((n) => [n, evaluate(metric, n)]));
      const minimum = SIZES.find((n) => sizes[n].pass);
      const persistentMinimum = SIZES.find((n, index) => SIZES.slice(index).every((larger) => sizes[larger].pass));
      return [metric, { predeclaredMinimum: minimum ?? null, persistentMinimum: persistentMinimum ?? null, sizes }];
    }));
    const retained = METRICS.filter((metric) => stability[metric].persistentMinimum !== null);
    const even = Array.from({ length: 200 }, (_, i) => i).filter((i) => i % 2 === 0);
    const odd = Array.from({ length: 200 }, (_, i) => i).filter((i) => i % 2 === 1);
    const all = Array.from({ length: 200 }, (_, i) => i);
    const complete = accounts.filter((account) => retained.every((metric) =>
      aggregate(account, even, metric) !== undefined && aggregate(account, odd, metric) !== undefined
    ));
    let selfReidentification: number | null = null;
    let shuffledSelfReidentification: number | null = null;
    let ratingLeakageR2: number | null = null;
    let ratingPositiveControlR2: number | null = null;
    let clustering: ReturnType<typeof clusterStability> | string = "ineligible: fewer than two retained dimensions";
    if (retained.length > 0 && complete.length >= 10) {
      const halfA = residualizedVectors(complete.map((account) => ({ account, values: retained.map((metric) => aggregate(account, even, metric)!) })));
      const halfB = residualizedVectors(complete.map((account) => ({ account, values: retained.map((metric) => aggregate(account, odd, metric)!) })));
      const hits = halfA.filter((left) => {
        const nearest = [...halfB].sort((a, b) => cosine(left.values, b.values) - cosine(left.values, a.values))[0]!;
        return nearest.account.id === left.account.id;
      }).length;
      selfReidentification = hits / halfA.length;
      const rotated = halfB.map((row, index) => ({ ...row, account: halfB[(index + 1) % halfB.length]!.account }));
      shuffledSelfReidentification = halfA.filter((left) => {
        const nearest = [...rotated].sort((a, b) => cosine(left.values, b.values) - cosine(left.values, a.values))[0]!;
        return nearest.account.id === left.account.id;
      }).length / halfA.length;
      const full = residualizedVectors(complete.map((account) => ({ account, values: retained.map((metric) => aggregate(account, all, metric)!) })));
      ratingLeakageR2 = crossValidatedR2(full) ?? null;
      const bandMeans = new Map<string, number>();
      for (const band of [...new Set(complete.map((account) => account.band))]) {
        const rows = complete.filter((account) => account.band === band);
        bandMeans.set(band, rows.reduce((sum, account) => sum + account.medianRating, 0) / rows.length);
      }
      ratingPositiveControlR2 = crossValidatedR2(complete.map((account) => ({
        account,
        values: [account.medianRating - bandMeans.get(account.band)!],
      }))) ?? null;
      if (retained.length >= 2) clustering = clusterStability(complete, retained);
    }
    const descriptives = Object.fromEntries(METRICS.map((metric) => {
      const values = accounts.map((account) => aggregate(account, all, metric)).filter((value): value is number => value !== undefined);
      let observations = 0, eventSum = 0;
      if (metric === "opening_family_entropy") observations = accounts.reduce((sum, account) => sum + account.games.filter((game) => game.eco !== undefined).length, 0);
      else if (metric === "opening_surprisal") {
        for (const account of accounts) for (const game of account.games) for (const decision of game.opening) {
          const row = reference[decision.key]?.[decision.band];
          if ((row?.total ?? 0) >= 50 && (row?.moves?.[decision.uci] ?? 0) > 0) observations += 1;
        }
      } else {
        for (const account of accounts) for (const game of account.games) {
          observations += game.pairs[metric]?.n ?? 0;
          eventSum += game.pairs[metric]?.sum ?? 0;
        }
      }
      return [metric, {
        accountsDefined: values.length,
        observations,
        eventSum: rounded(eventSum),
        median: rounded(median(values)),
        p10: rounded(quantile(values, 0.10)),
        p90: rounded(quantile(values, 0.90)),
      }];
    }));
    const bootstrapIntervals = Object.fromEntries(retained.map((metric, metricIndex) => {
      const random = rng(91_200_000 + metricIndex);
      const widths: number[] = [];
      for (const account of accounts) {
        const estimates: number[] = [];
        for (let repeat = 0; repeat < 200; repeat += 1) {
          const indices = Array.from({ length: 200 }, () => Math.floor(random() * 200));
          const value = aggregate(account, indices, metric);
          if (value !== undefined) estimates.push(value);
        }
        if (estimates.length >= 190) widths.push(quantile(estimates, 0.975) - quantile(estimates, 0.025));
      }
      return [metric, {
        accounts: widths.length,
        resamplesPerAccount: 200,
        medianWidth: rounded(median(widths)),
        p90Width: rounded(quantile(widths, 0.90)),
      }];
    }));
    const result = {
      population: {
        accounts: accounts.length,
        gamesPerAccount: 200,
        bands: Object.fromEntries([...new Set(accounts.map((account) => account.band))].map((band) => [band, accounts.filter((account) => account.band === band).length])),
      },
      stability,
      descriptives,
      bootstrapIntervals,
      retained,
      vector: {
        eligibleAccounts: complete.length,
        selfReidentification: rounded(selfReidentification ?? undefined),
        selfReidentificationPass: selfReidentification !== null && selfReidentification >= 0.60,
        shuffledSelfReidentification: rounded(shuffledSelfReidentification ?? undefined),
        shuffleControlPass: shuffledSelfReidentification !== null && shuffledSelfReidentification <= 0.10,
        ratingLeakageR2: rounded(ratingLeakageR2 ?? undefined),
        ratingLeakagePass: ratingLeakageR2 !== null && ratingLeakageR2 <= 0.10,
        ratingPositiveControlR2: rounded(ratingPositiveControlR2 ?? undefined),
        ratingPositiveControlPass: ratingPositiveControlR2 !== null && ratingPositiveControlR2 >= 0.90,
        clustering,
        archetypePass: Array.isArray(clustering) && clustering.some((row) => row.pass),
      },
    };
    writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify({
      retained,
      floors: Object.fromEntries(METRICS.map((metric) => [metric, {
        predeclared: stability[metric].predeclaredMinimum,
        persistent: stability[metric].persistentMinimum,
      }])),
      vector: result.vector,
    }, null, 2));
    expect(accounts).toHaveLength(36);
    expect(METRICS).toHaveLength(16);
  });
});
