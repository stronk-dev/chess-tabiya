import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it, vi } from "vitest";

import { checkSourcingDirectory } from "./check.js";
import { readJson, sha256, writeCanonicalJson } from "./canonical.js";
import {
  attachExplorerEvidence,
  emitExplorerPriority,
  ExplorerClient,
  explorerUrl,
  fixtureAvailableExplorer,
  fixtureUnavailableExplorer,
  normalizeExplorerQuery,
  renderExplorerFrequency,
  RATING_GROUPS,
  SPEEDS,
  EXPLORER_RATIONALE,
  type ExplorerQuery,
} from "./explorer.js";
import { emitOpeningCandidate } from "./openings.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const BASE_QUERY: ExplorerQuery = { fen: START, ratings: [1400, 1600, 1800], speeds: ["blitz", "rapid"], since: "2024-01", until: "2026-07" };

async function temporary(): Promise<string> { return mkdtemp(resolve(tmpdir(), "tabiya-explorer-")); }

async function attachableCandidate(): Promise<string> {
  const root = await temporary();
  const directory = await emitOpeningCandidate({ eco: "D35", name: "Queen's Gambit Declined: Exchange Variation", splitPly: 8, learnerSide: "white", outputRoot: resolve(root, "candidates") });
  const pack = await readJson(resolve(directory, "pack.json")) as any;
  pack.feedbackClaims = [{ id: "move-frequency", text: "The move appears in 31.4% of games.", evidenceTypes: ["corpus_observed"] }];
  pack.provenance.sources = [...(pack.provenance.sources ?? []), `lichess-explorer — ${EXPLORER_RATIONALE}`];
  const ledger = await readJson(resolve(directory, "evidence.json")) as any;
  ledger.packDigest = await digestDrillPack(pack);
  await writeCanonicalJson(resolve(directory, "pack.json"), pack);
  await writeCanonicalJson(resolve(directory, "evidence.json"), ledger);
  return directory;
}

