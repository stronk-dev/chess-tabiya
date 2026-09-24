// rfc/evidence-presentation.md §2.3/§8.2 — the pair-keyed presentation adapters for the ordinary,
// Inspector and author/operator consumer populations outside the learner-module seats, and the
// production consumer classification (`PRESENTATION_CONSUMER_CLASSES`) `make component-coverage`
// derives the presented populations from.
//
// Every string is a fixed template over typed, parsed operands (§3.10a) in learner vocabulary: chess
// notation, registered labels and the declared convention's own wording — never an id, an enum
// token, a digest or a bare UCI string, and never a grade, a ranking or advice. A component never
// selects: every adapter renders exactly the one admitted evidence item it is given.
//
// Imports only types from `presentation-contract.ts` (the registry injects its construction kit),
// so the registry has no import cycle.

import type { Color, Role, SquareName } from "chessops/types";

import { MODULE_CONSUMER_IDS } from "./evidence-catalog.js";
import type { DeclaredEvidence, EvidenceForm, VersionedEvidenceId } from "./evidence-contract.js";
import { RULES_EVIDENCE_FACTS, type RulesEvidenceFact } from "./evidence-ref.js";
import type { AdapterSpec, ComponentValue, ConventionReceipt, DistributionOperand, PresentationKit } from "./presentation-contract.js";
import { PresentationSchemaError, factRenderer, listPhrase, plural, s, side, type Parser } from "./presentation-schema.js";
import type { ReviewEnginePoint, ReviewEvalDelta, ReviewMateTransition } from "./review-points.js";

// ---------------------------------------------------------------------------------------------
// §2.3 — the production consumer classification
// ---------------------------------------------------------------------------------------------

/**
 * The route-backed presentation class of a consumer. `module_presented` is the Checkpoint-B learner
 * module-seat population; `module.full_inspector@1` joins the Inspector class (§2.3).
 */
export type PresentationConsumerClass =
  | "ordinary_presented"
  | "inspector_presented"
  | "author_operator_presented"
  | "module_presented"
  | "non_presentational_operation";

export interface PresentationConsumerClassRow {
  readonly consumer: string;
  readonly class: PresentationConsumerClass;
  /** The real source file through which the consumer is reached, and its operation symbol. */
  readonly reachabilityAnchor: string;
  readonly operation: string;
}

const classRow = (consumer: string, classification: PresentationConsumerClass, reachabilityAnchor: string, operation: string): PresentationConsumerClassRow =>
  Object.freeze({ consumer, class: classification, reachabilityAnchor, operation });

/**
 * The twenty non-module consumers with a non-machine binding, re-derived from the author plan's rows
 * (`tools/d1862-presentation-adapter-plan/plan.ts`), followed by one row per registered module
 * consumer. Role or a `list/panel` form is not evidence of a route; the anchor is.
 */
export const PRESENTATION_CONSUMER_CLASSES: readonly PresentationConsumerClassRow[] = Object.freeze([
  classRow("authoring.claim_binding@1", "author_operator_presented", "apps/server/src/sourcing/claim-binding.ts", "consumeClaimBindingRecords"),
  classRow("board.pivotal_marker@1", "ordinary_presented", "packages/runtime/src/pivotal.ts", "consumePivotalMarkers"),
  classRow("board.selected_square_sight@1", "ordinary_presented", "packages/runtime/src/reading-evidence.ts", "consumeSelectedSquareSight"),
  classRow("compare.engine_trajectory@1", "ordinary_presented", "packages/runtime/src/compare-strips.ts", "consumeComparisonEngineTrajectory"),
  classRow("compare.structure_strip@1", "ordinary_presented", "packages/runtime/src/compare-strips.ts", "consumeComparisonStripEvidence"),
  classRow("guidance.authored_claim@1", "ordinary_presented", "apps/web/src/lib/claim-presentation.ts", "claimProvenanceDeclared"),
  classRow("guidance.deterministic@1", "ordinary_presented", "apps/server/src/guidance.ts", "renderedEvidenceItems"),
  classRow("guidance.recorded_reading@1", "ordinary_presented", "apps/server/src/guidance.ts", "renderRecordedReadingEvidence"),
  classRow("guidance.voice@1", "ordinary_presented", "apps/server/src/guidance.ts", "voiceEvidenceView"),
  classRow("guidance.voice_compare@1", "ordinary_presented", "packages/runtime/src/compare-strips.ts", "comparisonNarrative"),
  classRow("guidance.voice_story@1", "ordinary_presented", "packages/runtime/src/story.ts", "storyDeclaredEvidence"),
  classRow("inspector.corpus@1", "inspector_presented", "apps/web/src/lib/inspector-evidence.ts", "consumeCorpus"),
  classRow("inspector.human_split@1", "inspector_presented", "apps/web/src/lib/inspector-evidence.ts", "consumeHumanSplit"),
  classRow("inspector.move_transition@1", "inspector_presented", "packages/runtime/src/reading-evidence.ts", "consumeMoveTransition"),
  classRow("inspector.position_structure@1", "inspector_presented", "packages/runtime/src/reading-evidence.ts", "consumePositionStructure"),
  classRow("opponent.selection@1", "non_presentational_operation", "apps/server/src/opponent-selector.ts", "consumeOpponentSelectionEvidence"),
  classRow("review.story@1", "ordinary_presented", "packages/runtime/src/story.ts", "renderReviewStoryReceipt"),
  classRow("runtime.evidence_ref@1", "inspector_presented", "apps/web/src/lib/evidence-sentences.ts", "renderDeclaredEvidenceRef"),
  classRow("runtime.repertoire_scan@1", "non_presentational_operation", "apps/server/src/repertoire.ts", "consumeRepertoireCorpus"),
  classRow("theory.shape_firing@1", "ordinary_presented", "packages/runtime/src/shape-firing.ts", "consumeShapeFiring"),
  ...MODULE_CONSUMER_IDS.map((id) => classRow(`${id}@1`, id === "module.full_inspector" ? "inspector_presented" : "module_presented", "packages/runtime/src/evidence-catalog.ts", id)),
]);

/** The class of one `id@version` consumer, or `undefined` when it is unclassified. */
export function presentationConsumerClass(consumer: string): PresentationConsumerClass | undefined {
  return PRESENTATION_CONSUMER_CLASSES.find((row) => row.consumer === consumer)?.class;
}

// ---------------------------------------------------------------------------------------------
// §3.12 — structured-document schemas (author/operator only)
// ---------------------------------------------------------------------------------------------

const RECORD_FIELDS = ["kind", "sourceId", "retrievedAt", "values"] as const;

/**
 * rfc/evidence-presentation.md §3.12: literal structured-document schema ids, each with its role
 * ceiling and closed field list. Author/operator surfaces only; a learner route may not request one.
 */
