// rfc/review-map.md: the learner-facing whole-game Review Map projection. It is a pure, recomputed
// read over one recorded branch: nothing here is persisted (§3 rule 3, criterion 14). It selects,
// orders and renders; it does not grade (the `derived.grade.move_quality@2` producer does), it does
// not invent detections (the registered recorded-window/one-edge collectors do) and it names no best move, no
// principal variation and no praise class (§7).

import { parseFen } from "chessops/fen";

import { branchPath } from "./branch-path.js";
import { openRetryEntry, reviewBranchDivergences as divergences, type ReviewBranchDivergence as Divergence } from "./review-branch-state.js";
export { openRetryEntry } from "./review-branch-state.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceDigest, evidenceForConsumer, type DeclaredEvidence, type EvidenceRole } from "./evidence-contract.js";
import { compileModulePacket } from "./module-packets.js";
import { GRADE_CONVENTION_LABEL, assertMoveQualityGradeSentence, recordedGradeScore, renderMoveQualityGrade, type GradeContext, type GradeSide, type MoveQualityClass, type MoveQualityGrade } from "./grade.js";
import { readRecordedGradeSource, type RecordedGradeSource } from "./recorded-grade-source.js";
import { readRecordedReviewLedgerSource, type RecordedReviewLedgerSource } from "./recorded-review-ledger.js";
import type { RecordedEngineAvailable } from "./internal/recorded-engine-endpoint-values.js";
import { compileEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { assertRecordedReviewResultInvocation, invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { readRecordedReviewBoundary } from "./recorded-review-boundary.js";
import type { RecordedReviewObjectives } from "./evidence-factories.js";
import type { DetectedPhase } from "./phase.js";
import type { RecordedSemanticPathResult } from "./recorded-semantic-path.js";
import { collectRecordedSequenceWindow, prepareRecordedSemanticBranchWindows, RECORDED_SEQUENCE_HORIZONS, type RecordedWindowRoute } from "./recorded-sequence-window.js";
import { collectPostcommitEdge } from "./postcommit-nudge.js";
import { localDefenderExposure } from "./semantic-evidence.js";
import { ENDGAME_SETUP_CONVENTIONS } from "./endgame-setup.js";
import { collectRecordedOpeningHistory } from "./recorded-opening-history.js";
import type { OpeningCatalogueAvailability } from "./opening-catalogue.js";
import { reviewText, type ReviewTemplateId } from "./review-map-templates.js";
import { presentEvidenceItems, presentedSentence, serializePresentedEvidence, type PresentationReceipt, type PresentedEvidenceItem } from "./presentation-contract.js";
import { assertReviewEvidencePacket, presentReviewFamilyAbstentions, readRecordedReviewSourcePopulation, type RecordedReviewSourcePopulation, type ReviewEvidencePacket } from "./review-evidence.js";
import { evidenceGroundingLabel, storyEvidenceSourceLabels, type StoryMoment, type StoryMomentKind, type StoryProjection } from "./story.js";
import type { DrillRun, Node } from "./types.js";

/** The declared moment budget (O7.1 recommendation on file): up to three, no minimum. */
export const REVIEW_MOMENT_BUDGET = 3;
export const REVIEW_MAP_CONVENTION = Object.freeze({ id: "review-map" as const, version: 1 as const, momentBudget: REVIEW_MOMENT_BUDGET });

export type ReviewMapContext = Extract<GradeContext, "review" | "imported_analysis">;

export interface ReviewMapGrade {
  readonly klass: MoveQualityClass;
  /** The complete grounding sentence: both evaluations, the drop, the threshold and the convention. */
  readonly sentence: string;
}

interface ReviewExposureOccurrence {
  readonly componentDigest: string;
  readonly factoryOrdinal: number;
}

type ReviewExposureState =
  | { readonly kind: "available"; readonly occurrences: readonly ReviewExposureOccurrence[] }
  | { readonly kind: "quiet" }
  | { readonly kind: "unavailable"; readonly reason: "invalid_turn_clone" }
  | { readonly kind: "withheld" };

export interface ReviewMapRow {
  readonly nodeId: string;
  /** The position before this move: where `Retry from here` forks a `story-reentry` branch. */
  readonly entryNodeId: string;
  readonly ply: number;
  readonly moveNumber: number;
  readonly side: GradeSide;
  readonly san: string;
  readonly label: string;
  readonly fen: string;
  readonly moveUci: string;
  readonly moment: boolean;
  readonly grade?: ReviewMapGrade;
  /** Evidence-panel sentences for this move, each from a registered template or an admitted renderer. */
  readonly facts: readonly string[];
  readonly defenderExposure: ReviewExposureState;
  /**
   * The typed Review packet components for this move admitted by `module.review_map@1`, plus the
   * packet-issued abstentions of its engine families (rfc/review-evidence-compiler.md). The closed
   * presentation receipt; its equivalent sentences are the matching tail of `facts`.
   */
  readonly packet: PresentationReceipt;
}

export interface ReviewMapMoment {
  readonly nodeId: string;
  readonly entryNodeId: string;
  readonly ply: number;
  readonly san: string | null;
  readonly fen: string;
  readonly phase: DetectedPhase;
  readonly kinds: readonly StoryMomentKind[];
  readonly heading: string;
  readonly moveLabel: string;
  readonly sentences: readonly string[];
  readonly sourceLabels: readonly string[];
  readonly sourcesSentence: string;
}

export interface ReviewMomentSelection {
  readonly moments: readonly StoryMoment[];
  /** Admitted story moments carrying at least one rendered fact: the selector's denominator. */
  readonly considered: number;
}

export type ReviewAccuracy =
  | { readonly side: GradeSide; readonly kind: "rendered"; readonly value: number; readonly decisions: number; readonly evaluated: number; readonly sentence: string }
  | { readonly side: GradeSide; readonly kind: "abstained"; readonly decisions: number; readonly evaluated: number; readonly sentence: string }
  | { readonly side: GradeSide; readonly kind: "no_decisions"; readonly decisions: 0; readonly evaluated: 0; readonly sentence: string };

/**
 * One point of the eval graph (§6, [[D880]]): the recorded evaluation of the position after one ply,
 * read through the same genuine original endpoint source that accuracy uses. Recorded evaluations are
 * White-perspective; `percent` is the reviewed side's win-points through the shipped logistic.
 */
export type ReviewEvalPoint =
  | { readonly nodeId: string; readonly ply: number; readonly kind: "evaluated"; readonly percent: number; readonly sentence: string; readonly joinFromPrevious: boolean }
  | { readonly nodeId: string; readonly ply: number; readonly kind: "missing"; readonly sentence: string };

/** A maximal stretch of plies with no readable recorded evaluation: the graph abstains over it. */
export interface ReviewEvalGap {
  readonly fromPly: number;
  readonly toPly: number;
  readonly sentence: string;
}

export interface ReviewEvalGraph {
  /** `complete` = every ply evaluated; `partial` = abstains per region; `abstained` = nothing to draw. */
  readonly kind: "complete" | "partial" | "abstained";
  /** The side the graph is drawn for: the reviewed run's side, never assumed to be White. */
  readonly side: GradeSide;
  readonly points: readonly ReviewEvalPoint[];
  readonly gaps: readonly ReviewEvalGap[];
  readonly evaluated: number;
  readonly caption: string;
  readonly coverage: string;
}

/**
 * The Compare handoff (§4): other recorded lines that leave the reviewed line at one position and
 * carry at least one move of their own. The branch ids are exactly what the shipped N-way compare
 * takes, reviewed line first; this projection adds no comparison machinery.
 */
export interface ReviewCompareDoor {
  readonly entryNodeId: string;
  readonly branchIds: readonly string[];
  /** Lines at this position beyond the shipped compare's eight-column limit, not offered here. */
  readonly omitted: number;
}

export interface ReviewMapProjection {
  readonly convention: typeof REVIEW_MAP_CONVENTION;
  readonly context: ReviewMapContext;
  readonly rows: readonly ReviewMapRow[];
  readonly moments: readonly ReviewMapMoment[];
  readonly momentsSentence: string;
  readonly considered: number;
  readonly accuracy: { readonly white: ReviewAccuracy; readonly black: ReviewAccuracy };
  readonly coverage: { readonly evaluated: number; readonly positions: number; readonly sentence: string };
  readonly footer: { readonly labels: readonly string[]; readonly sentence: string };
  readonly evalGraph: ReviewEvalGraph;
  readonly compareDoors: readonly ReviewCompareDoor[];
  /**
   * The position a retry is open from (the run's active line leaves the reviewed line there and has
   * reached no outcome), or null. The explicit Analyze action is withheld for that position (O7.3).
   */
  readonly openRetryEntryNodeId: string | null;
}

export interface ReviewMapInput {
  readonly recordedGrades: ReadonlyMap<string, RecordedGradeSource>;
  /** Independently acquired pinned reports, including explicit source absence on non-pack runs. */
  readonly recordedMeasurements: RecordedReviewLedgerSource;
  /** Original complete single-line objective invocation, including empty/root occurrences. */
  readonly recordedObjectives: RecordedReviewObjectives;
  /** Actual complete source-adapter population captured by the current Review workflow. */
  readonly recordedSources?: RecordedReviewSourcePopulation;
  readonly opening?: OpeningCatalogueAvailability;
  readonly run: DrillRun;
  readonly branchId: string;
  readonly story: Pick<StoryProjection, "moments" | "rank">;
  readonly context: ReviewMapContext;
  /** The recorded-semantic-path result for the same run/branch, when the caller compiled it. */
  readonly semanticPath?: RecordedSemanticPathResult;
  /**
   * The viewer, for `module.review_map@1` admission (rfc/module-registration.md §1.2): the evidence
   * role (through `moduleEvidenceRole`) and the run's workflow context. Every grade, evaluation and
   * recorded-path relation on this surface is admitted by the compiled Review Map module first.
   */
  readonly viewer: { readonly role: EvidenceRole; readonly session: string };
  /** The side this review follows (default: the run's start side); the eval graph is drawn for it. */
  readonly side?: GradeSide;
  /** The typed Review evidence packet for the same subject (rfc/review-evidence-compiler.md). */
  readonly packet?: ReviewEvidencePacket;
}

/** The shipped N-way compare's column limit (`MAX_COMPARISON_BRANCHES`). */
export const REVIEW_COMPARE_LIMIT = 8;

type ReviewModuleRefusal = "role_outside_ceiling" | "session_outside_ceiling" | "not_admitted";
const MODULE_REFUSAL_TEMPLATES: Readonly<Record<ReviewModuleRefusal, ReviewTemplateId>> = Object.freeze({
  role_outside_ceiling: "module.refusal.role_outside_ceiling",
  session_outside_ceiling: "module.refusal.session_outside_ceiling",
  not_admitted: "module.refusal.not_admitted",
});

/**
 * One exact `module.review_map@1` admission (`compileModulePacket`, admit mode: the row is not the
 * budgeted unit — moments are). Returns the admitted evidence, or the stated refusal.
 */
function admitForReview<T>(viewer: ReviewMapInput["viewer"], evidence: readonly DeclaredEvidence<T>[]): { readonly admitted: ReadonlySet<DeclaredEvidence<T>> } | { readonly refused: ReviewModuleRefusal } {
  const packet = compileModulePacket({ module: "review_map", timing: "review", role: viewer.role, session: viewer.session, evidence, mode: "admit" });
  if (packet.kind === "refused") {
    if (packet.reason === "role_outside_ceiling" || packet.reason === "session_outside_ceiling") return { refused: packet.reason };
    throw new TypeError(`module.review_map@1 refused its own review timing: ${packet.reason}`);
  }
  return { admitted: new Set(packet.facts.map((fact) => fact.evidence)) };
}

const withheld = (reason: ReviewModuleRefusal): string => reviewText("evidence.module.withheld", { reason: reviewText(MODULE_REFUSAL_TEMPLATES[reason]) });

const SAN_GLYPH = /[?!]|\$\d/u;
const MOMENT_KIND_TEMPLATES: Readonly<Record<StoryMomentKind, ReviewTemplateId>> = Object.freeze({
  irreversibility: "kind.irreversibility",
  phase_change: "kind.phase_change",
  human_divergence: "kind.human_divergence",
  option_collapse: "kind.option_collapse",
  eval_pivot: "kind.eval_pivot",
  mate_transition: "kind.mate_transition",
  last_level: "kind.last_level",
  endgame_entry: "kind.endgame_entry",
  shape_span: "kind.shape_span",
  outcome: "kind.outcome",
});
const GRADE_ABSTENTIONS: Readonly<Record<string, ReviewTemplateId>> = Object.freeze({
  source_pending: "grade.abstention.source_pending",
  missing_eval: "grade.abstention.missing_eval",
  input_abstained: "grade.abstention.input_abstained",
  unequal_instrument: "grade.abstention.unequal_instrument",
  mate_score_inconsistent: "grade.abstention.mate_score_inconsistent",
});

/** Recorded chess numbering, independent of the rehearsal's root-relative ply counter. */
export function reviewMoveNumber(fen: string, afterMove = false): number {
  const setup = parseFen(fen).unwrap();
  // Black's recorded move increments the fullmove counter in its resulting position.
  const number = setup.fullmoves - (afterMove && setup.turn === "white" ? 1 : 0);
  if (number < 1) throw new TypeError("Review move has no valid recorded fullmove number");
  return number;
}
/** The side to move in a FEN. */
const sideToMoveOf = (fen: string): GradeSide => fen.split(" ")[1] === "b" ? "black" : "white";
const sideOfMove = (parentFen: string): GradeSide => sideToMoveOf(parentFen);
const sideLabel = (side: GradeSide): string => reviewText(side === "white" ? "side.white" : "side.black");

/**
 * The single whole-game selector (§5): walks the story rank (its declared convention: fixed kind
 * priority, recorded-evaluation delta as tie break — presentation prominence, not significance) and
 * keeps the first moment of each represented phase until the budget is spent, then restores game
 * order. Moments without a rendered fact are not eligible. Zero is a valid, rendered outcome.
 */
export function selectReviewMoments(story: Pick<StoryProjection, "moments" | "rank">): ReviewMomentSelection {
  const byId = new Map(story.moments.map((moment) => [moment.nodeId, moment]));
  const eligible = story.rank.flatMap((nodeId) => {
    const moment = byId.get(nodeId);
    return moment !== undefined && moment.sentences.length > 0 ? [moment] : [];
  });
  const byPhase = new Map<DetectedPhase, StoryMoment>();
  for (const moment of eligible) {
    if (byPhase.size >= REVIEW_MOMENT_BUDGET) break;
    if (!byPhase.has(moment.phase)) byPhase.set(moment.phase, moment);
  }
  const moments = Object.freeze([...byPhase.values()].sort((left, right) => left.ply - right.ply || left.nodeId.localeCompare(right.nodeId)));
  return Object.freeze({ moments, considered: eligible.length });
}

/** A White-perspective recorded score as text: `+0.35`, `−1.20`, or a mate count naming the side. */
export function reviewScoreText(reading: RecordedEngineAvailable): string {
  return reading.score.kind === "centipawns"
    ? `${reading.score.value >= 0 ? "+" : "−"}${(Math.abs(reading.score.value) / 100).toFixed(2)}`
    : reviewText("evidence.eval.mate", { moves: reading.score.distance, side: sideLabel(reading.score.side) });
}

/** The search bound a recorded reading was requested under, as `, 100 ms` / `, depth 18` / nothing. */
export function reviewLimitText(reading: RecordedEngineAvailable): string {
  const bound = reading.bound;
  return bound.kind === "depth" ? `, requested depth ${bound.requestedDepth}` : bound.kind === "movetime" ? `, requested ${bound.requestedMs} ms` : `, requested ${bound.requestedNodes} nodes`;
}

function evaluationSentence(reading: RecordedEngineAvailable | undefined): string {
  if (reading === undefined) return reviewText("evidence.eval.missing");
  return reviewText("evidence.eval", { score: reviewScoreText(reading), engine: reading.engineId, limit: reviewLimitText(reading) });
}

/**
 * The eval graph (§6): one point per ply over the durable evaluations, with the accuracy figure's
 * coverage gate — a position counts as evaluated only when its recorded packet reads as a grade
 * operand. Where readings are missing the graph abstains over that stretch and says so.
 */
function evalGraphFor(rows: readonly ReviewMapRow[], readings: ReadonlyMap<string, RecordedEngineAvailable>, evaluatedPairs: ReadonlySet<string>, side: GradeSide): ReviewEvalGraph {
  const label = sideLabel(side);
  const instruments = new Set<string>();
  const points = rows.map((row, index): ReviewEvalPoint => {
    const reading = readings.get(row.nodeId);
    if (reading === undefined) return Object.freeze({ nodeId: row.nodeId, ply: row.ply, kind: "missing" as const, sentence: reviewText("graph.point.missing", { move: row.label }) });
    instruments.add(`${reading.engineId}${reviewLimitText(reading)}`);
    const percent = Math.round(recordedGradeScore(reading, side).winPercent * 10) / 10;
    return Object.freeze({
      nodeId: row.nodeId, ply: row.ply, kind: "evaluated" as const, percent,
      joinFromPrevious: index > 0 && evaluatedPairs.has(row.nodeId) && readings.has(rows[index - 1]!.nodeId),
      sentence: reviewText("graph.point", { move: row.label, score: reviewScoreText(reading), percent: percent.toFixed(1), side: label }),
    });
  });
  const gaps: ReviewEvalGap[] = [];
  for (let index = 0; index < points.length; index += 1) {
    if (points[index]!.kind !== "missing") continue;
    let end = index;
    while (end + 1 < points.length && points[end + 1]!.kind === "missing") end += 1;
    const first = rows[index]!;
    const last = rows[end]!;
    gaps.push(Object.freeze({
      fromPly: first.ply, toPly: last.ply,
      sentence: index === end ? reviewText("graph.gap.one", { move: first.label }) : reviewText("graph.gap", { from: first.label, to: last.label }),
    }));
    index = end;
  }
  const evaluated = points.filter((point) => point.kind === "evaluated").length;
  const kind = evaluated === 0 ? "abstained" as const : evaluated === points.length ? "complete" as const : "partial" as const;
  return Object.freeze({
    kind, side, points: Object.freeze(points), gaps: Object.freeze(gaps), evaluated,
    caption: kind === "abstained" ? reviewText("graph.none") : reviewText("graph.caption", { engines: [...instruments].join("; "), convention: GRADE_CONVENTION_LABEL, side: label }),
    coverage: reviewText("graph.coverage", { evaluated, plies: points.length }),
  });
}

function compareDoorsFor(divergent: readonly Divergence[], reviewedBranchId: string): readonly ReviewCompareDoor[] {
  const byEntry = new Map<string, string[]>();
  for (const line of divergent) if (line.ownNodeIds.length > 0) byEntry.set(line.entryNodeId, [...(byEntry.get(line.entryNodeId) ?? []), line.branchId]);
  return Object.freeze([...byEntry].map(([entryNodeId, others]) => {
    const offered = others.slice(0, REVIEW_COMPARE_LIMIT - 1);
    return Object.freeze({ entryNodeId, branchIds: Object.freeze([reviewedBranchId, ...offered]), omitted: others.length - offered.length });
  }));
}

interface Decision {
  readonly grade?: MoveQualityGrade;
  readonly evidence?: DeclaredEvidence<MoveQualityGrade>;
  readonly abstention?: string;
  /** The Review Map module refused the minted grade for this viewer. */
  readonly withheld?: ReviewModuleRefusal;
  /** The mover's win-point drop, clamped at zero, when the decision is evaluated. */
  readonly drop?: number;
}

function decide(viewer: ReviewMapInput["viewer"], recordedGrade: RecordedGradeSource): Decision {
  const source = readRecordedGradeSource(recordedGrade);
  const graded = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade });
  if (graded.kind === "unavailable") return { abstention: graded.reason };
  if (source.state.kind !== "available") throw new TypeError("Grade result lost its original comparable pair");
  const drop = Math.max(0, recordedGradeScore(source.state.before, source.mover).winPercent - recordedGradeScore(source.state.after, source.mover).winPercent);
  const evidence = graded.value[0] as DeclaredEvidence<MoveQualityGrade> | undefined;
  if (evidence === undefined) return { drop };
  // rfc/move-quality-grades.md D1: the grade reaches this surface only through module.review_map@1.
  const admission = admitForReview(viewer, [evidence]);
  if ("refused" in admission) return { drop, withheld: admission.refused };
  return admission.admitted.has(evidence) ? { drop, grade: evidence.payload, evidence } : { drop, withheld: "not_admitted" };
}

