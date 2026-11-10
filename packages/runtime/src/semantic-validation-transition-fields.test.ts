// D4166: complete source-bound capture/halfmove-reset facts, not elapsed player clocks.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SEMANTIC_VALIDATION_TRANSITION_SOURCES } from "./semantic-validation-transition-sources.js";
import { SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets, semanticOperandsMatch } from "./semantic-validation-runner.js";
import { compareSemanticMirror, parseSemanticValidationCase, type SemanticMirrorObservation, type SemanticValidationCase } from "./semantic-validation.js";

const cases = JSON.parse(readFileSync("packages/runtime/src/semantic-validation-cases.json", "utf8")).cases.map(parseSemanticValidationCase) as SemanticValidationCase[];
const byId = new Map(cases.map(row => [row.id, row]));
const sourceRows = SEMANTIC_VALIDATION_TRANSITION_SOURCES.flatMap(source => source.cases);
const registered = sourceRows.map(row => byId.get(row.proposition.case.id)!);
const mirrors = registered.filter(row => row.arm === "orientation");
const family = (value: SemanticValidationCase) => value.subject.projection.id.endsWith("clock_reset") ? "clock_reset" : "capture";
async function observations(value: SemanticValidationCase): Promise<SemanticMirrorObservation[]> {
  const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.transition_edge"].invoke(value.input as never);
  const targets = selectSemanticTargets(result, value.subject);
  expect(targets).toHaveLength(1);
  return targets.map(target => {
    if (target.kind !== "event") throw Error("Expected actual transition event");
    return { projection: target.item.projection, sign: target.item.sign, operands: observationEvidence(target).payload };
  });
}
function pair(kind: "capture" | "clock_reset") {
  const rows = mirrors.filter(row => family(row) === kind && row.id.includes(".piece."));
  if (rows.length !== 2) throw Error("Expected genuine two-color piece-capture pair");
  const [left, right] = rows as [SemanticValidationCase, SemanticValidationCase];
  if (left.input.kind !== "edge" || right.input.kind !== "edge" || left.expectation.kind !== "mirrors") throw Error("Expected original mirror cases");
  return { left, right, rules: left.expectation.operandRules, context: { source: left.input, partner: right.input } };
}
const wrongFields = [
  ...["mover.color", "mover.role", "captured.color", "captured.role", "captured.promoted", "enPassant"].map(path => ({ kind: "capture" as const, path })),
  ...["mover.color", "mover.role", "detail.pawnMove", "detail.capture"].map(path => ({ kind: "clock_reset" as const, path })),
];
const walks = SEMANTIC_VALIDATION_TRANSITION_SOURCES.flatMap(source => {
  const mirror = source.cases.find(row => row.arm === "orientation")!;
  if (mirror.proposition.expectation.kind !== "mirrors") throw Error("Expected full source walk");
  return mirror.proposition.expectation.operandRules.map(rule => ({
    kind: source.sourceId.includes("zeroing") ? "clock_reset" as const : "capture" as const, path: rule.sourcePath.join("."),
  }));
});

