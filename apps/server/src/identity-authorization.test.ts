import { createHash } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { IdentityService } from "./identity.js";
import { LiveSessionService } from "./live-session.js";
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
        undefined,
        new LiveSessionService(storage),
      ),
    };
  }

  it("defaults session cookies to Secure when the option is omitted", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    stores.push(storage);
    const identity = new IdentityService(storage, { derive: cheapDerive });
    const session = await identity.register({ handle: "secure-default", password: PASSWORD });
    expect(session.cookie).toContain("; Secure");
  });

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
    const live = await call(handler, "POST", "/sessions", { cookie: alice.cookie, body: { runId: "private-run", kind: "academy", title: "Private lesson" } });
    const liveId = (await live.json() as { session: { id: string } }).session.id;
    await call(handler, "POST", `/sessions/${liveId}/board`, { cookie: alice.cookie, writerId: "writer-alice", body: { op: "offer", handle: "bob" } });

    const beforeClaim = await call(handler, "GET", "/runs/private-run/graph", {
      cookie: bob.cookie,
      writerId: "writer-alice",
    });
    const beforeBody = await beforeClaim.json() as {
      graph: { viewer: { role: string; mayWrite: boolean; holdsLease: boolean; leaseHeldBy: { learnerId: string } } };
    };
    expect(beforeBody.graph.viewer).toMatchObject({
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
    const { storage, handler } = setup();
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
    const rootNodeId = storage.read("spectated-run")!.run.nodes[0]!.id;
    expect((await call(handler, "POST", "/runs/spectated-run/flip", {
      cookie: bob.cookie,
      body: { nodeId: rootNodeId },
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

  it("exports deterministic account bytes only after password reconfirmation", async () => {
    const { handler } = setup();
    const alice = await register(handler, "alice");
    const wrong = await call(handler, "POST", "/auth/export", { cookie: alice.cookie, body: { password: "definitely-wrong-password" } });
    expect(wrong.status).toBe(401);
    const first = await call(handler, "POST", "/auth/export", { cookie: alice.cookie, body: { password: PASSWORD } });
    const second = await call(handler, "POST", "/auth/export", { cookie: alice.cookie, body: { password: PASSWORD } });
    expect(first.status).toBe(200);
    expect(first.headers.get("content-type")).toBe("application/vnd.tabiya.account+json; version=1");
    expect(first.headers.get("content-disposition")).toBe('attachment; filename="tabiya-account-alice.json"');
    expect(first.headers.get("cache-control")).toBe("no-store");
    const firstText = await first.text();
    expect(firstText).toBe(await second.text());
    expect(first.headers.get("x-tabiya-export-sha256")).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(firstText).not.toContain(PASSWORD);
    expect(firstText).toContain('"kind":"password_hash"');
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
    const live = await call(handler, "POST", "/sessions", { cookie: alice.cookie, body: { runId: "transfer-run", kind: "academy", title: "Transfer lesson" } });
    const liveId = (await live.json() as { session: { id: string } }).session.id;
    await call(handler, "POST", `/sessions/${liveId}/board`, { cookie: alice.cookie, writerId: "writer-alice", body: { op: "offer", handle: "bob" } });
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

  it("tombstones shared runs read-only while deleting the departing account", async () => {
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
    const sessionResponse = await call(handler, "POST", "/sessions", {
      cookie: alice.cookie,
      body: { runId: "orphan-safe-run", kind: "academy", title: "Shared study" },
    });
    expect(sessionResponse.status).toBe(201);
    const sessionId = (await sessionResponse.json() as { session: { id: string } }).session.id;
    const previewResponse = await call(handler, "POST", "/auth/deletion-preview", { cookie: alice.cookie, body: {} });
    const preview = await previewResponse.json() as { digest: string; tombstone: readonly { objectIds: readonly string[] }[] };
    expect(preview.tombstone.flatMap((effect) => effect.objectIds)).toEqual(["orphan-safe-run"]);
    const deleted = await call(handler, "POST", "/auth/delete", {
      cookie: alice.cookie,
      body: { password: PASSWORD, previewDigest: preview.digest },
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
      graph: { viewer: { role: "spectator", leaseHeldBy: { handle: "__legacy" } } },
    });
    const blocked = await call(handler, "POST", "/runs/orphan-safe-run/lease", {
      cookie: bob.cookie,
      writerId: "writer-bob",
      body: {},
    });
    expect(blocked.status).toBe(403);
    const branchId = storage.read("orphan-safe-run")!.run.branches[0]!.id;
    const refused = await Promise.all([
      call(handler, "POST", "/runs/orphan-safe-run/moves", { cookie: bob.cookie, writerId: "writer-bob", body: { uci: "e2e4" } }),
      call(handler, "POST", "/runs/orphan-safe-run/grants", { cookie: bob.cookie, writerId: "writer-bob", body: { op: "grant", handle: "bob", role: "participant" } }),
      call(handler, "POST", "/runs/orphan-safe-run/share", { cookie: bob.cookie, body: { branchId } }),
      call(handler, "POST", "/sessions", { cookie: bob.cookie, body: { runId: "orphan-safe-run", kind: "academy", title: "Reopened" } }),
      call(handler, "POST", `/sessions/${sessionId}`, { cookie: bob.cookie, body: { op: "close" } }),
      call(handler, "POST", `/sessions/${sessionId}/board`, { cookie: bob.cookie, writerId: "writer-bob", body: { op: "reclaim" } }),
      call(handler, "POST", `/sessions/${sessionId}/links`, { cookie: bob.cookie, body: { invitedRole: "spectator" } }),
    ]);
    expect(refused.map((response) => response.status)).toEqual([403, 403, 403, 403, 403, 403, 403]);
    expect((await call(handler, "GET", "/auth/session", { cookie: alice.cookie })).status).toBe(401);
    const replacement = await register(handler, "alice");
    expect((await call(handler, "GET", "/runs/orphan-safe-run/graph", {
      cookie: replacement.cookie,
    })).status).toBe(404);
  });

  it("hard-deletes private runs and rejects a stale account preview without mutation", async () => {
    const { handler, storage } = setup();
    const alice = await register(handler, "alice");
    const bob = await register(handler, "bob");
    await call(handler, "POST", "/runs", { cookie: alice.cookie, writerId: "writer-alice", body: runBody("solo-run") });
    const initial = await (await call(handler, "POST", "/auth/deletion-preview", { cookie: alice.cookie, body: {} })).json() as { digest: string; hardDelete: readonly { objectIds: readonly string[] }[] };
    expect(initial.hardDelete.flatMap((effect) => effect.objectIds)).toContain("solo-run");
    await call(handler, "POST", "/runs/solo-run/grants", { cookie: alice.cookie, writerId: "writer-alice", body: { op: "grant", handle: "bob", role: "spectator" } });
    const stale = await call(handler, "POST", "/auth/delete", { cookie: alice.cookie, body: { password: PASSWORD, previewDigest: initial.digest } });
    expect(stale.status).toBe(409);
    expect((await stale.json() as { error: { code: string } }).error.code).toBe("DELETION_PREVIEW_STALE");
    expect(storage.learnerById(alice.body.learner.id)).toBeDefined();
    expect(storage.read("solo-run")).toBeDefined();
    await call(handler, "POST", "/runs/solo-run/grants", { cookie: alice.cookie, writerId: "writer-alice", body: { op: "revoke", handle: "bob" } });
    const current = await (await call(handler, "POST", "/auth/deletion-preview", { cookie: alice.cookie, body: {} })).json() as { digest: string };
    expect((await call(handler, "POST", "/auth/delete", { cookie: alice.cookie, body: { password: PASSWORD, previewDigest: current.digest } })).status).toBe(200);
    expect(storage.read("solo-run")).toBeUndefined();
  });

  it("previews and deletes one owned run without deleting the account", async () => {
    const { handler, storage } = setup();
    const alice = await register(handler, "alice");
    const bob = await register(handler, "bob");
    await call(handler, "POST", "/runs", { cookie: alice.cookie, writerId: "writer-alice", body: runBody("delete-one") });
    expect((await call(handler, "POST", "/runs/delete-one/deletion-preview", { cookie: bob.cookie, body: {} })).status).toBe(404);
    const preview = await (await call(handler, "POST", "/runs/delete-one/deletion-preview", { cookie: alice.cookie, body: {} })).json() as { digest: string; hardDelete: readonly { objectIds: readonly string[] }[] };
    expect(preview.hardDelete.flatMap((effect) => effect.objectIds)).toContain("delete-one");
    expect((await call(handler, "POST", "/runs/delete-one/delete", { cookie: alice.cookie, body: { previewDigest: preview.digest } })).status).toBe(200);
    expect(storage.read("delete-one")).toBeUndefined();
    expect((await call(handler, "GET", "/auth/session", { cookie: alice.cookie })).status).toBe(200);
  });

  it("turns one shared run into a neutral read-only tombstone without deleting its owner account", async () => {
    const { handler, storage } = setup();
    const alice = await register(handler, "alice");
    const bob = await register(handler, "bob");
    await call(handler, "POST", "/runs", { cookie: alice.cookie, writerId: "writer-alice", body: runBody("delete-shared") });
    await call(handler, "POST", "/runs", { cookie: alice.cookie, writerId: "writer-other", body: runBody("keep-unrelated") });
    await call(handler, "POST", "/runs/delete-shared/grants", { cookie: alice.cookie, writerId: "writer-alice", body: { op: "grant", handle: "bob", role: "participant" } });
    const preview = await (await call(handler, "POST", "/runs/delete-shared/deletion-preview", { cookie: alice.cookie, body: {} })).json() as { digest: string; tombstone: readonly { objectIds: readonly string[] }[] };
    expect(preview.tombstone.flatMap((effect) => effect.objectIds)).toContain("delete-shared");
    expect((await call(handler, "POST", "/runs/delete-shared/delete", { cookie: alice.cookie, body: { previewDigest: preview.digest } })).status).toBe(200);
    expect((await call(handler, "GET", "/auth/session", { cookie: alice.cookie })).status).toBe(200);
    expect((await call(handler, "GET", "/runs/delete-shared/graph", { cookie: alice.cookie })).status).toBe(404);
    expect((await call(handler, "GET", "/runs/keep-unrelated/graph", { cookie: alice.cookie })).status).toBe(200);
    expect((await call(handler, "GET", "/runs/delete-shared/graph", { cookie: bob.cookie })).status).toBe(200);
    expect(storage.list(bob.body.learner.id, 20, 0).find((run) => run.id === "delete-shared")).toMatchObject({ title: "Shared run removed by its owner", viewerRole: "spectator" });
    expect((await call(handler, "POST", "/runs/delete-shared/moves", { cookie: bob.cookie, writerId: "writer-bob", body: { uci: "e2e4" } })).status).toBe(403);
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
