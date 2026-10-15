import type { AddressInfo } from "node:net";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { evaluateAuthoredStructuralPredicate } from "@chess-tabiya/runtime";
import * as execution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ChessTabiyaApplication } from "./application.js";
import { applicationFixture } from "./application-fixture.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { validateClaimBindings } from "./sourcing/claim-binding.js";
import type { EvidenceLedger, SourcingIssue } from "./sourcing/types.js";
import { ShapeRegistry, type ShapeRecord } from "./shape-registry.js";
import { PrincipleRegistry, type PrincipleRecord } from "./principle-registry.js";

const FEN = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
const SHAPE: ShapeEntryDefinition = {
  id: "authoring-execution-fixture", version: "1.0.0", name: "Authoring fixture",
  phases: ["endgame"],
  trigger: { kind: "feature", feature: { kind: "open_file", file: "a" } },
  plans: ["white", "black"].map(side => ({
    id: `fixture-${side}`, side: side as "white" | "black", label: "Fixture",
    description: "Synthetic execution fixture, not chess instruction.",
    success: { note: "No strategic assertion.", signature: null },
  })),
  watch: ["Execution fixture."], typicalMistakes: ["Execution fixture."],
  provenance: { licence: "CC0-1.0", sources: ["Synthetic test fixture."], attribution: [] },
};
const PACK = { start: { fen: FEN, side: "white" }, spine: [] } as unknown as DrillPackDefinition;
const LEDGER: EvidenceLedger = {
  schema: "tabiya.sourcing.evidence.v1", sourcedAt: "2026-10-09T00:00:00.000Z",
  records: [{ kind: "engine_eval", anchor: { fen: FEN }, sourceId: "fixture",
    retrievedAt: "2026-10-09T00:00:00.000Z", grounds: "machine_validation",
    values: { fen: FEN, centipawns: 0, depth: 8 }, supports: ["/start/fen"] }],
  abstentions: [], claimBindings: [],
};
const originalCompile = execution.compileEvidenceConsumerExecution;
const originalRoute = routes.invokeEvidenceValueRoute;
const faults = ["missing_policy", "impossible_latency", "raw_source", "duplicate_adapter", "missing_bindings"] as const;
type Fault = typeof faults[number];
type Consumer = "authoring.predicate" | "authoring.claim_binding";

function observe(consumer: Consumer, fault?: Fault) {
  const trace: string[] = [];
  const compile = vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation((manifest, requested) => {
    trace.push(`compile:${requested.id}`);
    if (requested.id !== consumer || fault === undefined) return originalCompile(manifest, requested);
    const first = manifest.bindings.find(row => row.consumer.id === consumer)!;
    const { sourceAbsence: _absence, ...base } = first;
    const extra = {
      ...base, adapter: { id: "adapter.fixture.authoring_execution", version: 1 },
      producer: { id: "live.stockfish", version: 1 },
      projection: { id: fault === "raw_source" ? "live.stockfish.uci_response" : "live.stockfish.position_eval", version: 1 },
      latency: { mode: fault === "impossible_latency" ? "sync" as const : "interactive" as const, maxMs: 1000 },
      ...(fault === "missing_policy" ? {} : { sourceAbsence: { necessity: "required" as const, whenNoPath: "operation_unavailable" as const } }),
    };
    const bindings = fault === "missing_bindings" ? manifest.bindings.filter(row => row.consumer.id !== consumer)
      : fault === "duplicate_adapter" ? [...manifest.bindings, first] : [...manifest.bindings, extra];
    // Real compiler refusals, not a stubbed throw or a filtered valid subset.
    return originalCompile({ ...manifest, bindings }, requested);
  });
  const factory = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => {
    trace.push("factory");
    return originalRoute(...args);
  });
  return { trace, compile, factory };
}

afterEach(() => vi.restoreAllMocks());

