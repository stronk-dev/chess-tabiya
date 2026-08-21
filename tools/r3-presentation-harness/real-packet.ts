// DISPOSABLE research harness — platform-alignment R3. Not production code.
import {
  PRIMARY_EVIDENCE_MANIFEST,
  assertEvidenceSelectionResult,
  type EvidenceGrounding,
  type EvidenceSelectionResult,
  type SelectedEvidenceFact,
} from "@chess-tabiya/runtime";

import type { EvidenceFact, GuidanceModuleId } from "./module-contract.js";

const RESEARCH_CONSUMERS: readonly GuidanceModuleId[] = Object.freeze([
  "postcommit_nudge",
  "guided_hint",
  "compare_coach",
  "review_map",
  "full_inspector",
]);

const LABELS: Readonly<Record<string, string>> = Object.freeze({
  backward_pawn: "a backward pawn relation",
  bishop_on_shade: "a bishop-square-colour relation",
  castled: "castling",
  checkmate: "checkmate",
  defended_duty: "a defensive responsibility",
  doubled_pawn: "a doubled-pawn relation",
  direct_attack_count: "the number of direct attacks",
  escape_squares: "available escape squares",
  half_open_file: "a half-open file",
  isolated_pawn: "an isolated-pawn relation",
  king_opposition: "king opposition",
  king_zone: "a king-zone relation",
  last_of_role: "the last remaining piece of a role",
  line_blockers: "a line blocker",
  named_structure: "a named structure relation",
  open_file: "an open file",
  occupied_defence: "a defence of an occupied square",
  passed_pawn: "a passed-pawn relation",
  pawn_contact: "pawn contact",
  piece_count: "a piece-count relation",
  piece_reach_count: "a piece-reach relation",
  promotion: "promotion",
  slider_lines: "a sliding-piece line",
});

export interface RealResearchPacket {
  readonly id: string;
  readonly label: string;
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly population: EvidenceSelectionResult["population"];
  readonly facts: readonly EvidenceFact[];
  readonly emptyReason?: string;
}

function sourceRung(grounding: EvidenceGrounding): 0 | 1 | 2 | 3 | 4 | 5 {
  if (grounding === "position_rules" || grounding === "declared_convention") return 0;
  if (grounding === "authored_claim" || grounding === "cited_theory") return 1;
  if (grounding === "human_corpus") return 2;
  if (grounding === "human_model") return 3;
  if (grounding === "bounded_search" || grounding === "tablebase_exact") return 4;
  return 5;
}

function family(fact: SelectedEvidenceFact): string {
  if (fact.kind === "counterfactual_absence") {
    return fact.event.operands.family.projection.id.split(".").at(-1) ?? "relation";
  }
  const operands = fact.event.operands as { readonly family?: unknown };
  return typeof operands.family === "string"
    ? operands.family
    : fact.event.projection.id.split(".").at(-1) ?? "relation";
}

function labelFor(value: string): string {
  return LABELS[value] ?? value.replaceAll("_", " ");
}

function squares(value: unknown, output = new Set<string>()): readonly string[] {
  if (typeof value === "string") {
    if (/^[a-h][1-8]$/u.test(value)) output.add(value);
  } else if (Array.isArray(value)) {
    for (const item of value) squares(item, output);
  } else if (value !== null && typeof value === "object") {
    for (const item of Object.values(value as Record<string, unknown>)) squares(item, output);
  }
  return Object.freeze([...output].sort());
}

function render(fact: SelectedEvidenceFact, population: EvidenceSelectionResult["population"]): string {
  const name = labelFor(family(fact));
  if (fact.kind === "counterfactual_absence") {
    const operands = fact.event.operands;
    return `${operands.alternativesWithFamily} of ${operands.legalAlternatives} other legal moves would have changed ${name}; this move did not.`;
  }
  if (fact.event.sign === "state") return `This move produced ${name}.`;
  const verb = fact.event.sign === "gained" ? "created" : fact.event.sign === "lost" ? "removed" : "preserved";
  const matching = Math.round(fact.sameFamilyShare * population.legalAlternatives);
  return `This move ${verb} ${name}. ${matching} of ${population.legalAlternatives} other legal moves produced the same event family.`;
}

export function adaptSelectedEvidence(
  label: string,
  selection: EvidenceSelectionResult,
): RealResearchPacket {
  assertEvidenceSelectionResult(PRIMARY_EVIDENCE_MANIFEST, selection);
  const first = selection.selected[0]?.event.anchor;
  if (first === undefined) {
    return Object.freeze({
      id: `empty:${selection.emptyReason?.id ?? "unknown"}`,
      label,
      beforeFen: "",
      moveUci: "",
      afterFen: "",
      population: selection.population,
      facts: Object.freeze([]),
      ...(selection.emptyReason === undefined ? {} : { emptyReason: selection.emptyReason.id }),
    });
  }
  const facts = selection.selected.map((selected): EvidenceFact => Object.freeze({
    id: selected.event.id,
    kind: `${selected.event.projection.id}@${selected.event.projection.version}`,
    eligible: true,
    allowedConsumers: RESEARCH_CONSUMERS,
    availableAt: "postcommit",
    sourceRung: sourceRung(selected.event.basis.grounding),
    exactness: selected.event.basis.exactness,
    sign: selected.event.sign,
    squares: squares(selected.event.operands),
    text: render(selected, selection.population),
  }));
  return Object.freeze({
    id: first.moveUci,
    label,
    beforeFen: first.beforeFen,
    moveUci: first.moveUci,
    afterFen: first.afterFen,
    population: selection.population,
    facts: Object.freeze(facts),
  });
}
