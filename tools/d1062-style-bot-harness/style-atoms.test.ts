// DISPOSABLE research harness — D1062. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { castlingSide, Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

const INPUT_DIR = process.env.TABIYA_D1062_INPUT_DIR;
const WRITE = process.env.TABIYA_D1062_WRITE === "1";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1062-style-atom-results.json", import.meta.url);
const REPORT = new URL("../../planning/platform-alignment/bot-policy/d1062-style-atom-results.md", import.meta.url);

type Distribution = ReadonlyMap<string, number>;
type Color = "white" | "black";
type Atom = "centerPawn" | "earlyQueen" | "castle" | "fianchettoSetup" | "fianchettoScreen";

interface MaiaCandidate { readonly uci: string; readonly policy: number | null }
interface MaiaRow {
  readonly fen: string; readonly phase: string; readonly ply: number; readonly elo: number;
  readonly candidates: readonly MaiaCandidate[];
}
interface SfEntry { readonly uci: string; readonly cp: number | null; readonly mate: number | null }
interface SfRow { readonly fen: string; readonly entries: readonly SfEntry[] }
interface ExplorerMove { readonly san: string; readonly n: number }
interface ExplorerBand { readonly total: number; readonly moves: readonly ExplorerMove[] }
interface ProbePosition { readonly fen: string; readonly bands: Readonly<Record<string, ExplorerBand>> }
interface Traits extends Readonly<Record<Atom, boolean>> { readonly pawn: boolean; readonly forcing: boolean }
interface Cell {
  readonly fen: string; readonly phase: string; readonly ply: number; readonly band: number;
  readonly raw: Distribution; readonly sfLoss: ReadonlyMap<string, number>;
  readonly human: ReadonlyMap<string, number>; readonly traits: ReadonlyMap<string, Traits>;
}
interface Metrics {
  readonly cells: number; readonly expectedLossCp: number; readonly severe250: number;
  readonly humanMatch: number; readonly traitRate: number; readonly opportunityCells: number;
  readonly conditionalTraitRate: number;
}

