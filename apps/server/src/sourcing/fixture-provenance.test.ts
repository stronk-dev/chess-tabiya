import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { EXPLORER_RATIONALE, explorerUrl, fixtureAvailableExplorer } from "./explorer.js";
import { readCapturedHttpFixture } from "./fixture-provenance.js";
import { fixtureTablebaseQuery, TABLEBASE_FIXTURE_FEN } from "./syzygy.js";

const EXPLORER_QUERY = {
  fen: "rnbqkbnr/pp2pppp/2p5/3pP3/3P4/8/PPP2PPP/RNBQKBNR b KQkq - 0 3",
  ratings: [1400, 1600, 1800] as const,
  speeds: ["blitz", "rapid"] as const,
  since: "2024-01",
  until: "2026-07",
};

describe("captured HTTP fixture provenance", () => {
  it("binds both production fixture readers to their exact captured requests", async () => {
    const tablebase = await fixtureTablebaseQuery(TABLEBASE_FIXTURE_FEN);
    expect(tablebase.source.origin).toMatchObject({ kind: "http", bytes: 6330, sha256: "sha256:029042f1316840cb986c5df1179e2556ddeb71d0bf1c88e0456b54b926615189" });
    const explorer = await fixtureAvailableExplorer(EXPLORER_QUERY);
    expect(explorer.source.origin).toMatchObject({ kind: "http", bytes: 1626, sha256: "sha256:3bfa79e548ddba72c0bdb7a5c37f44be61cab5cee3dd6fbf131d0d23dec56f05" });
  });

  it("refuses request substitution instead of relabelling one body", async () => {
    await expect(fixtureTablebaseQuery("8/8/8/8/8/2k5/2p5/2K5 w - - 0 1")).rejects.toMatchObject({ code: "FIXTURE_REQUEST_MISMATCH" });
    await expect(fixtureAvailableExplorer({ ...EXPLORER_QUERY, since: "2025-01" })).rejects.toMatchObject({ code: "FIXTURE_REQUEST_MISMATCH" });
  });

  it("refuses a one-byte body mutation against the sidecar identity", async () => {
    const directory = await mkdtemp(resolve(tmpdir(), "tabiya-fixture-provenance-"));
    const fixturePath = resolve(directory, "explorer-response.json");
    const provenancePath = resolve(directory, "explorer-response.provenance.json");
    const fixture = await readFile(resolve("apps/server/src/sourcing/fixtures/explorer-response.json"));
    const provenance = JSON.parse(await readFile(resolve("apps/server/src/sourcing/fixtures/explorer-response.provenance.json"), "utf8"));
    provenance.fixture = "explorer-response.json";
    fixture[0] = fixture[0] === 123 ? 91 : 123;
    await writeFile(fixturePath, fixture);
    await writeFile(provenancePath, JSON.stringify(provenance));
    await expect(readCapturedHttpFixture({
      fixturePath,
      provenancePath,
      expectedUrl: explorerUrl(EXPLORER_QUERY),
      licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: EXPLORER_RATIONALE },
    })).rejects.toMatchObject({ code: "FIXTURE_PROVENANCE_INVALID" });
  });
});
