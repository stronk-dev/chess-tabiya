import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it, vi } from "vitest";

import { checkSourcingDirectory } from "./check.js";
import { readJson, sha256, writeCanonicalJson } from "./canonical.js";
import {
  assertMastersRequest,
  attachExplorerEvidence,
  EXPLORER_RATIONALE,
  ExplorerClient,
  fixtureRecordedMasterGame,
  fixtureUnavailableMasterGame,
  MASTERS_RATIONALE,
  mastersGameUrl,
  mastersUrl,
  requireSingleMastersGame,
  type ExplorerQuery,
  type ExplorerStats,
  type MastersGame,
} from "./explorer.js";
import { emitMastersCandidate, parseMastersGame, sourceGameFromHeaders } from "./masters.js";
import { SOURCE_GAME_SCHEMA, sourceGameIssues } from "./source-game.js";

const GAME = "aAbqI4ey";
const RECORDED = "apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.pgn";

async function temporary(): Promise<string> { return mkdtemp(resolve(tmpdir(), "tabiya-masters-")); }

function stubbedGame(pgn: string, gameId = GAME): (id: string) => Promise<MastersGame> {
  return async (id) => {
    const body = new TextEncoder().encode(pgn);
    return { kind: "game", gameId: id, body, source: { sourceId: "lichess-masters", retrievedAt: "2026-09-24T00:00:00.000Z", origin: { kind: "http", url: mastersGameUrl(gameId), status: 200, sha256: sha256(body), bytes: body.byteLength, etag: null }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: MASTERS_RATIONALE } } };
  };
}

