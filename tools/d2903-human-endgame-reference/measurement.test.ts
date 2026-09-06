// DISPOSABLE research harness — D2903. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { reconstructMaiaDistribution } from "../../apps/server/src/bot-policy-catalog.js";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import { describe, expect, it } from "vitest";

import { classScores, exactMoveNll, populationCapacity, reweight, type Distribution, type HumanEndgameDecision } from "./population.js";
import { renderD2903Result } from "./report.mjs";

const INPUT_DIR = process.env.TABIYA_D2903_INPUT_DIR;
const WRITE = process.env.TABIYA_D2903_WRITE === "1";
const POPULATION = new URL("../../planning/bot-roster/d2903-human-endgame-population.json", import.meta.url);
const D2902 = new URL("../../planning/bot-roster/d2902-endgame-king-activity-results.json", import.meta.url);
const RESULT = new URL("../../planning/bot-roster/d2903-human-endgame-reference-results.json", import.meta.url);
const REPORT = new URL("../../planning/bot-roster/d2903-human-endgame-reference-results.md", import.meta.url);
const EXACT_CATEGORIES = new Set(["win", "cursed-win", "draw", "blessed-loss", "loss"]);
const BOOTSTRAP_SAMPLES = 2_000;
const MULTIPLIER = 4;

interface TbMove { readonly uci: string; readonly moverCategory: string; readonly dtz: number | null }
interface TbRow { readonly fen: string; readonly category?: string; readonly moves?: readonly TbMove[]; readonly error?: string }
interface MaiaCandidate { readonly uci: string; readonly policy: number | null }
interface MaiaRow { readonly fen: string; readonly elo: number; readonly candidates: readonly MaiaCandidate[] }
interface ScoreRow {
  readonly gameHash: string; readonly band: 1400 | 1800; readonly pieceCount: number; readonly rootCategory: string;
  readonly humanKingMove: boolean; readonly baseKingMass: number; readonly transformedKingMass: number;
  readonly classLogDelta: number; readonly classBrierDelta: number; readonly exactNllDelta: number | null;
  readonly humanMoveRetained: boolean;
}

function digest(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function jsonLines<T>(text: string): readonly T[] {
  return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as T);
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? Number.NaN : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

function probability(distribution: Distribution, selected: ReadonlySet<string>): number {
  return [...distribution].reduce((sum, [move, mass]) => sum + (selected.has(move) ? mass : 0), 0);
}

function quantile(sorted: readonly number[], fraction: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(fraction * sorted.length)))]!;
}

function bootstrap(values: readonly number[], seed: number): Readonly<{ mean: number; ci95: readonly [number, number] }> {
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("D2903 bootstrap requires finite non-empty paired values");
  }
  let state = seed >>> 0;
  const next = () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
  const draws: number[] = [];
  for (let sample = 0; sample < BOOTSTRAP_SAMPLES; sample += 1) {
    let sum = 0;
    for (let index = 0; index < values.length; index += 1) sum += values[Math.floor(next() * values.length)]!;
    draws.push(sum / values.length);
  }
  draws.sort((left, right) => left - right);
  return Object.freeze({ mean: round(mean(values)), ci95: Object.freeze([round(quantile(draws, 0.025)), round(quantile(draws, 0.975))]) });
}

function providerIdentity(inputDir: string): unknown {
  const left = readFileSync(`${inputDir}/maia-1400.jsonl.identity.json`, "utf8");
  const right = readFileSync(`${inputDir}/maia-1800.jsonl.identity.json`, "utf8");
  if (left !== right) throw new TypeError("D2903 Maia provider identity changed between bands");
  return JSON.parse(left);
}

