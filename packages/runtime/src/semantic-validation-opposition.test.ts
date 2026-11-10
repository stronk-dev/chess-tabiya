import { PAWN_OUTCOME_LITERAL_SOURCES } from "./semantic-validation-pawn-outcome-sources.js";
import { COUNT_POPULATION_LITERAL_SOURCE } from "./semantic-validation-count-population-sources.js";
import { restoreSubjectSafeHistoricalCases, SUBJECT_SAFE_RETIRED_CASES, SUBJECT_SAFE_REANCHORED_CASES } from "./testing/subject-safe-retired-semantic-cases.js";
// Concrete independently reviewed source controls. Canonical/profile integration is separate.
import { SLIDER_LITERAL_SOURCE } from "./semantic-validation-slider-sources.js";
import { BACKWARD_LITERAL_SOURCE } from "./semantic-validation-backward-sources.js";
import { PAWN_FILE_LITERAL_SOURCES } from "./semantic-validation-pawn-file-sources.js";
import { readFileSync } from "node:fs";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { OPPOSITION_LITERAL_EXAMPLES, OPPOSITION_LITERAL_SOURCE, oppositionLiteralOperands } from "./semantic-validation-opposition-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, canonicalSemanticEdge } from "./semantic-validation-operations.js";
import { compareSemanticMirror, parseSemanticValidationCase, semanticFactConstraintSha256 } from "./semantic-validation.js";

const faults = vi.hoisted(() => ({ kind: "none" as "none" | "holder" | "form" | "interior" | "kings" | "sign" | "duplicate" | "split" | "omit" }));
vi.mock("./foundation-position-sources.js", async importOriginal => {
  const original = await importOriginal<typeof import("./foundation-position-sources.js")>();
  return { ...original,
    readUnobstructedOpposition: (...args: Parameters<typeof original.readUnobstructedOpposition>) => {
      const value = original.readUnobstructedOpposition(...args), opposition = value.opposition;
      if (faults.kind === "kings") return { ...value, kings: { white: value.kings.black, black: value.kings.white } };
      if (opposition === null) return value;
      if (faults.kind === "holder") return { ...value, opposition: { ...opposition, color: opposition.color === "white" ? "black" as const : "white" as const } };
      if (faults.kind === "form") return { ...value, opposition: { ...opposition, form: opposition.form === "direct" ? "distant_three" as const : "direct" as const } };
      if (faults.kind === "interior") return { ...value, opposition: { ...opposition, betweenSquares: [...opposition.betweenSquares].reverse() } };
      return value;
    },
    oppositionChanges: (...args: Parameters<typeof original.oppositionChanges>) => {
      const values = original.oppositionChanges(...args);
      if (faults.kind === "omit") return [];
      if (faults.kind === "duplicate") return [...values, ...values];
      if (faults.kind === "split") return values.flatMap(value => [{ ...value, sign: "gained" as const }, { ...value, sign: "lost" as const }]);
      if (faults.kind === "sign") return values.map(value => ({ ...value, sign: value.sign === "gained" ? "lost" as const : "gained" as const }));
      return values;
    },
  };
});
afterEach(() => { faults.kind = "none"; });

const actualCases = OPPOSITION_LITERAL_SOURCE.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm,
  operation: OPPOSITION_LITERAL_SOURCE.operation, input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: OPPOSITION_LITERAL_SOURCE.sourceId, sourceRevision: OPPOSITION_LITERAL_SOURCE.sourceRevision,
    licence: OPPOSITION_LITERAL_SOURCE.licence, span: { start: 0, end: OPPOSITION_LITERAL_SOURCE.text.length, textSha256: sha256Text(OPPOSITION_LITERAL_SOURCE.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
}));
const actualCaseMap = new Map(actualCases.map(row => [row.id, row]));
const subject = OPPOSITION_LITERAL_SOURCE.cases[0]!.proposition.subject;
const cases = new Map(OPPOSITION_LITERAL_SOURCE.cases.map(row => [row.proposition.case.id, row]));
const target = async (input: typeof OPPOSITION_LITERAL_SOURCE.cases[number]["input"]) => {
  const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.foundation_edge"].invoke(input);
  if (result.kind !== "completed") throw Error("A complete actual source operation is required");
  return result.observations.filter(row => row.item.projection.id === subject.projection.id && row.item.projection.version === subject.projection.version).map(row => {
    if (row.kind !== "event") throw Error("An original compiled event is required");
    return { projection: row.item.projection, sign: row.item.sign, operands: row.item.operands };
  });
};
function literalBoard(fen: string): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  fen.split(" ")[0]!.split("/").forEach((rank, index) => {
    let file = 0;
    for (const token of rank) {
      if (/^[1-8]$/u.test(token)) file += Number(token);
      else { result.set(`${"abcdefgh"[file]}${8 - index}`, token); file++; }
    }
    expect(file).toBe(8);
  });
  return result;
}

