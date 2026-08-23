// DISPOSABLE research harness — D815. Not production code.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { isNormal } from "chessops/types";
import { makeSquare, parseUci } from "chessops/util";
import { threats, type Threat } from "../../packages/runtime/src/tactics.js";
import { describe, expect, it } from "vitest";

const INPUT_DIR = process.env.TABIYA_D815_INPUT_DIR;
const WRITE = process.env.TABIYA_D815_WRITE === "1";
const OUTPUT = new URL("./out/summary.json", import.meta.url);
const BANDS = Object.freeze([1400, 1600, 1800] as const);
const FOLDS = 10;
const PERMUTATIONS = 200;
const SEVERE_CP = 250;
const RIDGE = 1e-9;

interface ExtractedPosition {
  readonly packId: string;
  readonly phase: string;
  readonly fen: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

interface ExplorerMove { readonly san: string; readonly n: number }
interface ExplorerBand { readonly total: number; readonly moves: readonly ExplorerMove[] }
interface ProbePosition {
  readonly fen: string;
  readonly packId: string;
  readonly phase: string;
  readonly ply: number;
  readonly bands: Readonly<Record<string, ExplorerBand>>;
}

interface StockfishEntry { readonly uci: string; readonly cp: number | null; readonly mate: number | null }
interface StockfishRow { readonly fen: string; readonly entries: readonly StockfishEntry[] }
interface SalienceFlags {
  readonly attackerJustMoved: boolean;
  readonly stationaryThreatCreated: boolean;
  readonly retainedThreat: boolean;
  readonly noCurrentThreat: boolean;
}

interface PositionReading extends SalienceFlags {
  readonly fen: string;
  readonly packId: string;
  readonly phase: string;
  readonly ply: number;
  readonly legalSevereFraction: number;
}

interface Cell extends PositionReading {
  readonly band: number;
  readonly severeMassLowerBound: number;
  readonly mappedCoverage: number;
}

interface Inputs {
  readonly cells: readonly Cell[];
  readonly positions: readonly PositionReading[];
  readonly digests: Readonly<Record<string, string>>;
  readonly sourceCounts: Readonly<Record<string, number>>;
  readonly withheld: Readonly<Record<string, number>>;
  readonly unresolvedSanRows: number;
}

function digest(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function canonical(fen: string): string {
  return makeFen(Chess.fromSetup(parseFen(fen).unwrap()).unwrap().toSetup());
}

function threatKey(value: Threat): string {
  const target = value.target === undefined
    ? "none"
    : `${value.target.piece.color}:${value.target.piece.role}:${value.target.square}`;
  return [
    value.threateningPiece.piece.color,
    value.threateningPiece.piece.role,
    value.threateningPiece.square,
    value.threatenedMove,
    target,
    value.mate ? "mate" : "not_mate",
  ].join("|");
}

function previousEdge(position: ExtractedPosition): {
  readonly beforeFen: string;
  readonly afterFen: string;
  readonly destination: string;
} | undefined {
  if (position.historyUci.length === 0) return undefined;
  const board = Chess.fromSetup(parseFen(position.startFen).unwrap()).unwrap();
  for (const moveUci of position.historyUci.slice(0, -1)) {
    const move = parseUci(moveUci);
    if (move === undefined || !isNormal(move) || !board.isLegal(move)) throw new TypeError(`${position.packId}: invalid history ${moveUci}`);
    board.play(move);
  }
  const beforeFen = makeFen(board.toSetup());
  const lastUci = position.historyUci.at(-1)!;
  const last = parseUci(lastUci);
  if (last === undefined || !isNormal(last) || !board.isLegal(last)) throw new TypeError(`${position.packId}: invalid preceding move ${lastUci}`);
  const destination = makeSquare(last.to);
  board.play(last);
  const afterFen = makeFen(board.toSetup());
  if (afterFen !== canonical(position.fen)) throw new TypeError(`${position.packId}: replay does not reproduce ${position.fen}`);
  return Object.freeze({ beforeFen, afterFen, destination });
}

function salience(position: ExtractedPosition): SalienceFlags | "no_history" | "threat_abstained" {
  const edge = previousEdge(position);
  if (edge === undefined) return "no_history";
  const current = threats(edge.afterFen);
  if (current.kind === "abstained") return "threat_abstained";

  const before = Chess.fromSetup(parseFen(edge.beforeFen).unwrap()).unwrap();
  const after = Chess.fromSetup(parseFen(edge.afterFen).unwrap()).unwrap();
  before.turn = after.turn;
  const prior = threats(makeFen(before.toSetup()));
  if (prior.kind === "abstained") return "threat_abstained";

  const priorKeys = new Set(prior.threats.map(threatKey));
  const currentRows = current.threats.map((threat) => Object.freeze({ threat, key: threatKey(threat) }));
  return Object.freeze({
    attackerJustMoved: currentRows.some(({ threat }) => threat.threateningPiece.square === edge.destination),
    stationaryThreatCreated: currentRows.some(({ threat, key }) => threat.threateningPiece.square !== edge.destination && !priorKeys.has(key)),
    retainedThreat: currentRows.some(({ key }) => priorKeys.has(key)),
    noCurrentThreat: currentRows.length === 0,
  });
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? Number.NaN : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantile(values: readonly number[], fraction: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index), upper = Math.ceil(index);
  return lower === upper ? sorted[lower]! : sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (index - lower);
}

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) { result ^= char.codePointAt(0)!; result = Math.imul(result, 16777619); }
  return result >>> 0;
}

