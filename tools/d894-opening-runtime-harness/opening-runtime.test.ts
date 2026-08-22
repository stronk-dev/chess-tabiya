// DISPOSABLE research harness — D894/Wave C C3. Not production adapter code.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { transposeKey } from "@chess-tabiya/runtime";
import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parsePgn } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { describe, expect, it } from "vitest";

import { importedPopulation } from "../research-chess/populations.js";

const SOURCE = process.env.TABIYA_OPENINGS_DIR;
const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const LETTERS = ["a", "b", "c", "d", "e"] as const;

interface OpeningRow {
  readonly eco: string;
  readonly name: string;
  readonly pgn: string;
  readonly key: string;
  readonly pathKeys: readonly string[];
  readonly depth: number;
  readonly source: string;
}

function sourceRows(): readonly OpeningRow[] {
  if (!SOURCE) throw new TypeError("Set TABIYA_OPENINGS_DIR to the pinned five-file source directory");
  const result: OpeningRow[] = [];
  for (const letter of LETTERS) {
    const lines = readFileSync(join(SOURCE, `tabiya-openings-${letter}.tsv`), "utf8").replaceAll("\r\n", "\n").split("\n");
    if (lines.shift() !== "eco\tname\tpgn") throw new TypeError(`Unexpected ${letter}.tsv header`);
    for (const [index, line] of lines.filter(Boolean).entries()) {
      const [eco, name, ...pgnField] = line.split("\t");
      if (!eco || !name || pgnField.length !== 1 || !pgnField[0]) throw new TypeError(`Malformed ${letter}.tsv row ${index + 2}`);
      const games = parsePgn(pgnField[0]);
      if (games.length !== 1) throw new TypeError(`Expected one game at ${letter}.tsv:${index + 2}`);
      const pos = Chess.default();
      const pathKeys: string[] = [];
      let depth = 0;
      for (const node of games[0]!.moves.mainline()) {
        const move = parseSan(pos, node.san);
        if (move === undefined || !pos.isLegal(move)) throw new TypeError(`Illegal PGN at ${letter}.tsv:${index + 2}`);
        pos.play(move);
        pathKeys.push(transposeKey(makeFen(pos.toSetup())));
        depth += 1;
      }
      if (depth === 0) throw new TypeError(`Empty opening at ${letter}.tsv:${index + 2}`);
      result.push({ eco, name, pgn: pgnField[0], key: transposeKey(makeFen(pos.toSetup())), pathKeys, depth, source: `${letter}.tsv:${index + 2}` });
    }
  }
  return result;
}

function index(rows: readonly OpeningRow[]): ReadonlyMap<string, readonly OpeningRow[]> {
  const result = new Map<string, OpeningRow[]>();
  for (const row of rows) {
    const found = result.get(row.key) ?? [];
    found.push(row);
    result.set(row.key, found);
  }
  return result;
}

function prefixIndex(rows: readonly OpeningRow[]): ReadonlyMap<string, readonly OpeningRow[]> {
  const result = new Map<string, OpeningRow[]>();
  for (const row of rows) {
    for (const key of new Set(row.pathKeys)) {
      const found = result.get(key) ?? [];
      found.push(row);
      result.set(key, found);
    }
  }
  return result;
}

function bucket(ply: number): string {
  if (ply <= 4) return "1–4";
  if (ply <= 8) return "5–8";
  if (ply <= 12) return "9–12";
  if (ply <= 16) return "13–16";
  if (ply <= 20) return "17–20";
  if (ply <= 30) return "21–30";
  return "31+";
}

function pct(part: number, whole: number): string {
  return whole === 0 ? "n/a" : `${(100 * part / whole).toFixed(1)}%`;
}

