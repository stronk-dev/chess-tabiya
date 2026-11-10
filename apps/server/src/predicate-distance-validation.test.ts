import type { StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";
import { structuralIssues } from "./pack-validation.js";

describe("predicate distance validation", () => {
  it("refuses impossible distance queries and warns on the two deprecated forms", () => {
    const expression = (feature: unknown) => ({ kind: "feature", feature }) as StructuralExpression;
    expect(structuralIssues(expression({ kind: "piece_count", color: "white", role: "king", basis: "count", comparison: "equal", count: 2 })).map((issue) => issue.code)).toContain("PIECE_COUNT_OUT_OF_RANGE");
    expect(structuralIssues(expression({ kind: "piece_distance", color: "white", role: "rook", target: { kind: "square", square: "a1" }, comparison: "atLeast", count: 3 })).map((issue) => issue.code)).toContain("PIECE_DISTANCE_OUT_OF_RANGE");
    expect(structuralIssues(expression({ kind: "piece_distance", color: "white", role: "king", target: { kind: "piece", color: "white", role: "king" }, comparison: "equal", count: 0 })).map((issue) => issue.code)).toContain("PIECE_DISTANCE_SELF_TARGET");
    expect(structuralIssues(expression({ kind: "piece_distance", color: "white", role: "pawn", target: { kind: "square", square: "a8" }, comparison: "equal", count: 1 })).map((issue) => issue.code)).toContain("PIECE_DISTANCE_ROLE_UNSUPPORTED");
    expect(structuralIssues(expression({ kind: "pawn_count", color: "white", basis: "count", comparison: "equal", count: 1 })).map((issue) => issue.code)).toContain("PAWN_COUNT_DEPRECATED");
    expect(structuralIssues(expression({ kind: "piece_reach_count", color: "white", role: "bishop", scope: "every", comparison: "atLeast", count: 0 })).map((issue) => issue.code)).toContain("PIECE_REACH_SCOPE_EVERY_DEPRECATED");
  });
});
