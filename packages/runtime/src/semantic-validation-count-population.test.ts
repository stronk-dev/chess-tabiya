// Independent source qualification, never selected top-two hints or recorded emitter output.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceDigest, evidenceForConsumer } from "./evidence-contract.js";
import * as semantic from "./semantic-evidence.js";
import type { SubjectOutcomePayload } from "./semantic-subject-types.js";
import { COUNT_LITERAL_POPULATIONS, COUNT_POPULATION_LITERAL_SOURCE, countPopulationInput, literalCountEvents } from "./semantic-validation-count-population-sources.js";
import { SEMANTIC_VALIDATION_RESOLVERS, sha256Text } from "./semantic-validation-authorities.js";
import { canonicalSemanticEdge, SEMANTIC_VALIDATION_OPERATIONS } from "./semantic-validation-operations.js";
import { admitValidatedSemanticInstance, SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase } from "./semantic-validation-runner.js";
import { compareSemanticMirror, parseSemanticValidationCase, semanticFactConstraintSha256,
  type SemanticMirrorGeometry, type SemanticMirrorOperandRule, type SemanticValidationCaseFor } from "./semantic-validation.js";

const source = COUNT_POPULATION_LITERAL_SOURCE;
type Mutable<T> = T extends readonly (infer U)[] ? Mutable<U>[] : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
const faults = vi.hoisted(() => ({ kind: "none", calls: 0 }));
// Fault the real calculation BEFORE the sole factory mints its normal values. Original
// inputs, source receipt and population stay genuine: these are semantic mistakes that
// authentic value receipts alone cannot diagnose, not copied/forged final evidence.
vi.mock("./semantic-subject-outcomes.js", async importOriginal => {
  const original = await importOriginal<typeof import("./semantic-subject-outcomes.js")>();
  return { ...original, computeSubjectOutcomes: ((...args: Parameters<typeof original.computeSubjectOutcomes>) => {
    const result = original.computeSubjectOutcomes(...args);
    if (args[0] !== "piece_count" || faults.kind === "none" || result.kind !== "available") return result;
    faults.calls++;
    const payloads = structuredClone(result.payloads) as Mutable<SubjectOutcomePayload<"piece_count">>[];
    if (faults.kind === "invent-quiet" && payloads.length === 0) {
      const first = result.population.subjects[0]!;
      const alternatives = structuredClone(first.alternatives) as Mutable<SubjectOutcomePayload<"piece_count">>["alternatives"];
      payloads.push({ beforeFen: result.population.beforeFen, afterFen: result.population.afterFen, moveUci: result.population.moveUci,
        actor: "white", family: "piece_count", subject: { kind: "piece_count", color: "white", role: "pawn" }, parameters: {},
        root: { kind: "present", value: 1 }, played: { kind: "present", value: 1 }, alternativeRelation: "increase",
        alternatives, supportingMoves: [alternatives[0]!.moveUci], legalAlternatives: alternatives.length, alternativesWithOutcome: 1 });
    }
    for (const payload of payloads) {
      if (faults.kind === "color") payload.subject.color = payload.subject.color === "white" ? "black" : "white";
      if (faults.kind === "role") payload.subject.role = payload.subject.role === "pawn" ? "bishop" : "pawn";
      if (faults.kind === "root") payload.root.value++;
      if (faults.kind === "played") payload.played.value++;
      if (faults.kind === "symmetric-count") {
        payload.root.value++; payload.played.value++;
        for (const alternative of payload.alternatives) alternative.state.value++;
      }
      if (faults.kind === "relation") payload.alternativeRelation = payload.alternativeRelation === "equal" ? "increase" : "equal";
      if (faults.kind === "state") payload.alternatives[0]!.state.value++;
      if (faults.kind === "crossed") [payload.alternatives[0]!.moveUci, payload.alternatives[1]!.moveUci] = [payload.alternatives[1]!.moveUci, payload.alternatives[0]!.moveUci];
      if (faults.kind === "support") payload.supportingMoves[0] = payload.alternatives.find(row => !payload.supportingMoves.includes(row.moveUci))!.moveUci;
      if (faults.kind === "denominator") payload.legalAlternatives++;
      if (faults.kind === "numerator") payload.alternativesWithOutcome++;
      if (faults.kind === "before") payload.beforeFen = payload.beforeFen.replace(/ \d+ \d+$/u, " 9 9");
      if (faults.kind === "after") payload.afterFen = payload.afterFen.replace(/ \d+ \d+$/u, " 9 9");
      if (faults.kind === "move") payload.moveUci = payload.alternatives[0]!.moveUci;
    }
    if (faults.kind === "duplicate") payloads.push(structuredClone(payloads[0]!));
    if (faults.kind === "omit") payloads.pop();
    if (faults.kind === "reverse") payloads.reverse();
    return { ...result, payloads } as typeof result;
  }) as typeof original.computeSubjectOutcomes };
});
const cases = source.cases.map(row => parseSemanticValidationCase({
  id: row.proposition.case.id, version: 1, subject: row.proposition.subject, arm: row.arm,
  operation: source.operation, input: row.input, expectation: row.proposition.expectation,
  authority: { kind: "cited_proposition", sourceId: source.sourceId, sourceRevision: source.sourceRevision, licence: source.licence,
    span: { start: 0, end: source.text.length, textSha256: sha256Text(source.text) },
    propositionSha256: evidenceDigest({ ...row.proposition, factConstraintSha256: semanticFactConstraintSha256(row.proposition.factConstraint) }) },
})) as readonly SemanticValidationCaseFor<"runtime.semantic.subject_outcomes">[];
const registry = new Map(cases.map(value => [value.id, value]));
afterEach(() => { faults.kind = "none"; faults.calls = 0; vi.restoreAllMocks(); });

