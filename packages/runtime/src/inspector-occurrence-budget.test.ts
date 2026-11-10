// D3980: Inspector source-order occurrences are not generic reducer factIdentity deduplication.
// All evidence and components below come from real current factories and registered adapters.
import { describe, expect, it } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./chess.js";
import { EVIDENCE_ADAPTERS, PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { moduleDeclaration } from "./module-registry.js";
import { fitInspectorSourceOccurrences, fitModulePresentation } from "./module-query.js";
import { presentEvidenceItems, presentedItemOwner, presentedSentence, serializePresentedEvidence, parsePresentationReceipt } from "./presentation-contract.js";
import { createRecordedSequenceWindows, readRecordedSequenceWindow } from "./recorded-sequence-window.js";
import { recordedSequenceRouteFixture, recordedSequenceWindowFixture } from "./testing/recorded-sequence-window-fixture.js";
import { RECORDED_ATTRACTION_FIVE } from "./testing/recorded-sequence-fixtures.js";
import type { RecordedSequenceRoute } from "./recorded-sequence-window.js";
import { collectInspectorDetailSource } from "./inspector-detail-source.js";
import { recordedGradeFixture } from "./testing/recorded-grade-fixture.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const consumer = () => {
  const current = moduleDeclaration("full_inspector").consumer;
  if (current === null) throw new Error("Full Inspector must have its actual current consumer");
  return current;
};