describe("current opposition independently literal source propositions", () => {
  it("keeps every source endpoint/counter legal and literal king/interior facts correct", () => {
    expect(OPPOSITION_LITERAL_EXAMPLES).toHaveLength(24);
    for (const row of OPPOSITION_LITERAL_EXAMPLES) {
      expect(canonicalSemanticEdge({ kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen })).toEqual({ kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen });
      for (const [fen, kings, relation] of [[row.beforeFen, row.beforeKings, row.before], [row.afterFen, row.afterKings, row.after]] as const) {
        const board = literalBoard(fen); expect(board.get(kings[0])).toBe("K"); expect(board.get(kings[1])).toBe("k");
        expect([...board.values()].filter(value => value === "K")).toHaveLength(1);
        expect([...board.values()].filter(value => value === "k")).toHaveLength(1);
        if (relation === null) {
          const df = Math.abs(kings[1].charCodeAt(0) - kings[0].charCodeAt(0)), dr = Math.abs(Number(kings[1][1]) - Number(kings[0][1]));
          if (row.id.startsWith("blocked")) {
            expect(df).toBe(0); expect(dr).toBe(2);
            expect(board.has(`${kings[0][0]}${(Number(kings[0][1]) + Number(kings[1][1])) / 2}`)).toBe(true);
          } else if (row.id.startsWith("wrong-gap")) expect(Math.max(df, dr)).toBe(3);
          else expect(df !== 0 && dr !== 0).toBe(true);
          continue;
        }
        expect(relation[1]).toHaveLength(({ direct: 1, distant_three: 3, distant_five: 5 })[relation[0]]);
        for (const square of relation[1]) expect(board.has(square)).toBe(false);
        const file = (square: string) => "abcdefgh".indexOf(square[0]!);
        const rank = (square: string) => Number(square[1]);
        const df = Math.sign(file(kings[1]) - file(kings[0])), dr = Math.sign(rank(kings[1]) - rank(kings[0]));
        expect(df === 0 || dr === 0).toBe(true);
        const between = relation[1].map((_, index) => `${"abcdefgh"[file(kings[0]) + df * (index + 1)]}${rank(kings[0]) + dr * (index + 1)}`);
        expect(relation[1]).toEqual(between);
        expect(Math.max(Math.abs(file(kings[1]) - file(kings[0])), Math.abs(rank(kings[1]) - rank(kings[0])))).toBe(relation[1].length + 1);
      }
    }
  });

  it.each(OPPOSITION_LITERAL_SOURCE.cases.filter(row => row.arm !== "orientation"))("$proposition.case.id matches the complete independently declared population", async row => {
    const actual = await target(row.input), expectation = row.proposition.expectation;
    if (expectation.kind === "omits") expect(actual).toEqual([]);
    else {
      if (expectation.kind !== "emits_exact") throw Error("Complete independent population required");
      expect(actual.map(({ sign, operands }) => ({ sign, operands }))).toEqual(expectation.events);
      expect(actual).toHaveLength(1);
    }
  });

  it.each(OPPOSITION_LITERAL_SOURCE.cases.filter(row => row.arm === "orientation"))("$proposition.case.id walks the complete original ordered payload", async row => {
    const expectation = row.proposition.expectation;
    if (expectation.kind !== "mirrors") throw Error("A literal mirror proposition is required");
    const partner = cases.get(expectation.partnerCase.id)!; expect(partner).toBeDefined();
    const absolute = OPPOSITION_LITERAL_SOURCE.cases.find(value => value.arm === "positive" && JSON.stringify(value.input) === JSON.stringify(row.input));
    const partnerAbsolute = OPPOSITION_LITERAL_SOURCE.cases.find(value => value.arm === "positive" && JSON.stringify(value.input) === JSON.stringify(partner.input));
    expect(absolute?.proposition.expectation.kind).toBe("emits_exact"); expect(partnerAbsolute?.proposition.expectation.kind).toBe("emits_exact");
    const awaited = { left: await target(row.input), right: await target(partner.input) };
    expect(() => compareSemanticMirror(awaited.left, awaited.right, expectation.geometry, expectation.operandRules, { source: row.input, partner: partner.input })).not.toThrow();
  });

  it("discloses board facts separately from the product convention and has no unreachable equal-present input", () => {
    expect(OPPOSITION_LITERAL_SOURCE.text).toContain("symbol.isupper()");
    expect(OPPOSITION_LITERAL_SOURCE.text).toContain('if turn_part == "w":');
    expect(OPPOSITION_LITERAL_SOURCE.text).toContain("elif piece_type == KING:");
    expect(OPPOSITION_LITERAL_SOURCE.cases).toHaveLength(46);
    expect(OPPOSITION_LITERAL_EXAMPLES.filter(row => row.sign === null)).toHaveLength(6);
    for (const row of OPPOSITION_LITERAL_EXAMPLES.filter(row => row.before !== null && row.after !== null)) {
      const expected = oppositionLiteralOperands(row) as { before: { opposition: { color: string } }; after: { opposition: { color: string } } };
      expect(expected.before.opposition.color).not.toBe(expected.after.opposition.color);
      expect(row.sign).toBe("membership_changed");
    }
  });
});


