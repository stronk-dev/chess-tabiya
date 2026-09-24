// DISPOSABLE research harness — D2144. Before rfc/evidence-value-authority.md was implemented this
// proved the defect (75 shape-only adapters sealed false same-key payloads). After implementation
// (2026-09-24) it proves the defect is gone through public/runtime surfaces; the permanent gate is
// packages/runtime/src/evidence-value-authority.test.ts.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST, castlingRights, evidenceForConsumer, type DeclaredEvidence } from "@chess-tabiya/runtime";
import { identitySealedEvidenceWithoutValueReceipt } from "../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute, type EvidenceValueRoute } from "../../packages/runtime/src/internal/evidence-value-routes.js";

const ROOT = new URL("../../", import.meta.url);
const barrel = readFileSync(new URL("packages/runtime/src/index.ts", ROOT), "utf8");
const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const invoke = (route: string, inputs: object): unknown => invokeEvidenceValueRoute(route as EvidenceValueRoute, inputs as never);

const RULES_POSITION_EXACT_REVIEW = Object.freeze([
  { projection: "rules.castling.event.rights_lost", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.castling.reading.legality", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.castling.reading.rights", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.endgame.reading", authority: "multi_authority_projection", action: "split_projection" },
  { projection: "rules.phase.reading", authority: "product_classification", action: "reclassify_declared_convention" },
  { projection: "rules.pivotal.marker", authority: "multi_authority_projection", action: "split_projection" },
  { projection: "rules.square.event.control", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.square.reading.control", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.structural.event.pawn_islands", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.structural.predicate.result", authority: "multi_authority_projection", action: "split_projection" },
  { projection: "rules.structural.reading.named_structure", authority: "product_classification", action: "reclassify_declared_convention" },
  { projection: "rules.structural.reading.pawn_connectivity", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.tactic.consequence.forced_mate_after_move", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.tactic.consequence.mate_in_one", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.tactic.consequence.reply_breadth", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.tactic.event.check", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
  { projection: "rules.tactic.event.defender_duty_relocated", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.tactic.event.defender_removed", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.tactic.reading.defender_duty_set", authority: "rule_computation_with_direct_convention", action: "retain_scalar_register_convention_and_compute" },
  { projection: "rules.tactic.reading.rook_on_seventh", authority: "literal_rule_total", action: "retain_scalar_and_compute" },
] as const);

describe("D2144 declared-evidence value authority (post-implementation)", () => {
  it("retires the shape-only adapter module and every public declare*Evidence mint", () => {
    expect(existsSync(new URL("packages/runtime/src/evidence-source-adapters.ts", ROOT))).toBe(false);
    // The four remaining declare* names take authority inputs (FEN, edge, entries+path), never a payload.
    expect([...new Set(barrel.match(/\bdeclare[A-Z][A-Za-z]*Evidence\b/gu))].sort()).toEqual(["declareShapeFiringEvidence", "declareStructuralPredicateEvidence", "declareStructuralReadingEvidence", "declareTransitionReadingEvidence"]);
    const valueExports = barrel.split("\n").filter((line) => !line.startsWith("export type")).join("\n");
    expect(valueExports).not.toMatch(/evidence-source-adapters|evidence-factories|internal\/evidence-value-routes/u);
  });

  it("keeps the twenty reviewed rules rows either computed or split into named successors", () => {
    expect(RULES_POSITION_EXACT_REVIEW).toHaveLength(20);
    const current = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [projection.id, projection]));
    for (const row of RULES_POSITION_EXACT_REVIEW) {
      const declaration = current.get(row.projection);
      if (row.action === "split_projection") expect(declaration?.disposition?.kind, row.projection).toBe("retired");
      else expect(declaration, row.projection).toBeDefined();
    }
  });

  it("recomputes a same-key reading from FEN instead of accepting a caller payload", () => {
    const sealed = invoke("rules.castling.reading.rights@1", { fen: INITIAL }) as DeclaredEvidence<unknown>;
    expect(sealed.payload).toEqual(castlingRights(INITIAL));
    expect(() => invoke("rules.castling.reading.rights@1", { fen: INITIAL, payload: castlingRights(INITIAL) })).toThrow(/extra: payload/u);
  });

  it("refuses an identity-only forgery at every consumer boundary", () => {
    const rights = castlingRights(INITIAL);
    const forged = identitySealedEvidenceWithoutValueReceipt({ id: "rules.castling", version: 1 }, { id: "rules.castling.reading.rights", version: 1 }, { ...rights, white: { ...rights.white, kingside: false } });
    for (const consumer of PRIMARY_EVIDENCE_MANIFEST.consumers) {
      expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, [forged])).toThrow(/value-authority receipt/u);
    }
  });

  it("makes the impossible same-key castling-loss transition unrepresentable", () => {
    expect(() => invoke("rules.castling.event.rights_lost@1", { beforeFen: INITIAL, moveUci: "e2e4", afterFen: INITIAL })).toThrow(/after FEN is not the result/u);
  });
});
