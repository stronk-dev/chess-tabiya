// Disposable deployment transport fixture, using the production Node adapter. No chess content,
// storage, identity or product SSE/WebSocket endpoint is added by this release-tier instrument.
import { createHttpServer } from "../../apps/server/src/rest.js";
import { deploymentRefusal, type DeploymentBoundary } from "../../apps/server/src/config.js";

const publicOrigin = process.env.TABIYA_FIXTURE_PUBLIC_ORIGIN!;
const boundary: DeploymentBoundary = {
  profile: "appliance", publicOrigin, allowedOrigins: [publicOrigin],
  allowedHosts: [new URL(publicOrigin).host], listenHost: "0.0.0.0", listenPort: 3000,
  behindBundledProxy: true, secureCookie: true, cookieName: "__Host-tabiya_session", requireOrigin: true,
};

const streams = new Map<string, ReadableStreamDefaultController<Uint8Array>>();
let cancelled = 0;
createHttpServer(async (request) => {
  const url = new URL(request.url);
  if (url.pathname === "/readyz") return new Response("ready");
  const refused = deploymentRefusal(boundary, request);
  if (refused !== undefined) return refused;
  if (url.pathname === "/bounded-reader") {
    const reader = request.body!.getReader();
    await reader.read();
    await reader.cancel();
    return Response.json({ error: { code: "BODY_TOO_LARGE" } }, { status: 413 });
  }
  if (url.pathname === "/state") return Response.json({ cancelled });
  if (url.pathname === "/finish" && request.method === "POST") {
    const stream = streams.get(url.searchParams.get("id")!);
    if (stream === undefined) return new Response("missing", { status: 404 });
    stream.enqueue(new TextEncoder().encode("last\n"));
    stream.close();
    streams.delete(url.searchParams.get("id")!);
    return new Response("finished");
  }
  if (url.pathname !== "/stream") return new Response("missing", { status: 404 });
  const id = url.searchParams.get("id")!;
  return new Response(new ReadableStream<Uint8Array>({
    start(controller) { streams.set(id, controller); controller.enqueue(new TextEncoder().encode("first\n")); },
    cancel() { cancelled += 1; streams.delete(id); },
  }), { headers: { "content-type": url.searchParams.get("type") ?? "text/event-stream", "cache-control": "no-store", "x-stream-source": "production-node-adapter" } });
}).listen(3000, "0.0.0.0");
