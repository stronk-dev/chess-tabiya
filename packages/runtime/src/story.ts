// rfc/review-evidence-compiler.md §5: the Story compatibility compiler over the typed Review packet.
//
// Story no longer reads an untyped engine scalar. Every moment is built from exact packet items:
// cp pivots from `derived.review.eval_delta@1`, mate moments from `derived.review.mate_transition@1`
// (never a cp sentinel), last-level from cp review points converted to the learner's perspective at
// this consumer. Each moment carries distinct decision / evidence / stop identities and sealed
// presentation components; the wire carries only closed `PresentationReceipt`s.

import { canonicalFen, positionFromFen } from "./chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertConsumerEvidenceView, evidenceForConsumer, type ConsumerEvidenceView, type DeclaredEvidence } from "./evidence-contract.js";
import type { EndgameClassification } from "./endgame.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { classifyPhase, type DetectedPhase } from "./phase.js";
import type { PivotalKind, PivotalMarker } from "./pivotal.js";
import {
  GROUNDING_LABELS,
  PresentationError,
  parsePresentationReceipt,
  presentEvidenceItems,
  presentationDigest,
  presentedSentence,
  serializePresentedEvidence,
  type PresentationReceipt,
  type PresentedEvidenceItem,
} from "./presentation-contract.js";
import {
  REVIEW_SOURCE_FAMILIES,
  REVIEW_UNAVAILABLE_REASONS,
  assertReviewEvidencePacket,
  reviewPacketForRun,
  reviewSubjectPath,
  type ReviewProviderNodeState,
  type ReviewDegradation,
  type ReviewEvidencePacket,
  type ReviewOutcomeReceipt,
  type ReviewProgress,
  type ReviewRecordedPrefixReceipt,
  type ReviewRunFamilyState,
  type ReviewSourceFamily,
} from "./review-evidence.js";
import { reviewScoreReceipt, type ReviewEnginePoint, type ReviewEvalDelta, type ReviewMateTransition, type ReviewScoreReceipt } from "./review-points.js";
import type { ShapeTriggerSource } from "./shape-firing.js";
import type { DrillRun, RunOutcome } from "./types.js";

export type StoryMomentKind = PivotalKind | "eval_pivot" | "mate_transition" | "last_level" | "endgame_entry" | "shape_span" | "outcome";
export const STORY_MOMENT_KINDS: readonly StoryMomentKind[] = Object.freeze(["human_divergence", "option_collapse", "irreversibility", "phase_change", "eval_pivot", "mate_transition", "last_level", "endgame_entry", "shape_span", "outcome"]);

/** Server-only Story moment (`ReviewStoryMoment`): exact sealed evidence and components. */
export interface StoryMoment {
  /** Compatibility alias of `evidenceNodeId`. */
  readonly nodeId: string;
  /** The parent of the exact recorded evidence edge: retry always forks here. */
  readonly decisionNodeId: string;
  /** The landing node of the recorded edge: presentation anchors the observation here. */
  readonly evidenceNodeId: string;
  /** The bounded consequence endpoint (this landing: the evidence node itself): replay stops here. */
  readonly stopNodeId: string;
  /** Compatibility alias of `decisionNodeId` for existing re-entry callers. */
  readonly entryNodeId: string;
  readonly ply: number;
  readonly san: string | null;
  readonly fen: string;
  readonly kinds: readonly StoryMomentKind[];
  readonly evidence: readonly DeclaredEvidence<unknown>[];
  readonly components: readonly PresentedEvidenceItem[];
  /** Equivalent sentences of `components`, in order; never a parallel prose channel. */
  readonly sentences: readonly string[];
  readonly evaluation: null | { readonly before: ReviewScoreReceipt; readonly after: ReviewScoreReceipt };
  readonly phase: DetectedPhase;
  readonly endgame?: EndgameClassification;
}

export interface StoryProjection {
  readonly moments: readonly StoryMoment[];
  readonly rank: readonly string[];
  readonly evidence: readonly DeclaredEvidence<unknown>[];
  readonly title: { readonly evidence: DeclaredEvidence<unknown>; readonly component: PresentedEvidenceItem; readonly text: string };
}

export interface StoryTitleInput {
  readonly side: "white" | "black";
  readonly outcome: { readonly kind: "board_terminal" | "recorded_result" | "unfinished"; readonly result?: RunOutcome | "1-0" | "0-1" | "1/2-1/2" | "*" };
  readonly moments: readonly Pick<StoryMoment, "nodeId" | "ply" | "endgame">[];
  readonly rank: readonly string[];
}