describe("independent literal full-population piece counts", () => {
  it("binds each exact literal case to the canonical registry and the four current profile arms", () => {
    const canonical = JSON.parse(readFileSync(new URL("./semantic-validation-cases.json", import.meta.url), "utf8")).cases.map(parseSemanticValidationCase);
    for (const value of cases) expect(canonical.filter((row: { id: string }) => row.id === value.id)).toEqual([value]);
    const profile = SEMANTIC_VALIDATION_PROFILES.find(row => row.subject.projection.id === "derived.semantic_avoidance.piece_count" && row.subject.projection.version === 2)!;
    for (const [cell, arm] of [[profile.positive, "positive"], [profile.semanticNegative, "semantic_negative"],
      [profile.orientation, "orientation"], [profile.counterfactual, "counterfactual"]] as const) {
      expect(cell.disposition).toBe("present");
      if (cell.disposition !== "present") throw Error("Executed case arm required");
      expect(cell.refs.map(ref => ref.id).sort()).toEqual(cases.filter(value => value.arm === arm).map(value => value.id).sort());
    }
    expect(semanticValidationVerdict(profile.subject)?.verdict).toBe("passed");
  });

  it("admits the genuinely qualified original value while ordinary support bindings remain held", async () => {
    const row = COUNT_LITERAL_POPULATIONS[0]!, input = countPopulationInput(row, row.plays[0]!);
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.subject_outcomes"].invoke(input);
    if (result.kind !== "completed") throw Error("Actual complete source required");
    expect(result.observations).toHaveLength(1);
    const event = result.observations[0]!;
    if (event.kind !== "event") throw Error("Original semantic event required");
    expect(admitValidatedSemanticInstance("event", event.item.evidence).kind).toBe("admitted");
    for (const consumer of ["module.postcommit_nudge", "module.review_map"]) {
      expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: consumer, version: 2 }, [event.item.evidence]).items).toEqual([]);
    }
  });

  it.each(COUNT_LITERAL_POPULATIONS)("$id has every exact legal child, not a candidate-selected subset", row => {
    const input = countPopulationInput(row, row.plays[0]!);
    for (const edge of input.population.alternatives) expect(canonicalSemanticEdge(edge)).toEqual(edge);
    // The actual operation's shared complete-set check also enforces legal-set cardinality,
    // promotion membership and root/played/digest. No collector supplies expected operands.
    expect(input.population.alternatives.map(edge => edge.moveUci)).toEqual([...new Set(row.edges.map(edge => edge[0]))].sort());
    const expected = literalCountEvents(row, row.plays[0]!);
    if (row.id.startsWith("quiet")) expect(expected).toEqual([]);
    else expect(expected.length).toBeGreaterThan(0);
    if (row.id.startsWith("promotion")) {
      expect(expected).toHaveLength(5);
      expect(expected.map(event => (event.operands.subject as { role: string }).role)).toEqual(["pawn", "knight", "bishop", "rook", "queen"]);
      expect(input.population.alternatives.filter(edge => edge.moveUci.length === 5).map(edge => edge.moveUci.at(-1))).toEqual(["b", "n", "q", "r"]);
    }
  });

  it.each(cases)("$id executes its fixed authority and actual complete source", async value => {
    const receipt = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(receipt.failure).toBeNull(); expect(receipt.status).toBe("passed");
    expect(receipt.invocations).toBe(value.arm === "orientation" ? 2 : 1);
    if (value.input.kind !== "subject_outcomes") throw Error("Original complete source input required");
    const input = value.input;
    const row = COUNT_LITERAL_POPULATIONS.find(row => row.root === input.population.rootFen)!;
    expect(receipt.targetCount).toBe(literalCountEvents(row, input.population.played.moveUci).length);
  });

  it("D4199 traverses original nonedge cases instead of rejecting after real source dispatch", async () => {
    const value = cases.find(row => row.arm === "orientation")!;
    expect(value.input.kind).toBe("subject_outcomes");
    const receipt = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(receipt).toMatchObject({ status: "passed", invocations: 2, targetCount: 1, failure: null });
  });

  it("rejects altered original legal populations before actual source dispatch", async () => {
    const value = cases.find(row => row.arm === "orientation")!;
    if (value.input.kind !== "subject_outcomes") throw Error("Complete original input required");
    const pop = value.input.population, alternatives = pop.alternatives;
    const invoke = vi.spyOn(semantic, "subjectOutcomeSemanticEvents");
    for (const population of [
      { ...pop, alternatives: alternatives.slice(1) }, { ...pop, alternatives: [...alternatives, alternatives[0]!] },
      { ...pop, legalSetDigest: "0".repeat(64) },
      { ...pop, rootFen: pop.rootFen.replace("0 1", "0 2") },
      { ...pop, played: { ...pop.played, afterFen: pop.played.afterFen.replace("1 1", "9 1") } },
      { ...pop, alternatives: alternatives.map((edge, i) => i === 0 ? { ...edge, afterFen: pop.played.afterFen } : edge) },
    ]) {
      const receipt = await executeSemanticValidationCase({ ...value, input: { ...value.input, population } }, SEMANTIC_VALIDATION_RESOLVERS, registry);
      expect(receipt.status).toBe("failed"); expect(receipt.invocations).toBe(0); expect(invoke).not.toHaveBeenCalled();
    }
  });

  it("rejects edited complete absolute expectations and input/proposition substitutions before dispatch", async () => {
    const value = cases.find(row => row.arm === "positive")!;
    if (value.expectation.kind !== "emits_exact") throw Error("Full literal expectation required");
    const invoke = vi.spyOn(semantic, "subjectOutcomeSemanticEvents");
    const events = value.expectation.events;
    const receipt = await executeSemanticValidationCase({ ...value, expectation: { kind: "emits_exact", events: [...events, ...events] } }, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(receipt).toMatchObject({ status: "failed", invocations: 0 }); expect(invoke).not.toHaveBeenCalled();
  });

  it("refuses crossed subject/family/authority and partner identities with zero source calls", async () => {
    const value = cases.find(row => row.arm === "orientation")!;
    if (value.input.kind !== "subject_outcomes" || value.authority.kind !== "cited_proposition" || value.expectation.kind !== "mirrors") throw Error("Original cited source mirror required");
    const invoke = vi.spyOn(semantic, "subjectOutcomeSemanticEvents");
    for (const broken of [
      { ...value, input: { ...value.input, family: "pawn_islands" as const } },
      { ...value, subject: { kind: "event" as const, projection: { id: "derived.semantic_avoidance.pawn_islands", version: 2 } } },
      { ...value, authority: { ...value.authority, propositionSha256: "0".repeat(64) } },
      { ...value, authority: { ...value.authority, sourceRevision: "no-such-source" } },
      { ...value, expectation: { ...value.expectation, partnerCase: { ...value.expectation.partnerCase, id: "missing.partner" } } },
    ]) {
      const receipt = await executeSemanticValidationCase(broken, SEMANTIC_VALIDATION_RESOLVERS, registry);
      expect(receipt).toMatchObject({ status: "failed", invocations: 0 }); expect(invoke).not.toHaveBeenCalled();
    }
    const partner = registry.get(value.expectation.partnerCase.id)!;
    const crossed = new Map(registry).set(partner.id, { ...partner, subject: { ...partner.subject, projection: { id: "derived.semantic_avoidance.pawn_islands", version: 2 } } });
    expect(await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, crossed)).toMatchObject({ status: "failed", invocations: 0 });
    expect(invoke).not.toHaveBeenCalled();
  });

  it.each(["color", "role", "root", "played", "state", "relation", "crossed", "support", "denominator", "numerator", "duplicate", "omit", "reverse"])("rejects genuine pre-mint %s mistakes against complete independent absolutes", async kind => {
    faults.kind = kind;
    const value = cases.find(row => row.arm === "positive" && row.id.includes("promotion.white.0."))!;
    const receipt = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1);
    expect(receipt.status).toBe("failed"); expect(receipt.invocations).toBe(1);
    expect(receipt.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
  });

  it.each(["symmetric-count", "role"])("%s can fool both mirrors but cannot fool independent absolute partners", async kind => {
    faults.kind = kind;
    const mirror = cases.find(row => row.arm === "orientation" && row.id.includes("pawn.white.0."))!;
    const mirrored = await executeSemanticValidationCase(mirror, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(mirrored).toMatchObject({ status: "passed", invocations: 2 });
    for (const side of ["white", "black"]) {
      const absolute = cases.find(row => row.arm === "positive" && row.id.includes(`pawn.${side}.0.`))!;
      const receipt = await executeSemanticValidationCase(absolute, SEMANTIC_VALIDATION_RESOLVERS, registry);
      expect(receipt.status).toBe("failed"); expect(receipt.failure?.code).toBe("SEMANTIC_VALIDATION_EXPECTATION_UNMET");
    }
    expect(faults.calls).toBe(4);
  });

  it.each(["before", "move", "after"])("rejects same-side %s corruption at the original event edge before second dispatch", async kind => {
    faults.kind = kind;
    const value = cases.find(row => row.arm === "orientation" && row.id.includes("pawn.white.0."))!;
    const receipt = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(receipt.status).toBe("failed"); expect(receipt.invocations).toBe(1);
    expect(receipt.failure?.code).toBe("SEMANTIC_VALIDATION_EXECUTION_FAILED");
    expect(receipt.failure?.message).toMatch(/subject outcome differs from its exact original played edge/u);
    expect(faults.calls).toBe(1);
  });

  it("rejects a genuinely minted invented event on an available nonforced quiet population", async () => {
    faults.kind = "invent-quiet";
    const value = cases.find(row => row.arm === "semantic_negative" && row.id.includes("quiet.white"))!;
    const receipt = await executeSemanticValidationCase(value, SEMANTIC_VALIDATION_RESOLVERS, registry);
    expect(faults.calls).toBe(1); expect(receipt).toMatchObject({ status: "failed", invocations: 1, targetCount: 1 });
    expect(receipt.failure?.code).toBe("SEMANTIC_VALIDATION_NEGATIVE_EMITTED");
  });
});

