import { PAWN_OUTCOME_LITERAL_SOURCES } from "./semantic-validation-pawn-outcome-sources.js";
import { PAWN_LINEAGE_LITERAL_SOURCES } from "./semantic-validation-pawn-lineage-sources.js";
import { COUNT_POPULATION_LITERAL_SOURCE } from "./semantic-validation-count-population-sources.js";
import { restoreSubjectSafeHistoricalCases, SUBJECT_SAFE_RETIRED_CASES, SUBJECT_SAFE_REANCHORED_CASES } from "./testing/subject-safe-retired-semantic-cases.js";
// Independent literal source controls; canonical/profile integration follows source review.
import { SLIDER_LITERAL_SOURCE } from "./semantic-validation-slider-sources.js";
import { BACKWARD_LITERAL_SOURCE } from "./semantic-validation-backward-sources.js";
import { readFileSync } from "node:fs";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PAWN_FILE_FAMILIES, PAWN_FILE_LITERAL_EXAMPLES, PAWN_FILE_LITERAL_SOURCES, PAWN_FILE_SUBJECTS, type PawnFileFamily } from "./semantic-validation-pawn-file-sources.js";
import { canonicalSemanticEdge, SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { compareSemanticMirror, parseSemanticValidationCase, semanticFactConstraintSha256, type SemanticCanonicalValue, type SemanticEdgeInput } from "./semantic-validation.js";

const faults = vi.hoisted(() => ({ family: "group" as PawnFileFamily, kind: "none" as "none" | "wrong" | "cause" | "members" | "duplicate" | "omit" | "reverse" }));
vi.mock("./foundation-pawn-sources.js", async importOriginal => {
  const original = await importOriginal<typeof import("./foundation-pawn-sources.js")>();
  const population = <T>(values: readonly T[], family: PawnFileFamily): readonly T[] => {
    if (faults.family !== family) return values;
    if (faults.kind === "duplicate") return [...values, ...values];
    if (faults.kind === "omit") return [];
    if (faults.kind === "reverse") return [...values].reverse();
    return values;
  };
  return { ...original,
    pawnFileGroupChanges: (...args: Parameters<typeof original.pawnFileGroupChanges>) => population(original.pawnFileGroupChanges(...args).map(value => {
      if (faults.family !== "group") return value;
      const alter = (group: typeof value.before) => group === null ? null : faults.kind === "wrong" ? { ...group, isolated: !group.isolated }
        : faults.kind === "members" ? { ...group, pawns: [...group.pawns].reverse() } : group;
      return { ...value, before: alter(value.before), after: alter(value.after), cause: faults.kind === "cause" ? { ...value.cause, mover: { ...value.cause.mover, role: "queen" as const } } : value.cause };
    }), "group"),
    fileStateChanges: (...args: Parameters<typeof original.fileStateChanges>) => population(original.fileStateChanges(...args).map(value => faults.family === "state" && faults.kind === "wrong"
      ? { ...value, before: { ...value.before, state: "open" as const } } : value), "state"),
    fileAccessRevealed: (...args: Parameters<typeof original.fileAccessRevealed>) => population(original.fileAccessRevealed(...args).map(value => faults.family === "access" && faults.kind === "wrong"
      ? { ...value, piece: { ...value.piece, role: value.piece.role === "rook" ? "queen" as const : "rook" as const } } : value), "access"),
    readPawnIslandChanges: (...args: Parameters<typeof original.readPawnIslandChanges>) => population(original.readPawnIslandChanges(...args).map(value => faults.family === "islands" && faults.kind === "wrong"
      ? { ...value, beforeCount: value.beforeCount + 1, afterCount: value.afterCount + 1 } : value), "islands"),
  };
});
afterEach(() => { faults.kind = "none"; });

const actualCases = PAWN_FILE_LITERAL_SOURCES.flatMap(source => source.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm, operation: source.operation,
  input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: source.sourceId, sourceRevision: source.sourceRevision, licence: source.licence,
    span: { start: 0, end: source.text.length, textSha256: sha256Text(source.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
})));
const actualCaseMap = new Map(actualCases.map(row => [row.id, row]));