/** The existing absolute 150-cp product convention for a cp pivot (until the Review Map policy). */
export const STORY_PIVOT_CP = 150;

/**
 * Nine presentation bands (HEAD's order with the new mate-transition band at position 1; every band
 * below shifts by one): outcome, mate transition, cp pivot, last level, phase change, endgame entry,
 * shape, other facts, irreversibility (deliberately the final family). Presentation order, not
 * chess significance.
 */
const STORY_MOMENT_PRIORITY: Readonly<Record<StoryMomentKind, number>> = Object.freeze({
  outcome: 0,
  mate_transition: 1,
  eval_pivot: 2,
  last_level: 3,
  phase_change: 4,
  endgame_entry: 5,
  shape_span: 6,
  human_divergence: 7,
  option_collapse: 7,
  irreversibility: 8,
});

export function suggestTitle(story: StoryTitleInput): string {
  const top = story.moments.find((moment) => moment.nodeId === story.rank[0]) ?? story.moments[0];
  const move = top === undefined ? "the finish" : `move ${Math.max(1, Math.ceil(top.ply / 2))}`;
  const family = top?.endgame?.type?.label;
  const result = story.outcome.result;
  const recordedLoss = result === "1-0" || result === "0-1" ? learnerLost(result, story.side) : false;
  const recordedWin = (result === "1-0" || result === "0-1") && !recordedLoss;
  const verb = result === "draw" || result === "1/2-1/2" ? "Held" : result === "win" || recordedWin ? "Won" : result === "loss" || recordedLoss ? "The turning point" : "A game story";
  return family === undefined ? `${verb} at ${move}` : `${verb} from the ${family.toLowerCase()} at ${move}`;
}

function learnerLost(result: "1-0" | "0-1" | "1/2-1/2" | "*" | undefined, side: "white" | "black"): boolean {
  return (side === "white" && result === "0-1") || (side === "black" && result === "1-0");
}

const cpMagnitude = (moment: Pick<StoryMoment, "evaluation">): number | null =>
  moment.evaluation !== null && moment.evaluation.before.kind === "centipawns" && moment.evaluation.after.kind === "centipawns"
    ? Math.abs(moment.evaluation.after.value - moment.evaluation.before.value)
    : null;

/**
 * The deterministic compatibility order. The |Δcp| tiebreak applies only when both endpoints of a
 * moment are centipawns; a moment with a mate endpoint (or no evaluation) orders by ply then node id.
 * Bands separate the two populations, so the comparison is a total order.
 */
export function rankStoryMoments(moments: readonly Pick<StoryMoment, "nodeId" | "ply" | "kinds" | "evaluation">[]): readonly string[] {
  const priority = (moment: Pick<StoryMoment, "kinds">): number => moment.kinds.length === 0 ? 7 : Math.min(...moment.kinds.map((kind) => STORY_MOMENT_PRIORITY[kind]));
  return Object.freeze([...moments]
    .sort((left, right) => {
      const band = priority(left) - priority(right);
      if (band !== 0) return band;
      const leftCp = cpMagnitude(left), rightCp = cpMagnitude(right);
      if (leftCp !== null && rightCp !== null && leftCp !== rightCp) return rightCp - leftCp;
      return left.ply - right.ply || left.nodeId.localeCompare(right.nodeId);
    })
    .map((moment) => moment.nodeId));
}

/** The learner-facing label of one declared grounding class, shared by story and review footers. */
export function evidenceGroundingLabel(grounding: keyof typeof GROUNDING_LABELS): string {
  return GROUNDING_LABELS[grounding].label;
}

/** Resolves each admitted story fact to the leaf grounding sources declared by the evidence manifest. */
export function storyEvidenceSourceLabels(moment: Pick<StoryMoment, "evidence">): readonly string[] {
  const byProjection = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [`${projection.id}@${projection.version}`, projection]));
  const labels = new Set<string>();
  const visiting = new Set<string>();
  const visit = (projectionId: string, version: number): void => {
    const key = `${projectionId}@${version}`;
    if (visiting.has(key)) return;
    const projection = byProjection.get(key);
    if (projection === undefined) throw new TypeError(`Story evidence names undeclared projection ${key}`);
    visiting.add(key);
    if (projection.plane === "derived" && projection.derivation?.inputs !== undefined) {
      for (const input of projection.derivation.inputs) visit(input.id, input.version);
    } else {
      labels.add(GROUNDING_LABELS[projection.grounding].label);
    }
    visiting.delete(key);
  };
  for (const evidence of moment.evidence) visit(evidence.projection.id, evidence.projection.version);
  return Object.freeze([...labels]);
}

