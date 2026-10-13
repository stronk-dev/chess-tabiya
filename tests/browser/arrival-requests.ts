// Test-only arrival diagnostics. Request timings are transport observations, not server CPU.
export interface ArrivalResource {
  readonly name: string;
  readonly initiatorType: string;
  readonly startTime: number;
  readonly requestStart: number;
  readonly responseStart: number;
  readonly responseEnd: number;
  readonly duration: number;
}

export function summarizeArrivalRequests(resources: readonly ArrivalResource[], clickMs: number, readyMs: number) {
  const requests = resources.filter(entry => entry.initiatorType === "fetch" && entry.startTime >= clickMs && entry.startTime <= readyMs);
  const paths = requests.map(entry => new URL(entry.name).pathname);
  const writes = requests.flatMap((entry, index) => {
    const path = paths[index]!;
    const route = path === "/runs" ? "/runs" : /^\/runs\/[^/]+\/moves$/u.test(path) ? "/runs/:id/moves" : undefined;
    if (route === undefined) return [];
    return [{ route, startAfterClickMs: entry.startTime - clickMs, durationMs: entry.duration,
      responseWaitMs: entry.requestStart > 0 && entry.responseStart >= entry.requestStart
        ? entry.responseStart - entry.requestStart : null,
      bodyReceiveMs: entry.responseStart > 0 && entry.responseEnd >= entry.responseStart
        ? entry.responseEnd - entry.responseStart : null }];
  });
  if (writes.length > 16) throw new TypeError("Arrival critical-route diagnostics exceed their bounded population");
  return {
    total: requests.length,
    shapeCatalogues: paths.filter(path => path === "/shapes").length,
    shapeDocuments: paths.filter(path => path.startsWith("/shapes/")).length,
    runPacks: paths.filter(path => /^\/runs\/[^/]+\/pack$/u.test(path)).length,
    longestMs: Math.max(0, ...requests.map(entry => entry.duration)),
    // Resource Timing has no HTTP method. These are exact route observations; the published
    // HAR separately identifies their POST operations. Never infer CPU/lock/fsync from TTFB.
    criticalRoutes: writes,
  };
}
