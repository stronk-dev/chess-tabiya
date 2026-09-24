import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

import { normalizeInboundMove, transposeKey } from "@chess-tabiya/runtime";
import { digestDrillPack, type SpineNode } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { parseUci } from "chessops/util";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { checkSourcingDirectory, checkSourcingFile } from "./check.js";
import { emissionJobDigest, readJson, sha256, writeCanonicalJson } from "./canonical.js";
import { ingestLocalFile } from "./inputs.js";
import { withSourceLock } from "./lock.js";
import { readCapturedHttpFixture } from "./fixture-provenance.js";
import type { ClaimAssertion, EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest } from "./types.js";
import { SourcingError } from "./types.js";

export const RATING_GROUPS = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500] as const;
export type RatingGroup = (typeof RATING_GROUPS)[number];
export const SPEEDS = ["ultraBullet", "bullet", "blitz", "rapid", "classical", "correspondence"] as const;
export type Speed = (typeof SPEEDS)[number];
export const EXPLORER_RATIONALE = "aggregate statistics are facts; the underlying Lichess game data is CC0; requests are serialized to follow the Lichess opening-explorer etiquette";
export const EXPLORER_TEMPLATE_ID = "explorer-move-share/v1";
// rfc/famous-games.md §1/§2/§5. The masters database shares the explorer's client, its etiquette and
// its abstention vocabulary. The rationale is the line a masters-sourced pack must carry in
// `provenance.sources` (criterion 7), exactly as EXPLORER_RATIONALE is for population evidence.
export const MASTERS_SOURCE_ID = "lichess-masters";
export const MASTERS_RATIONALE = "a master game score is a record of fact; Lichess asserts no rights over the masters database and requires no attribution; games are hand-selected by id and never enumerated from the masters index; third-party annotations are stripped at the record boundary";
const MASTERS_ORIGIN = "https://explorer.lichess.org";
const MASTERS_GAME_ID = /^[A-Za-z0-9]{8}$/;

export interface ExplorerQuery {
  readonly fen: string;
  readonly ratings: readonly RatingGroup[];
  readonly speeds: readonly Speed[];
  readonly since: string;
  readonly until: string;
  readonly moves?: number;
}

export type NormalizedExplorerQuery = Omit<ExplorerQuery, "moves"> & { readonly moves: number };

export interface ExplorerMove {
  readonly uci: string;
  readonly san: string;
  readonly averageRating: number;
  readonly white: number;
  readonly draws: number;
  readonly black: number;
}

export type ExplorerStats =
  | { readonly kind: "stats"; readonly white: number; readonly draws: number; readonly black: number; readonly moves: readonly ExplorerMove[]; readonly window: { readonly since: string; readonly until: string }; readonly ratings: readonly RatingGroup[]; readonly speeds: readonly Speed[]; readonly source: SourceEntry }
  | { readonly kind: "abstention"; readonly reason: "source_unavailable" | "no_data_at_band"; readonly detail: string; readonly source: SourceEntry };

export type ExplorerFetch = (url: string, init: RequestInit) => Promise<Response>;

function unique<T>(values: readonly T[]): boolean { return new Set(values).size === values.length; }

export function normalizeExplorerQuery(query: ExplorerQuery): NormalizedExplorerQuery {
  if (query.ratings.length === 0 || !unique(query.ratings) || query.ratings.some((rating) => !RATING_GROUPS.includes(rating))) throw new SourcingError("RATINGS_NOT_A_GROUP", `ratings must be unique members of ${RATING_GROUPS.join(",")}`);
  if (query.speeds.length === 0 || !unique(query.speeds) || query.speeds.some((speed) => !SPEEDS.includes(speed))) throw new SourcingError("SPEEDS_NOT_A_SPEED", `speeds must be unique members of ${SPEEDS.join(",")}`);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!month.test(query.since) || !month.test(query.until) || query.since > query.until) throw new SourcingError("WINDOW_INVALID", "since/until must be real YYYY-MM values with since <= until");
  const moves = query.moves ?? 12;
  if (!Number.isSafeInteger(moves) || moves < 1) throw new SourcingError("ARGUMENT_INVALID", "moves must be a positive safe integer");
  return Object.freeze({ ...query, moves, ratings: Object.freeze([...query.ratings].sort((a, b) => a - b)), speeds: Object.freeze([...query.speeds].sort((a, b) => SPEEDS.indexOf(a) - SPEEDS.indexOf(b))) });
}