describe("Lichess explorer sourcing", () => {
  it("closes and canonicalizes the published request grammar before fetching", () => {
    expect(RATING_GROUPS).toEqual([0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500]);
    expect(SPEEDS).toEqual(["ultraBullet", "bullet", "blitz", "rapid", "classical", "correspondence"]);
    expect(() => normalizeExplorerQuery({ ...BASE_QUERY, ratings: [1500 as any] })).toThrow(/RATINGS_NOT_A_GROUP|ratings must/);
    expect(() => normalizeExplorerQuery({ ...BASE_QUERY, speeds: ["bltiz" as any] })).toThrow(/SPEEDS_NOT_A_SPEED|speeds must/);
    expect(() => normalizeExplorerQuery({ ...BASE_QUERY, speeds: ["bullet", "bullet"] })).toThrow(/speeds must/);
    expect(() => normalizeExplorerQuery({ ...BASE_QUERY, since: "2026-13" })).toThrow(/WINDOW_INVALID|real YYYY/);
    expect(() => normalizeExplorerQuery({ ...BASE_QUERY, since: "2026-07", until: "2024-01" })).toThrow(/WINDOW_INVALID|since/);
    expect(() => normalizeExplorerQuery({ ...BASE_QUERY, moves: 0 })).toThrow(/ARGUMENT_INVALID|positive safe integer/);
    expect(normalizeExplorerQuery({ ...BASE_QUERY, speeds: ["rapid", "blitz"], since: "2024-01", until: "2024-01" }).speeds).toEqual(["blitz", "rapid"]);
    expect(normalizeExplorerQuery(BASE_QUERY).moves).toBe(12);
    const url = new URL(explorerUrl(BASE_QUERY));
    expect(Object.fromEntries(url.searchParams)).toEqual({ variant: "standard", fen: START, ratings: "1400,1600,1800", speeds: "blitz,rapid", since: "2024-01", until: "2026-07", moves: "12", topGames: "0", recentGames: "0", history: "false" });
    expect(explorerUrl({ ...BASE_QUERY, speeds: ["rapid", "blitz"] })).toBe(explorerUrl(BASE_QUERY));
    expect(new URL(explorerUrl({ ...BASE_QUERY, moves: 40 })).searchParams.get("moves")).toBe("40");
  });

  it("abstains after exactly one 401 without substituting a band or leaking the token", async () => {
    const sourceRoot = resolve(await temporary(), "sources");
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const client = new ExplorerClient({ sourceRoot, token: "SENTINEL_SECRET", now: () => new Date("2026-08-12T12:00:00Z"), fetcher: async (url, init) => { calls.push({ url, init }); return new Response("Authorization Required", { status: 401 }); } });
    const result = await client.stats(BASE_QUERY);
    expect(result).toMatchObject({ kind: "abstention", reason: "source_unavailable", detail: "HTTP 401 Authorization Required" });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toContain("ratings=1400%2C1600%2C1800");
    expect(JSON.stringify(result)).not.toContain("SENTINEL_SECRET");
    expect(calls[0]!.init.headers).toMatchObject({ authorization: "Bearer SENTINEL_SECRET" });
  });

  it("retries 429 on the 60/120/240 schedule and then abstains", async () => {
    const waits: number[] = [];
    const fetcher = vi.fn(async () => new Response("limited", { status: 429 }));
    const client = new ExplorerClient({ sourceRoot: resolve(await temporary(), "sources"), fetcher, wait: async (milliseconds) => { waits.push(milliseconds); }, now: () => new Date("2026-08-12T12:00:00Z") });
    await expect(client.stats(BASE_QUERY)).resolves.toMatchObject({ kind: "abstention", reason: "source_unavailable", detail: "HTTP 429 after 3 retries" });
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(waits).toEqual([60_000, 120_000, 240_000]);
  });

  it("derives all counts from the real response fields and ignores invented total/window fields", async () => {
    const stats = await fixtureAvailableExplorer(BASE_QUERY);
    expect(stats.kind).toBe("stats");
    if (stats.kind !== "stats") return;
    expect(stats.white + stats.draws + stats.black).toBe(128034);
    const move = stats.moves[0]!;
    expect(move.white + move.draws + move.black).toBe(40204);
    expect(stats.window).toEqual({ since: "2024-01", until: "2026-07" });
    expect(renderExplorerFrequency({ moveSan: move.san, playedCount: 40204, total: 128034, sharePct: 31.4, white: move.white, draws: move.draws, black: move.black, ratings: stats.ratings, speeds: stats.speeds, since: stats.window.since, until: stats.window.until })).toBe("Bf5 is played in 31.4% of 128034 games from this position (Lichess explorer, rating buckets 1400,1600,1800, speeds blitz,rapid, 2024-01 to 2026-07).");
  });

  it("emits an honest unavailable priority artifact that strict-checks", async () => {
    const root = await temporary();
    const output = await emitExplorerPriority({ lines: resolve("apps/server/src/sourcing/fixtures/explorer-lines.tsv"), query: { ratings: [1400, 1600, 1800], speeds: ["blitz", "rapid"], since: "2024-01", until: "2026-07" }, client: { stats: fixtureUnavailableExplorer }, outputRoot: resolve(root, "candidates/priority"), sourceRoot: resolve(root, "sources"), now: () => new Date("2026-08-12T10:00:00Z") });
    const priority = await readJson(resolve(output, "priority.json")) as any;
    expect(priority.status).toBe("unavailable");
    expect(priority.rows).toEqual([]);
    expect(priority.abstentions).toHaveLength(6);
    expect(priority.abstentions).toContainEqual(expect.objectContaining({ eco: "B12", reason: "source_unavailable", detail: "HTTP 401 Authorization Required" }));
    expect((await checkSourcingDirectory(output, { strict: true })).valid).toBe(true);
    expect(JSON.stringify(priority)).not.toContain("LICHESS_TOKEN");
  });

  it("commits real Branch-A priority for all six first-wave families in total order", async () => {
    const priority = await readJson(resolve("content/candidates/priority/priority.json")) as any;
    expect(priority.status).toBe("available");
    expect(priority.rows).toHaveLength(6);
    expect(priority.abstentions).toEqual([]);
    expect(priority.rows.map((row: any) => row.eco).sort()).toEqual(["A80", "B12", "B20", "C02", "D02", "E60"]);
    expect(priority.rows.every((row: any) => row.total >= 100)).toBe(true);
    expect(priority.rows.map((row: any) => row.total)).toEqual([...priority.rows.map((row: any) => row.total)].sort((a: number, b: number) => b - a));
  });

  it("attaches evidence to authored prose idempotently without changing the pack", async () => {
    const directory = await attachableCandidate();
    const args = { directory, moveSan: "Bf5", target: "/feedbackClaims/0/text", span: "31.4%", field: "sharePct" as const, query: { ratings: [1400, 1600, 1800] as const, speeds: ["blitz", "rapid"] as const, since: "2024-01", until: "2026-07" }, client: { stats: fixtureAvailableExplorer } };
    await expect(attachExplorerEvidence(args)).resolves.toBe("attached");
    const first = await Promise.all(["pack.json", "evidence.json", "sources.json"].map((file) => readFile(resolve(directory, file))));
    const pack = JSON.parse(first[0]!.toString()) as any;
    const ledger = JSON.parse(first[1]!.toString()) as any;
    expect(pack.feedbackClaims[0].text).toBe("The move appears in 31.4% of games.");
    expect(ledger.records).toContainEqual(expect.objectContaining({ kind: "explorer_position_census" }));
    expect(ledger.claimBindings).toContainEqual(expect.objectContaining({ claimId: "move-frequency", pointer: "/feedbackClaims/0/text", spans: [expect.objectContaining({ span: "31.4%" })] }));
    expect(ledger.packDigest).toBe(await digestDrillPack(pack));
    expect((await checkSourcingDirectory(directory, { strict: true })).valid).toBe(true);
    await attachExplorerEvidence(args);
    const second = await Promise.all(["pack.json", "evidence.json", "sources.json"].map((file) => readFile(resolve(directory, file))));
    expect(second.map(sha256)).toEqual(first.map(sha256));
  });

  it("leaves all files untouched for forbidden targets, missing moves, and unavailable evidence", async () => {
    const directory = await attachableCandidate();
    const before = await Promise.all(["pack.json", "evidence.json", "sources.json"].map((file) => readFile(resolve(directory, file))));
    const query = { ratings: [1400, 1600, 1800] as const, speeds: ["blitz", "rapid"] as const, since: "2024-01", until: "2026-07" };
    await expect(attachExplorerEvidence({ directory, moveSan: "Bf5", target: "/objective/summary", query, client: { stats: fixtureAvailableExplorer } })).rejects.toMatchObject({ code: "ATTACH_TARGET_FORBIDDEN" });
    await expect(attachExplorerEvidence({ directory, moveSan: "Bf5", target: "/feedbackClaims/0/text", query, client: { stats: fixtureAvailableExplorer } })).rejects.toMatchObject({ code: "ATTACH_SPAN_REQUIRED" });
    await expect(attachExplorerEvidence({ directory, moveSan: "Qa9", target: "/feedbackClaims/0/text", span: "31.4%", field: "sharePct", query, client: { stats: fixtureAvailableExplorer } })).rejects.toMatchObject({ code: "MOVE_NOT_IN_RESPONSE" });
    const unchanged = await Promise.all(["pack.json", "evidence.json", "sources.json"].map((file) => readFile(resolve(directory, file))));
    expect(unchanged.map(sha256)).toEqual(before.map(sha256));
    await expect(attachExplorerEvidence({ directory, moveSan: "Bf5", target: "/feedbackClaims/0/text", span: "31.4%", field: "sharePct", query, client: { stats: fixtureUnavailableExplorer } })).resolves.toBe("abstained");
    expect(sha256(await readFile(resolve(directory, "pack.json")))).toBe(sha256(before[0]!));
  });

  it("refuses a missing source line before querying", async () => {
    const directory = await attachableCandidate();
    const packPath = resolve(directory, "pack.json"), ledgerPath = resolve(directory, "evidence.json");
    const pack = await readJson(packPath) as any;
    pack.provenance.sources = [];
    const ledger = await readJson(ledgerPath) as any; ledger.packDigest = await digestDrillPack(pack);
    await writeCanonicalJson(packPath, pack); await writeCanonicalJson(ledgerPath, ledger);
    const stats = vi.fn(fixtureAvailableExplorer);
    await expect(attachExplorerEvidence({ directory, moveSan:"Bf5",target:"/feedbackClaims/0/text",span:"31.4%",field:"sharePct",query:{ratings:[1400,1600,1800],speeds:["blitz","rapid"],since:"2024-01",until:"2026-07"},client:{stats} })).rejects.toMatchObject({code:"ATTACH_SOURCE_LINE_MISSING"});
    expect(stats).not.toHaveBeenCalled();
  });

  it("fails altered, incomplete, extra, or overreaching template evidence", async () => {
    const directory = await attachableCandidate();
    const query = { ratings: [1400, 1600, 1800] as const, speeds: ["blitz", "rapid"] as const, since: "2024-01", until: "2026-07" };
    await attachExplorerEvidence({ directory, moveSan: "Bf5", target: "/feedbackClaims/0/text", span: "31.4%", field: "sharePct", query, client: { stats: fixtureAvailableExplorer } });
    const ledgerPath = resolve(directory, "evidence.json");
    const packPath = resolve(directory, "pack.json");
    const cleanLedger = await readJson(ledgerPath) as any;
    const cleanPack = await readJson(packPath) as any;

    cleanLedger.records.find((record: any) => record.kind === "explorer_position_census").values.topMoves.find((move: any) => move.san === "Bf5").sharePct = 31.5;
    await writeCanonicalJson(ledgerPath, cleanLedger);
    expect((await checkSourcingDirectory(directory, { strict: true })).issues.map((value) => value.code)).toContain("EVIDENCE_VALUES_INVALID");

    cleanLedger.records.find((record: any) => record.kind === "explorer_position_census").values.topMoves.find((move: any) => move.san === "Bf5").sharePct = 31.4;
    cleanLedger.records.find((record: any) => record.kind === "explorer_position_census").values.extra = 1;
    await writeCanonicalJson(ledgerPath, cleanLedger);
    expect((await checkSourcingDirectory(directory, { strict: true })).issues.map((value) => value.code)).toContain("EVIDENCE_VALUES_INVALID");

    delete cleanLedger.records.find((record: any) => record.kind === "explorer_position_census").values.extra;
    cleanPack.feedbackClaims[0].text += " ";
    cleanLedger.packDigest = await digestDrillPack(cleanPack);
    await writeCanonicalJson(packPath, cleanPack);
    await writeCanonicalJson(ledgerPath, cleanLedger);
    expect((await checkSourcingDirectory(directory, { strict: true })).issues.map((value) => value.code)).toContain("CLAIM_TEXT_DRIFTED");
  });
});
