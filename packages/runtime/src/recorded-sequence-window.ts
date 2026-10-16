// Accepted F2 §2.3j: private recorded-window authority, not server access or a wire token.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { resolveBranchPath } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { assertDeclaredEvidence, evidenceDigest, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { projectRun } from "./events.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { materialCauseFamilies } from "./internal/material-sources.js";
import { moduleDecisionStamp } from "./module-decision.js";
import { harassmentPressureSequence, pawnContactTimingSequence, type RecordedMoveAnchor } from "./pawn-dynamics.js";
import { recordedEdgePayload, type RecordedEdge } from "./recorded-edge.js";
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
declare const recordedSequenceWindowBrand: unique symbol;
export interface RecordedSequenceWindow { readonly [recordedSequenceWindowBrand]: true }
type Value = DeclaredEvidence<unknown>;
interface WindowData {
  readonly run: DrillRun;
  readonly authority: Readonly<{ operation: "recorded-sequence-window@1"; runId: string; eventHeadDigest: string;
    decision: ReturnType<typeof moduleDecisionStamp>; branchId: string; throughNodeId: string;
    route: RecordedSequenceRoute; horizon: number }>;
  readonly edges: readonly DeclaredEvidence<RecordedEdge>[];
  readonly anchors: readonly RecordedMoveAnchor[];
  readonly captures: readonly (readonly Value[])[];
  readonly checks: readonly (readonly Value[])[];
}
const windows = new WeakMap<object, WindowData>();
const lazySources = new WeakMap<object, Map<string, Value>>();
const key = (value: Value) => `${value.projection.id}@${value.projection.version}`;
const edgeInput = (edge: RecordedEdge) => Object.freeze({ beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen });

function assertSource(value: Value, route: string, factory: string, authority: unknown): void {
  assertDeclaredEvidence(value);
  const receipt = evidenceValueReceipt(value);
  if (key(value) !== route || receipt.factory !== factory || receipt.inputDigest !== evidenceDigest(authority)) throw new TypeError(`Recorded sequence source crosses exact ${route} authority`);
}
function population(route: "rules.transition.event.capture@1" | "rules.tactic.event.check@1", edge: RecordedEdge): readonly Value[] {
  const input = edgeInput(edge), values = invokeEvidenceValueRoute(route, input);
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
export function createRecordedSequenceWindows(input: Readonly<{ run: DrillRun; branchId: string; throughNodeId: string; route: RecordedSequenceRoute }>): Readonly<{
  windows: readonly RecordedSequenceWindow[]; omittedHorizons: readonly number[]; availableEdges: number;
}> {
  if (input === null || typeof input !== "object" || Reflect.ownKeys(input).length !== 4 || !["run", "branchId", "throughNodeId", "route"].every(field => Object.hasOwn(input, field))) throw new TypeError("Recorded sequence requires exactly {run,branchId,throughNodeId,route}");
  const { branchId, throughNodeId, route } = input;
  if (typeof route !== "string" || !Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, route)) throw new TypeError("Recorded sequence projection unsupported");
  if (typeof branchId !== "string" || !branchId || typeof throughNodeId !== "string" || !throughNodeId) throw new TypeError("Recorded sequence needs exact branch and endpoint");
  const snapshot = structuredClone(input.run);
  const eventHeadDigest = digestRunEventHead({ runId: snapshot.id, headSeq: snapshot.events.length, events: snapshot.events });
  const run = projectRun(snapshot.events);
  if (canonicalizeJson(run) !== canonicalizeJson(snapshot)) throw new TypeError("Recorded sequence snapshot disagrees with replay");
  const resolution = resolveBranchPath(run, branchId);
  if (resolution.kind !== "resolved") throw new TypeError(`Recorded sequence original graph refused: ${resolution.reason}`);
  const original = resolution.nodes;
  for (const [index, node] of original.entries()) {
    if (canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new TypeError("Recorded sequence original FEN is not canonical");
    if (index > 0) recordedEdgePayload(run, original[index - 1]!, node);
  }
  const endpoint = original.findIndex(node => node.id === throughNodeId);
  if (endpoint < 0) throw new TypeError("Recorded sequence endpoint is not on branch");
  // Validate and obtain genuine prefix edges on original references, not reconstructed stand-ins.
  const edges = original.slice(1, endpoint + 1).map((child, index) => {
    const parent = original[index]!, value = invokeEvidenceValueRoute("run.record.edge@1", { run, parent, child });
    assertSource(value, "run.record.edge@1", "createRunRecordEdgeV1Evidence", { run: { run: run.id, nodes: run.nodes.length, events: run.events.length }, parentId: parent.id, childId: child.id });
    if (evidenceDigest(value.payload) !== evidenceDigest(recordedEdgePayload(run, parent, child))) throw new TypeError("Recorded sequence edge payload crosses its original occurrence");
    return value;
  });
  const captures = new Map<number, readonly Value[]>(), checks = new Map<number, readonly Value[]>();
  const needsCapture = route === "derived.tactic.deflection_observed@3" || route === "derived.tactic.attraction_observed@3" || route === "derived.tactic.overload_exploitation_observed@3";
  const own: RecordedSequenceWindow[] = [], omitted: number[] = [];
  for (const horizon of RECORDED_SEQUENCE_HORIZONS[route]) {
    if (edges.length < horizon) { omitted.push(horizon); continue; }
    const start = edges.length - horizon, selected = Object.freeze(edges.slice(start));
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
  return Object.freeze({ windows: Object.freeze(own), omittedHorizons: Object.freeze(omitted), availableEdges: endpoint });
}

export function isRecordedSequenceWindow(value: unknown): value is RecordedSequenceWindow { return value !== null && typeof value === "object" && windows.has(value); }
/** No public reader or raw operand arm; authenticate before even computing no-match. */
export function readRecordedSequenceWindow(window: RecordedSequenceWindow, route?: RecordedSequenceRoute): WindowData {
  if (!isRecordedSequenceWindow(window)) throw new TypeError("Recorded sequence window was not issued by its owner");
  const data = windows.get(window)!;
  if (route !== undefined && data.authority.route !== route) throw new TypeError("Recorded sequence window belongs to another exact projection");
  return data;
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
      const fen = data.edges[0]!.payload.beforeFen, result = invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen });
      assertSource(result, "rules.tactic.reading.defender_duty_set@1", "createRulesTacticReadingDefenderDutySetV1Evidence", { fen });
      if ((result.payload as { fen?: string }).fen !== fen) throw new TypeError("Recorded sequence duty payload crosses its indexed before position");
      cached.set("duty", result);
    }
    return cached.get("duty")!;
  };
  const exchange = (wanted: unknown) => {
    if (!cached.has("exchange")) {
      const input = { fen: last.beforeFen, captureUci: last.moveUci }, results = invokeEvidenceValueRoute("rules.exchange.predicate.legal_exchange@1", input);
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
