// rfc/pack-capability-contract.md — the criteria that run over committed content (content tier):
// 3 (every committed document's stamp equals its derivation), 12 (the baked population), 13 (the
// D566 regression), 18 (the migrated population is the sealed one) and 19 (the author contract).
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { capabilityId, capabilityKey } from "@chess-tabiya/schema";
import { CAPABILITY_LIFECYCLE, buildCapabilityRegistry, type CapabilityLifecycleRow } from "@chess-tabiya/runtime";
import { GENERATED_CAPABILITY_DECLARATIONS } from "../../../../packages/runtime/src/capability/declarations.generated.js";

import { PrincipleRegistry } from "../principle-registry.js";
import { ShapeRegistry } from "../shape-registry.js";
import { buildContract, compareDeclarations } from "./contract.js";
import { assertPopulationBaseline, buildMigrationPlan, MIGRATION_POPULATION_BASELINE, walkPopulation } from "./migration.js";
import { packRequirementIssues } from "./pack-capabilities.js";

const ROOT = resolve(import.meta.dirname, "../../../..");
const SLOW = 300_000;
const read = (path: string): string => readFileSync(resolve(ROOT, path), "utf8");
const schema = JSON.parse(read("schemas/drill_pack.schema.json")) as unknown;

describe("criterion 3 — every committed stamp byte-equals its derivation", () => {
  it("also checks independently discovered browser schema fixtures, including later Campaign additions", async () => {
    const root = "schemas/fixtures/drill-pack";
    const files = readdirSync(resolve(ROOT, root)).filter((name) => name.endsWith(".browser.json"));
    expect(files).toContain("campaign-boss.browser.json");
    const shapes = await ShapeRegistry.loadDefault();
    const principles = await PrincipleRegistry.loadDefault();
    for (const name of files) {
      const document = JSON.parse(read(`${root}/${name}`)) as Record<string, unknown>;
      expect(packRequirementIssues(document, { schema, shapes, principles }), name).toEqual([]);
    }
  });

  it("holds for the 86 production packs and the 6 browser fixtures", async () => {
    const population = walkPopulation(ROOT);
    const shapes = await ShapeRegistry.loadDefault(resolve(ROOT, "content/shapes"));
    const principles = await PrincipleRegistry.loadDefault(resolve(ROOT, "content/principles"));
    const documents = [...population.roots.draftPacks, ...population.roots.candidatePacks];
    expect(documents.filter((path) => !path.endsWith(".browser.json"))).toHaveLength(86);
    expect(documents.filter((path) => path.endsWith(".browser.json"))).toHaveLength(6);
    const failures = documents.flatMap((path) => packRequirementIssues(JSON.parse(read(path)) as Record<string, unknown>, { schema, shapes, principles }).map((issue) => `${path} ${issue.code}`));
    expect(failures).toEqual([]);
  });
});

describe("criteria 12 and 18 — the population is baked and is the sealed migration population", () => {
  it("walks the six roots with no property filter and matches the baseline", () => {
    const population = walkPopulation(ROOT);
    expect(() => assertPopulationBaseline(population)).not.toThrow();
    expect(Object.values(population.roots).reduce((sum, rows) => sum + rows.length, 0)).toBe(Object.values(MIGRATION_POPULATION_BASELINE).reduce((sum, value) => sum + value, 0));
    const sealed = (JSON.parse(read("rfc/contracts/pack-capability-schema-transition-v1.json")) as { migration: { documents: { path: string }[] } }).migration.documents.map((row) => row.path);
    expect([...population.roots.draftPacks, ...population.roots.candidatePacks].sort()).toEqual([...sealed].sort());
  });
});

describe("criterion 19 — the author authorities are inspectable and externally closed", () => {
  it("the author contract recomputes the transition, inventory, mappings and external source", () => {
    const run = spawnSync(process.execPath, ["tools/d2152-pack-capability-author-repair/contract.mjs"], { cwd: ROOT, encoding: "utf8" });
    expect(run.status, run.stderr).toBe(0);
    expect(run.stdout).toMatch(/lane 0\.3\d; \d+ closed members mapped/u);
  });
});

describe("criterion 13 — the D566 regression", () => {
  it("source no-ops preserve compatibility; explicit pawn-safe/outpost successors require shape judgement", async () => {
    const text = read("packages/runtime/src/structure.ts");
    const signature = "function pawnSafetyOnPosition(";
    const brace = text.indexOf("{", text.indexOf(signature) + signature.length);
    const overrides = { "packages/runtime/src/structure.ts": `${text.slice(0, brace + 1)}\n  void "maximal_pawn_reach@2";${text.slice(brace + 1)}` };

    // Inserting a no-op string does not change a chess outcome or break compatibility.
    const mutated = buildContract({ root: ROOT, overrides }).declarations;
    expect(compareDeclarations(GENERATED_CAPABILITY_DECLARATIONS, mutated)).toEqual([]);

    // Model a deliberately revised contract explicitly, keeping each released predecessor.
    // Actual old-contract chess outcomes are pinned in structure.test.ts, not inferred from hashes.
    const integerSubjects = ["structuralFeature.pawn_safe_square", "structuralFeature.outpost"];
    const bumps: CapabilityLifecycleRow[] = integerSubjects.map((subjectId) => ({ subjectId, versions: [
      { version: { kind: "integer", value: 1 }, disposition: { kind: "deprecated", successor: capabilityId(subjectId, 2), reason: "D566 deliberate contract transition fixture", reasonCode: "superseded" } },
      { version: { kind: "integer", value: 2 }, disposition: { kind: "active" } },
    ] }));
    const lifecycle = [...CAPABILITY_LIFECYCLE.filter((row) => !integerSubjects.includes(row.subjectId)), ...bumps];
    const added = integerSubjects.map(subjectId => {
      const original = GENERATED_CAPABILITY_DECLARATIONS.find(row => row.subjectId === subjectId && row.id.version.kind === "integer" && row.id.version.value === 1)!;
      const id = capabilityId(subjectId, 2);
      return { ...original, id, semanticsDigest: `contract:${capabilityKey(id)}`, dependsOn: original.dependsOn.map(dependency => integerSubjects.includes(dependency.id) ? capabilityId(dependency.id, 2) : dependency) };
    });

    // The plan lists the three predicate-bearing shapes in judgement[], not mechanical[].
    const registry = buildCapabilityRegistry([...GENERATED_CAPABILITY_DECLARATIONS, ...added], lifecycle);
    const plan = buildMigrationPlan({ root: ROOT, schema, population: walkPopulation(ROOT), readDocument: (path) => JSON.parse(read(path)) as unknown, registry });
    const judgedShapes = [...new Set(plan.judgement.map((row) => row.document).filter((path) => path.startsWith("content/shapes/")))].sort();
    expect(judgedShapes).toEqual(["content/shapes/knight-vs-bishop.json", "content/shapes/maroczy-bind.json", "content/shapes/open-centre.json"]);
    expect(plan.mechanical.map((row) => row.document)).not.toEqual(expect.arrayContaining(judgedShapes));
    expect(plan.judgement.every((row) => row.successor.version.kind === "integer" && row.successor.version.value === 2)).toBe(true);
    expect(registry.current("structuralFeature.pawn_safe_square")?.id).toEqual(capabilityId("structuralFeature.pawn_safe_square", 2));
    expect(registry.current("structuralFeature.outpost")?.id).toEqual(capabilityId("structuralFeature.outpost", 2));
  }, SLOW);
});
