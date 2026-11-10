// Accepted Review §7a/F2 §4.11c: one exact original recorded source, not a provider query,
// permission grant, synthetic bestline packet or fallback to the retired Full1 operation.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { normalizeMove } from "chessops/chess";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";
import { branchPath } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute, readRecordedAnalyzeLineInvocation, type EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import { parsePersistedProviderDelivery } from "./provider-exchange.js";
import type { RecordedEdge } from "./recorded-edge.js";
import { recordedEdgePayload } from "./recorded-edge.js";
import type { RecordedInspectorPacket } from "./recorded-inspector.js";
import { readBackReplay } from "./replay.js";
import { REVIEW_PROVIDER_LINE_KEY } from "./review-evidence.js";
import { openRetryEntry } from "./review-branch-state.js";
import type { StockfishPrincipalVariation } from "./review-points.js";
import { digestRunEventHead, digestRunEvidenceItem, resolveRunSubject } from "./run-subject.js";
import type { DrillRun, EvidenceAttachedEvent, Node } from "./types.js";

export type RecordedAnalyzeArm = "typed_pv" | "recorded_bestline" | "recorded_search_first";
const ANALYZE_ARMS = Object.freeze({
  "derived.review.analysis_typed_pv@1": "typed_pv",
  "derived.review.analysis_recorded_pv@1": "recorded_bestline",
  "derived.review.analysis_recorded_first@1": "recorded_search_first",
} as const satisfies Readonly<Record<string, RecordedAnalyzeArm>>);
export type InspectorAnalyzeProjection = keyof typeof ANALYZE_ARMS;
export const INSPECTOR_ANALYZE_PROJECTIONS = Object.freeze(Object.keys(ANALYZE_ARMS) as InspectorAnalyzeProjection[]);
export function inspectorAnalyzeArm(projection: unknown): RecordedAnalyzeArm {
  if (typeof projection !== "string" || !Object.hasOwn(ANALYZE_ARMS, projection)) throw new TypeError("Unknown exact Inspector Analyze source");
  return ANALYZE_ARMS[projection as InspectorAnalyzeProjection];
}
export interface AnalyzeMoveOperand { readonly fullmove: number; readonly side: "white" | "black"; readonly san: string }
export type AnalyzeBoundOperand = Readonly<{ kind: "movetime"; requestedMs: number }>
  | Readonly<{ kind: "depth"; requestedDepth: number }> | Readonly<{ kind: "nodes"; requestedNodes: number }>;
export type AnalyzeLineScope = Readonly<{ kind: "typed_request"; maxPlies: number; truncated: boolean }>
  | Readonly<{ kind: "recorded_report" }>;
type AnalyzeEngine = Readonly<{ id: string; name: string | null; version: string | null }>;
export type AnalyzeLineOperands = Readonly<{ kind: "line"; sourceArm: RecordedAnalyzeArm;
  reviewedMove: AnalyzeMoveOperand; engine: AnalyzeEngine;
  bound: AnalyzeBoundOperand; lineScope: AnalyzeLineScope; line: readonly AnalyzeMoveOperand[] }>
  | Readonly<{ kind: "unattributed"; sourceArm: RecordedAnalyzeArm; reviewedMove: AnalyzeMoveOperand;
    reason: "engine_unusable" | "bound_unusable" | "engine_and_bound_unusable" }>;

