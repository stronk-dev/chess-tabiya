// DISPOSABLE D3564 research: real mirror input/payload boundaries, not validation authority.
// No case is registered, no chess expectation is admitted, no production behavior is changed.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SEMANTIC_VALIDATION_OPERATIONS, canonicalSemanticEdge } from "../../packages/runtime/src/semantic-validation-operations.js";
import { assertSemanticMirrorPartnerInput, selectSemanticTargets } from "../../packages/runtime/src/semantic-validation-runner.js";
import {
  compareSemanticMirror,
  mirrorSemanticFen,
  mirrorSemanticUci,
  parseSemanticValidationCase,
  type SemanticEdgeInput,
  type SemanticMirrorOperandRule,
  type SemanticMirrorValueRule,
  type SemanticValidationCase,
} from "../../packages/runtime/src/semantic-validation.js";

const subject = { kind: "event", projection: { id: "rules.transition.event.castled", version: 1 } } as const;
const geometricalRule = (path: string[], value: SemanticMirrorValueRule): SemanticMirrorOperandRule => ({ sourcePath: path, partnerPath: path, value, collection: "scalar" });
const semanticRules = [
  geometricalRule(["family"], "identity"),
  geometricalRule(["sign"], "identity"),
  geometricalRule(["mover", "color"], "color"),
  geometricalRule(["mover", "role"], "identity"),
  geometricalRule(["from"], "square"),
  geometricalRule(["to"], "square"),
  geometricalRule(["detail", "resultingKingSquare"], "square"),
];
const inputFields = ["before_fen", "move_uci", "after_fen"] as const;
const fixtures = [
  ["white-castle", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1h1"],
  ["black-castle", "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", "e8h8"],
  ["en-passant", "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "e5d6"],
  ["promotion", "4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7a8q"],
] as const;

function edge(beforeFen: string, moveUci: string): SemanticEdgeInput {
  return canonicalSemanticEdge({ kind: "edge", beforeFen, moveUci, afterFen: "recomputed by the legal successor operation" });
}

function pair(input: SemanticEdgeInput): SemanticEdgeInput {
  return edge(mirrorSemanticFen(input.beforeFen, "color_and_vertical"), mirrorSemanticUci(input.moveUci, "color_and_vertical"));
}

function mirrorCase(id: string, partnerId: string, input: SemanticEdgeInput): SemanticValidationCase {
  return parseSemanticValidationCase({
    id, version: 1, subject, arm: "orientation",
    operation: { id: "runtime.semantic.transition_edge", version: 1 }, input,
    // A reference only, deliberately never resolved or used as authority by this experiment.
    authority: { kind: "owner_authored", id: "research-only-unresolved", version: 1 },
    expectation: {
      kind: "mirrors", partnerCase: { kind: "case", id: partnerId, version: 1, subject, arm: "orientation" },
      geometry: "color_and_vertical", targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: semanticRules,
    },
  });
}

async function observation(input: SemanticEdgeInput) {
  const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.transition_edge"].invoke(input);
  const selected = selectSemanticTargets(result, subject);
  expect(selected).toHaveLength(1);
  const target = selected[0]!;
  if (target.kind !== "event") throw new Error("expected real transition event");
  return { projection: target.item.projection, sign: target.item.sign, operands: target.item.evidence.payload as Record<string, unknown> };
}

// DISPOSABLE proposed-input-rule model. It retains every operand key and checks each raw input
// leaf against that side's complete legal edge before replacing its comparison value with the
// field's relative identity. Production needs reviewed closed rules, not this research adapter.
function proposedCompare(source: Awaited<ReturnType<typeof observation>>, partner: Awaited<ReturnType<typeof observation>>, input: SemanticEdgeInput, partnerInput: SemanticEdgeInput) {
  assertSemanticMirrorPartnerInput(mirrorCase("research.source", "research.partner", input), mirrorCase("research.partner", "research.source", partnerInput), "color_and_vertical");
  const bind = (item: typeof source, declared: SemanticEdgeInput) => {
    const operands = { ...item.operands };
    const fields = { before_fen: "beforeFen", move_uci: "moveUci", after_fen: "afterFen" } as const;
    for (const key of inputFields) {
      if (operands[key] !== declared[fields[key]]) throw new Error(`input binding mismatch: ${key}`);
      operands[key] = `input.${fields[key]}`;
    }
    return { ...item, operands };
  };
  compareSemanticMirror([bind(source, input)], [bind(partner, partnerInput)], "color_and_vertical", [...semanticRules, ...inputFields.map(field => geometricalRule([field], "identity"))]);
}

describe("D3564 actual orientation boundary — research only", () => {
  it.each(fixtures)("accepts the actual legal %s partner and recomputes fullmove counters", (_id, fen, move) => {
    const source = edge(fen, move);
    const partner = pair(source);
    const sourceCase = mirrorCase("research.source", "research.partner", source);
    const partnerCase = mirrorCase("research.partner", "research.source", partner);
    expect(() => assertSemanticMirrorPartnerInput(sourceCase, partnerCase, "color_and_vertical")).not.toThrow();
    expect(() => assertSemanticMirrorPartnerInput(partnerCase, sourceCase, "color_and_vertical")).not.toThrow();
    // FEN position/color mapping is right; copying the source clock metadata is not a legal successor.
    const mappedAfter = mirrorSemanticFen(source.afterFen, "color_and_vertical").split(" ");
    const legalAfter = partner.afterFen.split(" ");
    expect(mappedAfter.slice(0, 5)).toEqual(legalAfter.slice(0, 5));
    expect(mappedAfter[5]).not.toBe(legalAfter[5]);
  });

  it.each(fixtures.slice(0, 2))("real %s semantic operands mirror, but retained input fields cannot enter the total walk", async (_id, fen, move) => {
    const source = await observation(edge(fen, move));
    const partner = await observation(pair(edge(fen, move)));
    expect(() => compareSemanticMirror([source], [partner], "color_and_vertical", semanticRules)).toThrow(/covered by 0 rules/u);
    const identityInputs = [...semanticRules, ...inputFields.map(field => geometricalRule([field], "identity"))];
    expect(() => compareSemanticMirror([source], [partner], "color_and_vertical", identityInputs)).toThrow(/has no partner/u);
    // Contrast only: removing metadata in a research copy isolates the obstruction. This is NOT
    // a proposed product omission policy; a reviewed contract must specify what to do with it.
    const semanticOnly = (item: typeof source) => ({ ...item, operands: Object.fromEntries(Object.entries(item.operands).filter(([key]) => !inputFields.includes(key as typeof inputFields[number]))) });
    expect(() => compareSemanticMirror([semanticOnly(source)], [semanticOnly(partner)], "color_and_vertical", semanticRules)).not.toThrow();
    for (const field of inputFields) {
      for (const value of ["identity", "square", "color", "signed_file_delta", "signed_rank_delta"] as const) {
        const one = (item: typeof source) => ({ ...item, operands: { input: item.operands[field] } });
        expect(() => compareSemanticMirror([one(source)], [one(partner)], "color_and_vertical", [geometricalRule(["input"], value)]), `${field}/${value}`).toThrow();
      }
    }
  });

  it("measures the retained-input obstruction on migrated positive edge fixtures without registering new authority", async () => {
    const document = JSON.parse(readFileSync("packages/runtime/src/semantic-validation-cases.json", "utf8")) as { cases: unknown[] };
    const positives = document.cases.map(parseSemanticValidationCase).filter(value => value.arm === "positive" && value.input.kind === "edge");
    const projections = new Set<string>();
    for (const value of positives) {
      if (value.input.kind !== "edge") throw new Error("expected an edge fixture");
      const id = value.operation.id;
      if (id !== "runtime.semantic.local_edge" && id !== "runtime.semantic.structural_edge" && id !== "runtime.semantic.transition_edge" && id !== "runtime.semantic.breadth_edge" && id !== "runtime.semantic.duty_edge") throw new Error(`unhandled edge operation ${id}`);
      const result = await SEMANTIC_VALIDATION_OPERATIONS[id].invoke(value.input);
      for (const target of selectSemanticTargets(result, value.subject)) {
        const payload = target.kind === "event" ? target.item.evidence.payload : target.item.payload;
        if (payload !== null && typeof payload === "object" && inputFields.every(field => field in payload)) projections.add(value.subject.projection.id);
      }
    }
    expect(positives.length).toBeGreaterThan(0);
    expect(projections.has(subject.projection.id)).toBe(true);
    console.log(JSON.stringify({ researchOnly: true, positiveEdgeCases: positives.length, projectionsWithRetainedInputFields: [...projections].sort() }));
  });

  it.each(fixtures.slice(0, 2))("proposed exact input-binding rules retain every operand in the real %s pair", async (_id, fen, move) => {
    const input = edge(fen, move);
    const partnerInput = pair(input);
    const source = await observation(input), partner = await observation(partnerInput);
    expect(() => proposedCompare(source, partner, input, partnerInput)).not.toThrow();
    for (const field of inputFields) {
      expect(source.operands[field]).toBe(input[{ before_fen: "beforeFen", move_uci: "moveUci", after_fen: "afterFen" }[field] as keyof SemanticEdgeInput]);
    }
  });

  it("the proposal refuses corrupt metadata, clock-only corruption, extra/missing operands, wrong semantic targets and crossed input", async () => {
    const input = edge(fixtures[0][1], fixtures[0][2]), partnerInput = pair(input);
    const source = await observation(input), partner = await observation(partnerInput);
    const changed = (item: typeof source, edits: Record<string, unknown>) => ({ ...item, operands: { ...item.operands, ...edits } });
    for (const field of inputFields) {
      expect(() => proposedCompare(changed(source, { [field]: "corrupt" }), partner, input, partnerInput)).toThrow(/input binding/u);
      expect(() => proposedCompare(source, changed(partner, { [field]: "corrupt" }), input, partnerInput)).toThrow(/input binding/u);
    }
    const wrongClock = partnerInput.afterFen.replace(/ \d+$/u, " 99");
    expect(() => proposedCompare(source, changed(partner, { after_fen: wrongClock }), input, partnerInput)).toThrow(/input binding/u);
    const { before_fen: _removed, ...missing } = source.operands;
    expect(() => proposedCompare({ ...source, operands: missing }, partner, input, partnerInput)).toThrow(/input binding/u);
    expect(() => proposedCompare(changed(source, { unrelated_fen: input.beforeFen }), partner, input, partnerInput)).toThrow(/covered by 0 rules/u);
    expect(() => proposedCompare(changed(source, { to: "f1" }), partner, input, partnerInput)).toThrow(/has no partner/u);
    expect(() => proposedCompare(source, { ...partner, sign: "gained" }, input, partnerInput)).toThrow(/has no partner/u);
    expect(() => proposedCompare(source, partner, input, input)).toThrow(/not the color_and_vertical transform/u);
  });
});
