import { loadSemanticValidationCases } from "./semantic-validation-case-storage.js";
// Comparator/parser mechanics only. These controls never enter canonical cases or qualify sources.
import { afterEach, describe, expect, it, vi } from "vitest";
import * as semantic from "./semantic-evidence.js";
import { SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { canonicalSemanticEdge } from "./semantic-validation-operations.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import {
  compareSemanticMirror, mirrorSemanticFen, mirrorSemanticUci, parseSemanticValidationCase,
  parseSemanticValidationExpectation, semanticFactConstraintSha256,
  type SemanticMirrorGeometry, type SemanticMirrorOperandRule, type SemanticValidationCase,
} from "./semantic-validation.js";

const subject = { kind: "event" as const, projection: { id: "rules.structural.event.king_opposition", version: 2 } };
const mirror = (value: string, path: readonly string[], partnerPath = path, collection = "scalar") => ({
  kind: "mirrors", partnerCase: { kind: "case", id: "mechanics.partner", version: 1, subject, arm: "orientation" },
  geometry: "color_and_vertical", targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" },
  operandRules: [{ sourcePath: path, partnerPath, value, collection }],
});
const paths = [
  ["input_before_fen", ["before_fen"], "beforeFen"], ["input_before_fen", ["beforeFen"], "beforeFen"],
  ["input_after_fen", ["after_fen"], "afterFen"], ["input_after_fen", ["afterFen"], "afterFen"],
  ["input_move_uci", ["move_uci"], "moveUci"], ["input_move_uci", ["moveUci"], "moveUci"], ["input_move_uci", ["triggeringMove"], "moveUci"],
  ["input_before_fen", ["before", "fen"], "beforeFen"], ["input_after_fen", ["after", "fen"], "afterFen"],
  ["input_before_fen", ["fileChange", "beforeFen"], "beforeFen"], ["input_move_uci", ["fileChange", "moveUci"], "moveUci"], ["input_after_fen", ["fileChange", "afterFen"], "afterFen"],
] as const;
const nested = (path: readonly string[], value: unknown): Record<string, unknown> => path.slice(0, -1).reduceRight<Record<string, unknown>>((child, key) => ({ [key]: child }), { [path.at(-1)!]: value });
const observation = (operands: unknown) => [{ projection: subject.projection, sign: "gained", operands }];
const geometries: readonly SemanticMirrorGeometry[] = ["horizontal", "vertical", "color_and_vertical"];
afterEach(() => vi.restoreAllMocks());