function accuracyFor(side: GradeSide, decisions: readonly Decision[]): ReviewAccuracy {
  const label = sideLabel(side);
  if (decisions.length === 0) return Object.freeze({ side, kind: "no_decisions" as const, decisions: 0 as const, evaluated: 0 as const, sentence: reviewText("accuracy.no_decisions", { side: label }) });
  const drops = decisions.flatMap((decision) => decision.drop === undefined ? [] : [decision.drop]);
  if (drops.length !== decisions.length) {
    return Object.freeze({ side, kind: "abstained" as const, decisions: decisions.length, evaluated: drops.length, sentence: reviewText("accuracy.abstained", { side: label, evaluated: drops.length, decisions: decisions.length }) });
  }
  const value = Math.round((100 - drops.reduce((sum, drop) => sum + drop, 0) / drops.length) * 10) / 10;
  return Object.freeze({
    side, kind: "rendered" as const, value, decisions: decisions.length, evaluated: drops.length,
    sentence: reviewText("accuracy.rendered", { side: label, value: value.toFixed(1), convention: GRADE_CONVENTION_LABEL, decisions: decisions.length }),
  });
}

/** The packet projections the Review Map panel admits through `module.review_map@1`. */
const REVIEW_PANEL_PROJECTIONS: ReadonlySet<string> = new Set(["derived.review.eval_point@1", "derived.review.eval_delta@2", "derived.review.mate_transition@2", "derived.review.wdl_point@1"]);
type RecordedRelation = Readonly<{ evidence: DeclaredEvidence<unknown>; nodeId: string }>;
interface RecordedRelations {
  readonly events: readonly RecordedRelation[];
  readonly exposures: ReadonlyMap<string, ReturnType<typeof localDefenderExposure>>;
}
const recordedRelations = new WeakMap<DrillRun, Map<string, RecordedRelations>>();

