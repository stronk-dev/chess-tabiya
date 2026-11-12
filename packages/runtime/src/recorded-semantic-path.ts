// rfc/recorded-semantic-path: one pure compiler from one authoritative recorded branch path to the
// eleven v2 multi-edge semantic projections, with a complete typed window receipt. It observes
// relations only: it never selects, ranks, grades, explains or renders the events it returns.

import { resolveBranchPath } from "./branch-path.js";
import { PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_PROJECTION_REFS, RECORDED_PATH_SUCCESSOR_REFS } from "./evidence-catalog.js";
import { evidenceConventionReceipt, evidenceDigest, type CompiledEvidenceManifest, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import { CONVENTION_REGISTRY, compareConventionRefs, conventionRefKey, type ConventionReceipt, type ConventionRef } from "./evidence-conventions.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { RecordedEdgeError, recordedEdgePayload, type RecordedEdge } from "./recorded-edge.js";
import type { LegalExchangeResult } from "./exchange.js";

/** The exact legal-exchange evidence of one capture, recomputed by its factory from FEN + UCI. */
function exchangeEvidence(result: LegalExchangeResult): DeclaredEvidence<unknown> {
  const computed = invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen: result.beforeFen, captureUci: result.captureUci })[0];
  if (computed === undefined || evidenceDigest(computed.payload) !== evidenceDigest(result)) throw new TypeError("Recorded path exchange operand is not reproduced by the exchange authority");
  return computed;
}
import { harassmentPressureSequence, pawnContactTimingSequence, type RecordedMoveAnchor } from "./pawn-dynamics.js";
import {
  recordedAttractionObservedOperands,
  checkSemanticEvent,
  recordedCheckZwischenzugObservedOperands,
  recordedDefenderConsequenceOperands,
  deflectionObservedInduction,
  recordedDeflectionObservedOperands,
  interferenceObservedOperands,
  recordedLineBlockerClearanceObservedOperands,
  localSemanticEvents,
  overloadExploitationObservedOperands,
  recordedAttractionObservedSemanticEvent,
  recordedCheckZwischenzugSemanticEvent,
  recordedDefenderConsequenceSemanticEvent,
  recordedDeflectionObservedSemanticEvent,
  recordedHarassmentPressureSemanticEvent,
  recordedInterferenceSemanticEvent,
  recordedLineBlockerClearanceSemanticEvent,
  recordedOverloadExploitationSemanticEvent,
  recordedPawnContactTimingSemanticEvent,
  recordedSquareClearanceSemanticEvent,
  recordedTradeCompletedSemanticEvent,
  recordedSquareClearanceObservedOperands,
  transitionSemanticEvents,
  type SemanticEvidenceEvent,
  type TransitionSemanticEventOperands,
} from "./semantic-evidence.js";
import { defenderDutyReading, type CheckEvent } from "./tactics.js";
import type { DrillRun, Node } from "./types.js";

export type RecordedPathRefusalReason =
  | "unknown_branch"
  | "duplicate_branch"
  | "duplicate_node_id"
  | "missing_root"
  | "missing_fork"
  | "missing_parent"
  | "parent_cycle"
  | "multiple_branch_tips"
  | "off_chain_branch_node"
  | "broken_fen_boundary"
  | "illegal_recorded_move"
  | "noncanonical_recorded_move"
  | "noncanonical_recorded_san"
  | "broken_ply";

export type RecordedPathHorizon = 2 | 3 | 4 | 5;

export type RecordedPathWindowReceipt = Readonly<{
  projection: VersionedEvidenceId;
  startNodeId: string;
  endNodeId: string | null;
  horizon: RecordedPathHorizon;
  status: "emitted" | "no_witness" | "insufficient_continuation";
  eventIds: readonly string[];
}>;

/**
 * The exact convention closure of the emitted events ([[D1921]]/[[D1929]];
 * rfc/semantic-convention-provenance.md §4). `refs` is the union of every emitted event's sealed
 * value-level convention receipt, `registryDigest` names the compiled registry those refs resolve
 * in, and `digest` covers each event's exact receipt digest in emission order. An empty path emits
 * no event and carries an empty closure under the same registry.
 */
export type RecordedPathConventionReceipt = Readonly<{
  status: "registered";
  registryDigest: string;
  refs: readonly ConventionRef[];
  eventReceiptDigests: readonly string[];
  digest: string;
}>;

