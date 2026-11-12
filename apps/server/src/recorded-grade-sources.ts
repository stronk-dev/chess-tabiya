// Accepted move-quality-grades §§2a/4a: sole workflow issuer. No provider acquisition.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { RECORDED_GRADE_SOURCE_AUTHORITY } from "../../../packages/runtime/src/recorded-grade-source-authority.js";
import { readRecordedGradeSource, type RecordedGradePermission, type RecordedGradeSource } from "../../../packages/runtime/src/recorded-grade-source.js";
import { readRecordedEngineAttachmentNode } from "../../../packages/runtime/src/internal/recorded-engine-attachments.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { compileEvidenceConsumerExecutionV2 } from "../../../packages/runtime/src/evidence-binding-execution.js";
import { moduleDecisionStamp } from "../../../packages/runtime/src/module-decision.js";
import { prepareRecordedSemanticBranchWindows, RECORDED_SEQUENCE_HORIZONS, type RecordedSemanticWindowPopulation, type RecordedWindowRoute } from "../../../packages/runtime/src/recorded-sequence-window.js";
import { moduleConsumerCeilings } from "../../../packages/runtime/src/module-policy.js";
import { parseFinalizedAssistanceV1 } from "../../../packages/runtime/src/assistance-exchange.js";
import { canonicalRunBytes, createRecordedReviewBoundarySourceOwner, readRecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import type { RecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { advanceRecordedReviewSourceCollection, beginRecordedReviewSourceCollection, cancelRecordedReviewSourceCollection,
  finishRecordedReviewSourceCollection, collectRecordedReviewObjectives, collectRecordedReviewSourcePopulation, captureReviewPointContext,
  readRecordedReviewSourcePopulation, type RecordedReviewSourceCollection, type ReviewSourceContext, type ReviewSubjectEngineInput,
  type ReviewProviderNodeState } from "../../../packages/runtime/src/review-evidence.js";
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
declare const reviewMeasurementCollectionBrand: unique symbol;
export interface ReviewMeasurementCollection { readonly [reviewMeasurementCollectionBrand]: true }
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
interface Workflow extends ContextCaptureInputs {
  readonly permission: RecordedGradePermission;
  readonly sources: Map<string, RecordedGradeSource>;
  readonly windows: Map<string, RecordedSemanticWindowPopulation>;
  state: { readonly kind: "preparing"; readonly endpoints: RecordedEngineEndpointCapture | undefined }
    | { readonly kind: "complete"; readonly endpoints: RecordedEngineEndpoints } | { readonly kind: "retired" };
}
interface ContextCaptureWork {
  readonly workflow: Workflow;
  readonly endpoints: RecordedEngineEndpointCapture;
  complete: boolean;
}
type MeasurementPosition = Parameters<typeof RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue>[0]["rows"][number]["position"];
interface MeasurementWork {
  readonly workflow: Workflow;
  readonly subjects: readonly string[];
  readonly positions: readonly MeasurementPosition[] | undefined;
  readonly admission: RecordedMeasurementAdmission;
  readonly checkCurrent: () => void;
  readonly rows: { position: MeasurementPosition; slots: ReviewLedgerCapture[] }[];
  next: number;
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
  readonly #contexts = new WeakMap<object, Readonly<{ workflow: Workflow; data: Owned }>>();
  readonly #contextCaptures = new WeakMap<object, ContextCaptureWork>();
  readonly #sources = new WeakMap<object, Workflow>();
  readonly #windowPopulations = new WeakMap<AbortSignal, { signature: CurrentSignature; branchId: string; population: ReadonlyMap<string, RecordedSemanticWindowPopulation> }[]>();
  readonly #boundaries: ReturnType<typeof createRecordedReviewBoundarySourceOwner>;
  readonly #endpoints: RecordedEngineEndpointOwner;
  readonly #registry: PackRegistry | undefined;
  readonly #reviewMeasurements = new WeakMap<Workflow, RecordedReviewLedgerSource>();
  readonly #measurementCollections = new WeakMap<object, MeasurementWork>();
  readonly #reviewCollections = new WeakMap<object, { readonly workflow: Workflow; readonly collection: RecordedReviewSourceCollection;
    readonly perSubject: boolean; completed: number; complete: boolean }>();
  constructor(storage: RunStorage, registry: PackRegistry | undefined, coordinator: ReviewEvidenceCoordinator | undefined) {
    this.#registry = registry;
    this.#boundaries = createRecordedReviewBoundarySourceOwner({ loadRun: id => storage.read(id)?.run, loadImportRecord: id => {
      const stored = storage.importedGame?.(id);
      return stored === undefined ? undefined : { runId: stored.runId, result: stored.result, movetextDigest: stored.movetextDigest };
    } });
    this.#endpoints = new RecordedEngineEndpointOwner(registry, coordinator);
  }

  resolve(query: GradeSelection, read: Owned["read"], signal: AbortSignal): RecordedGradeContext {
    const workflow = this.#workflow(this.#contextInputs(query, read, signal));
    try {
      const endpoints = this.#endpoints.capture({ boundary: workflow.boundary, signal });
      return this.#issueContext(workflow, endpoints);
    } catch (error) { workflow.state = { kind: "retired" }; throw error; }
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

  #workflow(input: ContextCaptureInputs): Workflow {
    const current = this.#readContextCapture(input);
    const permission = Object.freeze({ principal: Object.freeze({ ...current.principal }), role: current.role,
      assistance: freeze(structuredClone(current.assistance)), timing: current.timing, session: current.session, execution: input.execution });
    return { ...input, permission, sources: new Map(), windows: new Map(), state: { kind: "preparing", endpoints: undefined } };
  }

  /** Actual workflow checks and complete original boundary precede every source acquisition. */
  beginResolve(query: GradeSelection, read: Owned["read"], signal: AbortSignal): GradeContextCapture {
    const workflow = this.#workflow(this.#contextInputs(query, read, signal));
    const endpoints = this.#endpoints.beginCapture({ boundary: workflow.boundary, signal });
    try {
      workflow.state = { kind: "preparing", endpoints };
      this.#readWorkflow(workflow);
      const handle = Object.freeze({}) as GradeContextCapture;
      this.#contextCaptures.set(handle, { workflow, endpoints, complete: false }); return handle;
    } catch (error) { workflow.state = { kind: "retired" }; this.#endpoints.cancelCapture(endpoints); throw error; }
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

  #readWorkflow(workflow: Workflow): void {
    this.#assertWorkflowActive(workflow);
    this.#readContextCapture(workflow);
    const state = workflow.state;
    if (state.kind === "complete") this.#endpoints.read(state.endpoints);
    else if (state.kind === "preparing" && state.endpoints !== undefined) this.#endpoints.assertCaptureCurrent(state.endpoints);
    this.#assertWorkflowActive(workflow);
    workflow.signal.throwIfAborted();
  }

  #assertWorkflowActive(workflow: Workflow): void {
    if (workflow.state.kind === "retired") return refuse("original workflow is retired");
  }

  /** Current original workflow metadata; never an unfinished context or endpoint aggregate. */
  readPreparation(handle: GradeContextCapture) {
    const { workflow } = this.#contextCapture(handle); this.#readWorkflow(workflow);
    return Object.freeze({ boundary: workflow.boundary, permission: workflow.permission, selection: workflow.selection, signal: workflow.signal });
  }

  advanceResolve(handle: GradeContextCapture) {
    const work = this.#contextCapture(handle);
    if (work.complete) return refuse("context capture has no remaining subject");
    try {
      this.#readWorkflow(work.workflow);
      const progress = this.#endpoints.advanceCapture(work.endpoints);
      this.#readWorkflow(work.workflow);
      work.complete = progress.complete; return progress;
    } catch (error) { this.cancelResolve(handle); throw error; }
  }

  assertCaptureCurrent(handle: GradeContextCapture): void { this.#readWorkflow(this.#contextCapture(handle).workflow); }

  finishResolve(handle: GradeContextCapture): RecordedGradeContext {
    const work = this.#contextCapture(handle);
    if (!work.complete) return refuse("context capture is incomplete");
    try {
      this.#readWorkflow(work.workflow);
      const endpoints = this.#endpoints.finishCapture(work.endpoints);
      return this.#issueContext(work.workflow, endpoints);
    } catch (error) { work.workflow.state = { kind: "retired" }; throw error; }
    finally { this.#contextCaptures.delete(handle); this.#endpoints.cancelCapture(work.endpoints); }
  }

  #issueContext(workflow: Workflow, endpoints: RecordedEngineEndpoints): RecordedGradeContext {
    if (workflow.state.kind !== "preparing") return refuse("original workflow cannot be promoted");
    this.#readContextCapture(workflow);
    if (this.#endpoints.read(endpoints).boundary !== readRecordedReviewBoundary(workflow.boundary)) return refuse("captured endpoints cross their original context boundary");
    // Constructors/source checks may retire their caller. Recheck before ownership transfer.
    if (workflow.state.kind !== "preparing") return refuse("original workflow retired during promotion");
    this.#readContextCapture(workflow);
    this.#assertWorkflowActive(workflow);
    workflow.state = { kind: "complete", endpoints };
    const context = Object.freeze({}) as RecordedGradeContext;
    const data = Object.freeze({ permission: workflow.permission, boundary: workflow.boundary, endpoints, selection: workflow.selection,
      read: workflow.read, signature: workflow.signature, signal: workflow.signal, sources: workflow.sources, windows: workflow.windows });
    this.#contexts.set(context, Object.freeze({ workflow, data }));
    this.read(context); return context;
  }

  cancelResolve(handle: GradeContextCapture): boolean {
    const work = typeof handle === "object" && handle !== null ? this.#contextCaptures.get(handle) : undefined;
    if (work === undefined) return false;
    this.#contextCaptures.delete(handle); work.workflow.state = { kind: "retired" };
    this.#endpoints.cancelCapture(work.endpoints); return true;
  }

  read(context: RecordedGradeContext): Owned {
    const owned = context !== null && typeof context === "object" ? this.#contexts.get(context) : undefined;
    if (owned === undefined) return refuse("foreign context");
    this.#readWorkflow(owned.workflow); return owned.data;
  }

  resolveMove(context: RecordedGradeContext, input: Readonly<{ nodeId: string; signal: AbortSignal }>): RecordedGradeSource {
    const owned = context !== null && typeof context === "object" ? this.#contexts.get(context) : undefined;
    if (owned === undefined) return refuse("foreign context");
    return this.#resolveMove(owned.workflow, input);
  }

  /** Same sole grade issuer, over only the two selections already acquired by this workflow. */
  resolveCapturedMove(handle: GradeContextCapture, input: Readonly<{ nodeId: string; signal: AbortSignal }>): RecordedGradeSource {
    return this.#resolveMove(this.#contextCapture(handle).workflow, input);
  }

  #resolveMove(workflow: Workflow, input: Readonly<{ nodeId: string; signal: AbortSignal }>): RecordedGradeSource {
    if (!exact(input, ["nodeId", "signal"])) return refuse("invalid move request");
    this.#readWorkflow(workflow);
    if (input.signal !== workflow.signal) return refuse("crossed request cancellation");
    const state = workflow.state;
    if (state.kind === "retired" || state.kind === "preparing" && state.endpoints === undefined) return refuse("original selections have not been acquired");
    const pair = state.kind === "complete" ? this.#endpoints.resolveRecordedEnginePair(state.endpoints, input.nodeId)
      : this.#endpoints.capturedPair(state.endpoints!, input.nodeId);
    let source = workflow.sources.get(input.nodeId);
    if (source === undefined) {
      const capture = (nodeId: string) => state.kind === "complete" ? this.#endpoints.nodeCapture(state.endpoints, nodeId)
        : this.#endpoints.capturedNode(state.endpoints!, nodeId);
      source = RECORDED_GRADE_SOURCE_AUTHORITY.issue({ permission: workflow.permission, signal: workflow.signal, edge: pair.edge,
        before: capture(pair.before.position.payload.nodeId), after: capture(pair.after.position.payload.nodeId),
        origins: [pair.before.origin, pair.after.origin] }, () => { this.#readWorkflow(workflow); });
      workflow.sources.set(input.nodeId, source); this.#sources.set(source, workflow);
    }
    const value = this.readSource(source);
    if (value.edge !== pair.edge || value.mover !== pair.mover || canonicalizeJson(value.state) !== canonicalizeJson(pair.state)) return refuse("source differs from the original fixed pair");
    return source;
  }

  readSource(source: RecordedGradeSource) {
    if (!this.#sources.has(source)) return refuse("foreign move source");
    // The original reader invokes the stable workflow's live check before/after source access.
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

  #acquiredRow(workflow: Workflow, nodeId: string) {
    const state = workflow.state;
    if (state.kind === "retired" || state.kind === "preparing" && state.endpoints === undefined) return refuse("original selections have not been acquired");
    const capture = state.kind === "complete" ? this.#endpoints.nodeCapture(state.endpoints, nodeId)
      : this.#endpoints.capturedNode(state.endpoints!, nodeId);
    return readRecordedEngineAttachmentNode(capture.attachments, nodeId).row;
  }

  #modernProvider(row: ReturnType<typeof readRecordedEngineAttachmentNode>["row"], state: ReviewProviderNodeState | undefined) {
    const nodeId = row.position.payload.nodeId;
    state = captureReviewPointContext({ engine: state === undefined ? new Map() : new Map([[nodeId, state]]), shapes: [] }, [{ id: nodeId }]).engine.get(nodeId);
    const selected = row.selected;
    if (selected !== null) {
      if (state?.kind !== "delivered" || canonicalizeJson(state.delivery.payload) !== canonicalizeJson(selected.occurrence.evaluation.payload)) return refuse("Review source context changed its original modern attachment");
      return Object.freeze({ kind: "delivered" as const, delivery: selected.occurrence.evaluation });
    }
    if (state?.kind === "delivered") return refuse("Review source context invented a recorded attachment");
    return state;
  }

  #reviewPopulationInput(context: RecordedGradeContext, input: ReviewSourceContext) {
    const owned = this.read(context);
    if (owned.selection.timing !== "review") return refuse("Review source population requires its own workflow");
    const image = this.#endpoints.read(owned.endpoints), engine = new Map(input.engine);
    for (const row of image.rows) {
      const id = row.position.payload.nodeId, state = this.#modernProvider(row.modern, engine.get(id));
      if (state !== undefined) engine.set(id, state);
    }
    return { boundary: owned.boundary, context: { engine, shapes: input.shapes } };
  }

  beginReviewPopulation(context: RecordedGradeContext, input: ReviewSourceContext): ReviewPopulationCollection {
    const prepared = this.#reviewPopulationInput(context, input);
    return this.#retainPopulation(this.#contexts.get(context)!.workflow, beginRecordedReviewSourceCollection(prepared), false);
  }

  beginCapturedReviewPopulation(handle: GradeContextCapture, input: Readonly<Pick<ReviewSourceContext, "shapes">>): ReviewPopulationCollection {
    if (!exact(input, ["shapes"])) return refuse("Review preparation requires exact shape inputs");
    const { workflow } = this.#contextCapture(handle); this.#readWorkflow(workflow);
    if (workflow.selection.timing !== "review") return refuse("Review source population requires its own workflow");
    return this.#retainPopulation(workflow, beginRecordedReviewSourceCollection({ boundary: workflow.boundary, context: input }), true);
  }

  #retainPopulation(workflow: Workflow, collection: RecordedReviewSourceCollection, perSubject: boolean) {
    try {
      this.#readWorkflow(workflow);
      const handle = Object.freeze({}) as ReviewPopulationCollection;
      this.#reviewCollections.set(handle, { workflow, collection, perSubject, completed: 0, complete: false });
      return handle;
    } catch (error) { cancelRecordedReviewSourceCollection(collection); throw error; }
  }

  #reviewCollection(handle: ReviewPopulationCollection) {
    const state = typeof handle === "object" && handle !== null ? this.#reviewCollections.get(handle) : undefined;
    if (state === undefined) return refuse("Review population work is foreign or retired");
    return state;
  }

  advanceReviewPopulation(handle: ReviewPopulationCollection, input?: ReviewSubjectEngineInput) {
    const state = this.#reviewCollection(handle);
    if (state.complete) return refuse("Review population work has no remaining subject");
    try {
      this.#readWorkflow(state.workflow);
      let acquired = input;
      if (state.perSubject) {
        const nodeId = readRecordedReviewBoundary(state.workflow.boundary).path[state.completed]!.node.id;
        if (!exact(input, ["nodeId", "state"]) || input!.nodeId !== nodeId || input!.state === undefined) return refuse("Review population requires its exact next subject");
        const row = this.#acquiredRow(state.workflow, nodeId);
        acquired = { nodeId, state: this.#modernProvider(row, input!.state ?? undefined) ?? null };
      }
      const progress = advanceRecordedReviewSourceCollection(state.collection, acquired);
      this.#readWorkflow(state.workflow);
      if (this.#reviewCollections.get(handle) !== state) return refuse("Review population retired during acquisition");
      state.completed = progress.completedSubjects; state.complete = progress.complete;
      return progress;
    } catch (error) { this.cancelReviewPopulation(handle); throw error; }
  }

  finishReviewPopulation(handle: ReviewPopulationCollection) {
    const state = this.#reviewCollection(handle);
    if (!state.complete) return refuse("Review population work is incomplete");
    try {
      this.#readWorkflow(state.workflow);
      const population = finishRecordedReviewSourceCollection(state.collection);
      readRecordedReviewSourcePopulation(population); this.#readWorkflow(state.workflow);
      if (this.#reviewCollections.get(handle) !== state) return refuse("Review population retired during publication");
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
    this.read(context); return this.#objectives(this.#contexts.get(context)!.workflow);
  }

  capturedReviewObjectives(handle: GradeContextCapture): RecordedReviewObjectives {
    return this.#objectives(this.#contextCapture(handle).workflow);
  }

  #objectives(workflow: Workflow): RecordedReviewObjectives {
    this.#readWorkflow(workflow);
    if (workflow.selection.timing !== "review") return refuse("objective population requires its own Review workflow");
    const result = (() => {
      try { return collectRecordedReviewObjectives(workflow.boundary); }
      catch (error) {
        if (error instanceof TypeError) return refuse("objective population source contract is invalid");
        throw error;
      }
    })();
    this.#readWorkflow(workflow); return result;
  }

  /** Historical reports remain independent of modern attachments and pending engine requests. */
  reviewMeasurements(context: RecordedGradeContext): RecordedReviewLedgerSource {
    const owned = this.read(context), workflow = this.#contexts.get(context)!.workflow;
    if (owned.selection.timing !== "review") return refuse("ledger population requires its own Review workflow");
    const retained = this.#reviewMeasurements.get(workflow);
    if (retained !== undefined) { readRecordedReviewLedgerSource(retained); return retained; }
    const work = this.#measurementInput(workflow, this.#endpoints.read(owned.endpoints).rows.map(row => row.position));
    // Original synchronous order: all original positions were captured by the complete owner.
    for (const position of work.positions!) work.rows.push({ position,
      slots: REVIEW_LEDGER_REFS.map(projection => this.#measurementSlot(work, position, projection)) });
    work.next = work.subjects.length * REVIEW_LEDGER_REFS.length;
    return this.#finishMeasurements(work);
  }

  #measurementInput(workflow: Workflow, positions?: readonly MeasurementPosition[]): MeasurementWork {
    if (workflow.selection.timing !== "review") return refuse("ledger population requires its own Review workflow");
    const image = readRecordedReviewBoundary(workflow.boundary), registry = this.#registry;
    const admit = (): RecordedMeasurementAdmission => {
      if (registry === undefined || image.run.sessionKind !== "pack") return Object.freeze({ kind: "unavailable", reason: "source_absent" });
      try { return registry.resolveRecordedMeasurementSource(image.run.packDigest!); }
      catch (error) { return Object.freeze({ kind: "failed", reason: error instanceof TypeError ? "source_contract_invalid" : "source_lookup_failed" }); }
    };
    const admission = admit(), retained = this.#reviewMeasurements.get(workflow);
    if (retained !== undefined) readRecordedReviewLedgerSource(retained);
    const checkCurrent = () => {
      this.#readWorkflow(workflow);
      const actual = admit();
      if (actual.kind !== admission.kind || (actual.kind === "available" && admission.kind === "available"
        ? actual.source !== admission.source : "reason" in actual && "reason" in admission && actual.reason !== admission.reason)) return refuse("Review ledger artifact admission changed");
    };
    return { workflow, subjects: Object.freeze(image.path.map(entry => entry.node.id)),
      positions: positions === undefined ? undefined : Object.freeze([...positions]), admission, checkCurrent, rows: [], next: 0 };
  }

  #measurementSlot(work: MeasurementWork, position: MeasurementPosition, projection: typeof REVIEW_LEDGER_REFS[number]): ReviewLedgerCapture {
    work.workflow.signal.throwIfAborted();
    if (work.admission.kind !== "available") return { projection, source: work.admission };
    try {
      const population = this.#registry!.collectRecordedMeasurements({ source: work.admission.source, position, projection });
      return { projection, source: { kind: "population", read: () => this.#registry!.readRecordedMeasurements(population) } };
    } catch (error) {
      return { projection, source: { kind: "failed", reason: error instanceof RecordedMeasurementSourceError ? error.reason
        : error instanceof TypeError ? "source_contract_invalid" : "source_lookup_failed" } };
    }
  }

  #finishMeasurements(work: MeasurementWork, assertOwned: () => void = () => {}): RecordedReviewLedgerSource {
    if (work.next !== work.subjects.length * REVIEW_LEDGER_REFS.length) return refuse("Review ledger collection is incomplete");
    const source = RECORDED_REVIEW_LEDGER_SOURCE_AUTHORITY.issue({ boundary: work.workflow.boundary, permission: work.workflow.permission,
      signal: work.workflow.signal, rows: work.rows }, work.checkCurrent);
    assertOwned(); this.#reviewMeasurements.set(work.workflow, source); return source;
  }

  /** Complete callers retain their original position image and synchronous ordering. */
  beginReviewMeasurements(context: RecordedGradeContext): ReviewMeasurementCollection {
    const owned = this.read(context), workflow = this.#contexts.get(context)!.workflow;
    return this.#retainMeasurements(this.#measurementInput(workflow, this.#endpoints.read(owned.endpoints).rows.map(row => row.position)));
  }

  /** Metadata/admission only; each position comes from its original acquired endpoint later. */
  beginCapturedReviewMeasurements(handle: GradeContextCapture): ReviewMeasurementCollection {
    const { workflow } = this.#contextCapture(handle); this.#readWorkflow(workflow);
    return this.#retainMeasurements(this.#measurementInput(workflow));
  }

  #retainMeasurements(work: MeasurementWork) {
    work.checkCurrent();
    const handle = Object.freeze({}) as ReviewMeasurementCollection;
    this.#measurementCollections.set(handle, work); return handle;
  }

  #measurementWork(handle: ReviewMeasurementCollection): MeasurementWork {
    const work = typeof handle === "object" && handle !== null ? this.#measurementCollections.get(handle) : undefined;
    if (work === undefined) return refuse("Review ledger collection is foreign or retired");
    return work;
  }

  assertReviewMeasurementsCurrent(handle: ReviewMeasurementCollection): void { this.#measurementWork(handle).checkCurrent(); }

  /** One original projection at one original position, so the job can check each source cap. */
  advanceReviewMeasurements(handle: ReviewMeasurementCollection): Readonly<{
    nodeId: string; projection: typeof REVIEW_LEDGER_REFS[number]; completedSubjects: number; totalSubjects: number; complete: boolean;
  }> {
    const work = this.#measurementWork(handle), width = REVIEW_LEDGER_REFS.length;
    if (work.next === work.subjects.length * width) return refuse("Review ledger collection has no remaining source");
    try {
      work.checkCurrent();
      const index = Math.floor(work.next / width), projection = REVIEW_LEDGER_REFS[work.next % width]!, position = work.rows[index]?.position ?? work.positions?.[index] ?? this.#acquiredRow(work.workflow, work.subjects[index]!).position;
      const slot = this.#measurementSlot(work, position, projection);
      if (work.next % width === 0) work.rows.push({ position, slots: [] });
      work.rows[index]!.slots.push(slot); work.next++;
      work.checkCurrent();
      if (this.#measurementCollections.get(handle) !== work) return refuse("Review ledger retired during acquisition");
      return Object.freeze({ nodeId: position.payload.nodeId, projection, completedSubjects: Math.floor(work.next / width),
        totalSubjects: work.subjects.length, complete: work.next === work.subjects.length * width });
    } catch (error) { this.#measurementCollections.delete(handle); throw error; }
  }

  finishReviewMeasurements(handle: ReviewMeasurementCollection): RecordedReviewLedgerSource {
    const work = this.#measurementWork(handle);
    if (work.next !== work.subjects.length * REVIEW_LEDGER_REFS.length) return refuse("Review ledger collection is incomplete");
    try { return this.#finishMeasurements(work, () => {
      if (this.#measurementCollections.get(handle) !== work) return refuse("Review ledger retired during publication");
    }); }
    finally { this.#measurementCollections.delete(handle); }
  }

  cancelReviewMeasurements(handle: ReviewMeasurementCollection): boolean {
    return typeof handle === "object" && handle !== null && this.#measurementCollections.delete(handle);
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
