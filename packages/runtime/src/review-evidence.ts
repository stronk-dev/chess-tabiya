// rfc/review-evidence-compiler.md §4: the typed, partial post-game Review packet.
//
// One storage-derived recorded-prefix subject; one literal source-adapter registry with executable
// payload parsers and node/incoming-edge grain; a subject-derived invocation plan; private-sealed
// adapter results; one aggregate-sealed packet with node items, exact-occurrence links and total,
// order-independent family folds; and orthogonal progress/degradation. The packet is not a ranking
// and not prose; it selects nothing and grades nothing.

import { branchPath } from "./branch-path.js";
import { importedMainlineBranchId } from "./branch-scale.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import type { DerivedEvidence } from "./evidence-factories.js";
import { orderedReviewEvidence } from "./internal/review-moment-assembly.js";
import { assertRecordedPositionInvocation, assertRecordedReviewResultInvocation, invokeEvidenceValueRoute, readReviewPointInvocation, readReviewPointResultInvocation, readRecordedHumanDivergenceInvocation, readRecordedRulePivotalInvocation, readEndgamePopulationInvocation, readShapeFiringInvocation, readReviewTransitionResultInvocation, readReviewMemberInputs, readLocalReadingInvocation, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "./recorded-review-boundary.js";
import { createRecordedPivotalSource, recordedPivotalData, type RecordedPivotalSource, type PivotalKind, type PivotalMarker, type RecordedHumanDivergenceMarker } from "./pivotal.js";
import {
  PRESENTATION_SOURCE_REASONS,
  REVIEW_PACKET_FAMILY_SEAT,
  presentationDigest,
  sealPresentedItemForOwner,
  type AbstentionOperand,
  type PresentationQuestionId,
  type PresentedEvidenceItem,
} from "./presentation-contract.js";
import { parsePersistedProviderDelivery, serializeProviderDelivery } from "./provider-exchange.js";
import { recordedSemanticPath, type RecordedSemanticPathResult } from "./recorded-semantic-path.js";
import type { RecordedEdge } from "./recorded-edge.js";
import type { ForcedMateAfterMoveProofV2, RecordedPosition, ReviewEnginePoint, ReviewMateTransition, StockfishPositionEvaluation, StockfishPrincipalVariation } from "./review-points.js";
import type { ShapeTriggerSource } from "./shape-firing.js";
import type { DrillRun, EvidencePayload, Node, RunOutcome } from "./types.js";

// ---------------------------------------------------------------------------------------------
// Families and states
// ---------------------------------------------------------------------------------------------

export const REVIEW_SOURCE_FAMILIES = Object.freeze(["engine_eval", "engine_wdl", "tablebase", "semantic", "opening", "human_model", "human_corpus", "authored", "recorded"] as const);
export type ReviewSourceFamily = (typeof REVIEW_SOURCE_FAMILIES)[number];

export const REVIEW_UNAVAILABLE_REASONS = Object.freeze(["provider_off", "provider_failed", "retry_exhausted", "legacy_provenance_missing", "input_abstained", "attempt_history_capacity"] as const);
export type ReviewUnavailableReason = (typeof REVIEW_UNAVAILABLE_REASONS)[number];

export type ReviewAdapterState =
  | { readonly kind: "available"; readonly itemCount: number }
  | { readonly kind: "honest_empty"; readonly reason: "no_observation" | "outside_domain" }
  | { readonly kind: "not_requested" }
  | { readonly kind: "not_yet_scheduled" }
  | { readonly kind: "pending"; readonly jobCount: number; readonly retrying: number }
  | { readonly kind: "unavailable"; readonly reason: ReviewUnavailableReason };

export interface ReviewNodeFamilyState {
  readonly itemCount: number;
  readonly sources: readonly {
    readonly adapterId: ReviewPacketSourceAdapterId;
    readonly invocationId: string;
    readonly grain: "node" | "incoming_edge";
    readonly state: ReviewAdapterState;
  }[];
}

export interface ReviewRunFamilyState {
  readonly nodeCount: number;
  readonly applicableSourceCount: number;
  readonly availableNodeCount: number;
  readonly itemCount: number;
  readonly sourceCounts: { readonly available: number; readonly honestEmpty: number; readonly notRequested: number; readonly notYetScheduled: number; readonly pending: number; readonly unavailable: number };
  readonly progress: { readonly notYetScheduledSourceCount: number; readonly pendingSourceCount: number; readonly pendingJobCount: number; readonly retryingJobCount: number };
  readonly unavailable: readonly { readonly reason: ReviewUnavailableReason; readonly sourceCount: number; readonly nodeCount: number }[];
}

export type ReviewProgress =
  | { readonly kind: "settled" }
  | { readonly kind: "progressive"; readonly pendingNodeCount: number; readonly pendingJobCount: number; readonly retryingJobCount: number; readonly notYetScheduledNodeCount: number };

export type ReviewDegradation =
  | { readonly kind: "healthy" }
  | { readonly kind: "degraded"; readonly unavailableFamilies: readonly { readonly family: ReviewSourceFamily; readonly reasons: readonly { readonly reason: ReviewUnavailableReason; readonly nodeCount: number }[] }[] };

export class ReviewEvidenceError extends TypeError {
  readonly code: "REVIEW_PREFIX_REFUSED" | "REVIEW_PACKET_INVALID" | "REVIEW_SOURCE_INVALID";
  constructor(code: ReviewEvidenceError["code"], message: string) {
    super(`${code}: ${message}`);
    this.name = "ReviewEvidenceError";
    this.code = code;
  }
}
const refuse = (code: ReviewEvidenceError["code"], message: string): never => { throw new ReviewEvidenceError(code, message); };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;
/** Pieces on the board field of a FEN (the tablebase material domain is at most seven). */
const countFenPieces = (fen: string): number => [...(fen.split(" ")[0] ?? "")].filter((char) => /[prnbqk]/iu.test(char)).length;
const V1 = (id: string): VersionedEvidenceId => Object.freeze({ id, version: 1 });
const V2 = (id: string): VersionedEvidenceId => Object.freeze({ id, version: 2 });

// ---------------------------------------------------------------------------------------------
// §4 — the recorded-prefix subject: derived from parsed storage, never supplied by a caller
// ---------------------------------------------------------------------------------------------

export type ReviewOutcomeReceipt =
  | { readonly kind: "board_terminal"; readonly eventSeq: number; readonly nodeId: string; readonly result: RunOutcome }
  | { readonly kind: "recorded_result"; readonly sourceDigest: string; readonly result: "1-0" | "0-1" | "1/2-1/2" }
  | { readonly kind: "unfinished" };

export interface ReviewRecordedPrefixReceipt {
  readonly protocol: "review-recorded-prefix@1";
  readonly runId: string;
  readonly branchId: string;
  readonly eventHead: { readonly seq: number; readonly digest: string };
  readonly tipNodeId: string;
  readonly pathNodeIds: readonly string[];
  readonly prefixDigest: string;
  readonly learnerSide: "white" | "black";
  readonly outcome: ReviewOutcomeReceipt;
  readonly subjectDigest: string;
}

/** The parsed import record image the storage authority owns (`ImportedGameRecord`'s relevant fields). */
export interface ReviewImportRecordImage {
  readonly runId: string;
  readonly result: "1-0" | "0-1" | "1/2-1/2" | "*";
  readonly movetextDigest: string;
}

/**
 * The server-local storage authority: it returns only parser-sealed production images. Neither a
 * route nor the compiler caller supplies a run, a path, an outcome or a learner side.
 */
export interface ReviewStorageAuthority {
  readonly loadRun: (runId: string) => DrillRun | undefined;
  readonly loadImportRecord: (runId: string) => ReviewImportRecordImage | undefined;
}

export interface ReviewPrefixAuthorizationInput { readonly runId: string; readonly branchId: string }

interface PrefixSnapshot {
  readonly currentSubjectDigest: () => string;
  readonly run: DrillRun;
  readonly path: readonly Node[];
  readonly semantic: RecordedSemanticPathResult;
}
const PREFIXES = new WeakMap<object, PrefixSnapshot>();

function learnerResult(result: "1-0" | "0-1" | "1/2-1/2", side: "white" | "black"): RunOutcome {
  if (result === "1/2-1/2") return "draw";
  return (result === "1-0") === (side === "white") ? "win" : "loss";
}

/**
 * Builds the sole constructor of `ReviewRecordedPrefixReceipt`, closed over one storage authority.
 * It requires contiguous event sequences, hashes the canonical event prefix and the complete
 * ordered path, derives the learner side from the stored run and the outcome from an exact on-path
 * `outcome.reached` event or the storage-owned import record, and rejects crossed/disagreeing
 * records.
 */
export function createReviewPrefixAuthority(storage: ReviewStorageAuthority): (input: ReviewPrefixAuthorizationInput) => ReviewRecordedPrefixReceipt {
  // Identity replay reads storage again. Issuance alone computes semantic evidence; checking a
  // receipt must neither mint another receipt nor rerun the chess collectors.
  const readPrefix = (input: ReviewPrefixAuthorizationInput) => {
    if (typeof input !== "object" || input === null || Object.keys(input).sort().join("|") !== "branchId|runId" || typeof input.runId !== "string" || typeof input.branchId !== "string") refuse("REVIEW_PREFIX_REFUSED", "prefix input is exactly { runId, branchId }");
    const run = storage.loadRun(input.runId) ?? refuse("REVIEW_PREFIX_REFUSED", `run ${input.runId} is not stored`);
    if (run.id !== input.runId) refuse("REVIEW_PREFIX_REFUSED", "stored run identity differs from the requested run");
    const events = run.events;
    if (events.length === 0) refuse("REVIEW_PREFIX_REFUSED", "a stored run has at least its start event");
    for (let index = 1; index < events.length; index += 1) if (events[index]!.seq !== events[index - 1]!.seq + 1) refuse("REVIEW_PREFIX_REFUSED", `event sequence is not contiguous at ${events[index]!.seq}`);
    let path: readonly Node[];
    try { path = branchPath(run, input.branchId); } catch (error) { return refuse("REVIEW_PREFIX_REFUSED", error instanceof Error ? error.message : String(error)); }
    const pathIds = new Set(path.map((node) => node.id));
    const record = storage.loadImportRecord(run.id);
    if (record !== undefined && record.runId !== run.id) refuse("REVIEW_PREFIX_REFUSED", "import record belongs to another run");
    if (record !== undefined && run.sessionKind !== "imported") refuse("REVIEW_PREFIX_REFUSED", "an import record is present for a non-imported run");
    if (record === undefined && run.sessionKind === "imported") refuse("REVIEW_PREFIX_REFUSED", "an imported run has no import record");
    const terminal = [...events].reverse().find((event) => event.type === "outcome.reached" && pathIds.has(event.data.nodeId));
    // A PGN result describes its imported mainline, never a learner's later rehearsal branch.
    // Keep validating the stored import record above, but do not borrow its result or compare
    // an alternate line's actual terminal outcome against a different game's ending.
    const resultRecord = input.branchId === importedMainlineBranchId(run) ? record : undefined;
    let outcome: ReviewOutcomeReceipt;
    if (terminal?.type === "outcome.reached") {
      if (resultRecord !== undefined && resultRecord.result !== "*" && learnerResult(resultRecord.result, run.start.side) !== terminal.data.outcome) refuse("REVIEW_PREFIX_REFUSED", "the import record result disagrees with the on-path terminal");
      outcome = { kind: "board_terminal", eventSeq: terminal.seq, nodeId: terminal.data.nodeId, result: terminal.data.outcome };
    } else if (resultRecord !== undefined && resultRecord.result !== "*") {
      outcome = { kind: "recorded_result", sourceDigest: presentationDigest("review.import-record@1", { runId: resultRecord.runId, result: resultRecord.result, movetextDigest: resultRecord.movetextDigest }), result: resultRecord.result };
    } else {
      outcome = { kind: "unfinished" };
    }
    const head = events.at(-1)!;
    const eventHead = { seq: head.seq, digest: presentationDigest("review.event-prefix@1", events) };
    const pathNodeIds = path.map((node) => node.id);
    const prefixDigest = presentationDigest("review.prefix@1", { eventHead, path: path.map((node) => ({ id: node.id, parentId: node.parentId, ply: node.ply, fen: node.fen, moveUci: node.moveUci })) });
    const body = { protocol: "review-recorded-prefix@1" as const, runId: run.id, branchId: input.branchId, eventHead, tipNodeId: pathNodeIds.at(-1)!, pathNodeIds, prefixDigest, learnerSide: run.start.side, outcome };
    return { run, path, body };
  };
  const authorizeReviewRecordedPrefix = (input: ReviewPrefixAuthorizationInput): ReviewRecordedPrefixReceipt => {
    const { run, path, body } = readPrefix(input);
    const semantic = recordedSemanticPath(run, body.branchId);
    if (semantic.kind === "available" && semantic.pathNodeIds.join("\u0000") !== path.map((node) => node.id).join("\u0000")) refuse("REVIEW_PREFIX_REFUSED", "recorded semantic path disagrees with the branch path");
    const receipt = deepFreeze({ ...body, subjectDigest: presentationDigest("review.subject@1", body) });
    const address = Object.freeze({ runId: body.runId, branchId: body.branchId });
    PREFIXES.set(receipt, Object.freeze({ currentSubjectDigest: () => presentationDigest("review.subject@1", readPrefix(address).body), run, path: Object.freeze([...path]), semantic }));
    return receipt;
  };
  return authorizeReviewRecordedPrefix;
}

/**
 * Replays the derivation: the value must be the private issuer's own frozen object AND a fresh
 * derivation from storage must produce byte-identical fields. A spread, JSON copy or a stale head fails.
 */
export function assertReviewRecordedPrefixReceipt(value: unknown): asserts value is ReviewRecordedPrefixReceipt {
  const snapshot = typeof value === "object" && value !== null ? PREFIXES.get(value) : undefined;
  if (snapshot === undefined || !Object.isFrozen(value)) refuse("REVIEW_PREFIX_REFUSED", "prefix receipt was not issued by authorizeReviewRecordedPrefix");
  const receipt = value as ReviewRecordedPrefixReceipt;
  if (snapshot!.currentSubjectDigest() !== receipt.subjectDigest) refuse("REVIEW_PREFIX_REFUSED", "prefix receipt no longer matches its storage authority");
}

function snapshotOf(subject: ReviewRecordedPrefixReceipt): PrefixSnapshot {
  assertReviewRecordedPrefixReceipt(subject);
  const snapshot = PREFIXES.get(subject);
  if (snapshot === undefined) refuse("REVIEW_PREFIX_REFUSED", "subject was not issued by authorizeReviewRecordedPrefix");
  return snapshot!;
}

/** Server-local: the exact stored run and ordered path of an authorized subject. Absent from the barrel. */
export function reviewSubjectPath(subject: ReviewRecordedPrefixReceipt): { readonly run: DrillRun; readonly path: readonly Node[] } {
  const snapshot = snapshotOf(subject);
  return Object.freeze({ run: snapshot.run, path: snapshot.path });
}

// ---------------------------------------------------------------------------------------------
// §4.2 — the literal source-adapter registry (family, projection, grain, executable parser)
// ---------------------------------------------------------------------------------------------

/** What the application-lifetime coordinator knows about one node's shared engine request. */
export type ReviewProviderNodeState =
  | { readonly kind: "delivered"; readonly delivery: DeclaredEvidence<StockfishPositionEvaluation> }
  /** A position with no legal move (checkmate/stalemate) is outside a search's domain. */
  | { readonly kind: "honest_empty"; readonly reason: "outside_domain" }
  | { readonly kind: "not_requested" }
  | { readonly kind: "not_yet_scheduled" }
  | { readonly kind: "pending"; readonly jobCount: number; readonly retrying: number }
  | { readonly kind: "unavailable"; readonly reason: Exclude<ReviewUnavailableReason, "input_abstained"> };

/** Typed, non-evidence source context: provider states and registered shape entries. */
export interface ReviewSourceContext {
  readonly engine: ReadonlyMap<string, ReviewProviderNodeState>;
  readonly shapes: readonly ShapeTriggerSource[];
}

interface Slot {
  readonly invocationId: string;
  readonly adapterId: ReviewPacketSourceAdapterId;
  readonly nodeId: string;
  readonly grain: "node" | "incoming_edge";
  readonly fromNodeId: string | null;
  readonly window: number;
}

interface SourceOutcome { readonly state: ReviewAdapterState; readonly items: readonly DeclaredEvidence<unknown>[] }

interface Memo {
  readonly points: Map<string, DeclaredEvidence<ReviewEnginePoint> | ReviewAdapterState>;
  readonly pointInvocations: Map<string, EvidenceValueRouteResults["derived.review.eval_point@1"]>;
  readonly positions: Map<string, DeclaredEvidence<RecordedPosition>>;
  readonly edges: Map<string, DeclaredEvidence<RecordedEdge>>;
  pivotal?: ReadonlyMap<string, readonly DeclaredEvidence<unknown>[]>;
  shapes?: ReadonlyMap<string, readonly DeclaredEvidence<unknown>[]>;
  consequence?: readonly { readonly nodeId: string; readonly evidence: DeclaredEvidence<unknown> }[];
  importedResult?: EvidenceValueRouteResults["run.record.imported_result@1"];
  recordedConsequence?: EvidenceValueRouteResults["run.record.consequence@1"];
  scopedPivotal?: Map<PivotalKind, Readonly<{ source: RecordedPivotalSource; items: readonly DerivedEvidence<PivotalMarker>[] }>>;
  endgame?: Map<string, readonly DeclaredEvidence<unknown>[]>;
  transitions?: Map<string, EvidenceValueRouteResults["derived.review.eval_delta@2"] | EvidenceValueRouteResults["derived.review.mate_transition@2"]>;
  shapeInvocation?: readonly DeclaredEvidence<unknown>[];
}

interface NodeSourceExecution {
  readonly snapshot: { readonly run: DrillRun; readonly path: readonly Node[] };
  readonly byId: ReadonlyMap<string, Node>;
  readonly context: ReviewSourceContext;
  readonly memo: Memo;
}
interface ExecutionContext extends NodeSourceExecution {
  readonly kind: "packet";
  readonly subject: ReviewRecordedPrefixReceipt;
  readonly snapshot: PrefixSnapshot;
}
interface RecordedPointExecution extends NodeSourceExecution { readonly kind: "recorded"; readonly recordedReview: RecordedReviewBoundary;
  readonly boundaryImage: ReturnType<typeof readRecordedReviewBoundary>; readonly shapePath?: readonly { readonly id: string; readonly fen: string }[] }
type SourceExecution = ExecutionContext | RecordedPointExecution;
const SOURCE_EXECUTIONS = new WeakSet<object>();
function assertSourceExecution(value: NodeSourceExecution): asserts value is SourceExecution {
  if (!SOURCE_EXECUTIONS.has(value)) throw new TypeError("Review adapter execution was not issued by its source owner");
}

export interface ReviewPacketSourceAdapter<Context = SourceExecution> {
  readonly id: string;
  readonly projection: VersionedEvidenceId;
  readonly family: ReviewSourceFamily;
  readonly grain: "node" | "incoming_edge";
  /** Executable exact payload parser; evidence authority is admitted only after it succeeds. */
  readonly parser: (payload: unknown) => unknown;
  readonly operation: (slot: Slot, execution: Context) => SourceOutcome;
}

/** Registry operations are callable, but their execution context is always privately issued. */
function sourceAdapter<Context extends NodeSourceExecution = SourceExecution>(entry: ReviewPacketSourceAdapter<Context>): ReviewPacketSourceAdapter<Context> {
  return Object.freeze({ ...entry, operation: (slot: Slot, execution: Context) => {
    assertSourceExecution(execution);
    // The owning operation checks current storage at entry/publication/readback. Do not turn
    // every cheap registered slot into another full storage replay/digest scan.
    return entry.operation(slot, execution);
  } });
}
function packetExecution(execution: SourceExecution): ExecutionContext {
  if (execution.kind !== "packet") throw new TypeError("This Review adapter is not in the recorded source image");
  return execution;
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);
function exactPayload(keys: readonly string[], label: string, optional: readonly string[] = []): (payload: unknown) => unknown {
  const allowed = new Set([...keys, ...optional]);
  return (payload) => {
    if (!isRecord(payload)) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `${label} payload is not an object`);
    for (const key of Object.keys(payload)) if (!allowed.has(key)) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `${label} payload has the undeclared key ${key}`);
    for (const key of keys) if (!(key in payload)) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `${label} payload omits ${key}`);
    return payload;
  };
}

