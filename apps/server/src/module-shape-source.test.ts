import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { STRUCTURAL_CONVENTION_REFS } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, fork, rewind, branchPath, commitMove, compileAssistanceRequest, compileAuthoritativeAssistance, finalizeAssistanceEffects, CONFIGURABLE_MODULE_IDS, MODULE_SOURCE_AUTHORITY, moduleDisclosureDigest, parsePresentationReceipt, evidenceForConsumer, presentEvidenceItems, serializePresentedEvidence, PRIMARY_EVIDENCE_MANIFEST, fitModulePresentation, presentedSentence, revealFeedback, serverAvailabilityFromProviders, type ModuleQueryPage } from "@chess-tabiya/runtime";
import { recordedSequenceWindowFixture } from "../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { mirrorSemanticUci } from "../../../packages/runtime/src/semantic-validation.js";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { parseModuleQueryPage } from "../../web/src/lib/module-query-response.js";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import * as valueRoutes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as bindingExecution from "../../../packages/runtime/src/evidence-binding-execution.js";
import { ExchangeCorpusSource } from "./provider-corpus.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { ShapeRegistry } from "./shape-registry.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-04T00:00:00.000Z", owner = { learnerId: "module-shape-owner", handle: "module-shape-owner" }, reader = { learnerId: "module-shape-reader", handle: "module-shape-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const storage of stores.splice(0)) storage.close(); });
async function fixture(module: "structure_nudge" | "theory_breadcrumb", black = false, installed = true, options: { setup?: { fen: string; moves: readonly string[] }; documents?: readonly ShapeEntryDefinition[] } = {}) {
  let run = recordedSequenceWindowFixture({ fen: options.setup?.fen ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", moves: [] }, black, `point-${module}-${black}`);
  const moves = options.setup?.moves ?? ["g1f3", "a7a6", "f3g1", "b7b6", "g1f3", "c7c6", "f3g1", "d7d6", "g1f3"];
  for (const [index, move] of moves.entries()) run = commitMove(run, black ? mirrorSemanticUci(move, "color_and_vertical") : move, { actor: index % 2 === 0 ? "user" : "system", at }).run;
  run = revealFeedback(run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { learnerId: owner.learnerId, writerId: "point-writer" }; storage.create(run, lease);
  const registry = new ShapeRegistry();
  for (const document of options.documents ?? [registeredShapeFixture(undefined, black)]) await registry.add(document, "community", "coach_one");
  const service = new RunService(storage, installed ? { shapeRegistry: registry } : {});
  const intent = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [module], exclude: CONFIGURABLE_MODULE_IDS.filter(id => id !== module) } } });
  const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(intent, { ...service.assistanceAuthority(run.id, owner), availability }), { authority: MODULE_SOURCE_AUTHORITY, availability });
  const controller = new AbortController(), path = branchPath(run, run.activeCursor.branchId);
  const query = (nodeId = run.activeCursor.nodeId, principal = owner) => service.queryModules(run.id, principal, assistance, { timing: "post_commit", subjectNodeId: nodeId, requested: module === "theory_breadcrumb" ? [module] : [] }, {}, controller.signal);
  const expected = (subjectNodeId = run.activeCursor.nodeId) => ({ runId: run.id, subjectNodeId, finalDigest: assistance.finalDigest });
  return { run, path, storage, registry, service, lease, intent, assistance, controller, module, query, expected };
}

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }

