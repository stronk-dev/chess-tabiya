// rfc/famous-games.md §4 — the authoring path for a hand-selected masters game.
//
// A masters game reaches a pack the way every other sourced fact does: one named game id is fetched
// through the explorer client (same lock, same User-Agent, same 429/5xx schedule, same abstention),
// its bytes pass the shipped D410 record-boundary strip (`stripPgnAnnotations`) and the shipped
// mainline parser (`parsePgnMainline`, which keeps only `{san, uci}` per move), and the result is
// emitted as a draft candidate. Nothing here writes a chess judgement: the objective is the emitter's
// mechanical placeholder and the graduation blockers say so.
import { access } from "node:fs/promises";
import { resolve } from "node:path";

import { digestDrillPack, type SpineNode } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSanAndPlay } from "chessops/san";
import { parseUci } from "chessops/util";

import { emitterGraduationBlocker } from "../graduation-blocker-templates.mjs";
import { stripPgnAnnotations } from "../import-source.js";
import { validatePackDocument } from "../pack-validation.js";
import { PgnImportError, parsePgnMainline } from "../pgn-import.js";
import { emissionJobDigest, readJson, sha256, writeCanonicalJson } from "./canonical.js";
import { checkSourcingDirectory } from "./check.js";
import { MASTERS_RATIONALE, MASTERS_SOURCE_ID, mastersGameUrl, requireSingleMastersGame, type MastersGame } from "./explorer.js";
import { attachEmitterGraduationClearances } from "./graduation-clear.js";
import type { NormalizedOpeningMove } from "./openings.js";
import { SOURCE_GAME_RESULTS, SOURCE_GAME_SIDECAR_SCHEMA, sourceGameIssues, type SourceGame, type SourceGameLicenceBasis, type SourceGameSidecar } from "./source-game.js";
import { type EvidenceLedger, type SourceManifest, SourcingError } from "./types.js";

// Same node shape as the openings emitter's chain. Kept local: `openings.ts` is an input to the
// runtime opening catalogue's compiler digest, so touching it would stale that artifact.
function spineChain(moves: readonly NormalizedOpeningMove[], absoluteStart: number): readonly SpineNode[] {
  let children: readonly SpineNode[] = [];
  for (let index = moves.length - 1; index >= 0; index -= 1) {
    const move = moves[index]!;
    children = [Object.freeze({ id: `p${absoluteStart + index}-${slug(move.san)}`, moveUci: move.uci, moveSan: move.san, children })];
  }
  return children;
}

export interface ParsedMastersGame {
  readonly sourceGame: SourceGame;
  readonly rootFen: string;
  readonly moves: readonly NormalizedOpeningMove[];
}

function header(headers: Readonly<Record<string, string>>, name: string): string | undefined {
  const value = headers[name];
  return value === undefined ? undefined : value.trim();
}

function requiredHeader(headers: Readonly<Record<string, string>>, name: string): string {
  const value = header(headers, name);
  // No default: a missing roster field is refused, never filled with "" (criterion 4).
  if (value === undefined || value.length === 0) throw new SourcingError("MASTERS_PGN_HEADER_INVALID", `masters PGN lacks the Seven-Tag-Roster field ${name}`);
  return value;
}

/**
 * Derives `sourceGame` with no hand-authoring. white, black, date and result come from the
 * Seven-Tag-Roster; event, site and round are carried when present; sourceId is the requested game
 * identity and licenceBasis is the source entry's licence basis — neither is a PGN tag.
 */
export function sourceGameFromHeaders(headers: Readonly<Record<string, string>>, sourceId: string, licenceBasis: SourceGameLicenceBasis): SourceGame {
  const result = requiredHeader(headers, "Result");
  if (!SOURCE_GAME_RESULTS.includes(result as SourceGame["result"])) throw new SourcingError("MASTERS_PGN_HEADER_INVALID", `masters PGN Result ${JSON.stringify(result)} is not a PGN result`);
  const date = requiredHeader(headers, "Date");
  if (!/^(\d{4}|\?{4})\.(\d{2}|\?{2})\.(\d{2}|\?{2})$/.test(date)) throw new SourcingError("MASTERS_PGN_HEADER_INVALID", `masters PGN Date ${JSON.stringify(date)} is not YYYY.MM.DD`);
  const optional = (name: string, key: "event" | "site" | "round"): Partial<Record<"event" | "site" | "round", string>> => {
    const value = header(headers, name);
    return value === undefined || value.length === 0 ? {} : { [key]: value };
  };
  const sourceGame: SourceGame = {
    white: requiredHeader(headers, "White"),
    black: requiredHeader(headers, "Black"),
    ...optional("Event", "event"),
    ...optional("Site", "site"),
    date,
    ...optional("Round", "round"),
    result: result as SourceGame["result"],
    sourceId,
    licenceBasis,
  };
  const issues = sourceGameIssues(sourceGame);
  if (issues.length > 0) throw new SourcingError("MASTERS_PGN_HEADER_INVALID", issues.join("; "));
  return Object.freeze(sourceGame);
}