const available = (items: readonly DeclaredEvidence<unknown>[]): SourceOutcome => items.length === 0 ? { state: { kind: "honest_empty", reason: "no_observation" }, items: [] } : { state: { kind: "available", itemCount: items.length }, items };
const stateOnly = (state: ReviewAdapterState): SourceOutcome => ({ state, items: [] });
const NO_OBSERVATION: ReviewAdapterState = Object.freeze({ kind: "honest_empty", reason: "no_observation" });

function positionOf(execution: NodeSourceExecution, nodeId: string): DeclaredEvidence<RecordedPosition> {
  let position = execution.memo.positions.get(nodeId);
  if (position === undefined) {
    position = invokeEvidenceValueRoute("run.record.position@1", { run: execution.snapshot.run, nodeId }) as DeclaredEvidence<RecordedPosition>;
    execution.memo.positions.set(nodeId, position);
  }
  return position;
}

function edgeOf(execution: NodeSourceExecution, slot: Slot): DeclaredEvidence<RecordedEdge> {
  let edge = execution.memo.edges.get(slot.nodeId);
  if (edge === undefined) {
    const child = execution.byId.get(slot.nodeId)!;
    const parent = execution.byId.get(slot.fromNodeId!)!;
    edge = invokeEvidenceValueRoute("run.record.edge@1", { run: execution.snapshot.run, parent, child }) as DeclaredEvidence<RecordedEdge>;
    execution.memo.edges.set(slot.nodeId, edge);
  }
  return edge;
}

/** The node's review point, or the adapter state that stands in its place. */
function pointOf(execution: NodeSourceExecution, nodeId: string): DeclaredEvidence<ReviewEnginePoint> | ReviewAdapterState {
  const cached = execution.memo.points.get(nodeId);
  if (cached !== undefined) return cached;
  const provider = execution.context.engine.get(nodeId) ?? { kind: "not_requested" as const };
  let result: DeclaredEvidence<ReviewEnginePoint> | ReviewAdapterState;
  if (provider.kind === "delivered") {
    const point = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: provider.delivery, position: positionOf(execution, nodeId) });
    execution.memo.pointInvocations.set(nodeId, point);
    result = point.kind === "available" ? point.value : Object.freeze({ kind: "unavailable" as const, reason: "input_abstained" as const });
  } else {
    result = provider;
  }
  execution.memo.points.set(nodeId, result);
  return result;
}

const isPoint = (value: DeclaredEvidence<ReviewEnginePoint> | ReviewAdapterState): value is DeclaredEvidence<ReviewEnginePoint> => "payload" in value;

/** Combines two endpoint states for an edge derivation: pending/unavailable propagate, never erase. */
function endpointState(before: ReviewAdapterState, after: ReviewAdapterState): ReviewAdapterState {
  const states = [before, after];
  const unavailable = states.find((state) => state.kind === "unavailable");
  if (unavailable !== undefined) return unavailable;
  const outside = states.find((state) => state.kind === "honest_empty");
  if (outside !== undefined) return outside;
  const pending = states.filter((state): state is Extract<ReviewAdapterState, { kind: "pending" }> => state.kind === "pending");
  if (pending.length > 0) return { kind: "pending", jobCount: pending.reduce((sum, state) => sum + state.jobCount, 0), retrying: pending.reduce((sum, state) => sum + state.retrying, 0) };
  if (states.some((state) => state.kind === "not_yet_scheduled")) return { kind: "not_yet_scheduled" };
  if (states.some((state) => state.kind === "not_requested")) return { kind: "not_requested" };
  return { kind: "unavailable", reason: "input_abstained" };
}

function edgePoints(slot: Slot, execution: NodeSourceExecution): { readonly before: DeclaredEvidence<ReviewEnginePoint>; readonly after: DeclaredEvidence<ReviewEnginePoint> } | ReviewAdapterState {
  const before = pointOf(execution, slot.fromNodeId!);
  const after = pointOf(execution, slot.nodeId);
  if (isPoint(before) && isPoint(after)) return { before, after };
  const beforeState: ReviewAdapterState = isPoint(before) ? { kind: "available", itemCount: 1 } : before;
  const afterState: ReviewAdapterState = isPoint(after) ? { kind: "available", itemCount: 1 } : after;
  return endpointState(beforeState, afterState);
}

function pivotalAt(execution: ExecutionContext, nodeId: string, projection: string): readonly DeclaredEvidence<unknown>[] {
  if (execution.memo.pivotal === undefined) {
    const byNode = new Map<string, DeclaredEvidence<unknown>[]>();
    for (const route of ["derived.pivotal.irreversibility@1", "derived.pivotal.phase_change@1", "derived.pivotal.human_divergence@1", "derived.pivotal.option_collapse@1"] as const) {
      for (const derived of invokeEvidenceValueRoute(route, { run: execution.snapshot.run, branchId: execution.subject.branchId })) {
        const node = (derived.evidence.payload as { readonly nodeId: string }).nodeId;
        byNode.set(node, [...(byNode.get(node) ?? []), derived.evidence as DeclaredEvidence<unknown>]);
      }
    }
    execution.memo.pivotal = byNode;
  }
  return (execution.memo.pivotal.get(nodeId) ?? []).filter((item) => item.projection.id === projection);
}

function shapesAt(execution: SourceExecution, nodeId: string): readonly DeclaredEvidence<unknown>[] {
  if (execution.memo.shapes === undefined) {
    const byNode = new Map<string, DeclaredEvidence<unknown>[]>();
    const path = execution.kind === "recorded" ? execution.shapePath! : execution.snapshot.path.map((node) => ({ id: node.id, fen: node.fen }));
    const firings = invokeEvidenceValueRoute("theory.shapes.firing@1", { entries: execution.context.shapes, path });
    if (execution.kind === "recorded") { readShapeFiringInvocation(firings, execution.context.shapes, path); execution.memo.shapeInvocation = firings; }
    for (const firing of firings) {
      const node = (firing.payload as { readonly firstNodeId: string }).firstNodeId;
      byNode.set(node, [...(byNode.get(node) ?? []), firing]);
    }
    execution.memo.shapes = byNode;
  }
  return execution.memo.shapes.get(nodeId) ?? [];
}

