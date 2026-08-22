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
  readonly derivation?: { readonly inputs: readonly VersionedEvidenceId[] };
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
    ...(options.derivation === undefined ? {} : { derivation: Object.freeze({ inputs: Object.freeze(options.derivation.inputs) }) }),
    limitations: Object.freeze(options.limitations ?? []),
    ...(options.disposition === undefined ? {} : { disposition: options.disposition }),
  });
}

export const EVIDENCE_PRODUCER_IDS = Object.freeze([
  "rules.structural", "rules.transition", "rules.castling", "rules.exchange", "rules.tactic", "rules.phase", "rules.pivotal", "rules.endgame",
  "theory.shapes", "authored.structural_condition", "pack.authored", "recorded.engine", "recorded.tablebase", "live.stockfish",
  "live.syzygy", "human.maia", "human.explorer", "theory.opening_identity", "run.record",
  "derived.compare_narrative", "derived.story", "derived.exchange", "derived.tactic", "sourcing.ledger",
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
export const TRANSITION_EVENT_PROJECTION_IDS = Object.freeze([...TRANSITION_GEOMETRY_EVENT_FAMILIES, ...TRANSITION_RULE_EVENT_FAMILIES].map((family) => `rules.transition.event.${family}`));
export const AVOIDANCE_EVENT_PROJECTION_IDS = Object.freeze(STRUCTURAL_EVENT_FAMILIES.map((family) => `derived.semantic_avoidance.${family}`));
export const TACTICAL_EVENT_PROJECTION_IDS = Object.freeze([
  "rules.tactic.event.double_attack",
  "rules.tactic.consequence.reply_breadth",
  "rules.tactic.event.check",
] as const);
export const CASTLING_EVENT_PROJECTION_IDS = Object.freeze(["rules.castling.event.rights_lost"] as const);
export const DERIVED_EXCHANGE_EVENT_PROJECTION_IDS = Object.freeze(["derived.exchange.capture_class"] as const);
export const SEMANTIC_EVENT_PROJECTION_IDS = Object.freeze([...STRUCTURAL_EVENT_PROJECTION_IDS, ...TRANSITION_EVENT_PROJECTION_IDS, ...AVOIDANCE_EVENT_PROJECTION_IDS, ...TACTICAL_EVENT_PROJECTION_IDS, ...CASTLING_EVENT_PROJECTION_IDS, ...DERIVED_EXCHANGE_EVENT_PROJECTION_IDS]);

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

const avoidanceOutputs = STRUCTURAL_EVENT_FAMILIES.map((family) => {
  const input = ref(`rules.structural.event.${family}`);
  const convention = family === "backward_pawn" || family === "king_opposition";
  return projection("derived.semantic_avoidance", `derived.semantic_avoidance.${family}`, "derived", {
    role: "event", payloadType: "CounterfactualAbsenceOperands", semantics: `Complete-population counterfactual absence for structural family ${family}.`,
    operands: ["relation", "family", "legalAlternatives", "alternativesWithFamily", "alternativeEvents"], signs: ["avoided"],
    grounding: convention ? "declared_convention" : "position_rules", exactness: convention ? "convention" : "exact",
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
];

export const EVIDENCE_PRODUCERS: readonly ProducerDeclaration[] = Object.freeze([
  producer("rules.structural", "rules", "packages/runtime/src/structure.ts", "local", structuralOutputs),
  producer("rules.transition", "transition", "packages/runtime/src/transition.ts", "local", [...transitionOutputs, ...transitionEventOutputs]),
  producer("rules.castling", "rules", "packages/runtime/src/castling.ts", "local", castlingOutputs),
  producer("rules.exchange", "rules", "packages/runtime/src/exchange.ts", "local", exchangeOutputs),
  producer("rules.tactic", "rules", "packages/runtime/src/tactics.ts", "local", tacticalOutputs),
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
  producer("derived.exchange", "derived", "packages/runtime/src/exchange.ts", "local", derivedExchangeOutputs),
  producer("derived.tactic", "derived", "packages/runtime/src/tactics.ts", "local", derivedTacticOutputs),
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
    ...(output.derivation === undefined ? {} : { derivationInputs: Object.freeze(output.derivation.inputs) }),
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
