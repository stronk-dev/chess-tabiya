// DISPOSABLE research harness — D2237. Not production code.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

import { Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

const INPUT_DIR = process.env.TABIYA_D2237_INPUT_DIR;
const WRITE = process.env.TABIYA_D2237_WRITE === "1";
const RESULT = new URL("../../planning/bot-roster/d2237-stage-a-trait-screen-results.json", import.meta.url);
const REPORT = new URL("../../planning/bot-roster/d2237-stage-a-trait-screen-results.md", import.meta.url);

type Distribution = ReadonlyMap<string, number>;
type Trait = "minorPiece" | "centralDestination" | "longMove" | "pieceRepeat" |
  "rimDestination" | "capture" | "givesCheck" | "forwardMove";

interface MaiaCandidate { readonly uci: string; readonly policy: number | null }
interface MaiaRow {
  readonly fen: string; readonly phase: string; readonly ply: number; readonly elo: number;
  readonly candidates: readonly MaiaCandidate[];
}
interface SfEntry { readonly uci: string; readonly cp: number | null; readonly mate: number | null }
interface SfRow { readonly fen: string; readonly entries: readonly SfEntry[] }
interface ExplorerMove { readonly san: string; readonly n: number }
interface ExplorerBand { readonly total: number; readonly moves: readonly ExplorerMove[] }
interface ProbePosition {
  readonly fen: string; readonly startFen: string; readonly historyUci: readonly string[];
  readonly bands: Readonly<Record<string, ExplorerBand>>;
}
interface Flags extends Readonly<Record<Trait, boolean>> {
  readonly pawn: boolean; readonly forcing: boolean;
}
interface Cell {
  readonly fen: string; readonly phase: string; readonly ply: number; readonly band: number;
  readonly raw: Distribution; readonly sfLoss: ReadonlyMap<string, number>;
  readonly human: ReadonlyMap<string, number>; readonly flags: ReadonlyMap<string, Flags>;
}
interface Metrics {
  readonly cells: number; readonly expectedLossCp: number; readonly severe250: number;
  readonly humanMatch: number; readonly traitRate: number; readonly opportunityCells: number;
  readonly intermediateCells: number; readonly conditionalTraitRate: number;
}

const TRAITS: readonly Trait[] = [
  "minorPiece", "centralDestination", "longMove", "pieceRepeat", "rimDestination", "capture",
  "givesCheck", "forwardMove",
];
const MULTIPLIERS: Readonly<Record<Trait, number>> = Object.freeze({
  minorPiece: 4, centralDestination: 4, longMove: 4, pieceRepeat: 0.25,
  rimDestination: 0.25, capture: 4, givesCheck: 4, forwardMove: 3,
});
const PARAMETERS = Object.freeze({
  temperature: 0.8, topP: 0.92, guardCp: 250,
  gates: Object.freeze({ traitMovement: 0.10, lossDeltaCp: 35, severeRise: 0.01, humanRetention: 0.90 }),
  sensitivity: Object.freeze([2, 8]),
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

function precedingMoverDestination(startFen: string, history: readonly string[]): number | null {
  const position = Chess.fromSetup(parseFen(startFen).unwrap()).unwrap();
  const destinations = new Map<"white" | "black", number>();
  for (const uci of history) {
    const parsed = parseUci(uci);
    if (parsed === undefined || !isNormal(parsed)) throw new TypeError(`unparseable history move ${uci}`);
    const move = normalizeMove(position, parsed);
    if (!position.isLegal(move)) throw new TypeError(`illegal history move ${uci}`);
    destinations.set(position.turn, move.to);
    position.play(move);
  }
  return destinations.get(position.turn) ?? null;
}

function classify(fen: string, uci: string, priorOwnDestination: number | null): Flags | null {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const parsed = parseUci(uci);
  if (parsed === undefined || !isNormal(parsed)) return null;
  const move = normalizeMove(position, parsed);
  if (!position.isLegal(move)) return null;
  const piece = position.board.get(move.from);
  if (piece === undefined) return null;
  const capture = position.board.occupied.has(move.to)
    || (piece.role === "pawn" && position.epSquare === move.to);
  const fromFile = move.from & 7, fromRank = move.from >> 3;
  const toFile = move.to & 7, toRank = move.to >> 3;
  const after = position.clone();
  after.play(move);
  return Object.freeze({
    pawn: piece.role === "pawn",
    forcing: capture || after.isCheck(),
    minorPiece: piece.role === "bishop" || piece.role === "knight",
    centralDestination: toFile >= 2 && toFile <= 5 && toRank >= 2 && toRank <= 5,
    longMove: Math.max(Math.abs(toFile - fromFile), Math.abs(toRank - fromRank)) >= 3,
    pieceRepeat: priorOwnDestination !== null && move.from === priorOwnDestination,
    rimDestination: toFile === 0 || toFile === 7 || toRank === 0 || toRank === 7,
    capture,
    givesCheck: after.isCheck(),
    forwardMove: piece.color === "white" ? toRank > fromRank : toRank < fromRank,
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

function distribution(cell: Cell, trait?: Trait | "pawn" | "forcing", multiplier = 1): Distribution {
  const base = guard(productionSampler(cell.raw), cell.sfLoss);
  return trait === undefined ? base : reweight(base, (move) => cell.flags.get(move)?.[trait] === true, multiplier);
}

function metrics(cells: readonly Cell[], trait?: Trait | "pawn" | "forcing", multiplier = 1): Metrics {
  let expectedLossCp = 0, severe250 = 0, humanMatch = 0, traitRate = 0;
  let opportunityCells = 0, intermediateCells = 0, conditionalTraitMass = 0;
  for (const cell of cells) {
    const base = distribution(cell);
    const dist = distribution(cell, trait, multiplier);
    expectedLossCp += expected(dist, cell.sfLoss);
    severe250 += expected(dist, cell.sfLoss, (value) => value >= 250);
    humanMatch += dot(dist, cell.human);
    if (trait !== undefined) {
      const rate = [...dist].reduce((sum, [move, mass]) => sum + (cell.flags.get(move)?.[trait] === true ? mass : 0), 0);
      const baseRate = [...base].reduce((sum, [move, mass]) => sum + (cell.flags.get(move)?.[trait] === true ? mass : 0), 0);
      traitRate += rate;
      if (baseRate > 0 && baseRate < 1) { opportunityCells += 1; conditionalTraitMass += rate; }
      if (baseRate > 0.05 && baseRate < 0.80) intermediateCells += 1;
    }
  }
  return {
    cells: cells.length, expectedLossCp: expectedLossCp / cells.length,
    severe250: severe250 / cells.length, humanMatch: humanMatch / cells.length,
    traitRate: traitRate / cells.length, opportunityCells, intermediateCells,
    conditionalTraitRate: opportunityCells === 0 ? 0 : conditionalTraitMass / opportunityCells,
  };
}

function productionMetrics(cells: readonly Cell[]) {
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
    probes: `${directory}/probe-set.json`, san: `${directory}/san-map.json`,
    maiaIdentity: `${directory}/armA-history.jsonl.identity.json`,
    stockfishIdentity: `${directory}/stockfish.identity.txt` };
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
    const priorOwnDestination = precedingMoverDestination(probe.startFen, probe.historyUci);
    const flags = new Map<string, Flags>();
    for (const move of new Set([...raw.keys(), ...sfLoss.keys()])) {
      const value = classify(row.fen, move, priorOwnDestination);
      if (value === null) unmappableCandidates += 1;
      else flags.set(move, value);
    }
    cells.push({ fen: row.fen, phase: row.phase, ply: row.ply, band: row.elo, raw, sfLoss, human, flags });
  }
  return { cells, inputs: Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, digest(text)])),
    population: { maiaRows: maia.length, sfRows: sfRows.length, probePositions: probes.positions.length,
      cells: cells.length, abstainedMixedScoreCells, unmappableCandidates } };
}

function rounded<T extends Record<string, number>>(value: T): T {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Number(item.toFixed(6))])) as T;
}