const semanticEventAdapter = (id: string): ReviewPacketSourceAdapter => sourceAdapter({
  id: `review.source.${id}@2`,
  projection: V2(id),
  family: "semantic",
  grain: "node",
  parser: (payload: unknown) => { if (!isRecord(payload)) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `${id}@2 payload is not an object`); return payload; },
  operation: (slot: Slot, execution: SourceExecution) => {
    const semantic = packetExecution(execution).snapshot.semantic;
    if (semantic.kind !== "available") return stateOnly({ kind: "unavailable", reason: "input_abstained" });
    return available(semantic.events.filter((event) => event.anchor.nodeId === slot.nodeId && event.projection.id === id && event.projection.version === 2).map((event) => event.evidence as DeclaredEvidence<unknown>));
  },
});

const RECORDED_PATH_EVENT_IDS = Object.freeze([
  "derived.exchange.trade_completed", "derived.pawn.sequence.contact_timing", "derived.pawn.sequence.harassment_pressure",
  "derived.tactic.sequence.defender_consequence", "derived.tactic.square_clearance_observed", "derived.tactic.line_blocker_clearance_observed",
  "derived.tactic.deflection_observed", "derived.tactic.attraction_observed", "derived.tactic.interference_observed",
  "derived.tactic.check_zwischenzug_observed", "derived.tactic.overload_exploitation_observed",
]);

const pivotalAdapter = (kind: PivotalKind): ReviewPacketSourceAdapter => sourceAdapter({
  id: `review.source.pivotal.${kind}@1`,
  projection: V1(`derived.pivotal.${kind}`),
  family: "semantic",
  grain: "node",
  parser: exactPayload(["nodeId", "kind", "detail", "provenanceNote"], `derived.pivotal.${kind}@1`),
  operation: (slot: Slot, execution: SourceExecution) => {
    if (execution.kind === "packet") return available(pivotalAt(execution, slot.nodeId, `derived.pivotal.${kind}`));
    if (kind !== "irreversibility") throw new TypeError("A predecessor pivotal adapter cannot serve the recorded image");
    return recordedPivotalAt(execution, slot.nodeId, kind);
  },
});

const RECORDED_PIVOTAL_ROUTES = Object.freeze({ irreversibility: "derived.pivotal.irreversibility@1", phase_change: "derived.pivotal.phase_change@2",
  human_divergence: "derived.pivotal.human_divergence@2", option_collapse: "derived.pivotal.option_collapse@2" } as const);
function recordedPivotalAt(execution: RecordedPointExecution, nodeId: string, kind: PivotalKind): SourceOutcome {
  execution.memo.scopedPivotal ??= new Map();
  let invocation = execution.memo.scopedPivotal.get(kind);
  if (invocation === undefined) {
    const image = readRecordedReviewBoundary(execution.recordedReview);
    const source = createRecordedPivotalSource({ run: image.run, branchId: image.request.branchId, throughNodeId: image.request.throughNodeId, kind });
    const items = invokeEvidenceValueRoute(RECORDED_PIVOTAL_ROUTES[kind], { recordedPivotal: source });
    invocation = Object.freeze({ source, items }); execution.memo.scopedPivotal.set(kind, invocation);
  }
  if (kind === "human_divergence") {
    const proof = readRecordedHumanDivergenceInvocation(invocation.items as readonly DerivedEvidence<RecordedHumanDivergenceMarker>[], invocation.source);
    if (proof.observations.some(row => row.event.data.nodeId === nodeId && row.disposition === "source_absent")) return stateOnly({ kind: "unavailable", reason: "input_abstained" });
  } else readRecordedRulePivotalInvocation(invocation.items, invocation.source);
  return available(invocation.items.filter(item => item.evidence.payload.nodeId === nodeId).map(item => item.evidence));
}
const scopedPivotalAdapter = (kind: Exclude<PivotalKind, "irreversibility">): ReviewPacketSourceAdapter => sourceAdapter({
  id: `review.source.pivotal.${kind}@2`, projection: V2(`derived.pivotal.${kind}`), family: "semantic", grain: "node",
  parser: exactPayload(["nodeId", "kind", "detail", "provenanceNote", ...(kind === "human_divergence" ? ["selection", "position"] : [])], `derived.pivotal.${kind}@2`),
  operation: (slot, execution) => {
    if (execution.kind !== "recorded") throw new TypeError("A scoped pivotal adapter requires the genuine recorded execution");
    return recordedPivotalAt(execution, slot.nodeId, kind);
  },
});

const POSITION_SOURCE_ADAPTER = sourceAdapter<NodeSourceExecution>({ id: "review.source.position@1", projection: V1("run.record.position"), family: "recorded", grain: "node", parser: exactPayload(["nodeId", "ply", "fen"], "run.record.position@1"), operation: (slot, execution) => available([positionOf(execution, slot.nodeId)]) });
const IMPORTED_RESULT_SOURCE_ADAPTER = sourceAdapter({ id: "review.source.imported_result@1", projection: V1("run.record.imported_result"), family: "recorded", grain: "node", parser: exactPayload(["context", "result"], "run.record.imported_result@1"), operation: (slot, execution) => {
  if ("recordedReview" in execution) {
    execution.memo.importedResult ??= invokeEvidenceValueRoute("run.record.imported_result@1", { recordedReview: execution.recordedReview });
    assertRecordedReviewResultInvocation(execution.memo.importedResult, "run.record.imported_result@1", execution.recordedReview);
    return available(execution.memo.importedResult.filter(item => item.nodeId === slot.nodeId).map(item => item.evidence));
  }
  const outcome = execution.subject.outcome;
  if (outcome.kind !== "recorded_result" || slot.nodeId !== execution.subject.tipNodeId) return stateOnly(NO_OBSERVATION);
  return available(invokeEvidenceValueRoute("run.record.imported_result@1", { run: execution.snapshot.run, branchId: execution.subject.branchId, recordedResult: outcome.result }).map(item => item.evidence));
} });
const POINT_SOURCE_ADAPTER = sourceAdapter<NodeSourceExecution>({ id: "review.source.eval_point@1", projection: V1("derived.review.eval_point"), family: "engine_eval", grain: "node", parser: exactPayload(["projectionId", "position", "evaluation"], "derived.review.eval_point@1"), operation: (slot, execution) => {
  const point = pointOf(execution, slot.nodeId);
  return isPoint(point) ? available([point]) : stateOnly(point);
} });

/** One registry. Closed packet/recorded ID images below select these same actual objects. */
export const REVIEW_PACKET_SOURCE_ADAPTERS = Object.freeze([
  // recorded
  POSITION_SOURCE_ADAPTER,
  sourceAdapter({ id: "review.source.edge@1", projection: V1("run.record.edge"), family: "recorded", grain: "incoming_edge", parser: exactPayload(["runId", "edgeBranchId", "beforeNodeId", "afterNodeId", "beforeFen", "afterFen", "moveUci", "moveSan", "ply"], "run.record.edge@1"), operation: (slot, execution) => available([edgeOf(execution, slot)]) }),
  sourceAdapter({ id: "review.source.consequence@1", projection: V1("run.record.consequence"), family: "recorded", grain: "node", parser: exactPayload(["context", "terminal"], "run.record.consequence@1", ["outcome", "plies", "objectiveState"]), operation: (slot, execution) => {
    if (execution.kind === "recorded") {
      execution.memo.recordedConsequence ??= invokeEvidenceValueRoute("run.record.consequence@1", { recordedReview: execution.recordedReview });
      assertRecordedReviewResultInvocation(execution.memo.recordedConsequence, "run.record.consequence@1", execution.recordedReview);
      return available(execution.memo.recordedConsequence.filter(item => item.nodeId === slot.nodeId).map(item => item.evidence));
    }
    execution.memo.consequence ??= invokeEvidenceValueRoute("run.record.consequence@1", { run: execution.snapshot.run, branchId: execution.subject.branchId }).map((item) => ({ nodeId: item.nodeId, evidence: item.evidence as DeclaredEvidence<unknown> }));
    return available(execution.memo.consequence.filter((item) => item.nodeId === slot.nodeId).map((item) => item.evidence));
  } }),
  IMPORTED_RESULT_SOURCE_ADAPTER,
  // engine_eval: one shared delivery per node supplies score and raw WDL
  POINT_SOURCE_ADAPTER,
  sourceAdapter({ id: "review.source.eval_delta@2", projection: V2("derived.review.eval_delta"), family: "engine_eval", grain: "incoming_edge", parser: exactPayload(["projectionId", "before", "after", "deltaCp"], "derived.review.eval_delta@2"), operation: (slot, execution) => {
    const points = edgePoints(slot, execution);
    if (!("before" in points)) return stateOnly(points);
    const delta = invokeEvidenceValueRoute("derived.review.eval_delta@2", points);
    if (execution.kind === "recorded") { execution.memo.transitions ??= new Map(); execution.memo.transitions.set(slot.invocationId, delta); }
    if (delta.kind === "available") return available([delta.value]);
    return stateOnly(delta.reason === "mate_operand" ? NO_OBSERVATION : { kind: "unavailable", reason: "input_abstained" });
  } }),
  sourceAdapter({ id: "review.source.mate_transition@2", projection: V2("derived.review.mate_transition"), family: "engine_eval", grain: "incoming_edge", parser: exactPayload(["projectionId", "before", "after", "changes"], "derived.review.mate_transition@2"), operation: (slot, execution) => {
    const points = edgePoints(slot, execution);
    if (!("before" in points)) return stateOnly(points);
    const transition = invokeEvidenceValueRoute("derived.review.mate_transition@2", points);
    if (execution.kind === "recorded") { execution.memo.transitions ??= new Map(); execution.memo.transitions.set(slot.invocationId, transition); }
    if (transition.kind === "available") return available([transition.value]);
    return stateOnly(transition.reason === "no_mate_operand" || transition.reason === "no_mate_transition" ? NO_OBSERVATION : { kind: "unavailable", reason: "input_abstained" });
  } }),
  // engine_wdl: the same delivery, normalized node-free, then joined by exact FEN
  sourceAdapter({ id: "review.source.wdl_point@1", projection: V1("derived.review.wdl_point"), family: "engine_wdl", grain: "node", parser: exactPayload(["projectionId", "position", "normalized"], "derived.review.wdl_point@1"), operation: (slot, execution) => {
    const provider = execution.context.engine.get(slot.nodeId) ?? { kind: "not_requested" as const };
    if (provider.kind !== "delivered") return stateOnly(provider);
    const normalized = invokeEvidenceValueRoute("derived.review.wdl_white@1", { evaluation: provider.delivery });
    const point = invokeEvidenceValueRoute("derived.review.wdl_point@1", { normalized, position: positionOf(execution, slot.nodeId) });
    return point.kind === "available" ? available([point.value]) : stateOnly({ kind: "unavailable", reason: "input_abstained" });
  } }),
  // tablebase: requested only inside the declared material domain (baseline pass: not requested)
  sourceAdapter({ id: "review.source.tablebase@1", projection: V1("live.syzygy.position_result"), family: "tablebase", grain: "node", parser: exactPayload(["kind", "servedAt", "cacheIdentity", "acquisition", "payload", "payloadReceipt"], "live.syzygy.position_result@1"), operation: (slot, execution) => countFenPieces(execution.byId.get(slot.nodeId)!.fen) > 7 ? stateOnly({ kind: "honest_empty", reason: "outside_domain" }) : stateOnly({ kind: "not_requested" }) }),
  // semantic
  ...(["irreversibility", "phase_change", "human_divergence", "option_collapse"] as const).map(pivotalAdapter),
  sourceAdapter({ id: "review.source.endgame@1", projection: V1("rules.endgame.classification"), family: "semantic", grain: "node", parser: exactPayload(["fen", "type", "conventionId", "provenanceNote"], "rules.endgame.classification@1"), operation: (slot, execution) => {
    const fen = execution.byId.get(slot.nodeId)!.fen, items = invokeEvidenceValueRoute("rules.endgame.classification@1", { fen });
    if (execution.kind === "recorded") { readEndgamePopulationInvocation(items, fen); execution.memo.endgame ??= new Map(); execution.memo.endgame.set(slot.nodeId, items); }
    return available(items);
  } }),
  ...RECORDED_PATH_EVENT_IDS.map(semanticEventAdapter),
  sourceAdapter({ id: "review.source.forced_mate@2", projection: V2("rules.tactic.consequence.forced_mate_after_move"), family: "semantic", grain: "incoming_edge", parser: exactPayload(["beforeFen", "candidate", "afterFen", "attacker", "maxAttackerMoves", "proofStatus", "proofDigest", "rootReplies", "nodes"], "rules.tactic.consequence.forced_mate_after_move@2"), operation: (slot, execution) => {
    // The exact proof is requested only where the shared engine delivery reports a mate for the
    // mover inside the proof horizon; elsewhere the baseline pass does not request it.
    const points = edgePoints(slot, execution);
    if (!("before" in points)) return stateOnly({ kind: "not_requested" });
    const after = points.after.payload.evaluation.payload.payload.score;
    const parent = execution.byId.get(slot.fromNodeId!)!;
    const child = execution.byId.get(slot.nodeId)!;
    const mover = parent.fen.split(" ")[1] === "w" ? "white" : "black";
    if (after.kind !== "mate" || after.side !== mover || after.distance + 1 > 4 || child.moveUci === null) return stateOnly({ kind: "not_requested" });
    const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", { beforeFen: parent.fen, moveUci: child.moveUci, afterFen: child.fen });
    const proof = invokeEvidenceValueRoute("rules.tactic.consequence.forced_mate_after_move@2", { beforeFen: parent.fen, breadth, maxAttackerMoves: after.distance + 1 });
    return proof.kind === "available" ? available([proof.value as DeclaredEvidence<unknown>]) : stateOnly({ kind: "unavailable", reason: "input_abstained" });
  } }),
  // opening / human / authored
  sourceAdapter({ id: "review.source.opening@1", projection: V1("theory.opening.current_endpoint"), family: "opening", grain: "node", parser: exactPayload(["positionKey", "observedPly", "eco", "name", "sourcePly", "catalogue"], "theory.opening.current_endpoint@1"), operation: () => stateOnly({ kind: "unavailable", reason: "provider_off" }) }),
  sourceAdapter({ id: "review.source.maia@1", projection: V1("human.maia.policy_page"), family: "human_model", grain: "node", parser: exactPayload(["kind", "servedAt", "cacheIdentity", "acquisition", "payload", "payloadReceipt"], "human.maia.policy_page@1"), operation: () => stateOnly({ kind: "not_requested" }) }),
  sourceAdapter({ id: "review.source.explorer@1", projection: V1("human.explorer.position_page"), family: "human_corpus", grain: "node", parser: exactPayload(["kind", "servedAt", "cacheIdentity", "acquisition", "payload", "payloadReceipt"], "human.explorer.position_page@1"), operation: () => stateOnly({ kind: "not_requested" }) }),
  sourceAdapter({ id: "review.source.shapes@1", projection: V1("theory.shapes.firing"), family: "authored", grain: "node", parser: exactPayload(["entryId", "firstNodeId", "lastNodeId", "openEnded"], "theory.shapes.firing@1"), operation: (slot, execution) => available(shapesAt(execution, slot.nodeId)) }),
  ...(["phase_change", "human_divergence", "option_collapse"] as const).map(scopedPivotalAdapter),
].sort((left, right) => left.id.localeCompare(right.id)));

