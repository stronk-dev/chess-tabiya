import { createReadStream } from "node:fs";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { createZstdDecompress } from "node:zlib";

import { digestDrillPack, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSanAndPlay } from "chessops/san";
import { parseUci } from "chessops/util";

import { StockfishEvidenceExecutor } from "../evidence-queue.js";
import { EngineSupervisor } from "../engine-supervisor.js";
import { validatePackDocument } from "../pack-validation.js";
import { emissionJobDigest, readJson, writeCanonicalJson } from "./canonical.js";
import { checkSourcingDirectory } from "./check.js";
import { SourceLock } from "./lock.js";
import type { EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest } from "./types.js";
import { SourcingError } from "./types.js";
import { AUTHORING_PROFILE } from "./syzygy.js";

export const PUZZLE_DUMP_URL = "https://database.lichess.org/lichess_db_puzzle.csv.zst";
export const PUZZLE_DUMP_ETAG = '"6a6ef08b-12248997"';
export const PUZZLE_DUMP_RETRIEVED_AT = "2026-08-12T00:00:00.000Z";
export const PUZZLE_DUMP_LENGTH = 304_384_407;
export const PUZZLE_HEADER = "PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags,DailyDate";

export interface PuzzleRow {
  readonly puzzleId: string;
  readonly fen: string;
  readonly moves: readonly string[];
  readonly rating: number;
  readonly ratingDeviation: number;
  readonly popularity: number;
  readonly nbPlays: number;
  readonly themes: readonly string[];
  readonly gameUrl: string;
  readonly openingTags: readonly string[];
  readonly dailyDate: string;
}

export interface PositionSeedOptions {
  readonly csv?: string;
  readonly ratingBand: readonly [number, number];
  readonly themes?: readonly string[];
  readonly count: number;
  readonly plies?: number;
  readonly outputRoot?: string;
  readonly sourceRoot?: string;
  readonly engineEval?: boolean;
  readonly engineEvaluator?: PositionSeedEngineEvaluator;
  readonly rows?: AsyncIterable<string>;
  readonly source?: SourceEntry;
  /** Test/inspection seam. Production authoring keeps the RFC floor of 1000. */
  readonly minimumNbPlays?: number;
}

export interface PositionSeedEngineAnswer {
  readonly source: SourceEntry;
  readonly values: Readonly<Record<string, unknown>>;
}
export type PositionSeedEngineEvaluator = (fen: string) => Promise<PositionSeedEngineAnswer>;

export async function createPositionSeedEngineEvaluator(command: string, args: readonly string[] = []): Promise<{ readonly evaluate: PositionSeedEngineEvaluator; close(): Promise<void> }> {
  const supervisor = new EngineSupervisor([{ id: "stockfish-authoring", kind: "judge", command, args, options: { Threads: AUTHORING_PROFILE.threads, Hash: AUTHORING_PROFILE.hashMb, MultiPV: AUTHORING_PROFILE.multiPv }, handshakeTimeoutMs: 15_000 }]);
  const identity = await supervisor.start("stockfish-authoring");
  const executor = new StockfishEvidenceExecutor(supervisor, "stockfish-authoring");
  return {
    async evaluate(fen) {
      const retrievedAt = new Date().toISOString();
      const payload = await executor.execute({ id: `authoring-${Date.now()}`, runId: "content-sourcing", nodeId: "start", fen, kind: "eval", depth: AUTHORING_PROFILE.depth, timeoutMs: AUTHORING_PROFILE.timeoutMs }, new AbortController().signal);
      return {
        source: { sourceId: "stockfish-authoring", retrievedAt, origin: { kind: "engine", engineId: identity.id, engineName: identity.name, engineVersion: identity.version, profile: { threads: AUTHORING_PROFILE.threads, hashMb: AUTHORING_PROFILE.hashMb, multiPv: AUTHORING_PROFILE.multiPv }, budget: { depth: AUTHORING_PROFILE.depth }, fen, evidenceKind: "engine_eval" }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "output of a locally executed engine; not a third-party work" } },
        values: { fen, ...payload.values, depth: AUTHORING_PROFILE.depth, threads: AUTHORING_PROFILE.threads, hashMb: AUTHORING_PROFILE.hashMb, multiPv: AUTHORING_PROFILE.multiPv, timeoutMs: AUTHORING_PROFILE.timeoutMs, engineId: identity.id, engineName: identity.name, engineVersion: identity.version },
      };
    },
    async close() { await supervisor.shutdown(); },
  };
}

function csvFields(line: string): readonly string[] {
  const fields: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]!;
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { field += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      fields.push(field); field = "";
    } else field += character;
  }
  if (quoted) throw new SourcingError("PUZZLE_CSV_INVALID", "unterminated quoted CSV field");
  fields.push(field);
  return fields;
}

