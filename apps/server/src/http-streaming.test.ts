import { once } from "node:events";
import { get } from "node:http";
import type { AddressInfo } from "node:net";
import { setImmediate as nextTurn } from "node:timers/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpServer, type RestHandler } from "./rest.js";

const servers: ReturnType<typeof createHttpServer>[] = [];
async function serve(handler: RestHandler) {
  const server = createHttpServer(handler);
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

function latch() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("production Node HTTP response streaming", () => {
  it("delivers the first bytes before the source can finish, with headers preserved", async () => {
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(controller) { stream = controller; controller.enqueue(new TextEncoder().encode("first")); } });
    const origin = await serve(async () => new Response(body, { status: 202, headers: { "content-type": "text/event-stream", "x-stream-source": "fixture" } }));
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(2_000) });
      expect(response.status).toBe(202);
      expect(response.headers.get("x-stream-source")).toBe("fixture");
      const reader = response.body!.getReader();
      expect(new TextDecoder().decode((await reader.read()).value)).toBe("first");
      // Finishing requires the client to have seen the first bytes. Buffering cannot pass.
      stream.enqueue(new TextEncoder().encode("last"));
      stream.close();
      expect(new TextDecoder().decode((await reader.read()).value)).toBe("last");
      expect((await reader.read()).done).toBe(true);
    } finally { try { stream.close(); } catch { /* already finished or cancelled */ } }
  });

  it("cancels a live body and aborts the owning request when its client disconnects", async () => {
    const cancelled = latch();
    let signal!: AbortSignal;
    const cancel = vi.fn(() => cancelled.resolve());
    const origin = await serve(async (request) => {
      signal = request.signal;
      return new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode("first")); }, cancel }));
    });
    const controller = new AbortController();
    const response = await fetch(origin, { signal: controller.signal });
    await response.body!.getReader().read();
    controller.abort();
    await cancelled.promise;
    expect(signal.aborted).toBe(true);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("cancels a body whose handler returns only after the client has already disconnected", async () => {
    const started = latch();
    const cancelled = latch();
    const cancel = vi.fn(() => cancelled.resolve());
    const origin = await serve(async (request) => {
      started.resolve();
      await new Promise<void>((resolve) => request.signal.addEventListener("abort", () => resolve(), { once: true }));
      return new Response(new ReadableStream<Uint8Array>({ cancel }));
    });
    const controller = new AbortController();
    const pending = fetch(origin, { signal: controller.signal }).catch(() => undefined);
    await started.promise;
    controller.abort();
    await pending;
    await cancelled.promise;
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("does not consume a HEAD body, and cancels its producer", async () => {
    const cancel = vi.fn();
    const origin = await serve(async () => new Response(new ReadableStream<Uint8Array>({ cancel }), { headers: { "x-head": "kept" } }));
    const response = await fetch(origin, { method: "HEAD", signal: AbortSignal.timeout(2_000) });
    expect(response.headers.get("x-head")).toBe("kept");
    expect(await response.text()).toBe("");
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it.each([204, 304])("writes no body for status %i", async (status) => {
    const origin = await serve(async () => new Response(null, { status, headers: { "x-no-body": "kept" } }));
    const response = await fetch(origin);
    expect(response.status).toBe(status);
    expect(response.headers.get("x-no-body")).toBe("kept");
    expect(await response.text()).toBe("");
  });

  it("ends the connection rather than replacing partial output with JSON when its source fails", async () => {
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const origin = await serve(async () => new Response(new ReadableStream<Uint8Array>({ start(controller) { stream = controller; controller.enqueue(new TextEncoder().encode("first")); } })));
    const response = await fetch(origin, { signal: AbortSignal.timeout(2_000) });
    const reader = response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toBe("first");
    stream.error(new Error("private cursor failure"));
    await expect(reader.read()).rejects.toThrow();
    expect(response.status).toBe(200);
  });

  it("returns the typed generic failure for a handler that fails before response headers", async () => {
    const origin = await serve(async () => { throw new Error("private export failure"); });
    const response = await fetch(origin);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  });

  it("clears unsent export headers if adapting its already-locked source fails", async () => {
    const origin = await serve(async () => {
      const response = new Response(new ReadableStream<Uint8Array>(), { status: 202, headers: { "content-length": "123456", "x-export-cursor": "private" } });
      response.body!.getReader();
      return response;
    });
    const response = await fetch(origin, { signal: AbortSignal.timeout(2_000) });
    expect(response.status).toBe(500);
    expect(response.headers.has("content-length")).toBe(false);
    expect(response.headers.has("x-export-cursor")).toBe(false);
    expect(await response.json()).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  });

  it("keeps backpressure: a paused socket does not eagerly drain the complete source", async () => {
    const cancelled = latch();
    let produced = 0;
    const origin = await serve(async () => new Response(new ReadableStream<Uint8Array>({
      pull(controller) { produced += 1; controller.enqueue(new Uint8Array(65_536)); if (produced === 1_024) controller.close(); },
      cancel() { cancelled.resolve(); },
    })));
    const request = get(origin);
    const [response] = await once(request, "response");
    response.pause();
    for (let turn = 0; turn < 20; turn += 1) await nextTurn();
    expect(produced).toBeLessThan(1_024);
    request.destroy();
    await cancelled.promise;
  });

  it("normal completion does not abort the request or cancel a completed producer", async () => {
    let signal!: AbortSignal;
    const cancel = vi.fn();
    const origin = await serve(async (request) => {
      signal = request.signal;
      return new Response(new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(new TextEncoder().encode("done")); controller.close(); }, cancel }));
    });
    expect(await (await fetch(origin)).text()).toBe("done");
    await nextTurn();
    expect(signal.aborted).toBe(false);
    expect(cancel).not.toHaveBeenCalled();
  });
});
