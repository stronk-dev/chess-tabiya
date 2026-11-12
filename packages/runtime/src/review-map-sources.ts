// Review Map §1a: prepare original sources before final selection/rendering. No new evidence
// issuer, access grant, result cache, deadline or shortened recorded game is introduced here.
import { branchPath } from "./branch-path.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { compileEvidenceConsumerExecutionV2 } from "./evidence-binding-execution.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { collectRecordedSequenceWindow, prepareRecordedSemanticBranchWindows, RECORDED_SEQUENCE_HORIZONS, type RecordedWindowRoute } from "./recorded-sequence-window.js";
import { collectPostcommitEdge } from "./postcommit-nudge.js";
import { localDefenderExposure } from "./semantic-evidence.js";
import { ENDGAME_SETUP_CONVENTIONS } from "./endgame-setup.js";
import { collectRecordedOpeningHistory } from "./recorded-opening-history.js";
import { readRecordedReviewBoundary, type RecordedReviewBoundary } from "./recorded-review-boundary.js";
import type { OpeningCatalogueAvailability } from "./opening-catalogue.js";
import type { DrillRun, Node } from "./types.js";

export type RecordedReviewRelation = Readonly<{ evidence: DeclaredEvidence<unknown>; nodeId: string }>;
type Exposure = ReturnType<typeof localDefenderExposure>;
export interface RecordedReviewRelations {
  readonly events: readonly RecordedReviewRelation[];
  /** A reader over the private map; consumers cannot mutate the original occurrence index. */
  readonly exposureForNode: (nodeId: string) => Exposure | undefined;
}
type Execution = ReturnType<typeof compileEvidenceConsumerExecutionV2>;
type Sequences = ReturnType<typeof prepareRecordedSemanticBranchWindows>;

export function reviewMapSequenceRoutes(execution: Execution): readonly RecordedWindowRoute[] {
  const routes = execution.bindings.map(({ binding }) => `${binding.projection.id}@${binding.projection.version}`)
    .filter((route): route is RecordedWindowRoute => route === "derived.exchange.trade_completed@2" || Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, route));
  if (routes.length !== 11) throw new TypeError("Review lost its complete eleven-family recorded sequence image");
  return Object.freeze(routes);
}

function collectRelationPoint(path: readonly Node[], index: number, sequences: Sequences, routes: readonly RecordedWindowRoute[]) {
  const node = path[index]!, collected = collectPostcommitEdge(path[index - 1]!, node);
  const exposure = localDefenderExposure(collected.closure);
  const edge = collected.evidence.map(evidence => Object.freeze({ evidence, nodeId: node.id }));
  const phase = invokeEvidenceValueRoute("rules.phase.reading@2", { fen: node.fen });
  const setups = ENDGAME_SETUP_CONVENTIONS.flatMap(convention => {
    const result = invokeEvidenceValueRoute("theory.endgame.setup_match@1", { fen: node.fen, convention: { id: convention.id, version: convention.version } });
    if (result.kind === "unavailable") throw new TypeError("Review setup convention is unavailable");
    return result.kind === "available" ? [{ evidence: result.value, nodeId: node.id }] : [];
  });
  const events = [...edge, { evidence: phase, nodeId: node.id }, ...setups,
    ...routes.flatMap(route => sequences.get(node.id)!.get(route)!.windows.flatMap(window =>
      collectRecordedSequenceWindow(window).map(evidence => Object.freeze({ evidence, nodeId: node.id }))))];
  return { exposure, events };
}

function retainRelations(events: readonly RecordedReviewRelation[], exposures: ReadonlyMap<string, Exposure>): RecordedReviewRelations {
  return Object.freeze({ events: Object.freeze(events.map(event => Object.freeze(event))), exposureForNode: (id: string) => exposures.get(id) });
}

