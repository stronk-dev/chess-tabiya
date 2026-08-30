import { readFileSync } from "node:fs";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { describe, expect, it } from "vitest";
import {
  COMPONENT_FORM_CAPABILITIES,
  FACT_STATEMENT_RENDERERS,
  MANIFEST_PRESENTATION_REPAIRS,
  PRESENTATION_ABSTENTION_ROWS,
  PRESENTATION_ABSENCE_REASONS,
  PRESENTATION_ADAPTER_ROWS,
  PRESENTATION_CONSUMER_CLASSES,
  PRESENTATION_QUESTIONS,
  POST_P_PRESENTATION_ADAPTER_ROWS,
  type ExactPresentationAdapterRow,
} from "../d1862-presentation-adapter-plan/plan.js";

const rfc = readFileSync("rfc/evidence-presentation.md", "utf8");
const refKey = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;
const pairKey = (consumer: string, projection: string): string => `${consumer}\0${projection}`;
const classByConsumer = new Map(PRESENTATION_CONSUMER_CLASSES.map((row) => [row.consumer, row.class] as const));
const liveVisual = PRIMARY_EVIDENCE_MANIFEST.bindings.flatMap((binding) => {
  const forms = binding.forms.filter((form) => form !== "machine_condition");
  const consumer = refKey(binding.consumer);
  return forms.length === 0 || classByConsumer.get(consumer) === "non_presentational_operation"
    ? [] : [{ key: pairKey(consumer, refKey(binding.projection)), forms }];
});
const rowByKey = new Map(PRESENTATION_ADAPTER_ROWS.map((row) => [row.key, row] as const));
const targetComponents = (row: ExactPresentationAdapterRow): readonly string[] => row.target === null
  ? [] : row.target.kind === "component" ? [row.target.component] : row.target.members.map((member) => member.component);

function renderTemplate(template: string, operands: Readonly<Record<string, string>>): string {
  return template.replace(/\{([^}]+)\}/gu, (_, key: string) => operands[key] ?? `{${key}}`);
}