const REVIEW_STORY = Object.freeze({ id: "review.story", version: 1 });

/** The `review.story@1` presentation operation: an admitted view → sealed components. */
export function renderReviewStoryComponents(view: ConsumerEvidenceView<unknown>): readonly PresentedEvidenceItem[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "review.story" || view.consumer.version !== 1) throw new TypeError("Expected review.story@1 consumer view");
  return presentEvidenceItems(view);
}

const projectionIs = (item: DeclaredEvidence<unknown>, id: string, version = 1): boolean => item.projection.id === id && item.projection.version === version;

function titleOutcome(outcome: ReviewOutcomeReceipt): StoryTitleInput["outcome"] {
  return outcome.kind === "unfinished" ? { kind: "unfinished" } : { kind: outcome.kind, result: outcome.result };
}

/**
 * The server-only Story compiler over one sealed packet. Learner side, outcome and title operands
 * come only from `packet.subject`; there is no caller-owned story context. A root occurrence has no
 * recorded decision edge and constructs no moment.
 */
export function reviewStoryMoments(packet: ReviewEvidencePacket): StoryProjection {
  assertReviewEvidencePacket(packet);
  const { path } = reviewSubjectPath(packet.subject);
  const index = new Map(path.map((node, at) => [node.id, at]));
  const byId = new Map(path.map((node) => [node.id, node]));
  const accum = new Map<string, { kinds: Set<StoryMomentKind>; evidence: DeclaredEvidence<unknown>[]; evaluation: StoryMoment["evaluation"]; endgame?: EndgameClassification }>();
  const at = (nodeId: string) => {
    let value = accum.get(nodeId);
    if (value === undefined) { value = { kinds: new Set(), evidence: [], evaluation: null }; accum.set(nodeId, value); }
    return value;
  };
  let endgameSeen = false;
  const points: DeclaredEvidence<ReviewEnginePoint>[] = [];
  for (const node of packet.nodes) {
    for (const item of node.items) {
      const id = item.projection.id;
      if (id.startsWith("derived.pivotal.")) { const value = at(node.nodeId); value.kinds.add((item.payload as PivotalMarker).kind); value.evidence.push(item); }
      else if (projectionIs(item, "derived.review.eval_point")) points.push(item as DeclaredEvidence<ReviewEnginePoint>);
      else if (projectionIs(item, "derived.review.eval_delta")) {
        const delta = item.payload as ReviewEvalDelta;
        if (Math.abs(delta.deltaCp) < STORY_PIVOT_CP) continue;
        const value = at(node.nodeId); value.kinds.add("eval_pivot"); value.evidence.push(item);
        value.evaluation = { before: reviewScoreReceipt(delta.before.payload.evaluation.payload.payload.score), after: reviewScoreReceipt(delta.after.payload.evaluation.payload.payload.score) };
      } else if (projectionIs(item, "derived.review.mate_transition")) {
        const transition = item.payload as ReviewMateTransition;
        const value = at(node.nodeId); value.kinds.add("mate_transition"); value.evidence.push(item);
        value.evaluation = { before: reviewScoreReceipt(transition.before.payload.evaluation.payload.payload.score), after: reviewScoreReceipt(transition.after.payload.evaluation.payload.payload.score) };
      } else if (projectionIs(item, "rules.endgame.classification") && !endgameSeen) {
        endgameSeen = true;
        const value = at(node.nodeId); value.kinds.add("endgame_entry"); value.endgame = item.payload as EndgameClassification; value.evidence.push(item);
      } else if (projectionIs(item, "theory.shapes.firing")) { const value = at(node.nodeId); value.kinds.add("shape_span"); value.evidence.push(item); }
      else if (projectionIs(item, "run.record.consequence") || projectionIs(item, "run.record.imported_result")) { const value = at(node.nodeId); value.kinds.add("outcome"); value.evidence.push(item); }
    }
  }
  const outcome = packet.subject.outcome;
  if (outcome.kind === "recorded_result") {
    for (const level of invokeEvidenceValueRoute("derived.story.last_level@1", { path: packet.subject.pathNodeIds, side: packet.subject.learnerSide, recordedResult: outcome.result, points })) {
      const value = at(level.nodeId); value.kinds.add("last_level"); value.evidence.push(level.evidence);
    }
  }
  const moments = [...accum.entries()].flatMap(([nodeId, value]): StoryMoment[] => {
    const node = byId.get(nodeId);
    const position = index.get(nodeId);
    // A moment needs a recorded decision edge: the root occurrence constructs none.
    if (node === undefined || position === undefined || position === 0 || node.parentId === null) return [];
    const decision = path[position - 1]!;
    if (decision.id !== node.parentId) throw new TypeError(`Story moment ${nodeId} has no exact recorded edge on its path`);
    const components = renderReviewStoryComponents(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, REVIEW_STORY, value.evidence));
    return [Object.freeze({
      nodeId, decisionNodeId: decision.id, evidenceNodeId: nodeId, stopNodeId: nodeId, entryNodeId: decision.id,
      ply: node.ply, san: node.moveSan, fen: node.fen,
      kinds: Object.freeze([...value.kinds].sort()),
      evidence: Object.freeze([...value.evidence]),
      components,
      sentences: Object.freeze(components.map(presentedSentence)),
      evaluation: value.evaluation === null ? null : Object.freeze({ ...value.evaluation }),
      phase: classifyPhase(node.fen).phase,
      ...(value.endgame === undefined ? {} : { endgame: value.endgame }),
    })];
  }).sort((left, right) => left.ply - right.ply || left.nodeId.localeCompare(right.nodeId));
  const rank = rankStoryMoments(moments);
  const rankEvidence = invokeEvidenceValueRoute("derived.story.rank@1", { moments });
  if ((rankEvidence.payload as { readonly rank: readonly string[] }).rank.join("|") !== rank.join("|")) throw new TypeError("Story rank factory disagrees with the moment ranking");
  const titleInput: StoryTitleInput = { side: packet.subject.learnerSide, outcome: titleOutcome(outcome), moments, rank };
  const titleEvidence = invokeEvidenceValueRoute("derived.story.title@1", { story: titleInput, rank: rankEvidence as DeclaredEvidence<{ readonly rank: readonly string[] }> });
  const [titleComponent] = renderReviewStoryComponents(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, REVIEW_STORY, [titleEvidence]));
  if (titleComponent === undefined) throw new TypeError("Story title has no presentation component");
  return Object.freeze({
    moments: Object.freeze(moments),
    rank,
    evidence: Object.freeze([...moments.flatMap((moment) => moment.evidence), rankEvidence]),
    title: Object.freeze({ evidence: titleEvidence, component: titleComponent, text: presentedSentence(titleComponent) }),
  });
}