export function explorerUrl(raw: ExplorerQuery): string {
  const query = normalizeExplorerQuery(raw);
  const url = new URL("https://explorer.lichess.org/lichess");
  url.searchParams.set("variant", "standard");
  url.searchParams.set("fen", query.fen);
  url.searchParams.set("ratings", query.ratings.join(","));
  url.searchParams.set("speeds", query.speeds.join(","));
  url.searchParams.set("since", query.since);
  url.searchParams.set("until", query.until);
  url.searchParams.set("moves", String(query.moves));
  // Product scope, not a licence conclusion (rfc/famous-games.md §1, D5): the corpus panel renders
  // population results and has no per-game consumer, so game references are never requested.
  url.searchParams.set("topGames", "0");
  url.searchParams.set("recentGames", "0");
  url.searchParams.set("history", "false");
  return url.toString();
}

export interface MastersQuery {
  readonly fen: string;
  readonly since?: number;
  readonly until?: number;
  readonly moves?: number;
}

export type NormalizedMastersQuery = { readonly fen: string; readonly since: number; readonly until: number; readonly moves: number };

export type MastersStats =
  | { readonly kind: "stats"; readonly white: number; readonly draws: number; readonly black: number; readonly moves: readonly ExplorerMove[]; readonly window: { readonly since: number; readonly until: number }; readonly source: SourceEntry }
  | { readonly kind: "abstention"; readonly reason: "source_unavailable" | "no_data_at_band"; readonly detail: string; readonly source: SourceEntry };

export type MastersGame =
  | { readonly kind: "game"; readonly gameId: string; readonly body: Uint8Array; readonly source: SourceEntry }
  | { readonly kind: "abstention"; readonly reason: "source_unavailable"; readonly detail: string; readonly source: SourceEntry };

export function normalizeMastersQuery(query: MastersQuery, now: Date = new Date()): NormalizedMastersQuery {
  const since = query.since ?? 1952;
  const until = query.until ?? now.getUTCFullYear();
  if (!Number.isSafeInteger(since) || !Number.isSafeInteger(until) || since < 1952 || until > now.getUTCFullYear() || since > until) throw new SourcingError("WINDOW_INVALID", "masters since/until must be whole years from 1952 to the current year with since <= until");
  const moves = query.moves ?? 12;
  if (!Number.isSafeInteger(moves) || moves < 1) throw new SourcingError("ARGUMENT_INVALID", "moves must be a positive safe integer");
  return Object.freeze({ fen: query.fen, since, until, moves });
}

export function mastersUrl(raw: MastersQuery, now?: Date): string {
  const query = normalizeMastersQuery(raw, now);
  const url = new URL(`${MASTERS_ORIGIN}/masters`);
  url.searchParams.set("fen", query.fen);
  url.searchParams.set("since", String(query.since));
  url.searchParams.set("until", String(query.until));
  url.searchParams.set("moves", String(query.moves));
  // Aggregates only: a masters response that names games is the index, and walking it is the
  // repeated, systematic extraction rfc/famous-games.md §2/§5 refuses.
  url.searchParams.set("topGames", "0");
  return url.toString();
}

export function mastersGameUrl(gameId: string): string {
  if (!MASTERS_GAME_ID.test(gameId)) throw new SourcingError("MASTERS_GAME_ID_INVALID", `masters game ids are eight ASCII letters or digits; refused ${JSON.stringify(gameId)}`);
  return `${MASTERS_ORIGIN}/masters/pgn/${gameId}`;
}

/** Every request the explorer client makes passes this guard (criterion 5). Outside `/masters` it is inert. */
export function assertMastersRequest(raw: string): void {
  const url = new URL(raw);
  if (url.origin !== MASTERS_ORIGIN || !(url.pathname === "/masters" || url.pathname.startsWith("/masters/"))) return;
  if (url.pathname === "/masters") {
    if (url.searchParams.get("topGames") !== "0" || url.searchParams.has("recentGames")) throw new SourcingError("MASTERS_INDEX_REFUSED", "a masters query must request aggregates only (topGames=0); listing games from the masters index is refused");
    return;
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 3 && parts[1] === "pgn" && MASTERS_GAME_ID.test(parts[2]!) && url.search === "") return;
  throw new SourcingError("MASTERS_INDEX_REFUSED", `only hand-selected /masters/pgn/{id} games and topGames=0 aggregates may be fetched; refused ${url.pathname}`);
}