describe("evidence-presentation D2135-D2140 second author repair", () => {
  it("D2135 assigns every real pair/form triple to one compatible component or composition", () => {
    expect(liveVisual).toHaveLength(112);
    expect(PRESENTATION_ADAPTER_ROWS).toHaveLength(112);
    expect(new Set(PRESENTATION_ADAPTER_ROWS.map((row) => row.key))).toEqual(new Set(liveVisual.map((row) => row.key)));
    expect(Object.groupBy(PRESENTATION_ADAPTER_ROWS, (row) => row.disposition).adapt).toHaveLength(100);
    expect(Object.groupBy(PRESENTATION_ADAPTER_ROWS, (row) => row.disposition).repair_projection_operands).toHaveLength(11);
    expect(Object.groupBy(PRESENTATION_ADAPTER_ROWS, (row) => row.disposition).remove_visual_binding).toHaveLength(1);
    for (const current of liveVisual) expect(rowByKey.get(current.key)?.forms).toEqual(current.forms);
    for (const row of PRESENTATION_ADAPTER_ROWS.filter((item) => item.disposition !== "remove_visual_binding")) {
      expect(row.target, row.key).not.toBeNull();
      expect(row.target!.forms, row.key).toEqual(row.forms);
      const members = row.target!.kind === "component"
        ? [{ component: row.target!.component, forms: row.target!.forms }]
        : row.target!.members;
      expect(new Set(members.flatMap((member) => member.forms)), row.key).toEqual(new Set(row.forms));
      for (const member of members) {
        for (const form of member.forms) expect(COMPONENT_FORM_CAPABILITIES[member.component], `${row.key}:${member.component}:${form}`).toContain(form);
      }
    }
  });

  it("D2136 classifies the exact consumer population through real reachability anchors", () => {
    const liveConsumers = new Set(PRIMARY_EVIDENCE_MANIFEST.bindings
      .filter((binding) => binding.forms.some((form) => form !== "machine_condition"))
      .map((binding) => refKey(binding.consumer)));
    expect(PRESENTATION_CONSUMER_CLASSES).toHaveLength(20);
    expect(new Set(PRESENTATION_CONSUMER_CLASSES.map((row) => row.consumer))).toEqual(liveConsumers);
    const internal = PRESENTATION_CONSUMER_CLASSES.filter((row) => row.class === "non_presentational_operation");
    expect(internal.map((row) => row.consumer).sort()).toEqual(["opponent.selection@1", "runtime.repertoire_scan@1"]);
    for (const row of PRESENTATION_CONSUMER_CLASSES) {
      expect(readFileSync(row.reachabilityAnchor, "utf8"), row.consumer).toContain(row.operation);
    }
  });

  it("D2137 publishes one predecessor for every catalogue/payload mutation", () => {
    expect(MANIFEST_PRESENTATION_REPAIRS).toHaveLength(7);
    expect(new Set(MANIFEST_PRESENTATION_REPAIRS.map((row) => row.id))).toHaveLength(7);
    expect(MANIFEST_PRESENTATION_REPAIRS.map((row) => row.id).sort()).toEqual([
      "consequence-payload", "internal-opponent", "internal-repertoire", "internal-story-rank",
      "named-structure-geometry", "pack-phase-payload", "source-bound-citation",
    ]);
    expect(rfc).toMatch(/Checkpoint P — manifest presentation repair predecessor/u);
    expect(rfc).toMatch(/exactly 112 post-P presentation pairs/u);
    expect(POST_P_PRESENTATION_ADAPTER_ROWS).toHaveLength(1);
    expect(rfc).not.toMatch(/no edit to\s+`packages\/runtime\/src\/evidence-catalog\.ts`/u);
  });

  it("D2138 makes fact-statement renderer identity and operand templates set-equal", () => {
    const factRows = PRESENTATION_ADAPTER_ROWS.filter((row) => targetComponents(row).includes("fact_statement"));
    expect(FACT_STATEMENT_RENDERERS).toHaveLength(factRows.length);
    expect(new Set(FACT_STATEMENT_RENDERERS.map((row) => row.adapterKey))).toEqual(new Set(factRows.map((row) => row.key)));
    expect(new Set(FACT_STATEMENT_RENDERERS.map((row) => row.rendererId))).toHaveLength(FACT_STATEMENT_RENDERERS.length);
    for (const renderer of FACT_STATEMENT_RENDERERS) for (const variant of renderer.variants) {
      expect(variant.operands.length, renderer.rendererId).toBeGreaterThan(0);
      const baseline = Object.fromEntries(variant.operands.map((operand) => [operand, `${operand}-a`]));
      const rendered = renderTemplate(variant.template, baseline);
      for (const operand of variant.operands) {
        expect(renderTemplate(variant.template, { ...baseline, [operand]: `${operand}-b` }), `${renderer.rendererId}:${operand}`).not.toBe(rendered);
      }
    }
  });

  it("D2139 gives every abstaining adapter an exact question and terminal-reason image", () => {
    const silent = new Set(PRESENTATION_ADAPTER_ROWS.filter((row) => row.familyId === "authored_claim" || row.familyId === "authored_claim_delivery").map((row) => row.key));
    expect(PRESENTATION_ABSTENTION_ROWS.some((row) => silent.has(row.adapterKey))).toBe(false);
    for (const row of PRESENTATION_ABSTENTION_ROWS) {
      expect(PRESENTATION_QUESTIONS[row.questionId]).toBe(row.questionLabel);
      expect(row.questionLabel).not.toMatch(/[a-z]+[._][a-z]+@\d/u);
      expect(row.sourceReasonMap.length).toBeGreaterThan(0);
      for (const reason of row.sourceReasonMap) expect(PRESENTATION_ABSENCE_REASONS[reason.learnerReason]).toBeTruthy();
      expect(row.requestPolicy).toBe("only_after_owning_workflow_requested_question");
    }
    expect(Object.keys(PRESENTATION_ABSENCE_REASONS)).not.toContain("pending");
  });

  it("D2140 retains the complete discriminated consequence payload", () => {
    const rows = PRESENTATION_ADAPTER_ROWS.filter((row) => row.familyId === "recorded_consequence");
    expect(rows).toHaveLength(3);
    for (const row of rows) expect(row.retained).toEqual(["context", "terminal", "outcome", "plies", "objectiveState"]);
    const renderers = FACT_STATEMENT_RENDERERS.filter((row) => row.rendererId.startsWith("consequence."));
    expect(renderers).toHaveLength(3);
    for (const renderer of renderers) {
      expect(renderer.variants.map((row) => row.when)).toEqual(["terminal=true", "terminal=false"]);
      expect(renderer.variants.flatMap((row) => row.operands)).toEqual(["outcome", "plies", "objectiveState"]);
    }
    expect(MANIFEST_PRESENTATION_REPAIRS.find((row) => row.id === "consequence-payload")?.after).toMatch(/outcome.*plies.*objectiveState/u);
  });
});
