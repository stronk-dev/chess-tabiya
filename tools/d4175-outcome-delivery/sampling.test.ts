import { describe, expect, it } from "vitest";
import type { HeapProfiler } from "node:inspector";
import { sampledFunctionBytes, summarizeSampling } from "./sampling.js";

const node = (name: string, size: number, children: HeapProfiler.SamplingHeapProfileNode[] = []): HeapProfiler.SamplingHeapProfileNode => ({
  callFrame: { functionName: name, scriptId: "1", url: "file:///bundle.mjs", lineNumber: 1, columnNumber: 0 }, selfSize: size, children,
});
function leaf(name: string, size: number): HeapProfiler.SamplingHeapProfileNode { return node(name, size); }
describe("retained-allocation summary", () => {
  it("sums self sizes once and reports allocation sites rather than inclusive double-counted sizes", () => {
    const head = node("root", 10, [node("control", 20, [leaf("child", 30)])]);
    const value = summarizeSampling({ head }, "file:///bundle.mjs", "// packages/runtime/src/example.ts\nfunction root() {}\n");
    expect(value.sampledLiveBytes).toBe(60); expect(value.topSites[0]!.bytes).toBe(30);
    expect(value.topSites.every(site => site.moduleHint === "packages/runtime/src/example.ts")).toBe(true);
    expect(sampledFunctionBytes(head, "control")).toBe(50); expect(sampledFunctionBytes(head, "missing")).toBe(0);
  });
  it("refuses nonsensical sizes rather than publishing fake retained bytes", () => {
    for (const size of [NaN, Infinity, -1]) expect(() => summarizeSampling({ head: leaf("bad", size) }, "", "")).toThrow();
  });
});