export type ReviewPacketSourceAdapterId = string;
const ADAPTER_BY_ID: ReadonlyMap<string, ReviewPacketSourceAdapter> = new Map(REVIEW_PACKET_SOURCE_ADAPTERS.map((entry) => [entry.id, entry]));
const CURRENT_REVIEW_PACKET_ADAPTER_IDS = Object.freeze([
  "review.source.position@1", "review.source.edge@1", "review.source.consequence@1", "review.source.imported_result@1",
  "review.source.eval_point@1", "review.source.eval_delta@2", "review.source.mate_transition@2", "review.source.wdl_point@1", "review.source.tablebase@1",
  "review.source.pivotal.irreversibility@1", "review.source.pivotal.phase_change@1", "review.source.pivotal.human_divergence@1", "review.source.pivotal.option_collapse@1",
  "review.source.endgame@1", ...RECORDED_PATH_EVENT_IDS.map(id => `review.source.${id}@2`), "review.source.forced_mate@2",
  "review.source.opening@1", "review.source.maia@1", "review.source.explorer@1", "review.source.shapes@1",
].sort());
export const RECORDED_REVIEW_SOURCE_ADAPTER_IDS = Object.freeze([
  "review.source.position@1", "review.source.consequence@1", "review.source.imported_result@1", "review.source.eval_point@1",
  "review.source.eval_delta@2", "review.source.mate_transition@2", "review.source.pivotal.irreversibility@1",
  "review.source.pivotal.phase_change@2", "review.source.pivotal.human_divergence@2", "review.source.pivotal.option_collapse@2",
  "review.source.endgame@1", "review.source.shapes@1",
].sort());
function sourceAdapters(ids: readonly string[]): readonly ReviewPacketSourceAdapter[] {
  if (new Set(ids).size !== ids.length) throw new TypeError("Review source image contains duplicate adapters");
  return Object.freeze(ids.map(id => ADAPTER_BY_ID.get(id) ?? refuse("REVIEW_SOURCE_INVALID", `Review source image names unknown adapter ${id}`)));
}
const CURRENT_REVIEW_PACKET_ADAPTERS = sourceAdapters(CURRENT_REVIEW_PACKET_ADAPTER_IDS);
export const REVIEW_PACKET_SOURCE_PROJECTION_IDS: readonly VersionedEvidenceId[] = Object.freeze(CURRENT_REVIEW_PACKET_ADAPTERS.map(entry => entry.projection));
{
  const projectionKeys = new Set(REVIEW_PACKET_SOURCE_ADAPTERS.map((entry) => refKey(entry.projection)));
  if (ADAPTER_BY_ID.size !== REVIEW_PACKET_SOURCE_ADAPTERS.length || projectionKeys.size !== REVIEW_PACKET_SOURCE_ADAPTERS.length) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", "review source adapters must have unique ids and projections");
  const declared = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map(refKey));
  for (const key of projectionKeys) if (!declared.has(key)) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `review source adapter names undeclared projection ${key}`);
  for (const family of REVIEW_SOURCE_FAMILIES) if (!REVIEW_PACKET_SOURCE_ADAPTERS.some((entry) => entry.family === family)) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `family ${family} has no source adapter`);
}

// ---------------------------------------------------------------------------------------------
// §4 — the subject-derived invocation plan and private-sealed adapter results
// ---------------------------------------------------------------------------------------------

export interface ReviewSourcePlanSlot {
  readonly invocationId: string;
  readonly adapterId: string;
  readonly family: ReviewSourceFamily;
  readonly grain: "node" | "incoming_edge";
  readonly nodeId: string;
  readonly fromNodeId: string | null;
  readonly window: number;
}

/**
 * The exact adapter × node (and adapter × incoming edge, never at the root) invocations. The
 * coordinator-derived window index bounds work admission; it never changes grain or identity.
 */
export function reviewPacketSourcePlan(subject: ReviewRecordedPrefixReceipt, options: { readonly windowNodes: number }): readonly ReviewSourcePlanSlot[] {
  snapshotOf(subject);
  return sourcePlanSlots(subject.pathNodeIds, CURRENT_REVIEW_PACKET_ADAPTERS, options.windowNodes);
}

/** The one slot formula for both current packets and boundary-owned source preparation. */
function sourcePlanSlots(pathNodeIds: readonly string[], adapters: readonly ReviewPacketSourceAdapter[], windowNodes: number): readonly ReviewSourcePlanSlot[] {
  if (!Number.isSafeInteger(windowNodes) || windowNodes < 1) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", "windowNodes must be a positive safe integer");
  const slots: ReviewSourcePlanSlot[] = [];
  for (const entry of adapters) {
    pathNodeIds.forEach((nodeId, index) => {
      if (entry.grain === "incoming_edge" && index === 0) return;
      const fromNodeId = entry.grain === "incoming_edge" ? pathNodeIds[index - 1]! : null;
      slots.push(Object.freeze({ invocationId: `${entry.id}#${entry.grain === "node" ? nodeId : `${fromNodeId}>${nodeId}`}`, adapterId: entry.id, family: entry.family, grain: entry.grain, nodeId, fromNodeId, window: Math.floor(index / windowNodes) }));
    });
  }
  return Object.freeze(slots);
}

export interface ReviewPacketSourceResult {
  readonly subjectDigest: string;
  readonly invocationId: string;
  readonly adapterId: string;
  readonly nodeId: string;
  readonly grain: "node" | "incoming_edge";
  readonly state: ReviewAdapterState;
  readonly items: readonly DeclaredEvidence<unknown>[];
}
const SOURCE_RESULTS = new WeakSet<object>();

/** One private-sealed adapter result: the registered parser runs before evidence is admitted. */
function sealSourceResult(subject: ReviewRecordedPrefixReceipt, slot: ReviewSourcePlanSlot, outcome: SourceOutcome): ReviewPacketSourceResult {
  const entry = ADAPTER_BY_ID.get(slot.adapterId)!;
  for (const item of outcome.items) {
    assertDeclaredEvidence(item);
    if (refKey(item.projection) !== refKey(entry.projection)) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `${entry.id} returned ${refKey(item.projection)}`);
    entry.parser(item.payload);
  }
  if (outcome.state.kind === "available" && outcome.state.itemCount !== outcome.items.length) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `${entry.id} available count disagrees with its items`);
  if (outcome.state.kind !== "available" && outcome.items.length !== 0) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `${entry.id} returned items with a non-available state`);
  const result = Object.freeze({ subjectDigest: subject.subjectDigest, invocationId: slot.invocationId, adapterId: slot.adapterId, nodeId: slot.nodeId, grain: slot.grain, state: Object.freeze({ ...outcome.state }), items: Object.freeze([...outcome.items]) });
  SOURCE_RESULTS.add(result);
  return result;
}

/**
 * Executes every planned adapter invocation over the authorized subject and typed context. The
 * caller supplies provider states and shape entries, never evidence, prose or a family string.
 */
export function runReviewPacketSources(subject: ReviewRecordedPrefixReceipt, context: ReviewSourceContext, options: { readonly windowNodes: number } = { windowNodes: 1 }): readonly ReviewPacketSourceResult[] {
  const snapshot = snapshotOf(subject);
  const execution: ExecutionContext = { kind: "packet", subject, snapshot, byId: new Map(snapshot.path.map((node) => [node.id, node])), context, memo: { points: new Map(), pointInvocations: new Map(), positions: new Map(), edges: new Map() } };
  SOURCE_EXECUTIONS.add(execution);
  const results = Object.freeze(reviewPacketSourcePlan(subject, options).map((slot) => sealSourceResult(subject, slot, ADAPTER_BY_ID.get(slot.adapterId)!.operation({ invocationId: slot.invocationId, adapterId: slot.adapterId, nodeId: slot.nodeId, grain: slot.grain, fromNodeId: slot.fromNodeId, window: slot.window }, execution))));
  assertReviewRecordedPrefixReceipt(subject);
  return results;
}

// ---------------------------------------------------------------------------------------------
// Accepted F2 §2.3d: complete owned point/state/result population, below moment assembly.
// These exports are package-internal, deliberately absent from the server/client barrels.
// ---------------------------------------------------------------------------------------------

declare const recordedLastLevelPopulationBrand: unique symbol;
export interface RecordedLastLevelPopulation { readonly [recordedLastLevelPopulationBrand]: true }
interface RecordedPointRow {
  readonly pathIndex: number;
  readonly position: DeclaredEvidence<RecordedPosition>;
  readonly slot: ReviewSourcePlanSlot;
  readonly provider: ReviewProviderNodeState | null;
  readonly state: ReviewAdapterState;
  readonly points: readonly DeclaredEvidence<ReviewEnginePoint>[];
}
interface RecordedSourceResult { readonly slot: ReviewSourcePlanSlot; readonly state: ReviewAdapterState; readonly items: readonly DeclaredEvidence<unknown>[] }
interface RecordedLastLevelData {
  readonly boundary: ReturnType<typeof readRecordedReviewBoundary>;
  readonly learnerSide: "white" | "black";
  readonly outcome: ReviewOutcomeReceipt;
  readonly result: RecordedSourceResult;
  readonly rows: readonly RecordedPointRow[];
}
const RECORDED_SLOTS = new WeakMap<object, Readonly<{ boundary: RecordedReviewBoundary; adapter: ReviewPacketSourceAdapter }>>();
const RECORDED_RESULTS = new WeakMap<object, Readonly<{ boundary: RecordedReviewBoundary; execution: RecordedPointExecution; adapter: ReviewPacketSourceAdapter }>>();
const LAST_LEVEL_POPULATIONS = new WeakMap<object, Readonly<{
  boundary: RecordedReviewBoundary;
  data: RecordedLastLevelData;
  plan: readonly ReviewSourcePlanSlot[];
  results: ReadonlyMap<ReviewSourcePlanSlot, RecordedSourceResult>;
}>>();

function closedSource(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Reflect.ownKeys(value).length === keys.length
    && keys.every(key => Object.hasOwn(value, key) && Object.hasOwn(Object.getOwnPropertyDescriptor(value, key)!, "value"));
}
export { closedSource as isClosedReviewSourceRecord };
function capturePointContext(context: ReviewSourceContext, path: readonly Node[]): ReviewSourceContext {
  if (!closedSource(context, ["engine", "shapes"]) || !(context.engine instanceof Map) || !Array.isArray(context.shapes)) throw new TypeError("Recorded Review requires the closed server-owned source context");
  const captured = new Map<string, ReviewProviderNodeState>();
  for (const node of path) {
    if (!Map.prototype.has.call(context.engine, node.id)) continue;
    const state: unknown = Map.prototype.get.call(context.engine, node.id);
    const kind = isRecord(state) ? Object.getOwnPropertyDescriptor(state, "kind") : undefined;
    if (!isRecord(state) || kind === undefined || !Object.hasOwn(kind, "value") || typeof kind.value !== "string") throw new TypeError("Recorded Review provider state is not a closed state");
    const keys = state.kind === "delivered" ? ["kind", "delivery"] : state.kind === "pending" ? ["kind", "jobCount", "retrying"]
      : state.kind === "honest_empty" || state.kind === "unavailable" ? ["kind", "reason"] : ["kind"];
    if (!closedSource(state, keys)) throw new TypeError("Recorded Review provider state has missing/extra/accessor fields");
    if (state.kind === "delivered") {
      assertDeclaredEvidence(state.delivery);
      if (refKey(state.delivery.projection) !== "live.stockfish.position_eval@1" || evidenceValueReceipt(state.delivery).factory !== "createLiveStockfishPositionEvalV1Evidence") throw new TypeError("Recorded Review provider delivery is not the genuine position-evaluation source");
      captured.set(node.id, Object.freeze({ kind: "delivered", delivery: state.delivery as DeclaredEvidence<StockfishPositionEvaluation> }));
    } else {
      // The same state rules, but not source outputs ('available' or 'input_abstained').
      if (state.kind === "available" || state.kind === "honest_empty" && state.reason !== "outside_domain"
        || state.kind === "unavailable" && state.reason === "input_abstained") throw new TypeError("Recorded Review provider input is not a coordinator state");
      assertState(state as unknown as ReviewAdapterState);
      captured.set(node.id, Object.freeze({ ...state }) as ReviewProviderNodeState);
    }
  }
  // No shape operation participates in this point/result source. Unrelated inputs enter neither
  // its population image nor execution, and no mutable caller map/state is retained.
  return Object.freeze({ engine: captured, shapes: Object.freeze([]) });
}

