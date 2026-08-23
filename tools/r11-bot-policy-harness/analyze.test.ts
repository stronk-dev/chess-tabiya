// DISPOSABLE research harness — platform-alignment R11. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

const INPUT_DIR = process.env.TABIYA_R11_INPUT_DIR;
const WRITE = process.env.TABIYA_R11_WRITE === "1";
const RESULT = process.env.TABIYA_R11_RESULT_FILE
  ?? new URL("../../planning/platform-alignment/bot-policy/results.json", import.meta.url);
const REPORT = process.env.TABIYA_R11_REPORT_FILE
  ?? new URL("../../planning/platform-alignment/bot-policy/results.md", import.meta.url);
const SF_FILE = process.env.TABIYA_R11_SF_FILE ?? "sf-d12.jsonl";
const MIXED_SCORE_POLICY = process.env.TABIYA_R11_MIXED_SCORE_POLICY ?? "legacy_large_cp";
if (MIXED_SCORE_POLICY !== "legacy_large_cp" && MIXED_SCORE_POLICY !== "abstain") {
  throw new TypeError("TABIYA_R11_MIXED_SCORE_POLICY must be legacy_large_cp or abstain");
}

type Distribution = ReadonlyMap<string, number>;

interface MaiaCandidate {
  readonly uci: string;
  readonly rank: number;
  readonly policy: number | null;
  readonly cp: number | null;
}

interface MaiaRow {
  readonly fen: string;
  readonly phase: string;
  readonly ply: number;
  readonly elo: number;
  readonly bestmove: string | null;
  readonly candidates: readonly MaiaCandidate[];
}

interface SfEntry {
  readonly uci: string;
  readonly cp: number | null;
  readonly mate: number | null;
}

interface SfRow {
  readonly fen: string;
  readonly entries: readonly SfEntry[];
}

interface ExplorerMove {
  readonly san: string;
  readonly n: number;
}

interface ExplorerBand {
  readonly total: number;
  readonly moves: readonly ExplorerMove[];
}

interface ProbePosition {
  readonly fen: string;
  readonly bands: Readonly<Record<string, ExplorerBand>>;
}

interface Trait {
  readonly pawn: boolean;
  readonly forcing: boolean;
  readonly quiet: boolean;
  readonly earlyKing: boolean;
  readonly earlyQueen: boolean;
  readonly castle: boolean;
}

interface Cell {
  readonly fen: string;
  readonly phase: string;
  readonly ply: number;
  readonly band: number;
  readonly raw: Distribution;
  readonly sampled: Distribution;
  readonly argmax: Distribution;
  readonly sfLoss: ReadonlyMap<string, number>;
  readonly human: ReadonlyMap<string, number>;
  readonly book: Distribution | null;
  readonly traits: ReadonlyMap<string, Trait>;
}

interface Metrics {
  readonly cells: number;
  readonly expectedLossCp: number;
  readonly severe250: number;
  readonly severe500: number;
  readonly maiaMatch: number;
  readonly humanMatch: number;
  readonly humanListedMass: number;
  readonly pawnRate: number;
  readonly forcingRate: number;
  readonly quietRate: number;
  readonly earlyKingRate: number;
  readonly earlyQueenRate: number;
  readonly castleRate: number;
  readonly entropyNats: number;
  readonly effectiveMoves: number;
  readonly repeatProbability: number;
}

const PARAMETERS = Object.freeze({
  productionTemperature: 0.8,
  productionTopP: 0.92,
  guardCp: 250,
  pawnMultiplier: 4,
  forcingMultiplier: 3,
  quietMultiplier: 3,
  repeatMultiplier: 0.25,
  bookThroughPly: 12,
  gates: { traitDelta: 0.10, lossDeltaCp: 35, severeRise: 0.01, humanRetention: 0.90 },
  sensitivity: { guards: [100, 200, 300, 500], multipliers: [2, 4, 8] },
});

