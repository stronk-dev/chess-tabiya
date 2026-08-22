import { STRUCTURAL_FEATURE_KINDS, TRANSITION_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";

import { compileEvidenceManifest } from "./evidence-contract.js";
import type {
  AdapterDeclaration,
  AnswerDistance,
  ConsumerDeclaration,
  EvidenceContractDeclarations,
  EvidenceDispositionDeclaration,
  EvidenceEligibilityDeclaration,
  EvidenceForm,
  EvidenceGrounding,
  EvidencePlane,
  EvidenceReasonDeclaration,
  EvidenceRole,
  EvidenceSelectionPolicyDeclaration,
  EvidenceTiming,
  EvidenceDerivation,
  ProducerDeclaration,
  ProjectionDeclaration,
  ProjectionRole,
  ProviderOffBehavior,
  SemanticEventDeclaration,
  VersionedEvidenceId,
} from "./evidence-contract.js";

const ref = (id: string): VersionedEvidenceId => Object.freeze({ id, version: 1 });
const retired = (reason: string): EvidenceDispositionDeclaration => Object.freeze({ kind: "retired", reason });
const producer = (id: string, plane: EvidencePlane, implementation: string, availability: ProducerDeclaration["availability"], outputs: readonly ProjectionDeclaration[]): ProducerDeclaration => Object.freeze({ id, version: 1, plane, implementation, availability, latency: availability === "provider" ? "interactive" : availability === "build_time" ? "offline" : "sync", outputs: Object.freeze(outputs) });

interface ProjectionOptions {
  readonly role?: ProjectionRole;
  readonly grounding?: EvidenceGrounding;
  readonly payloadType?: string;
  readonly semantics?: string;
  readonly operands?: readonly string[];
  readonly signs?: ProjectionDeclaration["signs"];
  readonly exactness?: ProjectionDeclaration["exactness"];
  readonly confidence?: ProjectionDeclaration["confidence"];
  readonly abstention?: ProjectionDeclaration["abstention"];
  readonly answerContent?: readonly AnswerDistance[];
  readonly forms?: readonly EvidenceForm[];
  readonly dependsOn?: readonly VersionedEvidenceId[];
  readonly derivation?: EvidenceDerivation;
  readonly limitations?: readonly string[];
  readonly disposition?: EvidenceDispositionDeclaration;
}

function projection(producerId: string, id: string, plane: EvidencePlane, options: ProjectionOptions = {}): ProjectionDeclaration {
  const signs: ProjectionDeclaration["signs"] = options.signs ?? ["state"];
  const answers: readonly AnswerDistance[] = options.answerContent ?? ["fact"];
  const forms: readonly EvidenceForm[] = options.forms ?? ["list", "panel"];
  return Object.freeze({
    id,
    version: 1,
    producer: ref(producerId),
    role: options.role ?? "reading",
    plane,
    payloadType: options.payloadType ?? "unknown",
    semantics: options.semantics ?? `${id} retains the source implementation's documented literal value.`,
    operands: Object.freeze(options.operands ?? []),
    signs: Object.freeze(signs),
    grounding: options.grounding ?? "position_rules",
    exactness: options.exactness ?? "exact",
    confidence: options.confidence ?? "not_applicable",
    abstention: Object.freeze(options.abstention ?? { possible: false, reasons: Object.freeze([]) }),
    answerContent: Object.freeze(answers),
    forms: Object.freeze(forms),
    dependsOn: Object.freeze(options.dependsOn ?? []),
    ...(options.derivation === undefined ? {} : {
      derivation: options.derivation.inputs !== undefined
        ? Object.freeze({ inputs: Object.freeze(options.derivation.inputs) })
        : Object.freeze({ anyOf: Object.freeze(options.derivation.anyOf.map((member) => Object.freeze(member))) }),
    }),
    limitations: Object.freeze(options.limitations ?? []),
    ...(options.disposition === undefined ? {} : { disposition: options.disposition }),
  });
}

export const EVIDENCE_PRODUCER_IDS = Object.freeze([
  "rules.structural", "rules.transition", "rules.castling", "rules.exchange", "rules.tactic", "rules.square", "rules.mobility", "rules.pawn", "rules.king", "rules.phase", "rules.pivotal", "rules.endgame",
  "theory.shapes", "authored.structural_condition", "pack.authored", "recorded.engine", "recorded.tablebase", "live.stockfish",
  "live.syzygy", "human.maia", "human.explorer", "theory.opening_identity", "run.record",
  "derived.compare_narrative", "derived.story", "derived.grade", "derived.exchange", "derived.tactic", "derived.pawn", "derived.material", "derived.king", "derived.activity", "sourcing.ledger",
  "derived.semantic_avoidance",
] as const);

export const CURRENT_CONSUMER_OPERATION_IDS = Object.freeze([
  "authoring.predicate", "runtime.objective_condition", "runtime.guard_condition",
  "guidance.deterministic", "guidance.voice", "guidance.recorded_reading", "runtime.evidence_ref",
  "inspector.position_structure", "inspector.move_transition", "board.selected_square_sight",
  "theory.shape_firing", "compare.structure_strip", "compare.engine_trajectory", "inspector.human_split",
  "inspector.corpus", "opponent.selection", "guidance.authored_claim",
  "board.pivotal_marker", "review.story", "runtime.repertoire_scan", "authoring.claim_binding",
  "guidance.voice_compare", "guidance.voice_story",
] as const);

export const EVIDENCE_CONSUMER_IDS = Object.freeze([...CURRENT_CONSUMER_OPERATION_IDS, "assistance.arrows", "research.semantic_selection"] as const);

const STRUCTURAL_READER_WITNESSES = Object.freeze(STRUCTURAL_FEATURE_KINDS.filter((kind) => kind !== "pawn_count"));
const TRANSITION_READING_LEAVES = Object.freeze([
  "attacked_squares_changed.gained", "attacked_squares_changed.lost",
  "defended_squares_changed.gained", "defended_squares_changed.lost",
  "slider_lines_changed.opened", "slider_lines_changed.closed",
  "escape_squares_changed.gained", "escape_squares_changed.lost",
  "defended_duties_changed.acquired", "defended_duties_changed.released",
  "move_irreversibility.castled", "move_irreversibility.clock_zeroed",
  "move_irreversibility.last_of_role", "move_irreversibility.pawn_break",
] as const);

export const STRUCTURAL_PREDICATE_PROJECTION_IDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.map((kind) => `rules.structural.predicate.${kind}`));
export const STRUCTURAL_READING_PROJECTION_IDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.map((kind) => `rules.structural.reading.${kind}`));
export const TRANSITION_READING_PROJECTION_IDS = Object.freeze(TRANSITION_READING_LEAVES.map((leaf) => `rules.transition.reading.${leaf}`));

export const STRUCTURAL_EVENT_FAMILIES = Object.freeze([
  "backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "king_opposition",
  "king_zone", "line_blockers", "open_file", "passed_pawn", "piece_count", "direct_attack_count",
] as const);
export const TRANSITION_GEOMETRY_EVENT_FAMILIES = Object.freeze(["occupied_attack", "occupied_defence", "slider_ray", "piece_escape", "defended_duty"] as const);
export const TRANSITION_RULE_EVENT_FAMILIES = Object.freeze(["castled", "clock_reset", "last_of_role", "pawn_contact", "checkmate", "promotion", "capture", "developed"] as const);
export const STRUCTURAL_EVENT_PROJECTION_IDS = Object.freeze(STRUCTURAL_EVENT_FAMILIES.map((family) => `rules.structural.event.${family}`));
export const TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS = Object.freeze(["rules.structural.event.pawn_islands"] as const);
export const TRANSITION_EVENT_PROJECTION_IDS = Object.freeze([...TRANSITION_GEOMETRY_EVENT_FAMILIES, ...TRANSITION_RULE_EVENT_FAMILIES].map((family) => `rules.transition.event.${family}`));
export const AVOIDANCE_EVENT_PROJECTION_IDS = Object.freeze(STRUCTURAL_EVENT_FAMILIES.map((family) => `derived.semantic_avoidance.${family}`));
export const TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS = Object.freeze(["derived.semantic_avoidance.loose_piece", "derived.semantic_avoidance.pawn_islands"] as const);
export const TACTICAL_EVENT_PROJECTION_IDS = Object.freeze([
  "rules.tactic.event.double_attack",
  "rules.tactic.consequence.reply_breadth",
  "rules.tactic.event.check",
  "rules.tactic.event.loose_piece",
] as const);
export const CASTLING_EVENT_PROJECTION_IDS = Object.freeze(["rules.castling.event.rights_lost"] as const);
export const DERIVED_EXCHANGE_EVENT_PROJECTION_IDS = Object.freeze(["derived.exchange.capture_class", "derived.exchange.trade_completed"] as const);
export const DERIVED_TACTIC_EVENT_PROJECTION_IDS = Object.freeze(["derived.tactic.discovered_executed"] as const);
export const BREADTH_EVENT_PROJECTION_IDS = Object.freeze([
  "rules.square.event.control", "rules.mobility.event.piece_destinations", "rules.pawn.event.dynamics",
  "derived.pawn.event.transitions", "derived.pawn.sequence.contact_timing", "derived.pawn.sequence.harassment_pressure",
  "derived.tactic.defender_exposure", "derived.tactic.sequence.defender_consequence",
  "derived.material.event.role_asymmetry", "rules.king.event.zone_state",
  "derived.king.captured_zone_defender", "derived.activity.event.open_file_occupancy",
] as const);
export const SEMANTIC_WAVE_EVENT_PROJECTION_IDS = Object.freeze([
  "rules.tactic.event.defender_removed", "rules.tactic.event.defender_duty_relocated",
  "derived.tactic.deflection_observed", "derived.tactic.attraction_observed",
  "derived.tactic.line_blocker_clearance_observed", "derived.tactic.square_clearance_observed",
  "derived.tactic.interference_observed", "derived.tactic.check_zwischenzug_observed",
  "derived.tactic.overload_exploitation_observed",
] as const);
export const SEMANTIC_EVENT_PROJECTION_IDS = Object.freeze([...STRUCTURAL_EVENT_PROJECTION_IDS, ...TACTICAL_STRUCTURAL_EVENT_PROJECTION_IDS, ...TRANSITION_EVENT_PROJECTION_IDS, ...AVOIDANCE_EVENT_PROJECTION_IDS, ...TACTICAL_AVOIDANCE_EVENT_PROJECTION_IDS, ...TACTICAL_EVENT_PROJECTION_IDS, ...CASTLING_EVENT_PROJECTION_IDS, ...DERIVED_EXCHANGE_EVENT_PROJECTION_IDS, ...DERIVED_TACTIC_EVENT_PROJECTION_IDS, ...BREADTH_EVENT_PROJECTION_IDS, ...SEMANTIC_WAVE_EVENT_PROJECTION_IDS]);

/** Closed Appendix-A inventory from tactical-collectors; checked set-equal to the compiled catalogue. */
export const TACTICAL_COLLECTOR_PROJECTION_IDS = Object.freeze([
  "rules.exchange.predicate.legal_exchange", "rules.castling.reading.rights",
  "rules.castling.event.rights_lost", "rules.castling.reading.legality",
  "rules.transition.event.capture", "derived.exchange.capture_class",
  "derived.exchange.trade_completed", "rules.tactic.reading.loose_piece",
  "rules.tactic.event.loose_piece", "derived.semantic_avoidance.loose_piece",
  "rules.tactic.reading.ray_classification", "rules.tactic.consequence.threat",
  "rules.tactic.event.double_attack", "derived.tactic.fork_survives_reply",
  "rules.structural.reading.pawn_connectivity", "rules.structural.event.pawn_islands",
  "derived.semantic_avoidance.pawn_islands", "rules.phase.development",
  "rules.transition.event.developed", "rules.tactic.reading.rook_on_seventh",
  "rules.structural.reading.space", "rules.tactic.reading.discovered_latency",
  "derived.tactic.discovered_executed", "rules.tactic.reading.trapped_piece",
  "rules.tactic.reading.back_rank", "rules.tactic.consequence.mate_in_one",
  "derived.tactic.promotion_pressure", "human.maia.candidate_wdl",
  "rules.tactic.consequence.reply_breadth", "rules.tactic.event.check",
] as const);

/** Closed Appendix-A inventory from breadth-collectors; checked set-equal at landing. */
export const BREADTH_COLLECTOR_PROJECTION_IDS = Object.freeze([
  "rules.square.reading.control", "rules.square.event.control",
  "rules.mobility.reading.piece_destinations", "rules.mobility.event.piece_destinations",
  "rules.pawn.reading.contacts", "rules.pawn.reading.candidate_majority", "rules.pawn.event.dynamics",
  "derived.pawn.event.transitions", "derived.pawn.sequence.contact_timing", "derived.pawn.sequence.harassment_pressure",
  "derived.tactic.defender_exposure", "derived.tactic.sequence.defender_consequence",
  "derived.material.reading.role_signature", "derived.material.event.role_asymmetry",
  "rules.king.reading.zone_state", "rules.king.event.zone_state",
  "derived.king.captured_zone_defender", "derived.activity.event.open_file_occupancy",
] as const);