/** A sourcing invocation names exactly one masters game (criterion 5). */
export function requireSingleMastersGame(gameIds: readonly string[]): string {
  if (gameIds.length !== 1) throw new SourcingError("MASTERS_ENUMERATION_REFUSED", `one masters game id per invocation; ${gameIds.length} requested`);
  mastersGameUrl(gameIds[0]!);
  return gameIds[0]!;
}

interface SourceIdentity { readonly sourceId: string; readonly rationale: string }
const EXPLORER_SOURCE: SourceIdentity = { sourceId: "lichess-explorer", rationale: EXPLORER_RATIONALE };
const MASTERS_SOURCE: SourceIdentity = { sourceId: MASTERS_SOURCE_ID, rationale: MASTERS_RATIONALE };

function source(url: string, response: Response, body: Uint8Array, retrievedAt: string, identity: SourceIdentity = EXPLORER_SOURCE): SourceEntry {
  return { sourceId: identity.sourceId, retrievedAt, origin: { kind: "http", url, status: response.status, sha256: sha256(body), bytes: body.byteLength, etag: response.headers.get("etag") }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: identity.rationale } };
}

type Retrieved =
  | { readonly kind: "body"; readonly body: Uint8Array; readonly source: SourceEntry }
  | { readonly kind: "abstention"; readonly reason: "source_unavailable"; readonly detail: string; readonly source: SourceEntry };

function parseCounts(body: Uint8Array): { readonly white: number; readonly draws: number; readonly black: number; readonly moves: readonly ExplorerMove[] } {
  const raw = JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>;
  const white = Number(raw.white);
  const draws = Number(raw.draws);
  const black = Number(raw.black);
  const moves = Array.isArray(raw.moves) ? raw.moves.map((move) => {
    const value = move as Record<string, unknown>;
    return { uci: String(value.uci), san: String(value.san), averageRating: Number(value.averageRating), white: Number(value.white), draws: Number(value.draws), black: Number(value.black) };
  }) : [];
  if (![white, draws, black].every((value) => Number.isSafeInteger(value) && value >= 0) || moves.some((move) => ![move.white, move.draws, move.black].every((value) => Number.isSafeInteger(value) && value >= 0))) throw new SourcingError("EXPLORER_RESPONSE_INVALID", "explorer response has invalid result counts");
  return { white, draws, black, moves: Object.freeze(moves) };
}

function parseStats(body: Uint8Array, query: ExplorerQuery, sourceEntry: SourceEntry): ExplorerStats {
  const { white, draws, black, moves } = parseCounts(body);
  const total = white + draws + black;
  if (total < 100) return { kind: "abstention", reason: "no_data_at_band", detail: `total ${total} < 100`, source: sourceEntry };
  return { kind: "stats", white, draws, black, moves, window: { since: query.since, until: query.until }, ratings: query.ratings, speeds: query.speeds, source: sourceEntry };
}

function parseMastersStats(body: Uint8Array, query: NormalizedMastersQuery, sourceEntry: SourceEntry): MastersStats {
  const { white, draws, black, moves } = parseCounts(body);
  const total = white + draws + black;
  if (total === 0) return { kind: "abstention", reason: "no_data_at_band", detail: "no master games reach this position in the requested years", source: sourceEntry };
  return { kind: "stats", white, draws, black, moves, window: { since: query.since, until: query.until }, source: sourceEntry };
}

export class ExplorerClient {
  constructor(private readonly options: { readonly sourceRoot?: string; readonly token?: string; readonly fetcher?: ExplorerFetch; readonly wait?: (milliseconds: number) => Promise<void>; readonly now?: () => Date } = {}) {}

  async stats(raw: ExplorerQuery): Promise<ExplorerStats> {
    const query = normalizeExplorerQuery(raw);
    const retrieved = await this.#retrieve(explorerUrl(query), EXPLORER_SOURCE, "lichess-explorer");
    return retrieved.kind === "abstention" ? retrieved : parseStats(retrieved.body, query, retrieved.source);
  }

