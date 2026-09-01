import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import { checkSourcingFile } from "./check.js";
import { TABLEBASE_RATIONALE, type TablebasePayload } from "./syzygy.js";
import { compileTablebaseCensus, tablebaseCensus } from "./tablebase-census.js";
import type { EvidenceLedger, SourceEntry, SourceManifest } from "./types.js";
import { verifyDraft } from "./verify-draft.js";

const START = "7k/P7/8/8/8/8/4K3/8 w - - 0 1";
const directories: string[] = [];

afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))));

function pack(): DrillPackDefinition {
  return {
    id: "promotion-census",
    version: "0.1.0",
    title: "Promotion census",
    mode: "outcome",
    phase: "endgame",
    start: { fen: START, side: "white" },
    objective: { type: "play_until_checkpoint", summary: "Exercise exact successor enumeration.", successConditions: [] },
    checkpoints: [],
    opponentPolicy: { mode: "human_common", targetElo: 1500, seedMode: "per_branch" },
    feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "draft", sources: ["unit fixture"], licence: "CC-BY-SA-4.0", graduationBlockers: [] },
  } as unknown as DrillPackDefinition;
}

function ledger(): EvidenceLedger {
  return {
    schema: "tabiya.sourcing.evidence.v1",
    packId: "promotion-census",
    packVersion: "0.1.0",
    packDigest: "stale-on-purpose",
    sourcedAt: "2026-09-01T00:00:00.000Z",
    records: [],
    abstentions: [],
  };
}

function payload(): TablebasePayload {
  return {
    checkmate: false,
    stalemate: false,
    insufficient_material: false,
    dtz: 1,
    precise_dtz: 1,
    dtm: null,
    category: "draw",
  };
}

function source(index: number, fen: string): SourceEntry {
  return {
    sourceId: "syzygy",
    retrievedAt: new Date(Date.parse("2026-09-01T00:00:00.000Z") + index * 1_000).toISOString(),
    origin: {
      kind: "http",
      url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`,
      status: 200,
      sha256: `sha256:${"0".repeat(64)}`,
      bytes: 2,
      etag: null,
    },
    licence: {
      basis: "no-rights-asserted",
      spdx: null,
      noticeText: null,
      rationale: TABLEBASE_RATIONALE,
    },
  };
}

const emptyManifest: SourceManifest = { schema: "tabiya.sourcing.manifest.v1", entries: [] };

describe("tablebase legal-successor census", () => {
  it("retains all four promotion roles as distinct successor evidence", async () => {
    let calls = 0;
    const compiled = await compileTablebaseCensus(pack(), ledger(), emptyManifest, {
      maxQueries: 50,
      query: async (fen) => ({ payload: payload(), source: source(calls++, fen) }),
    });

    const placements = compiled.ledger.records
      .filter((record) => record.kind === "tablebase_result")
      .map((record) => String(record.anchor.fen));
    expect(placements.some((value) => value.startsWith("Q6k/"))).toBe(true);
    expect(placements.some((value) => value.startsWith("R6k/"))).toBe(true);
    expect(placements.some((value) => value.startsWith("B6k/"))).toBe(true);
    expect(placements.some((value) => value.startsWith("N6k/"))).toBe(true);
    expect(compiled.queried).toBe(compiled.successorPositions);
    expect(new Set(compiled.ledger.records.map((record) => record.anchor.fen)).size).toBe(compiled.successorPositions);
  });

  it("reuses one unique record per successor and performs no second query", async () => {
    let calls = 0;
    const first = await compileTablebaseCensus(pack(), ledger(), emptyManifest, {
      maxQueries: 50,
      query: async (fen) => ({ payload: payload(), source: source(calls++, fen) }),
    });
    const query = vi.fn(async () => { throw new Error("must not query"); });
    const second = await compileTablebaseCensus(pack(), first.ledger, first.manifest, { maxQueries: 0, query });

    expect(query).not.toHaveBeenCalled();
    expect(second.queried).toBe(0);
    expect(second.reused).toBe(second.successorPositions);
    expect(second.ledger.records).toEqual(first.ledger.records);
  });

  it("fails before mutating its inputs when the query budget is insufficient", async () => {
    const originalLedger = ledger();
    const originalManifest = structuredClone(emptyManifest);
    await expect(compileTablebaseCensus(pack(), originalLedger, emptyManifest, {
      maxQueries: 0,
      query: async (fen) => ({ payload: payload(), source: source(0, fen) }),
    })).rejects.toMatchObject({ code: "WALK_QUERY_BUDGET_EXCEEDED" });
    expect(originalLedger).toEqual(ledger());
    expect(emptyManifest).toEqual(originalManifest);
  });

  it("refuses duplicate existing tablebase authorities for one FEN", async () => {
    let calls = 0;
    const first = await compileTablebaseCensus(pack(), ledger(), emptyManifest, {
      maxQueries: 50,
      query: async (fen) => ({ payload: payload(), source: source(calls++, fen) }),
    });
    const duplicate = first.ledger.records.find((record) => record.kind === "tablebase_result")!;
    const badLedger = { ...first.ledger, records: [...first.ledger.records, duplicate] };
    await expect(compileTablebaseCensus(pack(), badLedger, first.manifest, { maxQueries: 0 }))
      .rejects.toMatchObject({ code: "VERIFY_LEDGER_MERGE_CONFLICT" });
  });

  it("replaces a real pack's validated sidecars through the production file boundary", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tabiya-tablebase-census-"));
    directories.push(directory);
    const file = join(directory, "lucena.json");
    await writeFile(file, await readFile(resolvePackPath("lucena-bridge-convert"), "utf8"), "utf8");
    let calls = 0;
    const query = async (fen: string) => ({
      payload: { ...payload(), category: fen.split(" ")[1] === "w" ? "win" : "loss" },
      source: source(calls++, fen),
    });
    await verifyDraft(file, { query, now: () => new Date("2026-09-01T01:00:00.000Z") });

    const result = await tablebaseCensus(file, { query, maxQueries: 400 });
    const checked = await checkSourcingFile(file, { strict: true });
    const writtenLedger = JSON.parse(await readFile(result.paths.ledger, "utf8")) as EvidenceLedger;

    expect(checked.valid).toBe(true);
    expect(result.successorPositions).toBeGreaterThan(0);
    expect(writtenLedger).toEqual(result.ledger);
  });
});