function collectRelations(run: DrillRun, branchId: string, routes: readonly RecordedWindowRoute[]): RecordedRelations {
  // Only the immutable original run from a validated GradeSource enters this memo. No permission,
  // admission, rendered card or mutable storage object is retained; current checks still precede it.
  const key = JSON.stringify([branchId, routes]), previous = recordedRelations.get(run)?.get(key);
  if (previous !== undefined) return previous;
  const path = branchPath(run, branchId);
  const sequences = prepareRecordedSemanticBranchWindows({ run, branchId,
    throughNodeIds: path.slice(1).map(node => node.id), routes });
  const exposures = new Map<string, ReturnType<typeof localDefenderExposure>>();
  const events = Object.freeze(path.slice(1).flatMap((node, index) => {
    const collected = collectPostcommitEdge(path[index]!, node);
    exposures.set(node.id, localDefenderExposure(collected.closure));
    const edge = collected.evidence.map(evidence => Object.freeze({ evidence, nodeId: node.id }));
    const phase = invokeEvidenceValueRoute("rules.phase.reading@2", { fen: node.fen });
    const setups = ENDGAME_SETUP_CONVENTIONS.flatMap(convention => {
      const result = invokeEvidenceValueRoute("theory.endgame.setup_match@1", { fen: node.fen, convention: { id: convention.id, version: convention.version } });
      if (result.kind === "unavailable") throw new TypeError("Review setup convention is unavailable");
      return result.kind === "available" ? [{ evidence: result.value, nodeId: node.id }] : [];
    });
    return [...edge, { evidence: phase, nodeId: node.id }, ...setups, ...routes.flatMap(route => sequences.get(node.id)!.get(route)!.windows.flatMap(window =>
      collectRecordedSequenceWindow(window).map(evidence => Object.freeze({ evidence, nodeId: node.id }))))];
  }));
  const result = Object.freeze({ events, exposures });
  const byBranch = recordedRelations.get(run) ?? new Map<string, RecordedRelations>();
  byBranch.set(key, result); recordedRelations.set(run, byBranch); return result;
}