  /** Masters position and per-move aggregates (rfc/famous-games.md §1): the same client, the same etiquette. */
  async mastersStats(raw: MastersQuery): Promise<MastersStats> {
    const now = this.options.now?.() ?? new Date();
    const query = normalizeMastersQuery(raw, now);
    const retrieved = await this.#retrieve(mastersUrl(query, now), MASTERS_SOURCE, "lichess-masters");
    return retrieved.kind === "abstention" ? retrieved : parseMastersStats(retrieved.body, query, retrieved.source);
  }

  /** One hand-selected masters game score (rfc/famous-games.md §1 row 3). The body is returned raw; the record-boundary strip happens in the parser. */
  async masterGame(gameId: string): Promise<MastersGame> {
    const retrieved = await this.#retrieve(mastersGameUrl(gameId), MASTERS_SOURCE, "lichess-masters");
    return retrieved.kind === "abstention" ? retrieved : { kind: "game", gameId, body: retrieved.body, source: retrieved.source };
  }

  async #retrieve(url: string, identity: SourceIdentity, cacheDirectory: string): Promise<Retrieved> {
    assertMastersRequest(url);
    const sourceRoot = resolve(this.options.sourceRoot ?? "content/sources");
    const key = sha256(url).slice(7);
    const cachePath = resolve(sourceRoot, cacheDirectory, `${key}.json`);
    try {
      const cached = await readJson(cachePath) as Record<string, unknown>;
      const retrievedAt = String(cached.retrievedAt);
      const age = (this.options.now?.() ?? new Date()).getTime() - Date.parse(retrievedAt);
      if (age <= 30 * 24 * 60 * 60 * 1000 && typeof cached.body === "string") {
        const body = Uint8Array.from(Buffer.from(cached.body, "base64"));
        const response = new Response(body, { status: Number(cached.status), headers: typeof cached.etag === "string" ? { etag: cached.etag } : {} });
        return { kind: "body", body, source: source(url, response, body, retrievedAt, identity) };
      }
    } catch { /* cache miss */ }
    return withSourceLock(sourceRoot, async (lock) => {
      const fetcher = this.options.fetcher ?? fetch;
      const waits = [60_000, 120_000, 240_000];
      for (let attempt = 0; ; attempt += 1) {
        await lock.verify();
        const response = await fetcher(url, { headers: { "user-agent": "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)", ...(this.options.token ? { authorization: `Bearer ${this.options.token}` } : {}) } });
        const body = new Uint8Array(await response.arrayBuffer());
        const retrievedAt = (this.options.now?.() ?? new Date()).toISOString();
        const entry = source(url, response, body, retrievedAt, identity);
        if (response.status === 401 || response.status === 403) return { kind: "abstention", reason: "source_unavailable", detail: `HTTP ${response.status} Authorization Required`, source: entry };
        if ((response.status === 429 || response.status >= 500) && attempt < waits.length) { await (this.options.wait ?? ((ms) => new Promise((done) => setTimeout(done, ms))))(waits[attempt]!); continue; }
        if (response.status === 429 || response.status >= 500) return { kind: "abstention", reason: "source_unavailable", detail: `HTTP ${response.status} after ${attempt} retries`, source: entry };
        if (response.status >= 400) return { kind: "abstention", reason: "source_unavailable", detail: `HTTP ${response.status}`, source: entry };
        await mkdir(resolve(cachePath, ".."), { recursive: true });
        await writeCanonicalJson(cachePath, { kind: "body", url, status: response.status, etag: response.headers.get("etag"), retrievedAt, body: Buffer.from(body).toString("base64") });
        return { kind: "body", body, source: entry };
      }
    });
  }
}

export async function fixtureUnavailableExplorer(query: ExplorerQuery): Promise<ExplorerStats> {
  const normalized = normalizeExplorerQuery(query);
  const url = explorerUrl(normalized);
  const body = new TextEncoder().encode("401 Authorization Required");
  const response = new Response(body, { status: 401, headers: { "content-type": "text/plain" } });
  const offset = Number.parseInt(sha256(url).slice(7, 15), 16) % 86_400_000;
  const retrievedAt = new Date(Date.parse("2026-08-12T00:00:00.000Z") + offset).toISOString();
  return { kind: "abstention", reason: "source_unavailable", detail: "HTTP 401 Authorization Required", source: source(url, response, body, retrievedAt) };
}

