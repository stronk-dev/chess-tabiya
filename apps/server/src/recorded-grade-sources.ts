// Accepted move-quality-grades §§2a/4a: sole workflow issuer. No provider acquisition.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { RECORDED_GRADE_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-grade-source-authority.js";
import { readRecordedGradeSource, type RecordedGradePermission, type RecordedGradeSource } from "../../../packages/runtime/src/recorded-grade-source.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { compileEvidenceConsumerExecutionV2 } from "../../../packages/runtime/src/evidence-binding-execution.js";
import { moduleDecisionStamp } from "../../../packages/runtime/src/module-decision.js";
import { prepareRecordedSemanticBranchWindows, RECORDED_SEQUENCE_HORIZONS, type RecordedSemanticWindowPopulation, type RecordedWindowRoute } from "../../../packages/runtime/src/recorded-sequence-window.js";
import { moduleConsumerCeilings } from "../../../packages/runtime/src/module-policy.js";
import { parseFinalizedAssistanceV1 } from "../../../packages/runtime/src/assistance-exchange.js";
import { canonicalRunBytes, createRecordedReviewBoundarySourceOwner, readRecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import type { RecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { advanceRecordedReviewSourceCollection, beginRecordedReviewSourceCollection, cancelRecordedReviewSourceCollection,
  finishRecordedReviewSourceCollection, collectRecordedReviewObjectives, collectRecordedReviewSourcePopulation,
  readRecordedReviewSourcePopulation, type RecordedReviewSourceCollection, type ReviewSourceContext } from "../../../packages/runtime/src/review-evidence.js";
import type { DrillRun } from "../../../packages/runtime/src/types.js";
import { RecordedEngineEndpointOwner, type RecordedEngineEndpoints, type RecordedEngineEndpointCapture } from "./recorded-engine-endpoints.js";
import type { RunService } from "./service.js";
import type { RunStorage } from "./storage.js";
import type { PackRegistry } from "./pack-registry.js";
import type { ReviewEvidenceCoordinator } from "./review-evidence.js";
import { RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY, REVIEW_LEDGER_REFS, readRecordedReviewLedgerSource, type RecordedReviewLedgerSource, type ReviewLedgerCapture } from "../../../packages/runtime/src/recorded-review-ledger.js";
import { RecordedMeasurementSourceError, type RecordedMeasurementAdmission } from "./pack-registry.js";
import type { RecordedReviewObjectives } from "../../../packages/runtime/src/evidence-factories.js";

export interface GradeCurrentState extends Omit<RecordedGradePermission, "execution"> {
  readonly run: DrillRun;
  readonly access: ReturnType<RunService["assistanceAuthority"]>;
}
export interface GradeSelection {
  readonly branchId: string;
  readonly throughNodeId: string;
  readonly decisionDigest: string;
  readonly timing: "post_commit" | "review";
}
declare const recordedGradeContextBrand: unique symbol;
export interface RecordedGradeContext { readonly [recordedGradeContextBrand]: true }
declare const gradeContextCaptureBrand: unique symbol;
export interface GradeContextCapture { readonly [gradeContextCaptureBrand]: true }
declare const reviewPopulationCollectionBrand: unique symbol;
/** Service-owned work: never a runtime source handle, grant or wire value. */
export interface ReviewPopulationCollection { readonly [reviewPopulationCollectionBrand]: true }
interface Owned {
  readonly boundary: RecordedReviewBoundary;
  readonly permission: RecordedGradePermission;
  readonly endpoints: RecordedEngineEndpoints;
  readonly selection: GradeSelection;
  readonly read: () => GradeCurrentState;
  readonly signature: CurrentSignature;
  readonly signal: AbortSignal;
  readonly sources: Map<string, RecordedGradeSource>;
  readonly windows: Map<string, RecordedSemanticWindowPopulation>;
}
interface ContextCaptureInputs {
  readonly boundary: RecordedReviewBoundary;
  readonly execution: RecordedGradePermission["execution"];
  readonly selection: GradeSelection;
  readonly read: Owned["read"];
  readonly signature: CurrentSignature;
  readonly signal: AbortSignal;
}
interface ContextCaptureWork extends ContextCaptureInputs {
  readonly endpoints: RecordedEngineEndpointCapture;
  complete: boolean;
}
export class RecordedGradeContextError extends TypeError {
  constructor(readonly reason: "permission_withheld" | "source_contract_invalid", message: string) {
    super(`Grade context: ${message}`); this.name = "RecordedGradeContextError";
  }
}
const refuse = (message: string): never => { throw new RecordedGradeContextError("source_contract_invalid", message); };
const exact = (input: unknown, keys: readonly string[]) => input !== null && typeof input === "object"
  && Object.getPrototypeOf(input) === Object.prototype && Reflect.ownKeys(input).length === keys.length
  && keys.every(key => { const field = Object.getOwnPropertyDescriptor(input, key); return field?.enumerable && "value" in field; });
interface CurrentSignature { readonly runBytes: string; readonly permissionBytes: string }
function currentSignature(state: GradeCurrentState): CurrentSignature {
  const { run, ...permission } = state;
  // Only the existing immutable JSON serialization is reusable. Every call still derives actual
  // storage, access, role, disclosure and pending-source state; none of those decisions is cached.
  return { runBytes: canonicalRunBytes(run), permissionBytes: canonicalizeJson(permission) };
}
const sameSignature = (left: CurrentSignature, right: CurrentSignature) => left.runBytes === right.runBytes && left.permissionBytes === right.permissionBytes;

/** One per RunService. Storage/access callbacks cannot be passed to a runtime factory. */
export class RecordedGradeSourceOwner {
  readonly #contexts = new WeakMap<object, Owned>();
  readonly #contextCaptures = new WeakMap<object, ContextCaptureWork>();
  readonly #sources = new WeakMap<object, RecordedGradeContext>();
  readonly #windowPopulations = new WeakMap<AbortSignal, { signature: CurrentSignature; branchId: string; population: ReadonlyMap<string, RecordedSemanticWindowPopulation> }[]>();
  readonly #boundaries: ReturnType<typeof createRecordedReviewBoundarySourceOwner>;
  readonly #endpoints: RecordedEngineEndpointOwner;
  readonly #registry: PackRegistry | undefined;
  readonly #reviewMeasurements = new WeakMap<RecordedGradeContext, RecordedReviewLedgerSource>();
  readonly #reviewCollections = new WeakMap<object, { readonly context: RecordedGradeContext; readonly collection: RecordedReviewSourceCollection; complete: boolean }>();
  constructor(storage: RunStorage, registry: PackRegistry | undefined, coordinator: ReviewEvidenceCoordinator | undefined) {
    this.#registry = registry;
    this.#boundaries = createRecordedReviewBoundarySourceOwner({ loadRun: id => storage.read(id)?.run, loadImportRecord: id => {
      const stored = storage.importedGame?.(id);
      return stored === undefined ? undefined : { runId: stored.runId, result: stored.result, movetextDigest: stored.movetextDigest };
    } });
    this.#endpoints = new RecordedEngineEndpointOwner(registry, coordinator);
  }

  resolve(query: GradeSelection, read: Owned["read"], signal: AbortSignal): RecordedGradeContext {
    const input = this.#contextInputs(query, read, signal);
    const endpoints = this.#endpoints.capture({ boundary: input.boundary, signal });
    return this.#issueContext(input, endpoints);
  }

  #contextInputs(query: GradeSelection, read: Owned["read"], signal: AbortSignal): ContextCaptureInputs {
    if (!exact(query, ["branchId", "throughNodeId", "decisionDigest", "timing"])) return refuse("invalid selection");
    signal.throwIfAborted();
    const first = read(); this.#permitted(first);
    if (moduleDecisionStamp(first.run).digest !== query.decisionDigest || first.timing !== query.timing) return refuse("stale decision/timing");
    const signature = currentSignature(first), module = first.timing === "post_commit" ? "postcommit_nudge" : "review_map";
    // The complete actual consumer, before graph collection, registry reads or source work.
    // No @1 fallback while the coordinated @2 consumer migration is still in flight.
    const execution = compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: `module.${module}`, version: 2 });
    const boundary = this.#boundaries.resolve({ runId: first.run.id, branchId: query.branchId, throughNodeId: query.throughNodeId });
    return { boundary, execution, selection: Object.freeze({ ...query }), read, signature, signal };
  }

  /** Actual workflow checks and complete original boundary precede every source acquisition. */
  beginResolve(query: GradeSelection, read: Owned["read"], signal: AbortSignal): GradeContextCapture {
    const input = this.#contextInputs(query, read, signal);
    const endpoints = this.#endpoints.beginCapture({ boundary: input.boundary, signal });
    const work: ContextCaptureWork = { ...input, endpoints, complete: false };
    try {
      this.#readContextCapture(work);
      const handle = Object.freeze({}) as GradeContextCapture;
      this.#contextCaptures.set(handle, work); return handle;
    } catch (error) { this.#endpoints.cancelCapture(endpoints); throw error; }
  }

  #contextCapture(handle: GradeContextCapture): ContextCaptureWork {
    const work = typeof handle === "object" && handle !== null ? this.#contextCaptures.get(handle) : undefined;
    if (work === undefined) return refuse("context capture is foreign or retired");
    return work;
  }

  #readContextCapture(work: ContextCaptureInputs): GradeCurrentState {
    work.signal.throwIfAborted();
    const current = work.read(); this.#permitted(current);
    if (!sameSignature(currentSignature(current), work.signature)) return refuse("current permission or stored run changed during capture");
    this.#boundaries.assertCurrent(work.boundary);
    work.signal.throwIfAborted(); return current;
  }

  advanceResolve(handle: GradeContextCapture) {
    const work = this.#contextCapture(handle);
    if (work.complete) return refuse("context capture has no remaining subject");
    try {
      this.#readContextCapture(work);
      const progress = this.#endpoints.advanceCapture(work.endpoints);
      this.#readContextCapture(work);
      work.complete = progress.complete; return progress;
    } catch (error) { this.cancelResolve(handle); throw error; }
  }

  finishResolve(handle: GradeContextCapture): RecordedGradeContext {
    const work = this.#contextCapture(handle);
    if (!work.complete) return refuse("context capture is incomplete");
    try {
      this.#readContextCapture(work);
      const endpoints = this.#endpoints.finishCapture(work.endpoints);
      return this.#issueContext(work, endpoints);
    } finally { this.cancelResolve(handle); }
  }

  #issueContext(work: ContextCaptureInputs, endpoints: RecordedEngineEndpoints): RecordedGradeContext {
    const current = this.#readContextCapture(work);
    if (this.#endpoints.read(endpoints).boundary !== readRecordedReviewBoundary(work.boundary)) return refuse("captured endpoints cross their original context boundary");
    const permission = Object.freeze({ principal: Object.freeze({ ...current.principal }), role: current.role,
      assistance: freeze(structuredClone(current.assistance)), timing: current.timing, session: current.session, execution: work.execution });
    const context = Object.freeze({}) as RecordedGradeContext;
    this.#contexts.set(context, Object.freeze({ permission, boundary: work.boundary, endpoints, selection: work.selection,
      read: work.read, signature: work.signature, signal: work.signal, sources: new Map<string, RecordedGradeSource>(), windows: new Map<string, RecordedSemanticWindowPopulation>() }));
    this.read(context); return context;
  }

  cancelResolve(handle: GradeContextCapture): boolean {
    const work = typeof handle === "object" && handle !== null ? this.#contextCaptures.get(handle) : undefined;
    if (work === undefined) return false;
    this.#contextCaptures.delete(handle); this.#endpoints.cancelCapture(work.endpoints); return true;
  }

  read(context: RecordedGradeContext): Owned {
    const owned = context !== null && typeof context === "object" ? this.#contexts.get(context) : undefined;
    if (owned === undefined) return refuse("foreign context");
    owned.signal.throwIfAborted();
    const current = owned.read(); this.#permitted(current);
    if (!sameSignature(currentSignature(current), owned.signature)) return refuse("current permission or stored run changed");
    this.#endpoints.read(owned.endpoints);
    owned.signal.throwIfAborted(); return owned;
  }

  resolveMove(context: RecordedGradeContext, input: Readonly<{ nodeId: string; signal: AbortSignal }>): RecordedGradeSource {
    if (!exact(input, ["nodeId", "signal"])) return refuse("invalid move request");
    const owned = this.read(context);
    if (input.signal !== owned.signal) return refuse("crossed request cancellation");
    const pair = this.#endpoints.resolveRecordedEnginePair(owned.endpoints, input.nodeId);
    let source = owned.sources.get(input.nodeId);
    if (source === undefined) {
      source = RECORDED_GRADE_SOURCE_AUTHORITY.issue({ permission: owned.permission, signal: owned.signal, edge: pair.edge,
        before: this.#endpoints.nodeCapture(owned.endpoints, pair.before.position.payload.nodeId),
        after: this.#endpoints.nodeCapture(owned.endpoints, pair.after.position.payload.nodeId),
        origins: [pair.before.origin, pair.after.origin] }, () => { this.read(context); });
      owned.sources.set(input.nodeId, source); this.#sources.set(source, context);
    }
    const value = this.readSource(source);
    if (value.edge !== pair.edge || value.mover !== pair.mover || canonicalizeJson(value.state) !== canonicalizeJson(pair.state)) return refuse("source differs from the original fixed pair");
    return source;
  }

  readSource(source: RecordedGradeSource) {
    const context = this.#sources.get(source);
    if (context === undefined) return refuse("foreign move source");
    // The shared reader invokes this owner's original context check before and after reading.
    // Keep issuer membership here; do not duplicate the same live checks around that reader.
    return readRecordedGradeSource(source);
  }

  reviewSources(context: RecordedGradeContext) {
    const owned = this.read(context);
    if (owned.selection.timing !== "review") return refuse("whole Review requires its own workflow");
    const path = this.#endpoints.read(owned.endpoints).boundary.path;
    const grades = new Map(path.slice(1).map(({ node }) => [node.id, this.resolveMove(context, { nodeId: node.id, signal: owned.signal })]));
    this.read(context); return grades as ReadonlyMap<string, RecordedGradeSource>;
  }

  reviewPopulation(context: RecordedGradeContext, input: ReviewSourceContext) {
    const prepared = this.#reviewPopulationInput(context, input);
    const population = collectRecordedReviewSourcePopulation(prepared);
    readRecordedReviewSourcePopulation(population); this.read(context); return population;
  }

  #reviewPopulationInput(context: RecordedGradeContext, input: ReviewSourceContext) {
    const owned = this.read(context);
    if (owned.selection.timing !== "review") return refuse("Review source population requires its own workflow");
    const image = this.#endpoints.read(owned.endpoints), engine = new Map(input.engine);
    for (const row of image.rows) {
      const id = row.position.payload.nodeId, state = engine.get(id), selected = row.modern.selected;
      if (selected !== null) {
        if (state?.kind !== "delivered" || canonicalizeJson(state.delivery.payload) !== canonicalizeJson(selected.occurrence.evaluation.payload)) return refuse("Review source context changed its original modern attachment");
        engine.set(id, Object.freeze({ kind: "delivered", delivery: selected.occurrence.evaluation }));
      } else if (state?.kind === "delivered") return refuse("Review source context invented a recorded attachment");
    }
    return { boundary: owned.boundary, context: { engine, shapes: input.shapes } };
  }

  beginReviewPopulation(context: RecordedGradeContext, input: ReviewSourceContext): ReviewPopulationCollection {
    const prepared = this.#reviewPopulationInput(context, input);
    const collection = beginRecordedReviewSourceCollection(prepared);
    try {
      this.read(context);
      const handle = Object.freeze({}) as ReviewPopulationCollection;
      this.#reviewCollections.set(handle, { context, collection, complete: false });
      return handle;
    } catch (error) { cancelRecordedReviewSourceCollection(collection); throw error; }
  }

  #reviewCollection(handle: ReviewPopulationCollection) {
    const state = typeof handle === "object" && handle !== null ? this.#reviewCollections.get(handle) : undefined;
    if (state === undefined) return refuse("Review population work is foreign or retired");
    return state;
  }

  advanceReviewPopulation(handle: ReviewPopulationCollection) {
    const state = this.#reviewCollection(handle);
    if (state.complete) return refuse("Review population work has no remaining subject");
    try {
      this.read(state.context);
      const progress = advanceRecordedReviewSourceCollection(state.collection);
      this.read(state.context);
      state.complete = progress.complete;
      return progress;
    } catch (error) { this.cancelReviewPopulation(handle); throw error; }
  }

  finishReviewPopulation(handle: ReviewPopulationCollection) {
    const state = this.#reviewCollection(handle);
    if (!state.complete) return refuse("Review population work is incomplete");
    try {
      this.read(state.context);
      const population = finishRecordedReviewSourceCollection(state.collection);
      readRecordedReviewSourcePopulation(population); this.read(state.context);
      return population;
    } finally { this.cancelReviewPopulation(handle); }
  }

  cancelReviewPopulation(handle: ReviewPopulationCollection): boolean {
    const state = typeof handle === "object" && handle !== null ? this.#reviewCollections.get(handle) : undefined;
    if (state === undefined) return false;
    this.#reviewCollections.delete(handle);
    cancelRecordedReviewSourceCollection(state.collection);
    return true;
  }

  /** Single-line recorded facts, owned by this current Review workflow, not a fabricated Compare. */
  reviewObjectives(context: RecordedGradeContext): RecordedReviewObjectives {
    const owned = this.read(context);
    if (owned.selection.timing !== "review") return refuse("objective population requires its own Review workflow");
    const result = (() => {
      try {
        return collectRecordedReviewObjectives(owned.boundary);
      } catch (error) {
        if (error instanceof TypeError) return refuse("objective population source contract is invalid");
        throw error;
      }
    })();
    this.read(context);
    return result;
  }

  /** Review owns this acquisition independently of the fixed engine endpoint selection. A modern
   * attachment or a pending provider job must not suppress the pinned historical reports. */
  reviewMeasurements(context: RecordedGradeContext): RecordedReviewLedgerSource {
    const owned = this.read(context);
    if (owned.selection.timing !== "review") return refuse("ledger population requires its own Review workflow");
    const retained = this.#reviewMeasurements.get(context);
    if (retained !== undefined) { readRecordedReviewLedgerSource(retained); return retained; }
    const image = this.#endpoints.read(owned.endpoints), registry = this.#registry;
    const admit = (): RecordedMeasurementAdmission => {
      if (registry === undefined || image.boundary.run.sessionKind !== "pack") return Object.freeze({ kind: "unavailable", reason: "source_absent" });
      try { return registry.resolveRecordedMeasurementSource(image.boundary.run.packDigest!); }
      catch (error) { return Object.freeze({ kind: "failed", reason: error instanceof TypeError ? "source_contract_invalid" : "source_lookup_failed" }); }
    };
    const admission = admit();
    const checkCurrent = () => {
      this.read(context);
      const actual = admit();
      if (actual.kind !== admission.kind || (actual.kind === "available" && admission.kind === "available"
        ? actual.source !== admission.source : "reason" in actual && "reason" in admission && actual.reason !== admission.reason)) return refuse("Review ledger artifact admission changed");
    };
    const rows = image.rows.map(({ position }) => ({ position, slots: REVIEW_LEDGER_REFS.map((projection): ReviewLedgerCapture => {
      owned.signal.throwIfAborted();
      if (admission.kind !== "available") return { projection, source: admission };
      try {
        const population = registry!.collectRecordedMeasurements({ source: admission.source, position, projection });
        return { projection, source: { kind: "population", read: () => registry!.readRecordedMeasurements(population) } };
      } catch (error) {
        return { projection, source: { kind: "failed", reason: error instanceof RecordedMeasurementSourceError ? error.reason
          : error instanceof TypeError ? "source_contract_invalid" : "source_lookup_failed" } };
      }
    }) }));
    const source = RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue({ boundary: owned.boundary, permission: owned.permission,
      signal: owned.signal, rows }, checkCurrent);
    this.#reviewMeasurements.set(context, source); return source;
  }

  postcommitSources(context: RecordedGradeContext) {
    const owned = this.read(context);
    if (owned.selection.timing !== "post_commit") return refuse("recorded Nudge windows require their own workflow");
    const grade = this.resolveMove(context, { nodeId: owned.selection.throughNodeId, signal: owned.signal });
    let windows = owned.windows.get(owned.selection.throughNodeId);
    if (windows === undefined) {
      const routes = owned.permission.execution.bindings.map(({ binding }) => `${binding.projection.id}@${binding.projection.version}`)
        .filter((route): route is RecordedWindowRoute => route === "derived.exchange.trade_completed@2" || Object.hasOwn(RECORDED_SEQUENCE_HORIZONS, route));
      if (routes.length !== 9) return refuse("Nudge lost its complete nine-family sequence image");
      const boundary = this.#endpoints.read(owned.endpoints).boundary, id = owned.selection.throughNodeId;
      const populations = this.#windowPopulations.get(owned.signal) ?? [];
      let population = populations.find(row => sameSignature(row.signature, owned.signature) && row.branchId === owned.selection.branchId && row.population.has(id))?.population;
      if (population === undefined) {
        // The exact current learner subject plus the existing three earlier learner decisions,
        // not three plies or a later automatic reply. Own ancestor grants still govern grading
        // and publication; this memo shares only their overlapping immutable source preparation.
        const endpoints = boundary.path.filter((entry, index) => index > 0 && entry.node.actor === "user"
          && (boundary.path[index - 1]!.node.fen.split(" ")[1] === "w" ? "white" : "black") === boundary.learnerSide)
          .slice(-4).map(entry => entry.node.id);
        if (endpoints.at(-1) !== id) return refuse("Nudge window endpoint is not the actual learner decision");
        population = prepareRecordedSemanticBranchWindows({ run: boundary.run, branchId: owned.selection.branchId, throughNodeIds: endpoints, routes });
        populations.push({ signature: owned.signature, branchId: owned.selection.branchId, population });
        this.#windowPopulations.set(owned.signal, populations);
      }
      windows = population.get(id)!;
      owned.windows.set(owned.selection.throughNodeId, windows);
    }
    this.read(context); return Object.freeze({ grade, windows });
  }

  #permitted(state: GradeCurrentState) {
    if (state.assistance !== null) parseFinalizedAssistanceV1(state.assistance);
    const module = state.timing === "post_commit" ? "postcommit_nudge" : "review_map", policy = moduleConsumerCeilings(module);
    if (!policy.roles.includes(state.role) || !policy.sessions.includes(state.session) || !state.access.access.deliveryOpen
      || (state.assistance === null ? state.timing !== "review" : !state.assistance.modules.includes(module) || !state.assistance.effects.some(effect => effect.moduleId === module
        && effect.timing === state.timing && effect.subSurface === undefined))) throw new RecordedGradeContextError("permission_withheld", "current workflow permission is withheld");
  }
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
