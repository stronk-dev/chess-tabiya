// rfc/pack-capability-contract.md §6 and §7 — the read-only migration planner, its shape check, the
// apply-readiness gate and the separately invoked applier.
//
// The planner walks the whole population with no property filter. Mechanical rows are deterministic
// edits (the initial 0.30 stamp; a re-stamp); judgement rows name the exact document, pointer and
// question a human must answer (a required capability was superseded by a new version, so the
// authored content may no longer mean what it meant); refusals name what the target runtime refuses.
// `migration-plan-check` accepts every complete, canonical plan — honest judgement debt is not
// malformed software. `migration-apply-ready` is the stop gate, and the applier writes nothing
// unless that exact predicate passes.

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  canonicalCapabilityRequirements,
  canonicalJson,
  capabilityKey,
  compareCapabilityIds,
  memberCapabilityIndex,
  parseCanonicalRequirements,
  walkSchemaMembers,
  CAPABILITY_APPLICABILITY,
  type CapabilityId,
} from "@chess-tabiya/schema";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { CAPABILITY_REGISTRY, followSuccessors, type CapabilityRegistry } from "@chess-tabiya/runtime";

import { derivePackRequirements, stampPackRequirements, type CapabilityEntryLookup } from "./pack-capabilities.js";

export const MIGRATION_PLAN_SCHEMA = "tabiya.capability.migration-plan.v1" as const;

/**
 * §7's population, baked (criterion 12). The moment the corpus moves, the plan refuses and a human
 * re-baselines here — the same refusal-on-drift idiom as graduation-clearance-plan.mjs.
 */
export const MIGRATION_POPULATION_BASELINE = Object.freeze({
  draftPacks: 56,
  candidatePacks: 36,
  draftSidecars: 96,
  candidateSourcing: 126,
  shapes: 25,
  principles: 13,
});

export type PopulationRoot = keyof typeof MIGRATION_POPULATION_BASELINE;

/** Roots under `content/` the population deliberately does not walk, each with its stated reason. */
export const EXCLUDED_ROOTS = Object.freeze([
  { root: "sources", reason: "source records are not resolved through by any pack's meaning" },
  { root: "witnesses", reason: "witness records are not resolved through by any pack's meaning" },
  { root: "concepts", reason: "the concept registry has its own schema lane (read only by its loader) and carries no capability requirement" },
  { root: "valence", reason: "valence declarations are content validated by the evidence compiler and carry no capability requirement" },
  { root: "drafts/*.graduation.json", reason: "graduation decision sidecars record rulings over a pack and carry no semantic requirement" },
]);

export interface MigrationPopulation {
  readonly roots: Readonly<Record<PopulationRoot, readonly string[]>>;
}

function sorted(values: string[]): readonly string[] {
  return Object.freeze(values.sort((left, right) => (left < right ? -1 : left > right ? 1 : 0)));
}

/** Walks the six roots exhaustively, with no property filter. */
export function walkPopulation(root: string): MigrationPopulation {
  const draftsDirectory = resolve(root, "content/drafts");
  const drafts = readdirSync(draftsDirectory).filter((name) => name.endsWith(".json"));
  const draftPacks = drafts.filter((name) => !/\.(sources|evidence|job|graduation|priority)\.json$/u.test(name)).map((name) => `content/drafts/${name}`);
  const draftSidecars = drafts.filter((name) => /\.(sources|evidence|job)\.json$/u.test(name)).map((name) => `content/drafts/${name}`);
  const candidatePacks: string[] = [];
  const candidateSourcing: string[] = [];
  for (const directory of readdirSync(resolve(root, "content/candidates"))) {
    const path = resolve(root, "content/candidates", directory);
    if (!statSync(path).isDirectory()) continue;
    for (const name of readdirSync(path)) {
      if (name === "pack.json") candidatePacks.push(`content/candidates/${directory}/pack.json`);
      else if (["evidence.json", "job.json", "sources.json", "priority.json"].includes(name)) candidateSourcing.push(`content/candidates/${directory}/${name}`);
    }
  }
  const registry = (directory: string): string[] => readdirSync(resolve(root, directory)).filter((name) => name.endsWith(".json")).map((name) => `${directory}/${name}`);
  return Object.freeze({
    roots: Object.freeze({
      draftPacks: sorted(draftPacks),
      candidatePacks: sorted(candidatePacks),
      draftSidecars: sorted(draftSidecars),
      candidateSourcing: sorted(candidateSourcing),
      shapes: sorted(registry("content/shapes")),
      principles: sorted(registry("content/principles")),
    }),
  });
}

