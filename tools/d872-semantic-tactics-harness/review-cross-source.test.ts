// DISPOSABLE research harness — D918/C4 and D927. Not production Review code.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { localSemanticEvents, selectLocalSemanticEvidence, transposeKey } from "../../packages/runtime/src/index.js";
import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parsePgn } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { describe, expect, it } from "vitest";

import { EngineSupervisor, type EngineSpec } from "../../apps/server/src/engine-supervisor.js";
import { StockfishEvidenceExecutor } from "../../apps/server/src/evidence-queue.js";
import { researchPosition } from "../research-chess/legal-exchange.js";
import { importedPopulation, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./review-cross-source-output.md", import.meta.url).pathname;
const OPENINGS = process.env.TABIYA_OPENINGS_DIR;
const GAME_COUNT = 8;
const MOVETIME_MS = 100;

interface EnginePoint {
  readonly cp?: number;
  readonly mateIn?: number;
  readonly rawWdl: number;
  readonly whiteWdl: number;
}

interface TransitionPoint {
  readonly id: string;
  readonly ply: number;
  readonly cpDelta?: number;
  readonly rawWdlDelta?: number;
  readonly whiteWdlDelta?: number;
  readonly selectedSemanticFacts: number;
  readonly semanticKinds: readonly string[];
  readonly exactOpeningEndpoint: boolean;
  readonly tablebaseEligibleAfter: boolean;
}

function positions(path: readonly ResearchRow[]): readonly string[] {
  if (path.length === 0) return [];
  return Object.freeze([path[0]!.parentFen, ...path.map((row) => row.fen)]);
}

function evenlySpaced<T>(values: readonly T[], count: number): readonly T[] {
  if (values.length < count) throw new TypeError(`Need ${count} values; received ${values.length}`);
  return Object.freeze(Array.from({ length: count }, (_unused, index) => values[Math.floor(index * values.length / count)]!));
}

function exactOpeningKeys(): ReadonlySet<string> {
  if (OPENINGS === undefined) throw new TypeError("Set TABIYA_OPENINGS_DIR to the pinned five-file opening source directory");
  const result = new Set<string>();
  for (const letter of ["a", "b", "c", "d", "e"] as const) {
    const lines = readFileSync(join(OPENINGS, `tabiya-openings-${letter}.tsv`), "utf8").replaceAll("\r\n", "\n").split("\n");
    if (lines.shift() !== "eco\tname\tpgn") throw new TypeError(`Unexpected ${letter}.tsv header`);
    for (const [offset, line] of lines.filter(Boolean).entries()) {
      const fields = line.split("\t");
      if (fields.length !== 3) throw new TypeError(`Malformed ${letter}.tsv row ${offset + 2}`);
      const games = parsePgn(fields[2]!);
      if (games.length !== 1) throw new TypeError(`Expected one opening at ${letter}.tsv:${offset + 2}`);
      const position = Chess.default();
      for (const node of games[0]!.moves.mainline()) {
        const move = parseSan(position, node.san);
        if (move === undefined || !position.isLegal(move)) throw new TypeError(`Illegal opening at ${letter}.tsv:${offset + 2}`);
        position.play(move);
      }
      result.add(transposeKey(makeFen(position.toSetup())));
    }
  }
  return result;
}

function pieceCount(fen: string): number {
  return fen.split(" ")[0]!.replaceAll(/[1-8/]/gu, "").length;
}

function expectedScore(values: Readonly<Record<string, unknown>>): number {
  if (![values.win, values.draw, values.loss].every(Number.isSafeInteger)) throw new TypeError("WDL payload is incomplete");
  const total = Number(values.win) + Number(values.draw) + Number(values.loss);
  if (total <= 0) throw new TypeError("WDL payload has an empty population");
  return (Number(values.win) + .5 * Number(values.draw)) / total;
}

function enginePoint(fen: string, evaluation: Readonly<Record<string, unknown>>, wdl: Readonly<Record<string, unknown>>): EnginePoint {
  const rawWdl = expectedScore(wdl);
  const whiteWdl = fen.split(" ")[1] === "w" ? rawWdl : 1 - rawWdl;
  return Object.freeze({
    ...(Number.isSafeInteger(evaluation.centipawns) ? { cp: Number(evaluation.centipawns) } : {}),
    ...(Number.isSafeInteger(evaluation.mateIn) ? { mateIn: Number(evaluation.mateIn) } : {}),
    rawWdl,
    whiteWdl,
  });
}

function sign(value: number): number { return value === 0 ? 0 : value > 0 ? 1 : -1; }

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) * p)]!;
}

