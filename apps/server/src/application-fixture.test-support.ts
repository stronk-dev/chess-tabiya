// Test-only ownership starts with construction, not only when an application becomes ready.
// Runner hook expiration does not cancel that promise: teardown must still own its eventual result.
export function applicationFixture<T extends { close(): Promise<void> }>(pending: Promise<T>) {
  let application: T | undefined;
  let closing = false;
  let shutdown: Promise<void> | undefined;
  return {
    ready: pending.then(value => { if (!closing) application = value; }),
    current: () => application,
    close: () => {
      closing = true;
      application = undefined;
      // Rejected construction has no completed application to release. Its original error remains
      // on ready; actual shutdown failures remain on this one shared promise and are never retried.
      shutdown ??= pending.then(value => value.close(), () => undefined);
      return shutdown;
    },
  };
}