describe("real fixed authority and operation falsifiers before qualification", () => {
  it.each(actualCases)("$id resolves its exact proposition and production result", async row => {
    const result = await executeSemanticValidationCase(row, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status, JSON.stringify(result.failure)).toBe("passed");
    expect(result.invocations).toBe(row.arm === "orientation" ? 2 : 1);
  });
  it.each(["holder", "form", "interior", "kings", "sign"] as const)("independent absolute operands reject symmetric wrong %s even when mirrors agree", async kind => {
    faults.kind = kind;
    const absolute = actualCases.find(row => row.arm === "positive" && row.id.includes("three.south.absolute"))!;
    const mirror = actualCases.find(row => row.arm === "orientation" && row.id.includes("three.south.color_and_vertical"))!;
    const exact = await executeSemanticValidationCase(absolute, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(exact.status).toBe("failed"); expect(exact.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    const symmetry = await executeSemanticValidationCase(mirror, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(symmetry.status, JSON.stringify(symmetry.failure)).toBe("passed");
  });
  it.each(["duplicate", "split", "omit"] as const)("refuses the complete actual %s population", async kind => {
    faults.kind = kind;
    const absolute = actualCases.find(row => row.arm === "positive" && row.id.includes("direct.south.absolute"))!;
    const result = await executeSemanticValidationCase(absolute, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status).toBe("failed");
    expect(result.targetCount).toBe(kind === "omit" ? 0 : 2);
    expect(result.failure?.code).toBe(kind === "omit" ? "SEMANTIC_VALIDATION_POSITIVE_EMPTY" : "SEMANTIC_VALIDATION_EXPECTATION_UNMET");
  });
  it("binds full exact expected arrays to the retained source rather than just an id", async () => {
    const absolute = actualCases.find(row => row.arm === "positive")!;
    if (absolute.expectation.kind !== "emits_exact") throw Error("An exact population is required");
    for (const events of [[...absolute.expectation.events, ...absolute.expectation.events], absolute.expectation.events.map(value => ({ ...value, operands: { ...value.operands, extra: true } }))]) {
      const changed = parseSemanticValidationCase({ ...absolute, expectation: { kind: "emits_exact", events } });
      const result = await executeSemanticValidationCase(changed, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
      expect(result.status).toBe("failed"); expect(result.invocations).toBe(0); expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
    }
  });
});


it("joins all46 concrete cases to the canonical register and only qualifies the current exact source", () => {
  const canonical = (JSON.parse(readFileSync(new URL("./semantic-validation-cases.json", import.meta.url), "utf8")) as { cases: unknown[] }).cases.map(parseSemanticValidationCase);
  expect(canonical).toHaveLength(824 + COUNT_POPULATION_LITERAL_SOURCE.cases.length + PAWN_OUTCOME_LITERAL_SOURCES.reduce((n, source) => n + source.cases.length, 0));
  expect(SUBJECT_SAFE_RETIRED_CASES).toHaveLength(51);
  const historical = restoreSubjectSafeHistoricalCases(canonical as unknown as Record<string, unknown>[]);
  // This frozen image deliberately excludes every new subject_outcomes case.
  expect(historical).toHaveLength(875);
  expect(historical.some(row => (row.operation as { id?: string }).id === "runtime.semantic.subject_outcomes")).toBe(false);
  const liveIds = new Set(canonical.map(row => row.id));
  expect(SUBJECT_SAFE_RETIRED_CASES.every(row => !liveIds.has(row.id as string))).toBe(true);
  expect(historical.filter(row => SUBJECT_SAFE_RETIRED_CASES.some(retired => retired.id === row.id))).toEqual(SUBJECT_SAFE_RETIRED_CASES);
  for (const original of SUBJECT_SAFE_REANCHORED_CASES) expect(historical.find(row => row.id === original.id)).toEqual(original);
  expect(canonical.filter(row => actualCaseMap.has(row.id))).toEqual(actualCases);
  const laterIds = new Set([...PAWN_FILE_LITERAL_SOURCES, BACKWARD_LITERAL_SOURCE, SLIDER_LITERAL_SOURCE, COUNT_POPULATION_LITERAL_SOURCE, ...PAWN_OUTCOME_LITERAL_SOURCES].flatMap(source => source.cases.map(row => row.proposition.case.id)));
  expect(canonical.filter(row => !actualCaseMap.has(row.id) && !laterIds.has(row.id))).toHaveLength(419 - SUBJECT_SAFE_RETIRED_CASES.length);
  const current = SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.kind === "event" && row.subject.projection.id === subject.projection.id && row.subject.projection.version === 2)!;
  expect(semanticValidationVerdict(current.subject)?.verdict).toBe("passed");
  for (const arm of ["positive", "semanticNegative", "orientation", "importedPopulation"] as const) expect(current[arm].disposition).toBe("present");
  const legacy = SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.kind === "event" && row.subject.projection.id === subject.projection.id && row.subject.projection.version === 1)!;
  expect(legacy).toBeUndefined();
  expect(semanticValidationVerdict({ kind: "event", projection: { ...subject.projection, version: 1 } })?.verdict).not.toBe("passed");
});


it("the concrete mirror walk rejects missing nested clocks and uncovered interior ordinals", async () => {
  const row = actualCases.find(value => value.arm === "orientation" && value.id.includes("three.south.color_and_vertical"))!;
  if (row.expectation.kind !== "mirrors") throw Error("A concrete complete walk is required");
  const expected = row.expectation, partner = actualCaseMap.get(expected.partnerCase.id)!;
  if (row.input.kind !== "edge" || partner.input.kind !== "edge") throw Error("Concrete mirror cases require two legal edge inputs");
  const sourceInput = row.input, partnerInput = partner.input;
  const left = await target(sourceInput), right = await target(partnerInput);
  const compare = (a: typeof left, b: typeof right, rules = expected.operandRules) => compareSemanticMirror(a, b, expected.geometry, rules, { source: sourceInput, partner: partnerInput });
  expect(() => compare(left, right)).not.toThrow();
  const withoutFen = expected.operandRules.filter(rule => rule.sourcePath.join(".") !== "before.fen");
  expect(() => compare(left, right, withoutFen)).toThrow(/covered by 0/u);
  const withoutInterior = expected.operandRules.filter(rule => rule.sourcePath.join(".") !== "before.opposition.betweenSquares.0");
  expect(() => compare(left, right, withoutInterior)).toThrow(/covered by 0/u);
  // These are copied comparator data, never forged or admitted source/evidence handles.
  const corruptClock = (observations: typeof left) => observations.map(value => {
    const operands = structuredClone(value.operands) as { before: { fen: string } };
    operands.before.fen = operands.before.fen.replace(/ \d+ \d+$/u, " 99 99");
    return { ...value, operands };
  });
  expect(() => compare(corruptClock(left), right)).toThrow(/same-side input field/u);
  expect(() => compare(left, corruptClock(right))).toThrow(/same-side input field/u);
  expect(() => compare(corruptClock(left), corruptClock(right))).toThrow(/same-side input field/u);
});