function vector(cell: Cell, augmented: boolean, flags: SalienceFlags = cell): number[] {
  const values = [
    1,
    cell.legalSevereFraction,
    cell.ply / 20,
    Number(cell.band === 1600),
    Number(cell.band === 1800),
    Number(cell.phase === "middlegame"),
    Number(cell.phase === "endgame"),
    Number(cell.phase === "cross_phase"),
  ];
  if (augmented) values.push(
    Number(flags.attackerJustMoved),
    Number(flags.stationaryThreatCreated),
    Number(flags.retainedThreat),
  );
  return values;
}

function solve(matrix: number[][], values: number[]): number[] {
  const rows = matrix.map((row, index) => [...row, values[index]!]);
  for (let pivot = 0; pivot < rows.length; pivot += 1) {
    let selected = pivot;
    for (let row = pivot + 1; row < rows.length; row += 1) {
      if (Math.abs(rows[row]![pivot]!) > Math.abs(rows[selected]![pivot]!)) selected = row;
    }
    [rows[pivot], rows[selected]] = [rows[selected]!, rows[pivot]!];
    const divisor = rows[pivot]![pivot]!;
    if (Math.abs(divisor) < 1e-15) throw new TypeError("Salience regression is singular");
    for (let column = pivot; column <= rows.length; column += 1) rows[pivot]![column] /= divisor;
    for (let row = 0; row < rows.length; row += 1) {
      if (row === pivot) continue;
      const factor = rows[row]![pivot]!;
      for (let column = pivot; column <= rows.length; column += 1) rows[row]![column] -= factor * rows[pivot]![column]!;
    }
  }
  return rows.map((row) => row.at(-1)!);
}

function fit(cells: readonly Cell[], augmented: boolean, flags?: ReadonlyMap<string, SalienceFlags>): number[] {
  const size = vector(cells[0]!, augmented, flags?.get(cells[0]!.fen) ?? cells[0]!).length;
  const xtx = Array.from({ length: size }, () => Array<number>(size).fill(0));
  const xty = Array<number>(size).fill(0);
  for (const cell of cells) {
    const row = vector(cell, augmented, flags?.get(cell.fen) ?? cell);
    for (let left = 0; left < size; left += 1) {
      xty[left] += row[left]! * cell.severeMassLowerBound;
      for (let right = 0; right < size; right += 1) xtx[left]![right] += row[left]! * row[right]!;
    }
  }
  for (let index = 1; index < size; index += 1) xtx[index]![index] += RIDGE;
  return solve(xtx, xty);
}

function dot(left: readonly number[], right: readonly number[]): number {
  return left.reduce((sum, value, index) => sum + value * right[index]!, 0);
}

