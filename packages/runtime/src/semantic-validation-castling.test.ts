// D4163: canonical, independently cited cases, with the original authority resolver and factory.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SEMANTIC_VALIDATION_CASTLING_SOURCES } from "./semantic-validation-castling-sources.js";
import { SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets, semanticOperandsMatch } from "./semantic-validation-runner.js";
import { compareSemanticMirror, mirrorSemanticFen, parseSemanticValidationCase, type SemanticMirrorObservation, type SemanticValidationCase } from "./semantic-validation.js";

const cases = JSON.parse(readFileSync("packages/runtime/src/semantic-validation-cases.json", "utf8")).cases.map(parseSemanticValidationCase) as SemanticValidationCase[];
const byId = new Map(cases.map(row => [row.id, row]));
const sourceRows = SEMANTIC_VALIDATION_CASTLING_SOURCES.flatMap(source => source.cases);
const registered = sourceRows.map(row => byId.get(row.proposition.case.id)!);
const absolute = registered.filter(row => row.arm === "positive");
const mirrors = registered.filter(row => row.arm === "orientation");

async function observation(value: SemanticValidationCase): Promise<SemanticMirrorObservation> {
  const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.transition_edge"].invoke(value.input as never);
  const targets = selectSemanticTargets(result, value.subject);
  expect(targets).toHaveLength(1);
  const target = targets[0]!;
  if (target.kind !== "event") throw new Error("Castling must be a genuine event");
  return { projection: target.item.projection, sign: target.item.sign, operands: observationEvidence(target).payload };
}

describe("D4163 source-bound absolute castling destinations and complete mirrors", () => {
  it.each(sourceRows)("executes $proposition.case.id with registered source authority", async row => {
    const value = byId.get(row.proposition.case.id)!;
    expect(value).toBeDefined();
    expect(value.authority.kind).toBe("cited_proposition");
    if (value.expectation.kind === "emits") expect((await observation(value)).operands).toMatchObject(value.expectation.operandMatch!);
    expect(await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, byId)).toMatchObject({
      status: "passed", targetCount: 1, invocations: value.arm === "orientation" ? 2 : 1, failure: null,
    });
  });

  it("pins four independently grounded absolute destinations and qualifies only castled1", () => {
    expect(absolute).toHaveLength(4);
    expect(absolute.map(row => row.expectation.kind === "emits" ? row.expectation.operandMatch : null)).toEqual([
      expect.objectContaining({ mover: { color: "white", role: "king" }, detail: { resultingKingSquare: "c1" } }),
      expect.objectContaining({ mover: { color: "black", role: "king" }, detail: { resultingKingSquare: "c8" } }),
      expect.objectContaining({ mover: { color: "white", role: "king" }, detail: { resultingKingSquare: "g1" } }),
      expect.objectContaining({ mover: { color: "black", role: "king" }, detail: { resultingKingSquare: "g8" } }),
    ]);
    const subject = absolute[0]!.subject;
    expect(SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.projection.id === subject.projection.id)?.orientation)
      .toMatchObject({ disposition: "present", refs: mirrors.map(row => ({ id: row.id })) });
    expect(semanticValidationVerdict(subject)).toMatchObject({ verdict: "passed", open: [] });
  });

  it.each(["queenside", "kingside"])("%s symmetric wrong destinations cannot satisfy the absolute propositions", async wing => {
    const pair = mirrors.filter(row => row.id.includes(`.${wing}.`));
    const [left, right] = pair;
    if (!left || !right || left.input.kind !== "edge" || right.input.kind !== "edge" || left.expectation.kind !== "mirrors") throw new Error("Expected complete registered castling mirror pair");
    const observations = await Promise.all(pair.map(observation));
    const context = { source: left.input, partner: right.input };
    expect(mirrorSemanticFen(left.input.afterFen, "color_and_vertical")).not.toBe(right.input.afterFen);
    expect(() => compareSemanticMirror([observations[0]!], [observations[1]!], "color_and_vertical", left.expectation.kind === "mirrors" ? left.expectation.operandRules : [], context)).not.toThrow();
    // The same wrong file on both colors preserves geometry. This control uses the actual
    // production comparison predicates, not a fabricated evidence value or alternate resolver.
    const wrong = observations.map((row, index) => ({ ...row, operands: { ...(row.operands as Record<string, unknown>),
      detail: { resultingKingSquare: `${wing === "queenside" ? "b" : "f"}${index === 0 ? "1" : "8"}` } } }));
    expect(() => compareSemanticMirror([wrong[0]!], [wrong[1]!], "color_and_vertical", left.expectation.kind === "mirrors" ? left.expectation.operandRules : [], context)).not.toThrow();
    for (const [index, value] of pair.entries()) {
      const positive = byId.get(value.id.replace(/\.orientation$/u, ".absolute"))!;
      if (positive.expectation.kind !== "emits") throw new Error("Missing absolute proposition");
      expect(semanticOperandsMatch(observations[index]!.operands, positive.expectation.operandMatch)).toBe(true);
      expect(semanticOperandsMatch(wrong[index]!.operands, positive.expectation.operandMatch)).toBe(false);
    }
    const missing = left.expectation.operandRules.filter(row => row.sourcePath.join(".") !== "detail.resultingKingSquare");
    expect(() => compareSemanticMirror([observations[0]!], [observations[1]!], "color_and_vertical", missing, context)).toThrow(/covered by 0/u);
  });

  it.each(registered)("rejects borrowed source, input and expectation before invoking $id", async value => {
    if (value.authority.kind !== "cited_proposition") throw new Error("Expected original cited authority");
    const other = registered.find(row => row.arm === value.arm && row.id !== value.id)!;
    const edits = [
      { authority: { ...value.authority, sourceRevision: "0".repeat(40) } },
      { authority: { ...value.authority, sourceId: "python-chess.castling" } },
      { authority: { ...value.authority, span: { ...value.authority.span, end: value.authority.span.end - 1 } } },
      { input: other.input }, { expectation: other.expectation },
    ];
    for (const [index, edit] of edits.entries()) expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
      .toMatchObject({ status: "failed", invocations: 0, failure: { code: value.arm === "orientation" && index >= 3
        ? "SEMANTIC_VALIDATION_ORIENTATION_SCHEMA" : "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
  });

  it.each(mirrors)("requires the actual partner before either invocation: $id", async value => {
    if (value.expectation.kind !== "mirrors") throw new Error("Expected mirror proposition");
    const missing = new Map(byId);
    missing.delete(value.expectation.partnerCase.id);
    expect(await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, missing))
      .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_ORIENTATION_INCOMPLETE" } });
  });
});