const ATOMS: readonly Atom[] = ["centerPawn", "earlyQueen", "castle", "fianchettoSetup", "fianchettoScreen"];
const PARAMETERS = Object.freeze({
  temperature: 0.8, topP: 0.92, guardCp: 250, traitMultiplier: 4,
  gates: Object.freeze({ traitDelta: 0.10, lossDeltaCp: 35, severeRise: 0.01, humanRetention: 0.90 }),
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
  return total === 0 ? new Map() : new Map(rows.map(([move, value]) => [move, value / total]));
}

function productionSampler(raw: Distribution): Distribution {
  const tempered = [...raw]
    .map(([move, mass]) => [move, Math.pow(mass, 1 / PARAMETERS.temperature)] as const)
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

function reweight(base: Distribution, predicate: (move: string) => boolean, multiplier: number): Distribution {
  return normalize([...base].map(([move, mass]) => [move, mass * (predicate(move) ? multiplier : 1)] as const));
}

function hasConfiguration(position: Chess, color: Color, screened: boolean): boolean {
  const triples = color === "white"
    ? [["b2", "b3", "c3"], ["g2", "g3", "f3"]] as const
    : [["b7", "b6", "c6"], ["g7", "g6", "f6"]] as const;
  return triples.some(([bishopName, pawnName, knightName]) => {
    const bishop = position.board.get(parseSquare(bishopName)!);
    const pawn = position.board.get(parseSquare(pawnName)!);
    const knight = position.board.get(parseSquare(knightName)!);
    return bishop?.color === color && bishop.role === "bishop"
      && pawn?.color === color && pawn.role === "pawn"
      && (!screened || (knight?.color === color && knight.role === "knight"));
  });
}

function classify(fen: string, ply: number, uci: string): Traits | null {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const parsed = parseUci(uci);
  if (parsed === undefined || !isNormal(parsed)) return null;
  const move = normalizeMove(position, parsed);
  if (!position.isLegal(move)) return null;
  const piece = position.board.get(move.from);
  if (piece === undefined) return null;
  const mover = piece.color;
  const castle = castlingSide(position, parsed) !== undefined || castlingSide(position, move) !== undefined;
  const capture = !castle && (position.board.occupied.has(move.to)
    || (piece.role === "pawn" && position.epSquare === move.to));
  const beforeSetup = hasConfiguration(position, mover, false);
  const beforeScreen = hasConfiguration(position, mover, true);
  const after = position.clone();
  after.play(move);
  return Object.freeze({
    pawn: piece.role === "pawn",
    forcing: capture || after.isCheck(),
    centerPawn: piece.role === "pawn" && new Set(["c4", "d4", "e4", "f4", "c5", "d5", "e5", "f5"])
      .has(uci.slice(2, 4)),
    earlyQueen: ply < 16 && piece.role === "queen",
    castle,
    fianchettoSetup: !beforeSetup && hasConfiguration(after, mover, false),
    fianchettoScreen: !beforeScreen && hasConfiguration(after, mover, true),
  });
}

function dot(left: Distribution, right: ReadonlyMap<string, number>): number {
  let value = 0;
  for (const [move, mass] of left) value += mass * (right.get(move) ?? 0);
  return value;
}

function expected(dist: Distribution, values: ReadonlyMap<string, number>, predicate?: (value: number) => boolean): number {
  let result = 0;
  for (const [move, mass] of dist) {
    const value = values.get(move);
    if (value !== undefined) result += mass * (predicate === undefined ? value : Number(predicate(value)));
  }
  return result;
}

function distribution(cell: Cell, atom?: Atom | "pawn" | "forcing", multiplier = PARAMETERS.traitMultiplier): Distribution {
  const guarded = guard(productionSampler(cell.raw), cell.sfLoss);
  return atom === undefined ? guarded : reweight(guarded, (move) => cell.traits.get(move)?.[atom] === true, multiplier);
}

function metrics(cells: readonly Cell[], atom?: Atom | "pawn" | "forcing", multiplier = PARAMETERS.traitMultiplier): Metrics {
  let expectedLossCp = 0, severe250 = 0, humanMatch = 0, traitRate = 0, opportunityCells = 0, conditionalTraitMass = 0;
  for (const cell of cells) {
    const base = distribution(cell);
    const dist = distribution(cell, atom, multiplier);
    expectedLossCp += expected(dist, cell.sfLoss);
    severe250 += expected(dist, cell.sfLoss, (value) => value >= 250);
    humanMatch += dot(dist, cell.human);
    if (atom !== undefined) {
      const cellTraitRate = [...dist].reduce((sum, [move, mass]) => sum + (cell.traits.get(move)?.[atom] === true ? mass : 0), 0);
      traitRate += cellTraitRate;
      const flags = [...base].filter(([, mass]) => mass > 0).map(([move]) => cell.traits.get(move)?.[atom] === true);
      if (flags.includes(true) && flags.includes(false)) { opportunityCells += 1; conditionalTraitMass += cellTraitRate; }
    }
  }
  return { cells: cells.length, expectedLossCp: expectedLossCp / cells.length, severe250: severe250 / cells.length,
    humanMatch: humanMatch / cells.length, traitRate: traitRate / cells.length, opportunityCells,
    conditionalTraitRate: opportunityCells === 0 ? 0 : conditionalTraitMass / opportunityCells };
}

function productionMetrics(cells: readonly Cell[]): Omit<Metrics, "traitRate" | "opportunityCells"> {
  let expectedLossCp = 0, severe250 = 0, humanMatch = 0;
  for (const cell of cells) {
    const dist = productionSampler(cell.raw);
    expectedLossCp += expected(dist, cell.sfLoss);
    severe250 += expected(dist, cell.sfLoss, (value) => value >= 250);
    humanMatch += dot(dist, cell.human);
  }
  return { cells: cells.length, expectedLossCp: expectedLossCp / cells.length,
    severe250: severe250 / cells.length, humanMatch: humanMatch / cells.length };
}

function loadCells(directory: string) {
  const paths = { maia: `${directory}/armA-history.jsonl`, sf: `${directory}/sf-d8.jsonl`,
    probes: `${directory}/probe-set.json`, san: `${directory}/san-map.json` };
  const texts = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, "utf8")])) as Record<keyof typeof paths, string>;
  const maia = jsonLines<MaiaRow>(texts.maia);
  const sfRows = jsonLines<SfRow>(texts.sf);
  const probes = JSON.parse(texts.probes) as { readonly positions: readonly ProbePosition[] };
  const san = JSON.parse(texts.san) as Readonly<Record<string, Readonly<Record<string, string>>>>;
  const sfByFen = new Map(sfRows.map((row) => [row.fen, row]));
  const probeByFen = new Map(probes.positions.map((row) => [row.fen, row]));
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
    const traits = new Map<string, Traits>();
    for (const move of new Set([...raw.keys(), ...sfLoss.keys()])) {
      const value = classify(row.fen, row.ply, move);
      if (value === null) unmappableCandidates += 1;
      else traits.set(move, value);
    }
    cells.push({ fen: row.fen, phase: row.phase, ply: row.ply, band: row.elo, raw, sfLoss, human, traits });
  }
  return { cells, inputs: Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, digest(text)])),
    population: { maiaRows: maia.length, sfRows: sfRows.length, probePositions: probes.positions.length,
      cells: cells.length, abstainedMixedScoreCells, unmappableCandidates } };
}

