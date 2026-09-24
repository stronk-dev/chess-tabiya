// `make recorded-semantic-path-check` (rfc/recorded-semantic-path §8). Deterministic census and eager
// parity over the fixed imported sample, plus the pinned-performance timing arms. Fixture positives
// and hard negatives run as the package tests invoked by the same make target.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";

import { commitMove, createRun, recordedSemanticPathExecution, type DrillRun, type RecordedSemanticPathExecution } from "@chess-tabiya/runtime";

const SAMPLE = resolve(process.cwd(), "tools/r2-selection-harness/imported-sample.pgn");
const ARMS = [20, 40, 80] as const;
const PATHS_PER_ARM = 12;
const MEASURED = 3;
const BUDGET_MS = 500;
const at = "2026-09-24T00:00:00.000Z";
const enforceTiming = process.env.RECORDED_PATH_TIMING !== "report";

interface Game { readonly index: number; readonly fen: string; readonly moves: readonly string[] }

function games(): readonly Game[] {
  const result: Game[] = [];
  for (const [index, game] of parsePgn(readFileSync(SAMPLE, "utf8")).entries()) {
    const setup = startingPosition(game.headers);
    if (setup.isErr) continue;
    const position = setup.value;
    const fen = makeFen(position.toSetup());
    const moves: string[] = [];
    for (const node of game.moves.mainline()) {
      const move = parseSan(position, node.san);
      if (move === undefined) break;
      moves.push(makeUci(move));
      position.play(move);
    }
    if (moves.length > 0) result.push({ index, fen, moves });
  }
  return result;
}

function run(game: Game, plies: number): DrillRun {
  let value = createRun({ id: `imported-sample:${game.index}:${plies}`, packId: "imported-sample", packDigest: `sha256:${"0".repeat(64)}`, startFen: game.fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
  for (const move of game.moves.slice(0, plies)) value = commitMove(value, move, { at }).run;
  return value;
}

function compile(value: DrillRun, preparation: "exact" | "eager" = "exact"): RecordedSemanticPathExecution {
  return recordedSemanticPathExecution(value, value.activeCursor.branchId, { preparation });
}

function quantiles(values: readonly number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const q = (fraction: number): number => sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
  return { samples: sorted.length, p50Ms: Number(q(0.5).toFixed(1)), p95Ms: Number(q(0.95).toFixed(1)), maxMs: Number((sorted.at(-1) ?? 0).toFixed(1)) };
}

const population = games();
const census = new Map<string, number>();
let paths = 0, plies = 0, events = 0;
for (const game of population) {
  const execution = compile(run(game, game.moves.length));
  if (execution.result.kind !== "available") throw new TypeError(`Imported sample game ${game.index} refused: ${execution.result.reason}`);
  if (execution.work.localFanOut !== 0 || execution.work.transitionCompiles !== game.moves.length || execution.work.checkProbes !== game.moves.length || execution.work.receipts !== game.moves.length * 13) {
    throw new TypeError(`Imported sample game ${game.index} broke the exact source-call contract`);
  }
  paths += 1;
  plies += game.moves.length;
  events += execution.result.events.length;
  for (const window of execution.result.windows) {
    const key = `${window.projection.id}@${window.projection.version}#${window.horizon}:${window.status}`;
    census.set(key, (census.get(key) ?? 0) + 1);
  }
}

const arms = ARMS.map((length) => {
  const selected = population.filter((game) => game.moves.length >= length).slice(0, PATHS_PER_ARM);
  if (selected.length !== PATHS_PER_ARM) throw new TypeError(`Imported sample has only ${selected.length} games of ${length}+ plies`);
  const runs = selected.map((game) => run(game, length));
  for (const value of runs) {
    const exact = compile(value), eager = compile(value, "eager");
    if (exact.result.kind !== "available" || eager.result.kind !== "available" || exact.result.digest !== eager.result.digest
      || JSON.stringify(exact.result.windows) !== JSON.stringify(eager.result.windows)
      || exact.result.events.map((event) => event.id).join("|") !== eager.result.events.map((event) => event.id).join("|")) {
      throw new TypeError(`Exact source closure diverged from the eager oracle on ${value.id}`);
    }
  }
  for (const value of runs) compile(value);
  const measured: RecordedSemanticPathExecution["timings"][] = [];
  for (let repetition = 0; repetition < MEASURED; repetition += 1) for (const value of runs) measured.push(compile(value).timings);
  const total = quantiles(measured.map((value) => value.totalMs));
  return {
    plies: length,
    paths: PATHS_PER_ARM,
    validation: quantiles(measured.map((value) => value.validationMs)),
    preparation: quantiles(measured.map((value) => value.preparationMs)),
    windows: quantiles(measured.map((value) => value.windowsMs)),
    total,
    withinBudget: total.p95Ms <= BUDGET_MS,
  };
});

const report = {
  node: process.version,
  platform: `${process.platform}/${process.arch}`,
  population: { source: "tools/r2-selection-harness/imported-sample.pgn", games: population.length, paths, plies, events },
  census: Object.fromEntries([...census].sort(([left], [right]) => left.localeCompare(right))),
  arms,
  eagerParity: "byte-equal on every timing-arm path",
};
console.log(JSON.stringify(report, null, 2));
const over = arms.filter((arm) => !arm.withinBudget);
if (over.length > 0) {
  const message = `recorded-semantic-path-check: total p95 exceeds ${BUDGET_MS} ms at ${over.map((arm) => `${arm.plies} plies (${arm.total.p95Ms} ms)`).join(", ")}`;
  if (enforceTiming) throw new TypeError(message);
  console.warn(message);
}