export type RecordedSemanticPathResult =
  | Readonly<{
      kind: "available";
      branchId: string;
      branchOrigin: "played" | "simulated";
      pathNodeIds: readonly string[];
      events: readonly SemanticEvidenceEvent[];
      windows: readonly RecordedPathWindowReceipt[];
      conventionReceipt: RecordedPathConventionReceipt;
      digest: string;
    }>
  | Readonly<{
      kind: "refused";
      branchId: string;
      reason: RecordedPathRefusalReason;
      atNodeId?: string;
      detail: string;
    }>;

/** Non-persisted execution receipt: deterministic work counts plus environment-sensitive timings. */
export type RecordedSemanticPathExecution = Readonly<{
  result: RecordedSemanticPathResult;
  work: Readonly<{
    preparedEdges: number;
    transitionCompiles: number;
    checkProbes: number;
    localFanOut: number;
    defenderDutyReads: number;
    distinctWindowStartFens: number;
    receipts: number;
  }>;
  timings: Readonly<{ validationMs: number; preparationMs: number; windowsMs: number; totalMs: number }>;
}>;

type Family =
  | "trade_completed" | "contact_timing" | "harassment_pressure" | "defender_consequence" | "deflection" | "attraction"
  | "line_clearance" | "square_clearance" | "interference" | "check_zwischenzug" | "overload_exploitation";

export interface RecordedPathEvaluatorRow {
  readonly family: Family;
  readonly projection: VersionedEvidenceId;
  readonly horizon: RecordedPathHorizon;
}

const v2 = (id: string): VersionedEvidenceId => Object.freeze({ id, version: 2 });
const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

/** Private evaluator table (§3): eleven exact v2 projections, thirteen (family, horizon) rows. */
const EVALUATOR_ROWS: readonly RecordedPathEvaluatorRow[] = Object.freeze([
  { family: "trade_completed", projection: v2("derived.exchange.trade_completed"), horizon: 2 },
  { family: "contact_timing", projection: v2("derived.pawn.sequence.contact_timing"), horizon: 2 },
  { family: "contact_timing", projection: v2("derived.pawn.sequence.contact_timing"), horizon: 3 },
  { family: "harassment_pressure", projection: v2("derived.pawn.sequence.harassment_pressure"), horizon: 2 },
  { family: "defender_consequence", projection: v2("derived.tactic.sequence.defender_consequence"), horizon: 3 },
  { family: "deflection", projection: v2("derived.tactic.deflection_observed"), horizon: 3 },
  { family: "attraction", projection: v2("derived.tactic.attraction_observed"), horizon: 3 },
  { family: "attraction", projection: v2("derived.tactic.attraction_observed"), horizon: 5 },
  { family: "line_clearance", projection: v2("derived.tactic.line_blocker_clearance_observed"), horizon: 3 },
  { family: "square_clearance", projection: v2("derived.tactic.square_clearance_observed"), horizon: 3 },
  { family: "interference", projection: v2("derived.tactic.interference_observed"), horizon: 3 },
  { family: "check_zwischenzug", projection: v2("derived.tactic.check_zwischenzug_observed"), horizon: 4 },
  { family: "overload_exploitation", projection: v2("derived.tactic.overload_exploitation_observed"), horizon: 3 },
].map((row) => Object.freeze(row as RecordedPathEvaluatorRow)));

/**
 * Drift diagnostic: the table must be set-equal to the exact v2 population of both the exact ref
 * authority and the compiled manifest, with thirteen unique rows. Thrown at module load for the
 * real table; exported so fixtures can prove an added or removed row fails.
 */
export function assertRecordedPathTableClosure(rows: readonly RecordedPathEvaluatorRow[], refs: readonly VersionedEvidenceId[], manifest: CompiledEvidenceManifest): void {
  const tableKeys = [...new Set(rows.map((row) => refKey(row.projection)))].sort();
  const recorded = new Set(RECORDED_PATH_SUCCESSOR_REFS.map(refKey));
  const refKeys = refs.filter(value => recorded.has(refKey(value))).map(refKey).sort();
  const manifestKeys = manifest.semanticEvents.map(event => event.projection).filter(value => recorded.has(refKey(value))).map(refKey).sort();
  const rowKeys = rows.map((row) => `${refKey(row.projection)}#${row.horizon}`);
  if (tableKeys.join("|") !== refKeys.join("|") || tableKeys.join("|") !== manifestKeys.join("|")) {
    throw new TypeError(`Recorded-path evaluator table is not set-equal to the exact v2 semantic population (${tableKeys.length} vs ${refKeys.length}/${manifestKeys.length})`);
  }
  if (tableKeys.length !== 11 || rows.length !== 13 || new Set(rowKeys).size !== rowKeys.length) {
    throw new TypeError(`Recorded-path evaluator table must hold eleven projections in thirteen unique rows, found ${tableKeys.length}/${rows.length}`);
  }
}

