import { describe, expect, it } from "vitest";
import { deeplyImmutableJson } from "./immutable-json.js";

describe("pure immutable JSON reuse guard", () => {
  it("admits only immutable plain data, including repeated aliases and null prototypes", () => {
    const child = Object.freeze({ value: 1 }), record = Object.freeze(Object.assign(Object.create(null), { child }));
    expect(deeplyImmutableJson(Object.freeze([child, child, record, null, true]))).toBe(true);
  });
  it("refuses mutable descendants without freezing them", () => {
    const child = { value: 1 }, root = Object.freeze({ child });
    expect(deeplyImmutableJson(root)).toBe(false);
    expect(Object.isFrozen(child)).toBe(false);
    child.value = 2;
    expect(deeplyImmutableJson(root)).toBe(false);
  });
  it("refuses accessors, sparse arrays, non-JSON values and mutable built-in state", () => {
    let reads = 0;
    expect(deeplyImmutableJson(Object.freeze({ get value() { reads++; return 1; } }))).toBe(false);
    expect(reads).toBe(0);
    for (const value of [Object.freeze(new Array(1)), Object.freeze(new Date()), Object.freeze(new Map()),
      Object.freeze({ value: undefined }), Object.freeze({ value: NaN }), Object.freeze({ value: () => 1 }), Object.freeze({ [Symbol()]: 1 })]) {
      expect(deeplyImmutableJson(value)).toBe(false);
    }
  });
  it("refuses cycles while accepting an independently frozen child after a mutable parent", () => {
    const cycle: { self?: object } = {}; cycle.self = cycle;
    expect(deeplyImmutableJson(Object.freeze(cycle))).toBe(false);
    const child = Object.freeze({ value: 1 });
    expect(deeplyImmutableJson({ child })).toBe(false);
    expect(deeplyImmutableJson(child)).toBe(true);
  });
});