function digest(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function jsonLines<T>(text: string): readonly T[] {
  return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as T);
}

function normalize(entries: Iterable<readonly [string, number]>): Distribution {
  const rows = [...entries].filter(([, value]) => Number.isFinite(value) && value > 0);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  if (total <= 0) return new Map();
  return new Map(rows.map(([move, value]) => [move, value / total]));
}

function point(move: string | null): Distribution {
  return move === null ? new Map() : new Map([[move, 1]]);
}

function reweight(base: Distribution, multiplier: (move: string) => number): Distribution {
  return normalize([...base].map(([move, mass]) => [move, mass * multiplier(move)] as const));
}

function productionSampler(raw: Distribution, temperature: number, topP: number): Distribution {
  if (temperature <= 0) return point([...raw].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null);
  const tempered = [...raw]
    .map(([move, mass]) => [move, Math.pow(mass, 1 / temperature)] as const)
    .sort((left, right) => right[1] - left[1]);
  const normalized = [...normalize(tempered)];
  if (topP >= 1) return new Map(normalized);
  let cumulative = 0;
  const kept: Array<readonly [string, number]> = [];
  for (const entry of normalized) {
    cumulative += entry[1];
    // Pinned Maia keeps cumulative <= top-p, with top-1 forced in.
    if (cumulative <= topP || kept.length === 0) kept.push(entry);
  }
  return normalize(kept);
}

function guard(base: Distribution, losses: ReadonlyMap<string, number>, threshold: number): Distribution {
  const kept = [...base].filter(([move]) => (losses.get(move) ?? Number.POSITIVE_INFINITY) <= threshold);
  if (kept.length > 0) return normalize(kept);
  const fallback = [...base].sort((left, right) =>
    (losses.get(left[0]) ?? Number.POSITIVE_INFINITY) - (losses.get(right[0]) ?? Number.POSITIVE_INFINITY))[0];
  return fallback === undefined ? new Map() : point(fallback[0]);
}

function score(entry: SfEntry): number {
  if (entry.mate !== null) return entry.mate > 0 ? 100_000 - entry.mate : -100_000 - entry.mate;
  return entry.cp ?? -100_000;
}

function hasMateScore(entries: readonly SfEntry[]): boolean {
  return entries.some((entry) => entry.mate !== null);
}

function trait(fen: string, ply: number, uci: string): Trait | null {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const move = parseUci(uci);
  if (move === undefined || !isNormal(move) || !position.isLegal(move)) return null;
  const piece = position.board.get(move.from);
  if (piece === undefined) return null;
  const capture = position.board.occupied.has(move.to)
    || (piece.role === "pawn" && position.epSquare === move.to);
  const castle = piece.role === "king" && Math.abs(move.to - move.from) === 2;
  const after = position.clone();
  after.play(move);
  const forcing = capture || after.isCheck();
  return Object.freeze({
    pawn: piece.role === "pawn",
    forcing,
    quiet: !forcing,
    earlyKing: ply < 16 && piece.role === "king" && !castle,
    earlyQueen: ply < 16 && piece.role === "queen",
    castle,
  });
}

function dot(left: Distribution, right: ReadonlyMap<string, number>): number {
  let result = 0;
  for (const [move, mass] of left) result += mass * (right.get(move) ?? 0);
  return result;
}

function expected(dist: Distribution, values: ReadonlyMap<string, number>, predicate?: (value: number) => boolean): number {
  let result = 0;
  for (const [move, mass] of dist) {
    const value = values.get(move);
    if (value !== undefined) result += mass * (predicate === undefined ? value : Number(predicate(value)));
  }
  return result;
}

function traitRate(dist: Distribution, traits: ReadonlyMap<string, Trait>, key: keyof Trait): number {
  let result = 0;
  for (const [move, mass] of dist) if (traits.get(move)?.[key] === true) result += mass;
  return result;
}