const target = async (input: SemanticEdgeInput, family: PawnFileFamily) => {
  const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.foundation_edge"].invoke(input);
  if (result.kind !== "completed") throw Error("A complete actual foundation operation is required");
  const subject = PAWN_FILE_SUBJECTS[family];
  return result.observations.filter(row => row.item.projection.id === subject.projection.id && row.item.projection.version === subject.projection.version).map(row => {
    if (row.kind !== "event") throw Error("Original compiled events are required");
    return { projection: row.item.projection, sign: row.item.sign, operands: row.item.operands };
  });
};

// Placement decoding only: no pawn classifier, move generator or derived output oracle.
function literalBoard(fen: string) {
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
type ObjectValue = { readonly [key: string]: SemanticCanonicalValue };
const object = (value: SemanticCanonicalValue | undefined): ObjectValue => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw Error("Literal record required");
  return value as ObjectValue;
};
const piece = (color: string, role: string) => {
  const symbol = ({ pawn: "p", knight: "n", bishop: "b", rook: "r", queen: "q", king: "k" } as Record<string, string>)[role]!;
  return color === "white" ? symbol.toUpperCase() : symbol;
};

describe("independent literal pawn/file source propositions", () => {
  it.each(PAWN_FILE_LITERAL_EXAMPLES)("$id has a complete legal literal edge and correct physical cause", row => {
    const input = { kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen } as const;
    expect(canonicalSemanticEdge(input)).toEqual(input);
    const before = literalBoard(row.beforeFen), after = literalBoard(row.afterFen), mover = object(row.cause.mover);
    expect(before.get(String(mover.from))).toBe(piece(String(mover.color), String(mover.role)));
    expect(after.get(String(mover.to))).toBe(piece(String(mover.color), String(mover.promotion ?? mover.role)));
    if (row.cause.captured !== null) {
      const captured = object(row.cause.captured);
      expect(before.get(String(captured.square))).toBe(piece(String(captured.color), String(captured.role)));
      expect(after.get(String(captured.square))).not.toBe(piece(String(captured.color), String(captured.role)));
    }
    for (const [stage, board] of [[0, before], [1, after]] as const) {
      for (const group of row.groups) {
        const value = stage === 0 ? group[1] : group[2];
        if (value === null || typeof value === "string") continue;
        const pawns = [...board].filter(([square, symbol]) => square[0] === value.file && symbol === piece(value.color, "pawn")).map(([square]) => square)
          .sort((a, b) => (Number(a[1]) - Number(b[1])) * (value.color === "white" ? -1 : 1));
        expect(value.pawns).toEqual(pawns);
      }
      for (const change of row.files) {
        const value = change[stage];
        for (const color of ["white", "black"] as const) expect(value[`${color}Pawns`]).toEqual([...board].filter(([square, symbol]) => square[0] === value.file && symbol === piece(color, "pawn")).map(([square]) => square).sort());
      }
      for (const [color, , left, right] of row.islands) {
        const partitions = stage === 0 ? left : right;
        expect(partitions.flatMap(value => value.pawns).sort()).toEqual([...board].filter(([, symbol]) => symbol === piece(color, "pawn")).map(([square]) => square).sort());
        for (const partition of partitions) {
          expect([...new Set(partition.pawns.map(square => square[0]))].sort()).toEqual(partition.files);
          expect(partition.pawns).toEqual([...partition.pawns].sort());
        }
      }
    }
    for (const [, color, role, square] of row.access) {
      expect(before.get(square)).toBe(piece(color, role)); expect(after.get(square)).toBe(piece(color, role));
      expect(square).not.toBe(mover.from);
    }
  });

  for (const [index, family] of PAWN_FILE_FAMILIES.entries()) {
    const source = PAWN_FILE_LITERAL_SOURCES[index]!;
    const byId = new Map(source.cases.map(row => [row.proposition.case.id, row]));
    it.each(source.cases.filter(row => row.arm !== "orientation"))("$proposition.case.id matches its independently complete population", async row => {
      const actual = await target(row.input, family), expectation = row.proposition.expectation;
      if (expectation.kind === "omits") expect(actual).toEqual([]);
      else {
        if (expectation.kind !== "emits_exact") throw Error("An independently complete population is required");
        expect(actual.map(({ sign, operands }) => ({ sign, operands }))).toEqual(expectation.events);
      }
    });
    it.each(source.cases.filter(row => row.arm === "orientation"))("$proposition.case.id covers every ordered leaf and has absolute partners", async row => {
      const expectation = row.proposition.expectation;
      if (expectation.kind !== "mirrors") throw Error("A complete mirror is required");
      const partner = byId.get(expectation.partnerCase.id)!; expect(partner).toBeDefined();
      for (const input of [row.input, partner.input]) {
        const absolute = source.cases.find(value => value.arm === "positive" && JSON.stringify(value.input) === JSON.stringify(input));
        expect(absolute?.proposition.expectation.kind).toBe("emits_exact");
      }
      const left = await target(row.input, family), right = await target(partner.input, family);
      expect(() => compareSemanticMirror(left, right, expectation.geometry, expectation.operandRules, { source: row.input, partner: partner.input })).not.toThrow();
    });
  }
});