export class MigrationPopulationError extends TypeError {
  constructor(message: string) { super(`MIGRATION_POPULATION_MOVED: ${message}`); }
}

export function assertPopulationBaseline(population: MigrationPopulation, baseline: typeof MIGRATION_POPULATION_BASELINE = MIGRATION_POPULATION_BASELINE): void {
  const moved = (Object.keys(baseline) as PopulationRoot[]).filter((root) => population.roots[root].length !== baseline[root]);
  if (moved.length > 0) throw new MigrationPopulationError(moved.map((root) => `${root} ${baseline[root]} -> ${population.roots[root].length}`).join("; "));
}

export interface MechanicalRow {
  readonly document: string;
  readonly pointer: "/requires";
  readonly edit: "stamp_requires" | "restamp_requires";
  readonly requires: readonly CapabilityId[];
}

export interface JudgementRow {
  readonly document: string;
  readonly pointer: string;
  readonly capability: CapabilityId;
  readonly successor: CapabilityId;
  readonly question: string;
}

export interface RefusalRow {
  readonly document: string;
  readonly capability: CapabilityId;
  readonly successor: CapabilityId | null;
  readonly reason: string;
}

export interface DigestConsequence {
  readonly document: string;
  readonly ledger: string;
  readonly from: string;
  readonly to: string;
}

export interface CapabilityTransition {
  readonly subjectId: string;
  readonly from: readonly CapabilityId[];
  readonly to: CapabilityId;
}

export interface MigrationPlan {
  readonly schema: typeof MIGRATION_PLAN_SCHEMA;
  readonly mode: "read_only";
  readonly hold: { readonly ruling: string; readonly allowed: readonly string[]; readonly forbidden: readonly string[] };
  readonly population: {
    readonly roots: Readonly<Record<PopulationRoot, readonly string[]>>;
    readonly excluded: typeof EXCLUDED_ROOTS;
  };
  readonly transitions: readonly CapabilityTransition[];
  readonly mechanical: readonly MechanicalRow[];
  readonly judgement: readonly JudgementRow[];
  readonly refusals: readonly RefusalRow[];
  readonly digestConsequences: readonly DigestConsequence[];
  readonly assertion: { readonly baseline: typeof MIGRATION_POPULATION_BASELINE; readonly total: number };
}

export const MIGRATION_HOLD = Object.freeze({
  ruling: "D3033",
  allowed: Object.freeze(["foundation and schema migrations: a requires stamp projected mechanically from a document's own content"]),
  forbidden: Object.freeze(["authored-content waves and claim-binding waves (the D560 hold stands per D949)", "any judgement row applied without a per-release D996 decision"]),
});

export interface PlanInputs {
  readonly root: string;
  readonly schema: unknown;
  readonly population: MigrationPopulation;
  readonly readDocument: (path: string) => unknown;
  /** Loaded registries; absent means the installed content registries (the generated declarations). */
  readonly shapes?: CapabilityEntryLookup;
  readonly principles?: CapabilityEntryLookup;
  readonly registry?: CapabilityRegistry;
  readonly baseline?: typeof MIGRATION_POPULATION_BASELINE;
}

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");
const packDigest = (document: unknown): string => `sha256:${sha256(canonicalizeJson(document as never))}`;

function ledgerPathFor(document: string): string {
  return document.endsWith("/pack.json") ? document.replace(/pack\.json$/u, "evidence.json") : document.replace(/\.json$/u, ".evidence.json");
}