/**
 * The typed packet at one move, through the module registry: admission by `module.review_map@1`
 * (exact consumer, role, session), then the registered pair-keyed presentation adapters. Engine
 * families with no admitted item state their absence with a packet-issued abstention component.
 */
function packetComponents(viewer: ReviewMapInput["viewer"], packet: ReviewEvidencePacket, nodeId: string, projections = REVIEW_PANEL_PROJECTIONS): readonly PresentedEvidenceItem[] | { readonly refused: ReviewModuleRefusal } {
  const node = packet.nodes.find((candidate) => candidate.nodeId === nodeId);
  if (node === undefined) return Object.freeze([]);
  const offered = node.items.filter((item) => projections.has(`${item.projection.id}@${item.projection.version}`));
  const admission = admitForReview(viewer, offered);
  if ("refused" in admission) return admission;
  const admitted = offered.filter((item) => admission.admitted.has(item));
  const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 2 }, admitted));
  return Object.freeze([...presented, ...presentReviewFamilyAbstentions(packet, nodeId, ["engine_eval", "engine_wdl"])]);
}

/** Builds the whole Review Map projection for one recorded branch. Pure and recomputed on every read. */
export function reviewMapProjection(input: ReviewMapInput): ReviewMapProjection {
  const execution = compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 2 });
  if (input.packet !== undefined) {
    assertReviewEvidencePacket(input.packet);
    if (input.packet.subject.runId !== input.run.id || input.packet.subject.branchId !== input.branchId) throw new TypeError("Review Map packet belongs to another run or branch");
  }
  const path = branchPath(input.run, input.branchId);
  if (input.recordedGrades.size !== path.length - 1) throw new TypeError("Review requires the complete original move-source population");
  const readings = new Map<string, RecordedEngineAvailable>(), operands = new Map<string, DeclaredEvidence<unknown>>();
  const runDigest = evidenceDigest(input.run);
  const measurements = readRecordedReviewLedgerSource(input.recordedMeasurements);
  if (measurements.boundary.request.branchId !== input.branchId || evidenceDigest(measurements.boundary.run) !== runDigest
    || measurements.permission.role !== input.viewer.role || measurements.permission.session !== input.viewer.session
    || input.context !== (measurements.boundary.run.sessionKind === "imported" ? "imported_analysis" : "review")) throw new TypeError("Review ledger source crosses its actual run, branch or viewer");
  const sources = input.recordedSources === undefined ? undefined : readRecordedReviewSourcePopulation(input.recordedSources);
  if (sources !== undefined && (sources.boundary.request.branchId !== input.branchId || sources.boundary.run !== measurements.boundary.run)) throw new TypeError("Review source population crosses its actual run or branch");
  const originalRun = measurements.boundary.run;
  const objectives = input.recordedObjectives;
  assertRecordedReviewResultInvocation(objectives.items, "run.record.objective_transition@2", objectives.boundary);
  const objectiveBoundary = readRecordedReviewBoundary(objectives.boundary);
  if (objectiveBoundary !== measurements.boundary) throw new TypeError("Review objectives cross their actual source owner, original boundary or endpoint");
  for (const [index, node] of path.slice(1).entries()) {
    const handle = input.recordedGrades.get(node.id);
    if (handle === undefined) throw new TypeError("Review is missing an original move source");
    const source = readRecordedGradeSource(handle), permission = source.authority.permission;
    if (source.edge.payload.beforeNodeId !== path[index]!.id || source.edge.payload.afterNodeId !== node.id
      || source.context !== input.context || permission.role !== input.viewer.role || permission.session !== input.viewer.session
      || permission.execution.consumer.id !== "module.review_map" || permission.execution.consumer.version !== 2
      || source.before.boundary.request.branchId !== input.branchId || source.before.boundary.run !== originalRun) throw new TypeError("Review source crosses its actual run, branch, edge or viewer");
    for (const endpoint of [source.before, source.after]) {
      if (endpoint.selected === null || endpoint.selectedOperand === null) continue;
      const id = endpoint.row.position.payload.nodeId, previous = operands.get(id);
      if (previous !== undefined && previous !== endpoint.selectedOperand) throw new TypeError("Review changed a fixed node selection between adjacent edges");
      operands.set(id, endpoint.selectedOperand); readings.set(id, endpoint.selected);
    }
  }
  const endpointAdmission = admitForReview(input.viewer, [...operands.values()]);
  for (const [nodeId, operand] of operands) if (!("admitted" in endpointAdmission) || !endpointAdmission.admitted.has(operand)) readings.delete(nodeId);
  const evaluatedPairs = new Set<string>();
  const selection = selectReviewMoments(input.story);
  const selected = new Set(selection.moments.map((moment) => moment.nodeId));
  const notesByNode = new Map<string, string[]>();
  for (const moment of input.story.moments) notesByNode.set(moment.nodeId, [...(notesByNode.get(moment.nodeId) ?? []), ...moment.sentences]);
  const sequenceRoutes = execution.bindings.map(({ binding }) => `${binding.projection.id}@${binding.projection.version}`)
    .filter((route): route is RecordedWindowRoute => route === "derived.exchange.trade_completed@2" || Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, route));
  if (sequenceRoutes.length !== 11) throw new TypeError("Review lost its complete eleven-family recorded sequence image");
  // Current recorded sources, not predecessor @2 events filtered against a successor accept list.
  // Validate the full original graph first; every observed window ends at its own actual node.
  const recorded = path.length === 1 ? undefined : collectRelations(originalRun, input.branchId, sequenceRoutes);
  const events = [...(recorded?.events ?? []),
    ...objectives.items.map(item => ({ evidence: item.evidence, nodeId: item.nodeId })),
    ...(sources?.results.flatMap(result => result.items.map(evidence => ({ evidence, nodeId: result.slot.nodeId }))) ?? []),
    ...measurements.rows.slice(1).flatMap(row => row.slots.flatMap(slot => (slot.data?.readings ?? []).map(evidence => ({ evidence, nodeId: row.position.payload.nodeId }))))];
  const ledgerNotices = new Map(measurements.rows.slice(1).map(row => [row.position.payload.nodeId, row.slots.flatMap(slot => {
    const source = reviewText(slot.projection === "recorded.engine.eval@1" ? "evidence.recorded.engine" : "evidence.recorded.tablebase");
    if (slot.outcome.kind === "failed") return [reviewText(slot.outcome.reason === "source_contract_invalid" ? "evidence.recorded.invalid" : "evidence.recorded.lookup_failed", { source })];
    if (slot.data === null) return [];
    const refused = slot.data.counts.notAdmittedRecords, abstained = Object.values(slot.data.counts.abstentions).reduce((sum, n) => sum + n, 0);
    return refused + abstained === 0 ? [] : [reviewText("evidence.recorded.partial", { source, refused, abstained })];
  })]));
  if (input.opening?.kind === "available") {
    const history = collectRecordedOpeningHistory({ source: input.opening.source, run: originalRun,
      branchId: input.branchId, throughNodeId: path.at(-1)!.id });
    events.push(...invokeEvidenceValueRoute("derived.opening.deepest_reached@2", { history }).map(item => ({ evidence: item.evidence, nodeId: item.nodeId })));
  }
  const relationsByNode = new Map<string, readonly PresentedEvidenceItem[]>();
  const exposureOccurrences = new Map<string, ReviewExposureOccurrence[]>();
  const relationLabels = new Set<string>();
  const relationAdmission = admitForReview(input.viewer, events.map(event => event.evidence));
  if ("admitted" in relationAdmission) {
    const admitted = events.filter(event => relationAdmission.admitted.has(event.evidence));
    // module-registration A5: each admitted recorded-path event renders through its registered
    // module.review_map@1 adapter — a labelled relation, never a raw projection id.
    admitted.forEach((event) => {
      // One event may own several components. Keep the whole composition with its end node;
      // indexing a flattened component array by event index crosses those ownership boundaries.
      const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 2 }, [event.evidence]));
      if (event.evidence.projection.id === "derived.tactic.defender_exposure" && event.evidence.projection.version === 2) {
        const factoryOrdinal = recorded?.exposures.get(event.nodeId)?.events.findIndex(wrapper => wrapper.evidence === event.evidence) ?? -1;
        if (factoryOrdinal < 0 || presented.length !== 1) throw new TypeError("Review defender exposure lacks its original occurrence");
        const occurrences = exposureOccurrences.get(event.nodeId) ?? [];
        occurrences.push(Object.freeze({ componentDigest: presented[0]!.componentDigest, factoryOrdinal }));
        exposureOccurrences.set(event.nodeId, occurrences);
      }
      const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(projection => projection.id === event.evidence.projection.id && projection.version === event.evidence.projection.version)!;
      relationLabels.add(evidenceGroundingLabel(declaration.grounding));
      relationsByNode.set(event.nodeId, Object.freeze([...(relationsByNode.get(event.nodeId) ?? []), ...presented]));
    });
  }
  const decisions: Record<GradeSide, Decision[]> = { white: [], black: [] };
  let graded = false;
  const rows = path.slice(1).map((node, index) => {
    const parent = path[index]!;
    const san = node.moveSan;
    if (san === null || node.moveUci === null) throw new TypeError(`Review Map node ${node.id} has no recorded move`);
    // Third-party annotation glyphs never reach this surface: SAN is regenerated from the legal move.
    if (SAN_GLYPH.test(san)) throw new TypeError(`Review Map SAN ${san} carries an annotation glyph`);
    const side = sideOfMove(parent.fen);
    const moveNumber = reviewMoveNumber(parent.fen);
    const decision = decide(input.viewer, input.recordedGrades.get(node.id)!);
    if (decision.drop !== undefined && readings.has(parent.id) && readings.has(node.id)) evaluatedPairs.add(node.id);
    decisions[side].push(decision);
    const grade = decision.grade === undefined ? undefined : (() => {
      const sentence = renderMoveQualityGrade(decision.grade!);
      assertMoveQualityGradeSentence(decision.grade!, sentence);
      graded = true;
      return Object.freeze({ klass: decision.grade!.klass, sentence });
    })();
    const gradeFact = grade?.sentence ?? (decision.withheld !== undefined
      ? withheld(decision.withheld)
      : decision.abstention === undefined
        ? reviewText("evidence.grade.none")
        : reviewText("evidence.grade.abstained", { reason: reviewText(GRADE_ABSTENTIONS[decision.abstention] ?? "grade.abstention.input_abstained") }));
    const relationFacts = "refused" in relationAdmission
          ? [withheld(relationAdmission.refused)]
          : relationsByNode.has(node.id) ? [] : [reviewText("evidence.relation.none")];
    // The current captured source population owns these point/transition/pivotal operands. The
    // unchanged Story packet remains only the local engine-family abstention source here.
    const packetItems = input.packet === undefined ? undefined : packetComponents(input.viewer, input.packet, node.id,
      sources === undefined ? REVIEW_PANEL_PROJECTIONS : new Set(["derived.review.wdl_point@1"]));
    const packetPresented = packetItems === undefined || "refused" in packetItems ? Object.freeze([]) : packetItems;
    const packetFacts = packetItems === undefined
      ? [reviewText("evidence.packet.absent")]
      : "refused" in packetItems ? [withheld(packetItems.refused)] : [];
    const gradePresented = decision.evidence === undefined ? [] : presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 2 }, [decision.evidence]));
    const presented = Object.freeze([...gradePresented, ...(relationsByNode.get(node.id) ?? []), ...packetPresented]);
    const defenderExposure: ReviewExposureState = (() => {
      if ("refused" in relationAdmission) return Object.freeze({ kind: "withheld" });
      const exposure = recorded?.exposures.get(node.id)?.result;
      if (exposure === undefined) throw new TypeError("Review defender exposure lacks its original source result");
      if (exposure.kind === "unavailable") {
        if (exposure.reason !== "invalid_turn_clone") throw new TypeError("Review defender exposure has an unknown source refusal");
        return Object.freeze({ kind: "unavailable", reason: exposure.reason });
      }
      const occurrences = exposureOccurrences.get(node.id) ?? [];
      if (occurrences.length !== exposure.value.length || new Set(occurrences.map(item => item.factoryOrdinal)).size !== occurrences.length) {
        throw new TypeError("Review defender exposure failed to present its complete occurrence population");
      }
      return occurrences.length === 0 ? Object.freeze({ kind: "quiet" })
        : Object.freeze({ kind: "available", occurrences: Object.freeze(occurrences) });
    })();
    const facts = Object.freeze([
      ...(grade === undefined ? [gradeFact] : []),
      evaluationSentence(readings.get(node.id)),
      ...(notesByNode.get(node.id) ?? []),
      ...relationFacts,
      ...packetFacts,
      ...(ledgerNotices.get(node.id) ?? []),
      ...presented.map(presentedSentence),
    ]);
    return Object.freeze({
      nodeId: node.id, entryNodeId: parent.id, ply: node.ply, moveNumber, side, san,
      label: reviewText(side === "white" ? "moves.row.white" : "moves.row.black", { number: moveNumber, san }),
      fen: node.fen, moveUci: node.moveUci, moment: selected.has(node.id),
      ...(grade === undefined ? {} : { grade }),
      facts,
      defenderExposure,
      packet: serializePresentedEvidence(presented),
    });
  });
  const summary = reviewMomentPresentation(selection);
  const moments = summary.moments;
  const evaluated = readings.size;
  // The footer names the grounding of every admitted item class actually on the surface ([[D687]]).
  const footerLabels = [...new Set([
    evidenceGroundingLabel("recorded_run"),
    ...(graded || evaluated > 0 ? [evidenceGroundingLabel("bounded_search")] : []),
    ...moments.flatMap((moment) => moment.sourceLabels),
    ...relationLabels,
  ])];
  const graph = evalGraphFor(rows, readings, evaluatedPairs, input.side ?? input.run.start.side);
  const evalGraph = "refused" in endpointAdmission
    ? Object.freeze({ ...graph, caption: reviewText("graph.module.withheld", { reason: reviewText(MODULE_REFUSAL_TEMPLATES[endpointAdmission.refused]) }) })
    : graph;
  readRecordedReviewLedgerSource(input.recordedMeasurements);
  return Object.freeze({
    convention: REVIEW_MAP_CONVENTION,
    context: input.context,
    rows: Object.freeze(rows),
    moments,
    momentsSentence: summary.momentsSentence,
    considered: selection.considered,
    accuracy: Object.freeze({ white: accuracyFor("white", decisions.white), black: accuracyFor("black", decisions.black) }),
    coverage: Object.freeze({ evaluated, positions: path.length, sentence: reviewText("header.coverage", { evaluated, positions: path.length }) }),
    footer: Object.freeze({ labels: Object.freeze(footerLabels), sentence: reviewText("footer.sources", { labels: footerLabels.join(" · ") }) }),
    evalGraph,
    compareDoors: compareDoorsFor(divergences(input.run, path, input.branchId), input.branchId),
    openRetryEntryNodeId: openRetryEntry(input.run, input.branchId),
  });
}

