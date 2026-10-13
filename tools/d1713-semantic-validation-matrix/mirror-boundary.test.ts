// DISPOSABLE D3564 research: real mirror input/payload boundaries, not validation authority.
// No case is registered, no chess expectation is admitted, no production behavior is changed.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseFen } from "chessops/fen";

import { SEMANTIC_VALIDATION_OPERATIONS, canonicalSemanticEdge } from "../../packages/runtime/src/semantic-validation-operations.js";
import { observationEvidence } from "../../packages/runtime/src/semantic-validation-operations.js";
import { assertSemanticMirrorPartnerInput, assertSemanticValidationFixture, selectSemanticTargets } from "../../packages/runtime/src/semantic-validation-runner.js";
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

// D3781 DISPOSABLE inventory. Classify retained strings only; do not manufacture mirror rules,
// strip fields, infer the authority of a nested frame or write a canonical validation case.
function retainedInputLeaves(value: unknown, path: readonly string[] = []): { path: readonly string[]; format: "fen" | "uci"; value: string }[] {
  if (typeof value === "string") {
    if (/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(value)) return [{ path, format: "uci", value }];
    if (value.includes("/") && parseFen(value).isOk) return [{ path, format: "fen", value }];
    return [];
  }
  if (Array.isArray(value)) return value.flatMap(item => retainedInputLeaves(item, [...path, "*"]));
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, item]) => retainedInputLeaves(item, [...path, key]));
}

function retainedInputScope(leaf: ReturnType<typeof retainedInputLeaves>[number], input: SemanticValidationCase["input"]) {
  if (input.kind !== "edge") return { scope: "non_edge_input", matches: [] as string[] };
  const matches = (["beforeFen", "moveUci", "afterFen"] as const).filter(field => input[field] === leaf.value);
  if (matches.length === 0) return { scope: "other_frame", matches };
  if (leaf.path.length !== 1) return { scope: "nested_same_edge", matches };
  const originalFields = { before_fen: "beforeFen", move_uci: "moveUci", after_fen: "afterFen" } as const;
  const field = Object.entries(originalFields).find(([operand]) => operand === leaf.path[0]);
  if (field !== undefined && matches.includes(field[1])) return { scope: "initial_draft_root_binding", matches };
  return { scope: "root_alias", matches };
}

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
const proposedFields = {
  input_before_fen: { operands: ["before_fen", "beforeFen"], input: "beforeFen" },
  input_move_uci: { operands: ["move_uci", "moveUci", "triggeringMove"], input: "moveUci" },
  input_after_fen: { operands: ["after_fen", "afterFen"], input: "afterFen" },
} as const;
type ProposedInputRule = {
  readonly value: keyof typeof proposedFields;
  readonly sourcePath: readonly string[];
  readonly partnerPath: readonly string[];
  readonly collection: "scalar";
};
const proposedInputRules: readonly ProposedInputRule[] = Object.entries(proposedFields).map(([value, field]) => ({
  value: value as ProposedInputRule["value"], sourcePath: [field.operands[0]], partnerPath: [field.operands[0]], collection: "scalar",
}));

// DISPOSABLE parser for the draft amendment only; production still rejects these value rules.
function parseProposedInputRules(raw: unknown): readonly ProposedInputRule[] {
  if (!Array.isArray(raw)) throw new Error("input rule list required");
  const seen = new Set<string>();
  return raw.map((entry: unknown) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) throw new Error("input rule record required");
    const row = entry as Record<string, unknown>;
    if (Object.keys(row).sort().join() !== "collection,partnerPath,sourcePath,value") throw new Error("input rule keys differ");
    if (typeof row.value !== "string" || !Object.hasOwn(proposedFields, row.value)) throw new Error("unknown input rule");
    const value = row.value as ProposedInputRule["value"];
    const field = proposedFields[value];
    if (row.collection !== "scalar" || !Array.isArray(row.sourcePath) || !Array.isArray(row.partnerPath) || row.sourcePath.length !== 1 || row.partnerPath.length !== 1 || row.sourcePath[0] !== row.partnerPath[0] || !(field.operands as readonly unknown[]).includes(row.sourcePath[0])) throw new Error("input rule must bind its exact registered top-level scalar");
    const operand = row.sourcePath[0] as string;
    if (seen.has(operand)) throw new Error("duplicate input rule");
    seen.add(operand);
    return { value, sourcePath: [operand], partnerPath: [operand], collection: "scalar" };
  });
}
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

