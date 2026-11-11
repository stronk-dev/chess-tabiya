import { FOUNDATION_DETAIL_CAPTIONS, isFoundationDetailKind } from "./foundation-snapshot-detail.js";
import { FOUNDATION_SNAPSHOT_FACT_RENDERERS, FOUNDATION_SNAPSHOT_STATEMENTS, assertFoundationSnapshotPayloadRef } from "./foundation-snapshot-presentation.js";
// rfc/evidence-presentation.md Checkpoint B / rfc/module-registration.md A5 — the exact pair-keyed
// presentation adapters of `module.full_inspector@1`, `module.postcommit_nudge@1` and the
// `module.review_map@1` pairs outside Checkpoint A's list, with their registered fact renderers.
//
// One construct per payload family, reused per consumer: every consumer × projection pair names
// exactly its binding's forms and reads only declared projection operands (plus mechanical
// transforms of them — SAN from a retained FEN and move, a ply number from a retained FEN).
// Every sentence is a fixed template over parsed operands in learner vocabulary (§6a): chess
// notation, registered labels and the declared convention's label. No template grades, ranks,
// recommends or infers purpose; a board overlay only draws squares and moves the payload retains.
//
// Precursor witness-bound constructors keep their current semantics until actual cutover.
// Accepted D3984 Full2 whole readings instead retain attributed text and optional actual
// geometry, including exact empty/unavailable states; no all-clear inference follows.
//
// This file imports only types from `presentation-contract.ts`; the registry injects its kit.

import { Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import type { Color, Role, SquareName } from "chessops/types";
import { parseUci } from "chessops/util";

import { assertDeclaredEvidence, evidenceValueReceipt, type DeclaredEvidence, type EvidenceForm, type VersionedEvidenceId } from "./evidence-contract.js";
import type { AdapterSpec, ComponentValue, ConventionReceipt, FactOperandsByRenderer, PresentationKit, RelationOverlayOperand } from "./presentation-contract.js";
import { assertSquareSetGeometry, bindFactStatement } from "./presentation-fact-contract.js";
import { factRenderer, listPhrase, otherSide, pieceOn, pieceSchema, plural, PresentationSchemaError, ROLE_NAMES, s, side, type SchemaPiece } from "./presentation-schema.js";
import type { AvailableDefenderExposureOperands } from "./internal/defender-exposure.js";
import type { SquareControlReading } from "./square-control.js";
import { pawnContactCaptionOperands, squareControlCaptionOperands } from "./presentation-play-adapters.js";
import { renderMoveQualityGrade, renderMoveQualityGradeSummary } from "./grade.js";
import { currentRecordedModuleRefs, isNudgeRecordedCaptionBinding, PRIMARY_EVIDENCE_MANIFEST, STRUCTURAL_EVENT_FAMILIES } from "./evidence-catalog.js";
import { parseInspectorStructuralBeforeAfterOperands, renderInspectorStructuralBeforeAfter } from "./inspector-structural-event-presentation.js";
import { assertRegisteredShapeFiringWire, parseRegisteredShapeFiringOperands, renderRegisteredShapeFiring, registeredShapeFiringOperands } from "./registered-shape-presentation.js";
import { recordedEvalOperands, recordedWdlOperands, recordedPvOperands, recordedTablebaseOperands,
  recordedTablebaseCategoryOperands, recordedTablebaseDistanceOperands, recordedFieldText as reportField,
  RECORDED_TABLEBASE_LABELS, recordedInspectorEvalOperands, recordedInspectorWdlOperands,
  recordedInspectorPvOperands, recordedInspectorTablebaseOperands, recordedInspectorTablebaseViewOperands } from "./recorded-inspector-presentation.js";
import { INSPECTOR_DETAIL_SOURCES, inspectorDetailSquares, parseInspectorDetailPayload, renderInspectorDetail, type InspectorDetailKind } from "./inspector-detail.js";
import type { ExplorerInspectorPopulation } from "./explorer-summary.js";
import type { MaiaNodeDistribution, MaiaNodeCandidateWdl } from "./maia-node.js";
import { parseRecordedAnalyzeLineOperands, renderRecordedAnalyzeLine } from "./recorded-analyze-presentation.js";
import type { RecordedAnalyzeArm } from "./recorded-analyze-line.js";
import { readRecordedAnalyzeLineInvocation } from "./internal/evidence-value-routes.js";
import { recordedMovePathPositions } from "./presentation-move-path.js";
import { INSPECTOR_SOURCE_TOPICS } from "./inspector-source-topics.js";
import { FOUNDATION_EDGE_FACT_RENDERERS, FOUNDATION_EDGE_STATEMENTS, FOUNDATION_COMPACT_FACT_RENDERERS, FOUNDATION_COMPACT_STATEMENTS, assertFoundationEdgePayloadRef } from "./foundation-edge-presentation.js";
import { INSPECTOR_WHOLE_FACT_RENDERERS, INSPECTOR_WHOLE_READING_GEOMETRY, inspectorWholeReadingComponents, inspectorWholeReadingGeometryRequired, isInspectorWholeReading } from "./inspector-whole-reading-presentation.js";

type StatementContract = readonly [renderer: string, convention: string, binding?: "recorded_run"];
/** Exact wire semantics belong to the same registered source adapter as construction, not a UI
 * whitelist of globally valid renderers. Multiple tuples are only an authored source variant. */
const INSPECTOR_SOURCE_STATEMENTS: Readonly<Record<string, readonly StatementContract[]>> = Object.freeze({
  ...Object.fromEntries(STRUCTURAL_EVENT_FAMILIES.filter(family => family !== "backward_pawn" && family !== "king_opposition").map(family => [`rules.structural.event.${family}@1`, [["inspector.structural_before_after@1", "board-rules@1"]]])),
  ...Object.fromEntries(Object.entries(FOUNDATION_EDGE_STATEMENTS).map(([ref, [renderer, convention]]) => [ref, [[renderer, convention] as const]])),
  ...Object.fromEntries(Object.entries(FOUNDATION_SNAPSHOT_STATEMENTS).map(([ref, [renderer, convention]]) => [ref, [[renderer, convention] as const]])),
  "derived.review.analysis_typed_pv@1": [["review.analysis_typed_pv@1", "recorded-run@1"]],
  "derived.review.analysis_recorded_pv@1": [["review.analysis_recorded_pv@1", "recorded-run@1", "recorded_run"]],
  "derived.review.analysis_recorded_first@1": [["review.analysis_recorded_first@1", "recorded-run@1", "recorded_run"]],
  "rules.tactic.consequence.reply_breadth@1": [["inspector.reply_breadth@1", "board-rules@1"]],
  "rules.castling.reading.rights@1": [["play.castling_rights@1", "board-rules@1"]],
  "rules.castling.reading.legality@1": [["play.castling_legality@1", "board-rules@1"]],
  "derived.tactic.discovered_executed@1": [["inspector.discovered_executed@1", "threat-convention@1"]],
  "derived.tactic.nonterminal_fork_survival@1": [["inspector.fork_survives@1", "threat-convention@1"]],
  "rules.square.reading.control@1": [["play.square_control@1", "piece-geometry@1"]],
  "rules.square.event.control@1": [["inspector.square_control_event@1", "piece-geometry@1"]],
  "rules.mobility.event.piece_destinations@1": [["inspector.piece_destinations_event@1", "piece-geometry@1"]],
  "derived.pawn.sequence.contact_timing@3": [["inspector.contact_timing@1", "recorded-run@1", "recorded_run"]],
  "derived.pawn.sequence.harassment_pressure@3": [["inspector.harassment@1", "recorded-run@1", "recorded_run"]],
  "derived.tactic.sequence.defender_consequence@3": [["inspector.defender_consequence@1", "recorded-run@1", "recorded_run"]],
  "derived.material.reading.role_signature@2": [["inspector.role_signature@1", "board-rules@1"]],
  "derived.material.event.role_asymmetry@2": [["inspector.role_asymmetry@1", "board-rules@1"]],
  "derived.tactic.defender_exposure@2": [["inspector.defender_exposure@1", "piece-geometry@1"]],
  "rules.king.reading.zone_state@1": [["inspector.king_zone@1", "piece-geometry@1"]],
  "recorded.inspector.eval_packet@1": [["inspector.recorded_eval@1", "recorded-run@1", "recorded_run"]],
  "recorded.inspector.wdl_packet@1": [["inspector.recorded_wdl@1", "recorded-run@1", "recorded_run"]],
  "recorded.inspector.pv_packet@1": [["inspector.recorded_pv@1", "recorded-run@1", "recorded_run"]],
  "recorded.inspector.tablebase_packet@1": [["inspector.recorded_tablebase@1", "recorded-run@1", "recorded_run"]],
  "derived.inspector.tablebase_category@1": [["inspector.recorded_tablebase_category@1", "recorded-run@1", "recorded_run"]],
  "derived.inspector.tablebase_distance@1": [["inspector.recorded_tablebase_distance@1", "recorded-run@1", "recorded_run"]],
  "derived.maia.node_distribution@1": [["consumer.maia_node_distribution@1", "maia-reported-window@1"]],
  "derived.maia.node_candidate_wdl@1": [["consumer.maia_node_candidate_wdl@1", "maia-reported-window@1"]],
  "derived.explorer.inspector_population@1": [["consumer.explorer_population@1", "explorer-population@1"]],
  "recorded.engine.eval@1": [],
  "recorded.tablebase.result@1": [["inspector.tablebase@1", "recorded-engine@1"]],
  "theory.shapes.firing@3": [["inspector.registered_shape_firing@2", "shape-catalogue@1"]],
  "rules.phase.reading@2": [["play.phase@1", "phase-bands@1"]],
  "derived.pivotal.irreversibility@1": [["inspector.pivotal@1", "board-rules@1"]],
  "derived.pivotal.phase_change@2": [["inspector.pivotal@1", "phase-bands@1"]],
  "derived.pivotal.human_divergence@2": [["inspector.pivotal@1", "recorded-run@1", "recorded_run"]],
  "derived.pivotal.option_collapse@2": [["inspector.pivotal@1", "board-rules@1"]],
  "derived.compare.structure_delta@2": [["play.compare_structure@1", "pawn-structure@1"], ["play.named_structure@1", "structure-catalogue@1"]],
  "derived.compare.eval_delta@2": [["compare.recorded_delta@2", "recorded-comparison@1", "recorded_run"]],
  "derived.story.rank@3": [["inspector.story_rank@1", "recorded-run@1", "recorded_run"]],
  "theory.opening.catalogue_membership@1": [["inspector.catalogue_membership@1", "opening-catalogue@1"]],
  "derived.opening.deepest_reached@2": [["inspector.opening_reached@1", "opening-catalogue@1"]],
  "derived.tactic.attraction_observed@3": [["inspector.attraction@1", "recorded-run@1", "recorded_run"]],
  "derived.tactic.check_zwischenzug_observed@3": [["inspector.zwischenzug@1", "recorded-run@1", "recorded_run"]],
  "derived.tactic.deflection_observed@3": [["inspector.deflection@1", "recorded-run@1", "recorded_run"]],
  "derived.tactic.interference_observed@3": [["inspector.interference@1", "recorded-run@1", "recorded_run"]],
  "derived.tactic.line_blocker_clearance_observed@3": [["inspector.line_clearance@1", "recorded-run@1", "recorded_run"]],
  "derived.tactic.overload_exploitation_observed@3": [["inspector.overload@1", "recorded-run@1", "recorded_run"]],
  "derived.tactic.square_clearance_observed@3": [["inspector.square_clearance@1", "recorded-run@1", "recorded_run"]],
  "rules.tactic.event.defender_removed@1": [["inspector.defender_removed@1", "piece-geometry@1"]],
  "rules.tactic.event.defender_duty_relocated@1": [["inspector.duty_relocated@1", "piece-geometry@1"]],
  "rules.tactic.predicate.overload_conflict@1": [["inspector.overload_conflict@1", "threat-convention@1"]],
  "rules.tactic.consequence.forced_mate_after_move@1": [["inspector.forced_mate@1", "board-rules@1"]],
  "rules.tactic.consequence.forced_mate_after_move@2": [["inspector.forced_mate@1", "board-rules@1"]],
});

function assertInspectorWireComponent(ref: string, component: ComponentValue, owner: string, producer: VersionedEvidenceId): void {
  const fail = (): never => { throw new TypeError("Inspector component crosses its registered source semantics"); };
  if (ref === "theory.shapes.firing@3") assertRegisteredShapeFiringWire(component, { producer,
    projection: { id: "theory.shapes.firing", version: 3 }, evidenceDigest: owner });
  const declared = PRIMARY_EVIDENCE_MANIFEST.projections.find(projection => `${projection.id}@${projection.version}` === ref);
  if (declared === undefined || producer.id !== declared.producer.id || producer.version !== declared.producer.version) return fail();
  if (ref === "recorded.engine.eval@1") {
    if (component.id !== "magnitude" || !["centipawn", "mate_in"].includes(component.operand.unit.kind)
      || !Number.isSafeInteger(component.operand.value) || component.operand.unit.kind === "mate_in" && component.operand.value === 0
      || component.operand.saturated !== false || component.operand.convention.basis.kind !== "recorded_search"
      || !["white", "not_applicable"].includes(component.operand.convention.perspective)) return fail();
  }
  if (component.id === "square_set" || component.id === "relation_overlay") {
    if (component.operand.owner.factRef !== owner) return fail();
  }
  const statement = component.id === "fact_statement" ? component.operand : component.id === "square_set" ? component.operand.caption : null;
  if (statement !== null) {
    if (isInspectorWholeReading(ref)) {
      inspectorWholeReadingGeometryRequired(ref, statement);
      const convention = ["rules.structural.reading.space@1", "rules.pawn.reading.candidate_majority@1"].includes(ref) ? "pawn-structure@1"
        : ["rules.mobility.reading.piece_destinations@1", "rules.tactic.reading.defender_duty_set@1"].includes(ref) ? "piece-geometry@1"
        : ["rules.tactic.reading.loose_piece@1", "rules.tactic.reading.ray_classification@1", "rules.tactic.reading.trapped_piece@1", "rules.tactic.reading.back_rank@1", "rules.tactic.reading.discovered_latency@1", "rules.tactic.consequence.threat@1"].includes(ref) ? "threat-convention@1" : "board-rules@1";
      if (statement.binding !== "declared_convention" || statement.convention !== convention) return fail();
      if (ref === "rules.mobility.reading.legal_moves@1" && component.id === "square_set"
        && statement.rendererId === "play.legal_moves@1") assertSquareSetGeometry(component, owner, statement.operands.squares, "blue");
    } else if (ref.startsWith("derived.inspector.detail.")) {
      const kind = ref.slice("derived.inspector.detail.".length, -2);
      const convention = kind === "defender_exposure" ? "legal-exchange@1" : isFoundationDetailKind(kind) ? FOUNDATION_DETAIL_CAPTIONS[kind] : "piece-geometry@1";
      if (statement.rendererId !== `inspector.detail.${kind}@1` || statement.binding !== "declared_convention" || statement.convention !== convention) return fail();
      if (kind === "defender_exposure" || isFoundationDetailKind(kind)) assertFoundationSnapshotPayloadRef(statement.operands, owner);
    } else {
      const allowed = INSPECTOR_SOURCE_STATEMENTS[ref];
      if (allowed === undefined || !allowed.some(([renderer, convention, binding]) => statement.rendererId === renderer && statement.convention === convention && statement.binding === (binding ?? "declared_convention"))) return fail();
      if (Object.hasOwn(FOUNDATION_EDGE_STATEMENTS, ref)) assertFoundationEdgePayloadRef(statement.operands, owner);
      if (Object.hasOwn(FOUNDATION_SNAPSHOT_STATEMENTS, ref)) assertFoundationSnapshotPayloadRef(statement.operands, owner);
      if (ref.startsWith("derived.pivotal.") && (statement.operands as { kind?: string }).kind !== ref.split(".").at(-1)!.split("@")[0]) return fail();
      if (statement.rendererId === "inspector.structural_before_after@1" && ref !== `rules.structural.event.${statement.operands.family}@1`) return fail();
    }
  }
  const convention = "convention" in component.operand ? component.operand.convention : undefined;
  if (convention !== undefined && convention !== null && typeof convention === "object" && "sourceProjection" in convention) {
    if (`${convention.sourceProjection.id}@${convention.sourceProjection.version}` !== ref || convention.sourceEvidenceDigest !== owner
      || convention.producer.id !== producer.id || convention.producer.version !== producer.version) return fail();
  }
}

// ---------------------------------------------------------------------------------------------
// Shared phrasing
// ---------------------------------------------------------------------------------------------

const SQUARES = s.arr(s.square);
const nonemptySquareSet = (value: unknown, label: string): readonly SquareName[] => {
  const squares = s.arr(s.square, { min: 1 })(value, label);
  if (new Set(squares).size !== squares.length) throw new PresentationSchemaError(`${label} must contain deduplicated squares`);
  return squares;
};
const placed = s.obj({ piece: pieceSchema, square: s.square });
type Placed = { readonly piece: SchemaPiece; readonly square: SquareName };
const placedPhrase = (value: Placed): string => pieceOn(value.piece, value.square);
const placedList = (values: readonly Placed[]): string => listPhrase(values.map(placedPhrase));
/** "White's rook h8, knight f6" — a compact placed-piece list for word-budgeted seats. */
const terse = (values: readonly Placed[]): string => `${side(values[0]!.piece.color)}'s ${values.map((value, index) => `${index > 0 && value.piece.color !== values[index - 1]!.piece.color ? `${side(value.piece.color)}'s ` : ""}${value.piece.role} ${value.square}`).join(", ")}`;
const squaresOrNone =(values: readonly string[]): string => (values.length === 0 ? "none" : listPhrase(values));
const capital = (text: string): string => `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;
const NON_KING_ROLES = s.lit("pawn", "knight", "bishop", "rook", "queen");
const PLURAL_ROLES: Readonly<Record<Role, string>> = Object.freeze({ pawn: "pawns", knight: "knights", bishop: "bishops", rook: "rooks", queen: "queens", king: "kings" });
const roleCount = (count: number, role: Role): string => `${count} ${count === 1 ? role : PLURAL_ROLES[role]}`;
/** Squares as "e2–e4": long algebraic from the retained move, never bare UCI. */
const longMove = s.obj({ from: s.square, to: s.square, promotion: s.nullable(s.role) });
type LongMove = ReturnType<typeof longMove>;
const PROMOTION_LETTERS: Readonly<Record<Role, string>> = Object.freeze({ pawn: "P", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K" });
const longPhrase = (move: LongMove): string => `${move.from}–${move.to}${move.promotion === null ? "" : `=${PROMOTION_LETTERS[move.promotion]}`}`;
const tenths = (value: number): string => (value / 10).toFixed(1);
const pawnsText = (centipawns: number): string => `${centipawns >= 0 ? "+" : "−"}${(Math.abs(centipawns) / 100).toFixed(2)}`;

// ---------------------------------------------------------------------------------------------
// Structural and transition events
// ---------------------------------------------------------------------------------------------

const STRUCTURAL_FAMILIES = Object.freeze(["backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "king_opposition", "king_zone", "open_file", "passed_pawn"] as const);
const structuralObservation = s.obj(
  { kind: s.lit(...STRUCTURAL_FAMILIES), squares: SQUARES },
  { color: s.color, file: s.file, form: s.lit("direct", "distant"), zone: s.lit("edge", "corner") },
);
type StructuralObservation = ReturnType<typeof structuralObservation>;
const need = <T>(value: T | undefined, label: string): T => { if (value === undefined) throw new TypeError(`structural observation omits ${label}`); return value; };
function structuralWhat(o: StructuralObservation): string {
  const color = (): Color => need(o.color, "color");
  const file = (): string => need(o.file, "file");
  switch (o.kind) {
    case "backward_pawn": return `${side(color())}'s pawn on the ${file()}-file is backward under the declared pawn-structure convention`;
    case "doubled_pawn": return `${side(color())} has at least two pawns on the ${file()}-file`;
    case "half_open_file": return `${side(color())} has no pawn on the ${file()}-file while ${otherSide(color())} has one`;
    case "isolated_pawn": return `${side(color())} has a pawn on the ${file()}-file and none on either adjacent file`;
    case "king_opposition": return `${side(color())} has the ${need(o.form, "form")} opposition with the kings on ${listPhrase(o.squares)}`;
    case "king_zone": return `${side(color())}'s king on ${o.squares[0] ?? "its square"} stands ${need(o.zone, "zone") === "corner" ? "in a corner of the board" : "on the edge of the board"}`;
    case "open_file": return `neither side has a pawn on the ${file()}-file`;
    case "passed_pawn": return `${side(color())}'s pawn on ${o.squares[0] ?? "its square"} is a passed pawn`;
  }
}
const CHANGE_PHRASES = Object.freeze({ appeared: "this became true", disappeared: "this is no longer true", held: "this still holds" } as const);

