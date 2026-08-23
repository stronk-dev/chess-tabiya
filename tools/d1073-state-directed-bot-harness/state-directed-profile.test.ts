// DISPOSABLE research harness — D1073. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { castlingSide, Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

const INPUT_DIR = process.env.TABIYA_D1073_INPUT_DIR;
const WRITE = process.env.TABIYA_D1073_WRITE === "1";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1073-state-directed-profile-results.json", import.meta.url);
const REPORT = new URL("../../planning/platform-alignment/bot-policy/d1073-state-directed-profile-results.md", import.meta.url);
const PARAMETERS = Object.freeze({
  temperature: 0.8,
  topP: 0.92,
  guardCp: 250,
  multiplier: 4,
  gates: Object.freeze({ routeDelta: 0.10, opportunityCoverage: 0.10, lossDeltaCp: 35, severeRise: 0.01, humanRetention: 0.90 }),
});

type Distribution = ReadonlyMap<string, number>;
interface MaiaCandidate { readonly uci: string; readonly policy: number | null }
interface MaiaRow { readonly fen: string; readonly phase: string; readonly ply: number; readonly elo: number; readonly candidates: readonly MaiaCandidate[] }
interface SfEntry { readonly uci: string; readonly cp: number | null; readonly mate: number | null }
interface SfRow { readonly fen: string; readonly entries: readonly SfEntry[] }
interface ExplorerMove { readonly san: string; readonly n: number }
interface ExplorerBand { readonly total: number; readonly moves: readonly ExplorerMove[] }
interface ProbePosition { readonly fen: string; readonly bands: Readonly<Record<string, ExplorerBand>> }
interface Cell {
  readonly fen: string; readonly phase: string; readonly band: number; readonly raw: Distribution;
  readonly sfLoss: ReadonlyMap<string, number>; readonly human: ReadonlyMap<string, number>;
}
interface Metrics {
  readonly cells: number; readonly expectedLossCp: number; readonly severe250: number;
  readonly humanMatch: number; readonly routeRate: number; readonly opportunityCells: number;
  readonly conditionalRouteRate: number;
}

function digest(text: string): string { return `sha256:${createHash("sha256").update(text).digest("hex")}`; }
function jsonLines<T>(text: string): readonly T[] { return text.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as T); }
function normalize(entries: Iterable<readonly [string, number]>): Distribution {
  const rows = [...entries].filter(([, value]) => Number.isFinite(value) && value > 0);
  const total = rows.reduce((sum, [, value]) => sum + value, 0);
  return total === 0 ? new Map() : new Map(rows.map(([move, value]) => [move, value / total]));
}
function productionSampler(raw: Distribution): Distribution {
  const tempered = [...raw].map(([move, mass]) => [move, Math.pow(mass, 1 / PARAMETERS.temperature)] as const)
    .sort((left, right) => right[1] - left[1]);
  const ranked = [...normalize(tempered)];
  const kept: Array<readonly [string, number]> = [];
  let cumulative = 0;
  for (const entry of ranked) {
    cumulative += entry[1];
    if (cumulative <= PARAMETERS.topP || kept.length === 0) kept.push(entry);
  }
  return normalize(kept);
}
function guard(base: Distribution, losses: ReadonlyMap<string, number>): Distribution {
  const kept = [...base].filter(([move]) => (losses.get(move) ?? Number.POSITIVE_INFINITY) <= PARAMETERS.guardCp);
  if (kept.length > 0) return normalize(kept);
  const fallback = [...base].sort((left, right) =>
    (losses.get(left[0]) ?? Number.POSITIVE_INFINITY) - (losses.get(right[0]) ?? Number.POSITIVE_INFINITY))[0];
  return fallback === undefined ? new Map() : new Map([[fallback[0], 1]]);
}
function weighted(base: Distribution, predicate: (move: string) => boolean, multiplier: number): Distribution {
  return normalize([...base].map(([move, mass]) => [move, mass * (predicate(move) ? multiplier : 1)] as const));
}