interface Prediction extends Cell { readonly predicted: number; readonly residual: number }
function crossValidate(cells: readonly Cell[], augmented: boolean, flags?: ReadonlyMap<string, SalienceFlags>) {
  const predictions: Prediction[] = [];
  for (let fold = 0; fold < FOLDS; fold += 1) {
    const test = cells.filter((cell) => hash(cell.packId) % FOLDS === fold);
    if (test.length === 0) continue;
    const train = cells.filter((cell) => hash(cell.packId) % FOLDS !== fold);
    const coefficients = fit(train, augmented, flags);
    for (const cell of test) {
      const predicted = dot(vector(cell, augmented, flags?.get(cell.fen) ?? cell), coefficients);
      predictions.push(Object.freeze({ ...cell, predicted, residual: cell.severeMassLowerBound - predicted }));
    }
  }
  if (predictions.length !== cells.length) throw new TypeError("Grouped cross-validation omitted cells");
  const squared = predictions.map((row) => row.residual ** 2);
  const absolute = predictions.map((row) => Math.abs(row.residual));
  const targetMean = mean(predictions.map((row) => row.severeMassLowerBound));
  const total = predictions.reduce((sum, row) => sum + (row.severeMassLowerBound - targetMean) ** 2, 0);
  return Object.freeze({
    rmse: Math.sqrt(mean(squared)),
    mae: mean(absolute),
    r2: total === 0 ? null : 1 - squared.reduce((sum, value) => sum + value, 0) / total,
    predictions: Object.freeze(predictions),
  });
}

function random(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ mixed >>> 15, mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61);
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

function positionQuartiles(positions: readonly PositionReading[]): ReadonlyMap<string, number> {
  const sorted = [...positions].sort((left, right) => left.legalSevereFraction - right.legalSevereFraction || left.fen.localeCompare(right.fen));
  return new Map(sorted.map((position, index) => [position.fen, Math.min(3, Math.floor(index * 4 / sorted.length))]));
}

function permutedFlags(positions: readonly PositionReading[], rng: () => number): ReadonlyMap<string, SalienceFlags> {
  const quartiles = positionQuartiles(positions);
  const strata = new Map<string, PositionReading[]>();
  for (const position of positions) {
    const key = `${position.phase}:${quartiles.get(position.fen)}`;
    const values = strata.get(key) ?? [];
    values.push(position);
    strata.set(key, values);
  }
  const output = new Map<string, SalienceFlags>();
  for (const values of strata.values()) {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const other = Math.floor(rng() * (index + 1));
      [shuffled[index], shuffled[other]] = [shuffled[other]!, shuffled[index]!];
    }
    values.forEach((position, index) => {
      const donor = shuffled[index]!;
      output.set(position.fen, Object.freeze({
        attackerJustMoved: donor.attackerJustMoved,
        stationaryThreatCreated: donor.stationaryThreatCreated,
        retainedThreat: donor.retainedThreat,
        noCurrentThreat: donor.noCurrentThreat,
      }));
    });
  }
  return output;
}

function residualSummary(rows: readonly Prediction[]) {
  const summary = (selected: readonly Prediction[]) => Object.freeze({
    cells: selected.length,
    mean: mean(selected.map((row) => row.residual)),
    median: quantile(selected.map((row) => row.residual), 0.5),
  });
  return Object.freeze({
    attackerJustMoved: summary(rows.filter((row) => row.attackerJustMoved)),
    stationaryThreatCreated: summary(rows.filter((row) => row.stationaryThreatCreated)),
    byBand: Object.fromEntries(BANDS.map((band) => [band, Object.freeze({
      attackerJustMoved: summary(rows.filter((row) => row.band === band && row.attackerJustMoved)),
      stationaryThreatCreated: summary(rows.filter((row) => row.band === band && row.stationaryThreatCreated)),
    })])),
  });
}

