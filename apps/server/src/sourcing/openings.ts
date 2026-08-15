import { access, readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { digestDrillPack, type DrillPackDefinition, type SpineNode } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parsePgn } from "chessops/pgn";
import { makeSanAndPlay, parseSan } from "chessops/san";
import { makeUci } from "chessops/util";

import { validatePackDocument } from "../pack-validation.js";
import { emissionJobDigest, readJson, sha256, writeCanonicalJson } from "./canonical.js";
import { checkSourcingDirectory } from "./check.js";
import { type EvidenceLedger, type SourceEntry, type SourceManifest, SourcingError } from "./types.js";

export const CHESS_OPENINGS_COMMIT = "4b8622759e7ae6f93f011cc6c83a3823401ab45e";
export const CHESS_OPENINGS_RETRIEVED_AT = "2026-08-04T00:00:00.000Z";

export interface OpeningEmitOptions {
  readonly eco: string;
  readonly name?: string;
  readonly prefix?: string;
  readonly splitPly: number;
  readonly learnerSide: "white" | "black";
  readonly outputRoot?: string;
  readonly tsvPath?: string;
}

interface OpeningRow { readonly eco: string; readonly name: string; readonly pgn: string }
interface NormalizedMove { readonly uci: string; readonly san: string; readonly fen: string }

function slug(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}

function parseRows(tsv: string): OpeningRow[] {
  const lines = tsv.replaceAll("\r\n", "\n").split("\n");
  if (lines.shift() !== "eco\tname\tpgn") throw new SourcingError("OPENINGS_HEADER_INVALID", "expected eco, name, pgn TSV header");
  return lines.filter((line) => line.trim() !== "").map((line, index) => {
    const [eco, name, ...pgn] = line.split("\t");
    if (!eco || !name || pgn.length !== 1 || !pgn[0]) throw new SourcingError("OPENINGS_ROW_INVALID", `malformed TSV row ${index + 2}`);
    return { eco, name, pgn: pgn[0] };
  });
}

export function normalizeOpeningPgn(pgn: string): NormalizedMove[] {
  const games = parsePgn(pgn);
  if (games.length !== 1) throw new SourcingError("OPENINGS_PGN_INVALID", "opening row must contain exactly one PGN game");
  const position = Chess.default();
  const moves: NormalizedMove[] = [];
  for (const data of games[0]!.moves.mainline()) {
    const move = parseSan(position, data.san);
    if (!move || !position.isLegal(move)) throw new SourcingError("OPENINGS_PGN_ILLEGAL", `illegal SAN in opening row: ${data.san}`);
    const uci = makeUci(move);
    const san = makeSanAndPlay(position, move);
    moves.push({ uci, san, fen: makeFen(position.toSetup()) });
  }
  if (moves.length === 0) throw new SourcingError("OPENINGS_PGN_INVALID", "opening row has no legal moves");
  return moves;
}

function spineChain(moves: readonly NormalizedMove[], absoluteStart: number): readonly SpineNode[] {
  let children: readonly SpineNode[] = [];
  for (let index = moves.length - 1; index >= 0; index -= 1) {
    const move = moves[index]!;
    children = [Object.freeze({ id: `p${absoluteStart + index}-${slug(move.san)}`, moveUci: move.uci, moveSan: move.san, children })];
  }
  return children;
}

function spinePointers(spine: readonly SpineNode[]): Array<{ id: string; pointer: string; san: string }> {
  const values: Array<{ id: string; pointer: string; san: string }> = [];
  let nodes = spine;
  let pointer = "/spine";
  while (nodes[0]) {
    values.push({ id: nodes[0].id, pointer: `${pointer}/0/moveSan`, san: nodes[0].moveSan });
    nodes = nodes[0].children;
    pointer += "/0/children";
  }
  return values;
}