/** Select existing registered objects; never a second adapter or operation registry. */
function recordedPointAdapter(id: string) {
  const entry = ADAPTER_BY_ID.get(id);
  return entry === POSITION_SOURCE_ADAPTER ? POSITION_SOURCE_ADAPTER : entry === POINT_SOURCE_ADAPTER ? POINT_SOURCE_ADAPTER
    : entry === IMPORTED_RESULT_SOURCE_ADAPTER ? IMPORTED_RESULT_SOURCE_ADAPTER
    : refuse("REVIEW_SOURCE_INVALID", `adapter ${id} is not owned by the recorded point/result source`);
}
function recordedPointPlan(boundary: RecordedReviewBoundary, execution: RecordedPointExecution): readonly ReviewSourcePlanSlot[] {
  const adapters = [POSITION_SOURCE_ADAPTER, POINT_SOURCE_ADAPTER, IMPORTED_RESULT_SOURCE_ADAPTER].sort((a, b) => a.id.localeCompare(b.id));
  for (const entry of adapters) if (recordedPointAdapter(entry.id) !== entry) throw new TypeError("Recorded Review adapter identity changed");
  const path = execution.snapshot.path, endpoint = path.at(-1)!.id;
  const slots = sourcePlanSlots(path.map(node => node.id), adapters, 1).filter(slot => slot.adapterId !== IMPORTED_RESULT_SOURCE_ADAPTER.id || slot.nodeId === endpoint);
  for (const slot of slots) RECORDED_SLOTS.set(slot, Object.freeze({ boundary, adapter: recordedPointAdapter(slot.adapterId) }));
  return Object.freeze(slots);
}

function assertRecordedSourceResult(result: RecordedSourceResult, boundary: RecordedReviewBoundary): void {
  const proof = RECORDED_RESULTS.get(result), slotProof = RECORDED_SLOTS.get(result.slot);
  if (proof === undefined || slotProof === undefined || proof.boundary !== boundary || slotProof.boundary !== boundary
    || proof.adapter !== slotProof.adapter || !RECORDED_REVIEW_SOURCE_ADAPTER_IDS.includes(result.slot.adapterId)
    || ADAPTER_BY_ID.get(result.slot.adapterId) !== proof.adapter) throw new TypeError("Recorded Review slot/result was not executed by its actual registered source");
  const { execution, adapter } = proof, slot = result.slot, node = execution.byId.get(slot.nodeId)!;
  assertState(result.state);
  if (result.state.kind === "available" ? result.state.itemCount !== result.items.length : result.items.length !== 0) throw new TypeError("Recorded Review state/count differs from its complete source result");
  for (const item of result.items) {
    assertDeclaredEvidence(item);
    if (refKey(item.projection) !== refKey(adapter.projection)) throw new TypeError("Recorded Review source returned a different projection");
    adapter.parser(item.payload);
  }
  if (adapter === POSITION_SOURCE_ADAPTER) {
    const position = execution.memo.positions.get(node.id)!;
    assertRecordedPositionInvocation(position, execution.snapshot.run, node.id);
    if (result.items.length !== 1 || result.items[0] !== position || result.state.kind !== "available") throw new TypeError("Recorded Review position source lost its exact invocation");
  } else if (adapter === POINT_SOURCE_ADAPTER) {
    const position = positionOf(execution, node.id), provider = execution.context.engine.get(node.id);
    assertRecordedPositionInvocation(position, execution.snapshot.run, node.id);
    if (provider?.kind === "delivered") {
      const sourceResult = execution.memo.pointInvocations.get(node.id), inputs = readReviewPointResultInvocation(sourceResult);
      if (inputs.position !== position || inputs.evaluation !== provider.delivery) throw new TypeError("Recorded Review point availability belongs to different inputs");
      if (sourceResult?.kind === "available") {
        const point = sourceResult.value, pointInputs = readReviewPointInvocation(point);
        if (result.state.kind !== "available" || result.items.length !== 1 || result.items[0] !== point
          || pointInputs.position !== position || pointInputs.evaluation !== provider.delivery
          || point.payload.position.payload.fen !== node.fen) throw new TypeError("Recorded Review point crosses its original position/delivery occurrence");
      } else if (sourceResult?.kind !== "unavailable" || sourceResult.reason !== "position_mismatch"
        || result.state.kind !== "unavailable" || result.state.reason !== "input_abstained" || result.items.length !== 0) throw new TypeError("Recorded Review rejected delivery lost its actual failure");
    } else if (result.items.length !== 0 || evidenceDigest(result.state) !== evidenceDigest(provider ?? { kind: "not_requested" })) throw new TypeError("Recorded Review absent/pending state differs from its captured input");
  } else if (adapter === IMPORTED_RESULT_SOURCE_ADAPTER) {
    const items = execution.memo.importedResult;
    if (items === undefined) throw new TypeError("Recorded Review result source was not actually invoked");
    assertRecordedReviewResultInvocation(items, "run.record.imported_result@1", boundary);
    const expected = items.filter(item => item.nodeId === node.id);
    if (result.items.length !== expected.length || expected.some((item, index) => item.evidence !== result.items[index] || item.plyOffset !== node.ply)) throw new TypeError("Recorded Review imported result crosses its original endpoint/invocation");
  } else assertRecordedMomentSlot(result, proof);
}

/** Authenticate retained invocations only. Readers never rerun a collector or acquire a source. */
function assertRecordedMomentSlot(result: RecordedSourceResult, proof: NonNullable<ReturnType<typeof RECORDED_RESULTS.get>>): void {
  const { execution, boundary, adapter } = proof, node = execution.byId.get(result.slot.nodeId)!;
  const image = execution.boundaryImage;
  let expected: SourceOutcome;
  if (adapter.id === "review.source.consequence@1") {
    const items = execution.memo.recordedConsequence;
    if (items === undefined) throw new TypeError("Recorded Review consequence was not executed");
    assertRecordedReviewResultInvocation(items, "run.record.consequence@1", boundary);
    expected = available(items.filter(item => item.nodeId === node.id).map(item => item.evidence));
  } else if (adapter.id === "review.source.eval_delta@2" || adapter.id === "review.source.mate_transition@2") {
    const before = execution.memo.points.get(result.slot.fromNodeId!), after = execution.memo.points.get(node.id);
    if (before === undefined || after === undefined) throw new TypeError("Recorded Review transition lost its endpoint invocations");
    if (isPoint(before) && isPoint(after)) {
      const route = adapter.id === "review.source.eval_delta@2" ? "derived.review.eval_delta@2" : "derived.review.mate_transition@2";
      const original = execution.memo.transitions?.get(result.slot.invocationId), inputs = readReviewTransitionResultInvocation(original, route);
      if (inputs.before !== before || inputs.after !== after) throw new TypeError("Recorded Review transition crosses its actual endpoint inputs");
      if (original!.kind === "available") {
        const value = original!.value;
        if (value.payload.before !== before || value.payload.after !== after || refKey(value.projection) !== route) throw new TypeError("Recorded Review transition value lost its original endpoints");
        expected = available([value]);
      } else {
        const reason = original!.reason;
        expected = stateOnly(route === "derived.review.eval_delta@2" ? reason === "mate_operand" ? NO_OBSERVATION : { kind: "unavailable", reason: "input_abstained" }
          : reason === "no_mate_operand" || reason === "no_mate_transition" ? NO_OBSERVATION : { kind: "unavailable", reason: "input_abstained" });
      }
    } else expected = stateOnly(endpointState(isPoint(before) ? { kind: "available", itemCount: 1 } : before, isPoint(after) ? { kind: "available", itemCount: 1 } : after));
  } else if (adapter.id === "review.source.endgame@1") {
    const items = execution.memo.endgame?.get(node.id);
    if (items === undefined) throw new TypeError("Recorded Review endgame population was not executed");
    readEndgamePopulationInvocation(items, node.fen); expected = available(items);
  } else if (adapter.id === "review.source.shapes@1") {
    const items = execution.memo.shapeInvocation, path = execution.shapePath;
    if (items === undefined || path === undefined) throw new TypeError("Recorded Review shape population was not executed");
    readShapeFiringInvocation(items, execution.context.shapes, path);
    for (const item of items) {
      const firing = item.payload as { firstNodeId: string; lastNodeId: string };
      const first = path.findIndex(entry => entry.id === firing.firstNodeId), last = path.findIndex(entry => entry.id === firing.lastNodeId);
      if (first < 0 || last < first) throw new TypeError("Recorded Review shape span crosses its granted prefix");
    }
    expected = available(items.filter(item => (item.payload as { firstNodeId: string }).firstNodeId === node.id));
  } else {
    const kind = (Object.keys(RECORDED_PIVOTAL_ROUTES) as PivotalKind[]).find(kind => refKey(adapter.projection) === RECORDED_PIVOTAL_ROUTES[kind]);
    const invocation = kind === undefined ? undefined : execution.memo.scopedPivotal?.get(kind);
    if (invocation === undefined || kind === undefined) throw new TypeError("Recorded Review pivotal population was not executed");
    const data = recordedPivotalData(invocation.source, kind);
    if (data.authority.runId !== image.run.id || data.authority.eventHeadDigest !== image.eventHead.digest
      || data.authority.branchId !== image.request.branchId || data.authority.throughNodeId !== image.request.throughNodeId) throw new TypeError("Recorded Review pivotal source crosses its actual original boundary");
    let missing = false;
    if (kind === "human_divergence") missing = readRecordedHumanDivergenceInvocation(invocation.items as readonly DerivedEvidence<RecordedHumanDivergenceMarker>[], invocation.source).observations
      .some(row => row.event.data.nodeId === node.id && row.disposition === "source_absent");
    else readRecordedRulePivotalInvocation(invocation.items, invocation.source);
    expected = missing ? stateOnly({ kind: "unavailable", reason: "input_abstained" }) : available(invocation.items.filter(item => item.evidence.payload.nodeId === node.id).map(item => item.evidence));
  }
  if (evidenceDigest(expected.state) !== evidenceDigest(result.state) || expected.items.length !== result.items.length
    || expected.items.some((item, index) => item !== result.items[index])) throw new TypeError("Recorded Review slot lost its complete original state/evidence occurrences");
}
function executeRecordedSourceSlot(slot: ReviewSourcePlanSlot, execution: RecordedPointExecution): RecordedSourceResult {
  const owner = RECORDED_SLOTS.get(slot);
  if (owner === undefined || owner.boundary !== execution.recordedReview) throw new TypeError("Recorded Review slot is not owned by this boundary");
  const adapter = owner.adapter;
  if (ADAPTER_BY_ID.get(slot.adapterId) !== adapter || !RECORDED_REVIEW_SOURCE_ADAPTER_IDS.includes(slot.adapterId)) throw new TypeError("Recorded Review slot has no exact registered adapter");
  const output = adapter.operation(slot, execution);
  const result = Object.freeze({ slot, state: Object.freeze({ ...output.state }), items: Object.freeze([...output.items]) });
  RECORDED_RESULTS.set(result, Object.freeze({ boundary: execution.recordedReview, execution, adapter }));
  assertRecordedSourceResult(result, execution.recordedReview);
  return result;
}

/** Captured-only collection. No arbitrary rows/points/result, provider request or moment assembly. */
export function collectRecordedLastLevelPopulation(input: Readonly<{ boundary: RecordedReviewBoundary; context: ReviewSourceContext }>): RecordedLastLevelPopulation {
  if (!closedSource(input, ["boundary", "context"])) throw new TypeError("Recorded last-level collection requires exactly {boundary,context}");
  const boundary = input.boundary, image = readRecordedReviewBoundary(boundary), path = image.path.map(entry => entry.node);
  const context = capturePointContext(input.context, path);
  const execution: RecordedPointExecution = { kind: "recorded", recordedReview: boundary, boundaryImage: image, snapshot: { run: image.run, path }, byId: new Map(path.map(node => [node.id, node])), context,
    memo: { points: new Map(), pointInvocations: new Map(), positions: new Map(), edges: new Map() } };
  SOURCE_EXECUTIONS.add(execution);
  const plan = recordedPointPlan(boundary, execution), results = new Map<ReviewSourcePlanSlot, RecordedSourceResult>();
  for (const slot of plan) results.set(slot, executeRecordedSourceSlot(slot, execution));
  return retainRecordedLastLevelPopulation(boundary, execution, plan, results);
}

