// DISPOSABLE research harness — D1722. Not production code.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { PRIMARY_EVIDENCE_MANIFEST } from "@chess-tabiya/runtime";

type SeedKind = "shipped_identity" | "assigned_to_existing_meaning";

interface SeedRow {
  readonly ref: `${string}@${number}`;
  readonly kind: SeedKind;
  readonly witnesses: readonly string[];
}

/** Stable reviewed seed population consumed by research and the future C10 checker. */
const seed = JSON.parse(readFileSync(resolve(process.cwd(), "planning/semantic-convention-register/initial-members.json"), "utf8")) as {
  readonly schemaVersion: number;
  readonly members: readonly SeedRow[];
};
const INITIAL_CONVENTION_MEMBERS: readonly SeedRow[] = Object.freeze(seed.members.map((row) => Object.freeze({
  ...row,
  witnesses: Object.freeze([...row.witnesses]),
})));

const EXCLUDED_VERSION_TOKENS = Object.freeze({
  "mate-proof-traversal-fnv64@1": "proof-digest serialization identity, not a chess/product semantic definition",
  "module-reducers@1": "reducer implementation version, not a fact-defining convention",
} as const);

function productionText(): string {
  return [
    "packages/runtime/src/evidence-catalog.ts",
    "packages/runtime/src/exchange.ts",
    "packages/runtime/src/grade.ts",
    "packages/runtime/src/king-state.ts",
    "packages/runtime/src/legal-moves.ts",
    "packages/runtime/src/mate-proof.ts",
    "packages/runtime/src/material-state.ts",
    "packages/runtime/src/mobility.ts",
    "packages/runtime/src/module-reducers.ts",
    "packages/runtime/src/pawn-dynamics.ts",
    "packages/runtime/src/phase.ts",
    "packages/runtime/src/semantic-evidence.ts",
    "packages/runtime/src/structure.ts",
    "packages/runtime/src/tactics.ts",
  ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8")).join("\n");
}

const projectionKeys = new Set(PRIMARY_EVIDENCE_MANIFEST.projections.map((projection) => `${projection.id}@${projection.version}`));

describe("D1722 initial semantic-convention member census", () => {
  it("publishes one exact, sorted 39-member seed set", () => {
    expect(seed.schemaVersion).toBe(1);
    const refs = INITIAL_CONVENTION_MEMBERS.map((row) => row.ref);
    expect(refs).toHaveLength(39);
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs).toEqual([...refs].sort());
    expect(refs.every((value) => /^[a-z][a-z0-9_-]*@[1-9][0-9]*$/.test(value))).toBe(true);
    expect(INITIAL_CONVENTION_MEMBERS.filter((row) => row.kind === "shipped_identity")).toHaveLength(23);
    expect(INITIAL_CONVENTION_MEMBERS.filter((row) => row.kind === "assigned_to_existing_meaning")).toHaveLength(16);
  });

  it("binds shipped identities to production bytes and assigned identities to live projections", () => {
    const source = productionText();
    for (const row of INITIAL_CONVENTION_MEMBERS) {
      if (row.kind === "shipped_identity") expect(source, row.ref).toContain(row.ref);
      for (const witness of row.witnesses) {
        if (witness.startsWith("packages/")) expect(source, witness).toContain(row.ref);
        else expect(projectionKeys, `${row.ref} -> ${witness}`).toContain(witness);
      }
    }
  });

  it("keeps current versioned non-semantic tokens explicitly excluded", () => {
    const source = productionText();
    const included = new Set(INITIAL_CONVENTION_MEMBERS.map((row) => row.ref));
    for (const [token, reason] of Object.entries(EXCLUDED_VERSION_TOKENS)) {
      expect(source).toContain(token);
      expect(included).not.toContain(token);
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it("treats grade context as an operand, not an invalid pseudo-version", () => {
    expect(INITIAL_CONVENTION_MEMBERS.map((row) => row.ref)).toContain("grade-convention@1");
    expect(INITIAL_CONVENTION_MEMBERS.some((row) => row.ref.includes("/"))).toBe(false);
    const grade = PRIMARY_EVIDENCE_MANIFEST.projections.find((projection) => `${projection.id}@${projection.version}` === "derived.grade.move_quality@1");
    expect(grade?.operands).toContain("convention");
  });

  it("prints the reviewed seed table when explicitly requested", () => {
    if (process.env.D1722_SEED_PRINT !== "1") return;
    console.log(JSON.stringify({ members: INITIAL_CONVENTION_MEMBERS, excluded: EXCLUDED_VERSION_TOKENS }, null, 2));
  });
});
