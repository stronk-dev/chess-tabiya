// Output-preserving worker-local reuse for longitudinal-store §A. Only complete local event
// memberships are retained; source images, decision populations, attribution and publication are not.
import type { LongitudinalEdge, PopulationDependencies } from "./longitudinal-projector.js";

export function collectSemanticMemberships(
  edge: LongitudinalEdge,
  collect: PopulationDependencies["events"],
): readonly string[] | undefined {
  let events: ReturnType<PopulationDependencies["events"]>;
  try {
    events = collect(edge.beforeFen, edge.moveUci, edge.afterFen);
  } catch {
    return undefined;
  }
  if (events === undefined) return undefined;
  // Keep the original v1-only Boolean algebra, including empty successful readings.
  return Object.freeze([...new Set(events.filter((event) => event.projection.version === 1)
    .map((event) => `${event.projection.id}\0${event.sign}`))]);
}

/** Bounded FIFO, owned by this process/thread and its fixed collector implementation. */
export function createSemanticMembershipReader(
  collect: PopulationDependencies["events"],
  capacity = 4096,
): (edge: LongitudinalEdge) => readonly string[] | undefined {
  if (!Number.isSafeInteger(capacity) || capacity < 1) throw new Error("LONGITUDINAL_MEMBERSHIP_CACHE_CAPACITY_INVALID");
  const cache = new Map<string, readonly string[]>();
  return (edge) => {
    // Retain all six FEN fields on both sides and the exact canonical move. No board-only alias,
    // clock stripping or concatenation ambiguity; dependency implementations never share a cache.
    const key = JSON.stringify([edge.beforeFen, edge.moveUci, edge.afterFen]);
    const retained = cache.get(key);
    if (retained !== undefined) return retained;
    const memberships = collectSemanticMemberships(edge, collect);
    if (memberships === undefined) return undefined; // failed/incomplete work is always recollected
    if (cache.size >= capacity) cache.delete(cache.keys().next().value!);
    cache.set(key, memberships);
    return memberships;
  };
}