export async function fixtureAvailableExplorer(query: ExplorerQuery): Promise<ExplorerStats> {
  const normalized = normalizeExplorerQuery(query);
  const url = explorerUrl(normalized);
  const captured = await readCapturedHttpFixture({
    fixturePath: resolve("apps/server/src/sourcing/fixtures/explorer-response.json"),
    provenancePath: resolve("apps/server/src/sourcing/fixtures/explorer-response.provenance.json"),
    expectedUrl: url,
    licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: EXPLORER_RATIONALE },
  });
  return parseStats(captured.body, normalized, captured.source);
}

export async function fixtureUnavailableMasterGame(gameId: string): Promise<MastersGame> {
  const url = mastersGameUrl(gameId);
  const body = new TextEncoder().encode("source unavailable offline");
  const response = new Response(body, { status: 503, headers: { "content-type": "text/plain" } });
  return { kind: "abstention", reason: "source_unavailable", detail: "HTTP 503 after 3 retries", source: source(url, response, body, "2026-09-24T00:00:00.000Z", MASTERS_SOURCE) };
}

/** The recorded 2026-09-24 capture of the dossier's probed game; any other id is refused, never relabelled. */
export async function fixtureRecordedMasterGame(gameId: string): Promise<MastersGame> {
  const captured = await readCapturedHttpFixture({
    fixturePath: resolve("apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.pgn"),
    provenancePath: resolve("apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.provenance.json"),
    expectedUrl: mastersGameUrl(gameId),
    licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: MASTERS_RATIONALE },
  });
  return { kind: "game", gameId, body: captured.body, source: captured.source };
}

interface ExplorerLine { readonly eco: string; readonly name: string; readonly movesSan: readonly string[]; readonly fen: string }

function parseLines(text: string): ExplorerLine[] {
  const rows = text.replaceAll("\r\n", "\n").split("\n");
  if (rows.shift() !== "eco\tname\tmovesSan") throw new SourcingError("EXPLORER_LINES_INVALID", "expected eco, name, movesSan TSV header");
  return rows.filter((row) => row.trim()).map((row, index) => {
    const [eco, name, sanText] = row.split("\t");
    if (!eco || !name || !sanText) throw new SourcingError("EXPLORER_LINES_INVALID", `invalid line ${index + 2}`);
    const position = Chess.default();
    const movesSan = sanText.split(/\s+/);
    for (const san of movesSan) { const move = parseSan(position, san); if (!move) throw new SourcingError("EXPLORER_LINES_INVALID", `illegal SAN ${san} at line ${index + 2}`); position.play(move); }
    return { eco, name, movesSan, fen: makeFen(position.toSetup()) };
  });
}

export interface PriorityEmitOptions {
  readonly lines: string;
  readonly query: Omit<ExplorerQuery, "fen">;
  readonly client: { stats(query: ExplorerQuery): Promise<ExplorerStats> };
  readonly outputRoot?: string;
  readonly sourceRoot?: string;
  readonly now?: () => Date;
}

function pct(value: number, total: number): number { return Math.round(value / total * 1000) / 10; }

