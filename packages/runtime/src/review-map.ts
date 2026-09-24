// rfc/review-map.md: the learner-facing whole-game Review Map projection. It is a pure, recomputed
// read over one recorded branch: nothing here is persisted (§3 rule 3, criterion 14). It selects,
// orders and renders; it does not grade (the `derived.grade.move_quality@1` producer does), it does
// not detect (story.ts and the recorded-semantic-path compiler do) and it names no best move, no
// principal variation and no praise class (§7).

import { branchPath } from "./branch-path.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, type DeclaredEvidence, type EvidenceRole } from "./evidence-contract.js";
import { compileModulePacket } from "./module-packets.js";
import { GRADE_CONVENTION, assertMoveQualityGradeSentence, renderMoveQualityGrade, type GradeContext, type GradeEvaluation, type GradeSide, type MoveQualityClass, type MoveQualityGrade } from "./grade.js";
import { gradeReadingFromPayload, moverWinPercent } from "./grade-reading.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { DetectedPhase } from "./phase.js";
import type { RecordedSemanticPathResult } from "./recorded-semantic-path.js";
import { reviewText, type ReviewTemplateId } from "./review-map-templates.js";
import { presentEvidenceItems, presentedSentence, serializePresentedEvidence, type PresentationReceipt, type PresentedEvidenceItem } from "./presentation-contract.js";
import { assertReviewEvidencePacket, presentReviewFamilyAbstentions, type ReviewEvidencePacket } from "./review-evidence.js";
import { evidenceGroundingLabel, storyEvidenceSourceLabels, type StoryMoment, type StoryMomentKind, type StoryProjection } from "./story.js";
import type { DrillRun, EvidencePayload, Node } from "./types.js";

/** The declared moment budget (O7.1 recommendation on file): up to three, no minimum. */
export const REVIEW_MOMENT_BUDGET = 3;
export const REVIEW_MAP_CONVENTION = Object.freeze({ id: "review-map" as const, version: 1 as const, momentBudget: REVIEW_MOMENT_BUDGET });

export type ReviewMapContext = Extract<GradeContext, "review" | "imported_analysis">;

export interface ReviewMapGrade {
  readonly klass: MoveQualityClass;
  /** The complete grounding sentence: both evaluations, the drop, the threshold and the convention. */
  readonly sentence: string;
}

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
 * read through the same `gradeReadingFromPayload` gate accuracy uses. Recorded evaluations are
 * White-perspective; `percent` is the reviewed side's win-points through the shipped logistic.
 */
export type ReviewEvalPoint =
  | { readonly nodeId: string; readonly ply: number; readonly kind: "evaluated"; readonly percent: number; readonly sentence: string }
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
  missing_eval: "grade.abstention.missing_eval",
  input_abstained: "grade.abstention.input_abstained",
  unequal_instrument: "grade.abstention.unequal_instrument",
  mate_score_inconsistent: "grade.abstention.mate_score_inconsistent",
});

const moveNumberOf = (ply: number): number => Math.max(1, Math.ceil(ply / 2));
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

/** The latest recorded engine evaluation packet attached to one node, as a closed packet. */
function evaluationPacket(run: DrillRun, node: Node): EvidencePayload | undefined {
  const event = [...run.events].reverse().find((candidate) =>
    candidate.type === "evidence.attached" && candidate.data.nodeId === node.id &&
    candidate.data.payload.kind === "eval" && candidate.data.payload.source === "engine_validated");
  if (event?.type !== "evidence.attached") return undefined;
  const { kind, source, values } = event.data.payload;
  return Object.freeze({ kind, source, values });
}

/** A White-perspective recorded score as text: `+0.35`, `−1.20`, or a mate count naming the side. */
export function reviewScoreText(reading: GradeEvaluation): string {
  return reading.score.kind === "cp"
    ? `${reading.score.value >= 0 ? "+" : "−"}${(Math.abs(reading.score.value) / 100).toFixed(2)}`
    : reviewText("evidence.eval.mate", { moves: Math.abs(reading.score.movesTo), side: reading.score.movesTo > 0 ? sideLabel("white") : sideLabel("black") });
}