function rounded<T extends Record<string, number>>(value: T): T {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Number(item.toFixed(6))])) as T;
}

function evaluate(candidate: Metrics, base: Metrics, production: ReturnType<typeof productionMetrics>) {
  const traitDelta = candidate.traitRate - base.traitRate;
  const lossDeltaCp = candidate.expectedLossCp - production.expectedLossCp;
  const severeRise = candidate.severe250 - production.severe250;
  const humanRetention = candidate.humanMatch / production.humanMatch;
  return rounded({ traitDelta, lossDeltaCp, severeRise, humanRetention,
    pass: Number(traitDelta >= PARAMETERS.gates.traitDelta
      && Math.abs(lossDeltaCp) <= PARAMETERS.gates.lossDeltaCp
      && severeRise <= PARAMETERS.gates.severeRise
      && humanRetention >= PARAMETERS.gates.humanRetention) });
}

function markdown(result: any): string {
  const rows = ATOMS.map((atom) => {
    const base = result.summary[atom].guarded as Metrics, candidate = result.summary[atom].weighted as Metrics;
    const gate = result.gates[atom];
    return `| ${atom} | ${base.opportunityCells} | ${(base.traitRate * 100).toFixed(2)}% | ${(candidate.traitRate * 100).toFixed(2)}% | ${(gate.traitDelta * 100).toFixed(2)} pp | ${(base.conditionalTraitRate * 100).toFixed(1)}→${(candidate.conditionalTraitRate * 100).toFixed(1)}% | ${(gate.humanRetention * 100).toFixed(1)}% | ${gate.pass === 1 ? "PASS" : "FAIL"} |`;
  });
  return `# D1062 shared style atoms as bot traits — results\n\nThe labels below are literal mechanics, not personalities or human-likeness claims. All arms use the corrected D969 whole-cell mate/cp abstention and the 250-cp guard.\n\n| Atom | opportunity cells | guarded rate | ×4 rate | delta | opportunity-only rate | human retention | gate |\n|---|---:|---:|---:|---:|---:|---:|---|\n${rows.join("\n")}\n\nControls: pawn ×4 **${result.controls.pawn.pass === 1 ? "PASS" : "FAIL"}**; forcing ×3 **${result.controls.forcing.pass === 1 ? "PASS (unexpected)" : "FAIL as preregistered"}**. Multipliers ×2 and ×8 are diagnostics only and cannot replace the preregistered ×4 verdict.\n`;
}

