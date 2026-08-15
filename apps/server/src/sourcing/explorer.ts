import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";

import { transposeKey } from "@chess-tabiya/runtime";
import { digestDrillPack, type SpineNode } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { parseUci } from "chessops/util";

import { validatePackDocument } from "../pack-validation.js";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { checkSourcingDirectory, checkSourcingFile } from "./check.js";
import { emissionJobDigest, readJson, sha256, writeCanonicalJson } from "./canonical.js";
import { ingestLocalFile } from "./inputs.js";
import { withSourceLock } from "./lock.js";
import type { EvidenceLedger, EvidenceRecord, SourceEntry, SourceManifest } from "./types.js";
import { SourcingError } from "./types.js";

export const RATING_GROUPS = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500] as const;
export type RatingGroup = (typeof RATING_GROUPS)[number];
export const SPEEDS = ["ultraBullet", "bullet", "blitz", "rapid", "classical", "correspondence"] as const;
export type Speed = (typeof SPEEDS)[number];
export const EXPLORER_RATIONALE = "aggregate statistics are facts; the underlying Lichess game data is CC0; requests are serialized to follow the Lichess opening-explorer etiquette";
export const EXPLORER_TEMPLATE_ID = "explorer-move-share/v1";

export interface ExplorerQuery {
  readonly fen: string;
  readonly ratings: readonly RatingGroup[];
  readonly speeds: readonly Speed[];
  readonly since: string;
  readonly until: string;
}

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

export function normalizeExplorerQuery(query: ExplorerQuery): ExplorerQuery {
  if (query.ratings.length === 0 || !unique(query.ratings) || query.ratings.some((rating) => !RATING_GROUPS.includes(rating))) throw new SourcingError("RATINGS_NOT_A_GROUP", `ratings must be unique members of ${RATING_GROUPS.join(",")}`);
  if (query.speeds.length === 0 || !unique(query.speeds) || query.speeds.some((speed) => !SPEEDS.includes(speed))) throw new SourcingError("SPEEDS_NOT_A_SPEED", `speeds must be unique members of ${SPEEDS.join(",")}`);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!month.test(query.since) || !month.test(query.until) || query.since > query.until) throw new SourcingError("WINDOW_INVALID", "since/until must be real YYYY-MM values with since <= until");
  return Object.freeze({ ...query, ratings: Object.freeze([...query.ratings].sort((a, b) => a - b)), speeds: Object.freeze([...query.speeds].sort((a, b) => SPEEDS.indexOf(a) - SPEEDS.indexOf(b))) });
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
  url.searchParams.set("moves", "12");
  url.searchParams.set("topGames", "0");
  url.searchParams.set("recentGames", "0");
  url.searchParams.set("history", "false");
  return url.toString();
}

function source(url: string, response: Response, body: Uint8Array, retrievedAt: string): SourceEntry {
  return { sourceId: "lichess-explorer", retrievedAt, origin: { kind: "http", url, status: response.status, sha256: sha256(body), bytes: body.byteLength, etag: response.headers.get("etag") }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: EXPLORER_RATIONALE } };
}

function parseStats(body: Uint8Array, query: ExplorerQuery, sourceEntry: SourceEntry): ExplorerStats {
  const raw = JSON.parse(new TextDecoder().decode(body)) as Record<string, unknown>;
  const white = Number(raw.white);
  const draws = Number(raw.draws);
  const black = Number(raw.black);
  const moves = Array.isArray(raw.moves) ? raw.moves.map((move) => {
    const value = move as Record<string, unknown>;
    return { uci: String(value.uci), san: String(value.san), averageRating: Number(value.averageRating), white: Number(value.white), draws: Number(value.draws), black: Number(value.black) };
  }) : [];
  if (![white, draws, black].every((value) => Number.isSafeInteger(value) && value >= 0) || moves.some((move) => ![move.white, move.draws, move.black].every((value) => Number.isSafeInteger(value) && value >= 0))) throw new SourcingError("EXPLORER_RESPONSE_INVALID", "explorer response has invalid result counts");
  const total = white + draws + black;
  if (total < 100) return { kind: "abstention", reason: "no_data_at_band", detail: `total ${total} < 100`, source: sourceEntry };
  return { kind: "stats", white, draws, black, moves: Object.freeze(moves), window: { since: query.since, until: query.until }, ratings: query.ratings, speeds: query.speeds, source: sourceEntry };
}

