// DISPOSABLE research harness — D2902. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

const INPUT_DIR = process.env.TABIYA_D2902_INPUT_DIR;
const WRITE = process.env.TABIYA_D2902_WRITE === "1";
const TABLEBASE = new URL("../r4-difficulty-harness/out/tb.jsonl", import.meta.url);
const RESULT = new URL("../../planning/bot-roster/d2902-endgame-king-activity-results.json", import.meta.url);
const REPORT = new URL("../../planning/bot-roster/d2902-endgame-king-activity-results.md", import.meta.url);

type Category = "win" | "draw" | "loss";
type Distribution = ReadonlyMap<string, number>;
interface TbMove { readonly uci: string; readonly moverCategory: Category; readonly dtz: number | null }
interface TbRow { readonly fen: string; readonly packId: string; readonly pieceCount: number; readonly legalCount: number; readonly category: Category; readonly moves?: readonly TbMove[]; readonly error?: string }
interface MaiaCandidate { readonly uci: string; readonly policy: number | null }
interface MaiaRow { readonly fen: string; readonly elo: number; readonly candidates: readonly MaiaCandidate[] }
interface Cell {
  readonly fen: string; readonly packId: string; readonly pieceCount: number; readonly category: Category;
  readonly band: number; readonly production: Distribution; readonly guarded: Distribution;
  readonly moves: ReadonlyMap<string, TbMove>; readonly kings: ReadonlySet<string>;
}

const PARAMETERS = Object.freeze({ temperature: 0.8, topP: 0.92, multiplier: 4,
  gate: Object.freeze({ movement: 0.10, mixedCells: 50, unmappedCandidates: 0, postGuardWdlWorsening: 0 }),
  sensitivity: Object.freeze([2, 8]) });

function digest(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function lines<T>(text: string): readonly T[] {
  return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as T);
}

function normalize(entries: Iterable<readonly [string, number]>): Distribution {
  const rows = [...entries].filter(([, value]) => Number.isFinite(value) && value > 0);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  return total === 0 ? new Map() : new Map(rows.map(([move, value]) => [move, value / total]));
}

function productionSampler(raw: Distribution): Distribution {
  const tempered = [...raw].map(([move, mass]) => [move, Math.pow(mass, 1 / PARAMETERS.temperature)] as const)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const ranked = [...normalize(tempered)];
  const kept: Array<readonly [string, number]> = [];
  let cumulative = 0;
  for (const entry of ranked) {
    cumulative += entry[1];
    if (cumulative <= PARAMETERS.topP || kept.length === 0) kept.push(entry);
  }
  return normalize(kept);
}

function kingMoves(fen: string, moves: Iterable<string>): ReadonlySet<string> {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const result = new Set<string>();
  for (const uci of moves) {
    const parsed = parseUci(uci);
    if (parsed === undefined || !isNormal(parsed)) throw new TypeError(`D2902 invalid UCI ${uci}`);
    const move = normalizeMove(position, parsed);
    if (!position.isLegal(move)) throw new TypeError(`D2902 illegal UCI ${uci} at ${fen}`);
    if (position.board.get(move.from)?.role === "king") result.add(uci);
  }
  return result;
}

function exactGuard(base: Distribution, root: Category, moves: ReadonlyMap<string, TbMove>): Distribution | null {
  const kept: Array<readonly [string, number]> = [];
  for (const [move, mass] of base) {
    const truth = moves.get(move);
    if (truth === undefined) throw new TypeError(`D2902 unmapped candidate ${move}`);
    if (truth.moverCategory === root) kept.push([move, mass]);
  }
  const normalized = normalize(kept);
  return normalized.size === 0 ? null : normalized;
}

function reweight(base: Distribution, selected: ReadonlySet<string>, multiplier: number): Distribution {
  return normalize([...base].map(([move, mass]) => [move, mass * (selected.has(move) ? multiplier : 1)] as const));
}

function probability(dist: Distribution, predicate: (move: string) => boolean): number {
  return [...dist].reduce((sum, [move, mass]) => sum + (predicate(move) ? mass : 0), 0);
}

function round(value: number): number { return Number(value.toFixed(6)); }

