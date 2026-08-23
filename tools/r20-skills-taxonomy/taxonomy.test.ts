// DISPOSABLE research instrument — platform-alignment R20. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CANDIDATE_CREDIT_RULES,
  MEASURED_HABIT_ROWS,
  SKILL_CATEGORIES,
  SKILL_EVIDENCE_ROWS,
  TIER_RULE,
} from "./registry.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;

describe("R20 grounded skills taxonomy desk arm", () => {
  it("closes every semantic event into one explicit non-LLM disposition", () => {
    expect(SKILL_EVIDENCE_ROWS.length).toBeGreaterThan(40);
    expect(new Set(SKILL_EVIDENCE_ROWS.map((row) => row.projectionId)).size).toBe(SKILL_EVIDENCE_ROWS.length);
    expect(SKILL_EVIDENCE_ROWS.every((row) => row.categories.length > 0 && row.reason.length > 40)).toBe(true);
    expect(SKILL_CATEGORIES.every((category) => SKILL_EVIDENCE_ROWS.some((row) => row.categories.includes(category)) || category === "openings")).toBe(true);
  });

  it("admits candidate credits only with complete declinable-opportunity rules", () => {
    const admitted = new Set(SKILL_EVIDENCE_ROWS.filter((row) => row.disposition === "credit_candidate").map((row) => row.projectionId));
    expect(CANDIDATE_CREDIT_RULES.length).toBe(admitted.size);
    for (const rule of CANDIDATE_CREDIT_RULES) {
      expect(rule.projections.some((projection) => admitted.has(projection))).toBe(true);
      expect(rule.opportunity).toMatch(/At least one legal candidate/u);
      expect(rule.occurrence.length).toBeGreaterThan(30);
      expect(rule.floorStatus).toBe("unmeasured");
      expect(rule.floorGames).toBeNull();
      expect(rule.state).toBe("measurement_blocked");
      expect(rule.tierRule).toBe(TIER_RULE.id);
      expect(rule.moduleConsumers.length).toBeGreaterThan(0);
      expect(rule.moduleConsumers.every((consumer) => !consumer.includes("precommit") && consumer !== "module.blunder_prevention" && consumer !== "module.threat_radar")).toBe(true);
    }
  });

  it("keeps measured opening habits out of skill tiers until production projections exist", () => {
    expect(MEASURED_HABIT_ROWS.map((row) => [row.floorGames, row.rho200])).toEqual([[25, 0.974], [100, 0.935]]);
    expect(MEASURED_HABIT_ROWS.every((row) => row.productionProjection === null)).toBe(true);
  });

  it("binds the desk result to the accepted learner-module census without inventing completion", () => {
    const rfc = readFileSync(new URL("../../rfc/learner-modules.md", import.meta.url), "utf8");
    expect(rfc).toMatch(/Total\s+declared: \*\*181\*\*; compiled at landing: \*\*179\*\*; declared-awaiting: \*\*2\*\*/u);
    expect(rfc).toContain("minus the two ◇ rows = **179** compiled");
  });

  it("emits the auditable desk-arm table", () => {
    const byDisposition = new Map<string, number>();
    for (const row of SKILL_EVIDENCE_ROWS) byDisposition.set(row.disposition, (byDisposition.get(row.disposition) ?? 0) + 1);
    const lines = [
      "# R20 grounded skills-taxonomy output",
      "",
      `Semantic event projections classified: ${SKILL_EVIDENCE_ROWS.length}. ${[...byDisposition].map(([key, value]) => `${key} ${value}`).join("; ")}.`,
      `Candidate credit rules: ${CANDIDATE_CREDIT_RULES.length}; production-ready credit rules: 0 (all lack a longitudinal floor/reference measurement).`,
      "Learner-module join: 181 declared eligibility rows, 179 intended to compile at module landing and two grade rows awaiting. Skill aggregation is retrospective and therefore consumes only post-commit/Review evidence; pre-commit modules do not receive a learner profile.",
      "",
      "| category | candidate credit | source projections | opportunity rule | floor | state |",
      "|---|---|---|---|---|---|",
      ...CANDIDATE_CREDIT_RULES.map((row) => `| ${row.category} | \`${row.id}\` | ${row.projections.map((id) => `\`${id}@1\``).join(" + ")} | ${row.opportunity} | unmeasured | ${row.state} |`),
      "| openings | no skill credit admitted | opening surprisal (25 games, rho .974) and family entropy (100, rho .935) are measured habits but have no production projection | exact current/deepest opening identity is applicability, not move quality | measured short-session floors only | research_only |",
      "| strategy | no skill credit admitted | signed structure/pawn/king/activity events | occurrence has no intrinsic valence; an outcome join is required | unmeasured | habit_only |",
      "",
      "Tier convention candidate: insufficient below a per-metric floor; established after the floor; above_reference only when the 95% lower bound exceeds the pinned reference median; distinctive only above its 75th percentile. The words are declared conventions over visible rate/interval/baseline, never an LLM verdict.",
      "",
      "The desk arm therefore closes the vocabulary but does not authorize a progression surface: zero candidate credits have the required cross-time-control/longitudinal floor, and the two measured opening habits lack production projections. That is the measurement arm, not a UI TODO.",
      "",
      "## Complete semantic-event disposition table",
      "",
      "| projection | category | disposition | reason |",
      "|---|---|---|---|",
      ...SKILL_EVIDENCE_ROWS.map((row) => `| \`${row.projectionId}@1\` | ${row.categories.join(", ")} | ${row.disposition} | ${row.reason} |`),
      "",
    ];
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");
    expect(lines.join("\n")).not.toMatch(/raw count as credit|streak as credit/u);
  });
});
