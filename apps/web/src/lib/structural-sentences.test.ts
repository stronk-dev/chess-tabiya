import type { StructuralObservation } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { renderStructuralExpressionSpec, renderStructuralObservation } from "./structural-sentences.js";

const observations: readonly StructuralObservation[] = [
  { kind: "pawn_safe_square", color: "black", squares: ["b5"], detail: { square: "b5", color: "black", safe: false, basis: "maximal_pawn_reach@1", pushAttackers: [{ square: "a4", pushes: 1 }], captureAttackers: [] } },
  { kind: "outpost", color: "white", squares: ["e5"], provenanceNote: "Tabiya's strict outpost detector." },
  { kind: "backward_pawn", color: "black", file: "c", squares: [] },
  { kind: "isolated_pawn", color: "white", file: "d", squares: [] },
  { kind: "doubled_pawn", color: "white", file: "c", squares: [] },
  { kind: "passed_pawn", color: "white", squares: ["e6"] },
  { kind: "open_file", file: "e", squares: [] },
  { kind: "half_open_file", color: "white", file: "c", squares: [] },
  { kind: "line_blockers", squares: ["a1", "h8"], count: 1 },
  { kind: "direct_attack_count", color: "white", squares: ["f7"], count: 2 },
  { kind: "piece_reach_count", color: "white", role: "bishop", squares: ["g2"], count: 5 },
  { kind: "named_structure", squares: [], provenanceNote: "Tabiya catalogue convention: Carlsbad." },
  { kind: "bishop_on_shade", color: "white", shade: "light", squares: ["d3"] },
  { kind: "pawn_count", color: "white", count: 7, squares: [] },
  { kind: "king_opposition", color: "white", form: "direct", squares: ["e5", "e3"] },
];

describe("rung-0 structural sentences", () => {
  it("renders all fifteen without valence, permanence, or attack-balance conclusions", () => {
    const banned = /\b(weak|strong|good|bad|better|worse|advantage|winning|losing|should|must|best|worst|mistake|blunder|punish|wins|loses|never|balance|defended)\b/i;
    const rendered = observations.map(renderStructuralObservation);
    expect(rendered).toHaveLength(15);
    for (const sentence of rendered) expect(sentence).not.toMatch(banned);
    expect(rendered[0]).toMatch(/maximal pawn-reach/i);
    expect(rendered[1]).toMatch(/Tabiya's strict outpost detector/i);
    expect(rendered[9]).toMatch(/directly attack/i);
    expect(rendered[10]).toMatch(/attack-reachable/i);
    expect(rendered[12]).toBe("White's bishop on d3 stands on a light square.");
    expect(rendered[13]).toBe("White has 7 pawns.");
    expect(rendered[14]).toBe("White has the direct opposition: kings on e5 and e3 with Black to move.");
  });

  it("discloses capture migration without claiming the future capture exists", () => {
    const sentence = renderStructuralObservation({
      kind: "pawn_safe_square",
      color: "black",
      squares: ["b5"],
      detail: { square: "b5", color: "black", safe: false, basis: "maximal_pawn_reach@1", pushAttackers: [], captureAttackers: [{ square: "d2", captures: 1 }] },
    });
    expect(sentence).toContain("after at least 1 capture");
    expect(sentence).toContain("capture availability and move legality are not asserted");
  });
});

describe("structural expression sentences", () => {
  it("renders every expression branch without inventing a verdict", () => {
    const values = [
      { kind: "all", of: [{ kind: "feature", feature: { kind: "open_file", file: "c" } }, { kind: "pieceOnSquare", square: "d4", piece: { color: "white", role: "pawn" } }] },
      { kind: "any", of: [{ kind: "feature", feature: { kind: "named_structure", id: "carlsbad" } }, { kind: "feature", feature: { kind: "isolated_pawn", color: "white", file: "d" } }] },
      { kind: "not", of: { kind: "pieceOnSquare", square: "e4", piece: null } },
      { kind: "feature", feature: { kind: "pawn_count", color: "white", basis: "difference", comparison: "atLeast", count: 1 } },
      { kind: "feature", feature: { kind: "pawn_count", color: "white", basis: "difference", comparison: "atLeast", count: -1 } },
      { kind: "feature", feature: { kind: "bishop_on_shade", color: "black", shade: "dark" } },
      { kind: "feature", feature: { kind: "king_opposition", color: "black", form: "distant" } },
      { kind: "mirrored", axis: "files", of: { kind: "feature", feature: { kind: "open_file", file: "a" } } },
      { kind: "mirrored", axis: "colors", of: { kind: "feature", feature: { kind: "passed_pawn", color: "white", square: "a5" } } },
      { kind: "mirrored", axis: "both", of: { kind: "pieceOnSquare", square: "a1", piece: null } },
      { kind: "quantified", quantifier: "some", over: { files: { from: "a", to: "h" } }, feature: { kind: "isolated_pawn", color: "black" } },
      { kind: "quantified", quantifier: "every", over: { squares: { files: { from: "a", to: "h" }, ranks: { from: 4, to: 7 } } }, feature: { kind: "piece", piece: null } },
    ] as const;
    const rendered = values.map(renderStructuralExpressionSpec);
    expect(rendered[0]).toContain(" and ");
    expect(rendered[1]).toContain(" or ");
    expect(rendered[2]).toMatch(/^not:/);
    expect(rendered[3]).toBe("white has at least 1 more pawn than black");
    expect(rendered[4]).toBe("white has at most 1 fewer pawn than black");
    expect(rendered[10]).toBe("on some file from a to h, black has an isolated pawn");
    expect(rendered[11]).toBe("on every square from a4 to h7, the square is empty");
    for (const sentence of rendered) {
      expect(sentence).not.toMatch(/\b(best|good|bad|advantage|should|up|ahead|majority)\b/i);
    }
  });
});
