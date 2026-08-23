// DISPOSABLE research harness — D1061. Not production code.
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";

import { castlingSide, Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { isNormal, type NormalMove, type Role } from "chessops/types";
import { makeSquare, makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

const POSITIONS = process.env.TABIYA_D1061_POSITIONS;
const WRITE = process.env.TABIYA_D1061_WRITE === "1";
const ENGINE = process.env.TABIYA_D1061_ENGINE ?? "stockfish";
const RESULT = new URL("../../planning/evidence-foundation-ux/d1061-bestline-distance-results.json", import.meta.url);
const REPORT = new URL("../../planning/evidence-foundation-ux/d1061-bestline-distance-results.md", import.meta.url);

interface PositionRow {
  readonly packId: string; readonly phase: "opening" | "middlegame" | "cross_phase";
  readonly fen: string; readonly legalUci: readonly string[];
}
interface Probe {
  readonly arm: string; readonly bestmove: string | null; readonly canonicalBestmove: string | null;
  readonly pv: readonly string[]; readonly depth: number | null; readonly scoreDomain: "cp" | "mate" | null;
  readonly score: number | null; readonly elapsedMs: number; readonly legal: boolean;
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function sample(rows: readonly PositionRow[]): readonly PositionRow[] {
  const unique = [...new Map(rows.map((row) => [row.fen, row])).values()];
  const take = (phase: PositionRow["phase"], count: number) => unique.filter((row) => row.phase === phase)
    .sort((left, right) => digest(`${left.phase}\0${left.packId}\0${left.fen}`).localeCompare(digest(`${right.phase}\0${right.packId}\0${right.fen}`)))
    .slice(0, count);
  return Object.freeze([...take("opening", 24), ...take("middlegame", 16), ...take("cross_phase", 24)]);
}

class Uci {
  readonly process: ChildProcessWithoutNullStreams;
  readonly listeners = new Set<(line: string) => void>();
  readonly stderr: string[] = [];

  private constructor(process: ChildProcessWithoutNullStreams) {
    this.process = process;
    createInterface({ input: process.stdout }).on("line", (line) => {
      for (const listener of [...this.listeners]) listener(line);
    });
    createInterface({ input: process.stderr }).on("line", (line) => this.stderr.push(line));
  }

  static async start(command: string): Promise<Uci> {
    const instance = new Uci(spawn(command, [], { stdio: "pipe" }));
    await instance.exchange("uci", (line) => line === "uciok", 10_000);
    instance.process.stdin.write("setoption name Threads value 1\nsetoption name Hash value 16\nsetoption name MultiPV value 1\n");
    await instance.exchange("isready", (line) => line === "readyok", 10_000);
    return instance;
  }

  exchange(command: string, done: (line: string) => boolean, timeoutMs: number): Promise<readonly string[]> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      const timeout = setTimeout(() => {
        this.listeners.delete(listener);
        reject(new Error(`UCI timeout after ${command}: ${this.stderr.join(" | ")}`));
      }, timeoutMs);
      const listener = (line: string) => {
        lines.push(line);
        if (!done(line)) return;
        clearTimeout(timeout);
        this.listeners.delete(listener);
        resolve(Object.freeze(lines));
      };
      this.listeners.add(listener);
      this.process.stdin.write(`${command}\n`);
    });
  }

  async probe(fen: string, arm: { readonly name: string; readonly go: string }): Promise<Probe> {
    this.process.stdin.write("ucinewgame\nsetoption name Clear Hash\n");
    await this.exchange("isready", (line) => line === "readyok", 10_000);
    this.process.stdin.write(`position fen ${fen}\n`);
    const started = performance.now();
    const lines = await this.exchange(arm.go, (line) => line.startsWith("bestmove "), 15_000);
    const elapsedMs = performance.now() - started;
    const terminal = lines.at(-1)!.split(/\s+/)[1];
    const bestmove = terminal === undefined || terminal === "(none)" ? null : terminal;
    const info = [...lines].reverse().find((line) => /\bpv [a-h][1-8][a-h][1-8][qrbn]?/.test(line));
    const pv = info === undefined ? [] : info.slice(info.indexOf(" pv ") + 4).trim().split(/\s+/);
    const depthMatch = info?.match(/\bdepth (\d+)\b/);
    const scoreMatch = info?.match(/\bscore (cp|mate) (-?\d+)\b/);
    const replay = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    const canonical: string[] = [];
    let legal = true;
    for (const uci of pv) {
      const parsed = parseUci(uci);
      if (parsed === undefined || !isNormal(parsed)) { legal = false; break; }
      const move = normalizeMove(replay, parsed);
      if (!replay.isLegal(move)) { legal = false; break; }
      canonical.push(makeUci(move));
      replay.play(move);
    }
    return Object.freeze({ arm: arm.name, bestmove, canonicalBestmove: canonical[0] ?? null,
      pv: Object.freeze(canonical), depth: depthMatch === undefined ? null : Number(depthMatch[1]),
      scoreDomain: scoreMatch === null || scoreMatch === undefined ? null : scoreMatch[1] as "cp" | "mate",
      score: scoreMatch === null || scoreMatch === undefined ? null : Number(scoreMatch[2]),
      elapsedMs, legal });
  }

  async close(): Promise<void> {
    if (this.process.exitCode !== null) return;
    this.process.stdin.write("quit\n");
    await new Promise<void>((resolve) => this.process.once("exit", () => resolve()));
  }
}

