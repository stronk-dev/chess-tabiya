import { describe, expect, it } from "vitest";
import { FrozenDataMemo } from "./frozen-data-memo.js";

describe("frozen-data verification memo", () => {
  it.each([1, 2, 3])("forgets oldest shortcuts after two generations with live keys, capacity %i", capacity => {
    const memo = new FrozenDataMemo(capacity), keys = Array.from({ length: 20 }, () => ({}));
    expect(keys.every(key => !memo.has(key))).toBe(true);
    keys.forEach((key, index) => {
      memo.add(key);
      const first = Math.max(0, (Math.floor(index / capacity) - 1) * capacity);
      keys.forEach((held, at) => expect(memo.has(held)).toBe(at >= first && at <= index));
      expect(keys.filter(held => memo.has(held)).length).toBeLessThanOrEqual(2 * capacity);
    });
  });

  it("uses identity without modifying keys or promoting hits", () => {
    const memo = new FrozenDataMemo(1), first = Object.freeze({ value: 1 }), second = {}, third = {};
    memo.add(first); expect(memo.has({ value: 1 })).toBe(false);
    memo.add(second); expect(memo.has(first)).toBe(true);
    memo.add(third); expect(memo.has(first)).toBe(false);
    expect(first).toEqual({ value: 1 });
  });

  it("bounds add attempts even when the same object is added repeatedly", () => {
    const memo = new FrozenDataMemo(2), old = {}, duplicate = {};
    memo.add(old);
    for (let i = 0; i < 4; i++) memo.add(duplicate);
    expect(memo.has(old)).toBe(false); expect(memo.has(duplicate)).toBe(true);
  });

  it.each([0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("refuses invalid capacity %s", capacity => {
    expect(() => new FrozenDataMemo(capacity)).toThrow(RangeError);
  });
});