function load(inputDir: string) {
  const populationText = readFileSync(POPULATION, "utf8");
  const population = JSON.parse(populationText) as { readonly rows: readonly HumanEndgameDecision[] };
  const tbText = readFileSync(`${inputDir}/tablebase.jsonl`, "utf8");
  const maia1400Text = readFileSync(`${inputDir}/maia-1400.jsonl`, "utf8");
  const maia1800Text = readFileSync(`${inputDir}/maia-1800.jsonl`, "utf8");
  const tbRows = jsonLines<TbRow>(tbText);
  const maiaRows = [...jsonLines<MaiaRow>(maia1400Text), ...jsonLines<MaiaRow>(maia1800Text)];
  const expectedFens = new Set(population.rows.map((row) => row.fen));
  const completeTbRows = tbRows.filter((row): row is TbRow & { readonly category: string; readonly moves: readonly TbMove[] } => Array.isArray(row.moves));
  const tbByFen = new Map(completeTbRows.map((row) => [row.fen, row]));
  if (tbByFen.size !== completeTbRows.length || tbByFen.size !== expectedFens.size
    || [...tbByFen.keys()].some((fen) => !expectedFens.has(fen))) {
    throw new TypeError(`D2903 tablebase provider incomplete: expected=${expectedFens.size} complete=${tbByFen.size} attempts=${tbRows.length}`);
  }
  const maiaByBandFen = new Map<string, MaiaRow>();
  for (const row of maiaRows) {
    const key = `${String(row.elo)}\0${row.fen}`;
    if (maiaByBandFen.has(key)) throw new TypeError(`D2903 duplicate Maia row ${key}`);
    maiaByBandFen.set(key, row);
  }
  const expectedMaia = new Set(population.rows.map((row) => `${String(row.band)}\0${row.fen}`));
  if (maiaByBandFen.size !== expectedMaia.size || [...expectedMaia].some((key) => !maiaByBandFen.has(key))) {
    throw new TypeError(`D2903 Maia provider incomplete: expected=${expectedMaia.size} rows=${maiaByBandFen.size}`);
  }

  let guardEmpty = 0, humanSafetyExcluded = 0, zeroClassLoss = 0, pageAbsent = 0;
  const scores: ScoreRow[] = [];
  for (const human of population.rows) {
    const tb = tbByFen.get(human.fen)!;
    if (tb.category === undefined || !EXACT_CATEGORIES.has(tb.category)) throw new TypeError(`D2903 non-exact root category ${String(tb.category)}`);
    const moves = new Map(tb.moves!.map((move) => [move.uci, move]));
    if ([...moves.values()].some((move) => !EXACT_CATEGORIES.has(move.moverCategory))) throw new TypeError(`D2903 non-exact move category at ${human.fen}`);
    const legal = exactLegalMoves(human.fen);
    const legalSet = new Set(legal.map((move) => move.uci));
    if (moves.size !== legalSet.size || [...legalSet].some((move) => !moves.has(move))) throw new TypeError(`D2903 tablebase legal-set mismatch at ${human.fen}`);
    const humanTruth = moves.get(human.humanMoveUci);
    if (humanTruth === undefined) throw new TypeError(`D2903 unmapped human move ${human.humanMoveUci}`);
    if (humanTruth.moverCategory !== tb.category) { humanSafetyExcluded += 1; continue; }

    const maia = maiaByBandFen.get(`${String(human.band)}\0${human.fen}`)!;
    const candidateMoves = new Set<string>();
    const reconstructed = reconstructMaiaDistribution(maia.candidates.flatMap((candidate) => {
      if (candidateMoves.has(candidate.uci)) throw new TypeError(`D2903 duplicate Maia candidate ${candidate.uci}`);
      candidateMoves.add(candidate.uci);
      if (!legalSet.has(candidate.uci)) throw new TypeError(`D2903 unmapped Maia candidate ${candidate.uci}`);
      return candidate.policy === null ? [] : [{ moveUci: candidate.uci, mass: candidate.policy }];
    }), 0.8, 0.92);
    const production = new Map(reconstructed.rows.flatMap((row) => row.finalMass > 0 ? [[row.moveUci, row.finalMass] as const] : []));
    const guardedRows = [...production].filter(([move]) => moves.get(move)!.moverCategory === tb.category);
    const guardedTotal = guardedRows.reduce((sum, [, mass]) => sum + mass, 0);
    if (guardedTotal === 0) { guardEmpty += 1; continue; }
    const guarded: Distribution = new Map(guardedRows.map(([move, mass]) => [move, mass / guardedTotal]));
    const kings = new Set(legal.filter((move) => move.role === "king").map((move) => move.uci));
    const transformed = reweight(guarded, kings, MULTIPLIER);
    const baseKingMass = probability(guarded, kings);
    const transformedKingMass = probability(transformed, kings);
    const baseClass = classScores(baseKingMass, human.humanKingMove);
    const transformedClass = classScores(transformedKingMass, human.humanKingMove);
    if (!Number.isFinite(baseClass.logLoss) || !Number.isFinite(transformedClass.logLoss)) zeroClassLoss += 1;
    const baseExact = exactMoveNll(guarded, human.humanMoveUci);
    const transformedExact = exactMoveNll(transformed, human.humanMoveUci);
    const humanMoveRetained = baseExact !== null && transformedExact !== null;
    if (!humanMoveRetained) pageAbsent += 1;
    scores.push(Object.freeze({
      gameHash: human.gameHash, band: human.band, pieceCount: human.pieceCount, rootCategory: tb.category,
      humanKingMove: human.humanKingMove, baseKingMass, transformedKingMass,
      classLogDelta: transformedClass.logLoss - baseClass.logLoss,
      classBrierDelta: transformedClass.brier - baseClass.brier,
      exactNllDelta: humanMoveRetained ? transformedExact! - baseExact! : null,
      humanMoveRetained,
    }));
  }
  return Object.freeze({ population, scores, counts: Object.freeze({ guardEmpty, humanSafetyExcluded, zeroClassLoss, pageAbsent }),
    providerAttempts: Object.freeze({ tablebase: tbRows.length, tablebaseFailures: tbRows.length - completeTbRows.length }),
    inputs: Object.freeze({ population: digest(populationText), tablebase: digest(tbText), maia1400: digest(maia1400Text), maia1800: digest(maia1800Text) }),
    identity: providerIdentity(inputDir) });
}

