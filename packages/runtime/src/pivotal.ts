import type { Color } from "chessops/types";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { permittedAssistance, type AssistanceContext } from "./assistance.js";
import { branchPath } from "./branch-path.js";
import { canonicalFen, positionFromFen } from "./chess.js";
import { projectRun } from "./events.js";
import { moduleDecisionStamp } from "./module-decision.js";
import { recordedEdgePayload } from "./recorded-edge.js";
import { digestRunEventHead } from "./run-subject-digest.js";
import { resolveRunSubject, type ResolvedRunSubject } from "./run-subject.js";
import { exactLegalMoves } from "./legal-moves.js";
import { classifyPhase, type DetectedPhase } from "./phase.js";
import type { DrillRun, Node, OpponentMoveSelectedEvent, OpponentSelection } from "./types.js";
import type { RecordedInspectorSelection } from "./recorded-inspector.js";
import type { RecordedPosition } from "./review-points.js";
import { irreversibility, type IrreversibilityDetail } from "./transition.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { assertConsumerEvidenceView, evidenceForConsumer, type ConsumerEvidenceView, type DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";

export type PivotalKind = "irreversibility" | "phase_change" | "human_divergence" | "option_collapse";
export type { IrreversibilityDetail } from "./transition.js";
export interface PhaseChangeDetail { readonly from: Exclude<DetectedPhase, "unclear">; readonly to: Exclude<DetectedPhase, "unclear">; }
export interface DivergenceDetail { readonly engine: OpponentSelection["engine"]; readonly targetElo?: number; readonly masses: readonly number[]; }
export interface CollapseDetail { readonly color: Color; readonly priorCount: number; readonly count: number; readonly nextCount: number; }
export interface PivotalMarker { readonly nodeId: string; readonly kind: PivotalKind; readonly detail: IrreversibilityDetail | PhaseChangeDetail | DivergenceDetail | CollapseDetail; readonly provenanceNote: string; }
export interface RecordedHumanDivergenceMarker extends PivotalMarker {
  readonly selection: DeclaredEvidence<RecordedInspectorSelection>;
  readonly position: DeclaredEvidence<RecordedPosition>;
}

const PROVENANCE = "Tabiya's pivotal-marker convention";
const DEFINITE = new Set<DetectedPhase>(["opening", "middlegame", "endgame"]);
// Producer-owned input retention: two histories may select at the same recorded node.
// Marker fields alone cannot locate which complete distribution produced that marker.
type RecordedMarkerSelection = Readonly<{
  occurrence: Readonly<{ runId: string; eventSeq: number; branchId: string; nodeId: string; moveUci: string }>;
  engine: OpponentSelection["engine"];
  candidates: NonNullable<OpponentSelection["candidates"]>;
}>;
const RECORDED_SELECTIONS = new WeakMap<PivotalMarker, RecordedMarkerSelection>();
/** Internal source operand, not evidence or permission; copied/rendered markers have none. */
export function pivotalMarkerRecordedSelection(marker: PivotalMarker): RecordedMarkerSelection | undefined {
  return RECORDED_SELECTIONS.get(marker);
}

function legalCount(fen: string): number {
  return exactLegalMoves(fen).length;
}


/** Shared reported-window arithmetic. This is a choice-spread convention, not chess quality. */
export function reportedHumanSplit(nodeId: string, selection: OpponentSelection, targetElo?: number): PivotalMarker | undefined {
  const candidates = selection.candidates?.filter(item => item.offWindow !== true);
  if (candidates === undefined || candidates.length === 0 || candidates.some(item => item.mass === undefined)) return undefined;
  const total = candidates.reduce((sum, item) => sum + item.mass!, 0); if (!(total > 0)) return undefined;
  const masses = candidates.map(item => item.mass! / total).sort((a, b) => b - a);
  if (Math.max(...masses) > 0.5 || masses.filter(mass => mass >= 0.15).length < 3) return undefined;
  return Object.freeze({ nodeId, kind: "human_divergence" as const, detail: Object.freeze({ engine: selection.engine,
    ...(targetElo === undefined ? {} : { targetElo }), masses: Object.freeze(masses) }), provenanceNote: "Recorded human-model distribution under Tabiya's split convention." });
}