describe("owned current shape point module source", () => {
  for (const module of ["structure_nudge", "theory_breadcrumb"] as const) {
    it.each([false, true])(`${module} acquires exact current+ancestor sources and preserves its actual selected budget, black=%s`, async black => {
      const f = await fixture(module, black), before = JSON.stringify(f.storage.read(f.run.id));
      const begin = vi.spyOn(f.registry, "beginCurrentShapeScan"), page = await f.query();
      const received = parseModuleQueryPage(JSON.parse(JSON.stringify({ page })), f.expected()), packet = received.packets.find(item => item.module === module)!;
      expect(packet).toBeDefined(); expect(packet.items).toHaveLength(1);
      expect(packet.items[0]!.adapter).toMatchObject({ consumer: { id: `module.${module}`, version: 2 },
        projection: { id: "theory.shapes.firing", version: 3 } });
      expect(presentedSentence(packet.items[0]!)).toContain("Matched authored pattern");
      expect(presentedSentence(packet.items[0]!)).toContain("published by @coach_one");
      expect(packet.budget.after.words).toBeLessThanOrEqual(module === "structure_nudge" ? 80 : 60);
      expect(begin.mock.calls.map(([path]) => path.map(node => node.id))).toEqual((module === "structure_nudge" ? [9, 7, 5, 3] : [9]).map(index => [f.path[index]!.id]));
      for (const [path] of begin.mock.calls) expect(path).toEqual([{ id: path[0]!.id, fen: f.run.nodes.find(node => node.id === path[0]!.id)!.fen }]);
      expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
    });
    it(`D4092 ${module} source absence survives the actual strict receiver without inventing a no-witness`, async () => {
      const f = await fixture(module, false, false), page = await f.query();
      const parsed = parseModuleQueryPage(JSON.parse(JSON.stringify({ page })), f.expected());
      const packet = parsed.packets.find(item => item.module === module)!;
      expect(packet.unavailable).toContainEqual({ projection: "theory.shapes.firing@3", reason: "authored_source_absent" });
      expect(packet.unavailable.find(item => item.projection === "theory.shapes.firing@3")).not.toHaveProperty("nodeId");
      if (packet.items.length === 0) expect(packet.empty?.kind).toBe("unavailable_source");
    });
    it(`D4093 ${module} refuses another genuine point receipt even when its full outer hashes are rebuilt`, async () => {
      const f = await fixture(module), current = await f.query(), original = current.packets.find(item => item.module === module)!;
      const prior = f.path[5]!, builder = await f.registry.beginCurrentShapeScan([{ id: prior.id, fen: prior.fen }], new AbortController().signal);
      let evidence: ReturnType<typeof invokeEvidenceValueRoute<"theory.shapes.firing@3">> | undefined;
      for (;;) { const step = f.registry.advanceCurrentShapeScan(builder); if (step.kind === "complete") { evidence = invokeEvidenceValueRoute("theory.shapes.firing@3", { scan: step.scan }); break; } }
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: `module.${module}`, version: 2 }, evidence));
      const fitted = fitModulePresentation(module, items), receipt = serializePresentedEvidence(fitted.items);
      expect(receipt.items[0]!.adapter.projection).toEqual({ id: "theory.shapes.firing", version: 3 });
      expect(parsePresentationReceipt(receipt)).toHaveLength(1);
      // This is a real admitted source/adapter receipt. Structure selection is separately held by D4095.
      const { digest: _old, ...body } = original.disclosure;
      const disclosure = { ...body, componentDigests: receipt.items.map(item => item.componentDigest) };
      const crossed: ModuleQueryPage = { ...current, packets: [{ ...original, receipt, budget: fitted.budget, empty: null, disclosure: { ...disclosure, digest: moduleDisclosureDigest(disclosure) } }] };
      expect(() => parseModuleQueryPage(JSON.parse(JSON.stringify({ page: crossed })), f.expected())).toThrow(/point|shape|subject/u);
    });
    it.each(["participant", "spectator"] as const)(`D4094 ${module} refuses %s source work before beginning any scan`, async role => {
      const f = await fixture(module); f.storage.grantRole(f.run.id, reader.learnerId, role, f.lease, at);
      const begin = vi.spyOn(f.registry, "beginCurrentShapeScan"), page = await f.query(undefined, reader);
      expect(page.packets).toEqual([]); expect(page.suppressions).toContainEqual({ module, reason: "not_effective" });
      expect(begin).not.toHaveBeenCalled();
    });
  }
  it("D4096 defers a genuine long-title item atomically without falsely declaring no written theory", async () => {
    const f = await fixture("theory_breadcrumb"), record = f.registry.required(registeredShapeFixture().id);
    const name = Array.from({ length: 70 }, () => "pattern").join(" ");
    await f.registry.add({ ...record.document, version: "1.0.1", name }, "community", "coach_one");
    const page = await f.query(), packet = page.packets.find(item => item.module === "theory_breadcrumb")!;
    expect(packet.receipt.items).toEqual([]); expect(packet.budget.before.words).toBeGreaterThan(60);
    expect(packet.budget.after.words).toBe(0); expect(packet.budget.dropped).toHaveLength(1);
    expect(packet.budget.dropped[0]!.exceeded).toEqual(["words"]);
    expect(packet.empty?.kind).toBe("stated_absence");
    if (packet.empty?.kind !== "stated_absence") throw new Error("Expected compact-budget disclosure");
    expect(packet.empty.sentence).toContain("More detail is available");
    expect(packet.empty.sentence).not.toContain("Nothing is written");
    expect(packet.unavailable.some(item => item.projection === "theory.shapes.firing@3")).toBe(false);
    expect(parseModuleQueryPage(JSON.parse(JSON.stringify({ page })), f.expected()).packets[0]!.items).toEqual([]);
  });

  it.each(["structure_nudge", "theory_breadcrumb"] as const)("%s complete-consumer admission precedes the actual registry", async module => {
    const f = await fixture(module), begin = vi.spyOn(f.registry, "beginCurrentShapeScan"), original = bindingExecution.compileEvidenceConsumerExecution;
    vi.spyOn(bindingExecution, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => {
      return consumer.id === `module.${module}` ? original({ ...manifest, bindings: manifest.bindings.filter(binding => binding.consumer.id !== consumer.id) }, consumer) : original(manifest, consumer);
    });
    await expect(f.query()).rejects.toMatchObject({ code: "EVIDENCE_UNAVAILABLE" }); expect(begin).not.toHaveBeenCalled();
  });
  it.each([false, true])("prepares inherited ancestor timing identities without reading the later sibling tip, black=%s", async black => {
    const f = await fixture("structure_nudge", black), base = f.path[5]!;
    let next = fork(rewind(f.run, base.id, at, undefined, f.run.activeCursor.branchId).run, base.id, { at }).run;
    for (const [index, move] of ["c7c6", "f3g1", "d7d6", "g1f3"].entries()) next = commitMove(next, black ? mirrorSemanticUci(move, "color_and_vertical") : move, { actor: index % 2 === 0 ? "system" : "user", at }).run;
    next = revealFeedback(next, at).run; f.storage.save(next, f.lease);
    const path = branchPath(next, next.activeCursor.branchId), begin = vi.spyOn(f.registry, "beginCurrentShapeScan");
    await f.query(next.activeCursor.nodeId);
    expect(begin.mock.calls.map(([nodes]) => nodes.map(node => node.id))).toEqual([9, 7, 5, 3].map(index => [path[index]!.id]));
    expect(begin.mock.calls.flatMap(([nodes]) => nodes).some(node => node.id === f.path[9]!.id)).toBe(false);
  });
  it.each(["grant", "head", "registry", "abort"] as const)("retires a %s change during the actual cooperative point scan before any firing mint", async fault => {
    const f = await fixture("theory_breadcrumb"); f.storage.grantRole(f.run.id, reader.learnerId, "host", f.lease, at);
    const document = f.registry.required(registeredShapeFixture().id).document;
    for (let i = 0; i < 36; i++) await f.registry.add({ ...document, id: `point-extra-${i}` }, "official");
    const advance = f.registry.advanceCurrentShapeScan.bind(f.registry), factory = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute"); let changed = false;
    vi.spyOn(f.registry, "advanceCurrentShapeScan").mockImplementation(builder => {
      const step = advance(builder);
      if (!changed && step.kind === "incomplete") setTimeout(() => {
        changed = true;
        if (fault === "grant") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
        if (fault === "head") f.storage.save(attachEvidence(f.run, f.path[1]!.id, ["synthetic:point-head-change"], { kind: "eval", source: "engine_validated", values: { centipawns: 1 } }, at).run, f.lease);
        if (fault === "registry") { const record = f.registry.required(document.id); void f.registry.add(record.document, "community", "coach_one", record.digest); }
        if (fault === "abort") f.controller.abort();
      }, 0);
      return step;
    });
    await expect(f.query(undefined, reader)).rejects.toThrow(); expect(changed).toBe(true);
    expect(factory.mock.calls.filter(([route]) => route === "theory.shapes.firing@3")).toEqual([]);
  });
  it.each(["unchanged", "grant", "head", "registry", "abort"] as const)("Theory retains one original point source across real Explorer await: %s", async fault => {
    const f = await fixture("theory_breadcrumb"); f.storage.grantRole(f.run.id, reader.learnerId, "host", f.lease, at);
    const assistance = finalizeAssistanceEffects(compileAuthoritativeAssistance(f.intent, { ...f.service.assistanceAuthority(f.run.id, reader), availability }), { authority: MODULE_SOURCE_AUTHORITY, availability });
    const providers = composeProviderTraversalApplication({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null });
    const corpus = new ExchangeCorpusSource({ scheduler: providers.scheduler, monotonicNowMs: () => performance.now() });
    const entered = deferred<void>(), release = deferred<void>(), acquire = corpus.page.bind(corpus), begin = vi.spyOn(f.registry, "beginCurrentShapeScan");
    vi.spyOn(corpus, "page").mockImplementation(async (query, options) => { entered.resolve(undefined); await release.promise; return acquire(query, options); });
    const settled = f.service.queryModulesWithProviders(f.run.id, reader, assistance, { timing: "post_commit", subjectNodeId: f.run.activeCursor.nodeId, requested: ["theory_breadcrumb"] }, corpus, f.controller.signal)
      .then(page => ({ kind: "page" as const, page }), error => ({ kind: "error" as const, error }));
    await entered.promise;
    try {
      expect(begin).toHaveBeenCalledTimes(1);
      if (fault === "grant") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
      if (fault === "head") f.storage.save(attachEvidence(f.run, f.path[1]!.id, ["synthetic:provider-head-change"], { kind: "eval", source: "engine_validated", values: { centipawns: 2 } }, at).run, f.lease);
      if (fault === "registry") { const record = f.registry.required(registeredShapeFixture().id); await f.registry.add(record.document, "community", "coach_one", record.digest); }
      if (fault === "abort") f.controller.abort();
    } finally { release.resolve(undefined); }
    const result = await settled;
    expect(begin).toHaveBeenCalledTimes(1); // The preview and final projection reuse this source; no second scan.
    if (fault === "unchanged") {
      expect(result.kind).toBe("page"); if (result.kind !== "page") throw result.error;
      const parsed = parseModuleQueryPage(JSON.parse(JSON.stringify({ page: result.page })), { ...f.expected(), finalDigest: assistance.finalDigest });
      expect(parsed.packets[0]!.items[0]!.adapter.projection).toEqual({ id: "theory.shapes.firing", version: 3 });
    } else expect(result.kind).toBe("error");
  });

  it.each([false, true])("selects explicit current outpost truth while the real absent-ref entry stays a nonmatch, black=%s", async black => {
    const feature = { kind: "outpost" as const, color: black ? "black" as const : "white" as const,
      square: black ? "e4" as const : "e5" as const, conventionRef: STRUCTURAL_CONVENTION_REFS.outpost };
    const { conventionRef: _ref, ...legacy } = feature;
    const documents = [
      { ...registeredShapeFixture("current-outpost", black), trigger: { kind: "feature" as const, feature } },
      { ...registeredShapeFixture("legacy-outpost", black), trigger: { kind: "feature" as const, feature: legacy } },
    ];
    const f = await fixture("theory_breadcrumb", black, true, { setup: { fen: "7k/2p5/8/4N3/3P4/8/8/7K w - - 0 1", moves: ["h1g1"] }, documents });
    const invoke = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute"), page = await f.query();
    const packet = parseModuleQueryPage(JSON.parse(JSON.stringify({ page })), f.expected()).packets[0]!;
    expect(packet.items).toHaveLength(1); const statement = packet.items[0]!.component;
    expect(statement).toMatchObject({ id: "fact_statement", operand: { rendererId: "inspector.registered_shape_firing@2", operands: { entryId: "current-outpost" } } });
    const index = invoke.mock.calls.findIndex(([route]) => route === "theory.shapes.firing@3");
    const values = invoke.mock.results[index]!.value as ReturnType<typeof invokeEvidenceValueRoute<"theory.shapes.firing@3">>;
    expect(values).toHaveLength(1); expect(evidenceValueReceipt(values[0]!).convention!.refs).toContainEqual(STRUCTURAL_CONVENTION_REFS.outpost);
    expect(statement.id === "fact_statement" && statement.operand.rendererId === "inspector.registered_shape_firing@2" && statement.operand.operands.entryId).not.toBe("legacy-outpost");
  });
  it("retains actual installed-empty source as no-witness rather than unavailable", async () => {
    const f = await fixture("theory_breadcrumb", false, true, { documents: [] }), page = await f.query();
    const packet = parseModuleQueryPage(JSON.parse(JSON.stringify({ page })), f.expected()).packets[0]!;
    expect(packet.items).toEqual([]); expect(packet.unavailable.some(item => item.projection === "theory.shapes.firing@3")).toBe(false);
    expect(packet.empty).toEqual({ kind: "stated_absence", sentence: "Nothing is written about this position." });
  });

});
