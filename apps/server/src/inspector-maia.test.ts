import { afterEach, describe, expect, it, vi } from "vitest";
import * as runtime from "@chess-tabiya/runtime";
import { createRun, commitMove, revealFeedback } from "@chess-tabiya/runtime";
import { parseHumanSplitPage } from "../../web/src/lib/human-split-response.js";
import { FakeEngines, ManualClock } from "./provider-exchange.test-support.js";
import { ExchangeMaiaTaskSource } from "./provider-maia.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { OpponentSelector } from "./opponent-selector.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { IdentityService } from "./identity.js";
import { EngineCapabilities } from "./capabilities.js";
import { createRestHandler } from "./rest.js";
import { testRegistry } from "./provider-health.test-support.js";
import { START_FEN } from "../../../packages/runtime/src/provider-test-fixtures.js";
import { engineUnavailable } from "./errors.js";

const stores: SQLiteRunStorage[] = [], at = "2026-11-02T18:00:00.000Z";
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
async function fixture(side: "white" | "black" = "white", revealed = true, moves: readonly string[] = []) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const engines = new FakeEngines(), clock = new ManualClock(), health = await testRegistry({ "maia-inference": "available" });
  engines.respond = () => ["info multipv 1 policy 0.4 score cp 739 wdl 431 362 207 pv e2e4", "info multipv 3 pv d2d4", "bestmove g1f3"];
  const providers = composeProviderTraversalApplication({ engines, maiaTaskHealth: health, tablebaseFetch: null, explorerFetch: null, explorerToken: null, monotonicNowMs: clock.now, wallNow: clock.wall });
  const source = new ExchangeMaiaTaskSource({ scheduler: providers.scheduler, engines, health, monotonicNowMs: clock.now });
  const raw = vi.fn(async () => { throw new Error("No modern-to-raw fallback"); });
  const selector = new OpponentSelector({ health: id => engines.health(id), execute: raw }, { maiaTaskSource: source, health, monotonicNowMs: clock.now, wallNow: clock.wall });
  const service = new RunService(storage), identity = new IdentityService(storage, { cookieSecure: false });
  const capabilities = new EngineCapabilities(engines, ["maia-5m"], { health });
  const handler = createRestHandler(service, selector, capabilities, identity);
  const register = async (handle: string) => {
    const response = await handler(new Request("http://localhost/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: "inspector-maia-test-password" }) }));
    expect(response.status).toBe(201);
    const { learner } = await response.json() as { learner: { id: string; handle: string } };
    return { principal: { learnerId: learner.id, handle: learner.handle }, cookie: response.headers.get("set-cookie")!.split(";")[0]! };
  };
  const owner = await register(`maia-owner-${side}`), reader = await register(`maia-reader-${side}`);
  let run = createRun({ id: `maia-inspector-${side}`, session: { kind: "position", start: { fen: START_FEN, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 42, createdAt: at });
  for (const move of moves) run = commitMove(run, move, { at }).run;
  if (revealed) run = revealFeedback(run, at).run;
  const lease = { learnerId: owner.principal.learnerId, writerId: "maia-inspector-writer" }; storage.create(run, lease);
  const request = (nodeId = run.activeCursor.nodeId, cookie: string | undefined = owner.cookie, signal?: AbortSignal) => handler(new Request(`http://localhost/runs/${run.id}/human-split?nodeId=${encodeURIComponent(nodeId)}`, { ...(signal === undefined ? {} : { signal }), headers: cookie === undefined ? {} : { cookie } }));
  return { storage, engines, source, selector, raw, service, run, owner, reader, lease, request };
}

describe("modern requested-node model evidence through production cookie auth, SQLite and REST", () => {
  it.each(["white", "black"] as const)("delivers %s's actual registered candidate-only component with unknown shares and no committed sample", async side => {
    const f = await fixture(side), before = JSON.stringify(f.storage.read(f.run.id));
    const response = await f.request(); expect(response.status, await response.clone().text()).toBe(200);
    const page = parseHumanSplitPage(await response.json(), f.run.activeCursor.nodeId, START_FEN);
    if (!("protocol" in page)) throw new Error("Modern source must deliver modern wire");
    expect(page.protocol).toBe("inspector.human_split@2"); expect(page.status).toBe("shown");
    expect(page.candidates).toEqual([{ moveUci: "e2e4", rank: 1, mass: 0.4 }, { moveUci: "d2d4", rank: 3, mass: null }]);
    const wire = JSON.stringify(page); expect(wire).not.toMatch(/sampleRequestId|termination|rawBestMove|g1f3|scoreCp|\b739\b|optionImage|transcript|acquisition|\b431\b/u);
    expect(page.presentation.items[0]!.component).toMatchObject({ id: "fact_statement", operand: { rendererId: "consumer.maia_node_distribution@1" } });
    expect(JSON.stringify(page.presentation)).toContain("model share not reported"); expect(JSON.stringify(page.presentation)).toContain("not your rating");
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before); expect(f.raw).not.toHaveBeenCalled(); expect(f.engines.calls).toHaveLength(2);
    const again = await f.request(); expect(await again.json()).toEqual(page); expect(f.engines.calls).toHaveLength(2);
  });

  it("separates zero/all-unknown rows from an authentic empty window", async () => {
    for (const lines of [["info multipv 1 policy 0 pv e2e4", "info multipv 3 pv d2d4", "bestmove e2e4"], ["info multipv 1 pv e2e4", "bestmove e2e4"], ["bestmove e2e4"]]) {
      const f = await fixture(); f.engines.respond = () => lines;
      const response = await f.request(); expect(response.status, await response.clone().text()).toBe(200);
      const page = parseHumanSplitPage(await response.json(), f.run.activeCursor.nodeId, START_FEN);
      if (!("protocol" in page)) throw new Error("Expected modern page");
      expect(page.status).toBe(lines.length === 1 ? "empty_population" : "shown");
      expect(page.presentation.items).toHaveLength(lines.length === 1 ? 0 : 1);
      if (lines.length === 3) expect(page.candidates.map(row => row.mass)).toEqual([0, null]);
    }
  });

  it("requests the historical node's next moves, not the active cursor or preceding edge", async () => {
    const f = await fixture("white", true, ["e2e4", "e7e5"]), requested = f.run.nodes[1]!;
    f.engines.respond = () => ["info multipv 1 policy 0.3 pv c7c5", "bestmove c7c5"];
    const response = await f.request(requested.id); expect(response.status, await response.clone().text()).toBe(200);
    const page = parseHumanSplitPage(await response.json(), requested.id, requested.fen);
    expect(page.candidates[0]!.moveUci).toBe("c7c5");
    expect(f.engines.calls[0]!.commands.at(-2)).toBe(`position fen ${START_FEN} moves e2e4`);
  });

  it("refuses unauthenticated, foreign and feedback-closed requests before any task", async () => {
    const f = await fixture("white", false);
    expect((await f.request(f.run.activeCursor.nodeId, "")).status).toBe(401);
    expect((await f.request(f.run.activeCursor.nodeId, f.reader.cookie)).status).toBe(404);
    expect((await f.request()).status).toBe(409); expect(f.engines.calls).toHaveLength(0);
  });

  it("compiles the exact complete presentation contract before acquiring any source", async () => {
    const f = await fixture(), acquire = vi.spyOn(f.source, "acquire");
    vi.spyOn(runtime, "compileEvidenceConsumerExecution").mockImplementation(() => { throw new TypeError("broken exact presentation binding"); });
    const response = await f.request(); expect(response.status).toBe(500);
    expect(acquire).not.toHaveBeenCalled(); expect(f.engines.calls).toHaveLength(0); expect(f.raw).not.toHaveBeenCalled();
  });

  it.each(["revoke", "change", "cancel", "provider_failure"] as const)("does not publish or fall back after %s during source acquisition", async fault => {
    const f = await fixture(); let release!: () => void, started!: () => void;
    const entered = new Promise<void>(resolve => { started = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; }), acquire = f.source.acquire.bind(f.source);
    f.source.acquire = async (...args) => { const value = await acquire(...args); started(); await gate; if (fault === "provider_failure") throw engineUnavailable("maia-5m", 0); return value; };
    f.storage.grantRole(f.run.id, f.reader.principal.learnerId, "host", f.lease, at);
    const controller = new AbortController(), pending = f.request(f.run.activeCursor.nodeId, f.reader.cookie, controller.signal);
    // Request cancellation rejects with its original signal reason, not a publishable HTTP500.
    // Attach before abort so the expected rejection cannot become unhandled while releasing work.
    const cancelled = fault === "cancel" ? pending.then(() => { throw new Error("Cancelled request published an HTTP response"); }, error => {
      expect(error).toBe(controller.signal.reason);
    }) : undefined;
    await Promise.race([entered, pending.then(async response => { throw new Error(`Expected actual task acquisition, got ${response.status}: ${await response.text()}`); })]);
    if (fault === "revoke") f.storage.revokeGrant(f.run.id, f.reader.principal.learnerId, f.lease);
    if (fault === "change") {
      const changed = commitMove(f.run, "e2e4", { at }).run;
      f.storage.save(changed, f.lease);
    }
    if (fault === "cancel") controller.abort();
    release();
    if (fault === "cancel") await cancelled;
    else {
      const response = await pending;
      expect(response.status).toBe(fault === "revoke" ? 404 : fault === "change" ? 409 : 503);
    }
    expect(f.engines.calls).toHaveLength(fault === "cancel" || fault === "provider_failure" ? 1 : 2); expect(f.raw).not.toHaveBeenCalled();
  });
});
