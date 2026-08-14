import type { StructuralObservation } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { renderStructuralObservation } from "./structural-sentences.js";

const observations: readonly StructuralObservation[] = [
  { kind: "pawn_safe_square", color: "black", squares: ["b5"], detail: { square: "b5", color: "black", safe: false, basis: "current_pawn_files", pushAttackers: [{ square: "a4", pushes: 1 }], captureAttackers: [] } },
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
];

describe("rung-0 structural sentences", () => {
  it("renders all twelve without valence, permanence, or attack-balance conclusions", () => {
    const banned = /\b(weak|strong|good|bad|better|worse|advantage|winning|losing|should|must|best|worst|mistake|blunder|punish|wins|loses|never|balance|defended)\b/i;
    const rendered = observations.map(renderStructuralObservation);
    expect(rendered).toHaveLength(12);
    for (const sentence of rendered) expect(sentence).not.toMatch(banned);
    expect(rendered[0]).toMatch(/while the current/i);
    expect(rendered[1]).toMatch(/Tabiya's strict outpost detector/i);
    expect(rendered[9]).toMatch(/directly attack/i);
    expect(rendered[10]).toMatch(/attack-reachable/i);
  });
});