/** Reuse actual original slot/value/result objects; this helper performs no source execution. */
function retainRecordedLastLevelPopulation(boundary: RecordedReviewBoundary, execution: RecordedPointExecution,
  sourcePlan: readonly ReviewSourcePlanSlot[], sourceResults: ReadonlyMap<ReviewSourcePlanSlot, RecordedSourceResult>): RecordedLastLevelPopulation {
  const image = readRecordedReviewBoundary(boundary), path = execution.snapshot.path;
  const plan = Object.freeze(sourcePlan.filter(slot => slot.adapterId === POSITION_SOURCE_ADAPTER.id || slot.adapterId === POINT_SOURCE_ADAPTER.id
    || slot.adapterId === IMPORTED_RESULT_SOURCE_ADAPTER.id && slot.nodeId === image.request.throughNodeId));
  const results = new Map(plan.map(slot => {
    const result = sourceResults.get(slot); if (result === undefined) throw new TypeError("Recorded last-level source lost an actually executed slot");
    return [slot, result] as const;
  }));
  const resultFor = (adapter: ReviewPacketSourceAdapter, nodeId: string): RecordedSourceResult => {
    const slot = plan.find(entry => entry.adapterId === adapter.id && entry.nodeId === nodeId);
    if (slot === undefined || !results.has(slot)) throw new TypeError("Recorded Review population omitted a planned source slot");
    return results.get(slot)!;
  };
  const rows = Object.freeze(path.map((node, pathIndex): RecordedPointRow => {
    const point = resultFor(POINT_SOURCE_ADAPTER, node.id), position = resultFor(POSITION_SOURCE_ADAPTER, node.id).items[0]!;
    return Object.freeze({ pathIndex, position: position as DeclaredEvidence<RecordedPosition>, slot: point.slot, provider: execution.context.engine.get(node.id) ?? null,
      state: point.state, points: point.items as readonly DeclaredEvidence<ReviewEnginePoint>[] });
  }));
  const data = Object.freeze({ boundary: image, learnerSide: image.learnerSide, outcome: image.outcome, result: resultFor(IMPORTED_RESULT_SOURCE_ADAPTER, path.at(-1)!.id), rows });
  const population = Object.freeze({}) as RecordedLastLevelPopulation;
  LAST_LEVEL_POPULATIONS.set(population, Object.freeze({ boundary, data, plan, results }));
  readRecordedLastLevelPopulation(population); // All source/member checks before publication, even empty/nonloss inputs.
  return population;
}

/** Private reader authenticates complete source/state/occurrence membership, not selected points. */
export function readRecordedLastLevelPopulation(population: RecordedLastLevelPopulation): RecordedLastLevelData {
  const owned = population !== null && typeof population === "object" ? LAST_LEVEL_POPULATIONS.get(population) : undefined;
  if (owned === undefined) throw new TypeError("Recorded last-level population was not issued by its source owner");
  const { boundary, data, plan, results } = owned, image = readRecordedReviewBoundary(boundary);
  if (data.boundary !== image || data.learnerSide !== image.learnerSide || data.outcome !== image.outcome || data.rows.length !== image.path.length
    || plan.length !== image.path.length * 2 + 1 || results.size !== plan.length) throw new TypeError("Recorded Review population is not the complete original scope");
  for (const slot of plan) {
    const result = results.get(slot);
    if (result === undefined || result.slot !== slot) throw new TypeError("Recorded Review lost a planned invocation");
    assertRecordedSourceResult(result, boundary);
  }
  for (const [index, row] of data.rows.entries()) {
    const node = image.path[index]!.node, position = [...results.values()].find(result => result.slot.adapterId === POSITION_SOURCE_ADAPTER.id && result.slot.nodeId === node.id)!;
    const point = [...results.values()].find(result => result.slot.adapterId === POINT_SOURCE_ADAPTER.id && result.slot.nodeId === node.id)!;
    const proof = RECORDED_RESULTS.get(point)!;
    if (row.pathIndex !== index || row.position !== position.items[0] || row.slot !== point.slot || row.slot.window !== index
      || row.provider !== (proof.execution.context.engine.get(node.id) ?? null) || row.state !== point.state || row.points !== point.items) throw new TypeError("Recorded Review row dropped/reordered/substituted its original slot/input/result");
  }
  if (data.result.slot.adapterId !== IMPORTED_RESULT_SOURCE_ADAPTER.id || data.result.slot.nodeId !== image.request.throughNodeId
    || results.get(data.result.slot) !== data.result) throw new TypeError("Recorded Review result is not the actual endpoint invocation");
  readRecordedReviewBoundary(boundary); // Source preparation never bypasses a concurrent storage change.
  return data;
}

declare const recordedReviewSourcePopulationBrand: unique symbol;
export interface RecordedReviewSourcePopulation { readonly [recordedReviewSourcePopulationBrand]: true }
interface RecordedReviewSourceData {
  readonly boundary: ReturnType<typeof readRecordedReviewBoundary>;
  readonly shapes: readonly ShapeTriggerSource[];
  readonly plan: readonly ReviewSourcePlanSlot[];
  readonly results: readonly RecordedSourceResult[];
  readonly lastLevelPopulation: RecordedLastLevelPopulation;
}
const RECORDED_REVIEW_POPULATIONS = new WeakMap<object, Readonly<{
  boundary: RecordedReviewBoundary; execution: RecordedPointExecution; data: RecordedReviewSourceData;
}>>();

/** The accepted complete 12-adapter source image, internal and captured-only. No moment/title/API. */
export function collectRecordedReviewSourcePopulation(input: Readonly<{ boundary: RecordedReviewBoundary; context: ReviewSourceContext }>): RecordedReviewSourcePopulation {
  if (!closedSource(input, ["boundary", "context"])) throw new TypeError("Recorded Review collection requires exactly {boundary,context}");
  const boundary = input.boundary, image = readRecordedReviewBoundary(boundary), path = Object.freeze(image.path.map(entry => entry.node));
  const points = capturePointContext(input.context, path);
  // Capture complete registered trigger operands, not only IDs or already computed firings.
  const ids = new Set<string>();
  for (const entry of input.context.shapes) {
    if (!closedSource(entry, ["id", "trigger"]) || typeof entry.id !== "string" || entry.id.length === 0 || !isRecord(entry.trigger) || ids.has(entry.id)) throw new TypeError("Recorded Review shape inputs are not unique registered trigger records");
    ids.add(entry.id);
  }
  evidenceDigest(input.context.shapes); // Refuse non-JSON trigger data before any source work.
  const shapes = deepFreeze(structuredClone(input.context.shapes));
  const context = Object.freeze({ engine: points.engine, shapes });
  const execution: RecordedPointExecution = { kind: "recorded", recordedReview: boundary, boundaryImage: image, snapshot: { run: image.run, path }, byId: new Map(path.map(node => [node.id, node])), context,
    shapePath: Object.freeze(path.map(node => Object.freeze({ id: node.id, fen: node.fen }))),
    memo: { points: new Map(), pointInvocations: new Map(), positions: new Map(), edges: new Map() } };
  SOURCE_EXECUTIONS.add(execution);
  const adapters = sourceAdapters(RECORDED_REVIEW_SOURCE_ADAPTER_IDS), plan = sourcePlanSlots(path.map(node => node.id), adapters, 1);
  for (const slot of plan) RECORDED_SLOTS.set(slot, Object.freeze({ boundary, adapter: ADAPTER_BY_ID.get(slot.adapterId)! }));
  const results = new Map<ReviewSourcePlanSlot, RecordedSourceResult>();
  for (const slot of plan) results.set(slot, executeRecordedSourceSlot(slot, execution));
  const lastLevelPopulation = retainRecordedLastLevelPopulation(boundary, execution, plan, results);
  const data = Object.freeze({ boundary: image, shapes, plan, results: Object.freeze([...results.values()]), lastLevelPopulation });
  const population = Object.freeze({}) as RecordedReviewSourcePopulation;
  RECORDED_REVIEW_POPULATIONS.set(population, Object.freeze({ boundary, execution, data }));
  readRecordedReviewSourcePopulation(population);
  return population;
}

/** Original complete source/slot/result membership; this read performs no factory dispatch. */
export function readRecordedReviewSourcePopulation(population: RecordedReviewSourcePopulation): RecordedReviewSourceData {
  const proof = population !== null && typeof population === "object" ? RECORDED_REVIEW_POPULATIONS.get(population) : undefined;
  if (proof === undefined) throw new TypeError("Recorded Review population was not issued by its source owner");
  const { boundary, execution, data } = proof, image = readRecordedReviewBoundary(boundary);
  const expected = sourcePlanSlots(image.path.map(entry => entry.node.id), sourceAdapters(RECORDED_REVIEW_SOURCE_ADAPTER_IDS), 1);
  if (data.boundary !== image || data.shapes !== execution.context.shapes || evidenceDigest(data.plan) !== evidenceDigest(expected)
    || data.results.length !== expected.length) throw new TypeError("Recorded Review population lost its complete original plan/context");
  for (const [index, result] of data.results.entries()) {
    if (result.slot !== data.plan[index] || RECORDED_RESULTS.get(result)?.execution !== execution) throw new TypeError("Recorded Review result crosses its actual source invocation");
    assertRecordedSourceResult(result, boundary);
  }
  const lastLevel = readRecordedLastLevelPopulation(data.lastLevelPopulation);
  for (const row of lastLevel.rows) {
    const point = data.results.find(result => result.slot.adapterId === POINT_SOURCE_ADAPTER.id && result.slot.nodeId === row.position.payload.nodeId)!;
    const position = data.results.find(result => result.slot.adapterId === POSITION_SOURCE_ADAPTER.id && result.slot.nodeId === row.position.payload.nodeId)!;
    if (row.slot !== point.slot || row.points !== point.items || row.position !== position.items[0]) throw new TypeError("Recorded Review last-level collection repeated or replaced its actual source execution");
  }
  if (lastLevel.result !== data.results.find(result => result.slot.adapterId === IMPORTED_RESULT_SOURCE_ADAPTER.id && result.slot.nodeId === image.request.throughNodeId)) throw new TypeError("Recorded Review last-level result is not its actual endpoint invocation");
  readRecordedReviewBoundary(boundary);
  return data;
}

/** Original source operands, not a public witness constructor or payload-based ancestry guess. */
export type RecordedReviewSourceOperand =
  | Readonly<{ kind: "member"; value: DeclaredEvidence<unknown>; inputs: readonly RecordedReviewSourceOperand[] }>
  | Readonly<{ kind: "leaf"; value: DeclaredEvidence<unknown>; availability: "local" | "recorded" | "provider";
      providerOperation: "stockfish.position_evaluation@1" | null; image: unknown }>;
const REVIEW_SOURCE_OPERANDS = new WeakMap<object, readonly (readonly RecordedReviewSourceOperand[])[]>();
/** Exact result-index/item-index image. Empty slots remain present in the surrounding population. */
export function readRecordedReviewSourceOperands(population: RecordedReviewSourcePopulation): readonly (readonly RecordedReviewSourceOperand[])[] {
  const data = readRecordedReviewSourcePopulation(population), owned = RECORDED_REVIEW_POPULATIONS.get(population)!;
  const retained = REVIEW_SOURCE_OPERANDS.get(population); if (retained !== undefined) return retained;
  const { execution } = owned, boundary = data.boundary;
  const scope = Object.freeze({ request: boundary.request, eventHead: boundary.eventHead });
  const leaf = (value: DeclaredEvidence<unknown>, availability: "local" | "recorded" | "provider", image: unknown, providerOperation: "stockfish.position_evaluation@1" | null = null): RecordedReviewSourceOperand =>
    Object.freeze({ kind: "leaf", value, availability, providerOperation, image: deepFreeze(image) });
  const position = (value: DeclaredEvidence<unknown>): RecordedReviewSourceOperand => {
    const nodeId = (value.payload as RecordedPosition).nodeId;
    assertRecordedPositionInvocation(value as DeclaredEvidence<RecordedPosition>, execution.snapshot.run, nodeId);
    const entry = boundary.path.find(entry => entry.node.id === nodeId);
    if (entry === undefined) throw new TypeError("Review operand position is outside its actual recorded grant");
    return leaf(value, "recorded", { kind: "position", scope, entry });
  };
  const point = (value: DeclaredEvidence<unknown>): RecordedReviewSourceOperand => {
    const original = readReviewMemberInputs(value), inputs = readReviewPointInvocation(value as DeclaredEvidence<ReviewEnginePoint>);
    if (original.length !== 2 || original[0] !== inputs.evaluation || original[1] !== inputs.position) throw new TypeError("Review point lost its original minted inputs");
    const provider = leaf(inputs.evaluation, "provider", { kind: "provider", delivery: serializeProviderDelivery("stockfish.position_evaluation@1", inputs.evaluation.payload) }, "stockfish.position_evaluation@1");
    return Object.freeze({ kind: "member", value, inputs: Object.freeze([provider, position(inputs.position)]) });
  };
  const local = (value: DeclaredEvidence<unknown>, expectedFen?: string): RecordedReviewSourceOperand => {
    const input = readLocalReadingInvocation(value);
    if (input.kind === "fen") {
      if (input.fen !== expectedFen || !boundary.path.some(entry => entry.node.fen === input.fen)) throw new TypeError("Review local reading crosses its actual recorded FEN operand");
    } else {
      const child = boundary.path.find((entry, index) => index > 0 && entry.node.fen === input.edge.afterFen && entry.node.moveUci === input.edge.moveUci
        && boundary.path[index - 1]!.node.fen === input.edge.beforeFen);
      if (child === undefined || expectedFen !== undefined && child.node.fen !== expectedFen) throw new TypeError("Review local reading crosses its actual recorded edge operand");
    }
    return leaf(value, "local", input);
  };
  const result = Object.freeze(data.results.map((row) => Object.freeze(row.items.map((value): RecordedReviewSourceOperand => {
    const route = refKey(value.projection), node = execution.byId.get(row.slot.nodeId)!;
    if (route === "run.record.position@1") return position(value);
    if (route === "derived.review.eval_point@1") return point(value);
    if (route === "derived.review.eval_delta@2" || route === "derived.review.mate_transition@2") {
      const original = execution.memo.transitions!.get(row.slot.invocationId), inputs = readReviewTransitionResultInvocation(original, route), minted = readReviewMemberInputs(value);
      if (original?.kind !== "available" || original.value !== value || minted.length !== 2 || minted[0] !== inputs.before || minted[1] !== inputs.after) throw new TypeError("Review transition lost its original result/minted endpoints");
      return Object.freeze({ kind: "member", value, inputs: Object.freeze([point(inputs.before), point(inputs.after)]) });
    }
    const kind = (Object.keys(RECORDED_PIVOTAL_ROUTES) as PivotalKind[]).find(kind => RECORDED_PIVOTAL_ROUTES[kind] === route);
    if (kind !== undefined) {
      const invocation = execution.memo.scopedPivotal!.get(kind)!;
      const wrapper = invocation.items.find(item => item.evidence === value), minted = readReviewMemberInputs(value);
      if (wrapper === undefined || minted.length !== wrapper.inputs.length || minted.some((input, index) => input !== wrapper.inputs[index])) throw new TypeError("Review pivotal operand lost its actual wrapper/minted inputs");
      const inputs = minted.map((input, index): RecordedReviewSourceOperand => {
        if (refKey(input.projection) === "run.record.position@1") return position(input);
        if (kind === "human_divergence") {
          const observation = readRecordedHumanDivergenceInvocation(invocation.items as readonly DerivedEvidence<RecordedHumanDivergenceMarker>[], invocation.source).observations.find(row => row.item === wrapper);
          if (observation?.selection.kind !== "available" || observation.selection.value !== input || index !== 0) throw new TypeError("Review human operand lost its original observation/selection input");
          return leaf(input, "recorded", { kind: "selection", scope, subject: observation.resolved.subject, event: observation.event, record: input.payload });
        }
        const following = minted[index + 1];
        if (following === undefined || refKey(following.projection) !== "run.record.position@1") throw new TypeError("Review local pivotal operand has no original position partner");
        return local(input, (following.payload as RecordedPosition).fen);
      });
      return Object.freeze({ kind: "member", value, inputs: Object.freeze(inputs) });
    }
    if (route === "rules.endgame.classification@1") {
      const invocation = readEndgamePopulationInvocation(execution.memo.endgame!.get(node.id)!, node.fen);
      if (!invocation.items.includes(value)) throw new TypeError("Review endgame operand is not its original invocation member");
      return leaf(value, "local", { kind: "fen", fen: invocation.fen });
    }
    if (route === "theory.shapes.firing@1") {
      const invocation = readShapeFiringInvocation(execution.memo.shapeInvocation!, execution.context.shapes, execution.shapePath!);
      if (!invocation.items.includes(value)) throw new TypeError("Review shape operand is not its original invocation member");
      return leaf(value, "local", { kind: "shape", entries: invocation.entries, path: invocation.path });
    }
    if (route === "run.record.consequence@1" || route === "run.record.imported_result@1") return leaf(value, "recorded", { kind: "recorded_outcome", scope, outcome: boundary.outcome, importRecord: boundary.importRecord, slot: row.slot });
    throw new TypeError(`Review source operand has no exact original family: ${route}`);
  }))));
  readRecordedReviewSourcePopulation(population);
  REVIEW_SOURCE_OPERANDS.set(population, result); return result;
}