const projection = { id: "derived.semantic_avoidance.piece_count", version: 2 };
const observation = (value: unknown) => [{ projection, sign: "avoided", operands: { move: value } }];
const rule: SemanticMirrorOperandRule = { sourcePath: ["move"], partnerPath: ["move"], value: "uci", collection: "scalar" };
describe("D4199 closed UCI leaf geometry", () => {
  for (const [geometry, from, to] of [
    ["horizontal", "a7b8", "h7g8"], ["vertical", "a7b8", "a2b1"], ["color_and_vertical", "a7b8", "a2b1"],
  ] as const) {
    it.each(["", "q", "r", "b", "n"])(`${geometry} preserves literal suffix %s`, suffix => {
      expect(() => compareSemanticMirror(observation(from + suffix), observation(to + suffix), geometry, [rule])).not.toThrow();
      expect(() => compareSemanticMirror(observation(from + suffix), observation(to + (suffix === "q" ? "r" : "q")), geometry, [rule])).toThrow();
    });
  }
  it.each([null, undefined, 0, false, "", "0000", "e2e2", "e2e4p", "e2e4k", "e2e4qq", "e9e4", "E2E4", "N@e4", "e2e4Q"])("rejects malformed token %s on either side", token => {
    for (const geometry of ["horizontal", "vertical", "color_and_vertical"] as readonly SemanticMirrorGeometry[]) {
      for (const [left, right] of [[token, "e7e5"], ["e2e4", token], [token, token]])
        expect(() => compareSemanticMirror(observation(left), observation(right), geometry, [rule])).toThrow(/uci|leaf/u);
    }
  });
});
