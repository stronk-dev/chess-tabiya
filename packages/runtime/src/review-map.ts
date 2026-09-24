// rfc/review-map.md: the learner-facing whole-game Review Map projection. It is a pure, recomputed
// read over one recorded branch: nothing here is persisted (§3 rule 3, criterion 14). It selects,
// orders and renders; it does not grade (the `derived.grade.move_quality@1` producer does), it does
// not detect (story.ts and the recorded-semantic-path compiler do) and it names no best move, no
// principal variation and no praise class (§7).

import { branchPath } from "./branch-path.js";
import type { DeclaredEvidence, EvidenceRole } from "./evidence-contract.js";
import { compileModulePacket } from "./module-packets.js";
import { GRADE_CONVENTION, assertMoveQualityGradeSentence, renderMoveQualityGrade, type GradeContext, type GradeSide, type MoveQualityClass, type MoveQualityGrade } from "./grade.js";
import { gradeReadingFromPayload, moverWinPercent } from "./grade-reading.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import type { DetectedPhase } from "./phase.js";
import type { RecordedSemanticPathResult } from "./recorded-semantic-path.js";
import { reviewText, type ReviewTemplateId } from "./review-map-templates.js";
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
}

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
const sideOfMove = (parentFen: string): GradeSide => parentFen.split(" ")[1] === "b" ? "black" : "white";
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

function evaluationSentence(viewer: ReviewMapInput["viewer"], packet: EvidencePayload | undefined, sideToMove: GradeSide): string {
  if (packet !== undefined) {
    const sealed = invokeEvidenceValueRoute("live.stockfish.eval@1", { packet });
    const admission = admitForReview(viewer, [sealed]);
    if ("refused" in admission) return withheld(admission.refused);
    if (!admission.admitted.has(sealed)) return withheld("not_admitted");
  }
  const reading = packet === undefined ? undefined : gradeReadingFromPayload(packet, sideToMove);
  if (reading === undefined || "abstained" in reading) return reviewText("evidence.eval.missing");
  const score = reading.score.kind === "cp"
    ? `${reading.score.value >= 0 ? "+" : "−"}${(Math.abs(reading.score.value) / 100).toFixed(2)}`
    : reviewText("evidence.eval.mate", { moves: Math.abs(reading.score.movesTo), side: reading.score.movesTo > 0 ? sideLabel("white") : sideLabel("black") });
  const limit = reading.requestedMovetimeMs !== undefined ? `, ${reading.requestedMovetimeMs} ms` : reading.depth !== undefined ? `, depth ${reading.depth}` : "";
  return reviewText("evidence.eval", { score, engine: reading.engineId, limit });
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

function relationFamily(projectionId: string): string {
  return (projectionId.split(".").at(-1) ?? projectionId).replaceAll("_", " ");
}

/** Builds the whole Review Map projection for one recorded branch. Pure and recomputed on every read. */
export function reviewMapProjection(input: ReviewMapInput): ReviewMapProjection {
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
    for (const event of semantic.events) {
      if (!relationAdmission.admitted.has(event.evidence)) continue;
      const nodeId = event.anchor.nodeId;
      if (nodeId === undefined) continue;
      const source = evidenceGroundingLabel(event.basis.grounding);
      relationLabels.add(source);
      const sentence = reviewText("evidence.relation", { family: relationFamily(event.projection.id), projection: `${event.projection.id}@${event.projection.version}`, source });
      relationsByNode.set(nodeId, [...(relationsByNode.get(nodeId) ?? []), sentence]);
    }
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
    const facts = Object.freeze([
      gradeFact,
      evaluationSentence(input.viewer, packets.get(node.id), side === "white" ? "black" : "white"),
      ...(notesByNode.get(node.id) ?? []),
      ...relationFacts,
      reviewText("evidence.packet.abstained"),
    ]);
    return Object.freeze({
      nodeId: node.id, entryNodeId: parent.id, ply: node.ply, moveNumber, side, san,
      label: reviewText(side === "white" ? "moves.row.white" : "moves.row.black", { number: moveNumber, san }),
      fen: node.fen, moveUci: node.moveUci, moment: selected.has(node.id),
      ...(grade === undefined ? {} : { grade }),
      facts,
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
  });
}