export class ExplorerClient {
  constructor(private readonly options: { readonly sourceRoot?: string; readonly token?: string; readonly fetcher?: ExplorerFetch; readonly wait?: (milliseconds: number) => Promise<void>; readonly now?: () => Date } = {}) {}

  async stats(raw: ExplorerQuery): Promise<ExplorerStats> {
    const query = normalizeExplorerQuery(raw);
    const url = explorerUrl(query);
    const sourceRoot = resolve(this.options.sourceRoot ?? "content/sources");
    const key = sha256(url).slice(7);
    const cachePath = resolve(sourceRoot, "lichess-explorer", `${key}.json`);
    try {
      const cached = await readJson(cachePath) as Record<string, unknown>;
      const retrievedAt = String(cached.retrievedAt);
      const age = (this.options.now?.() ?? new Date()).getTime() - Date.parse(retrievedAt);
      if (age <= 30 * 24 * 60 * 60 * 1000 && typeof cached.body === "string") {
        const body = Uint8Array.from(Buffer.from(cached.body, "base64"));
        const response = new Response(body, { status: Number(cached.status), headers: typeof cached.etag === "string" ? { etag: cached.etag } : {} });
        return parseStats(body, query, source(url, response, body, retrievedAt));
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
        const entry = source(url, response, body, retrievedAt);
        if (response.status === 401 || response.status === 403) return { kind: "abstention", reason: "source_unavailable", detail: `HTTP ${response.status} Authorization Required`, source: entry };
        if ((response.status === 429 || response.status >= 500) && attempt < waits.length) { await (this.options.wait ?? ((ms) => new Promise((done) => setTimeout(done, ms))))(waits[attempt]!); continue; }
        if (response.status === 429 || response.status >= 500) return { kind: "abstention", reason: "source_unavailable", detail: `HTTP ${response.status} after ${attempt} retries`, source: entry };
        if (response.status >= 400) return { kind: "abstention", reason: "source_unavailable", detail: `HTTP ${response.status}`, source: entry };
        await mkdir(resolve(cachePath, ".."), { recursive: true });
        await writeCanonicalJson(cachePath, { kind: "body", url, status: response.status, etag: response.headers.get("etag"), retrievedAt, body: Buffer.from(body).toString("base64") });
        return parseStats(body, query, entry);
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
  const body = new Uint8Array(await readFile(resolve("apps/server/src/sourcing/fixtures/explorer-response.json")));
  const response = new Response(body, { status: 200, headers: { etag: '"fixture"' } });
  const offset = Number.parseInt(sha256(url).slice(7, 15), 16) % 86_400_000;
  return parseStats(body, normalized, source(url, response, body, new Date(Date.parse("2026-08-12T00:00:00.000Z") + offset).toISOString()));
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
    rows.push({ eco: line.eco, name: line.name, movesSan: line.movesSan, transposeKey: transposeKey(line.fen), total, whitePct: pct(result.white, total), drawPct: pct(result.draws, total), blackPct: pct(result.black, total), topMoves: result.moves.map((move) => { const playedCount = move.white + move.draws + move.black; return { san: move.san, uci: move.uci, playedCount, sharePct: pct(playedCount, total) }; }), sourceId: result.source.sourceId, retrievedAt: result.source.retrievedAt });
  }
  rows.sort((a, b) => b.total - a.total || a.eco.localeCompare(b.eco) || a.name.localeCompare(b.name));
  const sourcedAt = entries.map((entry) => entry.retrievedAt).sort().at(-1)!;
  const output = resolve(options.outputRoot ?? "content/candidates/priority");
  const query = normalizeExplorerQuery({ ...options.query, fen: lines[0]?.fen ?? makeFen(Chess.default().toSetup()) });
  const priority = { schema: "tabiya.sourcing.priority.v1", status: rows.length > 0 ? "available" : "unavailable", input: { sourceId: ingested.entry.sourceId, retrievedAt: ingested.entry.retrievedAt }, query: { ratings: query.ratings, speeds: query.speeds, since: query.since, until: query.until, moves: 12, topGames: 0, recentGames: 0, history: false }, sourcedAt, rows, abstentions };
  const manifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries };
  await writeCanonicalJson(resolve(output, "priority.json"), priority);
  await writeCanonicalJson(resolve(output, "sources.json"), manifest);
  const args = { lines: ingested.entry.origin.kind === "local-file" ? ingested.entry.origin.path : options.lines, ratings: query.ratings, speeds: query.speeds, since: query.since, until: query.until };
  await writeCanonicalJson(resolve(output, "job.json"), { schema: "tabiya.sourcing.job.v1", pipeline: "explorer", args, sourceEtags: entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null), emissionJobDigest: emissionJobDigest("explorer", args, entries.map((entry) => entry.origin.kind === "http" ? entry.origin.etag : null)) });
  return output;
}