describe("complete authoring execution before source work", () => {
  it.each(faults)("refuses %s before structural evaluation", fault => {
    const observed = observe("authoring.predicate", fault);
    expect(() => evaluateAuthoredStructuralPredicate(FEN, SHAPE.trigger, { source: "shape", documentId: SHAPE.id, pointer: "/trigger" }))
      .toThrow(/BINDING_|EXECUTION_/u);
    expect(observed.factory).not.toHaveBeenCalled();
    expect(observed.trace).toEqual(["compile:authoring.predicate"]);
  });

  it.each(faults)("refuses %s before claim-ledger admission", fault => {
    const observed = observe("authoring.claim_binding", fault);
    const issues: SourcingIssue[] = [];
    const ledger = structuredClone(LEDGER);
    expect(() => validateClaimBindings(PACK, ledger, issues)).toThrow(/BINDING_|EXECUTION_/u);
    expect(observed.factory).not.toHaveBeenCalled();
    expect(observed.trace).toEqual(["compile:authoring.claim_binding"]);
    expect(issues).toEqual([]);
    expect(ledger).toEqual(LEDGER);
  });

  it("preflights each real predicate call and retains true/false semantics", () => {
    const observed = observe("authoring.predicate");
    expect(evaluateAuthoredStructuralPredicate(FEN, SHAPE.trigger, { source: "shape", documentId: SHAPE.id, pointer: "/trigger" })).toBe(true);
    expect(observed.trace[0]).toBe("compile:authoring.predicate");
    observed.trace.length = 0;
    expect(evaluateAuthoredStructuralPredicate(FEN, { kind: "not", of: SHAPE.trigger }, { source: "shape", documentId: SHAPE.id, pointer: "/trigger" })).toBe(false);
    expect(observed.trace[0]).toBe("compile:authoring.predicate");
    expect(observed.compile).toHaveBeenCalledTimes(2);
  });

  it("preflights even an empty ledger and preserves exact input bytes", () => {
    const observed = observe("authoring.claim_binding");
    const ledger = structuredClone(LEDGER);
    const issues: SourcingIssue[] = [];
    expect(validateClaimBindings(PACK, ledger, issues)).toEqual([]);
    expect(observed.trace[0]).toBe("compile:authoring.claim_binding");
    observed.trace.length = 0;
    expect(validateClaimBindings(PACK, { ...ledger, records: [] }, issues)).toEqual([]);
    expect(observed.trace).toEqual(["compile:authoring.claim_binding"]);
    expect(observed.compile).toHaveBeenCalledTimes(2);
    expect(issues).toEqual([]);
    expect(ledger).toEqual(LEDGER);
  });
});