assertRecordedPathTableClosure(EVALUATOR_ROWS, SEMANTIC_EVENT_PROJECTION_REFS, PRIMARY_EVIDENCE_MANIFEST);

/** Read-only copy of the private table for drift diagnostics; it is not an admission vocabulary. */
export function recordedPathEvaluatorRows(): readonly RecordedPathEvaluatorRow[] {
  return Object.freeze(EVALUATOR_ROWS.map((row) => Object.freeze({ ...row })));
}

/** One event's sealed convention receipt; every v2 event is minted by the sole factory mint. */
function eventConventionReceipt(event: SemanticEvidenceEvent): ConventionReceipt {
  const receipt = evidenceConventionReceipt(event.evidence);
  if (receipt === undefined) throw new TypeError(`Recorded-path event ${event.id} carries no sealed convention receipt`);
  return receipt;
}

/** The result's closure over the exact emitted events, in emission order. */
export function recordedPathConventionReceipt(events: readonly SemanticEvidenceEvent[]): RecordedPathConventionReceipt {
  const receipts = events.map(eventConventionReceipt);
  const refs = new Map<string, ConventionRef>();
  for (const receipt of receipts) for (const ref of receipt.refs) refs.set(conventionRefKey(ref), ref);
  const eventReceiptDigests = Object.freeze(receipts.map((receipt) => receipt.digest));
  const body = { status: "registered" as const, registryDigest: CONVENTION_REGISTRY.digest, refs: [...refs.values()].sort(compareConventionRefs), eventReceiptDigests };
  return Object.freeze({ ...body, refs: Object.freeze(body.refs), digest: `sha256:${evidenceDigest(body)}` });
}

export interface RecordedPathIdentityMaterial {
  readonly operation: "recorded-semantic-path@1";
  readonly manifestDigest: string;
  readonly semanticConventionRegistryDigest: string;
  readonly sourceClosureDigest: string;
  readonly runId: string;
  readonly branchId: string;
  readonly branchOrigin: "played" | "simulated";
  readonly pathNodeIds: readonly string[];
  readonly eventIds: readonly string[];
  readonly windows: readonly RecordedPathWindowReceipt[];
}

/** §5 result identity: the evidence contract's canonical digest over the exact closure. */
export function recordedSemanticPathIdentity(material: RecordedPathIdentityMaterial): string {
  return evidenceDigest(material);
}

interface PreparedEdge {
  readonly beforePly: number;
  readonly afterPly: number;
  readonly anchor: RecordedMoveAnchor;
  readonly edge: DeclaredEvidence<RecordedEdge>;
  readonly capture?: SemanticEvidenceEvent<TransitionSemanticEventOperands>;
  readonly check?: SemanticEvidenceEvent<CheckEvent>;
}

interface WorkCounters {
  transitionCompiles: number;
  checkProbes: number;
  localFanOut: number;
  defenderDutyReads: number;
}

const key = (event: SemanticEvidenceEvent): string => refKey(event.projection);

function assertDrillRun(run: unknown, branchId: unknown): asserts run is DrillRun {
  const value = run as Partial<DrillRun> | null;
  if (typeof run !== "object" || run === null || Array.isArray(run) || typeof value!.id !== "string" || !Array.isArray(value!.nodes) || !Array.isArray(value!.branches) || !Array.isArray(value!.events)) {
    throw new TypeError("recordedSemanticPath accepts only a recorded DrillRun; PV, PGN and caller-built anchor arrays are not recorded paths");
  }
  if (typeof branchId !== "string") throw new TypeError("recordedSemanticPath requires a branch id");
}

function prepare(path: readonly Node[], edges: readonly DeclaredEvidence<RecordedEdge>[], mode: "exact" | "eager", work: WorkCounters): readonly PreparedEdge[] {
  return Object.freeze(edges.map((edge, index) => prepareEdge(path[index]!, path[index + 1]!, edge, mode, work)));
}

