import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { countOpeningCapacity, openingCapacityArtifact, openingCapacityReceipt, openingObservations, summarizeOpeningCounts } from "./opening-capacity.js";
import { digest, gameDecisions } from "./population.js";
import manifest from "./manifest.json";

const reference = manifest.humanReference;
const body = Array.from({ length: 12 }, (_, i) => `${i * 2 + 1}. Nf3 Nf6 ${i * 2 + 2}. Ng1 Ng8`).join(" ");
function game(id = "one", white = 1400, black = white, changes: Record<string, string> = {}, moves = body) {
  const headers = { Event: "Rated Blitz game", Site: id, White: "Private Å name", Black: "Other name",
    WhiteElo: String(white), BlackElo: String(black), Result: "1/2-1/2", ...changes };
  return `${Object.entries(headers).map(([key, value]) => `[${key} "${value}"]`).join("\n")}\n\n${moves} 1/2-1/2\n\n`;
}
async function* chunks(source: string, size = 65536) {
  const bytes = Buffer.from(source);
  for (let offset = 0; offset < bytes.length; offset += size) yield bytes.subarray(offset, offset + size);
}

describe("D3409 full-source, exact-FEN, distinct-game opening capacity", () => {
  it("counts all nine opening decisions, not the single minimum-hash reference decision", () => {
    const block = game();
    const rows = openingObservations(block, reference);
    expect(rows).toHaveLength(9);
    expect(gameDecisions(block, reference).filter((row) => row.window === "opening-8-16")).toHaveLength(1);
    expect(new Set(rows.map((row) => row.fen)).size).toBe(9); // Clocks/turn survive repeated knight configurations.
    for (const row of rows) {
      expect(row.gameHash).toBe(digest(block));
      expect(row.referenceHalf).toBe(createHash("sha256").update(block).digest()[0]! % 2);
      expect(row.fen.split(" ")).toHaveLength(6);
    }
  });
  it("takes the rating of the moving seat, never both ratings for the same decision", () => {
    const rows = openingObservations(game("mixed", 1000, 2200), reference);
    expect(rows.filter((row) => row.band === "1000")).toHaveLength(4);
    expect(rows.filter((row) => row.band === "2200")).toHaveLength(5);
    expect(rows).toHaveLength(9);
  });
  it.each([
    { Event: "Casual Blitz game" }, { WhiteTitle: "BOT" }, { BlackTitle: "BOT" },
    { Result: "*" }, { Result: "1-0" }, { Variant: "Chess960" }, { WhiteElo: "?" },
  ])("shares the full-reference eligibility refusal: %j", (changes) => {
    expect(openingObservations(game("bad", 1400, 1400, changes), reference)).toEqual([]);
  });
  it("refuses a legal opening when a later move makes the complete game illegal", () => {
    expect(() => openingObservations(game("illegal-tail", 1400, 1400, {}, `${body} 25. Qh5`), reference)).toThrow();
  });
  it("exact source hashes, UTF-8/CRLF chunk boundaries and final-block exclusion are stable", async () => {
    const source = (game("first") + game("second") + game("last-complete-but-prefix-cut")).replaceAll("\n", "\r\n");
    const result = await countOpeningCapacity(chunks(source), reference);
    expect(await countOpeningCapacity(chunks(source, 1), reference)).toEqual(result);
    expect(result.decompressedSha256).toBe(digest(source));
    expect(result.completeBlocks).toBe(2);
    expect(result.eligibleOpeningGames).toBe(2);
    expect(result.table).toHaveLength(9);
    expect(summarizeOpeningCounts(result.table, reference).observationsByBand.find((row) => row.band === "1400")?.observations).toBe(18);
  });
  it("duplicate raw-byte games cannot increase distinct-game capacity", async () => {
    const result = await countOpeningCapacity(chunks(game() + game() + game("partial")), reference);
    expect(result.duplicateGames).toBe(1);
    expect(result.eligibleOpeningGames).toBe(1);
    expect(result.table.reduce((sum, row) => sum + row.observations.reduce((a, b) => a + b, 0), 0)).toBe(9);
  });
  it("insufficiency does not choose fewer FENs, strip clocks or merge rating bands", () => {
    const counts = Array.from({ length: 128 }, (_, index) => ({
      fen: `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - ${index} 4`,
      observations: [50, 50, 50, 50, 50, 50, 50, 50],
    })).sort((a, b) => a.fen < b.fen ? -1 : 1);
    const enough = summarizeOpeningCounts(counts, reference);
    expect(enough.qualifyingExactFens).toBe(128);
    expect(enough.state).toBe("capacity_sufficient_not_selected");
    expect(enough.positionsSelected).toBe(0);
    expect(enough.modelQueries).toBe(0);
    counts[0]!.observations[7] = 49;
    const insufficient = summarizeOpeningCounts(counts, reference);
    expect(insufficient.qualifyingExactFens).toBe(127);
    expect(insufficient.state).toBe("capacity_insufficient");
    expect(insufficient.humanLikeAllowed).toBe(false);
  });
  it("refuses unsorted, duplicate, noncanonical, zero, fractional or incomplete count inventories", () => {
    const fen = "7k/7p/8/8/8/8/8/K7 w - - 0 1";
    for (const table of [
      [{ fen, observations: [1, 0] }], [{ fen, observations: Array(8).fill(0) }],
      [{ fen, observations: [0.5, ...Array(7).fill(0)] }],
      [{ fen: fen.replace(" 0 1", " 00 1"), observations: Array(8).fill(1) }],
      [{ fen, observations: Array(8).fill(1) }, { fen, observations: Array(8).fill(1) }],
    ]) expect(() => summarizeOpeningCounts(table, reference)).toThrow();
  });
  it("source drift cannot publish or overwrite an existing artifact", async () => {
    const result = await countOpeningCapacity(chunks(game() + game("partial")), reference);
    expect(() => openingCapacityArtifact(result)).toThrow("source digest mismatch");
    const directory = mkdtempSync(join(tmpdir(), "tabiya-opening-negative-"));
    try {
      const runner = join(directory, "stream.mjs"), output = join(directory, "opening.json");
      execFileSync("./node_modules/.bin/esbuild", ["tools/d2236-bot-calibration-verdict-contract/opening-capacity-stream.ts", "--bundle", "--platform=node", "--format=esm", "--alias:chessops=./apps/server/node_modules/chessops/dist/esm", `--outfile=${runner}`, "--log-level=warning"]);
      writeFileSync(output, "EXISTING_CAPACITY_SENTINEL");
      const child = spawnSync(process.execPath, [runner, output], { input: game() + game("partial"), encoding: "utf8" });
      expect(child.status).not.toBe(0);
      expect(readFileSync(output, "utf8")).toBe("EXISTING_CAPACITY_SENTINEL");
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
  it("independent report refuses changed identity before trusting any summary", () => {
    expect(() => openingCapacityReceipt({ schema: "forged" } as never)).toThrow("identity mismatch");
  });
  it.each(["inventory", "summary", "manifest", "instrument", "source", "census"])("cached report independently refuses a mutated %s", async (mode) => {
    // Synthetic parser fixture, not a claim to have sampled this source: the real command's
    // checksum refusal is tested above and never accepts this substituted source identity.
    const result = await countOpeningCapacity(chunks(game() + game("partial")), reference);
    const artifact = JSON.parse(JSON.stringify(openingCapacityArtifact({ ...result, decompressedSha256: reference.decompressedSha256 })));
    expect(openingCapacityReceipt(artifact).state).toBe("capacity_insufficient");
    if (mode === "inventory") artifact.table[0].observations[0]++;
    if (mode === "summary") artifact.summary.qualifyingExactFens = 128;
    if (mode === "manifest") artifact.manifestDigest = digest("other manifest");
    if (mode === "instrument") artifact.instrumentDigest = digest("other instrument");
    if (mode === "source") artifact.source.compressedSha256 = digest("other source");
    if (mode === "census") artifact.completeBlocks++;
    expect(() => openingCapacityReceipt(artifact)).toThrow();
  });
});
