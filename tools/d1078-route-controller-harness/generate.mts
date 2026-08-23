// DISPOSABLE research generator — D1078. Not production code.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline";

import { Chess, normalizeMove } from "../../apps/server/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../apps/server/node_modules/chessops/dist/esm/fen.js";
import { makeSanAndPlay } from "../../apps/server/node_modules/chessops/dist/esm/san.js";
import { isNormal } from "../../apps/server/node_modules/chessops/dist/esm/types.js";
import { parseSquare, parseUci } from "../../apps/server/node_modules/chessops/dist/esm/util.js";

type Color = "white" | "black";
type Arm = "guarded_maia" | "route_controller";
interface Candidate { readonly moveUci: string; readonly mass?: number }
interface MaiaPacket { readonly moveUci: string; readonly candidates: readonly Candidate[]; readonly engine: Record<string, unknown> }
interface Pack { readonly id: string; readonly phase: string; readonly start: { readonly fen: string }; readonly objective?: { readonly summary?: string } }
interface Trace {
  readonly ply: number; readonly turn: Color; readonly controlled: boolean; readonly arm: Arm;
  readonly applied: "guarded_maia" | "route_progress"; readonly fallback?: string;
  readonly beforeDistance: number; readonly afterDistance: number; readonly opportunity: boolean;
  readonly moveUci: string; readonly san: string; readonly stockfishBest: string;
  readonly stockfishLossCp: number | null; readonly maiaMass: number | null;
}
interface Line {
  readonly id: string; readonly packId: string; readonly arm: Arm; readonly controlledColor: Color;
  readonly startFen: string; readonly historyUci: readonly string[]; readonly trace: readonly Trace[];
  readonly completed: boolean; readonly terminal: boolean; readonly repetitionMax: number;
}

const ROOT = new URL("../../", import.meta.url).pathname;
const DRAFTS = join(ROOT, "content/drafts");
const RESULT = join(ROOT, "planning/platform-alignment/bot-policy/d1078-route-controller-results.json");
const REPORT = join(ROOT, "planning/platform-alignment/bot-policy/d1078-route-controller-results.md");
const BASE_URL = process.env.TABIYA_D1078_BASE_URL ?? "http://127.0.0.1:3000";
const STOCKFISH = process.env.STOCKFISH_PATH ?? "stockfish";
const PLIES = 12, ROOTS = 6, SF_NODES = 25_000, TARGET_ELO = 1800, TEMPERATURE = 0.8, TOP_P = 0.92, GUARD_CP = 250;
const POLICY_DIGEST = `sha256:${createHash("sha256").update("d1078:maia3-5m:1800:0.8:0.92").digest("hex")}`;

