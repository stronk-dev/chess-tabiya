// Actual current90 source-spec/binding image and genuine compiled presentation, not API proof.
import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer } from "./evidence-contract.js";
import { INSPECTOR_LOCAL_PROJECTIONS, collectInspectorLocalPosition, collectInspectorLocalEdge, inspectorLocalScope } from "./inspector-local-source.js";
import { INSPECTOR_DEPENDENT_PROJECTIONS } from "./inspector-dependent-source.js";
import { INSPECTOR_PACKET_PROJECTIONS } from "./inspector-packet-source.js";
import { INSPECTOR_PIVOTAL_PROJECTIONS } from "./inspector-pivotal-source.js";
import { INSPECTOR_OPENING_PROJECTIONS } from "./inspector-opening-source.js";
import { RECORDED_SEQUENCE_HORIZONS } from "./recorded-sequence-window.js";
import { INSPECTOR_DETAIL_SOURCES } from "./inspector-detail.js";
import { INSPECTOR_SOURCE_TOPICS } from "./inspector-source-topics.js";
import { COMPONENT_DECLARATIONS, adapterComponentsForEvidence, assertPresentationSourceRetention,
  parseComponentValue, parsePresentationReceipt, presentEvidenceItems, serializePresentedEvidence, type ComponentValue } from "./presentation-contract.js";
import { inspectorSourceAdapterSpecs } from "./presentation-inspector-adapters.js";
import { inspectorSourcePresentationKit } from "./testing/inspector-source-presentation-kit.js";
import { inspectorFixtureEvidence, INSPECTOR_FIXTURE_FENS, inspectorFixtureEdges } from "./testing/inspector-presentation-fixture.js";
import { inspectorCurrentPresentationFixtures } from "./testing/inspector-current-presentation-fixture.js";

const specs = inspectorSourceAdapterSpecs(inspectorSourcePresentationKit);
const key = (ref: { readonly id: string; readonly version: number }) => `${ref.id}@${ref.version}`;
// Full2 retains the accepted module's forms, not every producer form (e.g. timeline markers).
const inspectorForms = PRIMARY_EVIDENCE_MANIFEST.consumers.find(row => row.id === "module.full_inspector")!.forms;

describe("actual current Full Inspector2 source adapter image", () => {
  it("covers every actual supplier exactly once plus fourteen detail views, without Full1 rebasing", () => {
    const topics = [...INSPECTOR_LOCAL_PROJECTIONS, ...INSPECTOR_DEPENDENT_PROJECTIONS,
      ...Object.keys(RECORDED_SEQUENCE_HORIZONS), ...INSPECTOR_PACKET_PROJECTIONS,
      ...INSPECTOR_PIVOTAL_PROJECTIONS, ...INSPECTOR_OPENING_PROJECTIONS,
      "recorded.engine.eval@1", "recorded.tablebase.result@1", "derived.maia.node_distribution@1",
      "derived.maia.node_candidate_wdl@1", "derived.explorer.inspector_population@1",
      "derived.compare.structure_delta@2", "derived.compare.eval_delta@2", "derived.story.rank@3", "theory.shapes.firing@3",
      "derived.review.analysis_typed_pv@1", "derived.review.analysis_recorded_pv@1", "derived.review.analysis_recorded_first@1"];
    expect(topics).toHaveLength(88);
    expect(new Set(topics).size).toBe(88);
    expect([...topics].sort()).toEqual(INSPECTOR_SOURCE_TOPICS.map(row => row.projection).sort());
    expect(specs).toHaveLength(102);
    const expected = [...topics, ...Object.keys(INSPECTOR_DETAIL_SOURCES).map(kind => `derived.inspector.detail.${kind}@1`)];
    expect(specs.map(spec => key(spec.projection)).sort()).toEqual(expected.sort());
    expect(specs.every(spec => key(spec.consumer) === "module.full_inspector@2")).toBe(true);
    expect(PRIMARY_EVIDENCE_MANIFEST.consumers.filter(row => row.id === "module.full_inspector").map(row => row.version)).toEqual([2]);
    expect(PRIMARY_EVIDENCE_MANIFEST.bindings.filter(row => row.consumer.id === "module.full_inspector").map(row => key(row.projection)).sort()).toEqual(expected.sort());
  });

  it.each(specs)("$projection.id@$projection.version uses only declared operands and exact learner forms", spec => {
    const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => key(row) === key(spec.projection));
    expect(projection, key(spec.projection)).toBeDefined();
    if (projection === undefined) throw new Error("Undeclared source");
    expect(spec.sourceOperands.filter(operand => !projection.operands.includes(operand))).toEqual([]);
    expect(new Set(spec.sourceOperands).size).toBe(spec.sourceOperands.length);
    expect([...spec.forms].sort()).toEqual(projection.forms.filter(form => inspectorForms.includes(form)).sort());
    const members = spec.composition?.members ?? [{ component: spec.component, forms: spec.forms }];
    expect([...new Set(members.flatMap(member => member.forms))].sort()).toEqual([...spec.forms].sort());
    for (const member of members) {
      expect(member.forms.every(form => new Set<string>(COMPONENT_DECLARATIONS[member.component].forms).has(form))).toBe(true);
    }
  });
});