describe("authenticated authoring refusal and retry", () => {
  let owned: ReturnType<typeof applicationFixture<ChessTabiyaApplication>>;
  let origin: string;
  let headers: Record<string, string>;
  const request = (path: string, body?: unknown, authenticated = true) => fetch(`${origin}${path}`, {
    method: body === undefined ? "GET" : "POST", headers: authenticated ? headers : { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  beforeAll(async () => {
    owned = applicationFixture(createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false }));
    await owned.ready;
    const app = owned.current()!;
    await new Promise<void>((resolve, reject) => { app.server.once("error", reject); app.server.listen(0, "127.0.0.1", resolve); });
    origin = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}`;
    const registration = await request("/auth/register", { handle: "authoring_execution", password: "authoring-execution-password" }, false);
    expect(registration.status).toBe(201);
    headers = { "content-type": "application/json", cookie: registration.headers.get("set-cookie")!.split(";", 1)[0]! };
  });
  afterAll(async () => { await owned?.close(); });

  it("keeps actual registered principle identity and Library reads stable under client-owned edits", async () => {
    const listed = await request("/principles");
    expect(listed.status).toBe(200);
    const { principles } = await listed.json() as { principles: { id: string; digest: string; statement: string }[] };
    expect(principles.length).toBeGreaterThan(0);
    const summary = principles[0]!;
    const get = PrincipleRegistry.prototype.get;
    let record: PrincipleRecord | undefined;
    vi.spyOn(PrincipleRegistry.prototype, "get").mockImplementation(function (this: PrincipleRegistry, id) {
      const actual = get.call(this, id);
      if (id === summary.id) record = actual;
      return actual;
    });
    const path = `/theory/principles/${encodeURIComponent(summary.id)}`;
    const first = await request(path);
    expect(first.status).toBe(200);
    const body = await first.json(), saved = structuredClone(body);
    expect(body).toMatchObject({ id: summary.id, digest: summary.digest, statement: summary.statement });
    expect(record).toBeDefined();
    expect(Reflect.set(record!.document, "statement", "Changed registered statement")).toBe(false);
    body.statement = "Changed decoded response";
    body.citations.push({ quotedText: "Client-only citation" });
    const second = await request(path);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(saved);
    const relisted = await request("/principles");
    expect(relisted.status).toBe(200);
    expect(await relisted.json()).toEqual({ principles });
  });

  it.each(["missing_policy", "impossible_latency", "raw_source"] as const)("refuses %s without saving a phantom shape draft", async fault => {
    const before = await (await request("/shapes/drafts")).json();
    const observed = observe("authoring.predicate", fault);
    const response = await request("/shapes/drafts", { document: SHAPE });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: "EVIDENCE_UNAVAILABLE", message: "Evidence execution contract is unavailable" } });
    expect(observed.factory).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    expect(await (await request("/shapes/drafts")).json()).toEqual(before);
  });

  it("authenticates before preflight and recovers through create, lint, update and register", async () => {
    const observed = observe("authoring.predicate");
    expect((await request("/shapes/drafts", { document: SHAPE }, false)).status).toBe(401);
    expect(observed.compile).not.toHaveBeenCalled();
    const created = await request("/shapes/drafts", { document: SHAPE });
    expect(created.status).toBe(201);
    const { draft } = await created.json() as { draft: { id: string; digest: string; validation: { valid: boolean } } };
    expect(draft.validation.valid).toBe(true);
    expect(observed.trace[0]).toBe("compile:authoring.predicate");
    const probe = await request(`/shapes/drafts/${draft.id}/lint`, { document: SHAPE, probeFen: FEN });
    expect(probe.status).toBe(200);
    expect(await probe.json()).toMatchObject({ valid: true, probeMatches: true });
    const changed = await fetch(`${origin}/shapes/drafts/${draft.id}`, { method: "PUT", headers: { ...headers, "if-match": draft.digest }, body: JSON.stringify({ document: { ...SHAPE, name: "Updated execution fixture" } }) });
    expect(changed.status).toBe(200);
    const published = await request(`/shapes/drafts/${draft.id}/register`, {});
    expect(published.status).toBe(201);
    // Observe the real record used by the production HTTP projection. No replacement
    // registry, document or validator is substituted at this boundary.
    const required = ShapeRegistry.prototype.required;
    let record: ShapeRecord | undefined;
    vi.spyOn(ShapeRegistry.prototype, "required").mockImplementation(function (this: ShapeRegistry, id) {
      const actual = required.call(this, id);
      if (id === SHAPE.id) record = actual;
      return actual;
    });
    const first = await request(`/shapes/${SHAPE.id}`);
    expect(first.status).toBe(200);
    const firstBody = await first.json(), savedBody = structuredClone(firstBody);
    const firstExport = await request(`/shapes/${SHAPE.id}/export`);
    expect(firstExport.status).toBe(200);
    const exportedBefore = await firstExport.json();
    expect(exportedBefore).toMatchObject({ format: "chess-tabiya-shape", version: 1,
      digest: first.headers.get("x-shape-digest"), document: { ...SHAPE, name: "Updated execution fixture" } });
    expect(record).toBeDefined();
    const trigger = record!.document.trigger;
    if (trigger.kind !== "feature") throw new Error("Authoring fixture changed");
    expect(Reflect.set(trigger.feature, "file", "b")).toBe(false);
    // Ordinary HTTP JSON belongs to the client and may still be edited there.
    firstBody.trigger.feature.file = "b";
    const second = await request(`/shapes/${SHAPE.id}`);
    expect(second.status).toBe(200);
    expect(second.headers.get("x-shape-digest")).toBe(first.headers.get("x-shape-digest"));
    expect(await second.json()).toEqual(savedBody);
    const secondExport = await request(`/shapes/${SHAPE.id}/export`);
    expect(secondExport.status).toBe(200);
    expect(await secondExport.json()).toEqual(exportedBefore);
    const { drafts } = await (await request("/shapes/drafts")).json() as { drafts: { id: string; state: string }[] };
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ id: draft.id, state: "registered" });
  });

  it.each(["update", "lint", "register", "read", "list"] as const)("refuses broken execution during %s without changing saved authoring state", async action => {
    const created = await request("/shapes/drafts", { document: { ...SHAPE, id: `${SHAPE.id}-${action}` } });
    expect(created.status).toBe(201);
    const { draft } = await created.json() as { draft: { id: string; digest: string } };
    const before = await (await request("/shapes/drafts")).json();
    const beforeCatalogue = await (await request("/shapes")).json();
    const observed = observe("authoring.predicate", "raw_source");
    const base = `/shapes/drafts/${draft.id}`;
    const response = action === "update"
      ? await fetch(`${origin}${base}`, { method: "PUT", headers: { ...headers, "if-match": draft.digest }, body: JSON.stringify({ document: { ...SHAPE, name: "Must not be saved" } }) })
      : action === "lint" ? await request(`${base}/lint`, { document: SHAPE, probeFen: FEN })
      : action === "register" ? await request(`${base}/register`, {})
      : await request(action === "read" ? base : "/shapes/drafts");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: "EVIDENCE_UNAVAILABLE", message: "Evidence execution contract is unavailable" } });
    expect(observed.factory).not.toHaveBeenCalled();
    vi.restoreAllMocks();
    expect(await (await request("/shapes/drafts")).json()).toEqual(before);
    expect(await (await request("/shapes")).json()).toEqual(beforeCatalogue);
  });
});
