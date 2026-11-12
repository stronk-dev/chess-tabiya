import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { normalizeMove } from "chessops/chess";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { evidenceForConsumer, evidenceValueReceipt } from "./evidence-contract.js";
import { collectFoundationEdgeEvents, type FoundationEdgeSourceRef } from "./foundation-edge-source.js";
import { FOUNDATION_EDGE_FACT_RENDERERS, FOUNDATION_EDGE_STATEMENTS, assertFoundationEdgePayloadRef } from "./foundation-edge-presentation.js";
import { PRIMARY_EVIDENCE_MANIFEST, SEMANTIC_EVENT_PROJECTION_REFS } from "./evidence-catalog.js";
import { presentEvidenceItems } from "./presentation-contract.js";
import { fitInspectorSourceOccurrences, modulePresentationBundleCost } from "./module-query.js";
import { SEMANTIC_VALIDATION_PROFILES } from "./semantic-validation-registry.js";
import { semanticValidationPopulationOperation } from "./semantic-validation-operations.js";
import { LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS } from "./candidate-population.js";
import { inspectorFixtureEdges } from "./testing/inspector-presentation-fixture.js";
import * as routes from "./internal/evidence-value-routes.js";
import { collectInspectorLocalEdge } from "./inspector-local-source.js";
import { SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS } from "./semantic-validation.js";
import { assertSemanticEvidenceEvent } from "./semantic-evidence.js";
import { readSemanticValidationPopulation } from "../../../tools/semantic-validation-population.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT } from "./semantic-validation-authorities.js";

const collectSourceValues = (projection: FoundationEdgeSourceRef, edge: { beforeFen: string; moveUci: string; afterFen: string }) => collectFoundationEdgeEvents(edge, [projection]).map(event => event.evidence);

