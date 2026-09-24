// rfc/recorded-semantic-path: one pure compiler from one authoritative recorded branch path to the
// eleven v2 multi-edge semantic projections, with a complete typed window receipt. It observes
// relations only: it never selects, ranks, grades, explains or renders the events it returns.

import { resolveBranchPath } from "./branch-path.js";
import { BREADTH_CONVENTION_TEXT, PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_CONVENTION_TEXT, SEMANTIC_EVENT_PROJECTION_REFS } from "./evidence-catalog.js";
import { evidenceDigest, type CompiledEvidenceManifest, type DeclaredEvidence, type VersionedEvidenceId } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { RecordedEdgeError, type RecordedEdge } from "./recorded-edge.js";
import type { LegalExchangeResult } from "./exchange.js";

/** The exact legal-exchange evidence of one capture, recomputed by its factory from FEN + UCI. */
function exchangeEvidence(result: LegalExchangeResult): DeclaredEvidence<unknown> {
  const computed = invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", { fen: result.beforeFen, captureUci: result.captureUci })[0];
  if (computed === undefined || evidenceDigest(computed.payload) !== evidenceDigest(result)) throw new TypeError("Recorded path exchange operand is not reproduced by the exchange authority");
  return computed;
}
import { harassmentPressureSequence, pawnContactTimingSequence, type RecordedMoveAnchor } from "./pawn-dynamics.js";
import {
  attractionObservedOperands,
  checkSemanticEvent,
  checkZwischenzugObservedOperands,
  defenderConsequenceOperands,
  deflectionObservedInduction,
  deflectionObservedOperands,
  interferenceObservedOperands,
  lineBlockerClearanceObservedOperands,
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
  squareClearanceObservedOperands,
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
 * The [[D1921]]/[[D1929]] semantic-convention value/provenance predecessor has not landed. Until it
 * does, the result explicitly abstains from a registry authority and digests the in-catalogue
 * convention text instead; it never claims a registry head it cannot name.
 */
export type RecordedPathConventionReceipt = Readonly<{
  status: "predecessor_unlanded";
  predecessor: "rfc/semantic-convention-provenance.md";
  registryDigest: string;
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
  const refKeys = refs.filter((value) => value.version === 2).map(refKey).sort();
  const manifestKeys = manifest.semanticEvents.map((event) => event.projection).filter((value) => value.version === 2).map(refKey).sort();
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

const CONVENTION_REGISTRY_MATERIAL = Object.freeze({
  status: "predecessor_unlanded",
  predecessor: "rfc/semantic-convention-provenance.md",
  inCatalogueConventionText: { semantic: SEMANTIC_CONVENTION_TEXT, breadth: BREADTH_CONVENTION_TEXT },
});
const CONVENTION_RECEIPT: RecordedPathConventionReceipt = Object.freeze({
  status: "predecessor_unlanded",
  predecessor: "rfc/semantic-convention-provenance.md",
  registryDigest: evidenceDigest(CONVENTION_REGISTRY_MATERIAL),
});

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
  return Object.freeze(edges.map((edge, index) => {
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
    return Object.freeze({ beforePly: path[index]!.ply, afterPly: path[index + 1]!.ply, anchor, edge, ...(capture === undefined ? {} : { capture }), ...(check === undefined ? {} : { check }) });
  }));
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
      for (const value of defenderConsequenceOperands(anchors)) emitted.push(recordedDefenderConsequenceSemanticEvent(value, edges));
      break;
    case "deflection": {
      const operands = deflectionObservedOperands(anchors);
      if (operands.length === 0) break;
      const check = deflectionObservedInduction(anchors) === "check_induced" ? window[0]!.check : undefined;
      for (const value of operands) emitted.push(recordedDeflectionObservedSemanticEvent(value, edges, duty(), captureEvidence, exchangeEvidence(value.targetCapture), check));
      break;
    }
    case "attraction":
      for (const value of attractionObservedOperands(anchors)) {
        const check = value.checkOrCaptureConsequence.kind === "check" ? window[2]!.check?.evidence : undefined;
        emitted.push(recordedAttractionObservedSemanticEvent(value, edges, captureEvidence, check));
      }
      break;
    case "line_clearance":
      for (const value of lineBlockerClearanceObservedOperands(anchors)) emitted.push(recordedLineBlockerClearanceSemanticEvent(value, edges, exchangeEvidence(value.targetCapture)));
      break;
    case "square_clearance":
      for (const value of squareClearanceObservedOperands(anchors)) emitted.push(recordedSquareClearanceSemanticEvent(value, edges));
      break;
    case "interference":
      for (const value of interferenceObservedOperands(anchors)) emitted.push(recordedInterferenceSemanticEvent(value, edges, duty(), exchangeEvidence(value.targetCapture)));
      break;
    case "check_zwischenzug":
      for (const value of checkZwischenzugObservedOperands(anchors)) {
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
  const found = new Map<string, { readonly event: SemanticEvidenceEvent; readonly startPly: number; readonly endPly: number }>();
  const windows: RecordedPathWindowReceipt[] = [];
  for (let start = 0; start < prepared.length; start += 1) {
    for (const row of EVALUATOR_ROWS) {
      const first = prepared[start]!;
      if (start + row.horizon > prepared.length) {
        windows.push(Object.freeze({ projection: row.projection, startNodeId: first.anchor.beforeNodeId, endNodeId: null, horizon: row.horizon, status: "insufficient_continuation", eventIds: Object.freeze([]) }));
        continue;
      }
      const window = prepared.slice(start, start + row.horizon);
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
      const last = window.at(-1)!;
      for (const event of emitted) if (!found.has(event.id)) found.set(event.id, { event, startPly: first.beforePly, endPly: last.afterPly });
      windows.push(Object.freeze({
        projection: row.projection,
        startNodeId: first.anchor.beforeNodeId,
        endNodeId: last.anchor.afterNodeId,
        horizon: row.horizon,
        status: emitted.length === 0 ? "no_witness" : "emitted",
        eventIds: Object.freeze([...new Set(emitted.map((event) => event.id))].sort()),
      }));
    }
  }
  const ordered = [...found.values()].sort((left, right) =>
    left.endPly - right.endPly || left.startPly - right.startPly || refKey(left.event.projection).localeCompare(refKey(right.event.projection)) || left.event.id.localeCompare(right.event.id));
  const events = Object.freeze(ordered.map((entry) => entry.event));
  const eventIds = Object.freeze(events.map((event) => event.id));
  const eventReceipts = events.map((event) => ({
    id: event.id,
    projection: refKey(event.projection),
    conventionId: typeof (event.operands as { readonly conventionId?: unknown }).conventionId === "string" ? (event.operands as { readonly conventionId: string }).conventionId : null,
    inputs: event.derivationInputs.map((input) => ({ projection: refKey(input.projection), payload: evidenceDigest(input.payload) })),
  }));
  const sourceClosureDigest = evidenceDigest({ edges: prepared.map((edge) => edge.edge.payload), events: eventReceipts });
  const frozenWindows = Object.freeze(windows);
  const pathNodeIds = Object.freeze(path.map((node) => node.id));
  const digest = recordedSemanticPathIdentity({
    operation: "recorded-semantic-path@1",
    manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest,
    semanticConventionRegistryDigest: CONVENTION_RECEIPT.registryDigest,
    sourceClosureDigest,
    runId: run.id,
    branchId,
    branchOrigin: resolution.branch.origin,
    pathNodeIds,
    eventIds,
    windows: frozenWindows,
  });
  const windowsMs = now() - windowsStarted;
  return finish(Object.freeze({
    kind: "available",
    branchId,
    branchOrigin: resolution.branch.origin,
    pathNodeIds,
    events,
    windows: frozenWindows,
    conventionReceipt: CONVENTION_RECEIPT,
    digest,
  }), validationMs, preparationMs, windowsMs, prepared.length, startFens.size, frozenWindows.length);
}

/**
 * The public recorded-run operation. It accepts only a run and a branch id, resolves the path
 * through the total `branchPath` authority, validates every edge by legal replay before any
 * detector runs, and returns v2 sealed events plus one receipt per (edge start, evaluator row).
 */
export function recordedSemanticPath(run: DrillRun, branchId: string): RecordedSemanticPathResult {
  return recordedSemanticPathExecution(run, branchId).result;
}
