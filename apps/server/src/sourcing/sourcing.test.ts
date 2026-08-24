import { mkdtemp, readFile, writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it, vi } from "vitest";

import { checkSourcingDirectory } from "./check.js";
import { readJson, sha256, writeCanonicalJson } from "./canonical.js";
import { SourcingHttpClient } from "./http.js";
import { SourceLock } from "./lock.js";
import { emissionJobDigest } from "./canonical.js";
import { emitOpeningCandidate, normalizeOpeningPgn } from "./openings.js";
import type { EvidenceLedger, SourceManifest } from "./types.js";

const roots: string[] = [];

async function root(): Promise<string> {
  const value = await mkdtemp(resolve(tmpdir(), "tabiya-sourcing-"));
  roots.push(value);
  return value;
}

async function candidate(): Promise<string> {
  return emitOpeningCandidate({
    eco: "D35",
    name: "Queen's Gambit Declined: Exchange Variation",
    splitPly: 8,
    learnerSide: "white",
    outputRoot: await root(),
  });
}

async function mutate(path: string, f: (value: any) => void): Promise<void> {
  const value = await readJson(path) as any;
  f(value);
  await writeCanonicalJson(path, value);
}

afterEach(() => { roots.length = 0; });

describe("content sourcing foundation", () => {
  it("emits the deterministic D35 line skeleton and a strict-checking artifact triple", async () => {
    const firstRoot = await root();
    const secondRoot = await root();
    const options = { eco: "D35", name: "Queen's Gambit Declined: Exchange Variation", splitPly: 8, learnerSide: "white" as const };
    const first = await emitOpeningCandidate({ ...options, outputRoot: firstRoot });
    const second = await emitOpeningCandidate({ ...options, outputRoot: secondRoot });
    const pack = await readJson(resolve(first, "pack.json")) as any;
    expect(pack.start.side).toBe("white");
    expect(pack.start.movesSan).toHaveLength(8);
    let spine = pack.spine;
    let plies = 0;
    while (spine[0]) { plies += 1; spine = spine[0].children; }
    expect(plies).toBe(6);
    expect(pack.objective.summary).toBe("Play the recorded line to its end: 6 plies from this position.");
    expect(pack.provenance.licence).toBe("CC-BY-SA-4.0");
    expect(pack).not.toHaveProperty("feedbackClaims");
    expect((await checkSourcingDirectory(first)).valid).toBe(true);
    for (const file of ["pack.json", "evidence.json", "sources.json"]) {
      const [left, right] = await Promise.all([readFile(resolve(first, file)), readFile(resolve(second, file))]);
      expect(sha256(left)).toBe(sha256(right));
      expect(left.toString()).not.toContain("generatedAt");
    }
  });

  it("keys mirrored opening emissions by learner side", async () => {
    const outputRoot = await root();
    const common = { eco: "D35", name: "Queen's Gambit Declined: Exchange Variation", splitPly: 8, outputRoot };
    const white = await emitOpeningCandidate({ ...common, learnerSide: "white" });
    const black = await emitOpeningCandidate({ ...common, learnerSide: "black" });
    expect(white).not.toBe(black);
    const [whitePack, blackPack, whiteJob, blackJob] = await Promise.all([
      readJson(resolve(white, "pack.json")) as Promise<any>,
      readJson(resolve(black, "pack.json")) as Promise<any>,
      readJson(resolve(white, "job.json")) as Promise<any>,
      readJson(resolve(black, "job.json")) as Promise<any>,
    ]);
    expect(whitePack.id).not.toBe(blackPack.id);
    expect(whiteJob.args.learnerSide).toBe("white");
    expect(blackJob.args.learnerSide).toBe("black");
  });

  it("refuses to overwrite a candidate directory owned by the other learner side", async () => {
    const outputRoot = await root();
    const options = {
      eco: "D35",
      name: "Queen's Gambit Declined: Exchange Variation",
      splitPly: 8,
      learnerSide: "white" as const,
      outputRoot,
    };
    const directory = await emitOpeningCandidate(options);
    await mutate(resolve(directory, "job.json"), (job) => {
      job.args.learnerSide = "black";
      job.emissionJobDigest = `sha256:${"0".repeat(64)}`;
    });

    await expect(emitOpeningCandidate(options)).rejects.toMatchObject({
      code: "CANDIDATE_IDENTITY_COLLISION",
    });
  });

  it("uses chessops to reject an illegal third-party line without partial output", () => {
    expect(() => normalizeOpeningPgn("1. e4 e5 2. Bh6")).toThrow(/illegal SAN/);
  });

  it("fails closed on empty, malformed, denied and unlinked manifests", async () => {
    const directory = await candidate();
    await mutate(resolve(directory, "sources.json"), (manifest) => { manifest.entries = []; });
    expect((await checkSourcingDirectory(directory)).issues.map((value) => value.code)).toContain("MANIFEST_EMPTY");

    const directory2 = await candidate();
    await mutate(resolve(directory2, "sources.json"), (manifest) => { manifest.entries[0].sourceId = "ecochessopeningcodes"; });
    const codes = (await checkSourcingDirectory(directory2)).issues.map((value) => value.code);
    expect(codes).toContain("SOURCE_DENIED");
    expect(codes).toContain("EVIDENCE_SOURCE_UNLINKED");

    const directory3 = await candidate();
    await mutate(resolve(directory3, "sources.json"), (manifest) => { manifest.entries[0].licence.noticeText = "not allowed for CC0"; });
    expect((await checkSourcingDirectory(directory3)).issues.map((value) => value.code)).toContain("LICENCE_FIELD_INVALID");
  });

  it("enforces linkage timestamps, unused entries and derived sourcedAt", async () => {
    const directory = await candidate();
    await mutate(resolve(directory, "evidence.json"), (ledger) => { ledger.records[0].retrievedAt = "2026-08-04T00:00:01.000Z"; ledger.sourcedAt = "2026-08-04T00:00:01.000Z"; });
    expect((await checkSourcingDirectory(directory)).issues.map((value) => value.code)).toContain("EVIDENCE_RETRIEVED_AT_MISMATCH");

    const directory2 = await candidate();
    await mutate(resolve(directory2, "sources.json"), (manifest) => { manifest.entries.push({ ...manifest.entries[0], retrievedAt: "2026-08-05T00:00:00.000Z" }); });
    expect((await checkSourcingDirectory(directory2)).issues.map((value) => value.code)).toContain("MANIFEST_ENTRY_UNUSED");

    const directory3 = await candidate();
    await mutate(resolve(directory3, "evidence.json"), (ledger) => { ledger.sourcedAt = "2026-08-05T00:00:00.000Z"; });
    expect((await checkSourcingDirectory(directory3)).issues.map((value) => value.code)).toContain("EVIDENCE_TIMESTAMP_DERIVED");
  });

  it("fails prose, grading and broken-pointer overreach but only warns on a stale digest", async () => {
    const directory = await candidate();
    await mutate(resolve(directory, "evidence.json"), (ledger) => { ledger.records[0].supports = ["/objective/summary", "/does/not/exist"]; });
    const codes = (await checkSourcingDirectory(directory)).issues.map((value) => value.code);
    expect(codes).toContain("EVIDENCE_OVERREACH");
    expect(codes).toContain("EVIDENCE_ANCHOR_BROKEN");

    const directory2 = await candidate();
    await mutate(resolve(directory2, "pack.json"), (pack) => { pack.title += " edited"; });
    const result = await checkSourcingDirectory(directory2);
    expect(result.valid).toBe(true);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "EVIDENCE_DIGEST_STALE", severity: "warning" }));
  });

  it("refuses an engine-assessed objective without matching engine evidence", async () => {
    const directory = await candidate();
    await mutate(resolve(directory, "pack.json"), (pack) => {
      pack.objective.grading = {
        assessedBy: {
          kind: "engine",
          score: { kind: "cp", centipawns: 0 },
          perspective: "white",
          depth: 22,
          engineId: "stockfish",
          engineVersion: "18",
          sourceId: "stockfish",
          retrievedAt: "2026-08-24T00:00:00.000Z",
        },
        resolveAt: { kind: "terminal" },
      };
    });

    const result = await checkSourcingDirectory(directory, { strict: true });
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "ENGINE_ASSESSMENT_UNGROUNDED",
      path: "/objective/grading/assessedBy",
      severity: "error",
    }));
  });

  it("accepts local-file and engine origins and an abstention-only fetchless candidate", async () => {
    const directory = await candidate();
    const ledger = await readJson(resolve(directory, "evidence.json")) as EvidenceLedger;
    const manifest = await readJson(resolve(directory, "sources.json")) as SourceManifest;
    const retrievedAt = manifest.entries[0]!.retrievedAt;
    const local = { sourceId: "positions", retrievedAt, origin: { kind: "local-file", path: "content/input.fen", sha256: "sha256:abc", bytes: 12 }, licence: { basis: "CC0-1.0" } } as any;
    const engine = { sourceId: "stockfish", retrievedAt, origin: { kind: "engine", engineId: "stockfish", engineName: null, engineVersion: "17", profile: { threads: 1, hashMb: 16, multiPv: 1 }, budget: { depth: 22 }, fen: "8/8/8/8/8/8/8/K6k w - - 0 1", evidenceKind: "engine_eval" }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: "output of a locally executed engine; not a third-party work" } } as any;
    // Correct the local licence after constructing the deliberately heterogeneous fixture.
    local.licence = { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null };
    await writeCanonicalJson(resolve(directory, "sources.json"), { ...manifest, entries: [local, engine] });
    await writeCanonicalJson(resolve(directory, "evidence.json"), { ...ledger, records: [], abstentions: [
      { kind: "tablebase_result", anchor: { fen: engine.origin.fen }, sourceId: "positions", retrievedAt, reason: "out_of_range", detail: "11 pieces; Syzygy covers <=7" },
      { kind: "engine_eval", anchor: { fen: engine.origin.fen }, sourceId: "stockfish", retrievedAt, reason: "source_unavailable", detail: "fixture" },
    ] });
    expect((await checkSourcingDirectory(directory)).valid).toBe(true);
  });

  it("keeps evidence outside pack identity", async () => {
    const directory = await candidate();
    const pack = await readJson(resolve(directory, "pack.json"));
    const before = await digestDrillPack(pack);
    await mutate(resolve(directory, "evidence.json"), (ledger) => { ledger.records[0].values.observation = "refreshed"; });
    expect(await digestDrillPack(await readJson(resolve(directory, "pack.json")))).toBe(before);
  });

  it("derives job identity from all resolved arguments and source etags", () => {
    const base = emissionJobDigest("openings", { splitPly: 8 }, ["etag"]);
    expect(emissionJobDigest("openings", { splitPly: 9 }, ["etag"])).not.toBe(base);
    expect(emissionJobDigest("openings", { splitPly: 8 }, ["other"])).not.toBe(base);
  });
});