function pearson(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length || left.length < 2) return 0;
  const lm = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rm = right.reduce((sum, value) => sum + value, 0) / right.length;
  let covariance = 0, lv = 0, rv = 0;
  for (let index = 0; index < left.length; index += 1) {
    const ld = left[index]! - lm, rd = right[index]! - rm;
    covariance += ld * rd; lv += ld * ld; rv += rd * rd;
  }
  return lv === 0 || rv === 0 ? 0 : covariance / Math.sqrt(lv * rv);
}

function topIds(values: readonly TransitionPoint[], key: "cpDelta" | "rawWdlDelta" | "whiteWdlDelta", count = 3): ReadonlySet<string> {
  return new Set(values.filter((row) => row[key] !== undefined)
    .sort((left, right) => Math.abs(Number(right[key])) - Math.abs(Number(left[key])) || left.id.localeCompare(right.id))
    .slice(0, count).map((row) => row.id));
}

function jaccard(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  const union = new Set([...left, ...right]);
  return union.size === 0 ? 1 : [...left].filter((value) => right.has(value)).length / union.size;
}

function pct(part: number, whole: number): string { return whole === 0 ? "n/a" : `${(100 * part / whole).toFixed(1)}%`; }

describe("D918 whole-game typed-source overlap and D927 WDL perspective", () => {
  it("measures source-local rankings without collapsing their units", async () => {
    const paths = evenlySpaced(importedPopulation().paths, GAME_COUNT);
    const openingKeys = exactOpeningKeys();
    const spec: EngineSpec = Object.freeze({
      id: "stockfish-wave-c-cross-source",
      kind: "judge",
      command: process.env.STOCKFISH_PATH ?? "stockfish",
      name: "Stockfish",
      options: Object.freeze({ Threads: 1, Hash: 16, MultiPV: 1 }),
      transcriptCapacity: 2_048,
    });
    const supervisor = new EngineSupervisor([spec]);
    const identity = await supervisor.start(spec.id);
    const executor = new StockfishEvidenceExecutor(supervisor, spec.id, 1);
    const games: TransitionPoint[][] = [];
    const allEnginePoints: EnginePoint[] = [];
    try {
      for (const path of paths) {
        const fens = positions(path);
        const enginePoints: Array<EnginePoint | undefined> = [];
        for (const [index, fen] of fens.entries()) {
          if (researchPosition(fen).isEnd()) {
            enginePoints.push(undefined);
            continue;
          }
          const evaluation = await executor.execute({ id: `eval-${games.length}-${index}`, runId: "research", nodeId: `n${index}`, fen, kind: "eval", movetime: MOVETIME_MS }, new AbortController().signal);
          const wdl = await executor.execute({ id: `wdl-${games.length}-${index}`, runId: "research", nodeId: `n${index}`, fen, kind: "wdl", movetime: MOVETIME_MS }, new AbortController().signal);
          const point = enginePoint(fen, evaluation.values, wdl.values);
          enginePoints.push(point);
          allEnginePoints.push(point);
        }
        games.push(path.map((row, index) => {
          const before = enginePoints[index], after = enginePoints[index + 1];
          const selected = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, { beforeFen: row.parentFen, moveUci: row.uci, afterFen: row.fen });
          const local = localSemanticEvents(row.parentFen, row.uci, row.fen);
          return Object.freeze({
            id: row.id,
            ply: index + 1,
            ...(before?.cp === undefined || after?.cp === undefined ? {} : { cpDelta: after.cp - before.cp }),
            ...(before === undefined || after === undefined ? {} : { rawWdlDelta: after.rawWdl - before.rawWdl, whiteWdlDelta: after.whiteWdl - before.whiteWdl }),
            selectedSemanticFacts: selected.selected.length,
            semanticKinds: Object.freeze(local.map((event) => `${event.projection.id}@${event.projection.version}`).sort()),
            exactOpeningEndpoint: openingKeys.has(transposeKey(row.fen)),
            tablebaseEligibleAfter: pieceCount(row.fen) <= 7,
          });
        }));
      }
    } finally {
      await supervisor.shutdown();
    }

    const all = games.flat();
    const cpPoints = allEnginePoints.filter((point): point is EnginePoint & { readonly cp: number } => point.cp !== undefined);
    const wdlTransitions = all.filter((row): row is TransitionPoint & { readonly rawWdlDelta: number; readonly whiteWdlDelta: number } => row.rawWdlDelta !== undefined && row.whiteWdlDelta !== undefined);
    const cpTransitions = wdlTransitions.filter((row): row is TransitionPoint & { readonly cpDelta: number; readonly rawWdlDelta: number; readonly whiteWdlDelta: number } => row.cpDelta !== undefined);
    const cpVsRawSign = cpTransitions.filter((row) => sign(row.cpDelta) === sign(row.rawWdlDelta)).length;
    const cpVsWhiteSign = cpTransitions.filter((row) => sign(row.cpDelta) === sign(row.whiteWdlDelta)).length;
    const rawVsWhiteSign = wdlTransitions.filter((row) => sign(row.rawWdlDelta) === sign(row.whiteWdlDelta)).length;
    const rawTop = games.map((game) => jaccard(topIds(game, "cpDelta"), topIds(game, "rawWdlDelta")));
    const whiteTop = games.map((game) => jaccard(topIds(game, "cpDelta"), topIds(game, "whiteWdlDelta")));
    const rawWhiteTop = games.map((game) => jaccard(topIds(game, "rawWdlDelta"), topIds(game, "whiteWdlDelta")));
    const cpTopIds = new Set(games.flatMap((game) => [...topIds(game, "cpDelta")]));
    const cpTop = all.filter((row) => cpTopIds.has(row.id));
    const factual = all.filter((row) => row.selectedSemanticFacts > 0 || row.exactOpeningEndpoint || row.tablebaseEligibleAfter);
    const lines = [
      "# D918 whole-game typed-source overlap output",
      "",
      `Engine: ${identity.name} ${identity.version ?? "version-unreported"}; shipped StockfishEvidenceExecutor; ${MOVETIME_MS} ms per eval and WDL request; Threads 1, Hash 16, MultiPV 1.`,
      `Population: ${games.length} deterministic whole games sampled evenly from the sealed 108-game imported population; ${all.length} played transitions / ${allEnginePoints.length} positions.`,
      "Opening source: pinned lichess-org/chess-openings exact endpoint set. Semantic source: shipped research.r2_candidate@1 selection over local registered events. Tablebase column measures domain eligibility only; it does not invent or fetch an outcome.",
      "",
      "## WDL perspective",
      "",
      `Position-level Pearson with white-perspective cp (${cpPoints.length} cp positions): raw side-to-move WDL ${pearson(cpPoints.map((point) => point.cp), cpPoints.map((point) => point.rawWdl)).toFixed(3)}; white-normalized WDL ${pearson(cpPoints.map((point) => point.cp), cpPoints.map((point) => point.whiteWdl)).toFixed(3)}.`,
      `Adjacent cp-delta sign agreement (${cpTransitions.length} cp→cp transitions): raw WDL ${cpVsRawSign}/${cpTransitions.length} (${pct(cpVsRawSign, cpTransitions.length)}); white-normalized WDL ${cpVsWhiteSign}/${cpTransitions.length} (${pct(cpVsWhiteSign, cpTransitions.length)}).`,
      `Raw-vs-normalized WDL adjacent sign agreement: ${rawVsWhiteSign}/${wdlTransitions.length} (${pct(rawVsWhiteSign, wdlTransitions.length)}); terminal positions remain explicit source absence.`,
      `Median per-game top-3 Jaccard: cp↔raw WDL ${percentile(rawTop, .5).toFixed(3)}; cp↔white-normalized WDL ${percentile(whiteTop, .5).toFixed(3)}; raw↔normalized WDL ${percentile(rawWhiteTop, .5).toFixed(3)}.`,
      `Absolute adjacent WDL change median/p90: raw ${(100 * percentile(wdlTransitions.map((row) => Math.abs(row.rawWdlDelta)), .5)).toFixed(1)}/${(100 * percentile(wdlTransitions.map((row) => Math.abs(row.rawWdlDelta)), .9)).toFixed(1)} pp; normalized ${(100 * percentile(wdlTransitions.map((row) => Math.abs(row.whiteWdlDelta)), .5)).toFixed(1)}/${(100 * percentile(wdlTransitions.map((row) => Math.abs(row.whiteWdlDelta)), .9)).toFixed(1)} pp.`,
      "",
      "## Source availability and overlap",
      "",
      "| population | rows | selected semantic fact | exact opening endpoint | ≤7-piece tablebase domain | any non-engine factual source |",
      "|---|---:|---:|---:|---:|---:|",
      `| all transitions | ${all.length} | ${all.filter((row) => row.selectedSemanticFacts > 0).length} (${pct(all.filter((row) => row.selectedSemanticFacts > 0).length, all.length)}) | ${all.filter((row) => row.exactOpeningEndpoint).length} (${pct(all.filter((row) => row.exactOpeningEndpoint).length, all.length)}) | ${all.filter((row) => row.tablebaseEligibleAfter).length} (${pct(all.filter((row) => row.tablebaseEligibleAfter).length, all.length)}) | ${factual.length} (${pct(factual.length, all.length)}) |`,
      `| engine top-3/game | ${cpTop.length} | ${cpTop.filter((row) => row.selectedSemanticFacts > 0).length} (${pct(cpTop.filter((row) => row.selectedSemanticFacts > 0).length, cpTop.length)}) | ${cpTop.filter((row) => row.exactOpeningEndpoint).length} (${pct(cpTop.filter((row) => row.exactOpeningEndpoint).length, cpTop.length)}) | ${cpTop.filter((row) => row.tablebaseEligibleAfter).length} (${pct(cpTop.filter((row) => row.tablebaseEligibleAfter).length, cpTop.length)}) | ${cpTop.filter((row) => row.selectedSemanticFacts > 0 || row.exactOpeningEndpoint || row.tablebaseEligibleAfter).length} (${pct(cpTop.filter((row) => row.selectedSemanticFacts > 0 || row.exactOpeningEndpoint || row.tablebaseEligibleAfter).length, cpTop.length)}) |`,
      "",
      "## Contract consequence",
      "",
      "There is no cross-source scalar in this result. Cp/mate, normalized engine WDL, exact tablebase category/DTZ, human-model/corpus probability, opening identity and semantic facts retain separate typed units and source-local admission. A Review selector may combine eligible moments through declared family priorities/quotas and deterministic ties; it may not coerce mate to cp, treat DTZ as advantage magnitude, treat human probability as quality, or subtract an un-oriented WDL. Provider absence is per source, never failure of the packet.",
      "",
    ];
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(paths).toHaveLength(GAME_COUNT);
    expect(all.length).toBeGreaterThan(400);
    expect(cpPoints.length).toBeGreaterThan(400);
    expect(pearson(cpPoints.map((point) => point.cp), cpPoints.map((point) => point.whiteWdl))).toBeGreaterThan(.7);
    expect(pearson(cpPoints.map((point) => point.cp), cpPoints.map((point) => point.rawWdl))).toBeLessThan(.5);
    expect(cpVsWhiteSign / cpTransitions.length).toBeGreaterThan(cpVsRawSign / cpTransitions.length);
  }, 1_200_000);
});
