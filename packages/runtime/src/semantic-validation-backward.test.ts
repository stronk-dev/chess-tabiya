import { PAWN_OUTCOME_LITERAL_SOURCES } from "./semantic-validation-pawn-outcome-sources.js";
import { PAWN_LINEAGE_LITERAL_SOURCES } from "./semantic-validation-pawn-lineage-sources.js";
import { COUNT_POPULATION_LITERAL_SOURCE } from "./semantic-validation-count-population-sources.js";
import { restoreSubjectSafeHistoricalCases, SUBJECT_SAFE_RETIRED_CASES, SUBJECT_SAFE_REANCHORED_CASES } from "./testing/subject-safe-retired-semantic-cases.js";
// Literal source controls first; fixed-authority/canonical integration follows independent review.
import { SLIDER_LITERAL_SOURCE } from "./semantic-validation-slider-sources.js";
import { readFileSync } from "node:fs";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BACKWARD_LITERAL_EXAMPLES, BACKWARD_LITERAL_SOURCE } from "./semantic-validation-backward-sources.js";
import { canonicalSemanticEdge, SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { compareSemanticMirror, parseSemanticValidationCase, semanticFactConstraintSha256, type SemanticCanonicalValue, type SemanticEdgeInput } from "./semantic-validation.js";

const faults = vi.hoisted(() => ({ kind: "none" as "none" | "controller" | "controller_order" | "stop" | "occupancy" | "captures" | "capture_order" | "ahead" | "half_open" | "subject" | "lineage" | "reverse" | "duplicate" | "split" | "omit" | "spurious" }));
vi.mock("./foundation-position-sources.js", async importOriginal => {
  const original = await importOriginal<typeof import("./foundation-position-sources.js")>();
  return { ...original,
    readBackwardPawns: (...args: Parameters<typeof original.readBackwardPawns>) => {
      const value = original.readBackwardPawns(...args);
      return { ...value, pawns: value.pawns.map(pawn => {
        switch (faults.kind) {
          case "controller": return { ...pawn, controllers: [] };
          case "controller_order": return { ...pawn, controllers: [...pawn.controllers].reverse() };
          case "stop": return { ...pawn, stop: pawn.pawn };
          case "occupancy": return pawn.stopOccupancy.kind === "empty" ? pawn : { ...pawn, stopOccupancy: { ...pawn.stopOccupancy, piece: { ...pawn.stopOccupancy.piece, role: "queen" as const } } };
          case "captures": return { ...pawn, immediatePseudoCapture: [] };
          case "capture_order": return { ...pawn, immediatePseudoCapture: [...pawn.immediatePseudoCapture].reverse() };
          case "ahead": return { ...pawn, aheadAdjacentPawns: [] };
          case "half_open": return { ...pawn, halfOpenForColor: { ...pawn.halfOpenForColor, value: !pawn.halfOpenForColor.value } };
          default: return pawn;
        }
      }) };
    },
    backwardPawnChanges: (...args: Parameters<typeof original.backwardPawnChanges>) => {
      const values = original.backwardPawnChanges(...args);
      if (faults.kind === "omit") return [];
      if (faults.kind === "spurious") {
        const [edge, before] = args, pawn = before.pawns[0];
        if (pawn !== undefined) return [{ ...edge, subject: { color: pawn.color, beforePawn: pawn.pawn, afterPawn: pawn.pawn }, sign: "membership_changed" as const, before: pawn, after: pawn }];
      }
      if (faults.kind === "duplicate") return [...values, ...values];
      if (faults.kind === "reverse") return [...values].reverse();
      if (faults.kind === "split") return values.flatMap(value => [{ ...value, sign: "gained" as const }, { ...value, sign: "lost" as const }]);
      if (faults.kind === "subject") return values.map(value => ({ ...value, subject: { ...value.subject, beforePawn: value.subject.afterPawn, afterPawn: value.subject.beforePawn } }));
      if (faults.kind === "lineage") {
        // Deliberately wrong implementation: collapse original subjects to one row per color/file.
        // This fault enters the trusted algebra before original sole-factory value minting.
        const [edge, before, after] = args;
        const left = new Map(before.pawns.map(pawn => [`${pawn.color}:${pawn.pawn[0]}`, pawn]));
        const right = new Map(after.pawns.map(pawn => [`${pawn.color}:${pawn.pawn[0]}`, pawn]));
        return [...new Set([...left.keys(), ...right.keys()])].flatMap(key => {
          const a = left.get(key) ?? null, b = right.get(key) ?? null, sign = original.foundationMembershipChange(a, b);
          if (sign === undefined) return [];
          return [{ ...edge, subject: { color: (a ?? b)!.color, beforePawn: a?.pawn ?? null, afterPawn: b?.pawn ?? null }, sign, before: a, after: b }];
        });
      }
      return values;
    },
  };
});
afterEach(() => { faults.kind = "none"; });

const actualCases = BACKWARD_LITERAL_SOURCE.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm, operation: BACKWARD_LITERAL_SOURCE.operation,
  input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: BACKWARD_LITERAL_SOURCE.sourceId, sourceRevision: BACKWARD_LITERAL_SOURCE.sourceRevision, licence: BACKWARD_LITERAL_SOURCE.licence,
    span: { start: 0, end: BACKWARD_LITERAL_SOURCE.text.length, textSha256: sha256Text(BACKWARD_LITERAL_SOURCE.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
}));
const actualCaseMap = new Map(actualCases.map(row => [row.id, row]));