export async function emitOpeningCandidate(options: OpeningEmitOptions): Promise<string> {
  if (!options.name && !options.prefix) throw new SourcingError("OPENINGS_NAME_REQUIRED", "provide --name or --prefix");
  if (!Number.isInteger(options.splitPly) || options.splitPly < 0) throw new SourcingError("OPENINGS_SPLIT_INVALID", "--split-ply must be a non-negative integer");
  const fixture = resolve(options.tsvPath ?? "apps/server/src/sourcing/fixtures/chess-openings-d.tsv");
  const bytes = await readFile(fixture);
  const matching = parseRows(bytes.toString("utf8")).filter((row) => row.eco === options.eco && (options.name ? row.name === options.name : row.name.startsWith(options.prefix!)));
  if (matching.length === 0) throw new SourcingError("OPENINGS_ROW_NOT_FOUND", `no ${options.eco} row matches the requested name`);
  const rows = matching.map((row) => ({ row, moves: normalizeOpeningPgn(row.pgn) })).sort((left, right) => right.moves.length - left.moves.length || left.row.name.localeCompare(right.row.name));
  const selected = rows[0]!;
  if (options.splitPly >= selected.moves.length) throw new SourcingError("OPENINGS_SPLIT_INVALID", `split ply ${options.splitPly} leaves no drill plies`);
  const id = `${slug(`${selected.row.eco}-${selected.row.name}`)}-${options.learnerSide}`;
  const startMoves = selected.moves.slice(0, options.splitPly);
  const drillMoves = selected.moves.slice(options.splitPly);
  const spine = spineChain(drillMoves, options.splitPly + 1);
  const sourceUrl = `https://raw.githubusercontent.com/lichess-org/chess-openings/${CHESS_OPENINGS_COMMIT}/${selected.row.eco[0]!.toLowerCase()}.tsv`;
  const sourceString = `${selected.row.eco} ${selected.row.name}: lichess-chess-openings (${sourceUrl}) — CC0-1.0, no attribution required`;
  const pack = {
    id,
    version: "0.1.0",
    title: selected.row.name,
    mode: "line",
    phase: "opening",
    start: { fen: startMoves.at(-1)?.fen ?? makeFen(Chess.default().toSetup()), movesSan: startMoves.map((move) => move.san), side: options.learnerSide },
    objective: { type: "play_until_checkpoint", summary: `Play the recorded line to its end: ${drillMoves.length} plies from this position.`, successConditions: [{ kind: "reach_checkpoint", checkpointId: "line-end" }] },
    spine,
    checkpoints: [{ id: "line-end", trigger: { atPly: drillMoves.length }, actions: [] }],
    opponentPolicy: { mode: "theory_strict" },
    feedbackPolicy: "delayed_checkpoint",
    provenance: {
      reviewStatus: "draft",
      sources: [sourceString],
      reviewers: [],
      licence: "CC-BY-SA-4.0",
      graduationBlockers: ["objective.summary is the emitter's mechanical placeholder; an author must replace it with this pack's actual teaching objective before reviewStatus leaves draft"],
    },
  } satisfies DrillPackDefinition;
  const validation = validatePackDocument(pack);
  if (!validation.valid) throw new SourcingError("EMITTED_PACK_INVALID", validation.issues.map((value) => `${value.path} ${value.code}: ${value.message}`).join("; "));
  const source: SourceEntry = {
    sourceId: "lichess-chess-openings",
    retrievedAt: CHESS_OPENINGS_RETRIEVED_AT,
    origin: { kind: "http", url: sourceUrl, status: 200, sha256: sha256(bytes), bytes: bytes.byteLength, etag: null },
    licence: { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null },
  };
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: [source] };
  const pointers = spinePointers(spine);
  const digest = await digestDrillPack(pack);
  const ledger: EvidenceLedger = {
    schema: "tabiya.sourcing.evidence.v1",
    packId: pack.id,
    packVersion: pack.version,
    packDigest: digest,
    sourcedAt: source.retrievedAt,
    records: pointers.map((value) => ({ kind: "opening_identity", anchor: { spineNodeId: value.id }, sourceId: source.sourceId, retrievedAt: source.retrievedAt, grounds: "citable_source", values: { eco: selected.row.eco, name: selected.row.name, san: value.san }, supports: [value.pointer, "/title"] })),
    abstentions: [],
  };
  const output = resolve(options.outputRoot ?? "content/candidates", id);
  const args = {
    eco: options.eco,
    splitPly: options.splitPly,
    learnerSide: options.learnerSide,
    ...(options.name === undefined ? {} : { name: options.name }),
    ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
  };
  const job = { schema: "tabiya.sourcing.job.v1", pipeline: "openings", args, sourceEtags: [null], emissionJobDigest: emissionJobDigest("openings", args, [null]) };
  try {
    const existing = await readJson(resolve(output, "job.json")) as Record<string, unknown>;
    await Promise.all(["pack.json", "evidence.json", "sources.json"].map((file) => access(resolve(output, file))));
    if (existing.emissionJobDigest === job.emissionJobDigest && (await checkSourcingDirectory(output)).valid) return output;
    const existingArgs = existing.args as Record<string, unknown> | undefined;
    if (existing.emissionJobDigest !== job.emissionJobDigest && existingArgs?.learnerSide !== undefined && existingArgs.learnerSide !== options.learnerSide) {
      throw new SourcingError("CANDIDATE_IDENTITY_COLLISION", `candidate ${id} already belongs to ${JSON.stringify(existingArgs)}; refused ${JSON.stringify(args)}`);
    }
  } catch (error) {
    if (error instanceof SourcingError) throw error;
    // Missing, changed, incomplete or invalid output is re-emitted below.
  }
  await writeCanonicalJson(resolve(output, "pack.json"), pack);
  await writeCanonicalJson(resolve(output, "evidence.json"), ledger);
  await writeCanonicalJson(resolve(output, "sources.json"), manifest);
  await writeCanonicalJson(resolve(output, "job.json"), job);
  return output;
}

export function fixtureName(path: string): string { return basename(path); }