function divergence(run: DrillRun, pathIds: ReadonlySet<string>): readonly PivotalMarker[] {
  return run.events.flatMap((event) => {
    if (event.type !== "opponent.move_selected" || !pathIds.has(event.data.nodeId) || event.data.selection.policyModeApplied !== "human_common") return [];
    const selection = event.data.selection;
    const recordedCandidates = selection.candidates;
    const source = recordedCandidates === undefined ? undefined : Object.freeze({
      occurrence: Object.freeze({ runId: run.id, eventSeq: event.seq, branchId: event.data.branchId,
        nodeId: event.data.nodeId, moveUci: event.data.moveUci }),
      engine: Object.freeze({ ...selection.engine }),
      candidates: Object.freeze(recordedCandidates.map(candidate => Object.freeze({ ...candidate }))),
    });
    if (source === undefined) return [];
    const marker = reportedHumanSplit(event.data.nodeId, { ...selection, engine: source.engine, candidates: source.candidates }, run.opponentPolicy.targetElo);
    if (marker === undefined) return [];
    RECORDED_SELECTIONS.set(marker, source!);
    return [marker];
  });
}

/** Shared source implementation; each exact factory prepares only its own declared family. */
function pivotalPayloads(run: DrillRun, branchId: string, kind: PivotalKind | undefined): readonly PivotalMarker[] {
  return pivotalPathPayloads(run, branchPath(run, branchId), kind);
}

function pivotalPathPayloads(run: DrillRun, path: readonly Node[], kind: PivotalKind | undefined): readonly PivotalMarker[] {
  const markers: PivotalMarker[] = [];
  let lastDefinite: Exclude<DetectedPhase, "unclear"> | undefined;
  for (let index = 0; index < path.length; index += 1) {
    const node = path[index]!;
    // Every route retains original path/FEN validation even when its own family has no witness.
    positionFromFen(node.fen);
    if (kind === undefined || kind === "phase_change") {
      const phase = classifyPhase(node.fen).phase;
      if (DEFINITE.has(phase)) {
        const definite = phase as Exclude<DetectedPhase, "unclear">;
        if (lastDefinite !== undefined && definite !== lastDefinite) markers.push(Object.freeze({ nodeId: node.id, kind: "phase_change", detail: Object.freeze({ from: lastDefinite, to: definite }), provenanceNote: PROVENANCE }));
        lastDefinite = definite;
      }
    }
    const parent = index === 0 ? undefined : path[index - 1];
    if ((kind === undefined || kind === "irreversibility") && parent !== undefined && node.moveUci !== null) { const detail = irreversibility(parent.fen, node.moveUci, node.fen); if (detail !== undefined) markers.push(Object.freeze({ nodeId: node.id, kind: "irreversibility", detail: Object.freeze(detail), provenanceNote: PROVENANCE })); }
  }
  if (kind === undefined || kind === "option_collapse") {
    const decisions = path.map((node) => ({ node, color: positionFromFen(node.fen).turn, count: legalCount(node.fen) }));
    for (const color of ["white", "black"] as const) {
      const same = decisions.filter((item) => item.color === color);
      for (let index = 1; index + 1 < same.length; index += 1) {
        const prior = same[index - 1]!, first = same[index]!, second = same[index + 1]!;
        if (prior.count >= 8 && first.count <= 3 && second.count <= 3) markers.push(Object.freeze({ nodeId: first.node.id, kind: "option_collapse", detail: Object.freeze({ color, priorCount: prior.count, count: first.count, nextCount: second.count }), provenanceNote: "Tabiya's sustained legal-continuation convention." }));
      }
    }
  }
  if (kind === undefined || kind === "human_divergence") markers.push(...divergence(run, new Set(path.map((node) => node.id))));
  const order = new Map(path.map((node, index) => [node.id, index]));
  return Object.freeze(markers.sort((a, b) => (order.get(a.nodeId)! - order.get(b.nodeId)!) || a.kind.localeCompare(b.kind)));
}

/** Unchanged whole-tip population for rendering and existing complete-source callers. */
export function pivotalMarkerPayloads(run: DrillRun, branchId: string): readonly PivotalMarker[] {
  return pivotalPayloads(run, branchId, undefined);
}

/** Factory-internal selection, not a scoped path, public package export or permission. */
export function pivotalMarkerPayloadsForKind(run: DrillRun, branchId: string, kind: PivotalKind): readonly PivotalMarker[] {
  if (!Object.hasOwn(PIVOTAL_MARKER_ROUTES, kind)) throw new TypeError("Unknown pivotal source family");
  return pivotalPayloads(run, branchId, kind);
}

/** Rendering-model population (not evidence). Evidence consumers use `pivotalMarkerEvidenceItems`. */
export function pivotalMarkers(run: DrillRun, branchId: string): readonly PivotalMarker[] {
  return pivotalMarkerPayloads(run, branchId);
}

export const PIVOTAL_MARKER_ROUTES = Object.freeze({
  irreversibility: "derived.pivotal.irreversibility@1",
  phase_change: "derived.pivotal.phase_change@1",
  human_divergence: "derived.pivotal.human_divergence@1",
  option_collapse: "derived.pivotal.option_collapse@1",
} as const satisfies Readonly<Record<PivotalKind, string>>);