describe("D3980 Full Inspector occurrence-budget cutover requirement", () => {
  it("D3982 fits complete current multi-ply Nudge captions in both colors/horizons without changing Review/Inspector paths", () => {
    const routes: readonly RecordedSequenceRoute[] = [
      "derived.pawn.sequence.harassment_pressure@3", "derived.tactic.deflection_observed@3",
      "derived.tactic.attraction_observed@3", "derived.tactic.line_blocker_clearance_observed@3",
      "derived.tactic.square_clearance_observed@3", "derived.tactic.interference_observed@3",
      "derived.tactic.check_zwischenzug_observed@3", "derived.tactic.overload_exploitation_observed@3",
    ];
    const nudge = moduleDeclaration("postcommit_nudge");
    if (nudge.consumer === null) throw new Error("Nudge has no current consumer");
    expect(nudge.budgets).toMatchObject({ maxFacts: 2, maxWords: 50, maxMarks: 2, maxArrows: 1 });
    const cases = [...routes.map(route => ({ route, five: false })), { route: "derived.tactic.attraction_observed@3" as const, five: true }];
    const census = [];
    for (const black of [false, true]) for (const sample of cases) {
      const run = sample.five ? recordedSequenceWindowFixture(RECORDED_ATTRACTION_FIVE, black) : recordedSequenceRouteFixture(sample.route, black);
      const prepared = createRecordedSequenceWindows({ run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, route: sample.route });
      const horizon = sample.five ? 5 : sample.route.includes("harassment") ? 2 : sample.route.includes("zwischenzug") ? 4 : 3;
      const window = prepared.windows.find(window => readRecordedSequenceWindow(window, sample.route).authority.horizon === horizon);
      expect(window, `${sample.route}/${black}/${horizon}`).toBeDefined();
      const values = invokeEvidenceValueRoute(sample.route, { window: window! });
      expect(values, `${sample.route}/${black}/${horizon}`).toHaveLength(1);
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, nudge.consumer, values));
      expect(items.map(item => item.component.id)).toEqual(["square_set"]);
      expect(items.every(item => presentedItemOwner(item) === values[0])).toBe(true);
      expect(EVIDENCE_ADAPTERS.find(row => row.consumer.id === nudge.consumer!.id && row.consumer.version === 2
        && row.projection.id === values[0]!.projection.id && row.projection.version === 3)!.forms).not.toContain("arrows");
      expect(parsePresentationReceipt(serializePresentedEvidence(items))).toHaveLength(1);
      const actual = fitModulePresentation("postcommit_nudge", items);
      expect(actual.items).toEqual(items);
      expect(actual.budget.dropped).toEqual([]);
      for (const other of [moduleDeclaration("review_map").consumer!, consumer()]) {
        const complete = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, other, values));
        expect(complete.map(item => item.component.id)).toEqual(["square_set", "move_path"]);
        expect(presentedSentence(items[0]!)).toBe(presentedSentence(complete[0]!));
        expect(items[0]!.component).toEqual(complete[0]!.component);
        expect(complete[1]!.component.id === "move_path" && complete[1]!.component.operand.plies).toHaveLength(horizon);
      }
      census.push({ route: sample.route, black, horizon, captionCost: actual.budget.before, captionFits: actual.items.length === 1 });
    }
    expect(census).toHaveLength(18);
    for (const row of census) {
      expect(row.captionFits, JSON.stringify(row)).toBe(true);
      expect(row.captionCost.facts).toBe(1);
      expect(row.captionCost.words).toBeLessThanOrEqual(50);
      expect(row.captionCost.marks).toBeLessThanOrEqual(2);
      expect(row.captionCost.arrows).toBe(0);
    }
  });
  it("must not use generic payload grouping to count two genuine source occurrences as one", () => {
    const first = invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: INITIAL })[0]!;
    const second = invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: INITIAL.replace(" 0 1", " 4 3") })[0]!;
    expect(first).not.toBe(second);
    expect(first.payload).toEqual(second.payload);
    expect(evidenceValueReceipt(first).payloadDigest).toBe(evidenceValueReceipt(second).payloadDigest);
    expect(evidenceValueReceipt(first).inputDigest).not.toBe(evidenceValueReceipt(second).inputDigest);

    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [first, second]));
    expect(items).toHaveLength(2);
    expect(presentedItemOwner(items[0]!)).toBe(first);
    expect(presentedItemOwner(items[1]!)).toBe(second);
    // The generic reducer fitter intentionally counts stable facts rather than occurrences.
    expect(fitModulePresentation("full_inspector", items).budget.before.facts).toBe(1);
    const fitted = fitInspectorSourceOccurrences([[items[0]!], [items[1]!]], 0);
    expect(fitted.range).toEqual({ start: 0, count: 2, total: 2, next: null });
    expect(fitted.budget.before.facts).toBe(2);
    expect(fitted.budget.after.facts).toBe(2);
    expect(fitted.occurrences).toEqual([
      { ordinal: 0, kind: "presented", items: [items[0]] },
      { ordinal: 1, kind: "presented", items: [items[1]] },
    ]);
  });

  it("counts all registered components of one genuine source owner as one atomic occurrence", () => {
    const position = positionFromFen(INITIAL), move = normalizeMove(position, parseUci("g1f3")!);
    position.play(move);
    const evidence = invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", {
      beforeFen: INITIAL, moveUci: "g1f3", afterFen: canonicalFen(position),
    }).find(value => value.payload.color === "white" && value.payload.piece.after.square === "f3");
    expect(evidence).toBeDefined();
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [evidence!]));
    expect(items.map(item => item.component.id)).toEqual(["square_set", "move_path"]);
    expect(items.every(item => presentedItemOwner(item) === evidence)).toBe(true);
    const fitted = fitInspectorSourceOccurrences([items], 0);
    expect(fitted.occurrences).toEqual([{ ordinal: 0, kind: "presented", items }]);
    expect(fitted.budget.before.facts).toBe(1);
    expect(fitted.budget.after.facts).toBe(1);
  });

  it("keeps explicitly supplied original-ordinal multiplicity even when the same source owner recurs", () => {
    const evidence = invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: INITIAL })[0]!;
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [evidence]));
    const fitted = fitInspectorSourceOccurrences([items, items], 0);
    expect(fitted.range.count).toBe(2);
    expect(fitted.budget.after.facts).toBe(2);
    expect(fitted.occurrences.map(value => value.ordinal)).toEqual([0, 1]);
  });

  it("defers a whole genuine current composition when each component fits remaining space but their bundle does not", () => {
    const reading = invokeEvidenceValueRoute("rules.tactic.reading.ray_classification@1", { fen: INITIAL });
    const detail = collectInspectorDetailSource(reading, "derived.inspector.detail.rays@1", { kind: "whole" }, 0);
    const detailItems = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [detail]));
    const material = invokeEvidenceValueRoute("derived.material.reading.role_signature@2", { fen: INITIAL });
    const materialItems = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [material]));
    const legality = invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: INITIAL })[0]!;
    const legalityItems = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [legality]));
    const position = positionFromFen(INITIAL);
    position.play(normalizeMove(position, parseUci("g1f3")!));
    const event = invokeEvidenceValueRoute("rules.mobility.event.piece_destinations@1", {
      beforeFen: INITIAL, moveUci: "g1f3", afterFen: canonicalFen(position),
    }).find(value => value.payload.color === "white" && value.payload.piece.after.square === "h1")!;
    expect(event).toBeDefined();
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [event]));
    expect(items.map(item => item.component.id)).toEqual(["square_set", "move_path"]);
    expect(items.every(item => presentedItemOwner(item) === event)).toBe(true);
    expect(fitInspectorSourceOccurrences([detailItems], 0).budget.after).toEqual({ facts: 1, words: 306, marks: 14, arrows: 0 });
    expect(fitInspectorSourceOccurrences([materialItems], 0).budget.after).toEqual({ facts: 1, words: 29, marks: 0, arrows: 0 });
    expect(fitInspectorSourceOccurrences([legalityItems], 0).budget.after.words).toBe(10);
    expect(items.map(item => fitInspectorSourceOccurrences([[item]], 0).budget.after.words)).toEqual([20, 6]);
    expect(fitInspectorSourceOccurrences([items], 0).budget.after).toEqual({ facts: 1, words: 26, marks: 2, arrows: 1 });
    // Fixed genuine whole-bundle prefix:306+29+4*10=375 words,14 marks.
    // Each actual component fits the remaining25 words/6 marks/8 arrows, but the
    // complete26-word occurrence must defer atomically. No incomplete prefix source.
    const prefix = [detailItems, materialItems, legalityItems, legalityItems, legalityItems, legalityItems];
    expect(fitInspectorSourceOccurrences(prefix, 0).budget.after).toEqual({ facts: 6, words: 375, marks: 14, arrows: 0 });
    for (const item of items) {
      // Cost characterization only; these fragments are never source-page admission.
      expect(fitInspectorSourceOccurrences([...prefix, [item]], 0).occurrences[6]?.kind).toBe("presented");
    }
    const whole = fitInspectorSourceOccurrences([...prefix, items], 0);
    expect(whole.range).toEqual({ start: 0, count: 7, total: 7, next: null });
    expect(whole.occurrences.slice(0, 6).every(value => value.kind === "presented")).toBe(true);
    expect(whole.occurrences[6]).toEqual({ ordinal: 6, kind: "deferred", exceeded: ["words"] });
    expect(whole.occurrences[6]).not.toHaveProperty("items");
    expect(whole.budget.before).toEqual({ facts: 7, words: 401, marks: 16, arrows: 1 });
    expect(whole.budget.after).toEqual(fitInspectorSourceOccurrences(prefix, 0).budget.after);
  });

  it("advances past an entire eight-occurrence deferred page without cropping dense genuine sources", () => {
    const bundles = Array.from({ length: 9 }, () => {
      const evidence = invokeEvidenceValueRoute("rules.square.reading.control@1", { fen: INITIAL });
      return presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [evidence]));
    });
    const first = fitInspectorSourceOccurrences(bundles, 0);
    expect(first.range).toEqual({ start: 0, count: 8, total: 9, next: 8 });
    expect(first.budget.before.facts).toBe(8);
    expect(first.budget.after).toEqual({ facts: 0, words: 0, marks: 0, arrows: 0 });
    expect(first.occurrences).toHaveLength(8);
    for (const [ordinal, value] of first.occurrences.entries()) {
      expect(value.ordinal).toBe(ordinal);
      expect(value.kind).toBe("deferred");
      if (value.kind === "deferred") expect(value.exceeded).toContain("marks");
      expect(value).not.toHaveProperty("items");
    }
    const last = fitInspectorSourceOccurrences(bundles, first.range.next!);
    expect(last.range).toEqual({ start: 8, count: 1, total: 9, next: null });
    expect(last.occurrences[0]).toMatchObject({ ordinal: 8, kind: "deferred" });
  });

  it("requires each supplied bundle to contain genuine process components of one original owner", () => {
    const first = invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: INITIAL })[0]!;
    const second = invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: INITIAL })[0]!;
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [first, second]));
    expect(() => fitInspectorSourceOccurrences([[]], 0)).toThrow();
    expect(() => fitInspectorSourceOccurrences([items], 0)).toThrow();
    expect(() => fitInspectorSourceOccurrences([[{ ...items[0]! }]], 0)).toThrow();
  });

  it("admits the real empty collection but refuses invalid continuation indices", () => {
    expect(fitInspectorSourceOccurrences([], 0)).toMatchObject({ range: { start: 0, count: 0, total: 0, next: null }, occurrences: [] });
    const evidence = invokeEvidenceValueRoute("rules.castling.reading.legality@1", { fen: INITIAL })[0]!;
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), [evidence]));
    for (const start of [-1, 0.5, Number.NaN, 1, 2]) expect(() => fitInspectorSourceOccurrences([items], start)).toThrow();
  });

  it("D3981 refutes endpoint overcount: the real Nudge composition fits unchanged marks and arrow budgets", () => {
    const position = positionFromFen(INITIAL);
    position.play(normalizeMove(position, parseUci("g1f3")!));
    const evidence = invokeEvidenceValueRoute("rules.king.event.zone_state@1", {
      beforeFen: INITIAL, moveUci: "g1f3", afterFen: canonicalFen(position),
    }).find(value => value.payload.color === "white");
    expect(evidence).toBeDefined();
    const nudge = moduleDeclaration("postcommit_nudge");
    if (nudge.consumer === null) throw new Error("Nudge has no current consumer");
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, nudge.consumer, [evidence!]));
    expect(items.map(item => item.component.id)).toEqual(["square_set", "move_path"]);
    expect(items.every(item => presentedItemOwner(item) === evidence)).toBe(true);
    const fitted = fitModulePresentation("postcommit_nudge", items);
    expect(nudge.budgets.maxMarks).toBe(2);
    expect(nudge.budgets.maxArrows).toBe(1);
    expect(fitted.budget.before.marks).toBe(1);
    expect(fitted.budget.before.arrows).toBe(1);
    expect(fitted.items).toEqual(items);
    expect(fitted.budget.after).toEqual(fitted.budget.before);
    expect(fitted.budget.dropped).toEqual([]);
    // The closed mark units do not include move_path endpoints; this is not a policy waiver.
  });

  it("D3982 keeps full harassment paths outside Nudge without increasing its unchanged arrow limit", () => {
    const route = "derived.pawn.sequence.harassment_pressure@3";
    const run = recordedSequenceRouteFixture(route);
    const prepared = createRecordedSequenceWindows({
      run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, route,
    });
    expect(prepared.windows).toHaveLength(1);
    const values = invokeEvidenceValueRoute(route, { window: prepared.windows[0]! });
    expect(values).toHaveLength(1);
    expect(values[0]!.projection).toEqual({ id: "derived.pawn.sequence.harassment_pressure", version: 3 });
    const nudge = moduleDeclaration("postcommit_nudge");
    expect(nudge.consumer).toEqual({ id: "module.postcommit_nudge", version: 2 });
    if (nudge.consumer === null) throw new Error("Nudge has no current consumer");
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, nudge.consumer, values));
    expect(items.map(item => item.component.id)).toEqual(["square_set"]);
    expect(items.every(item => presentedItemOwner(item) === values[0])).toBe(true);
    const complete = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer(), values));
    const path = complete[1]!.component;
    if (path.id !== "move_path") throw new Error("Actual harassment composition omitted its path");
    expect(path.operand.plies).toHaveLength(2);
    expect(new Set(path.operand.plies.map(ply => ply.uci.slice(0, 4))).size).toBe(2);
    const fitted = fitModulePresentation("postcommit_nudge", items);
    expect(nudge.budgets.maxArrows).toBe(1);
    expect(fitted.budget.before.arrows).toBe(0);
    expect(fitted.items).toEqual(items);
    expect(fitted.budget.dropped).toEqual([]);
    const unchanged = fitModulePresentation("postcommit_nudge", complete);
    expect(unchanged.items).toEqual([]);
    expect(unchanged.budget.dropped[0]!.exceeded).toEqual(["arrows"]);
  });
  it("D4058 keeps complete selected captions atomic when cumulative words exceed the unchanged Nudge budget", () => {
    const nudge = moduleDeclaration("postcommit_nudge").consumer!;
    const captions = ["derived.pawn.sequence.harassment_pressure@3", "derived.tactic.overload_exploitation_observed@3"].flatMap(route => {
      const run = recordedSequenceRouteFixture(route as RecordedSequenceRoute);
      const window = createRecordedSequenceWindows({ run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, route: route as RecordedSequenceRoute }).windows[0]!;
      const values = invokeEvidenceValueRoute(route as RecordedSequenceRoute, { window });
      return presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, nudge, values));
    });
    expect(captions).toHaveLength(2);
    expect(captions.every(item => item.component.id === "square_set")).toBe(true);
    const fit = fitModulePresentation("postcommit_nudge", captions);
    expect(fit.budget.before.words).toBeGreaterThan(50);
    expect(fit.items).toEqual([captions[0]]);
    expect(fit.budget.dropped).toHaveLength(1);
    expect(fit.budget.dropped[0]!.exceeded).toContain("words");
    expect(presentedSentence(fit.items[0]!)).toBe(presentedSentence(captions[0]!));
  });
  it("D4064 fits the original complete grade/caption pair after the compact grade view, with unchanged limits", () => {
    const nudge = moduleDeclaration("postcommit_nudge").consumer!;
    const fixture = recordedGradeFixture({ timing: "post_commit", before: "cp 100", after: "cp 300" });
    const graded = invokeEvidenceValueRoute("derived.grade.move_quality@2", { recordedGrade: fixture.source });
    if (graded.kind !== "available") throw new Error("Original fixture has no computed grade");
    const grade = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, nudge, graded.value));
    const route = "derived.pawn.sequence.harassment_pressure@3", run = recordedSequenceRouteFixture(route);
    const window = createRecordedSequenceWindows({ run, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId, route }).windows[0]!;
    const caption = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, nudge, invokeEvidenceValueRoute(route, { window })));
    for (const bundle of [grade, caption]) {
      expect(fitModulePresentation("postcommit_nudge", bundle).items).toEqual(bundle);
      expect(bundle).toHaveLength(1);
    }
    const fit = fitModulePresentation("postcommit_nudge", [...grade, ...caption]);
    expect(fit.budget.before).toMatchObject({ facts: 2, marks: 2, arrows: 0 });
    expect(fit.budget.before.words).toBe(39);
    expect(fit.budget.dropped).toEqual([]);
    expect(fit.items).toEqual([...grade, ...caption]);
  });
});
