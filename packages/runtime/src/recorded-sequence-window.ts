// Accepted F2 §2.3j: private recorded-window authority, not server access or a wire token.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { resolveBranchPath } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { projectRun } from "./events.js";
import { invokeEvidenceValueRoute, EvidenceValueRouteLookupError, type EvidenceValueRoute, type EvidenceValueRouteInputs, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { materialCauseFamilies } from "./internal/material-sources.js";
import { moduleDecisionStamp } from "./module-decision.js";
import { harassmentPressureSequence, pawnContactTimingSequence, type RecordedMoveAnchor } from "./pawn-dynamics.js";
import { RecordedEdgeError, recordedEdgePayload, type RecordedEdge } from "./recorded-edge.js";
import type { RecordedPathRefusalReason } from "./recorded-semantic-path.js";
import { digestRunEventHead } from "./run-subject-digest.js";
import {
  recordedDefenderConsequenceOperands, recordedSquareClearanceObservedOperands,
  recordedLineBlockerClearanceObservedOperands, interferenceObservedOperands,
  recordedCheckZwischenzugObservedOperands, overloadExploitationObservedOperands,
  recordedDeflectionObservedOperands, recordedAttractionObservedOperands, deflectionObservedInduction,
} from "./semantic-evidence.js";
import type { DrillRun } from "./types.js";

/** Exact accepted scoped image, never latest-version or base-id dispatch. Trade retains its owner. */
const horizons = {
  "derived.pawn.sequence.contact_timing@3": [2, 3],
  "derived.pawn.sequence.harassment_pressure@3": [2],
  "derived.tactic.sequence.defender_consequence@3": [3],
  "derived.tactic.square_clearance_observed@3": [3],
  "derived.tactic.line_blocker_clearance_observed@3": [3],
  "derived.tactic.interference_observed@3": [3],
  "derived.tactic.check_zwischenzug_observed@3": [4],
  "derived.tactic.overload_exploitation_observed@3": [3],
  "derived.tactic.deflection_observed@3": [3],
  "derived.tactic.attraction_observed@3": [3, 5],
} as const;
for (const values of Object.values(horizons)) Object.freeze(values);
export const RECORDED_SEQUENCE_HORIZONS = Object.freeze(horizons);
export type RecordedSequenceRoute = keyof typeof RECORDED_SEQUENCE_HORIZONS;
export type RecordedWindowRoute = RecordedSequenceRoute | "derived.exchange.trade_completed@2";
export class RecordedSequenceScopeError extends TypeError {
  constructor(readonly reason: RecordedPathRefusalReason | "endpoint_not_on_branch" | "projection_unsupported", message: string) { super(message); this.name = "RecordedSequenceScopeError"; }
}
declare const recordedSequenceWindowBrand: unique symbol;
export interface RecordedSequenceWindow { readonly [recordedSequenceWindowBrand]: true }
type Value = DeclaredEvidence<unknown>;
interface WindowData {
  readonly run: DrillRun;
  readonly authority: Readonly<{ operation: "recorded-sequence-window@1"; runId: string; eventHeadDigest: string;
    decision: ReturnType<typeof moduleDecisionStamp>; branchId: string; throughNodeId: string;
    route: RecordedWindowRoute; horizon: number }>;
  readonly edges: readonly DeclaredEvidence<RecordedEdge>[];
  readonly anchors: readonly RecordedMoveAnchor[];
  readonly captures: readonly (readonly Value[])[];
  readonly checks: readonly (readonly Value[])[];
}
const windows = new WeakMap<object, WindowData>();
const lazySources = new WeakMap<object, Map<string, Value>>();
const key = (value: Value) => `${value.projection.id}@${value.projection.version}`;
const edgeInput = (edge: RecordedEdge) => Object.freeze({ beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen });

/** A factory exception after original legality validation is not a graph refusal. */
function acquireSource<Route extends EvidenceValueRoute>(route: Route, input: EvidenceValueRouteInputs[Route]): EvidenceValueRouteResults[Route] {
  try { return invokeEvidenceValueRoute(route, input); }
  catch (error) {
    if (error instanceof EvidenceValueRouteLookupError) throw error;
    throw new TypeError("Recorded sequence source acquisition refused", { cause: error });
  }
}

function assertSource(value: Value, route: string, factory: string, authority: unknown): void {
  assertDeclaredEvidence(value);
  const receipt = evidenceValueReceipt(value);
  if (key(value) !== route || receipt.factory !== factory || receipt.inputDigest !== evidenceDigest(authority)) throw new TypeError(`Recorded sequence source crosses exact ${route} authority`);
}
function population(route: "rules.transition.event.capture@1" | "rules.tactic.event.check@1", edge: RecordedEdge): readonly Value[] {
  const input = edgeInput(edge), values = acquireSource(route, input);
  const expected = route === "rules.transition.event.capture@1" ? materialCauseFamilies(input).includes("capture") : positionFromFen(edge.afterFen).isCheck();
  if (!Array.isArray(values) || values.length !== Number(expected)) throw new TypeError(`Recorded sequence lost complete ${route} execution`);
  for (const value of values) {
    assertSource(value, route, route === "rules.transition.event.capture@1" ? "createRulesTransitionEventCaptureV1Evidence" : "createRulesTacticEventCheckV1Evidence", input);
    const payload = value.payload as { family?: string; before_fen?: string; move_uci?: string; after_fen?: string; triggeringMove?: string };
    if (route === "rules.transition.event.capture@1"
      ? payload.family !== "capture" || payload.before_fen !== edge.beforeFen || payload.move_uci !== edge.moveUci || payload.after_fen !== edge.afterFen
      : payload.triggeringMove !== edge.moveUci) throw new TypeError("Recorded sequence source payload crosses its exact indexed edge");
  }
  return Object.freeze([...values]);
}

/** Internal issuer for the scoped supplier. Detector preparation touches only complete trailing rows. */
export function prepareRecordedSemanticWindows(input: Readonly<{ run: DrillRun; branchId: string; throughNodeId: string; route: RecordedWindowRoute }>): Readonly<{
  run: DrillRun; eventHeadDigest: string; windows: readonly RecordedSequenceWindow[]; omittedHorizons: readonly number[]; availableEdges: number;
}> {
  if (input === null || typeof input !== "object" || Reflect.ownKeys(input).length !== 4 || !["run", "branchId", "throughNodeId", "route"].every(field => Object.hasOwn(input, field))) throw new TypeError("Recorded sequence requires exactly {run,branchId,throughNodeId,route}");
  return prepareRecordedSemanticWindowPopulation({ run: input.run, branchId: input.branchId, throughNodeId: input.throughNodeId, routes: [input.route] }).get(input.route)!;
}

/** One full validation and one trailing-edge/capture/check union for all demanded families. */
export function prepareRecordedSemanticWindowPopulation(input: Readonly<{ run: DrillRun; branchId: string; throughNodeId: string; routes: readonly RecordedWindowRoute[] }>): RecordedSemanticWindowPopulation {
  if (input === null || typeof input !== "object" || Reflect.ownKeys(input).length !== 4 || !["run", "branchId", "throughNodeId", "routes"].every(field => Object.hasOwn(input, field))) throw new TypeError("Recorded sequence population requires exactly {run,branchId,throughNodeId,routes}");
  return prepareRecordedSemanticBranchWindows({ run: input.run, branchId: input.branchId, throughNodeIds: [input.throughNodeId], routes: input.routes }).get(input.throughNodeId)!;
}

/** The same original branch can serve several actual endpoints without reminting their shared
 * edges/captures/checks. Each result retains its own endpoint and complete horizon population. */
export function prepareRecordedSemanticBranchWindows(input: Readonly<{ run: DrillRun; branchId: string; throughNodeIds: readonly string[]; routes: readonly RecordedWindowRoute[] }>) {
  if (input === null || typeof input !== "object" || Reflect.ownKeys(input).length !== 4 || !["run", "branchId", "throughNodeIds", "routes"].every(field => Object.hasOwn(input, field))) throw new TypeError("Recorded branch windows require exactly {run,branchId,throughNodeIds,routes}");
  const { branchId, throughNodeIds, routes } = input;
  if (!Array.isArray(routes) || routes.length === 0 || new Set(routes).size !== routes.length || routes.some(route => typeof route !== "string" || route !== "derived.exchange.trade_completed@2" && !Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, route))) throw new RecordedSequenceScopeError("projection_unsupported", "Recorded sequence projection unsupported or duplicated");
  if (typeof branchId !== "string" || !branchId || !Array.isArray(throughNodeIds) || throughNodeIds.length === 0
    || new Set(throughNodeIds).size !== throughNodeIds.length || throughNodeIds.some(id => typeof id !== "string" || !id)) throw new TypeError("Recorded sequence needs exact branch and endpoints");
  const snapshot = structuredClone(input.run);
  const originalResolution = resolveBranchPath(snapshot, branchId);
  if (originalResolution.kind !== "resolved") throw new RecordedSequenceScopeError(originalResolution.reason, `Recorded sequence original graph refused: ${originalResolution.reason}`);
  const eventHeadDigest = digestRunEventHead({ runId: snapshot.id, headSeq: snapshot.events.length, events: snapshot.events });
  const run = projectRun(snapshot.events);
  if (canonicalizeJson(run) !== canonicalizeJson(snapshot)) throw new TypeError("Recorded sequence snapshot disagrees with replay");
  const resolution = resolveBranchPath(run, branchId);
  if (resolution.kind !== "resolved") throw new RecordedSequenceScopeError(resolution.reason, `Recorded sequence original graph refused: ${resolution.reason}`);
  const original = resolution.nodes;
  for (const [index, node] of original.entries()) {
    try {
      if (canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new Error("noncanonical");
    } catch { throw new RecordedEdgeError("broken_fen_boundary", node.id, "Recorded sequence original FEN is invalid or not canonical"); }
    if (index > 0) recordedEdgePayload(run, original[index - 1]!, node);
  }
  const endpoints = throughNodeIds.map(id => original.findIndex(node => node.id === id));
  if (endpoints.some(index => index < 0)) throw new RecordedSequenceScopeError("endpoint_not_on_branch", "Recorded sequence endpoint is not on branch");
  const requestedHorizons = (route: RecordedWindowRoute): readonly number[] => route === "derived.exchange.trade_completed@2" ? [2] : RECORDED_SEQUENCE_HORIZONS[route];
  const wanted = new Set(endpoints.flatMap(endpoint => routes.flatMap(route => requestedHorizons(route).filter(horizon => horizon <= endpoint)
    .flatMap(horizon => Array.from({ length: horizon }, (_, index) => endpoint - horizon + index + 1)))));
  // Full graph validation above remains unconditional; acquisition is only the demanded union.
  const edges = new Map([...wanted].sort((a, b) => a - b).map(index => {
    const parent = original[index - 1]!, child = original[index]!, value = acquireSource("run.record.edge@1", { run, parent, child });
    assertSource(value, "run.record.edge@1", "createRunRecordEdgeV1Evidence", { run: { run: run.id, nodes: run.nodes.length, events: run.events.length }, parentId: parent.id, childId: child.id });
    if (evidenceDigest(value.payload) !== evidenceDigest(recordedEdgePayload(run, parent, child))) throw new TypeError("Recorded sequence edge payload crosses its original occurrence");
    return [index, value] as const;
  }));
  const captures = new Map<number, readonly Value[]>(), checks = new Map<number, readonly Value[]>();
  const subjects = new Map<string, RecordedSemanticWindowPopulation>();
  for (const [subjectIndex, endpoint] of endpoints.entries()) {
  const throughNodeId = throughNodeIds[subjectIndex]!;
  const result = new Map<RecordedWindowRoute, Readonly<{ run: DrillRun; eventHeadDigest: string; windows: readonly RecordedSequenceWindow[]; omittedHorizons: readonly number[]; availableEdges: number }>>();
  for (const route of routes) {
  const needsCapture = route === "derived.exchange.trade_completed@2" || route === "derived.tactic.deflection_observed@3" || route === "derived.tactic.attraction_observed@3" || route === "derived.tactic.overload_exploitation_observed@3";
  const own: RecordedSequenceWindow[] = [], omitted: number[] = [];
  for (const horizon of requestedHorizons(route)) {
    if (endpoint < horizon) { omitted.push(horizon); continue; }
    const start = endpoint - horizon + 1, selected = Object.freeze(Array.from({ length: horizon }, (_, index) => edges.get(start + index)!));
    const captureRows = selected.map((value, index): readonly Value[] => {
      if (!needsCapture && !(route === "derived.tactic.check_zwischenzug_observed@3" && index === 0)) return Object.freeze([]);
      const ordinal = start + index;
      if (!captures.has(ordinal)) captures.set(ordinal, population("rules.transition.event.capture@1", value.payload));
      return captures.get(ordinal)!;
    });
    const checkRows = selected.map((value, index): readonly Value[] => {
      const needed = route === "derived.tactic.deflection_observed@3" && index === 0 || route === "derived.tactic.attraction_observed@3" && horizon === 3 && index === 2 || route === "derived.tactic.check_zwischenzug_observed@3" && index === 1;
      if (!needed) return Object.freeze([]);
      const ordinal = start + index;
      if (!checks.has(ordinal)) checks.set(ordinal, population("rules.tactic.event.check@1", value.payload));
      return checks.get(ordinal)!;
    });
    const window = Object.freeze({}) as RecordedSequenceWindow;
    windows.set(window, Object.freeze({ run, authority: Object.freeze({ operation: "recorded-sequence-window@1", runId: run.id, eventHeadDigest,
      decision: moduleDecisionStamp(run), branchId, throughNodeId, route, horizon }), edges: selected,
      anchors: Object.freeze(selected.map(({ payload: edge }) => Object.freeze({ beforeNodeId: edge.beforeNodeId, afterNodeId: edge.afterNodeId, ...edgeInput(edge) }))),
      captures: Object.freeze(captureRows), checks: Object.freeze(checkRows) }));
    lazySources.set(window, new Map()); own.push(window);
  }
    result.set(route, Object.freeze({ run, eventHeadDigest, windows: Object.freeze(own), omittedHorizons: Object.freeze(omitted), availableEdges: endpoint }));
  }
    subjects.set(throughNodeId, result);
  }
  return subjects as ReadonlyMap<string, RecordedSemanticWindowPopulation>;
}

export type RecordedSemanticWindowPopulation = ReadonlyMap<RecordedWindowRoute, Readonly<{ run: DrillRun; eventHeadDigest: string; windows: readonly RecordedSequenceWindow[]; omittedHorizons: readonly number[]; availableEdges: number }>>;

/** The ten @3 factory issuer remains closed; trade is reachable only through its exact supplier. */
export function createRecordedSequenceWindows(input: Readonly<{ run: DrillRun; branchId: string; throughNodeId: string; route: RecordedSequenceRoute }>) {
  if (input === null || typeof input !== "object" || typeof input.route !== "string" || !Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, input.route)) throw new RecordedSequenceScopeError("projection_unsupported", "Recorded sequence projection unsupported");
  return prepareRecordedSemanticWindows(input);
}

