// rfc/review-evidence-compiler.md §4: the typed, partial post-game Review packet.
//
// One storage-derived recorded-prefix subject; one literal source-adapter registry with executable
// payload parsers and node/incoming-edge grain; a subject-derived invocation plan; private-sealed
// adapter results; one aggregate-sealed packet with node items, exact-occurrence links and total,
// order-independent family folds; and orthogonal progress/degradation. The packet is not a ranking
// and not prose; it selects nothing and grades nothing.

import { branchPath } from "./branch-path.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertDeclaredEvidence, evidenceValueReceipt, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
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
import type { ForcedMateAfterMoveProofV2, RecordedPosition, ReviewEnginePoint, ReviewMateTransition, StockfishPositionEvaluation } from "./review-points.js";
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
  readonly authority: (input: ReviewPrefixAuthorizationInput) => ReviewRecordedPrefixReceipt;
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
  const authorizeReviewRecordedPrefix = (input: ReviewPrefixAuthorizationInput): ReviewRecordedPrefixReceipt => {
    if (typeof input !== "object" || input === null || Object.keys(input).sort().join("|") !== "branchId|runId" || typeof input.runId !== "string" || typeof input.branchId !== "string") refuse("REVIEW_PREFIX_REFUSED", "prefix input is exactly { runId, branchId }");
    const run = storage.loadRun(input.runId) ?? refuse("REVIEW_PREFIX_REFUSED", `run ${input.runId} is not stored`);
    if (run.id !== input.runId) refuse("REVIEW_PREFIX_REFUSED", "stored run identity differs from the requested run");
    const events = run.events;
    if (events.length === 0) refuse("REVIEW_PREFIX_REFUSED", "a stored run has at least its start event");
    for (let index = 1; index < events.length; index += 1) if (events[index]!.seq !== events[index - 1]!.seq + 1) refuse("REVIEW_PREFIX_REFUSED", `event sequence is not contiguous at ${events[index]!.seq}`);
    let path: readonly Node[];
    try { path = branchPath(run, input.branchId); } catch (error) { return refuse("REVIEW_PREFIX_REFUSED", error instanceof Error ? error.message : String(error)); }
    const semantic = recordedSemanticPath(run, input.branchId);
    if (semantic.kind === "available" && semantic.pathNodeIds.join("\u0000") !== path.map((node) => node.id).join("\u0000")) refuse("REVIEW_PREFIX_REFUSED", "recorded semantic path disagrees with the branch path");
    const pathIds = new Set(path.map((node) => node.id));
    const record = storage.loadImportRecord(run.id);
    if (record !== undefined && record.runId !== run.id) refuse("REVIEW_PREFIX_REFUSED", "import record belongs to another run");
    if (record !== undefined && run.sessionKind !== "imported") refuse("REVIEW_PREFIX_REFUSED", "an import record is present for a non-imported run");
    if (record === undefined && run.sessionKind === "imported") refuse("REVIEW_PREFIX_REFUSED", "an imported run has no import record");
    const terminal = [...events].reverse().find((event) => event.type === "outcome.reached" && pathIds.has(event.data.nodeId));
    let outcome: ReviewOutcomeReceipt;
    if (terminal?.type === "outcome.reached") {
      if (record !== undefined && record.result !== "*" && learnerResult(record.result, run.start.side) !== terminal.data.outcome) refuse("REVIEW_PREFIX_REFUSED", "the import record result disagrees with the on-path terminal");
      outcome = { kind: "board_terminal", eventSeq: terminal.seq, nodeId: terminal.data.nodeId, result: terminal.data.outcome };
    } else if (record !== undefined && record.result !== "*") {
      outcome = { kind: "recorded_result", sourceDigest: presentationDigest("review.import-record@1", { runId: record.runId, result: record.result, movetextDigest: record.movetextDigest }), result: record.result };
    } else {
      outcome = { kind: "unfinished" };
    }
    const head = events.at(-1)!;
    const eventHead = { seq: head.seq, digest: presentationDigest("review.event-prefix@1", events) };
    const pathNodeIds = path.map((node) => node.id);
    const prefixDigest = presentationDigest("review.prefix@1", { eventHead, path: path.map((node) => ({ id: node.id, parentId: node.parentId, ply: node.ply, fen: node.fen, moveUci: node.moveUci })) });
    const body = { protocol: "review-recorded-prefix@1" as const, runId: run.id, branchId: input.branchId, eventHead, tipNodeId: pathNodeIds.at(-1)!, pathNodeIds, prefixDigest, learnerSide: run.start.side, outcome };
    const receipt = deepFreeze({ ...body, subjectDigest: presentationDigest("review.subject@1", body) });
    PREFIXES.set(receipt, Object.freeze({ authority: authorizeReviewRecordedPrefix, run, path: Object.freeze([...path]), semantic }));
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
  const replay = snapshot!.authority({ runId: receipt.runId, branchId: receipt.branchId });
  if (replay.subjectDigest !== receipt.subjectDigest) refuse("REVIEW_PREFIX_REFUSED", "prefix receipt no longer matches its storage authority");
}

