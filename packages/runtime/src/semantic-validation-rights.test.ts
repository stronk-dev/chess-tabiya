import { loadSemanticValidationCases } from "./semantic-validation-case-storage.js";
// D4164: independent original-source propositions through the actual local-edge operation.
import { describe, expect, it } from "vitest";
import { SEMANTIC_VALIDATION_RIGHTS_SOURCES } from "./semantic-validation-rights-sources.js";
import { SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets, semanticOperandsMatch } from "./semantic-validation-runner.js";
import { compareSemanticMirror, parseSemanticValidationCase, type SemanticMirrorObservation, type SemanticValidationCase } from "./semantic-validation.js";

const cases = loadSemanticValidationCases().cases.map(parseSemanticValidationCase) as SemanticValidationCase[];
const byId = new Map(cases.map(row => [row.id, row]));
const sourceRows = SEMANTIC_VALIDATION_RIGHTS_SOURCES.flatMap(source => source.cases);
const registered = sourceRows.map(row => byId.get(row.proposition.case.id)!);
const mirrors = registered.filter(row => row.arm === "orientation");
async function observations(value: SemanticValidationCase): Promise<SemanticMirrorObservation[]> {
  const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke(value.input as never);
  const targets = selectSemanticTargets(result, value.subject);
  expect(targets).toHaveLength(value.id.includes(".king.") ? 2 : 1);
  return targets.map(target => {
    if (target.kind !== "event") throw Error("Expected actual castling-rights events");
    return { projection: target.item.projection, sign: target.item.sign, operands: observationEvidence(target).payload };
  });
}
function pair(family: string): [SemanticValidationCase, SemanticValidationCase] {
  const rows = mirrors.filter(row => row.id.includes(`.${family}.`));
  expect(rows).toHaveLength(2);
  return [rows[0]!, rows[1]!];
}

describe("D4164 castling-rights independent complete orientation", () => {
  it.each(sourceRows)("executes $proposition.case.id through the original resolver and factory", async row => {
    const value = byId.get(row.proposition.case.id)!;
    expect(value.authority.kind).toBe("cited_proposition");
    const actual = await observations(value);
    if (value.expectation.kind === "emits") expect(actual.some(target => semanticOperandsMatch(target.operands, value.expectation.kind === "emits" ? value.expectation.operandMatch : undefined))).toBe(true);
    expect(await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, byId)).toMatchObject({ status: "passed",
      targetCount: value.id.includes(".king.") ? 2 : 1, invocations: value.arm === "orientation" ? 2 : 1, failure: null });
  });

  it("retains both original absolute wings and two king losses without broadening other profiles", async () => {
    expect(registered).toHaveLength(8); expect(mirrors).toHaveLength(6);
    for (const color of ["white", "black"] as const) {
      const queen = byId.get(`cited.python-chess.rights.rook.${color}`)!;
      const king = pair("king").find(row => row.id.includes(`.${color}.`))!;
      expect((await observations(queen)).map(row => row.operands)).toEqual([expect.objectContaining({ color, wing: "queenside", cause: "rook_moved" })]);
      expect((await observations(king)).map(row => row.operands)).toEqual([
        expect.objectContaining({ color, wing: "kingside", cause: "king_moved" }),
        expect.objectContaining({ color, wing: "queenside", cause: "king_moved" }),
      ]);
    }
    const subject = registered[0]!.subject;
    const orientation = SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.projection.id === subject.projection.id)?.orientation;
    expect(orientation).toMatchObject({ disposition: "present", refs: mirrors.map(row => ({ id: row.id })) });
    if (orientation?.disposition !== "present") throw Error("Missing current exact orientation cell");
    expect(orientation.refs.map(ref => ref.id)).toEqual(mirrors.map(row => row.id));
    expect(semanticValidationVerdict(subject)).toMatchObject({ verdict: "passed", open: [] });
    expect(semanticValidationVerdict({ kind: "event", projection: { id: "rules.transition.event.promotion", version: 1 } })).toMatchObject({ verdict: "unvalidated" });
  });

  it.each(["color", "wing", "cause"] as const)("symmetric wrong %s still fails the independent absolute propositions", async field => {
    const [left, right] = pair("rook-queenside");
    if (left.input.kind !== "edge" || right.input.kind !== "edge" || left.expectation.kind !== "mirrors") throw Error("Expected genuine mirror pair");
    const actual = [await observations(left), await observations(right)];
    const context = { source: left.input, partner: right.input };
    const rules = left.expectation.operandRules;
    expect(() => compareSemanticMirror(actual[0]!, actual[1]!, "color_and_vertical", rules, context)).not.toThrow();
    const wrong = actual.map(rows => rows.map(row => ({ ...row, operands: { ...(row.operands as Record<string, unknown>),
      [field]: field === "color" ? (String((row.operands as Record<string, unknown>).color) === "white" ? "black" : "white")
        : field === "wing" ? "kingside" : "rook_captured" } })));
    expect(() => compareSemanticMirror(wrong[0]!, wrong[1]!, "color_and_vertical", rules, context)).not.toThrow();
    for (const [index, color] of ["white", "black"].entries()) {
      const absolute = byId.get(`cited.python-chess.rights.rook.${color}`)!;
      if (absolute.expectation.kind !== "emits") throw Error("Missing original absolute proposition");
      expect(semanticOperandsMatch(actual[index]![0]!.operands, absolute.expectation.operandMatch)).toBe(true);
      expect(semanticOperandsMatch(wrong[index]![0]!.operands, absolute.expectation.operandMatch)).toBe(false);
    }
  });

  it.each(["color", "wing", "cause", "beforeFen", "moveUci", "afterFen"])("cannot omit %s from the complete operand/input walk", async field => {
    const [left, right] = pair("rook-queenside");
    if (left.input.kind !== "edge" || right.input.kind !== "edge" || left.expectation.kind !== "mirrors") throw Error("Expected genuine mirror pair");
    const actual = [await observations(left), await observations(right)];
    const missing = left.expectation.operandRules.filter(rule => rule.sourcePath.join(".") !== field);
    const context = { source: left.input, partner: right.input };
    expect(() => compareSemanticMirror(actual[0]!, actual[1]!, "color_and_vertical", missing, context)).toThrow(/covered by 0/u);
    const forged = parseSemanticValidationCase({ ...left, expectation: { ...left.expectation, operandRules: missing } });
    expect(await executeSemanticValidationCase(forged, SEMANTIC_VALIDATION_RESOLVERS, byId)).toMatchObject({ status: "failed", invocations: 0 });
  });

  it.each(mirrors)("requires the original exact-version partner before either invocation: $id", async value => {
    if (value.expectation.kind !== "mirrors") throw Error("Expected mirror proposition");
    const id = value.expectation.partnerCase.id, partner = byId.get(id)!;
    for (const replacement of [undefined, { ...partner, id: "foreign.partner" }, { ...partner, version: 2 }, { ...partner, subject: { ...partner.subject, projection: { ...partner.subject.projection, version: 2 } } }]) {
      const changed = new Map(byId);
      if (replacement === undefined) changed.delete(id); else changed.set(id, replacement as SemanticValidationCase);
      expect(await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, changed)).toMatchObject({ status: "failed", invocations: 0 });
    }
  });
});
