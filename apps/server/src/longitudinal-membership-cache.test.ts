import { expect, it, vi } from "vitest";

import { createSemanticMembershipReader } from "./longitudinal-membership-cache.js";

const edge = { beforeFen: "before 0 1", moveUci: "e2e4", afterFen: "after 0 1" };
const gained = { projection: { id: "rules.structural.event.open_file", version: 1 }, sign: "gained" };

it("deduplicates exact v1 projection/signs without removing opposite signs or admitting another version", () => {
  const collect = vi.fn(() => [gained, gained, { ...gained, sign: "lost" }, { ...gained, projection: { ...gained.projection, version: 2 } }]);
  const read = createSemanticMembershipReader(collect);
  const memberships = read(edge)!;
  expect(memberships).toEqual([`${gained.projection.id}\0gained`, `${gained.projection.id}\0lost`]);
  expect(Object.isFrozen(memberships)).toBe(true);
  expect(() => (memberships as string[]).push("forged")).toThrow();
  expect(read({ ...edge })).toBe(memberships);
  expect(collect).toHaveBeenCalledTimes(1);
});

it("retains all edge operands, including both clocks, both FENs and move identity", () => {
  const collect = vi.fn(() => [gained]);
  const read = createSemanticMembershipReader(collect);
  const variants = [edge, { ...edge, beforeFen: "before 1 1" }, { ...edge, afterFen: "after 1 1" },
    { ...edge, moveUci: "d2d4" }, { ...edge, beforeFen: "different 0 1" }, { ...edge, afterFen: "different 0 1" },
    { beforeFen: "a\0b", moveUci: "c", afterFen: "d" }, { beforeFen: "a", moveUci: "b\0c", afterFen: "d" }];
  for (const candidate of variants) read(candidate);
  for (const candidate of variants) read(candidate);
  expect(collect).toHaveBeenCalledTimes(variants.length);
});

it("never retains undefined or thrown collection, and caches a complete empty result", () => {
  const collect = vi.fn().mockReturnValueOnce(undefined).mockImplementationOnce(() => { throw new Error("not available"); })
    .mockReturnValue([]);
  const read = createSemanticMembershipReader(collect);
  expect(read(edge)).toBeUndefined();
  expect(read(edge)).toBeUndefined();
  const empty = read(edge);
  expect(empty).toEqual([]);
  expect(read(edge)).toBe(empty);
  expect(collect).toHaveBeenCalledTimes(3);
});

it("evicts FIFO at the exact bound, without turning a retained hit into new insertion order", () => {
  const collect = vi.fn(() => [gained]);
  const read = createSemanticMembershipReader(collect, 2);
  const second = { ...edge, moveUci: "d2d4" };
  const third = { ...edge, moveUci: "g1f3" };
  read(edge); read(second); read(edge); read(third); read(second);
  expect(collect).toHaveBeenCalledTimes(3);
  read(edge);
  expect(collect).toHaveBeenCalledTimes(4);
});

it("isolates collector instances and rejects invalid retention bounds", () => {
  const first = vi.fn(() => [gained]);
  const second = vi.fn(() => []);
  expect(createSemanticMembershipReader(first)(edge)).toHaveLength(1);
  expect(createSemanticMembershipReader(second)(edge)).toEqual([]);
  for (const capacity of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => createSemanticMembershipReader(first, capacity)).toThrow("LONGITUDINAL_MEMBERSHIP_CACHE_CAPACITY_INVALID");
  }
});