describe("polite source access", () => {
  it("refuses fresh and stale locks until an operator removes them", async () => {
    const sourceRoot = await root();
    const holder = new SourceLock(sourceRoot);
    await holder.acquire(new Date("2020-01-01T00:00:00Z"));
    const contender = new SourceLock(sourceRoot);
    await expect(contender.acquire()).rejects.toMatchObject({ code: "STALE_LOCK_HELD" });
    await holder.release();
    await expect(contender.acquire()).resolves.toBeUndefined();
    await contender.release();
  });

  it("does not delete a lock whose owner changed", async () => {
    const sourceRoot = await root();
    const lock = new SourceLock(sourceRoot);
    await lock.acquire();
    await writeFile(lock.path, JSON.stringify({ owner: "other", acquiredAt: "x", heartbeatAt: "x" }));
    await lock.release();
    await expect(readFile(lock.path, "utf8")).resolves.toContain("other");
    await unlink(lock.path);
  });

  it("retries 5xx on 60/120/240 seconds and never retries 4xx", async () => {
    const lock = { verify: vi.fn(async () => undefined) } as unknown as SourceLock;
    const waits: number[] = [];
    const statuses = [503, 503, 503, 200];
    const fetcher = vi.fn(async () => new Response("ok", { status: statuses.shift()! }));
    const client = new SourcingHttpClient(lock, fetcher, async (ms) => { waits.push(ms); });
    expect((await client.request("https://example.test/source")).status).toBe(200);
    expect(waits).toEqual([60_000, 120_000, 240_000]);

    const bad = vi.fn(async () => new Response("bad", { status: 400 }));
    await expect(new SourcingHttpClient(lock, bad, async () => undefined).request("https://example.test/bad")).rejects.toMatchObject({ code: "SOURCE_HTTP_ERROR" });
    expect(bad).toHaveBeenCalledTimes(1);
  });
});
