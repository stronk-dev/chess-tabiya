// DISPOSABLE research harness — D1722. Not production code.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "@chess-tabiya/runtime";

type SeedKind = "shipped_identity" | "assigned_to_existing_meaning";

interface SeedRow {
  readonly ref: `${string}@${number}`;
  readonly kind: SeedKind;
  readonly witnesses: readonly string[];
}

/** Reviewed seed population for the proposed semantic-convention registry. */
const INITIAL_CONVENTION_MEMBERS: readonly SeedRow[] = Object.freeze([
  { ref: "back_rank_susceptible@1", kind: "shipped_identity", witnesses: ["rules.tactic.reading.back_rank@1"] },
  { ref: "backward-pawn-legacy@1", kind: "assigned_to_existing_meaning", witnesses: ["rules.structural.predicate.backward_pawn@1", "rules.structural.reading.backward_pawn@1", "rules.structural.event.backward_pawn@1"] },
  { ref: "candidate-feature-vector@1", kind: "assigned_to_existing_meaning", witnesses: ["derived.opponent.candidate_feature_vector@1"] },
  { ref: "candidate-majority@1", kind: "shipped_identity", witnesses: ["rules.pawn.reading.candidate_majority@1"] },
  { ref: "chessops-king-takes-rook@1", kind: "shipped_identity", witnesses: ["packages/runtime/src/legal-moves.ts"] },
  { ref: "defence-duty@1", kind: "shipped_identity", witnesses: ["rules.tactic.reading.defender_duty_set@1"] },
  { ref: "development@1", kind: "shipped_identity", witnesses: ["rules.phase.development@1"] },
  { ref: "discovered-latency@1", kind: "assigned_to_existing_meaning", witnesses: ["rules.tactic.reading.discovered_latency@1"] },
  { ref: "double-attack@1", kind: "assigned_to_existing_meaning", witnesses: ["rules.tactic.event.double_attack@1"] },
  { ref: "evidence-reference-resolution@1", kind: "assigned_to_existing_meaning", witnesses: ["run.record.evidence_ref_resolution@1"] },
  { ref: "fork-survival@1", kind: "assigned_to_existing_meaning", witnesses: ["derived.tactic.fork_survives_reply@1"] },
  { ref: "grade-convention@1", kind: "shipped_identity", witnesses: ["derived.grade.move_quality@1"] },
  { ref: "king-landing-square@1", kind: "shipped_identity", witnesses: ["packages/runtime/src/legal-moves.ts"] },
  { ref: "king-opposition-blocker-blind@1", kind: "assigned_to_existing_meaning", witnesses: ["rules.structural.predicate.king_opposition@1", "rules.structural.reading.king_opposition@1", "rules.structural.event.king_opposition@1"] },
  { ref: "king-shelter@1", kind: "shipped_identity", witnesses: ["rules.king.reading.zone_state@1"] },
  { ref: "king-zone@1", kind: "shipped_identity", witnesses: ["rules.king.reading.zone_state@1"] },
  { ref: "legal-exchange@1", kind: "shipped_identity", witnesses: ["rules.exchange.predicate.legal_exchange@1"] },
  { ref: "local-non-losing@1", kind: "shipped_identity", witnesses: ["rules.mobility.reading.piece_destinations@1"] },
  { ref: "loose-piece@1", kind: "assigned_to_existing_meaning", witnesses: ["rules.tactic.reading.loose_piece@1"] },
  { ref: "mate-proof@1", kind: "shipped_identity", witnesses: ["rules.tactic.consequence.forced_mate_after_move@1"] },
  { ref: "material-role-signature@1", kind: "shipped_identity", witnesses: ["derived.material.reading.role_signature@1"] },
  { ref: "maximal_pawn_reach@1", kind: "shipped_identity", witnesses: ["rules.structural.predicate.pawn_safe_square@1", "rules.structural.predicate.outpost@1"] },
  { ref: "mover-turn-ep-cleared@1", kind: "shipped_identity", witnesses: ["derived.tactic.defender_exposure@1"] },
  { ref: "observed-window@1", kind: "shipped_identity", witnesses: ["derived.tactic.square_clearance_observed@1"] },
  { ref: "opening-deepest-reached@1", kind: "assigned_to_existing_meaning", witnesses: ["derived.opening.deepest_reached@1"] },
  { ref: "overload-conflict@1", kind: "shipped_identity", witnesses: ["derived.tactic.overloaded_defender_response_conflict@1"] },
  { ref: "pawn-relations@1", kind: "assigned_to_existing_meaning", witnesses: ["rules.pawn.reading.contacts@1"] },
  { ref: "pressure-line@1", kind: "shipped_identity", witnesses: ["derived.pawn.sequence.harassment_pressure@1"] },
  { ref: "race-arrival@1", kind: "shipped_identity", witnesses: ["derived.pawn.event.transitions@1"] },
  { ref: "ray-classification@1", kind: "assigned_to_existing_meaning", witnesses: ["rules.tactic.reading.ray_classification@1"] },
  { ref: "space@1", kind: "shipped_identity", witnesses: ["rules.structural.reading.space@1"] },
  { ref: "square-control@1", kind: "assigned_to_existing_meaning", witnesses: ["rules.square.reading.control@1"] },
  { ref: "standard-uci-king-destination@1", kind: "shipped_identity", witnesses: ["packages/runtime/src/legal-moves.ts"] },
  { ref: "story-last-level@1", kind: "assigned_to_existing_meaning", witnesses: ["derived.story.last_level@1"] },
  { ref: "story-rank@1", kind: "assigned_to_existing_meaning", witnesses: ["derived.story.rank@1"] },
  { ref: "story-title@1", kind: "assigned_to_existing_meaning", witnesses: ["derived.story.title@1"] },
  { ref: "threat@1", kind: "shipped_identity", witnesses: ["rules.tactic.consequence.threat@1"] },
  { ref: "trade-completed@1", kind: "assigned_to_existing_meaning", witnesses: ["derived.exchange.trade_completed@1"] },
  { ref: "trapped@1", kind: "shipped_identity", witnesses: ["rules.tactic.reading.trapped_piece@1"] },
]);

