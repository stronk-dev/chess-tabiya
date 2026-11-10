// Genuine sources → exact constructors and actual current Full2 sealed presentation → strict wire.
// No source-page HTTP, provider qualification or UI completion claim.
import { afterEach, describe, expect, it } from "vitest";
import { attachEvidence, compileAssistanceRequest, moduleDecisionStamp, revealFeedback, rewind,
  serverAvailabilityFromProviders, type EvidencePayload } from "@chess-tabiya/runtime";
import { evidenceForConsumer, evidenceValueReceipt, type DeclaredEvidence } from "../../../packages/runtime/src/evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../../packages/runtime/src/evidence-catalog.js";
import { collectInspectorRecordedPackets, type InspectorPacketProjection } from "../../../packages/runtime/src/inspector-packet-source.js";
import { inspectorSourceAdapterSpecs } from "../../../packages/runtime/src/presentation-inspector-adapters.js";
import { adapterComponentsForEvidence, componentValueSentence, parseComponentValue, parsePresentationReceipt, presentEvidenceItems, serializePresentedEvidence, presentationDigest, type ComponentValue } from "../../../packages/runtime/src/presentation-contract.js";
import type { InspectorQueryRequest } from "../../../packages/runtime/src/inspector-query-contract.js";
import { parseInspectorQueryPage } from "../../web/src/lib/inspector-query-response.js";
import { attachDelivery, evaluationDelivery, lineDelivery } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { inspectorSourcePresentationKit } from "../../../packages/runtime/src/testing/inspector-source-presentation-kit.js";
import { recordedComparisonFixture, RECORDED_COMPARISON_AT as at } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { registeredShapeFixture } from "../../../packages/runtime/src/testing/registered-shape-fixture.js";
import { SYZYGY_TABLEBASE_CATEGORIES } from "../../../packages/runtime/src/provider-types.js";
import { StockfishEvidenceExecutor } from "./evidence-queue.js";
import { RunService } from "./service.js";
import { ShapeRegistry } from "./shape-registry.js";
import { ShapeStudio } from "./shape-studio.js";
import { SQLiteRunStorage } from "./storage.js";

const specs = inspectorSourceAdapterSpecs(inspectorSourcePresentationKit);
const ready = (value: unknown) => ({ kind: "reported", value });
function construct(evidence: DeclaredEvidence<unknown>) {
  const entry = specs.find(spec => spec.projection.id === evidence.projection.id && spec.projection.version === evidence.projection.version);
  if (entry === undefined) throw new Error("Missing actual prospective source adapter");
  expect(entry.consumer).toEqual({ id: "module.full_inspector", version: 2 });
  const before = JSON.stringify(evidence.payload), receipt = evidenceValueReceipt(evidence);
  const result = entry.construct(evidence), components = Array.isArray(result) ? result : [result as ComponentValue];
  expect(components.map(component => component.id)).toEqual(adapterComponentsForEvidence(entry, evidence));
  expect(components).toHaveLength(1);
  const component = components[0]!;
  if (component.id !== "fact_statement") throw new Error("Changed source must use its declared narrow statement");
  const parsed = parseComponentValue(JSON.parse(JSON.stringify(component)));
  expect(parsed).toEqual(component);
  // Current cutover proof in addition to the retained constructor checks: real report/
  // ShapeStudio sources must pass the actual complete manifest and sealed wire path.
  const admitted = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [evidence]));
  expect(admitted.map(item => item.component)).toEqual(components);
  expect(parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(admitted))))).toEqual(admitted);
  expect(JSON.stringify(evidence.payload)).toBe(before);
  expect(evidenceValueReceipt(evidence)).toBe(receipt);
  return { component, text: componentValueSentence(parsed), entry };
}
function packet(payload: EvidencePayload, projection: InspectorPacketProjection, black = false) {
  const f = recordedComparisonFixture(black, "prospective-report-adapter"), node = f.mainPath[0]!;
  const run = attachEvidence(f.run, node.id, ["synthetic:report-adapter-fields"], payload, at).run;
  const collection = collectInspectorRecordedPackets(run, f.main, node.id, projection);
  expect(collection.outcome.kind).toBe("available");
  expect(collection.occurrences).toHaveLength(1);
  return collection.occurrences[0]!.value;
}