export function mastersSourceGameId(gameId: string): string {
  mastersGameUrl(gameId);
  return `${MASTERS_SOURCE_ID}:${gameId}`;
}

/** The record boundary: annotations, NAGs, suffix glyphs and comments never survive this function. */
export function parseMastersGame(body: Uint8Array, gameId: string): ParsedMastersGame {
  let parsed;
  try {
    parsed = parsePgnMainline(stripPgnAnnotations(new TextDecoder().decode(body)), { requireMoves: true });
  } catch (error) {
    if (error instanceof PgnImportError) throw new SourcingError("MASTERS_PGN_INVALID", error.message);
    throw new SourcingError("MASTERS_PGN_INVALID", error instanceof Error ? error.message : String(error));
  }
  const setup = parseFen(parsed.rootFen).unwrap();
  const position = Chess.fromSetup(setup).unwrap();
  const moves: NormalizedOpeningMove[] = [];
  for (const move of parsed.moves) {
    const parsedMove = parseUci(move.uci)!;
    // SAN is re-rendered from the legal move, so no source glyph can ride along in the movetext.
    const san = makeSanAndPlay(position, parsedMove);
    moves.push(Object.freeze({ uci: move.uci, san, fen: makeFen(position.toSetup()) }));
  }
  return Object.freeze({ sourceGame: sourceGameFromHeaders(parsed.headers, mastersSourceGameId(gameId), "no-rights-asserted"), rootFen: parsed.rootFen, moves: Object.freeze(moves) });
}

function slug(value: string): string {
  return value.toLowerCase().normalize("NFKD").replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}

function surname(player: string): string {
  return slug(player.split(",")[0] ?? player) || "unknown";
}

export function mastersGameTitle(game: SourceGame): string {
  const occasion = [game.event, game.site].filter((value): value is string => value !== undefined && value !== "?").join(", ");
  return `${game.white} – ${game.black}${occasion.length > 0 ? `, ${occasion}` : ""} ${game.date}`;
}

export function mastersSourceLine(game: SourceGame, gameId: string): string {
  return `${mastersGameTitle(game)}: ${MASTERS_SOURCE_ID} (${mastersGameUrl(gameId)}) — ${MASTERS_RATIONALE}`;
}

export interface MastersEmitOptions {
  readonly gameIds: readonly string[];
  readonly splitPly: number;
  readonly toPly?: number;
  readonly learnerSide: "white" | "black";
  /** Author-declared: which phase a slice of a game rehearses is a judgement the emitter never guesses. */
  readonly phase: "opening" | "middlegame" | "endgame" | "cross_phase";
  readonly client: { masterGame(gameId: string): Promise<MastersGame> };
  readonly outputRoot?: string;
}