declare const sourceBrand: unique symbol;
export interface RecordedAnalyzeLineSource { readonly [sourceBrand]: true }
interface RecordedAnalyzeLineData {
  readonly run: DrillRun;
  readonly branchId: string;
  readonly parent: Node;
  readonly reviewed: Node;
  readonly edge: DeclaredEvidence<RecordedEdge>;
  /** Original complete-stream ordinal, not the filtered source-population index. */
  readonly ordinal: number | null;
  readonly event: EvidenceAttachedEvent | null;
  readonly sourceArm: RecordedAnalyzeArm | null;
  readonly packet: DeclaredEvidence<RecordedInspectorPacket> | null;
  readonly typed: DeclaredEvidence<StockfishPrincipalVariation> | null;
  readonly inputs: readonly DeclaredEvidence<unknown>[];
  readonly outcome: Readonly<{ kind: "available"; collected: 1 }> | Readonly<{ kind: "no_witness" }>
    | Readonly<{ kind: "unavailable"; reason: "source_absent" }>
    | Readonly<{ kind: "failed"; reason: "source_contract_invalid" }>;
  readonly operands: AnalyzeLineOperands | null;
}
const SOURCES = new WeakMap<object, RecordedAnalyzeLineData>();
export function readRecordedAnalyzeLineSource(source: RecordedAnalyzeLineSource): RecordedAnalyzeLineData {
  const data = source !== null && typeof source === "object" ? SOURCES.get(source) : undefined;
  if (data === undefined) throw new TypeError("Analyze requires its original recorded source invocation");
  return data;
}
const positive = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) > 0;
const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
function historicalBound(values: Readonly<Record<string, unknown>>): AnalyzeBoundOperand | null {
  if (positive(values.requestedMovetimeMs)) return Object.freeze({ kind: "movetime", requestedMs: values.requestedMovetimeMs });
  if (positive(values.requestedDepth)) return Object.freeze({ kind: "depth", requestedDepth: values.requestedDepth });
  if (positive(values.requestedNodes)) return Object.freeze({ kind: "nodes", requestedNodes: values.requestedNodes });
  return null;
}
function walk(fen: string, values: unknown): readonly AnalyzeMoveOperand[] {
  if (!Array.isArray(values)) throw new TypeError("Recorded Analyze line is not an array");
  const position = positionFromFen(fen), result: AnalyzeMoveOperand[] = [];
  // Array holes, non-string tokens and illegal suffixes fail the entire selected occurrence.
  for (const token of values) {
    if (typeof token !== "string") throw new TypeError("Recorded Analyze token is not UCI");
    const parsed = parseUci(token);
    if (parsed === undefined) throw new TypeError("Recorded Analyze token is not UCI");
    const move = normalizeMove(position, parsed);
    if (!position.isLegal(move)) throw new TypeError("Recorded Analyze token is illegal at its exact parent");
    result.push(Object.freeze({ fullmove: position.fullmoves, side: position.turn, san: makeSan(position, move) }));
    position.play(move);
  }
  return Object.freeze(result);
}

export interface RecordedAnalyzeMetadata {
  readonly run: DrillRun;
  readonly branchId: string;
  readonly parent: Node;
  readonly reviewed: Node;
  readonly ordinal: number | null;
  readonly event: EvidenceAttachedEvent | null;
  readonly sourceArm: RecordedAnalyzeArm | null;
}

/** Metadata only, not an evidence/access issuer. Validate the complete original graph before
 * selecting an occurrence; do not invoke a source factory, provider parser or renderer. */