/** `guidance.voice_story@1`: the sealed title plus the moment evidence, optionally for one node. */
export function storyDeclaredEvidence(story: Pick<StoryProjection, "moments" | "title">, nodeId?: string): readonly DeclaredEvidence<unknown>[] {
  const moments = nodeId === undefined ? story.moments : story.moments.filter((moment) => moment.evidenceNodeId === nodeId);
  return Object.freeze([story.title.evidence, ...moments.flatMap((moment) => moment.evidence)]);
}

// ---------------------------------------------------------------------------------------------
// The closed `review-story@1` wire: the server terminates the packet, the client parses the bytes
// ---------------------------------------------------------------------------------------------

export interface ReviewStoryMomentReceipt {
  readonly decisionNodeId: string;
  readonly evidenceNodeId: string;
  readonly stopNodeId: string;
  readonly ply: number;
  readonly san: string | null;
  readonly fen: string;
  readonly kinds: readonly StoryMomentKind[];
  readonly evaluation: null | { readonly before: ReviewScoreReceipt; readonly after: ReviewScoreReceipt };
  readonly presentation: PresentationReceipt;
}

export interface ReviewStoryReceipt {
  readonly protocol: "review-story@1";
  readonly subject: ReviewRecordedPrefixReceipt;
  readonly manifestDigest: string;
  readonly packetDigest: string;
  readonly progress: ReviewProgress;
  readonly degradation: ReviewDegradation;
  readonly families: Readonly<Record<ReviewSourceFamily, ReviewRunFamilyState>>;
  readonly title: PresentationReceipt;
  readonly moments: readonly ReviewStoryMomentReceipt[];
  readonly rank: readonly string[];
}

const plainJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * The one named server-only consumer of the packet on the `story()` route: asserts the aggregate
 * packet, admits items through the literal review.story@1 bindings, constructs sealed components,
 * applies the compatibility selection and serializes each moment and the title.
 */
export function renderReviewStoryReceipt(packet: ReviewEvidencePacket): ReviewStoryReceipt {
  const story = reviewStoryMoments(packet);
  return deepFreeze({
    protocol: "review-story@1" as const,
    subject: plainJson(packet.subject),
    manifestDigest: packet.manifestDigest,
    packetDigest: packet.packetDigest,
    progress: plainJson(packet.completion.progress),
    degradation: plainJson(packet.completion.degradation),
    families: plainJson(packet.families),
    title: serializePresentedEvidence([story.title.component]),
    moments: story.moments.map((moment) => ({
      decisionNodeId: moment.decisionNodeId, evidenceNodeId: moment.evidenceNodeId, stopNodeId: moment.stopNodeId,
      ply: moment.ply, san: moment.san, fen: moment.fen, kinds: [...moment.kinds],
      evaluation: moment.evaluation === null ? null : plainJson(moment.evaluation),
      presentation: serializePresentedEvidence(moment.components),
    })),
    rank: [...story.rank],
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

// ---- the exact recursive parser (web) ----

const fail = (message: string): never => { throw new TypeError(`Invalid review story receipt: ${message}`); };
const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);
function exact(value: unknown, keys: readonly string[], label: string): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) return fail(`${label} is not an object`);
  const actual = Object.keys(value).sort().join("|");
  if (actual !== [...keys].sort().join("|")) fail(`${label} keys ${actual} are not ${[...keys].sort().join("|")}`);
  return value;
}
const text = (value: unknown, label: string): string => typeof value === "string" && value.trim() !== "" ? value : fail(`${label} must be a non-empty string`);
const natural = (value: unknown, label: string): number => Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : fail(`${label} must be a non-negative safe integer`);
const DIGEST = /^sha256:[0-9a-f]{64}$/u;
const digest = (value: unknown, label: string): string => typeof value === "string" && DIGEST.test(value) ? value : fail(`${label} must be a sha256 digest`);
function canonicalFenText(value: unknown, label: string): string {
  const fen = text(value, label);
  try { if (canonicalFen(positionFromFen(fen)) !== fen) fail(`${label} is not canonical`); } catch (error) { if (error instanceof TypeError && error.message.startsWith("Invalid review story receipt")) throw error; fail(`${label} is not a legal position`); }
  return fen;
}

function parseScore(value: unknown, label: string): ReviewScoreReceipt {
  const record = isRecord(value) ? value : fail(`${label} is not an object`);
  if (record.kind === "centipawns") { const item = exact(value, ["kind", "value"], label); if (!Number.isSafeInteger(item.value)) fail(`${label}.value`); return { kind: "centipawns", value: item.value as number }; }
  const item = exact(value, ["kind", "side", "distance", "unit"], label);
  if (item.kind !== "mate" || item.unit !== "moves" || (item.side !== "white" && item.side !== "black") || natural(item.distance, `${label}.distance`) < 1) fail(`${label} is not a typed score`);
  return { kind: "mate", side: item.side as "white" | "black", distance: item.distance as number, unit: "moves" };
}

