import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it } from "vitest";
import { checkSourcingFile } from "./check.js";
import { TABLEBASE_RATIONALE, type TablebasePayload } from "./syzygy.js";
import { tablebaseCensus } from "./tablebase-census.js";
import type { EvidenceLedger, SourceEntry } from "./types.js";
import { verifyDraft } from "./verify-draft.js";
import { withDerivedRequires } from "../capability/pack-capabilities.js";
const directories: string[] = [];
afterEach(async () => Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))));
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

describe("tablebase legal-successor census", { timeout: 5_000 }, () => {
  it("replaces a real pack's validated sidecars through the production file boundary", async () => {
    const directory = await mkdtemp(join(tmpdir(), "tabiya-tablebase-census-"));
    directories.push(directory);
    const file = join(directory, "lucena.json");
    const original = JSON.parse(await readFile(resolvePackPath("lucena-bridge-convert"), "utf8")) as DrillPackDefinition;
    const current = withDerivedRequires({ ...original, provenance: { ...original.provenance, corpusEvidence: { state: "unsourced" as const } } });
    await writeFile(file, JSON.stringify(current), "utf8");
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
