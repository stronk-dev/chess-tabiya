import { restoreSubjectSafeHistoricalCases, SUBJECT_SAFE_RETIRED_CASES, SUBJECT_SAFE_REANCHORED_CASES } from "./testing/subject-safe-retired-semantic-cases.js";
// Independent literal data controls. Authority/canonical integration follows source review.
import { readFileSync } from "node:fs";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SLIDER_LITERAL_EXAMPLES, SLIDER_LITERAL_SOURCE } from "./semantic-validation-slider-sources.js";
import { canonicalSemanticEdge, SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { compareSemanticMirror, parseSemanticValidationCase, semanticFactConstraintSha256, type SemanticCanonicalValue, type SemanticEdgeInput } from "./semantic-validation.js";

const faults = vi.hoisted(() => ({ calls: 0, kind: "none" as "none" | "root_role" | "root_square" | "current_role" | "current_square" | "endpoint" | "interior" | "blocker_role" | "blocker_square" | "blocker_order" | "direction" | "sign" | "replacement" | "promotion_root" | "duplicate" | "omit" | "drop" | "split" | "reverse" | "endpoint_inclusion" | "incompatible" | "spurious" }));
vi.mock("./foundation-slider-sources.js", async importOriginal => {
  const original = await importOriginal<typeof import("./foundation-slider-sources.js")>();
  return { ...original, sliderMembershipChanges: (...args: Parameters<typeof original.sliderMembershipChanges>) => {
    faults.calls++;
    const values = original.sliderMembershipChanges(...args), edge = args[0];
    if (faults.kind === "omit") return [];
    if (faults.kind === "duplicate") return [...values, ...values];
    if (faults.kind === "drop") return values.slice(1);
    if (faults.kind === "reverse") return [...values].reverse();
    if (faults.kind === "split") return values.flatMap(value => [{ ...value, sign: "gained" as const }, { ...value, sign: "lost" as const }]);
    if (["endpoint_inclusion", "incompatible", "spurious"].includes(faults.kind)) {
      // Deliberately wrong, pure source algorithms for genuine whole-family omission fixtures.
      // They enter before the sole factory, not as caller-supplied evidence or resolver results.
      const white = faults.kind === "endpoint_inclusion" ? edge.moveUci === "b6a8" : edge.beforeFen.split(" ")[1] === "w";
      const color = white ? "white" as const : "black" as const, rank = white ? "1" : "8";
      const root = { color, role: faults.kind === "incompatible" ? "bishop" as const : "rook" as const, square: `a${rank}` as "a1" | "a8" };
      const path = (white ? ["a2","a3","a4","a5","a6","a7"] : ["a7","a6","a5","a4","a3","a2"]) as ("a2" | "a3" | "a4" | "a5" | "a6" | "a7")[];
      const endpoint = white ? "a8" as const : "a1" as const;
      const beforeBlockers = faults.kind === "incompatible" ? [{ color, role: "pawn" as const, square: white ? "a2" as const : "a7" as const }] : [];
      const afterBlockers = faults.kind === "endpoint_inclusion" ? [{ color: white ? "black" as const : "white" as const, role: "knight" as const, square: endpoint }]
        : faults.kind === "incompatible" ? [{ color, role: "pawn" as const, square: white ? "a3" as const : "a6" as const }] : [];
      return [{ ...edge, root, direction: { df: 0, dr: white ? 1 : -1 }, sign: "membership_changed" as const,
        before: { slider: root, endpoint, strictInterior: path, blockers: beforeBlockers },
        after: { slider: root, endpoint, strictInterior: path, blockers: afterBlockers } }];
    }
    const ray = (value: typeof values[number]["before"]) => {
      if (value === null) return null;
      const slider = faults.kind === "current_role" ? { ...value.slider, role: value.slider.role === "rook" ? "queen" as const : "rook" as const } : value.slider;
      return { ...value, slider,
        endpoint: faults.kind === "endpoint" ? value.slider.square : value.endpoint,
        strictInterior: faults.kind === "interior" ? [...value.strictInterior].reverse() : value.strictInterior,
        blockers: faults.kind === "blocker_order" ? [...value.blockers].reverse() : value.blockers.map(blocker => faults.kind === "blocker_role" ? { ...blocker, role: blocker.role === "knight" ? "bishop" as const : "knight" as const }
          : faults.kind === "blocker_square" ? { ...blocker, square: value.slider.square } : blocker),
      };
    };
    return values.map(value => {
      const root = faults.kind === "root_role" ? { ...value.root, role: value.root.role === "rook" ? "queen" as const : "rook" as const }
        : faults.kind === "root_square" ? { ...value.root, square: value.after?.slider.square ?? value.root.square }
        : faults.kind === "promotion_root" && value.root.role === "pawn" && value.after !== null ? { ...value.root, role: value.after.slider.role } : value.root;
      const before = ray(value.before); let after = ray(value.after);
      if (faults.kind === "current_square" && after !== null) after = { ...after, slider: { ...after.slider, square: value.root.square } };
      const capturedAlias = faults.kind === "replacement" && value.root.square === edge.moveUci.slice(2,4) && before !== null && after === null;
      if (capturedAlias) after = { ...before, slider: { ...before.slider, color: before.slider.color === "white" ? "black" as const : "white" as const } };
      return { ...value, root, before, after,
        direction: faults.kind === "direction" ? { df: value.direction.df === 0 ? 0 : -value.direction.df, dr: value.direction.dr === 0 ? 0 : -value.direction.dr } : value.direction,
        sign: capturedAlias ? "membership_changed" as const : faults.kind === "sign" ? value.sign === "gained" ? "lost" as const : "gained" as const : value.sign,
      };
    });
  } };
});
afterEach(() => { faults.kind = "none"; });

const actualCases = SLIDER_LITERAL_SOURCE.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm, operation: SLIDER_LITERAL_SOURCE.operation,
  input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: SLIDER_LITERAL_SOURCE.sourceId, sourceRevision: SLIDER_LITERAL_SOURCE.sourceRevision, licence: SLIDER_LITERAL_SOURCE.licence,
    span: { start: 0, end: SLIDER_LITERAL_SOURCE.text.length, textSha256: sha256Text(SLIDER_LITERAL_SOURCE.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
}));
const actualCaseMap = new Map(actualCases.map(row => [row.id, row]));

