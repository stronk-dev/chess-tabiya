import { existsSync, readFileSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  FLOAT32_POLICY_MASS_TOLERANCE,
  PolicyMassError,
  humanConcessionMass,
} from "./practical-difficulty.js";

interface MaiaPolicyFixture {
  readonly candidates: readonly { readonly moveUci: string; readonly mass: number }[];
}

interface InstrumentFedEntry {
  readonly function: string;
  readonly fixture: string;
  readonly boundary: string;
  readonly validSide: "captured";
  readonly refusalSide: "minimal-clone-mutation";
}

function unresolvedInstrumentFixtures(entries: readonly InstrumentFedEntry[]): readonly string[] {
  return entries
    .filter((entry) => !existsSync(new URL(`./fixtures/${entry.fixture}`, import.meta.url)))
    .map((entry) => entry.function);
}

const actualMaiaPolicyVector = Object.freeze(
  (JSON.parse(readFileSync(new URL("./fixtures/maia-policy-mass-near-boundary.fixture.json", import.meta.url), "utf8")) as MaiaPolicyFixture).candidates,
);

describe("humanConcessionMass", () => {
  it("excludes an off-window played move from mass arithmetic", () => {
    expect(humanConcessionMass([
      { moveUci: "e2e4", mass: 0.6 },
      { moveUci: "d2d4", mass: 0.4 },
      { moveUci: "g1f3", offWindow: true },
    ], new Set(["d2d4"]))).toEqual({ concedingMass: 0.4, measuredMass: 1, candidateCount: 2 });
  });
  it("combines policy mass with an externally supplied concession set", () => {
    expect(humanConcessionMass([
      { moveUci: "a2a3", mass: 0.4 },
      { moveUci: "b2b3", mass: 0.35 },
      { moveUci: "c2c3", mass: 0.2 },
    ], new Set(["a2a3", "c2c3"]))).toEqual({
      concedingMass: 0.6000000000000001,
      measuredMass: 0.95,
      candidateCount: 3,
    });
  });

  it("abstains when any returned candidate omits policy mass", () => {
    expect(humanConcessionMass([
      { moveUci: "a2a3", mass: 0.4 },
      { moveUci: "b2b3" },
    ], new Set(["a2a3"]))).toBeNull();
  });

  it("accepts a real normalized Maia float32 policy vector", () => {
    const rawSum = actualMaiaPolicyVector.reduce((sum, candidate) => sum + candidate.mass, 0);
    expect(rawSum - 1).toBeGreaterThan(9e-8);
    expect(rawSum).toBeLessThanOrEqual(1 + FLOAT32_POLICY_MASS_TOLERANCE);
    const measured = humanConcessionMass(actualMaiaPolicyVector, new Set(["a5a6", "c6c5"]));
    expect(measured).toMatchObject({ measuredMass: rawSum, candidateCount: 17 });
    expect(measured?.concedingMass).toBeCloseTo(0.86595862824512, 14);
  });

  it("refuses a minimally mutated clone that crosses the one-ulp bound", () => {
    const crossed = actualMaiaPolicyVector.map((candidate, index) =>
      index === 0 ? { ...candidate, mass: candidate.mass + FLOAT32_POLICY_MASS_TOLERANCE } : candidate,
    );
    expect(() => humanConcessionMass(crossed, new Set())).toThrowError(
      expect.objectContaining<Partial<PolicyMassError>>({ code: "POLICY_MASS_INVALID" }),
    );
  });

  it("rejects materially invalid policy mass with a coded error", () => {
    expect(() => humanConcessionMass([
      { moveUci: "a2a3", mass: 0.6 },
      { moveUci: "b2b3", mass: 0.41 },
    ], new Set())).toThrowError(expect.objectContaining<Partial<PolicyMassError>>({
      code: "POLICY_MASS_INVALID",
    }));
  });

  it("keeps one definition of the policy-mass/concession composition", () => {
    const roots = [
      new URL("./", import.meta.url),
      new URL("../../../apps/server/src/", import.meta.url),
    ];
    const declarations = roots.flatMap((root) =>
      readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
        .map((entry) => readFileSync(new URL(entry.name, new URL(`${entry.parentPath}/`, "file:")), "utf8"))
        .flatMap((source) => source.match(/function\s+humanConcessionMass\s*\(/gu) ?? []),
    );
    expect(declarations).toHaveLength(1);
  });

  it("registers every instrument-fed function with a captured boundary fixture", () => {
    const register = JSON.parse(readFileSync(
      new URL("./fixtures/instrument-fed.fixture-register.json", import.meta.url),
      "utf8",
    )) as { readonly entries: readonly InstrumentFedEntry[] };
    expect(register.entries).toEqual([{
      function: "humanConcessionMass",
      fixture: "maia-policy-mass-near-boundary.fixture.json",
      boundary: "FLOAT32_POLICY_MASS_TOLERANCE",
      validSide: "captured",
      refusalSide: "minimal-clone-mutation",
    }]);
    const production = readFileSync(
      new URL("./practical-difficulty.ts", import.meta.url),
      "utf8",
    );
    const declared = [...production.matchAll(
      /\/\*\*\s*@instrument-fed\b[^*]*\*\/\s*export function\s+(\w+)/gu,
    )].map((match) => match[1]).sort();
    expect(register.entries.map((entry) => entry.function).sort()).toEqual(declared);
    expect(unresolvedInstrumentFixtures(register.entries)).toEqual([]);
    expect(unresolvedInstrumentFixtures([
      ...register.entries,
      {
        function: "futureInstrumentFunction",
        fixture: "missing.fixture.json",
        boundary: "FUTURE_BOUNDARY",
        validSide: "captured",
        refusalSide: "minimal-clone-mutation",
      },
    ])).toEqual(["futureInstrumentFunction"]);
  });
});
