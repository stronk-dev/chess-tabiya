// Accepted D3984 whole occurrences: genuine factories, prospective Full2 constructors only.
import { describe, expect, it } from "vitest";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import { inspectorSourceAdapterSpecs } from "./presentation-inspector-adapters.js";
import { inspectorSourcePresentationKit as kit } from "./testing/inspector-source-presentation-kit.js";
import { adapterComponentsForEvidence, assertPresentationSourceRetention, parseComponentValue, type ComponentValue } from "./presentation-contract.js";

const FULL2 = { id: "module.full_inspector", version: 2 } as const;
const BARE = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
const SOURCES = ["rules.tactic.reading.loose_piece@1", "rules.tactic.reading.ray_classification@1", "rules.tactic.reading.rook_on_seventh@1",
  "rules.tactic.reading.trapped_piece@1", "rules.tactic.reading.back_rank@1", "rules.tactic.reading.discovered_latency@1",
  "rules.tactic.consequence.threat@1", "rules.tactic.consequence.mate_in_one@1", "rules.structural.reading.space@1",
  "rules.structural.reading.pawn_connectivity@1", "rules.phase.development@1", "rules.tactic.reading.promotion_pressure@1",
  "rules.mobility.reading.legal_moves@1", "rules.mobility.reading.piece_destinations@1", "rules.pawn.reading.contacts@1",
  "rules.pawn.reading.candidate_majority@1", "rules.tactic.reading.defender_duty_set@1"] as const;
function source(route: typeof SOURCES[number], fen = BARE): DeclaredEvidence<unknown> {
  return invokeEvidenceValueRoute(route, { fen }) as DeclaredEvidence<unknown>;
}
function build(evidence: DeclaredEvidence<unknown>) {
  const entry = inspectorSourceAdapterSpecs(kit).find(spec => spec.projection.id === evidence.projection.id && spec.projection.version === evidence.projection.version)!;
  const result = entry.construct(evidence), components: readonly ComponentValue[] = Array.isArray(result) ? result : [result as ComponentValue];
  expect(components.map(component => component.id)).toEqual(adapterComponentsForEvidence(entry, evidence));
  expect(components.map(component => parseComponentValue(JSON.parse(JSON.stringify(component))))).toEqual(components);
  expect(() => assertPresentationSourceRetention(evidence, components, FULL2)).not.toThrow();
  return components;
}
describe("D3984 original whole readings with no drawable geometry", () => {
  it.each(SOURCES)("%s is still a source-owned text occurrence, not no_witness", route => {
    const evidence = source(route, route === "rules.mobility.reading.legal_moves@1" ? "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1" : BARE);
    const before = JSON.stringify(evidence.payload), receipt = evidenceValueReceipt(evidence);
    const result = build(evidence);
    expect(result.map(component => component.id)).toEqual(["fact_statement"]);
    expect(result[0]!.id === "fact_statement" && result[0]!.operand.renderedText.length).toBeGreaterThan(0);
    expect(JSON.stringify(evidence.payload)).toBe(before); expect(evidenceValueReceipt(evidence)).toBe(receipt);
  });
});