export async function emitExplorerPriority(options: PriorityEmitOptions): Promise<string> {
  const ingested = await ingestLocalFile(options.lines, { sourceId: "explorer-lines", licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "author-supplied opening line geometry" }, ...(options.sourceRoot ? { sourceRoot: options.sourceRoot } : {}), ...(options.now ? { now: options.now } : {}) });
  const lines = parseLines(new TextDecoder().decode(ingested.bytes));
  const entries: SourceEntry[] = [ingested.entry];
  const rows: any[] = [];
  const abstentions: any[] = [];
  for (const line of lines) {
    const result = await options.client.stats({ ...options.query, fen: line.fen });
    entries.push(result.source);
    if (result.kind === "abstention") { abstentions.push({ eco: line.eco, name: line.name, reason: result.reason, detail: result.detail, sourceId: result.source.sourceId, retrievedAt: result.source.retrievedAt }); continue; }
    const total = result.white + result.draws + result.black;
    rows.push({ eco: line.eco, name: line.name, movesSan: line.movesSan, transposeKey: transposeKey(line.fen), total, whitePct: pct(result.white, total), drawPct: pct(result.draws, total), blackPct: pct(result.black, total), topMoves: result.moves.map((move) => { const playedCount = move.white + move.draws + move.black; return { san: move.san, uci: normalizeInboundMove(line.fen, move.uci, "lichess_explorer").moveUci, playedCount, sharePct: pct(playedCount, total) }; }), sourceId: result.source.sourceId, retrievedAt: result.source.retrievedAt });
  }
  rows.sort((a, b) => b.total - a.total || a.eco.localeCompare(b.eco) || a.name.localeCompare(b.name));
  const sourcedAt = entries.map((entry) => entry.retrievedAt).sort().at(-1)!;
  const output = resolve(options.outputRoot ?? "content/candidates/priority");
  const query = normalizeExplorerQuery({ ...options.query, fen: lines[0]?.fen ?? makeFen(Chess.default().toSetup()) });
  const priority = { schema: "tabiya.sourcing.priority.v1", status: rows.length > 0 ? "available" : "unavailable", input: { sourceId: ingested.entry.sourceId, retrievedAt: ingested.entry.retrievedAt }, query: { ratings: query.ratings, speeds: query.speeds, since: query.since, until: query.until, moves: query.moves, topGames: 0, recentGames: 0, history: false }, sourcedAt, rows, abstentions };
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries };
  await writeCanonicalJson(resolve(output, "priority.json"), priority);
  await writeCanonicalJson(resolve(output, "sources.json"), manifest);
  const args = { lines: ingested.entry.origin.kind === "local-file" ? ingested.entry.origin.path : options.lines, ratings: query.ratings, speeds: query.speeds, since: query.since, until: query.until, moves: query.moves };
  await writeCanonicalJson(resolve(output, "job.json"), { schema: "tabiya.sourcing.job.v1", pipeline: "explorer", args, sourceEtags: entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null), emissionJobDigest: emissionJobDigest("explorer", args, entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null)) });
  return output;
}

export interface ExplorerTemplateValues { readonly moveSan: string; readonly playedCount: number; readonly total: number; readonly sharePct: number; readonly white: number; readonly draws: number; readonly black: number; readonly ratings: readonly RatingGroup[]; readonly speeds: readonly Speed[]; readonly since: string; readonly until: string }

export function renderExplorerFrequency(values: ExplorerTemplateValues): string {
  return `${values.moveSan} is played in ${values.sharePct.toFixed(1)}% of ${values.total} games from this position (Lichess explorer, rating buckets ${values.ratings.join(",")}, speeds ${values.speeds.join(",")}, ${values.since} to ${values.until}).`;
}

function nodePosition(pack: any, nodeId: string | undefined): { fen: string; anchor: Record<string, string> } {
  if (!nodeId) return { fen: pack.start.fen, anchor: { fen: pack.start.fen } };
  const start = Chess.fromSetup(parseFen(pack.start.fen).unwrap()).unwrap();
  let answer: { fen: string; anchor: Record<string, string> } | undefined;
  const walk = (nodes: readonly SpineNode[], position: Chess): void => { for (const node of nodes) { const branch = position.clone(); const move = parseUci(node.moveUci); if (!move || !branch.isLegal(move)) continue; branch.play(move); if (node.id === nodeId) answer = { fen: makeFen(branch.toSetup()), anchor: { spineNodeId: nodeId } }; walk(node.children, branch); } };
  walk(pack.spine ?? [], start);
  if (!answer) throw new SourcingError("ANCHOR_UNRESOLVED", `spine node does not resolve: ${nodeId}`);
  return answer;
}

async function atomicCanonical(directory: string, documents: Record<string, unknown>): Promise<void> {
  const suffix = `.tmp-${process.pid}`;
  for (const [name, document] of Object.entries(documents)) await writeFile(resolve(directory, `${name}${suffix}`), `${canonicalizeJson(document)}\n`);
  for (const name of Object.keys(documents)) await rename(resolve(directory, `${name}${suffix}`), resolve(directory, name));
}

