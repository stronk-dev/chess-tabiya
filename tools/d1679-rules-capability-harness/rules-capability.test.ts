// DISPOSABLE research harness — D1679/D1687. Not production code.
import { describe, expect, it } from "vitest";

import {
  EVIDENCE_PRODUCER_IDS,
  PRIMARY_EVIDENCE_MANIFEST,
} from "../../packages/runtime/src/evidence-catalog.js";

type ProducerId = (typeof EVIDENCE_PRODUCER_IDS)[number];
type SubjectFamily = "standard" | "chess960" | "tier2_evidence_dark";
type Computation =
  | "available"
  | "provider_dependent"
  | "content_dependent"
  | "subject_receipt_required"
  | "rules_adapter_required"
  | "derived_from_inputs"
  | "operator_only"
  | "suppressed_wrong_domain";
type LearnerUse = "projection_gated" | "inherits_inputs" | "operator_only" | "suppressed";
type Absence = "not_applicable" | "honest_empty" | "inherits_inputs" | "suppressed";

interface Capability {
  readonly computation: Computation;
  readonly learnerUse: LearnerUse;
  readonly absence: Absence;
  readonly reason: string;
}

const capability = (
  computation: Computation,
  learnerUse: LearnerUse,
  absence: Absence,
  reason: string,
): Capability => Object.freeze({ computation, learnerUse, absence, reason });

const standardRules = capability("available", "projection_gated", "not_applicable", "Literal standard-chess rule arithmetic; projection disposition and consumer binding still govern delivery.");
const chess960Rules = capability("rules_adapter_required", "projection_gated", "honest_empty", "Chess960 shares piece movement but the current readers receive no durable setup-family receipt; castling-sensitive and subject construction paths must be proved before invocation.");
const tier2Dark = capability("suppressed_wrong_domain", "suppressed", "suppressed", "The producer is not validated for this ruleset; absence is a safety decision, not provider unavailability.");
const derivedStandard = capability("derived_from_inputs", "inherits_inputs", "inherits_inputs", "A derived projection composes only admitted literal inputs and inherits their weakest capability.");
const derivedChess960 = capability("derived_from_inputs", "inherits_inputs", "inherits_inputs", "Available only when every declared input is admitted for the exact rules/setup subject.");
const derivedTier2 = capability("derived_from_inputs", "suppressed", "suppressed", "Tier-2 learner evidence is dark; derivation cannot launder a suppressed input into a new claim.");
const operator = capability("operator_only", "operator_only", "not_applicable", "Sourcing provenance is an author/operator record, not learner evidence.");

const STANDARD = {
  "rules.structural": standardRules,
  "rules.transition": standardRules,
  "rules.castling": standardRules,
  "rules.exchange": standardRules,
  "rules.tactic": standardRules,
  "rules.square": standardRules,
  "rules.mobility": standardRules,
  "rules.pawn": standardRules,
  "rules.king": standardRules,
  "rules.phase": standardRules,
  "rules.pivotal": standardRules,
  "rules.endgame": standardRules,
  "theory.shapes": capability("content_dependent", "projection_gated", "honest_empty", "Only authored and validated shape entries may fire."),
  "authored.structural_condition": capability("content_dependent", "projection_gated", "honest_empty", "Pack-authored conditions are available only when the admitted pack carries them."),
  "pack.authored": capability("content_dependent", "projection_gated", "honest_empty", "Authored claims require a validated pack binding and provenance."),
  "recorded.engine": capability("subject_receipt_required", "projection_gated", "honest_empty", "Recorded evaluation is usable only when its sealed subject matches the run node."),
  "recorded.tablebase": capability("subject_receipt_required", "projection_gated", "honest_empty", "Recorded tablebase evidence requires an exact position receipt and domain admission."),
  "live.stockfish": capability("provider_dependent", "projection_gated", "honest_empty", "Standard Stockfish search may abstain when the provider is unavailable."),
  "live.syzygy": capability("provider_dependent", "projection_gated", "honest_empty", "Syzygy may abstain outside its material domain or when unavailable."),
  "human.maia": capability("provider_dependent", "projection_gated", "honest_empty", "Maia policy describes standard-chess model choice and may abstain on provider failure."),
  "human.explorer": capability("provider_dependent", "projection_gated", "honest_empty", "Explorer populations are optional observations, never a move grade."),
  "theory.opening_identity": capability("content_dependent", "projection_gated", "honest_empty", "Opening identity requires a cited build-time catalogue record."),
  "theory.opening.runtime": capability("content_dependent", "projection_gated", "honest_empty", "Runtime identity requires a valid pinned catalogue and exact endpoint match."),
  "run.record": capability("available", "projection_gated", "not_applicable", "Literal run facts are available for their exact run subject; each projection still has its own consumer contract."),
  "derived.compare_narrative": derivedStandard,
  "derived.story": derivedStandard,
  "derived.opening": derivedStandard,
  "derived.grade": derivedStandard,
  "derived.exchange": derivedStandard,
  "derived.tactic": derivedStandard,
  "derived.pawn": derivedStandard,
  "derived.material": derivedStandard,
  "derived.king": derivedStandard,
  "derived.activity": derivedStandard,
  "derived.opponent": derivedStandard,
  "sourcing.ledger": operator,
  "derived.semantic_avoidance": derivedStandard,
} as const satisfies Record<ProducerId, Capability>;

