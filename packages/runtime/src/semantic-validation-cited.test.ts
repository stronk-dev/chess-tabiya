// D3639: legal rule facts, not new strategic judgements. The independent GPL source
// excerpts are pinned in semantic-validation-cited-sources; every case executes the
// registered production operation, including nearby negatives that emit other events.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";
import { CAPTURE_DEPENDENT_NEGATIVE_FAMILIES } from "./semantic-validation-literal-sources.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const cases = raw.map(parseSemanticValidationCase);
const byId = new Map(cases.map(value => [value.id, value]));

const families = [
  { id: "capture", projection: "rules.transition.event.capture", operation: "runtime.semantic.transition_edge", examples: ["direct", "en-passant", "castle-negative"] },
  { id: "zeroing", projection: "rules.transition.event.clock_reset", operation: "runtime.semantic.transition_edge", examples: ["pawn", "capture", "castle-negative"] },
  { id: "check", projection: "rules.tactic.event.check", operation: "runtime.semantic.local_edge", examples: ["direct", "discovered", "blocked-negative"] },
  { id: "rights", projection: "rules.castling.event.rights_lost", operation: "runtime.semantic.local_edge", examples: ["rook", "king", "absent-negative"] },
] as const;
const rows = families.flatMap(family => family.examples.flatMap(example => ["white", "black"].map(color => ({ ...family, example, color, caseId: `cited.python-chess.${family.id}.${example}.${color}` }))));