/** Builds the plan. Pure over its inputs; never writes. */
export function buildMigrationPlan(inputs: PlanInputs): MigrationPlan {
  assertPopulationBaseline(inputs.population, inputs.baseline);
  const registry = inputs.registry ?? CAPABILITY_REGISTRY;
  const histories = new Map(registry.histories.map((history) => [history.subjectId, history]));
  const context = { schema: inputs.schema, registry, ...(inputs.shapes === undefined ? {} : { shapes: inputs.shapes }), ...(inputs.principles === undefined ? {} : { principles: inputs.principles }) };
  const mechanical: MechanicalRow[] = [];
  const judgement: JudgementRow[] = [];
  const refusals: RefusalRow[] = [];
  const digestConsequences: DigestConsequence[] = [];
  const transitions = new Map<string, { from: Map<string, CapabilityId>; to: CapabilityId }>();
  const noteTransition = (from: CapabilityId, to: CapabilityId): void => {
    const row = transitions.get(from.id) ?? { from: new Map(), to };
    row.from.set(capabilityKey(from), from);
    transitions.set(from.id, row);
  };
  const classify = (document: string, declared: readonly CapabilityId[], pointersFor: (subjectId: string) => readonly string[]): boolean => {
    let debt = false;
    for (const capability of declared) {
      const declaration = registry.byKey.get(capabilityKey(capability));
      if (declaration === undefined) {
        refusals.push({ document, capability, successor: null, reason: `${capabilityKey(capability)} is not a declared capability of this runtime` });
        debt = true;
        continue;
      }
      const history = histories.get(declaration.subjectId);
      const isCurrent = history !== undefined && capabilityKey(history.current) === capabilityKey(declaration.id);
      if (isCurrent && (declaration.disposition.kind === "active" || declaration.disposition.kind === "deprecated")) continue;
      if (isCurrent) {
        refusals.push({ document, capability, successor: null, reason: `${capabilityKey(capability)} is ${declaration.disposition.kind}` });
        debt = true;
        continue;
      }
      const terminal = followSuccessors(declaration.id, registry.byKey, histories);
      if (terminal.kind === "refusal") {
        refusals.push({ document, capability, successor: null, reason: `${capabilityKey(capability)} was withdrawn with no successor: ${terminal.refusal.kind === "no_migration_exists" ? terminal.refusal.reason : "replacement refused"}` });
        debt = true;
        continue;
      }
      const successor = terminal.declaration.id;
      noteTransition(capability, successor);
      const pointers = pointersFor(successor.id);
      for (const pointer of pointers.length === 0 ? ["/"] : pointers) {
        judgement.push({
          document,
          pointer,
          capability,
          successor,
          question: `${capabilityKey(capability)} is superseded by ${capabilityKey(successor)}; does the authored content at ${pointer} still mean what it meant under the old semantics?`,
        });
      }
      debt = true;
    }
    return debt;
  };
  for (const path of [...inputs.population.roots.draftPacks, ...inputs.population.roots.candidatePacks]) {
    const document = inputs.readDocument(path) as Readonly<Record<string, unknown>>;
    const derivation = derivePackRequirements(document, context);
    const pointersFor = (subjectId: string): readonly string[] => [...new Set(derivation.direct.filter((row) => row.capability.id === subjectId).flatMap((row) => row.pointers))].sort();
    if (!Object.hasOwn(document, "requires")) {
      mechanical.push({ document: path, pointer: "/requires", edit: "stamp_requires", requires: derivation.requires });
    } else {
      let declared: readonly CapabilityId[];
      try { declared = parseCanonicalRequirements(document.requires); } catch { declared = canonicalCapabilityRequirements((document.requires as CapabilityId[]) ?? []); }
      const debt = classify(path, declared, pointersFor);
      if (!debt && canonicalJson(declared) !== canonicalJson(derivation.requires)) {
        mechanical.push({ document: path, pointer: "/requires", edit: "restamp_requires", requires: derivation.requires });
      }
    }
    const mechanicalRow = mechanical.at(-1);
    if (mechanicalRow?.document === path) {
      const ledger = ledgerPathFor(path);
      if (existsSync(resolve(inputs.root, ledger))) {
        const stamped = { ...Object.fromEntries(Object.entries(document).filter(([key]) => key !== "requires")), requires: mechanicalRow.requires };
        digestConsequences.push({ document: path, ledger, from: packDigest(document), to: packDigest(stamped) });
      }
    }
  }
  // Resolved-through documents (§2.6): a shape whose stored dependencies name a superseded version.
  const members = memberCapabilityIndex(CAPABILITY_APPLICABILITY);
  for (const path of inputs.population.roots.shapes) {
    const entry = inputs.readDocument(path) as Readonly<Record<string, unknown>>;
    const declaration = registry.current(`shape.${String(entry.id)}`);
    if (declaration === undefined) continue;
    const walked = [entry.trigger, ...(((entry.plans as readonly Readonly<Record<string, unknown>>[] | undefined) ?? []).map((plan) => (plan.success as Readonly<Record<string, unknown>> | undefined)?.signature))]
      .flatMap((expression, index) => (expression === null || expression === undefined ? [] : walkSchemaMembers(inputs.schema, "/$defs/structuralExpression", expression, { instancePointer: index === 0 ? "/trigger" : `/plans/${index - 1}/success/signature` })));
    const pointersFor = (subjectId: string): readonly string[] => [...new Set(walked.filter((row) => members.get(canonicalJson({ member: row.member.member, schemaPointer: row.member.schemaPointer }))?.id === subjectId).map((row) => row.instancePointer))].sort();
    classify(path, declaration.dependsOn, pointersFor);
  }
  const population = inputs.population;
  const total = Object.values(population.roots).reduce((sum, rows) => sum + rows.length, 0);
  const byDocument = (left: { readonly document: string }, right: { readonly document: string }): number => (left.document < right.document ? -1 : left.document > right.document ? 1 : 0);
  return Object.freeze({
    schema: MIGRATION_PLAN_SCHEMA,
    mode: "read_only",
    hold: MIGRATION_HOLD,
    population: Object.freeze({ roots: population.roots, excluded: EXCLUDED_ROOTS }),
    transitions: Object.freeze([...transitions].sort(([left], [right]) => (left < right ? -1 : 1)).map(([subjectId, row]) => Object.freeze({ subjectId, from: Object.freeze([...row.from.values()].sort(compareCapabilityIds)), to: row.to }))),
    mechanical: Object.freeze(mechanical.sort(byDocument)),
    judgement: Object.freeze(judgement.sort((left, right) => byDocument(left, right) || (left.pointer < right.pointer ? -1 : left.pointer > right.pointer ? 1 : 0) || (capabilityKey(left.capability) < capabilityKey(right.capability) ? -1 : 1))),
    refusals: Object.freeze(refusals.sort(byDocument)),
    digestConsequences: Object.freeze(digestConsequences.sort(byDocument)),
    assertion: Object.freeze({ baseline: inputs.baseline ?? MIGRATION_POPULATION_BASELINE, total }),
  });
}