function prepareEdge(before: Node, after: Node, edge: DeclaredEvidence<RecordedEdge>, mode: "exact" | "eager", work: WorkCounters): PreparedEdge {
  const payload = edge.payload;
  const anchor: RecordedMoveAnchor = Object.freeze({ beforeNodeId: payload.beforeNodeId, afterNodeId: payload.afterNodeId, beforeFen: payload.beforeFen, moveUci: payload.moveUci, afterFen: payload.afterFen });
  let capture: SemanticEvidenceEvent<TransitionSemanticEventOperands> | undefined;
  let check: SemanticEvidenceEvent<CheckEvent> | undefined;
  if (mode === "exact") {
    work.transitionCompiles += 1;
    capture = transitionSemanticEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen).find((event) => key(event) === "rules.transition.event.capture@1");
    work.checkProbes += 1;
    check = checkSemanticEvent(anchor.beforeFen, anchor.moveUci, anchor.afterFen);
  } else {
    work.localFanOut += 1;
    const values = localSemanticEvents(anchor.beforeFen, anchor.moveUci, anchor.afterFen);
    capture = values.find((event) => key(event) === "rules.transition.event.capture@1") as SemanticEvidenceEvent<TransitionSemanticEventOperands> | undefined;
    check = values.find((event) => key(event) === "rules.tactic.event.check@1") as SemanticEvidenceEvent<CheckEvent> | undefined;
  }
  return Object.freeze({ beforePly: before.ply, afterPly: after.ply, anchor, edge, ...(capture === undefined ? {} : { capture }), ...(check === undefined ? {} : { check }) });
}

function evaluate(row: RecordedPathEvaluatorRow, window: readonly PreparedEdge[], duty: () => DeclaredEvidence<unknown>): readonly SemanticEvidenceEvent[] {
  const anchors = window.map((edge) => edge.anchor);
  const edges = window.map((edge) => edge.edge);
  const captures = window.flatMap((edge) => edge.capture === undefined ? [] : [edge.capture]);
  const captureEvidence = captures.map((capture) => capture.evidence);
  const emitted: SemanticEvidenceEvent[] = [];
  switch (row.family) {
    case "trade_completed": {
      const [first, second] = window;
      const value = first!.capture !== undefined && second!.capture !== undefined
        ? recordedTradeCompletedSemanticEvent(first!.capture, second!.capture, first!.edge, second!.edge)
        : undefined;
      if (value !== undefined) emitted.push(value);
      break;
    }
    case "contact_timing": {
      const value = pawnContactTimingSequence(anchors);
      if (value !== undefined) emitted.push(recordedPawnContactTimingSemanticEvent(value, edges));
      break;
    }
    case "harassment_pressure": {
      const value = harassmentPressureSequence(anchors);
      if (value !== undefined) emitted.push(recordedHarassmentPressureSemanticEvent(value, edges));
      break;
    }
    case "defender_consequence":
      for (const value of recordedDefenderConsequenceOperands(anchors)) emitted.push(recordedDefenderConsequenceSemanticEvent(value, edges));
      break;
    case "deflection": {
      const operands = recordedDeflectionObservedOperands(anchors);
      if (operands.length === 0) break;
      const check = deflectionObservedInduction(anchors) === "check_induced" ? window[0]!.check : undefined;
      for (const value of operands) emitted.push(recordedDeflectionObservedSemanticEvent(value, edges, duty(), captureEvidence, exchangeEvidence(value.targetCapture), check));
      break;
    }
    case "attraction":
      for (const value of recordedAttractionObservedOperands(anchors)) {
        const check = value.checkOrCaptureConsequence.kind === "check" ? window[2]!.check?.evidence : undefined;
        emitted.push(recordedAttractionObservedSemanticEvent(value, edges, captureEvidence, check));
      }
      break;
    case "line_clearance":
      for (const value of recordedLineBlockerClearanceObservedOperands(anchors)) emitted.push(recordedLineBlockerClearanceSemanticEvent(value, edges, exchangeEvidence(value.targetCapture)));
      break;
    case "square_clearance":
      for (const value of recordedSquareClearanceObservedOperands(anchors)) emitted.push(recordedSquareClearanceSemanticEvent(value, edges));
      break;
    case "interference":
      for (const value of interferenceObservedOperands(anchors)) emitted.push(recordedInterferenceSemanticEvent(value, edges, duty(), exchangeEvidence(value.targetCapture)));
      break;
    case "check_zwischenzug":
      for (const value of recordedCheckZwischenzugObservedOperands(anchors)) {
        const capture = window[0]!.capture, check = window[1]!.check;
        if (capture === undefined || check === undefined) throw new TypeError("Checking zwischenzug lost its exact capture/check source");
        emitted.push(recordedCheckZwischenzugSemanticEvent(value, edges, capture.evidence, check.evidence, exchangeEvidence(value.retainedRecapture)));
      }
      break;
    case "overload_exploitation":
      for (const value of overloadExploitationObservedOperands(anchors)) emitted.push(recordedOverloadExploitationSemanticEvent(value, edges, duty(), captureEvidence, exchangeEvidence(value.secondTargetCapture)));
      break;
  }
  for (const event of emitted) if (refKey(event.projection) !== refKey(row.projection)) throw new TypeError(`Evaluator row ${refKey(row.projection)} emitted ${refKey(event.projection)}`);
  return emitted;
}

