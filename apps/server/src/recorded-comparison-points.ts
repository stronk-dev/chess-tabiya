// Sole production issuer of runtime-owned Compare point handles. No provider acquisition.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { RECORDED_COMPARISON_POINT_AUTHORITY } from "../../../packages/runtime/src/recorded-comparison-point-authority.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { compileEvidenceConsumerExecutionV2 } from "../../../packages/runtime/src/evidence-binding-execution.js";
import { moduleDecisionStamp } from "../../../packages/runtime/src/module-decision.js";
import { modulePolicy } from "../../../packages/runtime/src/module-policy.js";
import { createRecordedComparisonSource, recordedComparisonData, recordedComparisonColumnsForSubject, type RecordedComparisonSource } from "../../../packages/runtime/src/recorded-comparison.js";
import { readRecordedComparisonPointSource, type RecordedComparisonPermission, type RecordedComparisonPointSource } from "../../../packages/runtime/src/recorded-comparison-point.js";
import { createRecordedReviewBoundarySourceOwner } from "../../../packages/runtime/src/recorded-review-boundary.js";
import type { DrillRun } from "../../../packages/runtime/src/types.js";
import { RecordedEngineEndpointOwner, type RecordedEngineEndpoints } from "./recorded-engine-endpoints.js";
import type { RunService } from "./service.js";
import type { RunStorage } from "./storage.js";
import type { PackRegistry } from "./pack-registry.js";
import type { ReviewEvidenceCoordinator } from "./review-evidence.js";

export interface ComparisonCurrentState extends Omit<RecordedComparisonPermission, "execution"> {
  readonly run: DrillRun;
  readonly access: ReturnType<RunService["assistanceAuthority"]>;
}
export interface ComparisonSelection { readonly nodeId: string; readonly decisionDigest: string; readonly timing: "checkpoint" | "review" }
declare const comparisonContextBrand: unique symbol;
export interface RecordedComparisonContext { readonly [comparisonContextBrand]: true }
type Columns = readonly [{ readonly branchId: string; readonly throughNodeId: string }, { readonly branchId: string; readonly throughNodeId: string }];
interface Owned {
  readonly comparison: RecordedComparisonSource;
  readonly permission: RecordedComparisonPermission;
  readonly endpoints: RecordedEngineEndpoints;
  readonly columns: Columns;
  readonly read: (columns?: Columns) => ComparisonCurrentState;
  readonly signature: string;
  readonly signal: AbortSignal;
}
export class RecordedComparisonContextError extends TypeError {
  constructor(readonly reason: "permission_withheld" | "source_contract_invalid", message: string) {
    super(`Compare context: ${message}`); this.name = "RecordedComparisonContextError";
  }
}
const refuse = (message: string): never => { throw new RecordedComparisonContextError("source_contract_invalid", message); };

