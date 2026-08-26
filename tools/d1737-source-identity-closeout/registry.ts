// DISPOSABLE research registry — D1737. This is a closure receipt, not production vocabulary.

export type SourceProductionState =
  | "landed_source"
  | "versioned_repair_required"
  | "specified_source_not_landed";

export interface FoundationCapabilityReceipt {
  readonly id: string;
  readonly production: SourceProductionState;
  readonly authority: string;
  readonly boundary: string;
}

/**
 * Closed 1.0 evidence basis reconstructed from the owner examples, D717/Waves A–C, R21's
 * longitudinal atoms, and the roadmap's variant evidence obligation. Chess vocabulary is
 * extensible; this list closes the declared 1.0 basis, not every concept chess can name.
 */
export const FOUNDATION_CAPABILITY_RECEIPTS: readonly FoundationCapabilityReceipt[] = Object.freeze([
  { id: "board_legality_terminal", production: "landed_source", authority: "design/research/foundation-capability-closure.md", boundary: "Exact rules, legal actions, check and terminal state." },
  { id: "exact_legal_mobility", production: "landed_source", authority: "rfc/exact-legal-mobility.md", boundary: "One canonical move authority including castling, en-passant and promotion identity." },
  { id: "square_control_attack_defence", production: "landed_source", authority: "design/research/legal-square-denial.md", boundary: "Pseudo and legal current control; significance and future purpose remain separate." },
  { id: "exchange_material", production: "landed_source", authority: "design/research/legal-exchange-prerequisite.md", boundary: "Legal exchange, captures, trades and literal material-role vectors without value prose." },
  { id: "loose_trapped_piece", production: "landed_source", authority: "design/research/detection-landscape.md", boundary: "Exact local loose/trapped states; no automatic lost-piece or move-grade claim." },
  { id: "pin_skewer_xray", production: "landed_source", authority: "design/research/detection-landscape.md", boundary: "Target-bearing ray classification; relevance is a consumer query." },
  { id: "double_attack_fork", production: "landed_source", authority: "design/research/bounded-reply-semantics.md", boundary: "Meaningful double attack plus separately bounded reply survival." },
  { id: "discovery_clearance_interference", production: "landed_source", authority: "design/research/identity-retaining-three-edge-consequences.md", boundary: "Exact rays, blockers, targets and observed consequences; force and intent remain outside." },
  { id: "defender_overload_deflection_attraction_zwischenzug", production: "landed_source", authority: "design/research/basic-semantic-tactics-stage-0.md", boundary: "Declared bounded semantic events over exact duties/replies; independent validation still gates activation." },
  { id: "pawn_contacts_passers", production: "landed_source", authority: "design/research/middlegame-evidence-and-style-taxonomy.md", boundary: "Exact contacts, locks, passers, protection and related transitions without strategic value." },
  { id: "isolated_doubled_pawn_identity", production: "versioned_repair_required", authority: "design/research/isolated-doubled-pawn-identity.md", boundary: "Exact unbounded pawn groups and membership-changing events replace file-only learner evidence." },
  { id: "backward_pawn", production: "versioned_repair_required", authority: "design/research/backward-pawn-semantic-and-payload-boundary.md", boundary: "Preserve the narrow convention while adding pawn, stop, support, controller and occupancy identity." },
  { id: "pawn_islands_chains", production: "versioned_repair_required", authority: "design/research/pawn-island-transition-identity.md", boundary: "Exact partitions and topology change; unchanged state does not become an event." },
  { id: "open_half_open_file_access", production: "specified_source_not_landed", authority: "design/research/open-file-state-and-access.md", boundary: "One exact file-state source plus distinct moved-entry and stationary-reveal events." },
  { id: "space_denial_outpost", production: "versioned_repair_required", authority: "design/research/square-denial-and-outpost-boundary.md", boundary: "Current control, future same-file challenge, capture migration, candidate and occupation remain distinct." },
  { id: "development_rook_seventh", production: "landed_source", authority: "design/research/foundation-capability-closure.md", boundary: "Literal development and rank occupation without goodness or activity judgement." },
  { id: "castling_rights_legality_event", production: "landed_source", authority: "design/research/decomposed-king-state.md", boundary: "Rights, lost cause, current legality and performed castling remain distinct." },
  { id: "king_zone_shelter_opposition", production: "versioned_repair_required", authority: "design/research/king-opposition-semantic-boundary.md", boundary: "Zone/shelter are exact; opposition supersedes blocker-blind geometry with unobstructed identity." },
  { id: "check_mating_net", production: "landed_source", authority: "design/research/basic-semantic-tactics-stage-0.md", boundary: "Exact check/mate facts and complete-reply mate proof through the declared capped horizon." },
  { id: "promotion_pressure_race_tablebase", production: "specified_source_not_landed", authority: "design/research/promotion-race-contract-closure.md", boundary: "Passed-pawn geometry stays descriptive; outcome joins same-FEN exact moves to recorded/live Syzygy." },
  { id: "opening_identity", production: "landed_source", authority: "design/research/runtime-opening-identity.md", boundary: "Current endpoint, catalogue membership and retrospective deepest match are separate exact records." },
  { id: "cited_theory_applicability", production: "specified_source_not_landed", authority: "design/research/theory-knowledge-pipeline.md", boundary: "Revision-pinned cited passages join exact applicability; no LLM or retrieval result creates chess truth." },
  { id: "engine_search_tablebase_receipts", production: "specified_source_not_landed", authority: "design/research/bounded-policy-target-contract-closure.md", boundary: "Node-free same-exchange Stockfish/Syzygy receipts, typed values and bounded scheduling." },
  { id: "maia_policy_receipt", production: "specified_source_not_landed", authority: "design/research/bounded-policy-target-contract-closure.md", boundary: "History-conditioned and exact-FEN requests retain model/band/sampling identity and missing mass." },
  { id: "explorer_population_receipt", production: "specified_source_not_landed", authority: "design/research/explorer-source-contract-closure.md", boundary: "Position/population/source identity and honest absence precede derived use." },
  { id: "bounded_named_target_policy", production: "specified_source_not_landed", authority: "design/research/bounded-policy-targets.md", boundary: "Exact removal/return plus separately labelled Stockfish/Maia policy facts; never intent or prophylaxis by itself." },
  { id: "subject_safe_avoidance", production: "versioned_repair_required", authority: "design/research/avoidance-subject-identity.md", boundary: "Subject-first distinct-move denominators replace family/sign aggregation." },
  { id: "style_literal_atoms", production: "specified_source_not_landed", authority: "design/research/longitudinal-style-feedback-contract.md", boundary: "Fianchetto configurations, move role/destination/ply, clock deltas and game-level castling eligibility precede habit cards." },
  { id: "variant_rules_identity", production: "specified_source_not_landed", authority: "design/research/variant-evidence-operation-boundary.md", boundary: "Rules identity and capability gate every standard-only evidence operation before Tier-2 claims." },
  { id: "named_structure_identity", production: "versioned_repair_required", authority: "design/research/legacy-reading-successor-closure.md", boundary: "One sealed pattern id/name payload authority replaces prose-only identity." },
]);

export const SOURCE_PROGRAM_HANDOFFS = Object.freeze([
  "planning/evidence-foundation-ux/declared-convention-identity-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/f1-execution-metadata-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/king-opposition-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/backward-pawn-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/square-denial-outpost-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/pawn-file-identity-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/line-evidence-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/file-activity-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/pawn-island-identity-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/producer-execution-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/explorer-source-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/shared-candidate-packet-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/semantic-validation-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/avoidance-subject-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/legacy-reading-successor-author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/promotion-race-author-repair-2026-08-26.md",
]);

export const DOWNSTREAM_SOURCE_READERS = Object.freeze([
  "planning/bounded-policy-targets/author-repair-2026-08-26.md",
  "planning/evidence-foundation-ux/review-evidence-compiler-author-checkpoint-2026-08-26.md",
]);