type Obj = { readonly [key: string]: SemanticCanonicalValue };
const record = (value: SemanticCanonicalValue | undefined): Obj => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw Error("Literal record required");
  return value as Obj;
};
const records = (value: SemanticCanonicalValue | undefined): readonly Obj[] => {
  if (!Array.isArray(value)) throw Error("Literal ordered rows required");
  return value.map(record);
};
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
const target = async (input: SemanticEdgeInput) => {
  const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.foundation_edge"].invoke(input);
  if (result.kind !== "completed") throw Error("Actual complete foundation operation required");
  const subject = BACKWARD_LITERAL_SOURCE.cases[0]!.proposition.subject;
  return result.observations.filter(row => row.item.projection.id === subject.projection.id && row.item.projection.version === subject.projection.version).map(row => {
    if (row.kind !== "event") throw Error("Original compiled source event required");
    return { projection: row.item.projection, sign: row.item.sign, operands: row.item.operands };
  });
};
const cases = new Map(BACKWARD_LITERAL_SOURCE.cases.map(row => [row.proposition.case.id, row]));

describe("independent literal backward-pawn2 propositions", () => {
  it.each(BACKWARD_LITERAL_EXAMPLES)("$id has complete legal edge bytes and correct literal operands", row => {
    const input = { kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen } as const;
    expect(canonicalSemanticEdge(input)).toEqual(input);
    for (const [stage, fen] of [[1, row.beforeFen], [2, row.afterFen]] as const) {
      const board = literalBoard(fen);
      for (const event of row.events) {
        const pawn = event[stage]; if (pawn === null) continue;
        const color = pawn.color, enemy = color === "white" ? "black" : "white", symbol = color === "white" ? "P" : "p", opposing = color === "white" ? "p" : "P";
        const square = String(pawn.pawn), stop = String(pawn.stop), forward = color === "white" ? 1 : -1;
        expect(board.get(square)).toBe(symbol); expect(stop).toBe(`${square[0]}${Number(square[1]) + forward}`);
        for (const controller of records(pawn.controllers)) {
          expect(controller.color).toBe(enemy); expect(board.get(String(controller.square))).toBe(opposing);
          expect(Math.abs(String(controller.square).charCodeAt(0) - stop.charCodeAt(0))).toBe(1);
          expect(Number(String(controller.square)[1]) - forward).toBe(Number(stop[1]));
        }
        expect(records(pawn.controllers).length).toBeGreaterThan(0);
        expect(pawn.supportPawns).toEqual([]);
        for (const ahead of records(pawn.aheadAdjacentPawns)) {
          expect(ahead.color).toBe(color); expect(board.get(String(ahead.square))).toBe(symbol);
          expect(Math.abs(String(ahead.square).charCodeAt(0) - square.charCodeAt(0))).toBe(1);
          expect((Number(String(ahead.square)[1]) - Number(square[1])) * forward).toBeGreaterThan(0);
        }
        const occupancy = record(pawn.stopOccupancy), occupant = board.get(stop);
        if (occupancy.kind === "empty") expect(occupant).toBeUndefined();
        else {
          const piece = record(occupancy.piece);
          expect(piece.color).toBe(occupancy.kind === "own" ? color : enemy);
          const role = ({ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" } as Record<string, string>)[occupant!.toLowerCase()];
          expect(piece.role).toBe(role); expect(occupant === occupant!.toUpperCase()).toBe(piece.color === "white");
        }
        for (const capture of records(pawn.immediatePseudoCapture)) {
          expect(capture.color).toBe(enemy); expect(board.get(String(capture.square))).toBe(opposing);
          expect(Math.abs(String(capture.square).charCodeAt(0) - square.charCodeAt(0))).toBe(1);
          expect(Number(String(capture.square)[1])).toBe(Number(square[1]) + forward);
        }
        const halfOpen = record(pawn.halfOpenForColor);
        expect(halfOpen.color).toBe(enemy);
        expect(halfOpen.value).toBe(![...board].some(([at, token]) => at[0] === square[0] && token === opposing));
      }
    }
  });
  it.each(BACKWARD_LITERAL_SOURCE.cases.filter(row => row.arm !== "orientation"))("$proposition.case.id matches the independently complete event population", async row => {
    const actual = await target(row.input), expected = row.proposition.expectation;
    if (expected.kind === "omits") expect(actual).toEqual([]);
    else {
      if (expected.kind !== "emits_exact") throw Error("Complete independent expectation required");
      expect(actual.map(({ sign, operands }) => ({ sign, operands }))).toEqual(expected.events);
    }
  });
  it.each(BACKWARD_LITERAL_SOURCE.cases.filter(row => row.arm === "orientation"))("$proposition.case.id walks the entire population with independently absolute partners", async row => {
    const expected = row.proposition.expectation;
    if (expected.kind !== "mirrors") throw Error("Complete orientation required");
    const partner = cases.get(expected.partnerCase.id)!; expect(partner).toBeDefined();
    for (const input of [row.input, partner.input]) expect(BACKWARD_LITERAL_SOURCE.cases.find(value => value.arm === "positive" && JSON.stringify(value.input) === JSON.stringify(input))?.proposition.expectation.kind).toBe("emits_exact");
    const left = await target(row.input), right = await target(partner.input);
    expect(() => compareSemanticMirror(left, right, expected.geometry, expected.operandRules, { source: row.input, partner: partner.input })).not.toThrow();
  });
});


describe("genuine pre-factory backward source faults", () => {
  const absolute = (name: string) => BACKWARD_LITERAL_SOURCE.cases.find(row => row.proposition.case.id === `cited.literal-board.backward2.${name}.absolute`)!;
  it.each([
    { kind: "controller", name: "pinned-controller.white" }, { kind: "controller_order", name: "two-controller.white" },
    { kind: "stop", name: "pinned-controller.white" }, { kind: "occupancy", name: "pinned-controller.white" },
    { kind: "captures", name: "two-capture.white" }, { kind: "capture_order", name: "two-capture.white" },
    { kind: "ahead", name: "support-ahead.white" }, { kind: "half_open", name: "two-controller.white" },
  ] as const)("complete absolutes reject symmetric wrong $kind while full mirrors still agree", async ({ kind, name }) => {
    const exact = absolute(name), mirror = cases.get(`cited.literal-board.backward2.${name}.color_and_vertical`)!;
    const expected = mirror.proposition.expectation;
    if (expected.kind !== "mirrors" || exact.proposition.expectation.kind !== "emits_exact") throw Error("Complete real absolute/mirror pair required");
    const partner = cases.get(expected.partnerCase.id)!;
    faults.kind = kind;
    const left = await target(mirror.input), right = await target(partner.input);
    expect(left.map(({ sign, operands }) => ({ sign, operands }))).not.toEqual(exact.proposition.expectation.events);
    expect(() => compareSemanticMirror(left, right, expected.geometry, expected.operandRules, { source: mirror.input, partner: partner.input })).not.toThrow();
  });
  it.each(["moving-lineage.white", "moving-lineage.black", "same-file.white", "same-file.black"])("refuses file-based joining for %s", async name => {
    const row = absolute(name); if (row.proposition.expectation.kind !== "emits_exact") throw Error("Complete exact source required");
    faults.kind = "lineage";
    expect((await target(row.input)).map(({ sign, operands }) => ({ sign, operands }))).not.toEqual(row.proposition.expectation.events);
  });
  it.each(["subject", "reverse", "duplicate", "split", "omit"] as const)("refuses %s changes to complete original populations", async kind => {
    const row = absolute("same-file.white"); if (row.proposition.expectation.kind !== "emits_exact") throw Error("Complete exact source required");
    faults.kind = kind;
    expect((await target(row.input)).map(({ sign, operands }) => ({ sign, operands }))).not.toEqual(row.proposition.expectation.events);
  });
});


describe("actual fixed backward source authority and runner", () => {
  it.each(actualCases)("$id binds its full proposition and invokes the production operation", async row => {
    const result = await executeSemanticValidationCase(row, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status, JSON.stringify(result.failure)).toBe("passed");
    expect(result.invocations).toBe(row.arm === "orientation" ? 2 : 1);
  });
  it.each([
    { kind: "controller", name: "pinned-controller.white" }, { kind: "controller_order", name: "two-controller.white" },
    { kind: "stop", name: "pinned-controller.white" }, { kind: "occupancy", name: "pinned-controller.white" },
    { kind: "captures", name: "two-capture.white" }, { kind: "capture_order", name: "two-capture.white" },
    { kind: "ahead", name: "support-ahead.white" }, { kind: "half_open", name: "two-controller.white" },
  ] as const)("real absolutes reject symmetric wrong $kind that still mirrors", async ({ kind, name }) => {
    const absolute = actualCaseMap.get(`cited.literal-board.backward2.${name}.absolute`)!;
    const mirror = actualCaseMap.get(`cited.literal-board.backward2.${name}.color_and_vertical`)!;
    faults.kind = kind;
    const exact = await executeSemanticValidationCase(absolute, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(exact.status).toBe("failed"); expect(exact.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    const symmetric = await executeSemanticValidationCase(mirror, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(symmetric.status, JSON.stringify(symmetric.failure)).toBe("passed");
  });
  it.each(["moving-lineage.white", "moving-lineage.black", "same-file.white", "same-file.black"])("real runner refuses wrong file-based pairing for %s", async name => {
    faults.kind = "lineage";
    const result = await executeSemanticValidationCase(actualCaseMap.get(`cited.literal-board.backward2.${name}.absolute`)!, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status).toBe("failed"); expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
  });
  it.each(["subject", "reverse", "duplicate", "split", "omit"] as const)("real complete populations reject %s corruption", async kind => {
    faults.kind = kind;
    const result = await executeSemanticValidationCase(actualCaseMap.get("cited.literal-board.backward2.same-file.white.absolute")!, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status).toBe("failed"); expect(result.failure?.code).toBe(kind === "omit" ? "SEMANTIC_VALIDATION_POSITIVE_EMPTY" : "SEMANTIC_VALIDATION_EXPECTATION_UNMET");
  });
  it("binds every expected event byte before any operation dispatch", async () => {
    const absolute = actualCaseMap.get("cited.literal-board.backward2.same-file.white.absolute")!;
    if (absolute.expectation.kind !== "emits_exact") throw Error("Complete independent expectation required");
    for (const events of [[...absolute.expectation.events].reverse(), [...absolute.expectation.events, ...absolute.expectation.events], absolute.expectation.events.map(value => ({ ...value, operands: { ...value.operands, extra: true } }))]) {
      const altered = parseSemanticValidationCase({ ...absolute, expectation: { kind: "emits_exact", events } });
      const result = await executeSemanticValidationCase(altered, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
      expect(result.status).toBe("failed"); expect(result.invocations).toBe(0); expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID");
    }
  });
});


it.each(["quiet.white", "quiet.black"])("real whole-family negative refuses an unchanged-subject event on %s", async name => {
  const row = actualCaseMap.get(`cited.literal-board.backward2.${name}.negative`)!;
  faults.kind = "spurious";
  const result = await executeSemanticValidationCase(row, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
  expect(result.status).toBe("failed"); expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_NEGATIVE_EMITTED");
  expect(result.targetCount).toBe(1);
});


it("joins exactly74 reviewed backward cases and retains its685 predecessors after later source additions", () => {
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
  const laterIds = new Set([SLIDER_LITERAL_SOURCE, COUNT_POPULATION_LITERAL_SOURCE, ...PAWN_OUTCOME_LITERAL_SOURCES, ...PAWN_LINEAGE_LITERAL_SOURCES].flatMap(source => source.cases.map(row => row.proposition.case.id)));
  expect(canonical.filter(row => !actualCaseMap.has(row.id) && !laterIds.has(row.id))).toHaveLength(685 - SUBJECT_SAFE_RETIRED_CASES.length);
  const subject = BACKWARD_LITERAL_SOURCE.cases[0]!.proposition.subject;
  const profile = SEMANTIC_VALIDATION_PROFILES.find(row => JSON.stringify(row.subject) === JSON.stringify(subject))!;
  for (const arm of ["positive", "semanticNegative", "orientation", "importedPopulation"] as const) expect(profile[arm].disposition).toBe("present");
  expect(semanticValidationVerdict(subject)?.verdict).toBe("passed");

});