/** The search bound a recorded reading was requested under, as `, 100 ms` / `, depth 18` / nothing. */
export function reviewLimitText(reading: { readonly requestedMovetimeMs?: number; readonly depth?: number }): string {
  return reading.requestedMovetimeMs !== undefined ? `, ${reading.requestedMovetimeMs} ms` : reading.depth !== undefined ? `, depth ${reading.depth}` : "";
}

function readingAt(packet: EvidencePayload | undefined, fen: string): GradeEvaluation | undefined {
  if (packet === undefined) return undefined;
  const reading = gradeReadingFromPayload(packet, sideToMoveOf(fen));
  return "abstained" in reading ? undefined : reading;
}

function evaluationSentence(viewer: ReviewMapInput["viewer"], packet: EvidencePayload | undefined, sideToMove: GradeSide): string {
  if (packet !== undefined) {
    const sealed = invokeEvidenceValueRoute("live.stockfish.eval@1", { packet });
    const admission = admitForReview(viewer, [sealed]);
    if ("refused" in admission) return withheld(admission.refused);
    if (!admission.admitted.has(sealed)) return withheld("not_admitted");
  }
  const reading = packet === undefined ? undefined : gradeReadingFromPayload(packet, sideToMove);
  if (reading === undefined || "abstained" in reading) return reviewText("evidence.eval.missing");
  return reviewText("evidence.eval", { score: reviewScoreText(reading), engine: reading.engineId, limit: reviewLimitText(reading) });
}

/**
 * The eval graph (§6): one point per ply over the durable evaluations, with the accuracy figure's
 * coverage gate — a position counts as evaluated only when its recorded packet reads as a grade
 * operand. Where readings are missing the graph abstains over that stretch and says so.
 */