export function isRecordedSequenceWindow(value: unknown): value is RecordedSequenceWindow { return value !== null && typeof value === "object" && windows.has(value); }
/** The one canonical value-authority image, shared by mint and subsequent source/event admission. */
export function recordedSequenceWindowValueAuthority(window: RecordedSequenceWindow, payload: unknown, inputs: readonly Value[]) {
  return { window: readRecordedSequenceWindow(window).authority, payload, inputs: inputs.map(value => ({ sealed: evidenceValueReceipt(value).payloadDigest })) };
}
/** No public reader or raw operand arm; authenticate before even computing no-match. */
export function readRecordedSequenceWindow(window: RecordedSequenceWindow, route?: RecordedWindowRoute): WindowData {
  if (!isRecordedSequenceWindow(window)) throw new TypeError("Recorded sequence window was not issued by its owner");
  const data = windows.get(window)!;
  if (route !== undefined && data.authority.route !== route) throw new TypeError("Recorded sequence window belongs to another exact projection");
  return data;
}

/** Dispatch the exact source-owned successor, retaining trade's distinct four-operand authority.
 * A complete edge without a capture is a nonmatching trade, not a missing recorded horizon. */
export function collectRecordedSequenceWindow(window: RecordedSequenceWindow): readonly Value[] {
  const source = readRecordedSequenceWindow(window), route = source.authority.route;
  if (route !== "derived.exchange.trade_completed@2") return invokeEvidenceValueRoute(route, { window });
  if (source.edges.length !== 2 || source.captures.length !== 2) throw new TypeError("Recorded trade lost its complete two-edge capture population");
  const first = source.captures[0]![0], second = source.captures[1]![0];
  return first === undefined || second === undefined ? Object.freeze([])
    : invokeEvidenceValueRoute(route, { first, second, firstEdge: source.edges[0]!, secondEdge: source.edges[1]! });
}