function legalMoves(row: PositionRow): readonly NormalMove[] {
  const position = Chess.fromSetup(parseFen(row.fen).unwrap()).unwrap();
  return row.legalUci.flatMap((uci) => {
    const parsed = parseUci(uci);
    return parsed === undefined || !isNormal(parsed) ? [] : [normalizeMove(position, parsed)];
  });
}

function semanticDestination(position: Chess, move: NormalMove): string {
  const side = castlingSide(position, move);
  if (side === undefined) return makeSquare(move.to);
  return makeSquare((Math.floor(move.from / 8) * 8 + (side === "h" ? 6 : 2)) as typeof move.to);
}

function disclosure(row: PositionRow, probe: Probe) {
  if (probe.canonicalBestmove === null) return null;
  const position = Chess.fromSetup(parseFen(row.fen).unwrap()).unwrap();
  const parsed = parseUci(probe.canonicalBestmove);
  if (parsed === undefined || !isNormal(parsed)) return null;
  const best = normalizeMove(position, parsed);
  const role = position.board.get(best.from)?.role;
  if (role === undefined) return null;
  const moves = legalMoves(row);
  const candidates = (predicate: (move: NormalMove) => boolean) => moves.filter(predicate).length;
  const semantic = semanticDestination(position, best);
  return Object.freeze({
    legal: moves.length,
    originSquare: makeSquare(best.from),
    semanticDestination: semantic,
    role,
    consistent: Object.freeze({
      originSquare: candidates((move) => move.from === best.from),
      semanticDestination: candidates((move) => semanticDestination(position, move) === semantic),
      exactPiece: candidates((move) => move.from === best.from),
      pieceRole: candidates((move) => position.board.get(move.from)?.role === role),
      move: 1,
    }),
  });
}

function ratio<T>(rows: readonly T[], predicate: (row: T) => boolean): number {
  return rows.length === 0 ? 0 : rows.filter(predicate).length / rows.length;
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantile(values: readonly number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]!;
}

function countLedgerKinds(directory: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const walk = (path: string): void => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.name.endsWith(".evidence.json") || entry.name === "evidence.json") {
        const value = JSON.parse(readFileSync(child, "utf8")) as { readonly records?: readonly { readonly kind?: string }[] };
        for (const record of value.records ?? []) if (record.kind !== undefined) counts[record.kind] = (counts[record.kind] ?? 0) + 1;
      }
    }
  };
  walk(directory);
  return counts;
}

function rounded(value: number): number { return Number(value.toFixed(6)); }

function markdown(result: any): string {
  return `# D1061 bestline collection and hint-distance results\n\n- Population: **${result.population.sample}** positions (${JSON.stringify(result.population.byPhase)})\n- Fully legal, non-empty PVs: **${(result.closure.legalNonempty * 100).toFixed(1)}%**\n- Depth 8→12 first-move agreement: **${(result.stability.depth8To12 * 100).toFixed(1)}%**\n- 100 ms repeat first-move agreement: **${(result.stability.movetimeRepeat * 100).toFixed(1)}%**\n- 100 ms→depth-12 first-move agreement: **${(result.stability.movetimeToDepth12 * 100).toFixed(1)}%**\n- Durable content-ledger bestline records: **${result.sourceBoundary.contentLedgerBestline}**\n\n## Disclosure ambiguity\n\n| Interpretation | Mean legal candidates remaining |\n|---|---:|\n| square = origin | ${result.disclosure.meanRemaining.originSquare.toFixed(2)} |\n| square = semantic destination | ${result.disclosure.meanRemaining.semanticDestination.toFixed(2)} |\n| piece = exact piece | ${result.disclosure.meanRemaining.exactPiece.toFixed(2)} |\n| piece = role | ${result.disclosure.meanRemaining.pieceRole.toFixed(2)} |\n| move | 1.00 |\n\n**Ply-distance is not derivable from beforeFen + movesUci without naming what event/target the distance is to.** PV length is a search artifact, not that missing semantic operand. The ruled ordering therefore fails payload sufficiency before any UI implementation.\n`;
}