const now = (): number => globalThis.performance?.now() ?? Date.now();

interface PathCandidate { readonly event: SemanticEvidenceEvent; readonly startPly: number; readonly endPly: number }
interface PathWindowOutput { readonly receipt: RecordedPathWindowReceipt; readonly candidates: readonly PathCandidate[] }
function insufficientWindow(row: RecordedPathEvaluatorRow, startNodeId: string): PathWindowOutput {
  return Object.freeze({ receipt: Object.freeze({ projection: row.projection, startNodeId, endNodeId: null,
    horizon: row.horizon, status: "insufficient_continuation", eventIds: Object.freeze([]) }), candidates: Object.freeze([]) });
}
function collectWindow(row: RecordedPathEvaluatorRow, start: number, prepared: readonly PreparedEdge[], work: WorkCounters,
  dutyByFen: Map<string, DeclaredEvidence<unknown>>, startFens: Set<string>): PathWindowOutput {
  const first = prepared[start]!;
  const window = prepared.slice(start, start + row.horizon), last = window.at(-1)!;
  startFens.add(first.anchor.beforeFen);
  const duty = (): DeclaredEvidence<unknown> => {
    const cached = dutyByFen.get(first.anchor.beforeFen);
    if (cached !== undefined) return cached;
    work.defenderDutyReads += 1;
    const value = invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen: first.anchor.beforeFen });
    dutyByFen.set(first.anchor.beforeFen, value);
    return value;
  };
  const emitted = evaluate(row, window, duty);
  return Object.freeze({ receipt: Object.freeze({ projection: row.projection, startNodeId: first.anchor.beforeNodeId,
    endNodeId: last.anchor.afterNodeId, horizon: row.horizon, status: emitted.length === 0 ? "no_witness" : "emitted",
    eventIds: Object.freeze([...new Set(emitted.map(event => event.id))].sort()) }),
    candidates: Object.freeze(emitted.map(event => Object.freeze({ event, startPly: first.beforePly, endPly: last.afterPly }))) });
}
function orderedCandidates(outputs: readonly PathWindowOutput[]): readonly PathCandidate[] {
  const found = new Map<string, PathCandidate>();
  for (const output of outputs) for (const candidate of output.candidates) if (!found.has(candidate.event.id)) found.set(candidate.event.id, candidate);
  return [...found.values()].sort((left, right) => left.endPly - right.endPly || left.startPly - right.startPly
    || refKey(left.event.projection).localeCompare(refKey(right.event.projection)) || left.event.id.localeCompare(right.event.id));
}

function completeRecordedPathResult(run: DrillRun, branchId: string, branchOrigin: "played" | "simulated",
  path: readonly Node[], prepared: readonly PreparedEdge[], outputs: readonly PathWindowOutput[]): Extract<RecordedSemanticPathResult, { kind: "available" }> {
  const ordered = orderedCandidates(outputs), windows = outputs.map(output => output.receipt);
  const events = Object.freeze(ordered.map((entry) => entry.event));
  const eventIds = Object.freeze(events.map((event) => event.id));
  const eventReceipts = events.map((event) => ({
    id: event.id,
    projection: refKey(event.projection),
    conventionId: typeof (event.operands as { readonly conventionId?: unknown }).conventionId === "string" ? (event.operands as { readonly conventionId: string }).conventionId : null,
    inputs: event.derivationInputs.map((input) => ({ projection: refKey(input.projection), payload: evidenceDigest(input.payload) })),
    convention: eventConventionReceipt(event).digest,
  }));
  const conventionReceipt = recordedPathConventionReceipt(events);
  const sourceClosureDigest = evidenceDigest({ edges: prepared.map((edge) => edge.edge.payload), events: eventReceipts });
  const frozenWindows = Object.freeze(windows);
  const pathNodeIds = Object.freeze(path.map((node) => node.id));
  const digest = recordedSemanticPathIdentity({
    operation: "recorded-semantic-path@1",
    manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
    semanticConventionRegistryDigest: conventionReceipt.registryDigest,
    sourceClosureDigest,
    runId: run.id,
    branchId,
    branchOrigin,
    pathNodeIds,
    eventIds,
    windows: frozenWindows,
  });
  return Object.freeze({ kind: "available", branchId, branchOrigin, pathNodeIds, events,
    windows: frozenWindows, conventionReceipt, digest });
}

