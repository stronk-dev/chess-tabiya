// DISPOSABLE research generator — platform-alignment R11. Not production code.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createInterface } from "node:readline";

// The repo scopes chessops to apps/server; bind this disposable tool to the same pinned install
// instead of adding a second root dependency.
import { Chess } from "../../apps/server/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../apps/server/node_modules/chessops/dist/esm/fen.js";
import { makeSanAndPlay } from "../../apps/server/node_modules/chessops/dist/esm/san.js";
import { isNormal } from "../../apps/server/node_modules/chessops/dist/esm/types.js";
import { parseUci } from "../../apps/server/node_modules/chessops/dist/esm/util.js";

type Color = "white" | "black";
type Arm =
  | "production_maia"
  | "guard_250"
  | "pawn_x4_guarded"
  | "authored_repertoire_guarded"
  | "statistical_book_guarded"
  | "weakened_stockfish_control";

interface Candidate { moveUci: string; rank: number; mass?: number; scoreCp?: number; }
interface MaiaPacket {
  moveUci: string;
  policyModeApplied: string;
  candidates: Candidate[];
  engine: Record<string, unknown>;
}
interface SpineNode { moveUci: string; children: SpineNode[]; }
interface Pack {
  id: string;
  phase: string;
  start: { fen: string };
  objective: { summary: string };
  spine: SpineNode[];
}
interface StartSpec { file: string; stratum: "opening" | "middlegame" | "reduced_material"; }
interface LocalBook {
  schema: string;
  source: Record<string, unknown>;
  population: Record<string, unknown>;
  roots: Record<string, string>;
  counts: Record<string, { total: number; moves: Record<string, number>; roots: string[] }>;
  summary: Record<string, number>;
}

const ROOT = new URL("../../", import.meta.url).pathname;
const OUT = process.env.TABIYA_R11_BLIND_OUT
  ?? join(ROOT, "planning/platform-alignment/bot-policy/blind-review");
const BASE_URL = process.env.TABIYA_R11_BASE_URL ?? "http://127.0.0.1:3000";
const STOCKFISH = process.env.STOCKFISH_PATH ?? "stockfish";
const LOCAL_BOOK_PATH = process.env.TABIYA_R11_LOCAL_BOOK ?? "/private/tmp/r11-local-book.json";
const PLIES = Number(process.env.TABIYA_R11_PLIES ?? 12);
const SF_NODES = Number(process.env.TABIYA_R11_SF_NODES ?? 50_000);
const WEAK_NODES = Number(process.env.TABIYA_R11_WEAK_NODES ?? 5_000);
const TARGET_ELO = 1800;
const TEMPERATURE = 0.8;
const TOP_P = 0.92;
const GUARD_CP = 250;
const POLICY_DIGEST = `sha256:${createHash("sha256").update("r11:maia3-5m:1800:0.8:0.92").digest("hex")}`;

const STARTS: readonly StartSpec[] = Object.freeze([
  { file: "anti-caro-advance-early-c5.json", stratum: "opening" },
  { file: "najdorf-english-attack-black.json", stratum: "opening" },
  { file: "carlsbad-minority-attack.json", stratum: "middlegame" },
  { file: "dragon-yugoslav-race.json", stratum: "middlegame" },
  { file: "rook-4v3-same-side.json", stratum: "reduced_material" },
  { file: "pawn-breakthrough-convert.json", stratum: "reduced_material" },
]);
const ARMS: readonly Arm[] = Object.freeze([
  "production_maia", "guard_250", "pawn_x4_guarded", "statistical_book_guarded",
  "weakened_stockfish_control",
]);
let localBook: LocalBook;

