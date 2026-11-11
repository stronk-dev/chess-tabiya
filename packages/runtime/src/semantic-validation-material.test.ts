import { loadSemanticValidationCases } from "./semantic-validation-case-storage.js";
// D3949: exact current-subject authority through the production operation. Pinned source
// membership plus neutral count arithmetic, not material advantage or move quality.
import { resolve } from "node:path";
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { MATERIAL_V2_CITED_SOURCE } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";
import { RETIRED_SEMANTIC_VALIDATION_CASES } from "./testing/subject-safe-retired-semantic-cases.js";

const raw = (loadSemanticValidationCases()).cases;
const cases = raw.map(parseSemanticValidationCase), byId = new Map(cases.map(value => [value.id, value]));
const source = MATERIAL_V2_CITED_SOURCE, roles = ["pawn", "knight", "bishop", "rook", "queen"] as const;
const position = (fen: string) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();

function counts(fen: string) {
  const board = position(fen).board;
  const colors = Object.fromEntries((["white", "black"] as const).map(color => [color,
    Object.fromEntries(roles.map(role => [role, board[role].intersect(board[color]).size()]))]));
  const vector = Object.fromEntries(roles.map(role => [role, Math.abs(colors.white![role]! - colors.black![role]!)]));
  return { colors, vector, magnitude: Object.values(vector).reduce((sum, value) => sum + value, 0) };
}

describe("D3949 current material canonical validation", () => {
  it.each(source.cases)("$proposition.case.id executes the current production edge with independent board counts", async row => {
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing new canonical case ${row.proposition.case.id}`).toBeDefined();
    expect(value!.subject).toEqual({ kind: "event", projection: { id: "derived.material.event.role_asymmetry", version: 2 } });
    expect(value!.version).toBe(1); // New case identity, never an invented case-version dialect.
    expect(value!.input).toEqual(row.input);
    const beforePosition = position(row.input.beforeFen), move = normalizeMove(beforePosition, parseUci(row.input.moveUci)!);
    expect(beforePosition.isLegal(move)).toBe(true);
    beforePosition.play(move);
    expect(makeFen(beforePosition.toSetup())).toBe(row.input.afterFen);
    const before = counts(row.input.beforeFen), after = counts(row.input.afterFen);
    const changedRoles = roles.filter(role => before.vector[role] !== after.vector[role]);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke(row.input);
    expect(result.kind).toBe("completed");
    const targets = selectSemanticTargets(result, value!.subject);
    if (row.arm === "semantic_negative") {
      expect(changedRoles).toEqual([]);
      expect(after).toEqual(before);
      expect(targets).toHaveLength(0);
      expect(receipt.otherCount).toBeGreaterThan(0);
      if (value!.id.includes("asymmetric-negative")) expect(before.magnitude).toBe(2);
      return;
    }
    expect(targets).toHaveLength(1);
    const payload = observationEvidence(targets[0]!).payload as { sourceEvents: { family: string; mover: { color: string; role: string }; captured?: { color: string; role: string }; detail?: { promotionRole?: string } }[] };
    expect(payload).toMatchObject({ before: { vector: before.vector, magnitude: before.magnitude },
      after: { vector: after.vector, magnitude: after.magnitude }, changedRoles, increased: after.magnitude > before.magnitude });
    const color = value!.id.endsWith(".white") ? "white" : "black", enemy = color === "white" ? "black" : "white";
    const promotion = "promotion" in move ? move.promotion : undefined;
    const capture = value!.id.includes("capture-") || value!.id.includes("en-passant");
    expect(payload.sourceEvents.map(event => event.family)).toEqual([...(capture ? ["capture"] : []), ...(promotion === undefined ? [] : ["promotion"])]);
    for (const event of payload.sourceEvents) expect(event.mover.color).toBe(color);
    if (capture) {
      const capturedRole = promotion === undefined ? value!.id.includes("en-passant") ? "pawn" : value!.id.includes("capture-queen") ? "queen" : "knight" : "rook";
      expect(payload.sourceEvents[0]!.captured).toMatchObject({ color: enemy, role: capturedRole });
      expect(after.colors[enemy]![capturedRole]).toBe(before.colors[enemy]![capturedRole]! - 1);
    }
    if (promotion !== undefined) {
      expect(payload.sourceEvents.at(-1)!.detail?.promotionRole).toBe(promotion);
      expect(after.colors[color]!.pawn).toBe(before.colors[color]!.pawn! - 1);
      expect(after.colors[color]![promotion]).toBe(before.colors[color]![promotion]! + 1);
    }
  });

  it("retains the entire22-edge preservation matrix and six populated legal negatives", () => {
    expect(source.cases).toHaveLength(29);
    // Original22 preservation edges stay fixed; the extra separately grounded case
    // preserves the retired breadth fixture's exact input under current authority.
    const positives = source.cases.filter(row => row.arm === "positive" && !row.proposition.case.id.includes("breadth-promotion"));
    expect(positives).toHaveLength(22);
    const directions = { rise: 0, fall: 0, same: 0 };
    for (const row of positives) {
      const before = counts(row.input.beforeFen), after = counts(row.input.afterFen);
      directions[after.magnitude > before.magnitude ? "rise" : after.magnitude < before.magnitude ? "fall" : "same"]++;
    }
    expect(directions).toEqual({ rise: 4, fall: 10, same: 8 });
    for (const color of ["white", "black"]) {
      expect(positives.filter(row => row.proposition.case.id.endsWith(`.${color}`))).toHaveLength(11);
      expect(source.cases.filter(row => row.arm === "semantic_negative" && row.proposition.case.id.endsWith(`.${color}`))).toHaveLength(3);
    }
  });

  it("closes only current positive/negative arms; mirrors, population and qualification remain required", () => {
    const subject = source.cases[0]!.proposition.subject;
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
    expect(profile.positive).toMatchObject({ disposition: "present", refs: source.cases.filter(row => row.arm === "positive").map(row => ({ id: row.proposition.case.id })) });
    expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: source.cases.filter(row => row.arm === "semantic_negative").map(row => ({ id: row.proposition.case.id })) });
    expect(profile.orientation.disposition).toBe("required");
    expect(profile.importedPopulation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
  });

  it("refuses rebindings of genuine current authority to a predecessor subject, different input, arm or expectation", async () => {
    const original = byId.get(source.cases[0]!.proposition.case.id)!;
    expect(original).toBeDefined();
    for (const edit of [
      { subject: { kind: "event", projection: { id: "derived.material.event.role_asymmetry", version: 1 } } },
      { input: source.cases[1]!.input }, { arm: "semantic_negative", expectation: { kind: "omits" } },
      { expectation: { kind: "emits", minimum: 1, operandMatch: { increased: false } } },
      { operation: { id: "runtime.semantic.breadth_edge", version: 1 } },
    ]) expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...original, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
      .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    const old = parseSemanticValidationCase(RETIRED_SEMANTIC_VALIDATION_CASES.find(row => row.id === "cited.python-chess.rule-state.material.capture.white"));
    expect(old.subject.projection.version).toBe(1);
    expect(old.authority).not.toEqual(original.authority);
  });
});
