// Accepted module-registration §4.11a: current permission and bounded evidence paths are
// separate. This server-private owner never creates a shortened or historical DrillRun.
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { assertRunEventSequence } from "@chess-tabiya/runtime/run-subject";
import { branchPath, moduleDecisionStamp, readBackReplay, type DrillRun, type FinalizedAssistanceV1, type Node } from "@chess-tabiya/runtime";
import { canonicalFen, positionFromFen } from "../../../packages/runtime/src/chess.js";
import { recordedEdgePayload } from "../../../packages/runtime/src/recorded-edge.js";
import { moduleEvidenceRole, modulePolicy } from "../../../packages/runtime/src/module-policy.js";
import type { Principal } from "./authorization.js";
import type { RunRole } from "./storage.js";

export type InspectorRecordedScope =
  | Readonly<{ kind: "position" | "incoming_edge" | "recorded_window" }>
  | Readonly<{ kind: "branch" | "recorded_review"; throughNodeId: string }>
  | Readonly<{ kind: "comparison"; otherBranchId: string; otherNodeId: string }>;
export interface InspectorRecordedSelection {
  readonly branchId: string;
  readonly nodeId: string;
  readonly decisionDigest: string;
  readonly context: InspectorRecordedScope;
}
export interface InspectorGrantedPath {
  readonly branchId: string;
  readonly throughNodeId: string;
  readonly nodes: readonly Node[];
}
export interface InspectorCurrentState {
  readonly run: DrillRun;
  readonly principal: Principal;
  readonly role: RunRole;
  readonly assistance: FinalizedAssistanceV1;
}
declare const contextBrand: unique symbol;
export interface InspectorRecordedContext { readonly [contextBrand]: true }
interface ContextImage extends InspectorCurrentState {
  readonly selection: InspectorRecordedSelection;
  readonly decision: ReturnType<typeof moduleDecisionStamp>;
  readonly paths: readonly InspectorGrantedPath[];
  readonly selected: Node;
}
export class InspectorContextError extends TypeError {
  constructor(readonly reason: "source_contract_invalid" | "stale" | "withheld") {
    super(`Inspector recorded context: ${reason}`);
  }
}
const refuse = (reason: InspectorContextError["reason"]): never => { throw new InspectorContextError(reason); };
function exact(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype
    && Reflect.ownKeys(value).length === keys.length && keys.every(key => {
      const field = Object.getOwnPropertyDescriptor(value, key);
      return field !== undefined && field.enumerable && "value" in field;
    });
}
function selection(value: InspectorRecordedSelection): InspectorRecordedSelection {
  if (!exact(value, ["branchId", "nodeId", "decisionDigest", "context"])) return refuse("source_contract_invalid");
  const text = (entry: unknown) => typeof entry === "string" && entry.trim().length > 0;
  if (![value.branchId, value.nodeId, value.decisionDigest].every(text)) return refuse("source_contract_invalid");
  if (!/^sha256:[a-f0-9]{64}$/u.test(value.decisionDigest)) return refuse("source_contract_invalid");
  const context = value.context;
  if (context === null || typeof context !== "object") return refuse("source_contract_invalid");
  const kindField = Object.getOwnPropertyDescriptor(context, "kind");
  if (kindField === undefined || !("value" in kindField)) return refuse("source_contract_invalid");
  const kind: unknown = kindField.value;
  const keys = kind === "comparison" ? ["kind", "otherBranchId", "otherNodeId"]
    : kind === "branch" || kind === "recorded_review" ? ["kind", "throughNodeId"] : ["kind"];
  if (!exact(context, keys) || !["position", "incoming_edge", "recorded_window", "branch", "recorded_review", "comparison"].includes(context.kind)
    || Object.entries(context).some(([key, entry]) => key !== "kind" && !text(entry))) return refuse("source_contract_invalid");
  return Object.freeze({ ...value, context: Object.freeze({ ...context }) });
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

/** One owner per RunService. Only that service supplies the actual current storage/access read. */
export class InspectorRecordedContextOwner {
  readonly #contexts = new WeakMap<object, { image: ContextImage; read: () => InspectorCurrentState; signal: AbortSignal; current: string }>();

  resolve(query: InspectorRecordedSelection, read: (selection: InspectorRecordedSelection) => InspectorCurrentState, signal: AbortSignal): InspectorRecordedContext {
    signal.throwIfAborted();
    const requested = selection(query), state = read(requested); // current authorization precedes graph/source work
    this.#permitted(state);
    const run = structuredClone(state.run);
    const decision = moduleDecisionStamp(run);
    if (decision.digest !== requested.decisionDigest) return refuse("stale");
    // Check the entire original image, including suffixes and other branches, before narrowing.
    assertRunEventSequence(run.id, run.events);
    if (canonicalizeJson(readBackReplay(run.events).run) !== canonicalizeJson(run)) return refuse("source_contract_invalid");
    const branches = requested.context.kind === "comparison" ? [requested.branchId, requested.context.otherBranchId] : [requested.branchId];
    if (new Set(branches).size !== branches.length) return refuse("source_contract_invalid");
    const originals = new Map(branches.map(id => [id, branchPath(run, id)]));
    for (const nodes of originals.values()) for (const [index, node] of nodes.entries()) {
      if (canonicalFen(positionFromFen(node.fen)) !== node.fen) return refuse("source_contract_invalid");
      if (index > 0) recordedEdgePayload(run, nodes[index - 1]!, node);
    }
    const prefix = (branchId: string, nodeId: string): InspectorGrantedPath => {
      const nodes = originals.get(branchId)!, end = nodes.findIndex(node => node.id === nodeId);
      if (end < 0) return refuse("source_contract_invalid");
      return { branchId, throughNodeId: nodeId, nodes: nodes.slice(0, end + 1) };
    };
    const primary = prefix(requested.branchId, requested.nodeId), selected = primary.nodes.at(-1)!;
    let paths: readonly InspectorGrantedPath[];
    switch (requested.context.kind) {
      case "position": paths = [{ ...primary, nodes: [selected] }]; break;
      case "incoming_edge": paths = [{ ...primary, nodes: primary.nodes.slice(-2) }]; break;
      case "recorded_window": paths = [primary]; break;
      case "branch":
      case "recorded_review": {
        const path = prefix(requested.branchId, requested.context.throughNodeId);
        if (!path.nodes.some(node => node.id === selected.id)) return refuse("source_contract_invalid");
        paths = [path]; break;
      }
      case "comparison": {
        const peer = prefix(requested.context.otherBranchId, requested.context.otherNodeId);
        paths = [primary, peer];
        for (const path of paths) {
          const branch = run.branches.find(item => item.id === path.branchId)!;
          if (!path.nodes.some(node => node.id === branch.forkNodeId)) return refuse("source_contract_invalid");
        }
        break;
      }
    }
    const image = freeze({ ...structuredClone(state), run, selection: requested, decision, paths, selected });
    const token = Object.freeze({}) as InspectorRecordedContext;
    this.#contexts.set(token, { image, read: () => read(requested), signal, current: canonicalizeJson(state) });
    signal.throwIfAborted();
    return token;
  }

  read(context: InspectorRecordedContext): ContextImage {
    const owned = context !== null && typeof context === "object" ? this.#contexts.get(context) : undefined;
    if (owned === undefined) return refuse("source_contract_invalid");
    owned.signal.throwIfAborted();
    const current = owned.read();
    this.#permitted(current);
    if (canonicalizeJson(current) !== owned.current) return refuse("stale");
    owned.signal.throwIfAborted();
    return owned.image;
  }

  #permitted(state: InspectorCurrentState): void {
    if (!modulePolicy("full_inspector").roles.includes(moduleEvidenceRole(state.role))
      || !state.assistance.modules.includes("full_inspector") || !state.assistance.effects.some(effect =>
      effect.moduleId === "full_inspector" && effect.timing === "review" && effect.subSurface === undefined)) refuse("withheld");
  }
}
