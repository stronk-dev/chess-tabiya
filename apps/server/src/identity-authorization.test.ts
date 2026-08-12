import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { IdentityService } from "./identity.js";
import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PASSWORD = "correct horse battery staple";
const evidenceExecutor: EvidenceExecutor = {
  async execute() {
    return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } };
  },
};

function cheapDerive(password: string, salt: Buffer): Promise<Buffer> {
  const first = createHash("sha256").update(salt).update(password).digest();
  return Promise.resolve(first);
}

function runBody(id: string) {
  return {
    id,
    session: {
      kind: "position",
      start: { fen: INITIAL_FEN, side: "white" },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common" },
    },
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    seed: 7,
  };
}

function call(
  handler: ReturnType<typeof createRestHandler>,
  method: string,
  path: string,
  options: { readonly body?: unknown; readonly cookie?: string; readonly writerId?: string } = {},
): Promise<Response> {
  return handler(new Request(`http://tabiya.test${path}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.cookie === undefined ? {} : { cookie: options.cookie }),
      ...(options.writerId === undefined ? {} : { "x-writer-id": options.writerId }),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  }));
}

function cookie(response: Response): string {
  return response.headers.get("set-cookie")!.split(";", 1)[0]!;
}

describe("learner identity and run authorization", () => {
  const stores: SQLiteRunStorage[] = [];

  afterEach(() => {
    for (const store of stores.splice(0)) store.close();
  });

  function setup() {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const identity = new IdentityService(storage, {
      cookieSecure: false,
      derive: cheapDerive,
    });
    return {
      storage,
      handler: createRestHandler(
        new RunService(storage, {
          evidenceQueue: new EvidenceJobQueue(evidenceExecutor),
        }),
        undefined,
        undefined,
        identity,
      ),
    };
  }

  async function register(
    handler: ReturnType<typeof createRestHandler>,
    handle: string,
  ) {
    const response = await call(handler, "POST", "/auth/register", {
      body: { handle, password: PASSWORD },
    });
    expect(response.status).toBe(201);
    return { cookie: cookie(response), body: await response.json() as { learner: { id: string; handle: string } } };
  }

  it("keeps run reads scoped and separates authorization from lease possession", async () => {
    const { handler } = setup();
    const alice = await register(handler, "alice");
    const bob = await register(handler, "bob");
    expect((await call(handler, "POST", "/runs", {
      cookie: alice.cookie,
      writerId: "writer-alice",
      body: runBody("private-run"),
    })).status).toBe(201);

    expect((await call(handler, "GET", "/runs/private-run/graph", {
      cookie: bob.cookie,
    })).status).toBe(404);
    const granted = await call(handler, "POST", "/runs/private-run/grants", {
      cookie: alice.cookie,
      writerId: "writer-alice",
      body: { op: "grant", handle: "bob", role: "participant" },
    });
    expect(granted.status).toBe(200);

    const beforeClaim = await call(handler, "GET", "/runs/private-run/graph", {
      cookie: bob.cookie,
      writerId: "writer-alice",
    });
    const beforeBody = await beforeClaim.json() as {
      graph: { viewer: { role: string; mayWrite: boolean; holdsLease: boolean; leaseHeldBy: { learnerId: string } } };
    };
    expect(beforeBody.graph.viewer).toEqual({
      role: "participant",
      mayWrite: true,
      holdsLease: false,
      leaseHeldBy: { learnerId: alice.body.learner.id, handle: "alice" },
    });
    expect(JSON.stringify(beforeBody)).not.toContain("activeWriterId");

    const forged = await call(handler, "POST", "/runs/private-run/moves", {
      cookie: bob.cookie,
      writerId: "writer-alice",
      body: { uci: "e2e4" },
    });
    expect(forged.status).toBe(409);
    expect((await forged.json() as { error: { code: string } }).error.code).toBe("NOT_ACTIVE_WRITER");

    expect((await call(handler, "POST", "/runs/private-run/lease", {
      cookie: bob.cookie,
      writerId: "writer-bob",
      body: {},
    })).status).toBe(200);
    expect((await call(handler, "POST", "/runs/private-run/moves", {
      cookie: bob.cookie,
      writerId: "writer-bob",
      body: { uci: "e2e4" },
    })).status).toBe(200);

    const rows = await call(handler, "GET", "/runs", { cookie: bob.cookie });
    const rowsBody = await rows.json() as { runs: readonly { viewerRole: string; leaseHeldBy: { learnerId: string } }[] };
    expect(rowsBody.runs).toHaveLength(1);
    expect(rowsBody.runs[0]).toMatchObject({
      viewerRole: "participant",
      leaseHeldBy: { learnerId: bob.body.learner.id, handle: "bob" },
    });
  });

  it("rejects missing sessions, spectator writes, and non-JSON grant mutations", async () => {
    const { handler } = setup();
    expect((await call(handler, "GET", "/runs")).status).toBe(401);
    const alice = await register(handler, "alice");
    const bob = await register(handler, "bob");
    await call(handler, "POST", "/runs", {
      cookie: alice.cookie,
      writerId: "writer-alice",
      body: runBody("spectated-run"),
    });
    await call(handler, "POST", "/runs/spectated-run/grants", {
      cookie: alice.cookie,
      writerId: "writer-alice",
      body: { op: "grant", handle: "bob", role: "spectator" },
    });
    expect((await call(handler, "POST", "/runs/spectated-run/moves", {
      cookie: bob.cookie,
      writerId: "writer-alice",
      body: { uci: "e2e4" },
    })).status).toBe(403);
    expect((await call(handler, "POST", "/runs/spectated-run/lease", {
      cookie: bob.cookie,
      writerId: "writer-bob",
      body: {},
    })).status).toBe(403);
    const plain = await handler(new Request("http://tabiya.test/runs/spectated-run/grants", {
      method: "POST",
      headers: { cookie: alice.cookie, "x-writer-id": "writer-alice", "content-type": "text/plain" },
      body: JSON.stringify({ op: "revoke", handle: "bob" }),
    }));
    expect(plain.status).toBe(400);
  });

  it("sets hardened cookies and never authenticates the legacy sentinel", async () => {
    const { handler } = setup();
    const registered = await call(handler, "POST", "/auth/register", {
      body: { handle: "carol", password: PASSWORD },
    });
    const setCookie = registered.headers.get("set-cookie")!;
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).not.toContain("Secure");
    expect((await call(handler, "POST", "/auth/register", {
      body: { handle: "__legacy", password: PASSWORD },
    })).status).toBe(400);
    expect((await call(handler, "POST", "/auth/login", {
      body: { handle: "__legacy", password: PASSWORD },
    })).status).toBe(401);
  });

  it("atomically returns a revoked lease to the acting host", async () => {
    const { handler, storage } = setup();
    const alice = await register(handler, "alice");
    const bob = await register(handler, "bob");
    await call(handler, "POST", "/runs", {
      cookie: alice.cookie,
      writerId: "writer-alice",
      body: runBody("transfer-run"),
    });
    await call(handler, "POST", "/runs/transfer-run/grants", {
      cookie: alice.cookie,
      writerId: "writer-alice",
      body: { op: "grant", handle: "bob", role: "participant" },
    });
    await call(handler, "POST", "/runs/transfer-run/lease", {
      cookie: bob.cookie,
      writerId: "writer-bob",
      body: {},
    });
    expect(storage.read("transfer-run")?.activeWriterLearnerId).toBe(bob.body.learner.id);
    const revoked = await call(handler, "POST", "/runs/transfer-run/grants", {
      cookie: alice.cookie,
      writerId: "writer-alice-new",
      body: { op: "revoke", handle: "bob" },
    });
    expect(revoked.status).toBe(200);
    expect(storage.read("transfer-run")).toMatchObject({
      activeWriterId: "writer-alice-new",
      activeWriterLearnerId: alice.body.learner.id,
    });
    storage.clearSnapshotCache();
    expect(storage.read("transfer-run")).toMatchObject({
      activeWriterId: "writer-alice-new",
      activeWriterLearnerId: alice.body.learner.id,
    });
    expect((await call(handler, "POST", "/runs/transfer-run/moves", {
      cookie: alice.cookie,
      writerId: "writer-alice-new",
      body: { uci: "e2e4" },
    })).status).toBe(200);
    expect((await call(handler, "GET", "/runs/transfer-run/graph", {
      cookie: bob.cookie,
    })).status).toBe(404);
  });

  it("reassigns deleted-account runs while preserving another learner's grant", async () => {
    const { handler, storage } = setup();
    const alice = await register(handler, "alice");
    const bob = await register(handler, "bob");
    await call(handler, "POST", "/runs", {
      cookie: alice.cookie,
      writerId: "writer-alice",
      body: runBody("orphan-safe-run"),
    });
    await call(handler, "POST", "/runs/orphan-safe-run/grants", {
      cookie: alice.cookie,
      writerId: "writer-alice",
      body: { op: "grant", handle: "bob", role: "participant" },
    });
    const deleted = await call(handler, "POST", "/auth/delete", {
      cookie: alice.cookie,
      body: { password: PASSWORD },
    });
    expect(deleted.status).toBe(200);
    expect(storage.read("orphan-safe-run")?.activeWriterLearnerId).toBe("__legacy");
    storage.clearSnapshotCache();
    expect(storage.read("orphan-safe-run")?.activeWriterLearnerId).toBe("__legacy");
    const graph = await call(handler, "GET", "/runs/orphan-safe-run/graph", {
      cookie: bob.cookie,
    });
    expect(graph.status).toBe(200);
    expect(await graph.json()).toMatchObject({
      graph: { viewer: { role: "participant", leaseHeldBy: { handle: "__legacy" } } },
    });
    expect((await call(handler, "POST", "/runs/orphan-safe-run/lease", {
      cookie: bob.cookie,
      writerId: "writer-bob",
      body: {},
    })).status).toBe(200);
    expect((await call(handler, "POST", "/runs/orphan-safe-run/moves", {
      cookie: bob.cookie,
      writerId: "writer-bob",
      body: { uci: "e2e4" },
    })).status).toBe(200);
    expect((await call(handler, "GET", "/auth/session", { cookie: alice.cookie })).status).toBe(401);
    const replacement = await register(handler, "alice");
    expect((await call(handler, "GET", "/runs/orphan-safe-run/graph", {
      cookie: replacement.cookie,
    })).status).toBe(404);
  });

  it("locks after ten failures and performs one derivation for every login shape", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    let now = new Date("2026-08-12T12:00:00.000Z");
    let derivations = 0;
    const identity = new IdentityService(storage, {
      cookieSecure: false,
      now: () => now,
      derive: async (password, salt) => {
        derivations += 1;
        return cheapDerive(password, salt);
      },
    });
    await identity.register({ handle: "locked", password: PASSWORD });
    await Promise.resolve();
    for (let failure = 0; failure < 10; failure += 1) {
      const before = derivations;
      await expect(identity.login("locked", "definitely-wrong-password")).rejects.toMatchObject({
        code: "UNAUTHENTICATED",
      });
      expect(derivations - before).toBe(1);
    }
    const beforeLocked = derivations;
    await expect(identity.login("locked", PASSWORD)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(derivations - beforeLocked).toBe(1);
    const beforeUnknown = derivations;
    await expect(identity.login("missing", PASSWORD)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(derivations - beforeUnknown).toBe(1);
    storage.createLearner({
      id: "learner-malformed",
      handle: "malformed",
      displayName: "malformed",
      passwordHash: "not-a-password-hash",
      createdAt: now.toISOString(),
    });
    const beforeMalformed = derivations;
    await expect(identity.login("malformed", PASSWORD)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(derivations - beforeMalformed).toBe(1);
    now = new Date("2026-08-12T12:16:00.000Z");
    await expect(identity.login("locked", PASSWORD)).resolves.toMatchObject({
      learner: { handle: "locked" },
    });
  });
});