const AVOIDANCE_FAMILIES = Object.freeze(["backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "king_opposition", "king_zone", "open_file", "passed_pawn", "loose_piece", "pawn_islands"] as const);
const AVOIDANCE_LABELS: Readonly<Record<(typeof AVOIDANCE_FAMILIES)[number], string>> = Object.freeze({
  backward_pawn: "a backward pawn", doubled_pawn: "doubled pawns", half_open_file: "a half-open file", isolated_pawn: "an isolated pawn",
  king_opposition: "the opposition", king_zone: "a king on the edge of the board", open_file: "an open file", passed_pawn: "a passed pawn",
  loose_piece: "a loose piece", pawn_islands: "a change in pawn islands",
});
const PAWN_ISLAND_SIGNS = Object.freeze({ gained: "raised the pawn-island count", lost: "lowered the pawn-island count", preserved: "kept the pawn-island count", state: "changed the pawn-island count" } as const);
const AVOIDANCE_SIGNS =Object.freeze({ gained: "produced", lost: "removed", preserved: "kept", state: "produced" } as const);

const CASTLING_CAUSES = Object.freeze({ king_moved: "the king moved", rook_moved: "the rook moved", rook_captured: "the rook was captured", castled: "that side castled" } as const);

const PAWN_DYNAMICS_KINDS = Object.freeze(["locked_pair_gained", "minor_harassed", "protected_passer_gained", "connected_passer_pair_gained", "candidate_majority_gained", "candidate_majority_advanced"] as const);
const PAWN_TRANSITION_KINDS = Object.freeze(["contact_executed", "moved_pawn_became_passed", "capture_created_moved_passer", "passed_pawn_advanced"] as const);

const TABLEBASE_CATEGORIES = Object.freeze({ win: "a win", loss: "a loss", draw: "a draw", "cursed-win": "a win that the fifty-move rule turns into a draw", "blessed-loss": "a loss that the fifty-move rule turns into a draw" } as const);
type TablebaseCategory = keyof typeof TABLEBASE_CATEGORIES;

const pivotalOperands = s.union("kind", {
  phase_change: s.obj({ kind: s.lit("phase_change"), from: s.lit("opening", "middlegame", "endgame"), to: s.lit("opening", "middlegame", "endgame") }),
  human_divergence: s.obj({ kind: s.lit("human_divergence"), model: s.str, band: s.nullable(s.nat), shares: s.arr(s.unit, { min: 1, max: 3 }) }),
  option_collapse: s.obj({ kind: s.lit("option_collapse"), color: s.color, count: s.nat }),
  irreversibility: s.union("subkind", {
    castled: s.obj({ kind: s.lit("irreversibility"), subkind: s.lit("castled"), color: s.color }),
    last_of_role: s.obj({ kind: s.lit("irreversibility"), subkind: s.lit("last_of_role"), color: s.color, role: s.role, queensOff: s.bool }),
    pawn_break: s.obj({ kind: s.lit("irreversibility"), subkind: s.lit("pawn_break"), color: s.color }),
  }),
});
const gradeScore = s.union("kind", {
  cp: s.obj({ kind: s.lit("cp"), value: s.int }),
  mate: s.obj({ kind: s.lit("mate"), movesTo: s.int }),
});
const gradeScoreText = (score: ReturnType<typeof gradeScore>): string =>
  "value" in score ? pawnsText(score.value) : `mate in ${Math.abs(score.movesTo)} for ${score.movesTo > 0 ? "White" : "Black"}`;

// Complete grade operands remain learner-relative. They carry no White/Black identity
// from which a renderer could infer the beneficiary of a positive mate score.
const gradePercent = (value: unknown, label: string): number => {
  s.unit(typeof value === "number" ? value / 100 : value, label);
  return value as number;
};
const completeGradeScore = s.obj({ score: gradeScore, winPercent: gradePercent });
const positiveGradeInteger = (value: unknown, label: string) => { const result = s.nat(value, label); if (result === 0) throw new TypeError(`${label} must be positive`); return result; };
const completeGrade = s.obj({
  klass: s.lit("inaccuracy", "mistake", "blunder"), arm: s.lit("eval_delta", "mate_lost", "mate_allowed"),
  before: completeGradeScore, after: completeGradeScore, dropWinPercent: gradePercent,
  thresholdCrossed: (value: unknown, label: string) => typeof value === "number" ? gradePercent(value, label) : s.lit("mate_lost_tier", "mate_allowed_tier")(value, label),
  convention: s.obj({ id: s.lit("grade-convention"), version: s.lit(2) }),
  engineId: s.str, lane: s.lit("recorded"),
  bound: s.union("kind", { depth: s.obj({ kind: s.lit("depth"), requestedDepth: positiveGradeInteger }),
    movetime: s.obj({ kind: s.lit("movetime"), requestedMs: positiveGradeInteger }), nodes: s.obj({ kind: s.lit("nodes"), requestedNodes: positiveGradeInteger }) }),
  instrument: s.union("origin", {
    provider_delivery: s.obj({ origin: s.lit("provider_delivery"), engineVersion: s.str, generation: s.nat }),
    offline_engine: s.obj({ origin: s.lit("offline_engine"), engineVersion: s.str,
      profile: s.obj({ threads: positiveGradeInteger, hashMb: positiveGradeInteger, multiPv: s.lit(1) }) }),
  }),
});

const SEQUENCE_CONTACT_KINDS = s.lit("created_survived_reply", "created_executed_next_own_move");

// ---------------------------------------------------------------------------------------------
// Registered fact renderers
// ---------------------------------------------------------------------------------------------

const detailRenderer = <K extends InspectorDetailKind>(kind: K) => factRenderer(
  value => parseInspectorDetailPayload(kind, value),
  value => renderInspectorDetail(parseInspectorDetailPayload(kind, value)),
);
const analyzeRenderer = (arm: RecordedAnalyzeArm) => factRenderer((value, label) => {
  const parsed = parseRecordedAnalyzeLineOperands(value, label);
  if (parsed.sourceArm !== arm) throw new TypeError("Analyze renderer crosses its exact recorded source arm");
  return parsed;
}, renderRecordedAnalyzeLine);

const exposureSummary = s.obj({
  defender: s.obj({ color: s.color, role: s.role, square: s.square }),
  target: s.obj({ color: s.color, role: s.role, square: s.square }),
  captureCount: s.nat,
  passConvention: s.lit("mover-turn-ep-cleared@1"),
});
const defenderExposureRenderer = factRenderer((raw, label) => {
  const value = exposureSummary(raw, label);
  if (value.captureCount === 0 || value.defender.color !== value.target.color || value.defender.square === value.target.square) {
    throw new PresentationSchemaError("defender exposure requires distinct allied pieces and positive captures");
  }
  return value;
}, ({ defender, target, captureCount }) =>
  `The ${target.color} ${ROLE_NAMES[target.role]} on ${target.square} lost geometric coverage from the ${defender.color} ${ROLE_NAMES[defender.role]} that was on ${defender.square}. If ${side(target.color)} could skip the reply, ${otherSide(target.color)} would have ${plural(captureCount, "capture")} on ${target.square} with a positive result under the local capture-and-recapture rule.`);

function defenderExposureSummary(evidence: DeclaredEvidence<unknown>): ReturnType<typeof exposureSummary> {
  const { defender, target, captures, passConvention } = evidence.payload as AvailableDefenderExposureOperands;
  return {
    defender: { color: defender.piece.color, role: defender.piece.role, square: defender.square },
    target: { color: target.piece.color, role: target.piece.role, square: target.square },
    captureCount: captures.length, passConvention,
  };
}

export const INSPECTOR_FACT_RENDERERS = Object.freeze({
  ...INSPECTOR_WHOLE_FACT_RENDERERS,
  ...FOUNDATION_EDGE_FACT_RENDERERS,
  ...FOUNDATION_COMPACT_FACT_RENDERERS,
  ...FOUNDATION_SNAPSHOT_FACT_RENDERERS,
  "inspector.structural_before_after@1": factRenderer(parseInspectorStructuralBeforeAfterOperands, renderInspectorStructuralBeforeAfter),
  "review.analysis_typed_pv@1": analyzeRenderer("typed_pv"),
  "review.analysis_recorded_pv@1": analyzeRenderer("recorded_bestline"),
  "review.analysis_recorded_first@1": analyzeRenderer("recorded_search_first"),
  "review.defender_exposure@1": defenderExposureRenderer,
  "inspector.defender_exposure@1": defenderExposureRenderer,
  "inspector.registered_shape_firing@2": factRenderer(parseRegisteredShapeFiringOperands, renderRegisteredShapeFiring),
  "inspector.recorded_eval@1": factRenderer(recordedEvalOperands, value =>
    `Stored report ${value.reportSeq}: centipawn number ${reportField(value.centipawns, String)}; mate-distance number ${reportField(value.mateIn, String)}; reported perspective ${reportField(value.perspective, side => side === "white" ? "White" : "side to move")}. Historical report only, not independently verified engine analysis or a move grade.`),
  "inspector.recorded_wdl@1": factRenderer(recordedWdlOperands, value =>
    `Stored report ${value.reportSeq}: win ${reportField(value.win, count => `${count}/1000`)}; draw ${reportField(value.draw, count => `${count}/1000`)}; loss ${reportField(value.loss, count => `${count}/1000`)}. These are the recorded numbers, not a newly verified prediction or a move grade.`),
  "inspector.recorded_pv@1": factRenderer(recordedPvOperands, value =>
    `Stored report ${value.reportSeq}: line ${reportField(value.line, moves => moves.length === 0 ? "reported with no moves" : moves.join(" "))}. A historical reported line, not a current recommendation or verified best continuation.`),
  "inspector.recorded_tablebase_category@1": factRenderer(recordedTablebaseCategoryOperands, value =>
    `Stored report ${value.reportSeq}: category ${reportField(value.category, category => RECORDED_TABLEBASE_LABELS[category])}. This records the report, not a fresh exact tablebase probe.`),
  "inspector.recorded_tablebase_distance@1": factRenderer(recordedTablebaseDistanceOperands, value =>
    `Stored report ${value.reportSeq}: category ${reportField(value.category, category => RECORDED_TABLEBASE_LABELS[category])}; signed distance to zeroing ${reportField(value.dtz, distance => distance === null ? "recorded without a distance value" : String(distance))}; precise signed distance to zeroing ${reportField(value.preciseDtz, distance => distance === null ? "recorded without a distance value" : String(distance))}; signed distance to mate ${reportField(value.dtm, distance => distance === null ? "recorded without a distance value" : String(distance))}. Recorded fields only; optimal play and a fresh exact probe are not established.`),
  "inspector.recorded_tablebase@1": factRenderer(recordedTablebaseOperands, value =>
    `Stored report ${value.reportSeq}: category ${reportField(value.category, category => RECORDED_TABLEBASE_LABELS[category])}; signed distance to zeroing ${reportField(value.dtz, distance => distance === null ? "recorded without a distance value" : String(distance))}; precise signed distance to zeroing ${reportField(value.preciseDtz, distance => distance === null ? "recorded without a distance value" : String(distance))}; signed distance to mate ${reportField(value.dtm, distance => distance === null ? "recorded without a distance value" : String(distance))}; piece count ${reportField(value.pieceCount, String)}. Historical fields only, not a fresh exact tablebase probe.`),
  // Accepted D3802: exact typed operands, recomputed text, no caller-supplied sentences.
  // Current consumer2 adapters/API adoption remain a separate part of the same cutover.
  "inspector.detail.rays@1": detailRenderer("rays"),
  "inspector.detail.square_control@1": detailRenderer("square_control"),
  "inspector.detail.piece_destinations@1": detailRenderer("piece_destinations"),
  "inspector.detail.destination_changes@1": detailRenderer("destination_changes"),
  "inspector.detail.king_zone@1": detailRenderer("king_zone"),
  "inspector.detail.defender_duties@1": detailRenderer("defender_duties"),
  "inspector.detail.backward_pawns@1": detailRenderer("backward_pawns"),
  "inspector.detail.pawn_file_groups@1": detailRenderer("pawn_file_groups"),
  "inspector.detail.file_states@1": detailRenderer("file_states"),
  "inspector.detail.future_file_challenges@1": detailRenderer("future_file_challenges"),
  "inspector.detail.capture_migration_reaches@1": detailRenderer("capture_migration_reaches"),
  "inspector.detail.outpost_candidates@1": detailRenderer("outpost_candidates"),
  "inspector.detail.occupied_outposts@1": detailRenderer("occupied_outposts"),
  "inspector.detail.backward_pawn_advance@1": detailRenderer("backward_pawn_advance"),
  "inspector.detail.defender_exposure@1": detailRenderer("defender_exposure"),

  // --- one-edge events (Post-commit Nudge, Review Map and Full Inspector)
  "inspector.structural_event@1": factRenderer(s.obj({ san: s.san, change: s.lit("appeared", "disappeared", "held"), observation: structuralObservation }), (value) =>
    `After ${value.san}, ${CHANGE_PHRASES[value.change]}: ${structuralWhat(value.observation)}.`),
  "inspector.pawn_islands_event@1": factRenderer(s.obj({ san: s.san, color: s.color, before: s.nat, after: s.nat }), (value) =>
    `After ${value.san}, ${side(value.color)} has ${plural(value.after, "pawn island")} (before: ${value.before}).`),
  "inspector.capture@1": factRenderer(s.obj({ san: s.san, mover: pieceSchema, from: s.square, to: s.square, captured: pieceSchema, enPassant: s.bool }), (value) =>
    value.enPassant
      ? `${value.san}: ${pieceOn(value.mover, value.from)} captures ${side(value.captured.color)}'s pawn en passant, landing on ${value.to}.`
      : `${value.san}: ${pieceOn(value.mover, value.from)} captures ${pieceOn(value.captured, value.to)}.`),
  "inspector.castled@1": factRenderer(s.obj({ san: s.san, color: s.color, king: s.square }), (value) =>
    `${side(value.color)} castled (${value.san}); the king now stands on ${value.king}.`),
  "inspector.checkmate@1": factRenderer(s.obj({ san: s.san, mated: s.color }), (value) =>
    `${value.san} delivers checkmate against ${side(value.mated)}.`),
  "inspector.developed@1": factRenderer(s.obj({ san: s.san, piece: pieceSchema, from: s.square, to: s.square }), (value) =>
    `${value.san}: ${side(value.piece.color)}'s ${value.piece.role} leaves its home square ${value.from} for ${value.to} under the declared development convention.`),
  "inspector.last_of_role@1": factRenderer(s.obj({ san: s.san, color: s.color, role: s.role }), (value) =>
    `After ${value.san}, ${side(value.color)} has no ${PLURAL_ROLES[value.role]} left.`),
  "inspector.pawn_contact@1": factRenderer(s.obj({ san: s.san, color: s.color, square: s.square, enemy: s.arr(s.square, { min: 1 }) }), (value) =>
    `${value.san}: ${side(value.color)}'s pawn on ${value.square} now meets ${otherSide(value.color)}'s ${value.enemy.length === 1 ? "pawn" : "pawns"} on ${listPhrase(value.enemy)}.`),
  "inspector.promotion@1": factRenderer(s.obj({ san: s.san, color: s.color, square: s.square, role: s.role }), (value) =>
    `${value.san}: ${side(value.color)}'s pawn promotes to a ${value.role} on ${value.square}.`),
  "inspector.defended_duty@1": factRenderer(s.obj({ san: s.san, piece: pieceSchema, square: s.square, before: SQUARES, after: SQUARES }), (value) =>
    `After ${value.san}, ${pieceOn(value.piece, value.square)} defends pieces on ${squaresOrNone(value.after)} (before: ${squaresOrNone(value.before)}).`),
  "inspector.occupied_attack@1": factRenderer(s.obj({ san: s.san, attacker: s.color, occupant: pieceSchema, square: s.square, before: SQUARES, after: SQUARES }), (value) =>
    `After ${value.san}, ${pieceOn(value.occupant, value.square)} is attacked by ${side(value.attacker)} from ${value.after.length === 0 ? "no square" : listPhrase(value.after)} (before: ${squaresOrNone(value.before)}).`),
  "inspector.occupied_defence@1": factRenderer(s.obj({ san: s.san, defender: s.color, occupant: pieceSchema, square: s.square, before: SQUARES, after: SQUARES }), (value) =>
    `After ${value.san}, ${pieceOn(value.occupant, value.square)} is defended by ${side(value.defender)} from ${value.after.length === 0 ? "no square" : listPhrase(value.after)} (before: ${squaresOrNone(value.before)}).`),
  "inspector.piece_escape@1": factRenderer(s.obj({ san: s.san, piece: pieceSchema, square: s.square, before: SQUARES, after: SQUARES }), (value) =>
    `After ${value.san}, ${pieceOn(value.piece, value.square)} has escape squares ${squaresOrNone(value.after)} (before: ${squaresOrNone(value.before)}).`),
  "inspector.slider_ray@1": factRenderer(s.obj({ san: s.san, piece: pieceSchema, square: s.square, endpoint: s.square, before: SQUARES, after: SQUARES }), (value) =>
    `After ${value.san}, the line of ${pieceOn(value.piece, value.square)} toward ${value.endpoint} reaches ${squaresOrNone(value.after)} (before: ${squaresOrNone(value.before)}).`),
  "inspector.check@1": factRenderer(s.obj({ move: longMove, checkers: s.arr(placed, { min: 1 }), king: placed }), (value) =>
    `The move ${longPhrase(value.move)} gives check: ${placedList(value.checkers)} ${value.checkers.length === 1 ? "attacks" : "attack"} ${placedPhrase(value.king)}.`),
  "inspector.double_attack@1": factRenderer(s.obj({ san: s.san, attacker: placed, targets: s.arr(placed, { min: 2 }) }), (value) =>
    `After ${value.san}, ${placedPhrase(value.attacker)} attacks ${placedList(value.targets)} at once.`),
  "inspector.loose_event@1": factRenderer(s.obj({ san: s.san, subject: placed, before: s.lit("en_prise", "loose", "under_defended", "covered"), after: s.lit("en_prise", "loose", "under_defended", "covered"), capturers: SQUARES }), (value) => {
    const state = { en_prise: "can be captured at a material loss", loose: "has no defender", under_defended: "has fewer defenders than attackers", covered: "is neither loose nor capturable at a material loss" } as const;
    const past = { en_prise: "could be captured at a material loss", loose: "had no defender", under_defended: "had fewer defenders than attackers", covered: "was neither loose nor capturable at a material loss" } as const;
    return `After ${value.san}, ${placedPhrase(value.subject)} ${state[value.after]}${value.capturers.length === 0 ? "" : ` (capturable from ${listPhrase(value.capturers)})`} under the declared exchange convention; before the move it ${past[value.before]}.`;
  }),
  "inspector.rights_lost@1": factRenderer(s.obj({ san: s.san, color: s.color, wing: s.lit("kingside", "queenside"), cause: s.lit("king_moved", "rook_moved", "rook_captured", "castled") }), (value) =>
    `After ${value.san}, ${side(value.color)} can no longer castle ${value.wing}: ${CASTLING_CAUSES[value.cause]}.`),
  "inspector.king_zone_event@1": factRenderer(s.obj({ san: s.san, color: s.color, king: s.square, kingFrom: s.nullable(s.square), attackersGained: s.arr(placed), attackersLost: s.arr(placed), defendersGained: s.arr(placed), defendersLost: s.arr(placed), shelterGained: s.arr(placed), shelterLost: s.arr(placed), escapesGained: SQUARES, escapesLost: SQUARES }), (value) => {
    const clauses = [
      ...(value.kingFrom === null ? [] : [`king from ${value.kingFrom}`]),
      ...(value.attackersGained.length === 0 ? [] : [`attackers gained ${terse(value.attackersGained)}`]),
      ...(value.attackersLost.length === 0 ? [] : [`attackers lost ${terse(value.attackersLost)}`]),
      ...(value.defendersGained.length === 0 ? [] : [`defenders gained ${terse(value.defendersGained)}`]),
      ...(value.defendersLost.length === 0 ? [] : [`defenders lost ${terse(value.defendersLost)}`]),
      ...(value.shelterGained.length === 0 ? [] : [`shelter gained ${terse(value.shelterGained)}`]),
      ...(value.shelterLost.length === 0 ? [] : [`shelter lost ${terse(value.shelterLost)}`]),
      ...(value.escapesGained.length === 0 ? [] : [`escapes gained ${value.escapesGained.join(", ")}`]),
      ...(value.escapesLost.length === 0 ? [] : [`escapes lost ${value.escapesLost.join(", ")}`]),
    ];
    if (clauses.length === 0) return `After ${value.san}, the attackers, defenders, shelter and escape squares around ${side(value.color)}'s king on ${value.king} are unchanged under the declared king-zone convention.`;
    return `After ${value.san}, around ${side(value.color)}'s king on ${value.king} (declared king-zone convention): ${clauses.join("; ")}.`;
  }),
  "inspector.pawn_dynamics@1": factRenderer(s.obj({ san: s.san, kind: s.lit(...PAWN_DYNAMICS_KINDS), pieces: s.arr(placed, { min: 1 }) }), (value) => {
    const [first, second] = value.pieces;
    const one = placedPhrase(first!);
    const two = second === undefined ? undefined : placedPhrase(second);
    const pair = (): string => { if (two === undefined) throw new TypeError(`${value.kind} names two pawns`); return two; };
    switch (value.kind) {
      case "locked_pair_gained": return `After ${value.san}, ${one} and ${pair()} now block each other.`;
      case "minor_harassed": return `After ${value.san}, ${one} attacks ${pair()}.`;
      case "protected_passer_gained": return `After ${value.san}, ${one} is a passed pawn protected by ${placedList(value.pieces.slice(1)) || "another pawn"}.`;
      case "connected_passer_pair_gained": return `After ${value.san}, ${one} and ${pair()} are connected passed pawns.`;
      case "candidate_majority_gained": return `After ${value.san}, ${one} is a candidate passed pawn under the declared pawn-structure convention.`;
      case "candidate_majority_advanced": return `After ${value.san}, the candidate passed pawn moved from ${first!.square} to ${second?.square ?? first!.square} under the declared pawn-structure convention.`;
    }
  }),
  "inspector.pawn_transition@1": factRenderer(s.obj({ san: s.san, kind: s.lit(...PAWN_TRANSITION_KINDS), color: s.color, from: s.square, to: s.square }), (value) => {
    switch (value.kind) {
      case "contact_executed": return `${value.san}: ${side(value.color)}'s pawn from ${value.from} resolves a pawn contact by capturing on ${value.to}.`;
      case "moved_pawn_became_passed": return `After ${value.san}, ${side(value.color)}'s pawn on ${value.to} is a passed pawn.`;
      case "capture_created_moved_passer": return `After ${value.san}, the capturing pawn on ${value.to} is a passed pawn.`;
      case "passed_pawn_advanced": return `${value.san}: ${side(value.color)}'s passed pawn advances from ${value.from} to ${value.to}.`;
    }
  }),
  "inspector.open_file_occupancy@1": factRenderer(s.obj({ san: s.san, subject: placed, file: s.file, open: s.bool, color: s.nullable(s.color) }), (value) =>
    `After ${value.san}, ${placedPhrase(value.subject)} stands on the ${value.file}-file, which ${value.open ? "has no pawns" : `has no ${value.color === null ? "" : `${side(value.color)} `}pawn`}.`),
  "inspector.captured_zone_defender@1": factRenderer(s.obj({ san: s.san, captured: placed, king: s.color, zone: s.arr(s.square, { min: 1 }) }), (value) =>
    `${value.san} removes ${placedPhrase(value.captured)}, which defended ${side(value.king)}'s king zone on ${listPhrase(value.zone)}.`),
  "inspector.role_asymmetry@1": factRenderer(s.obj({ san: s.san, roles: s.arr(NON_KING_ROLES, { min: 1 }), before: s.nat, after: s.nat, squares: nonemptySquareSet }), (value) =>
    `After ${value.san}, the sides' counts of ${listPhrase(value.roles.map((role) => PLURAL_ROLES[role]))} changed; the total difference by role went from ${value.before} to ${value.after}.`),
  "inspector.role_signature@1": factRenderer(s.obj({ colors: s.arr(s.obj({ color: s.color, pawn: s.nat, knight: s.nat, bishop: s.nat, rook: s.nat, queen: s.nat }), { min: 2, max: 2 }), difference: s.nat }), (value) =>
    `${value.colors.map((entry) => `${side(entry.color)}: ${listPhrase((["pawn", "knight", "bishop", "rook", "queen"] as const).map((role) => roleCount(entry[role], role)))}`).join(". ")}. Total difference by role: ${value.difference}.`),
  "inspector.capture_class@1": factRenderer(s.obj({ san: s.san, square: s.square, color: s.color, units: s.int }), (value) =>
    `Under the declared exchange convention, the captures on ${value.square} that begin with ${value.san} end ${value.units === 0 ? "level in material" : `${plural(Math.abs(value.units), "material unit")} ${value.units > 0 ? "up" : "down"} for ${side(value.color)}`}.`),
  "inspector.trade_completed@1": factRenderer(s.obj({ first: s.san, second: s.san, square: s.square }), (value) =>
    `A trade on ${value.square}: ${value.first} and ${value.second}.`),
  "inspector.move_quality_grade@1": factRenderer(s.obj({ klass: s.lit("inaccuracy", "mistake", "blunder"), arm: s.lit("eval_delta", "mate_lost", "mate_allowed"), lane: s.lit("recorded", "live"), before: gradeScore, after: gradeScore, dropTenths: s.nat, threshold: s.nullable(s.nat) }), (value) =>
    `${capital(value.klass)} under the declared grade convention: the ${value.lane} engine evaluation went from ${gradeScoreText(value.before)} to ${gradeScoreText(value.after)} across this move, a drop of ${tenths(value.dropTenths)} win-points${value.arm === "eval_delta" ? ` against a threshold of ${value.threshold ?? 0}` : value.arm === "mate_lost" ? " in the lost-mate tier" : " in the allowed-mate tier"}.`),
  // The reduced predecessor stays readable on old wire receipts. Current Nudge construction
  // uses the complete registered operand and the one grade renderer, not a second mate table.
  "grade.move_quality@2": factRenderer(completeGrade, renderMoveQualityGrade),
  "play.move_quality_summary@1": factRenderer(completeGrade, renderMoveQualityGradeSummary),
  "inspector.avoidance@1": factRenderer(s.obj({ family: s.lit(...AVOIDANCE_FAMILIES), sign: s.lit("gained", "lost", "preserved", "state"), alternatives: s.nat, withFamily: s.nat }), (value) =>
    `Of the ${plural(value.alternatives, "other legal move")}, ${value.withFamily} would have ${value.family === "pawn_islands" ? PAWN_ISLAND_SIGNS[value.sign] : `${AVOIDANCE_SIGNS[value.sign]} ${AVOIDANCE_LABELS[value.family]}`}; the move played did not.`),
  "inspector.fork_survives@1": factRenderer(s.obj({ attacker: placed, targets: s.arr(placed, { min: 2 }), replies: s.nat, answering: s.nat }), (value) =>
    `${capital(placedPhrase(value.attacker))} attacks ${placedList(value.targets)}; ${value.answering} of the ${plural(value.replies, "legal reply", "legal replies")} answer the double attack under the declared fork convention.`),
  // --- recorded windows (sequences)
  "inspector.contact_timing@1": factRenderer(s.obj({ kind: SEQUENCE_CONTACT_KINDS, color: s.color, from: s.square, square: s.square, contacted: placed }), (value) =>
    `${side(value.color)}'s pawn from ${value.from} made contact on ${value.square} with ${placedPhrase(value.contacted)}; ${value.kind === "created_survived_reply" ? "the contact survived the reply" : `${side(value.color)} resolved it on the next move`}.`),
  "inspector.harassment@1": factRenderer(s.obj({ pawn: placed, minorFrom: s.square, minor: placed, screen: placed, target: placed }), (value) =>
    `${capital(placedPhrase(value.pawn))} attacked the piece on ${value.minorFrom}; after it moved to ${value.minor.square}, ${placedPhrase(value.minor)} still lines up with ${placedPhrase(value.screen)} and ${placedPhrase(value.target)}.`),
  "inspector.defender_consequence@1": factRenderer(s.obj({ defender: placed, relocatedTo: s.nullable(s.square), target: placed, capture: s.san, capturedFirst: s.bool }), (value) =>
    `${capital(placedPhrase(value.defender))} ${value.capturedFirst ? "was captured" : value.relocatedTo === null ? "stopped defending" : `moved to ${value.relocatedTo}`}, and ${placedPhrase(value.target)}, which it defended, was then captured (${value.capture}).`),
  "inspector.deflection@1": factRenderer(s.obj({ bait: s.san, defender: placed, to: s.square, target: placed, capture: s.san }), (value) =>
    `${value.bait} drew ${placedPhrase(value.defender)} to ${value.to}, away from defending ${placedPhrase(value.target)}, which was then captured (${value.capture}).`),
  "inspector.attraction@1": factRenderer(s.obj({ bait: s.san, piece: placed, to: s.square, consequence: s.lit("check", "capture"), move: s.san }), (value) =>
    `${value.bait} drew ${placedPhrase(value.piece)} to ${value.to}; then ${value.move} ${value.consequence === "check" ? "gave check" : "captured"}.`),
  "inspector.interference@1": factRenderer(s.obj({ move: s.san, square: s.square, slider: placed, target: placed, capture: s.san }), (value) =>
    `${value.move} put a piece on ${value.square}, between ${placedPhrase(value.slider)} and ${placedPhrase(value.target)}, which was then captured (${value.capture}).`),
  "inspector.line_clearance@1": factRenderer(s.obj({ blocker: placed, slider: placed, target: placed, capture: s.san }), (value) =>
    `${capital(placedPhrase(value.blocker))} left the line from ${placedPhrase(value.slider)} to ${placedPhrase(value.target)}, which was then captured (${value.capture}).`),
  "inspector.square_clearance@1": factRenderer(s.obj({ vacating: placed, slider: placed, move: s.san }), (value) =>
    `${capital(placedPhrase(value.vacating))} left ${value.vacating.square}; later ${placedPhrase(value.slider)} used that square (${value.move}).`),
  "inspector.zwischenzug@1": factRenderer(s.obj({ expected: s.arr(s.san, { min: 1 }), check: s.san, reply: s.san, recapture: s.san, recaptureSquare: s.square }), (value) =>
    `Instead of recapturing at once (${listPhrase(value.expected)}), ${value.check} gave check; after ${value.reply} the recapture ${value.recapture} was still available.`),
  "inspector.overload@1": factRenderer(s.obj({ first: s.san, recapture: s.san, second: s.san, target: placed, defenderRecaptureSquare: s.square }), (value) =>
    `${value.first} was answered by the recapture ${value.recapture}, and ${placedPhrase(value.target)}, which the recapturing piece also defended, was then captured (${value.second}).`),
  // --- readings and derived facts (Full Inspector)
  "inspector.discovered_executed@1": factRenderer(s.obj({ san: s.san, screen: placed, slider: placed, target: placed, check: s.bool }), (value) =>
    `${value.san} moves ${placedPhrase(value.screen)} off the line, so ${placedPhrase(value.slider)} now ${value.check ? "gives check to" : "attacks"} ${placedPhrase(value.target)}.`),
  "inspector.defender_removed@1": factRenderer(s.obj({ move: longMove, defender: placed, target: placed }), (value) =>
    `The move ${longPhrase(value.move)} captured ${placedPhrase(value.defender)}, which defended ${placedPhrase(value.target)}.`),
  "inspector.duty_relocated@1": factRenderer(s.obj({ move: longMove, defender: pieceSchema, target: placed }), (value) =>
    `${side(value.defender.color)}'s ${value.defender.role} moved ${longPhrase(value.move)} and no longer defends ${placedPhrase(value.target)}.`),
  "inspector.overload_conflict@1": factRenderer(s.obj({ san: s.san, defender: placed, captured: placed, retained: s.arr(placed, { min: 1 }), recaptures: s.arr(s.san, { min: 1 }) }), (value) =>
    `After ${value.san}, ${placedPhrase(value.defender)} is the only defender of ${placedPhrase(value.captured)} and ${placedList(value.retained)}; recapturing (${listPhrase(value.recaptures)}) leaves ${placedList(value.retained)} capturable under the declared exchange convention.`),
  "inspector.reply_breadth@1": factRenderer(s.obj({ move: longMove, count: s.nat, check: s.bool }), (value) =>
    `After the move ${longPhrase(value.move)}, the other side has ${plural(value.count, "legal reply", "legal replies")}${value.check ? " while in check" : ""}.`),
  "inspector.forced_mate@1": factRenderer(s.obj({ move: s.union("kind", { san: s.obj({ kind: s.lit("san"), san: s.san }), squares: s.obj({ kind: s.lit("squares"), move: longMove }) }), attacker: s.color, horizon: s.nat, status: s.lit("proved", "refuted", "budget_exhausted"), replies: s.nat }), (value) => {
    const move = "san" in value.move ? value.move.san : `the move ${longPhrase(value.move.move)}`;
    const status = value.status === "proved" ? `${side(value.attacker)} forces mate within ${plural(value.horizon, "move")}` : value.status === "refuted" ? `${side(value.attacker)} has no forced mate within ${plural(value.horizon, "move")}` : "the search stopped at its node limit without a result";
    return `Under the declared mate-proof search, after ${move} ${status} (${plural(value.replies, "reply", "replies")} examined at the root).`;
  }),
  "inspector.king_zone@1": factRenderer(s.obj({ kings: s.arr(s.obj({ color: s.color, king: s.square, attackers: s.arr(placed), defenders: s.nat, shelter: s.nat }), { min: 1 }) }), (value) =>
    value.kings.map((king) => `${side(king.color)}'s king on ${king.king}: ${king.attackers.length === 0 ? "no attacker in its zone" : `its zone is attacked by ${placedList(king.attackers)}`}, ${plural(king.defenders, "defender")} and ${plural(king.shelter, "shelter pawn")} under the declared king-zone convention.`).join(" ")),
  "inspector.piece_destinations@1": factRenderer(s.obj({ colors: s.arr(s.obj({ color: s.color, pieces: s.nat, legal: s.nat, safe: s.nat }), { min: 1 }) }), (value) =>
    value.colors.map((entry) => `${side(entry.color)}: ${plural(entry.legal, "legal destination")} over ${plural(entry.pieces, "piece")}, ${entry.safe} of them locally non-losing under the declared convention.`).join(" ")),
  "inspector.piece_destinations_event@1": factRenderer(s.obj({ san: s.san, subject: placed, legalGained: SQUARES, legalLost: SQUARES, safeGained: SQUARES, safeLost: SQUARES }), (value) =>
    `After ${value.san}, legal destinations of ${placedPhrase(value.subject)} gained: ${squaresOrNone(value.legalGained)}; lost: ${squaresOrNone(value.legalLost)}. Locally non-losing ones gained: ${squaresOrNone(value.safeGained)}; lost: ${squaresOrNone(value.safeLost)}.`),
  "inspector.square_control_event@1": factRenderer(s.obj({ san: s.san, controller: placed, target: s.square, sign: s.lit("gained", "lost"), legal: s.bool }), (value) =>
    `After ${value.san}, ${placedPhrase(value.controller)} ${value.sign === "gained" ? "now controls" : "no longer controls"} ${value.target}${value.legal ? " with a legal move" : ""}.`),
  "inspector.candidate_majority@1": factRenderer(s.obj({ candidates: s.arr(s.obj({ pawn: placed, supports: s.nat, blockers: s.nat }), { min: 1 }) }), (value) =>
    value.candidates.map((entry) => `${capital(placedPhrase(entry.pawn))} is a candidate passed pawn under the declared pawn-structure convention (${plural(entry.supports, "supporting pawn")}, ${plural(entry.blockers, "opposing pawn")} in its way).`).join(" ")),
  "inspector.development@1": factRenderer(s.obj({ white: s.arr(placed), black: s.arr(placed) }), (value) =>
    `On their home squares under the declared development convention — White: ${value.white.length === 0 ? "none" : listPhrase(value.white.map((entry) => `${entry.piece.role} on ${entry.square}`))}; Black: ${value.black.length === 0 ? "none" : listPhrase(value.black.map((entry) => `${entry.piece.role} on ${entry.square}`))}.`),
  "inspector.promotion_pressure@1": factRenderer(s.obj({ pawns: s.arr(s.obj({ pawn: placed, promotion: s.square, distance: s.nat, blockers: s.nat }), { min: 1 }) }), (value) =>
    value.pawns.map((entry) => `${capital(placedPhrase(entry.pawn))} is ${plural(entry.distance, "step")} from promoting on ${entry.promotion}${entry.blockers === 0 ? "" : `, with ${plural(entry.blockers, "piece")} in its path`}.`).join(" ")),
  "inspector.discovered_latency@1": factRenderer(s.obj({ screens: s.arr(s.obj({ screen: placed, slider: placed, target: placed, check: s.bool }), { min: 1 }) }), (value) =>
    value.screens.map((entry) => `If ${placedPhrase(entry.screen)} moves, ${placedPhrase(entry.slider)} ${entry.check ? "gives check to" : "attacks"} ${placedPhrase(entry.target)}.`).join(" ")),
  "inspector.duty_set@1": factRenderer(s.obj({ duties: s.nat, defenders: s.nat }), (value) =>
    `${plural(value.duties, "defensive duty", "defensive duties")} held by ${plural(value.defenders, "piece")} under the declared defence-duty convention.`),
  "inspector.promotion_pressure_none@1": factRenderer(s.obj({ pawns: s.nat }), (value) => `${plural(value.pawns, "pawn")} under promotion pressure.`),
  "inspector.story_rank@1": factRenderer(s.obj({ moments: s.nat }), (value) => `The recorded story orders ${plural(value.moments, "moment")} for review.`),
  "inspector.pivotal@1": factRenderer(pivotalOperands, (value) => {
    switch (value.kind) {
      case "phase_change": return `The game phase changed from ${value.from} to ${value.to} under the declared game-phase convention.`;
      case "human_divergence": return `${value.model}${value.band === null ? "" : ` at ${value.band} rating`} split its top candidates here: ${value.shares.map((share) => `${Math.round(share * 100)}%`).join(" / ")}.`;
      case "option_collapse": return value.count === 1 ? `${side(value.color)} had one legal move here.` : `${side(value.color)} had ${plural(value.count, "legal move")} here under the declared legal-continuation convention.`;
      case "irreversibility":
        if (value.subkind === "castled") return `${side(value.color)} castled.`;
        if (value.subkind === "last_of_role") return value.queensOff ? "The queens have left the board." : `${side(value.color)} has no ${PLURAL_ROLES[value.role]} left.`;
        return `${side(value.color)} created or resolved a pawn contact.`;
    }
  }),
  "inspector.opening_reached@1": factRenderer(s.obj({ eco: s.str, name: s.str }), (value) => `The deepest opening in the cited catalogue reached on this line: ${value.eco} ${value.name}.`),
  "inspector.catalogue_membership@1": factRenderer(s.obj({ ply: s.nat, endpoints: s.nat }), (value) =>
    `At ply ${value.ply} this position lies on the path to ${plural(value.endpoints, "named opening")} in the cited catalogue.`),
  // --- provider and recorded sources
  "inspector.engine_wdl@1": factRenderer(s.obj({ win: s.nat, draw: s.nat, loss: s.nat, engine: s.nullable(s.str) }), (value) =>
    `Engine win/draw/loss reading: ${value.win} / ${value.draw} / ${value.loss} (${value.engine ?? "stored engine reading"}; the perspective is not retained).`),
  "inspector.engine_line@1": factRenderer(s.obj({ moves: s.arr(longMove, { min: 1 }), engine: s.nullable(s.str), depth: s.nullable(s.nat) }), (value) =>
    `Engine line: ${value.moves.map(longPhrase).join(", ")} (${value.engine ?? "stored engine reading"}${value.depth === null ? "" : `, depth ${value.depth}`}).`),
  "inspector.tablebase@1": factRenderer(s.obj({ category: s.lit(...(Object.keys(TABLEBASE_CATEGORIES) as TablebaseCategory[])), perspective: s.lit("side_to_move", "white"), dtz: s.nullable(s.int), dtm: s.nullable(s.int), pieces: s.nullable(s.nat) }), (value) =>
    `Syzygy tablebase: ${TABLEBASE_CATEGORIES[value.category]} ${value.perspective === "white" ? "from White's side" : "for the side to move"}${value.dtz === null ? "" : `, distance to zeroing ${Math.abs(value.dtz)}`}${value.dtm === null ? "" : `, distance to mate ${Math.abs(value.dtm)}`}${value.pieces === null ? "" : ` (${value.pieces} pieces)`}.`),
  "inspector.model_wdl@1": factRenderer(s.obj({ model: s.str, band: s.nullable(s.nat), rows: s.arr(s.obj({ move: longMove, win: s.nat, draw: s.nat, loss: s.nat }), { min: 1 }) }), (value) =>
    `${value.model}${value.band === null ? "" : ` at ${value.band} rating`}, win/draw/loss by candidate: ${value.rows.map((row) => `${longPhrase(row.move)} ${row.win} / ${row.draw} / ${row.loss}`).join("; ")}.`),
});

/** Registered magnitude quantities keyed by exact source projection (`derived.compare.eval_delta@1` is the play group's). */
export const INSPECTOR_MAGNITUDE_QUANTITIES: Readonly<Record<string, { readonly label: string }>> = Object.freeze({
  "live.stockfish.eval@1": { label: "Engine evaluation" },
  "recorded.engine.eval@1": { label: "Recorded engine evaluation" },
});

// ---------------------------------------------------------------------------------------------
// Mechanical transforms of retained operands
// ---------------------------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any -- payloads are the manifest's typed operands; every read is re-parsed by a strict renderer schema. */
type Payload = any;
const payloadOf = (evidence: DeclaredEvidence<unknown>): Payload => evidence.payload;

const piece = (value: { readonly color: Color; readonly role: Role }): SchemaPiece => ({ color: value.color, role: value.role });
const at = (value: { readonly square: SquareName; readonly piece: { readonly color: Color; readonly role: Role } }): Placed => ({ piece: piece(value.piece), square: value.square });
const atOccupant = (value: { readonly square: SquareName; readonly occupant: { readonly color: Color; readonly role: Role } }): Placed => ({ piece: piece(value.occupant), square: value.square });

function position(fen: string): Chess {
  const setup = parseFen(fen);
  if (setup.isErr) throw new TypeError("retained FEN does not parse");
  const chess = Chess.fromSetup(setup.value);
  if (chess.isErr) throw new TypeError("retained FEN is not a legal position");
  return chess.value;
}
/** SAN of one retained move from its retained FEN (mechanical, never supplied). */
function sanOf(fen: string, uci: string): string {
  const board = position(fen);
  const move = parseUci(uci);
  if (move === undefined) throw new TypeError("retained move does not parse");
  const san = makeSan(board, normalizeMove(board, move));
  if (san === "--") throw new TypeError("retained move is not legal in its retained position");
  return san;
}
const moveOf = (uci: string): LongMove => {
  const promotion = ({ q: "queen", r: "rook", b: "bishop", n: "knight" } as const)[uci[4] as "q" | "r" | "b" | "n"] ?? null;
  return { from: uci.slice(0, 2) as SquareName, to: uci.slice(2, 4) as SquareName, promotion };
};
const edgeSan = (payload: Payload): string => sanOf(payload.before_fen ?? payload.beforeFen, payload.move_uci ?? payload.moveUci);
const edgeMove = (payload: Payload): { readonly fen: string; readonly uci: string } => ({ fen: payload.before_fen ?? payload.beforeFen, uci: payload.move_uci ?? payload.moveUci });
const anchorMove = (anchor: { readonly beforeFen: string; readonly moveUci: string }): { readonly fen: string; readonly uci: string } => ({ fen: anchor.beforeFen, uci: anchor.moveUci });
const exchangeSan = (exchange: { readonly beforeFen: string; readonly captureUci: string }): string => sanOf(exchange.beforeFen, exchange.captureUci);

// ---------------------------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------------------------

const V = (id: string, version = 1): VersionedEvidenceId => Object.freeze({ id, version });
const NUDGE = V("module.postcommit_nudge", 2);
const MAP = V("module.review_map", 2);

type Construct = (evidence: DeclaredEvidence<unknown>) => ComponentValue | readonly ComponentValue[];
type RendererId = Parameters<PresentationKit["fact"]>[0];
type ConventionId = Parameters<PresentationKit["fact"]>[2];
type Assertion = AdapterSpec["assertions"][number];
interface Family {
  readonly component: AdapterSpec["component"];
  readonly composition?: AdapterSpec["composition"];
  readonly sourceOperands: readonly string[];
  readonly assertions: readonly Assertion[];
  readonly construct: Construct;
  readonly validateWireComponent?: AdapterSpec["validateWireComponent"];
}

const LP: readonly EvidenceForm[] = ["list", "panel"];
const PS: readonly EvidenceForm[] = ["panel", "sentence"];
const PST: readonly EvidenceForm[] = ["panel", "sentence", "timeline_marker"];
const LPS: readonly EvidenceForm[] = ["list", "panel", "sentence"];
const P: readonly EvidenceForm[] = ["panel"];
const BOARD5: readonly EvidenceForm[] = ["arrows", "list", "lit_squares", "panel", "piece_halo"];
const BOARD4: readonly EvidenceForm[] = ["arrows", "list", "lit_squares", "panel"];
const LLP: readonly EvidenceForm[] = ["list", "lit_squares", "panel"];
const LLPH: readonly EvidenceForm[] = ["list", "lit_squares", "panel", "piece_halo"];
const LPH: readonly EvidenceForm[] = ["list", "panel", "piece_halo"];

function buildInspectorAdapterSpecs(kit: PresentationKit): { readonly current: readonly AdapterSpec[]; readonly sources: readonly AdapterSpec[] } {
  const fact = (rendererId: RendererId, convention: ConventionId, operands: unknown, binding: "recorded_run" | "declared_convention" = "declared_convention") =>
    kit.fact(rendererId, binding, convention, operands as never);
  const statement = (rendererId: RendererId, convention: ConventionId, operands: unknown, binding: "recorded_run" | "declared_convention" = "declared_convention"): ComponentValue =>
    ({ id: "fact_statement", operand: fact(rendererId, convention, operands, binding) });
  const squareSet = (evidence: DeclaredEvidence<unknown>, squares: readonly SquareName[], caption: ReturnType<typeof fact>, brush: "blue" | "red" = "blue"): ComponentValue => {
    if (squares.length === 0) throw new TypeError(`${evidence.projection.id} retains no square to light; an empty reading is an abstention upstream`);
    return kit.squareSet(evidence, squares, brush, caption);
  };
  const line = (evidence: DeclaredEvidence<unknown>, moves: readonly { readonly fen: string; readonly uci: string }[]): ComponentValue => ({
    id: "move_path",
    operand: { ...recordedMovePathPositions(moves), answerDistance: "fact", origin: "recorded", convention: kit.declared(evidence, "recorded-run@1") },
  });
  const relation = (evidence: DeclaredEvidence<unknown>, nodes: RelationOverlayOperand["nodes"], edges: RelationOverlayOperand["edges"], answerDistance: RelationOverlayOperand["answerDistance"], convention?: ConventionReceipt): ComponentValue => {
    const unique = new Map<string, RelationOverlayOperand["nodes"][number]>();
    for (const node of nodes) if (!unique.has(node.square)) unique.set(node.square, node);
    const keys = new Set<string>();
    const kept = edges.filter((edge) => { const key = `${edge.from}${edge.to}${edge.relation}${edge.sign}`; if (edge.from === edge.to || keys.has(key)) return false; keys.add(key); return true; });
    if (kept.length === 0) throw new TypeError(`${evidence.projection.id} retains no relation edge; an empty reading is an abstention upstream`);
    return { id: "relation_overlay", operand: { nodes: [...unique.values()], edges: kept, owner: { factRef: kit.factRef(evidence) }, answerDistance, ...(convention === undefined ? {} : { convention }) } };
  };
  const node = (value: Placed, emphasis: RelationOverlayOperand["nodes"][number]["emphasis"]): RelationOverlayOperand["nodes"][number] => ({ square: value.square, role: value.piece.role, color: value.piece.color, emphasis });

  // Compositions: member forms union to exactly the binding forms.
  const boardEvent = (forms: readonly EvidenceForm[]): AdapterSpec["composition"] => ({ id: forms.includes("piece_halo") ? "event_board_line" : "event_squares_line", members: [{ component: "square_set", forms: forms.filter((form) => form !== "arrows") }, { component: "move_path", forms: ["arrows"] }] });
  const relationWithStatement = (forms: readonly EvidenceForm[]): AdapterSpec["composition"] => ({ id: forms.includes("piece_halo") ? "relation_board_statement" : "relation_squares_statement", members: [{ component: "relation_overlay", forms: forms.filter((form) => form !== "list") }, { component: "fact_statement", forms: ["list"] }] });
  const POPULATION: AdapterSpec["composition"] = { id: "population_distribution", members: [{ component: "distribution", forms: LP }, { component: "outcome_split", forms: LP }, { component: "count_with_denominator", forms: LP }] };

  /** A one-component family whose component serves every binding form. */
  const single = (component: AdapterSpec["component"], sourceOperands: readonly string[], assertions: readonly Assertion[], construct: Construct): Family => ({ component, sourceOperands, assertions, construct });
  /** A literal declaration owns both construction and received validation. A source reader can
   * supply operands, never select another renderer or convention after reading the payload. */
  const singleFact = <R extends RendererId>(renderer: R, convention: ConventionId,
    sourceOperands: readonly string[], assertions: readonly Assertion[],
    read: (evidence: DeclaredEvidence<unknown>) => FactOperandsByRenderer[R],
    binding: "recorded_run" | "declared_convention" = "declared_convention") => {
    const bound = bindFactStatement(kit.fact, renderer, binding, convention);
    return { ...single("fact_statement", sourceOperands, assertions, evidence => bound.statement(read(evidence))),
      validateWireComponent: bound.validateWireComponent };
  };
  /** A square-set + recorded-move family (the board forms of a one-edge event or recorded window). */
  const squaresLine = <R extends RendererId>(renderer: R, convention: ConventionId, sourceOperands: readonly string[], build: (evidence: DeclaredEvidence<unknown>) => { readonly operands: FactOperandsByRenderer[R]; readonly moves: readonly { readonly fen: string; readonly uci: string }[] }, binding: "recorded_run" | "declared_convention",
    squaresFromOperands: (operands: FactOperandsByRenderer[R]) => readonly SquareName[]) => {
    const bound = bindFactStatement(kit.fact, renderer, binding, convention);
    return (forms: readonly EvidenceForm[], captionOnly = false): Family => ({
      component: "square_set", ...(captionOnly ? {} : { composition: boardEvent(forms) }), sourceOperands, assertions: ["mechanical_transform", "retained_convention"],
      construct: evidence => {
        const built = build(evidence);
        const caption = squareSet(evidence, squaresFromOperands(built.operands), bound.operand(built.operands));
        // Only the exact eight current Nudge bindings can request this registered complete form.
        // Never create a path and crop it after presentation/budget fitting.
        return captionOnly ? caption : [caption, line(evidence, built.moves)];
      },
      validateWireComponent: (component, evidence) => {
        bound.validateWireComponent(component);
        if (component.id === "square_set") {
          if (component.operand.brush !== "blue" || component.operand.owner.factRef !== evidence.evidenceDigest) {
            throw new TypeError("Board geometry brush or owner crosses its registered source");
          }
          // The bound tuple has already established this exact renderer before this generic read.
          const expected = new Set(squaresFromOperands(component.operand.caption.operands as FactOperandsByRenderer[R]));
          if (component.operand.squares.length !== expected.size || component.operand.squares.some(square => !expected.has(square))) {
            throw new TypeError("Board geometry crosses its registered caption witnesses");
          }
        } else if (component.id === "move_path") {
          const value = component.operand, receipt = value.convention;
          if (value.origin !== "recorded" || value.answerDistance !== "fact" || receipt === undefined
            || receipt.perspective !== "not_applicable" || receipt.basis.kind !== "declared" || receipt.basis.convention !== "recorded-run@1"
            || receipt.sourceEvidenceDigest !== evidence.evidenceDigest
            || receipt.sourceProjection.id !== evidence.projection.id || receipt.sourceProjection.version !== evidence.projection.version
            || receipt.producer.id !== evidence.producer.id || receipt.producer.version !== evidence.producer.version) {
            throw new TypeError("Recorded path crosses its registered origin, answer distance or convention");
          }
        }
      },
    });
  };
  /** A relation + list-statement family. */
  const relationList = (sourceOperands: readonly string[], build: (evidence: DeclaredEvidence<unknown>) => { readonly relation: ComponentValue; readonly statement: ComponentValue }) =>
    (forms: readonly EvidenceForm[]): Family => ({
      component: "relation_overlay", composition: relationWithStatement(forms), sourceOperands, assertions: ["mechanical_transform"],
      construct: (evidence) => { const built = build(evidence); return [built.relation, built.statement]; },
    });

  // --- one-edge events rendered as a fact statement (list/panel)
  const structuralEvent = (family: (typeof STRUCTURAL_FAMILIES)[number]): Family => {
    // This event partition is deliberately not Sight's reading partition.
    const convention = family === "backward_pawn" || family === "king_opposition" ? "pawn-structure@1" : "board-rules@1";
    const declared = singleFact("inspector.structural_event@1", convention,
      ["before_fen", "move_uci", "family", "before", "after"], ["mechanical_transform"], evidence => {
        const event = payloadOf(evidence);
        if (event.family !== family || [event.before, event.after].some(value => value != null && value.kind !== family)) {
          throw new TypeError("Structural event crosses its registered family");
        }
        const observed = event.after ?? event.before;
        if (observed === null || observed === undefined) throw new TypeError("a structural event retains a before or after observation");
        const { kind, squares, color, file, form, zone } = observed;
        const observation = { kind, squares: [...squares], ...(color === undefined ? {} : { color }), ...(file === undefined ? {} : { file }), ...(form === undefined ? {} : { form }), ...(zone === undefined ? {} : { zone }) };
        const change = event.before === null ? "appeared" : event.after === null ? "disappeared" : "held";
        return { san: edgeSan(event), change, observation };
      });
    return { ...declared, validateWireComponent: component => {
      declared.validateWireComponent(component);
      if (component.id === "fact_statement" && component.operand.rendererId === "inspector.structural_event@1"
        && component.operand.operands.observation.kind !== family) throw new TypeError("Structural statement crosses its registered family");
    } };
  };
  const pawnIslandsEvent = singleFact("inspector.pawn_islands_event@1", "board-rules@1", ["before_fen", "move_uci", "color", "before", "after"], ["copied_byte_equal", "mechanical_transform"], (evidence) => {
    const event = payloadOf(evidence);
    return { san: edgeSan(event), color: event.color, before: event.before, after: event.after };
  });
  const transition = <R extends RendererId>(renderer: R, build: (event: Payload, san: string) => FactOperandsByRenderer[R], sourceOperands: readonly string[]) =>
    singleFact(renderer, "board-rules@1", ["before_fen", "move_uci", ...sourceOperands], ["mechanical_transform"], (evidence) => {
      const event = payloadOf(evidence);
      return build(event, edgeSan(event));
    });
  const TRANSITIONS: Readonly<Record<string, Family>> = {
    capture: transition("inspector.capture@1", (event, san) => ({ san, mover: piece(event.mover), from: event.from, to: event.to, captured: piece(event.captured), enPassant: event.enPassant }), ["mover", "from", "to", "captured", "enPassant"]),
    castled: transition("inspector.castled@1", (event, san) => ({ san, color: event.mover.color, king: event.detail.resultingKingSquare }), ["mover", "detail"]),
    checkmate: transition("inspector.checkmate@1", (event, san) => ({ san, mated: event.detail.matedSide }), ["detail"]),
    developed: transition("inspector.developed@1", (event, san) => ({ san, piece: piece(event.mover), from: event.from, to: event.to }), ["mover", "from", "to"]),
    last_of_role: transition("inspector.last_of_role@1", (event, san) => ({ san, color: event.detail.capturedColor, role: event.detail.capturedRole }), ["detail"]),
    pawn_contact: transition("inspector.pawn_contact@1", (event, san) => ({ san, color: event.mover.color, square: event.to, enemy: [...event.detail.enemyPawnSquares] }), ["mover", "to", "detail"]),
    promotion: transition("inspector.promotion@1", (event, san) => ({ san, color: event.mover.color, square: event.to, role: event.detail.promotionRole }), ["mover", "to", "detail"]),
    defended_duty: transition("inspector.defended_duty@1", (event, san) => ({ san, piece: piece(event.subject), square: event.subject.piece, before: [...event.targets_before], after: [...event.targets_after] }), ["subject", "targets_before", "targets_after"]),
    occupied_attack: transition("inspector.occupied_attack@1", (event, san) => ({ san, attacker: event.subject.color, occupant: piece(event.subject.occupant), square: event.subject.target, before: [...event.targets_before], after: [...event.targets_after] }), ["subject", "targets_before", "targets_after"]),
    occupied_defence: transition("inspector.occupied_defence@1", (event, san) => ({ san, defender: event.subject.color, occupant: piece(event.subject.occupant), square: event.subject.target, before: [...event.targets_before], after: [...event.targets_after] }), ["subject", "targets_before", "targets_after"]),
    piece_escape: transition("inspector.piece_escape@1", (event, san) => ({ san, piece: piece(event.subject), square: event.subject.piece, before: [...event.targets_before], after: [...event.targets_after] }), ["subject", "targets_before", "targets_after"]),
    slider_ray: transition("inspector.slider_ray@1", (event, san) => ({ san, piece: piece(event.subject), square: event.subject.slider, endpoint: event.subject.endpoint, before: [...event.targets_before], after: [...event.targets_after] }), ["subject", "targets_before", "targets_after"]),
  };
  const checkEvent = singleFact("inspector.check@1", "board-rules@1", ["triggeringMove", "checkingPieces", "checkedKing"], ["mechanical_transform"], (evidence) => {
    const event = payloadOf(evidence);
    return { move: moveOf(event.triggeringMove), checkers: event.checkingPieces.map(at), king: at(event.checkedKing) };
  });
  const doubleAttack = singleFact("inspector.double_attack@1", "threat-convention@1", ["beforeFen", "moveUci", "mover", "targets"], ["mechanical_transform"], (evidence) => {
    const event = payloadOf(evidence);
    return { san: edgeSan(event), attacker: { piece: piece(event.mover.piece), square: event.mover.after }, targets: event.targets.map(atOccupant) };
  });
  const looseState = (state: Payload): "en_prise" | "loose" | "under_defended" | "covered" => (state.enPrise ? "en_prise" : state.loose ? "loose" : state.underDefended ? "under_defended" : "covered");
  const looseEvent = singleFact("inspector.loose_event@1", "threat-convention@1", ["beforeFen", "moveUci", "mover", "before", "after"], ["mechanical_transform"], (evidence) => {
    const event = payloadOf(evidence);
    return { san: edgeSan(event), subject: atOccupant(event.after.piece), before: looseState(event.before), after: looseState(event.after), capturers: event.after.legalCapturers.map((capturer: Payload) => capturer.square) };
  });
  const rightsLost = singleFact("inspector.rights_lost@1", "board-rules@1", ["beforeFen", "moveUci", "color", "wing", "cause"], ["copied_byte_equal", "mechanical_transform"], (evidence) => {
    const event = payloadOf(evidence);
    return { san: edgeSan(event), color: event.color, wing: event.wing, cause: event.cause };
  });
  const captureClass = singleFact("inspector.capture_class@1", "threat-convention@1", ["before_fen", "move_uci", "capture", "exchange"], ["mechanical_transform"], (evidence) => {
    const event = payloadOf(evidence);
    return { san: edgeSan(event), square: event.capture.to, color: event.exchange.capturer.color, units: event.exchange.resultUnits };
  });
  const tradeCompleted = singleFact("inspector.trade_completed@1", "board-rules@1", ["startFen", "firstMoveUci", "boundaryFen", "secondMoveUci", "landingSquare"], ["mechanical_transform"], (evidence) => {
    const event = payloadOf(evidence);
    return { first: sanOf(event.startFen, event.firstMoveUci), second: sanOf(event.boundaryFen, event.secondMoveUci), square: event.landingSquare };
  });
  const forkSurvives = singleFact("inspector.fork_survives@1", "threat-convention@1", ["doubleAttack", "replyBreadth", "refutingReplies"], ["mechanical_transform"], (evidence) => {
    const event = payloadOf(evidence);
    return { attacker: { piece: piece(event.doubleAttack.mover.piece), square: event.doubleAttack.mover.after }, targets: event.doubleAttack.targets.map(atOccupant), replies: event.replyBreadth.count, answering: event.refutingReplies.length };
  });
  const avoidance = (family: (typeof AVOIDANCE_FAMILIES)[number]): Family => {
    const sourceProjection = family === "loose_piece" ? "rules.tactic.event.loose_piece" : `rules.structural.event.${family}`;
    const declared = singleFact("inspector.avoidance@1", family === "loose_piece" ? "threat-convention@1" : "pawn-structure@1",
      ["family", "legalAlternatives", "alternativesWithFamily"], ["mechanical_transform"], evidence => {
        const event = payloadOf(evidence);
        if (event.family.projection.id !== sourceProjection || event.family.projection.version !== 1) {
          throw new TypeError("Avoidance source crosses its registered family projection");
        }
        return { family, sign: event.family.sign, alternatives: event.legalAlternatives, withFamily: event.alternativesWithFamily };
      });
    return { ...declared, validateWireComponent: component => {
      declared.validateWireComponent(component);
      if (component.id === "fact_statement" && component.operand.rendererId === "inspector.avoidance@1"
        && component.operand.operands.family !== family) throw new TypeError("Avoidance statement crosses its registered family");
    } };
  };
  const grade = singleFact("play.move_quality_summary@1", "grade-convention@2", ["klass", "arm", "before", "after", "dropWinPercent", "thresholdCrossed", "convention", "engineId", "lane", "bound", "instrument"], ["copied_byte_equal"], payloadOf);

  // --- one-edge events with board forms: square set + the recorded move
  const openFileOccupancy = squaresLine("inspector.open_file_occupancy@1", "pawn-structure@1", ["beforeFen", "moveUci", "piece", "fileClass", "sourceReading"], (evidence) => {
    const event = payloadOf(evidence);
    const subject = at(event.piece.after);
    return { moves: [edgeMove(event)], operands: { san: edgeSan(event), subject, file: event.sourceReading.file, open: event.fileClass === "open_file", color: event.fileClass === "open_file" ? null : event.sourceReading.color ?? null } };
  }, "declared_convention", value => [value.subject.square]);
  const capturedZoneDefender = squaresLine("inspector.captured_zone_defender@1", "piece-geometry@1", ["beforeFen", "moveUci", "capturedSquare", "kingColor", "defender"], (evidence) => {
    const event = payloadOf(evidence);
    return { moves: [edgeMove(event)], operands: { san: edgeSan(event), captured: { piece: piece(event.defender.piece), square: event.capturedSquare }, king: event.kingColor, zone: [...event.defender.zoneSquares] } };
  }, "declared_convention", value => [value.captured.square]);
  const pawnTransition = squaresLine("inspector.pawn_transition@1", "pawn-structure@1", ["beforeFen", "moveUci", "kind", "pawn"], (evidence) => {
    const event = payloadOf(evidence);
    return { moves: [edgeMove(event)], operands: { san: edgeSan(event), kind: event.kind, color: event.pawn.after.piece.color, from: event.pawn.before.square, to: event.pawn.after.square } };
  }, "declared_convention", value => [value.to]);
  const dynamicsPieces = (kind: string, subjects: Payload): Placed[] => {
    switch (kind) {
      case "locked_pair_gained": return [at(subjects.white), at(subjects.black)];
      case "minor_harassed": return [at(subjects.pawn), at(subjects.minor)];
      case "protected_passer_gained": return [at(subjects.pawn), ...subjects.protectedBy.map(at)];
      case "connected_passer_pair_gained": return [at(subjects.first), at(subjects.second)];
      case "candidate_majority_gained": return [at(subjects.pawn)];
      case "candidate_majority_advanced": return [at(subjects.before.pawn), at(subjects.after.pawn)];
      default: throw new TypeError("pawn dynamics kind is outside the registered set");
    }
  };
  const pawnDynamics = squaresLine("inspector.pawn_dynamics@1", "pawn-structure@1", ["beforeFen", "moveUci", "kind", "subjects"], (evidence) => {
    const event = payloadOf(evidence);
    const pieces = dynamicsPieces(event.kind, event.subjects);
    return { moves: [edgeMove(event)], operands: { san: edgeSan(event), kind: event.kind, pieces } };
  }, "declared_convention", value => value.kind === "candidate_majority_advanced" ? [value.pieces[1]!.square] : value.pieces.slice(0, 2).map(entry => entry.square));
  const kingZoneEvent = squaresLine("inspector.king_zone_event@1", "piece-geometry@1", ["beforeFen", "moveUci", "color", "king", "attackers", "defenders", "shelter", "escapes"], (evidence) => {
    const event = payloadOf(evidence);
    const list = (values: readonly Payload[]): Placed[] => values.map(at);
    return {
      moves: [edgeMove(event)],
      operands: { san: edgeSan(event), color: event.color, king: event.king.after, kingFrom: event.king.relocated ? event.king.before : null, attackersGained: list(event.attackers.gained), attackersLost: list(event.attackers.lost), defendersGained: list(event.defenders.gained), defendersLost: list(event.defenders.lost), shelterGained: list(event.shelter.gained), shelterLost: list(event.shelter.lost), escapesGained: [...event.escapes.gained], escapesLost: [...event.escapes.lost] },
    };
  }, "declared_convention", value => [value.king]);
  const roleAsymmetry = squaresLine("inspector.role_asymmetry@1", "board-rules@1", ["beforeFen", "moveUci", "before", "after", "changedRoles", "sourceEvents"], (evidence) => {
    const event = payloadOf(evidence);
    const squares = [...new Set<SquareName>(event.sourceEvents.map((source: Payload) => source.to as SquareName))];
    return { moves: [edgeMove(event)], operands: { san: edgeSan(event), roles: [...event.changedRoles], before: event.before.magnitude, after: event.after.magnitude, squares } };
  }, "declared_convention", value => value.squares);
  const destinationsEvent = squaresLine("inspector.piece_destinations_event@1", "piece-geometry@1", ["beforeFen", "moveUci", "color", "piece", "legalGained", "legalLost", "safeGained", "safeLost"], (evidence) => {
    const event = payloadOf(evidence);
    const subject = { piece: { color: event.color, role: event.piece.after.role }, square: event.piece.after.square };
    return { moves: [edgeMove(event)], operands: { san: edgeSan(event), subject, legalGained: [...event.legalGained], legalLost: [...event.legalLost], safeGained: [...event.safeGained], safeLost: [...event.safeLost] } };
  }, "declared_convention", value => [value.subject.square, ...value.legalGained, ...value.legalLost]);

  // --- one-edge relations
  const squareControlEvent = relationList(["beforeFen", "moveUci", "mode", "sign", "target", "controller"], (evidence) => {
    const event = payloadOf(evidence);
    const controller = at(event.controller);
    return {
      relation: relation(evidence, [node(controller, "source"), { square: event.target, emphasis: "target" }], [{ from: controller.square, to: event.target, relation: "controls", sign: event.sign }], "fact"),
      statement: statement("inspector.square_control_event@1", "piece-geometry@1", { san: edgeSan(event), controller, target: event.target, sign: event.sign, legal: event.mode === "legal" }),
    };
  });
  const defenderRemoved = relationList(["move", "defender", "target"], (evidence) => {
    const event = payloadOf(evidence);
    const defender = at(event.defender), target = at(event.target);
    return {
      relation: relation(evidence, [node(defender, "source"), node(target, "target")], [{ from: defender.square, to: target.square, relation: "defends", sign: "lost" }], "fact"),
      statement: statement("inspector.defender_removed@1", "piece-geometry@1", { move: { from: event.move.from, to: event.move.to, promotion: null }, defender, target }),
    };
  });
  const dutyRelocated = relationList(["move", "defenderBefore", "target"], (evidence) => {
    const event = payloadOf(evidence);
    const defender = at(event.defenderBefore), target = at(event.target);
    return {
      relation: relation(evidence, [node(defender, "source"), node(target, "target")], [{ from: defender.square, to: target.square, relation: "defends", sign: "lost" }], "fact"),
      statement: statement("inspector.duty_relocated@1", "piece-geometry@1", { move: { from: event.move.from, to: event.move.to, promotion: null }, defender: defender.piece, target }),
    };
  });
  const discoveredExecuted = relationList(["beforeFen", "moveUci", "screen", "slider", "target", "discoveredCheck"], (evidence) => {
    const event = payloadOf(evidence);
    const slider = at(event.slider), target = atOccupant(event.target);
    return {
      relation: relation(evidence, [node(slider, "source"), node(target, "target")], [{ from: slider.square, to: target.square, relation: "attacks", sign: "gained" }], "threat", kit.declared(evidence, "threat-convention@1")),
      statement: statement("inspector.discovered_executed@1", "threat-convention@1", { san: edgeSan(event), screen: at(event.screen), slider, target, check: event.discoveredCheck }),
    };
  });

  // --- recorded windows: square set + the recorded line
  const sequence = <R extends RendererId>(renderer: R, sourceOperands: readonly string[], build: (payload: Payload) => { readonly operands: FactOperandsByRenderer[R] },
    squaresFromOperands: (operands: FactOperandsByRenderer[R]) => readonly SquareName[]) =>
    squaresLine(renderer, "recorded-run@1", ["anchors", ...sourceOperands], evidence => {
        const payload = payloadOf(evidence);
        const built = build(payload);
        return { ...built, moves: payload.anchors.map(anchorMove) };
    }, "recorded_run", squaresFromOperands);
  const contactSquares = (value: FactOperandsByRenderer["inspector.contact_timing@1"]): readonly SquareName[] => [value.square, value.contacted.square];
  const contactTiming = sequence("inspector.contact_timing@1", ["kind", "pawn", "contactedPawn"], value => {
    const operands: FactOperandsByRenderer["inspector.contact_timing@1"] = { kind: value.kind, color: value.pawn.color, from: value.pawn.from, square: value.pawn.contactSquare, contacted: at(value.contactedPawn) };
    return { operands };
  }, contactSquares);
  const harassment = sequence("inspector.harassment@1", ["pawn", "minor", "pressure"], (value) => ({ operands: { pawn: at(value.pawn), minorFrom: value.minor.before.square, minor: at(value.minor.after), screen: at(value.pressure.after.screen), target: at(value.pressure.after.target) } }), value => [value.pawn.square, value.minor.square]);
  const defenderConsequence = sequence("inspector.defender_consequence@1", ["kind", "defender", "target", "firstMoveCapturedDefender", "finalCapture"], (value) => ({ operands: { defender: at(value.defender.before), relocatedTo: value.defender.after?.square ?? null, target: at(value.target), capture: exchangeSan(value.finalCapture), capturedFirst: value.firstMoveCapturedDefender } }), value => [value.defender.square, value.target.square]);
  const deflection = sequence("inspector.deflection@1", ["baitMove", "defenderBefore", "defenderAfter", "lostDuty", "targetCapture"], (value) => ({ operands: { bait: sanOf(value.baitMove.beforeFen, value.baitMove.moveUci), defender: at(value.defenderBefore), to: value.defenderAfter.square, target: at(value.lostDuty.target), capture: exchangeSan(value.targetCapture) } }), value => [value.to, value.target.square]);
  const attraction = sequence("inspector.attraction@1", ["baitMove", "heavyPiece", "arrivalSquare", "checkOrCaptureConsequence"], (value) => ({ operands: { bait: sanOf(value.baitMove.beforeFen, value.baitMove.moveUci), piece: at(value.heavyPiece.before), to: value.arrivalSquare, consequence: value.checkOrCaptureConsequence.kind, move: sanOf(value.checkOrCaptureConsequence.move.beforeFen, value.checkOrCaptureConsequence.move.moveUci) } }), value => [value.to]);
  const interference = sequence("inspector.interference@1", ["interposingMove", "slider", "betweenSquare", "target", "targetCapture"], (value) => ({ operands: { move: sanOf(value.interposingMove.beforeFen, value.interposingMove.moveUci), square: value.betweenSquare, slider: at(value.slider), target: at(value.target), capture: exchangeSan(value.targetCapture) } }), value => [value.square, value.target.square]);
  const lineClearance = sequence("inspector.line_clearance@1", ["blocker", "slider", "target", "targetCapture"], (value) => ({ operands: { blocker: at(value.blocker), slider: at(value.slider), target: at(value.target), capture: exchangeSan(value.targetCapture) } }), value => [value.slider.square, value.target.square]);
  const squareClearance = sequence("inspector.square_clearance@1", ["vacatedSquare", "vacatingPiece", "laterSlider", "laterMove"], (value) => ({ operands: { vacating: at(value.vacatingPiece), slider: at(value.laterSlider), move: sanOf(value.laterMove.beforeFen, value.laterMove.moveUci) } }), value => [value.vacating.square]);
  const zwischenzug = sequence("inspector.zwischenzug@1", ["expectedRecapture", "intermediateCheck", "reply", "retainedRecapture"], (value) => ({ operands: { expected: value.expectedRecapture.map((uci: string) => sanOf(value.intermediateCheck.beforeFen, uci)), check: sanOf(value.intermediateCheck.beforeFen, value.intermediateCheck.moveUci), reply: sanOf(value.reply.beforeFen, value.reply.moveUci), recapture: exchangeSan(value.retainedRecapture), recaptureSquare: value.retainedRecapture.landingSquare } }), value => [value.recaptureSquare]);
  const overload = sequence("inspector.overload@1", ["firstCapture", "defenderRecapture", "secondTargetCapture"], (value) => ({ operands: { first: sanOf(value.firstCapture.before_fen, value.firstCapture.move_uci), recapture: sanOf(value.defenderRecapture.before_fen, value.defenderRecapture.move_uci), second: exchangeSan(value.secondTargetCapture), target: { piece: piece(value.secondTargetCapture.captured), square: value.secondTargetCapture.landingSquare }, defenderRecaptureSquare: value.defenderRecapture.to } }), value => [value.defenderRecaptureSquare, value.target.square]);

  // --- position readings (Full Inspector)
  const squareSetReading = (sourceOperands: readonly string[], build: (evidence: DeclaredEvidence<unknown>) => { readonly squares: readonly SquareName[]; readonly caption: ReturnType<typeof fact> }, brush: "blue" | "red" = "blue"): Family =>
    single("square_set", sourceOperands, ["mechanical_transform"], (evidence) => { const built = build(evidence); return squareSet(evidence, built.squares, built.caption, brush); });
  const space = squareSetReading(["colors", "differentials"], (evidence) => {
    const reading = payloadOf(evidence);
    return { squares: reading.colors.flatMap((entry: Payload) => entry.zones.flatMap((zone: Payload) => zone.squares)), caption: fact("play.space@1", "pawn-structure@1", { totals: reading.colors.map((entry: Payload) => ({ color: entry.color, total: entry.total })), zones: reading.differentials.map((zone: Payload) => ({ zone: zone.zone, white: zone.white, black: zone.black })) }) };
  });
  const pawnConnectivity = squareSetReading(["colors"], (evidence) => {
    const reading = payloadOf(evidence);
    return { squares: reading.colors.flatMap((entry: Payload) => entry.islands.flatMap((island: Payload) => island.squares)), caption: fact("play.pawn_connectivity@1", "board-rules@1", { colors: reading.colors.map((entry: Payload) => ({ color: entry.color, islands: entry.islandCount, connectedPairs: entry.connectedPawnPairs.length, chains: entry.chains.length })) }) };
  });
  const legalMoves = squareSetReading(["turn", "pieces"], (evidence) => {
    const map = payloadOf(evidence);
    const movable = map.pieces.filter((entry: Payload) => entry.moves.length > 0);
    const squares = [...new Set<SquareName>(movable.map((entry: Payload) => entry.piece.square))];
    return { squares, caption: fact("play.legal_moves@1", "board-rules@1", { turn: map.turn, pieces: movable.length, moves: movable.reduce((sum: number, entry: Payload) => sum + entry.moves.length, 0), squares }) };
  });
  const RAY_KINDS = ["absolute_pin", "relative_pin", "skewer", "xray_attack", "xray_defense"];
  const rays = squareSetReading(["rays"], (evidence) => {
    const reading = payloadOf(evidence);
    const kept = reading.rays.filter((ray: Payload) => RAY_KINDS.includes(ray.kind));
    return { squares: kept.flatMap((ray: Payload) => [ray.slider.square, ray.blocker.square, ray.target.square]), caption: fact("play.rays@1", "threat-convention@1", { rays: kept.map((ray: Payload) => ({ kind: ray.kind, slider: piece(ray.slider.piece), sliderSquare: ray.slider.square, blocker: piece(ray.blocker.occupant), blockerSquare: ray.blocker.square, target: piece(ray.target.occupant), targetSquare: ray.target.square })) }) };
  }, "red");
  const rookOnSeventh = squareSetReading(["rooks"], (evidence) => {
    const reading = payloadOf(evidence);
    const rooks = reading.rooks.map((rook: Payload) => ({ color: rook.rook.piece.color, square: rook.rook.square, king: rook.enemyKingOnBackRank?.square ?? null, pawns: rook.enemyPawnsOnSeventh.map((pawn: Payload) => pawn.square) }));
    return { squares: reading.rooks.flatMap((rook: Payload) => [rook.rook.square, ...(rook.enemyKingOnBackRank === null ? [] : [rook.enemyKingOnBackRank.square]), ...rook.enemyPawnsOnSeventh.map((pawn: Payload) => pawn.square)]), caption: fact("play.rook_on_seventh@1", "board-rules@1", { rooks }) };
  });
  const promotionPressure = squareSetReading(["pawns"], (evidence) => {
    const reading = payloadOf(evidence);
    const pawns = reading.pawns.map((entry: Payload) => ({ pawn: at(entry.pawn), promotion: entry.promotionSquare, distance: entry.distance, blockers: entry.blockers.length }));
    return { squares: reading.pawns.flatMap((entry: Payload) => [entry.pawn.square, entry.promotionSquare]), caption: fact("inspector.promotion_pressure@1", "board-rules@1", { pawns }) };
  });
  const development = squareSetReading(["undeveloped"], (evidence) => {
    const reading = payloadOf(evidence);
    const side = (color: Color): Placed[] => reading.undeveloped[color].map((entry: Payload) => ({ piece: { color, role: entry.role }, square: entry.square }));
    const white = side("white"), black = side("black");
    return { squares: [...white, ...black].map((entry) => entry.square), caption: fact("inspector.development@1", "board-rules@1", { white, black }) };
  });
  const candidateMajority = squareSetReading(["candidates"], (evidence) => {
    const reading = payloadOf(evidence);
    return { squares: reading.candidates.map((entry: Payload) => entry.pawn.square), caption: fact("inspector.candidate_majority@1", "pawn-structure@1", { candidates: reading.candidates.map((entry: Payload) => ({ pawn: at(entry.pawn), supports: entry.supportCount, blockers: entry.blockerCount })) }) };
  });
  const contacts = relationList(["contacts", "locks", "passed", "connectedPassedPairs"], (evidence) => {
    const reading = payloadOf(evidence);
    const nodes = reading.contacts.flatMap((contact: Payload) => [node(at(contact.attacker), "source"), node(at(contact.target), "target")]);
    return {
      relation: relation(evidence, nodes, reading.contacts.map((contact: Payload) => ({ from: contact.attacker.square, to: contact.target.square, relation: "attacks" as const, sign: "state" as const })), "fact"),
      statement: statement("play.pawn_contacts@1", "board-rules@1", pawnContactCaptionOperands(reading)),
    };
  });
  const squareControl = relationList(["colors"], (evidence) => {
    const reading = evidence.payload as SquareControlReading;
    const nodes: RelationOverlayOperand["nodes"][number][] = [];
    const edges: RelationOverlayOperand["edges"][number][] = [];
    for (const entry of reading.colors) for (const controlled of entry.pseudo) for (const controller of controlled.controllers) {
      nodes.push(node(at(controller), "source"), { square: controlled.target, emphasis: "target" });
      edges.push({ from: controller.square, to: controlled.target, relation: "controls", sign: "state" });
    }
    const ordered = [...nodes.filter((entry) => entry.emphasis === "source"), ...nodes.filter((entry) => entry.emphasis !== "source")];
    return {
      relation: relation(evidence, ordered, edges, "fact"),
      statement: statement("play.square_control@1", "piece-geometry@1", squareControlCaptionOperands(reading)),
    };
  });
  const kingZone = relationList(["kings"], (evidence) => {
    const reading = payloadOf(evidence);
    const nodes: RelationOverlayOperand["nodes"][number][] = [];
    const edges: RelationOverlayOperand["edges"][number][] = [];
    for (const king of reading.kings) {
      nodes.push(node(at(king.king), "target"));
      for (const attacker of king.attackers) { nodes.push(node(at(attacker), "source")); for (const square of attacker.zoneSquares) { nodes.push({ square, emphasis: "target" }); edges.push({ from: attacker.square, to: square, relation: "attacks", sign: "state" }); } }
      for (const defender of king.defenders) { nodes.push(node(at(defender), "source")); for (const square of defender.zoneSquares) { nodes.push({ square, emphasis: "target" }); edges.push({ from: defender.square, to: square, relation: "defends", sign: "state" }); } }
      if (king.escapes.kind === "available") for (const square of king.escapes.squares) { nodes.push({ square, emphasis: "target" }); edges.push({ from: king.king.square, to: square, relation: "moves_to", sign: "state" }); }
    }
    const ordered = [...nodes.filter((entry) => entry.role !== undefined), ...nodes.filter((entry) => entry.role === undefined)];
    return {
      relation: relation(evidence, ordered, edges, "fact", kit.declared(evidence, "piece-geometry@1")),
      statement: statement("inspector.king_zone@1", "piece-geometry@1", { kings: reading.kings.map((king: Payload) => ({ color: king.color, king: king.king.square, attackers: king.attackers.map(at), defenders: king.defenders.length, shelter: king.shelter.length })) }),
    };
  });
  const pieceDestinations = relationList(["colors"], (evidence) => {
    const reading = payloadOf(evidence);
    const available = reading.colors.filter((entry: Payload) => entry.kind === "available");
    const nodes: RelationOverlayOperand["nodes"][number][] = [];
    const edges: RelationOverlayOperand["edges"][number][] = [];
    for (const entry of available) for (const unit of entry.pieces) for (const square of unit.legal) {
      nodes.push(node(atOccupant(unit.piece), "source"), { square, emphasis: "target" });
      edges.push({ from: unit.piece.square, to: square, relation: "moves_to", sign: "state" });
    }
    const ordered = [...nodes.filter((entry) => entry.emphasis === "source"), ...nodes.filter((entry) => entry.emphasis !== "source")];
    return {
      relation: relation(evidence, ordered, edges, "fact", kit.declared(evidence, "piece-geometry@1")),
      statement: statement("inspector.piece_destinations@1", "piece-geometry@1", { colors: available.map((entry: Payload) => ({ color: entry.color, pieces: entry.pieces.length, legal: entry.pieces.reduce((sum: number, unit: Payload) => sum + unit.legal.length, 0), safe: entry.pieces.reduce((sum: number, unit: Payload) => sum + unit.localNonLosing.length, 0) })) }),
    };
  });
  const discoveredLatency = relationList(["screens"], (evidence) => {
    const reading = payloadOf(evidence);
    const nodes = reading.screens.flatMap((entry: Payload) => [node(at(entry.screen), "screen"), node(atOccupant(entry.target), "target"), node(at(entry.slider), "context")]);
    return {
      relation: relation(evidence, nodes, reading.screens.map((entry: Payload) => ({ from: entry.screen.square, to: entry.target.square, relation: "closes_ray" as const, sign: "state" as const })), "threat", kit.declared(evidence, "threat-convention@1")),
      statement: statement("inspector.discovered_latency@1", "threat-convention@1", { screens: reading.screens.map((entry: Payload) => ({ screen: at(entry.screen), slider: at(entry.slider), target: atOccupant(entry.target), check: entry.discoveredCheck })) }),
    };
  });
  const dutySet = relationList(["duties"], (evidence) => {
    const reading = payloadOf(evidence);
    const nodes = reading.duties.flatMap((duty: Payload) => [node(at(duty.defender), "source"), node(at(duty.target), "target")]);
    const ordered = [...nodes.filter((entry: Payload) => entry.emphasis === "source"), ...nodes.filter((entry: Payload) => entry.emphasis !== "source")];
    return {
      relation: relation(evidence, ordered, reading.duties.map((duty: Payload) => ({ from: duty.defender.square, to: duty.target.square, relation: "defends" as const, sign: "state" as const })), "fact"),
      statement: statement("inspector.duty_set@1", "piece-geometry@1", { duties: reading.duties.length, defenders: new Set(reading.duties.map((duty: Payload) => duty.defender.square)).size }),
    };
  });
  const backRank = relationList(["susceptible"], (evidence) => {
    const reading = payloadOf(evidence);
    const nodes = reading.susceptible.flatMap((entry: Payload) => [
      { square: entry.kingSquare, role: "king" as const, color: entry.color, emphasis: "target" as const },
      ...entry.accessingHeavyPieces.flatMap((heavy: Payload) => [{ square: heavy.square, role: heavy.piece.role, color: heavy.piece.color, emphasis: "source" as const }, { square: heavy.fileTarget, emphasis: "target" as const }]),
    ]);
    const edges = reading.susceptible.flatMap((entry: Payload) => entry.accessingHeavyPieces.map((heavy: Payload) => ({ from: heavy.square, to: heavy.fileTarget, relation: "moves_to" as const, sign: "state" as const })));
    return {
      relation: relation(evidence, nodes, edges, "threat", kit.declared(evidence, "threat-convention@1")),
      statement: statement("play.back_rank@1", "threat-convention@1", { kings: reading.susceptible.map((entry: Payload) => ({ color: entry.color, king: entry.kingSquare, blockedEscapes: entry.escapes.filter((escape: Payload) => escape.blockedByOwn !== undefined).map((escape: Payload) => escape.square), attackedEscapes: entry.escapes.filter((escape: Payload) => escape.blockedByOwn === undefined && escape.attackedBy.length > 0).map((escape: Payload) => escape.square), heavy: entry.accessingHeavyPieces.map((heavy: Payload) => ({ piece: piece(heavy.piece), square: heavy.square, target: heavy.fileTarget })) })) }),
    };
  });
  const trapped = relationList(["pieces"], (evidence) => {
    const reading = payloadOf(evidence);
    const nodes = reading.pieces.flatMap((entry: Payload) => [node(atOccupant(entry.piece), "target"), ...entry.attackers.map((attacker: Payload) => ({ square: moveOf(attacker.moveUci).from, emphasis: "source" as const }))]);
    const edges = reading.pieces.flatMap((entry: Payload) => entry.attackers.map((attacker: Payload) => ({ from: moveOf(attacker.moveUci).from, to: entry.piece.square, relation: "attacks" as const, sign: "state" as const })));
    return {
      relation: relation(evidence, nodes, edges, "threat", kit.declared(evidence, "threat-convention@1")),
      statement: statement("play.trapped_pieces@1", "threat-convention@1", { pieces: reading.pieces.map((entry: Payload) => ({ piece: piece(entry.piece.occupant), square: entry.piece.square, attackers: entry.attackers.map((attacker: Payload) => moveOf(attacker.moveUci).from), moves: entry.moves.length })) }),
    };
  });
  const threats = single("fact_statement", ["threats"], ["mechanical_transform"], (evidence) => {
    const result = payloadOf(evidence);
    return statement("play.threats@1", "threat-convention@1", { threats: result.threats.map((threat: Payload) => ({ piece: piece(threat.threateningPiece.piece), from: threat.threateningPiece.square, mate: threat.mate, ...(threat.target === undefined ? {} : { target: piece(threat.target.piece) }), to: moveOf(threat.threatenedMove).to })) });
  });
  const mateInOne = single("fact_statement", ["mates"], ["mechanical_transform"], (evidence) => {
    const reading = payloadOf(evidence);
    return statement("play.mate_in_one@1", "board-rules@1", { mates: reading.mates.map((mate: Payload) => ({ piece: piece(mate.mover.piece), from: mate.mover.from, to: mate.mover.to, king: mate.matedKing.square })) });
  });
  const loosePieces = single("fact_statement", ["pieces"], ["mechanical_transform"], (evidence) => {
    const reading = payloadOf(evidence);
    const flagged = reading.pieces.filter((entry: Payload) => entry.enPrise || entry.loose || entry.underDefended);
    return statement("play.loose_pieces@1", "threat-convention@1", { pieces: flagged.map((entry: Payload) => ({ piece: piece(entry.piece.occupant), square: entry.piece.square, enPrise: entry.enPrise, loose: entry.loose, underDefended: entry.underDefended, capturers: entry.legalCapturers.map((capturer: Payload) => capturer.square), defenders: entry.defenders.length })) });
  });
  const castlingRights = single("fact_statement", ["white", "black"], ["copied_byte_equal"], (evidence) => {
    const rights = payloadOf(evidence);
    return statement("play.castling_rights@1", "board-rules@1", { white: { kingside: rights.white.kingside, queenside: rights.white.queenside }, black: { kingside: rights.black.kingside, queenside: rights.black.queenside } });
  });
  const castlingLegality = single("fact_statement", ["color", "wing", "legalNow", "inCheck", "blockedSquares", "attackedSquares"], ["copied_byte_equal"], (evidence) => {
    const issue = payloadOf(evidence);
    return statement("play.castling_legality@1", "board-rules@1", { color: issue.color, wing: issue.wing, legalNow: issue.legalNow, inCheck: issue.inCheck, blocked: [...issue.blockedSquares], attacked: [...issue.attackedSquares] });
  });
  const replyBreadth = single("fact_statement", ["triggeringMove", "check", "count"], ["mechanical_transform"], (evidence) => {
    const reading = payloadOf(evidence);
    return statement("inspector.reply_breadth@1", "board-rules@1", { move: moveOf(reading.triggeringMove), count: reading.count, check: reading.check });
  });
  const forcedMate = (withFen: boolean) => single("fact_statement", [...(withFen ? ["beforeFen"] : []), "candidate", "attacker", "maxAttackerMoves", "proofStatus", "rootReplies"], ["mechanical_transform"], (evidence) => {
    const proof = payloadOf(evidence);
    return statement("inspector.forced_mate@1", "board-rules@1", { move: withFen ? { kind: "san", san: sanOf(proof.beforeFen, proof.candidate) } : { kind: "squares", move: moveOf(proof.candidate) }, attacker: proof.attacker, horizon: proof.maxAttackerMoves, status: proof.proofStatus, replies: proof.rootReplies.length });
  });
  const overloadConflict = single("fact_statement", ["candidate", "soleDefender", "capturedTarget", "retainedTargets", "legalRecaptures"], ["mechanical_transform"], (evidence) => {
    const conflict = payloadOf(evidence);
    return statement("inspector.overload_conflict@1", "threat-convention@1", { san: sanOf(conflict.beforeFen, conflict.candidate), defender: at(conflict.soleDefender), captured: at(conflict.capturedTarget), retained: conflict.retainedTargets.map(at), recaptures: conflict.legalRecaptures.map((uci: string) => sanOf(conflict.afterFen, uci)) });
  });
  const roleSignature = single("fact_statement", ["colors", "magnitude"], ["mechanical_transform"], (evidence) => {
    const reading = payloadOf(evidence);
    return statement("inspector.role_signature@1", "board-rules@1", { colors: reading.colors.map((entry: Payload) => ({ color: entry.color, pawn: entry.counts.pawn, knight: entry.counts.knight, bishop: entry.counts.bishop, rook: entry.counts.rook, queen: entry.counts.queen })), difference: reading.magnitude });
  });
  const phase = singleFact("play.phase@1", "phase-bands@1", ["phase"], ["copied_byte_equal"], evidence => ({ phase: payloadOf(evidence).phase }));
  const endgame = singleFact("play.endgame_type@1", "endgame-convention@1", ["type"], ["copied_byte_equal"], evidence => ({ label: payloadOf(evidence).type?.label ?? null }));
  const setupNames: Readonly<Record<string, string>> = { lucena: "Lucena position", philidor: "Philidor position", vancura: "Vančura position" };
  const setupStatement = singleFact("play.endgame_setup@1", "endgame-convention@1", ["technique"], ["copied_byte_equal"], (evidence) => {
    const technique = payloadOf(evidence).technique as string;
    const name = setupNames[technique];
    if (name === undefined) throw new TypeError("endgame setup technique has no registered name");
    return { technique, name };
  });
  const setupMatch: Family = { ...setupStatement, validateWireComponent: component => {
    setupStatement.validateWireComponent(component);
    if (component.id === "fact_statement" && component.operand.rendererId === "play.endgame_setup@1"
      && setupNames[component.operand.operands.technique] !== component.operand.operands.name) throw new TypeError("Endgame setup name crosses its registered technique");
  } };
  const shape = single("fact_statement", ["entryId"], ["mechanical_transform"], (evidence) =>
    statement("play.shape@1", "shape-catalogue@1", { title: String(payloadOf(evidence).entryId).split("-").map((word, index) => (index === 0 ? capital(word) : word)).join(" ") }));
  const pivotal = (kind: "phase_change" | "human_divergence" | "option_collapse" | "irreversibility"): Family => {
    const declared = singleFact("inspector.pivotal@1", kind === "phase_change" ? "phase-bands@1" : kind === "human_divergence" ? "recorded-run@1" : "board-rules@1", ["kind", "detail"], ["mechanical_transform"], (evidence) => {
    const marker = payloadOf(evidence);
    if (marker.kind !== kind) throw new TypeError("Pivotal source crosses its registered kind");
    const detail = marker.detail;
    const operands = marker.kind === "phase_change" ? { kind: marker.kind, from: detail.from, to: detail.to }
      : marker.kind === "human_divergence" ? { kind: marker.kind, model: detail.engine.name.includes(detail.engine.version) ? detail.engine.name : `${detail.engine.name} ${detail.engine.version}`, band: detail.targetElo ?? null, shares: detail.masses.slice(0, 3) }
        : marker.kind === "option_collapse" ? { kind: marker.kind, color: detail.color, count: detail.count }
          : { kind: marker.kind, subkind: detail.subkind, color: detail.color, ...(detail.role === undefined ? {} : { role: detail.role }), ...(detail.queensOff === undefined ? {} : { queensOff: detail.queensOff }) };
    return operands;
    }, kind === "human_divergence" ? "recorded_run" : "declared_convention");
    return { ...declared, validateWireComponent: component => {
      declared.validateWireComponent(component);
      if (component.id === "fact_statement" && component.operand.rendererId === "inspector.pivotal@1"
        && component.operand.operands.kind !== kind) throw new TypeError("Pivotal statement crosses its registered kind");
    } };
  };
  const storyRank = single("fact_statement", ["rank"], ["mechanical_transform"], (evidence) =>
    statement("inspector.story_rank@1", "recorded-run@1", { moments: payloadOf(evidence).rank.length }, "recorded_run"));
  const openingReached = singleFact("inspector.opening_reached@1", "opening-catalogue@1", ["deepest"], ["copied_byte_equal"], (evidence) => {
    const deepest = payloadOf(evidence).deepest;
    return { eco: deepest.eco, name: deepest.name };
  });
  const catalogueMembership = single("fact_statement", ["observedPly", "descendantEndpointCount"], ["copied_byte_equal"], (evidence) => {
    const membership = payloadOf(evidence);
    return statement("inspector.catalogue_membership@1", "opening-catalogue@1", { ply: membership.observedPly, endpoints: membership.descendantEndpointCount });
  });

  // --- recorded run and comparison
  const compareEvalDelta = single("magnitude", ["delta", "plyOffset"], ["copied_byte_equal", "retained_convention"], (evidence) =>
    ({ id: "magnitude", operand: { value: payloadOf(evidence).delta, unit: { kind: "centipawn" }, convention: kit.convention(evidence, { kind: "recorded_search", engine: null, depth: null }, "white"), saturated: false } }));
  const compareStructure = single("fact_statement", ["observation"], ["copied_byte_equal"], (evidence) => {
    const { detail: _detail, provenanceNote: _note, ...rest } = payloadOf(evidence).observation;
    return statement("play.compare_structure@1", "pawn-structure@1", { observation: rest });
  });
  const consequence = singleFact("story.consequence@1", "recorded-run@1", ["terminal", "outcome", "plies", "objectiveState"], ["copied_byte_equal"], (evidence) => {
    const value = payloadOf(evidence);
    return value.terminal ? { terminal: true, outcome: value.outcome } : { terminal: false, plies: value.plies, objectiveState: value.objectiveState };
  }, "recorded_run");
  const importedResult = singleFact("story.imported_result@1", "recorded-run@1", ["result"], ["copied_byte_equal"], evidence => ({ result: payloadOf(evidence).result }), "recorded_run");

  // --- provider, model, corpus and recorded sources
  const engineName = (values: Payload): string | null => (typeof values.engineName === "string" && values.engineName.trim() !== "" ? (typeof values.engineVersion === "string" && values.engineVersion.trim() !== "" && !values.engineName.includes(values.engineVersion) ? `${values.engineName} ${values.engineVersion}` : values.engineName) : null);
  const engineIdentity = (values: Payload): { readonly name: string; readonly version: string } | null =>
    (typeof values.engineName === "string" && values.engineName.trim() !== "" && typeof values.engineVersion === "string" && values.engineVersion.trim() !== "" ? { name: values.engineName, version: values.engineVersion } : null);
  const depthOf = (values: Payload): number | null => (Number.isSafeInteger(values.depth) && values.depth >= 0 ? values.depth : null);
  const engineMagnitude = (evidence: DeclaredEvidence<unknown>, values: Payload): ComponentValue => {
    const black = values.perspective === "black";
    const perspective: ConventionReceipt["perspective"] = values.perspective === "white" || black ? "white" : "not_applicable";
    const sign = black ? -1 : 1;
    const convention = kit.convention(evidence, { kind: "recorded_search", engine: engineIdentity(values), depth: depthOf(values) }, perspective);
    const recordedAt = evidence.projection.id === "recorded.engine.eval" ? { retrievedAt: payloadOf(evidence).retrievedAt as string } : {};
    if (Number.isSafeInteger(values.centipawns)) return { id: "magnitude", operand: { value: sign * values.centipawns, unit: { kind: "centipawn" }, convention, saturated: false, ...recordedAt } };
    if (Number.isSafeInteger(values.mateIn) && values.mateIn !== 0) return { id: "magnitude", operand: { value: sign * values.mateIn, unit: { kind: "mate_in" }, convention, saturated: false, ...recordedAt } };
    throw new TypeError("an engine reading without a numeric score is an abstention");
  };
  const stockfishEval = single("magnitude", ["values"], ["mechanical_transform", "retained_convention"], (evidence) => engineMagnitude(evidence, payloadOf(evidence).values));
  const recordedEval: Family = { ...single("magnitude", ["retrievedAt", "values"], ["copied_byte_equal", "mechanical_transform", "retained_convention"], (evidence) => engineMagnitude(evidence, payloadOf(evidence).values)),
    validateWireComponent: (component, evidence) => assertInspectorWireComponent("recorded.engine.eval@1", component, evidence.evidenceDigest, evidence.producer) };
  const stockfishWdl = single("fact_statement", ["values"], ["mechanical_transform"], (evidence) => {
    const values = payloadOf(evidence).values;
    return statement("inspector.engine_wdl@1", "recorded-engine@1", { win: values.win, draw: values.draw, loss: values.loss, engine: engineName(values) });
  });
  const stockfishPv = single("fact_statement", ["values"], ["mechanical_transform"], (evidence) => {
    const values = payloadOf(evidence).values;
    const moves = Array.isArray(values.movesUci) ? values.movesUci : Array.isArray(values.moves) ? values.moves : [];
    return statement("inspector.engine_line@1", "recorded-engine@1", { moves: moves.map((uci: string) => moveOf(uci)), engine: engineName(values), depth: depthOf(values) });
  });
  const nullableInt = (value: unknown): number | null => (Number.isSafeInteger(value) ? value as number : null);
  const tablebase = (read: (payload: Payload) => Payload, perspective: "side_to_move" | "white", sourceOperands: readonly string[], distances: boolean): Family => {
    const declared = singleFact("inspector.tablebase@1", "recorded-engine@1", sourceOperands, ["mechanical_transform"], (evidence) => {
    const values = read(payloadOf(evidence));
    return { category: values.category, perspective, dtz: distances ? nullableInt(values.preciseDtz ?? values.dtz) : null, dtm: distances ? nullableInt(values.dtm) : null, pieces: distances && Number.isSafeInteger(values.pieceCount) ? values.pieceCount : null };
    });
    return { ...declared, validateWireComponent: component => {
      declared.validateWireComponent(component);
      if (component.id === "fact_statement" && component.operand.rendererId === "inspector.tablebase@1"
        && component.operand.operands.perspective !== perspective) throw new TypeError("Tablebase statement crosses its registered perspective");
    } };
  };
  const identity = (payload: Payload): Payload => payload;
  const maiaModel = (page: Payload): { readonly name: string; readonly version: string } => ({ name: page.engine.name, version: page.engine.version });
  const maiaPolicy = single("distribution", ["engine", "targetElo", "candidates"], ["mechanical_transform", "retained_convention"], (evidence) => {
    const page = payloadOf(evidence);
    const rows = [...page.candidates].filter((candidate: Payload) => typeof candidate.mass === "number").sort((left: Payload, right: Payload) => left.rank - right.rank)
      .map((candidate: Payload) => ({ move: { san: longPhrase(moveOf(candidate.moveUci)), uci: candidate.moveUci }, share: candidate.mass }));
    if (rows.length === 0) throw new TypeError("a model page with no candidate shares is an abstention");
    const covered = rows.reduce((sum: number, row: Payload) => sum + row.share, 0);
    return { id: "distribution", operand: { rows, residual: covered < 0.999 ? { share: Math.max(0, 1 - covered), label: "unlisted_mass" } : null, convention: kit.convention(evidence, { kind: "human_model", model: maiaModel(page), band: Number.isSafeInteger(page.targetElo) ? page.targetElo : null }, "side_to_move"), highlight: null } };
  });
  const maiaWdl = single("fact_statement", ["engine", "targetElo", "candidates"], ["mechanical_transform"], (evidence) => {
    const page = payloadOf(evidence);
    const model = maiaModel(page);
    return statement("inspector.model_wdl@1", "recorded-engine@1", { model: model.name.includes(model.version) ? model.name : `${model.name} ${model.version}`, band: Number.isSafeInteger(page.targetElo) ? page.targetElo : null, rows: page.candidates.map((candidate: Payload) => ({ move: moveOf(candidate.moveUci), win: candidate.wdl.win, draw: candidate.wdl.draw, loss: candidate.wdl.loss })) });
  });
  const OUTCOME_FLOOR = 100;
  const explorerPopulation: Family = {
    component: "distribution", composition: POPULATION, sourceOperands: ["result", "committedMoveSan"], assertions: ["mechanical_transform", "retained_convention"],
    construct: (evidence) => {
      const page = payloadOf(evidence);
      const result = page.result;
      if (result.kind !== "stats") throw new TypeError("an abstaining corpus page is an abstention, never a distribution");
      if (!Number.isSafeInteger(result.total) || result.total <= 0 || result.moves.length === 0) throw new TypeError("an empty corpus page is an abstention");
      const population = { source: result.population.source, ratings: [...result.population.ratings], speeds: [...result.population.speeds], since: result.population.since, until: result.population.until };
      const convention = kit.convention(evidence, { kind: "human_population", population, sampleSize: result.total }, "white");
      const rows = result.moves.map((move: Payload) => ({ move: { san: move.san, uci: move.uci }, share: move.playedCount / result.total, count: move.playedCount }));
      const listed = result.moves.reduce((sum: number, move: Payload) => sum + move.playedCount, 0);
      const committed = page.committedMoveSan === null ? undefined : result.moves.find((move: Payload) => move.san === page.committedMoveSan);
      return [
        { id: "distribution", operand: { rows, residual: listed < result.total ? { share: (result.total - listed) / result.total, label: "other_moves" } : null, convention, highlight: committed === undefined ? null : { uci: committed.uci, why: "learner_committed" } } },
        { id: "outcome_split", operand: { white: result.white, draws: result.draws, black: result.black, total: result.total, perspective: "white", convention, floor: { threshold: OUTCOME_FLOOR, met: result.total >= OUTCOME_FLOOR } } },
        { id: "count_with_denominator", operand: { numerator: Math.min(listed, result.total), denominator: result.total, denominatorMeaning: "games_in_population" } },
      ];
    },
  };

  // ---------------------------------------------------------------------------------------------
  // The pair table: consumer × exact projection → family, with the binding's literal forms.
  // ---------------------------------------------------------------------------------------------

  const specs: AdapterSpec[] = [];
  const add = (consumer: VersionedEvidenceId, projection: VersionedEvidenceId, forms: readonly EvidenceForm[], family: Family | ((forms: readonly EvidenceForm[], captionOnly?: boolean) => Family)) => {
    if (consumer === NUDGE || consumer === MAP) {
      projection = currentRecordedModuleRefs([projection])[0]!;
      // Narrative and former recorded rows now name one exact recorded-window pair.
      if (specs.some(row => row.consumer === consumer && row.projection.id === projection.id && row.projection.version === projection.version)) return;
    }
    const captionOnly = isNudgeRecordedCaptionBinding(consumer, projection);
    if (captionOnly) forms = forms.filter(form => form !== "arrows");
    const resolved = typeof family === "function" ? family(forms, captionOnly) : family;
    if ((consumer === NUDGE || consumer === MAP) && resolved.validateWireComponent === undefined) {
      throw new TypeError("Current Nudge/Map adapter requires its registered received validation");
    }
    specs.push({ consumer, projection, component: resolved.component, forms, sourceOperands: resolved.sourceOperands, assertions: resolved.assertions, construct: resolved.construct,
      ...(resolved.validateWireComponent === undefined ? {} : { validateWireComponent: resolved.validateWireComponent }),
      ...(resolved.composition === undefined ? {} : { composition: resolved.composition }) });
  };
  const both = (projection: VersionedEvidenceId, forms: readonly EvidenceForm[], family: Family | ((forms: readonly EvidenceForm[]) => Family)) => { add(NUDGE, projection, forms, family); add(MAP, projection, forms, family); };

  // Post-commit Nudge ∩ Review Map: the one-edge semantic closure.
  for (const family of ["king_zone", "passed_pawn"] as const) both(V(`rules.structural.event.${family}`), LP, structuralEvent(family));
  for (const [ref, [renderer, convention]] of Object.entries(FOUNDATION_COMPACT_STATEMENTS)) {
    const [id, version] = ref.split("@"), projection = V(id!, Number(version));
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(value => value.id === projection.id && value.version === projection.version);
    if (declaration === undefined) throw new TypeError("Compact current event lacks its exact source declaration");
    const definition = FOUNDATION_COMPACT_FACT_RENDERERS[renderer];
    const bound = singleFact(renderer, convention, declaration.operands, ["copied_byte_equal", "mechanical_transform"], evidence => {
      if (evidence.projection.id !== projection.id || evidence.projection.version !== projection.version) throw new TypeError("Compact event crosses its exact registered source");
      const value = payloadOf(evidence);
      const parsed = definition.parse({ san: edgeSan({ before_fen: value.beforeFen, move_uci: value.moveUci }), ...value }, "Complete ordinary current event");
      assertFoundationEdgePayloadRef(parsed, `sha256:${evidenceValueReceipt(evidence).payloadDigest}`);
      return parsed;
    });
    both(projection, LP, { ...bound, validateWireComponent: (component, evidence) => {
      bound.validateWireComponent(component);
      if (component.id !== "fact_statement" || evidence.projection.id !== projection.id || evidence.projection.version !== projection.version) throw new TypeError("Received compact event crosses its exact registered source");
      assertFoundationEdgePayloadRef(component.operand.operands, evidence.evidenceDigest);
    } });
  }
  for (const [family, construct] of Object.entries(TRANSITIONS)) if (family !== "slider_ray") both(V(`rules.transition.event.${family}`), LP, construct);
  both(V("rules.tactic.event.check"), LP, checkEvent);
  both(V("rules.tactic.event.double_attack"), LP, doubleAttack);
  both(V("rules.tactic.event.loose_piece"), LP, looseEvent);
  both(V("rules.castling.event.rights_lost"), LP, rightsLost);
  both(V("derived.exchange.capture_class"), LP, captureClass);
  both(V("derived.exchange.trade_completed"), LP, tradeCompleted);
  both(V("derived.tactic.fork_survives_reply"), LP, forkSurvives);
  both(V("derived.activity.event.open_file_occupancy"), BOARD5, openFileOccupancy);
  both(V("derived.king.captured_zone_defender"), BOARD5, capturedZoneDefender);
  both(V("derived.pawn.event.transitions"), BOARD5, pawnTransition);
  both(V("rules.king.event.zone_state"), BOARD5, kingZoneEvent);
  both(V("rules.pawn.event.dynamics"), BOARD5, pawnDynamics);
  both(V("derived.pawn.sequence.harassment_pressure"), BOARD5, harassment);
  both(V("derived.tactic.attraction_observed"), BOARD4, attraction);
  both(V("derived.tactic.check_zwischenzug_observed"), BOARD4, zwischenzug);
  both(V("derived.tactic.deflection_observed"), BOARD4, deflection);
  both(V("derived.tactic.interference_observed"), BOARD4, interference);
  both(V("derived.tactic.line_blocker_clearance_observed"), BOARD4, lineClearance);
  both(V("derived.tactic.overload_exploitation_observed"), BOARD4, overload);
  both(V("derived.tactic.square_clearance_observed"), BOARD4, squareClearance);
  add(NUDGE, V("derived.grade.move_quality"), PS, grade);

  // Review Map v2 recorded windows: the board-bound compositions (Checkpoint A's statement-only rows
  // could not serve their bindings' arrows / lit squares).
  add(MAP, V("derived.pawn.sequence.contact_timing", 2), BOARD5, contactTiming);
  add(MAP, V("derived.pawn.sequence.harassment_pressure", 2), BOARD5, harassment);
  add(MAP, V("derived.tactic.sequence.defender_consequence", 2), BOARD4, defenderConsequence);
  for (const id of ["attraction", "check_zwischenzug", "deflection", "interference", "line_blocker_clearance", "overload_exploitation", "square_clearance"] as const) {
    add(MAP, V(`derived.tactic.${id}_observed`, 2), BOARD4, { attraction, check_zwischenzug: zwischenzug, deflection, interference, line_blocker_clearance: lineClearance, overload_exploitation: overload, square_clearance: squareClearance }[id]);
  }

  // Review Map only (beyond Checkpoint A's list).
  const exposureOperands = ["defender", "target", "captures", "passConvention"] as const;
  add(MAP, V("derived.tactic.defender_exposure", 2), LP, singleFact("review.defender_exposure@1", "piece-geometry@1",
    exposureOperands, ["mechanical_transform"], defenderExposureSummary));
  add(MAP, V("derived.material.event.role_asymmetry"), BOARD5, roleAsymmetry);
  add(MAP, V("derived.opening.deepest_reached"), LPS, openingReached);
  add(MAP, V("derived.pawn.sequence.contact_timing"), BOARD5, contactTiming);
  add(MAP, V("derived.tactic.sequence.defender_consequence"), BOARD4, defenderConsequence);
  for (const kind of ["human_divergence", "irreversibility", "option_collapse", "phase_change"] as const) add(MAP, V(`derived.pivotal.${kind}`), PST, pivotal(kind));
  add(MAP, V("recorded.engine.eval"), PS, recordedEval);
  add(MAP, V("recorded.tablebase.result"), PS, tablebase((payload) => payload.values, "side_to_move", ["values"], true));
  add(MAP, V("rules.endgame.classification"), PS, endgame);
  add(MAP, V("rules.phase.reading", 2), PS, phase);
  add(MAP, V("run.record.consequence"), PST, consequence);
  add(MAP, V("run.record.imported_result"), PS, importedResult);
  add(MAP, V("run.record.objective_transition", 2), PST, singleFact("review.objective_transition@1", "recorded-run@1", ["context", "from", "to"], ["copied_byte_equal"], evidence => {
    const parse = s.obj({ context: s.lit("review"), from: s.lit("active", "preserved", "degraded", "failed", "achieved", "transitioned"), to: s.lit("active", "preserved", "degraded", "failed", "achieved", "transitioned") });
    const value = parse(evidence.payload, "Review objective payload");
    return { from: value.from, to: value.to };
  }, "recorded_run"));
  add(MAP, V("theory.endgame.setup_match"), PS, setupMatch);

  // Literal accepted Full Inspector2 image. This is deliberately not a ref-rebased copy of
  // the current Full1 table: saved packets, model/explorer operands and Compare2 have different
  // meanings and constructors. Until complete source-page/API/client cutover, these specs are
  // an internal prerequisite, not a second registered consumer or partial compiled view.
  const sources: AdapterSpec[] = [];
  const addSource = (projection: VersionedEvidenceId, forms: readonly EvidenceForm[], family: Family | ((forms: readonly EvidenceForm[]) => Family)) => {
    const resolved = typeof family === "function" ? family(forms) : family;
    const ref = `${projection.id}@${projection.version}`;
    if (!isInspectorWholeReading(ref) && !ref.startsWith("derived.inspector.detail.") && !Object.hasOwn(INSPECTOR_SOURCE_STATEMENTS, ref)) throw new TypeError("Inspector source lacks its exact registered wire semantics");
    if (isInspectorWholeReading(ref)) {
      const geometry = INSPECTOR_WHOLE_READING_GEOMETRY[ref];
      const stateOperands = ref === "rules.tactic.reading.trapped_piece@1" || ref === "rules.tactic.consequence.threat@1" ? ["kind", "reason"] : [];
      sources.push({ consumer: V("module.full_inspector", 2), projection, component: "fact_statement", forms,
        validateWireComponent: (component, evidence) => assertInspectorWireComponent(ref, component, evidence.evidenceDigest, evidence.producer),
        sourceOperands: [...new Set([...resolved.sourceOperands, ...stateOperands])], assertions: ["mechanical_transform", "retained_convention"],
        ...(geometry === "none" ? {} : { composition: { id: "inspector_whole_reading_geometry", members: [
          { component: "fact_statement" as const, forms: LP },
          { component: geometry, forms: forms.filter(form => form !== "list" && form !== "panel"), when: "inspector_whole_reading_has_geometry" as const },
        ] } }),
        construct: evidence => {
          assertDeclaredEvidence(evidence);
          if (`${evidence.projection.id}@${evidence.projection.version}` !== ref) throw new TypeError("Whole reading constructor crosses its exact adapter pair");
          return inspectorWholeReadingComponents(evidence, kit);
        },
      });
      return;
    }
    sources.push({ consumer: V("module.full_inspector", 2), projection, component: resolved.component, forms,
      validateWireComponent: (component, evidence) => {
        assertInspectorWireComponent(ref, component, evidence.evidenceDigest, evidence.producer);
        resolved.validateWireComponent?.(component, evidence);
      },
      sourceOperands: resolved.sourceOperands, assertions: resolved.assertions, construct: resolved.construct,
      ...(resolved.composition === undefined ? {} : { composition: resolved.composition }) });
  };
  addSource(V("rules.tactic.reading.loose_piece"), LP, loosePieces);
  addSource(V("rules.tactic.reading.ray_classification"), LLPH, rays);
  addSource(V("rules.tactic.reading.rook_on_seventh"), LLPH, rookOnSeventh);
  addSource(V("rules.tactic.reading.trapped_piece"), BOARD5, trapped);
  addSource(V("rules.tactic.reading.back_rank"), BOARD5, backRank);
  addSource(V("rules.tactic.reading.discovered_latency"), BOARD5, discoveredLatency);
  addSource(V("rules.tactic.consequence.threat"), LP, threats);
  addSource(V("rules.tactic.consequence.mate_in_one"), LP, mateInOne);
  addSource(V("rules.tactic.consequence.reply_breadth"), LP, replyBreadth);
  addSource(V("rules.structural.reading.space"), LLP, space);
  addSource(V("rules.structural.reading.pawn_connectivity"), LLP, pawnConnectivity);
  addSource(V("rules.phase.development"), LPH, development);
  addSource(V("rules.castling.reading.rights"), LP, castlingRights);
  addSource(V("rules.castling.reading.legality"), LP, castlingLegality);
  addSource(V("derived.tactic.discovered_executed"), BOARD4, discoveredExecuted);
  addSource(V("rules.tactic.reading.promotion_pressure"), LLP, promotionPressure);
  addSource(V("derived.tactic.nonterminal_fork_survival"), LP, forkSurvives);
  addSource(V("rules.square.reading.control"), BOARD5, squareControl);
  addSource(V("rules.mobility.reading.piece_destinations"), BOARD5, pieceDestinations);
  addSource(V("rules.mobility.reading.legal_moves"), LLPH, legalMoves);
  addSource(V("rules.square.event.control"), BOARD5, squareControlEvent);
  addSource(V("rules.mobility.event.piece_destinations"), BOARD5, destinationsEvent);
  addSource(V("rules.pawn.reading.contacts"), BOARD5, contacts);
  addSource(V("rules.pawn.reading.candidate_majority"), LLPH, candidateMajority);
  addSource(V("derived.pawn.sequence.contact_timing", 3), BOARD5, contactTiming);
  addSource(V("derived.pawn.sequence.harassment_pressure", 3), BOARD5, harassment);
  addSource(V("derived.tactic.sequence.defender_consequence", 3), BOARD4, defenderConsequence);
  addSource(V("derived.material.event.role_asymmetry", 2), BOARD5, roleAsymmetry);
  addSource(V("derived.tactic.defender_exposure", 2), LP, singleFact("inspector.defender_exposure@1", "piece-geometry@1",
    exposureOperands, ["mechanical_transform"], defenderExposureSummary));
  addSource(V("derived.material.reading.role_signature", 2), LP, roleSignature);
  addSource(V("rules.king.reading.zone_state"), BOARD5, kingZone);

  const historical = (renderer: RendererId, build: (evidence: DeclaredEvidence<unknown>) => unknown,
    sourceOperands: readonly string[]) => single("fact_statement", sourceOperands,
    ["copied_byte_equal", "mechanical_transform", "retained_convention"], evidence =>
      statement(renderer, "recorded-run@1", build(evidence), "recorded_run"));
  const packetOperands = ["subject", "itemDigest", "event", "authority"];
  addSource(V("recorded.inspector.eval_packet"), P, historical("inspector.recorded_eval@1", recordedInspectorEvalOperands, packetOperands));
  addSource(V("recorded.inspector.wdl_packet"), P, historical("inspector.recorded_wdl@1", recordedInspectorWdlOperands, packetOperands));
  addSource(V("recorded.inspector.pv_packet"), P, historical("inspector.recorded_pv@1", recordedInspectorPvOperands, packetOperands));
  addSource(V("derived.maia.node_distribution"), LP, single("fact_statement", ["nodeId", "engine", "requestedBand", "appliedBand", "coverage", "candidates"],
    ["copied_byte_equal", "retained_convention"], evidence => {
      const { nodeId, engine, requestedBand, appliedBand, coverage, candidates } = evidence.payload as MaiaNodeDistribution;
      return statement("consumer.maia_node_distribution@1", "maia-reported-window@1", { nodeId, engine, requestedBand, appliedBand, coverage, candidates });
    }));
  addSource(V("derived.maia.node_candidate_wdl"), LP, single("fact_statement", ["nodeId", "engine", "requestedBand", "appliedBand", "candidates"],
    ["copied_byte_equal", "retained_convention"], evidence => {
      const { nodeId, engine, requestedBand, appliedBand, candidates } = evidence.payload as MaiaNodeCandidateWdl;
      return statement("consumer.maia_node_candidate_wdl@1", "maia-reported-window@1", { nodeId, engine, requestedBand, appliedBand, candidates });
    }));
  addSource(V("derived.explorer.inspector_population"), LP, single("fact_statement", ["request", "totals", "moves", "unlisted", "lastPlayedMonth"],
    ["copied_byte_equal", "mechanical_transform", "retained_convention"], evidence => {
      const { request, totals, moves, unlisted, lastPlayedMonth } = evidence.payload as ExplorerInspectorPopulation;
      return statement("consumer.explorer_population@1", "explorer-population@1", { ...totals, ratings: [...request.ratingBuckets],
        speeds: [...request.speeds], since: request.since, until: request.until, unlisted, lastPlayedMonth, moves });
    }));
  addSource(V("recorded.inspector.tablebase_packet"), P, historical("inspector.recorded_tablebase@1", recordedInspectorTablebaseOperands, packetOperands));
  addSource(V("derived.inspector.tablebase_category"), P, historical("inspector.recorded_tablebase_category@1", recordedInspectorTablebaseViewOperands, ["record", "category"]));
  addSource(V("derived.inspector.tablebase_distance"), P, historical("inspector.recorded_tablebase_distance@1", recordedInspectorTablebaseViewOperands, ["record", "category", "dtz", "preciseDtz", "dtm"]));
  addSource(V("recorded.engine.eval"), PS, recordedEval);
  addSource(V("recorded.tablebase.result"), PS, tablebase((payload) => payload.values, "side_to_move", ["values"], true));
  addSource(V("theory.shapes.firing", 3), PS, single("fact_statement", ["entryId", "firstNodeId", "lastNodeId", "openEnded", "authority"],
    ["copied_byte_equal", "retained_convention"], evidence => statement("inspector.registered_shape_firing@2", "shape-catalogue@1", registeredShapeFiringOperands(evidence))));
  addSource(V("rules.phase.reading", 2), PS, phase);
  addSource(V("derived.pivotal.irreversibility"), PS, pivotal("irreversibility"));
  addSource(V("derived.pivotal.phase_change", 2), PS, pivotal("phase_change"));
  addSource(V("derived.pivotal.human_divergence", 2), PS, pivotal("human_divergence"));
  addSource(V("derived.pivotal.option_collapse", 2), PS, pivotal("option_collapse"));
  addSource(V("derived.compare.structure_delta", 2), LPS, single("fact_statement", ["observation", "namedStructure"], ["copied_byte_equal"], evidence => {
    const { observation, namedStructure } = payloadOf(evidence);
    if (namedStructure !== null) return statement("play.named_structure@1", "structure-catalogue@1", { ...namedStructure, squares: observation.squares });
    const { detail: _detail, provenanceNote: _note, ...rest } = observation;
    return statement("play.compare_structure@1", "pawn-structure@1", { observation: rest });
  }));
  addSource(V("derived.compare.eval_delta", 2), LPS, single("fact_statement", ["before", "after", "delta", "plyOffset", "frame", "comparability"],
    ["copied_byte_equal", "retained_convention"], evidence => statement("compare.recorded_delta@2", "recorded-comparison@1", evidence.payload, "recorded_run")));
  addSource(V("derived.story.rank", 3), LP, storyRank);
  addSource(V("theory.opening.catalogue_membership"), LP, catalogueMembership);
  addSource(V("derived.opening.deepest_reached", 2), LPS, openingReached);
  addSource(V("rules.tactic.reading.defender_duty_set"), BOARD4, dutySet);
  for (const id of ["attraction", "check_zwischenzug", "deflection", "interference", "line_blocker_clearance", "overload_exploitation", "square_clearance"] as const) {
    addSource(V(`derived.tactic.${id}_observed`, 3), BOARD4, { attraction, check_zwischenzug: zwischenzug, deflection,
      interference, line_blocker_clearance: lineClearance, overload_exploitation: overload, square_clearance: squareClearance }[id]);
  }
  addSource(V("rules.tactic.event.defender_removed"), BOARD4, defenderRemoved);
  addSource(V("rules.tactic.event.defender_duty_relocated"), BOARD4, dutyRelocated);
  addSource(V("rules.tactic.predicate.overload_conflict"), LP, overloadConflict);
  addSource(V("rules.tactic.consequence.forced_mate_after_move"), LP, forcedMate(false));
  addSource(V("rules.tactic.consequence.forced_mate_after_move", 2), LP, forcedMate(true));

  for (const [projection, renderer, arm, binding] of [
    ["derived.review.analysis_typed_pv", "review.analysis_typed_pv@1", "typed_pv", "declared_convention"],
    ["derived.review.analysis_recorded_pv", "review.analysis_recorded_pv@1", "recorded_bestline", "recorded_run"],
    ["derived.review.analysis_recorded_first", "review.analysis_recorded_first@1", "recorded_search_first", "recorded_run"],
  ] as const) addSource(V(projection), LP, single("fact_statement", ["nodeId", "entryNodeId", "operands"],
    ["copied_byte_equal", "mechanical_transform", "retained_convention"], evidence => {
      const invocation = readRecordedAnalyzeLineInvocation(evidence);
      if (invocation.route !== `${projection}@1` || invocation.data.sourceArm !== arm || invocation.data.operands === null) throw new TypeError("Analyze adapter crosses its original source invocation");
      return statement(renderer, "recorded-run@1", invocation.data.operands, binding);
    }));

  for (const family of ["king_zone", "passed_pawn", "piece_count", "direct_attack_count"] as const) {
    addSource(V(`rules.structural.event.${family}`), LP, singleFact("inspector.structural_before_after@1",
      "board-rules@1",
      ["before_fen", "move_uci", "family", "before", "after"], ["mechanical_transform"], evidence => {
        const event = payloadOf(evidence);
        if (event.family !== family || evidence.projection.id !== `rules.structural.event.${family}` || evidence.projection.version !== 1) throw new TypeError("Structural source crosses its registered family");
        return parseInspectorStructuralBeforeAfterOperands({ san: edgeSan(event), family, before: event.before, after: event.after });
      }));
  }
  for (const [ref, [renderer, convention]] of Object.entries(FOUNDATION_EDGE_STATEMENTS)) {
    const [id, version] = ref.split("@");
    const projection = V(id!, Number(version));
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === projection.id && row.version === projection.version);
    if (declaration === undefined) throw new TypeError("Missing exact current structural source");
    const definition = FOUNDATION_EDGE_FACT_RENDERERS[renderer];
    addSource(projection, LP, single("fact_statement", declaration.operands, ["copied_byte_equal", "mechanical_transform"], evidence => {
      const value = payloadOf(evidence);
      const parsed = definition.parse({ san: edgeSan({ before_fen: value.beforeFen, move_uci: value.moveUci }), ...value }, "Current structural readout");
      assertFoundationEdgePayloadRef(parsed, `sha256:${evidenceValueReceipt(evidence).payloadDigest}`);
      return statement(renderer, convention, parsed);
    }));
  }


  for (const [ref, [renderer, convention]] of Object.entries(FOUNDATION_SNAPSHOT_STATEMENTS)) {
    const [id, version] = ref.split("@"), projection = V(id!, Number(version));
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === projection.id && row.version === projection.version);
    if (declaration === undefined) throw new TypeError("Missing exact foundation snapshot source");
    const definition = FOUNDATION_SNAPSHOT_FACT_RENDERERS[renderer];
    addSource(projection, LP, single("fact_statement", declaration.operands, ["copied_byte_equal", "mechanical_transform"], evidence => {
      const parsed = definition.parse(payloadOf(evidence), "Complete foundation snapshot");
      assertFoundationSnapshotPayloadRef(parsed, `sha256:${evidenceValueReceipt(evidence).payloadDigest}`);
      return statement(renderer, convention, parsed);
    }));
  }

  for (const kind of Object.keys(INSPECTOR_DETAIL_SOURCES) as InspectorDetailKind[]) {
    if (kind === "defender_exposure" || isFoundationDetailKind(kind)) {
      addSource(V(`derived.inspector.detail.${kind}`), LP, single("fact_statement",
        ["sourceProjection", "context", "scope", "range", "fullSourceTotal", "members"], ["copied_byte_equal", "mechanical_transform", "retained_convention"], evidence => {
          const parsed = parseInspectorDetailPayload(kind, evidence.payload);
          assertFoundationSnapshotPayloadRef(parsed, `sha256:${evidenceValueReceipt(evidence).payloadDigest}`);
          return statement(`inspector.detail.${kind}@1`, kind === "defender_exposure" ? "legal-exchange@1" : FOUNDATION_DETAIL_CAPTIONS[kind], parsed);
        }));
      continue;
    }

    addSource(V(`derived.inspector.detail.${kind}`), LLP, {
      component: "fact_statement", sourceOperands: ["sourceProjection", "context", "scope", "range", "fullSourceTotal", "members"],
      assertions: ["copied_byte_equal", "mechanical_transform", "retained_convention"],
      composition: { id: "inspector_detail_witnesses", members: [
        { component: "fact_statement", forms: LP },
        { component: "square_set", forms: ["lit_squares"], when: "inspector_detail_has_squares" },
      ] },
      construct: evidence => {
        const payload = parseInspectorDetailPayload(kind, evidence.payload), squares = inspectorDetailSquares(payload);
        const caption = fact(`inspector.detail.${kind}@1`, "piece-geometry@1", payload);
        const text: ComponentValue = { id: "fact_statement", operand: caption };
        return squares.length === 0 ? [text] : [text, kit.squareSet(evidence, squares, "blue", caption)];
      },
    });
  }
  // Source choice order has one authority. Constructors are grouped by payload shape, while
  // the current door retains the topic order (including replacements in their original slots).
  const byRef = new Map(sources.map(spec => [`${spec.projection.id}@${spec.projection.version}`, spec]));
  const sourceRefs = [...INSPECTOR_SOURCE_TOPICS.map(row => row.projection), ...Object.keys(INSPECTOR_DETAIL_SOURCES).map(kind => `derived.inspector.detail.${kind}@1`)];
  if (byRef.size !== sources.length || byRef.size !== sourceRefs.length) throw new TypeError("Inspector source adapters must form the exact current image");
  const ordered = sourceRefs.map(ref => {
    const spec = byRef.get(ref);
    if (spec === undefined) throw new TypeError("Inspector source lacks its exact current adapter");
    return spec;
  });
  return { current: Object.freeze(specs), sources: Object.freeze(ordered) };
}

/** Sole current pairs, including the exact accepted Full2 source/detail image. */
export function inspectorAdapterSpecs(kit: PresentationKit): readonly AdapterSpec[] {
  const { current, sources } = buildInspectorAdapterSpecs(kit);
  return Object.freeze([...current, ...sources]);
}

/** Accepted source/detail constructors, internal and unbound until the complete Full2 cutover. */
export function inspectorSourceAdapterSpecs(kit: PresentationKit): readonly AdapterSpec[] {
  return buildInspectorAdapterSpecs(kit).sources;
}