export class MigrationPlanShapeError extends TypeError {
  constructor(message: string) { super(`MIGRATION_PLAN_MALFORMED: ${message}`); }
}

/** Shape/content validity only: complete, canonical, internally consistent. Judgement debt is lawful. */
export function assertMigrationPlanShape(plan: MigrationPlan): void {
  if (plan.schema !== MIGRATION_PLAN_SCHEMA || plan.mode !== "read_only") throw new MigrationPlanShapeError("schema/mode");
  const documents = new Set(Object.values(plan.population.roots).flat());
  const total = Object.values(plan.population.roots).reduce((sum, rows) => sum + rows.length, 0);
  if (total !== plan.assertion.total) throw new MigrationPlanShapeError("assertion total disagrees with the population");
  for (const [root, count] of Object.entries(plan.assertion.baseline)) {
    if (plan.population.roots[root as PopulationRoot]?.length !== count) throw new MigrationPlanShapeError(`${root} moved from its baseline`);
  }
  for (const row of [...plan.mechanical, ...plan.judgement, ...plan.refusals, ...plan.digestConsequences]) {
    if (!documents.has(row.document)) throw new MigrationPlanShapeError(`${row.document} is outside the population`);
  }
  const mechanicalDocuments = plan.mechanical.map((row) => row.document);
  if (new Set(mechanicalDocuments).size !== mechanicalDocuments.length) throw new MigrationPlanShapeError("a document has two mechanical rows");
  for (const row of plan.mechanical) {
    if (canonicalJson(row.requires) !== canonicalJson(canonicalCapabilityRequirements(row.requires))) throw new MigrationPlanShapeError(`${row.document} mechanical requires is not canonical`);
  }
  for (const row of plan.digestConsequences) if (!mechanicalDocuments.includes(row.document)) throw new MigrationPlanShapeError(`${row.document} has a digest consequence and no mechanical edit`);
  if (canonicalJson(plan) !== canonicalJson(JSON.parse(JSON.stringify(plan)))) throw new MigrationPlanShapeError("plan is not plain JSON");
}

