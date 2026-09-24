// rfc/famous-games.md at the production application boundary (`createApplication`, ENGINE_MODE=mock).
//
// The RFC is scoped to the AUTHORING path (§4). It ships no HTTP route and no client surface: the
// learner-facing masters import is Discharge D2, cross-pack consumers are D4, and a per-game corpus
// surface is D5. These tests hold that scope at the real boundary so the lift cannot leak into a
// learner surface by accident, and they verify §4's one claim about the shipped loop: a pasted
// historical game already imports into a playable run.
import { readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ChessTabiyaApplication } from "./application.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";

const policyConfig = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;

describe("famous games through the production application", { timeout: 20_000 }, () => {
  let application: ChessTabiyaApplication | undefined;
  afterEach(async () => { await application?.close(); application = undefined; });

  async function start() {
    application = await createInMemoryTestApplication({ development: true, engineMode: "mock", cookieSecure: false });
    await new Promise<void>((done, reject) => {
      application!.server.once("error", reject);
      application!.server.listen(0, "127.0.0.1", done);
    });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    const registered = await fetch(`${origin}/auth/register`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: "masters_learner", password: "masters-learner-password" }),
    });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const call = async (method: string, path: string, body?: unknown) => {
      const response = await fetch(`${origin}${path}`, {
        method,
        headers: { cookie, "x-writer-id": "writer-masters", ...(body === undefined ? {} : { "content-type": "application/json" }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      return { status: response.status, body: text.length === 0 ? undefined : JSON.parse(text) as Record<string, unknown>, text };
    };
    return { call };
  }

  it("refuses a masters URL at the learner import door: D2 is deferred, not smuggled through lichess_url", async () => {
    const { call } = await start();
    const viaLichess = await call("POST", "/runs/import", {
      id: "masters-by-url", side: "white", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig, seed: 1,
      source: { kind: "lichess", url: "https://explorer.lichess.org/masters/pgn/aAbqI4ey" },
    });
    expect(viaLichess.status, viaLichess.text).toBe(422);
    expect(viaLichess.body).toMatchObject({ error: { code: "IMPORT_SOURCE_UNSUPPORTED" } });
    const viaKind = await call("POST", "/runs/import", {
      id: "masters-by-kind", side: "white", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig, seed: 1,
      source: { kind: "masters", url: "https://explorer.lichess.org/masters/pgn/aAbqI4ey" },
    });
    expect(viaKind.status, viaKind.text).toBe(400);
    const runs = await call("GET", "/runs");
    expect(runs.text).not.toContain("masters-by-");
  });

  it("imports the recorded masters score as a pasted game into a playable run (§4's shipped-loop claim)", async () => {
    const { call } = await start();
    const pgn = (await readFile(resolve("apps/server/src/sourcing/fixtures/masters-game-aAbqI4ey.pgn"), "utf8")).trimEnd();
    const imported = await call("POST", "/runs/import", {
      id: "famous-game-paste", side: "white", opponentPolicy: { mode: "human_common", targetElo: 1500 }, policyConfig, seed: 2,
      source: { kind: "pgn", pgn },
    });
    expect(imported.status, imported.text).toBe(201);
    const run = imported.body!.run as { nodes: { id: string; moveUci?: string | null }[] };
    // Root plus the 85 plies of Carlsen–Chadaev, Astana 2012, replayed through the shipped commit path.
    expect(run.nodes).toHaveLength(86);
    const rewound = await call("POST", "/runs/famous-game-paste/rewind", { nodeId: run.nodes[10]!.id });
    expect(rewound.status, rewound.text).toBe(200);
  });

  it("keeps capability dispositions server-side under ENGINE_MODE=mock: the lift adds no learner-facing surface", async () => {
    const { call } = await start();
    const capabilities = await call("GET", "/capabilities");
    expect(capabilities.status, capabilities.text).toBe(200);
    expect(capabilities.body).not.toHaveProperty("capabilityDispositions");
    expect(capabilities.text).not.toMatch(/masters|topGames/);
    expect(capabilities.body).toMatchObject({ providerHealth: { providers: expect.arrayContaining([expect.objectContaining({ instanceId: "maia-inference", implementation: "local_fixture" })]) } });
  });
});