function snapshotOf(subject: ReviewRecordedPrefixReceipt): PrefixSnapshot {
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
  readonly positions: Map<string, DeclaredEvidence<RecordedPosition>>;
  readonly edges: Map<string, DeclaredEvidence<RecordedEdge>>;
  pivotal?: ReadonlyMap<string, readonly DeclaredEvidence<unknown>[]>;
  shapes?: ReadonlyMap<string, readonly DeclaredEvidence<unknown>[]>;
  consequence?: readonly { readonly nodeId: string; readonly evidence: DeclaredEvidence<unknown> }[];
}

interface ExecutionContext {
  readonly subject: ReviewRecordedPrefixReceipt;
  readonly snapshot: PrefixSnapshot;
  readonly byId: ReadonlyMap<string, Node>;
  readonly context: ReviewSourceContext;
  readonly memo: Memo;
}

type AdapterOperation = (slot: Slot, execution: ExecutionContext) => SourceOutcome;

export interface ReviewPacketSourceAdapter {
  readonly id: string;
  readonly projection: VersionedEvidenceId;
  readonly family: ReviewSourceFamily;
  readonly grain: "node" | "incoming_edge";
  /** Executable exact payload parser; evidence authority is admitted only after it succeeds. */
  readonly parser: (payload: unknown) => unknown;
  readonly operation: AdapterOperation;
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

function positionOf(execution: ExecutionContext, nodeId: string): DeclaredEvidence<RecordedPosition> {
  let position = execution.memo.positions.get(nodeId);
  if (position === undefined) {
    position = invokeEvidenceValueRoute("run.record.position@1", { run: execution.snapshot.run, nodeId }) as DeclaredEvidence<RecordedPosition>;
    execution.memo.positions.set(nodeId, position);
  }
  return position;
}

function edgeOf(execution: ExecutionContext, slot: Slot): DeclaredEvidence<RecordedEdge> {
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
function pointOf(execution: ExecutionContext, nodeId: string): DeclaredEvidence<ReviewEnginePoint> | ReviewAdapterState {
  const cached = execution.memo.points.get(nodeId);
  if (cached !== undefined) return cached;
  const provider = execution.context.engine.get(nodeId) ?? { kind: "not_requested" as const };
  let result: DeclaredEvidence<ReviewEnginePoint> | ReviewAdapterState;
  if (provider.kind === "delivered") {
    const point = invokeEvidenceValueRoute("derived.review.eval_point@1", { evaluation: provider.delivery, position: positionOf(execution, nodeId) });
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

function edgePoints(slot: Slot, execution: ExecutionContext): { readonly before: DeclaredEvidence<ReviewEnginePoint>; readonly after: DeclaredEvidence<ReviewEnginePoint> } | ReviewAdapterState {
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

function shapesAt(execution: ExecutionContext, nodeId: string): readonly DeclaredEvidence<unknown>[] {
  if (execution.memo.shapes === undefined) {
    const byNode = new Map<string, DeclaredEvidence<unknown>[]>();
    const firings = invokeEvidenceValueRoute("theory.shapes.firing@1", { entries: execution.context.shapes, path: execution.snapshot.path.map((node) => ({ id: node.id, fen: node.fen })) });
    for (const firing of firings) {
      const node = (firing.payload as { readonly firstNodeId: string }).firstNodeId;
      byNode.set(node, [...(byNode.get(node) ?? []), firing]);
    }
    execution.memo.shapes = byNode;
  }
  return execution.memo.shapes.get(nodeId) ?? [];
}

const semanticEventAdapter = (id: string): ReviewPacketSourceAdapter => Object.freeze({
  id: `review.source.${id}@2`,
  projection: V2(id),
  family: "semantic",
  grain: "node",
  parser: (payload: unknown) => { if (!isRecord(payload)) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", `${id}@2 payload is not an object`); return payload; },
  operation: (slot: Slot, execution: ExecutionContext) => {
    const semantic = execution.snapshot.semantic;
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

const pivotalAdapter = (kind: string): ReviewPacketSourceAdapter => Object.freeze({
  id: `review.source.pivotal.${kind}@1`,
  projection: V1(`derived.pivotal.${kind}`),
  family: "semantic",
  grain: "node",
  parser: exactPayload(["nodeId", "kind", "detail", "provenanceNote"], `derived.pivotal.${kind}@1`),
  operation: (slot: Slot, execution: ExecutionContext) => available(pivotalAt(execution, slot.nodeId, `derived.pivotal.${kind}`)),
});

/** The exact adapter population, keyed by projection; set-equal to REVIEW_PACKET_SOURCE_PROJECTION_IDS. */
export const REVIEW_PACKET_SOURCE_ADAPTERS = Object.freeze([
  // recorded
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.position@1", projection: V1("run.record.position"), family: "recorded", grain: "node", parser: exactPayload(["nodeId", "ply", "fen"], "run.record.position@1"), operation: (slot, execution) => available([positionOf(execution, slot.nodeId)]) }),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.edge@1", projection: V1("run.record.edge"), family: "recorded", grain: "incoming_edge", parser: exactPayload(["runId", "edgeBranchId", "beforeNodeId", "afterNodeId", "beforeFen", "afterFen", "moveUci", "moveSan", "ply"], "run.record.edge@1"), operation: (slot, execution) => available([edgeOf(execution, slot)]) }),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.consequence@1", projection: V1("run.record.consequence"), family: "recorded", grain: "node", parser: exactPayload(["context", "terminal"], "run.record.consequence@1", ["outcome", "plies", "objectiveState"]), operation: (slot, execution) => {
    execution.memo.consequence ??= invokeEvidenceValueRoute("run.record.consequence@1", { run: execution.snapshot.run, branchId: execution.subject.branchId }).map((item) => ({ nodeId: item.nodeId, evidence: item.evidence as DeclaredEvidence<unknown> }));
    return available(execution.memo.consequence.filter((item) => item.nodeId === slot.nodeId).map((item) => item.evidence));
  } }),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.imported_result@1", projection: V1("run.record.imported_result"), family: "recorded", grain: "node", parser: exactPayload(["context", "result"], "run.record.imported_result@1"), operation: (slot, execution) => {
    const outcome = execution.subject.outcome;
    if (outcome.kind !== "recorded_result" || slot.nodeId !== execution.subject.tipNodeId) return stateOnly(NO_OBSERVATION);
    return available(invokeEvidenceValueRoute("run.record.imported_result@1", { run: execution.snapshot.run, branchId: execution.subject.branchId, recordedResult: outcome.result }).map((item) => item.evidence as DeclaredEvidence<unknown>));
  } }),
  // engine_eval: one shared delivery per node supplies score and raw WDL
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.eval_point@1", projection: V1("derived.review.eval_point"), family: "engine_eval", grain: "node", parser: exactPayload(["projectionId", "position", "evaluation"], "derived.review.eval_point@1"), operation: (slot, execution) => {
    const point = pointOf(execution, slot.nodeId);
    return isPoint(point) ? available([point]) : stateOnly(point);
  } }),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.eval_delta@1", projection: V1("derived.review.eval_delta"), family: "engine_eval", grain: "incoming_edge", parser: exactPayload(["projectionId", "before", "after", "deltaCp"], "derived.review.eval_delta@1"), operation: (slot, execution) => {
    const points = edgePoints(slot, execution);
    if (!("before" in points)) return stateOnly(points);
    const delta = invokeEvidenceValueRoute("derived.review.eval_delta@1", points);
    if (delta.kind === "available") return available([delta.value]);
    return stateOnly(delta.reason === "mate_operand" ? NO_OBSERVATION : { kind: "unavailable", reason: "input_abstained" });
  } }),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.mate_transition@1", projection: V1("derived.review.mate_transition"), family: "engine_eval", grain: "incoming_edge", parser: exactPayload(["projectionId", "before", "after", "changes"], "derived.review.mate_transition@1"), operation: (slot, execution) => {
    const points = edgePoints(slot, execution);
    if (!("before" in points)) return stateOnly(points);
    const transition = invokeEvidenceValueRoute("derived.review.mate_transition@1", points);
    if (transition.kind === "available") return available([transition.value]);
    return stateOnly(transition.reason === "no_mate_operand" || transition.reason === "no_mate_transition" ? NO_OBSERVATION : { kind: "unavailable", reason: "input_abstained" });
  } }),
  // engine_wdl: the same delivery, normalized node-free, then joined by exact FEN
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.wdl_point@1", projection: V1("derived.review.wdl_point"), family: "engine_wdl", grain: "node", parser: exactPayload(["projectionId", "position", "normalized"], "derived.review.wdl_point@1"), operation: (slot, execution) => {
    const provider = execution.context.engine.get(slot.nodeId) ?? { kind: "not_requested" as const };
    if (provider.kind !== "delivered") return stateOnly(provider);
    const normalized = invokeEvidenceValueRoute("derived.review.wdl_white@1", { evaluation: provider.delivery });
    const point = invokeEvidenceValueRoute("derived.review.wdl_point@1", { normalized, position: positionOf(execution, slot.nodeId) });
    return point.kind === "available" ? available([point.value]) : stateOnly({ kind: "unavailable", reason: "input_abstained" });
  } }),
  // tablebase: requested only inside the declared material domain (baseline pass: not requested)
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.tablebase@1", projection: V1("live.syzygy.position_result"), family: "tablebase", grain: "node", parser: exactPayload(["kind", "servedAt", "cacheIdentity", "acquisition", "payload", "payloadReceipt"], "live.syzygy.position_result@1"), operation: (slot, execution) => countFenPieces(execution.byId.get(slot.nodeId)!.fen) > 7 ? stateOnly({ kind: "honest_empty", reason: "outside_domain" }) : stateOnly({ kind: "not_requested" }) }),
  // semantic
  ...["irreversibility", "phase_change", "human_divergence", "option_collapse"].map(pivotalAdapter),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.endgame@1", projection: V1("rules.endgame.classification"), family: "semantic", grain: "node", parser: exactPayload(["fen", "type", "conventionId", "provenanceNote"], "rules.endgame.classification@1"), operation: (slot, execution) => available(invokeEvidenceValueRoute("rules.endgame.classification@1", { fen: execution.byId.get(slot.nodeId)!.fen }) as readonly DeclaredEvidence<unknown>[]) }),
  ...RECORDED_PATH_EVENT_IDS.map(semanticEventAdapter),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.forced_mate@2", projection: V2("rules.tactic.consequence.forced_mate_after_move"), family: "semantic", grain: "incoming_edge", parser: exactPayload(["beforeFen", "candidate", "afterFen", "attacker", "maxAttackerMoves", "proofStatus", "proofDigest", "rootReplies", "nodes"], "rules.tactic.consequence.forced_mate_after_move@2"), operation: (slot, execution) => {
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
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.opening@1", projection: V1("theory.opening.current_endpoint"), family: "opening", grain: "node", parser: exactPayload(["positionKey", "observedPly", "eco", "name", "sourcePly", "catalogue"], "theory.opening.current_endpoint@1"), operation: () => stateOnly({ kind: "unavailable", reason: "provider_off" }) }),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.maia@1", projection: V1("human.maia.policy_page"), family: "human_model", grain: "node", parser: exactPayload(["kind", "servedAt", "cacheIdentity", "acquisition", "payload", "payloadReceipt"], "human.maia.policy_page@1"), operation: () => stateOnly({ kind: "not_requested" }) }),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.explorer@1", projection: V1("human.explorer.position_page"), family: "human_corpus", grain: "node", parser: exactPayload(["kind", "servedAt", "cacheIdentity", "acquisition", "payload", "payloadReceipt"], "human.explorer.position_page@1"), operation: () => stateOnly({ kind: "not_requested" }) }),
  Object.freeze<ReviewPacketSourceAdapter>({ id: "review.source.shapes@1", projection: V1("theory.shapes.firing"), family: "authored", grain: "node", parser: exactPayload(["entryId", "firstNodeId", "lastNodeId", "openEnded"], "theory.shapes.firing@1"), operation: (slot, execution) => available(shapesAt(execution, slot.nodeId)) }),
].sort((left, right) => left.id.localeCompare(right.id)));

