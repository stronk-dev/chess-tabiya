// DISPOSABLE research harness — D1717. Not production code.
import { readFileSync } from "node:fs";
import { between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { classifyPhase, matchesStructuralFeature, structuralReading } from "@chess-tabiya/runtime";
import { authoredRows, importedRows } from "../research-chess/populations.js";

const BASELINE = new URL("./baseline.json", import.meta.url).pathname;
type Color = "white" | "black";
type Form = "direct" | "distant";

function current(fen: string, color: Color, form: Form): boolean {
  return matchesStructuralFeature(fen, { kind: "king_opposition", color, form });
}

function unobstructed(fen: string, color: Color, form: Form): boolean {
  if (!current(fen, color, form)) return false;
  const setup = parseFen(fen).unwrap();
  const position = Chess.fromSetup(setup).unwrap();
  const own = position.board.kingOf(color);
  const enemy = position.board.kingOf(color === "white" ? "black" : "white");
  return own !== undefined && enemy !== undefined && between(own, enemy).intersect(position.board.occupied).isEmpty();
}

function phaseCounts() {
  return { opening: { current: 0, unobstructed: 0, blocked: 0 }, middlegame: { current: 0, unobstructed: 0, blocked: 0 }, endgame: { current: 0, unobstructed: 0, blocked: 0 }, unclear: { current: 0, unobstructed: 0, blocked: 0 } };
}

function population(rows: ReturnType<typeof authoredRows>) {
  const phases = phaseCounts();
  const unique = new Set<string>();
  let currentCount = 0;
  let unobstructedCount = 0;
  let blocked = 0;
  for (const row of rows) {
    unique.add(row.fen);
    const phase = classifyPhase(row.fen).phase;
    const observations = structuralReading(row.fen).features.filter((value) => value.kind === "king_opposition");
    for (const observation of observations) {
      currentCount += 1;
      phases[phase].current += 1;
      if (unobstructed(row.fen, observation.color, observation.form)) {
        unobstructedCount += 1;
        phases[phase].unobstructed += 1;
      } else {
        blocked += 1;
        phases[phase].blocked += 1;
      }
    }
  }
  return { decisions: rows.length, uniquePositions: unique.size, current: currentCount, unobstructed: unobstructedCount, blocked, phases };
}

describe("D1717 king opposition boundary", () => {
  it("requires empty intervening squares for direct and distant forms", () => {
    const direct = "8/8/4k3/8/4K3/8/8/8 b - - 0 1";
    const directBlocked = "8/8/4k3/4P3/4K3/8/8/8 b - - 0 1";
    const distant = "8/4k3/8/8/8/8/8/4K3 b - - 0 1";
    const distantBlocked = "8/4k3/8/8/4P3/8/8/4K3 b - - 0 1";
    expect(current(direct, "white", "direct")).toBe(true);
    expect(unobstructed(direct, "white", "direct")).toBe(true);
    expect(current(directBlocked, "white", "direct")).toBe(true);
    expect(unobstructed(directBlocked, "white", "direct")).toBe(false);
    expect(current(distant, "white", "distant")).toBe(true);
    expect(unobstructed(distant, "white", "distant")).toBe(true);
    expect(current(distantBlocked, "white", "distant")).toBe(true);
    expect(unobstructed(distantBlocked, "white", "distant")).toBe(false);
  });

  it("preserves side-to-move, color and alignment boundaries", () => {
    const vertical = "8/8/4k3/8/4K3/8/8/8 b - - 0 1";
    const horizontal = "8/8/8/8/2K1k3/8/8/8 b - - 0 1";
    const misaligned = "8/8/5k2/8/4K3/8/8/8 b - - 0 1";
    expect(unobstructed(vertical, "white", "direct")).toBe(true);
    expect(unobstructed(vertical.replace(" b ", " w "), "black", "direct")).toBe(true);
    expect(unobstructed(vertical.replace(" b ", " w "), "white", "direct")).toBe(false);
    expect(unobstructed(horizontal, "white", "direct")).toBe(true);
    expect(unobstructed(misaligned, "white", "direct")).toBe(false);
  });

  it("retains a frozen population receipt", () => {
    const value = JSON.parse(readFileSync(BASELINE, "utf8")) as { readonly schema: string; readonly populations: Record<string, { readonly decisions: number; readonly current: number; readonly unobstructed: number; readonly blocked: number; readonly phases: Record<string, { readonly current: number; readonly unobstructed: number; readonly blocked: number }> }> };
    expect(value.schema).toBe("tabiya.research.d1717-king-opposition.v1");
    expect(value.populations.authored?.decisions).toBe(754);
    expect(value.populations.imported?.decisions).toBe(579);
    for (const item of Object.values(value.populations)) {
      expect(item.unobstructed + item.blocked).toBe(item.current);
      expect(Object.values(item.phases).reduce((sum, phase) => sum + phase.current, 0)).toBe(item.current);
      expect(Object.values(item.phases).reduce((sum, phase) => sum + phase.unobstructed, 0)).toBe(item.unobstructed);
      expect(Object.values(item.phases).reduce((sum, phase) => sum + phase.blocked, 0)).toBe(item.blocked);
    }
    expect(value.populations.authored!.current + value.populations.imported!.current).toBe(90);
    expect(value.populations.authored!.unobstructed + value.populations.imported!.unobstructed).toBe(61);
  });

  it("recomputes the fixed populations when explicitly requested", () => {
    if (process.env.D1717_CENSUS !== "1") return;
    console.log(JSON.stringify({ schema: "tabiya.research.d1717-king-opposition.v1", populations: { authored: population(authoredRows()), imported: population(importedRows()) } }));
  });
});
