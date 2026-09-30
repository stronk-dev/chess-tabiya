import { once } from "node:events";
import type { IncomingMessage } from "node:http";
import { connect, type AddressInfo, type Socket } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { deploymentRefusal, type DeploymentBoundary } from "./config.js";
import { createHttpServer, type RestHandler } from "./rest.js";

const servers: ReturnType<typeof createHttpServer>[] = [];
const sockets: Socket[] = [];
function latch<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
async function serve(handler: RestHandler) {
  const server = createHttpServer(handler);
  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, port: (server.address() as AddressInfo).port };
}
async function wire(port: number, bytes: string | Buffer, deadlineMs = 2_000) {
  const socket = connect({ port, host: "127.0.0.1" });
  sockets.push(socket);
  const chunks: Buffer[] = [];
  socket.on("data", (chunk: Buffer) => chunks.push(chunk));
  const closed = new Promise<Buffer>((resolve, reject) => {
    const timer = setTimeout(() => { socket.destroy(); reject(new Error("HTTP fixture did not close before its deadlock guard")); }, deadlineMs);
    socket.once("error", reject);
    socket.once("close", () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); });
  });
  // A test may be waiting at a dependent latch when this guard fires; retain its rejection for
  // the eventual await without manufacturing an unrelated unhandled-rejection failure.
  void closed.catch(() => undefined);
  await once(socket, "connect");
  socket.write(bytes);
  return { socket, closed };
}
afterEach(async () => {
  for (const socket of sockets.splice(0)) socket.destroy();
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

const boundary: DeploymentBoundary = {
  profile: "hosted", publicOrigin: "https://tabiya.example", allowedOrigins: ["https://tabiya.example"],
  allowedHosts: ["tabiya.example"], listenHost: "127.0.0.1", listenPort: 0,
  behindBundledProxy: true, secureCookie: true, cookieName: "__Host-tabiya_session", requireOrigin: true,
};

describe("production HTTP ingress before API parsing", () => {
  it.each([
    { name: "wrong Origin", host: "tabiya.example", origin: "https://other.example", site: "same-origin", status: 403 },
    { name: "cross-site metadata", host: "tabiya.example", origin: "https://tabiya.example", site: "cross-site", status: 403 },
    { name: "wrong Host", host: "other.example", origin: "https://tabiya.example", site: "same-origin", status: 421 },
  ])("refuses $name without consuming or waiting for the incomplete upload", async ({ host, origin, site, status }) => {
    let incoming!: IncomingMessage;
    const reachedApi = vi.fn();
    const { server, port } = await serve(async (request) => {
      expect(incoming.readableDidRead).toBe(false);
      expect(request.bodyUsed).toBe(false);
      const refusal = deploymentRefusal(boundary, request);
      if (refusal !== undefined) return refusal;
      reachedApi();
      return new Response("unexpected");
    });
    server.prependListener("request", (request) => { incoming = request; });
    const { closed } = await wire(port, `POST /auth/login HTTP/1.1\r\nHost: ${host}\r\nX-Forwarded-Host: tabiya.example\r\nX-Forwarded-Proto: https\r\nOrigin: ${origin}\r\nSec-Fetch-Site: ${site}\r\nContent-Length: 1000000\r\n\r\nX`);
    const response = (await closed).toString("utf8");
    expect(response).toMatch(new RegExp(`^HTTP/1.1 ${status} `));
    expect(response).toContain(status === 403 ? "ORIGIN_REFUSED" : "MISDIRECTED_REQUEST");
    expect(response.toLowerCase()).toContain("connection: close");
    expect(reachedApi).not.toHaveBeenCalled();
  });

  it("delivers request chunks before EOF, preserving non-UTF8 bytes", async () => {
    const firstRead = latch<Uint8Array>();
    const { port } = await serve(async (request) => {
      const reader = request.body!.getReader();
      const first = (await reader.read()).value!;
      firstRead.resolve(first);
      const rest = (await reader.read()).value!;
      expect((await reader.read()).done).toBe(true);
      return new Response(new Uint8Array([...first, ...rest]), { headers: { "content-length": "4" } });
    });
    const { socket, closed } = await wire(port, Buffer.concat([
      Buffer.from("POST /echo HTTP/1.1\r\nHost: localhost\r\nContent-Length: 4\r\nConnection: close\r\n\r\n"),
      Buffer.from([0xff, 0x00]),
    ]));
    expect(Array.from(await Promise.race([firstRead.promise, closed.then(() => { throw new Error("response closed before the first request chunk"); })]))).toEqual([0xff, 0x00]);
    socket.write(Buffer.from([0xfe, 0x80]));
    const response = await closed;
    expect(response.subarray(-4)).toEqual(Buffer.from([0xff, 0x00, 0xfe, 0x80]));
  });

  it("lets a bounded consumer cancel an upload and still send its typed refusal", async () => {
    const { port } = await serve(async (request) => {
      const reader = request.body!.getReader();
      await reader.read();
      await reader.cancel();
      return Response.json({ error: { code: "BODY_TOO_LARGE" } }, { status: 413 });
    });
    const { closed } = await wire(port, "POST /import HTTP/1.1\r\nHost: localhost\r\nContent-Length: 1000000\r\n\r\nX");
    const response = (await closed).toString("utf8");
    expect(response).toMatch(/^HTTP\/1.1 413 /);
    expect(response).toContain("BODY_TOO_LARGE");
    expect(response.toLowerCase()).toContain("connection: close");
  });

  it("cancels a pending first read without waiting for another upload byte", async () => {
    const { port } = await serve(async (request) => {
      const reader = request.body!.getReader();
      const pending = reader.read();
      await reader.cancel();
      expect(await pending).toEqual({ value: undefined, done: true });
      return Response.json({ error: { code: "BODY_TOO_LARGE" } }, { status: 413 });
    });
    const { closed } = await wire(port, "POST /import HTTP/1.1\r\nHost: localhost\r\nContent-Length: 1000000\r\n\r\n");
    const response = (await closed).toString("utf8");
    expect(response).toMatch(/^HTTP\/1.1 413 /);
    expect(response).toContain("BODY_TOO_LARGE");
  });

  it("owns explicit receive deadlines without a generic response deadline", async () => {
    const { server } = await serve(async () => new Response("ok"));
    expect(Reflect.get(server, "maxHeaderSize")).toBe(16 * 1_024);
    expect(server.headersTimeout).toBe(10_000);
    expect(server.requestTimeout).toBe(30_000);
    expect(server.keepAliveTimeout).toBe(5_000);
    expect(server.timeout).toBe(0);
  });

  it("refuses oversized headers at the native parser without calling the application", async () => {
    const handler = vi.fn(async () => new Response("unexpected"));
    const { port } = await serve(handler);
    const { closed } = await wire(port, `GET / HTTP/1.1\r\nHost: localhost\r\nX-Oversized: ${"x".repeat(16 * 1_024)}\r\n\r\n`);
    expect((await closed).toString("utf8")).toMatch(/^HTTP\/1.1 431 /);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns native 408 for incomplete headers", async () => {
    const handler = vi.fn(async () => new Response("unexpected"));
    const { port } = await serve(handler);
    const { closed } = await wire(port, "POST / HTTP/1.1\r\nHost: localhost\r\n", 15_000);
    expect((await closed).toString("utf8")).toMatch(/^HTTP\/1.1 408 /);
    expect(handler).not.toHaveBeenCalled();
  }, 17_000);

  it("returns one native 408 for an incomplete request body and aborts its consumer", async () => {
    let signal!: AbortSignal;
    const entered = latch<void>();
    const { port } = await serve(async (request) => {
      signal = request.signal;
      entered.resolve();
      await request.text();
      return new Response("unexpected");
    });
    const { closed } = await wire(port, "POST / HTTP/1.1\r\nHost: localhost\r\nContent-Length: 2\r\n\r\nX", 35_000);
    const response = (await closed).toString("utf8");
    await entered.promise;
    expect(response).toMatch(/^HTTP\/1.1 408 /);
    expect(response.match(/HTTP\/1\.1 /g)).toHaveLength(1);
    expect(signal.aborted).toBe(true);
  }, 37_000);
});
