/** Clear every browser-local grammar registered by portable-account-data. */
export function clearAccountLocalData(storage: Storage): readonly string[] {
  const removed: string[] = [];
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key === null) continue;
    if (key.startsWith("tabiya:") || key.startsWith("tabiya.") || /^chess-tabiya:run:[^:]+:writer-id$/u.test(key)) {
      storage.removeItem(key);
      removed.push(key);
    }
  }
  return Object.freeze(removed.sort());
}

export function clearRunLocalData(storage: Storage, runId: string): readonly string[] {
  const exact = new Set([
    `chess-tabiya:run:${runId}:writer-id`,
    `tabiya:mark-scope:${runId}`,
    `tabiya:branch-fold:v1:${runId}`,
  ]);
  const removed: string[] = [];
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key !== null && exact.has(key)) { storage.removeItem(key); removed.push(key); }
  }
  return Object.freeze(removed.sort());
}