function entropy(dist: Distribution): number {
  let result = 0;
  for (const mass of dist.values()) result -= mass * Math.log(mass);
  return result;
}

function repeatSuppressed(base: Distribution, factor: number): { readonly second: Distribution; readonly repeat: number } {
  const aggregate = new Map<string, number>();
  let repeat = 0;
  for (const [first, firstMass] of base) {
    const second = reweight(base, (move) => move === first ? factor : 1);
    repeat += firstMass * (second.get(first) ?? 0);
    for (const [move, mass] of second) aggregate.set(move, (aggregate.get(move) ?? 0) + firstMass * mass);
  }
  return { second: normalize(aggregate), repeat };
}

function arm(cell: Cell, name: string): { readonly distribution: Distribution; readonly repeat?: number } {
  const base = productionSampler(cell.raw, PARAMETERS.productionTemperature, PARAMETERS.productionTopP);
  const guarded = guard(base, cell.sfLoss, PARAMETERS.guardCp);
  switch (name) {
    case "current_sample": return { distribution: cell.sampled };
    case "maia_raw_policy": return { distribution: cell.raw };
    case "production_sampler": return { distribution: base };
    case "maia_argmax": return { distribution: cell.argmax };
    case "guard_250": return { distribution: guarded };
    case "pawn_x4_guarded": return { distribution: reweight(guarded, (move) => cell.traits.get(move)?.pawn === true ? PARAMETERS.pawnMultiplier : 1) };
    case "forcing_x3_guarded": return { distribution: reweight(guarded, (move) => cell.traits.get(move)?.forcing === true ? PARAMETERS.forcingMultiplier : 1) };
    case "quiet_x3_guarded": return { distribution: reweight(guarded, (move) => cell.traits.get(move)?.quiet === true ? PARAMETERS.quietMultiplier : 1) };
    case "listed_human_book": return { distribution: cell.book ?? guarded };
    case "book_to_ply12_then_guard": return { distribution: cell.ply <= PARAMETERS.bookThroughPly && cell.book !== null ? cell.book : guarded };
    case "repeat_suppress_0.25": {
      const result = repeatSuppressed(base, PARAMETERS.repeatMultiplier);
      return { distribution: result.second, repeat: result.repeat };
    }
    default: throw new TypeError(`Unknown arm ${name}`);
  }
}

const ARM_NAMES = [
  "current_sample", "maia_raw_policy", "production_sampler", "maia_argmax", "guard_250", "pawn_x4_guarded",
  "forcing_x3_guarded", "quiet_x3_guarded", "listed_human_book",
  "book_to_ply12_then_guard", "repeat_suppress_0.25",
] as const;

function metrics(cells: readonly Cell[], name: string): Metrics {
  const sums = {
    expectedLossCp: 0, severe250: 0, severe500: 0, maiaMatch: 0, humanMatch: 0,
    humanListedMass: 0, pawnRate: 0, forcingRate: 0, quietRate: 0, earlyKingRate: 0,
    earlyQueenRate: 0, castleRate: 0, entropyNats: 0, effectiveMoves: 0, repeatProbability: 0,
  };
  let used = 0;
  for (const cell of cells) {
    const selected = arm(cell, name);
    const dist = selected.distribution;
    if (dist.size === 0) continue;
    const h = entropy(dist);
    sums.expectedLossCp += expected(dist, cell.sfLoss);
    sums.severe250 += expected(dist, cell.sfLoss, (value) => value >= 250);
    sums.severe500 += expected(dist, cell.sfLoss, (value) => value >= 500);
    sums.maiaMatch += dot(dist, cell.raw);
    sums.humanMatch += dot(dist, cell.human);
    sums.humanListedMass += [...dist].reduce((sum, [move, mass]) => sum + (cell.human.has(move) ? mass : 0), 0);
    sums.pawnRate += traitRate(dist, cell.traits, "pawn");
    sums.forcingRate += traitRate(dist, cell.traits, "forcing");
    sums.quietRate += traitRate(dist, cell.traits, "quiet");
    sums.earlyKingRate += traitRate(dist, cell.traits, "earlyKing");
    sums.earlyQueenRate += traitRate(dist, cell.traits, "earlyQueen");
    sums.castleRate += traitRate(dist, cell.traits, "castle");
    sums.entropyNats += h;
    sums.effectiveMoves += Math.exp(h);
    sums.repeatProbability += selected.repeat ?? dot(dist, dist);
    used += 1;
  }
  return Object.freeze({ cells: used, ...Object.fromEntries(Object.entries(sums).map(([key, value]) => [key, value / used])) }) as unknown as Metrics;
}

