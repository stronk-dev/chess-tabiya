// rfc/skills.md acceptance criteria 1, 3, 8, 10, 11 and 13 over the runtime contract.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import type { EvidenceGrounding } from "./evidence-contract.js";
import { exactLegalMoves } from "./legal-moves.js";
import {
  deriveConceptMarks,
  EMPTY_CATEGORY_REASONS,
  SKILL_CATEGORIES,
  SKILLS_SURFACE_FORBIDDEN,
  validateValenceRegister,
  VALENCE_ADMISSIBLE_GROUNDINGS,
  VALENCE_REFUSED_GROUNDINGS,
  type AdmittedSkillLeaf,
  type SkillDecision,
} from "./skills-contract.js";
import { castledWing, STANDARD_START_FEN } from "./style-atoms.js";

function groundingOf(id: string, version: number): EvidenceGrounding | undefined {
  return PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => candidate.id === id && candidate.version === version)?.grounding;
}

function declaration(overrides: Record<string, unknown> = {}) {
  return {
    projectionId: "theory.shapes.firing", projectionVersion: 1, authorityId: "theory.shapes.firing", authorityVersion: 1,
    declarer: "fixture-owner", declaredAt: "2026-09-24", scope: "fixture", basis: "authored_claim", note: "fixture declaration", ...overrides,
  };
}

describe("criterion 1 — the valence register exists and admits only the five groundings", () => {
  it("validates the shipped register (zero declarations: Open question 1 is unruled)", () => {
    const register = JSON.parse(readFileSync(new URL("../../../content/valence/register.json", import.meta.url), "utf8")) as unknown;
    expect(validateValenceRegister(register, groundingOf)).toEqual([]);
    expect((register as { declarations: unknown[] }).declarations).toEqual([]);
  });

  it("refuses a basis outside the five and accepts each admissible basis name", () => {
    for (const refused of VALENCE_REFUSED_GROUNDINGS) {
      const issues = validateValenceRegister({ formatVersion: "tabiya.valence-register.v1", declarations: [declaration({ basis: refused })] }, groundingOf);
      expect(issues.map((issue) => issue.code)).toContain("VALENCE_BASIS_INADMISSIBLE");
    }
    expect(VALENCE_ADMISSIBLE_GROUNDINGS).toEqual(["position_rules", "authored_claim", "cited_theory", "tablebase_exact", "bounded_search"]);
    expect(validateValenceRegister({ formatVersion: "tabiya.valence-register.v1", declarations: [declaration()] }, groundingOf)).toEqual([]);
  });
});

describe("criterion 3 — no leaf carries a valence from an inadmissible grounding", () => {
  it("is red when the authority resolves to a refused grounding through the compiled catalogue", () => {
    const refused = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => projection.grounding === "recorded_run")!;
    const issues = validateValenceRegister({ formatVersion: "tabiya.valence-register.v1", declarations: [declaration({ authorityId: refused.id, authorityVersion: refused.version })] }, groundingOf);
    expect(issues.map((issue) => issue.code)).toContain("VALENCE_AUTHORITY_GROUNDING_REFUSED");
    const missing = validateValenceRegister({ formatVersion: "tabiya.valence-register.v1", declarations: [declaration({ authorityId: "no.such.projection" })] }, groundingOf);
    expect(missing.map((issue) => issue.code)).toContain("VALENCE_AUTHORITY_UNDECLARED");
  });
});

const CASTLE_LEAF: AdmittedSkillLeaf = {
  leafId: "fixture-castle",
  label: "fixture castling",
  category: "fundamentals",
  authority: { projectionId: "fixture.projection", projectionVersion: 1, declarer: "fixture-owner", declaredAt: "2026-09-24" },
  exhibits: (fen, move) => castledWing(fen, move) !== null,
};

const CASTLE_FEN = "4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1";
function decision(runId: string, nodeId: string, fen: string, move: string, at: string): SkillDecision {
  return { runId, branchId: `${runId}-main`, nodeId, beforeFen: fen, moveUci: move, legalMoves: exactLegalMoves(fen).map((legal) => legal.uci), occurredAt: at };
}

describe("criterion 8 — a concept mark is earned exactly once", () => {
  it("dedupes repetition inside a run and across runs", () => {
    const marks = deriveConceptMarks([
      decision("run-2", "n2", CASTLE_FEN, "e1g1", "2026-09-02T00:00:00.000Z"),
      decision("run-1", "n1", CASTLE_FEN, "e1g1", "2026-09-01T00:00:00.000Z"),
      decision("run-1", "n3", CASTLE_FEN, "e1c1", "2026-09-01T00:01:00.000Z"),
    ], [CASTLE_LEAF]);
    expect(marks).toHaveLength(1);
    expect(marks[0]).toMatchObject({ kind: "first_concept:fixture-castle", sentence: "First fixture castling recorded.", link: { runId: "run-1", nodeId: "n1" } });
  });
});

describe("criterion 10 — a mark requires a declinable alternative", () => {
  it("earns nothing when every legal move exhibits the event, or when the played move does not", () => {
    const everyMoveExhibits: AdmittedSkillLeaf = { ...CASTLE_LEAF, exhibits: () => true };
    expect(deriveConceptMarks([decision("run-1", "n1", STANDARD_START_FEN, "e2e4", "2026-09-01T00:00:00.000Z")], [everyMoveExhibits])).toEqual([]);
    expect(deriveConceptMarks([decision("run-1", "n1", CASTLE_FEN, "e1f1", "2026-09-01T00:00:00.000Z")], [CASTLE_LEAF])).toEqual([]);
  });
});

describe("criterion 11 — every mark reopens its evidence", () => {
  it("links the exact node whose played edge exhibits the leaf's event", () => {
    const decisions = [decision("run-1", "n7", CASTLE_FEN, "e1c1", "2026-09-01T00:00:00.000Z")];
    const [mark] = deriveConceptMarks(decisions, [CASTLE_LEAF]);
    const linked = decisions.find((item) => item.nodeId === mark!.link.nodeId)!;
    expect(CASTLE_LEAF.exhibits(linked.beforeFen, linked.moveUci)).toBe(true);
  });
});

describe("criteria 12 and 13 — no ratio, and empty categories state their reason", () => {
  it("names five categories and gives Openings and Strategy a reason string that carries no count", () => {
    expect(SKILL_CATEGORIES).toEqual(["fundamentals", "openings", "tactics", "strategy", "endgame"]);
    for (const category of ["openings", "strategy"] as const) {
      const reason = EMPTY_CATEGORY_REASONS[category]!;
      expect(reason.length).toBeGreaterThan(20);
      expect(reason).not.toMatch(/\d/u);
      expect(reason).not.toMatch(SKILLS_SURFACE_FORBIDDEN);
    }
    expect("3 / 36").toMatch(SKILLS_SURFACE_FORBIDDEN);
    expect("50%").toMatch(SKILLS_SURFACE_FORBIDDEN);
  });
});
