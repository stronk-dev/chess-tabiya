// rfc/hint-distance.md §7 — the Guided Hint production path through `createApplication` (criteria 10,
// 12, 15 and the D1638/D1643 protocol arms), plus the service's own source/voice arms.

import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  compileAssistanceRequest,
  hintDecisionStamp,
  parseHintResponse,
  type DrillRun,
  type HintResponse,
  type HintRung,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { CandidatePopulationService } from "./candidate-population-service.js";
import { HintService, type HintAccess } from "./hint-service.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";

/** The mock engine plays the alphabetically first legal move: Na4-b2 forks the two rooks. */
const FORK_FEN = "k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1";
const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const preference = (preset: "guided" | "quiet" | "support") => ({ kind: "explicit" as const, preset, overrides: {}, moduleOverrides: { include: [], exclude: [] } });

describe("Guided Hint through createApplication", { timeout: 60_000 }, () => {
  let application: ChessTabiyaApplication | undefined;
  let directory: string | undefined;
  afterEach(async () => {
    const closing = application;
    const removing = directory;
    application = undefined;
    directory = undefined;
    try {
      await closing?.close();
    } finally {
      if (removing !== undefined) rmSync(removing, { recursive: true, force: true });
    }
  });

  async function start(): Promise<string> {
    directory = mkdtempSync(join(tmpdir(), "tabiya-hint-"));
    application = await createApplication({ development: true, engineMode: "mock", cookieSecure: false, databasePath: join(directory, "hint.sqlite"), longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
    return `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
  }

  async function session(origin: string, fen: string) {
    const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "hinter", password: "hinter-password-long" }) });
    expect(registered.status).toBe(201);
    const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
    const writer = "writer-hint";
    const headers = { "content-type": "application/json", cookie, "x-writer-id": writer };
    const post = (path: string, body: unknown) => fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    const created = await post("/runs", { id: "hint-run", session: { kind: "position", start: { fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } }, policyConfig, seed: 3 });
    expect(created.status, await created.clone().text()).toBe(201);
    const run = async (): Promise<DrillRun> => {
      const graph = await (await fetch(`${origin}/runs/hint-run/graph`, { headers })).json() as { graph: { nodes: DrillRun["nodes"]; branches: DrillRun["branches"]; activeCursor: DrillRun["activeCursor"] } };
      const events = await (await fetch(`${origin}/runs/hint-run/events?sinceSeq=0`, { headers })).json() as { events: DrillRun["events"] };
      return { id: "hint-run", feedbackPolicy: "attempt_end", events: events.events, nodes: graph.graph.nodes, branches: graph.graph.branches, activeCursor: graph.graph.activeCursor } as unknown as DrillRun;
    };
    const ask = async (rung: HintRung, preset: "guided" | "quiet" | "support" = "guided", digest?: string): Promise<HintResponse> => {
      const current = await run();
      const response = await post("/runs/hint-run/hints", { nodeId: current.activeCursor.nodeId, rung, decisionDigest: digest ?? hintDecisionStamp(current).digest, assistance: compileAssistanceRequest({ contextHint: "position", preference: preference(preset) }) });
      expect(response.status, await response.clone().text()).toBe(200);
      return parseHintResponse((await response.json() as { hint: unknown }).hint);
    };
    const poll = async (requestId: string): Promise<Response> => fetch(`${origin}/runs/hint-run/hints/${requestId}`, { headers });
    const settle = async (first: HintResponse): Promise<HintResponse> => {
      let current = first;
      for (let attempt = 0; attempt < 400 && current.state === "pending"; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        const response = await poll(current.requestId);
        expect(response.status, await response.clone().text()).toBe(200);
        current = parseHintResponse((await response.json() as { hint: unknown }).hint);
      }
      return current;
    };
    return { headers, post, run, ask, poll, settle };
  }

  it("Guide me: closed boundary refuses; after reveal the ladder climbs to the proposed distance ceiling and never reveals the move", async () => {
    const origin = await start();
    const { post, ask, settle, poll } = await session(origin, FORK_FEN);
    // [criterion 10] a closed disclosure boundary is a policy refusal, not an empty hint.
    expect(await ask("pattern")).toEqual({ state: "policy_refused", rung: "pattern", reason: "disclosure_closed" });
    expect((await post("/runs/hint-run/reveal", {})).status).toBe(200);
    // Quiet carries no guided_hint: refused by module, never by availability.
    expect(await ask("pattern", "quiet")).toEqual({ state: "policy_refused", rung: "pattern", reason: "module_inactive" });

    const first = await ask("pattern");
    expect(["pending", "available"]).toContain(first.state);
    // [§7 step 2] repeating the same POST joins the same operation.
    const again = await ask("pattern");
    expect(again.state === "pending" || again.state === "available" ? (again.state === "pending" ? again.requestId : again.delivery.requestId) : undefined).toBe(first.state === "pending" ? first.requestId : first.state === "available" ? first.delivery.requestId : undefined);
    const pattern = await settle(first);
    if (pattern.state !== "available") throw new Error(`expected an available pattern hint, got ${JSON.stringify(pattern)}`);
    expect(pattern.delivery).toMatchObject({ rung: "pattern", family: "double_attack", projectionId: "derived.hint.disclosure.double_attack.pattern", marks: { rung: "pattern" }, rendered: { source: "deterministic", voice: { state: "not_requested" } } });
    expect(pattern.delivery.rendered.sentence).toBe("A Mock Stockfish mock-1 search from here (depth 12) finds a double attack for you.");
    expect(JSON.stringify({ sentence: pattern.delivery.rendered.sentence, marks: pattern.delivery.marks })).not.toMatch(/d1|d3|a4|b2|Nb2/u);

    const square = await settle(await ask("square"));
    expect(square.state === "available" && square.delivery.marks).toEqual({ rung: "square", squares: ["d1", "d3"] });
    const piece = await settle(await ask("piece"));
    expect(piece.state === "available" && piece.delivery.marks).toEqual({ rung: "piece", squares: ["d1", "d3"], piece: { color: "white", role: "knight", square: "a4" } });
    const distance = await settle(await ask("distance"));
    if (distance.state !== "available") throw new Error("expected distance");
    expect(distance.delivery.rendered.sentence).toContain("It appears after this move.");
    expect(JSON.stringify({ sentence: distance.delivery.rendered.sentence, marks: distance.delivery.marks })).not.toMatch(/a4b2|Nb2|"arrow"/u);
    // [D1639 proposed table] Guide me x position is capped at `distance`: the move rung is policy, not availability.
    expect(await ask("move")).toEqual({ state: "policy_refused", rung: "move", reason: "above_ceiling" });

    // [criterion 12] an unknown id (a restart looks the same) is an explicit 404 so the client re-POSTs.
    const unknown = await poll("0".repeat(32));
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({ error: { code: "HINT_REQUEST_NOT_FOUND" } });
  });

  it("[D1643] commit, rewind and a late poll make the decision stale; an old digest is refused before any work", async () => {
    const origin = await start();
    const { post, ask, run, poll, headers } = await session(origin, FORK_FEN);
    expect((await post("/runs/hint-run/reveal", {})).status).toBe(200);
    const before = await run();
    // A digest the server does not recompute is refused as stale before any search starts.
    const stale = await ask("pattern", "guided", `sha256:${"0".repeat(64)}`);
    expect(stale.state).toBe("stale");
    // DELETE of a live operation cancels it; the id is then unknown (404 -> the client re-POSTs).
    const live = await ask("square");
    const liveId = live.state === "pending" ? live.requestId : live.state === "available" ? live.delivery.requestId : "";
    const deleted = await fetch(`${origin}/runs/hint-run/hints/${liveId}`, { method: "DELETE", headers });
    expect(parseHintResponse((await deleted.json() as { hint: unknown }).hint)).toEqual({ state: "cancelled", requestId: liveId, rung: "square" });
    expect((await poll(liveId)).status).toBe(404);
    // A commit moves the decision: the in-flight operation answers `stale`, never a late result.
    const pending = await ask("pattern");
    const requestId = pending.state === "pending" ? pending.requestId : pending.state === "available" ? pending.delivery.requestId : "";
    expect(requestId).toMatch(/^[0-9a-f]{32}$/u);
    const committed = await post("/runs/hint-run/moves", { uci: "h7g7" });
    expect(committed.status, await committed.clone().text()).toBeLessThan(300);
    const late = await poll(requestId);
    expect(late.status).toBe(200);
    expect(parseHintResponse((await late.json() as { hint: unknown }).hint)).toEqual({ state: "stale", requestId, rung: "pattern" });
    // The commit re-closed the attempt_end boundary: a new request is policy, not a hint.
    expect((await ask("pattern")).state).toBe("policy_refused");
    // Rewinding back to the same node is a different decision (the event head moved).
    const rewound = await post("/runs/hint-run/rewind", { nodeId: before.activeCursor.nodeId });
    expect(rewound.status, await rewound.clone().text()).toBeLessThan(300);
    const after = await run();
    expect(after.activeCursor.nodeId).toBe(before.activeCursor.nodeId);
    expect(hintDecisionStamp(after).digest).not.toBe(hintDecisionStamp(before).digest);
  });

  it("an allowed request whose searched line admits nothing is an honest empty, never a padded engine move", async () => {
    const origin = await start();
    const { post, ask, settle } = await session(origin, INITIAL_FEN);
    expect((await post("/runs/hint-run/reveal", {})).status).toBe(200);
    const result = await settle(await ask("pattern", "support"));
    expect(result).toMatchObject({ state: "honest_empty", rung: "pattern", reason: "no_admitted_occurrence" });
    expect(JSON.stringify(result)).not.toMatch(/a2a3|a3/u);
  });
});

describe("HintService source and voice arms", () => {
  const access = (run: DrillRun, fen: string): HintAccess => ({ run, decision: hintDecisionStamp(run), fen, role: "learner", session: "position", voiceRequested: true });
  const run = { id: "unit", feedbackPolicy: "attempt_end", events: [{ seq: 1, type: "feedback.revealed", at: "2026-09-24T12:00:00.000Z", data: { nodeId: "n0" } }], nodes: [], branches: [], activeCursor: { branchId: "main", nodeId: "n0" } } as unknown as DrillRun;
  const engine = async () => ({ id: "stockfish-analysis", version: "mock-1" });
  const settle = async (service: HintService, first: HintResponse): Promise<HintResponse> => {
    await service.whenIdle();
    return first.state === "pending" ? service.poll("unit", first.requestId, hintDecisionStamp(run)) : first;
  };
  const real = () => composeProviderTraversalApplication({ engines: new MockProviderEngineClient(), tablebaseFetch: null, explorerFetch: null, explorerToken: null }).scheduler;

  it("[D1638] search absence is source_unavailable; voice absence, timeout, refusal and invalid output keep the hint available", async () => {
    const populations = new CandidatePopulationService({ capacity: 8 });
    const off = new HintService({ scheduler: null, requestedEngine: engine, populations, depth: 12, timeoutMs: 1_000, maxOperations: 8 });
    expect(off.request(access(run, FORK_FEN), "pattern")).toMatchObject({ state: "source_unavailable", reason: "provider_unavailable" });
    // Provider health says the search source is down: honest source_unavailable before any search.
    let searched = 0;
    const unhealthy = new HintService({ scheduler: { get: async () => { searched += 1; throw new Error("must not search"); } }, requestedEngine: engine, populations, depth: 12, timeoutMs: 1_000, maxOperations: 8, availability: () => ({ state: "unavailable", instanceIds: [], reason: "not_configured" }) });
    expect(unhealthy.request(access(run, FORK_FEN), "pattern")).toMatchObject({ state: "source_unavailable", reason: "provider_unavailable" });
    expect(searched).toBe(0);
    const failing = new HintService({ scheduler: { get: async (request) => ({ kind: "source_failure", operation: request.operation, normalizedRequestDigest: "sha256:0", failedAt: "2026-09-24T12:00:00.000Z", reason: "deadline_exceeded" }) as unknown as TypedProviderResult<"stockfish.principal_variation@1"> }, requestedEngine: engine, populations, depth: 12, timeoutMs: 1_000, maxOperations: 8 });
    expect(await settle(failing, failing.request(access(run, FORK_FEN), "pattern"))).toMatchObject({ state: "source_unavailable", reason: "deadline_exceeded" });

    const voiced = async (voice: (sentence: string) => Promise<string>) => {
      const service = new HintService({ scheduler: real(), requestedEngine: engine, populations, depth: 12, timeoutMs: 5_000, maxOperations: 8, voiceTimeoutMs: 200, voice: (_view, sentence) => voice(sentence) });
      const result = await settle(service, service.request(access(run, FORK_FEN), "square"));
      if (result.state !== "available") throw new Error(`expected available, got ${JSON.stringify(result)}`);
      return result.delivery.rendered;
    };
    const canonical = "A Mock Stockfish mock-1 search from here (depth 12) finds a double attack for you. It involves d1 and d3.";
    expect(await voiced(async () => "A search here finds a double attack for you on d1 and d3.")).toEqual({ source: "deterministic", sentence: canonical, voice: { state: "rendered", sentence: "A search here finds a double attack for you on d1 and d3." } });
    expect(await voiced(async () => { throw new Error("offline"); })).toEqual({ source: "deterministic", sentence: canonical, voice: { state: "fallback", reason: "provider_unavailable" } });
    expect(await voiced(() => new Promise<string>(() => undefined))).toEqual({ source: "deterministic", sentence: canonical, voice: { state: "fallback", reason: "deadline_exceeded" } });
    expect(await voiced(async () => "")).toEqual({ source: "deterministic", sentence: canonical, voice: { state: "fallback", reason: "refused" } });
    expect(await voiced(async () => "The best move is Nb2, forking d1 and d3.")).toEqual({ source: "deterministic", sentence: canonical, voice: { state: "fallback", reason: "invalid_output" } });
  });

  it("[criterion 15] rungs of one decision share one search and the one injected packet service", async () => {
    const populations = new CandidatePopulationService({ capacity: 8 });
    let searches = 0;
    const scheduler = real();
    const service = new HintService({ scheduler: { get: (request, scope, signal) => { searches += 1; return scheduler.get(request, scope, signal); } }, requestedEngine: engine, populations, depth: 12, timeoutMs: 5_000, maxOperations: 8 });
    for (const rung of ["pattern", "square", "piece", "distance"] as const) expect((await settle(service, service.request({ ...access(run, FORK_FEN), voiceRequested: false }, rung))).state).toBe("available");
    expect(searches).toBe(1);
    expect(populations.stats()).toMatchObject({ misses: 1, retained: 1 });
    // A second consumer of the same position hits the same process-local packet.
    expect(populations.wide(FORK_FEN).kind).toBe("ready");
    expect(populations.stats().hits).toBeGreaterThanOrEqual(1);
    // The service cannot be built without the injected packet service; it never constructs its own.
    expect(() => new HintService({ scheduler: null, requestedEngine: engine, populations: undefined as never, depth: 12, timeoutMs: 1, maxOperations: 1 })).toThrow(/injected/u);
  });
});