function loadCells(directory: string): { readonly cells: readonly Cell[]; readonly digests: Record<string, string>; readonly counts: Record<string, number> } {
  const paths = {
    maia: `${directory}/armA-history.jsonl`, sf: `${directory}/${SF_FILE}`,
    probes: `${directory}/probe-set.json`, san: `${directory}/san-map.json`,
  };
  const texts = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, "utf8")])) as Record<keyof typeof paths, string>;
  const maia = jsonLines<MaiaRow>(texts.maia);
  const sf = jsonLines<SfRow>(texts.sf);
  const probes = JSON.parse(texts.probes) as { readonly positions: readonly ProbePosition[] };
  const san = JSON.parse(texts.san) as Readonly<Record<string, Readonly<Record<string, string>>>>;
  const sfByFen = new Map(sf.map((row) => [row.fen, row]));
  const probeByFen = new Map(probes.positions.map((row) => [row.fen, row]));
  const cells: Cell[] = [];
  for (const row of maia) {
    const sfRow = sfByFen.get(row.fen);
    const probe = probeByFen.get(row.fen);
    if (sfRow === undefined || probe === undefined) continue;
    if (MIXED_SCORE_POLICY === "abstain" && hasMateScore(sfRow.entries)) continue;
    const sfScores = new Map(sfRow.entries.map((entry) => [entry.uci, score(entry)]));
    const best = Math.max(...sfScores.values());
    const sfLoss = new Map([...sfScores].map(([move, value]) => [move, Math.max(0, best - value)]));
    const raw = normalize(row.candidates.flatMap((candidate) => candidate.policy === null ? [] : [[candidate.uci, candidate.policy] as const]));
    const argmax = point([...raw].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null);
    const explorer = probe.bands[String(row.elo)];
    if (explorer === undefined) continue;
    const humanRows = explorer.moves.flatMap((move) => {
      const uci = san[row.fen]?.[move.san];
      return uci === undefined ? [] : [[uci, move.n / explorer.total] as const];
    });
    const human = new Map(humanRows);
    const book = normalize(humanRows.filter(([move]) => sfScores.has(move)));
    const allMoves = new Set([...sfScores.keys(), ...raw.keys(), ...book.keys()]);
    const traits = new Map([...allMoves].flatMap((move) => {
      const value = trait(row.fen, row.ply, move);
      return value === null ? [] : [[move, value] as const];
    }));
    cells.push(Object.freeze({
      fen: row.fen, phase: row.phase, ply: row.ply, band: row.elo, raw,
      sampled: point(row.bestmove), argmax, sfLoss, human, book: book.size === 0 ? null : book, traits,
    }));
  }
  return {
    cells,
    digests: Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, digest(text)])),
    counts: { maiaRows: maia.length, sfRows: sf.length, probePositions: probes.positions.length, cells: cells.length },
  };
}

function rounded(value: number): number {
  return Number(value.toFixed(6));
}

function roundedMetrics(value: Metrics): Metrics {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === "number" ? rounded(item) : item])) as unknown as Metrics;
}