const CHESS960 = {
  "rules.structural": chess960Rules,
  "rules.transition": chess960Rules,
  "rules.castling": chess960Rules,
  "rules.exchange": chess960Rules,
  "rules.tactic": chess960Rules,
  "rules.square": chess960Rules,
  "rules.mobility": chess960Rules,
  "rules.pawn": chess960Rules,
  "rules.king": chess960Rules,
  "rules.phase": chess960Rules,
  "rules.pivotal": chess960Rules,
  "rules.endgame": chess960Rules,
  "theory.shapes": capability("content_dependent", "projection_gated", "honest_empty", "Only explicitly Chess960-valid authored shapes may fire."),
  "authored.structural_condition": capability("content_dependent", "projection_gated", "honest_empty", "Only a Chess960-admitted pack condition may be evaluated."),
  "pack.authored": capability("content_dependent", "projection_gated", "honest_empty", "Claims require an admitted Chess960 pack and exact provenance."),
  "recorded.engine": capability("subject_receipt_required", "projection_gated", "honest_empty", "The receipt must retain rules plus setup family and the engine dialect."),
  "recorded.tablebase": capability("subject_receipt_required", "projection_gated", "honest_empty", "The receipt must prove exact subject and tablebase-domain validity."),
  "live.stockfish": capability("rules_adapter_required", "projection_gated", "honest_empty", "The engine request must set and receipt UCI_Chess960 for this subject."),
  "live.syzygy": capability("rules_adapter_required", "projection_gated", "honest_empty", "The probe boundary currently carries no rules/setup receipt; do not infer validity from FEN alone."),
  "human.maia": tier2Dark,
  "human.explorer": capability("rules_adapter_required", "projection_gated", "honest_empty", "The shipped source hard-codes variant=standard; a Chess960 request and subject receipt must be implemented and measured."),
  "theory.opening_identity": tier2Dark,
  "theory.opening.runtime": tier2Dark,
  "run.record": capability("available", "projection_gated", "not_applicable", "Literal rules/setup-aware run facts remain valid; evidence-reference projections inherit their referenced source capability."),
  "derived.compare_narrative": derivedChess960,
  "derived.story": derivedChess960,
  "derived.opening": derivedChess960,
  "derived.grade": derivedChess960,
  "derived.exchange": derivedChess960,
  "derived.tactic": derivedChess960,
  "derived.pawn": derivedChess960,
  "derived.material": derivedChess960,
  "derived.king": derivedChess960,
  "derived.activity": derivedChess960,
  "derived.opponent": derivedChess960,
  "sourcing.ledger": operator,
  "derived.semantic_avoidance": derivedChess960,
} as const satisfies Record<ProducerId, Capability>;