describe("genuine source faults before sole-factory minting", () => {
  const sourceFor = (family: PawnFileFamily) => PAWN_FILE_LITERAL_SOURCES[PAWN_FILE_FAMILIES.indexOf(family)]!;
  it.each(PAWN_FILE_FAMILIES)("%s complete absolutes reject symmetric wrong facts even while mirrors agree", async family => {
    const source = sourceFor(family), name = family === "state" ? "closed.white" : "capture.white";
    const absolute = source.cases.find(row => row.proposition.case.id.includes(`${name}.absolute`))!;
    const mirror = source.cases.find(row => row.proposition.case.id.includes(`${name}.color_and_vertical`))!;
    const expectation = mirror.proposition.expectation;
    if (expectation.kind !== "mirrors" || absolute.proposition.expectation.kind !== "emits_exact") throw Error("Real exact/mirror pair required");
    const partner = source.cases.find(row => row.proposition.case.id === expectation.partnerCase.id)!;
    faults.family = family; faults.kind = "wrong";
    const left = await target(mirror.input, family), right = await target(partner.input, family);
    expect(left.map(({ sign, operands }) => ({ sign, operands }))).not.toEqual(absolute.proposition.expectation.events);
    expect(() => compareSemanticMirror(left, right, expectation.geometry, expectation.operandRules, { source: mirror.input, partner: partner.input })).not.toThrow();
  });
  it.each(PAWN_FILE_FAMILIES.flatMap(family => (["duplicate", "omit", "reverse"] as const).map(kind => ({ family, kind }))))("$family complete absolutes reject $kind populations", async ({ family, kind }) => {
    const source = sourceFor(family), name = family === "islands" ? "closed.white" : "capture.white";
    const row = source.cases.find(value => value.proposition.case.id.includes(`${name}.absolute`))!;
    if (row.proposition.expectation.kind !== "emits_exact") throw Error("Real complete population required");
    expect(row.proposition.expectation.events.length).toBeGreaterThan(1);
    faults.family = family; faults.kind = kind;
    const actual = await target(row.input, family);
    expect(actual.map(({ sign, operands }) => ({ sign, operands }))).not.toEqual(row.proposition.expectation.events);
  });
  it.each(["cause", "members"] as const)("full group facts reject wrong %s without relying on symmetry", async kind => {
    const source = sourceFor("group"), row = source.cases.find(value => value.proposition.case.id.includes("triple.white.absolute"))!;
    if (row.proposition.expectation.kind !== "emits_exact") throw Error("Real complete population required");
    faults.family = "group"; faults.kind = kind;
    expect((await target(row.input, "group")).map(({ sign, operands }) => ({ sign, operands }))).not.toEqual(row.proposition.expectation.events);
  });
});