describe("D4166 independent capture and halfmove-reset fields", () => {
  it.each(sourceRows)("executes $proposition.case.id with original complete operands", async row => {
    const value = byId.get(row.proposition.case.id)!;
    const actual = await observations(value);
    if (value.expectation.kind === "emits") expect(actual[0]!.operands).toEqual(value.expectation.operandMatch);
    expect(await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, byId))
      .toMatchObject({ status: "passed", targetCount: 1, invocations: value.arm === "orientation" ? 2 : 1, failure: null });
  });

  it("pins complete populations and original pawn role through promotion and EP", async () => {
    expect(registered).toHaveLength(28); expect(mirrors).toHaveLength(14);
    expect(registered.filter(row => family(row) === "capture")).toHaveLength(12);
    expect(registered.filter(row => family(row) === "clock_reset")).toHaveLength(16);
    expect(walks.filter(row => row.kind === "capture")).toHaveLength(13);
    expect(walks.filter(row => row.kind === "clock_reset")).toHaveLength(11);
    for (const color of ["white", "black"]) for (const kind of ["capture", "clock_reset"] as const) {
      const promo = registered.find(row => family(row) === kind && row.id.includes(`.promotion.${color}.absolute`))!;
      expect((await observations(promo))[0]!.operands).toMatchObject({ mover: { color, role: "pawn" } });
      expect(promo.input.kind === "edge" ? promo.input.moveUci : "").toMatch(/q$/u);
      const ep = registered.find(row => family(row) === kind && row.id.includes(`.ep.${color}.absolute`))!;
      const actual = (await observations(ep))[0]!.operands as Record<string, unknown>;
      expect(Object.keys(actual)).not.toContain("captureSquare");
      if (kind === "capture") expect(actual).toMatchObject({ enPassant: true, captured: { role: "pawn" } });
      else expect(actual).toMatchObject({ detail: { pawnMove: true, capture: true } });
    }
    for (const kind of ["capture", "clock_reset"] as const)
      expect(semanticValidationVerdict({ kind: "event", projection: { id: `rules.transition.event.${kind}`, version: 1 } }))
        .toMatchObject({ verdict: "passed", open: [] });
  });

  it("EP's complete12-field shape cannot acquire invented promotion metadata", async () => {
    const rows = mirrors.filter(row => family(row) === "capture" && row.id.includes(".ep."));
    expect(rows).toHaveLength(2);
    const [left, right] = rows;
    if (!left || !right || left.input.kind !== "edge" || right.input.kind !== "edge" || left.expectation.kind !== "mirrors") throw Error("Expected actual EP mirror");
    const actual = [await observations(left), await observations(right)], rules = left.expectation.operandRules;
    expect(rules).toHaveLength(12);
    const context = { source: left.input, partner: right.input };
    for (const set of actual) expect((set[0]!.operands as { captured: object }).captured).not.toHaveProperty("promoted");
    expect(() => compareSemanticMirror(actual[0]!, actual[1]!, "color_and_vertical", rules, context)).not.toThrow();
    const invented = actual.map(set => set.map(row => { const operands = structuredClone(row.operands) as { captured: Record<string, unknown> };
      operands.captured.promoted = false; return { ...row, operands }; }));
    expect(() => compareSemanticMirror(invented[0]!, invented[1]!, "color_and_vertical", rules, context)).toThrow(/covered by 0/u);
  });

  it.each(registered.filter(row => family(row) === "clock_reset" && row.arm === "positive"))("$id resets the actual halfmove counter", async value => {
    if (value.input.kind !== "edge") throw Error("Expected original edge");
    expect(Number(value.input.beforeFen.split(" ")[4])).toBe(value.id.includes(".ep.") ? 0 : 7);
    expect(Number(value.input.afterFen.split(" ")[4])).toBe(0);
    expect(await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, byId)).toMatchObject({ status: "passed", invocations: 1 });
  });

  it.each(wrongFields)("$kind symmetric wrong $path cannot satisfy independent absolutes", async ({ kind, path }) => {
    const { left, right, rules, context } = pair(kind);
    const actual = [await observations(left), await observations(right)];
    expect(() => compareSemanticMirror(actual[0]!, actual[1]!, "color_and_vertical", rules, context)).not.toThrow();
    const wrong = actual.map(rows => rows.map(row => {
      const operands = structuredClone(row.operands) as Record<string, unknown>, parts = path.split(".");
      let parent = operands;
      for (const part of parts.slice(0, -1)) parent = parent[part] as Record<string, unknown>;
      const leaf = parts.at(-1)!, before = parent[leaf];
      parent[leaf] = typeof before === "boolean" ? !before : leaf === "color" ? before === "white" ? "black" : "white" : "bishop";
      return { ...row, operands };
    }));
    expect(() => compareSemanticMirror(wrong[0]!, wrong[1]!, "color_and_vertical", rules, context)).not.toThrow();
    for (const [index, value] of [left, right].entries()) {
      const absolute = byId.get(value.id.replace(/\.orientation$/u, ".absolute"))!;
      if (absolute.expectation.kind !== "emits") throw Error("Missing independent full absolute proposition");
      expect(semanticOperandsMatch(actual[index]![0]!.operands, absolute.expectation.operandMatch)).toBe(true);
      expect(semanticOperandsMatch(wrong[index]![0]!.operands, absolute.expectation.operandMatch)).toBe(false);
    }
  });

  it.each(walks)("$kind cannot omit $path from its complete walk", async ({ kind, path }) => {
    const { left, right, rules, context } = pair(kind), actual = [await observations(left), await observations(right)];
    const missing = rules.filter(rule => rule.sourcePath.join(".") !== path);
    expect(() => compareSemanticMirror(actual[0]!, actual[1]!, "color_and_vertical", missing, context)).toThrow(/covered by 0/u);
  });

  it.each(mirrors)("$id refuses a missing, foreign-id or stale-version partner before dispatch", async value => {
    if (value.expectation.kind !== "mirrors") throw Error("Expected original mirror");
    const id = value.expectation.partnerCase.id, partner = byId.get(id)!;
    for (const replacement of [undefined, { ...partner, id: "foreign.partner" }, { ...partner, version: 2 }]) {
      const changed = new Map(byId);
      if (replacement === undefined) changed.delete(id); else changed.set(id, replacement as SemanticValidationCase);
      expect(await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, changed)).toMatchObject({ status: "failed", invocations: 0 });
    }
  });

  it.each(["capture", "zeroing"])("%s retains both original king-to-friendly-rook negatives", async kind => {
    for (const color of ["white", "black"]) expect(await executeSemanticValidationCase(
      byId.get(`cited.python-chess.${kind}.castle-negative.${color}`)!, SEMANTIC_VALIDATION_RESOLVERS, byId))
      .toMatchObject({ status: "passed", targetCount: 0, invocations: 1 });
  });
});