function summarize(cells: readonly Cell[], multiplier: number) {
  let baseKing = 0, weightedKing = 0, baseWorse = 0, guardedWorse = 0, weightedWorse = 0;
  let baseDtz = 0, guardedDtz = 0, weightedDtz = 0, mixedCells = 0, intermediateCells = 0;
  for (const cell of cells) {
    const weighted = reweight(cell.guarded, cell.kings, multiplier);
    const isWorse = (move: string) => cell.moves.get(move)!.moverCategory !== cell.category;
    const absDtz = (dist: Distribution) => [...dist].reduce((sum, [move, mass]) => sum + mass * Math.abs(cell.moves.get(move)!.dtz ?? 0), 0);
    const guardedKing = probability(cell.guarded, (move) => cell.kings.has(move));
    baseKing += guardedKing;
    weightedKing += probability(weighted, (move) => cell.kings.has(move));
    baseWorse += probability(cell.production, isWorse);
    guardedWorse += probability(cell.guarded, isWorse);
    weightedWorse += probability(weighted, isWorse);
    baseDtz += absDtz(cell.production); guardedDtz += absDtz(cell.guarded); weightedDtz += absDtz(weighted);
    if (guardedKing > 0 && guardedKing < 1) mixedCells += 1;
    if (guardedKing > 0.05 && guardedKing < 0.80) intermediateCells += 1;
  }
  const n = cells.length || 1;
  return Object.freeze({ cells: cells.length, guardedKingMass: round(baseKing / n), transformedKingMass: round(weightedKing / n),
    movement: round((weightedKing - baseKing) / n), mixedCells, intermediateCells,
    wdlWorsening: Object.freeze({ production: round(baseWorse / n), guarded: round(guardedWorse / n), transformed: round(weightedWorse / n) }),
    expectedAbsChildDtz: Object.freeze({ production: round(baseDtz / n), guarded: round(guardedDtz / n), transformed: round(weightedDtz / n), shiftFromGuard: round((weightedDtz - guardedDtz) / n) }) });
}

function group(cells: readonly Cell[], key: (cell: Cell) => string, multiplier: number) {
  const groups = new Map<string, Cell[]>();
  for (const cell of cells) groups.set(key(cell), [...(groups.get(key(cell)) ?? []), cell]);
  return Object.fromEntries([...groups].sort(([a], [b]) => a.localeCompare(b)).map(([name, rows]) => [name, summarize(rows, multiplier)]));
}

function load(inputDir: string) {
  const tablebaseText = readFileSync(TABLEBASE, "utf8");
  const maiaText = readFileSync(`${inputDir}/maia-bare.jsonl`, "utf8");
  const probeText = readFileSync(`${inputDir}/probe-set.json`, "utf8");
  const identityText = readFileSync(`${inputDir}/maia-bare.jsonl.identity.json`, "utf8");
  const allTablebase = lines<TbRow>(tablebaseText);
  const complete = allTablebase.filter((row): row is TbRow & { readonly moves: readonly TbMove[] } => Array.isArray(row.moves));
  const tbByFen = new Map(complete.map((row) => [row.fen, row]));
  const maia = lines<MaiaRow>(maiaText);
  const cells: Cell[] = [];
  let candidateEmpty = 0, guardEmpty = 0, unmappedCandidates = 0, rawCandidates = 0, retainedCandidates = 0;
  for (const row of maia) {
    const tb = tbByFen.get(row.fen);
    if (tb === undefined) throw new TypeError(`D2902 Maia row outside population ${row.fen}`);
    const moves = new Map(tb.moves.map((move) => [move.uci, move]));
    const raw = normalize(row.candidates.flatMap((candidate) => candidate.policy === null ? [] : [[candidate.uci, candidate.policy] as const]));
    rawCandidates += raw.size;
    if (raw.size === 0) { candidateEmpty += 1; continue; }
    for (const move of raw.keys()) if (!moves.has(move)) unmappedCandidates += 1;
    if (unmappedCandidates > 0) throw new TypeError(`D2902 encountered ${unmappedCandidates} unmapped candidates`);
    const production = productionSampler(raw);
    retainedCandidates += production.size;
    const guarded = exactGuard(production, tb.category, moves);
    if (guarded === null) { guardEmpty += 1; continue; }
    cells.push({ fen: row.fen, packId: tb.packId, pieceCount: tb.pieceCount, category: tb.category,
      band: row.elo, production, guarded, moves, kings: kingMoves(row.fen, moves.keys()) });
  }
  return Object.freeze({ cells, inputs: Object.freeze({ tablebase: digest(tablebaseText), maia: digest(maiaText),
    probeSet: digest(probeText), maiaIdentity: digest(identityText) }), identity: JSON.parse(identityText),
    population: Object.freeze({ sourceRows: allTablebase.length, completePositions: complete.length,
      historicalFailures: allTablebase.length - complete.length, expectedMaiaRows: complete.length * 3,
      maiaRows: maia.length, eligibleCells: cells.length, candidateEmpty, guardEmpty, unmappedCandidates,
      rawCandidates, retainedCandidates }) });
}