const recordedRelations = new WeakMap<DrillRun, Map<string, RecordedReviewRelations>>();
/** Existing synchronous source cache: only immutable original recorded runs enter it. */
export function collectReviewRelations(run: DrillRun, branchId: string, routes: readonly RecordedWindowRoute[]): RecordedReviewRelations {
  const key = JSON.stringify([branchId, routes]), previous = recordedRelations.get(run)?.get(key);
  if (previous !== undefined) return previous;
  const path = branchPath(run, branchId);
  const sequences = prepareRecordedSemanticBranchWindows({ run, branchId, throughNodeIds: path.slice(1).map(node => node.id), routes });
  const exposures = new Map<string, Exposure>();
  const events = path.slice(1).flatMap((node, index) => {
    const point = collectRelationPoint(path, index + 1, sequences, routes);
    exposures.set(node.id, point.exposure); return point.events;
  });
  const result = retainRelations(events, exposures);
  const byBranch = recordedRelations.get(run) ?? new Map<string, RecordedReviewRelations>();
  byBranch.set(key, result); recordedRelations.set(run, byBranch); return result;
}

/** The original history supplier and deepest-reached reducer, with no selection or new issuer. */
export function collectReviewOpeningEvents(run: DrillRun, branchId: string, opening: OpeningCatalogueAvailability | undefined): readonly RecordedReviewRelation[] {
  if (opening?.kind !== "available") return Object.freeze([]);
  const history = collectRecordedOpeningHistory({ source: opening.source, run, branchId, throughNodeId: branchPath(run, branchId).at(-1)!.id });
  return Object.freeze(invokeEvidenceValueRoute("derived.opening.deepest_reached@2", { history })
    .map(item => Object.freeze({ evidence: item.evidence, nodeId: item.nodeId })));
}

declare const reviewMapSourceCollectionBrand: unique symbol;
export interface ReviewMapSourceCollection { readonly [reviewMapSourceCollectionBrand]: true }
declare const preparedReviewMapSourcesBrand: unique symbol;
export interface PreparedReviewMapSources { readonly [preparedReviewMapSourcesBrand]: true }
type BoundaryImage = ReturnType<typeof readRecordedReviewBoundary>;
interface SourceData {
  readonly boundary: RecordedReviewBoundary;
  readonly image: BoundaryImage;
  readonly routes: readonly RecordedWindowRoute[];
  readonly opening: OpeningCatalogueAvailability | undefined;
  readonly recorded: RecordedReviewRelations | undefined;
  readonly openingEvents: readonly RecordedReviewRelation[];
}
interface SourceWork {
  readonly boundary: RecordedReviewBoundary;
  readonly image: BoundaryImage;
  readonly path: readonly Node[];
  readonly routes: readonly RecordedWindowRoute[];
  readonly opening: OpeningCatalogueAvailability | undefined;
  readonly events: RecordedReviewRelation[];
  readonly exposures: Map<string, Exposure>;
  sequences: Sequences | undefined;
  next: number;
  stage: "windows" | "relations" | "opening" | "complete";
  openingEvents: readonly RecordedReviewRelation[];
}
const WORK = new WeakMap<object, SourceWork>(), PREPARED = new WeakMap<object, SourceData>();

/** Complete original scope, captured source identity and metadata only. */
export function beginReviewMapSourceCollection(boundary: RecordedReviewBoundary, opening?: OpeningCatalogueAvailability): ReviewMapSourceCollection {
  const image = readRecordedReviewBoundary(boundary);
  if (image.path.length !== image.originalPath.length || image.request.throughNodeId !== image.originalPath.at(-1)!.node.id) throw new TypeError("Review Map sources require the complete original recorded branch");
  const execution = compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.review_map", version: 2 });
  const handle = Object.freeze({}) as ReviewMapSourceCollection;
  WORK.set(handle, { boundary, image, path: Object.freeze(image.path.map(entry => entry.node)), routes: reviewMapSequenceRoutes(execution),
    opening: opening === undefined ? undefined : Object.freeze({ ...opening }), events: [], exposures: new Map(),
    sequences: undefined, next: 0, stage: "windows", openingEvents: Object.freeze([]) });
  return handle;
}

