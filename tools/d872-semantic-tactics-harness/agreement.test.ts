// DISPOSABLE research harness — D872/Wave C external disagreement arm. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { ResearchRow, ResearchTriple } from "../research-chess/populations.js";
import {
  type ResearchQuad,
  checkZwischenzugSequence,
  clearanceSequence,
  defenderRelocatedSequence,
  defenderRemovedSequence,
  interferenceSequence,
  overloadExploitationSequence,
  rowsFromMoves,
} from "./sequence.test.js";
import {
  attractedPieceSequence,
  defenderDutyDisplacedSequence,
  squareVacatedForSliderSequence,
} from "./semantic-splits.js";

const SOURCE = process.env.TABIYA_LICHESS_PUZZLES;
const OUTPUT = new URL("./agreement-output.md", import.meta.url).pathname;
const CONTROL_MODULUS = 20;

const FAMILIES = [
  "capturingDefender",
  "deflection",
  "attraction",
  "clearance",
  "interference",
  "intermezzo",
  "overloading",
] as const;
type Family = (typeof FAMILIES)[number];
const SPLITS = ["deflection", "attraction", "clearance"] as const;
type Split = (typeof SPLITS)[number];

interface Puzzle {
  readonly id: string;
  readonly fen: string;
  readonly moves: readonly string[];
  readonly themes: ReadonlySet<string>;
  readonly control: boolean;
}

interface Cell {
  tagged: number;
  taggedDetected: number;
  control: number;
  controlDetected: number;
  misses: string[];
  controlHits: string[];
}

function pct(part: number, whole: number): string {
  return whole === 0 ? "n/a" : `${(100 * part / whole).toFixed(1)}%`;
}

function population(): readonly Puzzle[] {
  if (!SOURCE) throw new TypeError("Set TABIYA_LICHESS_PUZZLES to the official CSV path");
  const lines = readFileSync(SOURCE, "utf8").split("\n").slice(1).filter(Boolean);
  const result: Puzzle[] = [];
  for (const [index, line] of lines.entries()) {
    const fields = line.split(",");
    if (fields.length !== 11) {
      if (index !== lines.length - 1) throw new TypeError(`Unexpected CSV field count before tail: ${fields.length}`);
      continue;
    }
    const themes = new Set(fields[7]!.split(" "));
    const control = index % CONTROL_MODULUS === 0;
    if (!control && !FAMILIES.some((family) => themes.has(family))) continue;
    result.push({ id: fields[0]!, fen: fields[1]!, moves: fields[2]!.split(" "), themes, control });
  }
  return result;
}

function triples(rows: readonly ResearchRow[]): readonly ResearchTriple[] {
  const result: ResearchTriple[] = [];
  // Lichess move 0 is the opponent setup move; solution-side turns start at index 1.
  for (let index = 1; index + 2 < rows.length; index += 2) {
    result.push([rows[index]!, rows[index + 1]!, rows[index + 2]!]);
  }
  return result;
}

function quads(rows: readonly ResearchRow[]): readonly ResearchQuad[] {
  const result: ResearchQuad[] = [];
  // An intermezzo interrupts the recapture begun by the setup/opponent-side edge.
  for (let index = 0; index + 3 < rows.length; index += 2) {
    result.push([rows[index]!, rows[index + 1]!, rows[index + 2]!, rows[index + 3]!]);
  }
  return result;
}

function attractionWindows(rows: readonly ResearchRow[]): readonly (readonly ResearchRow[])[] {
  const result: ResearchRow[][] = [];
  for (let index = 1; index + 2 < rows.length; index += 2) result.push(rows.slice(index, index + 5));
  return result;
}

function detected(family: Family, rows: readonly ResearchRow[]): boolean {
  if (family === "intermezzo") return quads(rows).some(checkZwischenzugSequence);
  const windows = triples(rows);
  if (family === "capturingDefender") return windows.some(defenderRemovedSequence);
  if (family === "deflection" || family === "attraction") return windows.some(defenderRelocatedSequence);
  if (family === "clearance") return windows.some(clearanceSequence);
  if (family === "interference") return windows.some(interferenceSequence);
  return windows.some(overloadExploitationSequence);
}

function splitDetected(family: Split, rows: readonly ResearchRow[]): boolean {
  if (family === "attraction") return attractionWindows(rows).some(attractedPieceSequence);
  const windows = triples(rows);
  if (family === "deflection") return windows.some(defenderDutyDisplacedSequence);
  return windows.some(squareVacatedForSliderSequence);
}