export const BREADTH_CONVENTION_TEXT = Object.freeze({
  localNonLosing: "local-non-losing@1: For a legal capture destination, legal-exchange@1 >= 0. For a quiet destination, after the piece arrives the opponent has no legal capture of it with legal-exchange@1 > 0. This is one-exchange local safety, never engine safety or goodness.",
  candidateMajority: "candidate-majority@1: A pawn is not passed and has no enemy pawn strictly ahead on its file. Supporting pawns are other same-color pawns on an adjacent file whose rank is the subject pawn's rank or any rank behind it from that color's perspective; enemy blockers are opposing pawns on adjacent files strictly ahead of the subject. At least one support is required and support count must be greater than or equal to blocker count.",
  kingZone: "king-zone@1: Up to eight adjacent squares, excluding the king square. Attackers/defenders are distinct non-king pieces controlling at least one zone square.",
  kingShelter: "king-shelter@1: Same-color pawns one or two forward ranks from the king on its file or adjacent files.",
  materialRole: "material-role-signature@1: Per color counts of P/N/B/R/Q. Asymmetry is the unordered role-count difference vector; event-comparison magnitude is the sum of the five absolute per-role count differences. King excluded and no piece-value scalar or verdict emitted.",
  pressureLine: "pressure-line@1: A bishop/rook/queen slider and an enemy rook/queen target are collinear with exactly one occupied square between them, and with that screen removed the target lies in the slider's own chessops attack set from its square. The screen belongs to the target's color, has lower P1/N3/B3/R5/Q9 role value than the target, and is not a king. Retention requires the same slider color/role plus the exact same screen square/color/role and target square/color/role.",
  squareControl: "Square control uses no hypothetical occupant. A pseudo controller is a piece whose chessops attack set contains the target under current occupancy. A legal controller is that same source piece only when the target also appears in its actual allDests() set after a valid clone makes the piece's color the side to move and clears en passant. Opposing-king-square pseudo control makes the checking color's complete legal set abstain invalid_turn_clone.",
  pawnRelations: "An opposing-pawn contact is a directed pawn-attack edge; a direct lock is a White pawn immediately below a Black pawn on the same file; a passed pawn's blockers are opposing pawns strictly ahead on its file or either adjacent file; protection is a same-color pawn attack on the subject; and a connected passed pair is any two passed pawns of one color on adjacent files, with rank distance deliberately unrestricted.",
});

export const SEMANTIC_CONVENTION_TEXT = Object.freeze({
  defenceDuty: "defence-duty@1: A duty is a directed pseudo defence edge under current occupancy from any defender onto a same-color non-king target. Sole defender means the named defender holds the only such edge onto that target. Duties are not legality-filtered; multiple duties alone never imply exploitable overload.",
  overloadConflict: "overload-conflict@1: One named defender is sole defender of the captured target and another retained target; it has a legal recapture; no legal recapture preserves every retained sole duty; and after every recapture at least one retained target has a positive legal-exchange@1 capture. No legal recapture abstains. The broad lost-duty-edge rule is rejected.",
  mateProof: "mate-proof@1: The declared candidate is attacker move one; later attacker moves are existential and every defender reply is enumerated through one to four attacker moves. One node is counted per visited position before cap/terminal checks; the cap is 250000. Attacker moves sort check-first then canonical UCI, defender moves canonical UCI. Results are proved, refuted with an escaping reply or terminal non-mate, or budget_exhausted. Five-plus is outside the convention.",
  raceArrival: "race-arrival@1: Two or more opposite-color named pawns with unblocked forward paths; side to move and the initial double push are respected; strict turn alternation models no captures, checks, king or piece activity. Ordering and per-pawn arrival distance are descriptive and contain no outcome verdict.",
  observedWindow: "observed-window@1: N consecutive move anchors retain N+1 ordered nodes, byte-equal shared FEN/node boundaries, canonical UCI and exact subject identity. Recorded order never establishes intent, force, best play or causality.",
});

const structuralEventOutputs = STRUCTURAL_EVENT_FAMILIES.map((family) => projection("rules.structural", `rules.structural.event.${family}`, "rules", {
  role: "event",
  payloadType: "StructuralSemanticEventOperands",
  semantics: `Identity-preserving signed before/after relation for structural family ${family}.`,
  operands: ["before_fen", "move_uci", "after_fen", "family", "before", "after"],
  signs: ["gained", "lost", "preserved"],
  grounding: family === "backward_pawn" || family === "king_opposition" ? "declared_convention" : "position_rules",
  exactness: family === "backward_pawn" || family === "king_opposition" ? "convention" : "exact",
  forms: ["list", "panel", "machine_condition"],
  limitations: ["The signed relation is literal and carries no learner valence or importance judgement."],
}));

const structuralOutputs = [
  ...STRUCTURAL_FEATURE_KINDS.map((kind) => projection("rules.structural", `rules.structural.predicate.${kind}`, "rules", {
    role: "predicate",
    payloadType: "StructuralFeaturePredicateResult",
    semantics: `Computed boolean result for one direct structural feature leaf of family ${kind}.`,
    operands: ["fen", "feature", "matched"],
    forms: ["machine_condition"],
    dependsOn: kind === "outpost" ? [ref("rules.structural.predicate.pawn_safe_square")] : [],
    limitations: kind === "pawn_safe_square" ? ["Enemy-pawn projection is a Tabiya convention, not legal-move safety."] : [],
  })),
  projection("rules.structural", "rules.structural.predicate.result", "rules", {
    role: "predicate",
    payloadType: "StructuralPredicateResult",
    semantics: "Total computed result for one authored StructuralExpression, retaining an exact path/node/result evaluation trace.",
    operands: ["fen", "condition", "matched", "trace"],
    forms: ["machine_condition"],
    dependsOn: [ref("authored.structural_condition.input")],
    limitations: ["plan_signature must be expanded before runtime evaluation, matching the structural evaluator contract."],
  }),
  ...STRUCTURAL_FEATURE_KINDS.map((kind) => projection("rules.structural", `rules.structural.reading.${kind}`, "rules", {
    payloadType: kind === "named_structure" ? "StructureMatch | StructuralObservation.named_structure" : "StructuralObservation",
    semantics: `Position reading emitted by structuralReading for family ${kind}.`,
    operands: kind === "named_structure" ? ["provenanceNote"] : ["kind", "squares"],
    forms: kind === "named_structure" ? ["sentence", "list", "panel", "lit_squares", "piece_halo"] : ["list", "panel", "lit_squares", "piece_halo"],
    limitations: kind === "pawn_count" ? ["The committed emission census reports zero observations; structuralReading cannot emit this kind."] : ["State alone does not establish relevance or learner valence."],
    ...(kind === "pawn_count" ? { disposition: retired("Zero emitted observations over the executable committed-corpus census; matcher-only at F1.") } : {}),
  })),
  projection("rules.structural", "rules.structural.reading.pawn_connectivity", "rules", {
    payloadType: "PawnConnectivityReading", semantics: "Exact per-color pawn islands, adjacent-file connected pairs, directed literal pawn-support edges, and maximal weak support chains with every base retained.",
    operands: ["fen", "colors"], answerContent: ["fact", "pattern"], forms: ["list", "panel", "lit_squares", "machine_condition"],
    limitations: ["Connectivity is literal pawn geometry; it is not a statement of strategic quality or a pack-authoring vocabulary member."],
    disposition: { kind: "inspector_only", reason: "Exact state evidence lands before measured module selection." },
  }),
  projection("rules.structural", "rules.structural.reading.space", "rules", {
    payloadType: "SpaceReading", semantics: "space@1: literal pawn-attacked squares in the enemy half, counted by queenside a-c, central d-e, and kingside f-h zones; differentials are White minus Black under this declared convention.",
    operands: ["fen", "conventionId", "colors", "differentials"], grounding: "declared_convention", exactness: "convention", answerContent: ["fact", "pattern"], forms: ["list", "panel", "lit_squares", "machine_condition"],
    limitations: ["Pawn control only; piece control, mobility, territory quality, recommendation, and move grade are outside space@1."],
    disposition: { kind: "inspector_only", reason: "Level reading only; the measured near-neutral delta is not registered as an event." },
  }),
  projection("rules.structural", "rules.structural.event.pawn_islands", "rules", {
    role: "event", payloadType: "PawnIslandEventOperands", semantics: "Exact per-color before/after occupied-file island count across one legal edge.",
    operands: ["before_fen", "move_uci", "after_fen", "family", "color", "before", "after"], signs: ["gained", "lost", "preserved"], forms: ["list", "panel", "machine_condition"],
    limitations: ["The signed count relation carries no learner valence or inferred plan."],
  }),
  ...structuralEventOutputs,
];

const transitionOutputs = TRANSITION_READING_LEAVES.map((leaf) => projection("rules.transition", `rules.transition.reading.${leaf}`, "transition", {
  payloadType: "TransitionObservation",
  semantics: `Count/direction transition reading for ${leaf}.`,
  operands: leaf.startsWith("move_irreversibility.") ? ["kind", "subkind", "provenanceNote"] : ["kind", "color", "direction", "count", "provenanceNote"],
  signs: leaf.endsWith("gained") || leaf.endsWith("acquired") || leaf.endsWith("opened") ? ["gained"] : leaf.endsWith("lost") || leaf.endsWith("released") || leaf.endsWith("closed") ? ["lost"] : ["state"],
  forms: ["sentence", "list", "panel"],
  limitations: ["Affected square, subject and object identities are not retained; this projection is not a semantic learner event."],
}));

const transitionEventOutputs = [
  ...TRANSITION_GEOMETRY_EVENT_FAMILIES.map((family) => projection("rules.transition", `rules.transition.event.${family}`, "transition", {
    role: "event", payloadType: "TransitionGeometryEventOperands", semantics: `Identity-preserving signed transition geometry for ${family}.`,
    operands: ["before_fen", "move_uci", "after_fen", "subject", "targets_before", "targets_after"], signs: ["gained", "lost", "preserved"],
    forms: ["list", "panel", "machine_condition"], limitations: ["Pseudo-legal geometry is not a tactical label, safety claim, or move grade."],
  })),
  ...TRANSITION_RULE_EVENT_FAMILIES.map((family) => projection("rules.transition", `rules.transition.event.${family}`, "transition", {
    role: "event", payloadType: "TransitionRuleEventOperands", semantics: `Independent exact transition-rule event for ${family}.`,
    operands: family === "capture" ? ["before_fen", "move_uci", "after_fen", "mover", "from", "to", "captured", "enPassant"] : ["before_fen", "move_uci", "after_fen", "mover", "from", "to", "detail"], signs: ["state"],
    ...(family === "developed" ? { semantics: "development@1: a role-matched minor leaves its home square (gained) or returns to it (lost). Knights use b/g files and bishops c/f; captures of a minor on its home square, castling, rook connection and queen movement are outside this event.", grounding: "declared_convention" as const, exactness: "convention" as const, signs: ["gained", "lost"] as const } : {}),
    forms: ["list", "panel", "machine_condition"], limitations: ["The literal development transition carries no learner valence, move grade, or complete-development claim."],
  })),
];

const avoidanceOutputs = [...STRUCTURAL_EVENT_FAMILIES, "loose_piece", "pawn_islands"].map((family) => {
  const input = ref(family === "loose_piece" ? "rules.tactic.event.loose_piece" : `rules.structural.event.${family}`);
  const convention = family === "backward_pawn" || family === "king_opposition" || family === "loose_piece";
  return projection("derived.semantic_avoidance", `derived.semantic_avoidance.${family}`, "derived", {
    role: "event", payloadType: "CounterfactualAbsenceOperands", semantics: `Complete-population counterfactual absence for structural family ${family}.`,
    operands: ["relation", "family", "legalAlternatives", "alternativesWithFamily", "alternativeEvents"], signs: ["avoided"],
    grounding: convention ? "declared_convention" : "position_rules", exactness: convention ? "convention" : "exact",
    ...(family === "loose_piece" ? { abstention: { possible: true as const, reasons: ["input_abstained"] } } : {}),
    forms: ["list", "panel", "machine_condition"], dependsOn: [input], derivation: { inputs: [input] },
    limitations: ["Avoided describes a complete local alternative relation, never inferred intent, praise, or move quality."],
  });
});

const LEGAL_EXCHANGE_SEMANTICS = "legal-exchange@1 evaluates one specified legal capture by legal recapture-only minimax on its landing square. Either side may stop. Material uses P=1, N=3, B=3, R=5, Q=9; promotion adds promoted-piece minus pawn. Illegal off-line pinned recaptures and illegal king captures are absent; legal along-ray recaptures and X-rays remain. Units are convention material, never centipawns.";
const THREAT_SEMANTICS = "threat@1 gives the move to the opponent and clears en-passant, then enumerates positive legal-exchange@1 captures and mate in one. It abstains while the side to move is in check. Quiet promotion, deeper mating nets, trapping threats and forking threats are outside this one-ply convention.";

const exchangeOutputs = [
  projection("rules.exchange", "rules.exchange.predicate.legal_exchange", "rules", {
    role: "predicate",
    payloadType: "LegalExchangeResult",
    semantics: LEGAL_EXCHANGE_SEMANTICS,
    operands: ["beforeFen", "captureUci", "landingSquare", "capturer", "captured", "branches", "chosenLine", "stopDecisions", "conventionId", "resultUnits"],
    grounding: "declared_convention",
    exactness: "convention",
    forms: ["machine_condition"],
    limitations: ["Local exchange only: zwischenzugs, replies elsewhere, position value and compensation are outside scope."],
    disposition: { kind: "experimental", reason: "Machine prerequisite for the research-only tactical collector wave; no direct product consumer is admitted at landing." },
  }),
];

