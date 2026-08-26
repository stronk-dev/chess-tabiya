// DISPOSABLE research harness — D1734. Not production code.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Color } from "chessops/types";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { pawnConnectivityReading, pawnIslandSemanticEvents } from "@chess-tabiya/runtime";
import { positionFromFen } from "../../packages/runtime/src/chess.js";
import { authoredRows, importedRows, playedFen, type ResearchRow } from "../research-chess/populations.js";

const BASELINE = resolve(import.meta.dirname, "baseline.json");
const COLORS = Object.freeze(["white", "black"] as const);

function topology(fen: string, color: Color) {
  return pawnConnectivityReading(fen).colors.find((entry) => entry.color === color)!.islands.map((island) => Object.freeze({
    files: Object.freeze([...island.files]),
    squares: Object.freeze([...island.squares]),
  }));
}

function partition(value: ReturnType<typeof topology>): string {
  return value.map((island) => island.files.join("")).join("|");
}

function census(rows: readonly ResearchRow[]) {
  let currentEvents = 0, currentPreserved = 0, unchanged = 0, countChanged = 0, topologyChangedSameCount = 0;
  let movingSideChanges = 0, opponentSideChanges = 0;
  for (const row of rows) {
    const events = pawnIslandSemanticEvents(row.parentFen, row.uci, row.fen);
    currentEvents += events.length;
    currentPreserved += events.filter((event) => event.sign === "preserved").length;
    const position = positionFromFen(row.parentFen);
    const parsed = parseUci(row.uci)!;
    const mover = "from" in parsed ? position.board.get(parsed.from) : undefined;
    for (const color of COLORS) {
      const before = topology(row.parentFen, color), after = topology(row.fen, color);
      if (partition(before) === partition(after)) { unchanged += 1; continue; }
      if (before.length === after.length) topologyChangedSameCount += 1;
      else countChanged += 1;
      if (mover?.color === color) movingSideChanges += 1;
      else opponentSideChanges += 1;
    }
  }
  return Object.freeze({ decisions: rows.length, currentEvents, currentPreserved, unchanged, countChanged, topologyChangedSameCount, movingSideChanges, opponentSideChanges });
}

describe("D1734 exact pawn-island topology", () => {
  it("separates rank-only pawn motion from island topology", () => {
    const before = "4k3/8/8/8/8/8/PP1P4/4K3 w - - 0 1";
    const after = playedFen(before, "b2b4");
    expect(partition(topology(before, "white"))).toBe("ab|d");
    expect(partition(topology(after, "white"))).toBe("ab|d");
    expect(pawnIslandSemanticEvents(before, "b2b4", after).find((event) => event.operands.color === "white")!.sign).toBe("preserved");
  });

  it("finds a count-preserving partition change the v1 payload cannot express", () => {
    const before = "4k3/8/8/8/8/2n5/PP1P4/4K3 w - - 0 1";
    const after = playedFen(before, "b2c3");
    expect(partition(topology(before, "white"))).toBe("ab|d");
    expect(partition(topology(after, "white"))).toBe("a|cd");
    expect(pawnIslandSemanticEvents(before, "b2c3", after).find((event) => event.operands.color === "white")).toMatchObject({ sign: "preserved", operands: { before: 2, after: 2 } });
  });

  it("retains exact files and pawns for every island", () => {
    expect(topology("4k3/8/8/8/8/8/PP1P4/4K3 w - - 0 1", "white")).toEqual([
      { files: ["a", "b"], squares: ["a2", "b2"] },
      { files: ["d"], squares: ["d2"] },
    ]);
  });
});

describe("D1734 fixed-population reach", () => {
  it("retains the frozen receipt", () => {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
    expect(baseline.schema).toBe("tabiya.research.d1734-pawn-island-identity.v1");
    expect(baseline.authored).toEqual(census(authoredRows()));
    expect(baseline.imported).toEqual(census(importedRows()));
  }, 120_000);

  it("recomputes the receipt when explicitly requested", () => {
    if (process.env.D1734_CENSUS !== "1") return;
    console.log(JSON.stringify({ schema: "tabiya.research.d1734-pawn-island-identity.v1", authored: census(authoredRows()), imported: census(importedRows()) }, null, 2));
  }, 120_000);
});