declare const recordedPivotalBrand: unique symbol;
export interface RecordedPivotalSource { readonly [recordedPivotalBrand]: true }
const RECORDED_PIVOTAL = new WeakMap<object, Readonly<{
  run: DrillRun;
  humanObservations?: readonly Readonly<{ event: OpponentMoveSelectedEvent; resolved: ResolvedRunSubject }>[];
  authority: Readonly<{
    operation: "recorded-pivotal-source@1";
    runId: string;
    eventHeadDigest: string;
    decision: ReturnType<typeof moduleDecisionStamp>;
    branchId: string;
    throughNodeId: string;
    kind: PivotalKind;
    path: readonly Node[];
  }>;
}>>();

/** Recorded scope only. Current read/disclosure/publication authority remains server-owned. */
export function createRecordedPivotalSource(input: Readonly<{ run: DrillRun; branchId: string; throughNodeId: string; kind: PivotalKind }>): RecordedPivotalSource {
  if (input === null || typeof input !== "object" || Reflect.ownKeys(input).length !== 4
    || !["run", "branchId", "throughNodeId", "kind"].every(key => Object.hasOwn(input, key))) throw new TypeError("Recorded pivotal requires exactly {run,branchId,throughNodeId,kind}");
  const { branchId, throughNodeId, kind } = input;
  if (typeof branchId !== "string" || branchId.length === 0 || typeof throughNodeId !== "string" || throughNodeId.length === 0 || typeof kind !== "string" || !Object.hasOwn(PIVOTAL_MARKER_ROUTES, kind)) throw new TypeError("Recorded pivotal requires a known kind and nonempty branch/endpoint");
  const snapshot = structuredClone(input.run);
  const eventHeadDigest = digestRunEventHead({ runId: snapshot.id, headSeq: snapshot.events.length, events: snapshot.events });
  const run = projectRun(snapshot.events);
  if (canonicalizeJson(run) !== canonicalizeJson(snapshot)) throw new TypeError("Recorded pivotal snapshot disagrees with its event replay");
  const original = branchPath(run, branchId);
  for (const [index, node] of original.entries()) {
    if (canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new TypeError("Recorded pivotal original FEN is not canonical");
    if (index > 0) recordedEdgePayload(run, original[index - 1]!, node);
  }
  const endpoint = original.findIndex(node => node.id === throughNodeId);
  if (endpoint < 0) throw new TypeError("Recorded pivotal endpoint is not on the original branch");
  // Inherited endpoints before this attempt's own fork are valid for a one-path query.
  const path = Object.freeze(original.slice(0, endpoint + 1));
  let humanObservations: readonly Readonly<{ event: OpponentMoveSelectedEvent; resolved: ResolvedRunSubject }>[] | undefined;
  if (kind === "human_divergence") {
    const anchors = new Set(path.map(node => node.id));
    const events = run.events.filter((event): event is OpponentMoveSelectedEvent => event.type === "opponent.move_selected"
      && event.data.selection.policyModeApplied === "human_common" && anchors.has(event.data.nodeId));
    // Validate ALL relevant originals before resolving any observation. A shared anchor cannot
    // hide a malformed sibling suffix, even for a missing-candidates/nonmatching observation.
    const origins = new Map([...new Set(events.map(event => event.data.branchId))].map(origin => [origin, branchPath(run, origin)]));
    for (const nodes of origins.values()) for (const [index, node] of nodes.entries()) {
      if (canonicalFen(positionFromFen(node.fen)) !== node.fen) throw new TypeError("Recorded human origin FEN is not canonical");
      if (index > 0) recordedEdgePayload(run, nodes[index - 1]!, node);
    }
    for (const event of events) if (!origins.get(event.data.branchId)!.some(node => node.id === event.data.nodeId)) throw new TypeError("Recorded human observation is not on its actual origin branch");
    humanObservations = Object.freeze(events.map(event => Object.freeze({ event, resolved: resolveRunSubject(run, {
      kind: "run_node", runId: run.id, eventHeadDigest, branchId: event.data.branchId, nodeId: event.data.nodeId,
    }) })));
  }
  const source = Object.freeze({}) as RecordedPivotalSource;
  RECORDED_PIVOTAL.set(source, Object.freeze({ run, ...(humanObservations === undefined ? {} : { humanObservations }), authority: Object.freeze({ operation: "recorded-pivotal-source@1", runId: run.id,
    eventHeadDigest, decision: moduleDecisionStamp(run), branchId, throughNodeId, kind, path }) }));
  return source;
}

export function isRecordedPivotalSource(value: unknown): value is RecordedPivotalSource {
  return value !== null && typeof value === "object" && RECORDED_PIVOTAL.has(value);
}
/** Runtime-internal; no public data reader or caller path/marker override. */
export function recordedPivotalData(source: RecordedPivotalSource, kind?: PivotalKind) {
  if (!isRecordedPivotalSource(source)) throw new TypeError("Recorded pivotal source was not issued by its owner");
  const data = RECORDED_PIVOTAL.get(source)!;
  if (kind !== undefined && data.authority.kind !== kind) throw new TypeError("Recorded pivotal source kind does not match the exact requested factory");
  return data;
}
export function pivotalRecordedPayloads(source: RecordedPivotalSource, kind: PivotalKind): readonly PivotalMarker[] {
  const { run, authority } = recordedPivotalData(source, kind);
  return pivotalPathPayloads(run, authority.path, kind);
}

/**
 * The four exact derived pivotal projections for one recorded branch, in path order. Each item is
 * minted by its own factory from its own authority: a rule marker cannot be relabelled human-model
 * evidence and a Maia split cannot be relabelled a position-rule marker.
 */
export function pivotalMarkerEvidenceItems(run: DrillRun, branchId: string): readonly DeclaredEvidence<PivotalMarker>[] {
  const order = new Map(branchPath(run, branchId).map((node, index) => [node.id, index]));
  const items = (Object.keys(PIVOTAL_MARKER_ROUTES) as PivotalKind[]).flatMap((kind) => invokeEvidenceValueRoute(PIVOTAL_MARKER_ROUTES[kind], { run, branchId }).map((item) => item.evidence as DeclaredEvidence<PivotalMarker>));
  return Object.freeze(items.sort((a, b) => (order.get(a.payload.nodeId)! - order.get(b.payload.nodeId)!) || a.payload.kind.localeCompare(b.payload.kind)));
}

export function liveAdmitted(
  marker: PivotalMarker,
  _permission: ReturnType<typeof permittedAssistance>,
): boolean {
  switch (marker.kind) {
    case "irreversibility":
      return (marker.detail as IrreversibilityDetail).subkind === "last_of_role";
    case "human_divergence":
    case "option_collapse":
      // D3048: measured evidence remains available to explicit requests and retrospective
      // consumers, but these two signals never appear as unsolicited live markers.
      return false;
    case "phase_change":
      return true;
    default: {
      const exhaustive: never = marker.kind;
      return exhaustive;
    }
  }
}

export function liveMarkers(
  run: DrillRun,
  branchId: string,
  context: AssistanceContext,
): readonly PivotalMarker[] {
  const permission = permittedAssistance(context);
  return Object.freeze(pivotalMarkers(run, branchId).filter((marker) => liveAdmitted(marker, permission)));
}

export function consumePivotalMarkers(
  view: ConsumerEvidenceView<PivotalMarker>,
): readonly PivotalMarker[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "board.pivotal_marker" || view.consumer.version !== 1) {
    throw new TypeError("Expected board.pivotal_marker@1 consumer view");
  }
  return Object.freeze(view.items.map((item) => item.payload));
}