function loadInputs(directory: string): Inputs {
  const paths = {
    positions: `${directory}/positions.json`,
    probes: `${directory}/probe-set.json`,
    san: `${directory}/san-map.json`,
    sf: `${directory}/sf-d12.jsonl`,
  };
  const texts = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, "utf8")])) as Record<keyof typeof paths, string>;
  const extracted = (JSON.parse(texts.positions) as { readonly positions: readonly ExtractedPosition[] }).positions;
  const probes = (JSON.parse(texts.probes) as { readonly positions: readonly ProbePosition[] }).positions;
  const san = JSON.parse(texts.san) as Readonly<Record<string, Readonly<Record<string, string>>>>;
  const sfRows = texts.sf.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as StockfishRow);
  const extractedByFen = new Map(extracted.map((position) => [canonical(position.fen), position]));
  const sfByFen = new Map(sfRows.map((row) => [canonical(row.fen), row]));
  const withheld: Record<string, number> = {};
  const withhold = (reason: string): void => { withheld[reason] = (withheld[reason] ?? 0) + 1; };
  const positions: PositionReading[] = [];
  const cells: Cell[] = [];
  let unresolvedSanRows = 0;

  for (const probe of probes) {
    const fen = canonical(probe.fen);
    const source = extractedByFen.get(fen);
    const sf = sfByFen.get(fen);
    if (source === undefined) { withhold("history_missing"); continue; }
    if (sf === undefined) { withhold("stockfish_missing"); continue; }
    if (sf.entries.some((entry) => entry.mate !== null)) { withhold("typed_mate_score"); continue; }
    let flags: ReturnType<typeof salience>;
    try { flags = salience(source); } catch { withhold("history_replay_failed"); continue; }
    if (flags === "no_history" || flags === "threat_abstained") { withhold(flags); continue; }
    const scores = new Map(sf.entries.flatMap((entry) => entry.cp === null ? [] : [[entry.uci, entry.cp] as const]));
    if (scores.size !== sf.entries.length || scores.size === 0) { withhold("stockfish_incomplete"); continue; }
    const best = Math.max(...scores.values());
    const losses = new Map([...scores].map(([uci, cp]) => [uci, best - cp]));
    const reading: PositionReading = Object.freeze({
      fen,
      packId: probe.packId,
      phase: probe.phase,
      ply: probe.ply,
      legalSevereFraction: [...losses.values()].filter((loss) => loss >= SEVERE_CP).length / losses.size,
      ...flags,
    });
    let added = 0;
    for (const band of BANDS) {
      const explorer = probe.bands[String(band)];
      if (explorer === undefined || explorer.total <= 0) continue;
      let mappedGames = 0, severeGames = 0;
      for (const move of explorer.moves) {
        const rawUci = san[fen]?.[move.san];
        const uci = rawUci === undefined ? undefined : ({ e1h1: "e1g1", e1a1: "e1c1", e8h8: "e8g8", e8a8: "e8c8" } as Record<string, string>)[rawUci] ?? rawUci;
        const loss = uci === undefined ? undefined : losses.get(uci);
        if (loss === undefined) { unresolvedSanRows += 1; continue; }
        mappedGames += move.n;
        if (loss >= SEVERE_CP) severeGames += move.n;
      }
      cells.push(Object.freeze({
        ...reading,
        band,
        severeMassLowerBound: severeGames / explorer.total,
        mappedCoverage: mappedGames / explorer.total,
      }));
      added += 1;
    }
    if (added === 0) { withhold("zero_explorer_total"); continue; }
    positions.push(reading);
  }

  return Object.freeze({
    cells: Object.freeze(cells),
    positions: Object.freeze(positions),
    digests: Object.freeze(Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, digest(text)]))),
    sourceCounts: Object.freeze({ extracted: extracted.length, probes: probes.length, stockfish: sfRows.length }),
    withheld: Object.freeze(withheld),
    unresolvedSanRows,
  });
}

function rounded(value: number): number | null {
  return Number.isFinite(value) ? Number(value.toFixed(8)) : null;
}