const castlingOutputs = [
  projection("rules.castling", "rules.castling.reading.rights", "rules", {
    payloadType: "CastlingRightsState", semantics: "Exact per-color kingside and queenside castling rights read from the position state.",
    operands: ["fen", "white", "black"], forms: ["list", "panel"],
    limitations: ["A held right does not imply castling is currently legal or strategically desirable."],
    disposition: { kind: "inspector_only", reason: "Exact state input for later modules; no learner module is admitted by this collector RFC." },
  }),
  projection("rules.castling", "rules.castling.event.rights_lost", "rules", {
    role: "event", payloadType: "CastlingRightLostEvent", semantics: "Exact permanent castling-right loss with king-moved, rook-moved, rook-captured or castled cause. No purpose or prevention intent is inferred.",
    operands: ["beforeFen", "moveUci", "afterFen", "color", "wing", "cause"], signs: ["lost", "preserved"],
    forms: ["list", "panel", "machine_condition"], limitations: ["Permanent rights state only; transient legality is a separate reading."],
  }),
  projection("rules.castling", "rules.castling.reading.legality", "rules", {
    payloadType: "CastlingLegalityIssue", semantics: "For each held right, records whether castling is legal now and names check, blocked and attacked path squares.",
    operands: ["color", "wing", "kingSquare", "rookSquare", "legalNow", "inCheck", "blockedSquares", "attackedSquares"], forms: ["list", "panel"],
    limitations: ["Current legality is transient and does not establish intent, recommendation or future availability."],
    disposition: { kind: "inspector_only", reason: "Exact state input for later modules; no learner module is admitted by this collector RFC." },
  }),
];

