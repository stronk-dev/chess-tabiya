import { FOUNDATION_INSPECTOR_CASES } from "../../../packages/runtime/src/testing/foundation-inspector-fixture.js";
// Independent browser receiver falsifiers over real Full2 pages issued by RunService/SQLite.
// Synthetic stored reports test delivery and multiplicity, never chess qualification.
import { afterEach, describe, expect, it } from "vitest";
import { attachEvidence, commitMove, compileAssistanceRequest, moduleDecisionStamp, revealFeedback,
  serverAvailabilityFromProviders, type DrillRun } from "@chess-tabiya/runtime";
import { recordedInspectorRun } from "../../../packages/runtime/src/testing/recorded-inspector-fixture.js";
import { recordedComparisonFixture } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { INSPECTOR_SOURCE_TOPICS, type InspectorQueryPage, type InspectorQueryRequest,
  type InspectorQueryView, type InspectorSourceContext } from "../../../packages/runtime/src/inspector-query-contract.js";
import { INSPECTOR_DETAIL_SOURCES } from "../../../packages/runtime/src/inspector-detail.js";
import { STRUCTURAL_EVENT_FAMILIES } from "../../../packages/runtime/src/evidence-catalog.js";
import { collectInspectorLocalEdge, type InspectorLocalProjection } from "../../../packages/runtime/src/inspector-local-source.js";
import { inspectorFixtureEdges } from "../../../packages/runtime/src/testing/inspector-presentation-fixture.js";
import { recordedSequenceWindowFixture } from "../../../packages/runtime/src/testing/recorded-sequence-window-fixture.js";
import { PRESENTATION_ADAPTERS, factStatementOperand, presentationDigest } from "../../../packages/runtime/src/presentation-contract.js";
import { parseInspectorQueryPage } from "../../web/src/lib/inspector-query-response.js";
import { recordedReviewLedgerFixture } from "./recorded-review-ledger.test-support.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { ControlledFetch, FakeEngines, ManualClock, flush } from "./provider-exchange.test-support.js";
import { testRegistry } from "./provider-health.test-support.js";
import { ExchangeMaiaTaskSource } from "./provider-maia.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { OpponentSelector } from "./opponent-selector.js";
import { ExchangeCorpusSource } from "./provider-corpus.js";

