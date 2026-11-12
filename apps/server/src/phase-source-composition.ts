/**
 * Source-retaining phase composition (rfc/phase-source-composition.md).
 *
 * The sole production composer of one exact recorded position's independent phase sources — the
 * opening endpoint and catalogue membership, the rules-only `rules.phase.reading@2` decision, the
 * `rules.endgame.classification@1` material class, recorded tablebase evidence from the pack's
 * sealed snapshot and a live Syzygy provider result — and of the ordered arc over one recorded
 * branch path. No slot wins a precedence contest, no aggregate phase/stage/relevance field exists
 * and no source-local change is rendered here. The branded views are server-package private: they
 * are never serialized or exported across the package boundary.
 */
import {
  assertDeclaredEvidence,
  assertProviderDelivery,
  assertProviderLocalDomainResult,
  invokeRunRecordPosition,
  normalizeProviderRequest,
  normalizedProviderRequestDigest,
  phaseReadingEvidence,
  providerSourceEvidence,
  recordedSemanticPath,
  syzygyTablebaseDomainEvidence,
  transposeKey,
  type DeclaredEvidence,
  type DrillRun,
  type EndgameClassification,
  type LiveSyzygyPosition,
  type PhaseBandReadingV2,
  type PositionEvidenceIndex,
  type ProviderEvidenceDelivery,
  type ProviderLocalDomainResult,
  type RecordedReading,
  type RecordedSemanticPathResult,
  type SyzygyPositionRequest,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";

import { openingIdentityAt, type CurrentOpeningEndpoint, type OpeningCatalogueAvailability, type OpeningCatalogueMembership } from "./opening-catalogue.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";

// ---------------------------------------------------------------------------------------------
// Failures (§6): bugs or corrupt inputs, never rendered as "no evidence"
// ---------------------------------------------------------------------------------------------

export type PhaseSourceFailureCode =
  | "PHASE_SOURCE_VIEW_UNSEALED"
  | "PHASE_SOURCE_POSITION_MISMATCH"
  | "PHASE_SOURCE_CATALOGUE_MISMATCH"
  | "PHASE_SOURCE_OPENING_INVARIANT"
  | "PHASE_SOURCE_ENDGAME_INVARIANT"
  | "PHASE_SOURCE_RECORDED_SNAPSHOT"
  | "PHASE_SOURCE_TABLEBASE_RESULT"
  | "PHASE_SOURCE_PATH_INVALID";

export class PhaseSourceError extends TypeError {
  constructor(readonly code: PhaseSourceFailureCode, message: string) {
    super(`${code}: ${message}`);
    this.name = "PhaseSourceError";
  }
}

/** Canonical six-field FEN; an illegal/invalid FEN throws. */
function canonical(fen: string): string {
  return makeFen(Chess.fromSetup(parseFen(fen).unwrap()).unwrap().toSetup());
}

const fail = (code: PhaseSourceFailureCode, message: string): never => {
  throw new PhaseSourceError(code, message);
};

/** Labels alone are not evidence authority; clones and JSON round trips must fail first. */
function assertPosition(position: RecordedPositionEvidence): void {
  try {
    assertDeclaredEvidence(position);
  } catch (error) {
    fail("PHASE_SOURCE_POSITION_MISMATCH", `the position is not declared evidence: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (position.projection.id !== "run.record.position" || position.projection.version !== 1) fail("PHASE_SOURCE_POSITION_MISMATCH", "a point needs one run.record.position@1 item");
}

// ---------------------------------------------------------------------------------------------
// Recorded position authority
// ---------------------------------------------------------------------------------------------

export interface RecordedPositionPayload {
  readonly nodeId: string;
  readonly ply: number;
  readonly fen: string;
}

export type RecordedPositionEvidence = DeclaredEvidence<RecordedPositionPayload>;

// ---------------------------------------------------------------------------------------------
// §2.1 Opening: one private operation over the retained exact occurrence
// ---------------------------------------------------------------------------------------------

export interface OpeningSourceResolution {
  readonly position: RecordedPositionEvidence;
  readonly currentEndpoint: CurrentOpeningEndpoint;
  readonly catalogueMembership: OpeningCatalogueMembership;
}

const OPENING_RECEIPTS = new WeakSet<object>();

/** The only opening operation: one paired call bound to the retained position item. */
export function resolveOpeningSources(position: RecordedPositionEvidence, availability: OpeningCatalogueAvailability): OpeningSourceResolution {
  assertPosition(position);
  const { fen, ply } = position.payload;
  const pair = openingIdentityAt(availability, fen, ply);
  const key = transposeKey(fen);
  for (const slot of [pair.currentEndpoint, pair.catalogueMembership]) {
    if (slot.kind === "abstained") continue;
    if (slot.positionKey !== key || slot.observedPly !== ply) fail("PHASE_SOURCE_POSITION_MISMATCH", "opening result binds another position key or ply");
  }
  const endpoint = pair.currentEndpoint;
  const membership = pair.catalogueMembership;
  if ((endpoint.kind === "abstained") !== (membership.kind === "abstained")) fail("PHASE_SOURCE_CATALOGUE_MISMATCH", "one opening slot abstained while the other did not");
  if (endpoint.kind !== "abstained" && membership.kind !== "abstained" && JSON.stringify(endpoint.catalogue) !== JSON.stringify(membership.catalogue)) fail("PHASE_SOURCE_CATALOGUE_MISMATCH", "opening slots name different catalogue identities");
  if (endpoint.kind === "matched" && membership.kind !== "member") fail("PHASE_SOURCE_OPENING_INVARIANT", "a named endpoint without catalogue membership");
  const receipt = Object.freeze({ position, currentEndpoint: endpoint, catalogueMembership: membership });
  OPENING_RECEIPTS.add(receipt);
  return receipt;
}

// ---------------------------------------------------------------------------------------------
// §2.2 Recorded snapshot and live tablebase slots
// ---------------------------------------------------------------------------------------------

export interface RecordedEvidenceSnapshotReceipt {
  readonly packId: string;
  readonly packDigest: string;
  readonly ledgerDigest: string;
  readonly tablebaseFens: readonly string[];
}

export type RecordedEvidenceSnapshotSource =
  | { readonly kind: "no_pack_source" }
  | { readonly kind: "pack"; readonly packId: string; readonly packDigest: string; readonly recordedEvidence: { readonly state: "verified"; readonly ledgerDigest: string } | { readonly state: "unverified" } | { readonly state: "invalid" }; readonly positionEvidence: PositionEvidenceIndex };

export type RecordedSnapshotResult =
  | { readonly kind: "snapshot"; readonly receipt: RecordedEvidenceSnapshotReceipt }
  | { readonly kind: "source_unavailable"; readonly reason: "no_pack_source" | "ledger_unverified" | "ledger_invalid" };

const SNAPSHOTS = new WeakSet<object>();
const SNAPSHOT_READINGS = new WeakMap<object, ReadonlyMap<string, DeclaredEvidence<RecordedReading>>>();

/** The sole snapshot constructor: a digest-matched validated ledger's exact tablebase inventory. */
export function compileRecordedEvidenceSnapshot(source: RecordedEvidenceSnapshotSource): RecordedSnapshotResult {
  if (source.kind === "no_pack_source") return Object.freeze({ kind: "source_unavailable", reason: "no_pack_source" });
  if (source.recordedEvidence.state === "unverified") return Object.freeze({ kind: "source_unavailable", reason: "ledger_unverified" });
  if (source.recordedEvidence.state === "invalid") return Object.freeze({ kind: "source_unavailable", reason: "ledger_invalid" });
  const readings = new Map<string, DeclaredEvidence<RecordedReading>>();
  for (const items of source.positionEvidence.values()) for (const item of items) {
    try {
      assertDeclaredEvidence(item);
    } catch (error) {
      fail("PHASE_SOURCE_RECORDED_SNAPSHOT", `the recorded reading is not declared evidence: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (item.payload.kind !== "tablebase_result") continue;
    if (item.projection.id !== "recorded.tablebase.result" || item.projection.version !== 1) fail("PHASE_SOURCE_RECORDED_SNAPSHOT", "tablebase readings need recorded.tablebase.result@1 authority");
    const fen = canonical((item.payload.fen));
    if (readings.has(fen)) fail("PHASE_SOURCE_RECORDED_SNAPSHOT", `duplicate recorded tablebase evidence at ${fen}`);
    readings.set(fen, item);
  }
  const receipt: RecordedEvidenceSnapshotReceipt = Object.freeze({ packId: source.packId, packDigest: source.packDigest, ledgerDigest: source.recordedEvidence.ledgerDigest, tablebaseFens: Object.freeze([...readings.keys()].sort()) });
  SNAPSHOTS.add(receipt);
  SNAPSHOT_READINGS.set(receipt, readings);
  return Object.freeze({ kind: "snapshot", receipt });
}

export type RecordedTablebaseResolution =
  | { readonly kind: "recorded"; readonly fen: string; readonly item: DeclaredEvidence<RecordedReading>; readonly snapshot: RecordedEvidenceSnapshotReceipt }
  | { readonly kind: "absent"; readonly fen: string; readonly snapshot: RecordedEvidenceSnapshotReceipt }
  | { readonly kind: "source_unavailable"; readonly reason: "no_pack_source" | "ledger_unverified" | "ledger_invalid" };

export function resolveRecordedTablebase(position: RecordedPositionEvidence, snapshot: RecordedSnapshotResult): RecordedTablebaseResolution {
  assertPosition(position);
  if (snapshot.kind === "source_unavailable") return snapshot;
  if (!SNAPSHOTS.has(snapshot.receipt)) fail("PHASE_SOURCE_RECORDED_SNAPSHOT", "the recorded snapshot was not compiled by compileRecordedEvidenceSnapshot");
  const fen = canonical((position.payload.fen));
  const item = SNAPSHOT_READINGS.get(snapshot.receipt)!.get(fen);
  return Object.freeze(item === undefined ? { kind: "absent" as const, fen, snapshot: snapshot.receipt } : { kind: "recorded" as const, fen, item, snapshot: snapshot.receipt });
}

export type TablebaseLiveSlot =
  | { readonly kind: "not_requested" }
  | { readonly kind: "success"; readonly result: Extract<TypedProviderResult<"syzygy.position@1">, { readonly kind: "success" }>; readonly item: DeclaredEvidence<ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy.position@1">> }
  | { readonly kind: "local_domain_result"; readonly result: ProviderLocalDomainResult<"syzygy.position@1">; readonly item: DeclaredEvidence<ProviderLocalDomainResult<"syzygy.position@1">> }
  | { readonly kind: "source_failure"; readonly result: Extract<TypedProviderResult<"syzygy.position@1">, { readonly kind: "source_failure" }> };

/** A caller's live Syzygy exchange: the exact request plus the scheduler's typed result. */
export interface LiveTablebaseExchange {
  readonly request: SyzygyPositionRequest;
  readonly result: TypedProviderResult<"syzygy.position@1">;
}

function liveTablebaseSlot(fen: string, exchange: LiveTablebaseExchange | undefined): TablebaseLiveSlot {
  if (exchange === undefined) return Object.freeze({ kind: "not_requested" });
  let digest: string;
  try {
    digest = normalizedProviderRequestDigest("syzygy.position@1", normalizeProviderRequest("syzygy.position@1", exchange.request));
  } catch (error) {
    return fail("PHASE_SOURCE_TABLEBASE_RESULT", `the live tablebase request is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (canonical((exchange.request.fen)) !== fen) fail("PHASE_SOURCE_TABLEBASE_RESULT", "the live tablebase request binds another full FEN");
  const result = exchange.result;
  if (result.operation !== "syzygy.position@1" || result.normalizedRequestDigest !== digest) fail("PHASE_SOURCE_TABLEBASE_RESULT", "the live tablebase result belongs to another request");
  switch (result.kind) {
    case "success": {
      assertProviderDelivery("syzygy.position@1", result.delivery);
      if (canonical((result.delivery.payload.fen)) !== fen) fail("PHASE_SOURCE_TABLEBASE_RESULT", "the live tablebase delivery binds another full FEN");
      return Object.freeze({ kind: "success", result, item: providerSourceEvidence("syzygy.position@1", result.delivery) as DeclaredEvidence<ProviderEvidenceDelivery<LiveSyzygyPosition, "syzygy.position@1">> });
    }
    case "local_domain_result":
      assertProviderLocalDomainResult("syzygy.position@1", result);
      return Object.freeze({ kind: "local_domain_result", result, item: syzygyTablebaseDomainEvidence(result) });
    case "source_failure":
      return Object.freeze({ kind: "source_failure", result });
  }
}

// ---------------------------------------------------------------------------------------------
// §2 The exact point
// ---------------------------------------------------------------------------------------------

export type RulesEndgameSlot =
  | { readonly kind: "not_applicable"; readonly phase: PhaseBandReadingV2["phase"] }
  | { readonly kind: "classified"; readonly item: DeclaredEvidence<EndgameClassification> };

export interface PhaseSourcePoint {
  readonly position: RecordedPositionEvidence;
  readonly openingSources: {
    readonly currentEndpoint: CurrentOpeningEndpoint;
    readonly catalogueMembership: OpeningCatalogueMembership;
  };
  readonly rulesPhase: DeclaredEvidence<PhaseBandReadingV2>;
  readonly rulesEndgame: RulesEndgameSlot;
  readonly tablebase: {
    readonly recorded: RecordedTablebaseResolution;
    readonly live: TablebaseLiveSlot;
  };
}

export interface PhaseSourceDependencies {
  readonly opening: OpeningCatalogueAvailability;
  readonly recorded: RecordedSnapshotResult;
  /** Live Syzygy exchanges the caller's declared workflow already requested, keyed by node id. */
  readonly live?: ReadonlyMap<string, LiveTablebaseExchange>;
}

/** Forbidden aggregate root keys (§2.3), checked on both roots. */
export const PHASE_SOURCE_FORBIDDEN_KEYS: readonly string[] = Object.freeze(["phase", "stage", "inBook", "endgameTechnique", "confidence", "priority", "rank", "significance", "relevance", "hint", "advice", "selectedSource"]);
const POINT_KEYS = Object.freeze(["position", "openingSources", "rulesPhase", "rulesEndgame", "tablebase"]);
const ARC_KEYS = Object.freeze(["runId", "branchId", "path", "points", "changes"]);

const POINTS = new WeakSet<object>();
const ARCS = new WeakSet<object>();

function assertRootKeys(value: object, expected: readonly string[], label: string): void {
  const keys = Object.keys(value);
  const forbidden = keys.filter((key) => PHASE_SOURCE_FORBIDDEN_KEYS.includes(key));
  if (forbidden.length > 0 || keys.sort().join(",") !== [...expected].sort().join(",")) fail("PHASE_SOURCE_VIEW_UNSEALED", `${label} root keys are not the normative shape${forbidden.length > 0 ? ` (forbidden: ${forbidden.join(", ")})` : ""}`);
}

/** The only point constructor. */
export function compilePhaseSourcePoint(position: RecordedPositionEvidence, dependencies: PhaseSourceDependencies): PhaseSourcePoint {
  assertPosition(position);
  const fen = canonical((position.payload.fen));
  const opening = resolveOpeningSources(position, dependencies.opening);
  const { phase, endgame } = phaseReadingEvidence(fen);
  if (canonical((phase.payload.fen)) !== fen) fail("PHASE_SOURCE_POSITION_MISMATCH", "rules phase reading binds another FEN");
  const isEndgame = phase.payload.phase === "endgame";
  if (isEndgame !== (endgame.length === 1)) fail("PHASE_SOURCE_ENDGAME_INVARIANT", "endgame applicability contradicts the rules phase convention");
  const rulesEndgame: RulesEndgameSlot = endgame.length === 1 ? Object.freeze({ kind: "classified" as const, item: endgame[0]! }) : Object.freeze({ kind: "not_applicable" as const, phase: phase.payload.phase });
  const point = Object.freeze({
    position,
    openingSources: Object.freeze({ currentEndpoint: opening.currentEndpoint, catalogueMembership: opening.catalogueMembership }),
    rulesPhase: phase,
    rulesEndgame,
    tablebase: Object.freeze({ recorded: resolveRecordedTablebase(position, dependencies.recorded), live: liveTablebaseSlot(fen, dependencies.live?.get(position.payload.nodeId)) }),
  });
  assertRootKeys(point, POINT_KEYS, "point");
  POINTS.add(point);
  return point;
}

export function assertPhaseSourcePoint(value: unknown): asserts value is PhaseSourcePoint {
  if (typeof value !== "object" || value === null || !POINTS.has(value)) fail("PHASE_SOURCE_VIEW_UNSEALED", "not a compiled phase-source point");
}

// ---------------------------------------------------------------------------------------------
// §3 The ordered arc and source-local changes
// ---------------------------------------------------------------------------------------------

export type PhaseSourceChangeKind =
  | "endpoint" | "catalogue_membership" | "rules_phase_decision" | "endgame_classification"
  | "tablebase_domain" | "recorded_tablebase_availability" | "live_tablebase_availability";

export interface PhaseSourceChange {
  readonly source: PhaseSourceChangeKind;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly fromPly: number;
  readonly toPly: number;
  readonly before: string;
  readonly after: string;
}

export interface PhaseArc {
  readonly runId: string;
  readonly branchId: string;
  /** The exact recorded-semantic-path result the arc was compiled over. */
  readonly path: Extract<RecordedSemanticPathResult, { readonly kind: "available" }>;
  readonly points: readonly PhaseSourcePoint[];
  readonly changes: readonly PhaseSourceChange[];
}

export type PhaseArcResult = { readonly kind: "arc"; readonly arc: PhaseArc } | { readonly kind: "refused"; readonly path: Extract<RecordedSemanticPathResult, { readonly kind: "refused" }> };

/** Source-local state tokens: comparison metadata only, never learner prose. */
function sourceStates(point: PhaseSourcePoint): Readonly<Record<PhaseSourceChangeKind, string>> {
  const endpoint = point.openingSources.currentEndpoint;
  const membership = point.openingSources.catalogueMembership;
  const live = point.tablebase.live;
  return {
    endpoint: endpoint.kind === "matched" ? `matched:${endpoint.eco}` : endpoint.kind === "absent" ? "absent" : `abstained:${endpoint.reason}`,
    catalogue_membership: membership.kind,
    rules_phase_decision: point.rulesPhase.payload.decision.kind,
    endgame_classification: point.rulesEndgame.kind === "classified" ? `classified:${point.rulesEndgame.item.payload.type?.id ?? "untyped"}` : "not_applicable",
    tablebase_domain: live.kind === "local_domain_result" ? "outside_domain" : live.kind === "success" ? "inside_domain" : live.kind,
    recorded_tablebase_availability: point.tablebase.recorded.kind,
    live_tablebase_availability: live.kind,
  };
}

function changesBetween(previous: PhaseSourcePoint, current: PhaseSourcePoint): readonly PhaseSourceChange[] {
  const before = sourceStates(previous), after = sourceStates(current);
  return (Object.keys(before) as PhaseSourceChangeKind[]).flatMap(source => before[source] === after[source] ? [] : [Object.freeze({
    source, fromNodeId: previous.position.payload.nodeId, toNodeId: current.position.payload.nodeId,
    fromPly: previous.position.payload.ply, toPly: current.position.payload.ply, before: before[source], after: after[source],
  })]);
}

/** Shared original issuer; assembly neither acquires positions nor invokes a chess collector. */
function sealPhaseArc(runId: string, branchId: string, path: PhaseArc["path"], points: readonly PhaseSourcePoint[], changes: readonly PhaseSourceChange[]): PhaseArcResult {
  const arc = Object.freeze({ runId, branchId, path, points: Object.freeze([...points]), changes: Object.freeze([...changes]) });
  assertRootKeys(arc, ARC_KEYS, "arc");
  ARCS.add(arc);
  return Object.freeze({ kind: "arc", arc });
}

/** The only arc constructor: run + branch, through the sole recorded-path operation. */
export function compilePhaseArc(run: DrillRun, branchId: string, dependencies: PhaseSourceDependencies): PhaseArcResult {
  const path = recordedSemanticPath(run, branchId);
  if (path.branchId !== branchId) fail("PHASE_SOURCE_PATH_INVALID", "semantic collection belongs to another original branch");
  if (path.kind === "refused") return Object.freeze({ kind: "refused", path });
  if (new Set(path.pathNodeIds).size !== path.pathNodeIds.length) fail("PHASE_SOURCE_PATH_INVALID", "the recorded path repeats a node id");
  const points = path.pathNodeIds.map((nodeId) => compilePhaseSourcePoint(invokeRunRecordPosition(run, nodeId) as RecordedPositionEvidence, dependencies));
  points.forEach((point, index) => {
    if (index > 0 && point.position.payload.ply !== points[index - 1]!.position.payload.ply + 1) fail("PHASE_SOURCE_PATH_INVALID", "the arc is not a contiguous ordered path");
  });
  const changes: PhaseSourceChange[] = [];
  for (let index = 1; index < points.length; index += 1) {
    changes.push(...changesBetween(points[index - 1]!, points[index]!));
  }
  return sealPhaseArc(run.id, branchId, path, points, changes);
}

declare const recordedPhaseArcCollectionBrand: unique symbol;
/** Private original-source work, not a PhaseArc, partial evidence or an access grant. */
export interface RecordedPhaseArcCollection { readonly [recordedPhaseArcCollectionBrand]: true }
interface PhaseArcCollectionState {
  readonly boundary: RecordedReviewBoundary;
  readonly image: ReturnType<typeof readRecordedReviewBoundary>;
  readonly dependencies: PhaseSourceDependencies;
  readonly points: PhaseSourcePoint[];
  readonly changes: PhaseSourceChange[];
  path: RecordedSemanticPathResult | undefined;
}
const ARC_COLLECTIONS = new WeakMap<object, PhaseArcCollectionState>();

function capturePhaseDependencies(input: PhaseSourceDependencies): PhaseSourceDependencies {
  const live = input.live === undefined ? undefined : new Map([...input.live].map(([id, exchange]) => {
    const result = exchange.result;
    // Local-domain results carry identity authority themselves. Success retains the exact sealed
    // delivery; failure and request records contain scalar data and can be detached shallowly.
    if (result.kind === "local_domain_result") assertProviderLocalDomainResult("syzygy.position@1", result);
    if (result.kind === "success") assertProviderDelivery("syzygy.position@1", result.delivery);
    return [id, Object.freeze({ request: Object.freeze({ ...exchange.request }),
      result: result.kind === "local_domain_result" ? result : Object.freeze({ ...result }) })] as const;
  }));
  return Object.freeze({ opening: Object.freeze({ ...input.opening }), recorded: Object.freeze({ ...input.recorded }),
    ...(live === undefined ? {} : { live }) });
}

/** D4250: metadata and captured original inputs only; the job owns access, clock and capacity. */
export function beginRecordedPhaseArcCollection(boundary: RecordedReviewBoundary, dependencies: PhaseSourceDependencies): RecordedPhaseArcCollection {
  const image = readRecordedReviewBoundary(boundary);
  if (image.path.length !== image.originalPath.length || image.request.throughNodeId !== image.originalPath.at(-1)!.node.id) {
    throw new TypeError("PhaseArc collection requires the complete original recorded branch");
  }
  const captured = capturePhaseDependencies(dependencies);
  readRecordedReviewBoundary(boundary);
  const handle = Object.freeze({}) as RecordedPhaseArcCollection;
  ARC_COLLECTIONS.set(handle, { boundary, image, dependencies: captured, points: [], changes: [], path: undefined });
  return handle;
}

function arcCollectionState(handle: RecordedPhaseArcCollection): PhaseArcCollectionState {
  const state = typeof handle === "object" && handle !== null ? ARC_COLLECTIONS.get(handle) : undefined;
  if (state === undefined) throw new TypeError("PhaseArc collection is unknown or retired");
  return state;
}

/** Whole-path preparation is its own unit; later advances acquire one genuine point each. */
export function advanceRecordedPhaseArcCollection(handle: RecordedPhaseArcCollection): Readonly<{
  stage: "path" | "point"; nodeId: string | null; completedSubjects: number; totalSubjects: number; complete: boolean;
}> {
  const state = arcCollectionState(handle), { image } = state, totalSubjects = image.path.length;
  if (state.path?.kind === "refused" || state.points.length === totalSubjects) throw new TypeError("PhaseArc collection has no remaining subject");
  try {
    readRecordedReviewBoundary(state.boundary);
    if (state.path === undefined) {
      state.path = recordedSemanticPath(image.run, image.request.branchId);
      if (state.path.branchId !== image.request.branchId) fail("PHASE_SOURCE_PATH_INVALID", "semantic collection belongs to another original branch");
      if (state.path.kind === "available" && state.path.pathNodeIds.join("\u0000") !== image.path.map(entry => entry.node.id).join("\u0000")) {
        fail("PHASE_SOURCE_PATH_INVALID", "semantic collection disagrees with the original recorded branch");
      }
      readRecordedReviewBoundary(state.boundary);
      return Object.freeze({ stage: "path", nodeId: null, completedSubjects: 0, totalSubjects, complete: state.path.kind === "refused" });
    }
    const nodeId = state.path.pathNodeIds[state.points.length]!;
    const point = compilePhaseSourcePoint(invokeRunRecordPosition(image.run, nodeId) as RecordedPositionEvidence, state.dependencies);
    const previous = state.points.at(-1);
    if (previous !== undefined) {
      if (point.position.payload.ply !== previous.position.payload.ply + 1) fail("PHASE_SOURCE_PATH_INVALID", "the arc is not a contiguous ordered path");
      state.changes.push(...changesBetween(previous, point));
    }
    readRecordedReviewBoundary(state.boundary);
    state.points.push(point);
    return Object.freeze({ stage: "point", nodeId, completedSubjects: state.points.length, totalSubjects, complete: state.points.length === totalSubjects });
  } catch (error) { ARC_COLLECTIONS.delete(handle); throw error; }
}

/** Complete-only publication through the same original arc issuer, without source acquisition. */
export function finishRecordedPhaseArcCollection(handle: RecordedPhaseArcCollection): PhaseArcResult {
  const state = arcCollectionState(handle), { image, path } = state;
  if (path === undefined || path.kind === "available" && state.points.length !== image.path.length) throw new TypeError("PhaseArc collection is incomplete");
  try {
    readRecordedReviewBoundary(state.boundary);
    const result: PhaseArcResult = path.kind === "refused" ? Object.freeze({ kind: "refused", path })
      : sealPhaseArc(image.run.id, image.request.branchId, path, state.points, state.changes);
    readRecordedReviewBoundary(state.boundary);
    return result;
  } finally { ARC_COLLECTIONS.delete(handle); }
}

export function cancelRecordedPhaseArcCollection(handle: RecordedPhaseArcCollection): boolean {
  return typeof handle === "object" && handle !== null && ARC_COLLECTIONS.delete(handle);
}

export function assertPhaseArc(value: unknown): asserts value is PhaseArc {
  if (typeof value !== "object" || value === null || !ARCS.has(value)) fail("PHASE_SOURCE_VIEW_UNSEALED", "not a compiled phase arc");
}