function grouped(rows: readonly ScoreRow[], key: (row: ScoreRow) => string) {
  const groups = new Map<string, ScoreRow[]>();
  for (const row of rows) groups.set(key(row), [...(groups.get(key(row)) ?? []), row]);
  return Object.fromEntries([...groups].sort(([left], [right]) => left.localeCompare(right)).map(([name, groupRows]) => [name, Object.freeze({
    games: groupRows.length,
    humanKingRate: round(groupRows.filter((row) => row.humanKingMove).length / groupRows.length),
    guardedKingMass: round(mean(groupRows.map((row) => row.baseKingMass))),
    transformedKingMass: round(mean(groupRows.map((row) => row.transformedKingMass))),
  })]));
}

describe("D2903 paired human endgame reference measurement", () => {
  it("keeps paired bootstrap deterministic and able to exclude zero", () => {
    expect(bootstrap([-1, -1, -1], 0x2903)).toEqual({ mean: -1, ci95: [-1, -1] });
    expect(bootstrap([1, 1, 1], 0x2903)).toEqual({ mean: 1, ci95: [1, 1] });
  });

  it("renders a literal infinite-loss result without dereferencing a missing interval", () => {
    const text = renderD2903Result({ verdict: { overall: "refused_human_reference" },
      population: { safetyCompatible: 30, selected: 32, infiniteClassLosses: 1, exactMoveAbsent: 2 },
      summary: { pooled: { humanKingRate: 0.5, guardedKingMass: 0.5, transformedKingMass: 0.6 } },
      scores: { classLogLoss: null, classBrier: { mean: 0.1, ci95: [0.01, 0.2] }, exactMoveNll: { mean: 0, ci95: [-0.1, 0.1] } } });
    expect(text).toContain("unavailable (infinite observed-class loss)");
  });

  it.skipIf(INPUT_DIR === undefined)("scores the frozen human/provider join", () => {
    const loaded = load(INPUT_DIR!);
    const capacity = populationCapacity(loaded.population.rows);
    const safe = loaded.scores;
    const safeBand1400 = safe.filter((row) => row.band === 1400).length;
    const safeBand1800 = safe.filter((row) => row.band === 1800).length;
    const safeKing = safe.filter((row) => row.humanKingMove).length;
    const safeNonKing = safe.length - safeKing;
    const referenceSufficient = safe.length >= 30 && safeBand1400 >= 10 && safeBand1800 >= 10 && safeKing >= 10 && safeNonKing >= 10;
    const exact = safe.filter((row) => row.exactNllDelta !== null);
    const exactBand1400 = exact.filter((row) => row.band === 1400).length;
    const exactBand1800 = exact.filter((row) => row.band === 1800).length;
    const exactPageSufficient = exact.length >= 30 && exactBand1400 >= 10 && exactBand1800 >= 10;
    const finiteClass = loaded.counts.zeroClassLoss === 0;
    const classLogLoss = finiteClass ? bootstrap(safe.map((row) => row.classLogDelta), 0x290301) : null;
    const classBrier = bootstrap(safe.map((row) => row.classBrierDelta), 0x290302);
    const exactMoveNllScore = exactPageSufficient ? bootstrap(exact.map((row) => row.exactNllDelta!), 0x290303) : null;
    const promising = referenceSufficient && exactPageSufficient && finiteClass && classLogLoss !== null && exactMoveNllScore !== null
      && classLogLoss.mean < 0 && classLogLoss.ci95[1] < 0
      && classBrier.mean < 0 && classBrier.ci95[1] < 0
      && exactMoveNllScore.mean <= 0 && exactMoveNllScore.ci95[1] <= 0;
    const d2902 = JSON.parse(readFileSync(D2902, "utf8"));
    const result = Object.freeze({
      schema: "tabiya.research.d2903-human-endgame-reference.v1",
      measuredAt: new Date().toISOString(),
      parameters: Object.freeze({ temperature: 0.8, topP: 0.92, multiplier: MULTIPLIER, bootstrapSamples: BOOTSTRAP_SAMPLES,
        guard: "exact-five-state-syzygy-category-equality", exactMoveFloor: Object.freeze({ total: 30, perBand: 10 }) }),
      inputs: loaded.inputs, identity: loaded.identity,
      population: Object.freeze({ selected: loaded.population.rows.length, capacity, providerComplete: loaded.population.rows.length,
        providerAttempts: loaded.providerAttempts,
        safetyCompatible: safe.length, safetyExcluded: loaded.counts.humanSafetyExcluded, guardEmpty: loaded.counts.guardEmpty,
        safetyByBand: Object.freeze({ "1400": safeBand1400, "1800": safeBand1800 }),
        safetyByClass: Object.freeze({ king: safeKing, nonKing: safeNonKing }), referenceSufficient,
        exactMoveRetained: exact.length, exactMoveAbsent: loaded.counts.pageAbsent,
        exactMoveByBand: Object.freeze({ "1400": exactBand1400, "1800": exactBand1800 }), exactPageSufficient,
        infiniteClassLosses: loaded.counts.zeroClassLoss }),
      summary: Object.freeze({ pooled: Object.freeze({ games: safe.length, humanKingRate: round(safeKing / safe.length),
        guardedKingMass: round(mean(safe.map((row) => row.baseKingMass))), transformedKingMass: round(mean(safe.map((row) => row.transformedKingMass))) }),
        byBand: grouped(safe, (row) => String(row.band)), byRootCategory: grouped(safe, (row) => row.rootCategory),
        byPieceCount: grouped(safe, (row) => String(row.pieceCount)) }),
      scores: Object.freeze({ classLogLoss, classBrier, exactMoveNll: exactMoveNllScore }),
      comparison: Object.freeze({ d2902Overall: d2902.verdict.overall, d2902PermittedPromotion: d2902.verdict.permittedPromotion }),
      verdict: Object.freeze({ overall: !referenceSufficient || !exactPageSufficient ? "insufficient_human_reference" : promising ? "promising_semantic_direction" : "refused_human_reference",
        promising, globalTransformRescued: false, profileClaim: false, personalityClaim: false, humanLikeClaim: false }),
    });
    if (WRITE) { writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`); writeFileSync(REPORT, renderD2903Result(result)); }
    expect(result.verdict.globalTransformRescued).toBe(false);
  });
});