describe("D872 exact-event disagreement with Lichess themes", () => {
  it("measures tag sensitivity and a deterministic tag-negative control separately", () => {
    const puzzles = population();
    const cells = new Map<Family, Cell>(FAMILIES.map((family) => [family, {
      tagged: 0,
      taggedDetected: 0,
      control: 0,
      controlDetected: 0,
      misses: [],
      controlHits: [],
    }]));
    const splitCells = new Map<Split, Cell>(SPLITS.map((family) => [family, {
      tagged: 0,
      taggedDetected: 0,
      control: 0,
      controlDetected: 0,
      misses: [],
      controlHits: [],
    }]));
    let rejected = 0;
    for (const puzzle of puzzles) {
      let rows: readonly ResearchRow[];
      try { rows = rowsFromMoves(puzzle.fen, puzzle.moves); }
      catch { rejected += 1; continue; }
      for (const family of FAMILIES) {
        const tagged = puzzle.themes.has(family);
        if (!tagged && !puzzle.control) continue;
        const fires = detected(family, rows);
        const cell = cells.get(family)!;
        if (tagged) {
          cell.tagged += 1;
          if (fires) cell.taggedDetected += 1;
          else if (cell.misses.length < 8) cell.misses.push(puzzle.id);
        } else if (puzzle.control) {
          cell.control += 1;
          if (fires) {
            cell.controlDetected += 1;
            if (cell.controlHits.length < 8) cell.controlHits.push(puzzle.id);
          }
        }
      }
      for (const family of SPLITS) {
        const tagged = puzzle.themes.has(family);
        if (!tagged && !puzzle.control) continue;
        const fires = splitDetected(family, rows);
        const cell = splitCells.get(family)!;
        if (tagged) {
          cell.tagged += 1;
          if (fires) cell.taggedDetected += 1;
          else if (cell.misses.length < 8) cell.misses.push(puzzle.id);
        } else if (puzzle.control) {
          cell.control += 1;
          if (fires) {
            cell.controlDetected += 1;
            if (cell.controlHits.length < 8) cell.controlHits.push(puzzle.id);
          }
        }
      }
    }

    const lines = [
      "# D872 external disagreement output",
      "",
      `Evaluated every positive tag row plus a deterministic 1/${CONTROL_MODULUS} row-index sample of tag-negative controls from the bounded 250,587-record official prefix. Rejected illegal/unparseable selected rows: ${rejected}.`,
      "",
      "Tag sensitivity and control firing are disagreement measurements, not precision/recall against chess truth. The exact detectors are intentionally narrower than broad source themes.",
      "",
      "| source theme | tagged rows | exact event also found | tag sensitivity | sampled tag-negative controls | exact event found in controls |",
      "|---|---:|---:|---:|---:|---:|",
    ];
    for (const family of FAMILIES) {
      const cell = cells.get(family)!;
      lines.push(`| \`${family}\` | ${cell.tagged.toLocaleString("en-US")} | ${cell.taggedDetected.toLocaleString("en-US")} | ${pct(cell.taggedDetected, cell.tagged)} | ${cell.control.toLocaleString("en-US")} | ${cell.controlDetected.toLocaleString("en-US")} (${pct(cell.controlDetected, cell.control)}) |`);
    }
    lines.push(
      "",
      "## Separately named exact contracts",
      "",
      "These replace the three alias hypotheses above; they do not overwrite the retained-duty or opened-ray events.",
      "",
      "| source theme | separate exact contract | tagged rows | exact event also found | tag sensitivity | exact event in controls |",
      "|---|---|---:|---:|---:|---:|",
    );
    const splitNames: Record<Split, string> = {
      deflection: "defender duty displaced, then target captured",
      attraction: "heavy piece captures bait; king is checked or queen/rook later captured",
      clearance: "square vacated for later slider move",
    };
    for (const family of SPLITS) {
      const cell = splitCells.get(family)!;
      lines.push(`| \`${family}\` | ${splitNames[family]} | ${cell.tagged.toLocaleString("en-US")} | ${cell.taggedDetected.toLocaleString("en-US")} | ${pct(cell.taggedDetected, cell.tagged)} | ${cell.controlDetected.toLocaleString("en-US")}/${cell.control.toLocaleString("en-US")} (${pct(cell.controlDetected, cell.control)}) |`);
    }
    lines.push("", "## First disagreements", "");
    for (const family of FAMILIES) {
      const cell = cells.get(family)!;
      lines.push(`- \`${family}\` tag misses: ${cell.misses.join(", ") || "none"}; control firings: ${cell.controlHits.join(", ") || "none"}.`);
    }
    lines.push(
      "",
      "Interpretation: low agreement does not license broadening an exact predicate until it matches a theme. It routes fixture review: determine whether the source theme names another bounded fact, whether the exact event occurs at a different parity/horizon, or whether the source label is noisy.",
      "",
    );
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(rejected).toBe(0);
    expect(cells.get("capturingDefender")!.tagged).toBeGreaterThan(1_000);
    expect(cells.get("overloading")!.tagged).toBe(0);
    for (const family of FAMILIES) expect(cells.get(family)!.control).toBeGreaterThan(10_000);
  }, 3_600_000);
});