// ---------------------------------------------------------------------------------------------
// §4 — the packet, its private aggregate seal and the total folds
// ---------------------------------------------------------------------------------------------

export interface ReviewNodePacket {
  readonly nodeId: string;
  readonly ply: number;
  readonly positionKey: string;
  readonly incomingMove: { readonly uci: string; readonly san: string | null } | null;
  readonly items: readonly DeclaredEvidence<unknown>[];
  readonly links: readonly { readonly kind: "engine_mate_to_exact_proof"; readonly transitionEvidenceDigest: string; readonly proofEvidenceDigest: string }[];
  readonly families: Readonly<Record<ReviewSourceFamily, ReviewNodeFamilyState>>;
}

export interface ReviewEvidenceInput {
  readonly subject: ReviewRecordedPrefixReceipt;
  readonly sources: readonly ReviewPacketSourceResult[];
}

export interface ReviewEvidencePacket {
  readonly subject: ReviewRecordedPrefixReceipt;
  readonly manifestDigest: string;
  readonly nodes: readonly ReviewNodePacket[];
  readonly families: Readonly<Record<ReviewSourceFamily, ReviewRunFamilyState>>;
  readonly completion: { readonly progress: ReviewProgress; readonly degradation: ReviewDegradation };
  readonly packetDigest: string;
}

const PACKETS = new WeakMap<object, { readonly subject: ReviewRecordedPrefixReceipt; readonly image: string }>();
const evidenceDigestOf = (item: DeclaredEvidence<unknown>): string => `sha256:${evidenceValueReceipt(item).payloadDigest}`;
const positive = (value: number, label: string): number => { if (!Number.isSafeInteger(value) || value < 1) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", `${label} must be a positive safe integer`); return value; };

function assertState(state: ReviewAdapterState): void {
  switch (state.kind) {
    case "available": positive(state.itemCount, "available.itemCount"); return;
    case "pending": positive(state.jobCount, "pending.jobCount"); if (!Number.isSafeInteger(state.retrying) || state.retrying < 0 || state.retrying > state.jobCount) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "retrying jobs exceed pending jobs"); return;
    case "unavailable": if (!REVIEW_UNAVAILABLE_REASONS.includes(state.reason)) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "unknown unavailable reason"); return;
    case "honest_empty": if (state.reason !== "no_observation" && state.reason !== "outside_domain") throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "unknown honest-empty reason"); return;
    case "not_requested": case "not_yet_scheduled": return;
    default: throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "unknown adapter state");
  }
}

/**
 * The only node→prefix aggregation: total over the exact unique path population, order-independent,
 * retaining every adapter row. Missing/duplicate slots, impossible counts and empty groups fail.
 */
export function foldReviewFamilyState(nodes: readonly Pick<ReviewNodePacket, "nodeId" | "families">[], pathNodeIds: readonly string[]): Readonly<Record<ReviewSourceFamily, ReviewRunFamilyState>> {
  const ids = nodes.map((node) => node.nodeId);
  if (new Set(ids).size !== ids.length || ids.length !== pathNodeIds.length || [...ids].sort().join("\u0000") !== [...pathNodeIds].sort().join("\u0000")) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "family fold must cover the exact unique path population");
  const result = {} as Record<ReviewSourceFamily, ReviewRunFamilyState>;
  for (const family of REVIEW_SOURCE_FAMILIES) {
    const counts = { available: 0, honestEmpty: 0, notRequested: 0, notYetScheduled: 0, pending: 0, unavailable: 0 };
    const progress = { notYetScheduledSourceCount: 0, pendingSourceCount: 0, pendingJobCount: 0, retryingJobCount: 0 };
    const reasons = new Map<ReviewUnavailableReason, { sourceCount: number; nodes: Set<string> }>();
    let itemCount = 0, availableNodeCount = 0, applicable = 0;
    for (const node of nodes) {
      const state = node.families[family];
      if (state === undefined) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", `node ${node.nodeId} omits family ${family}`);
      const invocations = state.sources.map((row) => row.invocationId);
      if (new Set(invocations).size !== invocations.length) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "duplicate adapter invocation in a node family");
      let nodeItems = 0;
      for (const row of state.sources) {
        assertState(row.state);
        applicable += 1;
        switch (row.state.kind) {
          case "available": counts.available += 1; nodeItems += row.state.itemCount; break;
          case "honest_empty": counts.honestEmpty += 1; break;
          case "not_requested": counts.notRequested += 1; break;
          case "not_yet_scheduled": counts.notYetScheduled += 1; progress.notYetScheduledSourceCount += 1; break;
          case "pending": counts.pending += 1; progress.pendingSourceCount += 1; progress.pendingJobCount += row.state.jobCount; progress.retryingJobCount += row.state.retrying; break;
          case "unavailable": { counts.unavailable += 1; const group = reasons.get(row.state.reason) ?? { sourceCount: 0, nodes: new Set<string>() }; group.sourceCount += 1; group.nodes.add(node.nodeId); reasons.set(row.state.reason, group); break; }
        }
      }
      if (nodeItems !== state.itemCount) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", `node ${node.nodeId} ${family} item count disagrees with its available rows`);
      itemCount += nodeItems;
      if (nodeItems > 0) availableNodeCount += 1;
    }
    const sum = Object.values(counts).reduce((total, value) => total + value, 0);
    if (sum !== applicable) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "source counts do not sum to the applicable population");
    if (progress.retryingJobCount > progress.pendingJobCount) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "retrying jobs exceed pending jobs");
    result[family] = deepFreeze({
      nodeCount: nodes.length, applicableSourceCount: applicable, availableNodeCount, itemCount, sourceCounts: counts, progress,
      unavailable: [...reasons].sort(([left], [right]) => left.localeCompare(right)).map(([reason, group]) => ({ reason, sourceCount: group.sourceCount, nodeCount: group.nodes.size })),
    });
  }
  return Object.freeze(result);
}

/** Two independent fields: progress (pending/retrying/not-yet-scheduled) and degradation (unavailable). */
export function foldReviewCompletion(families: Readonly<Record<ReviewSourceFamily, ReviewRunFamilyState>>, nodes: readonly Pick<ReviewNodePacket, "nodeId" | "families">[]): { readonly progress: ReviewProgress; readonly degradation: ReviewDegradation } {
  const keys = Object.keys(families).sort();
  if (keys.join("|") !== [...REVIEW_SOURCE_FAMILIES].sort().join("|")) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "completion requires exactly the nine family folds");
  let pendingJobCount = 0, retryingJobCount = 0;
  for (const family of REVIEW_SOURCE_FAMILIES) { pendingJobCount += families[family].progress.pendingJobCount; retryingJobCount += families[family].progress.retryingJobCount; }
  const pendingNodes = new Set<string>(), queuedNodes = new Set<string>();
  for (const node of nodes) for (const family of REVIEW_SOURCE_FAMILIES) for (const row of node.families[family].sources) {
    if (row.state.kind === "pending") pendingNodes.add(node.nodeId);
    if (row.state.kind === "not_yet_scheduled") queuedNodes.add(node.nodeId);
  }
  const progress: ReviewProgress = pendingNodes.size === 0 && queuedNodes.size === 0 && pendingJobCount === 0
    ? { kind: "settled" }
    : { kind: "progressive", pendingNodeCount: pendingNodes.size, pendingJobCount, retryingJobCount, notYetScheduledNodeCount: queuedNodes.size };
  const unavailableFamilies = REVIEW_SOURCE_FAMILIES.filter((family) => families[family].unavailable.length > 0).map((family) => ({ family, reasons: families[family].unavailable.map((group) => ({ reason: group.reason, nodeCount: group.nodeCount })) }));
  return deepFreeze({ progress, degradation: unavailableFamilies.length === 0 ? { kind: "healthy" as const } : { kind: "degraded" as const, unavailableFamilies } });
}

function packetImage(packet: Omit<ReviewEvidencePacket, "packetDigest">): unknown {
  return {
    subject: packet.subject,
    manifestDigest: packet.manifestDigest,
    nodes: packet.nodes.map((node) => ({ ...node, items: node.items.map((item) => ({ producer: item.producer, projection: item.projection, evidenceDigest: evidenceDigestOf(item) })) })),
    families: packet.families,
    completion: packet.completion,
  };
}

/** The only packet constructor: adds `packetDigest` and registers the private aggregate seal. */
function createReviewEvidencePacket(body: Omit<ReviewEvidencePacket, "packetDigest">): ReviewEvidencePacket {
  const image = packetImage(body);
  const packet = deepFreezePacket({ ...body, packetDigest: presentationDigest("review.packet@1", image) });
  PACKETS.set(packet, { subject: body.subject, image: packet.packetDigest });
  return packet;
}

/** Freezes the packet structure without re-freezing sealed evidence objects (already immutable). */
function deepFreezePacket<T extends object>(value: T): T {
  const freeze = (candidate: unknown): void => {
    if (candidate === null || typeof candidate !== "object" || Object.isFrozen(candidate)) return;
    for (const child of Object.values(candidate as Record<string, unknown>)) freeze(child);
    Object.freeze(candidate);
  };
  freeze(value);
  return value;
}

/**
 * `compileReviewEvidence(input)`: the exact, set-equal source population over one live subject;
 * joins only on literal node/edge identities; sorts nodes by ply then id and items by projection
 * then evidence digest; derives links, folds and completion; hashes the canonical image.
 */
