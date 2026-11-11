// DISPOSABLE D4225 retained-allocation origins, never a heap snapshot or authority issuer.
import assert from "node:assert/strict";
import { Session } from "node:inspector/promises";
import type { HeapProfiler } from "node:inspector";

type Profile = HeapProfiler.SamplingHeapProfile;
type ProfileNode = HeapProfiler.SamplingHeapProfileNode;
function allocationSamplerControl(): number[] { return new Array<number>(1_000_000).fill(0); }
function subtreeSize(node: ProfileNode): number {
  assert(Number.isFinite(node.selfSize) && node.selfSize >= 0);
  return node.selfSize + node.children.reduce((n, child) => n + subtreeSize(child), 0);
}
export function sampledFunctionBytes(node: ProfileNode, name: string): number {
  return node.callFrame.functionName === name ? subtreeSize(node)
    : node.children.reduce((n, child) => n + sampledFunctionBytes(child, name), 0);
}
export function summarizeSampling(profile: Profile, bundleUrl: string, bundle: string) {
  const modules: string[] = []; let module = "(bundle helpers)";
  for (const line of bundle.split("\n")) {
    const header = /^\/\/ ((?:packages|apps|tools|node_modules)\/[^\r\n]+)$/u.exec(line);
    if (header !== null) module = header[1]!;
    modules.push(module);
  }
  const sites = new Map<string, { readonly function: string; readonly url: string; readonly line: number; readonly moduleHint: string; bytes: number }>();
  const callers = new Map<string, { readonly site: string; readonly callers: readonly string[]; bytes: number }>();
  let nodes = 0;
  const visit = (node: ProfileNode, parents: readonly string[] = []): void => {
    nodes++; assert(Number.isFinite(node.selfSize) && node.selfSize >= 0);
    const frame = node.callFrame, key = JSON.stringify([frame.functionName, frame.url, frame.lineNumber, frame.columnNumber]);
    let site = sites.get(key);
    if (site === undefined) {
      site = { function: frame.functionName || "(anonymous)", url: frame.url,
        line: frame.lineNumber + 1, moduleHint: frame.url === bundleUrl ? modules[frame.lineNumber] ?? "(unknown bundle location)" : "(native/other script)", bytes: 0 };
      sites.set(key, site);
    }
    site.bytes += node.selfSize;
    const location = `${site.function} (${site.moduleHint}:${site.line})`;
    if (node.selfSize > 0) {
      const nearest = parents.slice(-4).reverse(), key = JSON.stringify([location, nearest]);
      const entry = callers.get(key) ?? { site: location, callers: nearest, bytes: 0 };
      entry.bytes += node.selfSize; callers.set(key, entry);
    }
    node.children.forEach(child => visit(child, [...parents.slice(-3), location]));
  };
  visit(profile.head);
  const ranked = [...sites.values()].filter(site => site.bytes > 0).sort((a, b) => b.bytes - a.bytes || a.function.localeCompare(b.function));
  return { samplingInterval: 65_536, nodes, allocationSites: ranked.length,
    sampledLiveBytes: ranked.reduce((n, site) => n + site.bytes, 0), topSites: ranked.slice(0, 30),
    topCallers: [...callers.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 12),
    attribution: "allocation call sites; module hints use nearest preceding esbuild module comments, not retaining-root ownership" };
}

async function startRetainedSampling(collect: () => Promise<unknown>, session: Session) {
  let connected = false;
  const close = () => { if (connected) { session.disconnect(); connected = false; } };
  try {
    session.connect(); connected = true;
    // Warm the small control's code before sampling; retain no array across the control GC.
    let control: number[] | undefined = allocationSamplerControl(); assert.equal(control.length, 1_000_000);
    control = undefined; await collect();
    await session.post("HeapProfiler.startSampling", { samplingInterval: 65_536 });
    control = allocationSamplerControl();
    const held = await session.post("HeapProfiler.getSamplingProfile");
    const heldBytes = sampledFunctionBytes(held.profile.head, "allocationSamplerControl");
    assert(heldBytes > 0, "Sampler must observe the genuinely held control allocation");
    assert.equal(control.length, 1_000_000); control = undefined; await collect();
    const released = await session.post("HeapProfiler.stopSampling");
    const releasedBytes = sampledFunctionBytes(released.profile.head, "allocationSamplerControl");
    assert.equal(releasedBytes, 0, "Collected control samples must disappear before claiming retained origins");
    await session.post("HeapProfiler.startSampling", { samplingInterval: 65_536 });
    return { control: { heldBytes, releasedBytes }, close, stop: async (bundleUrl: string, readBundle: () => string) => {
      // Read the bundle only after sampling stops; diagnostics must not appear as source allocations.
      try { const { profile } = await session.post("HeapProfiler.stopSampling"); return summarizeSampling(profile, bundleUrl, readBundle()); }
      finally { close(); }
    } };
  } catch (error) { close(); throw error; }
}

export type RetainedSampler = Awaited<ReturnType<typeof startRetainedSampling>>;
export async function withRetainedSampling<T>(collect: () => Promise<unknown>, work: (sampler: RetainedSampler) => Promise<T>, session = new Session()): Promise<T> {
  const sampler = await startRetainedSampling(collect, session);
  try { return await work(sampler); }
  finally { sampler.close(); }
}