const edge = (fen: string, moveUci: string) => {
  const before = positionFromFen(fen), beforeFen = canonicalFen(before), move = normalizeMove(before, parseUci(moveUci)!);
  expect(before.isLegal(move)).toBe(true); const san = makeSan(before, move); before.play(move);
  return { anchor: { beforeFen, moveUci, afterFen: canonicalFen(before) }, san };
};
afterEach(() => vi.restoreAllMocks());
const seeds: readonly [FoundationEdgeSourceRef, string, string][] = [
  ["rules.structural.event.king_opposition@2", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7"],
  ["rules.structural.event.king_opposition@2", "4k3/8/4K3/8/8/8/8/R7 w - - 0 1", "a1a2"],
  ["rules.structural.event.backward_pawn@2", "7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
  ["rules.structural.event.backward_pawn@2", "7k/8/8/3p4/8/4P3/4P3/7K b - - 0 1", "d5d4"],
  ["derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/8/PP1P4/7K w - - 0 1", "a2a3"],
  ["rules.transition.event.slider_ray@2", "4k3/8/8/8/8/8/B7/R3K3 w - - 0 1", "a2b3"],
  ["derived.activity.event.file_state@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
  ["derived.activity.event.file_access_revealed@1", "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"],
  ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
];

describe("selected-edge current source composition", () => {
  it.each(seeds)("%s retains original whole factory objects and complete readout", (route, fen, uci) => {
    const f = edge(fen, uci), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const values = collectSourceValues(route, f.anchor);
    expect(values.length).toBeGreaterThan(0);
    const target = dispatch.mock.calls.flatMap((call, index) => call[0] === route ? [dispatch.mock.results[index]!.value] : []);
    const originals = target.flatMap(result => Array.isArray(result) ? result : result.kind === "available" ? result.value : []);
    expect(values.length).toBe(originals.length);
    values.forEach((value, index) => {
      expect(value).toBe(originals[index]);
      expect(`${value.projection.id}@${value.projection.version}`).toBe(route);
      expect(value.payload).toMatchObject(f.anchor);
      const [renderer] = FOUNDATION_EDGE_STATEMENTS[route], definition = FOUNDATION_EDGE_FACT_RENDERERS[renderer];
      // The exact renderer parses/retains all original fields before fixed deterministic text.
      const operands = { san: f.san, ...value.payload as object };
      const parsed = definition.parse(operands, "actual source");
      expect(parsed).toEqual(operands);
      expect(() => assertFoundationEdgePayloadRef(parsed, `sha256:${evidenceValueReceipt(value).payloadDigest}`)).not.toThrow();
      const wrong = structuredClone(operands) as Record<string, unknown>; wrong.moveUci = "a1a8";
      expect(() => definition.parse(wrong, "crossed edge")).toThrow();
      expect(() => definition.parse({ ...operands, extra: true }, "unknown field")).toThrow();
    });
  });

  it("never invokes old events or a candidate compiler and shares original file changes for every reveal", () => {
    const f = edge("7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const values = collectSourceValues("derived.activity.event.file_access_revealed@1", f.anchor);
    const fileCalls = calls.mock.calls.flatMap((call, i) => call[0] === "derived.activity.event.file_state@1" ? [calls.mock.results[i]!.value] : []);
    expect(fileCalls).toHaveLength(1);
    const original = fileCalls[0].value;
    const reveals = calls.mock.calls.filter(call => call[0] === "derived.activity.event.file_access_revealed@1");
    expect(reveals).toHaveLength(original.length);
    reveals.forEach((call, i) => expect((call[1] as { change: unknown }).change).toBe(original[i]));
    expect(values).toHaveLength(1);
    expect(calls.mock.calls.map(call => call[0])).toEqual([
      "rules.structural.reading.pawn_connectivity@1", "derived.activity.reading.file_state@1",
      "rules.structural.reading.pawn_connectivity@1", "derived.activity.reading.file_state@1",
      "derived.activity.event.file_state@1", ...original.map(() => "derived.activity.event.file_access_revealed@1"),
    ]);
  });

  it.each(Object.keys(FOUNDATION_EDGE_STATEMENTS) as FoundationEdgeSourceRef[])("%s empty output still acquires original complete inputs", route => {
    const f = edge("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1d1"), calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const values = collectSourceValues(route, f.anchor);
    expect(values).toEqual([]);
    expect(calls).toHaveBeenCalled();
    expect(() => collectSourceValues(route, { ...f.anchor, afterFen: f.anchor.beforeFen })).toThrow();
  });

  it("source unavailability throws instead of becoming an empty negative", () => {
    const f = edge("4k2r/8/8/8/8/8/8/R3K3 b - - 0 1", "h8h7");
    const original = routes.invokeEvidenceValueRoute;
    vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => route === "rules.structural.reading.backward_pawn@3" ? { kind: "unavailable", reason: "input_abstained" } : original(route as never, input)) as typeof original);
    expect(() => collectSourceValues("rules.structural.event.backward_pawn@2", f.anchor)).toThrow(/unavailable/);
  });
});


describe("current source completion and bounded rendering", () => {
  it.each([
    ["8/8/8/8/8/4k3/8/3K4 w - - 0 1", "d1e1", "White"],
    ["3k4/8/4K3/8/8/8/8/8 b - - 0 1", "d8e8", "Black"],
  ])("shows the turn even when the before opposition relation is absent", (fen, move, turn) => {
    const f = edge(fen!, move!), value = collectSourceValues("rules.structural.event.king_opposition@2", f.anchor)[0]!;
    const def = FOUNDATION_EDGE_FACT_RENDERERS["inspector.opposition_change@1"];
    const operands = def.parse({ san: f.san, ...value.payload as object }, "genuine nullable relation");
    expect(operands.before.opposition).toBeNull();
    expect(def.render(operands)).toContain(`${turn} to move; no unobstructed opposition`);
  });

  it("retains exact validation witnesses and research wrappers without candidate acquisition for all seven", () => {
    for (const ref of Object.keys(FOUNDATION_EDGE_STATEMENTS)) {
      const [id, version] = ref.split("@"), subject = { kind: "event" as const, projection: { id: id!, version: Number(version) } };
      const profile = SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.kind === "event" && row.subject.projection.id === id && row.subject.projection.version === Number(version))!;
      for (const arm of ["positive", "semanticNegative", "orientation"] as const) expect(profile[arm].disposition).toBe(["rules.structural.event.king_opposition@2", "rules.structural.event.backward_pawn@2", "derived.structural.event.pawn_file_group@1", "derived.activity.event.file_state@1", "derived.activity.event.file_access_revealed@1", "rules.structural.event.pawn_islands@2", "rules.transition.event.slider_ray@2"].includes(ref) ? "present" : "required");
      expect(profile.importedPopulation.disposition).toBe("present");
      expect(semanticValidationPopulationOperation(subject)).toBe("runtime.semantic.foundation_edge");
      expect(SEMANTIC_EVENT_PROJECTION_REFS.some(row => row.id === id && row.version === Number(version))).toBe(true);
      expect(LOCAL_CANDIDATE_EVENT_PROJECTION_KEYS).toContain(ref);
      expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(row => row.projection.id === id && row.projection.version === Number(version)).map(row => `${row.consumer.id}@${row.consumer.version}`).sort()).toEqual(["module.full_inspector@2", "module.postcommit_nudge@2", "module.review_map@2", "profile.subject_observations@1", "research.semantic_selection@3", "research.semantic_validation@1"]);
    }
  });

  it("measures complete genuine dense/readout populations within conservative source-domain bounds", () => {
    // Forty-eight pawn squares, not an assumed eight-pawns-per-color cap. Real legal capture.
    const dense = edge("7k/pppppppp/pppppppp/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP/K7 w - - 0 1", "e5d6");
    const allEdges = [...inspectorFixtureEdges(), ...seeds.map(([, fen, move]) => edge(fen, move).anchor), dense.anchor];
    const observed: Record<string, { values: number; maxWords: number }> = {};
    for (const ref of Object.keys(FOUNDATION_EDGE_STATEMENTS) as FoundationEdgeSourceRef[]) {
      let count = 0, maxWords = 0;
      for (const current of allEdges) for (const value of collectSourceValues(ref, current)) {
        const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [value]));
        const cost = modulePresentationBundleCost(items);
        expect(cost.facts).toBe(1); expect(cost.words).toBeLessThan(250);
        expect(cost.marks).toBe(0); expect(cost.arrows).toBe(0);
        maxWords = Math.max(maxWords, cost.words); count++;
      }
      expect(count).toBeGreaterThan(0); observed[ref] = { values: count, maxWords };
    }
    console.info("D4167 genuine source readout words", JSON.stringify(observed));
  });

  it("defers a real same-source cumulative page whole, retaining every original ordinal", () => {
    const f = edge("6q1/5Pp1/4p1pk/3p2p1/2p3p1/1p4p1/p5p1/K7 w - - 0 1", "f7g8q");
    const originals = collectSourceValues("rules.transition.event.slider_ray@2", f.anchor);
    const bundles = originals.map(value => presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [value])));
    expect(bundles.length).toBeGreaterThan(8);
    const fitted = fitInspectorSourceOccurrences(bundles, 0);
    expect(fitted.budget.before.words).toBeGreaterThan(400); expect(fitted.budget.after.words).toBeLessThanOrEqual(400);
    expect(fitted.occurrences.some(row => row.kind === "deferred")).toBe(true);
    expect(fitted.occurrences.map(row => row.ordinal)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(fitted.range.next).toBe(8);
    const tail = fitInspectorSourceOccurrences(bundles, 8);
    expect([...fitted.occurrences, ...tail.occurrences].map(row => row.ordinal)).toEqual(originals.map((_, index) => index));
    for (const row of [...fitted.occurrences, ...tail.occurrences]) if (row.kind === "presented") {
      expect(row.items).toEqual(bundles[row.ordinal]);
      expect(row.items[0]!.evidenceRef!.evidenceDigest).toBe(`sha256:${evidenceValueReceipt(originals[row.ordinal]!).payloadDigest}`);
    }
  });
});