type Obj = { readonly [key: string]: SemanticCanonicalValue };
const record = (value: SemanticCanonicalValue | undefined): Obj => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw Error("Literal object required");
  return value as Obj;
};
const strings = (value: SemanticCanonicalValue | undefined): readonly string[] => {
  if (!Array.isArray(value) || value.some(item => typeof item !== "string")) throw Error("Literal square list required");
  return value as readonly string[];
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
const piece = (symbol: string, square: string) => ({ color: symbol === symbol.toUpperCase() ? "white" : "black",
  role: ({ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" } as Record<string, string>)[symbol.toLowerCase()]!, square });
const target = async (input: SemanticEdgeInput) => {
  const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.foundation_edge"].invoke(input);
  if (result.kind !== "completed") throw Error("Complete actual source operation required");
  const subject = SLIDER_LITERAL_SOURCE.cases[0]!.proposition.subject;
  return result.observations.filter(row => row.item.projection.id === subject.projection.id && row.item.projection.version === subject.projection.version).map(row => {
    if (row.kind !== "event") throw Error("Original compiled source event required");
    return { projection: row.item.projection, sign: row.item.sign, operands: row.item.operands };
  });
};
const byId = new Map(SLIDER_LITERAL_SOURCE.cases.map(row => [row.proposition.case.id, row]));
// D4174: keep production retention enabled. A real distinct legal input replaces its one latest
// entry before a source-algorithm fault is armed; otherwise repeated input would reuse old values.
beforeEach(async () => {
  faults.kind = "none";
  await target({ kind: "edge", beforeFen: "6k1/8/8/8/8/8/8/7K w - - 0 1", moveUci: "h1g1", afterFen: "6k1/8/8/8/8/8/8/6K1 b - - 1 1" });
  faults.calls = 0;
});
const mutatedSize = (size: number, kind: string) => kind === "omit" ? 0 : kind === "drop" ? size - 1 : kind === "duplicate" || kind === "split" ? size * 2 : size;


describe("independent literal physical-slider2 source", () => {
  it.each(SLIDER_LITERAL_EXAMPLES)("$id has exact legal edge bytes and independently complete path/blocker facts", row => {
    const input = { kind: "edge", beforeFen: row.beforeFen, moveUci: row.moveUci, afterFen: row.afterFen } as const;
    expect(canonicalSemanticEdge(input)).toEqual(input);
    const before = literalBoard(row.beforeFen), after = literalBoard(row.afterFen);
    for (const event of row.events) {
      expect(piece(before.get(event.root.square)!, event.root.square)).toEqual(event.root);
      const direction = record(event.direction), df = Number(direction.df), dr = Number(direction.dr);
      expect([-1, 0, 1]).toContain(df); expect([-1, 0, 1]).toContain(dr); expect(df !== 0 || dr !== 0).toBe(true);
      if (event.sign === "gained") { expect(event.before).toBeNull(); expect(event.after).not.toBeNull(); }
      if (event.sign === "lost") { expect(event.before).not.toBeNull(); expect(event.after).toBeNull(); }
      if (event.sign === "membership_changed") {
        expect(event.before).not.toBeNull(); expect(event.after).not.toBeNull();
        expect(event.before!.blockers).not.toEqual(event.after!.blockers);
      }
      for (const [ray, board] of [[event.before, before], [event.after, after]] as const) {
        if (ray === null) continue;
        expect(piece(board.get(ray.slider.square)!, ray.slider.square)).toEqual(ray.slider);
        expect(["bishop", "rook", "queen"]).toContain(ray.slider.role);
        if (ray.slider.role === "bishop") expect(df !== 0 && dr !== 0).toBe(true);
        if (ray.slider.role === "rook") expect(df === 0 || dr === 0).toBe(true);
        const file = ray.slider.square.charCodeAt(0) - 97, rank = Number(ray.slider.square[1]) - 1;
        const path = [...strings(ray.strictInterior), ray.endpoint]; expect(path.length).toBeGreaterThan(0);
        for (const [index, square] of path.entries()) {
          expect(square.charCodeAt(0) - 97).toBe(file + df * (index + 1));
          expect(Number(square[1]) - 1).toBe(rank + dr * (index + 1));
        }
        const nextFile = file + df * (path.length + 1), nextRank = rank + dr * (path.length + 1);
        expect(nextFile < 0 || nextFile > 7 || nextRank < 0 || nextRank > 7).toBe(true);
        // Independent placement arithmetic over the literal path, including every occupant past
        // the first blocker and excluding only its explicitly declared endpoint.
        expect(ray.blockers).toEqual(ray.strictInterior.filter(square => board.has(square)).map(square => piece(board.get(square)!, square)));
      }
    }
  });
  it.each(SLIDER_LITERAL_SOURCE.cases.filter(row => row.arm !== "orientation"))("$proposition.case.id matches its independently complete population", async row => {
    const actual = await target(row.input), expected = row.proposition.expectation;
    if (expected.kind === "omits") expect(actual).toEqual([]);
    else {
      if (expected.kind !== "emits_exact") throw Error("Independent complete expectation required");
      expect(actual.map(({ sign, operands }) => ({ sign, operands }))).toEqual(expected.events);
    }
  });
  it.each(SLIDER_LITERAL_SOURCE.cases.filter(row => row.arm === "orientation"))("$proposition.case.id covers the full original ordered payload with absolute partners", async row => {
    const expected = row.proposition.expectation;
    if (expected.kind !== "mirrors") throw Error("Complete actual mirror required");
    const partner = byId.get(expected.partnerCase.id)!; expect(partner).toBeDefined();
    for (const input of [row.input, partner.input]) expect(SLIDER_LITERAL_SOURCE.cases.find(value => value.arm === "positive" && JSON.stringify(value.input) === JSON.stringify(input))?.proposition.expectation.kind).toBe("emits_exact");
    const left = await target(row.input), right = await target(partner.input);
    expect(() => compareSemanticMirror(left, right, expected.geometry, expected.operandRules, { source: row.input, partner: partner.input })).not.toThrow();
  });
});


describe("genuine pre-factory slider source faults", () => {
  const fieldFaults = [
    { kind: "root_role", name: "moving-root.white" }, { kind: "root_square", name: "moving-root.white" },
    { kind: "current_role", name: "moving-root.white" }, { kind: "current_square", name: "moving-root.white" },
    { kind: "endpoint", name: "blockers.white" }, { kind: "interior", name: "blockers.white" },
    { kind: "blocker_role", name: "blockers.white" }, { kind: "blocker_square", name: "blockers.white" }, { kind: "blocker_order", name: "blockers.white" },
    { kind: "direction", name: "blockers.white" }, { kind: "sign", name: "border.white" },
    { kind: "replacement", name: "replacement.white" }, { kind: "promotion_root", name: "promotion-queen.white" },
  ] as const;
  it.each(fieldFaults)("complete absolutes reject symmetric wrong $kind while full mirrors agree", async ({ kind, name }) => {
    const absolute = byId.get(`cited.literal-board.slider2.${name}.absolute`)!, mirror = byId.get(`cited.literal-board.slider2.${name}.color_and_vertical`)!;
    const expected = mirror.proposition.expectation;
    if (expected.kind !== "mirrors" || absolute.proposition.expectation.kind !== "emits_exact") throw Error("Genuine complete absolute/mirror pair required");
    const partner = byId.get(expected.partnerCase.id)!;
    faults.kind = kind;
    const left = await target(mirror.input), right = await target(partner.input);
    expect(left.map(({ sign, operands }) => ({ sign, operands }))).not.toEqual(absolute.proposition.expectation.events);
    expect(() => compareSemanticMirror(left, right, expected.geometry, expected.operandRules, { source: mirror.input, partner: partner.input })).not.toThrow();
    expect(faults.calls).toBe(2);
  });
  it.each(["replacement.white", "replacement.black", "capture-promotion.white", "capture-promotion.black"].flatMap(name => (["duplicate", "drop", "split", "reverse", "omit"] as const).map(kind => ({ name, kind }))))("$name rejects $kind complete populations", async ({ name, kind }) => {
    const row = byId.get(`cited.literal-board.slider2.${name}.absolute`)!;
    if (row.proposition.expectation.kind !== "emits_exact") throw Error("Complete actual source required");
    expect(row.proposition.expectation.events.length).toBeGreaterThan(1);
    faults.kind = kind;
    const actual = await target(row.input);
    expect(actual.map(({ sign, operands }) => ({ sign, operands }))).not.toEqual(row.proposition.expectation.events);
    expect(actual).toHaveLength(mutatedSize(row.proposition.expectation.events.length, kind)); expect(faults.calls).toBe(1);
  });
  it.each([
    { kind: "endpoint_inclusion", name: "endpoint.white" }, { kind: "endpoint_inclusion", name: "endpoint.black" },
    { kind: "incompatible", name: "incompatible.white" }, { kind: "incompatible", name: "incompatible.black" },
    { kind: "spurious", name: "quiet-rook.white" }, { kind: "spurious", name: "quiet-rook.black" },
  ] as const)("whole-family $name negative exposes $kind", async ({ kind, name }) => {
    const row = byId.get(`cited.literal-board.slider2.${name}.negative`)!;
    expect(row.proposition.expectation.kind).toBe("omits");
    faults.kind = kind; expect(await target(row.input)).toHaveLength(1); expect(faults.calls).toBe(1);
  });
});


describe("actual fixed slider authority and production runner", () => {
  it.each(actualCases)("$id binds its entire proposition and executes the genuine operation", async row => {
    const result = await executeSemanticValidationCase(row, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status, JSON.stringify(result.failure)).toBe("passed"); expect(result.invocations).toBe(row.arm === "orientation" ? 2 : 1);
  });
  it.each([
    { kind: "root_role", name: "moving-root.white" }, { kind: "root_square", name: "moving-root.white" },
    { kind: "current_role", name: "moving-root.white" }, { kind: "current_square", name: "moving-root.white" },
    { kind: "endpoint", name: "blockers.white" }, { kind: "interior", name: "blockers.white" },
    { kind: "blocker_role", name: "blockers.white" }, { kind: "blocker_square", name: "blockers.white" }, { kind: "blocker_order", name: "blockers.white" },
    { kind: "direction", name: "blockers.white" }, { kind: "sign", name: "border.white" },
    { kind: "replacement", name: "replacement.white" }, { kind: "promotion_root", name: "promotion-queen.white" },
  ] as const)("actual absolutes reject symmetric wrong $kind while mirrors still pass", async ({ kind, name }) => {
    const absolute = actualCaseMap.get(`cited.literal-board.slider2.${name}.absolute`)!, mirror = actualCaseMap.get(`cited.literal-board.slider2.${name}.color_and_vertical`)!;
    faults.kind = kind;
    const exact = await executeSemanticValidationCase(absolute, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(exact.status).toBe("failed"); expect(exact.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    const symmetric = await executeSemanticValidationCase(mirror, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(symmetric.status, JSON.stringify(symmetric.failure)).toBe("passed"); expect(faults.calls).toBe(2);
  });
  it.each(["replacement.white", "replacement.black", "capture-promotion.white", "capture-promotion.black"].flatMap(name => (["duplicate", "drop", "split", "reverse", "omit"] as const).map(kind => ({ name, kind }))))("$name actual runner rejects $kind population corruption", async ({ name, kind }) => {
    faults.kind = kind;
    const row = actualCaseMap.get(`cited.literal-board.slider2.${name}.absolute`)!;
    if (row.expectation.kind !== "emits_exact") throw Error("Complete exact population required");
    const result = await executeSemanticValidationCase(row, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.targetCount).toBe(mutatedSize(row.expectation.events.length, kind)); expect(faults.calls).toBe(1);
    expect(result.status).toBe("failed"); expect(result.failure?.code, JSON.stringify({ kind, resultKind: result.resultKind, targetCount: result.targetCount, failure: result.failure })).toBe(kind === "omit" ? "SEMANTIC_VALIDATION_POSITIVE_EMPTY" : "SEMANTIC_VALIDATION_EXPECTATION_UNMET");
  });
  it.each([
    { kind: "endpoint_inclusion", name: "endpoint.white" }, { kind: "endpoint_inclusion", name: "endpoint.black" },
    { kind: "incompatible", name: "incompatible.white" }, { kind: "incompatible", name: "incompatible.black" },
    { kind: "spurious", name: "quiet-rook.white" }, { kind: "spurious", name: "quiet-rook.black" },
  ] as const)("$name real omission refuses $kind source output", async ({ kind, name }) => {
    faults.kind = kind;
    const result = await executeSemanticValidationCase(actualCaseMap.get(`cited.literal-board.slider2.${name}.negative`)!, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
    expect(result.status).toBe("failed"); expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_NEGATIVE_EMITTED"); expect(result.targetCount).toBe(1); expect(faults.calls).toBe(1);
  });
  it("binds complete ordered populations to the retained source before any dispatch", async () => {
    const row = actualCaseMap.get("cited.literal-board.slider2.capture-promotion.white.absolute")!;
    if (row.expectation.kind !== "emits_exact") throw Error("Complete actual source required");
    for (const events of [[...row.expectation.events].reverse(), [...row.expectation.events, ...row.expectation.events], row.expectation.events.map(value => ({ ...value, operands: { ...value.operands, extra: true } }))]) {
      const changed = parseSemanticValidationCase({ ...row, expectation: { kind: "emits_exact", events } });
      const result = await executeSemanticValidationCase(changed, SEMANTIC_VALIDATION_RESOLVERS, actualCaseMap);
      expect(result.status).toBe("failed"); expect(result.invocations).toBe(0); expect(result.failure?.code).toBe("SEMANTIC_VALIDATION_AUTHORITY_INVALID"); expect(faults.calls).toBe(0);
    }
  });
});


it("retains a genuine latest edge value until a different real input replaces it", async () => {
  const row = byId.get("cited.literal-board.slider2.replacement.white.absolute")!;
  const original = await target(row.input); expect(original).toHaveLength(5); expect(faults.calls).toBe(1);
  faults.kind = "omit";
  expect(await target(row.input)).toEqual(original); expect(faults.calls).toBe(1);
  // Different actual legal input evicts the previous edge without disabling retention or clearing
  // internals. Only this recomputation is allowed to observe the newly armed wrong algorithm.
  const other = byId.get("cited.literal-board.slider2.border.white.absolute")!;
  expect(await target(other.input)).toEqual([]); expect(faults.calls).toBe(2);
  expect(await target(row.input)).toEqual([]); expect(faults.calls).toBe(3);
});


it("joins all116 literal slider cases while preserving759 predecessors and the distinct legacy meaning", () => {
  const canonical = (JSON.parse(readFileSync(new URL("./semantic-validation-cases.json", import.meta.url), "utf8")) as { cases: unknown[] }).cases.map(parseSemanticValidationCase);
  expect(canonical).toHaveLength(824);
  expect(SUBJECT_SAFE_RETIRED_CASES).toHaveLength(51);
  const historical = restoreSubjectSafeHistoricalCases(canonical as unknown as Record<string, unknown>[]);
  expect(historical).toHaveLength(875);
  const liveIds = new Set(canonical.map(row => row.id));
  expect(SUBJECT_SAFE_RETIRED_CASES.every(row => !liveIds.has(row.id as string))).toBe(true);
  expect(historical.filter(row => SUBJECT_SAFE_RETIRED_CASES.some(retired => retired.id === row.id))).toEqual(SUBJECT_SAFE_RETIRED_CASES);
  for (const original of SUBJECT_SAFE_REANCHORED_CASES) expect(historical.find(row => row.id === original.id)).toEqual(original);
  expect(canonical.filter(row => actualCaseMap.has(row.id))).toEqual(actualCases);
  expect(canonical.filter(row => !actualCaseMap.has(row.id))).toHaveLength(759 - SUBJECT_SAFE_RETIRED_CASES.length);
  const subject = SLIDER_LITERAL_SOURCE.cases[0]!.proposition.subject;
  const profile = SEMANTIC_VALIDATION_PROFILES.find(row => JSON.stringify(row.subject) === JSON.stringify(subject))!;
  for (const arm of ["positive", "semanticNegative", "orientation", "importedPopulation"] as const) expect(profile[arm].disposition).toBe("present");
  expect(semanticValidationVerdict(subject)?.verdict).toBe("passed");
  expect(semanticValidationVerdict({ kind: "event", projection: { id: subject.projection.id, version: 1 } })?.verdict).not.toBe("passed");
});