const tacticalOutputs = [
  projection("rules.tactic", "rules.tactic.reading.loose_piece", "rules", {
    payloadType: "LoosePieceReading", semantics: "For each non-king piece belonging to the non-moving side, retains legal capturers, geometric defenders, legal-exchange@1 results and the en-prise, loose and under-defended convention flags.",
    operands: ["fen", "sideToMove", "pieces"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact", "threat"], forms: ["list", "panel", "machine_condition"], dependsOn: [ref("rules.exchange.predicate.legal_exchange")],
    limitations: ["Local exchange only; zwischenzugs, compensation and whole-position move quality are outside scope."],
    disposition: { kind: "inspector_only", reason: "Collector landing retains exact identities; Phase 3 decides learner-module eligibility." },
  }),
  projection("rules.tactic", "rules.tactic.reading.ray_classification", "rules", {
    payloadType: "RayClassificationReading", semantics: "Classifies one-blocker slider rays with precedence absolute pin, skewer, relative pin, then X-ray; each item retains slider, blocker, target, ray and any declared value comparison. Absolute-pin geometry is exact; the combined projection conservatively declares convention grounding.",
    operands: ["fen", "rays"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact", "pattern", "threat"], forms: ["list", "panel", "lit_squares", "piece_halo", "machine_condition"],
    limitations: ["State geometry is not a move grade, tactical inevitability or statement that a ray is important."],
    disposition: { kind: "inspector_only", reason: "State evidence lands before measured module selection; no ray event family is admitted here." },
  }),
  projection("rules.tactic", "rules.tactic.consequence.mate_in_one", "rules", {
    role: "reading", payloadType: "MateInOneReading", semantics: "Complete exact legal moves from the current position that immediately produce checkmate, retaining mover and mated-king identities.",
    operands: ["fen", "mates"], signs: ["threatened"], answerContent: ["threat"], forms: ["list", "panel", "machine_condition"],
    limitations: ["One legal ply only; empty means no mate in one and says nothing about deeper mating nets, move quality or back-rank susceptibility."],
    disposition: { kind: "inspector_only", reason: "Exact one-ply consequence is retained separately from convention states; Phase 3 decides learner presentation." },
  }),
  projection("rules.tactic", "rules.tactic.reading.discovered_latency", "rules", {
    payloadType: "DiscoveredLatencyReading", semantics: "A friendly non-king screen is the sole blocker between a friendly slider and an enemy target; removing the screen exposes either exact discovered check or a positive legal-exchange@1 capture. Slider, screen, target, ray and exchange operands are retained.",
    operands: ["fen", "screens"], grounding: "declared_convention", exactness: "convention", answerContent: ["fact", "pattern", "threat"], forms: ["list", "panel", "lit_squares", "arrows", "piece_halo", "machine_condition"],
    dependsOn: [ref("rules.exchange.predicate.legal_exchange")],
    limitations: ["Latent one-blocker geometry only; it does not claim the screen should move, that every screen move exposes the ray, or that the relation is important."],
    disposition: { kind: "inspector_only", reason: "Identity-retaining latent geometry lands before measured learner and bot eligibility." },
  }),
  projection("rules.tactic", "rules.tactic.reading.trapped_piece", "rules", {
    payloadType: "TrappedPieceReading", semantics: "trapped@1: a non-pawn, non-king piece of the side to move is locally trapped only when the opponent-turn clone has a positive legal-exchange@1 capture on its current square and every legal destination is locally losing. Capture destinations use their own exchange result; quiet destinations retain every positive opponent capture after relocation.",
    operands: ["kind", "conventionId", "pieces"], grounding: "declared_convention", exactness: "convention", answerContent: ["fact", "threat"], forms: ["list", "panel", "lit_squares", "arrows", "piece_halo", "machine_condition"],
    abstention: { possible: true, reasons: ["trapped_while_in_check"] }, dependsOn: [ref("rules.exchange.predicate.legal_exchange")],
    limitations: ["Local exchange and legal destinations only; defending moves, intermezzi, compensation, counterattacks and search-derived claims that the piece is lost are outside scope."],
    disposition: { kind: "inspector_only", reason: "Rare convention state lands before measured module and bot-feature admission." },
  }),
  projection("rules.tactic", "rules.tactic.reading.back_rank", "rules", {
    payloadType: "BackRankReading", semantics: "back_rank_susceptible@1: the king stands on its back rank, every non-back-rank king escape is blocked by an own piece or attacked, and an enemy rook/queen is already on that rank or has a file path to it containing no pawn of either color. Non-pawn path blockers do not suppress the convention state.",
    operands: ["fen", "conventionId", "susceptible"], grounding: "declared_convention", exactness: "convention", answerContent: ["fact", "threat"], forms: ["list", "panel", "lit_squares", "arrows", "piece_halo", "machine_condition"],
    limitations: ["Susceptibility is not mate, a move grade or inferred intent. Rank/diagonal approaches and whether an entry square is defended are outside this convention; exact mate-in-one is a separate projection."],
    disposition: { kind: "inspector_only", reason: "Convention state lands separately from exact mate and before learner-module selection." },
  }),
  projection("rules.tactic", "rules.tactic.reading.rook_on_seventh", "rules", {
    payloadType: "RookOnSeventhReading", semantics: "Exact rooks on the seventh rank relative to their color, retaining the enemy king on its back rank and enemy pawns on that rook rank as literal relevance operands without suppressing the state.",
    operands: ["fen", "rooks"], answerContent: ["fact", "pattern"], forms: ["list", "panel", "lit_squares", "piece_halo", "machine_condition"],
    limitations: ["The state does not infer king cutoff, importance, recommendation, or move quality."],
    disposition: { kind: "inspector_only", reason: "Literal state lands before learner eligibility joins king mobility and control." },
  }),
  projection("rules.tactic", "rules.tactic.consequence.threat", "rules", {
    role: "reading", payloadType: "ThreatResult", semantics: THREAT_SEMANTICS,
    operands: ["kind", "conventionId", "threats"], signs: ["threatened"], grounding: "declared_convention", exactness: "convention",
    abstention: { possible: true, reasons: ["pass_while_in_check"] }, answerContent: ["threat"], forms: ["list", "panel", "machine_condition"],
    dependsOn: [ref("rules.exchange.predicate.legal_exchange")],
    limitations: ["Threat presence is not a move grade, recommendation, forcing claim or statement of intent."],
    disposition: { kind: "inspector_only", reason: "D794 measured threat presence near background; module admission waits on Phase 3." },
  }),
  projection("rules.tactic", "rules.tactic.event.double_attack", "rules", {
    role: "event", payloadType: "DoubleAttackEvent", semantics: "The moved piece attacks at least two enemy targets after the move; each non-king target has a positive legal-exchange@1 capture by that piece. Geometry alone never emits this event.",
    operands: ["beforeFen", "moveUci", "afterFen", "mover", "targets"], signs: ["gained"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["threat"], forms: ["list", "panel", "machine_condition"], dependsOn: [ref("rules.exchange.predicate.legal_exchange")],
    limitations: ["An exact double attack is not a universal positive prior or a move grade."],
  }),
  projection("rules.tactic", "rules.tactic.consequence.reply_breadth", "rules", {
    role: "event", payloadType: "ReplyBreadth", semantics: "Complete legal reply UCIs after one triggering legal move. Zero replies is terminal, never only-reply; the exact count is never replaced by a forcing label.",
    operands: ["triggeringMove", "afterFen", "terminal", "check", "replies", "count", "horizon"], signs: ["state"],
    answerContent: ["fact"], forms: ["list", "panel", "machine_condition"],
    limitations: ["One-reply horizon only; reply count is not move quality or practical difficulty."],
  }),
  projection("rules.tactic", "rules.tactic.event.check", "rules", {
    role: "event", payloadType: "CheckEvent", semantics: "Exact check after the triggering move, retaining checking pieces, checked king, attack squares and slider rays.",
    operands: ["triggeringMove", "checkingPieces", "checkedKing", "attackSquares", "rays"], signs: ["state"],
    answerContent: ["fact"], forms: ["list", "panel", "machine_condition"],
    limitations: ["Check is a literal rule event, not a forcing or quality label."],
  }),
  projection("rules.tactic", "rules.tactic.event.loose_piece", "rules", {
    role: "event", payloadType: "LoosePieceEvent", semantics: "Identity-preserving mover-owned en-prise change. The before position is evaluated on an opponent-turn clone with en-passant cleared; the after position already gives the opponent the move.",
    operands: ["beforeFen", "moveUci", "afterFen", "mover", "before", "after"], signs: ["gained", "lost", "preserved"], grounding: "declared_convention", exactness: "convention", answerContent: ["fact", "threat"], forms: ["list", "panel", "machine_condition"], dependsOn: [ref("rules.tactic.reading.loose_piece")],
    abstention: { possible: true, reasons: ["invalid_turn_clone"] },
    limitations: ["Local legal-exchange relation only; no whole-position move grade, recommendation, or inferred intent."],
  }),
  projection("rules.tactic", "rules.tactic.reading.defender_duty_set", "rules", {
    payloadType: "DefenderDutyReading", semantics: SEMANTIC_CONVENTION_TEXT.defenceDuty,
    operands: ["fen", "duties"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    limitations: ["Pseudo duty may be legally unexecutable; co-defenders are retained specifically to prevent multi-duty state from being called overload."],
    disposition: { kind: "inspector_only", reason: "Exact duty identities land before module and bot eligibility." },
  }),
  projection("rules.tactic", "rules.tactic.event.defender_removed", "rules", {
    role: "event", payloadType: "DefenderRemovedEvent", semantics: "Exact capture identity joined to every retained non-king target duty held by the captured defender.",
    operands: ["move", "defender", "defenderRole", "target", "targetRole", "lostDuty"], signs: ["state"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    dependsOn: [ref("rules.transition.event.capture"), ref("rules.tactic.reading.defender_duty_set")],
    limitations: [SEMANTIC_CONVENTION_TEXT.defenceDuty, "Removal is an exact transition fact; it does not establish that the target is exploitable or name a tactic."],
  }),
  projection("rules.tactic", "rules.tactic.event.defender_duty_relocated", "rules", {
    role: "event", payloadType: "DefenderDutyRelocatedEvent", semantics: "The same defender relocates on the played edge, loses one named pseudo duty, and the target survives by exact identity.",
    operands: ["move", "defenderBefore", "defenderAfter", "target", "lostDuty"], signs: ["state"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    dependsOn: [ref("rules.tactic.reading.defender_duty_set")],
    limitations: [SEMANTIC_CONVENTION_TEXT.defenceDuty, "Relocation is never aliased to deflection or attraction without the separately declared observed consequence."],
  }),
  projection("rules.tactic", "rules.tactic.consequence.forced_mate_after_move", "rules", {
    role: "predicate", payloadType: "ForcedMateAfterMoveProof", semantics: SEMANTIC_CONVENTION_TEXT.mateProof,
    operands: ["candidate", "attacker", "maxAttackerMoves", "proofStatus", "proofDigest", "rootReplies", "nodes"], signs: ["state"],
    answerContent: ["candidate_moves"], forms: ["list", "panel", "machine_condition"],
    abstention: { possible: true, reasons: ["budget_exhausted", "horizon_above_four"] },
    dependsOn: [ref("rules.tactic.consequence.reply_breadth")],
    limitations: ["Exact only through four attacker moves under mate-proof@1. Five-plus, engine mate claims, move quality and king-zone inference are outside this projection."],
    disposition: { kind: "inspector_only", reason: "Bounded proof predicate lands before Support/Review module eligibility." },
  }),
];

const derivedTacticOutputs = [
  projection("derived.tactic", "derived.tactic.fork_survives_reply", "derived", {
    role: "predicate", payloadType: "ForkSurvivalResult", semantics: "For every exact legal reply, the moved piece survives and retains a positive legal-exchange@1 capture of at least one original non-king target on its original square. False results retain refuting replies.",
    operands: ["matched", "doubleAttack", "replyBreadth", "refutingReplies"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["threat"], forms: ["machine_condition", "list", "panel"],
    dependsOn: [ref("rules.tactic.event.double_attack"), ref("rules.tactic.consequence.reply_breadth"), ref("rules.exchange.predicate.legal_exchange")],
    derivation: { inputs: [ref("rules.tactic.event.double_attack"), ref("rules.tactic.consequence.reply_breadth"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["One-reply local survival only; no inevitability, quality or whole-position claim."],
    disposition: { kind: "inspector_only", reason: "Rare bounded consequence retained for inspection and later Review admission; no production module consumes it at landing." },
  }),
  projection("derived.tactic", "derived.tactic.discovered_executed", "derived", {
    role: "event", payloadType: "DiscoveredExecutedEvent", semantics: "Joins a before-state friendly screen/slider/enemy-target latency relation to the exact gained slider ray on the played edge, preserving all identities.",
    operands: ["beforeFen", "moveUci", "afterFen", "screen", "slider", "target", "raySquares", "discoveredCheck", "gainedRay"], signs: ["gained"], grounding: "declared_convention", exactness: "convention", answerContent: ["fact", "pattern", "threat"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    dependsOn: [ref("rules.tactic.reading.discovered_latency"), ref("rules.transition.event.slider_ray")], derivation: { inputs: [ref("rules.tactic.reading.discovered_latency"), ref("rules.transition.event.slider_ray")] },
    limitations: ["Execution inherits the bounded latency relation; it does not infer importance, intent, or move quality."],
  }),
  projection("derived.tactic", "derived.tactic.promotion_pressure", "derived", {
    role: "reading", payloadType: "PromotionPressureReading", semantics: "Exact passed-pawn promotion geometry with typed pass-clone and all-opponent-reply availability; it carries no outcome verdict.",
    operands: ["fen", "pawns"], signs: ["state"], answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "machine_condition"],
    dependsOn: [ref("rules.structural.predicate.passed_pawn"), ref("rules.structural.predicate.direct_attack_count"), ref("rules.structural.predicate.line_blockers")], derivation: { inputs: [ref("rules.structural.predicate.passed_pawn"), ref("rules.structural.predicate.direct_attack_count"), ref("rules.structural.predicate.line_blockers")] },
    limitations: ["Pressure description only; winner, drawing status and outcome words stay with Syzygy."],
    disposition: { kind: "inspector_only", reason: "Exact geometry lands before learner and bot eligibility." },
  }),
  projection("derived.tactic", "derived.tactic.defender_exposure", "derived", {
    role: "event", payloadType: "DefenderExposureOperands", semantics: "An exact lost pseudo-controller defence edge of the non-moving side joined to a retained target and positive legal-exchange@1 capture under the mover-turn/en-passant-cleared pass clone.",
    operands: ["beforeFen", "moveUci", "afterFen", "kind", "passConvention"], signs: ["gained", "state"], grounding: "declared_convention", exactness: "convention", answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    abstention: { possible: true, reasons: ["invalid_turn_clone"] }, dependsOn: [ref("rules.square.event.control"), ref("rules.exchange.predicate.legal_exchange")], derivation: { inputs: [ref("rules.square.event.control"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["The exact edge/capture join does not name removal, deflection, overload, force, success, safety, or move quality."],
  }),
  projection("derived.tactic", "derived.tactic.sequence.defender_consequence", "derived", {
    role: "event", payloadType: "DefenderConsequenceOperands", semantics: "Three consecutive recorded edges retaining the exact defender/target identity through edge loss or defender relocation and a positive third-edge target capture.",
    operands: ["kind", "anchors", "nodes", "defender", "target", "firstMoveCapturedDefender", "finalCapture"], signs: ["state"], grounding: "recorded_run", exactness: "convention", answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    dependsOn: [ref("rules.square.event.control"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange"), ref("run.record.move")], derivation: { inputs: [ref("run.record.move")] },
    limitations: ["Observed order does not emit removal, deflection, overload, force, tactic success, quality, intent, or causality."],
  }),
  projection("derived.tactic", "derived.tactic.overloaded_defender_response_conflict", "derived", {
    role: "predicate", payloadType: "OverloadedDefenderConflict", semantics: SEMANTIC_CONVENTION_TEXT.overloadConflict,
    operands: ["candidate", "soleDefender", "capturedTarget", "retainedTargets", "legalRecaptures", "positiveCaptures"], signs: ["state"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact"], forms: ["list", "panel", "machine_condition"],
    abstention: { possible: true, reasons: ["no_legal_recapture", "input_abstained"] },
    dependsOn: [ref("rules.tactic.reading.defender_duty_set"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")],
    derivation: { inputs: [ref("rules.tactic.reading.defender_duty_set"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["Candidate-time arithmetic only; it does not grade or recommend the candidate."],
    disposition: { kind: "inspector_only", reason: "Machine predicate lands before Support/Review module eligibility." },
  }),
  projection("derived.tactic", "derived.tactic.deflection_observed", "derived", {
    role: "event", payloadType: "DeflectionObservedOperands", semantics: `${SEMANTIC_CONVENTION_TEXT.observedWindow} A defender is displaced by capturing the bait or answering its check, loses a named duty, and the retained target is positively captured on the third edge.`,
    operands: ["baitMove", "defenderBefore", "defenderAfter", "lostDuty", "targetCapture"], signs: ["state"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    abstention: { possible: true, reasons: ["continuation_too_short", "input_abstained"] },
    dependsOn: [ref("run.record.move"), ref("rules.tactic.reading.defender_duty_set"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")],
    derivation: { inputs: [ref("run.record.move"), ref("rules.tactic.reading.defender_duty_set"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["Relocation without the retained positive target capture is a hard negative; recorded order proves neither force, intent nor move quality."],
  }),
  projection("derived.tactic", "derived.tactic.attraction_observed", "derived", {
    role: "event", payloadType: "AttractionObservedOperands", semantics: `${SEMANTIC_CONVENTION_TEXT.observedWindow} A king, queen or rook captures bait onto its destination; the opponent re-attacks that square and the retained heavy piece is checked on edge three or captured there on edge five.`,
    operands: ["baitMove", "heavyPiece", "arrivalSquare", "checkOrCaptureConsequence"], signs: ["state"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    abstention: { possible: true, reasons: ["continuation_too_short", "input_abstained"] },
    dependsOn: [ref("run.record.move"), ref("rules.transition.event.capture"), ref("rules.tactic.event.check")],
    derivation: { anyOf: [
      [ref("run.record.move"), ref("rules.transition.event.capture"), ref("rules.tactic.event.check")],
      [ref("run.record.move"), ref("rules.transition.event.capture")],
    ] },
    limitations: ["The K/Q/R restriction is load-bearing; minor-piece bait captures are a permanent hard negative and recorded order proves neither force nor intent."],
  }),
  projection("derived.tactic", "derived.tactic.line_blocker_clearance_observed", "derived", {
    role: "event", payloadType: "LineBlockerClearanceObservedOperands", semantics: `${SEMANTIC_CONVENTION_TEXT.observedWindow} A friendly sole blocker vacates the exact slider-target between-set; the unchanged slider later captures the retained non-king target with a positive legal-exchange@1 result.`,
    operands: ["blocker", "slider", "ray", "target", "targetCapture"], signs: ["state"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    abstention: { possible: true, reasons: ["continuation_too_short", "input_abstained"] },
    dependsOn: [ref("run.record.move"), ref("rules.exchange.predicate.legal_exchange")],
    derivation: { inputs: [ref("run.record.move"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["Opened geometry without the retained target consequence is only an operand; recorded order proves neither intent nor move quality."],
  }),
  projection("derived.tactic", "derived.tactic.square_clearance_observed", "derived", {
    role: "event", payloadType: "SquareClearanceObservedOperands", semantics: `${SEMANTIC_CONVENTION_TEXT.observedWindow} An exact square is vacated and a same-side B/R/Q later makes a quiet move to or through it from another source square.`,
    operands: ["vacatedSquare", "vacatingPiece", "laterSlider", "laterMove"], signs: ["state"], grounding: "recorded_run", exactness: "exact",
    answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    abstention: { possible: true, reasons: ["continuation_too_short", "input_abstained"] },
    dependsOn: [ref("run.record.move")], derivation: { inputs: [ref("run.record.move")] },
    limitations: ["The quiet clause keeps capture-consequence ray clearance in its separate family; recorded order proves neither intent nor move quality."],
  }),
  projection("derived.tactic", "derived.tactic.interference_observed", "derived", {
    role: "event", payloadType: "InterferenceObservedOperands", semantics: `${SEMANTIC_CONVENTION_TEXT.observedWindow} The attacking side interposes on an enemy slider's exact defence-duty between-set; the retained target is later captured with a positive legal-exchange@1 result.`,
    operands: ["interposingMove", "slider", "betweenSquare", "target", "brokenDuty", "targetCapture"], signs: ["state"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    abstention: { possible: true, reasons: ["continuation_too_short", "input_abstained"] },
    dependsOn: [ref("run.record.move"), ref("rules.tactic.reading.defender_duty_set"), ref("rules.exchange.predicate.legal_exchange")],
    derivation: { inputs: [ref("run.record.move"), ref("rules.tactic.reading.defender_duty_set"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["A blocker on an unrelated ray does not qualify; recorded order proves neither force nor intent."],
  }),
  projection("derived.tactic", "derived.tactic.check_zwischenzug_observed", "derived", {
    role: "event", payloadType: "CheckZwischenzugObservedOperands", semantics: `${SEMANTIC_CONVENTION_TEXT.observedWindow} A legal recapture exists; its mover instead gives check, the opponent answers, and the same recapturer then makes a positive legal-exchange@1 capture on the retained square.`,
    operands: ["expectedRecapture", "intermediateCheck", "reply", "retainedRecapture"], signs: ["state"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    abstention: { possible: true, reasons: ["continuation_too_short", "input_abstained"] },
    dependsOn: [ref("run.record.move"), ref("rules.transition.event.capture"), ref("rules.tactic.event.check"), ref("rules.exchange.predicate.legal_exchange")],
    derivation: { inputs: [ref("run.record.move"), ref("rules.transition.event.capture"), ref("rules.tactic.event.check"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["Check-intermezzo subset only; expected does not mean best, and quiet zwischenzugs remain outside this version."],
  }),
  projection("derived.tactic", "derived.tactic.overload_exploitation_observed", "derived", {
    role: "event", payloadType: "OverloadExploitationObservedOperands", semantics: `${SEMANTIC_CONVENTION_TEXT.observedWindow} A multi-duty defender's first target is captured, that defender recaptures, and a different retained target is then positively captured.`,
    operands: ["firstCapture", "defenderRecapture", "secondTargetCapture", "dutySet"], signs: ["state"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact"], forms: ["list", "panel", "lit_squares", "arrows", "machine_condition"],
    abstention: { possible: true, reasons: ["continuation_too_short", "input_abstained"] },
    dependsOn: [ref("run.record.move"), ref("rules.tactic.reading.defender_duty_set"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")],
    derivation: { inputs: [ref("run.record.move"), ref("rules.tactic.reading.defender_duty_set"), ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["The recapture is observed, not proved forced; one-duty defenders are a permanent hard negative."],
  }),
];

const derivedExchangeOutputs = [
  projection("derived.exchange", "derived.exchange.capture_class", "derived", {
    role: "event", payloadType: "CaptureClassEvent", semantics: "Classifies one exact capture as positive, equal or negative solely by its legal-exchange@1 result in declared material units. The arithmetic class is not a move grade.",
    operands: ["before_fen", "move_uci", "after_fen", "capture", "exchange", "class"], signs: ["state"], grounding: "declared_convention", exactness: "convention",
    answerContent: ["fact"], forms: ["list", "panel", "machine_condition"],
    dependsOn: [ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")],
    derivation: { inputs: [ref("rules.transition.event.capture"), ref("rules.exchange.predicate.legal_exchange")] },
    limitations: ["Local exchange arithmetic only; compensation, zwischenzugs and whole-position move quality remain outside scope. The landing binding is research selection only; no learner module consumes it."],
  }),
  projection("derived.exchange", "derived.exchange.trade_completed", "derived", {
    role: "event", payloadType: "TradeCompletedEvent", semantics: "Two immediately consecutive legal captures with a byte-identical shared position, the second capturing on the first capture's landing square.",
    operands: ["startFen", "firstMoveUci", "boundaryFen", "secondMoveUci", "endFen", "landingSquare", "first", "second", "moveAnchors"], signs: ["state"], grounding: "declared_convention", exactness: "exact", answerContent: ["fact"], forms: ["list", "panel", "machine_condition"],
    dependsOn: [ref("rules.transition.event.capture"), ref("run.record.move")], derivation: { inputs: [ref("rules.transition.event.capture"), ref("run.record.move")] },
    limitations: ["Immediate capture-recapture only; later return captures and strategic exchange judgements are outside scope."],
  }),
];

const inspectorOnly = (reason: string): EvidenceDispositionDeclaration => Object.freeze({ kind: "inspector_only", reason });
const breadthForms: readonly EvidenceForm[] = Object.freeze(["list", "panel", "lit_squares", "arrows", "piece_halo", "machine_condition"]);

const squareOutputs = [
  projection("rules.square", "rules.square.reading.control", "rules", {
    payloadType: "SquareControlReading", semantics: BREADTH_CONVENTION_TEXT.squareControl,
    operands: ["fen", "colors"], forms: breadthForms,
    abstention: { possible: true, reasons: ["invalid_turn_clone"] },
    limitations: ["Pseudo control remains available when one color's complete legal-controller set abstains; no individual target receives an invented occupant."],
    disposition: inspectorOnly("All-square topology lands for research and advanced inspection before module selection."),
  }),
  projection("rules.square", "rules.square.event.control", "rules", {
    role: "event", payloadType: "SquareControlEvent", semantics: "Exact gained or lost pseudo/legal controller edge joined by controller and target identity.",
    operands: ["beforeFen", "moveUci", "afterFen", "color", "mode", "sign", "target", "controller"], signs: ["gained", "lost"], forms: breadthForms,
    limitations: [BREADTH_CONVENTION_TEXT.squareControl, "Controller change carries no significance, safety, or move-quality verdict."],
  }),
];

const mobilityOutputs = [
  projection("rules.mobility", "rules.mobility.reading.piece_destinations", "rules", {
    payloadType: "PieceDestinationsReading", semantics: BREADTH_CONVENTION_TEXT.localNonLosing,
    operands: ["fen", "conventionId", "colors"], grounding: "declared_convention", exactness: "convention", forms: breadthForms,
    dependsOn: [ref("rules.exchange.predicate.legal_exchange")], abstention: { possible: true, reasons: ["invalid_turn_clone"] },
    limitations: ["B/N/R/Q legal destinations and their local one-exchange subset only; neither set is an engine recommendation."],
    disposition: inspectorOnly("Exact mobility sets land before module and bot-feature selection."),
  }),
  projection("rules.mobility", "rules.mobility.event.piece_destinations", "rules", {
    role: "event", payloadType: "PieceDestinationsEvent", semantics: "Exact before/after legal and local-non-losing destination sets for one retained B/N/R/Q identity.",
    operands: ["beforeFen", "moveUci", "afterFen", "color", "piece", "legalBefore", "legalAfter", "legalGained", "legalLost", "safeBefore", "safeAfter", "safeGained", "safeLost", "moved", "zeroSafe"],
    signs: ["state"], grounding: "declared_convention", exactness: "convention", forms: breadthForms, dependsOn: [ref("rules.mobility.reading.piece_destinations")],
    limitations: [BREADTH_CONVENTION_TEXT.localNonLosing, "zeroSafe is a literal transition and is never rendered as trapped without the separate attacked-piece predicate."],
  }),
];

const pawnOutputs = [
  projection("rules.pawn", "rules.pawn.reading.contacts", "rules", {
    payloadType: "PawnContactsReading", semantics: BREADTH_CONVENTION_TEXT.pawnRelations,
    operands: ["fen", "contacts", "locks", "passed", "connectedPassedPairs"], forms: breadthForms,
    limitations: ["Connected-passer rank distance is deliberately unrestricted; all pawn and blocker identities remain literal."],
    disposition: inspectorOnly("Exact pawn relations land before phase-aware learner selection."),
  }),
  projection("rules.pawn", "rules.pawn.reading.candidate_majority", "rules", {
    payloadType: "CandidateMajorityReading", semantics: BREADTH_CONVENTION_TEXT.candidateMajority,
    operands: ["fen", "conventionId", "candidates"], grounding: "declared_convention", exactness: "convention", forms: breadthForms,
    limitations: ["The convention deliberately omits a backward-pawn classifier and emits no plan or conversion verdict."],
    disposition: inspectorOnly("Convention state lands before phase-aware learner selection."),
  }),
  projection("rules.pawn", "rules.pawn.event.dynamics", "rules", {
    role: "event", payloadType: "PawnDynamicsEvent", semantics: "Typed literal gained pawn relation: lock, minor harassment, protected passer, connected passer pair, or candidate-majority state/advance.",
    operands: ["beforeFen", "moveUci", "afterFen", "kind", "subjects"], signs: ["gained", "state"], grounding: "declared_convention", exactness: "convention", forms: breadthForms,
    dependsOn: [ref("rules.pawn.reading.contacts"), ref("rules.pawn.reading.candidate_majority")],
    limitations: [BREADTH_CONVENTION_TEXT.pawnRelations, BREADTH_CONVENTION_TEXT.candidateMajority, "No break, danger, conversion, intent, or plan semantics are emitted."],
  }),
];

const kingOutputs = [
  projection("rules.king", "rules.king.reading.zone_state", "rules", {
    payloadType: "KingZoneReading", semantics: `${BREADTH_CONVENTION_TEXT.kingZone} ${BREADTH_CONVENTION_TEXT.kingShelter}`,
    operands: ["fen", "zoneConventionId", "shelterConventionId", "kings"], grounding: "declared_convention", exactness: "convention", forms: breadthForms,
    dependsOn: [ref("rules.square.reading.control")], abstention: { possible: true, reasons: ["invalid_turn_clone"] },
    limitations: ["Escape availability uses the per-color turn clone with en passant cleared; zone state emits no exposed, attack, or mating-net verdict."],
    disposition: inspectorOnly("Decomposed king operands land before capture/phase/module selection."),
  }),
  projection("rules.king", "rules.king.event.zone_state", "rules", {
    role: "event", payloadType: "KingZoneEvent", semantics: "Exact before/after escape, attacker, defender, shelter, and king-location sets under king-zone@1 and king-shelter@1.",
    operands: ["beforeFen", "moveUci", "afterFen", "color", "king", "attackers", "defenders", "shelter", "escapes"], signs: ["state"], grounding: "declared_convention", exactness: "convention", forms: breadthForms,
    dependsOn: [ref("rules.king.reading.zone_state")], limitations: [BREADTH_CONVENTION_TEXT.kingZone, BREADTH_CONVENTION_TEXT.kingShelter, "Set fidelity does not widen convention exactness or establish importance."],
  }),
];

const derivedPawnOutputs = [
  projection("derived.pawn", "derived.pawn.event.transitions", "derived", {
    role: "event", payloadType: "PawnTransitionEvent", semantics: "Exact contact execution and moved-pawn passage transitions joined to the existing capture and passed-pawn authorities.",
    operands: ["beforeFen", "moveUci", "afterFen", "kind", "pawn"], signs: ["state", "gained"], forms: breadthForms,
    dependsOn: [ref("rules.pawn.reading.contacts"), ref("rules.transition.event.capture"), ref("rules.structural.event.passed_pawn")], derivation: { inputs: [ref("rules.pawn.reading.contacts")] },
    limitations: ["Contact creation remains solely rules.transition.event.pawn_contact; observed passage arithmetic carries no outcome or plan language."],
  }),
  projection("derived.pawn", "derived.pawn.sequence.contact_timing", "derived", {
    role: "event", payloadType: "PawnContactTimingSequence", semantics: "Two-edge created/survived or three-edge created/executed recorded path with exact pawn/contact identities and byte-equal boundaries.",
    operands: ["kind", "anchors", "nodes", "pawn", "contactedPawn"], signs: ["state"], grounding: "recorded_run", exactness: "exact", forms: breadthForms,
    dependsOn: [ref("rules.transition.event.pawn_contact"), ref("rules.pawn.event.dynamics"), ref("run.record.move")], derivation: { inputs: [ref("run.record.move")] },
    limitations: ["Observed order does not establish intention, tempo, force, quality, or causality."],
  }),
  projection("derived.pawn", "derived.pawn.sequence.harassment_pressure", "derived", {
    role: "event", payloadType: "HarassmentPressureSequence", semantics: `Pawn newly attacks a bishop, that exact bishop relocates on the consecutive reply, and ${BREADTH_CONVENTION_TEXT.pressureLine}`,
    operands: ["kind", "anchors", "nodes", "pawn", "minor", "pressure", "conventionId"], signs: ["state"], grounding: "recorded_run", exactness: "convention", forms: breadthForms,
    dependsOn: [ref("rules.pawn.event.dynamics"), ref("run.record.move")], derivation: { inputs: [ref("run.record.move")] },
    limitations: ["The harassed minor is the retained relation's slider; a knight cannot satisfy this kind. Observed relocation establishes no force, quality, or intent."],
  }),
];

const derivedMaterialOutputs = [
  projection("derived.material", "derived.material.reading.role_signature", "derived", {
    payloadType: "MaterialRoleSignatureReading", semantics: BREADTH_CONVENTION_TEXT.materialRole,
    operands: ["fen", "conventionId", "colors", "asymmetry", "magnitude"], grounding: "position_rules", exactness: "exact", forms: breadthForms,
    dependsOn: [ref("rules.structural.reading.piece_count")], derivation: { inputs: [ref("rules.structural.reading.piece_count")] },
    limitations: ["No scalar material advantage, imbalance quality, or exchange advice is emitted."], disposition: inspectorOnly("Exact role vectors are inspector/module operands."),
  }),
  projection("derived.material", "derived.material.event.role_asymmetry", "derived", {
    role: "event", payloadType: "MaterialRoleAsymmetryEvent", semantics: "Exact before/after material-role vectors and strictly rising unweighted asymmetry magnitude, retaining applicable capture/promotion facts.",
    operands: ["beforeFen", "moveUci", "afterFen", "conventionId", "before", "after", "changedRoles", "increased", "sourceEvents"], signs: ["state"], grounding: "position_rules", exactness: "exact", forms: breadthForms,
    dependsOn: [ref("derived.material.reading.role_signature"), ref("rules.structural.event.piece_count"), ref("rules.transition.event.capture"), ref("rules.transition.event.promotion")],
    derivation: { anyOf: [
      [ref("derived.material.reading.role_signature"), ref("rules.transition.event.capture")],
      [ref("derived.material.reading.role_signature"), ref("rules.transition.event.promotion")],
      [ref("derived.material.reading.role_signature"), ref("rules.transition.event.capture"), ref("rules.transition.event.promotion")],
    ] },
    limitations: [BREADTH_CONVENTION_TEXT.materialRole, "Role-count change is not a trade recommendation or position evaluation."],
  }),
];

const derivedKingOutputs = [projection("derived.king", "derived.king.captured_zone_defender", "derived", {
  role: "event", payloadType: "CapturedZoneDefenderOperands", semantics: "Exact generic capture identity joined to the captured piece's prior king-zone defender role; en passant uses the destination file and origin rank.",
  operands: ["beforeFen", "moveUci", "afterFen", "capture", "capturedSquare", "kingColor", "defender"], signs: ["state"], grounding: "declared_convention", exactness: "convention", forms: breadthForms,
  abstention: { possible: true, reasons: ["input_abstained", "invalid_turn_clone"] },
  dependsOn: [ref("rules.transition.event.capture"), ref("rules.king.reading.zone_state")], derivation: { inputs: [ref("rules.transition.event.capture"), ref("rules.king.reading.zone_state")] },
  limitations: ["No second capture detector and no generic weakened-king verdict."],
})];

const derivedActivityOutputs = [projection("derived.activity", "derived.activity.event.open_file_occupancy", "derived", {
  role: "event", payloadType: "OpenFileOccupancyOperands", semantics: "A moved rook/queen newly occupies a file already classified open or half-open for that mover, while its source file had neither class.",
  operands: ["beforeFen", "moveUci", "afterFen", "piece", "fileClass", "sourceReading"], signs: ["gained"], grounding: "position_rules", exactness: "exact", forms: breadthForms,
  dependsOn: [ref("rules.structural.reading.open_file"), ref("rules.structural.reading.half_open_file")], derivation: { anyOf: [[ref("rules.structural.reading.open_file")], [ref("rules.structural.reading.half_open_file")]] },
  limitations: ["Stationary-piece file-class changes do not fire. Occupancy does not imply activity, control, importance, or improvement."],
})];

export const EVIDENCE_PRODUCERS: readonly ProducerDeclaration[] = Object.freeze([
  producer("rules.structural", "rules", "packages/runtime/src/structure.ts", "local", structuralOutputs),
  producer("rules.transition", "transition", "packages/runtime/src/transition.ts", "local", [...transitionOutputs, ...transitionEventOutputs]),
  producer("rules.castling", "rules", "packages/runtime/src/castling.ts", "local", castlingOutputs),
  producer("rules.exchange", "rules", "packages/runtime/src/exchange.ts", "local", exchangeOutputs),
  producer("rules.tactic", "rules", "packages/runtime/src/tactics.ts", "local", tacticalOutputs),
  producer("rules.square", "rules", "packages/runtime/src/square-control.ts", "local", squareOutputs),
  producer("rules.mobility", "rules", "packages/runtime/src/mobility.ts", "local", mobilityOutputs),
  producer("rules.pawn", "rules", "packages/runtime/src/pawn-dynamics.ts", "local", pawnOutputs),
  producer("rules.king", "rules", "packages/runtime/src/king-state.ts", "local", kingOutputs),
  producer("rules.phase", "rules", "packages/runtime/src/phase.ts", "local", [
    projection("rules.phase", "rules.phase.reading", "rules", { payloadType: "PhaseReading", operands: ["fen", "phase", "material", "undevelopedMinors", "provenanceNote"], forms: ["sentence", "panel"] }),
    projection("rules.phase", "rules.phase.development", "rules", {
      payloadType: "DevelopmentReading", semantics: "development@1 state: role-matched knights on b/g home squares and bishops on c/f home squares are retained per color. This intentionally differs from the role-agnostic count used only by the phase band classifier.",
      operands: ["fen", "conventionId", "undeveloped"], grounding: "declared_convention", exactness: "convention",
      answerContent: ["fact", "pattern"], forms: ["list", "panel", "piece_halo"],
      limitations: ["Minor-piece home-square state only; it is not a complete opening-development score or move grade."],
      disposition: { kind: "inspector_only", reason: "Exact convention state lands before learner-module and bot-feature selection." },
    }),
  ]),
  producer("rules.pivotal", "rules", "packages/runtime/src/pivotal.ts", "local", [projection("rules.pivotal", "rules.pivotal.marker", "rules", { payloadType: "PivotalMarker", operands: ["nodeId", "kind", "detail", "provenanceNote"], forms: ["timeline_marker", "sentence", "panel"] })]),
  producer("rules.endgame", "rules", "packages/runtime/src/endgame.ts", "local", [projection("rules.endgame", "rules.endgame.reading", "rules", { payloadType: "EndgameReading", operands: ["type", "techniques", "provenanceNote"], forms: ["sentence", "panel"] })]),
  producer("theory.shapes", "theory", "packages/runtime/src/shape-firing.ts; apps/server/src/shape-registry.ts", "local", [projection("theory.shapes", "theory.shapes.firing", "theory", { payloadType: "ShapeFiring", grounding: "authored_claim", exactness: "authored", operands: ["entryId", "firstNodeId", "lastNodeId", "openEnded"], answerContent: ["pattern", "theory", "plan"], forms: ["sentence", "panel", "timeline_marker"], limitations: ["A trigger match does not infer an uncited strategic consequence."] })]),
  producer("authored.structural_condition", "authored", "packages/runtime/src/structural-evidence.ts; apps/server/src/pack-orchestrator.ts; apps/server/src/shape-registry.ts", "recorded", [
    projection("authored.structural_condition", "authored.structural_condition.input", "authored", { role: "predicate", payloadType: "AuthoredStructuralCondition", grounding: "authored_claim", exactness: "authored", operands: ["source", "documentId", "pointer", "expression"], answerContent: ["fact"], forms: ["machine_condition"], limitations: ["Source identifies pack or shape authority; authored input is not a computed truth value or learner guidance."] }),
  ]),
  producer("pack.authored", "authored", "apps/server/src/authored-feedback.ts", "recorded", [
    projection("pack.authored", "pack.authored.claim", "authored", { payloadType: "AuthoredClaimEvidence", grounding: "authored_claim", exactness: "authored", operands: ["id", "text", "attribution"], answerContent: ["fact", "pattern", "theory", "principle", "plan"], forms: ["sentence", "panel"], limitations: ["Normalized rendered claim; delivery-sheet binding metadata travels under pack.authored.claim_delivery."] }),
    projection("pack.authored", "pack.authored.claim_delivery", "authored", { payloadType: "AuthoredFeedbackItem.claim", grounding: "authored_claim", exactness: "authored", operands: ["kind", "id", "text", "binding", "evidenceTypes", "earnedEvidenceTypes", "principles"], answerContent: ["fact", "pattern", "theory", "principle", "plan"], forms: ["sentence", "panel"], limitations: ["Full delivery-sheet claim item; normalized voice prose uses pack.authored.claim."] }),
    projection("pack.authored", "pack.authored.phase", "authored", { payloadType: "PackPhase", grounding: "authored_claim", exactness: "authored", answerContent: ["fact"], forms: ["sentence", "panel"], limitations: ["The authored phase label is a pack declaration, not the rules detector output."] }),
  ]),
  producer("recorded.engine", "search", "apps/server/src/position-evidence.ts", "recorded", [projection("recorded.engine", "recorded.engine.eval", "search", { role: "source_record", payloadType: "EngineReading", grounding: "bounded_search", exactness: "measured", confidence: "reported", operands: ["kind", "fen", "sourceId", "retrievedAt", "values"], answerContent: ["evaluation"], forms: ["sentence", "panel"], limitations: ["Single-line recorded score only; best move and principal variation are absent."] })]),
  producer("recorded.tablebase", "search", "apps/server/src/position-evidence.ts", "recorded", [projection("recorded.tablebase", "recorded.tablebase.result", "search", { role: "source_record", payloadType: "TablebaseReading", grounding: "tablebase_exact", operands: ["kind", "fen", "sourceId", "retrievedAt", "values"], answerContent: ["fact", "evaluation"], forms: ["sentence", "panel"], abstention: { possible: true, reasons: ["outside_tablebase_domain"] } })]),
  producer("live.stockfish", "search", "apps/server/src/evidence-queue.ts; apps/server/src/rest.ts", "provider", [
    projection("live.stockfish", "live.stockfish.uci_response", "search", { role: "source_record", payloadType: "readonly UCI line[]", grounding: "bounded_search", exactness: "measured", confidence: "reported", answerContent: ["evaluation", "candidate_moves", "move", "principal_variation"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["provider_unavailable"] }, limitations: ["Raw bounded-search response used by opponent selection; not an attached run event or learner-facing explanation."] }),
    projection("live.stockfish", "live.stockfish.eval", "search", { role: "event", payloadType: "EvidencePayload.eval", grounding: "bounded_search", exactness: "measured", confidence: "reported", operands: ["kind", "source", "values"], answerContent: ["evaluation"], forms: ["panel", "machine_condition"], abstention: { possible: true, reasons: ["provider_unavailable"] }, limitations: ["Adapter excludes bestMoveUci from fact-only consumers."] }),
    projection("live.stockfish", "live.stockfish.wdl", "search", { role: "event", payloadType: "EvidencePayload.wdl", grounding: "bounded_search", exactness: "measured", confidence: "reported", operands: ["kind", "source", "values"], answerContent: ["evaluation"], forms: ["panel", "machine_condition"], abstention: { possible: true, reasons: ["provider_unavailable"] } }),
    projection("live.stockfish", "live.stockfish.pv", "search", { role: "event", payloadType: "EvidencePayload.bestline", grounding: "bounded_search", exactness: "measured", confidence: "reported", operands: ["kind", "source", "values"], answerContent: ["move", "principal_variation"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["provider_unavailable"] }, limitations: ["Explicit Analyze consumer only; never a guidance binding."] }),
  ]),
  producer("live.syzygy", "search", "apps/server/src/tablebase.ts; apps/server/src/evidence-queue.ts", "provider", [
    projection("live.syzygy", "live.syzygy.probe_result", "search", { role: "source_record", payloadType: "TablebasePosition", grounding: "tablebase_exact", operands: ["category", "moves"], answerContent: ["fact", "evaluation", "candidate_moves", "move"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["outside_tablebase_domain", "provider_unavailable"] }, limitations: ["Raw position-and-move probe used by opponent selection; not an attached run event."] }),
    projection("live.syzygy", "live.syzygy.result", "search", { role: "event", payloadType: "EvidencePayload.tablebase", grounding: "tablebase_exact", operands: ["kind", "source", "values"], answerContent: ["fact", "evaluation"], forms: ["panel"], abstention: { possible: true, reasons: ["outside_tablebase_domain", "provider_unavailable"] }, limitations: ["Whole attached tablebase event retained for evidence-reference delivery; category/distance consumers use their narrower projections."] }),
    projection("live.syzygy", "live.syzygy.category", "search", { role: "event", payloadType: "Tablebase category", grounding: "tablebase_exact", operands: ["category"], answerContent: ["fact", "evaluation"], forms: ["panel", "machine_condition"], abstention: { possible: true, reasons: ["outside_tablebase_domain", "provider_unavailable"] } }),
    projection("live.syzygy", "live.syzygy.distance", "search", { role: "event", payloadType: "Tablebase distances", grounding: "tablebase_exact", operands: ["category"], answerContent: ["fact", "evaluation"], forms: ["panel", "machine_condition"], abstention: { possible: true, reasons: ["outside_tablebase_domain", "provider_unavailable"] }, limitations: ["Distance is a measurement; no optimality-boundary verdict is inferred."] }),
  ]),
  producer("human.maia", "human", "apps/server/src/opponent-selector.ts; apps/server/src/rest.ts", "provider", [
    projection("human.maia", "human.maia.uci_response", "human", { role: "source_record", payloadType: "readonly UCI line[]", grounding: "human_model", exactness: "measured", confidence: "reported", answerContent: ["candidate_moves", "move"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["provider_unavailable", "model_failure"] }, limitations: ["Raw model response used by opponent selection; policy mass describes model choice, not move quality."] }),
    projection("human.maia", "human.maia.policy", "human", { role: "source_record", payloadType: "HumanSplitPage", grounding: "human_model", exactness: "measured", confidence: "reported", operands: ["nodeId", "engine", "targetElo", "candidates"], answerContent: ["candidate_moves"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["provider_unavailable", "model_failure"] }, limitations: ["Policy mass describes model choice, not move quality."] }),
    projection("human.maia", "human.maia.candidate_wdl", "human", { role: "source_record", payloadType: "MaiaCandidateWdlProjection", grounding: "human_model", exactness: "measured", confidence: "reported", operands: ["nodeId", "engine", "targetElo", "candidates"], answerContent: ["evaluation"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["provider_unavailable", "model_failure", "empty_population"] }, limitations: ["Per-candidate model WDL is retained exactly for inspection; it is not a move grade, recommendation, or middlegame oracle."], disposition: { kind: "inspector_only", reason: "D744: retain already-transported Maia candidate WDL without admitting it to a learner module." } }),
    projection("human.maia", "human.maia.event", "human", { role: "event", payloadType: "EvidencePayload.human_model_predicted", grounding: "human_model", exactness: "measured", confidence: "reported", operands: ["kind", "source", "values"], answerContent: ["candidate_moves", "move"], forms: ["panel"], abstention: { possible: true, reasons: ["provider_unavailable", "model_failure"] }, limitations: ["Attached model event records a model output, not move quality or advice."] }),
  ]),
  producer("human.explorer", "human", "apps/server/src/corpus.ts; apps/server/src/rest.ts", "provider", [
    projection("human.explorer", "human.explorer.population", "human", { role: "source_record", payloadType: "CorpusPage", grounding: "human_corpus", exactness: "measured", confidence: "reported", operands: ["nodeId", "result", "committedMoveSan"], answerContent: ["fact", "candidate_moves"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["source_unavailable", "empty_population"] }, limitations: ["On-request inspector page; population counts do not grade or recommend a move."] }),
    projection("human.explorer", "human.explorer.position_stats", "human", { role: "source_record", payloadType: "CorpusResult", grounding: "human_corpus", exactness: "measured", confidence: "reported", operands: ["kind", "population"], answerContent: ["fact", "candidate_moves"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["source_unavailable", "empty_population"] }, limitations: ["Per-position frontier result used by repertoire scanning; counts do not grade or recommend a move."] }),
  ]),
  producer("theory.opening_identity", "theory", "apps/server/src/sourcing/openings.ts", "build_time", [projection("theory.opening_identity", "theory.opening_identity.record", "theory", { role: "source_record", payloadType: "opening_identity EvidenceRecord", grounding: "cited_theory", exactness: "measured", confidence: "reported", operands: ["kind", "sourceId", "retrievedAt", "values"], answerContent: ["theory"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["no_catalogue_match"] }, limitations: ["Authoring provenance only at F1; not a runtime guidance sentence."] })]),
  producer("run.record", "record", "packages/runtime/src/compare-strips.ts; packages/runtime/src/story.ts; packages/runtime/src/branch-path.ts; apps/web/src/lib/evidence-sentences.ts", "recorded", [
    projection("run.record", "run.record.fork", "record", { payloadType: "RecordedForkNarrative", grounding: "recorded_run", operands: ["context", "forkNodeId", "sharedPly"], forms: ["sentence", "list", "panel"] }),
    projection("run.record", "run.record.move", "record", { payloadType: "RecordedMoveNarrative", grounding: "recorded_run", operands: ["context", "offset", "moveSan"], answerContent: ["fact", "move"], forms: ["sentence", "list", "panel"], limitations: ["This is an already-played recorded move, never a recommendation."] }),
    projection("run.record", "run.record.checkpoint_hit", "record", { payloadType: "RecordedCheckpointNarrative", grounding: "recorded_run", operands: ["context", "checkpointId", "plyOffset"], forms: ["sentence", "timeline_marker", "panel"] }),
    projection("run.record", "run.record.objective_transition", "record", { payloadType: "RecordedObjectiveNarrative", grounding: "recorded_run", operands: ["context", "from", "to"], forms: ["sentence", "timeline_marker", "panel"] }),
    projection("run.record", "run.record.consequence", "record", { payloadType: "RecordedConsequenceNarrative", grounding: "recorded_run", operands: ["context", "terminal"], forms: ["sentence", "timeline_marker", "panel"] }),
    projection("run.record", "run.record.imported_result", "record", { payloadType: "ImportedResultNarrative", grounding: "recorded_run", operands: ["context", "result"], forms: ["sentence", "panel"], limitations: ["A claim of the imported document, not a rules-derived outcome."] }),
    projection("run.record", "run.record.evidence_ref_resolution", "record", { payloadType: "EvidenceReferenceResolution", grounding: "declared_convention", exactness: "convention", operands: ["reference", "text", "sourceLabel"], answerContent: ["fact"], forms: ["sentence", "machine_condition"], limitations: ["A family-only reference token does not retain predicate operands or independently establish the referenced semantic fact; attached provider bytes travel as a separate declared source item."] }),
  ]),
  producer("derived.compare_narrative", "derived", "packages/runtime/src/compare-strips.ts:comparisonNarrative", "local", [
    projection("derived.compare_narrative", "derived.compare.engine_trajectory", "derived", { payloadType: "ComparisonEvidenceEntry", grounding: "bounded_search", exactness: "measured", confidence: "reported", operands: ["nodeId", "plyOffset", "evidenceRefs", "kind", "source", "score"], answerContent: ["evaluation"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["input_abstained", "no_recorded_trail"] }, derivation: { inputs: [ref("live.stockfish.eval")] }, limitations: ["Recorded run-relative point; provider-only fields omitted and no best-move claim retained."] }),
    projection("derived.compare_narrative", "derived.compare.structure_delta", "derived", { payloadType: "StructuralObservationChange", grounding: "position_rules", operands: ["observation"], forms: ["sentence", "list", "panel"], derivation: { inputs: STRUCTURAL_READER_WITNESSES.map((kind) => ref(`rules.structural.reading.${kind}`)) } }),
    projection("derived.compare_narrative", "derived.compare.piece_route", "derived", { payloadType: "PieceRoute", grounding: "recorded_run", operands: ["pieceId", "squares"], answerContent: ["fact", "move"], forms: ["list", "panel"], derivation: { inputs: [ref("run.record.move")] }, limitations: ["Route restates recorded moves after the fork; it is not a plan, threat or recommendation."] }),
    projection("derived.compare_narrative", "derived.compare.eval_delta", "derived", { payloadType: "RecordedEvalDelta", grounding: "bounded_search", exactness: "measured", confidence: "reported", operands: ["delta", "plyOffset"], answerContent: ["evaluation"], forms: ["sentence", "list", "panel"], abstention: { possible: true, reasons: ["input_abstained", "no_recorded_trail"] }, derivation: { inputs: [ref("live.stockfish.eval")] } }),
  ]),
  producer("derived.story", "derived", "packages/runtime/src/story.ts:storyMoments; suggestTitle", "local", [
    projection("derived.story", "derived.story.eval_shift", "derived", { payloadType: "StoryEvaluationShift", grounding: "bounded_search", exactness: "measured", confidence: "reported", operands: ["before", "after", "delta"], semantics: "Learner-side signed difference of two recorded Stockfish evaluations; learner side is an orientation parameter.", answerContent: ["evaluation"], forms: ["sentence", "panel"], abstention: { possible: true, reasons: ["input_abstained"] }, derivation: { inputs: [ref("live.stockfish.eval")] } }),
    projection("derived.story", "derived.story.last_level", "derived", { payloadType: "StoryLastLevel", grounding: "declared_convention", exactness: "convention", operands: ["recordedResult", "evaluation"], semantics: "Within-one-pawn threshold gated by whether the imported result says the learner lost.", answerContent: ["fact", "evaluation"], forms: ["sentence", "panel"], abstention: { possible: true, reasons: ["input_abstained"] }, derivation: { inputs: [ref("live.stockfish.eval"), ref("run.record.imported_result")] } }),
    projection("derived.story", "derived.story.rank", "derived", { payloadType: "StoryRank", grounding: "declared_convention", exactness: "convention", operands: ["rank"], semantics: "Fixed kind-priority order with absolute recorded-evaluation delta as a tiebreak; presentation prominence, not chess significance.", answerContent: ["fact", "pattern", "evaluation"], forms: ["list", "panel"], abstention: { possible: true, reasons: ["input_abstained"] }, derivation: { inputs: [ref("derived.story.eval_shift"), ref("derived.story.last_level"), ref("run.record.consequence"), ref("run.record.imported_result"), ref("rules.pivotal.marker"), ref("rules.endgame.reading"), ref("theory.shapes.firing")] } }),
    projection("derived.story", "derived.story.title", "derived", { payloadType: "StoryTitle", grounding: "declared_convention", exactness: "convention", operands: ["title", "rank", "outcome"], semantics: "Fixed title composition over rank, recorded outcome/result, and endgame label; imported result verbs retain the current White-relative convention.", answerContent: ["fact", "pattern", "evaluation"], forms: ["sentence", "panel"], abstention: { possible: true, reasons: ["input_abstained"] }, derivation: { inputs: [ref("derived.story.rank"), ref("run.record.consequence"), ref("run.record.imported_result"), ref("rules.endgame.reading")] } }),
  ]),
  producer("derived.grade", "derived", "packages/runtime/src/grade.ts", "local", [
    projection("derived.grade", "derived.grade.move_quality", "derived", {
      payloadType: "MoveQualityGrade",
      semantics: "Learner-POV loss class under grade-convention@1, retaining both typed scores, the unrounded win-percentage drop, threshold, context, lane, engine and search limit; no best move or principal variation.",
      operands: ["klass", "arm", "before", "after", "dropWinPercent", "thresholdCrossed", "convention", "engineId", "lane", "depthOrMovetime"],
      grounding: "bounded_search", exactness: "convention", confidence: "reported",
      abstention: { possible: true, reasons: ["input_abstained", "missing_eval", "unequal_instrument", "mate_score_inconsistent"] },
      answerContent: ["evaluation"], forms: ["sentence", "panel"],
      derivation: { inputs: [ref("recorded.engine.eval"), ref("live.stockfish.eval")] },
      limitations: ["Single-line evals only: the drop compares one engine's paired readings at one search limit.", "Not a lesson: the grade can be right about the position and wrong about the reason."],
      disposition: { kind: "experimental", reason: "Awaits learner-module consumer compilation for postcommit_nudge and review_map." },
    }),
  ]),
  producer("derived.exchange", "derived", "packages/runtime/src/exchange.ts", "local", derivedExchangeOutputs),
  producer("derived.tactic", "derived", "packages/runtime/src/tactics.ts; packages/runtime/src/semantic-evidence.ts", "local", derivedTacticOutputs),
  producer("derived.pawn", "derived", "packages/runtime/src/pawn-dynamics.ts", "local", derivedPawnOutputs),
  producer("derived.material", "derived", "packages/runtime/src/material-state.ts", "local", derivedMaterialOutputs),
  producer("derived.king", "derived", "packages/runtime/src/semantic-evidence.ts", "local", derivedKingOutputs),
  producer("derived.activity", "derived", "packages/runtime/src/semantic-evidence.ts", "local", derivedActivityOutputs),
  producer("sourcing.ledger", "record", "apps/server/src/sourcing/types.ts; apps/server/src/sourcing/claim-binding.ts", "recorded", [
    projection("sourcing.ledger", "sourcing.ledger.engine_eval", "record", { role: "source_record", payloadType: "engine_eval EvidenceRecord", grounding: "bounded_search", exactness: "measured", confidence: "reported", operands: ["kind", "sourceId", "retrievedAt", "values"], answerContent: ["evaluation"], forms: ["list", "panel"], limitations: ["Offline sourcing record including anchor and provenance; not a runtime engine reading."] }),
    projection("sourcing.ledger", "sourcing.ledger.tablebase_result", "record", { role: "source_record", payloadType: "tablebase_result EvidenceRecord", grounding: "tablebase_exact", operands: ["kind", "sourceId", "retrievedAt", "values"], answerContent: ["fact", "evaluation"], forms: ["list", "panel"], limitations: ["Offline sourcing record including anchor and provenance; not a live tablebase event."] }),
    projection("sourcing.ledger", "sourcing.ledger.explorer_position_census", "record", { role: "source_record", payloadType: "explorer_position_census EvidenceRecord", grounding: "human_corpus", exactness: "measured", confidence: "reported", operands: ["kind", "sourceId", "retrievedAt", "values"], answerContent: ["fact"], forms: ["list", "panel"], limitations: ["Offline position-census record; not an on-request Explorer page."] }),
  ]),
  producer("derived.semantic_avoidance", "derived", "packages/runtime/src/semantic-evidence.ts", "local", avoidanceOutputs),
]);

interface ConsumerSpec {
  readonly id: string;
  readonly implementation: string;
  readonly projections?: readonly string[];
  readonly timing?: ConsumerDeclaration["timing"];
  readonly roles?: ConsumerDeclaration["roles"];
  readonly sessions?: readonly string[];
  readonly forms?: readonly EvidenceForm[];
  readonly answerContent?: readonly AnswerDistance[];
  readonly latency?: ConsumerDeclaration["latency"];
  readonly budget?: ConsumerDeclaration["budget"];
  readonly providerOff?: ProviderOffBehavior;
  readonly disposition?: EvidenceDispositionDeclaration;
}

const DEFAULT_TIMING: readonly EvidenceTiming[] = Object.freeze(["postcommit", "checkpoint", "attempt_end", "terminal", "review", "analysis"]);
const DEFAULT_ROLES: readonly EvidenceRole[] = Object.freeze(["learner", "host", "participant", "spectator", "author", "operator"]);
const DEFAULT_SESSIONS: readonly string[] = Object.freeze(["pack", "position", "imported"]);
const DEFAULT_FORMS: readonly EvidenceForm[] = Object.freeze(["list", "panel"]);
const DEFAULT_ANSWERS: readonly AnswerDistance[] = Object.freeze(["fact"]);
const DEFAULT_LATENCY: ConsumerDeclaration["latency"] = Object.freeze({ mode: "interactive", maxMs: 4_000 });
const DEFAULT_BUDGET: ConsumerDeclaration["budget"] = Object.freeze({ maxFacts: 64, maxForms: 4 });

const allPredicateIds = STRUCTURAL_PREDICATE_PROJECTION_IDS;
const structuralPredicateResultId = "rules.structural.predicate.result";
const authoredStructuralConditionId = "authored.structural_condition.input";
const allStructuralReadingIds = STRUCTURAL_READING_PROJECTION_IDS.filter((id) => !id.endsWith(".pawn_count"));
const allTransitionReadingIds = TRANSITION_READING_PROJECTION_IDS;
const CONSUMER_SPECS: readonly ConsumerSpec[] = [
  { id: "authoring.predicate", implementation: "declared structural-condition/result validation adapters; validators; expression census", projections: [authoredStructuralConditionId, structuralPredicateResultId, ...allPredicateIds], timing: ["analysis"], roles: ["author"], forms: ["machine_condition"], answerContent: ["fact"] },
  { id: "runtime.objective_condition", implementation: "packages/runtime/src/objective.ts; apps/server/src/pack-orchestrator.ts", projections: [structuralPredicateResultId, "live.stockfish.eval", "live.syzygy.category"], forms: ["machine_condition"], answerContent: ["fact", "evaluation"] },
  { id: "runtime.guard_condition", implementation: "packages/runtime/src/guard.ts", projections: ["live.stockfish.eval", "live.syzygy.category", "live.syzygy.distance"], forms: ["machine_condition"], answerContent: ["fact", "evaluation"] },
  { id: "guidance.deterministic", implementation: "apps/server/src/guidance.ts sentence assembly", projections: ["rules.phase.reading", "pack.authored.phase", "rules.structural.reading.named_structure", "rules.pivotal.marker", "rules.endgame.reading", "pack.authored.claim"], forms: ["sentence"], answerContent: ["fact", "pattern", "theory", "principle", "plan"] },
  { id: "guidance.voice", implementation: "renderVoice; voiceCheck; external-voice.ts", projections: ["rules.phase.reading", "pack.authored.phase", "rules.structural.reading.named_structure", "rules.pivotal.marker", "rules.endgame.reading", "pack.authored.claim"], forms: ["sentence", "audio"], answerContent: ["fact", "pattern", "theory", "principle", "plan"], providerOff: "available" },
  { id: "guidance.recorded_reading", implementation: "appendRecordedReadings; renderRecordedReading", projections: ["recorded.engine.eval", "recorded.tablebase.result"], timing: ["postcommit", "checkpoint", "attempt_end", "terminal", "review"], forms: ["sentence"], answerContent: ["fact", "evaluation"] },
  { id: "runtime.evidence_ref", implementation: "packages/runtime/src/evidence-ref.ts; apps/web/src/lib/evidence-sentences.ts", projections: ["run.record.evidence_ref_resolution", "live.stockfish.eval", "live.stockfish.wdl", "live.stockfish.pv", "live.syzygy.result", "human.maia.event"], forms: ["sentence", "list", "panel", "machine_condition"], answerContent: ["fact", "evaluation", "candidate_moves", "move", "principal_variation"] },
  { id: "inspector.position_structure", implementation: "apps/web/src/lib/DrillScreen.svelte structural section", projections: allStructuralReadingIds },
  { id: "inspector.move_transition", implementation: "apps/web/src/lib/DrillScreen.svelte What changed section", projections: allTransitionReadingIds },
  { id: "board.selected_square_sight", implementation: "DrillScreen.svelte:selectedObservations; boardOverlays", projections: allStructuralReadingIds, timing: ["precommit", "postcommit"], forms: ["lit_squares", "piece_halo"], answerContent: ["fact"], budget: { maxFacts: 16, maxForms: 2 } },
  { id: "theory.shape_firing", implementation: "shapeFirings; ShapePanel.svelte", projections: ["theory.shapes.firing"], forms: ["sentence", "panel", "timeline_marker"], answerContent: ["pattern", "theory", "plan"] },
  { id: "compare.structure_strip", implementation: "compare-strips.ts:consumeComparisonStripEvidence; CompareView.svelte", projections: ["run.record.checkpoint_hit", "run.record.objective_transition", "rules.pivotal.marker", "derived.compare.structure_delta", "derived.compare.piece_route"], timing: ["review"], forms: ["sentence", "list", "timeline_marker", "panel"], answerContent: ["fact", "move"] },
  { id: "compare.engine_trajectory", implementation: "compare-strips.ts:comparisonEngineTrajectory; CompareView.svelte", projections: ["derived.compare.engine_trajectory"], timing: ["review"], forms: ["list", "panel"], answerContent: ["evaluation"] },
  { id: "inspector.human_split", implementation: "rest.ts human-split; DrillScreen.svelte", projections: ["human.maia.policy"], timing: ["postcommit", "review", "analysis"], forms: ["list", "panel"], answerContent: ["candidate_moves"], providerOff: "unavailable" },
  { id: "inspector.corpus", implementation: "rest.ts corpus; renderCorpusPage; DrillScreen.svelte", projections: ["human.explorer.population"], timing: ["postcommit", "review", "analysis"], forms: ["list", "panel"], answerContent: ["fact", "candidate_moves"], providerOff: "honest_empty" },
  { id: "opponent.selection", implementation: "selectMove; opponent-selector", projections: ["human.maia.uci_response", "live.stockfish.uci_response", "live.syzygy.probe_result"], timing: ["analysis"], roles: ["operator"], forms: ["list", "panel"], answerContent: ["fact", "evaluation", "candidate_moves", "move", "principal_variation"], budget: { maxFacts: null, maxForms: null }, providerOff: "unavailable" },
  { id: "guidance.authored_claim", implementation: "claim-presentation.ts; CheckpointSheet.svelte; TerminalSheet.svelte", projections: ["pack.authored.claim_delivery"], forms: ["sentence", "panel"], answerContent: ["fact", "pattern", "theory", "principle", "plan"] },
  { id: "board.pivotal_marker", implementation: "DrillScreen.svelte; renderPivotalMarker", projections: ["rules.pivotal.marker"], forms: ["timeline_marker", "sentence", "panel"], answerContent: ["fact"] },
  { id: "review.story", implementation: "storyMoments; renderReviewStoryEvidence; service.story; GameStoryScreen.svelte", projections: ["rules.pivotal.marker", "theory.shapes.firing", "run.record.consequence", "run.record.imported_result", "rules.endgame.reading", "derived.story.eval_shift", "derived.story.last_level", "derived.story.rank", "derived.story.title"], timing: ["review"], roles: ["learner", "host", "participant", "spectator"], forms: ["sentence", "timeline_marker", "list", "panel"], answerContent: ["fact", "pattern", "evaluation"] },
  { id: "runtime.repertoire_scan", implementation: "repertoire.ts:scanRepertoire; corpusPopulation", projections: ["human.explorer.position_stats"], timing: ["analysis"], roles: ["operator"], forms: ["list", "panel"], answerContent: ["fact"], budget: { maxFacts: null, maxForms: null }, providerOff: "honest_empty" },
  { id: "authoring.claim_binding", implementation: "sourcing/claim-binding.ts:validateClaimBindings", projections: ["sourcing.ledger.engine_eval", "sourcing.ledger.tablebase_result", "sourcing.ledger.explorer_position_census", "theory.opening_identity.record"], timing: ["analysis"], roles: ["author"], forms: ["list", "panel"], answerContent: ["fact", "theory", "evaluation"], latency: { mode: "offline", maxMs: null }, budget: { maxFacts: null, maxForms: null }, providerOff: "honest_empty" },
  { id: "guidance.voice_compare", implementation: "rest.ts compare voice; comparisonNarrative", projections: ["run.record.fork", "run.record.move", "run.record.checkpoint_hit", "run.record.objective_transition", "run.record.consequence", "rules.pivotal.marker", "derived.compare.structure_delta", "derived.compare.eval_delta"], timing: ["review"], forms: ["sentence"], answerContent: ["fact", "evaluation", "move"], providerOff: "available" },
  { id: "guidance.voice_story", implementation: "rest.ts story voice and speech; storyMoments; suggestTitle", projections: ["rules.phase.reading", "pack.authored.phase", "rules.structural.reading.named_structure", "rules.pivotal.marker", "rules.endgame.reading", "pack.authored.claim", "theory.shapes.firing", "run.record.consequence", "run.record.imported_result", "derived.story.eval_shift", "derived.story.last_level", "derived.story.title"], timing: ["review"], forms: ["sentence", "audio"], answerContent: ["fact", "pattern", "theory", "principle", "plan", "evaluation"], providerOff: "available" },
  { id: "assistance.arrows", implementation: "apps/web/src/lib/assistance-preference.ts; AssistanceSettings.svelte", disposition: { kind: "experimental", reason: "D546: migrated preference has no producer and no renderer; F5 or an owner ruling decides activation or retirement." } },
  { id: "research.semantic_selection", implementation: "packages/runtime/src/semantic-evidence.ts; tools/r2-selection-harness", projections: SEMANTIC_EVENT_PROJECTION_IDS, timing: ["analysis"], roles: ["operator"], forms: ["machine_condition"], answerContent: ["fact", "threat"], latency: { mode: "sync", maxMs: 4_000 }, budget: { maxFacts: 2, maxForms: 1 } },
];

export const EVIDENCE_CONSUMERS: readonly ConsumerDeclaration[] = Object.freeze(CONSUMER_SPECS.map((spec) => Object.freeze({
  id: spec.id,
  version: 1,
  implementation: spec.implementation,
  accepts: Object.freeze((spec.projections ?? []).map(ref)),
  timing: Object.freeze(spec.timing ?? DEFAULT_TIMING),
  roles: Object.freeze(spec.roles ?? DEFAULT_ROLES),
  sessions: Object.freeze(spec.sessions ?? DEFAULT_SESSIONS),
  forms: Object.freeze(spec.forms ?? DEFAULT_FORMS),
  answerContent: Object.freeze(spec.answerContent ?? DEFAULT_ANSWERS),
  latency: Object.freeze(spec.latency ?? DEFAULT_LATENCY),
  budget: Object.freeze(spec.budget ?? DEFAULT_BUDGET),
  providerOff: spec.providerOff ?? "available",
  ...(spec.disposition === undefined ? {} : { disposition: Object.freeze(spec.disposition) }),
})));

const producerByProjection = new Map(EVIDENCE_PRODUCERS.flatMap((item) => item.outputs.map((output) => [output.id, item] as const)));

export const EVIDENCE_ADAPTERS: readonly AdapterDeclaration[] = Object.freeze(CONSUMER_SPECS.flatMap((spec) => (spec.projections ?? []).map((projectionId, index) => {
  const source = producerByProjection.get(projectionId);
  if (source === undefined) throw new TypeError(`Catalogue consumer ${spec.id} names missing projection ${projectionId}`);
  const projectionValue = source.outputs.find((value) => value.id === projectionId)!;
  const forms = (spec.forms ?? DEFAULT_FORMS).filter((form) => projectionValue.forms.includes(form));
  const answers = (spec.answerContent ?? DEFAULT_ANSWERS).filter((answer) => projectionValue.answerContent.includes(answer));
  return Object.freeze({
    id: `adapter.${spec.id}.${index + 1}`,
    version: 1,
    implementation: spec.implementation,
    producer: ref(source.id),
    projection: ref(projectionId),
    consumer: ref(spec.id),
    timing: Object.freeze(spec.timing ?? DEFAULT_TIMING),
    roles: Object.freeze(spec.roles ?? DEFAULT_ROLES),
    sessions: Object.freeze(spec.sessions ?? DEFAULT_SESSIONS),
    forms: Object.freeze(forms.length === 0 ? [projectionValue.forms[0]!] : forms),
    answerContent: Object.freeze(answers.length === 0 ? [projectionValue.answerContent[0]!] : answers),
    latency: Object.freeze(spec.latency ?? DEFAULT_LATENCY),
    budget: Object.freeze(spec.budget ?? DEFAULT_BUDGET),
    ...(source.availability === "provider" ? { providerOff: spec.providerOff ?? "available" } : {}),
  });
})));

const R2_EXTERNAL_POPULATION = "r2-imported-sample@a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec";
export const SEMANTIC_EVENT_DECLARATIONS: readonly SemanticEventDeclaration[] = Object.freeze(SEMANTIC_EVENT_PROJECTION_IDS.map((projectionId) => {
  const source = producerByProjection.get(projectionId);
  const output = source?.outputs.find((candidate) => candidate.id === projectionId);
  if (output === undefined) throw new TypeError(`Semantic event catalogue names missing projection ${projectionId}`);
  return Object.freeze({
    projection: ref(projectionId),
    ...(output.derivation === undefined ? {}
      : output.derivation.inputs !== undefined
        ? { derivationInputs: Object.freeze(output.derivation.inputs) }
        : { derivationAnyOf: Object.freeze(output.derivation.anyOf.map((member) => Object.freeze(member))) }),
    allowedSigns: Object.freeze(output.signs),
    requiredOperands: Object.freeze(output.operands),
    valence: "none" as const,
    validation: Object.freeze({
      positives: Object.freeze([`semantic-event:${projectionId}:positive`]),
      hardNegatives: Object.freeze([`semantic-event:${projectionId}:hard-negative`]),
      externalPopulation: R2_EXTERNAL_POPULATION,
    }),
  });
}));

const ELIGIBILITY_REASON_IDS = Object.freeze([
  "eligible_validated_literal", "source_abstained", "source_projection_unbound", "payload_invalid",
  "required_operand_missing", "event_unvalidated", "consumer_refused", "sign_refused", "valence_unbacked",
] as const);
const SELECTION_REASON_IDS = Object.freeze([
  "no_eligible_events", "insufficient_alternatives", "nothing_distinctive", "budget_zero",
  "counterfactual_population_incomplete", "critical_budget_exhausted",
] as const);
export const EVIDENCE_REASON_DECLARATIONS: readonly EvidenceReasonDeclaration[] = Object.freeze([
  ...ELIGIBILITY_REASON_IDS.map((id) => Object.freeze({ id, version: 1, stage: "eligibility" as const, meaning: id.replaceAll("_", " ") })),
  ...SELECTION_REASON_IDS.map((id) => Object.freeze({ id, version: 1, stage: "selection" as const, meaning: id.replaceAll("_", " ") })),
]);

export const EVIDENCE_ELIGIBILITY_DECLARATIONS: readonly EvidenceEligibilityDeclaration[] = Object.freeze(SEMANTIC_EVENT_DECLARATIONS.map((event) => Object.freeze({
  event: event.projection,
  consumer: ref("research.semantic_selection"),
  disposition: "eligible" as const,
  reason: ref("eligible_validated_literal"),
  allowedSigns: event.allowedSigns,
  requiredOperands: event.requiredOperands,
  valenceAuthority: Object.freeze([]),
})));

export const EVIDENCE_SELECTION_POLICIES: readonly EvidenceSelectionPolicyDeclaration[] = Object.freeze([
  Object.freeze({
    id: "research.r2_candidate", version: 1, consumer: ref("research.semantic_selection"), disposition: "experimental",
    minimumAlternatives: 8, maximumSameFamilyShare: 0.20, minimumAlternativeOnlyShare: 0.30, maxFacts: 2,
    criticalEvents: Object.freeze(["checkmate", "promotion", "castled", "last_of_role"].map((family) => ref(`rules.transition.event.${family}`))),
  }),
]);

export const EVIDENCE_CONTRACT_DECLARATIONS: EvidenceContractDeclarations = Object.freeze({
  producers: EVIDENCE_PRODUCERS,
  consumers: EVIDENCE_CONSUMERS,
  adapters: EVIDENCE_ADAPTERS,
  semanticEvents: SEMANTIC_EVENT_DECLARATIONS,
  eligibility: EVIDENCE_ELIGIBILITY_DECLARATIONS,
  reasons: EVIDENCE_REASON_DECLARATIONS,
  selectionPolicies: EVIDENCE_SELECTION_POLICIES,
});

export const PRIMARY_EVIDENCE_MANIFEST = compileEvidenceManifest(EVIDENCE_CONTRACT_DECLARATIONS);