describe("D1061 bestline distance", () => {
  it.skipIf(POSITIONS === undefined)("measures provider stability and disclosure sufficiency", async () => {
    const inputText = readFileSync(POSITIONS!, "utf8");
    const input = JSON.parse(inputText) as { readonly positions: readonly PositionRow[] };
    const rows = sample(input.positions);
    expect(rows).toHaveLength(64);
    expect(Object.fromEntries(["opening", "middlegame", "cross_phase"].map((phase) => [phase, rows.filter((row) => row.phase === phase).length])))
      .toEqual({ opening: 24, middlegame: 16, cross_phase: 24 });
    const engine = await Uci.start(ENGINE);
    const measured: Array<{ readonly row: PositionRow; readonly probes: readonly Probe[] }> = [];
    try {
      for (const row of rows) {
        const probes = [];
        for (const arm of [
          { name: "depth8", go: "go depth 8" }, { name: "depth12", go: "go depth 12" },
          { name: "movetime100_a", go: "go movetime 100" }, { name: "movetime100_b", go: "go movetime 100" },
        ]) probes.push(await engine.probe(row.fen, arm));
        measured.push({ row, probes: Object.freeze(probes) });
      }
    } finally { await engine.close(); }
    const at = (entry: typeof measured[number], name: string) => entry.probes.find((probe) => probe.arm === name)!;
    const all = measured.flatMap((entry) => entry.probes);
    const nonterminal = all.filter((probe) => probe.bestmove !== null);
    const depth8To12 = ratio(measured, (entry) => at(entry, "depth8").canonicalBestmove === at(entry, "depth12").canonicalBestmove);
    const movetimeRepeat = ratio(measured, (entry) => at(entry, "movetime100_a").canonicalBestmove === at(entry, "movetime100_b").canonicalBestmove);
    const movetimeToDepth12 = ratio(measured, (entry) => at(entry, "movetime100_a").canonicalBestmove === at(entry, "depth12").canonicalBestmove);
    const disclosures = measured.map((entry) => disclosure(entry.row, at(entry, "depth12"))).filter((value) => value !== null);
    const remaining = (key: keyof NonNullable<typeof disclosures[number]>["consistent"]) => disclosures.map((value) => value.consistent[key]);
    const sourceCounts = countLedgerKinds(new URL("../../content/", import.meta.url).pathname);
    const result = {
      experiment: "D1061", measuredAt: new Date().toISOString(), engine: "Stockfish 18 / Threads 1 / Hash 16 / MultiPV 1",
      input: { sha256: `sha256:${digest(inputText)}`, rows: input.positions.length },
      population: { sample: rows.length, byPhase: Object.fromEntries(["opening", "middlegame", "cross_phase"].map((phase) => [phase, rows.filter((row) => row.phase === phase).length])) },
      closure: { probes: all.length, terminalAbstentions: all.filter((probe) => probe.bestmove === null).length,
        legalNonempty: rounded(ratio(nonterminal, (probe) => probe.legal && probe.pv.length > 0)) },
      stability: { depth8To12: rounded(depth8To12), movetimeRepeat: rounded(movetimeRepeat), movetimeToDepth12: rounded(movetimeToDepth12),
        byPhase: Object.fromEntries(["opening", "middlegame", "cross_phase"].map((phase) => {
          const group = measured.filter((entry) => entry.row.phase === phase);
          return [phase, { cells: group.length,
            depth8To12: rounded(ratio(group, (entry) => at(entry, "depth8").canonicalBestmove === at(entry, "depth12").canonicalBestmove)),
            movetimeToDepth12: rounded(ratio(group, (entry) => at(entry, "movetime100_a").canonicalBestmove === at(entry, "depth12").canonicalBestmove)) }];
        })),
        gate: 0.90, depthPass: depth8To12 >= 0.90, productionPass: movetimeRepeat >= 0.90 },
      timingMs: Object.fromEntries(["depth8", "depth12", "movetime100_a", "movetime100_b"].map((arm) => {
        const values = measured.map((entry) => at(entry, arm).elapsedMs);
        return [arm, { mean: rounded(mean(values)), p95: rounded(quantile(values, 0.95)) }];
      })),
      disclosure: {
        payloadSufficiency: { square: "ambiguous_origin_or_destination", piece: "ambiguous_exact_piece_or_role",
          plyDistance: "not_derivable_without_target_or_event", move: "first PV move", pass: false },
        meanRemaining: Object.fromEntries(["originSquare", "semanticDestination", "exactPiece", "pieceRole", "move"].map((key) => [key, rounded(mean(remaining(key as any)))])),
        strictBeforeMoveRate: Object.fromEntries(["originSquare", "semanticDestination", "exactPiece", "pieceRole"].map((key) => [key, rounded(ratio(disclosures, (value) => value.consistent[key as keyof typeof value.consistent] > 1))])),
      },
      sourceBoundary: { contentLedgerRecords: Object.values(sourceCounts).reduce((sum, value) => sum + value, 0),
        contentLedgerKinds: sourceCounts, contentLedgerBestline: sourceCounts.bestline ?? 0,
        runtimeBestlineShape: "EvidencePayload.bestline event", engineWalkShape: "read-only cp/mate report with one best-move child, not a PV" },
      rows: measured.map((entry) => ({ packId: entry.row.packId, phase: entry.row.phase, fen: entry.row.fen,
        probes: entry.probes, disclosure: disclosure(entry.row, at(entry, "depth12")) })),
    };
    expect(result.closure.legalNonempty).toBe(1);
    expect(result.sourceBoundary.contentLedgerBestline).toBe(0);
    expect(result.disclosure.payloadSufficiency.pass).toBe(false);
    if (WRITE) {
      writeFileSync(RESULT, `${JSON.stringify(result, null, 2)}\n`);
      writeFileSync(REPORT, markdown(result));
    }
  });
});