/** Existing recorded computations, never their node-free narrative counterparts. */
export function recordedSequenceWindowOperands(window: RecordedSequenceWindow, route: RecordedSequenceRoute): readonly unknown[] {
  const { anchors } = readRecordedSequenceWindow(window, route);
  switch (route) {
    case "derived.pawn.sequence.contact_timing@3": { const value = pawnContactTimingSequence(anchors); return value === undefined ? [] : [value]; }
    case "derived.pawn.sequence.harassment_pressure@3": { const value = harassmentPressureSequence(anchors); return value === undefined ? [] : [value]; }
    case "derived.tactic.sequence.defender_consequence@3": return recordedDefenderConsequenceOperands(anchors);
    case "derived.tactic.square_clearance_observed@3": return recordedSquareClearanceObservedOperands(anchors);
    case "derived.tactic.line_blocker_clearance_observed@3": return recordedLineBlockerClearanceObservedOperands(anchors);
    case "derived.tactic.interference_observed@3": return interferenceObservedOperands(anchors);
    case "derived.tactic.check_zwischenzug_observed@3": return recordedCheckZwischenzugObservedOperands(anchors);
    case "derived.tactic.overload_exploitation_observed@3": return overloadExploitationObservedOperands(anchors);
    case "derived.tactic.deflection_observed@3": return recordedDeflectionObservedOperands(anchors);
    case "derived.tactic.attraction_observed@3": return recordedAttractionObservedOperands(anchors);
  }
}