/** Instrumented form of the operation. `preparation: "eager"` is the byte-parity oracle only. */
export function recordedSemanticPathExecution(run: DrillRun, branchId: string, options: { readonly preparation?: "exact" | "eager" } = {}): RecordedSemanticPathExecution {
  assertDrillRun(run, branchId);
  const started = now();
  const work: WorkCounters = { transitionCompiles: 0, checkProbes: 0, localFanOut: 0, defenderDutyReads: 0 };
  const finish = (result: RecordedSemanticPathResult, validationMs: number, preparationMs: number, windowsMs: number, preparedEdges: number, distinctWindowStartFens: number, receipts: number): RecordedSemanticPathExecution => Object.freeze({
    result,
    work: Object.freeze({ preparedEdges, ...work, distinctWindowStartFens, receipts }),
    timings: Object.freeze({ validationMs, preparationMs, windowsMs, totalMs: now() - started }),
  });

  const resolution = resolveBranchPath(run, branchId);
  if (resolution.kind === "refused") {
    return finish(Object.freeze({ kind: "refused", branchId, reason: resolution.reason, ...(resolution.atNodeId === undefined ? {} : { atNodeId: resolution.atNodeId }), detail: resolution.detail }), now() - started, 0, 0, 0, 0, 0);
  }
  const path = resolution.nodes;
  const edges: DeclaredEvidence<RecordedEdge>[] = [];
  for (let index = 1; index < path.length; index += 1) {
    try {
      edges.push(invokeEvidenceValueRoute("run.record.edge@1", { run, parent: path[index - 1]!, child: path[index]! }));
    } catch (error) {
      if (!(error instanceof RecordedEdgeError)) throw error;
      return finish(Object.freeze({ kind: "refused", branchId, reason: error.reason, atNodeId: error.atNodeId, detail: error.message }), now() - started, 0, 0, 0, 0, 0);
    }
  }
  const validationMs = now() - started;

  const preparationStarted = now();
  const prepared = prepare(path, edges, options.preparation ?? "exact", work);
  const preparationMs = now() - preparationStarted;

  const windowsStarted = now();
  const dutyByFen = new Map<string, DeclaredEvidence<unknown>>();
  const startFens = new Set<string>();
  const outputs: PathWindowOutput[] = [];
  for (let start = 0; start < prepared.length; start += 1) for (const row of EVALUATOR_ROWS) {
    outputs.push(start + row.horizon > prepared.length ? insufficientWindow(row, path[start]!.id)
      : collectWindow(row, start, prepared, work, dutyByFen, startFens));
  }
  const result = completeRecordedPathResult(run, branchId, resolution.branch.origin, path, prepared, outputs);
  const windowsMs = now() - windowsStarted;
  return finish(result, validationMs, preparationMs, windowsMs, prepared.length, startFens.size, outputs.length);
}

declare const recordedSemanticPathCollectionBrand: unique symbol;
/** Internal work, never a partial path result, recorded-boundary token or access grant. */
export interface RecordedSemanticPathCollection { readonly [recordedSemanticPathCollectionBrand]: true }
interface PathWindowSlot { readonly index: number; readonly start: number; readonly row: RecordedPathEvaluatorRow }
interface AvailablePathWork {
  readonly kind: "available";
  readonly run: DrillRun;
  readonly branchId: string;
  readonly branchOrigin: "played" | "simulated";
  readonly path: readonly Node[];
  readonly mode: "exact" | "eager";
  readonly slots: readonly PathWindowSlot[];
  readonly byEndpoint: ReadonlyMap<number, readonly PathWindowSlot[]>;
  readonly outputs: Map<number, PathWindowOutput>;
  readonly prepared: PreparedEdge[];
  readonly dutyByFen: Map<string, DeclaredEvidence<unknown>>;
  readonly startFens: Set<string>;
  readonly subjects: Map<string, Readonly<{ nodeId: string; events: readonly SemanticEvidenceEvent[] }>>;
  completed: number;
}
interface PathCollectionWork {
  readonly source: AvailablePathWork | Readonly<{ kind: "refused"; result: Extract<RecordedSemanticPathResult, { kind: "refused" }> }>;
  readonly started: number;
  readonly validationMs: number;
  readonly counters: WorkCounters;
  preparationMs: number;
  windowsMs: number;
  busy: boolean;
}
const PATH_COLLECTIONS = new WeakMap<object, PathCollectionWork>();
function freezePathRun<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezePathRun(child);
    Object.freeze(value);
  }
  return value;
}
function pathCollection(handle: RecordedSemanticPathCollection): PathCollectionWork {
  const work = handle !== null && typeof handle === "object" ? PATH_COLLECTIONS.get(handle) : undefined;
  if (work === undefined) throw new TypeError("Recorded semantic path collection is foreign or retired");
  if (work.busy) throw new TypeError("Recorded semantic path collection is already advancing or finishing");
  return work;
}
function assertPathCollectionActive(handle: RecordedSemanticPathCollection, work: PathCollectionWork): void {
  if (PATH_COLLECTIONS.get(handle) !== work) throw new TypeError("Recorded semantic path collection retired during acquisition");
}