function parseSubject(value: unknown): ReviewRecordedPrefixReceipt {
  const item = exact(value, ["protocol", "runId", "branchId", "eventHead", "tipNodeId", "pathNodeIds", "prefixDigest", "learnerSide", "outcome", "subjectDigest"], "subject");
  if (item.protocol !== "review-recorded-prefix@1") fail("subject protocol");
  const head = exact(item.eventHead, ["seq", "digest"], "subject.eventHead");
  if (!Array.isArray(item.pathNodeIds) || item.pathNodeIds.length === 0) fail("subject.pathNodeIds");
  const path = (item.pathNodeIds as unknown[]).map((id) => text(id, "path node id"));
  if (new Set(path).size !== path.length || path.at(-1) !== item.tipNodeId) fail("subject path");
  if (item.learnerSide !== "white" && item.learnerSide !== "black") fail("subject.learnerSide");
  const outcomeRecord = isRecord(item.outcome) ? item.outcome : fail("subject.outcome");
  let outcome: ReviewOutcomeReceipt;
  if (outcomeRecord.kind === "board_terminal") { const entry = exact(item.outcome, ["kind", "eventSeq", "nodeId", "result"], "outcome"); if (!["win", "loss", "draw"].includes(entry.result as string) || !path.includes(entry.nodeId as string)) fail("outcome"); outcome = { kind: "board_terminal", eventSeq: natural(entry.eventSeq, "outcome.eventSeq"), nodeId: entry.nodeId as string, result: entry.result as RunOutcome }; }
  else if (outcomeRecord.kind === "recorded_result") { const entry = exact(item.outcome, ["kind", "sourceDigest", "result"], "outcome"); if (!["1-0", "0-1", "1/2-1/2"].includes(entry.result as string)) fail("outcome.result"); outcome = { kind: "recorded_result", sourceDigest: digest(entry.sourceDigest, "outcome.sourceDigest"), result: entry.result as "1-0" | "0-1" | "1/2-1/2" }; }
  else { exact(item.outcome, ["kind"], "outcome"); if (outcomeRecord.kind !== "unfinished") fail("outcome.kind"); outcome = { kind: "unfinished" }; }
  const body = { protocol: "review-recorded-prefix@1" as const, runId: text(item.runId, "subject.runId"), branchId: text(item.branchId, "subject.branchId"), eventHead: { seq: natural(head.seq, "eventHead.seq"), digest: digest(head.digest, "eventHead.digest") }, tipNodeId: text(item.tipNodeId, "subject.tipNodeId"), pathNodeIds: path, prefixDigest: digest(item.prefixDigest, "subject.prefixDigest"), learnerSide: item.learnerSide as "white" | "black", outcome };
  if (presentationDigest("review.subject@1", body) !== item.subjectDigest) fail("subject digest mismatch");
  return deepFreeze({ ...body, subjectDigest: item.subjectDigest as string });
}

const COUNT_KEYS = ["available", "honestEmpty", "notRequested", "notYetScheduled", "pending", "unavailable"] as const;
function parseFamilies(value: unknown): Readonly<Record<ReviewSourceFamily, ReviewRunFamilyState>> {
  const record = exact(value, REVIEW_SOURCE_FAMILIES, "families");
  const result = {} as Record<ReviewSourceFamily, ReviewRunFamilyState>;
  for (const family of REVIEW_SOURCE_FAMILIES) {
    const item = exact(record[family], ["nodeCount", "applicableSourceCount", "availableNodeCount", "itemCount", "sourceCounts", "progress", "unavailable"], `families.${family}`);
    const counts = exact(item.sourceCounts, COUNT_KEYS, `${family}.sourceCounts`);
    const sum = COUNT_KEYS.reduce((total, key) => total + natural(counts[key], `${family}.${key}`), 0);
    if (sum !== natural(item.applicableSourceCount, `${family}.applicableSourceCount`)) fail(`${family} source counts do not sum`);
    const progress = exact(item.progress, ["notYetScheduledSourceCount", "pendingSourceCount", "pendingJobCount", "retryingJobCount"], `${family}.progress`);
    if (natural(progress.retryingJobCount, "retrying") > natural(progress.pendingJobCount, "pendingJobs")) fail(`${family} retrying exceeds pending`);
    natural(progress.notYetScheduledSourceCount, "queued"); natural(progress.pendingSourceCount, "pendingSources");
    if (!Array.isArray(item.unavailable)) fail(`${family}.unavailable`);
    const groups = (item.unavailable as unknown[]).map((group) => { const entry = exact(group, ["reason", "sourceCount", "nodeCount"], `${family}.unavailable`); if (!REVIEW_UNAVAILABLE_REASONS.includes(entry.reason as never) || natural(entry.sourceCount, "sourceCount") < 1 || natural(entry.nodeCount, "nodeCount") < 1) fail(`${family} unavailable group`); return entry; });
    natural(item.nodeCount, "nodeCount"); natural(item.availableNodeCount, "availableNodeCount"); natural(item.itemCount, "itemCount");
    void groups;
    result[family] = item as unknown as ReviewRunFamilyState;
  }
  return deepFreeze(plainJson(result));
}

