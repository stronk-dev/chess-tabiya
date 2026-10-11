// D3714: independent square-name membership and actual completed production edges.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { KING_ZONE_CITED_SOURCE } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const byId = new Map(raw.map(row => { const value = parseSemanticValidationCase(row); return [value.id, value] as const; }));
const rows = KING_ZONE_CITED_SOURCE.cases, subject = rows[0]!.proposition.subject;
function position(fen: string) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }

// Independent algebraic-coordinate boundary sets. No structuralReading,
// matchesStructuralFeature, structural payload builder or production predicate.
const corners = new Set(["a1", "h1", "a8", "h8"]);
function observation(fen: string, color: "white" | "black", zone: "edge" | "corner") {
  const square = makeSquare(position(fen).board.kingOf(color)!);
  const member = zone === "corner" ? corners.has(square) :
    square[0] === "a" || square[0] === "h" || square[1] === "1" || square[1] === "8";
  return member ? { kind: "king_zone", color, zone, squares: [square] } : null;
}

describe("D3714 independent structural king-zone case arms", () => {
  it.each(rows)("$proposition.case.id checks the entire real edge/corner population", async row => {
    const before = position(row.input.beforeFen), move = parseUci(row.input.moveUci)!;
    expect(before.isLegal(move)).toBe(true);
    const after = before.clone(); after.play(move);
    expect(makeFen(after.toSetup())).toBe(row.input.afterFen);
    const expected = (["white", "black"] as const).flatMap(color => (["edge", "corner"] as const).flatMap(zone => {
      const left = observation(row.input.beforeFen, color, zone), right = observation(row.input.afterFen, color, zone);
      return left === null && right === null ? [] : [{ sign: left === null ? "gained" : right === null ? "lost" : "preserved",
        payload: { before_fen: row.input.beforeFen, move_uci: row.input.moveUci, after_fen: row.input.afterFen,
          family: "king_zone", before: left, after: right } }];
    }));
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.structural_edge"].invoke(row.input);
    expect(result.kind).toBe("completed");
    const targets = selectSemanticTargets(result, subject);
    expect(targets).toHaveLength(expected.length);
    expect(targets.map(value => ({ sign: value.kind === "event" ? value.item.sign : "not_event", payload: observationEvidence(value).payload })))
      .toEqual(expect.arrayContaining(expected));
    if (row.arm === "semantic_negative") {
      expect(expected).toHaveLength(0);
      // Both kings actually exist and remain on interior squares. The completed
      // operation is populated; missing kings/illegal input are not omissions.
      expect(before.board.king.size()).toBe(2); expect(after.board.king.size()).toBe(2);
    } else expect(expected.length).toBeGreaterThan(0);
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing canonical case ${row.proposition.case.id}`).toBeDefined();
    expect(value!.input).toEqual(row.input); expect(value!.operation).toEqual(KING_ZONE_CITED_SOURCE.operation);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    expect(receipt.targetCount).toBe(expected.length); expect(receipt.otherCount).toBeGreaterThan(0);
  });

  it("registers both case arms but does not claim orientation or learner qualification", () => {
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
    for (const [arm, cell] of [["positive", "positive"], ["semantic_negative", "semanticNegative"]] as const)
      expect(profile[cell]).toMatchObject({ disposition: "present", refs: rows.filter(row => row.arm === arm).map(row => ({ id: row.proposition.case.id })) });
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
  });

  it("refuses crossed authority before a production invocation", async () => {
    const value = byId.get(rows[0]!.proposition.case.id)!;
    expect(value).toBeDefined();
    for (const edit of [{ input: rows[1]!.input }, { subject: { kind: "event", projection: { id: "rules.king.event.zone_state", version: 1 } } },
      { arm: "semantic_negative", expectation: { kind: "omits" } }, { operation: { id: "runtime.semantic.local_edge", version: 1 } }])
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
  });

  it("retains every predecessor case and registers twenty-four distinct legal inputs", () => {
    const ids = new Set(rows.map(row => row.proposition.case.id));
    expect(raw.filter(value => ids.has(value.id as string))).toHaveLength(24);
    expect(raw.filter(value => !ids.has(value.id as string))).toHaveLength(265);
    expect(rows.filter(row => row.arm === "positive")).toHaveLength(20);
    expect(new Set(rows.map(row => evidenceDigest(row.input))).size).toBe(24);
  });
});