/** Work metadata only. Only finish can issue the actual complete path or refusal. */
export function readRecordedSemanticPathCollectionState(handle: RecordedSemanticPathCollection): Readonly<{
  state: "refused" | "collecting" | "complete"; completedSubjects: number; totalSubjects: number;
}> {
  const { source } = pathCollection(handle);
  return source.kind === "refused" ? Object.freeze({ state: "refused", completedSubjects: 0, totalSubjects: 0 })
    : Object.freeze({ state: source.completed === source.path.length ? "complete" : "collecting",
      completedSubjects: source.completed, totalSubjects: source.path.length });
}

/** Capture the complete original graph and legal edge metadata before any detector or F1 mint.
 * Outer packet/phase owners retain their own live storage, permission and job checks. */
export function beginRecordedSemanticPathCollection(input: DrillRun, branchId: string,
  options: { readonly preparation?: "exact" | "eager" } = {}): RecordedSemanticPathCollection {
  assertDrillRun(input, branchId);
  const started = now(), run = freezePathRun(structuredClone(input)), resolution = resolveBranchPath(run, branchId);
  let source: PathCollectionWork["source"];
  if (resolution.kind === "refused") {
    source = { kind: "refused", result: Object.freeze({ kind: "refused", branchId, reason: resolution.reason,
      ...(resolution.atNodeId === undefined ? {} : { atNodeId: resolution.atNodeId }), detail: resolution.detail }) };
  } else {
    let refusal: Extract<RecordedSemanticPathResult, { kind: "refused" }> | undefined;
    const path = Object.freeze([...resolution.nodes]);
    for (let index = 1; index < path.length; index++) {
      try { recordedEdgePayload(run, path[index - 1]!, path[index]!); }
      catch (error) {
        if (!(error instanceof RecordedEdgeError)) throw error;
        refusal = Object.freeze({ kind: "refused", branchId, reason: error.reason, atNodeId: error.atNodeId, detail: error.message });
        break;
      }
    }
    if (refusal !== undefined) source = { kind: "refused", result: refusal };
    else {
      const slots: PathWindowSlot[] = [], byEndpoint = new Map<number, PathWindowSlot[]>(), outputs = new Map<number, PathWindowOutput>();
      const edgeCount = path.length - 1;
      for (let start = 0; start < edgeCount; start++) for (const row of EVALUATOR_ROWS) {
        const slot = Object.freeze({ index: slots.length, start, row }); slots.push(slot);
        const endpoint = start + row.horizon;
        if (endpoint > edgeCount) outputs.set(slot.index, insufficientWindow(row, path[start]!.id));
        else { const ready = byEndpoint.get(endpoint) ?? []; ready.push(slot); byEndpoint.set(endpoint, ready); }
      }
      source = { kind: "available", run, branchId, branchOrigin: resolution.branch.origin, path,
        mode: options.preparation ?? "exact", slots: Object.freeze(slots), byEndpoint, outputs,
        prepared: [], dutyByFen: new Map(), startFens: new Set(), subjects: new Map(), completed: 0 };
    }
  }
  const handle = Object.freeze({}) as RecordedSemanticPathCollection;
  PATH_COLLECTIONS.set(handle, { source, started, validationMs: now() - started,
    counters: { transitionCompiles: 0, checkProbes: 0, localFanOut: 0, defenderDutyReads: 0 }, preparationMs: 0, windowsMs: 0, busy: false });
  return handle;
}