export function selectRecordedAnalyzeMetadata(stored: DrillRun, branchId: string, nodeId: string, signal: AbortSignal): RecordedAnalyzeMetadata {
  if (!(signal instanceof AbortSignal)) throw new TypeError("Analyze metadata requires an AbortSignal");
  signal.throwIfAborted();
  // Replay/projectRun may freeze event-owned data. It must never freeze borrowed caller state.
  const original = structuredClone(stored);
  digestRunEventHead({ runId: original.id, headSeq: original.events.length, events: original.events });
  const replay = readBackReplay(original.events).run;
  if (canonicalizeJson(original) !== canonicalizeJson(replay)) throw new TypeError("Analyze snapshot disagrees with its complete recorded replay");
  // Validate complete original paths, including suffixes and other branches, before narrowing.
  for (const branch of replay.branches) {
    const path = branchPath(replay, branch.id);
    for (const [index, node] of path.entries()) {
      if (canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new TypeError("Analyze original node is not canonical");
      if (index > 0) recordedEdgePayload(replay, path[index - 1]!, node);
    }
  }
  const selected = branchPath(replay, branchId), index = selected.findIndex(node => node.id === nodeId);
  if (index < 1) throw new TypeError("Analyze selected node is not a move on the granted branch");
  if (openRetryEntry(replay, branchId) === selected[index - 1]!.id) throw new TypeError("Analyze parent is the open retry entry");
  const parent = selected[index - 1]!, reviewed = selected[index]!;
  const eligible = replay.events.flatMap((event, ordinal) => event.type === "evidence.attached" && event.data.nodeId === parent.id
    && event.data.payload.source === "engine_validated" ? [{ event, ordinal }] : []).reverse();
  const typedEvent = eligible.find(({ event }) => event.data.payload.kind === "eval" && Object.hasOwn(event.data.payload.values, REVIEW_PROVIDER_LINE_KEY));
  const bestline = eligible.find(({ event }) => event.data.payload.kind === "bestline");
  const first = eligible.find(({ event }) => event.data.payload.kind === "eval" && Object.hasOwn(event.data.payload.values, "bestMoveUci"));
  const chosen = typedEvent ?? bestline ?? first;
  const sourceArm: RecordedAnalyzeArm | null = typedEvent ? "typed_pv" : bestline ? "recorded_bestline" : first ? "recorded_search_first" : null;
  signal.throwIfAborted();
  return Object.freeze({ run: replay, branchId, parent, reviewed, ordinal: chosen?.ordinal ?? null, event: chosen?.event ?? null, sourceArm });
}

/** Pure source collection only. It independently reselects from its original complete inputs,
 * never accepts the service's earlier metadata result as authority. */
export function collectRecordedAnalyzeLine(stored: DrillRun, branchId: string, nodeId: string, signal: AbortSignal): RecordedAnalyzeLineSource {
  const metadata = selectRecordedAnalyzeMetadata(stored, branchId, nodeId, signal);
  const head = digestRunEventHead({ runId: metadata.run.id, headSeq: metadata.run.events.length, events: metadata.run.events });
  const resolved = resolveRunSubject(metadata.run, { kind: "run_node", runId: metadata.run.id, eventHeadDigest: head, branchId, nodeId: metadata.parent.id });
  const run = resolved.run, parent = run.nodes.find(node => node.id === metadata.parent.id)!, reviewed = run.nodes.find(node => node.id === nodeId)!;
  signal.throwIfAborted();
  const edge = invokeEvidenceValueRoute("run.record.edge@1", { run, parent, child: reviewed });
  const reviewedPosition = positionFromFen(parent.fen), reviewedMove = Object.freeze({ fullmove: reviewedPosition.fullmoves, side: reviewedPosition.turn, san: edge.payload.moveSan });
  const event = metadata.ordinal === null ? undefined : run.events[metadata.ordinal];
  if (event !== undefined && event.type !== "evidence.attached") throw new TypeError("Analyze selection is not its original evidence event");
  const chosen = event === undefined ? undefined : { event, ordinal: metadata.ordinal! }, sourceArm = metadata.sourceArm;
  let packet: DeclaredEvidence<RecordedInspectorPacket> | null = null, typed: DeclaredEvidence<StockfishPrincipalVariation> | null = null;
  let inputs: readonly DeclaredEvidence<unknown>[] = Object.freeze([edge]), operands: AnalyzeLineOperands | null = null;
  let outcome: RecordedAnalyzeLineData["outcome"] = Object.freeze({ kind: "unavailable", reason: "source_absent" });
  if (chosen !== undefined && sourceArm !== null) {
    try {
      signal.throwIfAborted();
      const itemDigest = digestRunEvidenceItem({ runId: run.id, eventHeadDigest: head, eventSeq: chosen.event.seq, event: chosen.event });
      packet = chosen.event.data.payload.kind === "bestline"
        ? invokeEvidenceValueRoute("recorded.inspector.pv_packet@1", { resolved, itemDigest })
        : invokeEvidenceValueRoute("recorded.inspector.eval_packet@1", { resolved, itemDigest });
      inputs = Object.freeze([edge, packet]);
      const values = packet.payload.event.data.payload.values;
      let engine: AnalyzeEngine | null;
      let bound: AnalyzeBoundOperand | null, lineScope: AnalyzeLineScope, moves: readonly AnalyzeMoveOperand[];
      if (sourceArm === "typed_pv") {
        const delivery = parsePersistedProviderDelivery("stockfish.principal_variation@1", values[REVIEW_PROVIDER_LINE_KEY]);
        if (delivery.payload.fen !== parent.fen) throw new TypeError("Recorded typed Analyze capture crosses its original parent FEN");
        typed = invokeEvidenceValueRoute("live.stockfish.principal_variation@1", { delivery });
        inputs = Object.freeze([edge, packet, typed]);
        const payload = typed.payload.payload, originalBound = payload.bound;
        engine = payload.engine;
        bound = Object.freeze(originalBound.kind === "movetime" ? { kind: "movetime", requestedMs: originalBound.requestedMs }
          : originalBound.kind === "depth" ? { kind: "depth", requestedDepth: originalBound.requestedDepth } : { kind: "nodes", requestedNodes: originalBound.requestedNodes });
        lineScope = Object.freeze({ kind: "typed_request", maxPlies: payload.maxPlies, truncated: payload.truncated });
        moves = walk(parent.fen, payload.movesUci);
      } else {
        engine = text(values.engineId) ? Object.freeze({ id: values.engineId, name: null, version: null }) : null;
        bound = historicalBound(values); lineScope = Object.freeze({ kind: "recorded_report" });
        moves = walk(parent.fen, sourceArm === "recorded_bestline" ? values.movesUci : [values.bestMoveUci]);
      }
      if (moves.length === 0) outcome = Object.freeze({ kind: "no_witness" });
      else {
        operands = engine === null || bound === null
          ? Object.freeze({ kind: "unattributed", sourceArm, reviewedMove, reason: engine === null ? bound === null ? "engine_and_bound_unusable" : "engine_unusable" : "bound_unusable" })
          : Object.freeze({ kind: "line", sourceArm, reviewedMove, engine, bound, lineScope, line: moves });
        outcome = Object.freeze({ kind: "available", collected: 1 });
      }
    } catch {
      signal.throwIfAborted();
      operands = null; outcome = Object.freeze({ kind: "failed", reason: "source_contract_invalid" });
    }
  }
  signal.throwIfAborted();
  const source = Object.freeze({}) as RecordedAnalyzeLineSource;
  SOURCES.set(source, Object.freeze({ run, branchId, parent, reviewed, edge, ordinal: chosen?.ordinal ?? null,
    event: chosen?.event ?? null, sourceArm, packet, typed, inputs, outcome, operands }));
  return source;
}

/** Runtime-only exact derived dispatch. The server checks its actual grant again between
 * original collection and this call; the factory's existing invocation proof retains both. */
export function deriveRecordedAnalyzeLineSource(source: RecordedAnalyzeLineSource, projection: InspectorAnalyzeProjection, signal: AbortSignal): EvidenceValueRouteResults[InspectorAnalyzeProjection] {
  signal.throwIfAborted();
  const arm = inspectorAnalyzeArm(projection), data = readRecordedAnalyzeLineSource(source);
  if (data.sourceArm !== arm) throw new TypeError("Analyze derivation crosses the selected original arm");
  const result = invokeEvidenceValueRoute(projection, { source });
  readRecordedAnalyzeDerivedResult(result, source, projection);
  signal.throwIfAborted();
  return result;
}

/** Read the factory's actual existing invocation proof, including original unavailable wrappers. */
export function readRecordedAnalyzeDerivedResult(result: unknown, source: RecordedAnalyzeLineSource, projection: InspectorAnalyzeProjection) {
  const data = readRecordedAnalyzeLineSource(source), proof = readRecordedAnalyzeLineInvocation(result);
  if (proof.route !== projection || proof.source !== source || proof.data !== data) throw new TypeError("Analyze result is not the original source invocation");
  return proof;
}