function mirrorCase(id: string, partnerId: string, input: SemanticEdgeInput, caseSubject: SemanticValidationCase["subject"] = subject, operation: "runtime.semantic.transition_edge" | "runtime.semantic.local_edge" = "runtime.semantic.transition_edge", bodyRules: readonly SemanticMirrorOperandRule[] = semanticRules): SemanticValidationCase {
  return parseSemanticValidationCase({
    id, version: 1, subject: caseSubject, arm: "orientation",
    operation: { id: operation, version: 1 }, input,
    // A reference only, deliberately never resolved or used as authority by this experiment.
    authority: { kind: "owner_authored", id: "research-only-unresolved", version: 1 },
    expectation: {
      kind: "mirrors", partnerCase: { kind: "case", id: partnerId, version: 1, subject: caseSubject, arm: "orientation" },
      geometry: "color_and_vertical", targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: bodyRules,
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
function proposedCompare(source: Awaited<ReturnType<typeof observation>>, partner: Awaited<ReturnType<typeof observation>>, input: SemanticEdgeInput, partnerInput: SemanticEdgeInput, rawRules: unknown = proposedInputRules, bodyRules: readonly SemanticMirrorOperandRule[] = semanticRules, operation: "runtime.semantic.transition_edge" | "runtime.semantic.local_edge" = "runtime.semantic.transition_edge") {
  if (input?.kind !== "edge" || partnerInput?.kind !== "edge") throw new Error("exact edge input context required");
  const rules = parseProposedInputRules(rawRules);
  const caseSubject = { kind: "event", projection: source.projection } as const;
  const sourceCase = mirrorCase("research.source", "research.partner", input, caseSubject, operation, bodyRules), partnerCase = mirrorCase("research.partner", "research.source", partnerInput, caseSubject, operation, bodyRules);
  assertSemanticValidationFixture(sourceCase);
  assertSemanticValidationFixture(partnerCase);
  assertSemanticMirrorPartnerInput(sourceCase, partnerCase, "color_and_vertical");
  const bind = (item: typeof source, declared: SemanticEdgeInput) => {
    const operands = { ...item.operands };
    for (const rule of rules) {
      const field = proposedFields[rule.value];
      const operand = rule.sourcePath[0]!;
      if (typeof operands[operand] !== "string" || operands[operand] !== declared[field.input]) throw new Error(`input binding mismatch: ${operand}`);
      operands[operand] = `input.${field.input}`;
    }
    return { ...item, operands };
  };
  compareSemanticMirror([bind(source, input)], [bind(partner, partnerInput)], "color_and_vertical", [...bodyRules, ...rules.map(rule => geometricalRule([...rule.sourcePath], "identity"))]);
}

describe("D3781 retained-input coverage — research only", () => {
  it.each(["direct", "discovered"])("the real %s Check pair retains its triggering move and every geometric leaf", async kind => {
    const value = parseSemanticValidationCase(JSON.parse(readFileSync("packages/runtime/src/semantic-validation-cases.json", "utf8")).cases
      .find((row: { id: string }) => row.id === `cited.python-chess.check.${kind}.white`));
    if (value.input.kind !== "edge") throw new Error("Check input must be an edge");
    const input = value.input, partnerInput = pair(input);
    const acquire = async (request: SemanticEdgeInput) => {
      const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke(request);
      const targets = selectSemanticTargets(result, value.subject);
      expect(targets).toHaveLength(1);
      const target = targets[0]!;
      if (target.kind !== "event") throw new Error("Check must be an event");
      return { projection: target.item.projection, sign: target.item.sign, operands: target.item.evidence.payload as Record<string, unknown> };
    };
    const bodyRules = [
      ...["color", "role", "promoted"].flatMap(field => [
        { ...geometricalRule(["checkingPieces", "*", "piece", field], field === "color" ? "color" : "identity"), collection: "ordered" as const },
        geometricalRule(["checkedKing", "piece", field], field === "color" ? "color" : "identity"),
      ]),
      { ...geometricalRule(["checkingPieces", "*", "square"], "square"), collection: "ordered" as const },
      geometricalRule(["checkedKing", "square"], "square"),
      ...[["attackSquares", "*"], ["rays", "*", "from"], ["rays", "*", "through", "*"], ["rays", "*", "to"]]
        .map(path => ({ ...geometricalRule(path, "square"), collection: "canonical_set" as const })),
    ];
    const inputRules = [{ value: "input_move_uci", sourcePath: ["triggeringMove"], partnerPath: ["triggeringMove"], collection: "scalar" }];
    const source = await acquire(input), partner = await acquire(partnerInput);
    const unchanged = JSON.stringify([source, partner]);
    expect(() => proposedCompare(source, partner, input, partnerInput, inputRules, bodyRules, "runtime.semantic.local_edge")).not.toThrow();
    expect(() => proposedCompare(source, { ...partner, operands: { ...partner.operands, triggeringMove: "a1a2" } }, input, partnerInput, inputRules, bodyRules, "runtime.semantic.local_edge")).toThrow(/input binding/u);
    expect(JSON.stringify([source, partner])).toBe(unchanged);
  });

  it.each(["beforeFen", "moveUci", "triggeringMove", "afterFen"])("the root-input model binds the known %s spelling without hiding another leaf", async operand => {
    const input = edge(fixtures[0][1], fixtures[0][2]), partnerInput = pair(input);
    const source = await observation(input), partner = await observation(partnerInput);
    const originalRule = proposedInputRules.find(rule => proposedFields[rule.value].operands.includes(operand as never))!;
    const originalName = originalRule.sourcePath[0]!;
    const rename = (item: typeof source) => {
      const { [originalName]: value, ...rest } = item.operands;
      return { ...item, operands: { ...rest, [operand]: value } };
    };
    const rules = proposedInputRules.map(rule => rule === originalRule ? { ...rule, sourcePath: [operand], partnerPath: [operand] } : rule);
    const left = rename(source), right = rename(partner);
    const before = JSON.stringify([left, right]);
    expect(() => proposedCompare(left, right, input, partnerInput, rules)).not.toThrow();
    expect(() => proposedCompare(left, { ...right, operands: { ...right.operands, [operand]: "corrupt" } }, input, partnerInput, rules)).toThrow(/input binding/u);
    expect(() => proposedCompare({ ...left, operands: { ...left.operands, unrelated: true } }, right, input, partnerInput, rules)).toThrow(/covered by 0 rules/u);
    expect(JSON.stringify([left, right])).toBe(before);
  });

  it("both legitimate root spellings may coexist but duplicate paths and crossed spellings refuse", async () => {
    const input = edge(fixtures[0][1], fixtures[0][2]), partnerInput = pair(input);
    const source = await observation(input), partner = await observation(partnerInput);
    const alias = { ...proposedInputRules[0]!, sourcePath: ["beforeFen"], partnerPath: ["beforeFen"] };
    const rules = [...proposedInputRules, alias];
    expect(() => proposedCompare({ ...source, operands: { ...source.operands, beforeFen: input.beforeFen } },
      { ...partner, operands: { ...partner.operands, beforeFen: partnerInput.beforeFen } }, input, partnerInput, rules)).not.toThrow();
    expect(() => parseProposedInputRules([...rules, alias])).toThrow(/duplicate/u);
    expect(() => parseProposedInputRules([{ ...alias, partnerPath: ["before_fen"] }])).toThrow();
    expect(() => parseProposedInputRules([{ ...alias, sourcePath: ["capture", "beforeFen"], partnerPath: ["capture", "beforeFen"] }])).toThrow();
  });

  it("distinguishes exact draft roots, aliases, nested frames and non-edge inputs without deleting leaves", () => {
    const input = edge(fixtures[0][1], fixtures[0][2]);
    const payload = { before_fen: input.beforeFen, triggeringMove: input.moveUci,
      nested: [{ beforeFen: input.beforeFen }], role: "rook", san: "O-O", caption: "ordinary prose" };
    const leaves = retainedInputLeaves(payload);
    expect(leaves.map(leaf => leaf.path)).toEqual([["before_fen"], ["triggeringMove"], ["nested", "*", "beforeFen"]]);
    expect(leaves.map(leaf => retainedInputScope(leaf, input).scope)).toEqual(["initial_draft_root_binding", "root_alias", "nested_same_edge"]);
    expect(retainedInputScope({ path: ["move_uci"], format: "uci", value: "a2a3" }, input).scope).toBe("other_frame");
    const nonEdge = parseSemanticValidationCase(JSON.parse(readFileSync("packages/runtime/src/semantic-validation-cases.json", "utf8")).cases.find((row: { input: { kind: string } }) => row.input.kind !== "edge")).input;
    expect(retainedInputScope(leaves[0]!, nonEdge).scope).toBe("non_edge_input");
    expect(Object.keys(payload)).toEqual(["before_fen", "triggeringMove", "nested", "role", "san", "caption"]);
    expect(() => parseProposedInputRules([{ ...proposedInputRules[1]!, sourcePath: ["triggeringMove"], partnerPath: ["triggeringMove"] }])).not.toThrow();
  });

  it("inventories every registered case's actual target payload and keeps absent targets explicit", async () => {
    const values = (JSON.parse(readFileSync("packages/runtime/src/semantic-validation-cases.json", "utf8")) as { cases: unknown[] }).cases.map(parseSemanticValidationCase);
    const counts = { cases: values.length, edge: 0, recorded_path: 0, bounded_target_source: 0,
      completed: 0, unavailable: 0, absentTargets: 0, targets: 0, retainedLeaves: 0 };
    const subjects = new Set<string>(), emittingSubjects = new Set<string>();
    const grouped = new Map<string, { projection: string; input: string; path: readonly string[]; format: string;
      scope: string; matches: readonly string[]; cases: Set<string>; observations: number }>();
    for (const value of values) {
      counts[value.input.kind] += 1;
      const projection = `${value.subject.projection.id}@${value.subject.projection.version}`;
      subjects.add(projection);
      const operation = SEMANTIC_VALIDATION_OPERATIONS[value.operation.id] as { invoke(input: unknown): unknown };
      const result = await operation.invoke(value.input) as Awaited<ReturnType<typeof SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.structural_edge"]["invoke"]>>;
      counts[result.kind] += 1;
      const targets = selectSemanticTargets(result, value.subject);
      if (targets.length === 0) counts.absentTargets += 1;
      else emittingSubjects.add(projection);
      counts.targets += targets.length;
      for (const target of targets) for (const leaf of retainedInputLeaves(observationEvidence(target).payload)) {
        const scope = retainedInputScope(leaf, value.input);
        const key = JSON.stringify([projection, value.input.kind, leaf.path, leaf.format, scope]);
        const row = grouped.get(key) ?? { projection, input: value.input.kind, path: leaf.path, format: leaf.format,
          ...scope, cases: new Set<string>(), observations: 0 };
        row.cases.add(value.id); row.observations += 1; grouped.set(key, row);
        counts.retainedLeaves += 1;
      }
    }
    expect(counts.completed + counts.unavailable).toBe(values.length);
    expect(counts.edge + counts.recorded_path + counts.bounded_target_source).toBe(values.length);
    const rows = [...grouped.values()].map(row => ({ ...row, cases: row.cases.size }))
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    expect(rows.some(row => row.path.join(".") === "triggeringMove" && row.scope === "root_alias")).toBe(true);
    expect(rows.some(row => row.path.join(".") === "beforeFen" && row.scope === "root_alias")).toBe(true);
    expect(rows.some(row => row.scope === "non_edge_input")).toBe(true);
    const report = JSON.stringify({ counts, subjects: subjects.size, emittingSubjects: emittingSubjects.size, rows }, null, 2);
    expect(Buffer.byteLength(report)).toBeLessThan(128 * 1024);
    mkdirSync(".cache", { recursive: true });
    writeFileSync(".cache/d3781-retained-inputs.json", `${report}\n`);
    console.log(`D3781_RETAINED_INPUTS ${JSON.stringify({ counts, subjects: subjects.size, emittingSubjects: emittingSubjects.size, rows: rows.length, bytes: Buffer.byteLength(report) })}`);
  }, 30_000);
});

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

  it("a self-consistent source operand and input cannot hide an illegal successor", async () => {
    const input = edge(fixtures[0][1], fixtures[0][2]), partnerInput = pair(input);
    const source = await observation(input), partner = await observation(partnerInput);
    const afterFen = input.afterFen.replace(/ \d+$/u, " 99");
    expect(() => proposedCompare({ ...source, operands: { ...source.operands, after_fen: afterFen } }, partner, { ...input, afterFen }, partnerInput)).toThrow(/exact successor/u);
  });

  it("the draft rule grammar refuses unregistered aliases, wildcards, collections, duplicate paths and unknown fields", () => {
    const base = proposedInputRules[0]!;
    for (const changed of [
      { ...base, value: "input_anything" },
      { ...base, sourcePath: ["anything"] },
      { ...base, partnerPath: ["after_fen"] },
      { ...base, sourcePath: ["nested", "before_fen"] },
      { ...base, sourcePath: ["*"] },
      { ...base, collection: "ordered" },
      { ...base, collection: "canonical_set" },
      { ...base, ignore: true },
      { sourcePath: base.sourcePath, partnerPath: base.partnerPath, value: base.value },
    ]) expect(() => parseProposedInputRules([changed])).toThrow();
    expect(() => parseProposedInputRules([base, base])).toThrow(/duplicate/u);
    expect(() => parseProposedInputRules(null)).toThrow();
    expect(parseProposedInputRules(proposedInputRules)).toEqual(proposedInputRules);
  });

  it("the draft retains total coverage and requires both exact case inputs without mutating payloads", async () => {
    const input = edge(fixtures[0][1], fixtures[0][2]), partnerInput = pair(input);
    const source = await observation(input), partner = await observation(partnerInput);
    const original = JSON.stringify({ source, partner, input, partnerInput });
    Object.freeze(source.operands);
    Object.freeze(partner.operands);
    expect(() => proposedCompare(source, partner, undefined as never, partnerInput)).toThrow(/input context/u);
    expect(() => proposedCompare(source, partner, input, undefined as never)).toThrow(/input context/u);
    expect(() => proposedCompare(source, partner, input, partnerInput, proposedInputRules.slice(1))).toThrow(/covered by 0 rules/u);
    expect(() => proposedCompare(source, partner, input, partnerInput)).not.toThrow();
    expect(JSON.stringify({ source, partner, input, partnerInput })).toBe(original);
  });
});