describe("complete current-source mirror operands", () => {
  const source = canonicalSemanticEdge({ kind: "edge", beforeFen: "4k3/8/8/8/8/8/8/4K3 w - - 9 11", moveUci: "e1d1", afterFen: "4k3/8/8/8/8/8/8/3K4 b - - 10 11" });
  const partner = canonicalSemanticEdge({ kind: "edge", beforeFen: mirrorSemanticFen(source.beforeFen, "color_and_vertical"), moveUci: mirrorSemanticUci(source.moveUci, "color_and_vertical"), afterFen: mirrorSemanticFen(source.afterFen, "color_and_vertical") });
  it.each(paths)("retains exact same-side %s path %j", (value, path, field) => {
    const expectation = parseSemanticValidationExpectation(mirror(value, path), subject);
    if (expectation.kind !== "mirrors") throw Error("Wrong expectation");
    expect(() => compareSemanticMirror(observation(nested(path, source[field])), observation(nested(path, partner[field])), "color_and_vertical", expectation.operandRules, { source, partner })).not.toThrow();
    const corrupt = (text: string) => field === "moveUci" ? "e1e2" : text.replace(/ \d+ \d+$/u, " 99 99");
    // Even the same symmetric corruption on both sides must not launder input identity.
    for (const [left, right] of [[corrupt(source[field]), partner[field]], [source[field], corrupt(partner[field])], [corrupt(source[field]), corrupt(partner[field])]]) {
      expect(() => compareSemanticMirror(observation(nested(path, left)), observation(nested(path, right)), "color_and_vertical", expectation.operandRules, { source, partner })).toThrow(/same-side input field/u);
    }
    expect(() => parseSemanticValidationExpectation(mirror(value, path, path, "ordered"), subject)).toThrow();
    const duplicate = { ...mirror(value, path), operandRules: [...expectation.operandRules, ...expectation.operandRules] };
    expect(() => parseSemanticValidationExpectation(duplicate, subject)).toThrow(/duplicated/u);
  });
  it.each([
    ["input_before_fen", ["before", "fen", "nested"]], ["input_before_fen", ["before", "*"]],
    ["input_before_fen", ["other", "fen"]], ["input_move_uci", ["fileChange", "beforeFen"]],
    ["input_after_fen", ["fileChange", "after_fen"]], ["input_before_fen", ["0", "beforeFen"]],
  ])("refuses unregistered %s path %j", (value, path) => {
    expect(() => parseSemanticValidationExpectation(mirror(value as string, path as string[]), subject)).toThrow();
  });
  it("refuses cross-root mappings and uncovered nested fields", () => {
    expect(() => parseSemanticValidationExpectation(mirror("input_before_fen", ["before", "fen"], ["fileChange", "beforeFen"]), subject)).toThrow();
    const expectation = parseSemanticValidationExpectation(mirror("input_before_fen", ["before", "fen"]), subject);
    if (expectation.kind !== "mirrors") throw Error("Wrong expectation");
    expect(() => compareSemanticMirror(observation({ before: { fen: source.beforeFen, ignored: true } }), observation({ before: { fen: partner.beforeFen, ignored: true } }), "color_and_vertical", expectation.operandRules, { source, partner })).toThrow(/covered by 0/u);
  });

  for (const geometry of geometries) {
    it.each([..."abcdefgh"])(`${geometry} validates file %s`, file => {
      const expected = geometry === "horizontal" ? "hgfedcba"["abcdefgh".indexOf(file)] : file;
      const rules: SemanticMirrorOperandRule[] = [{ sourcePath: ["file"], partnerPath: ["file"], value: "file", collection: "scalar" }];
      expect(() => compareSemanticMirror(observation({ file }), observation({ file: expected }), geometry, rules)).not.toThrow();
      expect(() => compareSemanticMirror(observation({ file }), observation({ file: expected === "a" ? "b" : "a" }), geometry, rules)).toThrow();
    });
    it.each(["open", "closed", "half_open_white", "half_open_black"])(`${geometry} validates state %s`, state => {
      const expected = geometry === "color_and_vertical" && state.startsWith("half_open_") ? state === "half_open_white" ? "half_open_black" : "half_open_white" : state;
      const rules: SemanticMirrorOperandRule[] = [{ sourcePath: ["state"], partnerPath: ["state"], value: "file_state", collection: "scalar" }];
      expect(() => compareSemanticMirror(observation({ state }), observation({ state: expected }), geometry, rules)).not.toThrow();
      expect(() => compareSemanticMirror(observation({ state }), observation({ state: expected === "open" ? "closed" : "open" }), geometry, rules)).toThrow();
    });
    it.each([null, 0, false, "", "A", "i", "aa", "half_open", "half_open_red"])(`${geometry} rejects invalid typed domain %s`, invalid => {
      for (const value of ["file", "file_state"] as const) expect(() => compareSemanticMirror(observation({ item: invalid }), observation({ item: invalid }), geometry,
        [{ sourcePath: ["item"], partnerPath: ["item"], value, collection: "scalar" }])).toThrow();
    });
  }
});