const TIER2_EVIDENCE_DARK = {
  "rules.structural": tier2Dark,
  "rules.transition": tier2Dark,
  "rules.castling": tier2Dark,
  "rules.exchange": tier2Dark,
  "rules.tactic": tier2Dark,
  "rules.square": tier2Dark,
  "rules.mobility": tier2Dark,
  "rules.pawn": tier2Dark,
  "rules.king": tier2Dark,
  "rules.phase": tier2Dark,
  "rules.pivotal": tier2Dark,
  "rules.endgame": tier2Dark,
  "theory.shapes": tier2Dark,
  "authored.structural_condition": tier2Dark,
  "pack.authored": tier2Dark,
  "recorded.engine": tier2Dark,
  "recorded.tablebase": tier2Dark,
  "live.stockfish": tier2Dark,
  "live.syzygy": tier2Dark,
  "human.maia": tier2Dark,
  "human.explorer": tier2Dark,
  "theory.opening_identity": tier2Dark,
  "theory.opening.runtime": tier2Dark,
  "run.record": capability("available", "projection_gated", "not_applicable", "Only literal move, board, branch and result facts survive; evidence-reference projections remain source-gated."),
  "derived.compare_narrative": derivedTier2,
  "derived.story": derivedTier2,
  "derived.opening": derivedTier2,
  "derived.grade": derivedTier2,
  "derived.exchange": derivedTier2,
  "derived.tactic": derivedTier2,
  "derived.pawn": derivedTier2,
  "derived.material": derivedTier2,
  "derived.king": derivedTier2,
  "derived.activity": derivedTier2,
  "derived.opponent": derivedTier2,
  "sourcing.ledger": operator,
  "derived.semantic_avoidance": derivedTier2,
} as const satisfies Record<ProducerId, Capability>;

const MATRIX = Object.freeze({
  standard: STANDARD,
  chess960: CHESS960,
  tier2_evidence_dark: TIER2_EVIDENCE_DARK,
}) satisfies Record<SubjectFamily, Record<ProducerId, Capability>>;

describe("D1679 rules-aware producer capability boundary", () => {
  it("derives the current producer population set-equal from the compiled manifest", () => {
    const declared = [...EVIDENCE_PRODUCER_IDS].sort();
    const compiled = PRIMARY_EVIDENCE_MANIFEST.producers.map((producer) => producer.id).sort();
    expect(declared).toHaveLength(37);
    expect(compiled).toEqual(declared);
  });

  it("classifies every producer separately for every subject family", () => {
    const expected = [...EVIDENCE_PRODUCER_IDS].sort();
    for (const row of Object.values(MATRIX)) expect(Object.keys(row).sort()).toEqual(expected);
  });

  it("does not confuse opponent computability with learner evidence admission", () => {
    expect(MATRIX.tier2_evidence_dark["run.record"].learnerUse).toBe("projection_gated");
    expect(MATRIX.tier2_evidence_dark["live.stockfish"].learnerUse).toBe("suppressed");
    expect(EVIDENCE_PRODUCER_IDS).not.toContain("live.fairy_stockfish" as ProducerId);
  });

  it("distinguishes wrong-domain suppression from honest provider absence", () => {
    expect(MATRIX.standard["human.maia"].absence).toBe("honest_empty");
    expect(MATRIX.chess960["human.maia"].absence).toBe("suppressed");
    expect(MATRIX.tier2_evidence_dark["rules.structural"].absence).toBe("suppressed");
  });

  it("prevents derivation from laundering a dark source", () => {
    const derivedIds = EVIDENCE_PRODUCER_IDS.filter((id) => id.startsWith("derived."));
    expect(derivedIds).toHaveLength(12);
    for (const id of derivedIds) {
      expect(MATRIX.tier2_evidence_dark[id].computation).toBe("derived_from_inputs");
      expect(MATRIX.tier2_evidence_dark[id].learnerUse).toBe("suppressed");
    }
  });

  it("retains projection-level dispositions instead of treating a producer row as delivery authority", () => {
    const dispositions = PRIMARY_EVIDENCE_MANIFEST.projections.filter((projection) => projection.disposition !== undefined);
    expect(dispositions.length).toBeGreaterThan(0);
    expect(new Set(dispositions.map((projection) => projection.disposition?.kind))).toContain("inspector_only");
  });
});