function parseProgress(value: unknown): ReviewProgress {
  const record = isRecord(value) ? value : fail("progress");
  if (record.kind === "settled") { exact(value, ["kind"], "progress"); return { kind: "settled" }; }
  const item = exact(value, ["kind", "pendingNodeCount", "pendingJobCount", "retryingJobCount", "notYetScheduledNodeCount"], "progress");
  if (item.kind !== "progressive") fail("progress.kind");
  if (natural(item.retryingJobCount, "retrying") > natural(item.pendingJobCount, "pending")) fail("progress retrying exceeds pending");
  return { kind: "progressive", pendingNodeCount: natural(item.pendingNodeCount, "pendingNodeCount"), pendingJobCount: item.pendingJobCount as number, retryingJobCount: item.retryingJobCount as number, notYetScheduledNodeCount: natural(item.notYetScheduledNodeCount, "queuedNodes") };
}

function parseDegradation(value: unknown): ReviewDegradation {
  const record = isRecord(value) ? value : fail("degradation");
  if (record.kind === "healthy") { exact(value, ["kind"], "degradation"); return { kind: "healthy" }; }
  const item = exact(value, ["kind", "unavailableFamilies"], "degradation");
  if (item.kind !== "degraded" || !Array.isArray(item.unavailableFamilies) || item.unavailableFamilies.length === 0) fail("degradation");
  for (const family of item.unavailableFamilies as unknown[]) { const entry = exact(family, ["family", "reasons"], "degraded family"); if (!REVIEW_SOURCE_FAMILIES.includes(entry.family as never) || !Array.isArray(entry.reasons) || entry.reasons.length === 0) fail("degraded family"); }
  return plainJson(item) as unknown as ReviewDegradation;
}

export interface ParsedReviewStory {
  readonly receipt: ReviewStoryReceipt;
  readonly title: readonly PresentedEvidenceItem[];
  readonly moments: readonly (ReviewStoryMomentReceipt & { readonly components: readonly PresentedEvidenceItem[] })[];
}

/**
 * The web's exact recursive parser: closed keys, literal discriminants, safe numbers, canonical
 * FENs, complete nested presentation receipts (new client-local seals), the subject digest and
 * node/rank references. It never admits DeclaredEvidence and never re-derives evidence.
 */
export function parseReviewStoryReceipt(value: unknown, request?: { readonly runId: string; readonly branchId?: string }): ParsedReviewStory {
  const item = exact(value, ["protocol", "subject", "manifestDigest", "packetDigest", "progress", "degradation", "families", "title", "moments", "rank"], "receipt");
  if (item.protocol !== "review-story@1") fail("protocol");
  const subject = parseSubject(item.subject);
  if (request !== undefined && (subject.runId !== request.runId || (request.branchId !== undefined && subject.branchId !== request.branchId))) fail("subject does not answer the request");
  if (typeof item.manifestDigest !== "string" || !/^[0-9a-f]{64}$/u.test(item.manifestDigest)) fail("manifestDigest"); digest(item.packetDigest, "packetDigest");
  const families = parseFamilies(item.families);
  const progress = parseProgress(item.progress);
  const degradation = parseDegradation(item.degradation);
  let title: readonly PresentedEvidenceItem[];
  try { title = parsePresentationReceipt(item.title); } catch (error) { return fail(`title: ${error instanceof Error ? error.message : String(error)}`); }
  if (title.length !== 1 || title[0]!.component.id !== "fact_statement") fail("title is one fact_statement component");
  if (!Array.isArray(item.moments)) fail("moments");
  const pathIndex = new Map(subject.pathNodeIds.map((id, index) => [id, index]));
  const moments = (item.moments as unknown[]).map((candidate, index) => {
    const moment = exact(candidate, ["decisionNodeId", "evidenceNodeId", "stopNodeId", "ply", "san", "fen", "kinds", "evaluation", "presentation"], `moment ${index}`);
    const decision = pathIndex.get(text(moment.decisionNodeId, "decisionNodeId"));
    const evidence = pathIndex.get(text(moment.evidenceNodeId, "evidenceNodeId"));
    const stop = pathIndex.get(text(moment.stopNodeId, "stopNodeId"));
    if (decision === undefined || evidence === undefined || stop === undefined || evidence === 0 || decision !== evidence - 1 || stop < evidence) fail(`moment ${index} decision/evidence/stop identities are not an ordered path edge`);
    if (!Array.isArray(moment.kinds) || moment.kinds.length === 0 || (moment.kinds as unknown[]).some((kind) => !STORY_MOMENT_KINDS.includes(kind as StoryMomentKind)) || new Set(moment.kinds).size !== moment.kinds.length) fail(`moment ${index} kinds`);
    if (!(moment.san === null || typeof moment.san === "string")) fail(`moment ${index} san`);
    const evaluation = moment.evaluation === null ? null : (() => { const pair = exact(moment.evaluation, ["before", "after"], "evaluation"); return { before: parseScore(pair.before, "evaluation.before"), after: parseScore(pair.after, "evaluation.after") }; })();
    let components: readonly PresentedEvidenceItem[];
    try { components = parsePresentationReceipt(moment.presentation); } catch (error) { return fail(`moment ${index} presentation: ${error instanceof Error ? error.message : String(error)}`); }
    if (components.length === 0) fail(`moment ${index} has no component`);
    return Object.freeze({ decisionNodeId: moment.decisionNodeId as string, evidenceNodeId: moment.evidenceNodeId as string, stopNodeId: moment.stopNodeId as string, ply: natural(moment.ply, "ply"), san: moment.san as string | null, fen: canonicalFenText(moment.fen, "moment.fen"), kinds: Object.freeze([...(moment.kinds as StoryMomentKind[])]), evaluation, presentation: moment.presentation as PresentationReceipt, components });
  });
  const ids = moments.map((moment) => moment.evidenceNodeId);
  if (!Array.isArray(item.rank) || item.rank.length !== ids.length || new Set(item.rank).size !== ids.length || (item.rank as unknown[]).some((id) => typeof id !== "string" || !ids.includes(id))) fail("rank must reference every moment exactly once");
  const receipt = deepFreeze({ protocol: "review-story@1" as const, subject, manifestDigest: item.manifestDigest as string, packetDigest: item.packetDigest as string, progress, degradation, families, title: item.title as PresentationReceipt, moments: moments.map(({ components: _components, ...rest }) => rest), rank: [...(item.rank as string[])] });
  return Object.freeze({ receipt, title, moments: Object.freeze(moments) });
}

