// Accepted move-quality-grades §2a / F2 §2.3l. Package-private source authority; no wire grant.
import { parseFinalizedAssistanceV1, type FinalizedAssistanceV1 } from "./assistance-exchange.js";
import { assertEvidenceConsumerExecutionManifestV2, type CompiledEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceDigest, evidenceValueReceipt, type DeclaredEvidence, type EvidenceRole } from "./evidence-contract.js";
import { moduleConsumerCeilings } from "./module-policy.js";
import { assertRecordedEdgeEvidence, recordedEdgePayload, type RecordedEdge } from "./recorded-edge.js";
import { sideToMove } from "./review-points.js";
import { readRecordedEngineNode, recordedEngineNodesComparable, snapshotRecordedEngineOffline, type RecordedEngineNodeCapture } from "./internal/recorded-engine-node.js";
import { recordedOfflineEngineEndpoint } from "./internal/recorded-engine-endpoint-values.js";
import { readRecordedEngineAttachments } from "./internal/recorded-engine-attachments.js";

export interface RecordedGradePermission {
  readonly principal: Readonly<{ learnerId: string; handle: string }>;
  readonly role: EvidenceRole;
  /** Nudge uses finalized live assistance. The dedicated Review page admits its own complete
   * review-only module ceiling, rather than borrowing a live-play preset or Inspector grant. */
  readonly assistance: FinalizedAssistanceV1 | null;
  readonly timing: "post_commit" | "review";
  readonly session: string;
  readonly execution: CompiledEvidenceConsumerExecutionV2;
}
type Origin = "provider_delivery" | "offline_engine" | null;
export interface RecordedGradeCapture {
  readonly permission: RecordedGradePermission;
  readonly before: RecordedEngineNodeCapture;
  readonly after: RecordedEngineNodeCapture;
  readonly edge: DeclaredEvidence<RecordedEdge>;
  readonly origins: readonly [Origin, Origin];
  readonly signal: AbortSignal;
}
type EngineNode = ReturnType<typeof readRecordedEngineNode>;
type Available = NonNullable<EngineNode["selected"]>;
export type RecordedGradeAbsence = "source_pending" | "missing_eval" | "input_abstained" | "unequal_instrument";
type PairState = Readonly<{ kind: "unavailable"; reason: RecordedGradeAbsence }>
  | Readonly<{ kind: "available"; before: Available; after: Available;
      inputs: readonly [DeclaredEvidence<unknown>, DeclaredEvidence<unknown>, DeclaredEvidence<RecordedEdge>] }>;
declare const recordedGradeSourceBrand: unique symbol;
export interface RecordedGradeSource { readonly [recordedGradeSourceBrand]: true }
type GradeData = ReturnType<typeof compute>;
const sources = new WeakMap<object, Readonly<{ capture: RecordedGradeCapture; data: GradeData; assertOwnerCurrent: () => void }>>();
const refuse = (message: string): never => { throw new TypeError(`Recorded grade source: ${message}`); };
const exact = (value: unknown, keys: readonly string[]) => value !== null && typeof value === "object"
  && Object.getPrototypeOf(value) === Object.prototype && Reflect.ownKeys(value).length === keys.length
  && keys.every(key => { const field = Object.getOwnPropertyDescriptor(value, key); return field?.enumerable && "value" in field; });
const expandedValue = (value: DeclaredEvidence<unknown>) => ({ producer: value.producer, projection: value.projection,
  payload: value.payload, receipt: evidenceValueReceipt(value) });

// Internal lifetime check from the sole issuer, not a factory argument or a source-valid
// Boolean. It supplies no operands: all original source/edge/plan checks remain mandatory.
function assertOwnerCurrent(check: () => void): void {
  if (typeof check !== "function" || check() !== undefined) return refuse("requires the source owner's current access check");
}

