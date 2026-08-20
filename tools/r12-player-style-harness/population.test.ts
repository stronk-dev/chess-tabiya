// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const POPULATION = process.env.TABIYA_R12_POPULATION ?? "/private/tmp/r12-population.json";

describe("R12 frozen population", () => {
  it("has the predeclared repeated-account reserve in every band", () => {
    const population = JSON.parse(readFileSync(POPULATION, "utf8"));
    expect(population.completeGames).toBe(6_599_736);
    expect(population.eligibleBlitzGames).toBe(2_660_480);
    expect(population.accountsAtLeast200).toBe(190);
    expect(population.candidates.map((band: { accounts: unknown[] }) => band.accounts.length)).toEqual([17, 24, 24]);
  });
});