describe("famous-games masters sourcing (rfc/famous-games.md)", () => {
  it("criterion 4: the recorded masters response populates every sourceGame field with named values", async () => {
    const recorded = await fixtureRecordedMasterGame(GAME);
    expect(recorded.kind).toBe("game");
    if (recorded.kind !== "game") return;
    expect(recorded.source.origin).toMatchObject({ kind: "http", url: "https://explorer.lichess.org/masters/pgn/aAbqI4ey", status: 200, bytes: 687 });
    const parsed = parseMastersGame(recorded.body, GAME);
    expect(parsed.sourceGame).toEqual({
      white: "Carlsen, Magnus",
      black: "Chadaev, Nikolay",
      event: "Wch Blitz",
      site: "Astana",
      date: "2012.07.10",
      round: "23",
      result: "1-0",
      sourceId: "lichess-masters:aAbqI4ey",
      licenceBasis: "no-rights-asserted",
    });
    expect(parsed.moves).toHaveLength(85);
    expect(parsed.moves.slice(0, 4).map((move) => move.san)).toEqual(["e4", "e5", "f4", "d5"]);
    expect(parsed.moves.at(-1)).toMatchObject({ san: "Rxg7+" });
    expect(sourceGameIssues(parsed.sourceGame)).toEqual([]);
  });

  it("criterion 4: a missing roster field is refused, never defaulted to an empty string", () => {
    const headers = { White: "A", Black: "B", Date: "1999.01.20", Result: "1-0" };
    expect(() => sourceGameFromHeaders({ ...headers, White: "" }, "lichess-masters:aAbqI4ey", "no-rights-asserted")).toThrow(expect.objectContaining({ code: "MASTERS_PGN_HEADER_INVALID" }));
    const { Date: _date, ...undated } = headers;
    expect(() => sourceGameFromHeaders(undated, "lichess-masters:aAbqI4ey", "no-rights-asserted")).toThrow(expect.objectContaining({ code: "MASTERS_PGN_HEADER_INVALID" }));
    expect(() => sourceGameFromHeaders({ ...headers, Date: "20 Jan 1999" }, "lichess-masters:aAbqI4ey", "no-rights-asserted")).toThrow(expect.objectContaining({ code: "MASTERS_PGN_HEADER_INVALID" }));
    expect(sourceGameFromHeaders(headers, "lichess-masters:aAbqI4ey", "no-rights-asserted")).not.toHaveProperty("event");
  });

  it("criterion 3 (sidecar half): the sourceGame shape is closed over the six required fields", () => {
    expect(SOURCE_GAME_SCHEMA.required).toEqual(["white", "black", "date", "result", "sourceId", "licenceBasis"]);
    const valid = { white: "A", black: "B", date: "1999.??.??", result: "1/2-1/2", sourceId: "lichess-masters:aAbqI4ey", licenceBasis: "no-rights-asserted" };
    expect(sourceGameIssues(valid)).toEqual([]);
    expect(sourceGameIssues({ ...valid, annotator: "someone" })).toEqual(["sourceGame.annotator is not a sourceGame field"]);
    for (const key of SOURCE_GAME_SCHEMA.required) {
      const { [key]: _removed, ...partial } = valid;
      expect(sourceGameIssues(partial)).toContain(`sourceGame.${key} is required`);
    }
    expect(sourceGameIssues({ ...valid, licenceBasis: "all-rights-reserved" })).toHaveLength(1);
    expect(sourceGameIssues({ ...valid, white: "" })).toEqual(["sourceGame.white must not be empty"]);
  });

  it("criterion 5: more than one game id per invocation is refused before any request", async () => {
    const masterGame = vi.fn(fixtureRecordedMasterGame);
    await expect(emitMastersCandidate({ gameIds: [GAME, "Bf3kqP2x"], splitPly: 0, learnerSide: "white", phase: "opening", client: { masterGame }, outputRoot: await temporary() })).rejects.toMatchObject({ code: "MASTERS_ENUMERATION_REFUSED" });
    await expect(emitMastersCandidate({ gameIds: [], splitPly: 0, learnerSide: "white", phase: "opening", client: { masterGame }, outputRoot: await temporary() })).rejects.toMatchObject({ code: "MASTERS_ENUMERATION_REFUSED" });
    expect(masterGame).not.toHaveBeenCalled();
    expect(() => requireSingleMastersGame([GAME, GAME])).toThrow(expect.objectContaining({ code: "MASTERS_ENUMERATION_REFUSED" }));
    expect(() => mastersGameUrl("../../masters")).toThrow(expect.objectContaining({ code: "MASTERS_GAME_ID_INVALID" }));
  });

  it("criterion 5: any masters index request throws a typed refusal; the two admitted shapes pass", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    for (const url of [
      `https://explorer.lichess.org/masters?fen=${encodeURIComponent(fen)}`,
      `https://explorer.lichess.org/masters?fen=${encodeURIComponent(fen)}&topGames=15`,
      "https://explorer.lichess.org/masters?play=e2e4&topGames=0&recentGames=4",
      "https://explorer.lichess.org/masters/pgn",
      "https://explorer.lichess.org/masters/games?player=Carlsen",
      "https://explorer.lichess.org/masters/pgn/aAbqI4ey?list=all",
    ]) expect(() => assertMastersRequest(url), url).toThrow(expect.objectContaining({ code: "MASTERS_INDEX_REFUSED" }));
    expect(() => assertMastersRequest(mastersGameUrl(GAME))).not.toThrow();
    expect(() => assertMastersRequest(mastersUrl({ fen }, new Date("2026-09-24T00:00:00Z")))).not.toThrow();
    expect(new URL(mastersUrl({ fen }, new Date("2026-09-24T00:00:00Z"))).searchParams.get("topGames")).toBe("0");
  });

  it("criterion 6: the masters paths share the explorer client's 429 retry-and-abstain schedule", async () => {
    for (const call of [(client: ExplorerClient) => client.masterGame(GAME), (client: ExplorerClient) => client.mastersStats({ fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1" })]) {
      const waits: number[] = [];
      const urls: string[] = [];
      const fetcher = vi.fn(async (url: string) => { urls.push(url); return new Response("limited", { status: 429 }); });
      const client = new ExplorerClient({ sourceRoot: resolve(await temporary(), "sources"), fetcher, wait: async (milliseconds) => { waits.push(milliseconds); }, now: () => new Date("2026-09-24T12:00:00Z") });
      await expect(call(client)).resolves.toMatchObject({ kind: "abstention", reason: "source_unavailable", detail: "HTTP 429 after 3 retries", source: { sourceId: "lichess-masters" } });
      expect(fetcher).toHaveBeenCalledTimes(4);
      expect(waits).toEqual([60_000, 120_000, 240_000]);
      expect(new Set(urls).size).toBe(1);
    }
  });

  it("abstains honestly when the masters aggregate endpoint refuses an unauthenticated request", async () => {
    const calls: RequestInit[] = [];
    const client = new ExplorerClient({ sourceRoot: resolve(await temporary(), "sources"), fetcher: async (_url, init) => { calls.push(init); return new Response("Authorization Required", { status: 401 }); }, now: () => new Date("2026-09-24T12:00:00Z") });
    await expect(client.mastersStats({ fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1" })).resolves.toMatchObject({ kind: "abstention", reason: "source_unavailable", detail: "HTTP 401 Authorization Required" });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.headers).not.toHaveProperty("authorization");
  });

  it("serves a cached masters game without a second request, and caches under the masters source", async () => {
    const root = await temporary();
    const body = await readFile(resolve(RECORDED));
    const fetcher = vi.fn(async () => new Response(body.subarray(0, -1), { status: 200 }));
    const client = new ExplorerClient({ sourceRoot: resolve(root, "sources"), fetcher, now: () => new Date("2026-09-24T12:00:00Z") });
    const first = await client.masterGame(GAME);
    const second = await client.masterGame(GAME);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(first.kind === "game" && second.kind === "game" && sha256(first.body) === sha256(second.body)).toBe(true);
    expect(second.source).toMatchObject({ sourceId: "lichess-masters", licence: { basis: "no-rights-asserted", rationale: MASTERS_RATIONALE } });
  });

  it("refuses to relabel the recorded capture as any other game", async () => {
    await expect(fixtureRecordedMasterGame("Bf3kqP2x")).rejects.toMatchObject({ code: "FIXTURE_REQUEST_MISMATCH" });
  });

  it("emits a strict-clean draft candidate from the recorded game with its sourceGame sidecar", async () => {
    const output = await emitMastersCandidate({ gameIds: [GAME], splitPly: 6, toPly: 20, learnerSide: "white", phase: "opening", client: { masterGame: fixtureRecordedMasterGame }, outputRoot: await temporary() });
    const pack = await readJson(resolve(output, "pack.json")) as any;
    const sidecar = await readJson(resolve(output, "source-game.json")) as any;
    const sources = await readJson(resolve(output, "sources.json")) as any;
    expect(pack.id).toMatch(/^masters-carlsen-chadaev-2012-[0-9a-f]{8}-white$/);
    expect(pack.title).toBe("Carlsen, Magnus – Chadaev, Nikolay, Wch Blitz, Astana 2012.07.10");
    expect(pack.start.movesSan).toEqual(["e4", "e5", "f4", "d5", "exd5", "exf4"]);
    expect(pack.provenance.reviewStatus).toBe("draft");
    expect(pack.provenance.sources).toHaveLength(1);
    expect(pack.provenance.sources[0]).toContain(MASTERS_RATIONALE);
    expect(pack.provenance.sources[0]).toContain("https://explorer.lichess.org/masters/pgn/aAbqI4ey");
    expect(pack.provenance).not.toHaveProperty("sourceGame");
    expect(sidecar).toEqual({ schema: "tabiya.sourcing.source-game.v1", packId: pack.id, sourceGame: expect.objectContaining({ white: "Carlsen, Magnus", sourceId: "lichess-masters:aAbqI4ey" }) });
    expect(sources.entries).toEqual([expect.objectContaining({ sourceId: "lichess-masters", origin: expect.objectContaining({ kind: "http", status: 200 }) })]);
    const checked = await checkSourcingDirectory(output, { strict: true });
    expect(checked.issues.filter((value) => value.severity === "error")).toEqual([]);
    sidecar.sourceGame.annotator = "Kasparov";
    await writeCanonicalJson(resolve(output, "source-game.json"), sidecar);
    const tampered = await checkSourcingDirectory(output, { strict: true });
    expect(tampered.valid).toBe(false);
    expect(tampered.issues.map((value) => value.code)).toContain("SOURCE_GAME_INVALID");
  });

  it("refuses a split ply that hands the first move to the opponent", async () => {
    await expect(emitMastersCandidate({ gameIds: [GAME], splitPly: 5, learnerSide: "white", phase: "opening", client: { masterGame: fixtureRecordedMasterGame }, outputRoot: await temporary() })).rejects.toMatchObject({ code: "MASTERS_PLY_RANGE_INVALID" });
    await expect(emitMastersCandidate({ gameIds: [GAME], splitPly: 84, toPly: 90, learnerSide: "white", phase: "endgame", client: { masterGame: fixtureRecordedMasterGame }, outputRoot: await temporary() })).rejects.toMatchObject({ code: "MASTERS_PLY_RANGE_INVALID" });
  });

  it("emits nothing when the source is unavailable", async () => {
    const root = await temporary();
    await expect(emitMastersCandidate({ gameIds: [GAME], splitPly: 0, learnerSide: "white", phase: "opening", client: { masterGame: fixtureUnavailableMasterGame }, outputRoot: root })).rejects.toMatchObject({ code: "SOURCE_UNAVAILABLE" });
    await expect(readFile(resolve(root, "masters-carlsen-chadaev-2012"))).rejects.toThrow();
  });

  it("criterion 8: injected comments, NAGs and suffix glyphs never reach the pack movetext", async () => {
    const hostile = [
      '[Event "Fixture"]', '[Site "?"]', '[Date "2012.07.10"]', '[Round "1"]', '[White "White, A"]', '[Black "Black, B"]', '[Result "1-0"]', "",
      "1. e4!? {A brilliant pawn sacrifice?} e5 $2 2. f4?! {!} d5!! 3. exd5 $1 exf4?? {White is winning} 4. Nf3 { ${bad} } 1-0",
    ].join("\n");
    const output = await emitMastersCandidate({ gameIds: [GAME], splitPly: 2, learnerSide: "white", phase: "opening", client: { masterGame: stubbedGame(hostile) }, outputRoot: await temporary() });
    const pack = await readJson(resolve(output, "pack.json")) as any;
    const spineSan = (nodes: readonly any[]): string[] => nodes.flatMap((node) => [node.moveSan, ...spineSan(node.children)]);
    const movetext = [...pack.start.movesSan, ...spineSan(pack.spine)].join(" ");
    expect(movetext).toBe("e4 e5 f4 d5 exd5 exf4 Nf3");
    for (const glyph of ["{", "}", "$", "!", "?"]) expect(movetext.includes(glyph), glyph).toBe(false);
    const serialized = await readFile(resolve(output, "pack.json"), "utf8");
    for (const prose of ["brilliant", "winning", "bad"]) expect(serialized).not.toContain(prose);
    expect(pack.start.movesSan).toEqual(["e4", "e5"]);
    expect(pack.spine[0].moveSan).toBe("f4");
  });

  it("criterion 7: a masters-sourced pack without the masters source line fails to attach, before querying", async () => {
    const output = await emitMastersCandidate({ gameIds: [GAME], splitPly: 6, toPly: 20, learnerSide: "white", phase: "opening", client: { masterGame: fixtureRecordedMasterGame }, outputRoot: await temporary() });
    const packPath = resolve(output, "pack.json");
    const ledgerPath = resolve(output, "evidence.json");
    const pack = await readJson(packPath) as any;
    pack.feedbackClaims = [{ id: "move-frequency", text: "The move appears in 31.4% of games.", evidenceTypes: ["corpus_observed"] }];
    pack.provenance.sources = [`lichess-explorer — ${EXPLORER_RATIONALE}`];
    const ledger = await readJson(ledgerPath) as any;
    ledger.packDigest = await digestDrillPack(pack);
    await writeCanonicalJson(packPath, pack);
    await writeCanonicalJson(ledgerPath, ledger);
    const before = await readFile(packPath);
    const stats = vi.fn(async (query: ExplorerQuery): Promise<ExplorerStats> => ({ kind: "abstention", reason: "source_unavailable", detail: "unused", source: { sourceId: "lichess-explorer", retrievedAt: "2026-09-24T00:00:00.000Z", origin: { kind: "local-file", path: `test:${query.fen}`, sha256: sha256("unused"), bytes: 6 }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: EXPLORER_RATIONALE } } }));
    const request = { directory: output, moveSan: "Bf5", target: "/feedbackClaims/0/text", span: "31.4%", field: "sharePct" as const, query: { ratings: [1400, 1600, 1800] as const, speeds: ["blitz", "rapid"] as const, since: "2024-01", until: "2026-07" }, client: { stats } };
    await expect(attachExplorerEvidence(request)).rejects.toMatchObject({ code: "ATTACH_SOURCE_LINE_MISSING", message: expect.stringContaining("masters") });
    expect(stats).not.toHaveBeenCalled();
    expect(sha256(await readFile(packPath))).toBe(sha256(before));

    pack.provenance.sources = [...pack.provenance.sources, `lichess-masters — ${MASTERS_RATIONALE}`];
    ledger.packDigest = await digestDrillPack(pack);
    await writeCanonicalJson(packPath, pack);
    await writeCanonicalJson(ledgerPath, ledger);
    await expect(attachExplorerEvidence(request)).resolves.toBe("abstained");
    expect(stats).toHaveBeenCalledTimes(1);
  });

  it("records the §2 probe claim on real bytes: the masters capture is a bare score", async () => {
    const provenance = JSON.parse(await readFile(resolve("apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.provenance.json"), "utf8"));
    const stored = await readFile(resolve(RECORDED));
    expect(provenance.capture.url).toBe(mastersGameUrl(GAME));
    expect(sha256(stored.subarray(0, -1))).toBe(provenance.capture.sha256);
    const text = stored.toString("utf8");
    const movetext = text.slice(text.lastIndexOf("]") + 1);
    for (const glyph of ["{", "}", "$", "!", "?", "%eval"]) expect(movetext.includes(glyph), glyph).toBe(false);
    expect(text.match(/^\[(\w+) /gm)?.map((tag) => tag.slice(1, -1))).toEqual(["Event", "Site", "Date", "Round", "White", "Black", "Result", "WhiteElo", "BlackElo"]);
  });
});