describe("D815 threat salience", () => {
  it("reconstructs the previous edge and keeps a quiet opening move honestly empty", () => {
    const flags = salience({
      packId: "synthetic",
      phase: "opening",
      startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      historyUci: ["e2e4"],
      fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    });
    expect(flags).toEqual({
      attackerJustMoved: false,
      stationaryThreatCreated: false,
      retainedThreat: false,
      noCurrentThreat: true,
    });
  });

  it("makes grouped cross-validation able to distinguish a real added signal", () => {
    const cells = Array.from({ length: 40 }, (_, index): Cell => Object.freeze({
      fen: `fen-${index}`,
      packId: `pack-${index}`,
      phase: "opening",
      ply: index % 20,
      band: BANDS[index % BANDS.length]!,
      legalSevereFraction: (index % 5) / 5,
      attackerJustMoved: index % 2 === 0,
      stationaryThreatCreated: false,
      retainedThreat: false,
      noCurrentThreat: false,
      severeMassLowerBound: (index % 5) / 100 + (index % 2 === 0 ? 0.02 : 0),
      mappedCoverage: 1,
    }));
    expect(crossValidate(cells, true).rmse).toBeLessThan(crossValidate(cells, false).rmse);
  });

  it.skipIf(INPUT_DIR === undefined)("runs the predeclared fixed-population decision", () => {
    const input = loadInputs(INPUT_DIR!);
    expect(input.sourceCounts).toEqual({ extracted: 638, probes: 279, stockfish: 279 });
    expect(input.cells.length).toBeGreaterThan(0);
    expect(input.positions.length).toBeGreaterThan(0);
    const base = crossValidate(input.cells, false);
    const augmented = crossValidate(input.cells, true);
    const improvement = (base.rmse - augmented.rmse) / base.rmse;
    const rng = random(0xd8152026);
    const permutedImprovements = Array.from({ length: PERMUTATIONS }, () => {
      const flags = permutedFlags(input.positions, rng);
      const result = crossValidate(input.cells, true, flags);
      return (base.rmse - result.rmse) / base.rmse;
    });
    const permutationPercentile = permutedImprovements.filter((value) => value <= improvement).length / PERMUTATIONS;
    const pValue = (1 + permutedImprovements.filter((value) => value >= improvement).length) / (PERMUTATIONS + 1);
    const residuals = residualSummary(base.predictions);
    const attackerPositions = input.positions.filter((position) => position.attackerJustMoved).length;
    const stationaryPositions = input.positions.filter((position) => position.stationaryThreatCreated).length;
    const pooledDirection = residuals.stationaryThreatCreated.mean > residuals.attackerJustMoved.mean;
    const bandsInDirection = BANDS.filter((band) => {
      const row = residuals.byBand[band];
      return row.stationaryThreatCreated.mean > row.attackerJustMoved.mean;
    }).length;
    const criteria = Object.freeze({
      coverage: Object.freeze({ attackerPositions, stationaryPositions, pass: attackerPositions >= 20 && stationaryPositions >= 20 }),
      incremental: Object.freeze({ improvement: rounded(improvement), permutationPercentile: rounded(permutationPercentile), pValue: rounded(pValue), pass: improvement >= 0.02 && pValue <= 0.05 }),
      direction: Object.freeze({ pooledDirection, bandsInDirection, pass: pooledDirection && bandsInDirection >= 2 }),
    });
    const result = Object.freeze({
      measuredAt: new Date().toISOString(),
      parameters: Object.freeze({ severeCp: SEVERE_CP, folds: FOLDS, permutations: PERMUTATIONS, ridge: RIDGE, seed: "0xd8152026" }),
      inputs: input.digests,
      population: Object.freeze({
        ...input.sourceCounts,
        usablePositions: input.positions.length,
        usableCells: input.cells.length,
        withheld: input.withheld,
        unresolvedSanRows: input.unresolvedSanRows,
        mappingCoverage: Object.freeze({
          min: rounded(Math.min(...input.cells.map((cell) => cell.mappedCoverage))),
          median: rounded(quantile(input.cells.map((cell) => cell.mappedCoverage), 0.5)),
          max: rounded(Math.max(...input.cells.map((cell) => cell.mappedCoverage))),
        }),
        flags: Object.freeze({
          attackerJustMoved: attackerPositions,
          stationaryThreatCreated: stationaryPositions,
          retainedThreat: input.positions.filter((position) => position.retainedThreat).length,
          noCurrentThreat: input.positions.filter((position) => position.noCurrentThreat).length,
        }),
      }),
      models: Object.freeze({
        base: Object.freeze({ rmse: rounded(base.rmse), mae: rounded(base.mae), r2: rounded(base.r2 ?? Number.NaN) }),
        augmented: Object.freeze({ rmse: rounded(augmented.rmse), mae: rounded(augmented.mae), r2: rounded(augmented.r2 ?? Number.NaN) }),
      }),
      residuals,
      permutation: Object.freeze({
        percentile: rounded(permutationPercentile),
        pValue: rounded(pValue),
        improvementMedian: rounded(quantile(permutedImprovements, 0.5)),
        improvementP95: rounded(quantile(permutedImprovements, 0.95)),
      }),
      criteria,
      verdict: criteria.coverage.pass && criteria.incremental.pass && criteria.direction.pass ? "admit_future_rfc" : "kill_for_1_0",
    });
    if (WRITE) {
      mkdirSync(new URL("./out/", import.meta.url), { recursive: true });
      writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
    }
    expect(result.verdict === "admit_future_rfc" || result.verdict === "kill_for_1_0").toBe(true);
  });
});
