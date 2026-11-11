// DISPOSABLE sampled CPU attribution, not exact per-function elapsed time or a raw recording.
import assert from "node:assert/strict";
import type { Profiler } from "node:inspector";

export function summarizeCpu(profile: Profiler.Profile, url: string, bundle: string) {
  const samples = profile.samples; assert(samples && samples.length > 0, "CPU sampler produced no observations");
  assert(Number.isFinite(profile.startTime) && profile.endTime > profile.startTime);
  const nodes = new Map(profile.nodes.map(node => [node.id, node])); assert.equal(nodes.size, profile.nodes.length);
  const parents = new Map<number, number>(), counts = new Map<number, number>();
  for (const node of profile.nodes) for (const child of node.children ?? []) {
    assert(nodes.has(child) && !parents.has(child)); parents.set(child, node.id);
  }
  for (const id of samples) { assert(nodes.has(id)); counts.set(id, (counts.get(id) ?? 0) + 1); }
  const modules: string[] = []; let module = "(bundle helper)";
  for (const line of bundle.split("\n")) {
    const match = /^\/\/ ((?:packages|apps|tools|node_modules)\/[^\r\n]+)$/u.exec(line);
    if (match) module = match[1]!;
    modules.push(module);
  }
  const name = (id: number) => nodes.get(id)!.callFrame.functionName || "(anonymous)";
  const functions = new Map<string, { function: string; moduleHint: string; line: number; samples: number }>();
  for (const [id, count] of counts) {
    const frame = nodes.get(id)!.callFrame;
    const key = JSON.stringify([frame.functionName, frame.url, frame.lineNumber, frame.columnNumber]);
    const row = functions.get(key) ?? { function: name(id), samples: 0, line: frame.lineNumber + 1,
      moduleHint: frame.url === url ? modules[frame.lineNumber] ?? "(unknown)" : "(native/other)" };
    row.samples += count; functions.set(key, row);
  }
  return { samples: samples.length, profileMs: (profile.endTime - profile.startTime) / 1000,
    attribution: "sample counts/nearest callers; approximate source hints, not exact elapsed/retaining ownership",
    topFunctions: [...functions.values()].sort((a, b) => b.samples - a.samples).slice(0, 20).map(row => ({ ...row, fraction: row.samples / samples.length })),
    top: [...counts].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([id, count]) => {
      const frame = nodes.get(id)!.callFrame, callers: string[] = []; let at = parents.get(id);
      for (let i = 0; i < 4 && at !== undefined; i++) { callers.push(name(at)); at = parents.get(at); }
      return { function: name(id), samples: count, fraction: count / samples.length,
        moduleHint: frame.url === url ? modules[frame.lineNumber] ?? "(unknown)" : "(native/other)",
        line: frame.lineNumber + 1, callers };
    }) };
}
