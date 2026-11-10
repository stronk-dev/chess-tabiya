import { describe, expect, it } from "vitest";
import { sha256 } from "./canonical.js";
import { validateManifest } from "./ledger-validation.js";
import { TABLEBASE_RATIONALE, type TablebaseAnswer, type TablebasePayload } from "./syzygy.js";
function answer(fen: string, category: string): TablebaseAnswer {
  const payload: TablebasePayload = { checkmate: false, stalemate: false, insufficient_material: false, dtz: 1, precise_dtz: 1, dtm: null, category };
  const retrievedAt = new Date(Date.parse("2026-08-14T00:00:00.000Z") + Number.parseInt(sha256(fen).slice(7, 13), 16)).toISOString();
  return { payload, source: { sourceId: "fixture-tablebase", retrievedAt, origin: { kind: "http", url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, status: 200, sha256: `sha256:${"1".repeat(64)}`, bytes: 1, etag: null }, licence: { basis: "no-rights-asserted", spdx: null, noticeText: null, rationale: TABLEBASE_RATIONALE } } };
}


describe("sourcing manifest provenance", () => {
  it("refuses the deterministic timestamp shape used by manufactured tablebase provenance", () => {
    const fen = "8/8/8/8/8/8/4k3/4K3 w - - 0 1";
    const offset = Number.parseInt(sha256(fen).slice(7, 15), 16) % 86_400_000;
    const issues: any[] = [];
    validateManifest({
      schema: "tabiya.sourcing.manifest.v1",
      entries: [{
        ...answer(fen, "draw").source,
        retrievedAt: new Date(Date.UTC(2026, 7, 14) + offset).toISOString(),
      }],
    }, issues);
    expect(issues.map((issue) => issue.code)).toContain("MANIFEST_PROVENANCE_SYNTHETIC");
  });
});
