// DISPOSABLE research harness — D52. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

interface Candidate {
  readonly moveUci: string;
  readonly mass?: number;
  readonly offWindow?: boolean;
}

interface ProbeRow {
  readonly kind: "probe";
  readonly job: {
    readonly id: string;
    readonly source: "corpus" | "explorer";
    readonly band: number;
    readonly phase?: string;
    readonly explorer?: { readonly total: number; readonly moves: readonly { readonly moveUci: string; readonly count: number }[] };
  };
  readonly candidates?: readonly Candidate[];
  readonly error?: string;
}

export interface Thresholds {
  readonly maxTop: number;
  readonly minThird: number;
  readonly minCandidates: number;
}

export const CURRENT_THRESHOLDS: Thresholds = Object.freeze({ maxTop: 0.5, minThird: 0.15, minCandidates: 3 });

export function normalize(values: readonly number[]): readonly number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!(total > 0) || values.some((value) => !Number.isFinite(value) || value < 0)) return Object.freeze([]);
  return Object.freeze(values.map((value) => value / total).sort((left, right) => right - left));
}

export function fires(values: readonly number[], thresholds: Thresholds = CURRENT_THRESHOLDS): boolean {
  const masses = normalize(values);
  return masses.length >= thresholds.minCandidates
    && (masses[0] ?? 1) <= thresholds.maxTop
    && masses.filter((mass) => mass >= thresholds.minThird).length >= thresholds.minCandidates;
}

function rounded(value: number | null, digits = 4): number | null {
  return value === null ? null : Number(value.toFixed(digits));
}