describe("D894 exact runtime opening identity", () => {
  it("measures the pinned source and exact runtime reach without carrying stale names", () => {
    const rows = sourceRows();
    const byKey = index(rows);
    const byPrefixKey = prefixIndex(rows);
    const ambiguous = [...byKey.values()].filter((values) => values.length > 1);
    const distinctNameAmbiguity = ambiguous.filter((values) => new Set(values.map((row) => `${row.eco}\0${row.name}`)).size > 1);
    const imported = importedPopulation();
    const buckets = new Map<string, { nodes: number; named: number; catalogue: number; staleCarry: number }>();
    let gamesWithMatch = 0;
    let gamesWithStaleCarry = 0;
    const deepest: number[] = [];
    let exactNodes = 0;
    let catalogueNodes = 0;
    let totalNodes = 0;
    let noMatchExample: string | undefined;
    for (const path of imported.paths) {
      let lastMatch = 0;
      let matched = false;
      let stale = false;
      for (const [offset, node] of path.entries()) {
        const ply = offset + 1;
        const key = transposeKey(node.fen);
        const values = byKey.get(key) ?? [];
        const catalogueValues = byPrefixKey.get(key) ?? [];
        const cell = buckets.get(bucket(ply)) ?? { nodes: 0, named: 0, catalogue: 0, staleCarry: 0 };
        cell.nodes += 1;
        totalNodes += 1;
        if (catalogueValues.length > 0) {
          cell.catalogue += 1;
          catalogueNodes += 1;
        }
        if (values.length > 0) {
          cell.named += 1;
          exactNodes += 1;
          lastMatch = ply;
          matched = true;
        } else {
          if (lastMatch > 0) {
            cell.staleCarry += 1;
            stale = true;
          }
          noMatchExample ??= `${node.id}:${node.uci}`;
        }
        buckets.set(bucket(ply), cell);
      }
      if (matched) {
        gamesWithMatch += 1;
        deepest.push(lastMatch);
      }
      if (stale) gamesWithStaleCarry += 1;
    }
    deepest.sort((a, b) => a - b);
    const medianDeepest = deepest[Math.floor((deepest.length - 1) / 2)] ?? 0;
    const p90Deepest = deepest[Math.floor((deepest.length - 1) * .9)] ?? 0;
    const lines = [
      "# D894 exact runtime opening-identity output",
      "",
      `Pinned source rows: ${rows.length.toLocaleString("en-US")}; unique exact transposition keys: ${byKey.size.toLocaleString("en-US")}.`,
      `Keys with multiple rows: ${ambiguous.length.toLocaleString("en-US")}; keys with multiple ECO/name identities: ${distinctNameAmbiguity.length.toLocaleString("en-US")}; maximum rows/key: ${Math.max(...ambiguous.map((values) => values.length), 1)}.`,
      `Unique catalogue path keys (all prefixes): ${byPrefixKey.size.toLocaleString("en-US")}; maximum descendant opening identities at one path key: ${Math.max(...[...byPrefixKey.values()].map((values) => values.length))}.`,
      "",
      `Imported games: ${imported.paths.length}; games with ≥1 exact match: ${gamesWithMatch} (${pct(gamesWithMatch, imported.paths.length)}); games where carrying the last name would later become stale: ${gamesWithStaleCarry} (${pct(gamesWithStaleCarry, imported.paths.length)}).`,
      `Exact matched nodes: ${exactNodes}/${totalNodes} (${pct(exactNodes, totalNodes)}); deepest exact match median/p90 ply among matched games: ${medianDeepest}/${p90Deepest}.`,
      `Nodes occurring anywhere on a catalogue path: ${catalogueNodes}/${totalNodes} (${pct(catalogueNodes, totalNodes)}). Catalogue occurrence is not a unique opening identity.`,
      "",
      "| ply band | nodes | named endpoint | anywhere on catalogue path | prior named endpoint but current absence (stale carry exposure) |",
      "|---|---:|---:|---:|---:|",
    ];
    for (const name of ["1–4", "5–8", "9–12", "13–16", "17–20", "21–30", "31+"]) {
      const value = buckets.get(name) ?? { nodes: 0, named: 0, catalogue: 0, staleCarry: 0 };
      lines.push(`| ${name} | ${value.nodes} | ${value.named} (${pct(value.named, value.nodes)}) | ${value.catalogue} (${pct(value.catalogue, value.nodes)}) | ${value.staleCarry} (${pct(value.staleCarry, value.nodes)}) |`);
    }
    lines.push("", `First exact-abstention witness: ${noMatchExample ?? "none"}.`, "",
      "Interpretation: the pinned catalogue gives each named terminal position one identity, so an exact node lookup returns that identity or honest absence. Prefix membership only proves that the position occurs on at least one catalogue path and may have many descendant names. A game summary may separately select the deepest named endpoint reached. Carrying the last name onto later positions is measured stale exposure, not runtime applicability.", "");
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(rows).toHaveLength(3_810);
    // Pre-registered ambiguity was refuted: the pinned source's named endpoints are unique.
    expect(byKey.size).toBe(rows.length);
    expect(distinctNameAmbiguity).toHaveLength(0);
    expect(byPrefixKey.size).toBeGreaterThan(byKey.size);
    expect(noMatchExample).toBeDefined();
    expect(gamesWithMatch).toBeGreaterThan(0);
    expect(gamesWithStaleCarry).toBeGreaterThan(0);
  });
});