const factoryRoutes = [...INSPECTOR_LOCAL_PROJECTIONS, ...INSPECTOR_DEPENDENT_PROJECTIONS, ...Object.keys(RECORDED_SEQUENCE_HORIZONS)];
const factoryValues = new Map(inspectorFixtureEvidence(factoryRoutes));
// The old fixture caps twelve values per route; empty whole readings can fill that cap before
// its positive FEN. Use complete actual local suppliers here, not a larger silent fixture cap.
for (const route of INSPECTOR_LOCAL_PROJECTIONS) factoryValues.set(route, inspectorLocalScope(route) === "position"
  ? [...new Set([...INSPECTOR_FIXTURE_FENS, ...inspectorFixtureEdges().flatMap(edge => [edge.beforeFen, edge.afterFen]),
    "r3k3/8/8/8/8/8/1P6/B3K3 w - - 0 1"])].flatMap(fen => collectInspectorLocalPosition(route, fen))
  : inspectorFixtureEdges().flatMap(edge => collectInspectorLocalEdge(route, edge).values));
const currentValues = await inspectorCurrentPresentationFixtures(factoryValues);

describe("every actual Full2 source/detail pair through the sole compiled presentation path", () => {
  it("has genuine fixture populations for exactly all88 source topics and fourteen details", () => {
    const expected = [...INSPECTOR_SOURCE_TOPICS.map(row => row.projection), ...Object.keys(INSPECTOR_DETAIL_SOURCES).map(kind => `derived.inspector.detail.${kind}@1`)];
    expect(currentValues.size).toBe(102);
    expect([...currentValues.keys()].sort()).toEqual(expected.sort());
  });
  it.each([...currentValues.keys()])("%s admits genuine source, seals complete components and round-trips", route => {
    const values = currentValues.get(route)!;
    expect(values.length).toBeGreaterThan(0);
    const spec = specs.find(row => key(row.projection) === route)!;
    for (const evidence of values) {
      const original = JSON.stringify(evidence.payload);
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [evidence]));
      expect(items.map(row => row.component.id)).toEqual(adapterComponentsForEvidence(spec, evidence));
      expect(items.length).toBeGreaterThan(0);
      expect(parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))))).toEqual(items);
      expect(JSON.stringify(evidence.payload)).toBe(original);
      expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 1 }, [evidence])).toThrow();
    }
  });
});