export interface ApplyReadiness { readonly ready: boolean; readonly reasons: readonly string[] }

/** The stop gate (§6): any judgement or refusal row blocks application. */
export function migrationApplyReadiness(plan: MigrationPlan): ApplyReadiness {
  const reasons = [
    ...(plan.judgement.length === 0 ? [] : [`${plan.judgement.length} judgement row(s) need a per-release D996 decision`]),
    ...(plan.refusals.length === 0 ? [] : [`${plan.refusals.length} document(s) would be refused by the target runtime`]),
  ];
  return Object.freeze({ ready: reasons.length === 0, reasons: Object.freeze(reasons) });
}

export interface ApplyResult { readonly written: readonly string[] }

/**
 * The applier. Runs the exact readiness predicate first and writes nothing on failure; then writes
 * each selected mechanical stamp and re-stamps its ledger's `packDigest`, atomically.
 */
export function applyMigrationPlan(plan: MigrationPlan, inputs: PlanInputs, selection: { readonly documents: "all" | readonly string[] }): ApplyResult {
  assertMigrationPlanShape(plan);
  const readiness = migrationApplyReadiness(plan);
  if (!readiness.ready) throw new TypeError(`MIGRATION_NOT_READY: ${readiness.reasons.join("; ")}`);
  const rows = plan.mechanical.filter((row) => selection.documents === "all" || selection.documents.includes(row.document));
  if (selection.documents !== "all" && rows.length !== selection.documents.length) throw new TypeError("MIGRATION_SELECTION_UNKNOWN: a selected document has no mechanical row");
  const context = { schema: inputs.schema, ...(inputs.shapes === undefined ? {} : { shapes: inputs.shapes }), ...(inputs.principles === undefined ? {} : { principles: inputs.principles }), ...(inputs.registry === undefined ? {} : { registry: inputs.registry }) };
  const writes: { readonly path: string; readonly text: string }[] = [];
  for (const row of rows) {
    const document = inputs.readDocument(row.document) as Readonly<Record<string, unknown>>;
    const stamped = stampPackRequirements(document, context);
    if (canonicalJson(stamped.requires) !== canonicalJson(row.requires)) throw new TypeError(`MIGRATION_PLAN_STALE: ${row.document} derives a different stamp than the plan recorded`);
    writes.push({ path: row.document, text: `${JSON.stringify(stamped, null, 2)}\n` });
    const ledger = ledgerPathFor(row.document);
    const ledgerPath = resolve(inputs.root, ledger);
    if (existsSync(ledgerPath)) {
      const bytes = readFileSync(ledgerPath, "utf8");
      const value = JSON.parse(bytes) as Record<string, unknown>;
      const canonical = `${canonicalizeJson(value as never)}\n` === bytes;
      value.packDigest = packDigest(stamped);
      writes.push({ path: ledger, text: canonical ? `${canonicalizeJson(value as never)}\n` : `${JSON.stringify(value, null, 2)}\n` });
    }
  }
  const temporary = writes.map(({ path }) => resolve(inputs.root, `${path}.capability-migration-${process.pid}`));
  const originals = new Map(writes.map(({ path }) => [path, readFileSync(resolve(inputs.root, path), "utf8")]));
  try {
    writes.forEach((write, index) => writeFileSync(temporary[index]!, write.text, "utf8"));
    writes.forEach((write, index) => renameSync(temporary[index]!, resolve(inputs.root, write.path)));
  } catch (error) {
    for (const [path, bytes] of originals) writeFileSync(resolve(inputs.root, path), bytes, "utf8");
    throw error;
  } finally {
    for (const path of temporary) rmSync(path, { force: true });
  }
  return Object.freeze({ written: Object.freeze(writes.map((write) => write.path)) });
}