function sha(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
function normalized(rows: Iterable<readonly [string, number]>): Map<string, number> {
  const kept = [...rows].filter(([, value]) => Number.isFinite(value) && value > 0);
  const total = kept.reduce((sum, [, value]) => sum + value, 0);
  return new Map(total <= 0 ? [] : kept.map(([move, value]) => [move, value / total]));
}
function productionDistribution(candidates: readonly Candidate[]): Map<string, number> {
  const tempered = candidates
    .flatMap((candidate) => candidate.mass === undefined ? [] : [[candidate.moveUci, Math.pow(candidate.mass, 1 / TEMPERATURE)] as const])
    .sort((left, right) => right[1] - left[1]);
  const base = [...normalized(tempered)];
  const kept: Array<readonly [string, number]> = [];
  let cumulative = 0;
  for (const row of base) {
    cumulative += row[1];
    if (cumulative <= TOP_P || kept.length === 0) kept.push(row);
  }
  return normalized(kept);
}
function deterministicDraw(distribution: ReadonlyMap<string, number>, key: string): string {
  if (distribution.size === 0) throw new Error(`Cannot sample empty distribution: ${key}`);
  const fraction = Number.parseInt(sha(key).slice(0, 13), 16) / 0x1_0000_0000_0000;
  let cumulative = 0;
  for (const [move, mass] of distribution) {
    cumulative += mass;
    if (fraction < cumulative) return move;
  }
  return [...distribution.keys()].at(-1)!;
}
function side(position: Chess): Color { return position.turn === "white" ? "white" : "black"; }
function pieceIsPawn(position: Chess, uci: string): boolean {
  const move = parseUci(uci);
  return move !== undefined && isNormal(move) && position.board.get(move.from)?.role === "pawn";
}
function absolutePly(fen: string): number {
  const fields = fen.split(" ");
  const fullmove = Number(fields[5] ?? 1);
  return Math.max(0, (fullmove - 1) * 2 + (fields[1] === "b" ? 1 : 0));
}
function positionKey(position: Chess): string { return makeFen(position.toSetup()).split(" ", 4).join(" "); }
function allowedSpineMoves(pack: Pack, history: readonly string[]): string[] {
  let nodes = pack.spine;
  for (const move of history) {
    const matched = nodes.find((node) => node.moveUci === move);
    if (matched === undefined) return [];
    nodes = matched.children;
  }
  return nodes.map((node) => node.moveUci);
}

class UciEngine {
  readonly process = spawn(STOCKFISH, [], { stdio: ["pipe", "pipe", "inherit"] });
  readonly queue: string[] = [];
  readonly waiters: Array<(line: string) => void> = [];
  constructor() {
    const lines = createInterface({ input: this.process.stdout });
    lines.on("line", (line) => {
      const waiter = this.waiters.shift();
      if (waiter === undefined) this.queue.push(line); else waiter(line);
    });
  }
  send(command: string): void { this.process.stdin.write(`${command}\n`); }
  async next(): Promise<string> {
    const line = this.queue.shift();
    return line ?? new Promise((resolve) => this.waiters.push(resolve));
  }
  async until(predicate: (line: string) => boolean): Promise<string[]> {
    const rows: string[] = [];
    while (true) { const line = await this.next(); rows.push(line); if (predicate(line)) return rows; }
  }
  async initialize(): Promise<void> {
    this.send("uci"); await this.until((line) => line === "uciok");
    this.send("setoption name Threads value 1");
    this.send("setoption name Hash value 16");
    this.send("setoption name UCI_LimitStrength value false");
    this.send("isready"); await this.until((line) => line === "readyok");
  }
  position(startFen: string, history: readonly string[]): void {
    this.send(`position fen ${startFen}${history.length === 0 ? "" : ` moves ${history.join(" ")}`}`);
  }
  static score(line: string): number | undefined {
    const cp = /\bscore cp (-?\d+)/.exec(line);
    if (cp !== null) return Number(cp[1]);
    const mate = /\bscore mate (-?\d+)/.exec(line);
    if (mate === null) return undefined;
    const value = Number(mate[1]);
    return value > 0 ? 100_000 - value : -100_000 - value;
  }
  async best(startFen: string, history: readonly string[]): Promise<{ move: string; score: number }> {
    this.send("setoption name UCI_LimitStrength value false");
    this.send("setoption name MultiPV value 1");
    this.position(startFen, history);
    this.send(`go nodes ${SF_NODES}`);
    const rows = await this.until((line) => line.startsWith("bestmove "));
    const best = rows.at(-1)!.split(/\s+/)[1]!;
    const info = [...rows].reverse().find((line) => line.startsWith("info ") && line.includes(` pv ${best}`));
    const score = info === undefined ? undefined : UciEngine.score(info);
    if (score === undefined) throw new Error(`No Stockfish score for best move ${best}`);
    return { move: best, score };
  }
  async scores(startFen: string, history: readonly string[], moves: readonly string[]): Promise<Map<string, number>> {
    const unique = [...new Set(moves)];
    this.send("setoption name UCI_LimitStrength value false");
    this.send(`setoption name MultiPV value ${Math.max(1, unique.length)}`);
    this.position(startFen, history);
    this.send(`go nodes ${SF_NODES} searchmoves ${unique.join(" ")}`);
    const rows = await this.until((line) => line.startsWith("bestmove "));
    const result = new Map<string, number>();
    for (const line of rows) {
      if (!line.startsWith("info ")) continue;
      const pv = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(line)?.[1];
      const score = UciEngine.score(line);
      if (pv !== undefined && score !== undefined) result.set(pv, score);
    }
    return result;
  }
  async weakMove(startFen: string, history: readonly string[]): Promise<string> {
    this.send("setoption name UCI_LimitStrength value true");
    this.send("setoption name UCI_Elo value 1320");
    this.send("setoption name MultiPV value 1");
    this.position(startFen, history);
    this.send(`go nodes ${WEAK_NODES}`);
    const rows = await this.until((line) => line.startsWith("bestmove "));
    return rows.at(-1)!.split(/\s+/)[1]!;
  }
  close(): void { this.send("quit"); }
}

let cookie = "";
async function api(path: string, body: unknown): Promise<any> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie === "" ? {} : { cookie }) },
    body: JSON.stringify(body),
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie !== null) cookie = setCookie.split(";")[0]!;
  const text = await response.text();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${text}`);
  return text === "" ? undefined : JSON.parse(text);
}
async function maia(startFen: string, history: readonly string[], seed: number): Promise<MaiaPacket> {
  return api("/select-move", {
    startFen, historyUci: history,
    policy: { mode: "human_common", policyConfigDigest: POLICY_DIGEST, targetElo: TARGET_ELO, temperature: TEMPERATURE, topP: TOP_P },
    seed,
  });
}

function guard(distribution: ReadonlyMap<string, number>, losses: ReadonlyMap<string, number>): Map<string, number> {
  const kept = [...distribution].filter(([move]) => (losses.get(move) ?? Number.POSITIVE_INFINITY) <= GUARD_CP);
  if (kept.length > 0) return normalized(kept);
  const fallback = [...distribution].sort((left, right) =>
    (losses.get(left[0]) ?? Number.POSITIVE_INFINITY) - (losses.get(right[0]) ?? Number.POSITIVE_INFINITY))[0];
  return fallback === undefined ? new Map() : new Map([[fallback[0], 1]]);
}

async function generateLine(
  stockfish: UciEngine, pack: Pack, stratum: StartSpec["stratum"], arm: Arm,
  controlledColor: Color | "both", blindId: string, seed: number,
): Promise<any> {
  const position = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  const history: string[] = [];
  const san: string[] = [];
  const trace: any[] = [];
  for (let ply = 0; ply < PLIES && !position.isEnd(); ply += 1) {
    const turn = side(position);
    const controlled = controlledColor === "both" || controlledColor === turn;
    let applied: string = controlled ? arm : "production_maia_opponent";
    let fallback: string | undefined;
    let packet: MaiaPacket | undefined;
    let base = new Map<string, number>();
    let chosen: string;
    const currentFen = makeFen(position.toSetup());

    if (controlled && arm === "weakened_stockfish_control") {
      chosen = await stockfish.weakMove(pack.start.fen, history);
    } else {
      packet = await maia(pack.start.fen, history, seed + ply);
      base = productionDistribution(packet.candidates);
      if (!controlled || arm === "production_maia") chosen = packet.moveUci;
      else chosen = "";
    }

    let distributionMoves = [...base.keys()];
    if (controlled && arm === "authored_repertoire_guarded") {
      const allowed = allowedSpineMoves(pack, history);
      if (allowed.length > 0) {
        const weights = allowed.map((move) => [move, base.get(move) ?? 1e-9] as const);
        base = normalized(weights);
        distributionMoves = allowed;
      } else fallback = "off_spine_to_guard_250";
    }
    if (controlled && arm === "statistical_book_guarded") {
      if (stratum === "opening" && absolutePly(currentFen) <= 24) {
        const book = localBook.counts[positionKey(position)];
        const weights = Object.entries(book?.moves ?? {});
        if (weights.length > 0) { base = normalized(weights); distributionMoves = weights.map(([move]) => move); }
        else fallback = "local_book_miss_to_guard_250";
      } else fallback = "outside_book_scope_to_guard_250";
    }

    const best = await stockfish.best(pack.start.fen, history);
    const scoreMoves = [...new Set([...distributionMoves, chosen!, best.move])].filter(Boolean);
    const scores = await stockfish.scores(pack.start.fen, history, scoreMoves);
    const losses = new Map([...scores].map(([move, score]) => [move, Math.max(0, best.score - score)]));

    if (controlled && arm !== "production_maia" && arm !== "weakened_stockfish_control") {
      let selected = guard(base, losses);
      if (fallback !== undefined && (arm === "authored_repertoire_guarded" || arm === "statistical_book_guarded")) {
        selected = guard(productionDistribution(packet!.candidates), losses);
        applied = `${arm}:fallback_guard_250`;
      } else if (arm === "pawn_x4_guarded") {
        selected = normalized([...selected].map(([move, mass]) => [move, mass * (pieceIsPawn(position, move) ? 4 : 1)] as const));
      }
      chosen = deterministicDraw(selected, `${blindId}:${ply}:${arm}`);
    }

    const parsed = parseUci(chosen!);
    if (parsed === undefined || !isNormal(parsed) || !position.isLegal(parsed)) {
      throw new Error(`${blindId} illegal ${chosen} at ply ${ply} (${currentFen})`);
    }
    const moveSan = makeSanAndPlay(position, parsed);
    history.push(chosen!); san.push(moveSan);
    trace.push({
      ply: ply + 1, turn, controlled, requestedArm: arm, applied, ...(fallback === undefined ? {} : { fallback }),
      moveUci: chosen, san: moveSan, stockfishBest: best.move,
      stockfishLossCp: losses.get(chosen!) ?? null,
      ...(packet === undefined ? {} : { maiaSelected: packet.moveUci, maiaCandidates: packet.candidates.length, maiaEngine: packet.engine }),
    });
  }
  return { blindId, packId: pack.id, stratum, arm, controlledColor, seed, startFen: pack.start.fen,
    objective: pack.objective.summary, historyUci: history, san, terminal: position.isEnd(), trace };
}

function pgn(line: any): string {
  const fields = line.startFen.split(" ");
  let turn = fields[1] === "b" ? "black" : "white";
  let fullmove = Number(fields[5] ?? 1);
  const tokens: string[] = [];
  for (const move of line.san as string[]) {
    if (turn === "white") tokens.push(`${fullmove}. ${move}`);
    else { tokens.push(tokens.length === 0 ? `${fullmove}... ${move}` : move); fullmove += 1; }
    turn = turn === "white" ? "black" : "white";
  }
  return `[Event "R11 blind branch"]\n[Site "Tabiya disposable research"]\n[Date "2026.08.20"]\n[Round "${line.blindId}"]\n[White "Bot A"]\n[Black "Bot B"]\n[Result "*"]\n[SetUp "1"]\n[FEN "${line.startFen}"]\n\n${tokens.join(" ")} *\n`;
}

async function main(): Promise<void> {
  if (!Number.isSafeInteger(PLIES) || PLIES < 10 || PLIES > 20) throw new Error("TABIYA_R11_PLIES must be 10–20");
  localBook = JSON.parse(await readFile(LOCAL_BOOK_PATH, "utf8")) as LocalBook;
  if (localBook.schema !== "tabiya.r11.local-statistical-book.v1") throw new Error("Unexpected local-book schema");
  await mkdir(join(OUT, "pgn"), { recursive: true });
  await api("/auth/register", { handle: `r11blind${Date.now().toString(36)}`, password: "r11-blind-disposable-password" });
  const stockfish = new UciEngine(); await stockfish.initialize();
  const lines: any[] = [];
  try {
    for (const start of STARTS) {
      const pack = JSON.parse(await readFile(join(ROOT, "content/drafts", start.file), "utf8")) as Pack;
      for (const arm of ARMS) {
        const colors: readonly (Color | "both")[] = arm === "production_maia" ? ["both"] : ["white", "black"];
        for (const controlledColor of colors) {
          const identity = `${pack.id}:${arm}:${controlledColor}`;
          const blindId = `B${sha(identity).slice(0, 9).toUpperCase()}`;
          const seed = Number.parseInt(sha(`seed:${identity}`).slice(0, 8), 16) >>> 0;
          process.stderr.write(`generate ${blindId} ${pack.id} ${arm} ${controlledColor}\n`);
          lines.push(await generateLine(stockfish, pack, start.stratum, arm, controlledColor, blindId, seed));
        }
      }
    }
  } finally { stockfish.close(); }

  const pgnById = new Map(lines.map((line) => [line.blindId, pgn(line)]));
  if (new Set(pgnById.values()).size !== pgnById.size) throw new Error("Duplicate PGNs under different blind IDs");
  const ordered = [...lines].sort((left, right) => sha(`order:${left.blindId}`).localeCompare(sha(`order:${right.blindId}`)));
  for (const line of ordered) await writeFile(join(OUT, "pgn", `${line.blindId}.pgn`), pgnById.get(line.blindId)!);
  const armExercise = Object.fromEntries(ARMS.map((arm) => {
    const controlled = lines.flatMap((line) => line.arm === arm ? line.trace.filter((row: any) => row.controlled) : []);
    const fallbacks = controlled.filter((row: any) => row.fallback !== undefined).length;
    const losses = controlled.flatMap((row: any) => typeof row.stockfishLossCp === "number" ? [row.stockfishLossCp] : []);
    return [arm, {
      controlledPlies: controlled.length,
      fallbackPlies: fallbacks,
      fallbackRate: controlled.length === 0 ? 0 : fallbacks / controlled.length,
      meanLossCp: losses.reduce((sum: number, value: number) => sum + value, 0) / Math.max(1, losses.length),
      severe250Rate: losses.filter((value: number) => value >= 250).length / Math.max(1, losses.length),
      reviewEligible: arm !== "weakened_stockfish_control" && (controlled.length === 0 || fallbacks / controlled.length <= 0.25),
    }];
  }));
  const packet = ordered
    .filter((line) => (armExercise[line.arm] as any).reviewEligible || line.arm === "weakened_stockfish_control")
    .map((line) => ({ blindId: line.blindId, objective: line.objective, pgn: `pgn/${line.blindId}.pgn` }));
  const refusedBeforeReview = [
    "authored_repertoire_guarded",
    ...ARMS.filter((arm) => arm !== "weakened_stockfish_control"
      && !(armExercise[arm] as any).reviewEligible),
  ];
  const key = {
    generatedAt: new Date().toISOString(), parameters: { plies: PLIES, sfNodes: SF_NODES, weakNodes: WEAK_NODES,
      targetElo: TARGET_ELO, temperature: TEMPERATURE, topP: TOP_P, guardCp: GUARD_CP, policyDigest: POLICY_DIGEST },
    lines: ordered,
  };
  await writeFile(join(OUT, "review-packet.json"), `${JSON.stringify(packet, null, 2)}\n`);
  await writeFile(join(OUT, "blind-key.json"), `${JSON.stringify(key, null, 2)}\n`);
  const localBookSummary = {
    schema: localBook.schema,
    source: localBook.source,
    population: localBook.population,
    roots: localBook.roots,
    summary: localBook.summary,
  };
  await writeFile(join(OUT, "local-book-summary.json"), `${JSON.stringify(localBookSummary, null, 2)}\n`);
  await writeFile(join(OUT, "scorecard.csv"), "reviewer_id,blind_id,acceptable,plan_continuity_1_5,tactical_sanity_1_5,objective_relevance_1_5,repetition_1_5,human_plausibility_1_5,first_breaking_ply,notes\n");
  const manifest = {
    branches: ordered.length,
    pgnDigest: `sha256:${sha(ordered.map((line) => pgnById.get(line.blindId)).join("\n"))}`,
    packetDigest: `sha256:${sha(JSON.stringify(packet) + packet.map((row) => pgnById.get(row.blindId)).join("\n"))}`,
    keyDigest: `sha256:${sha(JSON.stringify(key))}`,
    localBookDigest: `sha256:${sha(JSON.stringify(localBookSummary))}`,
    arms: Object.fromEntries(ARMS.map((arm) => [arm, lines.filter((line) => line.arm === arm).length])),
    strata: Object.fromEntries(["opening", "middlegame", "reduced_material"].map((stratum) => [stratum, lines.filter((line) => line.stratum === stratum).length])),
    armExercise,
    reviewPacketBranches: packet.length,
    refusedBeforeReview,
  };
  await writeFile(join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

await main();