function sensitivityMetrics(cells: readonly Cell[], transform: (cell: Cell) => Distribution) {
  const value = metrics(cells.map((cell) => ({ ...cell, raw: transform(cell) })), "maia_raw_policy");
  return {
    expectedLossCp: value.expectedLossCp,
    severe250: value.severe250,
    severe500: value.severe500,
    humanMatch: value.humanMatch,
    pawnRate: value.pawnRate,
    forcingRate: value.forcingRate,
    quietRate: value.quietRate,
    effectiveMoves: value.effectiveMoves,
  };
}

function gateResult(summary: Record<string, Metrics>) {
  const raw = summary.production_sampler!;
  const guarded = summary.guard_250!;
  const traitArms = [
    ["pawn_x4_guarded", "pawnRate"],
    ["forcing_x3_guarded", "forcingRate"],
    ["quiet_x3_guarded", "quietRate"],
  ] as const;
  const common = (candidate: Metrics) => ({
    lossDeltaCp: rounded(candidate.expectedLossCp - raw.expectedLossCp),
    severeRise: rounded(candidate.severe250 - raw.severe250),
    humanRetention: rounded(candidate.humanMatch / raw.humanMatch),
  });
  return {
    guard_250: {
      severeRemoved: rounded(1 - guarded.severe250 / raw.severe250),
      strengtheningCp: rounded(raw.expectedLossCp - guarded.expectedLossCp),
      humanRetention: rounded(guarded.humanMatch / raw.humanMatch),
      pass: 1 - guarded.severe250 / raw.severe250 >= 0.5
        && raw.expectedLossCp - guarded.expectedLossCp <= PARAMETERS.gates.lossDeltaCp
        && guarded.humanMatch / raw.humanMatch >= PARAMETERS.gates.humanRetention,
    },
    traits: Object.fromEntries(traitArms.map(([name, key]) => {
      const candidate = summary[name]!;
      const deltas = common(candidate);
      const traitDelta = candidate[key] - guarded[key];
      return [name, {
        traitDelta: rounded(traitDelta), ...deltas,
        pass: traitDelta >= PARAMETERS.gates.traitDelta
          && Math.abs(deltas.lossDeltaCp) <= PARAMETERS.gates.lossDeltaCp
          && deltas.severeRise <= PARAMETERS.gates.severeRise
          && deltas.humanRetention >= PARAMETERS.gates.humanRetention,
      }];
    })),
    repeat_suppress_0_25: {
      repeatReduction: rounded(1 - summary["repeat_suppress_0.25"]!.repeatProbability / raw.repeatProbability),
      ...common(summary["repeat_suppress_0.25"]!),
    },
  };
}

function report(result: any): string {
  const rows = ARM_NAMES.map((name) => {
    const value = result.summary[name] as Metrics;
    return `| ${name} | ${value.expectedLossCp.toFixed(1)} | ${(value.severe250 * 100).toFixed(1)}% | ${(value.humanMatch * 100).toFixed(2)}% | ${(value.pawnRate * 100).toFixed(1)}% | ${(value.forcingRate * 100).toFixed(1)}% | ${(value.quietRate * 100).toFixed(1)}% | ${value.effectiveMoves.toFixed(2)} | ${(value.repeatProbability * 100).toFixed(1)}% |`;
  });
  return `# R11 bot-policy mechanical results\n\nGenerated by the disposable harness from the predeclared plan. No arm is called human-like. Score-domain policy: \`${result.mixedScorePolicy}\`; evaluated cells: **${result.population.cells}**.\n\n| Arm | expected SF loss cp | ≥250 cp | human match | pawn | forcing | quiet | effective moves | repeat |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${rows.join("\n")}\n\n## Mechanical gates\n\n\`\`\`json\n${JSON.stringify(result.gates, null, 2)}\n\`\`\`\n`;
}