function validate(input: RecordedGradeCapture) {
  input.signal.throwIfAborted();
  const permission = input.permission;
  if (!exact(permission, ["principal", "role", "assistance", "timing", "session", "execution"])
    || !exact(permission.principal, ["learnerId", "handle"]) || ![permission.principal.learnerId, permission.principal.handle].every(value => typeof value === "string" && value.length > 0)) return refuse("invalid permission image");
  // Validate the digest-bound ceiling before touching any private recorded measurement.
  if (permission.assistance !== null) parseFinalizedAssistanceV1(permission.assistance);
  // A genuine complete current plan, not a name/count or an isolated valid grade projection.
  assertEvidenceConsumerExecutionManifestV2(permission.execution, PRIMARY_EVIDENCE_MANIFEST);
  const consumer = permission.execution.consumer, nudge = consumer.id === "module.postcommit_nudge";
  if (consumer.version !== 2 || !nudge && consumer.id !== "module.review_map") return refuse("not a current grade consumer");
  const module = nudge ? "postcommit_nudge" : "review_map", timing = nudge ? "post_commit" : "review";
  const ceilings = moduleConsumerCeilings(module);
  // Complete original plan membership is authenticated above. A copied cardinality cannot
  // strengthen that authority, and a frozen count would reject legitimate source migrations.
  if (permission.timing !== timing
    || !ceilings.roles.includes(permission.role) || !ceilings.sessions.includes(permission.session)
    || (permission.assistance === null ? nudge : !permission.assistance.modules.includes(module)
      || !permission.assistance.effects.some(effect => effect.moduleId === module && effect.timing === timing && effect.subSurface === undefined))) return refuse("current workflow/role/session/assistance does not admit evaluation");
  if (!Array.isArray(input.origins) || input.origins.length !== 2 || Reflect.ownKeys(input.origins).length !== 3
    || !["0", "1"].every(key => { const field = Object.getOwnPropertyDescriptor(input.origins, key); return field?.enumerable && "value" in field; })
    || input.origins.some(value => value !== null && value !== "provider_delivery" && value !== "offline_engine")) return refuse("invalid original origin image");
  if (input.before.attachments !== input.after.attachments) return refuse("endpoints have different original storage sources");
  const before = readRecordedEngineNode(input.before), after = readRecordedEngineNode(input.after);
  if (before.boundary !== after.boundary) return refuse("endpoints cross the original snapshot/head/branch");
  const boundary = before.boundary, run = boundary.run;
  const index = boundary.path.findIndex(entry => entry.node.id === after.row.position.payload.nodeId);
  if (index <= 0 || boundary.path[index - 1]!.node.id !== before.row.position.payload.nodeId) return refuse("endpoints are not the actual ordered incoming edge");
  const parent = boundary.path[index - 1]!, child = boundary.path[index]!;
  assertRecordedEdgeEvidence(input.edge);
  const expected = recordedEdgePayload(run, parent.node, child.node), receipt = evidenceValueReceipt(input.edge);
  if (evidenceDigest(input.edge.payload) !== evidenceDigest(expected) || receipt.inputDigest !== evidenceDigest({
    run: { run: run.id, nodes: run.nodes.length, events: run.events.length }, parentId: parent.node.id, childId: child.node.id,
  })) return refuse("edge is not its original run/node invocation");
  const mover = sideToMove(parent.node.fen);
  if (nudge && (child.node.actor !== "user" || mover !== boundary.learnerSide || boundary.request.throughNodeId !== child.node.id)) return refuse("Nudge source is not the actual committed learner subject");
  const context = nudge ? "drill" as const : run.sessionKind === "imported" ? "imported_analysis" as const : "review" as const;
  for (const [ordinal, node] of [before, after].entries()) {
    const origin = input.origins[ordinal];
    if (node.selected !== null ? origin !== node.selected.instrument.origin
      : node.unavailable === "source_pending" ? origin !== "provider_delivery"
        : origin === "provider_delivery" || origin === "offline_engine" && run.sessionKind !== "pack") return refuse("origin crosses its original endpoint state");
  }
  const state = pairState(before, after, input.edge);
  const inputs = state.kind === "available" ? state.inputs : Object.freeze([]);
  input.signal.throwIfAborted();
  return { before, after, edge: input.edge, mover, context, state, inputs };
}

