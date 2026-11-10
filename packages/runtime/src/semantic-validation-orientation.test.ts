// D3564/D3781 accepted §4.1a. These unregistered mechanics tests do not populate the canonical
// case/profile registry or manufacture orientation authority. Real factories and runner execute.
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import * as semantic from "./semantic-evidence.js";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_OPERATIONS, canonicalSemanticEdge, observationEvidence } from "./semantic-validation-operations.js";
import { executeSemanticValidationCase, selectSemanticTargets, type SemanticValidationAuthorityResolvers } from "./semantic-validation-runner.js";
import {
  compareSemanticMirror, mirrorSemanticFen, mirrorSemanticUci, parseSemanticValidationCase,
  semanticFactConstraintSha256, type SemanticEdgeInput, type SemanticMirrorOperandRule,
  type SemanticMirrorObservation, type SemanticMirrorValueRule, type SemanticValidationCase,
} from "./semantic-validation.js";

const castleSubject = { kind: "event", projection: { id: "rules.transition.event.castled", version: 1 } } as const;
const rule = (path: string[], value: SemanticMirrorValueRule): Extract<SemanticMirrorOperandRule, { value: SemanticMirrorValueRule }> => ({ sourcePath: path, partnerPath: path, value, collection: "scalar" });
const fields = [
  ["input_before_fen", "before_fen", "beforeFen"], ["input_before_fen", "beforeFen", "beforeFen"],
  ["input_move_uci", "move_uci", "moveUci"], ["input_move_uci", "moveUci", "moveUci"],
  ["input_move_uci", "triggeringMove", "moveUci"], ["input_after_fen", "after_fen", "afterFen"],
  ["input_after_fen", "afterFen", "afterFen"],
] as const;
const inputRule = (field: typeof fields[number]): SemanticMirrorOperandRule => {
  switch (field[0]) {
    case "input_before_fen": return { value: field[0], sourcePath: [field[1]], partnerPath: [field[1]], collection: "scalar" };
    case "input_move_uci": return { value: field[0], sourcePath: [field[1]], partnerPath: [field[1]], collection: "scalar" };
    case "input_after_fen": return { value: field[0], sourcePath: [field[1]], partnerPath: [field[1]], collection: "scalar" };
  }
};
const inputRules = [fields[0], fields[2], fields[5]].map(inputRule);
const castleRules = [
  rule(["family"], "identity"), rule(["sign"], "identity"), rule(["mover", "color"], "color"),
  rule(["mover", "role"], "identity"), rule(["from"], "square"), rule(["to"], "square"),
  rule(["detail", "resultingKingSquare"], "square"), ...inputRules,
];
const edge = (beforeFen: string, moveUci: string): SemanticEdgeInput => canonicalSemanticEdge({ kind: "edge", beforeFen, moveUci, afterFen: "" });
const partnerOf = (source: SemanticEdgeInput) => edge(mirrorSemanticFen(source.beforeFen, "color_and_vertical"), mirrorSemanticUci(source.moveUci, "color_and_vertical"));
const castleFixtures = [
  ["white-kingside", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1h1"],
  ["white-queenside", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1a1"],
  ["black-kingside", "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", "e8h8"],
  ["black-queenside", "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1", "e8a8"],
] as const;
function mirrorCase(id: string, partnerId: string, input: SemanticEdgeInput, rules: readonly SemanticMirrorOperandRule[] = castleRules,
  subject: SemanticValidationCase["subject"] = castleSubject, operation = "runtime.semantic.transition_edge"): SemanticValidationCase {
  return parseSemanticValidationCase({
    id, version: 1, subject, arm: "orientation", operation: { id: operation, version: 1 }, input,
    authority: { kind: "owner_authored", id: "unregistered-test-only", version: 1 },
    expectation: { kind: "mirrors", partnerCase: { kind: "case", id: partnerId, version: 1, subject, arm: "orientation" },
      geometry: "color_and_vertical", targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: rules },
  });
}
// Test-only injected resolver exercises runner mechanics, not the protected owner store. These
// fixtures never enter a build receipt and cannot qualify a subject.
const resolvers: SemanticValidationAuthorityResolvers = {
  resolveProposition: value => ({ subject: value.subject, case: { id: value.id, version: 1 },
    expectation: value.expectation, factConstraint: [], factConstraintSha256: semanticFactConstraintSha256([]) }),
  resolveWitness: () => { throw new Error("No oracle authority is supplied by mechanics tests"); },
};
const context = () => { const source = edge(castleFixtures[0][1], castleFixtures[0][2]); return { source, partner: partnerOf(source) }; };
async function observation(input: SemanticEdgeInput, subject: SemanticValidationCase["subject"] = castleSubject,
  operation: "runtime.semantic.transition_edge" | "runtime.semantic.local_edge" = "runtime.semantic.transition_edge"): Promise<SemanticMirrorObservation> {
  const targets = selectSemanticTargets(await SEMANTIC_VALIDATION_OPERATIONS[operation].invoke(input), subject);
  expect(targets).toHaveLength(1);
  const target = targets[0]!;
  if (target.kind !== "event") throw new Error("Expected genuine factory event");
  return { projection: target.item.projection, sign: target.item.sign, operands: observationEvidence(target).payload };
}
const operands = (value: SemanticMirrorObservation) => value.operands as Record<string, unknown>;
const changed = (value: SemanticMirrorObservation, edits: Record<string, unknown>) => ({ ...value, operands: { ...operands(value), ...edits } });

describe("D3564 production retained-input orientation grammar", () => {
  it.each(castleFixtures)("real runner compares the complete %s castling pair", async (_id, fen, uci) => {
    const input = edge(fen, uci), partner = partnerOf(input);
    // A legal mirrored successor has a different fullmove counter from mirroring the after FEN.
    expect(mirrorSemanticFen(input.afterFen, "color_and_vertical")).not.toBe(partner.afterFen);
    const left = mirrorCase("test.source", "test.partner", input), right = mirrorCase("test.partner", "test.source", partner);
    const map = new Map([[left.id, left], [right.id, right]]);
    for (const value of [left, right]) {
      const result = await executeSemanticValidationCase(value, resolvers, map);
      expect(result).toMatchObject({ status: "passed", invocations: 2, targetCount: 1, failure: null });
      expect(result.inputDigest).toBe(evidenceDigest(value.input));
      expect(result.targets[0]!.payloadDigest).toBeDefined();
    }
  });

  it.each(["direct", "discovered"])("actual both-colour %s Check retains triggeringMove and promoted metadata", async kind => {
    const raw = JSON.parse(readFileSync("packages/runtime/src/semantic-validation-cases.json", "utf8")).cases;
    const value = parseSemanticValidationCase(raw.find((row: { id: string }) => row.id === `cited.python-chess.check.${kind}.white`));
    if (value.input.kind !== "edge") throw new Error("Expected complete Check edge");
    const input = value.input, partner = partnerOf(input);
    const bodyRules = [
      ...["color", "role", "promoted"].flatMap(field => [
        { ...rule(["checkingPieces", "*", "piece", field], field === "color" ? "color" : "identity"), collection: "ordered" as const },
        rule(["checkedKing", "piece", field], field === "color" ? "color" : "identity"),
      ]),
      { ...rule(["checkingPieces", "*", "square"], "square"), collection: "ordered" as const },
      rule(["checkedKing", "square"], "square"),
      ...[["attackSquares", "*"], ["rays", "*", "from"], ["rays", "*", "through", "*"], ["rays", "*", "to"]]
        .map(path => ({ ...rule(path, "square"), collection: "canonical_set" as const })),
      inputRule(fields[4]),
    ];
    const left = mirrorCase("test.source", "test.partner", input, bodyRules, value.subject, "runtime.semantic.local_edge");
    const right = mirrorCase("test.partner", "test.source", partner, bodyRules, value.subject, "runtime.semantic.local_edge");
    const map = new Map([[left.id, left], [right.id, right]]);
    for (const item of [left, right]) expect(await executeSemanticValidationCase(item, resolvers, map))
      .toMatchObject({ status: "passed", invocations: 2, failure: null });
    const source = await observation(input, value.subject, "runtime.semantic.local_edge");
    const target = await observation(partner, value.subject, "runtime.semantic.local_edge");
    const noPromoted = bodyRules.filter(row => row.sourcePath.at(-1) !== "promoted");
    expect(() => compareSemanticMirror([source], [target], "color_and_vertical", noPromoted, { source: input, partner })).toThrow(/covered by 0/u);
  });

  it.each(fields)("exact %s/%s binds each side and never strips another leaf", async (value, name, field) => {
    const ctx = context(), source = await observation(ctx.source), target = await observation(ctx.partner);
    const original = field === "beforeFen" ? "before_fen" : field === "moveUci" ? "move_uci" : "after_fen";
    const rename = (item: SemanticMirrorObservation) => {
      const { [original]: retained, ...rest } = operands(item);
      return { ...item, operands: { ...rest, [name]: retained } };
    };
    const rules = castleRules.map(row => row.value === value ? inputRule([value, name, field] as typeof fields[number]) : row);
    const left = rename(source), right = rename(target), unchanged = JSON.stringify([left, right, ctx]);
    expect(() => mirrorCase("test.source", "test.partner", ctx.source, rules)).not.toThrow();
    expect(() => compareSemanticMirror([left], [right], "color_and_vertical", rules, ctx)).not.toThrow();
    for (const side of ["source", "partner"] as const) {
      const wrong = side === "source" ? changed(left, { [name]: ctx.partner[field] }) : changed(right, { [name]: ctx.source[field] });
      expect(() => compareSemanticMirror([side === "source" ? wrong : left], [side === "partner" ? wrong : right], "color_and_vertical", rules, ctx)).toThrow(/same.side|input field/u);
    }
    expect(() => compareSemanticMirror([changed(left, { unrelated: true })], [right], "color_and_vertical", rules, ctx)).toThrow(/covered by 0/u);
    expect(JSON.stringify([left, right, ctx])).toBe(unchanged);
  });

  it("coexisting legitimate spellings retain all leaves and the original immutable values", async () => {
    const ctx = context(), a = await observation(ctx.source), b = await observation(ctx.partner);
    const source = changed(a, { beforeFen: ctx.source.beforeFen }), partner = changed(b, { beforeFen: ctx.partner.beforeFen });
    Object.freeze(source.operands); Object.freeze(partner.operands);
    const rules = [...castleRules, inputRule(fields[1])], original = JSON.stringify([source, partner, ctx]);
    expect(() => compareSemanticMirror([source], [partner], "color_and_vertical", rules, ctx)).not.toThrow();
    expect(() => compareSemanticMirror([source], [partner], "color_and_vertical", castleRules, ctx)).toThrow(/covered by 0/u);
    expect(JSON.stringify([source, partner, ctx])).toBe(original);
  });

  it.each([
    { value: "input_unknown" }, { sourcePath: ["unknown"] }, { partnerPath: ["after_fen"] },
    { sourcePath: ["nested", "before_fen"] }, { sourcePath: ["*"] }, { collection: "ordered" },
    { collection: "canonical_set" }, { ignore: true }, { sourcePath: ["move_uci"], partnerPath: ["move_uci"] },
  ])("closed case parser rejects input-rule mutation %j", edit => {
    const ctx = context(), bad = { ...inputRules[0], ...edit } as SemanticMirrorOperandRule;
    expect(() => mirrorCase("test.source", "test.partner", ctx.source, [...castleRules.slice(0, -3), bad, ...inputRules.slice(1)]))
      .toThrow(/SEMANTIC_VALIDATION_ORIENTATION_SCHEMA/u);
  });

  it("rejects duplicate paths, crossed aliases and geometric/input overlap before collection", () => {
    const ctx = context(), alias = inputRule(fields[1]);
    for (const rules of [
      [...castleRules, inputRules[0]!], [...castleRules, { ...alias, partnerPath: ["before_fen"] } as SemanticMirrorOperandRule],
      [...castleRules, rule(["before_fen"], "identity")],
    ]) expect(() => mirrorCase("test.source", "test.partner", ctx.source, rules)).toThrow(/SEMANTIC_VALIDATION_ORIENTATION_SCHEMA/u);
  });

  it("requires exact edge context for input rules and never uses it for geometric-only comparisons", async () => {
    const ctx = context(), source = await observation(ctx.source), partner = await observation(ctx.partner);
    for (const supplied of [undefined, { source: ctx.source }, { partner: ctx.partner }, { source: { kind: "recorded_path" }, partner: ctx.partner }]) {
      expect(() => compareSemanticMirror([source], [partner], "color_and_vertical", castleRules, supplied as never)).toThrow(/SEMANTIC_VALIDATION_ORIENTATION_SCHEMA/u);
    }
    // The existing four-argument geometric path remains unchanged.
    const simple = { projection: source.projection, sign: "gained", operands: { square: "a1" } };
    expect(() => compareSemanticMirror([simple], [{ ...simple, operands: { square: "a8" } }], "color_and_vertical", [rule(["square"], "square")])).not.toThrow();
  });

  it.each(["source", "partner"] as const)("independent clock-only corruption of %s operand refuses", async side => {
    const ctx = context(), source = await observation(ctx.source), partner = await observation(ctx.partner);
    const input = ctx[side], altered = changed(side === "source" ? source : partner, { after_fen: input.afterFen.replace(/ \d+$/u, " 99") });
    expect(() => compareSemanticMirror([side === "source" ? altered : source], [side === "partner" ? altered : partner], "color_and_vertical", castleRules, ctx)).toThrow(/same.side|input field/u);
  });

  it.each(["source", "partner"] as const)("runner rejects each corrupt %s fixture field before either factory invocation", async side => {
    const ctx = context();
    for (const field of ["beforeFen", "moveUci", "afterFen"] as const) {
      const bad = { ...ctx[side], [field]: field === "moveUci" ? "e1e3" : ctx[side][field].replace(/ \d+$/u, " 99") };
      const left = mirrorCase("test.source", "test.partner", side === "source" ? bad : ctx.source);
      const right = mirrorCase("test.partner", "test.source", side === "partner" ? bad : ctx.partner);
      const receipt = await executeSemanticValidationCase(left, resolvers, new Map([[left.id, left], [right.id, right]]));
      expect(receipt, field).toMatchObject({ status: "failed", invocations: 0, resultKind: "not_run" });
    }
  });

  it.each(["source", "partner"] as const)("self-consistent corrupt %s input and operand cannot bypass the real runner", async side => {
    const ctx = context(), a = await observation(ctx.source), b = await observation(ctx.partner);
    const afterFen = ctx[side].afterFen.replace(/ \d+$/u, " 99");
    const corruptContext = { ...ctx, [side]: { ...ctx[side], afterFen } };
    const altered = changed(side === "source" ? a : b, { after_fen: afterFen });
    expect(operands(altered).after_fen).toBe(corruptContext[side].afterFen);
    // Value comparison is not legal-input authority: matching corrupt input/operand alone passes.
    // The actual runner must reject this candidate before it can ever obtain such an observation.
    expect(() => compareSemanticMirror([side === "source" ? altered : a], [side === "partner" ? altered : b],
      "color_and_vertical", castleRules, corruptContext)).not.toThrow();
    const left = mirrorCase("test.source", "test.partner", corruptContext.source);
    const right = mirrorCase("test.partner", "test.source", corruptContext.partner);
    const collector = vi.spyOn(semantic, "transitionSemanticEvents");
    try {
      await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.transition_edge"].invoke(ctx.source);
      expect(collector).toHaveBeenCalledTimes(1); // Non-vacuous instrumentation of the real callable.
      collector.mockClear();
      const receipt = await executeSemanticValidationCase(left, resolvers, new Map([[left.id, left], [right.id, right]]));
      expect(receipt).toMatchObject({ status: "failed", invocations: 0, resultKind: "not_run",
        failure: { code: "SEMANTIC_VALIDATION_FIXTURE_INVALID" } });
      expect(collector).not.toHaveBeenCalled();
    } finally { collector.mockRestore(); }
  });

  it("retains total coverage and sign/destination/population/partner refusals", async () => {
    const ctx = context(), source = await observation(ctx.source), partner = await observation(ctx.partner);
    const { before_fen: _omitted, ...missing } = operands(source);
    expect(() => compareSemanticMirror([{ ...source, operands: missing }], [partner], "color_and_vertical", castleRules, ctx)).toThrow(/resolved 0/u);
    expect(() => compareSemanticMirror([source], [partner], "color_and_vertical", castleRules.slice(1), ctx)).toThrow(/covered by 0/u);
    expect(() => compareSemanticMirror([source], [{ ...partner, sign: "gained" }], "color_and_vertical", castleRules, ctx)).toThrow(/no partner/u);
    expect(() => compareSemanticMirror([changed(source, { to: "f1" })], [partner], "color_and_vertical", castleRules, ctx)).toThrow(/no partner/u);
    expect(() => compareSemanticMirror([source, source], [partner, partner], "color_and_vertical", castleRules, ctx)).toThrow(/AMBIGUOUS/u);
    expect(() => compareSemanticMirror([], [], "color_and_vertical", castleRules, ctx)).toThrow(/MIRROR_EMPTY/u);
    expect(() => compareSemanticMirror([source], [], "color_and_vertical", castleRules, ctx)).toThrow(/MISMATCH/u);
    const left = mirrorCase("test.source", "test.partner", ctx.source), right = mirrorCase("test.partner", "test.source", ctx.source);
    expect(await executeSemanticValidationCase(left, resolvers, new Map([[left.id, left], [right.id, right]])))
      .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_ORIENTATION_SCHEMA" } });
  });

  it.each([
    ["4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "e5d6"],
    ["4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7a8q"],
  ])("retains legal en-passant/promotion partner checks: %s", async (fen, uci) => {
    const source = edge(fen, uci), partner = partnerOf(source);
    // Wrong subject emits no castling target: valid geometry must still refuse a zero/zero pair.
    const left = mirrorCase("test.source", "test.partner", source), right = mirrorCase("test.partner", "test.source", partner);
    expect(await executeSemanticValidationCase(left, resolvers, new Map([[left.id, left], [right.id, right]])))
      .toMatchObject({ status: "failed", invocations: 2, failure: { code: "SEMANTIC_VALIDATION_MIRROR_EMPTY" } });
  });
});