function evalGraphFor(rows: readonly ReviewMapRow[], nodes: ReadonlyMap<string, Node>, packets: ReadonlyMap<string, EvidencePayload | undefined>, side: GradeSide): ReviewEvalGraph {
  const label = sideLabel(side);
  const instruments = new Set<string>();
  const points = rows.map((row): ReviewEvalPoint => {
    const reading = readingAt(packets.get(row.nodeId), nodes.get(row.nodeId)!.fen);
    if (reading === undefined) return Object.freeze({ nodeId: row.nodeId, ply: row.ply, kind: "missing" as const, sentence: reviewText("graph.point.missing", { move: row.label }) });
    instruments.add(`${reading.engineId}${reviewLimitText(reading)}`);
    const percent = Math.round(moverWinPercent(reading, side) * 10) / 10;
    return Object.freeze({
      nodeId: row.nodeId, ply: row.ply, kind: "evaluated" as const, percent,
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
    caption: kind === "abstained" ? reviewText("graph.none") : reviewText("graph.caption", { engines: [...instruments].join("; "), convention: `${GRADE_CONVENTION.id}@${GRADE_CONVENTION.version}`, side: label }),
    coverage: reviewText("graph.coverage", { evaluated, plies: points.length }),
  });
}

/** Where one other recorded line leaves the reviewed line, and the moves of its own it carries. */
interface Divergence {
  readonly branchId: string;
  readonly entryNodeId: string;
  readonly ownNodeIds: readonly string[];
}

function divergences(run: DrillRun, reviewed: readonly Node[], reviewedBranchId: string): readonly Divergence[] {
  const out: Divergence[] = [];
  for (const branch of run.branches) {
    if (branch.id === reviewedBranchId) continue;
    let path: readonly Node[];
    try { path = branchPath(run, branch.id); } catch { continue; }
    let common = -1;
    while (common + 1 < path.length && common + 1 < reviewed.length && path[common + 1]!.id === reviewed[common + 1]!.id) common += 1;
    if (common < 0) continue;
    out.push(Object.freeze({ branchId: branch.id, entryNodeId: reviewed[common]!.id, ownNodeIds: Object.freeze(path.slice(common + 1).map((node) => node.id)) }));
  }
  return out;
}

function compareDoorsFor(divergent: readonly Divergence[], reviewedBranchId: string): readonly ReviewCompareDoor[] {
  const byEntry = new Map<string, string[]>();
  for (const line of divergent) if (line.ownNodeIds.length > 0) byEntry.set(line.entryNodeId, [...(byEntry.get(line.entryNodeId) ?? []), line.branchId]);
  return Object.freeze([...byEntry].map(([entryNodeId, others]) => {
    const offered = others.slice(0, REVIEW_COMPARE_LIMIT - 1);
    return Object.freeze({ entryNodeId, branchIds: Object.freeze([reviewedBranchId, ...offered]), omitted: others.length - offered.length });
  }));
}

/**
 * O7.3's "verdict hidden during retry": the run's active line is a retry from a reviewed position
 * when it leaves the reviewed line there and has reached no outcome. Returns that position, or null.
 */
export function openRetryEntry(run: DrillRun, reviewedBranchId: string): string | null {
  const cursor = run.activeCursor.branchId;
  if (cursor === reviewedBranchId) return null;
  const line = divergences(run, branchPath(run, reviewedBranchId), reviewedBranchId).find((candidate) => candidate.branchId === cursor);
  if (line === undefined) return null;
  const own = new Set(line.ownNodeIds);
  const finished = run.events.some((event) => event.type === "outcome.reached" && own.has(event.data.nodeId));
  return finished ? null : line.entryNodeId;
}

interface Decision {
  readonly grade?: MoveQualityGrade;
  readonly abstention?: string;
  /** The Review Map module refused the minted grade for this viewer. */
  readonly withheld?: ReviewModuleRefusal;
  /** The mover's win-point drop, clamped at zero, when the decision is evaluated. */
  readonly drop?: number;
}

function decide(viewer: ReviewMapInput["viewer"], context: ReviewMapContext, mover: GradeSide, before: EvidencePayload | undefined, after: EvidencePayload | undefined): Decision {
  if (before === undefined || after === undefined) return { abstention: "missing_eval" };
  const sealedBefore = invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: before });
  const sealedAfter = invokeEvidenceValueRoute("live.stockfish.eval@1", { packet: after });
  const graded = invokeEvidenceValueRoute("derived.grade.move_quality@1", { before: sealedBefore, after: sealedAfter, mover, context });
  if (graded.kind === "unavailable") return { abstention: graded.reason };
  const readingBefore = gradeReadingFromPayload(before, mover);
  const readingAfter = gradeReadingFromPayload(after, mover === "white" ? "black" : "white");
  if ("abstained" in readingBefore || "abstained" in readingAfter) return { abstention: "input_abstained" };
  const drop = Math.max(0, moverWinPercent(readingBefore, mover) - moverWinPercent(readingAfter, mover));
  const evidence = graded.value[0] as DeclaredEvidence<MoveQualityGrade> | undefined;
  if (evidence === undefined) return { drop };
  // rfc/move-quality-grades.md D1: the grade reaches this surface only through module.review_map@1.
  const admission = admitForReview(viewer, [evidence]);
  if ("refused" in admission) return { drop, withheld: admission.refused };
  return admission.admitted.has(evidence) ? { drop, grade: evidence.payload } : { drop, withheld: "not_admitted" };
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
    sentence: reviewText("accuracy.rendered", { side: label, value: value.toFixed(1), convention: `${GRADE_CONVENTION.id}@${GRADE_CONVENTION.version}`, decisions: decisions.length }),
  });
}

/** The packet projections the Review Map panel admits through `module.review_map@1`. */
const REVIEW_PANEL_PROJECTIONS: ReadonlySet<string> = new Set(["derived.review.eval_point@1", "derived.review.eval_delta@1", "derived.review.mate_transition@1", "derived.review.wdl_point@1"]);

/**
 * The typed packet at one move, through the module registry: admission by `module.review_map@1`
 * (exact consumer, role, session), then the registered pair-keyed presentation adapters. Engine
 * families with no admitted item state their absence with a packet-issued abstention component.
 */