describe("real fixed authority binding before qualification", () => {
  it.each(actualCases)("$id resolves its exact source proposition and actual operation", async row => {
    const result = await executeSemanticValidationCase(row, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status, JSON.stringify(result.failure)).toBe("passed");
    expect(result.invocations).toBe(row.arm === "orientation" ? 2 : 1);
  });
  it.each(PAWN_FILE_FAMILIES)("%s binds the complete expected population before invoking anything", async family => {
    const row = actualCases.find(value => value.id.includes(`.${family}.capture.white.absolute`))!;
    if (row.expectation.kind !== "emits_exact") throw Error("Complete source expectation required");
    for (const events of [[...row.expectation.events, ...row.expectation.events], row.expectation.events.map(value => ({ ...value, operands: { ...value.operands, extra: true } }))]) {
      const altered = parseSemanticValidationCase({ ...row, expectation: { kind: "emits_exact", events } });
      const result = await executeSemanticValidationCase(altered, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
      expect(result.status).toBe("failed"); expect(result.invocations).toBe(0); expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
    }
  });
  it.each(PAWN_FILE_FAMILIES)("%s real runner rejects genuine symmetric wrong source facts", async family => {
    const name = family === "state" ? "closed.white" : "capture.white";
    const absolute = actualCases.find(row => row.id.includes(`.${family}.${name}.absolute`))!;
    const mirror = actualCases.find(row => row.id.includes(`.${family}.${name}.color_and_vertical`))!;
    faults.family = family; faults.kind = "wrong";
    const exact = await executeSemanticValidationCase(absolute, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(exact.status).toBe("failed"); expect(exact.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    const symmetric = await executeSemanticValidationCase(mirror, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(symmetric.status, JSON.stringify(symmetric.failure)).toBe("passed");
  });
  it.each(PAWN_FILE_FAMILIES.flatMap(family => (["duplicate", "omit", "reverse"] as const).map(kind => ({ family, kind }))))("$family runner rejects $kind complete populations", async ({ family, kind }) => {
    const name = family === "islands" ? "closed.white" : "capture.white";
    const row = actualCases.find(value => value.id.includes(`.${family}.${name}.absolute`))!;
    faults.family = family; faults.kind = kind;
    const result = await executeSemanticValidationCase(row, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status).toBe("failed"); expect(result.failure?.code).toBe(kind === "omit" ? "SEMANTIC_VALIDATION_POSITIVE_EMPTY" : "SEMANTIC_VALIDATION_EXPECTATION_UNMET");
  });
});


it("joins exactly220 reviewed cases, preserves the prior465 and qualifies only the four current subjects", () => {
  const canonical = (JSON.parse(readFileSync(new URL("./semantic-validation-cases.json", import.meta.url), "utf8")) as { cases: unknown[] }).cases.map(parseSemanticValidationCase);
  expect(canonical).toHaveLength(824 + COUNT_POPULATION_LITERAL_SOURCE.cases.length + [...PAWN_OUTCOME_LITERAL_SOURCES, ...PAWN_LINEAGE_LITERAL_SOURCES].reduce((n, source) => n + source.cases.length, 0));
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
  const laterIds = new Set([BACKWARD_LITERAL_SOURCE, SLIDER_LITERAL_SOURCE, COUNT_POPULATION_LITERAL_SOURCE, ...PAWN_OUTCOME_LITERAL_SOURCES, ...PAWN_LINEAGE_LITERAL_SOURCES].flatMap(source => source.cases.map(row => row.proposition.case.id)));
  expect(canonical.filter(row => !actualCaseMap.has(row.id) && !laterIds.has(row.id))).toHaveLength(465 - SUBJECT_SAFE_RETIRED_CASES.length);
  for (const family of PAWN_FILE_FAMILIES) {
    const subject = PAWN_FILE_SUBJECTS[family];
    const profile = SEMANTIC_VALIDATION_PROFILES.find(row => JSON.stringify(row.subject) === JSON.stringify(subject))!;
    expect(profile).toBeDefined();
    for (const arm of ["positive", "semanticNegative", "orientation", "importedPopulation"] as const) expect(profile[arm].disposition).toBe("present");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("passed");
  }

});