const stores: SQLiteRunStorage[] = [];
afterEach(() => { for (const storage of stores.splice(0)) storage.close(); });
async function shapeFixture(black: boolean, deleted: boolean) {
  const f = recordedComparisonFixture(black, `prospective-shape-${black}-${deleted}`);
  const run = revealFeedback(rewind(f.run, f.mainPath.at(-1)!.id, at, undefined, f.main).run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const owner = { learnerId: "adapter-run-owner", handle: "adapter-run-owner" };
  const author = { learnerId: "adapter-shape-author", handle: "coach_one" };
  for (const principal of [owner, author]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  storage.create(run, { learnerId: owner.learnerId, writerId: "adapter-writer" });
  const registry = new ShapeRegistry(), document = registeredShapeFixture("actual-published-pattern", black);
  const studio = new ShapeStudio(storage, registry), draft = await studio.create(author, document);
  await studio.register(draft.id, author);
  if (deleted) storage.deleteLearner(author.learnerId, at);
  const hydrated = new ShapeRegistry(); await new ShapeStudio(storage, hydrated).hydrate();
  const service = new RunService(storage, { shapeRegistry: hydrated });
  const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
  const signal = new AbortController().signal, node = f.mainPath.at(-1)!;
  const grant = service.resolveInspectorRecordedContext(run.id, owner, requested, availability,
    { branchId: f.main, nodeId: node.id, decisionDigest: moduleDecisionStamp(run).digest, context: { kind: "branch", throughNodeId: node.id } }, signal);
  const source = service.readInspectorShapeSource(await service.acquireInspectorShapeSource(grant, signal));
  expect(source.outcome.kind).toBe("available");
  expect(source.collection!.result.length).toBeGreaterThan(0);
  return { values: source.collection!.result, document, storage, run };
}

type StatusProjection = "recorded.inspector.wdl_packet@1" | "derived.review.analysis_recorded_pv@1" | "derived.review.analysis_recorded_first@1";
async function issuedStatus(arm: "typed" | "pv" | "none", projection: StatusProjection) {
  const f = recordedComparisonFixture(false, `status-${arm}-${projection}`), parent = f.mainPath[0]!, node = f.mainPath[1]!;
  let run = f.run;
  if (arm === "typed") run = attachDelivery(run, parent.id, evaluationDelivery(parent.fen, "cp 20"), lineDelivery(parent.fen, ["d2d4", "d7d5"]));
  if (arm === "pv") run = attachEvidence(run, parent.id, ["saved:variant-status"], { kind: "bestline", source: "engine_validated", values: { movesUci: ["d2d4"], engineId: "saved", requestedDepth: 12 } }, at).run;
  run = revealFeedback(rewind(run, f.mainPath.at(-1)!.id, at, undefined, f.main).run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  const owner = { learnerId: "status-owner", handle: "status-owner" };
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  storage.create(run, { writerId: "status-writer", learnerId: owner.learnerId });
  const service = new RunService(storage);
  const assistance = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const request: InspectorQueryRequest = { protocol: "inspector.query_page@1", assistance,
    query: { branchId: f.main, nodeId: node.id, decisionDigest: moduleDecisionStamp(run).digest,
      view: { kind: "source", projection, context: { kind: projection.startsWith("derived.review.analysis_") ? "incoming_edge" : "position" }, start: 0, collectionKey: null } } };
  const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
  const page = await service.queryInspectorSources(run.id, owner, request, availability, new AbortController().signal);
  if (page.kind !== "page" || page.body.kind !== "source") throw new Error("Actual current source page required");
  const expected = { runId: run.id, request, fen: node.fen, requestedDigest: assistance.requestDigest, finalDigest: page.effectiveConfigDigest };
  return { page, decode: (wire: unknown = page) => {
    const parsed = parseInspectorQueryPage(wire, expected);
    if (parsed.kind !== "page") throw new Error("Actual page response required");
    return parsed;
  } };
}

describe("changed Inspector source families through prospective production adapters", () => {
  it.each([
    { arm: "typed" as const, projection: "derived.review.analysis_recorded_pv@1" as const },
    { arm: "typed" as const, projection: "derived.review.analysis_recorded_first@1" as const },
    { arm: "pv" as const, projection: "derived.review.analysis_recorded_first@1" as const },
  ])("D4013: decodes the actual selected-$arm refusal for $projection", async ({ arm, projection }) => {
    const f = await issuedStatus(arm, projection);
    expect(f.page.body).toMatchObject({ outcome: { kind: "unavailable", reason: "analyze_variant_not_selected" } });
    expect(f.decode().items).toEqual([]);
  });

  it("D4013: rejects a fully rehashed Analyze-only reason on a genuine unrelated source page", async () => {
    const f = await issuedStatus("none", "recorded.inspector.wdl_packet@1");
    expect(f.page.body).toMatchObject({ outcome: { kind: "unavailable", reason: "source_absent" } });
    expect(f.decode().items).toEqual([]);
    const wire = JSON.parse(JSON.stringify(f.page));
    wire.body.outcome = { kind: "unavailable", reason: "analyze_variant_not_selected" };
    wire.disclosure.sourceOutcome = { ...wire.body.outcome };
    const { digest: _previous, ...body } = wire.disclosure;
    wire.disclosure.digest = presentationDigest("inspector.disclosure_receipt@1", body);
    expect(() => f.decode(wire)).toThrow();
  });

  it.each([false, true].flatMap(black => (["eval", "wdl", "bestline"] as const).map(kind => ({ black, kind }))))("actual $kind producer keeps its historical frame, black=$black", async ({ black, kind }) => {
    const f = recordedComparisonFixture(black), moves = black ? "e7e5 e2e4 g8f6" : "e2e4 e7e5 g1f3";
    const executor = new StockfishEvidenceExecutor({ execute: async () => [`info depth 12 score cp 34 wdl 350 400 250 pv ${moves}`, `bestmove ${moves.split(" ")[0]}`] }, "stockfish-analysis", 1);
    const payload = await executor.execute({ id: "job", runId: f.run.id, nodeId: f.mainPath[0]!.id, fen: f.mainPath[0]!.fen, kind, depth: 12 }, new AbortController().signal);
    const projection = kind === "eval" ? "recorded.inspector.eval_packet@1" : kind === "wdl" ? "recorded.inspector.wdl_packet@1" : "recorded.inspector.pv_packet@1";
    const shown = construct(packet(payload, projection, black));
    expect(shown.component.operand.binding).toBe("recorded_run");
    if (kind === "eval") expect(shown.text).toContain(`centipawn number ${black ? -34 : 34}`);
    if (kind === "wdl") expect(shown.text).toContain("win 350/1000; draw 400/1000; loss 250/1000");
    if (kind === "bestline") expect(shown.text).toContain(black ? "e5 e4 Nf6" : "e4 e5 Nf3");
    expect(shown.text).not.toMatch(/undefined|best move|recommended|e2e4/u);
  });

  it.each([{}, { centipawns: 0, mateIn: 0 }, { centipawns: -31, mateIn: -3, perspective: "white" },
    { centipawns: "invalid", mateIn: null, perspective: "learner" }])("historical evaluation states survive adapter selection: %j", values => {
    const shown = construct(packet({ kind: "eval", source: "engine_validated", values }, "recorded.inspector.eval_packet@1"));
    const operands = shown.component.operand.operands as Record<string, unknown>;
    expect(operands.centipawns).toEqual(!Object.hasOwn(values, "centipawns") ? { kind: "not_recorded" }
      : typeof values.centipawns === "number" ? ready(values.centipawns) : { kind: "uninterpretable" });
    expect(shown.component.operand.rendererId).toBe("inspector.recorded_eval@1");
  });

  it.each([{}, { win: 0, draw: 1000, loss: 0 }, { win: 350, draw: 400, loss: 250 },
    { win: null, draw: 1001, loss: -1 }])("WDL remains literal without flipping or filling: %j", values => {
    const shown = construct(packet({ kind: "wdl", source: "engine_validated", values }, "recorded.inspector.wdl_packet@1", true));
    const operands = shown.component.operand.operands as Record<string, unknown>;
    for (const key of ["win", "draw", "loss"] as const) {
      const value = (values as Record<string, unknown>)[key];
      expect(operands[key]).toEqual(!Object.hasOwn(values, key) ? { kind: "not_recorded" }
        : typeof value === "number" && value >= 0 && value <= 1000 ? ready(value) : { kind: "uninterpretable" });
    }
  });

  it.each([{}, { movesUci: [] }, { pv: ["e2e4"] }, { movesUci: ["e2e4", "e2e5"] }, { movesUci: ["e2e4", 2] }])("PV is a complete historical line or stated missing/uninterpretable: %j", values => {
    const shown = construct(packet({ kind: "bestline", source: "engine_validated", values }, "recorded.inspector.pv_packet@1"));
    const operands = shown.component.operand.operands as Record<string, unknown>;
    expect(operands.line).toEqual(!Object.hasOwn(values, "movesUci") ? { kind: "not_recorded" }
      : Array.isArray(values.movesUci) && values.movesUci.length === 0 ? ready([]) : { kind: "uninterpretable" });
    expect(shown.text).not.toContain(" e4");
  });

  it.each(SYZYGY_TABLEBASE_CATEGORIES)("all three exact tablebase specs retain %s and signed/null distances", category => {
    const payload = { kind: "tablebase", source: "tablebase_exact", values: { category, dtz: -7, preciseDtz: null, dtm: 0, pieceCount: 3 } } as const;
    for (const projection of ["recorded.inspector.tablebase_packet@1", "derived.inspector.tablebase_category@1", "derived.inspector.tablebase_distance@1"] as const) {
      const shown = construct(packet(payload, projection));
      const operands = shown.component.operand.operands as Record<string, unknown>;
      expect(operands.category).toEqual(ready(category));
      if (projection !== "derived.inspector.tablebase_category@1") {
        expect(operands.dtz).toEqual(ready(-7)); expect(operands.preciseDtz).toEqual(ready(null)); expect(operands.dtm).toEqual(ready(0));
        expect(shown.text).toContain("without a distance value");
      }
      expect(shown.component.operand.binding).toBe("recorded_run");
    }
  });

  it.each([{}, { category: "not-a-category", dtz: "not-a-distance", preciseDtz: null, dtm: -2 }])("historical tablebase absence and uninterpretable fields remain distinct: %j", values => {
    for (const projection of ["recorded.inspector.tablebase_packet@1", "derived.inspector.tablebase_category@1", "derived.inspector.tablebase_distance@1"] as const) {
      const shown = construct(packet({ kind: "tablebase", source: "tablebase_exact", values }, projection));
      const operands = shown.component.operand.operands as Record<string, unknown>;
      expect(operands.category).toEqual(Object.hasOwn(values, "category") ? { kind: "uninterpretable" } : { kind: "not_recorded" });
      if (projection !== "derived.inspector.tablebase_category@1") {
        expect(operands.dtz).toEqual(Object.hasOwn(values, "dtz") ? { kind: "uninterpretable" } : { kind: "not_recorded" });
        expect(operands.preciseDtz).toEqual(Object.hasOwn(values, "preciseDtz") ? ready(null) : { kind: "not_recorded" });
        expect(operands.dtm).toEqual(Object.hasOwn(values, "dtm") ? ready(-2) : { kind: "not_recorded" });
      }
    }
  });

  it("arbitrary source prose and copied sources cannot become historical adapter output", () => {
    const original = packet({ kind: "eval", source: "engine_validated", values: { centipawns: 0, prose: "SENTINEL_UNGROUNDED_CLAIM", engineId: "PRIVATE_ENGINE_LABEL" } }, "recorded.inspector.eval_packet@1");
    const shown = construct(original);
    expect(JSON.stringify(shown.component)).not.toMatch(/SENTINEL|PRIVATE_ENGINE/u);
    expect(() => shown.entry.construct({ ...original })).toThrow();
    const crossed = specs.find(spec => spec.projection.id === "recorded.inspector.wdl_packet")!;
    expect(() => crossed.construct(original)).toThrow();
    const wire = JSON.parse(JSON.stringify(shown.component)); wire.operand.operands.ancestry = original.payload;
    expect(() => parseComponentValue(wire)).toThrow();
  });

  it.each([false, true].flatMap(black => [false, true].map(deleted => ({ black, deleted }))))("real publish/hydrate/delete attribution uses shape2's prospective adapter, black=$black deleted=$deleted", async ({ black, deleted }) => {
    const f = await shapeFixture(black, deleted), before = JSON.stringify(f.storage.read(f.run.id));
    for (const value of f.values) {
      const shown = construct(value);
      expect(shown.component.operand.rendererId).toBe("inspector.registered_shape_firing@2");
      expect(shown.text).toContain(f.document.name);
      expect(shown.text).toContain("does not validate the entry's plans");
      expect(shown.text).not.toContain(f.document.id);
      expect(shown.text).toContain(deleted ? "publisher account deleted" : "published by @coach_one");
      expect(shown.text).not.toContain("@deleted");
      expect(() => shown.entry.construct({ ...value })).toThrow();
      const wire = JSON.parse(JSON.stringify(shown.component));
      wire.operand.operands.authority.pointer = "/plans/0";
      expect(() => parseComponentValue(wire)).toThrow();
    }
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
  });
});
