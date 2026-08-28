// DISPOSABLE source-recovery harness — D1923. Not production code.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { PRIMARY_EVIDENCE_MANIFEST } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

interface SeedRow {
  readonly ref: string;
  readonly kind: "shipped_identity" | "assigned_to_existing_meaning";
  readonly witnesses: readonly string[];
}

interface Seed {
  readonly schemaVersion: number;
  readonly members: readonly SeedRow[];
}

const seed = JSON.parse(readFileSync(resolve(process.cwd(), "planning/semantic-convention-register/initial-members.json"), "utf8")) as Seed;
const declarations = JSON.parse(readFileSync(resolve(process.cwd(), "planning/semantic-convention-provenance/initial-declarations.json"), "utf8")) as {
  readonly schemaVersion: number;
  readonly snapshotRef: string;
  readonly authorityKind: string;
  readonly disclosureKind: string;
  readonly declarations: readonly {
    readonly ref: string;
    readonly definition: string;
    readonly limitations: readonly string[];
    readonly witnesses: readonly string[];
  }[];
};
const projectionByRef = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => [`${projection.id}@${projection.version}`, projection]));

function implementationWitness(path: string, ref: string): Readonly<{ path: string; lines: readonly string[] }> {
  const source = readFileSync(resolve(process.cwd(), path), "utf8");
  const lines = source.split("\n").filter((line) => line.includes(ref));
  return Object.freeze({ path, lines: Object.freeze(lines.map((line) => line.trim())) });
}

function sourceRows() {
  return Object.freeze(seed.members.map((member) => {
    const projectionWitnesses = member.witnesses.filter((witness) => !witness.startsWith("packages/")).map((witness) => {
      const projection = projectionByRef.get(witness);
      if (projection === undefined) throw new TypeError(`${member.ref} names missing projection witness ${witness}`);
      return Object.freeze({
        projection: witness,
        semantics: projection.semantics,
        limitations: Object.freeze([...projection.limitations]),
        grounding: projection.grounding,
        exactness: projection.exactness,
      });
    });
    const implementationWitnesses = member.witnesses.filter((witness) => witness.startsWith("packages/")).map((path) => implementationWitness(path, member.ref));
    return Object.freeze({ ...member, projectionWitnesses: Object.freeze(projectionWitnesses), implementationWitnesses: Object.freeze(implementationWitnesses) });
  }));
}

describe("D1923 convention declaration source recovery", () => {
  it("resolves every stable seed witness to live semantic or implementation bytes", () => {
    const rows = sourceRows();
    expect(rows).toHaveLength(39);
    for (const row of rows) {
      expect(row.projectionWitnesses.length + row.implementationWitnesses.length, row.ref).toBeGreaterThan(0);
      expect(row.projectionWitnesses.every((witness) => witness.semantics.trim() !== ""), row.ref).toBe(true);
      expect(row.implementationWitnesses.every((witness) => witness.lines.length > 0), row.ref).toBe(true);
    }
  });

  it("separates exact existing identity text from newly assigned names", () => {
    const rows = sourceRows();
    const withLiteralIdentity = rows.filter((row) => [...row.projectionWitnesses.flatMap((witness) => [witness.semantics, ...witness.limitations]), ...row.implementationWitnesses.flatMap((witness) => witness.lines)].some((text) => text.includes(row.ref)));
    const missingShippedIdentity = rows.filter((row) => row.kind === "shipped_identity" && !withLiteralIdentity.includes(row));
    expect(missingShippedIdentity.map((row) => row.ref)).toEqual([]);
    expect(withLiteralIdentity.filter((row) => row.kind === "assigned_to_existing_meaning")).toHaveLength(0);
  });

  it("publishes one literal declaration row for every stable seed member", () => {
    expect(declarations.schemaVersion).toBe(1);
    expect(declarations.snapshotRef).toMatch(/^[0-9a-f]{8}$/u);
    expect(declarations.authorityKind).toBe("landed_contract");
    expect(declarations.disclosureKind).toBe("definition_and_limitations");
    const seedRefs = seed.members.map((row) => row.ref).sort();
    const declarationRefs = declarations.declarations.map((row) => row.ref).sort();
    expect(declarationRefs).toEqual(seedRefs);
    expect(new Set(declarationRefs).size).toBe(39);
    for (const row of declarations.declarations) {
      expect(row.definition.trim().length, `${row.ref} definition`).toBeGreaterThan(20);
      expect(row.limitations.length, `${row.ref} limitations`).toBeGreaterThan(0);
      expect(row.limitations.every((value) => value.trim().length > 10), `${row.ref} limitations`).toBe(true);
      expect(row.witnesses.length, `${row.ref} witnesses`).toBeGreaterThan(0);
    }
  });

  it("resolves every declaration witness to a live projection or implementation symbol", () => {
    for (const row of declarations.declarations) {
      for (const witness of row.witnesses) {
        if (!witness.startsWith("packages/")) {
          expect(projectionByRef.has(witness), `${row.ref} -> ${witness}`).toBe(true);
          continue;
        }
        const [path, fragment] = witness.split("#", 2);
        const source = readFileSync(resolve(process.cwd(), path!), "utf8");
        if (fragment !== undefined) expect(source, `${row.ref} -> ${witness}`).toContain(fragment.split(".").at(-1)!);
      }
    }
  });
});