export async function attachExplorerEvidence(options: { readonly directory?: string; readonly file?: string; readonly spineNodeId?: string; readonly moveSan: string; readonly target: string; readonly span?: string; readonly field?: "sharePct" | "total" | "whitePct" | "drawPct" | "blackPct" | "since" | "until" | "ratingBand"; readonly query: Omit<ExplorerQuery, "fen">; readonly client: { stats(query: ExplorerQuery): Promise<ExplorerStats> } }): Promise<"attached" | "abstained"> {
  if ((options.directory === undefined) === (options.file === undefined)) throw new SourcingError("INVALID_REQUEST", "provide exactly one of directory or file");
  const flatFile = options.file === undefined ? undefined : resolve(options.file);
  const directory = flatFile === undefined ? resolve(options.directory!) : dirname(flatFile);
  const stem = flatFile === undefined ? undefined : basename(flatFile).slice(0, -extname(flatFile).length);
  const paths = flatFile === undefined
    ? { pack: resolve(directory, "pack.json"), ledger: resolve(directory, "evidence.json"), manifest: resolve(directory, "sources.json") }
    : { pack: flatFile, ledger: resolve(directory, `${stem}.evidence.json`), manifest: resolve(directory, `${stem}.sources.json`) };
  const clean = flatFile === undefined ? await checkSourcingDirectory(directory, { strict: true }) : await checkSourcingFile(flatFile, { strict: true });
  if (!clean.valid) throw new SourcingError("CANDIDATE_NOT_CLEAN", clean.issues.map((value) => value.code).join(", "));
  const [pack, ledger, manifest] = await Promise.all([readJson(paths.pack) as Promise<any>, readJson(paths.ledger) as Promise<any>, readJson(paths.manifest) as Promise<any>]);
  if (!/^\/feedbackClaims\/\d+\/text$/.test(options.target)) throw new SourcingError("ATTACH_TARGET_FORBIDDEN", "target must be an existing /feedbackClaims/<i>/text");
  const claimIndex = Number(options.target.split("/")[2]);
  if (!Array.isArray(pack.feedbackClaims) || typeof pack.feedbackClaims[claimIndex]?.text !== "string") throw new SourcingError("ATTACH_TARGET_FORBIDDEN", "target feedback claim does not exist");
  if (options.span === undefined || options.span.length === 0 || options.field === undefined) throw new SourcingError("ATTACH_SPAN_REQUIRED", "--span and --field are required; pack prose is never generated or overwritten");
  if (!(pack.provenance?.sources ?? []).some((source: unknown) => typeof source === "string" && source.includes(EXPLORER_RATIONALE))) throw new SourcingError("ATTACH_SOURCE_LINE_MISSING", `pack provenance.sources must already contain the explorer rationale: ${EXPLORER_RATIONALE}`);
  const mastersSourced = (manifest.entries as readonly SourceEntry[]).some((entry) => entry.sourceId === MASTERS_SOURCE_ID);
  if (mastersSourced && !(pack.provenance?.sources ?? []).some((source: unknown) => typeof source === "string" && source.includes(MASTERS_RATIONALE))) throw new SourcingError("ATTACH_SOURCE_LINE_MISSING", `a masters-sourced pack's provenance.sources must already contain the masters rationale: ${MASTERS_RATIONALE}`);
  const anchor = nodePosition(pack, options.spineNodeId);
  const result = await options.client.stats({ ...options.query, fen: anchor.fen });
  const nextManifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: [...manifest.entries.filter((entry: SourceEntry) => !(entry.sourceId === result.source.sourceId && entry.retrievedAt === result.source.retrievedAt)), result.source].sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.retrievedAt.localeCompare(b.retrievedAt)) };
  if (result.kind === "abstention") {
    const nextLedger = { ...ledger, sourcedAt: nextManifest.entries.map((entry) => entry.retrievedAt).sort().at(-1), abstentions: [...ledger.abstentions.filter((value: any) => !(value.kind === "explorer_frequency" && JSON.stringify(value.anchor) === JSON.stringify(anchor.anchor))), { kind: "explorer_frequency", anchor: anchor.anchor, sourceId: result.source.sourceId, retrievedAt: result.source.retrievedAt, reason: result.reason, detail: result.detail }] };
    const temporary = resolve(directory, `.attach-check-${process.pid}`);
    await mkdir(temporary, { recursive: true });
    await Promise.all([writeCanonicalJson(resolve(temporary, "pack.json"), pack), writeCanonicalJson(resolve(temporary, "evidence.json"), nextLedger), writeCanonicalJson(resolve(temporary, "sources.json"), nextManifest)]);
    const checked = await checkSourcingDirectory(temporary, { strict: true });
    await rm(temporary, { recursive: true, force: true });
    if (!checked.valid) throw new SourcingError("ATTACH_CHECK_FAILED", checked.issues.map((value) => `${value.code}:${value.message}`).join("; "));
    if (flatFile === undefined) await atomicCanonical(directory, { "evidence.json": nextLedger, "sources.json": nextManifest });
    else await Promise.all([writeCanonicalJson(paths.ledger, nextLedger), writeCanonicalJson(paths.manifest, nextManifest)]);
    return "abstained";
  }
  const move = result.moves.find((value) => value.san === options.moveSan);
  if (!move) throw new SourcingError("MOVE_NOT_IN_RESPONSE", `${options.moveSan} is absent from the explorer response`);
  const total = result.white + result.draws + result.black;
  const playedCount = move.white + move.draws + move.black;
  const values = { fen: anchor.fen, total, whitePct: pct(result.white, total), drawPct: pct(result.draws, total), blackPct: pct(result.black, total), topMoves: result.moves.map((candidate) => { const count = candidate.white + candidate.draws + candidate.black; return { san: candidate.san, uci: candidate.uci, playedCount: count, sharePct: pct(count, total) }; }), ratings: result.ratings, speeds: result.speeds, since: result.window.since, until: result.window.until };
  const record: EvidenceRecord = { kind: "explorer_position_census", anchor: anchor.anchor, sourceId: result.source.sourceId, retrievedAt: result.source.retrievedAt, grounds: "machine_validation", values, supports: options.spineNodeId === undefined || options.spineNodeId === "root" ? ["/start/fen"] : [] };
  const records = [...ledger.records.filter((value: EvidenceRecord) => !(value.kind === record.kind && value.values.fen === anchor.fen)), record].sort((a, b) => a.kind.localeCompare(b.kind) || String(a.values.fen).localeCompare(String(b.values.fen)) || a.sourceId.localeCompare(b.sourceId) || a.retrievedAt.localeCompare(b.retrievedAt));
  const assertion: ClaimAssertion = options.field === "sharePct" ? { kind: "explorer.moveSharePct@v1", args: { fen: anchor.fen, san: move.san } } : options.field === "total" ? { kind: "explorer.total@v1", args: { fen: anchor.fen } } : options.field === "whitePct" || options.field === "drawPct" || options.field === "blackPct" ? { kind: "explorer.scorePct@v1", args: { fen: anchor.fen, side: options.field.replace("Pct", "") } } : options.field === "ratingBand" ? { kind: "explorer.ratingBand@v1", args: { fen: anchor.fen } } : { kind: "explorer.window@v1", args: { fen: anchor.fen }, select: options.field };
  const binding = { claimId: pack.feedbackClaims[claimIndex].id, pointer: options.target, textSha256: sha256(pack.feedbackClaims[claimIndex].text), spans: [{ span: options.span, assertion }] };
  const claimBindings = [...(ledger.claimBindings ?? []).filter((value: { pointer: string }) => value.pointer !== options.target), binding];
  const nextLedger: EvidenceLedger = { ...ledger, packDigest: await digestDrillPack(pack), sourcedAt: nextManifest.entries.map((entry) => entry.retrievedAt).sort().at(-1)!, records, claimBindings };
  const temporary = resolve(directory, `.attach-check-${process.pid}`);
  await mkdir(temporary, { recursive: true });
  await Promise.all([writeCanonicalJson(resolve(temporary, "pack.json"), pack), writeCanonicalJson(resolve(temporary, "evidence.json"), nextLedger), writeCanonicalJson(resolve(temporary, "sources.json"), nextManifest)]);
  const checked = await checkSourcingDirectory(temporary, { strict: true });
  await rm(temporary, { recursive: true, force: true });
  if (!checked.valid) throw new SourcingError("ATTACH_CHECK_FAILED", checked.issues.map((value) => `${value.code}:${value.message}`).join("; "));
  if (flatFile === undefined) await atomicCanonical(directory, { "evidence.json": nextLedger, "sources.json": nextManifest });
  else await Promise.all([writeCanonicalJson(paths.ledger, nextLedger), writeCanonicalJson(paths.manifest, nextManifest)]);
  return "attached";
}
