import { readFileSync } from "node:fs";

import type { StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { matchesStructuralExpression } from "./structure.js";

interface ShapeDocument {
  readonly id: string;
  readonly version: string;
  readonly trigger: StructuralExpression;
  readonly plans: readonly { readonly id: string; readonly success: { readonly signature: StructuralExpression | null } }[];
}

function shape(id: string): ShapeDocument {
  return JSON.parse(readFileSync(new URL(`../../../content/shapes/${id}.json`, import.meta.url), "utf8")) as ShapeDocument;
}

function countKind(value: unknown, kind: string): number {
  if (value === null || typeof value !== "object") return 0;
  if (Array.isArray(value)) return value.reduce((total, child) => total + countKind(child, kind), 0);
  return Object.entries(value).reduce((total, [key, child]) => total + (key === "kind" && child === kind ? 1 : countKind(child, kind)), 0);
}

describe("predicate wave 2 official content", () => {
  it("makes same- and opposite-shade bishop entries mutually exclusive", () => {
    const same = shape("bishop-good-bad"), opposite = shape("opposite-coloured-bishops");
    const positions = [
      ["2b1k3/7p/8/P7/8/8/7P/2B1K3 w - - 0 1", false, true],
      ["4kb2/7p/8/P7/8/8/7P/2B1K3 w - - 0 1", true, false],
      ["4kb2/7p/8/P7/8/8/7P/2BBK3 w - - 0 1", false, false],
    ] as const;
    for (const [fen, sameExpected, oppositeExpected] of positions) {
      expect(matchesStructuralExpression(fen, same.trigger)).toBe(sameExpected);
      expect(matchesStructuralExpression(fen, opposite.trigger)).toBe(oppositeExpected);
      expect(matchesStructuralExpression(fen, same.trigger) && matchesStructuralExpression(fen, opposite.trigger)).toBe(false);
    }
    expect(same.version).toBe("0.2.1");
    expect(opposite.version).toBe("0.3.0");
  });

  it("widens the Black fianchetto across files without claiming the White mirror", () => {
    const entry = shape("fianchetto-g7");
    expect(matchesStructuralExpression("4k3/6b1/6p1/8/8/8/8/4K3 w - - 0 1", entry.trigger)).toBe(true);
    expect(matchesStructuralExpression("4k3/1b6/1p6/8/8/8/8/4K3 w - - 0 1", entry.trigger)).toBe(true);
    // A colour mirror needs its own entry because plan-side labels are entry-wide.
    expect(matchesStructuralExpression("4k3/8/8/8/8/6P1/6B1/4K3 w - - 0 1", entry.trigger)).toBe(false);
    for (const id of ["black-long-diagonal-pressure", "white-h-file-lever"]) {
      const signature = entry.plans.find((plan) => plan.id === id)?.success.signature;
      expect(signature).not.toBeNull();
      expect(countKind(signature, "mirrored")).toBe(1);
      expect(matchesStructuralExpression("4k3/1b6/1p6/8/8/8/8/4K3 w - - 0 1", signature!)).toBe(true);
    }
  });

  it("collapses the authored fans into bounded quantifiers", () => {
    const opposite = shape("opposite-coloured-bishops");
    expect(countKind(opposite.trigger, "quantified")).toBe(1);
    expect(countKind(opposite.trigger, "passed_pawn")).toBe(1);
    const wings = opposite.plans.find((plan) => plan.id === "white-two-wings-two-passers")!.success.signature;
    expect(countKind(wings, "quantified")).toBe(2);
    expect(countKind(wings, "passed_pawn")).toBe(2);
    const weakness = shape("queenless-middlegame").plans.find((plan) => plan.id === "white-first-weakness")!.success.signature;
    expect(countKind(weakness, "quantified")).toBe(2);
    expect(countKind(weakness, "isolated_pawn") + countKind(weakness, "doubled_pawn")).toBe(2);
  });

  it("gives the opposition plan a tempo-qualified signature only", () => {
    const entry = shape("pawn-opposition-key-squares");
    const take = entry.plans.find((plan) => plan.id === "white-take-the-opposition")!.success.signature!;
    expect(matchesStructuralExpression("8/8/8/4K3/8/4k3/8/8 b - - 0 1", take)).toBe(true);
    expect(matchesStructuralExpression("8/8/8/4K3/8/4k3/8/8 w - - 0 1", take)).toBe(false);
    expect(entry.version).toBe("0.2.1");
    expect(entry.plans.filter((plan) => ["white-triangulate", "black-shoulder-and-race"].includes(plan.id)).every((plan) => plan.success.signature === null)).toBe(true);
    expect(entry.plans.find((plan) => plan.id === "black-hold-the-opposition")?.success.signature).not.toBeNull();
  });
});