type Page = Extract<InspectorQueryPage, { kind: "page" }>;
type Mutable = Record<string, any>;
const at = "2026-11-03T00:15:00.000Z";
const owner = { learnerId: "inspector-receiver-owner", handle: "inspector-receiver-owner" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { for (const store of stores.splice(0)) store.close(); });
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
function fixture(input: DrillRun = recordedInspectorRun()) {
  const run = revealFeedback(input, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: owner.learnerId, handle: owner.handle, passwordHash: "!", createdAt: at });
  storage.create(run, { writerId: "inspector-receiver-writer", learnerId: owner.learnerId });
  return { run, storage, service: new RunService(storage), principal: owner };
}
async function issued(f: Pick<ReturnType<typeof fixture>, "run" | "service" | "principal">, view: InspectorQueryView, suppliedAvailability = availability) {
  const request: InspectorQueryRequest = { protocol: "inspector.query_page@1",
    assistance: compileAssistanceRequest({ contextHint: f.run.sessionKind,
      preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }),
    query: { branchId: f.run.activeCursor.branchId, nodeId: f.run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(f.run).digest, view } };
  const result = await f.service.queryInspectorSources(f.run.id, f.principal, request, suppliedAvailability, new AbortController().signal);
  if (result.kind !== "page") throw new Error(`Actual Full2 page refused: ${result.code}`);
  const expected = { runId: f.run.id, request, requestedDigest: result.requestedConfigDigest,
    finalDigest: result.effectiveConfigDigest, fen: f.run.nodes.find(node => node.id === request.query.nodeId)!.fen };
  return { page: result, expected, decode: (value: unknown = copy(result)) => parseInspectorQueryPage(value, expected) };
}
function source(projection: Extract<InspectorQueryView, { kind: "source" }>["projection"], context: InspectorSourceContext = { kind: "position" }): InspectorQueryView {
  return projection === "rules.tactic.consequence.forced_mate_after_move@1" || projection === "rules.tactic.consequence.forced_mate_after_move@2"
    ? { kind: "source", projection, context, start: 0, collectionKey: null, parameters: { kind: "forced_mate", maxAttackerMoves: 1 } }
    : { kind: "source", projection, context, start: 0, collectionKey: null };
}
function available(page: Page) {
  if (page.body.kind !== "source" || page.body.outcome.kind !== "available") throw new Error("Actual available source required");
  return page.body.outcome;
}
function rehash(value: Mutable) {
  const presentation = value.body.kind === "detail" ? value.body.presentation
    : value.body.kind === "source" && value.body.outcome.kind === "available" ? value.body.outcome.presentation : null;
  if (presentation !== null) {
    presentation.digest = presentationDigest("presentation.receipt@1", presentation.items);
    value.disclosure.componentDigests = presentation.items.map((item: Mutable) => item.componentDigest);
  }
  const { digest: _old, ...body } = value.disclosure;
  value.disclosure.digest = presentationDigest("inspector.disclosure_receipt@1", body);
  return value;
}
function rehashComponent(item: Mutable) {
  item.componentDigest = presentationDigest("presentation.component@1", { evidenceRef: item.evidenceRef, adapter: item.adapter, component: item.component });
}
function rerenderStatement(item: Mutable) {
  const statement = item.component.operand;
  item.component.operand = factStatementOperand(statement.rendererId, statement.binding, statement.convention, statement.operands);
  rehashComponent(item);
}
async function modelFixture() {
  const f = fixture(recordedInspectorRun(1500)), engines = new FakeEngines(), clock = new ManualClock();
  const health = await testRegistry({ "maia-inference": "available" });
  engines.respond = () => ["info multipv 1 policy 0 score cp 739 wdl 0 362 638 pv e2e4", "info multipv 3 pv d2d4", "bestmove e2e4"];
  const providers = composeProviderTraversalApplication({ engines, maiaTaskHealth: health, tablebaseFetch: null,
    explorerFetch: null, explorerToken: null, monotonicNowMs: clock.now, wallNow: clock.wall });
  const maiaTaskSource = new ExchangeMaiaTaskSource({ scheduler: providers.scheduler, engines, health, monotonicNowMs: clock.now });
  const selector = new OpponentSelector({ health: id => engines.health(id), execute: async () => { throw new Error("Forbidden raw-model fallback"); } },
    { maiaTaskSource, health, monotonicNowMs: clock.now, wallNow: clock.wall });
  return { ...f, engines, service: new RunService(f.storage, { opponentSelector: selector }),
    modelAvailability: serverAvailabilityFromProviders({ opponent: "external", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" }) };
}
async function explorerPage(total: number) {
  const f = fixture(recordedInspectorRun(1500)), clock = new ManualClock(), remote = new ControlledFetch();
  const providers = composeProviderTraversalApplication({ engines: null, tablebaseFetch: null, explorerFetch: remote.fetch,
    explorerToken: "synthetic-test-token", monotonicNowMs: clock.now, wallNow: clock.wall });
  const corpusSource = new ExchangeCorpusSource({ scheduler: providers.scheduler, monotonicNowMs: clock.now });
  const service = new RunService(f.storage, { corpusSource });
  const corpusAvailability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "external", tts: "none", tablebase: "none" });
  const pending = issued({ ...f, service }, source("derived.explorer.inspector_population@1"), corpusAvailability);
  await flush(); expect(remote.calls).toHaveLength(1);
  remote.respond(0, { white: total, draws: 0, black: 0, moves: total === 0 ? [] : [{ uci: "e2e4", san: "UNTRUSTED", white: Math.min(100, total), draws: 0, black: 0, averageRating: 1640 }],
    history: [], opening: null });
  return pending;
}

describe("independent actual Full2 browser receiver", () => {
  it.each(STRUCTURAL_EVENT_FAMILIES.filter(value => ["king_zone", "passed_pawn", "piece_count", "direct_attack_count"].includes(value)))("D4060 rejects redigested wrong-family/renderer/convention/binding for actual %s source", async family => {
    const projection = `rules.structural.event.${family}@1` as InspectorLocalProjection;
    const seed = inspectorFixtureEdges().find(edge => collectInspectorLocalEdge(projection, edge).values.length > 0)!;
    const f = fixture(recordedSequenceWindowFixture({ fen: seed.beforeFen, moves: [seed.moveUci] }));
    const r = await issued(f, source(projection, { kind: "incoming_edge" }));
    expect(r.decode().kind).toBe("page");
    const wrongFamily = family === "open_file" ? { family: "piece_count", before: null, after: { kind: "piece_count", color: "white", role: "pawn", count: 0, squares: [] } }
      : { family: "open_file", before: null, after: { kind: "open_file", file: "a", squares: [] } };
    for (const fault of ["family", "renderer", "convention", "binding"]) {
      const wire = copy(r.page) as Mutable, outcome = wire.body.outcome, item = outcome.presentation.items[0];
      const statement = item.component.operand;
      if (fault === "family") statement.operands = { san: statement.operands.san, ...wrongFamily };
      else if (fault === "renderer") {
        statement.rendererId = "inspector.pawn_islands_event@1";
        statement.operands = { san: statement.operands.san, color: "white", before: 0, after: 0 };
      } else if (fault === "convention") statement.convention = statement.convention === "board-rules@1" ? "pawn-structure@1" : "board-rules@1";
      else statement.binding = "recorded_run";
      rerenderStatement(item);
      expect(() => r.decode(rehash(wire)), fault).toThrow();
    }
  });
  it("requires semantic wire validation on every one of the actual102 Full2 adapter pairs", () => {
    const adapters = PRESENTATION_ADAPTERS.filter(adapter => adapter.consumer.id === "module.full_inspector" && adapter.consumer.version === 2);
    const roots = [...INSPECTOR_SOURCE_TOPICS.map(topic => topic.projection), ...Object.keys(INSPECTOR_DETAIL_SOURCES).map(kind => `derived.inspector.detail.${kind}@1`)];
    expect(adapters).toHaveLength(103);
    expect(adapters.map(adapter => `${adapter.projection.id}@${adapter.projection.version}`).sort()).toEqual(roots.sort());
    expect(adapters.every(adapter => typeof adapter.validateWireComponent === "function")).toBe(true);
  });
  it("accepts every complete bounded inventory page without a synthetic consumer", async () => {
    const f = fixture(), seen: string[] = [];
    for (let start = 0; start < INSPECTOR_SOURCE_TOPICS.length; start += 8) {
      const r = await issued(f, { kind: "inventory", start }), parsed = r.decode();
      expect(parsed.kind).toBe("page");
      if (parsed.kind !== "page" || parsed.body.kind !== "inventory") throw new Error("Expected inventory");
      seen.push(...parsed.body.topics.map(topic => topic.projection)); expect(parsed.items).toEqual([]);
    }
    expect(seen).toEqual(INSPECTOR_SOURCE_TOPICS.map(topic => topic.projection));
  });

  it.each(INSPECTOR_SOURCE_TOPICS)("parses the actual demanded $projection outcome under its declared context", async topic => {
    const f = fixture(recordedComparisonFixture(false, "independent-receiver-all-topics").run), kind = topic.contexts[0]!;
    const context: InspectorSourceContext = kind === "branch" || kind === "recorded_review" ? { kind, throughNodeId: f.run.activeCursor.nodeId }
      : kind === "comparison" ? { kind, otherBranchId: f.run.branches.find(branch => branch.id !== f.run.activeCursor.branchId)!.id,
        otherNodeId: f.run.nodes.find(node => node.parentId === null)!.id } : { kind };
    const r = await issued(f, source(topic.projection, context));
    expect(r.decode()).toMatchObject({ kind: "page", body: { kind: "source", projection: topic.projection } });
  });

  it.each(Object.entries(INSPECTOR_DETAIL_SOURCES))("parses genuine %s whole/focused details with original source ordinals", async (kind, projection) => {
    const initial = kind === "backward_pawn_advance" ? recordedSequenceWindowFixture({ fen: "1r5k/8/8/p1p5/8/1P6/8/1R5K w - - 0 1", moves: ["b3b4"] })
      : kind === "destination_changes" ? commitMove(recordedInspectorRun(), "b1a3", { at }).run : recordedInspectorRun();
    const f = fixture(initial), context = { kind: kind === "destination_changes" || kind === "backward_pawn_advance" ? "incoming_edge" : "position" } as const;
    const full = await issued(f, source(projection, context)), fact = available(full.page).facts[0]!;
    const r = await issued(f, { kind: "detail", projection, context, sourceKey: fact.sourceKey, scope: { kind: "whole" }, start: 0 });
    expect(r.decode()).toMatchObject({ kind: "page", body: { kind: "detail", sourceKey: fact.sourceKey } });
    if (kind === "square_control") {
      const focus = await issued(f, { kind: "detail", projection, context, sourceKey: fact.sourceKey,
        scope: { kind: "control_target", color: "white", mode: "geometric", target: "e4" }, start: 0 });
      const parsed = focus.decode();
      if (parsed.kind !== "page" || parsed.body.kind !== "detail") throw new Error("Expected focused detail");
      expect(parsed.body.sourceOrdinals[0]).toBeGreaterThan(0);
      expect(parsed.body.range.total).toBeLessThan(parsed.body.fullSourceTotal);
    }
  });

  it("retains repeated equal-valued saved reports as distinct ordered occurrences across pages", async () => {
    let run = recordedInspectorRun();
    for (let index = 0; index < 11; index++) run = attachEvidence(run, run.activeCursor.nodeId, ["synthetic:receiver-same"],
      { kind: "eval", source: "engine_validated", values: { centipawns: 20 } }, at).run;
    const f = fixture(run), first = await issued(f, source("recorded.inspector.eval_packet@1"));
    expect(first.decode()).toMatchObject({ kind: "page", body: { outcome: { collected: 11 } } });
    const a = available(first.page), second = await issued(f, { kind: "source", projection: "recorded.inspector.eval_packet@1", context: { kind: "position" }, start: 8, collectionKey: a.collectionKey });
    expect(second.decode().kind).toBe("page");
    const b = available(second.page);
    expect(new Set([...a.facts, ...b.facts].map(fact => fact.sourceKey)).size).toBe(11);
    expect([...first.page.disclosure.sourceOrdinals, ...second.page.disclosure.sourceOrdinals]).toEqual(f.run.events.flatMap((event, ordinal) => event.type === "evidence.attached" ? [ordinal] : []));
  });

  it("parses real mixed ledger coverage and repeated equal values without confusing refusal with budgeting", async () => {
    const f = await recordedReviewLedgerFixture(); stores.push(f.storage);
    const r = await issued(f, source("recorded.engine.eval@1"));
    expect(r.decode()).toMatchObject({ kind: "page", body: { recordedCoverage: { matchedRecords: 3, admittedRecords: 2, notAdmittedRecords: 1,
      abstentions: { source_unavailable: 1 } }, outcome: { kind: "available", collected: 2 } } });
    expect(r.page.disclosure.sourceOrdinals).toEqual([8, 9]);
  });

  it.each(["empty", "absent"] as const)("parses the actual %s ledger status without inventing measurements", async variant => {
    const f = await recordedReviewLedgerFixture("white", variant); stores.push(f.storage);
    const r = await issued(f, source("recorded.engine.eval@1"));
    expect(r.decode()).toMatchObject({ kind: "page", body: { outcome: variant === "empty" ? { kind: "no_witness" } : { kind: "unavailable", reason: "source_absent" } } });
  });

  it.each([0, 99, 100])("accepts actual Explorer total %s with the correct sparse/available status", async total => {
    const r = await explorerPage(total), parsed = r.decode();
    expect(parsed).toMatchObject({ kind: "page", body: { outcome: { kind: total < 100 ? "below_floor" : "available" }, recordedCoverage: null } });
    if (total < 100) expect(r.page.disclosure).toMatchObject({ range: null, sourceKeys: [], sourceOrdinals: [], componentDigests: [], sourceOutcome: { kind: "below_floor", total } });
  });

  it.each(["rating-order", "speed-order", "bad-month", "floor", "extra"])("refuses a rehashed %s sparse-population mutation", async fault => {
    const r = await explorerPage(99), value = copy(r.page) as unknown as Mutable, status = value.body.outcome;
    if (fault === "rating-order") status.population.ratingBuckets = [1600, 1400];
    else if (fault === "speed-order") status.population.speeds = ["rapid", "blitz"];
    else if (fault === "bad-month") status.population.since = "2026-13";
    else if (fault === "floor") status.total = 100;
    else status.population.rawProvider = true;
    value.disclosure.sourceOutcome = copy(status);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it.each(["extra", "fraction", "overflow", "inconsistent", "wrong-topic"])("refuses rehashed %s ledger coverage", async fault => {
    const f = await recordedReviewLedgerFixture(); stores.push(f.storage);
    const r = await issued(f, source("recorded.engine.eval@1")), value = copy(r.page) as unknown as Mutable;
    const counts = value.body.recordedCoverage;
    if (fault === "extra") counts.abstentions.private = 1;
    else if (fault === "fraction") counts.admittedRecords = 1.5;
    else if (fault === "overflow") { counts.matchedRecords = Number.MAX_SAFE_INTEGER; counts.notAdmittedRecords = Number.MAX_SAFE_INTEGER; }
    else if (fault === "inconsistent") counts.matchedRecords = 4;
    else value.body.projection = "recorded.inspector.eval_packet@1";
    value.disclosure.recordedCoverage = copy(counts);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it.each(["unit", "saturated", "perspective", "basis"])("refuses a globally valid but source-incompatible %s on an actual recorded engine magnitude", async field => {
    const f = await recordedReviewLedgerFixture(); stores.push(f.storage);
    const r = await issued(f, source("recorded.engine.eval@1")), value = copy(r.page) as unknown as Mutable;
    const item = value.body.outcome.presentation.items[0];
    expect(item.component.id).toBe("magnitude");
    if (field === "unit") item.component.operand.unit.kind = "elo";
    else if (field === "saturated") item.component.operand.saturated = true;
    else if (field === "perspective") item.component.operand.convention.perspective = "learner";
    else item.component.operand.convention.basis = { kind: "declared", convention: "maia-reported-window@1" };
    rehashComponent(item);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it("retains true zero/unknown model shares and same-row candidate WDL from one genuine model task", async () => {
    const f = await modelFixture(), distribution = await issued(f, source("derived.maia.node_distribution@1"), f.modelAvailability);
    const wdl = await issued(f, source("derived.maia.node_candidate_wdl@1"), f.modelAvailability);
    for (const r of [distribution, wdl]) expect(r.decode().kind).toBe("page");
    expect(available(distribution.page).presentation.items[0]!.component).toMatchObject({ id: "fact_statement", operand: { operands: {
      nodeId: f.run.activeCursor.nodeId, candidates: [{ moveUci: "e2e4", rank: 1, mass: 0 }, { moveUci: "d2d4", rank: 3, mass: null }] } } });
    expect(available(wdl.page).presentation.items[0]!.component).toMatchObject({ id: "fact_statement", operand: { operands: {
      nodeId: f.run.activeCursor.nodeId, candidates: [{ moveUci: "e2e4", rank: 1, wdl: { win: 0, draw: 362, loss: 638 } }] } } });
    expect(f.engines.calls).toHaveLength(1);
  });

  it.each(["derived.maia.node_distribution@1", "derived.maia.node_candidate_wdl@1"] as const)("refuses rehashed %s operands belonging to another node", async projection => {
    const f = await modelFixture(), r = await issued(f, source(projection), f.modelAvailability), value = copy(r.page) as unknown as Mutable;
    const item = value.body.outcome.presentation.items[0];
    item.component.operand.operands.nodeId = "foreign-model-node";
    rerenderStatement(item);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it.each(["derived.maia.node_distribution@1", "derived.maia.node_candidate_wdl@1"] as const)("refuses a rehashed illegal move in %s's requested-position window", async projection => {
    const f = await modelFixture(), r = await issued(f, source(projection), f.modelAvailability), value = copy(r.page) as unknown as Mutable;
    const item = value.body.outcome.presentation.items[0];
    item.component.operand.operands.candidates[0].moveUci = "e2e5";
    rerenderStatement(item);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it("refuses a foreign evidence producer on an otherwise genuine castling source tuple", async () => {
    const r = await issued(fixture(), source("rules.castling.reading.rights@1")), value = copy(r.page) as unknown as Mutable;
    const item = value.body.outcome.presentation.items[0];
    item.evidenceRef.producer.id = "foreign.unregistered.producer";
    rehashComponent(item);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it("refuses a magnitude convention producer crossed from its retained genuine evidence producer", async () => {
    const f = await recordedReviewLedgerFixture(); stores.push(f.storage);
    const r = await issued(f, source("recorded.engine.eval@1")), value = copy(r.page) as unknown as Mutable;
    const item = value.body.outcome.presentation.items[0];
    item.component.operand.convention.producer.id = "foreign.unregistered.producer";
    rehashComponent(item);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it("refuses another genuine source's statement under a still-matching castling adapter tuple", async () => {
    const f = fixture(), r = await issued(f, source("rules.castling.reading.rights@1")), other = await issued(f, source("rules.mobility.reading.legal_moves@1"));
    const value = copy(r.page) as unknown as Mutable, item = value.body.outcome.presentation.items[0];
    item.component = copy(available(other.page).presentation.items[0]!.component);
    rehashComponent(item);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it.each((["rules.castling.reading.rights@1", "rules.mobility.reading.legal_moves@1"] as const).flatMap(projection =>
    (["binding", "convention"] as const).map(field => ({ projection, field }))))("refuses $projection statement $field swaps without changing the valid operands", async ({ projection, field }) => {
    const r = await issued(fixture(), source(projection));
    const value = copy(r.page) as unknown as Mutable, items = value.body.outcome.presentation.items;
    items[0].component.operand[field] = field === "binding" ? "recorded_run" : "maia-reported-window@1";
    if (items[1]?.component.id === "square_set") items[1].component.operand.caption = copy(items[0].component.operand);
    items.forEach(rehashComponent);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it.each(["run", "branch", "node", "request-help", "effective-help", "decision"])("refuses a %s expected-authority mismatch", async fault => {
    const f = fixture(), r = await issued(f, source("rules.castling.reading.rights@1")), expected = copy(r.expected);
    if (fault === "run") expected.runId = "other-run";
    else if (fault === "branch") expected.request = { ...expected.request, query: { ...expected.request.query, branchId: "other-branch" } };
    else if (fault === "node") expected.request = { ...expected.request, query: { ...expected.request.query, nodeId: "other-node" } };
    else if (fault === "request-help") expected.requestedDigest = `sha256:${"e".repeat(64)}`;
    else if (fault === "effective-help") expected.finalDigest = `sha256:${"e".repeat(64)}`;
    else expected.request = { ...expected.request, query: { ...expected.request.query, decisionDigest: `sha256:${"e".repeat(64)}` } };
    expect(() => parseInspectorQueryPage(copy(r.page), expected)).toThrow();
  });

  it.each(["top-extra", "range-extra", "context-extra", "fact-extra", "status-extra", "duplicate-key", "duplicate-ordinal", "range-zero", "cross-context", "bad-projection", "unknown-hold"])("refuses rehashed %s closed-wire corruption", async fault => {
    const r = await issued(fixture(), source("rules.castling.reading.rights@1")), value = copy(r.page) as unknown as Mutable;
    const outcome = value.body.outcome;
    if (fault === "top-extra") value.extra = true;
    else if (fault === "range-extra") outcome.range.extra = true;
    else if (fault === "context-extra") value.body.context.extra = true;
    else if (fault === "fact-extra") outcome.facts[0].extra = true;
    else if (fault === "status-extra") { value.body.outcome = { kind: "no_witness", extra: true }; value.disclosure.sourceOutcome = value.body.outcome; }
    else if (fault === "duplicate-key") { outcome.facts.push(copy(outcome.facts[0])); outcome.range.count = 2; outcome.range.total = 2; outcome.collected = 2; outcome.displayed = 2; value.disclosure.range = outcome.range; value.disclosure.sourceKeys.push(value.disclosure.sourceKeys[0]); value.disclosure.sourceOrdinals.push(1); }
    else if (fault === "duplicate-ordinal") value.disclosure.sourceOrdinals = [0, 0];
    else if (fault === "range-zero") { outcome.range.count = 0; value.disclosure.range = outcome.range; }
    else if (fault === "cross-context") value.body.context = { kind: "incoming_edge" };
    else if (fault === "bad-projection") value.body.projection = "rules.pawn.reading.contacts@1";
    else { value.body.outcome = { kind: "unavailable", reason: "source_version_held", dependency: "runtime-opening-identity" }; value.disclosure.sourceOutcome = value.body.outcome; }
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it("refuses nested accessors without executing getters or toJSON", async () => {
    const r = await issued(fixture(), source("rules.castling.reading.rights@1"));
    for (const field of ["body", "disclosure", "decision"]) {
      const value = copy(r.page) as unknown as Mutable; let reads = 0;
      Object.defineProperty(value, field, { enumerable: true, get() { reads++; throw new Error("GETTER EXECUTED"); } });
      expect(() => r.decode(value)).toThrow(); expect(reads).toBe(0);
    }
    const value = copy(r.page) as unknown as Mutable; let calls = 0;
    value.body.toJSON = () => { calls++; return {}; };
    expect(() => r.decode(value)).toThrow(); expect(calls).toBe(0);
  });

  it("refuses cropped positive whole-source geometry even when both public digests are recomputed", async () => {
    const r = await issued(fixture(), source("rules.mobility.reading.legal_moves@1")), value = copy(r.page) as unknown as Mutable;
    const original = available(r.page);
    expect(original.displayed).toBe(1); expect(original.presentation.items.map(item => item.component.id)).toEqual(["fact_statement", "square_set"]);
    value.body.outcome.presentation.items.pop();
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it("refuses cropped actual detail witness squares even when both public digests are recomputed", async () => {
    const f = fixture(), projection = "rules.square.reading.control@1", full = await issued(f, source(projection));
    const r = await issued(f, { kind: "detail", projection, context: { kind: "position" }, sourceKey: available(full.page).facts[0]!.sourceKey, scope: { kind: "whole" }, start: 0 });
    if (r.page.body.kind !== "detail") throw new Error("Expected actual detail");
    expect(r.page.body.presentation.items.map(item => item.component.id)).toEqual(["fact_statement", "square_set"]);
    const value = copy(r.page) as unknown as Mutable; value.body.presentation.items.pop();
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it.each(["source", "detail"])("refuses a %s square component whose explicit fact owner differs from its evidence owner", async kind => {
    const f = fixture(), original = await issued(f, source("rules.square.reading.control@1"));
    const r = kind === "source" ? await issued(f, source("rules.mobility.reading.legal_moves@1"))
      : await issued(f, { kind: "detail", projection: "rules.square.reading.control@1", context: { kind: "position" },
        sourceKey: available(original.page).facts[0]!.sourceKey, scope: { kind: "whole" }, start: 0 });
    const value = copy(r.page) as unknown as Mutable;
    const presentation = kind === "source" ? value.body.outcome.presentation : value.body.presentation;
    const board = presentation.items.find((item: Mutable) => item.component.id === "square_set");
    expect(board).toBeDefined(); board.component.operand.owner.factRef = `sha256:${"f".repeat(64)}`;
    rehashComponent(board);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it("refuses a source square caption borrowed from a different genuine source statement", async () => {
    const f = fixture(), r = await issued(f, source("rules.mobility.reading.legal_moves@1")), other = await issued(f, source("rules.castling.reading.rights@1"));
    const value = copy(r.page) as unknown as Mutable, board = value.body.outcome.presentation.items[1];
    expect(board.component.id).toBe("square_set");
    board.component.operand.caption = copy(available(other.page).presentation.items[0]!.component.operand);
    rehashComponent(board);
    expect(() => r.decode(rehash(value))).toThrow();
  });

  it("refuses shifted original member ordinals in an unfocused whole detail view", async () => {
    const f = fixture(), full = await issued(f, source("rules.square.reading.control@1"));
    const r = await issued(f, { kind: "detail", projection: "rules.square.reading.control@1", context: { kind: "position" },
      sourceKey: available(full.page).facts[0]!.sourceKey, scope: { kind: "whole" }, start: 0 });
    const value = copy(r.page) as unknown as Mutable;
    const items = value.body.presentation.items;
    for (const member of items[0].component.operand.operands.members) member.sourceOrdinal += 10;
    // Ordinals do not change the displayed prose. Deliberately recompute the public
    // operand checksum without asking the strict constructor to issue this invalid value.
    items[0].component.operand.sourceDigest = presentationDigest("presentation.fact.operands@1", items[0].component.operand.operands);
    if (items[1]?.component.id === "square_set") items[1].component.operand.caption = copy(items[0].component.operand);
    value.body.sourceOrdinals = value.body.sourceOrdinals.map((ordinal: number) => ordinal + 10);
    value.disclosure.sourceOrdinals = copy(value.body.sourceOrdinals);
    items.forEach(rehashComponent);
    expect(() => r.decode(rehash(value))).toThrow();
  });
});


// A valid changed caption plus newly calculated public hashes must not borrow an original source.
describe("seven current structural source-reference joins", () => {
  const cases = [
    ["rules.structural.event.king_opposition@2", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7", ["before", "kings", "white"], "d1"],
    ["rules.structural.event.backward_pawn@2", "7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5", ["after", "halfOpenForColor", "value"], false],
    ["derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/8/PP1P4/7K w - - 0 1", "a2a3", ["after", "doubled"], true],
    ["rules.transition.event.slider_ray@2", "4k3/8/8/8/8/8/B7/R3K3 w - - 0 1", "a2b3", ["direction", "df"], 1],
    ["derived.activity.event.file_state@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3", ["cause", "mover", "color"], "black"],
    ["derived.activity.event.file_access_revealed@1", "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3", ["fileChange", "cause", "mover", "color"], "black"],
    ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3", ["after", "0", "pawns", "0"], "c4"],
  ] as const;
  for (const [route, fen, move, path, replacement] of cases) it(`${route} rejects fully redigested plausible nested mutation retaining original ref`, async () => {
    const f = fixture(recordedSequenceWindowFixture({ fen, moves: [move] }));
    const r = await issued(f, source(route, { kind: "incoming_edge" }));
    expect(r.decode().kind).toBe("page");
    const wire = copy(r.page) as Mutable, item = wire.body.outcome.presentation.items[0];
    const originalRef = copy(item.evidenceRef);
    let field = item.component.operand.operands;
    for (const segment of path.slice(0, -1)) field = field[segment];
    expect(field[path.at(-1)!]).not.toEqual(replacement); field[path.at(-1)!] = replacement;
    // Must still be a structurally valid, re-rendered fact: the full source join rejects it later.
    expect(() => rerenderStatement(item)).not.toThrow();
    rehash(wire); expect(item.evidenceRef).toEqual(originalRef);
    expect(() => r.decode(wire)).toThrow(/source|structural|readout|PRESENTATION|Inspector/i);
  });
  // Enumerate original leaves rather than hand-select only an easy mutation. Every original
  // field is independently omitted AND changed on genuine service-issued source pages.
  const leaves = (value: unknown, path: readonly string[] = []): readonly (readonly string[])[] => {
    if (value === null || typeof value !== "object" || Object.keys(value).length === 0) return [path];
    return Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
  };
  const changed = (value: unknown): unknown => {
    if (typeof value === "boolean") return !value;
    if (typeof value === "number") return value + 1;
    if (Array.isArray(value)) return [null];
    if (value === null) return {};
    if (value === "white") return "black"; if (value === "black") return "white";
    if (typeof value === "string" && /^[a-h][1-8]$/.test(value)) return value === "a1" ? "b1" : "a1";
    return "invalid-source-member";
  };
  for (const [route, fen, move] of cases) it(`${route} rejects changed and omitted original nested leaves after public rehashing`, async () => {
    const f = fixture(recordedSequenceWindowFixture({ fen, moves: [move] }));
    const r = await issued(f, source(route, { kind: "incoming_edge" }));
    expect(r.decode().kind).toBe("page");
    const original = (r.page.body as Mutable).outcome.presentation.items[0];
    const paths = leaves(original.component.operand.operands);
    expect(paths.length).toBeGreaterThan(10);
    for (const path of paths) for (const omit of [false, true]) {
      const wire = copy(r.page) as Mutable, item = wire.body.outcome.presentation.items[0];
      let parent = item.component.operand.operands;
      for (const segment of path.slice(0, -1)) parent = parent[segment];
      const key = path.at(-1)!;
      if (omit) {
        if (Array.isArray(parent)) parent.splice(Number(key), 1); else delete parent[key];
      } else parent[key] = changed(parent[key]);
      try { rerenderStatement(item); }
      catch {
        // Malformed schemas have no valid new sentence. Still recompute the actual public
        // operand/component/receipt checksums, so an obsolete checksum is not the falsifier.
        item.component.operand.sourceDigest = presentationDigest("presentation.fact.operands@1", item.component.operand.operands);
        rehashComponent(item);
      }
      rehash(wire); expect(item.evidenceRef).toEqual(original.evidenceRef);
      expect(() => r.decode(wire), `${route} ${omit ? "omit" : "change"} ${path.join(".")}`).toThrow();
    }
    expect(r.decode().kind).toBe("page");
  });

});

// The current source/view reference remains fixed while every public component/receipt hash changes.
describe("complete foundation snapshot and own-detail reference joins", () => {
  const leaves = (value: unknown, path: readonly string[] = []): readonly (readonly string[])[] => value === null || typeof value !== "object" || Object.keys(value).length === 0
    ? [path] : Object.entries(value).flatMap(([key, child]) => leaves(child, [...path, key]));
  const changed = (value: unknown): unknown => typeof value === "boolean" ? !value : typeof value === "number" ? value + 1 : Array.isArray(value) ? [null] : value === null ? {} : value === "white" ? "black" : value === "black" ? "white" : typeof value === "string" && /^[a-h][1-8]$/.test(value) ? value === "a1" ? "b1" : "a1" : "invalid-original-member";
  for (const [route, fen, move, detailKind] of FOUNDATION_INSPECTOR_CASES) it(`${route} refuses every changed/omitted source and detail leaf after public rehashing`, async () => {
    const f = fixture(recordedSequenceWindowFixture({ fen, moves: [move] }));
    const r = await issued(f, source(route, { kind: route === "derived.pawn.consequence.backward_pawn_legal_advance@1" ? "incoming_edge" : "position" }));
    expect(r.decode().kind).toBe("page");
    const originals = [r];
    if (detailKind !== null) {
      const sourceBody = available(r.page);
      let start = 0;
      for (;;) {
        const detail = await issued(f, { kind: "detail", projection: route, context: (r.page.body as Extract<Page["body"], { kind: "source" }>).context,
          sourceKey: sourceBody.facts[0]!.sourceKey, scope: { kind: "whole" }, start });
        if (detail.page.body.kind !== "detail") throw Error("Actual full detail page required");
        expect(detail.decode().kind).toBe("page"); originals.push(detail);
        if (detail.page.body.range.next === null) break;
        start = detail.page.body.range.next;
      }
    }
    for (const page of originals) {
      const original = page.page.body.kind === "detail" ? (page.page.body as Mutable).presentation.items[0] : (page.page.body as Mutable).outcome.presentation.items[0];
      for (const path of leaves(original.component.operand.operands)) for (const omit of [false, true]) {
        const wire = copy(page.page) as Mutable, item = wire.body.kind === "detail" ? wire.body.presentation.items[0] : wire.body.outcome.presentation.items[0];
        let parent = item.component.operand.operands;
        for (const segment of path.slice(0, -1)) parent = parent[segment];
        const key = path.at(-1)!;
        if (omit) { if (Array.isArray(parent)) parent.splice(Number(key), 1); else delete parent[key]; }
        else parent[key] = changed(parent[key]);
        try { rerenderStatement(item); }
        catch { item.component.operand.sourceDigest = presentationDigest("presentation.fact.operands@1", item.component.operand.operands); rehashComponent(item); }
        rehash(wire); expect(item.evidenceRef).toEqual(original.evidenceRef);
        expect(() => page.decode(wire), `${route} ${wire.body.kind} ${omit ? "omit" : "change"} ${path.join(".")}`).toThrow();
      }
      expect(page.decode().kind).toBe("page");
    }
  });
});