function integer(value: string, column: string, puzzleId: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new SourcingError("PUZZLE_ROW_INVALID", `${puzzleId}: ${column} must be an integer`);
  return parsed;
}

export function parsePuzzleRow(line: string): PuzzleRow {
  const fields = csvFields(line);
  if (fields.length !== 11) throw new SourcingError("PUZZLE_ROW_INVALID", `expected 11 columns, received ${fields.length}`);
  const [puzzleId, fen, moves, rating, deviation, popularity, nbPlays, themes, gameUrl, openingTags, dailyDate] = fields as [string, string, string, string, string, string, string, string, string, string, string];
  if (!puzzleId || !fen || !moves || !gameUrl) throw new SourcingError("PUZZLE_ROW_INVALID", "PuzzleId, FEN, Moves and GameUrl are required");
  const moveList = moves.split(/\s+/).filter(Boolean);
  if (moveList.length % 2 !== 0) throw new SourcingError("PUZZLE_MOVE_PARITY_INVALID", `${puzzleId}: Moves must contain an even number of plies (opponent/solver pairs)`);
  return Object.freeze({ puzzleId, fen, moves: Object.freeze(moveList), rating: integer(rating, "Rating", puzzleId), ratingDeviation: integer(deviation, "RatingDeviation", puzzleId), popularity: integer(popularity, "Popularity", puzzleId), nbPlays: integer(nbPlays, "NbPlays", puzzleId), themes: Object.freeze(themes.split(/\s+/).filter(Boolean)), gameUrl, openingTags: Object.freeze(openingTags.split(/\s+/).filter(Boolean)), dailyDate });
}

export function replayPuzzle(row: PuzzleRow): { readonly fen: string; readonly san: readonly string[]; readonly terminal: boolean } {
  let position: Chess;
  try { position = Chess.fromSetup(parseFen(row.fen).unwrap()).unwrap(); }
  catch { throw new SourcingError("PUZZLE_FEN_INVALID", `${row.puzzleId}: invalid CSV FEN`); }
  const san: string[] = [];
  for (const [index, value] of row.moves.entries()) {
    const move = parseUci(value);
    if (move === undefined || !position.isLegal(move)) throw new SourcingError("PUZZLE_LINE_ILLEGAL", `${row.puzzleId}: illegal move ${value} at ply ${index + 1}`);
    san.push(makeSanAndPlay(position, move));
  }
  return Object.freeze({ fen: makeFen(position.toSetup()), san: Object.freeze(san), terminal: position.isEnd() });
}

function sourceEntry(): SourceEntry {
  return Object.freeze({
    sourceId: "lichess-puzzle-db",
    retrievedAt: PUZZLE_DUMP_RETRIEVED_AT,
    origin: { kind: "http", url: PUZZLE_DUMP_URL, status: 200, sha256: null, bytes: null, etag: PUZZLE_DUMP_ETAG },
    licence: { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null },
  } satisfies SourceEntry);
}

async function* fileLines(path: string): AsyncIterable<string> {
  const input = createReadStream(resolve(path));
  const stream = path.endsWith(".zst") ? input.pipe(createZstdDecompress()) : input;
  for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) yield line;
}

async function liveRows(sourceRoot: string): Promise<{ readonly rows: AsyncIterable<string>; readonly source: SourceEntry }> {
  if (typeof createZstdDecompress !== "function") throw new SourcingError("ZSTD_UNAVAILABLE", "node:zlib createZstdDecompress is required for the Lichess puzzle stream");
  const lock = new SourceLock(sourceRoot);
  await lock.acquire();
  try {
    await lock.verify();
    const response = await fetch(PUZZLE_DUMP_URL, { headers: { "user-agent": "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)" } });
    if (!response.ok || response.body === null) throw new SourcingError("SOURCE_HTTP_ERROR", `${PUZZLE_DUMP_URL} returned HTTP ${response.status}`);
    const retrievedAt = new Date().toISOString();
    const source: SourceEntry = { sourceId: "lichess-puzzle-db", retrievedAt, origin: { kind: "http", url: PUZZLE_DUMP_URL, status: response.status, sha256: null, bytes: null, etag: response.headers.get("etag") }, licence: { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null } };
    await writeCanonicalJson(resolve(sourceRoot, "lichess-puzzle-db", "headers.json"), { kind: "headers-only", url: PUZZLE_DUMP_URL, status: response.status, etag: response.headers.get("etag"), contentLength: response.headers.get("content-length"), lastModified: response.headers.get("last-modified"), retrievedAt });
    const decompressed = Readable.fromWeb(response.body as never).pipe(createZstdDecompress());
    return { rows: (async function* () { try { for await (const line of createInterface({ input: decompressed, crlfDelay: Infinity })) { await lock.verify(); yield line; } } finally { await lock.release(); } })(), source };
  } catch (error) {
    await lock.release();
    throw error;
  }
}

