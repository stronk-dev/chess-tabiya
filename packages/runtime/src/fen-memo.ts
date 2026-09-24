/**
 * Bounded memo for pure one-position readings ([[D3300]]).
 *
 * A complete-population census (the longitudinal projector, the shared candidate packet) evaluates
 * the one-edge event closure over every legal move of one position, and every collector re-derives
 * the same before-position readings per edge. The readings registered here are pure functions of
 * their exact input string, so a per-reading FIFO cache returns the identical value. Cached values
 * are deep-frozen on first computation, so no caller can mutate a value another caller will read;
 * failures are never cached and still throw on every call.
 *
 * Deliberately import-free: a leaf module is evaluated before any importer, so the caches exist
 * whatever cycle the importing module sits in.
 */
const CACHES = new Map<string, Map<string, unknown>>();
const LIMIT = 2048;

// A shallowly frozen parent may still hold unfrozen children, so this always descends.
function deepFreeze<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (value !== null && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child, seen);
  }
  return value;
}

export function memoByInput<T>(reading: string, input: string, compute: (input: string) => T): T {
  let cache = CACHES.get(reading);
  if (cache === undefined) {
    cache = new Map();
    CACHES.set(reading, cache);
  }
  if (cache.has(input)) return cache.get(input) as T;
  const value = deepFreeze(compute(input));
  cache.set(input, value);
  if (cache.size > LIMIT) cache.delete(cache.keys().next().value!);
  return value;
}