function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function wilson(successes: number, total: number): readonly [number, number] | null {
  if (total === 0) return null;
  const z = 1.959963984540054;
  const proportion = successes / total;
  const denominator = 1 + z * z / total;
  const center = (proportion + z * z / (2 * total)) / denominator;
  const radius = z / denominator * Math.sqrt(proportion * (1 - proportion) / total + z * z / (4 * total * total));
  return Object.freeze([Number((center - radius).toFixed(4)), Number((center + radius).toFixed(4))]);
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function distribution(candidates: readonly Candidate[]): Map<string, number> {
  const usable = candidates.filter((candidate) => candidate.offWindow !== true && candidate.mass !== undefined);
  const total = usable.reduce((sum, candidate) => sum + candidate.mass!, 0);
  return new Map(usable.map((candidate) => [candidate.moveUci, candidate.mass! / total]));
}

function explorerDistribution(job: ProbeRow["job"]): Map<string, number> {
  const moves = job.explorer?.moves ?? [];
  const total = moves.reduce((sum, move) => sum + move.count, 0);
  return new Map(moves.map((move) => [move.moveUci, move.count / total]));
}

function totalVariation(left: Map<string, number>, right: Map<string, number>): number {
  const keys = new Set([...left.keys(), ...right.keys()]);
  return [...keys].reduce((sum, key) => sum + Math.abs((left.get(key) ?? 0) - (right.get(key) ?? 0)), 0) / 2;
}

function jsDivergence(left: Map<string, number>, right: Map<string, number>): number {
  const keys = new Set([...left.keys(), ...right.keys()]);
  const kl = (source: Map<string, number>) => [...keys].reduce((sum, key) => {
    const p = source.get(key) ?? 0;
    if (p === 0) return sum;
    const midpoint = ((left.get(key) ?? 0) + (right.get(key) ?? 0)) / 2;
    return sum + p * Math.log2(p / midpoint);
  }, 0);
  return (kl(left) + kl(right)) / 2;
}

function topMove(distributionByMove: Map<string, number>): string | null {
  return [...distributionByMove.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? null;
}

function summarize(rows: readonly ProbeRow[], thresholds: Thresholds): { readonly n: number; readonly fires: number; readonly rate: number | null } {
  const flags = rows.map((row) => fires((row.candidates ?? []).filter((candidate) => candidate.offWindow !== true && candidate.mass !== undefined).map((candidate) => candidate.mass!), thresholds));
  const count = flags.filter(Boolean).length;
  return { n: rows.length, fires: count, rate: rounded(rate(count, rows.length)) };
}

function main(): void {
  const allRows = readFileSync(process.argv[2]!, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as { kind: string } & Partial<ProbeRow>);
  const identity = allRows.find((row) => row.kind === "identity");
  const probes = allRows.filter((row): row is ProbeRow => row.kind === "probe" && row.job !== undefined);
  const errors = probes.filter((row) => row.error !== undefined);
  const valid = probes.filter((row) => row.error === undefined && row.candidates !== undefined);
  const corpus = valid.filter((row) => row.job.source === "corpus");
  const explorer = valid.filter((row) => row.job.source === "explorer" && row.job.explorer !== undefined);

  const externalRows = explorer.map((row) => {
    const maia = distribution(row.candidates!);
    const human = explorerDistribution(row.job);
    const maiaFire = fires([...maia.values()]);
    const humanFire = fires([...human.values()]);
    return { row, maia, human, maiaFire, humanFire };
  });
  const truePositive = externalRows.filter((entry) => entry.maiaFire && entry.humanFire).length;
  const falsePositive = externalRows.filter((entry) => entry.maiaFire && !entry.humanFire).length;
  const falseNegative = externalRows.filter((entry) => !entry.maiaFire && entry.humanFire).length;
  const trueNegative = externalRows.filter((entry) => !entry.maiaFire && !entry.humanFire).length;

  const by = <K extends string | number>(rows: readonly ProbeRow[], key: (row: ProbeRow) => K) => Object.fromEntries(
    [...new Set(rows.map(key))].sort().map((value) => [String(value), summarize(rows.filter((row) => key(row) === value), CURRENT_THRESHOLDS)]),
  );

  const thresholdGrid = [0.4, 0.5, 0.6].flatMap((maxTop) => [0.1, 0.15, 0.2].flatMap((minThird) => [2, 3, 4].map((minCandidates) => {
    const thresholds = { maxTop, minThird, minCandidates };
    const corpusSummary = summarize(corpus, thresholds);
    const predicted = externalRows.map((entry) => fires([...entry.maia.values()], thresholds));
    const tp = predicted.filter((flag, index) => flag && externalRows[index]!.humanFire).length;
    const fp = predicted.filter((flag, index) => flag && !externalRows[index]!.humanFire).length;
    const fn = predicted.filter((flag, index) => !flag && externalRows[index]!.humanFire).length;
    return {
      ...thresholds,
      corpusRate: corpusSummary.rate,
      externalPrecision: rounded(rate(tp, tp + fp)),
      externalRecall: rounded(rate(tp, tp + fn)),
      externalPredictedPositive: tp + fp,
    };
  })));

  const corpusGroups = new Map<string, ProbeRow[]>();
  for (const row of corpus) {
    const positionId = row.job.id.replace(/:\d+$/, "");
    const group = corpusGroups.get(positionId) ?? [];
    group.push(row);
    corpusGroups.set(positionId, group);
  }
  const bandVariantGroups = [...corpusGroups.values()].filter((group) => new Set(group.map((row) => fires((row.candidates ?? []).map((candidate) => candidate.mass ?? 0)))).size > 1).length;
  const firingMargins = corpus.filter((row) => fires((row.candidates ?? []).map((candidate) => candidate.mass ?? 0))).map((row) => {
    const masses = normalize((row.candidates ?? []).filter((candidate) => candidate.offWindow !== true && candidate.mass !== undefined).map((candidate) => candidate.mass!));
    return Math.min(CURRENT_THRESHOLDS.maxTop - masses[0]!, masses[2]! - CURRENT_THRESHOLDS.minThird);
  });

  const result = {
    schema: "tabiya.research.human-divergence.v1",
    generatedAt: new Date().toISOString(),
    engine: identity ?? null,
    detector: CURRENT_THRESHOLDS,
    population: {
      probes: probes.length,
      valid: valid.length,
      errors: errors.length,
      explorer: explorer.length,
      corpus: corpus.length,
      corpusPositions: corpusGroups.size,
      bands: [1100, 1400, 1500, 1600, 1800, 1900],
    },
    externalHumanChoiceAgreement: {
      n: externalRows.length,
      humanPositive: truePositive + falseNegative,
      maiaPositive: truePositive + falsePositive,
      confusion: { truePositive, falsePositive, falseNegative, trueNegative },
      precision: rounded(rate(truePositive, truePositive + falsePositive)),
      precisionWilson95: wilson(truePositive, truePositive + falsePositive),
      recall: rounded(rate(truePositive, truePositive + falseNegative)),
      recallWilson95: wilson(truePositive, truePositive + falseNegative),
      accuracy: rounded(rate(truePositive + trueNegative, externalRows.length)),
      alwaysNegativeAccuracy: rounded(rate(trueNegative + falsePositive, externalRows.length)),
      topMoveAgreement: rounded(rate(externalRows.filter((entry) => topMove(entry.maia) === topMove(entry.human)).length, externalRows.length)),
      totalVariationMedian: rounded(median(externalRows.map((entry) => totalVariation(entry.maia, entry.human)))),
      jsDivergenceBitsMedian: rounded(median(externalRows.map((entry) => jsDivergence(entry.maia, entry.human)))),
      scope: "R9 greedy opening walks only; Lichess blitz+rapid distributions are truncated to the recorded top 12 moves.",
    },
    corpusVolume: {
      overall: summarize(corpus, CURRENT_THRESHOLDS),
      estimatedMarkersPerPlayedPly: rounded((summarize(corpus, CURRENT_THRESHOLDS).rate ?? 0) / 2),
      l3CeilingPerPlayedPly: 0.1,
      byBand: by(corpus, (row) => row.job.band),
      byPhase: by(corpus, (row) => row.job.phase ?? "unknown"),
      bandVariantPositionGroups: bandVariantGroups,
      bandComparedPositionGroups: corpusGroups.size,
      bandVariantPositionRate: rounded(rate(bandVariantGroups, corpusGroups.size)),
      firingBoundaryMarginMedian: rounded(median(firingMargins)),
      firingBoundaryMarginMin: rounded(firingMargins.length === 0 ? null : Math.min(...firingMargins)),
      firingWithinOnePointOfBoundary: firingMargins.filter((margin) => margin <= 0.01).length,
      firingWithinTwoPointsOfBoundary: firingMargins.filter((margin) => margin <= 0.02).length,
    },
    thresholdGrid,
    limitations: [
      "The external population covers opening walks, not middlegames or endgames.",
      "The corpus arm estimates frequency from authored decision positions; it is not a log of learner-selected positions.",
      "Agreement with human move dispersion validates the marker's name, not whether an unasked sentence helps a learner.",
      "The live union's L3 rate still requires the other admitted marker kinds on the same played-run population.",
    ],
  };
  writeFileSync(process.argv[3]!, `${JSON.stringify(result, null, 1)}\n`);
  process.stdout.write(`${JSON.stringify(result, null, 1)}\n`);
  if (errors.length > 0) process.exitCode = 2;
}

if (process.argv[1]?.endsWith("analyze.mjs") || process.argv[1]?.endsWith("analyze.js")) main();