function render(result: any): string {
  const pooled = result.summary.pooled;
  return `# D2902 endgame king-activity screen — results\n\n` +
    `The exact king-move ×4 transform moves guarded mass from **${(100 * pooled.guardedKingMass).toFixed(2)}%** to **${(100 * pooled.transformedKingMass).toFixed(2)}%** (${(100 * pooled.movement).toFixed(2)} pp).\n\n` +
    `Mechanism reach: **${result.verdict.mechanismReach ? "PASS" : "FAIL"}**. Overall disposition: **${result.verdict.overall}**. ` +
    `This is not a personality or human-like result; no independent human endgame move reference exists.\n`;
}

describe("D2902 endgame king-activity screen", () => {
  it("reweights a mixed king/non-king distribution", () => {
    const base = normalize([["e2e3", 0.5], ["a1a2", 0.5]]);
    expect(probability(reweight(base, new Set(["e2e3"]), 4), (move) => move === "e2e3")).toBeCloseTo(0.8);
  });

  it("makes an all-king population unable to pass reach", () => {
    const base = normalize([["e2e3", 0.6], ["e2f3", 0.4]]);
    expect(probability(reweight(base, new Set(base.keys()), 4), () => true) - probability(base, () => true)).toBe(0);
  });

  it("removes a root-winning king move that only draws", () => {
    const base = normalize([["e2e3", 0.5], ["a1a2", 0.5]]);
    const moves = new Map<string, TbMove>([["e2e3", { uci: "e2e3", moverCategory: "draw", dtz: 0 }],
      ["a1a2", { uci: "a1a2", moverCategory: "win", dtz: -9 }]]);
    expect([...exactGuard(base, "win", moves)!]).toEqual([["a1a2", 1]]);
  });

  it("fails closed on an unmapped candidate and abstains on an empty guard", () => {
    expect(() => exactGuard(normalize([["a1a2", 1]]), "win", new Map())).toThrow(/unmapped/);
    const moves = new Map<string, TbMove>([["a1a2", { uci: "a1a2", moverCategory: "draw", dtz: 0 }]]);
    expect(exactGuard(normalize([["a1a2", 1]]), "win", moves)).toBeNull();
  });

  it("retains the exact committed complete/failure partition", () => {
    const rows = lines<TbRow>(readFileSync(TABLEBASE, "utf8"));
    expect(rows).toHaveLength(257);
    expect(rows.filter((row) => Array.isArray(row.moves))).toHaveLength(196);
    expect(rows.filter((row) => !Array.isArray(row.moves) && row.error?.includes("429"))).toHaveLength(61);
  });

  it.skipIf(INPUT_DIR === undefined)("measures the fixed endgame population", () => {
    const loaded = load(INPUT_DIR!);
    expect(loaded.population).toMatchObject({ sourceRows: 257, completePositions: 196,
      historicalFailures: 61, expectedMaiaRows: 588, maiaRows: 588, unmappedCandidates: 0 });
    const pooled = summarize(loaded.cells, PARAMETERS.multiplier);
    const sensitivity = Object.fromEntries(PARAMETERS.sensitivity.map((multiplier) => [String(multiplier), summarize(loaded.cells, multiplier)]));
    const summary = Object.freeze({ pooled,
      byBand: group(loaded.cells, (cell) => String(cell.band), PARAMETERS.multiplier),
      byPieceCount: group(loaded.cells, (cell) => String(cell.pieceCount), PARAMETERS.multiplier),
      byRootCategory: group(loaded.cells, (cell) => cell.category, PARAMETERS.multiplier),
      byPack: group(loaded.cells, (cell) => cell.packId, PARAMETERS.multiplier) });
    const mechanismReach = pooled.movement >= PARAMETERS.gate.movement
      && pooled.mixedCells >= PARAMETERS.gate.mixedCells
      && loaded.population.unmappedCandidates === PARAMETERS.gate.unmappedCandidates
      && pooled.wdlWorsening.transformed === PARAMETERS.gate.postGuardWdlWorsening;
    const verdict = Object.freeze({ mechanismReach, humanReferenceAvailable: false,
      overall: "insufficient_human_reference", permittedPromotion: mechanismReach ? "endgame_mechanism_candidate" : "refused_exact_transform",
      personalityClaim: false, humanLikeClaim: false });
    const result = Object.freeze({ schema: "tabiya.research.d2902-bot-endgame-trait-screen.v1",
      measuredAt: new Date().toISOString(), parameters: PARAMETERS, inputs: loaded.inputs,
      identity: loaded.identity, population: loaded.population, summary, sensitivity, verdict });
    if (WRITE) { writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`); writeFileSync(REPORT, render(result)); }
    expect(verdict.overall).toBe("insufficient_human_reference");
  });
});
