/**
 * Provider exchange §2: strict binding compilation and source-absence algebra. These are
 * execution metadata, NOT evidence receipts or an authorized source resolver. The remaining
 * legacy catalogue must migrate before its complete consumer image can compile.
 */
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { isBindingSourceAbsence, type BindingSourceAbsence, type CompiledEvidenceManifest, type EvidenceBinding, type LatencyMode, type ProviderOffBehavior, type VersionedEvidenceId } from "./evidence-contract.js";
import { compileProjectionExecution, type CompiledProjectionExecution } from "./evidence-execution.js";

const key = (ref: VersionedEvidenceId): string => `${ref.id}@${ref.version}`;
const LATENCY_ORDER: readonly LatencyMode[] = ["sync", "interactive", "background", "offline"];
const COMPILED = new WeakSet<object>();

export class EvidenceBindingExecutionError extends TypeError {
  constructor(readonly code: "BINDING_EXECUTION_UNDECLARED" | "BINDING_EXECUTION_LATENCY" | "BINDING_SOURCE_ABSENCE" | "BINDING_AVAILABILITY_CROSSED", message: string) {
    super(`${code}: ${message}`);
    this.name = "EvidenceBindingExecutionError";
  }
}

export interface CompiledEvidenceBindingExecution {
  readonly binding: EvidenceBinding;
  readonly paths: CompiledProjectionExecution["paths"];
  readonly sourceAbsence: BindingSourceAbsence | null;
}
export interface CompiledEvidenceConsumerExecution {
  readonly consumer: VersionedEvidenceId;
  readonly bindings: readonly CompiledEvidenceBindingExecution[];
}

/** Every binding compiles; a raw/unregistered provider leaf cannot be skipped. */
export function compileEvidenceConsumerExecution(manifest: CompiledEvidenceManifest, consumer: VersionedEvidenceId): CompiledEvidenceConsumerExecution {
  if (!manifest.consumers.some(row => key(row) === key(consumer))) throw new EvidenceBindingExecutionError("BINDING_EXECUTION_UNDECLARED", key(consumer));
  const bindings = manifest.bindings.filter(row => key(row.consumer) === key(consumer));
  if (bindings.length === 0) throw new EvidenceBindingExecutionError("BINDING_EXECUTION_UNDECLARED", `${key(consumer)} has no admitted bindings`);
  const ids = bindings.map(row => key(row.adapter));
  if (new Set(ids).size !== ids.length) throw new EvidenceBindingExecutionError("BINDING_EXECUTION_UNDECLARED", "duplicate adapter identity");
  const compiled = bindings.map(binding => {
    const execution = compileProjectionExecution(manifest, binding.projection);
    const limit = LATENCY_ORDER.indexOf(binding.latency.mode);
    if (limit < 0) throw new EvidenceBindingExecutionError("BINDING_EXECUTION_LATENCY", `${key(binding.adapter)} has an invalid latency`);
    const paths = execution.paths.filter(path => LATENCY_ORDER.indexOf(path.effectiveLatency) <= limit);
    if (paths.length === 0) throw new EvidenceBindingExecutionError("BINDING_EXECUTION_LATENCY", `${key(binding.adapter)} admits no executable path`);
    const hasProvider = execution.paths.some(path => path.sourceRequirements.some(source => source.availability === "provider"));
    const policy = binding.sourceAbsence;
    if ((hasProvider && policy === undefined) || (policy !== undefined && !isBindingSourceAbsence(policy))) throw new EvidenceBindingExecutionError("BINDING_SOURCE_ABSENCE", `${key(binding.adapter)} needs a literal closed source-absence declaration`);
    // Snapshot only: later caller mutation cannot change the compiled policy or latency ceiling.
    return Object.freeze({ binding: freezeJson(binding), paths: Object.freeze(paths), sourceAbsence: policy === undefined ? null : Object.freeze({ ...policy }) });
  }).sort((left, right) => key(left.binding.adapter).localeCompare(key(right.binding.adapter)));
  const result = Object.freeze({ consumer: Object.freeze({ ...consumer }), bindings: Object.freeze(compiled) });
  COMPILED.add(result);
  return result;
}

