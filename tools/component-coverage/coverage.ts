// rfc/evidence-presentation.md §8.2 / criterion 2 — `make component-coverage`.
//
// The presented populations are DERIVED: every compiled binding with at least one non-machine form
// whose consumer is classed presented (`PRESENTATION_CONSUMER_CLASSES`), minus the registered
// selection-only pairs. For every such consumer × projection pair the instrument asserts
//   (a) exactly one registered adapter;
//   (b) the adapter's forms — or its composition's member-form union — equal the binding's forms;
//   (c) every source operand is a declared operand of the projection;
//   (d) the adapter declares at least one retention assertion;
// and over the adapter registry that
//   (e) every adapter maps back to exactly one real presented binding (no orphans), and
//   (f) machine-only, selection-only and non-presentational pairs have no adapter.
// Totals and misses print per population; no integer is hard-coded.

export type CoverageClass =
  | "ordinary_presented"
  | "inspector_presented"
  | "author_operator_presented"
  | "module_presented"
  | "non_presentational_operation";

export interface CoverageBinding { readonly consumer: string; readonly projection: string; readonly forms: readonly string[] }
export interface CoverageAdapter {
  readonly consumer: string;
  readonly projection: string;
  readonly component: string;
  readonly composition?: { readonly id: string; readonly members: readonly { readonly component: string; readonly forms: readonly string[] }[] };
  readonly forms: readonly string[];
  readonly sourceOperands: readonly string[];
  readonly assertions: readonly string[];
}
export interface CoverageInput {
  readonly bindings: readonly CoverageBinding[];
  readonly adapters: readonly CoverageAdapter[];
  /** `id@version` → the projection's declared operands. */
  readonly operands: ReadonlyMap<string, readonly string[]>;
  readonly classOf: (consumer: string) => CoverageClass | undefined;
  /** `consumer\0projection` keys of selection-only bindings (no visual component). */
  readonly selectionOnly: readonly string[];
}

export const POPULATIONS = Object.freeze([
  { id: "learner", class: "ordinary_presented", label: "learner (ordinary)" },
  { id: "inspector", class: "inspector_presented", label: "Inspector" },
  { id: "author_operator", class: "author_operator_presented", label: "author/operator" },
  { id: "module", class: "module_presented", label: "learner modules" },
] as const);
export type PopulationId = (typeof POPULATIONS)[number]["id"];

export interface PopulationReport { readonly pairs: number; readonly adapted: number; readonly misses: readonly string[] }
export interface CoverageReport {
  readonly populations: Readonly<Record<PopulationId, PopulationReport>>;
  /** Registry-level misses: orphan adapters, adapters on forbidden pairs, unclassified consumers. */
  readonly registry: readonly string[];
  readonly ok: boolean;
}

const pairKey = (consumer: string, projection: string): string => `${consumer}\u0000${projection}`;
const pairName = (consumer: string, projection: string): string => `${consumer} × ${projection}`;
const sameSet = (left: readonly string[], right: readonly string[]): boolean => {
  const a = new Set(left), b = new Set(right);
  return a.size === b.size && [...a].every((value) => b.has(value)) && left.length === a.size;
};
const formsOf = (adapter: CoverageAdapter): readonly string[] =>
  adapter.composition === undefined ? adapter.forms : [...new Set(adapter.composition.members.flatMap((member) => member.forms))];

export function componentCoverage(input: CoverageInput): CoverageReport {
  const adaptersByPair = new Map<string, CoverageAdapter[]>();
  for (const adapter of input.adapters) {
    const key = pairKey(adapter.consumer, adapter.projection);
    adaptersByPair.set(key, [...(adaptersByPair.get(key) ?? []), adapter]);
  }
  const populations = Object.fromEntries(POPULATIONS.map((population) => [population.id, { pairs: 0, adapted: 0, misses: [] as string[] }])) as Record<PopulationId, { pairs: number; adapted: number; misses: string[] }>;
  const registry: string[] = [];
  const presented = new Set<string>();
  const forbidden = new Map<string, string>();
  const unclassified = new Set<string>();

  for (const binding of input.bindings) {
    const key = pairKey(binding.consumer, binding.projection);
    const forms = binding.forms.filter((form) => form !== "machine_condition");
    if (forms.length === 0) { forbidden.set(key, "machine-only"); continue; }
    if (input.selectionOnly.includes(key)) { forbidden.set(key, "selection-only"); continue; }
    const classification = input.classOf(binding.consumer);
    if (classification === undefined) { unclassified.add(binding.consumer); continue; }
    if (classification === "non_presentational_operation") { forbidden.set(key, "non-presentational"); continue; }
    const population = POPULATIONS.find((entry) => entry.class === classification)!;
    const report = populations[population.id];
    report.pairs += 1;
    presented.add(key);
    const name = pairName(binding.consumer, binding.projection);
    const adapters = adaptersByPair.get(key) ?? [];
    if (adapters.length === 0) { report.misses.push(`${name}: no adapter`); continue; }
    if (adapters.length > 1) { report.misses.push(`${name}: ${adapters.length} adapters (exactly one required)`); continue; }
    const adapter = adapters[0]!;
    const failures: string[] = [];
    if (!sameSet(adapter.forms, forms)) failures.push(`adapter forms [${adapter.forms.join(", ")}] ≠ binding forms [${forms.join(", ")}]`);
    if (adapter.composition !== undefined && !sameSet(formsOf(adapter), forms)) failures.push(`composition ${adapter.composition.id} member forms [${formsOf(adapter).join(", ")}] ≠ binding forms [${forms.join(", ")}]`);
    const declared = input.operands.get(binding.projection);
    if (declared === undefined) failures.push("projection is not compiled");
    else {
      const undeclared = adapter.sourceOperands.filter((operand) => !declared.includes(operand));
      if (undeclared.length > 0) failures.push(`source operands not declared by the projection: ${undeclared.join(", ")}`);
    }
    if (adapter.assertions.length === 0) failures.push("no retention assertion");
    if (failures.length > 0) report.misses.push(`${name}: ${failures.join("; ")}`);
    else report.adapted += 1;
  }

  for (const consumer of [...unclassified].sort()) registry.push(`${consumer}: presented binding with no consumer class`);
  for (const adapter of input.adapters) {
    const key = pairKey(adapter.consumer, adapter.projection);
    if (presented.has(key)) continue;
    const name = pairName(adapter.consumer, adapter.projection);
    const reason = forbidden.get(key);
    registry.push(reason === undefined ? `${name}: orphan adapter (no presented binding)` : `${name}: adapter on a ${reason} pair`);
  }
  const ok = registry.length === 0 && POPULATIONS.every((population) => populations[population.id].misses.length === 0);
  return Object.freeze({ populations, registry: Object.freeze(registry), ok });
}

export function formatCoverage(report: CoverageReport): string {
  const lines = ["component-coverage (rfc/evidence-presentation.md §8.2)"];
  for (const population of POPULATIONS) {
    const entry = report.populations[population.id];
    lines.push(`  ${population.label}: ${entry.adapted}/${entry.pairs} pairs adapted, ${entry.misses.length} ${entry.misses.length === 1 ? "miss" : "misses"}`);
    for (const miss of entry.misses) lines.push(`    MISS ${miss}`);
  }
  lines.push(`  registry: ${report.registry.length} ${report.registry.length === 1 ? "miss" : "misses"}`);
  for (const miss of report.registry) lines.push(`    MISS ${miss}`);
  lines.push(report.ok ? "component-coverage: OK" : "component-coverage: FAILED");
  return lines.join("\n");
}