const EXCLUDED_VERSION_TOKENS = Object.freeze({
  "mate-proof-traversal-fnv64@1": "proof-digest serialization identity, not a chess/product semantic definition",
  "module-reducers@1": "reducer implementation version, not a fact-defining convention",
} as const);

function productionText(): string {
  return [
    "packages/runtime/src/evidence-catalog.ts",
    "packages/runtime/src/exchange.ts",
    "packages/runtime/src/grade.ts",
    "packages/runtime/src/king-state.ts",
    "packages/runtime/src/legal-moves.ts",
    "packages/runtime/src/mate-proof.ts",
    "packages/runtime/src/material-state.ts",
    "packages/runtime/src/mobility.ts",
    "packages/runtime/src/module-reducers.ts",
    "packages/runtime/src/pawn-dynamics.ts",
    "packages/runtime/src/phase.ts",
    "packages/runtime/src/semantic-evidence.ts",
    "packages/runtime/src/structure.ts",
    "packages/runtime/src/tactics.ts",
  ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8")).join("\n");
}

const projectionKeys = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => `${projection.id}@${projection.version}`));

describe("D1722 initial semantic-convention member census", () => {
  it("publishes one exact, sorted 39-member seed set", () => {
    const refs = INITIAL_CONVENTION_MEMBERS.map((row) => row.ref);
    expect(refs).toHaveLength(39);
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs).toEqual([...refs].sort());
    expect(refs.every((value) => /^[a-z][a-z0-9_-]*@[1-9][0-9]*$/.test(value))).toBe(true);
    expect(INITIAL_CONVENTION_MEMBERS.filter((row) => row.kind === "shipped_identity")).toHaveLength(23);
    expect(INITIAL_CONVENTION_MEMBERS.filter((row) => row.kind === "assigned_to_existing_meaning")).toHaveLength(16);
  });

  it("binds shipped identities to production bytes and assigned identities to live projections", () => {
    const source = productionText();
    for (const row of INITIAL_CONVENTION_MEMBERS) {
      if (row.kind === "shipped_identity") expect(source, row.ref).toContain(row.ref);
      for (const witness of row.witnesses) {
        if (witness.startsWith("packages/")) expect(source, witness).toContain(row.ref);
        else expect(projectionKeys, `${row.ref} -> ${witness}`).toContain(witness);
      }
    }
  });

  it("keeps current versioned non-semantic tokens explicitly excluded", () => {
    const source = productionText();
    const included = new Set(INITIAL_CONVENTION_MEMBERS.map((row) => row.ref));
    for (const [token, reason] of Object.entries(EXCLUDED_VERSION_TOKENS)) {
      expect(source).toContain(token);
      expect(included).not.toContain(token);
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it("treats grade context as an operand, not an invalid pseudo-version", () => {
    expect(INITIAL_CONVENTION_MEMBERS.map((row) => row.ref)).toContain("grade-convention@1");
    expect(INITIAL_CONVENTION_MEMBERS.some((row) => row.ref.includes("/"))).toBe(false);
    const grade = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => `${projection.id}@${projection.version}` === "derived.grade.move_quality@1");
    expect(grade?.operands).toContain("convention");
  });

  it("prints the reviewed seed table when explicitly requested", () => {
    if (process.env.D1722_SEED_PRINT !== "1") return;
    console.log(JSON.stringify({ members: INITIAL_CONVENTION_MEMBERS, excluded: EXCLUDED_VERSION_TOKENS }, null, 2));
  });
});
