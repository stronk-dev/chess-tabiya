import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import manifest from "./manifest.json";
import { assertReference, digest, gameDecisions, selectReference, Smallest } from "./population.js";
import { populationReceipt } from "./receipt.js";

const reference = manifest.humanReference;
const moves = Array.from({ length: 13 }, (_, i) => `${i * 2 + 1}. Nf3 Nf6 ${i * 2 + 2}. Ng1 Ng8`).join(" ");
function game(id = "one", band = 1400, changes: Readonly<Record<string, string>> = {}, body = moves): string {
  const headers = { Event: "Rated Blitz game", Site: id, White: "Private Å name", Black: "Another name", WhiteElo: String(band), BlackElo: String(band), Result: "1/2-1/2", ...changes };
  return `${Object.entries(headers).map(([key, value]) => `[${key} "${value}"]`).join("\n")}\n\n${body} 1/2-1/2\n\n`;
}
async function* chunks(source: string, size = 65_536) {
  const bytes = Buffer.from(source);
  for (let offset = 0; offset < bytes.length; offset += size) yield bytes.subarray(offset, offset + size);
}

describe("D3406 frozen human-reference population", () => {
  it("retains exactly the smallest keys independent of arrival order", () => {
    for (const order of [["9", "2", "5", "1", "8", "3", "0"], ["0", "3", "8", "1", "5", "2", "9"]]) {
      const selected = new Smallest<{ selectionHash: string }>(3);
      order.forEach((selectionHash) => selected.add({ selectionHash }));
      expect(selected.rows().map((row) => row.selectionHash)).toEqual(["0", "1", "2"]);
    }
    expect(() => new Smallest(0)).toThrow();
  });
  it("selects one decision per entire game/window, with exact raw-byte hashes and fixed halves", () => {
    const block = game();
    const rows = gameDecisions(block, reference);
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((row) => row.window)).size).toBe(3);
    for (const row of rows) {
      expect(row.gameHash).toBe(digest(block));
      expect(row.referenceHalf).toBe(createHash("sha256").update(block).digest()[0]! % 2);
      expect(row.selectionHash).toBe(`sha256:${createHash("sha256").update(block).update("\0").update(String(row.ply)).digest("hex")}`);
      const window = reference.windows.find((entry) => entry.id === row.window)!;
      const all = [];
      for (let ply = window.minPly; ply <= Math.min(window.maxPly ?? 52, 52); ply += 1) {
        all.push(`sha256:${createHash("sha256").update(block).update("\0").update(String(ply)).digest("hex")}`);
      }
      expect(row.selectionHash).toBe(all.sort()[0]);
      expect(Object.keys(row).sort()).toEqual(["band", "fen", "gameHash", "moveUci", "ply", "referenceHalf", "selectionHash", "window"]);
    }
  });
  it("does not manufacture two independent band decisions from the same game/window", () => {
    const rows = gameDecisions(game("different-seats", 1000, { BlackElo: "2200" }), reference);
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => ["1000", "2200"].includes(row.band))).toBe(true);
  });
  it.each([
    { Event: "Casual Blitz game" }, { Event: "Rated Rapid game" }, { Event: "Rated Bullet game" },
    { Result: "*" }, { Result: "unknown" }, { Variant: "Chess960" }, { Variant: "From Position" },
    { Result: "1-0" },
    { WhiteTitle: "BOT" }, { BlackTitle: "BOT" }, { WhiteElo: "?" }, { BlackElo: "NaN" },
  ])("refuses ineligible source game %j", (headers) => {
    expect(gameDecisions(game("ineligible", 1400, headers), reference)).toEqual([]);
  });
  it("replays the whole game before admitting any otherwise eligible prefix", () => {
    expect(() => gameDecisions(game("illegal", 1400, {}, `${moves} 27. e5`), reference)).toThrow("illegal PGN replay");
  });
  it("keeps castling in the application's exact king-takes-rook identity", () => {
    const castleReference = { ...reference, windows: [{ id: "castling", minPly: 9, maxPly: 9 }] };
    const rows = gameDecisions(game("castle", 1400, {}, "1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5 5. O-O"), castleReference);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.moveUci).toBe("e1h1");
  });
  it("preserves identity across chunks, CRLF and UTF-8 boundaries and drops the trailing block", async () => {
    const source = (game("first") + game("second") + game("partial")).replaceAll("\n", "\r\n");
    const complete = await selectReference(chunks(source), reference);
    expect(await selectReference(chunks(source, 1), reference)).toEqual(complete);
    expect(complete.decompressedSha256).toBe(digest(source));
    expect(complete.completeBlocks).toBe(2);
    expect(complete.rows).toHaveLength(6);
    expect(complete.rows.some((row) => row.gameHash === digest(game("partial").replaceAll("\n", "\r\n")))).toBe(false);
    expect(() => assertReference(complete, digest(source))).toThrow("incomplete");
    expect(() => assertReference(complete, digest("other"))).toThrow("digest mismatch");
  });
  it("deduplicates source games without laundering repeated records into independent observations", async () => {
    const result = await selectReference(chunks(game() + game() + game("partial")), reference);
    expect(result.duplicateGames).toBe(1);
    expect(result.rows).toHaveLength(3);
  });
  it("the actual extractor refuses source drift without replacing an existing population", () => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-calibration-negative-"));
    try {
      const runner = join(directory, "extract.mjs");
      const output = join(directory, "population.json");
      execFileSync("./node_modules/.bin/esbuild", ["tools/d2236-bot-calibration-verdict-contract/extract-stream.ts", "--bundle", "--platform=node", "--format=esm", "--alias:chessops=./apps/server/node_modules/chessops/dist/esm", `--outfile=${runner}`, "--log-level=warning"]);
      writeFileSync(output, "EXISTING_POPULATION_SENTINEL");
      const run = spawnSync(process.execPath, [runner, output], { input: game() + game("partial"), encoding: "utf8" });
      expect(run.status).not.toBe(0);
      expect(run.stderr).toContain("decompressed source digest mismatch");
      expect(readFileSync(output, "utf8")).toBe("EXISTING_POPULATION_SENTINEL");
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it("fills the actual 12-cell/24,000-decision manifest, not a smaller toy production population", async () => {
    const source = reference.bands.flatMap((band) => Array.from({ length: reference.decisionsPerBandWindow }, (_, i) => game(`${band.id}-${i}`, band.min))).join("") + game("partial");
    const result = await selectReference(chunks(source), reference);
    assertReference(result, digest(source));
    expect(result.rows).toHaveLength(24_000);
    expect(result.capacity).toHaveLength(12);
    expect(result.capacity.every((row) => row.selected === 2000)).toBe(true);
    expect(new Set(result.rows.map((row) => row.referenceHalf))).toEqual(new Set([0, 1]));
    expect(() => assertReference({ ...result, rows: [...result.rows, result.rows[0]!] }, digest(source))).toThrow("duplicate game/window");
    // Synthetic receipt controls exercise its independent row checks, not a real-source claim.
    const artifact = {
      ...result, decompressedSha256: reference.decompressedSha256,
      schema: "tabiya.research.bot-human-reference-population.v1", source: reference,
      manifestDigest: digest(JSON.stringify(manifest)), populationDigest: digest(JSON.stringify(result.rows)),
      state: "selected_not_evaluated",
    };
    expect(populationReceipt(artifact).claims.humanLikeLabelAllowed).toBe(false);
    expect(() => populationReceipt({ ...artifact, state: "calibrated" })).toThrow("identity mismatch");
    expect(() => populationReceipt({ ...artifact, manifestDigest: digest("other") })).toThrow("identity mismatch");
    expect(() => populationReceipt({ ...artifact, decompressedSha256: digest("other") })).toThrow("digest mismatch");
    for (const mutation of [
      { referenceHalf: 2 }, { ply: 1 }, { band: "1600" }, { moveUci: "a1a8" },
      { fen: "invalid" }, { sentence: "invented assessment" },
    ]) {
      const changedRows = [{ ...result.rows[0]!, ...mutation }, ...result.rows.slice(1)];
      expect(() => populationReceipt({ ...artifact, rows: changedRows, populationDigest: digest(JSON.stringify(changedRows)) })).toThrow();
    }
  }, 30_000);
});