function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function targetDistance(board: Chess, color: "white" | "black"): number {
  const white = color === "white";
  const targets = white
    ? [["g3", "pawn"], ["g2", "bishop"], ["f3", "knight"]] as const
    : [["g6", "pawn"], ["g7", "bishop"], ["f6", "knight"]] as const;
  return targets.filter(([name, role]) => {
    const piece = board.board.get(parseSquare(name)!);
    return piece?.color !== color || piece.role !== role;
  }).length;
}
function routeProgress(fen: string, uci: string): boolean {
  const board = position(fen);
  const mover = board.turn;
  const before = targetDistance(board, mover);
  const parsed = parseUci(uci);
  if (parsed === undefined || !isNormal(parsed)) return false;
  const move = normalizeMove(board, parsed);
  if (!board.isLegal(move)) return false;
  board.play(move);
  return targetDistance(board, mover) < before;
}
function pawnMove(fen: string, uci: string): boolean {
  const board = position(fen), parsed = parseUci(uci);
  if (parsed === undefined || !isNormal(parsed)) return false;
  const move = normalizeMove(board, parsed);
  return board.isLegal(move) && board.board.get(move.from)?.role === "pawn";
}
function forcingMove(fen: string, uci: string): boolean {
  const board = position(fen), parsed = parseUci(uci);
  if (parsed === undefined || !isNormal(parsed)) return false;
  const move = normalizeMove(board, parsed);
  if (!board.isLegal(move)) return false;
  const piece = board.board.get(move.from);
  if (piece === undefined) return false;
  const castle = castlingSide(board, parsed) !== undefined || castlingSide(board, move) !== undefined;
  const capture = !castle && (board.board.occupied.has(move.to) || (piece.role === "pawn" && board.epSquare === move.to));
  board.play(move);
  return capture || board.isCheck();
}
function same(left: Distribution, right: Distribution): boolean {
  return left.size === right.size && [...left].every(([move, mass]) => right.get(move) === mass);
}
function dot(left: Distribution, right: ReadonlyMap<string, number>): number {
  return [...left].reduce((sum, [move, mass]) => sum + mass * (right.get(move) ?? 0), 0);
}
function expectation(dist: Distribution, values: ReadonlyMap<string, number>, predicate?: (value: number) => boolean): number {
  return [...dist].reduce((sum, [move, mass]) => {
    const value = values.get(move);
    return sum + (value === undefined ? 0 : mass * (predicate === undefined ? value : Number(predicate(value))));
  }, 0);
}
function policy(cell: Cell, predicate: (fen: string, move: string) => boolean, multiplier: number, openingOnly: boolean): Distribution {
  const base = guard(productionSampler(cell.raw), cell.sfLoss);
  return openingOnly && cell.phase !== "opening" ? base : weighted(base, (move) => predicate(cell.fen, move), multiplier);
}
function metrics(cells: readonly Cell[], predicate: (fen: string, move: string) => boolean, multiplier: number, openingOnly: boolean): Metrics {
  let expectedLossCp = 0, severe250 = 0, humanMatch = 0, routeRate = 0, opportunityCells = 0, conditional = 0;
  for (const cell of cells) {
    const base = guard(productionSampler(cell.raw), cell.sfLoss);
    const dist = policy(cell, predicate, multiplier, openingOnly);
    expectedLossCp += expectation(dist, cell.sfLoss);
    severe250 += expectation(dist, cell.sfLoss, (value) => value >= 250);
    humanMatch += dot(dist, cell.human);
    const rate = [...dist].reduce((sum, [move, mass]) => sum + (predicate(cell.fen, move) ? mass : 0), 0);
    routeRate += rate;
    const flags = [...base].map(([move]) => predicate(cell.fen, move));
    if (flags.includes(true) && flags.includes(false)) { opportunityCells += 1; conditional += rate; }
  }
  return { cells: cells.length, expectedLossCp: expectedLossCp / cells.length, severe250: severe250 / cells.length,
    humanMatch: humanMatch / cells.length, routeRate: routeRate / cells.length, opportunityCells,
    conditionalRouteRate: opportunityCells === 0 ? 0 : conditional / opportunityCells };
}
function productionMetrics(cells: readonly Cell[]) {
  let expectedLossCp = 0, severe250 = 0, humanMatch = 0;
  for (const cell of cells) {
    const dist = productionSampler(cell.raw);
    expectedLossCp += expectation(dist, cell.sfLoss);
    severe250 += expectation(dist, cell.sfLoss, (value) => value >= 250);
    humanMatch += dot(dist, cell.human);
  }
  return { cells: cells.length, expectedLossCp: expectedLossCp / cells.length,
    severe250: severe250 / cells.length, humanMatch: humanMatch / cells.length };
}
function loadCells(directory: string) {
  const paths = { maia: `${directory}/armA-history.jsonl`, sf: `${directory}/sf-d8.jsonl`, probes: `${directory}/probe-set.json`, san: `${directory}/san-map.json` };
  const texts = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, "utf8")])) as Record<keyof typeof paths, string>;
  const maia = jsonLines<MaiaRow>(texts.maia), sfRows = jsonLines<SfRow>(texts.sf);
  const probes = JSON.parse(texts.probes) as { readonly positions: readonly ProbePosition[] };
  const san = JSON.parse(texts.san) as Readonly<Record<string, Readonly<Record<string, string>>>>;
  const sfByFen = new Map(sfRows.map((row) => [row.fen, row])), probeByFen = new Map(probes.positions.map((row) => [row.fen, row]));
  const cells: Cell[] = [];
  let abstainedMixedScoreCells = 0, unmappableCandidates = 0;
  for (const row of maia) {
    const sf = sfByFen.get(row.fen), probe = probeByFen.get(row.fen);
    if (sf === undefined || probe === undefined) continue;
    if (sf.entries.some((entry) => entry.mate !== null)) { abstainedMixedScoreCells += 1; continue; }
    const scores = new Map(sf.entries.map((entry) => [entry.uci, entry.cp ?? -100_000]));
    const best = Math.max(...scores.values());
    const sfLoss = new Map([...scores].map(([move, score]) => [move, Math.max(0, best - score)]));
    const raw = normalize(row.candidates.flatMap((candidate) => candidate.policy === null ? [] : [[candidate.uci, candidate.policy] as const]));
    const explorer = probe.bands[String(row.elo)];
    if (explorer === undefined) continue;
    const human = new Map(explorer.moves.flatMap((move) => {
      const uci = san[row.fen]?.[move.san];
      return uci === undefined ? [] : [[uci, move.n / explorer.total] as const];
    }));
    for (const move of new Set([...raw.keys(), ...sfLoss.keys()])) if (parseUci(move) === undefined) unmappableCandidates += 1;
    cells.push({ fen: row.fen, phase: row.phase, band: row.elo, raw, sfLoss, human });
  }
  return { cells, inputs: Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, digest(text)])),
    population: { maiaRows: maia.length, sfRows: sfRows.length, probePositions: probes.positions.length,
      cells: cells.length, abstainedMixedScoreCells, unmappableCandidates } };
}
function rounded(value: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Number(item.toFixed(6))]));
}
function pct(value: number): string { return `${(100 * value).toFixed(2)}%`; }