/** Live board markers: factory-minted, filtered by the live admission rule, then admitted. */
export function pivotalMarkerEvidence(run: DrillRun, branchId: string, context: AssistanceContext): readonly PivotalMarker[] {
  const permission = permittedAssistance(context);
  const declared = pivotalMarkerEvidenceItems(run, branchId).filter((item) => liveAdmitted(item.payload, permission));
  return consumePivotalMarkers(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    { id: "board.pivotal_marker", version: 1 },
    declared,
  ));
}

export function renderPivotalMarker(marker: PivotalMarker): readonly string[] {
  switch (marker.kind) {
    case "phase_change": {
      const detail = marker.detail as PhaseChangeDetail;
      return Object.freeze([`${detail.from} → ${detail.to}, detected by Tabiya's phase bands.`]);
    }
    case "human_divergence": {
      const detail = marker.detail as DivergenceDetail;
      return Object.freeze([`${detail.engine.name}'s recorded policy split: ${detail.masses.slice(0, 3).map((mass) => `${Math.round(mass * 100)}%`).join(" / ")} of recorded mass.`]);
    }
    case "option_collapse": {
      const detail = marker.detail as CollapseDetail;
      return Object.freeze([detail.count === 1 ? "One legal move is available: forced under Tabiya's count convention." : `${detail.count} legal moves are available under Tabiya's count convention.`]);
    }
    case "irreversibility": {
      const detail = marker.detail as IrreversibilityDetail;
      if (detail.subkind === "castled") return Object.freeze([`${detail.color} castled.`]);
      if (detail.subkind === "last_of_role") return Object.freeze([detail.queensOff ? "The queens have left the board." : `${detail.color} has no ${detail.role}s remaining.`]);
      return Object.freeze([`${detail.color} created or resolved pawn contact.`]);
    }
    default: {
      const exhaustive: never = marker.kind;
      return exhaustive;
    }
  }
}