function gate(candidate: Metrics, base: Metrics, production: ReturnType<typeof productionMetrics>, multiplier: number) {
  const traitMovement = multiplier < 1 ? base.traitRate - candidate.traitRate : candidate.traitRate - base.traitRate;
  const lossDeltaCp = candidate.expectedLossCp - production.expectedLossCp;
  const severeRise = candidate.severe250 - production.severe250;
  const humanRetention = candidate.humanMatch / production.humanMatch;
  return rounded({ traitMovement, lossDeltaCp, severeRise, humanRetention,
    pass: Number(traitMovement >= PARAMETERS.gates.traitMovement
      && Math.abs(lossDeltaCp) <= PARAMETERS.gates.lossDeltaCp
      && severeRise <= PARAMETERS.gates.severeRise
      && humanRetention >= PARAMETERS.gates.humanRetention) });
}

function report(result: any): string {
  const rows = TRAITS.map((trait) => {
    const base = result.summary[trait].guarded as Metrics;
    const candidate = result.summary[trait].weighted as Metrics;
    const verdict = result.gates[trait];
    return `| ${trait} | ×${MULTIPLIERS[trait]} | ${(base.traitRate * 100).toFixed(2)}% | ${(candidate.traitRate * 100).toFixed(2)}% | ${(verdict.traitMovement * 100).toFixed(2)} pp | ${base.opportunityCells} | ${base.intermediateCells} | ${verdict.lossDeltaCp.toFixed(2)} cp | ${(verdict.humanRetention * 100).toFixed(1)}% | ${verdict.pass === 1 ? "PASS" : "FAIL"} |`;
  });
  return `# D2237 Stage-A bot-trait screen — results\n\nThese are literal one-ply mechanisms, not personalities or human-likeness claims.\n\n| classifier | transform | guarded | transformed | intended movement | opportunities | intermediate | loss shift | human retention | gate |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---|\n${rows.join("\n")}\n\nControls: pawn ×4 **${result.controls.pawn.pass === 1 ? "PASS" : "FAIL"}**; forcing ×3 **${result.controls.forcing.pass === 1 ? "PASS (unexpected)" : "FAIL as preregistered"}**. No passing arm enters the product without the full calibration contract.\n`;
}

