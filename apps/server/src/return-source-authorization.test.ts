import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createRun, type CreateRunSession } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";

import { serializeAccountBundle, type AccountBundleV1 } from "./account-data.js";
import { corpusPopulation, type CorpusQuery, type CorpusSource } from "./corpus.js";
import { IdentityService } from "./identity.js";
import { ExchangeCorpusSource } from "./provider-corpus.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { providerOperationDescriptors } from "./provider-operations.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const AT = "2026-10-10T12:00:00.000Z";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const KEY = START.split(" ").slice(0, 4).join(" ");
const PASSWORD = "correct horse battery staple";
const directories: string[] = [];
const stores: SQLiteRunStorage[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const storage of stores.splice(0)) storage.close();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function storage() {
  const directory = mkdtempSync(join(tmpdir(), "return-source-auth-"));
  directories.push(directory);
  const created = new SQLiteRunStorage(join(directory, "tabiya.sqlite"), { onMigration: () => {}, now: () => AT });
  stores.push(created);
  return created;
}

function privateGame(store: SQLiteRunStorage, learnerId: string) {
  const session: CreateRunSession = {
    kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end",
    opponentPolicy: { mode: "human_common", targetElo: 1900 },
  };
  const run = createRun({ id: "private-source", session, sessionDigest: `sha256:${"1".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 3, createdAt: AT });
  store.create(run, { writerId: "private-writer", learnerId }, "Private source");
  return run;
}

function source(modern: boolean) {
  const queries: CorpusQuery[] = [];
  const upstream: URL[] = [];
  const stats: CorpusSource["stats"] = async (query) => {
    queries.push(query);
    const { fen: _fen, ...population } = query;
    return { kind: "stats", total: 120, white: 60, draws: 20, black: 40, moves: [], recency: { kind: "absent" }, population };
  };
  if (!modern) return { corpus: { stats } satisfies CorpusSource, queries, upstream };
  const scheduler = new ProviderExchangeScheduler({
    descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerToken: null,
      explorerFetch: async (url) => {
        upstream.push(new URL(url));
        return new Response(JSON.stringify({ white: 60, draws: 20, black: 40, moves: [], history: [] }), { status: 200 });
      } }),
    maxActive: 1, maxQueued: 2, maxRetainedEntries: 8, maxRetainedWeight: 5_000, retentionTtlMs: 5_000,
    monotonicNowMs: () => performance.now(), wallNow: () => AT,
  });
  const exchange = new ExchangeCorpusSource({ scheduler, monotonicNowMs: () => performance.now() });
  const corpus: CorpusSource = {
    stats: async () => { throw new Error("Modern return must not fall back to bare statistics"); },
    page: async (query, options) => { queries.push(query); return exchange.page(query, options); },
  };
  return { corpus, queries, upstream };
}

function destination(modern: boolean) {
  const store = storage();
  const acquired = source(modern);
  const identity = new IdentityService(store, { cookieSecure: false, derive: async (password, salt) => createHash("sha256").update(salt).update(password).digest() });
  const service = new RunService(store, { progressStorage: store });
  const handler = createRestHandler(service, undefined, undefined, identity, undefined, undefined, undefined, undefined, undefined, undefined, acquired.corpus);
  const call = (method: string, path: string, cookie?: string, body?: unknown) => handler(new Request(`http://tabiya.test${path}`, {
    method, headers: { ...(cookie === undefined ? {} : { cookie }), ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
  const register = async (handle: string) => {
    const response = await call("POST", "/auth/register", undefined, { handle, password: PASSWORD });
    expect(response.status).toBe(201);
    return { cookie: response.headers.get("set-cookie")!.split(";", 1)[0]!, learner: store.learnerByHandle(handle)! };
  };
  return { store, ...acquired, call, register, service };
}

function scheduleBundle(includeRun: boolean, sourceRunId: string | null = "private-source"): AccountBundleV1 {
  const origin = storage();
  origin.createLearner({ id: "source-account", handle: "source_account", passwordHash: "!", createdAt: AT });
  const run = includeRun ? privateGame(origin, "source-account") : undefined;
  origin.createSchedule({ id: "restored-return", learnerId: "source-account", rootKey: `position||${KEY}`, sessionKind: "position", packId: null,
    rootTransposeKey: KEY, kind: "varied", variant: null, origin: "learner", dueAt: AT, createdAt: AT,
    sourceRunId, sourceNodeId: run?.nodes[0]!.id ?? null });
  // Actual canonical archive bytes, read again by the real import routes.
  return JSON.parse(new TextDecoder().decode(serializeAccountBundle(origin.accountBundle("source-account")).bytes)) as AccountBundleV1;
}

async function due(context: ReturnType<typeof destination>, cookie?: string) {
  const response = await context.call("GET", `/progress/due?at=${AT}`, cookie);
  return { status: response.status, body: await response.json() as { schedules: { id: string; dueAt: string; sourceRunId: string | null; frequency: { games: number; population: { ratings: number[] } } | null }[]; waiting: number; intakeLimit: number } };
}

describe.each([false, true])("return source authorization (sealed Explorer=%s)", (modern) => {
  it("does not read an out-of-file private source or send its band through a restored return", async () => {
    const context = destination(modern);
    const owner = await context.register("owner");
    privateGame(context.store, owner.learner.id);
    const learner = await context.register("learner");
    const bundle = scheduleBundle(false);
    const peerBefore = serializeAccountBundle(context.store.accountBundle(owner.learner.id)).digest;
    const preview = await context.call("POST", "/auth/import-preview", learner.cookie, { bundle });
    expect(preview.status).toBe(200);
    expect(context.store.dueSchedules(learner.learner.id, AT)).toEqual([]);
    expect((await context.call("POST", "/auth/import", learner.cookie, { bundle, password: PASSWORD })).status).toBe(201);
    const before = serializeAccountBundle(context.store.accountBundle(learner.learner.id)).digest;
    expect((await due(context)).status).toBe(401);
    expect(context.queries).toEqual([]);
    const reads = vi.spyOn(context.store, "read");
    const queue = await due(context, learner.cookie);
    expect(queue.status).toBe(200);
    expect(context.queries.map((query) => query.ratings)).toEqual([corpusPopulation(undefined).ratings]);
    expect(reads.mock.calls).not.toContainEqual(["private-source"]);
    reads.mockRestore();
    expect(queue.body).toMatchObject({ waiting: 0, intakeLimit: 20, schedules: [{ id: "restored-return", dueAt: AT, sourceRunId: "private-source", frequency: { games: 120, population: { ratings: corpusPopulation(undefined).ratings } } }] });
    if (modern) expect(context.upstream.map((url) => url.searchParams.get("ratings"))).toEqual([corpusPopulation(undefined).ratings.join(",")]);
    expect(serializeAccountBundle(context.store.accountBundle(owner.learner.id)).digest).toBe(peerBefore);
    expect(serializeAccountBundle(context.store.accountBundle(learner.learner.id)).digest).toBe(before);
  });

  it("retains an accessible restored source's exact authored band", async () => {
    const context = destination(modern);
    const learner = await context.register("learner");
    expect((await context.call("POST", "/auth/import", learner.cookie, { bundle: scheduleBundle(true), password: PASSWORD })).status).toBe(201);
    const before = serializeAccountBundle(context.store.accountBundle(learner.learner.id)).digest;
    const queue = await due(context, learner.cookie);
    expect(queue.status).toBe(200);
    expect(context.queries.map((query) => query.ratings)).toEqual([[1800]]);
    expect(queue.body.schedules[0]!.frequency).toMatchObject({ games: 120, population: { ratings: [1800] } });
    if (modern) expect(context.upstream[0]!.searchParams.get("ratings")).toBe("1800");
    expect(serializeAccountBundle(context.store.accountBundle(learner.learner.id)).digest).toBe(before);
  });

  it.each([null, "deleted-source"])("keeps a return with absent source %s and its default population", async (sourceRunId) => {
    const context = destination(modern);
    const learner = await context.register("learner");
    expect((await context.call("POST", "/auth/import", learner.cookie, { bundle: scheduleBundle(false, sourceRunId), password: PASSWORD })).status).toBe(201);
    const before = serializeAccountBundle(context.store.accountBundle(learner.learner.id)).digest;
    const queue = await due(context, learner.cookie);
    expect(queue.status).toBe(200);
    expect(queue.body.schedules).toHaveLength(1);
    expect(queue.body.schedules[0]).toMatchObject({ id: "restored-return", dueAt: AT, sourceRunId, frequency: { games: 120, population: { ratings: corpusPopulation(undefined).ratings } } });
    expect(serializeAccountBundle(context.store.accountBundle(learner.learner.id)).digest).toBe(before);
  });

  it("rechecks a shared source on each request, including after grant revocation and cached frequency", async () => {
    const context = destination(modern);
    const owner = await context.register("owner");
    privateGame(context.store, owner.learner.id);
    const learner = await context.register("learner");
    expect((await context.call("POST", "/auth/import", learner.cookie, { bundle: scheduleBundle(false), password: PASSWORD })).status).toBe(201);
    const actor = { writerId: "private-writer", learnerId: owner.learner.id };
    context.store.grantRole("private-source", learner.learner.id, "spectator", actor, AT);
    expect((await due(context, learner.cookie)).body.schedules[0]!.frequency?.population.ratings).toEqual([1800]);
    context.store.revokeGrant("private-source", learner.learner.id, actor);
    const revoked = await due(context, learner.cookie);
    expect(revoked.status).toBe(200);
    expect(revoked.body.schedules[0]!.frequency?.population.ratings).toEqual(corpusPopulation(undefined).ratings);
    const again = await due(context, learner.cookie);
    expect(again.body).toEqual(revoked.body);
    expect(context.queries.map((query) => query.ratings)).toEqual([[1800], corpusPopulation(undefined).ratings, corpusPopulation(undefined).ratings]);
    if (modern) expect(context.upstream.map((url) => url.searchParams.get("ratings"))).toEqual(["1800", corpusPopulation(undefined).ratings.join(",")]);
  });
});