// ---- the public share: a strict narrower projection of the same selected receipts ----

export interface PublicReviewStoryReceipt {
  readonly protocol: "review-story.public@1";
  readonly title: PresentationReceipt;
  readonly outcome: ReviewOutcomeReceipt;
  readonly moments: readonly Omit<ReviewStoryMomentReceipt, "evaluation">[];
}

/**
 * Drops family/progress/provider metadata and every moment the public selection does not admit;
 * each retained presentation receipt is copied byte-for-byte from the authorized receipt.
 */
export function projectPublicReviewStory(receipt: ReviewStoryReceipt, selectedEvidenceNodeIds: readonly string[]): PublicReviewStoryReceipt {
  const selected = new Set(selectedEvidenceNodeIds);
  if ([...selected].some((id) => !receipt.moments.some((moment) => moment.evidenceNodeId === id))) throw new PresentationError("PRESENTATION_INVALID", "public selection names a moment the story does not carry");
  return deepFreeze({
    protocol: "review-story.public@1" as const,
    title: receipt.title,
    outcome: receipt.subject.outcome,
    moments: receipt.moments.filter((moment) => selected.has(moment.evidenceNodeId)).map(({ evaluation: _evaluation, ...moment }) => moment),
  });
}


/**
 * Local compilation of the Story for one in-memory run (tests, offline tools): the run is its own
 * storage authority, an imported run's record image carries `recordedResult`, and engine states
 * default to the run's durable provider deliveries.
 */
export function storyMomentsForRun(run: DrillRun, branchId: string, options: { readonly recordedResult?: "1-0" | "0-1" | "1/2-1/2" | "*"; readonly shapes?: readonly ShapeTriggerSource[]; readonly engine?: ReadonlyMap<string, ReviewProviderNodeState> } = {}): StoryProjection {
  const importRecord = run.sessionKind === "imported" ? { runId: run.id, result: options.recordedResult ?? "*", movetextDigest: run.sessionDigest } : undefined;
  return reviewStoryMoments(reviewPacketForRun(run, branchId, { ...(importRecord === undefined ? {} : { importRecord }), ...(options.shapes === undefined ? {} : { shapes: options.shapes }), ...(options.engine === undefined ? {} : { engine: options.engine }) }));
}