describe("D1073 exact state-directed opening profile", () => {
  it("recognizes distance reduction, not preservation or wrong occupants", () => {
    expect(routeProgress("4k3/8/8/8/8/8/6P1/4KBN1 w - - 0 1", "g2g3")).toBe(true);
    expect(routeProgress("4k3/8/8/8/8/6P1/8/4KBN1 w - - 0 1", "g1f3")).toBe(true);
    expect(routeProgress("4k3/8/8/8/8/5NP1/8/4KB2 w - - 0 1", "f1g2")).toBe(true);
    expect(routeProgress("4k3/8/8/8/8/5NP1/6B1/4K3 w - - 0 1", "e1d1")).toBe(false);
    expect(targetDistance(position("4k3/8/8/8/8/6B1/8/4KBN1 w - - 0 1"), "white")).toBe(3);
  });

  it.skipIf(INPUT_DIR === undefined)("measures the preregistered fixed population", () => {
    const loaded = loadCells(INPUT_DIR!);
    expect(loaded.population).toMatchObject({ maiaRows: 837, sfRows: 279, probePositions: 279, cells: 804, abstainedMixedScoreCells: 33, unmappableCandidates: 0 });
    const opening = loaded.cells.filter((cell) => cell.phase === "opening");
    const production = productionMetrics(loaded.cells);
    const allBase = metrics(loaded.cells, routeProgress, 1, true);
    const allWeighted = metrics(loaded.cells, routeProgress, PARAMETERS.multiplier, true);
    const openingBase = metrics(opening, routeProgress, 1, false);
    const openingWeighted = metrics(opening, routeProgress, PARAMETERS.multiplier, false);
    const outsideStable = loaded.cells.filter((cell) => cell.phase !== "opening").every((cell) =>
      same(policy(cell, routeProgress, PARAMETERS.multiplier, true), policy(cell, routeProgress, 1, true)));
    const gates = {
      routeDelta: openingWeighted.routeRate - openingBase.routeRate,
      opportunityCoverage: openingBase.opportunityCells / opening.length,
      lossDeltaCp: allWeighted.expectedLossCp - production.expectedLossCp,
      severeRise: allWeighted.severe250 - production.severe250,
      humanRetention: allWeighted.humanMatch / production.humanMatch,
      outsideStable,
    };
    const pass = gates.routeDelta >= PARAMETERS.gates.routeDelta
      && gates.opportunityCoverage >= PARAMETERS.gates.opportunityCoverage
      && Math.abs(gates.lossDeltaCp) <= PARAMETERS.gates.lossDeltaCp
      && gates.severeRise <= PARAMETERS.gates.severeRise
      && gates.humanRetention >= PARAMETERS.gates.humanRetention
      && gates.outsideStable;

    const pawn = metrics(loaded.cells, pawnMove, 4, false);
    const forcing = metrics(loaded.cells, forcingMove, 3, false);
    expect(rounded(production)).toMatchObject({ expectedLossCp: 20.821109, severe250: 0.004316, humanMatch: 0.31329 });
    expect(rounded(pawn)).toMatchObject({ expectedLossCp: 19.945575, humanMatch: 0.309485 });
    expect(rounded(forcing)).toMatchObject({ expectedLossCp: 19.965684, humanMatch: 0.311082 });
    expect(outsideStable).toBe(true);

    const sensitivity = Object.fromEntries([2, 8].map((multiplier) => {
      const candidate = metrics(opening, routeProgress, multiplier, false);
      return [multiplier, { routeRate: candidate.routeRate, routeDelta: candidate.routeRate - openingBase.routeRate }];
    }));
    const result = { experiment: "D1073", measuredAt: new Date().toISOString(), parameters: PARAMETERS,
      inputs: loaded.inputs, population: { ...loaded.population, openingCells: opening.length },
      production: rounded(production), all: { base: rounded(allBase), weighted: rounded(allWeighted) },
      opening: { base: rounded(openingBase), weighted: rounded(openingWeighted) },
      gates: { ...rounded(Object.fromEntries(Object.entries(gates).filter(([, value]) => typeof value === "number")) as Record<string, number>), outsideStable, pass },
      controls: { pawn: rounded(pawn), forcing: rounded(forcing) }, sensitivity };
    const report = `# D1073 state-directed opening profile — results\n\n` +
      `The label is the literal kingside-fianchetto route potential, not a personality or human-likeness claim.\n\n` +
      `| Population | cells | route rate base | route rate ×4 | delta | opportunity cells | coverage |\n|---|---:|---:|---:|---:|---:|---:|\n` +
      `| opening | ${opening.length} | ${pct(openingBase.routeRate)} | ${pct(openingWeighted.routeRate)} | ${pct(gates.routeDelta)} | ${openingBase.opportunityCells} | ${pct(gates.opportunityCoverage)} |\n` +
      `| all | ${loaded.cells.length} | ${pct(allBase.routeRate)} | ${pct(allWeighted.routeRate)} | ${pct(allWeighted.routeRate - allBase.routeRate)} | ${allBase.opportunityCells} | ${pct(allBase.opportunityCells / loaded.cells.length)} |\n\n` +
      `Safety: loss delta ${gates.lossDeltaCp.toFixed(3)} cp; severe rise ${pct(gates.severeRise)}; Explorer retention ${pct(gates.humanRetention)}; outside-opening byte stability ${outsideStable}.\n\n` +
      `Gate: **${pass ? "PASS" : "FAIL"}**. Diagnostics: ×2 opening delta ${pct(sensitivity[2]!.routeDelta)}; ×8 ${pct(sensitivity[8]!.routeDelta)}.\n`;
    if (WRITE) { writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`); writeFileSync(REPORT, report); }
    expect(typeof pass).toBe("boolean");
  });
});