function freezeJson<T>(value: T): T {
  const snapshot = JSON.parse(canonicalizeJson(value)) as T;
  const freeze = (child: unknown): void => {
    if (child === null || typeof child !== "object") return;
    for (const nested of Object.values(child)) freeze(nested);
    Object.freeze(child);
  };
  freeze(snapshot);
  return snapshot;
}

/**
 * Inputs are results of the exact-subject source resolver, not reach/health booleans. Each row
 * names all and only satisfied admitted path ids for one exact adapter. This pure algebra does
 * not issue source satisfaction or expose a cache/provider-request endpoint.
 */
export interface EvidenceBindingPathSatisfaction {
  readonly adapter: VersionedEvidenceId;
  readonly satisfiedPathIds: readonly string[];
}
export interface EvidenceConsumerSourceAvailability {
  readonly consumer: VersionedEvidenceId;
  readonly state: "available" | "honest_empty" | "unavailable";
  readonly omittedOptionalBindings: readonly VersionedEvidenceId[];
  readonly missingRequiredBindings: readonly VersionedEvidenceId[];
  /** Generated compatibility output only; never an aggregation input. */
  readonly providerOff: ProviderOffBehavior;
}

export function aggregateEvidenceConsumerSourceAvailability(compiled: CompiledEvidenceConsumerExecution, satisfaction: readonly EvidenceBindingPathSatisfaction[]): EvidenceConsumerSourceAvailability {
  if (typeof compiled !== "object" || compiled === null || !COMPILED.has(compiled)) throw new EvidenceBindingExecutionError("BINDING_AVAILABILITY_CROSSED", "consumer execution was not compiled by the authority");
  const rows = new Map(satisfaction.map(row => [key(row.adapter), row]));
  if (rows.size !== satisfaction.length || rows.size !== compiled.bindings.length || compiled.bindings.some(row => !rows.has(key(row.binding.adapter)))) throw new EvidenceBindingExecutionError("BINDING_AVAILABILITY_CROSSED", "satisfaction is not set-equal to compiled bindings");
  const omitted: VersionedEvidenceId[] = [];
  const missing: VersionedEvidenceId[] = [];
  let state: EvidenceConsumerSourceAvailability["state"] = "available";
  for (const { binding, paths, sourceAbsence } of compiled.bindings) {
    const observed = rows.get(key(binding.adapter))!.satisfiedPathIds;
    const permitted = new Set(paths.map(path => path.pathId));
    if (!Array.isArray(observed) || new Set(observed).size !== observed.length || observed.some(id => !permitted.has(id as `path:sha256:${string}`))) throw new EvidenceBindingExecutionError("BINDING_AVAILABILITY_CROSSED", `${key(binding.adapter)} has duplicate, unadmitted or crossed path ids`);
    // A path with no source requirements is local by construction, not provider-off fallback.
    if (observed.length > 0 || paths.some(path => path.sourceRequirements.length === 0)) continue;
    if (sourceAbsence === null) throw new EvidenceBindingExecutionError("BINDING_SOURCE_ABSENCE", `${key(binding.adapter)} has missing non-local evidence but no absence policy`);
    if (sourceAbsence.necessity === "optional") omitted.push(Object.freeze({ ...binding.adapter }));
    else {
      missing.push(Object.freeze({ ...binding.adapter }));
      if (sourceAbsence.whenNoPath === "operation_unavailable") state = "unavailable";
      else if (state !== "unavailable") state = "honest_empty";
    }
  }
  return Object.freeze({ consumer: compiled.consumer, state, omittedOptionalBindings: Object.freeze(omitted), missingRequiredBindings: Object.freeze(missing), providerOff: state });
}