function compute(input: RecordedGradeCapture) {
  const data = validate(input), { before, after, mover, context, state, inputs } = data;
  const boundary = before.boundary, run = boundary.run, permission = input.permission;
  const parent = boundary.path.find(entry => entry.node.id === before.row.position.payload.nodeId)!;
  const child = boundary.path.find(entry => entry.node.id === after.row.position.payload.nodeId)!;
  const endpointImage = (node: EngineNode, capture: RecordedEngineNodeCapture, origin: Origin) => ({
    origin, position: expandedValue(node.row.position), selectedOrdinal: node.selectedOrdinal, selected: node.selected,
    unavailable: node.selected === null ? node.unavailable : null,
    modern: node.row.occurrences.map(occurrence => ({ ...occurrence,
      ...(occurrence.kind === "modern" ? { evaluation: expandedValue(occurrence.evaluation) } : {}) })),
    selectedPoint: node.row.selected === null ? null : expandedValue(node.row.selected.point),
    offline: capture.offline,
    candidates: capture.offline?.candidates.map(candidate => ({ ordinal: candidate.ordinal, sourceOrdinal: candidate.sourceOrdinal,
      disposition: candidate.invocation.result.kind === "unavailable" ? "ledger_record_not_admitted"
        : recordedOfflineEngineEndpoint(candidate) === null ? "input_abstained" : candidate.ordinal === node.selectedOrdinal ? "selected" : "eligible" })) ?? [],
    pending: capture.pending,
  });
  input.signal.throwIfAborted();
  return { ...data,
    authority: { operation: "recorded-grade-source@1", permission: { ...permission },
      subject: { runId: run.id, head: boundary.eventHead, branchId: boundary.request.branchId, throughNodeId: boundary.request.throughNodeId,
        parent, child, edge: expandedValue(input.edge), mover, context },
      endpoints: [endpointImage(before, input.before, input.origins[0]), endpointImage(after, input.after, input.origins[1])],
      pair: { kind: state.kind, ...(state.kind === "unavailable" ? { reason: state.reason } : {}), inputs: inputs.map(expandedValue) } } };
}
function pairState(before: EngineNode, after: EngineNode, edge: DeclaredEvidence<RecordedEdge>): PairState {
  for (const reason of ["source_pending", "missing_eval", "input_abstained"] as const) {
    if ([before, after].some(node => node.selected === null && node.unavailable === reason)) return Object.freeze({ kind: "unavailable", reason });
  }
  if (before.selected === null || after.selected === null) return refuse("unknown original endpoint state");
  if (!recordedEngineNodesComparable(before, after)) return Object.freeze({ kind: "unavailable", reason: "unequal_instrument" });
  if (before.selectedOperand === null || after.selectedOperand === null) return refuse("comparable pair lost its literal operands");
  return Object.freeze({ kind: "available", before: before.selected, after: after.selected,
    inputs: Object.freeze([before.selectedOperand, after.selectedOperand, edge] as const) });
}
export function isRecordedGradeSource(value: unknown): value is RecordedGradeSource {
  return value !== null && typeof value === "object" && sources.has(value);
}
export function readRecordedGradeSource(source: RecordedGradeSource): GradeData {
  if (!isRecordedGradeSource(source)) return refuse("not issued by the sole source owner");
  const owned = sources.get(source)!;
  // Issue validates and deeply freezes the full original pair/permission/authority image. Those
  // operands cannot change. Live owner access/role/disclosure/registry/pending dependencies,
  // cancellation, callable plan and full storage boundary still precede absence and publication.
  owned.capture.signal.throwIfAborted();
  assertOwnerCurrent(owned.assertOwnerCurrent);
  assertEvidenceConsumerExecutionManifestV2(owned.capture.permission.execution, PRIMARY_EVIDENCE_MANIFEST);
  if (readRecordedEngineAttachments(owned.capture.before.attachments).boundary !== owned.data.before.boundary) return refuse("original attachment boundary changed");
  assertOwnerCurrent(owned.assertOwnerCurrent);
  owned.capture.signal.throwIfAborted();
  return owned.data;
}
/** Only the RunService grade owner may import this authority; never a public/client export. */
export const RECORDED_GRADE_SOURCE_AUTHORITY = Object.freeze({
  issue(input: RecordedGradeCapture, checkCurrentOwner: () => void): RecordedGradeSource {
    if (!exact(input, ["permission", "before", "after", "edge", "origins", "signal"])) return refuse("invalid constructor image");
    if (!(input.signal instanceof AbortSignal)) return refuse("requires the actual request cancellation signal");
    assertOwnerCurrent(checkCurrentOwner);
    validate(input);
    const snapshotNode = (node: RecordedEngineNodeCapture) => Object.freeze({ ...node, offline: snapshotRecordedEngineOffline(node.offline) });
    const capture = Object.freeze({ ...input, before: snapshotNode(input.before), after: snapshotNode(input.after),
      origins: Object.freeze([...input.origins]) as readonly [Origin, Origin], permission: Object.freeze({ ...input.permission,
        principal: Object.freeze({ ...input.permission.principal }), assistance: input.permission.assistance === null ? null : parseFinalizedAssistanceV1(structuredClone(input.permission.assistance)) }) });
    const data = freeze(compute(capture));
    assertOwnerCurrent(checkCurrentOwner);
    const source = Object.freeze({}) as RecordedGradeSource;
    sources.set(source, { capture, data, assertOwnerCurrent: checkCurrentOwner }); return source;
  },
});
const frozenData = new WeakSet<object>();
function freeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (value !== null && typeof value === "object" && !seen.has(value) && !frozenData.has(value)) {
    seen.add(value); for (const child of Object.values(value)) freeze(child, seen); Object.freeze(value); frozenData.add(value);
  }
  return value;
}
