// `make migration-plan | migration-plan-check | migration-apply-ready | migration-apply FILE=…`
// (rfc/pack-capability-contract.md §6). Exit codes are distinct: 0 success, 3 malformed plan or moved
// population, 4 not ready (judgement debt or refusals), 2 usage.

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { capabilityKey } from "@chess-tabiya/schema";
import { CAPABILITY_REGISTRY } from "@chess-tabiya/runtime";

import { LEGACY_REFUSED_MIGRATION, compileLegacyDispositions, repositoryReader } from "./legacy-migration.js";
import { packRequirementIssues } from "./pack-capabilities.js";
import { PrincipleRegistry } from "../principle-registry.js";
import { ShapeRegistry } from "../shape-registry.js";
import {
  applyMigrationPlan,
  assertMigrationPlanShape,
  buildMigrationPlan,
  migrationApplyReadiness,
  walkPopulation,
  type PlanInputs,
} from "./migration.js";

export const EXIT_MALFORMED = 3;
export const EXIT_NOT_READY = 4;

async function inputs(root: string): Promise<PlanInputs> {
  const shapes = await ShapeRegistry.loadDefault(resolve(root, "content/shapes"));
  const principles = await PrincipleRegistry.loadDefault(resolve(root, "content/principles"));
  return {
    root,
    schema: JSON.parse(readFileSync(resolve(root, "schemas/drill_pack.schema.json"), "utf8")) as unknown,
    population: walkPopulation(root),
    readDocument: (path) => JSON.parse(readFileSync(resolve(root, path), "utf8")) as unknown,
    shapes,
    principles,
  };
}

/**
 * §5/§5a: both legacy registers compile into semantic dispositions with resolving authority, and the
 * pack registry's lifecycle agrees with every legacy destination it also declares.
 */
function lifecycleCheck(root: string): number {
  const compiled = compileLegacyDispositions({ reader: repositoryReader(root) });
  const failures: string[] = [];
  for (const row of compiled) {
    const declared = CAPABILITY_REGISTRY.byKey.get(capabilityKey(row.capability));
    if (declared !== undefined && declared.disposition.kind !== row.disposition.kind) failures.push(`${capabilityKey(row.capability)} is ${declared.disposition.kind} in the registry and ${row.disposition.kind} in the legacy migration`);
  }
  for (const failure of failures) console.error(`CAPABILITY_DISPOSITION_INVALID: ${failure}`);
  if (failures.length > 0) return EXIT_MALFORMED;
  const refused = compiled.filter((row) => row.disposition.kind === "refused").length;
  console.log(`capability-lifecycle-check: ${compiled.length} legacy rows compiled (${LEGACY_REFUSED_MIGRATION.length} refused-row migrations, ${refused} with a resolving refusal authority); ${CAPABILITY_REGISTRY.histories.length} capability histories`);
  return 0;
}

async function main(argv: readonly string[]): Promise<number> {
  const [command, ...rest] = argv;
  const root = resolve(process.env.TABIYA_ROOT ?? process.cwd());
  if (command === "lifecycle-check") {
    try { return lifecycleCheck(root); } catch (error) { console.error(error instanceof Error ? error.message : String(error)); return EXIT_MALFORMED; }
  }
  let planInputs: PlanInputs;
  let plan;
  try {
    planInputs = await inputs(root);
    plan = buildMigrationPlan(planInputs);
    assertMigrationPlanShape(plan);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return EXIT_MALFORMED;
  }
  if (command === "corpus-check") {
    // Criterion 3: every committed pack document's `requires` byte-equals its own derivation — the
    // 86 production packs, the 6 browser fixtures, the schema example and its fixtures.
    const fixtures = readdirSync(resolve(root, "schemas/fixtures/drill-pack")).filter((name) => name.endsWith(".json")).map((name) => `schemas/fixtures/drill-pack/${name}`);
    const documents = [...planInputs.population.roots.draftPacks, ...planInputs.population.roots.candidatePacks, "schemas/drill_pack.example.json", ...fixtures];
    const failures: string[] = [];
    for (const path of documents) {
      const document = planInputs.readDocument(path) as Readonly<Record<string, unknown>>;
      for (const issue of packRequirementIssues(document, { schema: planInputs.schema, ...(planInputs.shapes === undefined ? {} : { shapes: planInputs.shapes }), ...(planInputs.principles === undefined ? {} : { principles: planInputs.principles }) })) failures.push(`${path} ${issue.code}: ${issue.message}`);
    }
    for (const failure of failures) console.error(failure);
    if (failures.length > 0) { console.error("pack-capability-check: run make pack-stamp FILE=<path> after editing pack content"); return EXIT_MALFORMED; }
    const production = planInputs.population.roots.draftPacks.filter((path) => !path.endsWith(".browser.json")).length + planInputs.population.roots.candidatePacks.length;
    console.log(`pack-capability-check: ${documents.length} documents (${production} production packs, ${planInputs.population.roots.draftPacks.length - planInputs.population.roots.draftPacks.filter((path) => !path.endsWith(".browser.json")).length} browser fixtures, the schema example and ${fixtures.length} schema fixtures) declare exactly their derived capabilities`);
    return 0;
  }
  const summary = `${plan.assertion.total} documents · ${plan.mechanical.length} mechanical · ${plan.judgement.length} judgement · ${plan.refusals.length} refusals · ${plan.digestConsequences.length} ledger re-stamps`;
  if (command === "plan") {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
    console.error(`migration-plan: ${summary}`);
    return 0;
  }
  if (command === "plan-check") {
    console.log(`migration-plan-check: complete and canonical — ${summary}`);
    return 0;
  }
  const readiness = migrationApplyReadiness(plan);
  if (command === "apply-ready") {
    if (!readiness.ready) { for (const reason of readiness.reasons) console.error(`migration-apply-ready: ${reason}`); return EXIT_NOT_READY; }
    console.log(`migration-apply-ready: ready — ${summary}`);
    return 0;
  }
  if (command === "apply") {
    const file = rest.find((flag) => flag.startsWith("--file="))?.slice("--file=".length);
    if (file === undefined || file === "") { console.error("usage: migration-apply FILE=<pack path relative to the repository root>|all"); return 2; }
    if (!readiness.ready) { for (const reason of readiness.reasons) console.error(`migration-apply: refused, nothing written — ${reason}`); return EXIT_NOT_READY; }
    const result = applyMigrationPlan(plan, planInputs, { documents: file === "all" ? "all" : [file] });
    console.log(`migration-apply: wrote ${result.written.length} file(s)`);
    return 0;
  }
  console.error("usage: migration-cli.js plan|plan-check|apply-ready|apply --file=<path>|all");
  return 2;
}

const invoked = process.argv[1] !== undefined && /capability-migration\.js$/u.test(process.argv[1]);
if (invoked) process.exitCode = await main(process.argv.slice(2));