function workOf(handle: ReviewMapSourceCollection): SourceWork {
  const state = typeof handle === "object" && handle !== null ? WORK.get(handle) : undefined;
  if (state === undefined) throw new TypeError("Review Map source collection is unknown or retired");
  return state;
}

/** Whole-branch window preparation and opening history are separate indivisible units. */
export function advanceReviewMapSourceCollection(handle: ReviewMapSourceCollection): Readonly<{
  stage: "windows" | "relations" | "opening"; nodeId: string | null;
  completedSubjects: number; totalSubjects: number; complete: boolean;
}> {
  const state = workOf(handle), stage = state.stage;
  if (stage === "complete") throw new TypeError("Review Map source collection has no remaining work");
  try {
    readRecordedReviewBoundary(state.boundary);
    let nodeId: string | null = null;
    if (stage === "windows") {
      if (state.path.length > 1) state.sequences = prepareRecordedSemanticBranchWindows({ run: state.image.run,
        branchId: state.image.request.branchId, throughNodeIds: state.path.slice(1).map(node => node.id), routes: state.routes });
      state.stage = "relations";
    } else if (stage === "relations") {
      const node = state.path[state.next]!; nodeId = node.id;
      if (state.next > 0) {
        const point = collectRelationPoint(state.path, state.next, state.sequences!, state.routes);
        state.events.push(...point.events); state.exposures.set(node.id, point.exposure);
      }
      state.next++;
      if (state.next === state.path.length) state.stage = "opening";
    } else {
      state.openingEvents = collectReviewOpeningEvents(state.image.run, state.image.request.branchId, state.opening);
      state.stage = "complete";
    }
    readRecordedReviewBoundary(state.boundary);
    return Object.freeze({ stage, nodeId, completedSubjects: state.next, totalSubjects: state.path.length, complete: state.stage === "complete" });
  } catch (error) { WORK.delete(handle); throw error; }
}

/** Complete preparation only; no collector or reducer runs during this handoff. */
export function finishReviewMapSourceCollection(handle: ReviewMapSourceCollection): PreparedReviewMapSources {
  const state = workOf(handle);
  if (state.stage !== "complete") throw new TypeError("Review Map source collection is incomplete");
  try {
    readRecordedReviewBoundary(state.boundary);
    const sources = Object.freeze({}) as PreparedReviewMapSources;
    const data = Object.freeze({ boundary: state.boundary, image: state.image, routes: state.routes, opening: state.opening,
      recorded: state.path.length === 1 ? undefined : retainRelations(state.events, state.exposures), openingEvents: state.openingEvents });
    readRecordedReviewBoundary(state.boundary);
    PREPARED.set(sources, data); return sources;
  } finally { WORK.delete(handle); }
}

export function cancelReviewMapSourceCollection(handle: ReviewMapSourceCollection): boolean {
  return typeof handle === "object" && handle !== null && WORK.delete(handle);
}

function sameOpening(left: OpeningCatalogueAvailability | undefined, right: OpeningCatalogueAvailability | undefined): boolean {
  if (left === undefined || right === undefined) return left === right;
  if (left.kind === "unavailable") return right.kind === "unavailable" && left.reason === right.reason;
  return right.kind === "available" && left.source === right.source && left.catalogue === right.catalogue;
}

/** Private compiler reader: a complete frame must retain this exact original boundary/source plan. */
export function readPreparedReviewMapSources(sources: PreparedReviewMapSources, image: BoundaryImage,
  routes: readonly RecordedWindowRoute[], opening: OpeningCatalogueAvailability | undefined): SourceData {
  const data = typeof sources === "object" && sources !== null ? PREPARED.get(sources) : undefined;
  if (data === undefined) throw new TypeError("Review Map sources are not complete original prepared work");
  readRecordedReviewBoundary(data.boundary);
  if (data.image !== image || data.routes.join("\u0000") !== routes.join("\u0000") || !sameOpening(data.opening, opening)) {
    throw new TypeError("Review Map sources cross their original boundary, source plan or opening authority");
  }
  return data;
}