/** Literal tuple for one computed match. Lazy duty/exchange calls remain source-owned and exact. */
export function recordedSequenceWindowInputs(window: RecordedSequenceWindow, payload: unknown): readonly Value[] {
  const data = readRecordedSequenceWindow(window), route = data.authority.route, last = data.edges.at(-1)!.payload;
  const value = payload as { targetCapture?: unknown; retainedRecapture?: unknown; secondTargetCapture?: unknown; checkOrCaptureConsequence?: { kind: string } };
  const cached = lazySources.get(window)!;
  const duty = () => {
    if (!cached.has("duty")) {
      const fen = data.edges[0]!.payload.beforeFen, result = acquireSource("rules.tactic.reading.defender_duty_set@1", { fen });
      assertSource(result, "rules.tactic.reading.defender_duty_set@1", "createRulesTacticReadingDefenderDutySetV1Evidence", { fen });
      if ((result.payload as { fen?: string }).fen !== fen) throw new TypeError("Recorded sequence duty payload crosses its indexed before position");
      cached.set("duty", result);
    }
    return cached.get("duty")!;
  };
  const exchange = (wanted: unknown) => {
    if (!cached.has("exchange")) {
      const input = { fen: last.beforeFen, captureUci: last.moveUci }, results = acquireSource("rules.exchange.predicate.legal_exchange@1", input);
      if (results.length !== 1) throw new TypeError("Recorded sequence final exchange source missing");
      const result = results[0]!; assertSource(result, "rules.exchange.predicate.legal_exchange@1", "createRulesExchangePredicateLegalExchangeV1Evidence", input); cached.set("exchange", result);
    }
    const result = cached.get("exchange")!;
    if (evidenceDigest(result.payload) !== evidenceDigest(wanted)) throw new TypeError("Recorded sequence final exchange disagrees with computed operand");
    return result;
  };
  const check = (index: number) => {
    const result = data.checks[index]?.[0];
    if (result === undefined) throw new TypeError("Recorded sequence indexed check source missing");
    return result;
  };
  const captures = data.captures.flat();
  const inputs: Value[] = [...data.edges];
  switch (route) {
    case "derived.tactic.line_blocker_clearance_observed@3": inputs.push(exchange(value.targetCapture)); break;
    case "derived.tactic.interference_observed@3": inputs.push(duty(), exchange(value.targetCapture)); break;
    case "derived.tactic.check_zwischenzug_observed@3": {
      const capture = data.captures[0]?.[0]; if (capture === undefined) throw new TypeError("Recorded sequence indexed capture source missing");
      inputs.push(capture, check(1), exchange(value.retainedRecapture)); break;
    }
    case "derived.tactic.overload_exploitation_observed@3":
      if (captures.length !== 3) throw new TypeError("Recorded overload lost its complete three-capture population");
      inputs.push(duty(), ...captures, exchange(value.secondTargetCapture)); break;
    case "derived.tactic.deflection_observed@3": {
      if (captures.length < 1 || captures.length > 3) throw new TypeError("Recorded deflection lost its complete capture population");
      const induction = deflectionObservedInduction(data.anchors);
      if (induction === undefined) throw new TypeError("Recorded deflection match lost its induction");
      inputs.push(duty(), ...captures, exchange(value.targetCapture), ...(induction === "check_induced" ? [check(0)] : [])); break;
    }
    case "derived.tactic.attraction_observed@3":
      if (captures.length < 1 || captures.length > data.authority.horizon) throw new TypeError("Recorded attraction lost its complete capture population");
      inputs.push(...captures, ...(value.checkOrCaptureConsequence?.kind === "check" ? [check(2)] : [])); break;
  }
  return Object.freeze(inputs);
}