export async function emitMastersCandidate(options: MastersEmitOptions): Promise<string> {
  // Refused before any request: the harvesting method is the constraint (§2, criterion 5).
  const gameId = requireSingleMastersGame(options.gameIds);
  if (!Number.isInteger(options.splitPly) || options.splitPly < 0) throw new SourcingError("MASTERS_PLY_RANGE_INVALID", "--split-ply must be a non-negative integer");
  if (options.toPly !== undefined && (!Number.isInteger(options.toPly) || options.toPly <= options.splitPly)) throw new SourcingError("MASTERS_PLY_RANGE_INVALID", "--to-ply must be an integer greater than --split-ply");
  const fetched = await options.client.masterGame(gameId);
  if (fetched.kind === "abstention") throw new SourcingError("SOURCE_UNAVAILABLE", `${MASTERS_SOURCE_ID} ${gameId}: ${fetched.reason} (${fetched.detail}); no candidate emitted`);
  const game = parseMastersGame(fetched.body, gameId);
  const end = options.toPly ?? game.moves.length;
  if (end > game.moves.length || options.splitPly >= end) throw new SourcingError("MASTERS_PLY_RANGE_INVALID", `the game has ${game.moves.length} plies; split ${options.splitPly} to ${end} leaves no drill plies`);
  const startMoves = game.moves.slice(0, options.splitPly);
  const drillMoves = game.moves.slice(options.splitPly, end);
  const year = /^\d{4}/.exec(game.sourceGame.date)?.[0] ?? "undated";
  const id = `masters-${surname(game.sourceGame.white)}-${surname(game.sourceGame.black)}-${year}-${sha256(gameId).slice(7, 15)}-${options.learnerSide}`;
  const sideToMove = parseFen(startMoves.at(-1)?.fen ?? game.rootFen).unwrap().turn;
  if (sideToMove !== options.learnerSide) throw new SourcingError("MASTERS_PLY_RANGE_INVALID", `at ply ${options.splitPly} ${sideToMove} is to move; choose a split ply where the learner side (${options.learnerSide}) moves first`);
  const pack = attachEmitterGraduationClearances({
    id,
    version: "0.1.0",
    title: mastersGameTitle(game.sourceGame),
    mode: "line",
    phase: options.phase,
    start: { fen: startMoves.at(-1)?.fen ?? game.rootFen, movesSan: startMoves.map((move) => move.san), side: options.learnerSide },
    objective: { type: "play_until_checkpoint", summary: `Play the recorded game to ply ${end}: ${drillMoves.length} plies from this position.`, successConditions: [{ kind: "reach_checkpoint", checkpointId: "line-end" }] },
    spine: spineChain(drillMoves, options.splitPly + 1),
    checkpoints: [{ id: "line-end", trigger: { atPly: drillMoves.length }, actions: [] }],
    opponentPolicy: { mode: "theory_strict" },
    feedbackPolicy: "delayed_checkpoint",
    provenance: {
      reviewStatus: "draft",
      corpusEvidence: { state: "unsourced" },
      sources: [mastersSourceLine(game.sourceGame, gameId)],
      licence: "CC-BY-SA-4.0",
      graduationBlockers: [emitterGraduationBlocker("mechanical-objective-placeholder"), emitterGraduationBlocker("authored-teaching-absent")],
    },
  });
  const validation = validatePackDocument(pack);
  if (!validation.valid) throw new SourcingError("EMITTED_PACK_INVALID", validation.issues.map((value) => `${value.path} ${value.code}: ${value.message}`).join("; "));
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: [fetched.source] };
  const ledger: EvidenceLedger = {
    schema: "tabiya.sourcing.evidence.v1",
    packId: pack.id,
    packVersion: pack.version,
    packDigest: await digestDrillPack(pack),
    sourcedAt: fetched.source.retrievedAt,
    // The start position is reached by replaying the source game's legal mainline; that replay is
    // the only fact this ledger records. The game identity lives in source-game.json.
    records: [{ kind: "position_legality", anchor: { fen: pack.start.fen }, sourceId: fetched.source.sourceId, retrievedAt: fetched.source.retrievedAt, grounds: "machine_validation", values: { fen: pack.start.fen, legalMovesAvailable: true }, supports: ["/start/fen"] }],
    abstentions: [],
  };
  const sidecar: SourceGameSidecar = { schema: SOURCE_GAME_SIDECAR_SCHEMA, packId: pack.id, sourceGame: game.sourceGame };
  const output = resolve(options.outputRoot ?? "content/candidates", id);
  const args = { game: gameId, splitPly: options.splitPly, ...(options.toPly === undefined ? {} : { toPly: options.toPly }), learnerSide: options.learnerSide, phase: options.phase };
  const etag = fetched.source.origin.kind === "http" ? fetched.source.origin.etag : null;
  const job = { schema: "tabiya.sourcing.job.v1", pipeline: "masters", args, sourceEtags: [etag], emissionJobDigest: emissionJobDigest("masters", args, [etag]) };
  try {
    const existing = await readJson(resolve(output, "job.json")) as Record<string, unknown>;
    await Promise.all(["pack.json", "evidence.json", "sources.json", "source-game.json"].map((file) => access(resolve(output, file))));
    if (existing.emissionJobDigest === job.emissionJobDigest && (await checkSourcingDirectory(output)).valid) return output;
  } catch { /* missing, changed or invalid output is re-emitted below */ }
  await writeCanonicalJson(resolve(output, "pack.json"), pack);
  await writeCanonicalJson(resolve(output, "evidence.json"), ledger);
  await writeCanonicalJson(resolve(output, "sources.json"), manifest);
  await writeCanonicalJson(resolve(output, "source-game.json"), sidecar);
  await writeCanonicalJson(resolve(output, "job.json"), job);
  return output;
}
