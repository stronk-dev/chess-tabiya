import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { setImmediate } from "node:timers/promises";
import { expect, it } from "vitest";

import { responseStatus } from "./http-response.test-support.js";

it("does not count headers as delivery of an unfinished response body", async () => {
  let body!: ReadableStreamDefaultController<Uint8Array>;
  const response = new Response(new ReadableStream<Uint8Array>({ start(controller) { body = controller; } }), { status: 409 });
  let delivered = false;
  const reading = responseStatus(response).then(status => { delivered = true; return status; });
  await setImmediate();
  expect(delivered).toBe(false);
  expect(response.bodyUsed).toBe(true);
  body.enqueue(new TextEncoder().encode("complete refusal"));
  body.close();
  expect(await reading).toBe(409);
});

it("propagates a body failure instead of reporting a successful header status", async () => {
  const failure = new Error("body did not finish");
  const response = new Response(new ReadableStream({ start(controller) { controller.error(failure); } }), { status: 200 });
  await expect(responseStatus(response)).rejects.toBe(failure);
  expect(response.bodyUsed).toBe(true);
});

it("retains empty-body status without inventing content", async () => {
  expect(await responseStatus(new Response(null, { status: 204 }))).toBe(204);
});

it("preserves the original fetch rejection", async () => {
  const failure = new Error("request failed");
  await expect(responseStatus(Promise.reject(failure))).rejects.toBe(failure);
});

it("owns a real streaming HTTP body before normal server shutdown", async () => {
  let finish!: () => void;
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/plain" });
    response.write("first chunk");
    finish = () => { if (!response.writableEnded) response.end("last chunk"); };
  });
  let reading: Promise<number> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const response = await fetch(origin);
    let delivered = false;
    reading = responseStatus(response).then(status => { delivered = true; return status; });
    await setImmediate();
    expect(delivered).toBe(false);
    expect(response.bodyUsed).toBe(true);
    finish();
    expect(await reading).toBe(200);
  } finally {
    finish?.();
    await reading?.catch(() => undefined);
    await new Promise<void>((resolve, reject) => {
      if (!server.listening) { resolve(); return; }
      server.close(error => error === undefined ? resolve() : reject(error));
    });
  }
});