/** Acquire only this original endpoint's incoming edge and the windows now complete there. */
export function advanceRecordedSemanticPathCollection(handle: RecordedSemanticPathCollection): Readonly<{
  nodeId: string; completedSubjects: number; totalSubjects: number; complete: boolean;
}> {
  const work = pathCollection(handle), source = work.source;
  if (source.kind === "refused" || source.completed === source.path.length) throw new TypeError("Recorded semantic path collection has no remaining subject");
  work.busy = true;
  try {
    const index = source.completed, node = source.path[index]!;
    if (index > 0) {
      const started = now(), parent = source.path[index - 1]!;
      assertPathCollectionActive(handle, work);
      const edge = invokeEvidenceValueRoute("run.record.edge@1", { run: source.run, parent, child: node });
      assertPathCollectionActive(handle, work);
      const prepared = prepareEdge(parent, node, edge, source.mode, work.counters);
      assertPathCollectionActive(handle, work);
      source.prepared.push(prepared); work.preparationMs += now() - started;
    }
    const started = now(), ready = source.byEndpoint.get(index) ?? [];
    for (const slot of ready) {
      assertPathCollectionActive(handle, work);
      const output = collectWindow(slot.row, slot.start, source.prepared, work.counters, source.dutyByFen, source.startFens);
      assertPathCollectionActive(handle, work);
      source.outputs.set(slot.index, output);
    }
    const events = Object.freeze(orderedCandidates(ready.map(slot => source.outputs.get(slot.index)!)).map(candidate => candidate.event));
    if (events.some(event => event.anchor.nodeId !== node.id || event.anchor.runId !== source.run.id)) {
      throw new TypeError("Recorded semantic endpoint events cross their original node or run");
    }
    assertPathCollectionActive(handle, work);
    source.subjects.set(node.id, Object.freeze({ nodeId: node.id, events }));
    source.completed++; work.windowsMs += now() - started;
    assertPathCollectionActive(handle, work);
    return Object.freeze({ nodeId: node.id, completedSubjects: source.completed, totalSubjects: source.path.length,
      complete: source.completed === source.path.length });
  } catch (error) { PATH_COLLECTIONS.delete(handle); throw error; }
  finally { work.busy = false; }
}

/** Completed endpoint originals only; this is deliberately not a partial RecordedSemanticPathResult. */
export function readRecordedSemanticPathSubject(handle: RecordedSemanticPathCollection, nodeId: string): Readonly<{
  nodeId: string; events: readonly SemanticEvidenceEvent[];
}> {
  const work = pathCollection(handle);
  const subject = work.source.kind === "available" ? work.source.subjects.get(nodeId) : undefined;
  if (subject === undefined) throw new TypeError("Recorded semantic endpoint has not been acquired");
  return subject;
}

/** Canonical reduction of retained originals, with no preparation, evaluation or minting. */
export function finishRecordedSemanticPathCollection(handle: RecordedSemanticPathCollection): RecordedSemanticPathExecution {
  const work = pathCollection(handle), source = work.source;
  if (source.kind === "available" && source.completed !== source.path.length) throw new TypeError("Recorded semantic path collection is incomplete");
  work.busy = true;
  try {
    assertPathCollectionActive(handle, work);
    const started = now();
    const result = source.kind === "refused" ? source.result : completeRecordedPathResult(source.run, source.branchId, source.branchOrigin,
      source.path, source.prepared, source.slots.map(slot => {
        const output = source.outputs.get(slot.index);
        if (output === undefined) throw new TypeError("Recorded semantic path collection lost an original window");
        return output;
      }));
    work.windowsMs += now() - started;
    assertPathCollectionActive(handle, work);
    const execution = Object.freeze({ result, work: Object.freeze({ preparedEdges: source.kind === "refused" ? 0 : source.prepared.length,
      ...work.counters, distinctWindowStartFens: source.kind === "refused" ? 0 : source.startFens.size,
      receipts: source.kind === "refused" ? 0 : source.slots.length }),
      timings: Object.freeze({ validationMs: work.validationMs, preparationMs: work.preparationMs,
        windowsMs: work.windowsMs, totalMs: now() - work.started }) });
    assertPathCollectionActive(handle, work);
    return execution;
  } finally { PATH_COLLECTIONS.delete(handle); work.busy = false; }
}
export function cancelRecordedSemanticPathCollection(handle: RecordedSemanticPathCollection): boolean {
  return handle !== null && typeof handle === "object" && PATH_COLLECTIONS.delete(handle);
}

/**
 * The public recorded-run operation. It accepts only a run and a branch id, resolves the path
 * through the total `branchPath` authority, validates every edge by legal replay before any
 * detector runs, and returns v2 sealed events plus one receipt per (edge start, evaluator row).
 */
export function recordedSemanticPath(run: DrillRun, branchId: string): RecordedSemanticPathResult {
  return recordedSemanticPathExecution(run, branchId).result;
}