/** Test fixture selection only, not a new production absence/status/relevance authority. */
function hasFixtureWitness(route: string, payload: unknown): boolean {
  const reading = payload as Readonly<{ pieces?: readonly Readonly<{ enPrise?: boolean; loose?: boolean; underDefended?: boolean; moves?: readonly unknown[] }>[];
    rays?: readonly Readonly<{ kind: string }>[]; rooks?: readonly unknown[]; threats?: readonly unknown[];
    mates?: readonly unknown[]; pawns?: readonly unknown[]; contacts?: readonly unknown[]; candidates?: readonly unknown[];
    screens?: readonly unknown[]; duties?: readonly unknown[]; undeveloped?: Readonly<Record<string, readonly unknown[]>>;
    susceptible?: readonly Readonly<{ accessingHeavyPieces: readonly Readonly<{ square: string; fileTarget: string }>[] }>[];
    colors?: readonly Readonly<{ kind?: string; zones?: readonly Readonly<{ squares: readonly unknown[] }>[];
      islands?: readonly unknown[]; pieces?: readonly Readonly<{ legal: readonly unknown[] }>[] }>[] }>;
  switch (route) {
    case "rules.tactic.reading.loose_piece@1": return reading.pieces!.some(piece => piece.enPrise || piece.loose || piece.underDefended);
    case "rules.tactic.reading.ray_classification@1": return reading.rays!.some(ray => ["absolute_pin", "relative_pin", "skewer", "xray_attack", "xray_defense"].includes(ray.kind));
    case "rules.tactic.reading.rook_on_seventh@1": return reading.rooks!.length > 0;
    case "rules.tactic.reading.trapped_piece@1": return reading.pieces!.length > 0;
    case "rules.tactic.consequence.threat@1": return reading.threats!.length > 0;
    case "rules.tactic.consequence.mate_in_one@1": return reading.mates!.length > 0;
    case "rules.tactic.reading.promotion_pressure@1": return reading.pawns!.length > 0;
    case "rules.pawn.reading.contacts@1": return reading.contacts!.length > 0;
    case "rules.pawn.reading.candidate_majority@1": return reading.candidates!.length > 0;
    case "rules.tactic.reading.back_rank@1": return reading.susceptible!.some(king => king.accessingHeavyPieces.some(piece => piece.square !== piece.fileTarget));
    case "rules.tactic.reading.discovered_latency@1": return reading.screens!.length > 0;
    case "rules.tactic.reading.defender_duty_set@1": return reading.duties!.length > 0;
    case "rules.structural.reading.space@1": return reading.colors!.some(color => color.zones!.some(zone => zone.squares.length > 0));
    case "rules.structural.reading.pawn_connectivity@1": return reading.colors!.some(color => color.islands!.length > 0);
    case "rules.phase.development@1": return Object.values(reading.undeveloped!).some(pieces => pieces.length > 0);
    case "rules.mobility.reading.piece_destinations@1": return reading.colors!.some(color => color.kind === "available" && color.pieces!.some(piece => piece.legal.length > 0));
    case "rules.mobility.reading.legal_moves@1": return reading.pieces!.some(piece => piece.moves!.length > 0);
    default: return true;
  }
}
describe("actual local/dependent/recorded-window factories → exact current source adapters", () => {
  it.each(factoryRoutes)("%s preserves complete owned component grammar", route => {
    const spec = specs.find(row => key(row.projection) === route)!;
    const values = factoryValues.get(route) ?? [];
    expect(values.length, `No actual positive source for ${route}`).toBeGreaterThan(0);
    let complete = 0;
    for (const evidence of values) {
      const original = JSON.stringify(evidence.payload);
      const result = spec.construct(evidence);
      const components: readonly ComponentValue[] = Array.isArray(result) ? result : [result as ComponentValue];
      if (!hasFixtureWitness(route, evidence.payload)) expect(components.map(component => component.id)).toEqual(["fact_statement"]);
      expect(components.map(component => component.id)).toEqual(adapterComponentsForEvidence(spec, evidence));
      expect(components.map(component => parseComponentValue(JSON.parse(JSON.stringify(component))))).toEqual(components);
      expect(() => assertPresentationSourceRetention(evidence, components, spec.consumer)).not.toThrow();
      expect(JSON.stringify(evidence.payload)).toBe(original);
      if (hasFixtureWitness(route, evidence.payload)) complete++;
    }
    expect(complete, `No renderable complete occurrence for ${route}`).toBeGreaterThan(0);
  });
});
