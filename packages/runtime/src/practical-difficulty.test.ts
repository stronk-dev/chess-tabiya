import { readFileSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  FLOAT32_POLICY_MASS_TOLERANCE,
  PolicyMassError,
  humanConcessionMass,
} from "./practical-difficulty.js";

// Captured from the pinned chess-tabiya-maia:1e13597 sidecar at Elo 1500,
// MultiPV 20, for 3b4/3k4/8/2PKP3/8/8/4B3/8 b - - 0 1.
const actualMaiaPolicyVector = Object.freeze([
  { moveUci: "d8c7", mass: 0.281162202358 },
  { moveUci: "d7c7", mass: 0.26125150919 },
  { moveUci: "d8e7", mass: 0.217715397477 },
  { moveUci: "d7e7", mass: 0.161266446114 },
  { moveUci: "d8a5", mass: 0.0272439364344 },
  { moveUci: "d8g5", mass: 0.0157941449434 },
  { moveUci: "d8h4", mass: 0.0112361740321 },
  { moveUci: "d7c8", mass: 0.0108604058623 },
  { moveUci: "d7e8", mass: 0.0101189389825 },
  { moveUci: "d8b6", mass: 0.00174298591446 },
  { moveUci: "d8f6", mass: 0.00160786672495 },
]);

describe("humanConcessionMass", () => {
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
    expect(rawSum).toBeGreaterThan(1);
    expect(rawSum).toBeLessThanOrEqual(1 + FLOAT32_POLICY_MASS_TOLERANCE);
    expect(humanConcessionMass(actualMaiaPolicyVector, new Set(["d8c7", "d8e7"]))).toEqual({
      concedingMass: 0.498877599835,
      measuredMass: rawSum,
      candidateCount: 11,
    });
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
});
