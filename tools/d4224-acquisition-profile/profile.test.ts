import { describe, expect, it } from "vitest";
import { StageTrace } from "./trace.js";
import { summarizeCpu } from "./cpu.js";

describe("D4224 diagnostic controls", () => {
  it("partitions nested/recursive spans without summing inclusive work twice", () => {
    let clock = 0; const trace = new StageTrace(() => clock);
    const outer = trace.enter("same"); clock = 2;
    const inner = trace.enter("same"); clock = 6; trace.leave(inner); clock = 10; trace.leave(outer);
    expect(trace.result().stages).toEqual([{ name: "same", calls: 2, inclusiveMs: 14, selfMs: 10 }]);
  });
  it("cannot report leaked spans and preserves a thrown work error while closing them", () => {
    const trace = new StageTrace(); const held = trace.enter("held"); expect(() => trace.result()).toThrow(); trace.leave(held);
    expect(() => trace.span("outer", () => trace.span("inner", () => { throw Error("controlled"); }))).toThrow("controlled");
    expect(trace.result().stages.every(row => row.calls === 1)).toBe(true);
    const a = trace.enter("a"), b = trace.enter("b"); expect(() => trace.leave(a)).toThrow(/stack order/); trace.leave(b); trace.leave(a);
  });
  it("counts each CPU sample once and refuses unknown sample nodes", () => {
    const frame = (functionName: string) => ({ functionName, scriptId: "1", url: "file:///bundle", lineNumber: 1, columnNumber: 0 });
    const profile = { nodes: [{ id: 1, callFrame: frame("root"), children: [2] }, { id: 2, callFrame: frame("child") }],
      samples: [2, 2, 1], timeDeltas: [1000, 1000, 1000], startTime: 0, endTime: 3000 };
    const result = summarizeCpu(profile, "file:///bundle", "// packages/runtime/src/example.ts\nfunction x() {}\n");
    expect(result.samples).toBe(3); expect(result.top.map(row => row.samples)).toEqual([2, 1]);
    expect(result.topFunctions.map(row => row.samples)).toEqual([2, 1]);
    expect(result.top[0]!.callers).toEqual(["root"]); expect(result.top[0]!.moduleHint).toBe("packages/runtime/src/example.ts");
    expect(() => summarizeCpu({ ...profile, samples: [] }, "", "")).toThrow();
    expect(() => summarizeCpu({ ...profile, samples: [9] }, "", "")).toThrow();
  });
  it("aggregates recursive contexts by actual function location without inclusive double counting", () => {
    const frame = { functionName: "recursive", scriptId: "1", url: "u", lineNumber: 0, columnNumber: 0 };
    const value = summarizeCpu({ nodes: [{ id: 1, callFrame: frame, children: [2] }, { id: 2, callFrame: frame }],
      samples: [1, 2, 2], startTime: 0, endTime: 3000 }, "u", "");
    expect(value.topFunctions).toHaveLength(1); expect(value.topFunctions[0]!.samples).toBe(3);
    expect(value.topFunctions[0]!.fraction).toBe(1);
  });
});
