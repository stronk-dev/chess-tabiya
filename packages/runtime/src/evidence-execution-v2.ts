// Accepted provider §1a. Finite compiler-issued templates, never fabricated provider.path.v1s.
import { evidenceDigest, type CompiledEvidenceManifest, type LatencyMode, type VersionedEvidenceId } from "./evidence-contract.js";
import { compileProjectionExecution, projectionOwnExecution, literalExecutionMembers, EvidenceExecutionError, type CompiledProjectionExecution } from "./evidence-execution.js";
import { assertEvidenceReductionDeclaration, evidenceReductionContract } from "./evidence-reduction-contract.js";
import { inspectComparisonReductionBinding } from "./internal/evidence-value-routes.js";

export type CompiledEvidenceExecutionPlan =
  | Readonly<{ kind: "fixed"; execution: CompiledProjectionExecution }>
  | Readonly<{ kind: "composition"; projection: VersionedEvidenceId; own: CompiledProjectionExecution["own"]; members: readonly Readonly<{ member: number; inputs: readonly CompiledEvidenceExecutionPlan[] }>[]; worstCaseLatency: LatencyMode }>
  | Readonly<{ kind: "reduction"; projection: VersionedEvidenceId; own: CompiledProjectionExecution["own"]; operation: VersionedEvidenceId; sourceOwner: "RecordedComparisonStructuralPopulation"; sourceUse: "captured_only"; elements: readonly Readonly<{ projection: VersionedEvidenceId; execution: CompiledEvidenceExecutionPlan }>[]; worstCaseLatency: LatencyMode }>;
const key = (ref: VersionedEvidenceId) => `${ref.id}@${ref.version}`;
const ref = (value: VersionedEvidenceId) => Object.freeze({ id: value.id, version: value.version });
const order: readonly LatencyMode[] = ["sync", "interactive", "background", "offline"];
const latency = (plan: CompiledEvidenceExecutionPlan) => plan.kind === "fixed" ? plan.execution.worstCaseLatency : plan.worstCaseLatency;
const slowest = (values: readonly LatencyMode[]) => values.reduce((a, b) => order.indexOf(a) >= order.indexOf(b) ? a : b, "sync" as LatencyMode);
interface PlanAuthority { readonly digest: string; readonly validate: () => void }
const plans = new WeakMap<object, PlanAuthority>();

export function compileProjectionExecutionV2(manifest: Pick<CompiledEvidenceManifest, "projections" | "producers">, root: VersionedEvidenceId): CompiledEvidenceExecutionPlan {
  const declarations = new Map(manifest.projections.map(value => [key(value), value]));
  if (declarations.size !== manifest.projections.length || new Set(manifest.producers.map(key)).size !== manifest.producers.length) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", "duplicate declaration");
  const visited = new Set<string>(), active = new Set<string>();
  const hasReduction = (value: VersionedEvidenceId): boolean => {
    const id = key(value), declaration = declarations.get(id);
    if (declaration === undefined || active.has(id)) throw new EvidenceExecutionError("EXECUTION_GRAPH_INVALID", `missing/cyclic declaration ${id}`);
    visited.add(id); active.add(id);
    try {
      const derivation = declaration.derivation;
      if (derivation?.reduction !== undefined) assertEvidenceReductionDeclaration(declaration);
      const children = derivation?.reduction?.elements ?? literalExecutionMembers(declaration).flat();
      // Do not short circuit: a later eligible or alternative subtree must validate too.
      const descendants = children.map(hasReduction);
      return derivation?.reduction !== undefined || descendants.includes(true);
    } finally { active.delete(id); }
  };
  const bindingChecks: (() => void)[] = [];
  const build = (value: VersionedEvidenceId): CompiledEvidenceExecutionPlan => {
    if (!hasReduction(value)) return Object.freeze({ kind: "fixed", execution: compileProjectionExecution(manifest, value) });
    const declaration = declarations.get(key(value))!, own = projectionOwnExecution(manifest, declaration), derivation = declaration.derivation!;
    if (derivation.reduction !== undefined) {
      assertEvidenceReductionDeclaration(declaration);
      const contract = evidenceReductionContract(derivation.reduction.operation), binding = inspectComparisonReductionBinding();
      bindingChecks.push(() => { if (inspectComparisonReductionBinding() !== binding) throw new TypeError("Reduction callable binding changed after plan issuance"); });
      const elements = Object.freeze(derivation.reduction.elements.map(element => Object.freeze({ projection: ref(element), execution: build(element) })));
      return Object.freeze({ kind: "reduction", projection: ref(value), own, operation: contract.operation, sourceOwner: contract.sourceOwner, sourceUse: contract.sourceUse, elements,
        worstCaseLatency: slowest([own.latency, ...elements.map(element => latency(element.execution))]) });
    }
    const members = Object.freeze(literalExecutionMembers(declaration).map((inputs, member) => Object.freeze({ member, inputs: Object.freeze(inputs.map(build)) })));
    return Object.freeze({ kind: "composition", projection: ref(value), own, members, worstCaseLatency: slowest([own.latency, ...members.flatMap(member => member.inputs.map(latency))]) });
  };
  const plan = build(root);
  const reachable = [...visited].sort().map(id => declarations.get(id)!);
  const producers = manifest.producers.filter(producer => reachable.some(projection => key(projection.producer) === key(producer)));
  const digest = evidenceDigest({ plan, declarations: reachable, producers, binding: plan.kind === "fixed" ? null : inspectComparisonReductionBinding().identity });
  plans.set(plan, Object.freeze({ digest, validate: () => { for (const check of bindingChecks) check(); } }));
  return plan;
}

export function executionPlanDigest(plan: CompiledEvidenceExecutionPlan): string {
  const authority = plans.get(plan);
  if (authority === undefined) throw new TypeError("Execution plan was not issued by the V2 compiler");
  authority.validate(); return authority.digest;
}

/** No exclusions for held operations or unregistered provider leaves. */
export function compileManifestExecutionV2(manifest: Pick<CompiledEvidenceManifest, "projections" | "producers">): readonly CompiledEvidenceExecutionPlan[] {
  return Object.freeze([...manifest.projections].sort((a, b) => key(a).localeCompare(key(b))).map(projection => compileProjectionExecutionV2(manifest, projection)));
}
