import { describe, expect, it } from "vitest";

import type { SelectMoveRequest } from "./api.js";
import { parseGroupReplyResult, parsePredictionResult } from "./opponent-path-response.js";

const request: SelectMoveRequest = {
  startFen: "8/8/8/8/8/8/K6k/R7 w - - 0 1",
  historyUci: ["a2a3"],
  policy: { mode: "human_common", policyConfigDigest: `sha256:${"a".repeat(64)}` },
  seed: 7,
};
const selection = {
  moveUci: "h2g2",
  policyModeApplied: "human_common",
  engine: { id: "mock", name: "Mock", version: "1", seedHonored: true },
};

describe("alternate opponent response authorities", () => {
  it("admits exact prediction and group-reply envelopes with request-bound selections", () => {
    const prediction = parsePredictionResult({ selection, run: { events: [] }, emitted: [] }, request);
    const reply = parseGroupReplyResult({ selection, reusedFromNodeId: "node-one" }, request);
    expect(prediction.selection.moveUci).toBe("h2g2");
    expect(reply.reusedFromNodeId).toBe("node-one");
    expect(Object.isFrozen(prediction)).toBe(true);
    expect(Object.isFrozen(prediction.selection)).toBe(true);
    expect(Object.isFrozen(reply)).toBe(true);
  });

  it.each([
    [{ selection, run: { events: [] }, emitted: [], future: true }, "prediction"],
    [{ selection, run: null, emitted: [] }, "prediction"],
    [{ selection: { ...selection, moveUci: "a2a3" }, run: { events: [] }, emitted: [] }, "prediction"],
    [{ selection, reusedFromNodeId: "", future: true }, "group"],
    [{ selection, reusedFromNodeId: "" }, "group"],
    [{ selection: { ...selection, policyModeApplied: "strong_engine" }, reusedFromNodeId: null }, "group"],
  ] as const)("refuses malformed or crossed alternate-opponent envelopes", (value, kind) => {
    expect(() => kind === "prediction" ? parsePredictionResult(value, request) : parseGroupReplyResult(value, request)).toThrow(TypeError);
  });
});