describe("D1062 shared style atoms", () => {
  it("uses semantic castling on standard and nonstandard Chess960 positions", () => {
    const standard = classify("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", 0, "e1h1");
    const chess960 = classify("1k6/8/8/8/8/8/PPPP4/RK6 w Q - 0 1", 0, "b1a1");
    expect(standard?.castle).toBe(true);
    expect(chess960?.castle).toBe(true);
    expect(Math.abs(parseSquare("a1")! - parseSquare("b1")!)).not.toBe(2);
  });

  it("emits fianchetto completion once rather than on every preserving move", () => {
    const created = classify("4k3/8/8/8/8/5NP1/8/4KB1R w K - 0 1", 0, "f1g2");
    expect(created?.fianchettoSetup).toBe(true);
    expect(created?.fianchettoScreen).toBe(true);
    const preserved = classify("4k3/8/8/8/8/5NP1/6B1/4K2R w K - 0 1", 0, "h1h2");
    expect(preserved?.fianchettoSetup).toBe(false);
    expect(preserved?.fianchettoScreen).toBe(false);
  });

  it.skipIf(INPUT_DIR === undefined)("measures the preregistered fixed population", () => {
    const loaded = loadCells(INPUT_DIR!);
    expect(loaded.population).toMatchObject({ maiaRows: 837, sfRows: 279, probePositions: 279,
      cells: 804, abstainedMixedScoreCells: 33, unmappableCandidates: 0 });
    const production = productionMetrics(loaded.cells);
    const summary = Object.fromEntries(ATOMS.map((atom) => [atom, {
      guarded: rounded(metrics(loaded.cells, atom, 1)),
      weighted: rounded(metrics(loaded.cells, atom, PARAMETERS.traitMultiplier)),
      byBand: Object.fromEntries([1400, 1600, 1800].map((band) => [band, {
        guarded: rounded(metrics(loaded.cells.filter((cell) => cell.band === band), atom, 1)),
        weighted: rounded(metrics(loaded.cells.filter((cell) => cell.band === band), atom, PARAMETERS.traitMultiplier)),
      }])),
    }]));
    const gates = Object.fromEntries(ATOMS.map((atom) => [atom,
      evaluate(summary[atom]!.weighted, summary[atom]!.guarded, production)]));
    const pawnBase = metrics(loaded.cells, "pawn", 1), pawn = metrics(loaded.cells, "pawn", 4);
    const forcingBase = metrics(loaded.cells, "forcing", 1), forcing = metrics(loaded.cells, "forcing", 3);
    const controls = { pawn: evaluate(pawn, pawnBase, production), forcing: evaluate(forcing, forcingBase, production) };
    const sensitivity = Object.fromEntries(ATOMS.map((atom) => [atom, Object.fromEntries([2, 8].map((multiplier) => {
      const candidate = rounded(metrics(loaded.cells, atom, multiplier));
      return [multiplier, { metrics: candidate, gate: evaluate(candidate, summary[atom]!.guarded, production) }];
    }))]));
    expect(rounded(production)).toMatchObject({ expectedLossCp: 20.821109, severe250: 0.004316, humanMatch: 0.31329 });
    expect(rounded(pawn)).toMatchObject({ expectedLossCp: 19.945575, humanMatch: 0.309485 });
    expect(rounded(forcing)).toMatchObject({ expectedLossCp: 19.965684, humanMatch: 0.311082 });
    expect(controls.pawn.pass).toBe(1);
    expect(controls.forcing.pass).toBe(0);
    const result = { experiment: "D1062", measuredAt: new Date().toISOString(), parameters: PARAMETERS, inputs: loaded.inputs,
      population: loaded.population, production: rounded(production), summary, gates, controls, sensitivity };
    if (WRITE) {
      writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(REPORT, markdown(result));
    }
    expect(Object.keys(summary)).toEqual(ATOMS);
  });
});