function packetComponents(viewer: ReviewMapInput["viewer"], packet: ReviewEvidencePacket, nodeId: string): readonly PresentedEvidenceItem[] | { readonly refused: ReviewModuleRefusal } {
  const node = packet.nodes.find((candidate) => candidate.nodeId === nodeId);
  if (node === undefined) return Object.freeze([]);
  const offered = node.items.filter((item) => REVIEW_PANEL_PROJECTIONS.has(`${item.projection.id}@${item.projection.version}`));
  const admission = admitForReview(viewer, offered);
  if ("refused" in admission) return admission;
  const admitted = offered.filter((item) => admission.admitted.has(item));
  const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 1 }, admitted));
  return Object.freeze([...presented, ...presentReviewFamilyAbstentions(packet, nodeId, ["engine_eval", "engine_wdl"])]);
}

/** Builds the whole Review Map projection for one recorded branch. Pure and recomputed on every read. */
export function reviewMapProjection(input: ReviewMapInput): ReviewMapProjection {
  if (input.packet !== undefined) {
    assertReviewEvidencePacket(input.packet);
    if (input.packet.subject.runId !== input.run.id || input.packet.subject.branchId !== input.branchId) throw new TypeError("Review Map packet belongs to another run or branch");
  }
  const path = branchPath(input.run, input.branchId);
  const packets = new Map(path.map((node) => [node.id, evaluationPacket(input.run, node)]));
  const selection = selectReviewMoments(input.story);
  const selected = new Set(selection.moments.map((moment) => moment.nodeId));
  const notesByNode = new Map<string, string[]>();
  for (const moment of input.story.moments) notesByNode.set(moment.nodeId, [...(notesByNode.get(moment.nodeId) ?? []), ...moment.sentences]);
  const semantic = input.semanticPath;
  const relationsByNode = new Map<string, string[]>();
  const relationLabels = new Set<string>();
  // Recorded-path events are exact v2 refs; module.review_map@1 admits each before it renders.
  const relationAdmission = semantic?.kind === "available" ? admitForReview(input.viewer, semantic.events.map((event) => event.evidence)) : undefined;
  if (semantic?.kind === "available" && relationAdmission !== undefined && "admitted" in relationAdmission) {
    const admitted = semantic.events.filter((event) => relationAdmission.admitted.has(event.evidence) && event.anchor.nodeId !== undefined);
    // module-registration A5: each admitted recorded-path event renders through its registered
    // module.review_map@1 adapter — a labelled relation, never a raw projection id.
    const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 1 }, admitted.map((event) => event.evidence)));
    admitted.forEach((event, index) => {
      relationLabels.add(evidenceGroundingLabel(event.basis.grounding));
      relationsByNode.set(event.anchor.nodeId!, [...(relationsByNode.get(event.anchor.nodeId!) ?? []), presentedSentence(presented[index]!)]);
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
    const moveNumber = moveNumberOf(node.ply);
    const decision = decide(input.viewer, input.context, side, packets.get(parent.id), packets.get(node.id));
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
    const relationFacts = semantic === undefined
      ? [reviewText("evidence.relation.absent")]
      : semantic.kind === "refused"
        ? [reviewText("evidence.relation.refused", { reason: semantic.reason })]
        : relationAdmission !== undefined && "refused" in relationAdmission
          ? [withheld(relationAdmission.refused)]
          : relationsByNode.get(node.id) ?? [reviewText("evidence.relation.none")];
    const packetItems = input.packet === undefined ? undefined : packetComponents(input.viewer, input.packet, node.id);
    const packetPresented = packetItems === undefined || "refused" in packetItems ? Object.freeze([]) : packetItems;
    const packetFacts = packetItems === undefined
      ? [reviewText("evidence.packet.absent")]
      : "refused" in packetItems ? [withheld(packetItems.refused)] : packetItems.map(presentedSentence);
    const facts = Object.freeze([
      gradeFact,
      evaluationSentence(input.viewer, packets.get(node.id), side === "white" ? "black" : "white"),
      ...(notesByNode.get(node.id) ?? []),
      ...relationFacts,
      ...packetFacts,
    ]);
    return Object.freeze({
      nodeId: node.id, entryNodeId: parent.id, ply: node.ply, moveNumber, side, san,
      label: reviewText(side === "white" ? "moves.row.white" : "moves.row.black", { number: moveNumber, san }),
      fen: node.fen, moveUci: node.moveUci, moment: selected.has(node.id),
      ...(grade === undefined ? {} : { grade }),
      facts,
      packet: serializePresentedEvidence(packetPresented),
    });
  });
  const moments = selection.moments.map((moment) => {
    const labels = storyEvidenceSourceLabels(moment);
    const kinds = moment.kinds.map((kind) => reviewText(MOMENT_KIND_TEMPLATES[kind]));
    const heading = kinds.length <= 1 ? kinds[0] ?? reviewText("moves.row.moment") : reviewText("kind.join", { first: kinds[0]!, rest: kinds.slice(1).join(" + ") });
    const number = moveNumberOf(moment.ply);
    return Object.freeze({
      nodeId: moment.nodeId, entryNodeId: moment.entryNodeId, ply: moment.ply, san: moment.san, fen: moment.fen,
      phase: moment.phase, kinds: moment.kinds, heading,
      moveLabel: moment.san === null ? reviewText("moment.move", { number }) : reviewText("moment.move.san", { number, san: moment.san }),
      sentences: moment.sentences, sourceLabels: labels,
      sourcesSentence: reviewText("moment.sources", { labels: labels.join(" · ") }),
    });
  });
  const evaluated = path.filter((node) => {
    const packet = packets.get(node.id);
    if (packet === undefined) return false;
    return !("abstained" in gradeReadingFromPayload(packet, node.fen.split(" ")[1] === "b" ? "black" : "white"));
  }).length;
  // The footer names the grounding of every admitted item class actually on the surface ([[D687]]).
  const footerLabels = [...new Set([
    evidenceGroundingLabel("recorded_run"),
    ...(graded || evaluated > 0 ? [evidenceGroundingLabel("bounded_search")] : []),
    ...moments.flatMap((moment) => moment.sourceLabels),
    ...relationLabels,
  ])];
  const nodes = new Map(path.map((node) => [node.id, node]));
  // The eval graph draws recorded evaluations, so each point is admitted by module.review_map@1 too.
  const sealed = new Map(path.flatMap((node) => {
    const packet = packets.get(node.id);
    return packet === undefined ? [] : [[node.id, invokeEvidenceValueRoute("live.stockfish.eval@1", { packet })] as const];
  }));
  const graphAdmission = admitForReview(input.viewer, [...sealed.values()]);
  const graphPackets = new Map(path.map((node) => {
    const evidence = sealed.get(node.id);
    const admitted = evidence !== undefined && "admitted" in graphAdmission && graphAdmission.admitted.has(evidence);
    return [node.id, admitted ? packets.get(node.id) : undefined] as const;
  }));
  const graph = evalGraphFor(rows, nodes, graphPackets, input.side ?? input.run.start.side);
  const evalGraph = "refused" in graphAdmission
    ? Object.freeze({ ...graph, caption: reviewText("graph.module.withheld", { reason: reviewText(MODULE_REFUSAL_TEMPLATES[graphAdmission.refused]) }) })
    : graph;
  return Object.freeze({
    convention: REVIEW_MAP_CONVENTION,
    context: input.context,
    rows: Object.freeze(rows),
    moments: Object.freeze(moments),
    momentsSentence: moments.length === 0 ? reviewText("moments.none") : reviewText("moments.caption", { considered: selection.considered }),
    considered: selection.considered,
    accuracy: Object.freeze({ white: accuracyFor("white", decisions.white), black: accuracyFor("black", decisions.black) }),
    coverage: Object.freeze({ evaluated, positions: path.length, sentence: reviewText("header.coverage", { evaluated, positions: path.length }) }),
    footer: Object.freeze({ labels: Object.freeze(footerLabels), sentence: reviewText("footer.sources", { labels: footerLabels.join(" · ") }) }),
    evalGraph,
    compareDoors: compareDoorsFor(divergences(input.run, path, input.branchId), input.branchId),
    openRetryEntryNodeId: openRetryEntry(input.run, input.branchId),
  });
}