describe("D2237 Stage-A bot-trait screen", () => {
  it("classifies all eight mechanics on able-to-fail fixtures", () => {
    const prior = parseSquare("f3")!;
    expect(classify("4k3/8/8/8/8/5N2/8/4K3 w - - 0 1", "f3e5", prior)).toMatchObject({
      minorPiece: true, centralDestination: true, pieceRepeat: true, rimDestination: false,
      capture: false, givesCheck: false, forwardMove: true,
    });
    expect(classify("4k3/8/8/8/8/8/8/R3K3 w - - 0 1", "a1a8", null)).toMatchObject({
      longMove: true, rimDestination: true, forwardMove: true, givesCheck: true,
    });
    expect(classify("4k3/8/8/8/8/8/4p3/4K3 w - - 0 1", "e1e2", null)).toMatchObject({ capture: true });
    expect(classify("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1d1", prior)).toMatchObject({
      minorPiece: false, centralDestination: false, longMove: false, pieceRepeat: false,
      capture: false, givesCheck: false, forwardMove: false,
    });
  });

  it("replays history to identify the mover's preceding destination", () => {
    expect(precedingMoverDestination("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      ["g1f3", "g8f6", "f3g1", "f6g8"])).toBe(parseSquare("g1"));
  });

  it("can fail reach and safety gates", () => {
    const base = { cells: 1, expectedLossCp: 0, severe250: 0, humanMatch: 0.5, traitRate: 0,
      opportunityCells: 0, intermediateCells: 0, conditionalTraitRate: 0 };
    expect(gate(base, base, { cells: 1, expectedLossCp: 0, severe250: 0, humanMatch: 0.5 }, 4).pass).toBe(0);
    const unsafe = { ...base, expectedLossCp: 260, severe250: 0.2, traitRate: 0.5 };
    expect(gate(unsafe, base, { cells: 1, expectedLossCp: 0, severe250: 0, humanMatch: 0.5 }, 4).pass).toBe(0);
  });

  it.skipIf(INPUT_DIR === undefined)("measures the preregistered fixed population", () => {
    const loaded = loadCells(INPUT_DIR!);
    expect(loaded.population).toMatchObject({ maiaRows: 837, sfRows: 279, probePositions: 279,
      cells: 804, abstainedMixedScoreCells: 33, unmappableCandidates: 0 });
    const production = rounded(productionMetrics(loaded.cells));
    const summary = Object.fromEntries(TRAITS.map((trait) => [trait, {
      guarded: rounded(metrics(loaded.cells, trait, 1)),
      weighted: rounded(metrics(loaded.cells, trait, MULTIPLIERS[trait])),
      byBand: Object.fromEntries([1400, 1600, 1800].map((band) => [band, {
        guarded: rounded(metrics(loaded.cells.filter((cell) => cell.band === band), trait, 1)),
        weighted: rounded(metrics(loaded.cells.filter((cell) => cell.band === band), trait, MULTIPLIERS[trait])),
      }])),
    }]));
    const gates = Object.fromEntries(TRAITS.map((trait) => [trait,
      gate(summary[trait]!.weighted, summary[trait]!.guarded, production, MULTIPLIERS[trait])]));
    const pawnBase = metrics(loaded.cells, "pawn", 1), pawn = metrics(loaded.cells, "pawn", 4);
    const forcingBase = metrics(loaded.cells, "forcing", 1), forcing = metrics(loaded.cells, "forcing", 3);
    const controls = { pawn: gate(pawn, pawnBase, production, 4), forcing: gate(forcing, forcingBase, production, 3) };
    const priorAnchor = { expectedLossCp: 20.821109, severe250: 0.004316, humanMatch: 0.31329 };
    const anchorDrift = rounded({ expectedLossCp: production.expectedLossCp - priorAnchor.expectedLossCp,
      severe250: production.severe250 - priorAnchor.severe250,
      humanMatch: production.humanMatch - priorAnchor.humanMatch });
    expect(Math.abs(anchorDrift.expectedLossCp)).toBeLessThanOrEqual(1);
    expect(Math.abs(anchorDrift.severe250)).toBeLessThanOrEqual(0.005);
    expect(anchorDrift.humanMatch).toBe(0);
    expect(controls.pawn.pass).toBe(1);
    expect(controls.forcing.pass).toBe(0);
    const sensitivity = Object.fromEntries(TRAITS.map((trait) => [trait,
      Object.fromEntries(PARAMETERS.sensitivity.map((multiplier) => {
        const effective = MULTIPLIERS[trait] < 1 ? 1 / multiplier : multiplier;
        const candidate = rounded(metrics(loaded.cells, trait, effective));
        return [String(effective), { metrics: candidate, gate: gate(candidate, summary[trait]!.guarded, production, effective) }];
      }))]));
    const result = { schema: "tabiya.research.d2237-bot-trait-screen.v1", measuredAt: new Date().toISOString(),
      parameters: { ...PARAMETERS, multipliers: MULTIPLIERS }, inputs: loaded.inputs,
      population: loaded.population, priorAnchor, anchorDrift, production, summary, gates, controls, sensitivity };
    if (WRITE) {
      writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(REPORT, report(result));
    }
    expect(Object.keys(summary)).toEqual(TRAITS);
  });
});
