import { readFileSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { humanConcessionMass } from "./practical-difficulty.js";

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
