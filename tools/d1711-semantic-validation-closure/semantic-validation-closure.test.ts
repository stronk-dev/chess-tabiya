// DISPOSABLE research harness — D1711. Not production code.
import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SEMANTIC_EVENT_DECLARATIONS,
  SEMANTIC_EVENT_PROJECTION_IDS,
} from "@chess-tabiya/runtime";

const ROOT = resolve(import.meta.dirname, "../..");
const CATALOGUE = "packages/runtime/src/evidence-catalog.ts";
const GENERIC_CENSUS = "packages/runtime/src/semantic-evidence.test.ts";
const SELF = "tools/d1711-semantic-validation-closure/semantic-validation-closure.test.ts";
const R2_BASELINE = "tools/r2-selection-harness/f2-baseline.json";

function filesUnder(directory: string): readonly string[] {
  const absoluteDirectory = resolve(ROOT, directory);
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = resolve(absoluteDirectory, entry.name);
    if (entry.isDirectory()) return filesUnder(absolutePath);
    if (!entry.isFile() || !/\.(?:ts|svelte)$/u.test(entry.name)) return [];
    return [relative(ROOT, absolutePath)];
  });
}

const sourceFiles = Object.freeze([
  ...filesUnder("packages"),
  ...filesUnder("apps"),
  ...filesUnder("tools"),
]);
const executableTestFiles = Object.freeze(sourceFiles.filter((path) => /(?:\.test|\.spec)\.ts$/u.test(path) && path !== SELF));
const source = (path: string): string => readFileSync(resolve(ROOT, path), "utf8");

function literalReferences(literal: string, files: readonly string[]): readonly string[] {
  return Object.freeze(files.filter((path) => source(path).includes(literal)));
}

describe("D1711 semantic validation authority", () => {
  it("proves the register generates two labels per event rather than binding fixture authorities", () => {
    expect(SEMANTIC_EVENT_DECLARATIONS).toHaveLength(67);
    expect(SEMANTIC_EVENT_PROJECTION_IDS).toHaveLength(67);
    expect(new Set(SEMANTIC_EVENT_DECLARATIONS.map((event) => event.projection.id)))
      .toEqual(new Set(SEMANTIC_EVENT_PROJECTION_IDS));

    for (const declaration of SEMANTIC_EVENT_DECLARATIONS) {
      expect(declaration.validation).toEqual({
        positives: [`semantic-event:${declaration.projection.id}:positive`],
        hardNegatives: [`semantic-event:${declaration.projection.id}:hard-negative`],
        externalPopulation: "r2-imported-sample@a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec",
      });
    }
  });

  it("proves no generated validation label names an independent executable fixture", () => {
    const independentlyReferenced = SEMANTIC_EVENT_DECLARATIONS.flatMap((declaration) =>
      [...declaration.validation.positives, ...declaration.validation.hardNegatives].flatMap((label) =>
        literalReferences(label, sourceFiles.filter((path) => path !== CATALOGUE && path !== GENERIC_CENSUS)),
      ),
    );
    expect(independentlyReferenced).toEqual([]);

    const validationReaders = sourceFiles.filter((path) =>
      path !== CATALOGUE
      && path !== SELF
      && /\.validation\.(?:positives|hardNegatives)/u.test(source(path)),
    );
    expect(validationReaders).toEqual([
      "packages/runtime/src/evidence-contract.ts",
      GENERIC_CENSUS,
    ]);
  });

  it("publishes the lower-bound census of events named by some non-generic executable test", () => {
    const independentTestFiles = executableTestFiles.filter((path) => path !== GENERIC_CENSUS);
    const rows = SEMANTIC_EVENT_PROJECTION_IDS.map((projection) => ({
      projection,
      runtimeTests: literalReferences(projection, independentTestFiles.filter((path) => path.startsWith("packages/") || path.startsWith("apps/"))),
      researchTests: literalReferences(projection, independentTestFiles.filter((path) => path.startsWith("tools/"))),
    }));
    const named = rows.filter((row) => row.runtimeTests.length > 0 || row.researchTests.length > 0);
    const unnamed = rows.filter((row) => row.runtimeTests.length === 0 && row.researchTests.length === 0);
    console.log(JSON.stringify({
      counts: {
        declarations: rows.length,
        namedOutsideGenericCensus: named.length,
        unnamedOutsideGenericCensus: unnamed.length,
        runtimeNamed: rows.filter((row) => row.runtimeTests.length > 0).length,
        researchNamed: rows.filter((row) => row.researchTests.length > 0).length,
      },
      unnamed: unnamed.map((row) => row.projection),
      rows,
    }));
    expect(named.length + unnamed.length).toBe(67);
  });

  it("proves the shared external-population token is an input identity, not per-event validation", () => {
    const baseline = JSON.parse(source(R2_BASELINE)) as {
      readonly manifest: string;
      readonly inputs: { readonly imported: { readonly digest: string } };
      readonly populations: readonly { readonly projections: Readonly<Record<string, number>> }[];
    };
    const observed = new Set(baseline.populations.flatMap((population) =>
      Object.keys(population.projections).map((key) => key.replace(/@1:.+$/u, "")),
    ));
    const currentObserved = SEMANTIC_EVENT_PROJECTION_IDS.filter((id) => observed.has(id));
    const currentAbsent = SEMANTIC_EVENT_PROJECTION_IDS.filter((id) => !observed.has(id));
    console.log(JSON.stringify({
      r2: {
        manifest: baseline.manifest,
        importedDigest: baseline.inputs.imported.digest,
        currentEventsObserved: currentObserved.length,
        currentEventsAbsent: currentAbsent.length,
        absent: currentAbsent,
      },
    }));
    expect(baseline.manifest).toBe("20/126/25/175/33/33/15/1");
    expect(baseline.inputs.imported.digest).toBe("a10a233e8e51f6a0877f65cee417339080d2fd32cd22886f755f576c84fa58ec");
    expect({ observed: currentObserved.length, absent: currentAbsent.length }).toEqual({ observed: 29, absent: 38 });
  });

  it("pins the green-by-construction generic census shape", () => {
    const census = source(GENERIC_CENSUS);
    expect(census).toContain("for (const declaration of SEMANTIC_EVENT_DECLARATIONS)");
    expect(census).toContain("Object.fromEntries(declaration.requiredOperands.map");
    expect(census).toContain("Object.entries(operands).slice(1)");
    expect(census).toContain("expectedFixtureIds.add(`semantic-event:${declaration.projection.id}:positive`)");
    expect(census).toContain("expectedFixtureIds.add(`semantic-event:${declaration.projection.id}:hard-negative`)");
    expect(census).not.toContain("declaration.validation.positives.map");
    expect(census).not.toContain("declaration.validation.hardNegatives.map");
  });
});