describe("source-grounded literal event validation", () => {
  it.each(rows)("$caseId reaches exact production facts or a completed legal negative", async row => {
    const value = byId.get(row.caseId);
    expect(value, `missing canonical case ${row.caseId}`).toBeDefined();
    expect(value!.subject).toEqual({ kind: "event", projection: { id: row.projection, version: 1 } });
    expect(value!.operation).toEqual({ id: row.operation, version: 1 });
    const negative = row.example.endsWith("negative");
    expect(value!.arm).toBe(negative ? "semantic_negative" : "positive");
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    expect(receipt.targetCount).toBe(negative ? 0 : row.id === "rights" && row.example === "king" ? 2 : 1);
    if (negative) expect(receipt.otherCount).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS[value!.operation.id].invoke(value!.input as never);
    const targets = selectSemanticTargets(result, value!.subject);
    if (row.id === "rights" && row.example === "king") expect(targets.map(target => (observationEvidence(target).payload as { wing: string }).wing).sort()).toEqual(["kingside", "queenside"]);
    for (const target of targets) {
      const payload = observationEvidence(target).payload;
      if (row.id === "capture") expect(payload).toMatchObject({ mover: { color: row.color }, captured: { color: row.color === "white" ? "black" : "white", role: row.example === "en-passant" ? "pawn" : "knight" }, enPassant: row.example === "en-passant" });
      if (row.id === "zeroing") expect(payload).toMatchObject({ mover: { color: row.color }, detail: { pawnMove: row.example === "pawn", capture: row.example === "capture" } });
      if (row.id === "check") expect(payload).toMatchObject({ checkingPieces: [{ piece: { color: row.color, role: "rook" }, square: row.example === "discovered" ? row.color === "white" ? "e1" : "e8" : row.color === "white" ? "a8" : "a1" }], checkedKing: { piece: { color: row.color === "white" ? "black" : "white", role: "king" }, square: row.color === "white" ? "e8" : "e1" } });
      if (row.id === "rights") expect(payload).toMatchObject({ color: row.color, cause: row.example === "king" ? "king_moved" : "rook_moved" });
    }
  });

  it.each(families)("$id rejects borrowed inputs, subjects, expectations and operations before invocation", async family => {
    const positive = byId.get(`cited.python-chess.${family.id}.${family.examples[0]}.white`)!;
    const negative = byId.get(`cited.python-chess.${family.id}.${family.examples[2]}.white`)!;
    expect(positive).toBeDefined(); expect(negative).toBeDefined();
    for (const edit of [
      { input: negative.input },
      { subject: { kind: "event", projection: { id: "rules.transition.event.promotion", version: 1 } } },
      { arm: "semantic_negative", expectation: { kind: "omits" } },
      { operation: { id: "runtime.semantic.structural_edge", version: 1 } },
    ]) {
      const forged = parseSemanticValidationCase({ ...positive, ...edit });
      expect(await executeSemanticValidationCase(forged, SEMANTIC_VALIDATION_RESOLVERS, byId)).toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("closes only the four legal-negative cells; preserves all prior cases and orientation debt", () => {
    expect(rows).toHaveLength(24);
    expect(cases.filter(value => rows.some(row => row.caseId === value.id))).toHaveLength(24);
    const added = new Set(CAPTURE_DEPENDENT_NEGATIVE_FAMILIES.flatMap(family =>
      ["white", "black"].map(color => `cited.python-chess.${family.id}.castle-negative.${color}`)));
    expect(cases.filter(value => !rows.some(row => row.caseId === value.id) && !added.has(value.id))).toHaveLength(63);
    for (const family of families) {
      const subject = { kind: "event" as const, projection: { id: family.projection, version: 1 } };
      const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
      expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: [
        { id: `cited.python-chess.${family.id}.${family.examples[2]}.white` },
        { id: `cited.python-chess.${family.id}.${family.examples[2]}.black` },
      ] });
      expect(profile.orientation.disposition).toBe("required");
      expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    }
  });
});

describe("D3663 capture-dependent legal negatives", () => {
  const rows = CAPTURE_DEPENDENT_NEGATIVE_FAMILIES.flatMap(family =>
    ["white", "black"].map(color => ({ ...family, color,
      caseId: `cited.python-chess.${family.id}.castle-negative.${color}` })));
  it.each(rows)("$caseId completes the operation without removing or exchanging a piece", async row => {
    const value = byId.get(row.caseId);
    expect(value, `missing source-bound case ${row.caseId}`).toBeDefined();
    expect(value!.subject).toEqual({ kind: "event", projection: { id: row.projection, version: 1 } });
    expect(value!.operation).toEqual({ id: row.operation, version: 1 });
    expect(value!.arm).toBe("semantic_negative");
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1,
      targetCount: 0, failure: null });
    expect(receipt.otherCount).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS[value!.operation.id].invoke(value!.input as never);
    const castling = selectSemanticTargets(result, { kind: "event", projection: {
      id: "rules.transition.event.castled", version: 1 } });
    expect(castling).toHaveLength(1);
    expect(observationEvidence(castling[0]!).payload).toMatchObject({ mover: { color: row.color, role: "king" } });
  });
  it.each(CAPTURE_DEPENDENT_NEGATIVE_FAMILIES)("$id rejects borrowing a capture-positive or another event's authority", async family => {
    const value = byId.get(`cited.python-chess.${family.id}.castle-negative.white`)!;
    expect(value).toBeDefined();
    const capture = byId.get("cited.python-chess.capture.direct.white")!;
    for (const edit of [{ input: capture.input }, { subject: capture.subject },
      { arm: "positive", expectation: { kind: "emits", minimum: 1 } }]) {
      const forged = parseSemanticValidationCase({ ...value, ...edit });
      expect(await executeSemanticValidationCase(forged, SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });
  it("closes exactly three negative arms while retaining existing positives and orientation debt", () => {
    expect(rows).toHaveLength(6);
    expect(cases.filter(value => rows.some(row => row.caseId === value.id))).toHaveLength(6);
    for (const family of CAPTURE_DEPENDENT_NEGATIVE_FAMILIES) {
      const subject = { kind: "event" as const, projection: { id: family.projection, version: 1 } };
      const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
      expect(profile.positive.disposition).toBe("present");
      expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: [
        { id: `cited.python-chess.${family.id}.castle-negative.white` },
        { id: `cited.python-chess.${family.id}.castle-negative.black` },
      ] });
      expect(profile.orientation.disposition).toBe("required");
      expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    }
  });
});