function learnerSide(row: PuzzleRow): "white" | "black" { return row.fen.split(" ")[1] === "b" ? "white" : "black"; }
function clampElo(rating: number): number { return Math.min(2000, Math.max(1100, rating)); }
function phase(themes: readonly string[]): "opening" | "middlegame" | "endgame" | undefined {
  const matches = themes.filter((theme): theme is "opening" | "middlegame" | "endgame" => theme === "opening" || theme === "middlegame" || theme === "endgame");
  return matches.length === 1 ? matches[0] : undefined;
}

interface Selected { readonly row: PuzzleRow; readonly replay: ReturnType<typeof replayPuzzle> }

function insertSelected(selected: Selected[], value: Selected, count: number): void {
  selected.push(value);
  selected.sort((left, right) => left.row.puzzleId.localeCompare(right.row.puzzleId));
  if (selected.length > count) selected.pop();
}

export async function emitPositionSeeds(options: PositionSeedOptions): Promise<readonly string[]> {
  const [minimum, maximum] = options.ratingBand;
  const plies = options.plies ?? 8;
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum) throw new SourcingError("RATING_BAND_INVALID", "--rating-band must be MIN-MAX integers");
  if (!Number.isSafeInteger(options.count) || options.count < 1) throw new SourcingError("COUNT_INVALID", "--count must be a positive integer");
  if (!Number.isSafeInteger(plies) || plies < 2 || plies > 20 || plies % 2 !== 0) throw new SourcingError("CHECKPOINT_PLIES_INVALID", "--plies must be an even integer from 2 through 20");
  if (options.engineEval && options.engineEvaluator === undefined) throw new SourcingError("ENGINE_EVAL_UNAVAILABLE", "--engine-eval requires an explicit authoring-engine evaluator; ambient Stockfish is never consulted");

  let lines: AsyncIterable<string>;
  let source = options.source ?? sourceEntry();
  if (options.rows) lines = options.rows;
  else if (options.csv) lines = fileLines(options.csv);
  else ({ rows: lines, source } = await liveRows(resolve(options.sourceRoot ?? "content/sources")));

  const selected: Selected[] = [];
  let header = true;
  for await (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (header) {
      header = false;
      if (line !== PUZZLE_HEADER) throw new SourcingError("PUZZLE_HEADER_INVALID", `expected exact eleven-column header: ${PUZZLE_HEADER}`);
      continue;
    }
    if (!line) continue;
    const row = parsePuzzleRow(line);
    if (row.moves.length < 2 || row.moves.length > 8) continue;
    if (row.rating < 1000 || row.rating < minimum || row.rating > maximum || row.nbPlays < (options.minimumNbPlays ?? 1000) || row.popularity < 80) continue;
    if ((options.themes?.length ?? 0) > 0 && !row.themes.some((theme) => options.themes!.includes(theme))) continue;
    if (row.themes.some((theme) => theme === "mate" || /^mateIn\d+$/.test(theme))) continue;
    const replay = replayPuzzle(row);
    if (replay.terminal) continue;
    insertSelected(selected, { row, replay }, options.count);
  }
  if (header) throw new SourcingError("PUZZLE_HEADER_INVALID", "puzzle CSV is empty");

  const collisionCounts = new Map<string, number>();
  const outputs: string[] = [];
  for (const { row, replay } of selected) {
    const baseId = `onramp-${row.puzzleId.toLowerCase()}`;
    const occurrence = (collisionCounts.get(baseId) ?? 0) + 1;
    collisionCounts.set(baseId, occurrence);
    const id = occurrence === 1 ? baseId : `${baseId}-${occurrence}`;
    const blockers = [
      "The objective transitions on reaching the checkpoint, i.e. on playing the position out. No shipped mechanism grades how it was played out or what happened to the position; adding one is an authored act.",
      "The start position is whatever the puzzle's solution produced; it is not asserted to be winning, equal, or better for the learner. No engine or tablebase has evaluated it.",
      "objective.summary is the emitter's mechanical placeholder; an author must replace it with this pack's actual teaching objective before reviewStatus leaves draft",
      "immediate_blunder_guard is not selectable (defect D8); delayed_checkpoint is a temporary substitution",
      "targetElo clamp [1100, 2000] is an authoring convention, not a Maia capability claim",
      "No authored plan, deviation, or feedback claim exists; a reviewer must add any chess judgement rather than infer one from puzzle metadata.",
    ];
    const pack = {
      id, version: "0.1.0", title: `Play on from Lichess puzzle ${row.puzzleId}`, mode: "outcome",
      ...(phase(row.themes) === undefined ? {} : { phase: phase(row.themes) }),
      difficulty: { minOnlineRapid: Math.max(1000, row.rating - 150), maxOnlineRapid: Math.max(1000, row.rating + 150), branchLengthTarget: plies },
      start: { fen: replay.fen, side: learnerSide(row) },
      objective: { type: "play_until_checkpoint", summary: `Play on from this position for ${plies} plies against an opponent near your rating.`, successConditions: [{ kind: "reach_checkpoint", checkpointId: "consequence" }] },
      checkpoints: [{ id: "consequence", label: "Consequence", trigger: { atPly: plies }, actions: [] }],
      opponentPolicy: { mode: "human_common", targetElo: clampElo(row.rating), seedMode: "per_branch" },
      feedbackPolicy: "delayed_checkpoint",
      provenance: { reviewStatus: "draft", sources: [`Lichess puzzle database (${PUZZLE_DUMP_URL}, etag ${String(source.origin.kind === "http" ? source.origin.etag : null)}) — CC0-1.0; database exports may be used for any purpose`], reviewers: [], licence: "CC-BY-SA-4.0", graduationBlockers: blockers },
    } satisfies DrillPackDefinition;
    const validation = validatePackDocument(pack);
    if (!validation.valid) throw new SourcingError("EMITTED_PACK_INVALID", validation.issues.map((value) => `${value.path} ${value.code}: ${value.message}`).join("; "));
    const records: EvidenceRecord[] = [
      { kind: "puzzle_provenance", anchor: { fen: replay.fen }, sourceId: source.sourceId, retrievedAt: source.retrievedAt, grounds: "citable_source", values: { puzzleId: row.puzzleId, gameUrl: row.gameUrl, rating: row.rating, ratingDeviation: row.ratingDeviation, popularity: row.popularity, nbPlays: row.nbPlays, themes: row.themes, csvFen: row.fen, solutionUci: row.moves, solutionSan: replay.san, solutionPlies: row.moves.length }, supports: ["/start/fen"] },
      { kind: "position_legality", anchor: { fen: replay.fen }, sourceId: source.sourceId, retrievedAt: source.retrievedAt, grounds: "machine_validation", values: { fen: replay.fen, legalMovesAvailable: true }, supports: ["/start/fen"] },
    ];
    const sourceEntries: SourceEntry[] = [source];
    if (options.engineEval) {
      const answer = await options.engineEvaluator!(replay.fen);
      sourceEntries.push(answer.source);
      records.push({ kind: "engine_eval", anchor: { fen: replay.fen }, sourceId: answer.source.sourceId, retrievedAt: answer.source.retrievedAt, grounds: "machine_validation", values: answer.values, supports: ["/start/fen"] });
    }
    const digest = await digestDrillPack(pack);
    const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: sourceEntries };
    const ledger: EvidenceLedger = { schema: "tabiya.sourcing.evidence.v1", packId: id, packVersion: pack.version, packDigest: digest, sourcedAt: sourceEntries.map((entry) => entry.retrievedAt).sort().at(-1)!, records, abstentions: [] };
    const args = { ratingBand: [minimum, maximum], themes: options.themes ?? [], count: options.count, plies, minimumNbPlays: options.minimumNbPlays ?? 1000, engineEval: options.engineEval === true };
    const sourceEtags = sourceEntries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null);
    const job = { schema: "tabiya.sourcing.job.v1", pipeline: "position-seeds", args, sourceEtags, emissionJobDigest: emissionJobDigest("position-seeds", args, sourceEtags) };
    const output = resolve(options.outputRoot ?? "content/candidates", id);
    try {
      const existing = await readJson(resolve(output, "job.json")) as Record<string, unknown>;
      await Promise.all(["pack.json", "evidence.json", "sources.json"].map((file) => access(resolve(output, file))));
      if (existing.emissionJobDigest === job.emissionJobDigest && (await checkSourcingDirectory(output)).valid) { outputs.push(output); continue; }
    } catch { /* incomplete, changed or invalid output is re-emitted */ }
    await writeCanonicalJson(resolve(output, "pack.json"), pack);
    await writeCanonicalJson(resolve(output, "evidence.json"), ledger);
    await writeCanonicalJson(resolve(output, "sources.json"), manifest);
    await writeCanonicalJson(resolve(output, "job.json"), job);
    outputs.push(output);
  }
  return Object.freeze(outputs);
}

export async function fixturePuzzleRows(path = "apps/server/src/sourcing/fixtures/lichess-puzzles.csv"): Promise<AsyncIterable<string>> {
  const text = await readFile(resolve(path), "utf8");
  return (async function* () { yield* text.replaceAll("\r\n", "\n").split("\n").filter(Boolean); })();
}