/** One per RunService. Storage/access callbacks stay here, never enter a runtime mint. */
export class RecordedComparisonPointOwner {
  readonly #contexts = new WeakMap<object, Owned>();
  readonly #points = new WeakMap<object, RecordedComparisonContext>();
  readonly #boundaries: ReturnType<typeof createRecordedReviewBoundarySourceOwner>;
  readonly #endpoints: RecordedEngineEndpointOwner;
  constructor(storage: RunStorage, registry: PackRegistry | undefined, coordinator: ReviewEvidenceCoordinator | undefined) {
    this.#boundaries = createRecordedReviewBoundarySourceOwner({ loadRun: id => storage.read(id)?.run, loadImportRecord: id => {
      const stored = storage.importedGame?.(id);
      return stored === undefined ? undefined : { runId: stored.runId, result: stored.result, movetextDigest: stored.movetextDigest };
    } });
    this.#endpoints = new RecordedEngineEndpointOwner(registry, coordinator);
  }
  resolve(query: ComparisonSelection, read: Owned["read"], signal: AbortSignal): RecordedComparisonContext | undefined {
    signal.throwIfAborted();
    const first = read(); this.#permitted(first);
    const signature = canonicalizeJson(first);
    if (moduleDecisionStamp(first.run).digest !== query.decisionDigest || first.timing !== query.timing) return refuse("stale decision/timing");
    // Complete preflight precedes graph collection, registry/cache reads and source factories.
    const execution = compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.compare_coach", version: 2 });
    const columns = recordedComparisonColumnsForSubject(first.run, query.nodeId);
    if (columns === undefined) return undefined;
    const peer = columns[1].branchId;
    const current = read(columns); this.#permitted(current);
    if (canonicalizeJson(current) !== signature) return refuse("decision changed while granting both attempts");
    const comparison = createRecordedComparisonSource({ run: current.run, columns });
    const boundary = this.#boundaries.resolve({ runId: current.run.id, branchId: peer, throughNodeId: columns[1].throughNodeId });
    const endpoints = this.#endpoints.capture({ boundary, signal });
    const permission = Object.freeze({ principal: Object.freeze({ ...current.principal }), role: current.role,
      assistance: freeze(structuredClone(current.assistance)), timing: current.timing, execution });
    const context = Object.freeze({}) as RecordedComparisonContext;
    this.#contexts.set(context, Object.freeze({ comparison, permission, endpoints, columns, read, signature, signal }));
    this.read(context); return context;
  }
  read(context: RecordedComparisonContext): Owned {
    const owned = context !== null && typeof context === "object" ? this.#contexts.get(context) : undefined;
    if (owned === undefined) return refuse("foreign context");
    owned.signal.throwIfAborted();
    const current = owned.read(owned.columns); this.#permitted(current);
    if (canonicalizeJson(current) !== owned.signature) return refuse("current permission or stored run changed");
    this.#endpoints.read(owned.endpoints);
    owned.signal.throwIfAborted(); return owned;
  }
  resolvePoint(context: RecordedComparisonContext, input: Readonly<{ comparison: RecordedComparisonSource; nodeId: string; signal: AbortSignal }>): RecordedComparisonPointSource {
    if (input === null || typeof input !== "object" || Object.getPrototypeOf(input) !== Object.prototype || Reflect.ownKeys(input).length !== 3
      || !["comparison", "nodeId", "signal"].every(key => { const field = Object.getOwnPropertyDescriptor(input, key); return field?.enumerable && "value" in field; })) return refuse("invalid point request");
    const owned = this.read(context);
    if (input.comparison !== owned.comparison || input.signal !== owned.signal) return refuse("crossed comparison/request");
    const capture = this.#endpoints.comparisonPointCapture(owned.endpoints, input.nodeId);
    const source = RECORDED_COMPARISON_POINT_AUTHORITY.issue({ ...capture, comparison: owned.comparison,
      branchId: owned.columns[1].branchId, nodeId: input.nodeId, permission: owned.permission, signal: owned.signal });
    this.#points.set(source, context);
    const value = this.readPoint(source), selected = this.#endpoints.resolveRecordedEngineEndpoint(owned.endpoints, input.nodeId).state;
    if (selected.kind === "available" ? value.payload === null || canonicalizeJson({ engineId: value.payload.engineId, score: value.payload.whiteScore,
      instrument: value.payload.instrument, bound: value.payload.bound }) !== canonicalizeJson({ engineId: selected.engineId, score: selected.score, instrument: selected.instrument, bound: selected.bound })
      : value.payload !== null || value.unavailable !== selected.reason) return refuse("point differs from its fixed endpoint selection");
    return source;
  }
  readPoint(source: RecordedComparisonPointSource) {
    const context = this.#points.get(source);
    if (context === undefined) return refuse("foreign point");
    this.read(context);
    const value = readRecordedComparisonPointSource(source);
    this.read(context); return value;
  }
  sources(context: RecordedComparisonContext) {
    const owned = this.read(context), data = recordedComparisonData(owned.comparison), peer = data.authority.paths[1];
    const span = peer.slice(peer.findIndex(entry => entry.node.id === data.authority.forkNodeId));
    const points = Object.freeze(span.map(({ node }) => this.resolvePoint(context, { comparison: owned.comparison, nodeId: node.id, signal: owned.signal })));
    this.read(context); return Object.freeze({ comparison: owned.comparison, points });
  }
  #permitted(state: ComparisonCurrentState) {
    if (!modulePolicy("compare_coach").roles.includes(state.role) || !state.access.access.deliveryOpen
      || !state.assistance.modules.includes("compare_coach") || !state.assistance.effects.some(effect => effect.moduleId === "compare_coach"
        && effect.timing === state.timing && effect.subSurface === undefined)) throw new RecordedComparisonContextError("permission_withheld", "current Compare permission is withheld");
  }
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