function sha(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function color(board: Chess): Color { return board.turn === "white" ? "white" : "black"; }
function targetDistance(board: Chess, side: Color): number {
  const targets = side === "white"
    ? [["g3", "pawn"], ["g2", "bishop"], ["f3", "knight"]] as const
    : [["g6", "pawn"], ["g7", "bishop"], ["f6", "knight"]] as const;
  return targets.filter(([name, role]) => {
    const piece = board.board.get(parseSquare(name)!);
    return piece?.color !== side || piece.role !== role;
  }).length;
}
function retainsRoles(board: Chess, side: Color): boolean {
  const counts = { pawn: 0, bishop: 0, knight: 0 };
  for (const [, piece] of board.board) if (piece.color === side && piece.role in counts) counts[piece.role as keyof typeof counts] += 1;
  return counts.pawn > 0 && counts.bishop > 0 && counts.knight > 0;
}
function routeProgress(board: Chess, side: Color, uci: string): boolean {
  if (board.turn !== side) return false;
  const parsed = parseUci(uci);
  if (parsed === undefined || !isNormal(parsed)) return false;
  const move = normalizeMove(board, parsed);
  if (!board.isLegal(move)) return false;
  const before = targetDistance(board, side), after = board.clone();
  after.play(move);
  return targetDistance(after, side) < before;
}
function normalized(rows: Iterable<readonly [string, number]>): Map<string, number> {
  const kept = [...rows].filter(([, value]) => Number.isFinite(value) && value > 0);
  const total = kept.reduce((sum, [, value]) => sum + value, 0);
  return new Map(total <= 0 ? [] : kept.map(([move, value]) => [move, value / total]));
}
function productionDistribution(candidates: readonly Candidate[]): Map<string, number> {
  const tempered = candidates.flatMap((candidate) => candidate.mass === undefined ? [] : [[candidate.moveUci, Math.pow(candidate.mass, 1 / TEMPERATURE)] as const])
    .sort((left, right) => right[1] - left[1]);
  const base = [...normalized(tempered)], kept: Array<readonly [string, number]> = [];
  let cumulative = 0;
  for (const row of base) { cumulative += row[1]; if (cumulative <= TOP_P || kept.length === 0) kept.push(row); }
  return normalized(kept);
}
function guarded(distribution: ReadonlyMap<string, number>, losses: ReadonlyMap<string, number>): Map<string, number> {
  const kept = [...distribution].filter(([move]) => (losses.get(move) ?? Number.POSITIVE_INFINITY) <= GUARD_CP);
  if (kept.length > 0) return normalized(kept);
  const fallback = [...distribution].sort((left, right) =>
    (losses.get(left[0]) ?? Number.POSITIVE_INFINITY) - (losses.get(right[0]) ?? Number.POSITIVE_INFINITY))[0];
  return fallback === undefined ? new Map() : new Map([[fallback[0], 1]]);
}
function deterministicDraw(distribution: ReadonlyMap<string, number>, key: string): string {
  if (distribution.size === 0) throw new Error(`empty distribution ${key}`);
  const fraction = Number.parseInt(sha(key).slice(0, 13), 16) / 0x1_0000_0000_0000;
  let cumulative = 0;
  for (const [move, mass] of distribution) { cumulative += mass; if (fraction < cumulative) return move; }
  return [...distribution.keys()].at(-1)!;
}
function repetitionMax(startFen: string, history: readonly string[]): number {
  const board = position(startFen), counts = new Map<string, number>();
  const add = () => { const key = makeFen(board.toSetup()).split(" ", 4).join(" "); counts.set(key, (counts.get(key) ?? 0) + 1); };
  add();
  for (const uci of history) { const move = parseUci(uci)!; board.play(normalizeMove(board, move)); add(); }
  return Math.max(...counts.values());
}

class UciEngine {
  readonly process = spawn(STOCKFISH, [], { stdio: ["pipe", "pipe", "inherit"] });
  readonly queue: string[] = [];
  readonly waiters: Array<(line: string) => void> = [];
  identity: Readonly<Record<string, string>> = Object.freeze({});
  constructor() {
    createInterface({ input: this.process.stdout }).on("line", (line) => {
      const waiter = this.waiters.shift(); if (waiter === undefined) this.queue.push(line); else waiter(line);
    });
  }
  send(command: string): void { this.process.stdin.write(`${command}\n`); }
  async next(): Promise<string> { return this.queue.shift() ?? new Promise((resolve) => this.waiters.push(resolve)); }
  async until(predicate: (line: string) => boolean): Promise<string[]> {
    const rows: string[] = [];
    while (true) { const line = await this.next(); rows.push(line); if (predicate(line)) return rows; }
  }
  async initialize(): Promise<void> {
    this.send("uci"); const rows = await this.until((line) => line === "uciok");
    this.identity = Object.freeze(Object.fromEntries(rows.flatMap((line) => {
      const match = /^id (name|author) (.+)$/u.exec(line);
      return match === null ? [] : [[match[1]!, match[2]!] as const];
    })));
    this.send("setoption name Threads value 1"); this.send("setoption name Hash value 16");
    this.send("setoption name UCI_LimitStrength value false"); this.send("isready"); await this.until((line) => line === "readyok");
  }
  position(startFen: string, history: readonly string[]): void { this.send(`position fen ${startFen}${history.length === 0 ? "" : ` moves ${history.join(" ")}`}`); }
  static score(line: string): number | undefined {
    const cp = /\bscore cp (-?\d+)/.exec(line); if (cp !== null) return Number(cp[1]);
    const mate = /\bscore mate (-?\d+)/.exec(line); if (mate === null) return undefined;
    const value = Number(mate[1]); return value > 0 ? 100_000 - value : -100_000 - value;
  }
  async best(startFen: string, history: readonly string[]): Promise<{ move: string; score: number }> {
    this.send("setoption name MultiPV value 1"); this.position(startFen, history); this.send(`go nodes ${SF_NODES}`);
    const rows = await this.until((line) => line.startsWith("bestmove "));
    const move = rows.at(-1)!.split(/\s+/)[1]!;
    const info = [...rows].reverse().find((line) => line.startsWith("info ") && line.includes(` pv ${move}`));
    const score = info === undefined ? undefined : UciEngine.score(info);
    if (score === undefined) throw new Error(`missing best score ${move}`);
    return { move, score };
  }
  async scores(startFen: string, history: readonly string[], moves: readonly string[]): Promise<Map<string, number>> {
    const unique = [...new Set(moves)];
    this.send(`setoption name MultiPV value ${Math.max(1, unique.length)}`); this.position(startFen, history);
    this.send(`go nodes ${SF_NODES} searchmoves ${unique.join(" ")}`);
    const rows = await this.until((line) => line.startsWith("bestmove ")), result = new Map<string, number>();
    for (const line of rows) {
      if (!line.startsWith("info ")) continue;
      const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(line)?.[1], score = UciEngine.score(line);
      if (move !== undefined && score !== undefined) result.set(move, score);
    }
    return result;
  }
  close(): void { this.send("quit"); }
}

let cookie = "";
let observedMaiaEngine: Readonly<Record<string, unknown>> | undefined;
async function api(path: string, body: unknown): Promise<any> {
  const response = await fetch(`${BASE_URL}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(cookie === "" ? {} : { cookie }) }, body: JSON.stringify(body) });
  const setCookie = response.headers.get("set-cookie"); if (setCookie !== null) cookie = setCookie.split(";")[0]!;
  const text = await response.text(); if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${text}`);
  return text === "" ? undefined : JSON.parse(text);
}
async function maia(startFen: string, history: readonly string[], seed: number): Promise<MaiaPacket> {
  return api("/select-move", { startFen, historyUci: history,
    policy: { mode: "human_common", policyConfigDigest: POLICY_DIGEST, targetElo: TARGET_ELO, temperature: TEMPERATURE, topP: TOP_P }, seed });
}

async function roots(): Promise<readonly Pack[]> {
  const names = (await readdir(DRAFTS)).filter((name) => name.endsWith(".json") && !name.includes(".browser.") && !name.includes(".evidence.") && !name.includes(".sources.") && !name.includes(".job.")).sort();
  const selected: Pack[] = [];
  for (const name of names) {
    const pack = JSON.parse(await readFile(join(DRAFTS, name), "utf8")) as Pack;
    if (pack.phase !== "opening") continue;
    const board = position(pack.start.fen);
    if (!["white", "black"].every((side) => retainsRoles(board, side as Color) && targetDistance(board, side as Color) > 0)) continue;
    selected.push(pack);
    if (selected.length === ROOTS) break;
  }
  if (selected.length !== ROOTS) throw new Error(`root rule selected ${selected.length}/${ROOTS}`);
  return Object.freeze(selected);
}

async function generateLine(engine: UciEngine, pack: Pack, arm: Arm, controlledColor: Color): Promise<Line> {
  const id = `${pack.id}:${arm}:${controlledColor}`, board = position(pack.start.fen), history: string[] = [], trace: Trace[] = [];
  let completed = targetDistance(board, controlledColor) === 0;
  for (let ply = 0; ply < PLIES && !board.isEnd(); ply += 1) {
    const turn = color(board), controlled = turn === controlledColor, currentFen = makeFen(board.toSetup());
    const packet = await maia(pack.start.fen, history, Number.parseInt(sha(`${id}:${ply}`).slice(0, 8), 16));
    if (observedMaiaEngine === undefined) observedMaiaEngine = Object.freeze({ ...packet.engine });
    else if (JSON.stringify(packet.engine) !== JSON.stringify(observedMaiaEngine)) throw new Error("Maia engine identity changed inside D1078");
    const base = productionDistribution(packet.candidates), best = await engine.best(pack.start.fen, history);
    const scores = await engine.scores(pack.start.fen, history, [...new Set([...base.keys(), best.move])]);
    const losses = new Map([...scores].map(([move, score]) => [move, Math.max(0, best.score - score)]));
    const safe = guarded(base, losses), beforeDistance = targetDistance(board, controlledColor);
    let selected = safe, applied: Trace["applied"] = "guarded_maia", fallback: string | undefined;
    const progress = controlled && !completed
      ? [...safe].filter(([move]) => routeProgress(board, controlledColor, move)) : [];
    const opportunity = progress.length > 0;
    if (controlled && arm === "route_controller") {
      if (completed) fallback = "route_complete";
      else if (opportunity) { selected = normalized(progress); applied = "route_progress"; }
      else fallback = "no_progress_candidate";
    }
    const moveUci = deterministicDraw(selected, `${id}:${ply}:draw`), parsed = parseUci(moveUci);
    if (parsed === undefined || !isNormal(parsed) || !board.isLegal(parsed)) throw new Error(`${id} illegal ${moveUci}`);
    const san = makeSanAndPlay(board, normalizeMove(board, parsed)), afterDistance = targetDistance(board, controlledColor);
    history.push(moveUci);
    if (afterDistance === 0) completed = true;
    trace.push({ ply: ply + 1, turn, controlled, arm, applied, ...(fallback === undefined ? {} : { fallback }),
      beforeDistance, afterDistance, opportunity, moveUci, san, stockfishBest: best.move,
      stockfishLossCp: losses.get(moveUci) ?? null, maiaMass: base.get(moveUci) ?? null });
  }
  return Object.freeze({ id, packId: pack.id, arm, controlledColor, startFen: pack.start.fen,
    historyUci: Object.freeze(history), trace: Object.freeze(trace), completed, terminal: board.isEnd(),
    repetitionMax: repetitionMax(pack.start.fen, history) });
}

function summarize(lines: readonly Line[], arm: Arm) {
  const selected = lines.filter((line) => line.arm === arm), controlled = selected.flatMap((line) => line.trace.filter((row) => row.controlled));
  const opportunities = controlled.filter((row) => row.opportunity), progress = controlled.filter((row) => row.applied === "route_progress");
  const losses = controlled.flatMap((row) => row.stockfishLossCp === null ? [] : [row.stockfishLossCp]);
  return {
    branches: selected.length,
    branchesWithTwoOpportunities: selected.filter((line) => line.trace.filter((row) => row.controlled && row.opportunity).length >= 2).length,
    opportunities: opportunities.length,
    progressSelections: progress.length,
    adherence: opportunities.length === 0 ? 1 : progress.length / opportunities.length,
    completed: selected.filter((line) => line.completed).length,
    fallthroughs: controlled.filter((row) => row.fallback !== undefined).length,
    meanLossCp: losses.reduce((sum, value) => sum + value, 0) / losses.length,
    severe250Rate: losses.filter((value) => value >= 250).length / losses.length,
    routeMovesInMaiaWindow: progress.filter((row) => row.maiaMass !== null).length,
    repetitionMax: Math.max(...selected.map((line) => line.repetitionMax)),
  };
}

async function main(): Promise<void> {
  await api("/auth/register", { handle: `d1078${Date.now().toString(36)}`, password: "d1078-disposable-research-password" });
  const packs = await roots(), engine = new UciEngine(); await engine.initialize();
  const lines: Line[] = [];
  try {
    for (const pack of packs) for (const controlledColor of ["white", "black"] as const) for (const arm of ["guarded_maia", "route_controller"] as const) {
      const line = await generateLine(engine, pack, arm, controlledColor); lines.push(line);
      console.log(`${line.id} complete=${line.completed} plies=${line.historyUci.length}`);
    }
  } finally { engine.close(); }
  const baseline = summarize(lines, "guarded_maia"), route = summarize(lines, "route_controller");
  const gates = {
    exercise: route.branchesWithTwoOpportunities / route.branches >= 0.70,
    adherence: route.adherence === 1,
    completion: route.completed / route.branches >= 0.70,
    loss: Math.abs(route.meanLossCp - baseline.meanLossCp) <= 35,
    severe: route.severe250Rate - baseline.severe250Rate <= 0.01,
    maiaWindow: route.routeMovesInMaiaWindow === route.progressSelections,
    repetition: route.repetitionMax <= baseline.repetitionMax,
  };
  const pass = Object.values(gates).every(Boolean);
  const result = { experiment: "D1078", measuredAt: new Date().toISOString(), parameters: { plies: PLIES, roots: ROOTS, sfNodes: SF_NODES, targetElo: TARGET_ELO, temperature: TEMPERATURE, topP: TOP_P, guardCp: GUARD_CP },
    sources: { maia: observedMaiaEngine, stockfish: { ...engine.identity, command: STOCKFISH, nodes: SF_NODES } },
    rootPopulation: packs.map((pack) => ({ packId: pack.id, fen: pack.start.fen })), baseline, route, gates: { ...gates, pass }, lines };
  await writeFile(RESULT, `${JSON.stringify(result, null, 2)}\n`);
  const pct = (value: number) => `${(100 * value).toFixed(1)}%`;
  const report = `# D1078 finite-state route controller — results\n\n` +
    `Population: ${route.branches} route and ${baseline.branches} matched guarded-Maia branches; ${PLIES} plies from ${packs.length} fixed authored opening roots with each controlled color.\n\n` +
    `| arm | branches | ≥2 opportunities | opportunities | adherence | completed | fallthroughs | mean loss | severe | max repetition |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n` +
    `| guarded Maia | ${baseline.branches} | ${baseline.branchesWithTwoOpportunities} | ${baseline.opportunities} | n/a | ${baseline.completed} | ${baseline.fallthroughs} | ${baseline.meanLossCp.toFixed(2)} cp | ${pct(baseline.severe250Rate)} | ${baseline.repetitionMax} |\n` +
    `| route controller | ${route.branches} | ${route.branchesWithTwoOpportunities} | ${route.opportunities} | ${pct(route.adherence)} | ${route.completed} | ${route.fallthroughs} | ${route.meanLossCp.toFixed(2)} cp | ${pct(route.severe250Rate)} | ${route.repetitionMax} |\n\n` +
    `Gates: ${Object.entries(gates).map(([key, value]) => `${key}=${value ? "PASS" : "FAIL"}`).join("; ")}. Overall **${pass ? "PASS" : "FAIL"}**.\n`;
  await writeFile(REPORT, report);
  console.log(report);
}

await main();
