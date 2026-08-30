// Disposable authoring contract for D1668/D1862. This specifies the RFC; it is not production code.
import { PRIMARY_EVIDENCE_MANIFEST } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import {
  COMPONENT_IDS,
  PRESENTATION_ADAPTER_FAMILIES,
  samePresentationDecision,
  type PresentationDecisionStamp,
} from "./plan.js";

const refKey = (value: { readonly id: string; readonly version: number }): string =>
  `${value.id}@${value.version}`;
const pairKey = (consumer: string, projection: string): string => `${consumer}\0${projection}`;
const nonMachineForms = (forms: readonly string[]): readonly string[] =>
  forms.filter((form) => form !== "machine_condition");

const livePairs = new Map(PRIMARY_EVIDENCE_MANIFEST.bindings.flatMap((binding) => {
  const forms = nonMachineForms(binding.forms);
  return forms.length === 0 ? [] : [[pairKey(refKey(binding.consumer), refKey(binding.projection)), forms] as const];
}));

const plannedRows = PRESENTATION_ADAPTER_FAMILIES.flatMap((family) => family.consumers.flatMap(
  (consumer) => family.projections.map((projection) => ({
    key: pairKey(consumer, projection),
    family,
    forms: livePairs.get(pairKey(consumer, projection)),
  })),
));

describe("D1862 exact presentation-adapter plan", () => {
  it("is set-equal to all 117 live non-machine binding pairs", () => {
    expect(livePairs.size).toBe(117);
    expect(new Set(plannedRows.map((row) => row.key)).size).toBe(plannedRows.length);
    expect(new Set(plannedRows.map((row) => row.key))).toEqual(new Set(livePairs.keys()));
    expect(plannedRows.every((row) => row.forms !== undefined && row.forms.length > 0)).toBe(true);
  });

  it("makes every served form literal and partitions repair rather than hiding it", () => {
    const dispositions = Object.groupBy(plannedRows, (row) => row.family.disposition);
    expect(dispositions.adapt).toHaveLength(106);
    expect(dispositions.repair_projection_operands).toHaveLength(10);
    expect(dispositions.remove_visual_binding).toHaveLength(1);

    for (const row of plannedRows) {
      const expectedPolicy = row.family.disposition === "remove_visual_binding"
        ? "remove_all_non_machine_forms"
        : "exact_binding_forms";
      expect(row.family.formPolicy).toBe(expectedPolicy);
      expect(row.forms).toEqual(livePairs.get(row.key));
    }
  });

  it("leaves no implementation judgement inside an adaptable family", () => {
    const adaptable = PRESENTATION_ADAPTER_FAMILIES.filter((family) => family.disposition === "adapt");
    for (const family of adaptable) {
      expect(family.parser).not.toMatch(/^none_/u);
      expect(family.retained.length, family.id).toBeGreaterThan(0);
      expect(family.components.length, family.id).toBeGreaterThan(0);
      expect(family.assertions.length, family.id).toBeGreaterThan(0);
    }
    expect(new Set(COMPONENT_IDS)).toHaveLength(14);
    expect(COMPONENT_IDS).toContain("fact_statement");
  });

  it("keeps deterministic facts sealed away from authored claims", () => {
    const factFamilies = PRESENTATION_ADAPTER_FAMILIES.filter((family) =>
      family.components.includes("fact_statement"));
    expect(factFamilies.length).toBeGreaterThan(0);
    for (const family of factFamilies) {
      expect(family.assertions, family.id).toContain("registered_renderer_only");
      expect(family.components, family.id).not.toContain("claim");
    }
  });
});

describe("D1668 shared freshness authority", () => {
  const stamp = (overrides: Partial<PresentationDecisionStamp> = {}): PresentationDecisionStamp => ({
    eventHeadSeq: 17,
    cursor: { branchId: "main", nodeId: "n-4" },
    disclosureBoundarySeq: 11,
    digest: "decision-17-main-n4-11",
    ...overrides,
  });

  it("invalidates a response when any authoritative decision field changes", () => {
    const current = stamp();
    expect(samePresentationDecision(current, stamp())).toBe(true);
    expect(samePresentationDecision(current, stamp({ eventHeadSeq: 18 }))).toBe(false);
    expect(samePresentationDecision(current, stamp({ cursor: { branchId: "fork", nodeId: "n-4" } }))).toBe(false);
    expect(samePresentationDecision(current, stamp({ cursor: { branchId: "main", nodeId: "n-5" } }))).toBe(false);
    expect(samePresentationDecision(current, stamp({ disclosureBoundarySeq: null }))).toBe(false);
    expect(samePresentationDecision(current, stamp({ digest: "different" }))).toBe(false);
  });
});