export const STRUCTURED_DOCUMENT_SCHEMAS = Object.freeze({
  "authoring.engine_eval_record@1": { label: "Offline engine evaluation record", roles: ["author", "operator"], fields: RECORD_FIELDS, recordKind: "engine_eval" },
  "authoring.tablebase_result_record@1": { label: "Offline tablebase result record", roles: ["author", "operator"], fields: RECORD_FIELDS, recordKind: "tablebase_result" },
  "authoring.explorer_census_record@1": { label: "Offline game-corpus census record", roles: ["author", "operator"], fields: RECORD_FIELDS, recordKind: "explorer_position_census" },
  "authoring.citable_text_record@1": { label: "Citable text record", roles: ["author", "operator"], fields: [...RECORD_FIELDS, "supports"], recordKind: "citable_text" },
  "authoring.opening_identity_record@1": { label: "Opening identity record", roles: ["author", "operator"], fields: RECORD_FIELDS, recordKind: "opening_identity" },
} as const);

// ---------------------------------------------------------------------------------------------
// Registered fact renderers (§3.10a)
// ---------------------------------------------------------------------------------------------

const fail = (label: string, message: string): never => { throw new PresentationSchemaError(`${label} ${message}`); };
/** A finite non-negative number (provider WDL values arrive as shares or per-mille counts). */
const nonNegative: Parser<number> = (value, label) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fail(label, "must be a finite non-negative number"));

/** A whole-percent share; never a caller-supplied percentage (criterion 8). */
const percent = (share: number): string => (share > 0 && share < 0.005 ? "under 1%" : `${Math.round(share * 100)}%`);
const pawnsText = (centipawns: number): string => `${centipawns >= 0 ? "+" : "−"}${(Math.abs(centipawns) / 100).toFixed(2)}`;

const PHASES = ["opening", "middlegame", "endgame"] as const;
const pivotalSchema = s.union("kind", {
  phase_change: s.obj({ kind: s.lit("phase_change"), from: s.lit(...PHASES), to: s.lit(...PHASES) }),
  irreversibility: s.obj({ kind: s.lit("irreversibility"), subkind: s.lit("castled", "last_of_role", "pawn_break"), color: s.color }, { role: s.role, queensOff: s.bool }),
  option_collapse: s.obj({ kind: s.lit("option_collapse"), color: s.color, priorCount: s.nat, count: s.nat, nextCount: s.nat }),
  human_divergence: s.obj({ kind: s.lit("human_divergence"), model: s.str, shares: s.arr(s.unit, { min: 1, max: 3 }) }, { band: s.nat }),
});

const STRUCTURAL_KINDS = Object.freeze([
  "backward_pawn", "bishop_on_shade", "direct_attack_count", "doubled_pawn", "half_open_file", "isolated_pawn", "king_opposition", "king_zone",
  "line_blockers", "open_file", "outpost", "passed_pawn", "pawn_safe_square", "piece_count", "piece_distance", "piece_reach_count",
] as const);
type StructuralKind = (typeof STRUCTURAL_KINDS)[number];
const STRUCTURAL_LABELS: Readonly<Record<StructuralKind, string>> = Object.freeze({
  backward_pawn: "backward pawn", bishop_on_shade: "bishop and its square colour", direct_attack_count: "pieces attacking a square",
  doubled_pawn: "doubled pawns", half_open_file: "half-open file", isolated_pawn: "isolated pawn", king_opposition: "kings in opposition",
  king_zone: "king on the edge of the board", line_blockers: "pieces blocking a line", open_file: "open file", outpost: "outpost",
  passed_pawn: "passed pawn", pawn_safe_square: "square no opposing pawn can reach", piece_count: "counted pieces",
  piece_distance: "distance between the kings", piece_reach_count: "squares a piece reaches",
});

const TRANSITION_COUNT_KINDS = Object.freeze(["attacked_squares_changed", "defended_squares_changed", "slider_lines_changed", "escape_squares_changed", "defended_duties_changed"] as const);
const TRANSITION_DIRECTIONS = Object.freeze({
  attacked_squares_changed: ["gained", "lost"], defended_squares_changed: ["gained", "lost"], slider_lines_changed: ["opened", "closed"],
  escape_squares_changed: ["gained", "lost"], defended_duties_changed: ["acquired", "released"],
} as const);
const TRANSITION_PHRASES: Readonly<Record<string, (color: Color, count: number) => string>> = Object.freeze({
  "attacked_squares_changed.gained": (color, count) => `${side(color)} attacks ${plural(count, "more occupied square")}`,
  "attacked_squares_changed.lost": (color, count) => `${side(color)} attacks ${plural(count, "fewer occupied square")}`,
  "defended_squares_changed.gained": (color, count) => `${side(color)} defends ${plural(count, "more occupied square")}`,
  "defended_squares_changed.lost": (color, count) => `${side(color)} defends ${plural(count, "fewer occupied square")}`,
  "slider_lines_changed.opened": (color, count) => `${plural(count, "line")} opened for ${side(color)}'s long-range pieces`,
  "slider_lines_changed.closed": (color, count) => `${plural(count, "line")} closed for ${side(color)}'s long-range pieces`,
  "escape_squares_changed.gained": (color, count) => `${side(color)}'s pieces can reach ${plural(count, "more square")}`,
  "escape_squares_changed.lost": (color, count) => `${side(color)}'s pieces can reach ${plural(count, "fewer square")}`,
  "defended_duties_changed.acquired": (color, count) => `${side(color)}'s pieces took on ${plural(count, "more defending duty", "more defending duties")}`,
  "defended_duties_changed.released": (color, count) => `${side(color)}'s pieces gave up ${plural(count, "defending duty", "defending duties")}`,
});
const IRREVERSIBILITY_SENTENCES = Object.freeze({
  castled: "A king castled on this move; castling cannot be repeated.",
  clock_zeroed: "This move was a capture or a pawn move, so the fifty-move count starts again.",
  last_of_role: "The last piece of one kind left the board on this move.",
  pawn_break: "This move created or resolved contact between pawns.",
} as const);

const PACK_PHASE_SENTENCES = Object.freeze({
  opening: "The pack author places this drill in the opening.",
  middlegame: "The pack author places this drill in the middlegame.",
  endgame: "The pack author places this drill in the endgame.",
  cross_phase: "The pack author marks this drill as spanning more than one game phase.",
} as const);

const TABLEBASE_CATEGORIES = Object.freeze({
  win: "a win", loss: "a loss", draw: "a draw",
  "cursed-win": "a win the fifty-move rule turns into a draw", "blessed-loss": "a loss the fifty-move rule turns into a draw",
  "syzygy-win": "a win", "syzygy-loss": "a loss", "maybe-win": "probably a win", "maybe-loss": "probably a loss", unknown: "not classified",
} as const);
type TablebaseCategoryName = keyof typeof TABLEBASE_CATEGORIES;
const RECORDED_CATEGORIES = ["win", "loss", "draw", "cursed-win", "blessed-loss"] as const;

