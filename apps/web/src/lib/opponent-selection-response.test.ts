import { describe, expect, it } from "vitest";

import { parseOpponentSelection } from "./opponent-selection-response.js";

const request = Object.freeze({
  startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  historyUci: ["e2e4"], policy: { mode: "human_common", policyConfigDigest: "digest" }, seed: 7,
});
const selection = Object.freeze({
  moveUci: "e7e5", policyModeApplied: "human_common",
  candidates: [
    { moveUci: "e7e5", rank: 1, mass: 0.6, scoreCp: 14, wdl: { win: 320, draw: 500, loss: 180 } },
    { moveUci: "c7c5", rank: 2, mass: 0.4, wdl: { win: 340, draw: 470, loss: 190 } },
  ],
  engine: { id: "maia", name: "Maia", version: "3", modelId: "maia-1600", seedHonored: true, eloHonored: true, eloApplied: 1600 },
});

describe("opponent selection response authority", () => {
  it("binds a legal response to its exact position and requested policy", () => {
    const parsed = parseOpponentSelection(selection, request);
    expect(parsed).toEqual(selection); expect(Object.isFrozen(parsed)).toBe(true); expect(Object.isFrozen(parsed.candidates?.[0]?.wdl)).toBe(true);
  });

  it("admits only the declared theory fallback", () => {
    expect(parseOpponentSelection(selection, { ...request, policy: { ...request.policy, mode: "theory_strict" } }).policyModeApplied).toBe("human_common");
    expect(() => parseOpponentSelection({ ...selection, policyModeApplied: "strong_engine" }, request)).toThrow(/requested policy/u);
  });

  it("accepts tablebase ordering and a selected trailing off-window candidate", () => {
    expect(parseOpponentSelection({ ...selection, policyModeApplied: "perfect_tablebase", orderingBasis: "none" }, { ...request, policy: { ...request.policy, mode: "perfect_tablebase" } }).orderingBasis).toBe("none");
    expect(parseOpponentSelection({ ...selection, candidates: [{ moveUci: "c7c5", rank: 1, mass: 0.4 }, { moveUci: "e7e5", rank: 2, offWindow: true }] }, request).moveUci).toBe("e7e5");
  });

  it.each([
    [{ ...selection, moveUci: "e2e4" }, request],
    [{ ...selection, candidates: [selection.candidates[1]] }, request],
    [{ ...selection, candidates: [{ ...selection.candidates[0], moveUci: "e2e4" }] }, request],
    [{ ...selection, candidates: [{ ...selection.candidates[0], mass: 0.7 }, { ...selection.candidates[1], mass: 0.4 }] }, request],
    [{ ...selection, candidates: [{ ...selection.candidates[0], wdl: { win: 321, draw: 500, loss: 180 } }] }, request],
    [{ ...selection, candidates: [{ moveUci: "e7e5", rank: 1, offWindow: true, mass: 0.2 }] }, request],
    [{ ...selection, orderingBasis: "none" }, request],
    [{ ...selection, policyModeApplied: "enumerated" }, request],
    [{ ...selection, engine: { ...selection.engine, privateOption: true } }, request],
    [selection, { ...request, historyUci: ["e2e5"] }],
  ] as const)("refuses illegal, crossed, inconsistent, or unknown response bytes", (value, boundRequest) => {
    expect(() => parseOpponentSelection(value, boundRequest)).toThrow(TypeError);
  });
});
