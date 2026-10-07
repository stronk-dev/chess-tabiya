import { createServer } from "node:http";
import { expect, it, vi } from "vitest";

import { applicationFixture } from "./application-fixture.test-support.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

it("waits for late construction and never publishes it after teardown", async () => {
  const construction = deferred<{ close(): Promise<void> }>();
  const disposal = deferred<void>();
  const application = { close: vi.fn(() => disposal.promise) };
  const fixture = applicationFixture(construction.promise);
  let finished = false;
  const closing = fixture.close().then(() => { finished = true; });
  await Promise.resolve();
  expect(finished).toBe(false);
  construction.resolve(application);
  await fixture.ready;
  expect(fixture.current()).toBeUndefined();
  expect(application.close).toHaveBeenCalledTimes(1);
  expect(finished).toBe(false);
  disposal.resolve();
  await closing;
  expect(finished).toBe(true);
});

it("keeps a late old construction separate from the next test's application", async () => {
  const oldConstruction = deferred<{ close(): Promise<void> }>();
  const oldApplication = { close: vi.fn(async () => {}) };
  const nextApplication = { close: vi.fn(async () => {}) };
  const oldFixture = applicationFixture(oldConstruction.promise);
  const closing = oldFixture.close();
  const nextFixture = applicationFixture(Promise.resolve(nextApplication));
  await nextFixture.ready;
  oldConstruction.resolve(oldApplication);
  await closing;
  await oldFixture.ready;
  expect(oldFixture.current()).toBeUndefined();
  expect(nextFixture.current()).toBe(nextApplication);
  expect(oldApplication.close).toHaveBeenCalledTimes(1);
  expect(nextApplication.close).not.toHaveBeenCalled();
  await nextFixture.close();
});

it("hides a ready application immediately and closes it exactly once", async () => {
  const disposal = deferred<void>();
  const application = { close: vi.fn(() => disposal.promise) };
  const fixture = applicationFixture(Promise.resolve(application));
  await fixture.ready;
  expect(fixture.current()).toBe(application);
  const first = fixture.close();
  const second = fixture.close();
  expect(second).toBe(first);
  expect(fixture.current()).toBeUndefined();
  disposal.resolve();
  await Promise.all([first, second]);
  expect(application.close).toHaveBeenCalledTimes(1);
});

it("preserves the construction error without inventing an application to close", async () => {
  const construction = deferred<{ close(): Promise<void> }>();
  const failure = new Error("installed content invalid");
  const fixture = applicationFixture(construction.promise);
  const refused = expect(fixture.ready).rejects.toBe(failure);
  const closing = fixture.close();
  construction.reject(failure);
  await refused;
  await closing;
  expect(fixture.current()).toBeUndefined();
});

it("does not swallow or retry a failed shutdown", async () => {
  const failure = new Error("shutdown failed");
  const application = { close: vi.fn(async () => { throw failure; }) };
  const fixture = applicationFixture(Promise.resolve(application));
  await fixture.ready;
  const closing = fixture.close();
  await expect(closing).rejects.toBe(failure);
  await expect(fixture.close()).rejects.toBe(failure);
  expect(application.close).toHaveBeenCalledTimes(1);
  expect(fixture.current()).toBeUndefined();
});

it("closes a real listening server delivered after teardown has started", async () => {
  const server = createServer((_request, response) => { response.end("fixture"); });
  const construction = deferred<{ close(): Promise<void> }>();
  const fixture = applicationFixture(construction.promise);
  const closing = fixture.close();
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    expect(server.listening).toBe(true);
    construction.resolve({ close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error === undefined ? resolve() : reject(error));
    }) });
    await fixture.ready;
    await closing;
    expect(fixture.current()).toBeUndefined();
    expect(server.listening).toBe(false);
  } finally {
    if (server.listening) await new Promise<void>((resolve, reject) => {
      server.close(error => error === undefined ? resolve() : reject(error));
    });
  }
});