/** Learner wording of every rules evidence fact (the resolution's own table predates §6's vocabulary). */
const RULES_FACT_SENTENCES: Readonly<Record<RulesEvidenceFact, string>> = Object.freeze({
  checkmate: "The position is checkmate.",
  stalemate: "The position is stalemate.",
  draw: "A draw is available under the rules at this position.",
  "draw-threefold": "A draw is available: the same position occurred three times on this line.",
  "draw-50move": "A draw is available: fifty moves passed without a capture or a pawn move on this line.",
  "draw-insufficient": "Draw: neither side has enough material to deliver mate.",
  material: "The material balance changed on this line.",
  "result-win": "You won the game.",
  "result-loss": "You lost the game.",
  "result-draw": "The game ended in a draw.",
  "structure-pawn-safe-square": "The pack's pawn-safe-square condition holds at this position.",
  "structure-outpost": "The pack's outpost condition holds at this position.",
  "structure-backward-pawn": "The pack's backward-pawn condition holds at this position.",
  "structure-isolated-pawn": "The pack's isolated-pawn condition holds at this position.",
  "structure-doubled-pawn": "The pack's doubled-pawn condition holds at this position.",
  "structure-passed-pawn": "The pack's passed-pawn condition holds at this position.",
  "structure-open-file": "The pack's open-file condition holds at this position.",
  "structure-half-open-file": "The pack's half-open-file condition holds at this position.",
  "structure-line-blockers": "The pack's count of pieces blocking a line holds at this position.",
  "structure-direct-attack-count": "The pack's count of pieces attacking a square holds at this position; the two sides are counted separately.",
  "structure-piece-reach-count": "The pack's count of squares a piece reaches holds at this position; legal moves are not checked.",
  "structure-named-structure": "A pawn structure from the declared structure catalogue is on the board.",
  "structure-bishop-on-shade": "The pack's bishop square-colour condition holds at this position.",
  "structure-pawn-count": "The pack's pawn-count condition holds at this position.",
  "structure-king-opposition": "The pack's king-opposition condition holds at this position.",
  "structure-piece-count": "The pack's piece-count condition holds at this position.",
  "structure-king-zone": "The pack's king-position condition holds at this position.",
  "structure-piece-distance": "The pack's king-distance condition holds at this position.",
  "transition-attacked-squares-changed": "The pack's condition on attacked occupied squares holds on this move.",
  "transition-defended-squares-changed": "The pack's condition on defended occupied squares holds on this move.",
  "transition-slider-lines-changed": "The pack's condition on lines for long-range pieces holds on this move.",
  "transition-escape-squares-changed": "The pack's condition on squares pieces can reach holds on this move.",
  "transition-defended-duties-changed": "The pack's condition on defending duties holds on this move.",
  "transition-move-irreversibility": "The pack's condition on moves that cannot be undone holds on this move.",
});
const PROVIDER_READINGS = Object.freeze({ Engine: "An engine reading", "Human model": "A human-move model reading", Tablebase: "An exact tablebase reading" } as const);

const coordinateMove = s.obj({ from: s.square, to: s.square }, { promotion: s.role });
const coordinates = (move: { readonly from: string; readonly to: string; readonly promotion?: Role }): string =>
  `${move.from}–${move.to}${move.promotion === undefined ? "" : `=${PROMOTION_LETTERS[move.promotion]}`}`;