describe("R11 bot-policy transforms", () => {
  it("proves guard, trait and repeat-suppression controls on a synthetic distribution", () => {
    const raw = normalize([["pawn", 0.5], ["forcing", 0.3], ["bad", 0.2]]);
    const truncated = productionSampler(raw, 1, 0.81);
    expect([...truncated.keys()]).toEqual(["pawn", "forcing"]);
    expect(truncated.get("pawn")).toBeCloseTo(0.625);
    expect([...productionSampler(raw, 0, 0.92).keys()]).toEqual(["pawn"]);
    const losses = new Map([["pawn", 20], ["forcing", 80], ["bad", 400]]);
    const guarded = guard(raw, losses, 250);
    expect([...guarded.keys()]).toEqual(["pawn", "forcing"]);
    expect(guarded.get("pawn")).toBeCloseTo(0.625);
    const pawn = reweight(guarded, (move) => move === "pawn" ? 4 : 1);
    expect(pawn.get("pawn")).toBeGreaterThan(guarded.get("pawn")!);
    const repeated = repeatSuppressed(raw, 0.25);
    expect(repeated.repeat).toBeLessThan(dot(raw, raw));
    expect([...repeated.second.values()].reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
  });

  it("keeps typed mate scores out of a centipawn-only guard population", () => {
    expect(hasMateScore([{ uci: "e2e4", cp: 20, mate: null }])).toBe(false);
    expect(hasMateScore([
      { uci: "e2e4", cp: 20, mate: null },
      { uci: "d2d4", cp: null, mate: 3 },
    ])).toBe(true);
    expect(hasMateScore([{ uci: "d2d4", cp: null, mate: 3 }])).toBe(true);
  });

  it.skipIf(INPUT_DIR === undefined)("measures every predeclared arm over the fixed population", () => {
    const loaded = loadCells(INPUT_DIR!);
    expect(loaded.counts).toEqual({
      maiaRows: 837,
      sfRows: 279,
      probePositions: 279,
      cells: MIXED_SCORE_POLICY === "abstain" ? 804 : 837,
    });
    const summary = Object.fromEntries(ARM_NAMES.map((name) => [name, roundedMetrics(metrics(loaded.cells, name))]));
    const byBand = Object.fromEntries([1400, 1600, 1800].map((band) => [band, Object.fromEntries(
      ARM_NAMES.map((name) => [name, roundedMetrics(metrics(loaded.cells.filter((cell) => cell.band === band), name))]),
    )]));
    const sensitivity = {
      guards: Object.fromEntries(PARAMETERS.sensitivity.guards.map((threshold) => [threshold, sensitivityMetrics(
        loaded.cells, (cell) => guard(productionSampler(cell.raw, PARAMETERS.productionTemperature, PARAMETERS.productionTopP), cell.sfLoss, threshold),
      )])),
      pawn: Object.fromEntries(PARAMETERS.sensitivity.multipliers.map((factor) => [factor, sensitivityMetrics(
        loaded.cells, (cell) => reweight(guard(productionSampler(cell.raw, PARAMETERS.productionTemperature, PARAMETERS.productionTopP), cell.sfLoss, PARAMETERS.guardCp), (move) => cell.traits.get(move)?.pawn === true ? factor : 1),
      )])),
      forcing: Object.fromEntries(PARAMETERS.sensitivity.multipliers.map((factor) => [factor, sensitivityMetrics(
        loaded.cells, (cell) => reweight(guard(productionSampler(cell.raw, PARAMETERS.productionTemperature, PARAMETERS.productionTopP), cell.sfLoss, PARAMETERS.guardCp), (move) => cell.traits.get(move)?.forcing === true ? factor : 1),
      )])),
    };
    const result = {
      measuredAt: new Date().toISOString(), parameters: PARAMETERS,
      mixedScorePolicy: MIXED_SCORE_POLICY, inputs: loaded.digests,
      population: loaded.counts, summary, byBand, sensitivity, gates: gateResult(summary),
    };
    if (WRITE) {
      writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(REPORT, report(result));
    }
    expect(Object.keys(summary)).toEqual(ARM_NAMES);
  });
});
