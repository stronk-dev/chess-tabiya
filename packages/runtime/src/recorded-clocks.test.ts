import { describe, expect, it } from "vitest";
import { parseDeclaredTimeControl } from "./recorded-clocks.js";

describe("declared clock control: exact integer units and explicit unsupported forms", () => {
  it.each([
    [undefined, { kind: "absent" }], ["", { kind: "absent" }], [" \t", { kind: "absent" }],
    ["?", { kind: "unsupported", reason: "unknown" }], ["-", { kind: "unsupported", reason: "unlimited" }],
    ["40/7200:3600", { kind: "unsupported", reason: "staged_or_other" }],
    ["300", { kind: "unsupported", reason: "staged_or_other" }],
    ["300d5", { kind: "unsupported", reason: "staged_or_other" }],
    ["-1+2", { kind: "invalid", reason: "syntax" }], ["1.5+2", { kind: "invalid", reason: "syntax" }],
    ["1e3+2", { kind: "invalid", reason: "syntax" }], ["1++2", { kind: "invalid", reason: "syntax" }],
    ["1 +2", { kind: "invalid", reason: "syntax" }], ["0+0", { kind: "invalid", reason: "nonpositive_budget" }],
    ["9007199254741+0", { kind: "invalid", reason: "unsafe_operand" }],
    ["9007199254740+1", { kind: "invalid", reason: "unsafe_operand" }],
    ["0+1", { kind: "supported", baseMs: 0, incrementMs: 1000, canonical: "0+1" }],
    ["300+0", { kind: "supported", baseMs: 300000, incrementMs: 0, canonical: "300+0" }],
    [" 000300+0005 ", { kind: "supported", baseMs: 300000, incrementMs: 5000, canonical: "300+5" }],
    ["9007199254740+0", { kind: "supported", baseMs: 9007199254740000, incrementMs: 0, canonical: "9007199254740+0" }],
  ] as const)("classifies %s", (header, expected) => {
    const parsed = parseDeclaredTimeControl(header);
    expect(parsed).toEqual(expected);
    expect(Object.isFrozen(parsed)).toBe(true);
    if (parsed.kind === "supported") expect(parseDeclaredTimeControl(parsed.canonical)).toEqual(parsed);
  });
});
