import { afterEach, describe, expect, it, vi } from "vitest";
import { attachEvidence, branchPath, commitMove, compileAssistanceRequest, moduleDecisionStamp, revealFeedback, rewind, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as supplier from "../../../packages/runtime/src/inspector-shape-source.js";
import * as firing from "../../../packages/runtime/src/shape-firing.js";
import { evidenceDigest, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { registeredShapeFiringOperands } from "../../../packages/runtime/src/registered-shape-presentation.js";
import { componentValueSentence, factStatementOperand, parseComponentValue } from "../../../packages/runtime/src/presentation-contract.js";
import { registeredShapeRecordsImage, readRegisteredShapeSource } from "../../../packages/runtime/src/registered-shape-source.js";
import { recordedComparisonFixture, RECORDED_COMPARISON_AT as at } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { mirrorSemanticUci } from "../../../packages/runtime/src/semantic-validation.js";
import { RunService } from "./service.js";
import { ShapeRegistry } from "./shape-registry.js";
import { readRegisteredShapeScan } from "../../../packages/runtime/src/internal/registered-shape-scan.js";
import { ShapeStudio } from "./shape-studio.js";
import { SQLiteRunStorage } from "./storage.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";

const owner = { learnerId: "shape-source-owner", handle: "shape-source-owner" }, reader = { learnerId: "shape-source-reader", handle: "shape-source-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
async function fixture(black = false, registry: ShapeRegistry | null = new ShapeRegistry()) {
  const base = recordedComparisonFixture(black, "inspector-shape"), document = registeredShapeFixture(undefined, black);
  let run = rewind(base.run, base.mainPath.at(-1)!.id, at, undefined, base.main).run;
  for (const move of ["f3g1", "g8f6", "g1f3"]) run = commitMove(run, black ? mirrorSemanticUci(move, "color_and_vertical") : move, { at }).run;
  run = revealFeedback(run, at).run;
  if (registry !== null) await registry.add(document, "official");
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { learnerId: owner.learnerId, writerId: "shape-writer" }; storage.create(run, lease); storage.grantRole(run.id, reader.learnerId, "host", lease, at);
  const service = new RunService(storage, registry === null ? {} : { shapeRegistry: registry }), controller = new AbortController(), mainPath = branchPath(run, base.main);
  const context = (index = mainPath.length - 1, kind: "position" | "branch" = "branch", principal = owner, branchId = base.main) => {
    const path = branchPath(run, branchId), node = path[index]!;
    return service.resolveInspectorRecordedContext(run.id, principal, requested, availability,
      { branchId, nodeId: node.id, decisionDigest: moduleDecisionStamp(run).digest,
        context: kind === "position" ? { kind } : { kind, throughNodeId: node.id } }, controller.signal);
  };
  const acquire = async (token = context()) => service.readInspectorShapeSource(await service.acquireInspectorShapeSource(token, controller.signal));
  return { ...base, run, mainPath, registry, document, storage, lease, service, controller, context, acquire };
}

describe("registered shape factory and actual Inspector grant", () => {
  it.each(["revoke", "storage", "cancel", "registry"] as const)("D4082 rechecks actual %s during a cooperative yield before any firing publication", async fault => {
    const f = await fixture();
    for (let index = 0; index < 4; index++) await f.registry!.add({ ...f.document, id: `${f.document.id}-extra-${index}` }, "official");
    const context = f.context(undefined, "branch", reader), advance = f.registry!.advanceCurrentShapeScan.bind(f.registry!);
    let changed = false;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const steps = vi.spyOn(f.registry!, "advanceCurrentShapeScan").mockImplementation(builder => {
      const result = advance(builder);
      if (result.kind === "incomplete" && !changed) {
        setTimeout(() => {
          changed = true;
          if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
          if (fault === "storage") f.storage.save(attachEvidence(f.run, f.shared.id, ["synthetic:yield-change"], { kind: "eval", source: "engine_validated", values: { centipawns: 12 } }, at).run, f.lease);
          if (fault === "cancel") f.controller.abort();
          if (fault === "registry") { const record = f.registry!.required(f.document.id); void f.registry!.add(record.document, "official", undefined, record.digest); }
        }, 0);
      }
      return result;
    });
    await expect(f.acquire(context)).rejects.toThrow();
    expect(changed).toBe(true);
    expect(calls.mock.calls.filter(([route]) => route === "theory.shapes.firing@3")).toEqual([]);
    expect(steps.mock.calls.length).toBeLessThanOrEqual(2); // Registry change is observed at the next owned advance.
  });
  it("retains deleted-author attribution through actual storage deletion and registry hydration", async () => {
    const f = await fixture(), author = { learnerId: "deleted-shape-author", handle: "coach_one" };
    f.storage.createLearner({ id: author.learnerId, handle: author.handle, passwordHash: "!", createdAt: at });
    const studio = new ShapeStudio(f.storage, f.registry!), document = { ...f.document, id: "retained-community", name: "Retained community pattern" };
    const draft = await studio.create(author, document);
    await studio.register(draft.id, author);
    f.storage.deleteLearner(author.learnerId, at);
    const hydrated = new ShapeRegistry();
    await new ShapeStudio(f.storage, hydrated).hydrate();
    const service = new RunService(f.storage, { shapeRegistry: hydrated });
    const context = service.resolveInspectorRecordedContext(f.run.id, owner, requested, availability,
      { branchId: f.main, nodeId: f.mainPath.at(-1)!.id, decisionDigest: moduleDecisionStamp(f.run).digest,
        context: { kind: "branch", throughNodeId: f.mainPath.at(-1)!.id } }, f.controller.signal);
    const result = service.readInspectorShapeSource(await service.acquireInspectorShapeSource(context, f.controller.signal));
    const evidence = result.collection!.result.find(row => row.payload.entryId === document.id)!;
    const operands = registeredShapeFiringOperands(evidence), component = { id: "fact_statement" as const,
      operand: factStatementOperand("inspector.registered_shape_firing@2", "declared_convention", "shape-catalogue@1", operands) };
    expect(operands.authority.publisherHandle).toBe("deleted account");
    const text = componentValueSentence(parseComponentValue(JSON.parse(JSON.stringify(component))));
    expect(text).toContain("publisher account deleted");
    expect(text).not.toContain("@deleted");
  });
  it("renders an actual legal underscore publisher handle as explicit account attribution", async () => {
    const f = await fixture(), document = { ...f.document, id: "community-occupancy", name: "Community occupancy" };
    await f.registry!.add(document, "community", "coach_one");
    const evidence = (await f.acquire()).collection!.result.find(row => row.payload.entryId === document.id)!;
    const operands = registeredShapeFiringOperands(evidence), component = { id: "fact_statement" as const,
      operand: factStatementOperand("inspector.registered_shape_firing@2", "declared_convention", "shape-catalogue@1", operands) };
    expect(componentValueSentence(parseComponentValue(JSON.parse(JSON.stringify(component))))).toContain("published by @coach_one");
    expect(operands.authority.publisherHandle).toBe("coach_one");
  });
  it.each([false, true])("retains actual complete attribution through the registered closed renderer, black=%s", async black => {
    const f = await fixture(black), image = await f.acquire(), collection = image.collection!;
    for (const evidence of collection.result) {
      const operands = registeredShapeFiringOperands(evidence), before = JSON.stringify(evidence.payload);
      const component = { id: "fact_statement" as const, operand: factStatementOperand("inspector.registered_shape_firing@2", "declared_convention", "shape-catalogue@1", operands) };
      const parsed = parseComponentValue(JSON.parse(JSON.stringify(component)));
      expect(parsed).toEqual(component); expect(componentValueSentence(parsed)).toContain(f.document.name);
      expect(componentValueSentence(parsed)).not.toContain(f.document.id);
      expect(componentValueSentence(parsed)).toContain("does not validate the entry's plans");
      expect(JSON.stringify(evidence.payload)).toBe(before);
      expect(() => registeredShapeFiringOperands({ ...evidence })).toThrow();
    }
  });

  it.each(["crossed_entry", "wrong_pointer", "extra_claim", "missing_digest", "invalid_digest", "wrong_text"] as const)("rejects %s in the closed shape component", async fault => {
    const f = await fixture(), evidence = (await f.acquire()).collection!.result[0]!, operands = registeredShapeFiringOperands(evidence);
    const component = { id: "fact_statement", operand: factStatementOperand("inspector.registered_shape_firing@2", "declared_convention", "shape-catalogue@1", operands) };
    const copy = JSON.parse(JSON.stringify(component));
    if (fault === "crossed_entry") copy.operand.operands.authority.documentId = "another-entry";
    if (fault === "wrong_pointer") copy.operand.operands.authority.pointer = "/plans/0";
    if (fault === "extra_claim") copy.operand.operands.authority.plan = "This wins by force.";
    if (fault === "missing_digest") delete copy.operand.operands.authority.documentDigest;
    if (fault === "invalid_digest") copy.operand.operands.authority.documentDigest = "caller supplied";
    if (fault === "wrong_text") copy.operand.renderedText = "This validates the authored plan.";
    expect(() => parseComponentValue(copy)).toThrow();
  });
  it.each([false, true])("binds actual full documents, exact pointers and repeated intervals, black=%s", async black => {
    const f = await fixture(black), before = JSON.stringify(f.storage.read(f.run.id)), compute = vi.spyOn(firing, "shapeFirings");
    const image = await f.acquire(), c = image.collection!;
    expect(compute).not.toHaveBeenCalled(); expect(c.result.map(row => row.payload)).toEqual([
      { entryId: f.document.id, firstNodeId: f.mainPath[3]!.id, lastNodeId: f.mainPath[6]!.id, openEnded: false, authority: expect.any(Object) },
      { entryId: f.document.id, firstNodeId: f.mainPath[9]!.id, lastNodeId: f.mainPath[9]!.id, openEnded: true, authority: expect.any(Object) },
    ]);
    const record = f.registry!.required(f.document.id), attribution = { documentId: f.document.id, documentVersion: "1.0.0", documentDigest: record.digest,
      pointer: "/trigger", name: f.document.name, channel: "official", publisherHandle: null };
    for (const value of c.result) {
      expect(value.payload.authority).toEqual(attribution);
      expect(evidenceValueReceipt(value)).toMatchObject({ factory: "createTheoryShapesFiringV3Evidence", inputDigest: c.proof.inputDigest });
    }
    expect(c.proof.inputDigest).toBe(readRegisteredShapeScan(c.scan).inputDigest);
    expect(readRegisteredShapeScan(c.scan).rows[0]!.cells).toHaveLength(c.path.length);
    expect(image.outcome).toEqual({ kind: "available", collected: 2 }); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });

  it.each([false, true])("executes every granted prefix before interval construction, black=%s", async black => {
    const f = await fixture(black), original = firing.shapeFirings;
    const compute = vi.spyOn(firing, "shapeFirings");
    for (let index = 0; index < f.mainPath.length; index += 1) {
      const image = await f.acquire(f.context(index)), c = image.collection!, expectedPath = f.mainPath.slice(0, index + 1).map(({ id, fen }) => ({ id, fen }));
      expect(compute).not.toHaveBeenCalled(); expect(c.path).toEqual(expectedPath);
      expect(c.result.map(({ payload: { authority: _authority, ...span } }) => span)).toEqual(original([{ id: f.document.id, trigger: f.document.trigger }], expectedPath));
      expect(c.proof.items).toBe(c.result);
    }
  });

  it.each([false, true])("keeps singleton onset distinct from inherited branch intervals and fork-only views, black=%s", async black => {
    const f = await fixture(black);
    const position = (await f.acquire(f.context(4, "position"))).collection!, branch = (await f.acquire(f.context(4))).collection!;
    expect(position.path).toHaveLength(1); expect(position.result[0]!.payload).toMatchObject({ firstNodeId: f.mainPath[4]!.id, lastNodeId: f.mainPath[4]!.id, openEnded: true });
    expect(branch.result[0]!.payload).toMatchObject({ firstNodeId: f.mainPath[3]!.id, lastNodeId: f.mainPath[4]!.id, openEnded: true });
    expect((await f.acquire(f.context(2, "branch", owner, f.peer))).outcome).toEqual({ kind: "no_witness" });
    expect((await f.acquire(f.context(4, "branch", owner, f.peer))).collection!.result).toEqual([]);
  });

  it("distinguishes missing configuration from an installed empty source and nonmatching documents", async () => {
    const absent = await fixture(false, null), empty = await fixture();
    const emptyRegistry = new ShapeRegistry(), service = new RunService(empty.storage, { shapeRegistry: emptyRegistry });
    expect((await absent.acquire()).outcome).toEqual({ kind: "unavailable", reason: "authored_source_absent" });
    const context = service.resolveInspectorRecordedContext(empty.run.id, owner, requested, availability,
      { branchId: empty.main, nodeId: empty.mainPath.at(-1)!.id, decisionDigest: moduleDecisionStamp(empty.run).digest,
        context: { kind: "branch", throughNodeId: empty.mainPath.at(-1)!.id } }, empty.controller.signal);
    const none = service.readInspectorShapeSource(await service.acquireInspectorShapeSource(context, empty.controller.signal));
    expect(none.outcome).toEqual({ kind: "no_witness" }); expect(none.collection!.result).toEqual([]);
    expect((await empty.acquire(empty.context(0))).outcome).toEqual({ kind: "no_witness" });
    expect(new Set([none.sourceKey, (await empty.acquire(empty.context(0))).sourceKey, (await absent.acquire()).sourceKey]).size).toBe(3);
  });

  it.each(["copy", "filter", "reverse", "foreign"] as const)("refuses a %s factory population before publication", async fault => {
    const f = await fixture(), original = routes.invokeEvidenceValueRoute;
    const foreign = (await f.acquire()).collection!.result;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: never) => {
      const result = original(ref as never, input);
      if (ref !== "theory.shapes.firing@3") return result;
      const rows = result as readonly unknown[];
      return fault === "foreign" ? foreign : fault === "filter" ? rows.slice(0, -1) : fault === "reverse" ? [...rows].reverse() : [...rows];
    }) as typeof routes.invokeEvidenceValueRoute);
    await expect(f.acquire()).rejects.toThrow();
  });

  it.each(["revoke", "role", "storage", "cancel", "registry"] as const)("rechecks %s after capture, collection and retained reads", async fault => {
    for (const stage of ["capture", "collect", "read"] as const) {
      const f = await fixture(), context = f.context(undefined, "branch", reader);
      const change = () => {
        if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
        if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
        if (fault === "storage") f.storage.save(attachEvidence(f.run, f.shared.id, ["synthetic:later"], { kind: "eval", source: "engine_validated", values: { centipawns: 12 } }, at).run, f.lease);
        if (fault === "cancel") f.controller.abort();
        if (fault === "registry") { const record = f.registry!.required(f.document.id); void f.registry!.add(record.document, "official", undefined, record.digest); }
      };
      let restore: (() => void) | undefined;
      if (stage === "capture") {
        const original = f.registry!.captureRegisteredTriggers.bind(f.registry);
        const mock = vi.spyOn(f.registry!, "captureRegisteredTriggers").mockImplementation(async signal => { const result = await original(signal); change(); return result; }); restore = () => mock.mockRestore();
      } else if (stage === "collect") {
        const original = supplier.collectCurrentInspectorShapeSource;
        const mock = vi.spyOn(supplier, "collectCurrentInspectorShapeSource").mockImplementation((...args) => { const result = original(...args); change(); return result; }); restore = () => mock.mockRestore();
      }
      if (stage === "read") { const source = await f.service.acquireInspectorShapeSource(context, f.controller.signal); change(); expect(() => f.service.readInspectorShapeSource(source)).toThrow(); }
      else await expect(f.acquire(context)).rejects.toThrow();
      restore?.();
    }
  });

  it("refuses a foreign registry source before any requested-path firing", async () => {
    const f = await fixture(), other = new ShapeRegistry(); await other.add(f.document, "official");
    const foreign = await other.captureRegisteredTriggers(f.controller.signal), compute = vi.spyOn(firing, "shapeFirings");
    vi.spyOn(f.registry!, "captureRegisteredTriggers").mockResolvedValue(foreign);
    await expect(f.acquire()).rejects.toThrow(); expect(compute).not.toHaveBeenCalled();
  });

  it("rejects copied and foreign contexts before capturing the registry", async () => {
    const f = await fixture(), other = await fixture(), capture = vi.spyOn(f.registry!, "captureRegisteredTriggers");
    for (const context of [{} as InspectorRecordedContext, other.context()]) await expect(f.acquire(context)).rejects.toThrow();
    expect(capture).not.toHaveBeenCalled();
  });

  it("refuses copied source/collection handles and foreign service reads", async () => {
    const f = await fixture(), source = await f.service.acquireInspectorShapeSource(f.context(), f.controller.signal), image = f.service.readInspectorShapeSource(source);
    expect(() => f.service.readInspectorShapeSource({ ...source })).toThrow();
    expect(() => new RunService(f.storage, { shapeRegistry: f.registry! }).readInspectorShapeSource(source)).toThrow();
    expect(() => supplier.readCurrentInspectorShapeCollection({ ...image.collection! })).toThrow();
  });

  it.each(["duplicate", "empty", "extra", "noncanonical", "sparse", "missing"] as const)("refuses %s path inputs at the actual route", async fault => {
    const f = await fixture(), source = await f.registry!.captureRegisteredTriggers(f.controller.signal), node = { id: "selected", fen: f.mainPath[3]!.fen };
    const paths = { duplicate: [node, node], empty: [{ ...node, id: "" }], extra: [{ ...node, prose: "caller judgement" }],
      noncanonical: [{ ...node, fen: `${node.fen} ` }], sparse: [node, , node], missing: [] };
    const compute = vi.spyOn(firing, "shapeFirings");
    expect(() => routes.invokeEvidenceValueRoute("theory.shapes.firing@2", { source, path: paths[fault] as typeof node[] })).toThrow();
    expect(compute).not.toHaveBeenCalled();
    expect(() => routes.invokeEvidenceValueRoute("theory.shapes.firing@2", { source, path: [node], entries: [] } as never)).toThrow();
  });

  it("refuses mutated or copied original paths, including successful empty calculations", async () => {
    const f = await fixture(), source = await f.registry!.captureRegisteredTriggers(f.controller.signal);
    for (const index of [0, 3]) {
      const path = [{ id: f.mainPath[index]!.id, fen: f.mainPath[index]!.fen }], result = routes.invokeEvidenceValueRoute("theory.shapes.firing@2", { source, path });
      expect(() => routes.readRegisteredShapeFiringInvocation([...result], source, path)).toThrow();
      expect(() => routes.readRegisteredShapeFiringInvocation(result, source, [...path])).toThrow();
      path[0]!.id = "replaced"; expect(() => routes.readRegisteredShapeFiringInvocation(result, source, path)).toThrow();
    }
  });

  it.each(["id_getter", "fen_getter", "hidden", "symbol", "inherited"] as const)("refuses %s node fields before any getter or firing", async fault => {
    const f = await fixture(), source = await f.registry!.captureRegisteredTriggers(f.controller.signal), node = { id: "selected", fen: f.mainPath[3]!.fen };
    const getter = vi.fn(() => fault === "id_getter" ? node.id : node.fen);
    const input = { ...node };
    if (fault === "id_getter" || fault === "fen_getter") Object.defineProperty(input, fault === "id_getter" ? "id" : "fen", { enumerable: true, get: getter });
    if (fault === "hidden") Object.defineProperty(input, "prose", { value: "caller judgement" });
    if (fault === "symbol") Object.defineProperty(input, Symbol("prose"), { value: "caller judgement" });
    const path = [fault === "inherited" ? Object.assign(Object.create({ id: node.id }), { fen: node.fen, extra: true }) as typeof node : input];
    const compute = vi.spyOn(firing, "shapeFirings");
    expect(() => routes.invokeEvidenceValueRoute("theory.shapes.firing@2", { source, path })).toThrow();
    expect(getter).not.toHaveBeenCalled(); expect(compute).not.toHaveBeenCalled();
  });

  it.each(["getter", "hidden", "symbol", "map_override"] as const)("refuses a path array %s before invoking caller code", async fault => {
    const f = await fixture(), source = await f.registry!.captureRegisteredTriggers(f.controller.signal), path = [{ id: "selected", fen: f.mainPath[3]!.fen }];
    const caller = vi.fn(() => path[0]);
    if (fault === "getter") Object.defineProperty(path, 0, { enumerable: true, get: caller });
    if (fault === "hidden") Object.defineProperty(path, "prose", { value: "caller judgement" });
    if (fault === "symbol") Object.defineProperty(path, Symbol("prose"), { value: "caller judgement" });
    if (fault === "map_override") Object.defineProperty(path, "map", { value: caller });
    const compute = vi.spyOn(firing, "shapeFirings");
    expect(() => routes.invokeEvidenceValueRoute("theory.shapes.firing@2", { source, path })).toThrow();
    expect(caller).not.toHaveBeenCalled(); expect(compute).not.toHaveBeenCalled();
  });

  it("refuses a retained path changed to an accessor without invoking it or rerunning firing", async () => {
    const f = await fixture(), source = await f.registry!.captureRegisteredTriggers(f.controller.signal), path = [{ id: "selected", fen: f.mainPath[3]!.fen }];
    const result = routes.invokeEvidenceValueRoute("theory.shapes.firing@2", { source, path }), getter = vi.fn(() => "selected"), compute = vi.spyOn(firing, "shapeFirings");
    Object.defineProperty(path[0], "id", { enumerable: true, get: getter });
    expect(() => routes.readRegisteredShapeFiringInvocation(result, source, path)).toThrow();
    expect(getter).not.toHaveBeenCalled(); expect(compute).not.toHaveBeenCalled();
  });

  it("projects actual community names and publisher handles, not generated shape labels", async () => {
    const f = await fixture(), document = { ...f.document, id: "another-mechanical-shape", name: "Exact registered title" };
    await f.registry!.add(document, "community", "actual-author");
    const c = (await f.acquire()).collection!, values = c.result.filter(row => row.payload.entryId === document.id);
    expect(values).toHaveLength(2);
    expect(values[0]!.payload.authority).toMatchObject({ documentId: document.id, name: document.name, channel: "community", publisherHandle: "actual-author" });
  });

  it("does not convert digest-invalid registry failure to absence or no-witness", async () => {
    const f = await fixture();
    await f.registry!.add({ ...f.document, id: "invalid-digest" }, "official", undefined, `sha256:${"0".repeat(64)}`);
    const compute = vi.spyOn(firing, "shapeFirings"), collect = vi.spyOn(supplier, "collectCurrentInspectorShapeSource");
    await expect(f.acquire()).rejects.toThrow(); expect(compute).not.toHaveBeenCalled(); expect(collect).not.toHaveBeenCalled();
  });

  it("checks the original full run before narrowing an early position", async () => {
    const f = await fixture(), capture = vi.spyOn(f.registry!, "captureRegisteredTriggers"), tail = f.mainPath.at(-1)!;
    f.storage.save({ ...structuredClone(f.run), nodes: f.run.nodes.map(node => node.id === tail.id ? { ...node, fen: "invalid" } : node) }, f.lease);
    expect(() => f.context(0, "position")).toThrow(); expect(capture).not.toHaveBeenCalled();
  });

  it("binds nonfiring registered documents and attribution to source keys", async () => {
    const f = await fixture(), first = await f.acquire(f.context(0)), record = f.registry!.required(f.document.id);
    await f.registry!.add({ ...record.document, name: "Changed actual registered name" }, "official");
    const second = await f.acquire(f.context(0));
    expect(first.collection!.result).toEqual([]); expect(second.collection!.result).toEqual([]); expect(first.sourceKey).not.toBe(second.sourceKey);
    expect(first.collection!.proof.inputDigest).not.toBe(second.collection!.proof.inputDigest);
  });
});