describe("nonempty complete positive event expectations", () => {
  const event = { sign: "gained", operands: { nested: [null, [], false, 0, { square: "a1" }], empty: {} } };
  it("copies/freezes canonical values and retains array order, false, zero and null", () => {
    const result = parseSemanticValidationExpectation({ kind: "emits_exact", events: [event] }, subject);
    expect(result).toEqual({ kind: "emits_exact", events: [event] });
    expect(Object.isFrozen(result)).toBe(true);
    if (result.kind !== "emits_exact") throw Error("Wrong expectation");
    expect(result.events[0]!.operands).not.toBe(event.operands);
    expect(Object.isFrozen(result.events[0]!.operands.nested)).toBe(true);
  });
  it.each([
    { kind: "emits_exact", events: [] }, { kind: "emits_exact", events: [event], extra: true },
    { kind: "emits_exact", events: [{ ...event, projection: subject.projection }] },
    { kind: "emits_exact", events: [{ ...event, sign: "invented" }] },
    ...[undefined, NaN, Infinity, 1n, new Date(), () => 1, [, 1], { get value() { return 1; } }].map(value => ({ kind: "emits_exact", events: [{ sign: "state", operands: { value } }] })),
  ])("refuses malformed exact population %#", value => {
    expect(() => parseSemanticValidationExpectation(value, subject)).toThrow();
  });
  it("rejects array getters, hidden/extra fields, inherited iterators and negative zero without executing caller code", () => {
    let calls = 0;
    const accessor: unknown[] = [1]; Object.defineProperty(accessor, "0", { enumerable: true, get() { calls++; return 1; } });
    const hidden: unknown[] = [1]; Object.defineProperty(hidden, "hidden", { value: 1 });
    const extra = [1]; Object.assign(extra, { extra: 2 });
    const sparseExtra = new Array(1); Object.assign(sparseExtra, { other: 1 });
    const inherited = [1]; Object.setPrototypeOf(inherited, { [Symbol.iterator]() { calls++; return [1][Symbol.iterator](); } });
    const ownIterator = [1]; Object.defineProperty(ownIterator, Symbol.iterator, { value() { calls++; return [1][Symbol.iterator](); } });
    for (const value of [accessor, hidden, extra, sparseExtra, inherited, ownIterator, -0, { nested: [-0] }]) {
      expect(() => parseSemanticValidationExpectation({ kind: "emits_exact", events: [{ sign: "state", operands: { value } }] }, subject)).toThrow();
      expect(calls).toBe(0);
    }
    expect(() => parseSemanticValidationExpectation({ kind: "emits_exact", events: [{ sign: "state", operands: { value: [0, null, false, []] } }] }, subject)).not.toThrow();
  });

  it("captures outer events and rows as plain data before mapping without invoking getters or methods", () => {
    let calls = 0;
    const getter = [event]; Object.defineProperty(getter, "0", { enumerable: true, get() { calls++; return event; } });
    const ownMap = [event]; Object.defineProperty(ownMap, "map", { enumerable: true, value() { calls++; return [event]; } });
    const inherited = [event]; Object.setPrototypeOf(inherited, { map() { calls++; return [event]; }, [Symbol.iterator]() { calls++; return [event][Symbol.iterator](); } });
    const hidden = [event]; Object.defineProperty(hidden, "hidden", { value: true });
    const sparseExtra = new Array(1); Object.assign(sparseExtra, { extra: event });
    const row = { ...event }; Object.defineProperty(row, "sign", { enumerable: true, get() { calls++; return "gained"; } });
    for (const events of [getter, ownMap, inherited, hidden, new Array(1), sparseExtra, [row]]) {
      expect(() => parseSemanticValidationExpectation({ kind: "emits_exact", events }, subject)).toThrow();
      expect(calls).toBe(0);
    }
    const kindGetter = { events: [event] };
    Object.defineProperty(kindGetter, "kind", { enumerable: true, get() { calls++; return "emits_exact"; } });
    expect(() => parseSemanticValidationExpectation(kindGetter, subject)).toThrow(); expect(calls).toBe(0);
    const expectation = { kind: "emits_exact", events: [event] };
    Object.defineProperty(expectation, "events", { enumerable: true, get() { calls++; return [event]; } });
    expect(() => parseSemanticValidationExpectation(expectation, subject)).toThrow(); expect(calls).toBe(0);
    expect(() => parseSemanticValidationExpectation({ kind: "emits_exact", events: Object.freeze([Object.freeze(event)]) }, subject)).not.toThrow();
  });

  it("refuses non-event exact expectations and positive-to-other-arm laundering", () => {
    expect(() => parseSemanticValidationExpectation({ kind: "emits_exact", events: [event] }, { ...subject, kind: "reading" })).toThrow();
    const row = loadSemanticValidationCases().cases[0];
    for (const arm of ["semantic_negative", "counterfactual", "external_label"]) expect(() => parseSemanticValidationCase({ ...row, arm, expectation: { kind: "emits_exact", events: [event] } })).toThrow();
  });

  it("rejects extra/missing/duplicate/reordered/changed real targets without changing old witness behavior", async () => {
    const cases = (loadSemanticValidationCases()).cases.map(parseSemanticValidationCase);
    const old = cases.find(value => value.arm === "positive" && value.subject.projection.id === "derived.material.event.role_asymmetry" && value.subject.projection.version === 2)!;
    const original = semantic.localSemanticEventClosure;
    if (old.input.kind !== "edge") throw Error("An edge is required");
    const closure = original(old.input.beforeFen, old.input.moveUci, old.input.afterFen);
    const targets = closure.events.filter(value => value.projection.id === old.subject.projection.id && value.projection.version === old.subject.projection.version);
    expect(targets.length).toBeGreaterThan(0);
    // Mechanics-only authority stub: not retained in any canonical source/case/profile/store.
    // Real canonical authority below must reject strengthening the old witness proposition.
    const resolvers = { ...SEMANTIC_VALIDATION_RESOLVERS, resolveProposition: (value: SemanticValidationCase) => ({ subject: value.subject, case: { id: value.id, version: 1 as const }, factConstraint: [], factConstraintSha256: semanticFactConstraintSha256([]), expectation: value.expectation }) };
    const exact = parseSemanticValidationCase({ ...old, expectation: { kind: "emits_exact", events: targets.map(value => ({ sign: value.sign, operands: value.operands })) } });
    const map = new Map(cases.map(value => [value.id, value]));
    expect((await executeSemanticValidationCase(exact, SEMANTIC_VALIDATION_RESOLVERS, map)).status).toBe("failed");
    expect((await executeSemanticValidationCase(exact, resolvers, map)).status).toBe("passed");
    const spy = vi.spyOn(semantic, "localSemanticEventClosure").mockImplementation((...args) => { const result = original(...args); return { ...result, events: [...result.events, result.events.find(value => value.projection.id === old.subject.projection.id && value.projection.version === old.subject.projection.version)!] }; });
    expect((await executeSemanticValidationCase(old, SEMANTIC_VALIDATION_RESOLVERS, map)).status).toBe("passed");
    expect((await executeSemanticValidationCase(exact, resolvers, map)).failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    spy.mockRestore();
    const operandRecord = targets[0]!.operands as Record<string, unknown>;
    const wrongSign = parseSemanticValidationCase({ ...old, expectation: { kind: "emits_exact", events: targets.map(value => ({ sign: value.sign === "gained" ? "lost" : "gained", operands: value.operands })) } });
    expect((await executeSemanticValidationCase(wrongSign, resolvers, map)).failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    for (const replacement of [null, false, 0, [], {}]) {
      const changed = parseSemanticValidationCase({ ...old, expectation: { kind: "emits_exact", events: targets.map(value => ({ sign: value.sign, operands: { ...operandRecord, before: replacement } })) } });
      expect((await executeSemanticValidationCase(changed, resolvers, map)).failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    }
    const secondCase = cases.find(value => value.id !== old.id && value.arm === "positive" && value.input.kind === "edge" && value.subject.projection.id === old.subject.projection.id && value.subject.projection.version === old.subject.projection.version)!;
    if (secondCase?.input.kind !== "edge") throw Error("A distinct genuine target is required");
    const second = original(secondCase.input.beforeFen, secondCase.input.moveUci, secondCase.input.afterFen).events.find(value => value.projection.id === old.subject.projection.id && value.projection.version === old.subject.projection.version)!;
    expect(second.operands).not.toEqual(targets[0]!.operands);
    const pair = [targets[0]!, second];
    const pairCase = parseSemanticValidationCase({ ...old, expectation: { kind: "emits_exact", events: pair.map(value => ({ sign: value.sign, operands: value.operands })) } });
    // Deliberately mixed-edge result, only to isolate complete-array comparator behavior.
    const pairSpy = vi.spyOn(semantic, "localSemanticEventClosure").mockImplementation((...args) => {
      const result = original(...args);
      return { ...result, events: [...result.events.filter(value => value.projection.id !== old.subject.projection.id || value.projection.version !== old.subject.projection.version), ...pair] };
    });
    expect((await executeSemanticValidationCase(pairCase, resolvers, map)).status).toBe("passed");
    const mutations = [pair.slice(0, 1), [...pair, pair[0]!], [...pair].reverse()];
    for (const values of mutations) {
      pairSpy.mockImplementation((...args) => { const result = original(...args); return { ...result, events: [...result.events.filter(value => value.projection.id !== old.subject.projection.id || value.projection.version !== old.subject.projection.version), ...values] }; });
      expect((await executeSemanticValidationCase(pairCase, resolvers, map)).failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    }
    pairSpy.mockRestore();
    for (const events of [[...targets, ...targets], [...targets].map(value => ({ ...value, operands: { ...value.operands as object, extra: true } }))]) {
      const changed = parseSemanticValidationCase({ ...old, expectation: { kind: "emits_exact", events: events.map(value => ({ sign: value.sign, operands: value.operands })) } });
      // Empty positives refuse at parse time (tested above); use only nonempty changed expectations.
      expect((await executeSemanticValidationCase(changed, resolvers, map)).status).toBe("failed");
    }
  });
});