describe("shared current-source production execution", () => {
  const keys = SEMANTIC_INSPECTOR_EVENT_VALIDATION_ROOTS.map(ref => `${ref.id}@${ref.version}` as FoundationEdgeSourceRef);
  const image = (events: ReturnType<typeof collectFoundationEdgeEvents>) => events.map(({ id, projection, anchor, sign, operands, basis }) => ({ id, projection, anchor, sign, operands, basis }));
  it.each([
    ["7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"],
    ["1r5k/1p6/2N5/8/8/8/8/7K b - - 0 1", "b7c6"],
  ])("shares each original prerequisite and file change: %s %s", (fen, move) => {
    const input = edge(fen!, move!).anchor, calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const events = collectFoundationEdgeEvents(input, [...keys].reverse());
    expect(events.length).toBeGreaterThan(0);
    expect(Object.isFrozen(events)).toBe(true);
    events.forEach(event => expect(() => assertSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, event)).not.toThrow());
    expect(calls).toHaveBeenCalledTimes(20);
    for (const route of ["rules.mobility.reading.legal_moves@1", "rules.structural.reading.pawn_connectivity@1"]) expect(calls.mock.calls.filter(([key]) => key === route)).toHaveLength(2);
    expect(calls.mock.calls.filter(([key]) => key === "derived.activity.event.file_state@1")).toHaveLength(1);
    for (const [sourceRoute, dependentRoutes] of [
      ["rules.mobility.reading.legal_moves@1", ["rules.structural.reading.king_opposition@3", "rules.structural.reading.backward_pawn@3"]],
      ["rules.structural.reading.pawn_connectivity@1", ["derived.structural.reading.pawn_file_group@1", "derived.activity.reading.file_state@1"]],
    ] as const) {
      const originals = calls.mock.calls.flatMap(([route], index) => route === sourceRoute ? [calls.mock.results[index]!.value] : []);
      for (const dependent of dependentRoutes) {
        const inputs = calls.mock.calls.flatMap(([route, input]) => route === dependent ? [input as { position?: unknown; source?: unknown }] : []);
        expect(inputs).toHaveLength(2);
        inputs.forEach((input, index) => expect(sourceRoute === "rules.mobility.reading.legal_moves@1" ? input.position : input.source).toBe(originals[index]));
      }
    }
    const fileEvents = events.filter(event => event.projection.id === "derived.activity.event.file_state");
    const reveals = events.filter(event => event.projection.id === "derived.activity.event.file_access_revealed");
    expect(fileEvents.length).toBeGreaterThan(0); expect(reveals.length).toBeGreaterThan(0);
    for (const reveal of reveals) expect(fileEvents.some(event => event.evidence === reveal.derivationInputs[0])).toBe(true);
    const forward = collectFoundationEdgeEvents(input, keys);
    expect(image(events)).toEqual(image(forward));
    // This equality is semantic across calls; original identity is tested above within each call.
    expect(image(events)).toEqual(image(keys.flatMap(key => collectFoundationEdgeEvents(input, [key]))));
  });

  it("rejects invalid/empty/unknown/duplicate demand and invalid edges before source work", () => {
    const input = edge("4k3/8/8/8/8/8/8/4K3 w - - 0 1", "e1d1").anchor;
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute");
    for (const subset of [[], [keys[0]!, keys[0]!], ["unknown@1"] as unknown as FoundationEdgeSourceRef[]]) expect(() => collectFoundationEdgeEvents(input, subset)).toThrow();
    expect(() => collectFoundationEdgeEvents({ ...input, afterFen: input.beforeFen }, keys)).toThrow();
    expect(calls).not.toHaveBeenCalled();
    expect(collectFoundationEdgeEvents(input, ["rules.structural.event.backward_pawn@2"])).toEqual([]);
    expect(calls.mock.calls.map(([route]) => route)).toEqual(["rules.mobility.reading.legal_moves@1", "rules.structural.reading.backward_pawn@3", "rules.mobility.reading.legal_moves@1", "rules.structural.reading.backward_pawn@3", "rules.structural.event.backward_pawn@2"]);
  });

  describe("complete579-edge Inspector singleton/batch populations and multiplicity", () => {
    // Each public collector input keeps the ordinary five-second deadline. The complete fixed
    // correctness cohort is not a single request's latency budget; never sample or omit inputs.
    const edges = readSemanticValidationPopulation(SEMANTIC_VALIDATION_REPOSITORY_ROOT).sampledEdges
      .map(({ edge: { beforeFen, moveUci, afterFen } }, ordinal) => ({ ordinal, input: { beforeFen, moveUci, afterFen } }));
    const completed = new Set<number>(), positives = new Map(keys.map(key => [key, 0]));

    it("registers all579 original inputs without duplicate cohort addresses", () => {
      expect(edges).toHaveLength(579);
      expect(new Set(edges.map(row => row.ordinal)).size).toBe(579);
    });

    it.each(edges)("edge $ordinal preserves every singleton/batch value and multiplicity", ({ ordinal, input }) => {
      const singleton = keys.flatMap(key => {
        const result = collectInspectorLocalEdge(key, input);
        expect(result.semanticEvents).not.toBeNull();
        expect(Object.isFrozen(result)).toBe(true);
        expect(result.values).toHaveLength(result.semanticEvents!.length);
        result.semanticEvents!.forEach((event, index) => expect(result.values[index]).toBe(event.evidence));
        positives.set(key, positives.get(key)! + result.values.length);
        return result.semanticEvents!;
      });
      expect(image(collectFoundationEdgeEvents(input, keys))).toEqual(image(singleton));
      expect(completed.has(ordinal)).toBe(false);
      completed.add(ordinal);
    });

    afterAll(() => {
      expect([...completed].sort((left, right) => left - right)).toEqual(edges.map(row => row.ordinal));
      expect(completed.size).toBe(579);
      // A corpus zero is retained; separate genuine fixtures, not this census, prove each family.
      expect([...positives.values()].some(count => count > 0)).toBe(true);
      console.info("D4167 complete579-edge source occurrence counts", Object.fromEntries(positives));
    });
  });
});