export type ReviewPacketSourceAdapterId = string;
export const REVIEW_PACKET_SOURCE_PROJECTION_IDS: readonly VersionedEvidenceId[] = Object.freeze(REVIEW_PACKET_SOURCE_ADAPTERS.map((entry) => entry.projection));

const ADAPTER_BY_ID: ReadonlyMap<string, ReviewPacketSourceAdapter> = new Map(REVIEW_PACKET_SOURCE_ADAPTERS.map((entry) => [entry.id, entry]));
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
  if (!Number.isSafeInteger(options.windowNodes) || options.windowNodes < 1) throw new ReviewEvidenceError("REVIEW_SOURCE_INVALID", "windowNodes must be a positive safe integer");
  const slots: ReviewSourcePlanSlot[] = [];
  for (const entry of REVIEW_PACKET_SOURCE_ADAPTERS) {
    subject.pathNodeIds.forEach((nodeId, index) => {
      if (entry.grain === "incoming_edge" && index === 0) return;
      const fromNodeId = entry.grain === "incoming_edge" ? subject.pathNodeIds[index - 1]! : null;
      slots.push(Object.freeze({ invocationId: `${entry.id}#${entry.grain === "node" ? nodeId : `${fromNodeId}>${nodeId}`}`, adapterId: entry.id, family: entry.family, grain: entry.grain, nodeId, fromNodeId, window: Math.floor(index / options.windowNodes) }));
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
  const execution: ExecutionContext = { subject, snapshot, byId: new Map(snapshot.path.map((node) => [node.id, node])), context, memo: { points: new Map(), positions: new Map(), edges: new Map() } };
  return Object.freeze(reviewPacketSourcePlan(subject, options).map((slot) => sealSourceResult(subject, slot, ADAPTER_BY_ID.get(slot.adapterId)!.operation({ invocationId: slot.invocationId, adapterId: slot.adapterId, nodeId: slot.nodeId, grain: slot.grain, fromNodeId: slot.fromNodeId, window: slot.window }, execution))));
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
    const items = results.flatMap((result) => result.items).sort((left, right) => refKey(left.projection).localeCompare(refKey(right.projection)) || evidenceDigestOf(left).localeCompare(evidenceDigestOf(right)));
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
 * `providerDelivery`, which re-derives through the provider exchange's reload boundary.
 */
export function reviewDeliveryEvidencePayload(delivery: StockfishPositionEvaluation): EvidencePayload {
  const persisted = serializeProviderDelivery("stockfish.position_evaluation@1", delivery);
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
    }),
  });
}