export interface ExplorerTemplateValues { readonly moveSan: string; readonly playedCount: number; readonly total: number; readonly sharePct: number; readonly ratings: readonly RatingGroup[]; readonly speeds: readonly Speed[]; readonly since: string; readonly until: string }

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

export async function attachExplorerEvidence(options: { readonly directory?: string; readonly file?: string; readonly spineNodeId?: string; readonly moveSan: string; readonly target: string; readonly query: Omit<ExplorerQuery, "fen">; readonly client: { stats(query: ExplorerQuery): Promise<ExplorerStats> } }): Promise<"attached" | "abstained"> {
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
  const anchor = nodePosition(pack, options.spineNodeId);
  const result = await options.client.stats({ ...options.query, fen: anchor.fen });
  const nextManifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: [...manifest.entries.filter((entry: SourceEntry) => !(entry.sourceId === result.source.sourceId && entry.retrievedAt === result.source.retrievedAt && entry.origin.kind === "http" && result.source.origin.kind === "http" && entry.origin.url === result.source.origin.url)), result.source].sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.retrievedAt.localeCompare(b.retrievedAt)) };
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
  const values: ExplorerTemplateValues = { moveSan: move.san, playedCount, total, sharePct: pct(playedCount, total), ratings: result.ratings, speeds: result.speeds, since: result.window.since, until: result.window.until };
  pack.feedbackClaims[claimIndex].text = renderExplorerFrequency(values);
  pack.provenance.sources = [...new Set([...(pack.provenance.sources ?? []), `lichess-explorer (${result.source.origin.kind === "http" ? result.source.origin.url : "explorer"}) — ${EXPLORER_RATIONALE}`])];
  const record: EvidenceRecord = { kind: "explorer_frequency", anchor: anchor.anchor, sourceId: result.source.sourceId, retrievedAt: result.source.retrievedAt, grounds: "machine_validation", templateId: EXPLORER_TEMPLATE_ID, values: values as unknown as Readonly<Record<string, unknown>>, supports: [options.target] };
  const records = [...ledger.records.filter((value: EvidenceRecord) => !(value.kind === record.kind && value.templateId === record.templateId && value.supports[0] === record.supports[0] && value.sourceId === record.sourceId && value.retrievedAt === record.retrievedAt)), record].sort((a, b) => a.kind.localeCompare(b.kind) || String(a.templateId).localeCompare(String(b.templateId)) || String(a.supports[0]).localeCompare(String(b.supports[0])) || a.sourceId.localeCompare(b.sourceId) || a.retrievedAt.localeCompare(b.retrievedAt));
  const nextLedger: EvidenceLedger = { ...ledger, packDigest: await digestDrillPack(pack), sourcedAt: nextManifest.entries.map((entry) => entry.retrievedAt).sort().at(-1)!, records };
  if (!validatePackDocument(pack).valid) throw new SourcingError("ATTACHED_PACK_INVALID", "generated explorer sentence made the pack invalid");
  const temporary = resolve(directory, `.attach-check-${process.pid}`);
  await mkdir(temporary, { recursive: true });
  await Promise.all([writeCanonicalJson(resolve(temporary, "pack.json"), pack), writeCanonicalJson(resolve(temporary, "evidence.json"), nextLedger), writeCanonicalJson(resolve(temporary, "sources.json"), nextManifest)]);
  const checked = await checkSourcingDirectory(temporary, { strict: true });
  await rm(temporary, { recursive: true, force: true });
  if (!checked.valid) throw new SourcingError("ATTACH_CHECK_FAILED", checked.issues.map((value) => `${value.code}:${value.message}`).join("; "));
  if (flatFile === undefined) await atomicCanonical(directory, { "pack.json": pack, "evidence.json": nextLedger, "sources.json": nextManifest });
  else await Promise.all([writeCanonicalJson(paths.pack, pack), writeCanonicalJson(paths.ledger, nextLedger), writeCanonicalJson(paths.manifest, nextManifest)]);
  return "attached";
}