/** The common selected-moment presentation, also used by the narrower public Story card.
 * No private move-grade/graph/sequence acquisition is needed to format these retained moments. */
export function reviewMomentPresentation(selection: ReviewMomentSelection) {
  const moments = Object.freeze(selection.moments.map((moment) => {
    const labels = storyEvidenceSourceLabels(moment);
    const kinds = moment.kinds.map((kind) => reviewText(MOMENT_KIND_TEMPLATES[kind]));
    const heading = kinds.length <= 1 ? kinds[0] ?? reviewText("moves.row.moment") : reviewText("kind.join", { first: kinds[0]!, rest: kinds.slice(1).join(" + ") });
    const number = reviewMoveNumber(moment.fen, moment.san !== null);
    return Object.freeze({
      nodeId: moment.nodeId, entryNodeId: moment.entryNodeId, ply: moment.ply, san: moment.san, fen: moment.fen,
      phase: moment.phase, kinds: moment.kinds, heading,
      moveLabel: moment.san === null ? reviewText("moment.move", { number }) : reviewText("moment.move.san", { number, san: moment.san }),
      sentences: moment.sentences, sourceLabels: labels,
      sourcesSentence: reviewText("moment.sources", { labels: labels.join(" · ") }),
    });
  }));
  const labels = Object.freeze([...new Set([evidenceGroundingLabel("recorded_run"), ...moments.flatMap(moment => moment.sourceLabels)])]);
  return Object.freeze({
    moments,
    momentsSentence: moments.length === 0 ? reviewText("moments.none") : reviewText("moments.caption", { considered: selection.considered }),
    considered: selection.considered,
    footer: Object.freeze({ labels, sentence: reviewText("footer.sources", { labels: labels.join(" · ") }) }),
  });
}