const PROMOTION_LETTERS: Readonly<Record<Role, string>> = Object.freeze({ pawn: "P", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K" });

const searchBound = s.obj({}, { depth: s.nat, requestedDepth: s.nat, requestedMovetimeMs: s.nat, engine: s.str });
type SearchBound = ReturnType<typeof searchBound>;
const boundText = (bound: SearchBound, fallback: string): string => {
  const parts = [
    bound.engine ?? fallback,
    ...(bound.depth !== undefined ? [`depth ${bound.depth}`] : bound.requestedDepth !== undefined ? [`requested depth ${bound.requestedDepth}`] : bound.requestedMovetimeMs !== undefined ? [`${bound.requestedMovetimeMs} ms search`] : []),
  ];
  return parts.join(", ");
};
const READERS = Object.freeze({ engine: { reading: "engine", fallback: "engine" }, model: { reading: "human-move model", fallback: "human-move model" } } as const);

const attachedSchema = s.union("kind", {
  eval: s.obj({ kind: s.lit("eval"), reader: s.lit("engine", "model"), score: s.union("kind", { cp: s.obj({ kind: s.lit("cp"), value: s.int, perspective: s.color }), mate: s.obj({ kind: s.lit("mate"), value: s.int }), none: s.obj({ kind: s.lit("none") }) }), bound: searchBound }),
  wdl: s.obj({ kind: s.lit("wdl"), reader: s.lit("engine", "model"), win: nonNegative, draw: nonNegative, loss: nonNegative, bound: searchBound }),
  bestline: s.obj({ kind: s.lit("bestline"), reader: s.lit("engine", "model"), moves: s.arr(coordinateMove), bound: searchBound }),
  tablebase: s.obj({ kind: s.lit("tablebase") }, { category: s.lit(...(Object.keys(TABLEBASE_CATEGORIES) as TablebaseCategoryName[])), pieceCount: s.nat, dtz: s.int }),
});
type AttachedOperands = ReturnType<typeof attachedSchema>;

function attachedSentence(value: AttachedOperands): string {
  if (value.kind === "tablebase") {
    const details = [...(value.pieceCount === undefined ? [] : [plural(value.pieceCount, "piece")]), ...(value.dtz === undefined ? [] : [`DTZ ${Math.abs(value.dtz)}`])];
    return `Attached exact tablebase reading: ${value.category === undefined ? "no category retained" : `${TABLEBASE_CATEGORIES[value.category]} for the side to move`}${details.length === 0 ? "" : ` (${details.join(", ")})`}.`;
  }
  const reader = READERS[value.reader];
  const bound = boundText(value.bound, reader.fallback);
  if (value.kind === "eval") {
    const score = value.score.kind === "cp"
      ? `${pawnsText(value.score.value)} pawns from ${side(value.score.perspective)}'s side`
      : value.score.kind === "mate"
        ? (value.score.value === 0 ? "a mate score of zero" : `mate in ${Math.abs(value.score.value)} for ${value.score.value > 0 ? "White" : "Black"}`)
        : "no numeric score retained";
    return `Attached ${reader.reading} evaluation: ${score} (${bound}; a bounded search reading, not a proof).`;
  }
  if (value.kind === "wdl") {
    const total = value.win + value.draw + value.loss;
    if (total === 0) return `Attached ${reader.reading} win/draw/loss reading with no weight recorded (${bound}).`;
    return `Attached ${reader.reading} win/draw/loss reading: win ${percent(value.win / total)}, draw ${percent(value.draw / total)}, loss ${percent(value.loss / total)} (perspective not recorded; ${bound}).`;
  }
  return value.moves.length === 0
    ? `Attached ${reader.reading} line with no moves retained (${bound}).`
    : `Attached ${reader.reading} line in board coordinates: ${value.moves.map(coordinates).join(", ")} (${bound}).`;
}

const referenceSchema = s.union("kind", {
  rules: s.obj({ kind: s.lit("rules"), fact: s.lit(...RULES_EVIDENCE_FACTS) }),
  authored: s.obj({ kind: s.lit("authored"), text: s.str }),
  provider: s.obj({ kind: s.lit("provider"), source: s.lit("Engine", "Human model", "Tablebase"), attached: s.bool }),
  recorded: s.obj({ kind: s.lit("recorded") }),
});

const recordedMoveSchema = s.obj({ offset: s.nat, move: s.union("kind", {
  san: s.obj({ kind: s.lit("san"), san: s.san }),
  coordinates: s.obj({ kind: s.lit("coordinates"), from: s.square, to: s.square }, { promotion: s.role }),
  none: s.obj({ kind: s.lit("none") }),
}) });

export const CONSUMER_FACT_RENDERERS = Object.freeze({
  "consumer.pivotal_marker@1": factRenderer(pivotalSchema, (value) => {
    switch (value.kind) {
      case "phase_change": return `The game moved from the ${value.from} into the ${value.to} under the declared game-phase convention.`;
      case "irreversibility":
        if (value.subkind === "castled") return `${side(value.color)} castled on this move.`;
        if (value.subkind === "pawn_break") return `${side(value.color)} created or resolved contact between pawns on this move.`;
        if (value.queensOff === true) return "Both queens have left the board.";
        return value.role === undefined ? `${side(value.color)} gave up the last piece of one kind on this move.` : `${side(value.color)} has no ${value.role}s left on the board.`;
      case "option_collapse": return `${side(value.color)}'s legal moves narrowed on consecutive turns: ${value.priorCount}, then ${value.count}, then ${value.nextCount}.`;
      case "human_divergence": return `The human-move model (${value.model}${value.band === undefined ? "" : ` at ${value.band} rating`}) spread its choice here: its top ${plural(value.shares.length, "move")} took ${listPhrase(value.shares.map(percent))} of its choices.`;
    }
  }),
  "consumer.structural_squares@1": factRenderer(s.obj({ kind: s.lit(...STRUCTURAL_KINDS), squares: s.arr(s.square) }), (value) =>
    value.squares.length === 0 ? `Position reading: ${STRUCTURAL_LABELS[value.kind]}.` : `Position reading, ${STRUCTURAL_LABELS[value.kind]}: ${listPhrase(value.squares)}.`),
  "consumer.transition_count@1": factRenderer(s.obj({ kind: s.lit(...TRANSITION_COUNT_KINDS), color: s.color, direction: s.lit("gained", "lost", "opened", "closed", "acquired", "released"), count: s.nat }), (value) => {
    if (!(TRANSITION_DIRECTIONS[value.kind] as readonly string[]).includes(value.direction)) throw new PresentationSchemaError(`transition direction ${value.direction} does not belong to its reading`);
    return `${TRANSITION_PHRASES[`${value.kind}.${value.direction}`]!(value.color, value.count)} on this move (a geometric count under the declared piece-geometry convention; its significance is not evaluated).`;
  }),
  "consumer.irreversibility@1": factRenderer(s.obj({ subkind: s.lit("castled", "clock_zeroed", "last_of_role", "pawn_break") }), (value) => IRREVERSIBILITY_SENTENCES[value.subkind]),
  "consumer.pack_phase@1": factRenderer(s.obj({ phase: s.lit("opening", "middlegame", "endgame", "cross_phase") }), (value) => PACK_PHASE_SENTENCES[value.phase]),
  "consumer.recorded_tablebase@1": factRenderer(s.obj({ category: s.lit(...RECORDED_CATEGORIES), pieceCount: s.nat, dtz: s.nullable(s.int), dtm: s.nullable(s.int), date: s.str }), (value) => {
    const measures = [...(value.dtz === null ? [] : [`DTZ ${Math.abs(value.dtz)}`]), ...(value.dtm === null ? [] : [`DTM ${Math.abs(value.dtm)}`])];
    return `Recorded Syzygy tablebase reading for this position (${plural(value.pieceCount, "piece")}): ${TABLEBASE_CATEGORIES[value.category]} for the side to move${measures.length === 0 ? "" : `, ${measures.join(", ")}`}; queried when this pack was authored on ${value.date}.`;
  }),
  "consumer.recorded_move@1": factRenderer(recordedMoveSchema, (value) => {
    if (value.move.kind === "none") return "On this attempt no move is recorded after the fork.";
    const move = value.move.kind === "san" ? value.move.san : coordinates(value.move);
    return `On this attempt the recorded move at ply ${value.offset} after the fork is ${move}.`;
  }),
  "consumer.story_last_level@1": factRenderer(s.obj({ learnerCentipawns: s.int }), (value) => {
    if (value.learnerCentipawns < -100) throw new PresentationSchemaError("last level must be within a pawn");
    return `The last recorded moment within a pawn of level: ${pawnsText(value.learnerCentipawns)} pawns from your side.`;
  }),
  "consumer.evidence_reference@1": factRenderer(referenceSchema, (value) => {
    switch (value.kind) {
      case "rules": return RULES_FACT_SENTENCES[value.fact];
      case "authored": return value.text;
      case "provider": return `${PROVIDER_READINGS[value.source]} belongs to this reference${value.attached ? " and is shown with its source" : "; its details are still pending"}.`;
      case "recorded": return "This reference names a recorded fact with no attached reading.";
    }
  }),
  "consumer.attached_reading@1": factRenderer(attachedSchema, attachedSentence),
});

/** Registered magnitude quantities for this group's magnitudes (merged into MAGNITUDE_QUANTITIES). */
export const CONSUMER_MAGNITUDE_QUANTITIES: Readonly<Record<string, { readonly label: string }>> = Object.freeze({
  "recorded.engine.eval@1": { label: "Recorded engine evaluation at this position" },
});

// ---------------------------------------------------------------------------------------------
// Payload readers (types only; the manifest's typed payloads)
// ---------------------------------------------------------------------------------------------

const V1 = (id: string, version = 1): VersionedEvidenceId => Object.freeze({ id, version });
const record = (value: unknown): Readonly<Record<string, unknown>> => (typeof value === "object" && value !== null && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : {});
const text = (value: unknown): string | undefined => (typeof value === "string" && value.trim() !== "" ? value : undefined);
const integer = (value: unknown): number | undefined => (Number.isSafeInteger(value) ? value as number : undefined);
const UCI_SHAPE = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/u;
const SAN_SHAPE = /^(?:O-O(?:-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?)[+#]?$/u;
const PROMOTION_ROLES: Readonly<Record<string, Role>> = Object.freeze({ q: "queen", r: "rook", b: "bishop", n: "knight" });
function uciParts(uci: string): { readonly from: SquareName; readonly to: SquareName; readonly promotion?: Role } {
  const match = UCI_SHAPE.exec(uci);
  if (match === null) throw new TypeError("an attached move is not canonical UCI");
  return { from: match[1] as SquareName, to: match[2] as SquareName, ...(match[3] === undefined ? {} : { promotion: PROMOTION_ROLES[match[3]]! }) };
}

interface MarkerPayload { readonly kind: "irreversibility" | "phase_change" | "human_divergence" | "option_collapse"; readonly detail: Readonly<Record<string, unknown>> }
function pivotalOperands(payload: unknown): unknown {
  const marker = payload as MarkerPayload;
  const detail = marker.detail;
  switch (marker.kind) {
    case "phase_change": return { kind: "phase_change", from: detail.from, to: detail.to };
    case "irreversibility": return { kind: "irreversibility", subkind: detail.subkind, color: detail.color, ...(detail.role === undefined ? {} : { role: detail.role }), ...(detail.queensOff === undefined ? {} : { queensOff: detail.queensOff }) };
    case "option_collapse": return { kind: "option_collapse", color: detail.color, priorCount: detail.priorCount, count: detail.count, nextCount: detail.nextCount };
    case "human_divergence": {
      const engine = record(detail.engine);
      const name = text(engine.name) ?? "human-move model";
      const version = text(engine.version);
      return { kind: "human_divergence", model: version === undefined || name.includes(version) ? name : `${name} ${version}`, shares: (detail.masses as readonly number[]).slice(0, 3), ...(detail.targetElo === undefined ? {} : { band: detail.targetElo }) };
    }
  }
}

function attachedOperands(payload: unknown): unknown {
  const packet = payload as { readonly kind: "eval" | "wdl" | "bestline" | "tablebase"; readonly source: string; readonly values: Readonly<Record<string, unknown>> };
  const values = record(packet.values);
  if (packet.kind === "tablebase") {
    const dtz = integer(values.preciseDtz) ?? integer(values.dtz);
    return { kind: "tablebase", ...(typeof values.category === "string" ? { category: values.category } : {}), ...(integer(values.pieceCount) === undefined ? {} : { pieceCount: values.pieceCount }), ...(dtz === undefined ? {} : { dtz }) };
  }
  const engineName = text(values.engineName);
  const engineVersion = text(values.engineVersion);
  const bound = {
    ...(engineName === undefined ? {} : { engine: engineVersion === undefined || engineName.includes(engineVersion) ? engineName : `${engineName} ${engineVersion}` }),
    ...(integer(values.depth) === undefined ? {} : { depth: values.depth }),
    ...(integer(values.requestedDepth) === undefined ? {} : { requestedDepth: values.requestedDepth }),
    ...(integer(values.requestedMovetimeMs) === undefined ? {} : { requestedMovetimeMs: values.requestedMovetimeMs }),
  };
  const reader = packet.source === "human_model_predicted" ? "model" : "engine";
  if (packet.kind === "eval") {
    const centipawns = integer(values.centipawns);
    const mateIn = integer(values.mateIn);
    const score = centipawns !== undefined ? { kind: "cp", value: centipawns, perspective: values.perspective === "black" ? "black" : "white" } : mateIn !== undefined ? { kind: "mate", value: mateIn } : { kind: "none" };
    return { kind: "eval", reader, score, bound };
  }
  if (packet.kind === "wdl") return { kind: "wdl", reader, win: values.win, draw: values.draw, loss: values.loss, bound };
  const moves = Array.isArray(values.movesUci) ? values.movesUci : Array.isArray(values.moves) ? values.moves : [];
  return { kind: "bestline", reader, moves: moves.map((move) => uciParts(String(move))), bound };
}

function referenceOperands(payload: unknown): unknown {
  const resolution = payload as { readonly reference: string; readonly text: string; readonly sourceLabel: "Rules" | "Pack" | "Engine" | "Human model" | "Tablebase" | "Recorded" };
  switch (resolution.sourceLabel) {
    case "Rules": return { kind: "rules", fact: resolution.reference.slice("rules:".length) };
    case "Pack": return { kind: "authored", text: resolution.text };
    case "Engine": case "Human model": case "Tablebase": return { kind: "provider", source: resolution.sourceLabel, attached: !resolution.text.endsWith("details are pending.") };
    case "Recorded": return { kind: "recorded" };
  }
}

function recordedMoveOperands(payload: unknown): unknown {
  const move = payload as { readonly offset: number; readonly moveSan: string | null };
  if (move.moveSan === null) return { offset: move.offset, move: { kind: "none" } };
  if (SAN_SHAPE.test(move.moveSan)) return { offset: move.offset, move: { kind: "san", san: move.moveSan } };
  return { offset: move.offset, move: { kind: "coordinates", ...uciParts(move.moveSan) } };
}

const shapeTitle = (entryId: string): string => entryId.split("-").map((word, index) => index === 0 ? `${word.slice(0, 1).toUpperCase()}${word.slice(1)}` : word).join(" ");

// ---------------------------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------------------------

type Construct = (evidence: DeclaredEvidence<unknown>) => ComponentValue | readonly ComponentValue[];
type Convention = Parameters<PresentationKit["fact"]>[2];
type Binding = "recorded_run" | "declared_convention";

const PIVOTAL_KINDS = Object.freeze(["irreversibility", "phase_change", "human_divergence", "option_collapse"] as const);
const PIVOTAL_CONVENTIONS: Readonly<Record<(typeof PIVOTAL_KINDS)[number], Convention>> = Object.freeze({ irreversibility: "board-rules@1", phase_change: "phase-bands@1", human_divergence: "recorded-comparison@1", option_collapse: "board-rules@1" });
const GUIDANCE_TEXT = Object.freeze(["guidance.deterministic", "guidance.voice", "guidance.voice_story"] as const);
const PAWN_STRUCTURE_KINDS: ReadonlySet<StructuralKind> = new Set(["backward_pawn", "outpost", "pawn_safe_square"]);
/** The Explorer outcome floor: below it the server returns an abstention, never a split. */
const EXPLORER_OUTCOME_FLOOR = 100;

export function consumerAdapterSpecs(kit: PresentationKit): readonly AdapterSpec[] {
  const specs: AdapterSpec[] = [];
  const add = (consumer: string, projection: VersionedEvidenceId, component: AdapterSpec["component"], forms: readonly EvidenceForm[], sourceOperands: readonly string[], assertions: AdapterSpec["assertions"], construct: Construct, composition?: AdapterSpec["composition"]) =>
    specs.push({ consumer: V1(consumer), projection, component, forms, sourceOperands, assertions, construct, ...(composition === undefined ? {} : { composition }) });
  const statement = (rendererId: Parameters<PresentationKit["fact"]>[0], convention: Convention, operands: unknown, binding: Binding = "declared_convention"): ComponentValue =>
    ({ id: "fact_statement", operand: kit.fact(rendererId, binding, convention, operands as never) });
  const factAdapter = (consumer: string, projection: VersionedEvidenceId, forms: readonly EvidenceForm[], sourceOperands: readonly string[], assertions: AdapterSpec["assertions"], rendererId: Parameters<PresentationKit["fact"]>[0], convention: Convention | ((payload: unknown) => Convention), read: (payload: unknown) => unknown, binding: Binding = "declared_convention") =>
    add(consumer, projection, "fact_statement", forms, sourceOperands, assertions, (evidence) => statement(rendererId, typeof convention === "function" ? convention(evidence.payload) : convention, read(evidence.payload), binding));

  // --- pivotal markers: four exact derived projections, six consumers (review.story is Checkpoint A)
  const pivotalForms: Readonly<Record<string, readonly EvidenceForm[]>> = Object.freeze({
    "board.pivotal_marker": ["panel", "sentence", "timeline_marker"], "compare.structure_strip": ["panel", "sentence", "timeline_marker"],
    "guidance.deterministic": ["sentence"], "guidance.voice": ["sentence"], "guidance.voice_story": ["sentence"], "guidance.voice_compare": ["sentence"],
  });
  for (const [consumer, forms] of Object.entries(pivotalForms)) for (const kind of PIVOTAL_KINDS) {
    factAdapter(consumer, V1(`derived.pivotal.${kind}`), forms, ["kind", "detail"], ["mechanical_transform"], "consumer.pivotal_marker@1", PIVOTAL_CONVENTIONS[kind], pivotalOperands);
  }

  // --- structural readings: one fact's squares per reading (board sight lights them; Inspector lists them)
  // A file-level reading (open file, isolated pawn, …) retains no squares within its declared
  // `kind, squares` operands: the Inspector states it; the board has nothing to light.
  const structuralCaption = (evidence: DeclaredEvidence<unknown>) => {
    const observation = evidence.payload as { readonly kind: StructuralKind; readonly squares: readonly SquareName[] };
    const squares = [...new Set(observation.squares)];
    return { squares, caption: kit.fact("consumer.structural_squares@1", "declared_convention", PAWN_STRUCTURE_KINDS.has(observation.kind) ? "pawn-structure@1" : "board-rules@1", { kind: observation.kind, squares }) };
  };
  for (const kind of STRUCTURAL_KINDS) {
    add("board.selected_square_sight", V1(`rules.structural.reading.${kind}`), "square_set", ["lit_squares", "piece_halo"], ["kind", "squares"], ["copied_byte_equal"], (evidence) => {
      const { squares, caption } = structuralCaption(evidence);
      if (squares.length === 0) throw new TypeError("a reading with no retained squares has nothing to light; the selected-square operation offers only readings containing a square");
      return kit.squareSet(evidence, squares, "blue", caption);
    });
    add("inspector.position_structure", V1(`rules.structural.reading.${kind}`), "fact_statement", ["list", "panel"], ["kind", "squares"], ["copied_byte_equal"], (evidence) => ({ id: "fact_statement", operand: structuralCaption(evidence).caption }));
  }
  const namedStructure = (payload: unknown) => { const match = payload as { readonly id: string; readonly name: string; readonly squares: readonly SquareName[] }; return { id: match.id, name: match.name, squares: [...match.squares] }; };
  const NAMED = V1("rules.structural.reading.named_structure", 2);
  add("board.selected_square_sight", NAMED, "square_set", ["lit_squares", "piece_halo"], ["id", "name", "squares"], ["copied_byte_equal"], (evidence) => {
    const operands = namedStructure(evidence.payload);
    return kit.squareSet(evidence, operands.squares, "blue", kit.fact("play.named_structure@1", "declared_convention", "structure-catalogue@1", operands as never));
  });
  factAdapter("inspector.position_structure", NAMED, ["list", "panel"], ["id", "name", "squares"], ["copied_byte_equal"], "play.named_structure@1", "structure-catalogue@1", namedStructure);

  // --- position guidance text (deterministic, voice, voice-story)
  for (const consumer of GUIDANCE_TEXT) {
    factAdapter(consumer, NAMED, ["sentence"], ["id", "name", "squares"], ["copied_byte_equal"], "play.named_structure@1", "structure-catalogue@1", namedStructure);
    factAdapter(consumer, V1("rules.phase.reading", 2), ["sentence"], ["phase"], ["copied_byte_equal"], "play.phase@1", "phase-bands@1", (payload) => ({ phase: (payload as { readonly phase: string }).phase }));
    factAdapter(consumer, V1("rules.endgame.classification"), ["sentence"], ["type"], ["copied_byte_equal"], "play.endgame_type@1", "endgame-convention@1", (payload) => ({ label: (payload as { readonly type: { readonly label: string } | null }).type?.label ?? null }));
    factAdapter(consumer, V1("pack.authored.phase"), ["sentence"], ["phase"], ["copied_byte_equal"], "consumer.pack_phase@1", "authored-claim@1", (payload) => ({ phase: (payload as { readonly phase: string }).phase }));
    factAdapter(consumer, V1("pack.authored.claim"), ["sentence"], ["text"], ["authored_text_copied"], "play.authored_claim@1", "authored-claim@1", (payload) => ({ text: (payload as { readonly text: string }).text }));
  }

  // --- the Story voice: the review.story evidence re-voiced as sentences
  const story = "guidance.voice_story";
  add(story, V1("derived.review.eval_delta"), "magnitude", ["sentence"], ["before", "after", "deltaCp"], ["copied_byte_equal", "retained_convention"], (evidence) => {
    const delta = evidence.payload as ReviewEvalDelta;
    return { id: "magnitude", operand: { value: delta.deltaCp, unit: { kind: "centipawn" }, convention: kit.searchConvention(evidence, delta.after.payload.evaluation.payload), saturated: false } };
  });
  factAdapter(story, V1("derived.review.mate_transition"), ["sentence"], ["before", "after", "changes"], ["copied_byte_equal", "retained_convention"], "review.mate_transition@1", "review-mate-transition@1", (payload) => {
    const transition = payload as ReviewMateTransition;
    const after = (transition.after.payload as ReviewEnginePoint).evaluation.payload.payload;
    const before = (transition.before.payload as ReviewEnginePoint).evaluation.payload.payload;
    return { changes: [...transition.changes], before: before.score, after: after.score, engine: { name: after.engine.name, version: after.engine.version }, bound: after.bound };
  });
  factAdapter(story, V1("derived.story.last_level"), ["sentence"], ["evaluation"], ["mechanical_transform"], "consumer.story_last_level@1", "story-last-level@1", (payload) => ({ learnerCentipawns: (payload as { readonly evaluation: { readonly learnerCentipawns: number } }).evaluation.learnerCentipawns }));
  factAdapter(story, V1("derived.story.title"), ["sentence"], ["title"], ["copied_byte_equal"], "story.title@1", "story-compatibility@1", (payload) => ({ title: (payload as { readonly title: string }).title }));
  factAdapter(story, V1("run.record.imported_result"), ["sentence"], ["result"], ["copied_byte_equal"], "story.imported_result@1", "recorded-run@1", (payload) => ({ result: (payload as { readonly result: string }).result }), "recorded_run");
  factAdapter(story, V1("theory.shapes.firing"), ["sentence"], ["entryId"], ["mechanical_transform"], "play.shape@1", "shape-catalogue@1", (payload) => ({ title: shapeTitle((payload as { readonly entryId: string }).entryId) }));
  factAdapter("theory.shape_firing", V1("theory.shapes.firing"), ["panel", "sentence", "timeline_marker"], ["entryId"], ["mechanical_transform"], "play.shape@1", "shape-catalogue@1", (payload) => ({ title: shapeTitle((payload as { readonly entryId: string }).entryId) }));

  // --- recorded consequence (both voice consumers; review.story is Checkpoint A)
  const consequence = (payload: unknown) => {
    const value = payload as { readonly terminal: boolean; readonly outcome?: string; readonly plies?: number; readonly objectiveState?: string };
    return value.terminal ? { terminal: true, outcome: value.outcome } : { terminal: false, plies: value.plies, objectiveState: value.objectiveState };
  };
  for (const consumer of ["guidance.voice_story", "guidance.voice_compare"]) {
    factAdapter(consumer, V1("run.record.consequence"), ["sentence"], ["terminal", "outcome", "plies", "objectiveState"], ["copied_byte_equal"], "story.consequence@1", "recorded-run@1", consequence, "recorded_run");
  }

  // --- comparison: the strip, the trajectory and the compare voice
  const recordedScore = (evidence: DeclaredEvidence<unknown>, value: number, unit: "centipawn" | "mate_in"): ComponentValue => ({
    id: "magnitude", operand: { value, unit: { kind: unit }, convention: kit.convention(evidence, { kind: "recorded_search", engine: null, depth: null }, "white"), saturated: false },
  });
  add("compare.engine_trajectory", V1("derived.compare.engine_trajectory"), "magnitude", ["list", "panel"], ["score"], ["copied_byte_equal", "retained_convention"], (evidence) => {
    const entry = evidence.payload as { readonly score: { readonly kind: "cp"; readonly value: number } | { readonly kind: "mate"; readonly movesTo: number } };
    return entry.score.kind === "cp" ? recordedScore(evidence, entry.score.value, "centipawn") : recordedScore(evidence, entry.score.movesTo, "mate_in");
  });
  add("guidance.voice_compare", V1("derived.compare.eval_delta"), "magnitude", ["sentence"], ["delta"], ["copied_byte_equal", "retained_convention"], (evidence) =>
    recordedScore(evidence, (evidence.payload as { readonly delta: number }).delta, "centipawn"));
  const structureDelta = (payload: unknown) => {
    const { detail: _detail, provenanceNote: _note, ...rest } = (payload as { readonly observation: Readonly<Record<string, unknown>> }).observation;
    return { observation: rest };
  };
  factAdapter("compare.structure_strip", V1("derived.compare.structure_delta"), ["list", "panel", "sentence"], ["observation"], ["copied_byte_equal"], "play.compare_structure@1", "pawn-structure@1", structureDelta);
  factAdapter("guidance.voice_compare", V1("derived.compare.structure_delta"), ["sentence"], ["observation"], ["copied_byte_equal"], "play.compare_structure@1", "pawn-structure@1", structureDelta);
  factAdapter("compare.structure_strip", V1("derived.compare.piece_route"), ["list", "panel"], ["pieceId", "squares"], ["copied_byte_equal"], "play.compare_route@1", "recorded-comparison@1", (payload) => {
    const route = payload as { readonly pieceId: string; readonly squares: readonly SquareName[] };
    return { piece: route.pieceId.replace(/^(White|Black) /u, (match) => match.toLowerCase()), squares: [...route.squares] };
  }, "recorded_run");
  for (const [consumer, forms] of [["compare.structure_strip", ["panel", "sentence", "timeline_marker"]], ["guidance.voice_compare", ["sentence"]]] as const) {
    factAdapter(consumer, V1("run.record.checkpoint_hit"), forms, ["plyOffset"], ["copied_byte_equal"], "play.checkpoint_hit@1", "recorded-run@1", (payload) => ({ plyOffset: (payload as { readonly plyOffset: number }).plyOffset }), "recorded_run");
    factAdapter(consumer, V1("run.record.objective_transition"), forms, ["from", "to"], ["copied_byte_equal"], "play.objective_transition@1", "recorded-run@1", (payload) => { const transition = payload as { readonly from: string; readonly to: string }; return { from: transition.from, to: transition.to }; }, "recorded_run");
  }
  factAdapter("guidance.voice_compare", V1("run.record.fork"), ["sentence"], ["sharedPly"], ["copied_byte_equal"], "play.recorded_fork@1", "recorded-run@1", (payload) => ({ sharedPly: (payload as { readonly sharedPly: number }).sharedPly }), "recorded_run");
  factAdapter("guidance.voice_compare", V1("run.record.move"), ["sentence"], ["offset", "moveSan"], ["copied_byte_equal", "mechanical_transform"], "consumer.recorded_move@1", "recorded-run@1", recordedMoveOperands, "recorded_run");

  // --- recorded readings (authoring-time ledger readings delivered as guidance)
  add("guidance.recorded_reading", V1("recorded.engine.eval"), "magnitude", ["sentence"], ["values"], ["copied_byte_equal", "retained_convention"], (evidence) => {
    const values = (evidence.payload as { readonly values: { readonly centipawns?: number; readonly mateIn?: number; readonly depth: number; readonly engineName: string; readonly engineVersion: string } }).values;
    const convention = kit.convention(evidence, { kind: "recorded_search", engine: { name: values.engineName, version: values.engineVersion }, depth: values.depth }, "white");
    return values.mateIn === undefined
      ? { id: "magnitude", operand: { value: values.centipawns!, unit: { kind: "centipawn" }, convention, saturated: false } }
      : { id: "magnitude", operand: { value: values.mateIn, unit: { kind: "mate_in" }, convention, saturated: false } };
  });
  factAdapter("guidance.recorded_reading", V1("recorded.tablebase.result"), ["sentence"], ["retrievedAt", "values"], ["copied_byte_equal", "mechanical_transform"], "consumer.recorded_tablebase@1", "recorded-engine@1", (payload) => {
    const reading = payload as { readonly retrievedAt: string; readonly values: { readonly category: string; readonly pieceCount: number; readonly dtz: number | null; readonly dtm: number | null } };
    return { category: reading.values.category, pieceCount: reading.values.pieceCount, dtz: reading.values.dtz, dtm: reading.values.dtm, date: reading.retrievedAt.slice(0, 10) };
  });

  // --- Inspector: move transitions
  for (const kind of TRANSITION_COUNT_KINDS) for (const direction of TRANSITION_DIRECTIONS[kind]) {
    factAdapter("inspector.move_transition", V1(`rules.transition.reading.${kind}.${direction}`), ["list", "panel"], ["kind", "color", "direction", "count"], ["copied_byte_equal"], "consumer.transition_count@1", "piece-geometry@1", (payload) => {
      const observation = payload as { readonly kind: string; readonly color: Color; readonly direction: string; readonly count: number };
      return { kind: observation.kind, color: observation.color, direction: observation.direction, count: observation.count };
    });
  }
  for (const subkind of ["castled", "clock_zeroed", "last_of_role", "pawn_break"] as const) {
    factAdapter("inspector.move_transition", V1(`rules.transition.reading.move_irreversibility.${subkind}`), ["list", "panel"], ["subkind"], ["copied_byte_equal"], "consumer.irreversibility@1", "board-rules@1", (payload) => ({ subkind: (payload as { readonly subkind: string }).subkind }));
  }

  // --- Inspector: the Explorer population (criterion 8: shares recomputed from playedCount / total)
  add("inspector.corpus", V1("human.explorer.population"), "distribution", ["list", "panel"], ["result", "committedMoveSan"], ["copied_byte_equal", "mechanical_transform", "retained_convention"], (evidence) => {
    const page = evidence.payload as { readonly result: { readonly kind: "stats" | "abstention"; readonly total?: number; readonly white?: number; readonly draws?: number; readonly black?: number; readonly moves?: readonly { readonly san: string; readonly uci: string; readonly playedCount: number }[]; readonly population: { readonly source: "lichess-explorer"; readonly ratings: readonly number[]; readonly speeds: readonly string[]; readonly since: string; readonly until: string } }; readonly committedMoveSan: string | null };
    const result = page.result;
    if (result.kind !== "stats" || result.moves === undefined || result.moves.length === 0) throw new TypeError("an Explorer page with no counted moves is stated through its abstention seat, never drawn");
    const total = result.total!;
    const population = { source: result.population.source, ratings: [...result.population.ratings], speeds: [...result.population.speeds], since: result.population.since, until: result.population.until };
    const basis = { kind: "human_population" as const, population, sampleSize: total };
    const listed = result.moves.reduce((sum, move) => sum + move.playedCount, 0);
    const committed = page.committedMoveSan === null ? undefined : result.moves.find((move) => move.san === page.committedMoveSan);
    const distribution: DistributionOperand = {
      rows: result.moves.map((move) => ({ move: { san: move.san, uci: move.uci }, share: move.playedCount / total, count: move.playedCount })),
      residual: listed < total ? { share: (total - listed) / total, label: "other_moves" } : null,
      convention: kit.convention(evidence, basis, "not_applicable"),
      highlight: committed === undefined ? null : { uci: committed.uci, why: "learner_committed" },
    };
    const numerator = page.committedMoveSan === null ? result.moves[0]!.playedCount : committed?.playedCount ?? 0;
    return [
      { id: "distribution", operand: distribution },
      { id: "outcome_split", operand: { white: result.white!, draws: result.draws!, black: result.black!, total, perspective: "white", convention: kit.convention(evidence, basis, "white"), floor: { threshold: EXPLORER_OUTCOME_FLOOR, met: total >= EXPLORER_OUTCOME_FLOOR } } },
      { id: "count_with_denominator", operand: { numerator, denominator: total, denominatorMeaning: "games_in_population" } },
    ];
  }, { id: "population_distribution", members: [{ component: "distribution", forms: ["list", "panel"] }, { component: "outcome_split", forms: ["list", "panel"] }, { component: "count_with_denominator", forms: ["list", "panel"] }] });

  // --- Inspector: the human-move model's policy (a model output, never a grade)
  add("inspector.human_split", V1("human.maia.policy"), "distribution", ["list", "panel"], ["engine", "targetElo", "candidates"], ["copied_byte_equal", "retained_convention"], (evidence) => {
    const page = evidence.payload as { readonly engine: { readonly name: string; readonly version: string }; readonly targetElo: number | null; readonly candidates: readonly { readonly moveUci: string; readonly mass?: number }[] };
    if (page.candidates.length === 0) throw new TypeError("a human-split page with no candidates is stated through its abstention seat, never drawn");
    const rows = page.candidates.map((candidate) => {
      if (candidate.mass === undefined) throw new TypeError("a human-split candidate without model mass cannot be drawn as a share");
      const move = uciParts(candidate.moveUci);
      return { move: { san: coordinates(move), uci: candidate.moveUci }, share: candidate.mass };
    });
    const listed = rows.reduce((sum, row) => sum + row.share, 0);
    return { id: "distribution", operand: {
      rows,
      residual: listed < 0.995 ? { share: Math.max(0, 1 - listed), label: "unlisted_mass" } : null,
      convention: kit.convention(evidence, { kind: "human_model", model: { name: page.engine.name, version: page.engine.version }, band: page.targetElo }, "side_to_move"),
      highlight: null,
    } };
  });

  // --- the evidence-reference sentence: its resolution, its attached source reading and its citation
  const REF = "runtime.evidence_ref";
  factAdapter(REF, V1("run.record.evidence_ref_resolution"), ["sentence"], ["reference", "text", "sourceLabel"], ["authored_text_copied", "mechanical_transform"], "consumer.evidence_reference@1", "recorded-run@1", referenceOperands);
  const attachedForms: Readonly<Record<string, readonly EvidenceForm[]>> = Object.freeze({
    "human.maia.event": ["panel"], "live.stockfish.eval": ["panel"], "live.stockfish.pv": ["list", "panel"], "live.stockfish.wdl": ["panel"], "live.syzygy.result": ["panel"],
  });
  for (const [projection, forms] of Object.entries(attachedForms)) {
    factAdapter(REF, V1(projection), forms, ["kind", "source", "values"], ["copied_byte_equal", "mechanical_transform"], "consumer.attached_reading@1", "recorded-engine@1", attachedOperands);
  }
  add(REF, V1("derived.citation.attribution"), "citation", ["list", "panel", "sentence"], ["content", "source"], ["copied_byte_equal", "authored_text_copied"], (evidence) => ({ id: "citation", operand: kit.citation(evidence) }));

  // --- author/operator: sourcing-ledger records as schema-coupled read-only documents (§3.12)
  const ledger: readonly (readonly [string, keyof typeof STRUCTURED_DOCUMENT_SCHEMAS])[] = [
    ["sourcing.ledger.engine_eval", "authoring.engine_eval_record@1"],
    ["sourcing.ledger.tablebase_result", "authoring.tablebase_result_record@1"],
    ["sourcing.ledger.explorer_position_census", "authoring.explorer_census_record@1"],
    ["sourcing.ledger.citable_text", "authoring.citable_text_record@1"],
    ["theory.opening_identity.record", "authoring.opening_identity_record@1"],
  ];
  for (const [projection, schemaId] of ledger) {
    const schema = STRUCTURED_DOCUMENT_SCHEMAS[schemaId];
    add("authoring.claim_binding", V1(projection), "structured_document", ["list", "panel"], schema.fields, ["copied_byte_equal"], (evidence) => {
      const item = evidence.payload as Readonly<Record<string, unknown>>;
      if (item.kind !== schema.recordKind) throw new TypeError(`a ${String(item.kind)} record cannot fill the ${schema.label} schema`);
      const document = Object.fromEntries(schema.fields.map((field) => [field, item[field]])) as Parameters<PresentationKit["structuredDocument"]>[1];
      return { id: "structured_document", operand: kit.structuredDocument(schemaId, document) };
    });
  }

  return Object.freeze(specs);
}