export function compileReviewEvidence(input: ReviewEvidenceInput): ReviewEvidencePacket {
  if (typeof input !== "object" || input === null || Object.keys(input).sort().join("|") !== "sources|subject") throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "input is exactly { subject, sources }");
  const snapshot = snapshotOf(input.subject);
  const plan = reviewPacketSourcePlan(input.subject, { windowNodes: 1 });
  const expected = new Map(plan.map((slot) => [slot.invocationId, slot]));
  const seen = new Set<string>();
  for (const result of input.sources) {
    if (!SOURCE_RESULTS.has(result)) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "source result was not sealed by its adapter");
    if (result.subjectDigest !== input.subject.subjectDigest) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "source result belongs to another subject");
    const slot = expected.get(result.invocationId);
    if (slot === undefined || slot.nodeId !== result.nodeId || slot.adapterId !== result.adapterId || slot.grain !== result.grain) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", `source result ${result.invocationId} is outside the plan`);
    if (seen.has(result.invocationId)) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", `duplicate source result ${result.invocationId}`);
    seen.add(result.invocationId);
  }
  if (seen.size !== expected.size) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", `${expected.size - seen.size} planned adapter slots have no result`);
  const byNode = new Map<string, ReviewPacketSourceResult[]>();
  for (const result of input.sources) byNode.set(result.nodeId, [...(byNode.get(result.nodeId) ?? []), result]);
  const nodes = [...snapshot.path].sort((left, right) => left.ply - right.ply || left.id.localeCompare(right.id)).map((node): ReviewNodePacket => {
    const results = byNode.get(node.id) ?? [];
    const items = orderedReviewEvidence(results.flatMap((result) => result.items));
    const families = Object.fromEntries(REVIEW_SOURCE_FAMILIES.map((family) => {
      const rows = results.filter((result) => ADAPTER_BY_ID.get(result.adapterId)!.family === family)
        .sort((left, right) => left.adapterId.localeCompare(right.adapterId) || left.invocationId.localeCompare(right.invocationId))
        .map((result) => Object.freeze({ adapterId: result.adapterId, invocationId: result.invocationId, grain: result.grain, state: result.state }));
      return [family, Object.freeze({ itemCount: rows.reduce((sum, row) => sum + (row.state.kind === "available" ? row.state.itemCount : 0), 0), sources: Object.freeze(rows) })];
    })) as Record<ReviewSourceFamily, ReviewNodeFamilyState>;
    // Links: an engine mate transition and a proved v2 proof join only through the exact edge.
    const edge = items.find((item) => item.projection.id === "run.record.edge") as DeclaredEvidence<RecordedEdge> | undefined;
    const links = edge === undefined ? [] : items.filter((item) => item.projection.id === "derived.review.mate_transition").flatMap((transition) => items
      .filter((item) => item.projection.id === "rules.tactic.consequence.forced_mate_after_move" && item.projection.version === 2)
      .filter((proof) => { const payload = proof.payload as ForcedMateAfterMoveProofV2; return payload.proofStatus === "proved" && payload.beforeFen === edge.payload.beforeFen && payload.candidate === edge.payload.moveUci && payload.afterFen === edge.payload.afterFen; })
      .map((proof) => Object.freeze({ kind: "engine_mate_to_exact_proof" as const, transitionEvidenceDigest: evidenceDigestOf(transition), proofEvidenceDigest: evidenceDigestOf(proof) })));
    return Object.freeze({
      nodeId: node.id, ply: node.ply, positionKey: node.transposeKey,
      incomingMove: node.moveUci === null ? null : Object.freeze({ uci: node.moveUci, san: node.moveSan }),
      items: Object.freeze(items), links: Object.freeze(links), families: Object.freeze(families),
    });
  });
  const families = foldReviewFamilyState(nodes, input.subject.pathNodeIds);
  return createReviewEvidencePacket({ subject: input.subject, manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest, nodes: Object.freeze(nodes), families, completion: foldReviewCompletion(families, nodes) });
}

/** The callable trust boundary: the private aggregate seal, the live subject and the canonical digest. */
export function assertReviewEvidencePacket(value: unknown): asserts value is ReviewEvidencePacket {
  const sealed = typeof value === "object" && value !== null ? PACKETS.get(value) : undefined;
  if (sealed === undefined) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "packet was not constructed by compileReviewEvidence");
  const packet = value as ReviewEvidencePacket;
  if (packet.subject !== sealed.subject) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "packet subject was replaced");
  assertReviewRecordedPrefixReceipt(packet.subject);
  if (presentationDigest("review.packet@1", packetImage(packet)) !== packet.packetDigest || packet.packetDigest !== sealed.image) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "packet digest mismatch");
  if (packet.manifestDigest !== PRIMARY_EVIDENCE_MANIFEST.digest) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", "packet names another manifest");
}

/** Convenience: authorize nothing, run the plan over one live subject and compile its packet. */
export function compileReviewPacketForSubject(subject: ReviewRecordedPrefixReceipt, context: ReviewSourceContext): ReviewEvidencePacket {
  return compileReviewEvidence({ subject, sources: runReviewPacketSources(subject, context) });
}

// ---------------------------------------------------------------------------------------------
// Family abstentions: questions issued only by the sealed packet that asked them ([[D3104]])
// ---------------------------------------------------------------------------------------------

const FAMILY_QUESTIONS: Readonly<Record<ReviewSourceFamily, PresentationQuestionId>> = Object.freeze({
  engine_eval: "review.engine_eval", engine_wdl: "review.engine_wdl", tablebase: "review.tablebase", semantic: "review.semantic",
  opening: "review.opening", human_model: "review.human_model", human_corpus: "review.human_corpus", authored: "review.authored", recorded: "review.recorded",
});

/**
 * The abstention components of one node, one per family whose requested sources are pending or
 * terminally absent. The question, request id and decision stamp come from the sealed packet's own
 * invocation slots and subject — never from a caller. `not_requested` constructs nothing (it is
 * the unopened door), and a family with any available item states no absence.
 */
export function presentReviewFamilyAbstentions(packet: ReviewEvidencePacket, nodeId: string, families: readonly ReviewSourceFamily[]): readonly PresentedEvidenceItem[] {
  assertReviewEvidencePacket(packet);
  const node = packet.nodes.find((candidate) => candidate.nodeId === nodeId);
  if (node === undefined) throw new ReviewEvidenceError("REVIEW_PACKET_INVALID", `node ${nodeId} is not in the packet`);
  const decision = { eventHeadSeq: packet.subject.eventHead.seq, cursor: { branchId: packet.subject.branchId, nodeId }, disclosureBoundarySeq: null, digest: packet.subject.subjectDigest };
  return Object.freeze(families.flatMap((family) => {
    const state = node.families[family];
    if (state.itemCount > 0) return [];
    const row = state.sources.find((candidate) => candidate.state.kind === "pending" || candidate.state.kind === "not_yet_scheduled")
      ?? state.sources.find((candidate) => candidate.state.kind === "unavailable")
      ?? state.sources.find((candidate) => candidate.state.kind === "honest_empty");
    if (row === undefined) return [];
    const adapter = ADAPTER_BY_ID.get(row.adapterId)!;
    const producer = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => refKey(projection) === refKey(adapter.projection))!.producer;
    const base = { question: FAMILY_QUESTIONS[family], projection: { ...adapter.projection }, producer: { ...producer }, requestId: row.invocationId, decision };
    let operand: AbstentionOperand;
    if (row.state.kind === "pending" || row.state.kind === "not_yet_scheduled") {
      operand = { kind: "pending", stage: row.state.kind === "pending" ? "requested" : "not_yet_scheduled", ...base };
    } else {
      const reason = row.state.kind === "unavailable" ? row.state.reason : row.state.kind === "honest_empty" ? row.state.reason : "input_abstained";
      operand = { kind: "settled_abstention", ...base, absence: PRESENTATION_SOURCE_REASONS[reason].absence, reason, sourceReceipt: { producer: { ...producer }, projection: { ...adapter.projection }, receiptDigest: presentationDigest("review.source-row@1", { packet: packet.packetDigest, row }) } };
    }
    return [sealPresentedItemForOwner(packet, null, { consumer: { id: "module.review_map", version: 1 }, projection: REVIEW_PACKET_FAMILY_SEAT }, { id: "abstention", operand })];
  }));
}

// ---------------------------------------------------------------------------------------------
// Durable engine deliveries: the run's own evidence.attached eval events are the reconstruction
// authority. An event carrying `values.providerDelivery` re-derives through the provider exchange's
// sole reload boundary; an event without it is a legacy reading that abstains for Review.
// ---------------------------------------------------------------------------------------------

/** The additive payload key under which the coordinator persists the exact provider delivery. */
export const REVIEW_PROVIDER_DELIVERY_KEY = "providerDelivery" as const;

/**
 * Durable per-node engine states for one path: `delivered` (re-derived, sealed), legacy
 * (`legacy_provenance_missing`) or absent. A re-derived delivery always wins over a legacy row.
 */
export function reviewDurableEngineStates(run: DrillRun, path: readonly Pick<Node, "id" | "fen">[]): ReadonlyMap<string, ReviewProviderNodeState> {
  const onPath = new Map(path.map((node) => [node.id, node]));
  const states = new Map<string, ReviewProviderNodeState>();
  for (const event of run.events) {
    if (event.type !== "evidence.attached" || event.data.payload.kind !== "eval" || event.data.payload.source !== "engine_validated") continue;
    const node = onPath.get(event.data.nodeId);
    if (node === undefined) continue;
    const persisted = (event.data.payload.values as Readonly<Record<string, unknown>>)[REVIEW_PROVIDER_DELIVERY_KEY];
    if (persisted !== undefined) {
      try {
        const delivery = parsePersistedProviderDelivery("stockfish.position_evaluation@1", persisted);
        if (delivery.payload.fen === node.fen) {
          states.set(node.id, Object.freeze({ kind: "delivered" as const, delivery: invokeEvidenceValueRoute("live.stockfish.position_eval@1", { delivery }) as DeclaredEvidence<StockfishPositionEvaluation> }));
          continue;
        }
      } catch {
        // Falls through: bytes that no longer re-derive are not a delivery.
      }
    }
    if (states.get(node.id)?.kind !== "delivered") states.set(node.id, Object.freeze({ kind: "unavailable" as const, reason: "legacy_provenance_missing" as const }));
  }
  return states;
}

/**
 * The additive payload key under which the coordinator records the same node's bounded engine line
 * (`stockfish.principal_variation@1`) beside its evaluation delivery. Review's packet never reads it:
 * only the explicit Analyze reveal does (rfc/review-map.md §7), so refusal 7 holds — the evaluation
 * delivery, its projections and the packet carry no best move or PV.
 */
export const REVIEW_PROVIDER_LINE_KEY = "providerLineDelivery" as const;

/**
 * The durable, re-derived engine line recorded for one node, sealed as
 * `live.stockfish.principal_variation@1`, or undefined when none re-derives for that exact FEN. The
 * latest recorded line wins; bytes that no longer re-derive are not a line. Read-only.
 */
export function reviewDurableEngineLine(run: DrillRun, node: Pick<Node, "id" | "fen">): DeclaredEvidence<StockfishPrincipalVariation> | undefined {
  let line: DeclaredEvidence<StockfishPrincipalVariation> | undefined;
  for (const event of run.events) {
    if (event.type !== "evidence.attached" || event.data.nodeId !== node.id || event.data.payload.kind !== "eval" || event.data.payload.source !== "engine_validated") continue;
    const persisted = (event.data.payload.values as Readonly<Record<string, unknown>>)[REVIEW_PROVIDER_LINE_KEY];
    if (persisted === undefined) continue;
    try {
      const delivery = parsePersistedProviderDelivery("stockfish.principal_variation@1", persisted);
      if (delivery.payload.fen === node.fen) line = invokeEvidenceValueRoute("live.stockfish.principal_variation@1", { delivery }) as DeclaredEvidence<StockfishPrincipalVariation>;
    } catch {
      // Bytes that no longer re-derive are not a recorded line.
    }
  }
  return line;
}

/**
 * Local (in-memory) compilation for one run whose storage is the run itself: tests, offline tools
 * and any caller that already holds the parsed stored run and its import record image. Provider
 * states default to the run's durable deliveries; nodes without one are `not_requested`.
 */
export function reviewPacketForRun(run: DrillRun, branchId: string, options: { readonly importRecord?: ReviewImportRecordImage; readonly shapes?: readonly ShapeTriggerSource[]; readonly engine?: ReadonlyMap<string, ReviewProviderNodeState> } = {}): ReviewEvidencePacket {
  const authorize = createReviewPrefixAuthority({ loadRun: (runId) => runId === run.id ? run : undefined, loadImportRecord: (runId) => runId === run.id ? options.importRecord : undefined });
  const subject = authorize({ runId: run.id, branchId });
  const { path } = reviewSubjectPath(subject);
  const engine = options.engine ?? reviewDurableEngineStates(run, path);
  return compileReviewPacketForSubject(subject, { engine, shapes: options.shapes ?? [] });
}

/**
 * The additive durable image of one admitted delivery on the run's own `evidence.attached` eval
 * event. The legacy scalar fields keep existing inspector/grade readers working; Review reads only
 * `providerDelivery`, which re-derives through the provider exchange's reload boundary. The same
 * node's bounded engine line, when the coordinator obtained one, is recorded under
 * `providerLineDelivery` for the explicit Analyze reveal alone.
 */
export function reviewDeliveryEvidencePayload(delivery: StockfishPositionEvaluation, line?: StockfishPrincipalVariation): EvidencePayload {
  const persisted = serializeProviderDelivery("stockfish.position_evaluation@1", delivery);
  if (line !== undefined && line.payload.fen !== delivery.payload.fen) throw new TypeError("a recorded engine line must search the evaluation's exact FEN");
  const score = delivery.payload.score;
  const bound = delivery.payload.bound;
  return Object.freeze({
    kind: "eval" as const,
    source: "engine_validated" as const,
    values: Object.freeze({
      ...(score.kind === "centipawns" ? { centipawns: score.value } : { mateIn: score.side === "white" ? score.distance : -score.distance }),
      perspective: "white",
      engineId: delivery.acquisition.actualIdentity.id,
      ...(bound.kind === "movetime" ? { requestedMovetimeMs: bound.requestedMs } : bound.kind === "depth" ? { requestedDepth: bound.requestedDepth } : {}),
      [REVIEW_PROVIDER_DELIVERY_KEY]: persisted,
      ...(line === undefined ? {} : { [REVIEW_PROVIDER_LINE_KEY]: serializeProviderDelivery("stockfish.principal_variation@1", line) }),
    }),
  });
}
