import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, branchPath, compileAssistanceRequest, feedbackDeliveryOpen, moduleDecisionStamp, serverAvailabilityFromProviders, type PresetId } from "@chess-tabiya/runtime";
import { recordedSequenceWindowFixture } from "../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { RegisteredShapeScanUnavailable } from "../../../packages/runtime/src/internal/registered-shape-scan.js";
import * as execution from "../../../packages/runtime/src/evidence-binding-execution.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { RunService } from "./service.js";
import { ShapeRegistry } from "./shape-registry.js";
import { SQLiteRunStorage } from "./storage.js";
import { parseGuidedShapePage } from "../../web/src/lib/guided-shape-response.js";

const at = "2026-11-04T00:00:00.000Z", owner = { learnerId: "guided-owner", handle: "guided-owner" }, reader = { learnerId: "guided-reader", handle: "guided-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
const requested = (preset: PresetId = "guided", contextHint: "position" | "pack" = "position", overrides = {}) => compileAssistanceRequest({ contextHint,
  preference: { kind: "explicit", preset, overrides, moduleOverrides: { include: [], exclude: [] } } });
async function fixture(black = false, registry: ShapeRegistry | null = new ShapeRegistry()) {
  const run = recordedSequenceWindowFixture({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves: ["g1f3", "g8f6", "f3g1", "f6g8", "g1f3"] }, black, `guided-shape-${black}`);
  const document = registeredShapeFixture(undefined, black);
  if (registry !== null) await registry.add(document, "community", "coach_one");
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { learnerId: owner.learnerId, writerId: "guided-writer" }; storage.create(run, lease); storage.grantRole(run.id, reader.learnerId, "host", lease, at);
  const service = new RunService(storage, registry === null ? {} : { shapeRegistry: registry }), controller = new AbortController();
  const path = branchPath(run, run.activeCursor.branchId);
  const body = (assistance = requested(), index = path.length - 1) => ({ assistance, query: { branchId: run.activeCursor.branchId, endpointId: path[index]!.id, decisionDigest: moduleDecisionStamp(run).digest } });
  const query = (request = body(), principal = owner) => service.queryShapeFirings(run.id, principal, request, availability, controller.signal);
  return { run, path, document, registry, storage, service, controller, lease, body, query };
}

describe("ordinary guided registered-pattern source", () => {
  it.each([false, true])("uses Guide me without Inspector/reveal and preserves both recorded intervals, black=%s", async black => {
    const f = await fixture(black), before = JSON.stringify(f.storage.read(f.run.id));
    expect(feedbackDeliveryOpen(f.run)).toBe(false);
    const page = await f.query();
    expect(page.outcome).toEqual({ kind: "available" });
    const parsed = parseGuidedShapePage(JSON.parse(JSON.stringify(page)), f.run.id, f.body(), { effectiveConfigDigest: page.effectiveConfigDigest, nodeIds: f.path.map(n => n.id) });
    expect(parsed.firings.map(row => row.value)).toMatchObject([
      { firstNodeId: f.path[1]!.id, lastNodeId: f.path[2]!.id, openEnded: false },
      { firstNodeId: f.path[5]!.id, lastNodeId: f.path[5]!.id, openEnded: true },
    ]);
    expect(parsed.firings.every(row => row.presentation[0]!.adapter.consumer.version === 2)).toBe(true);
    expect(parsed.firings[0]!.value.authority.publisherHandle).toBe("coach_one");
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
    const earlier = await f.query(f.body(requested(), 3));
    expect(earlier.outcome).toEqual({ kind: "available" }); // Earlier interval remains; no future return.
    expect(earlier.firings).toHaveLength(1); expect(earlier.firings[0]!.value.lastNodeId).toBe(f.path[2]!.id);
    expect(earlier.sourceKey).not.toBe(page.sourceKey);
  });
  it.each(["quiet", "support", "off", "markers-off", "wrong-workflow", "foreign", "bad-decision", "bad-endpoint", "extra"])("refuses %s before acquiring any source", async fault => {
    const f = await fixture(), begin = vi.spyOn(f.registry!, "beginCurrentShapeScan");
    let body: unknown = f.body(); let principal = owner;
    if (fault === "quiet") body = f.body(requested("quiet"));
    if (fault === "support") body = f.body(requested("support"));
    if (fault === "markers-off") body = f.body(requested("guided", "position", { markers: "off" }));
    if (fault === "off") body = f.body(requested("guided", "position", { guided: "off" }));
    if (fault === "wrong-workflow") body = f.body(requested("guided", "pack"));
    if (fault === "foreign") principal = { learnerId: "foreign", handle: "foreign" };
    if (fault === "bad-decision") body = { ...f.body(), query: { ...f.body().query, decisionDigest: `sha256:${"f".repeat(64)}` } };
    if (fault === "bad-endpoint") body = { ...f.body(), query: { ...f.body().query, endpointId: "foreign" } };
    if (fault === "extra") body = { ...f.body(), positions: [] };
    await expect(f.service.queryShapeFirings(f.run.id, principal, body, availability, f.controller.signal)).rejects.toMatchObject({ code: fault === "wrong-workflow" ? "INVALID_REQUEST" : expect.any(String) });
    expect(begin).not.toHaveBeenCalled();
  });
  it("distinguishes an absent source and a present empty registry", async () => {
    const f = await fixture(false, null);
    expect((await f.query()).outcome).toEqual({ kind: "unavailable", reason: "authored_source_absent" });
    const service = new RunService(f.storage, { shapeRegistry: new ShapeRegistry() });
    const page = await service.queryShapeFirings(f.run.id, owner, f.body(), availability, f.controller.signal);
    expect(page.outcome).toEqual({ kind: "no_witness" }); expect(page.firings).toEqual([]);
  });
  it.each(["revoke", "storage", "cancel", "registry"] as const)("retires the real %s change during a chunk yield with no firing mint", async fault => {
    const f = await fixture();
    for (let index = 0; index < 5; index++) await f.registry!.add({ ...f.document, id: `extra-${index}` }, "official");
    const advance = f.registry!.advanceCurrentShapeScan.bind(f.registry!), factory = vi.spyOn(routes, "invokeEvidenceValueRoute");
    let changed = false;
    vi.spyOn(f.registry!, "advanceCurrentShapeScan").mockImplementation(builder => {
      const step = advance(builder);
      if (!changed && step.kind === "incomplete") {
        setTimeout(() => {
          changed = true;
          if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
          if (fault === "storage") f.storage.save(attachEvidence(f.run, f.path[1]!.id, ["synthetic:change"], { kind: "eval", source: "engine_validated", values: { centipawns: 1 } }, at).run, f.lease);
          if (fault === "cancel") f.controller.abort();
          if (fault === "registry") { const record = f.registry!.required(f.document.id); void f.registry!.add(record.document, "community", "coach_one", record.digest); }
        }, 0);
      }
      return step;
    });
    await expect(f.query(f.body(), reader)).rejects.toThrow(); expect(changed).toBe(true);
    expect(factory.mock.calls.filter(([route]) => route === "theory.shapes.firing@3")).toEqual([]);
  });
  it.each(["populated", "empty", "absent"] as const)("D4090 admits the complete consumer before any %s source lookup", async kind => {
    const f = await fixture(), registry = kind === "populated" ? f.registry! : new ShapeRegistry();
    const service = new RunService(f.storage, kind === "absent" ? {} : { shapeRegistry: registry });
    const begin = vi.spyOn(registry, "beginCurrentShapeScan"), original = execution.compileEvidenceConsumerExecution;
    const checks = vi.spyOn(execution, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => {
      if (consumer.id !== "theory.shape_firing" || consumer.version !== 2) return original(manifest, consumer);
      return original({ ...manifest, bindings: manifest.bindings.filter(binding => binding.consumer.id !== consumer.id || binding.consumer.version !== consumer.version) }, consumer);
    });
    let error: unknown;
    try { await service.queryShapeFirings(f.run.id, owner, f.body(), availability, f.controller.signal); } catch (caught) { error = caught; }
    expect(begin).not.toHaveBeenCalled();
    expect(checks.mock.calls.filter(([, consumer]) => consumer.id === "theory.shape_firing" && consumer.version === 2)).toHaveLength(1);
    expect(error).toMatchObject({ code: "EVIDENCE_UNAVAILABLE" });
  });
  it("rejects original graph corruption beyond the requested prefix before acquiring its source", async () => {
    const f = await fixture(), read = f.storage.read.bind(f.storage), begin = vi.spyOn(f.registry!, "beginCurrentShapeScan");
    const corrupt = structuredClone(f.run); const last = corrupt.nodes.at(-1)!;
    Object.assign(last, { fen: corrupt.nodes[0]!.fen });
    vi.spyOn(f.storage, "read").mockImplementation(id => { const stored = read(id); return stored === undefined ? undefined : { ...stored, run: corrupt }; });
    await expect(f.query(f.body(requested(), 0))).rejects.toMatchObject({ code: "EVIDENCE_UNAVAILABLE" });
    expect(begin).not.toHaveBeenCalled();
  });
  it("does not publish partial matches when a visited source dependency is unavailable", async () => {
    const f = await fixture(), factory = vi.spyOn(routes, "invokeEvidenceValueRoute");
    vi.spyOn(f.registry!, "advanceCurrentShapeScan").mockImplementation(() => { throw new RegisteredShapeScanUnavailable(); });
    const page = await f.query(); expect(page.outcome).toEqual({ kind: "unavailable", reason: "source_dependency_unavailable" });
    expect(page.firings).toEqual([]); expect(factory.mock.calls.filter(([route]) => route === "theory.shapes.firing@3")).toEqual([]);
  });
  it("strictly rejects crossed request/configuration, false outcomes and malformed/relabelled populations", async () => {
    const f = await fixture(), page = await f.query(), expected = { effectiveConfigDigest: page.effectiveConfigDigest, nodeIds: f.path.map(n => n.id) };
    const parse = (value: unknown) => parseGuidedShapePage(value, f.run.id, f.body(), expected);
    type Mutable = { [key: string]: any };
    const faults: ((value: Mutable) => void)[] = [
      value => { value.runId = "another-run"; }, value => { value.branchId = "another-branch"; }, value => { value.endpointId = f.path[0]!.id; },
      value => { value.decisionDigest = `sha256:${"f".repeat(64)}`; }, value => { value.effectiveConfigDigest = `sha256:${"f".repeat(64)}`; },
      value => { value.sourceKey = "not-a-key"; }, value => { value.extra = true; }, value => { value.outcome = { kind: "no_witness" }; },
      value => { value.outcome = { kind: "unavailable", reason: "invented" }; value.firings = []; },
      value => { value.firings[0].value.firstNodeId = "foreign-node"; }, value => { value.firings[0].value.lastNodeId = "future-node"; },
      value => { value.firings[0].value.openEnded = true; }, value => { value.firings.reverse(); },
      value => { value.firings[0].value.authority.name = "SAME ID DIFFERENT DOCUMENT"; },
      value => { value.firings[0].presentation.items[0].adapter.consumer.version = 1; },
      value => { value.firings[0].presentation.items[0].adapter.projection.version = 2; },
      value => { value.firings[0].presentation.items[0].evidenceRef.evidenceDigest = `sha256:${"f".repeat(64)}`; },
      value => { value.firings[0].presentation.items[0].component.operand.operands.authority.name = "UNRELATED"; },
      value => { delete value.firings[0]; }, value => { value.firings.push(value.firings[0]); },
    ];
    expect(parse(JSON.parse(JSON.stringify(page))).firings).toHaveLength(2);
    const accessor = JSON.parse(JSON.stringify(page)), getter = vi.fn(() => "available");
    Object.defineProperty(accessor.outcome, "kind", { enumerable: true, get: getter });
    expect(() => parse(accessor)).toThrow(); expect(getter).not.toHaveBeenCalled();
    for (const fault of faults) { const value = JSON.parse(JSON.stringify(page)); fault(value); expect(() => parse(value), fault.toString()).toThrow(); }
  });

});
