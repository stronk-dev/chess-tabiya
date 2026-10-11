// D3688: finite rule facts through the actual sole-factory production operation.
// Count asymmetry is not advantage, and localNonLosing is not general safety.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Chess, normalizeMove } from "chessops/chess";
import { bishopAttacks, kingAttacks, knightAttacks, pawnAttacks, rookAttacks } from "chessops/attacks";
import type { Color, Role, Square } from "chessops/types";
import { makeSquare, opposite, parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { positionFromFen } from "./position-cache.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { ATTACK_CITED_SOURCES, PAWN_DYNAMICS_CITED_SOURCE, RULE_STATE_CITED_SOURCES } from "./semantic-validation-literal-sources.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const cases = raw.map(parseSemanticValidationCase), byId = new Map(cases.map(value => [value.id, value]));
const rows = RULE_STATE_CITED_SOURCES.flatMap(source => source.cases);
const roles = ["pawn", "knight", "bishop", "rook", "queen"] as const;

function roleCounts(fen: string) {
  const position = positionFromFen(fen);
  const vector = Object.fromEntries(roles.map(role => [role, Math.abs(
    position.board[role].intersect(position.board.white).size() -
    position.board[role].intersect(position.board.black).size())]));
  return { vector, magnitude: Object.values(vector).reduce((sum, count) => sum + count, 0) };
}

// This independent finite-case oracle uses neutral geometry/occupants, never
// mobility/exchange helpers or a collector payload. Fixture kings are remote,
// no check/pin interferes, and the only opponent capturer is its king or pawn.
function geometricDestinations(fen: string, color: Color, square: Square, role: Role) {
  const position = positionFromFen(fen), enemy = opposite(color);
  const attacks = role === "rook" ? rookAttacks(square, position.board.occupied)
    : role === "bishop" ? bishopAttacks(square, position.board.occupied) : knightAttacks(square);
  const legalSquares = [...attacks.diff(position.board[color])];
  const enemyKing = position.board.kingOf(enemy)!;
  const enemyPawns = [...position.board.pawn.intersect(position.board[enemy])];
  const legal = legalSquares.map(makeSquare).sort();
  const safe = legalSquares.filter(destination => !kingAttacks(enemyKing).has(destination) &&
    !enemyPawns.some(pawn => pawn !== destination && pawnAttacks(enemy, pawn).has(destination)))
    .map(makeSquare).sort();
  return { legal, safe };
}

describe("D3688 material and mobility qualification", () => {
  it.each(rows)("$proposition.case.id executes its declared source-bound production edge", async row => {
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing canonical case ${row.proposition.case.id}`).toBeDefined();
    expect(value!.operation).toEqual({ id: "runtime.semantic.local_edge", version: 1 });
    expect(value!.input).toEqual(row.input);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    const negative = row.arm === "semantic_negative";
    expect(receipt.targetCount).toBe(negative ? 0 : 1);
    expect(receipt.otherCount).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke(row.input);
    expect(result.kind).toBe("completed");
    const targets = selectSemanticTargets(result, value!.subject);
    const before = positionFromFen(row.input.beforeFen), after = positionFromFen(row.input.afterFen);
    const color: Color = row.proposition.case.id.endsWith(".white") ? "white" : "black";

    if (value!.subject.projection.id === "derived.material.event.role_asymmetry") {
      const prior = roleCounts(row.input.beforeFen), next = roleCounts(row.input.afterFen);
      const changedRoles = roles.filter(role => prior.vector[role] !== next.vector[role]);
      if (negative) {
        expect(changedRoles).toEqual([]);
        expect(next).toEqual(prior);
        if (row.proposition.case.id.includes("quiet-negative")) expect(prior.magnitude).toBe(2);
        // A castle really relocates both friendly pieces but changes no count.
        if (row.proposition.case.id.includes("castle-negative")) {
          expect(before.board.rook.intersect(before.board[color]).size()).toBe(2);
          expect(after.board.rook.intersect(after.board[color]).size()).toBe(2);
          expect(before.board.kingOf(color)).not.toBe(after.board.kingOf(color));
        }
      } else {
        const payload = observationEvidence(targets[0]!).payload as { sourceEvents: { family: string; mover: { color: string }; captured?: { color: string; role: string }; promotedTo?: string }[] };
        expect(payload).toMatchObject({ before: prior, after: next, changedRoles,
          increased: next.magnitude > prior.magnitude });
        expect(payload.sourceEvents).toHaveLength(1);
        expect(payload.sourceEvents[0]).toMatchObject({ family: row.proposition.case.id.includes("promotion-") ? "promotion" : "capture", mover: { color } });
        if (row.proposition.case.id.includes("capture.")) {
          expect(payload.sourceEvents[0]?.captured).toMatchObject({ color: opposite(color), role: "knight" });
          expect(next.magnitude).toBeLessThan(prior.magnitude);
        } else {
          // Even a queen promotion changes the mix with equal unweighted magnitude.
          expect(next.magnitude).toBe(prior.magnitude);
          expect(before.board.pawn.intersect(before.board[color]).size()).toBe(1);
          expect(after.board.pawn.intersect(after.board[color]).size()).toBe(0);
        }
      }
      return;
    }

    const prevention = row.proposition.case.id.includes("pawn-prevention");
    const role = negative ? "bishop" : prevention ? "knight" : "rook";
    const square = parseSquare(role === "rook" ? color === "white" ? "a2" : "a7" : color === "white" ? "c3" : "c6")!;
    for (const position of [before, after]) expect(position.board.get(square)).toMatchObject({ color, role });
    const prior = geometricDestinations(row.input.beforeFen, color, square, role);
    const next = geometricDestinations(row.input.afterFen, color, square, role);
    expect(prior.legal.length).toBeGreaterThan(0);
    expect(prior.safe.length).toBeGreaterThan(0);
    if (negative) {
      expect(next).toEqual(prior); // Populated unchanged mobility, not no tracked pieces.
      // D3687's source-level finding also holds through the real operation:
      // both state payloads remain present even though every delta is empty.
      const kingStates = selectSemanticTargets(result, { kind: "event", projection: { id: "rules.king.event.zone_state", version: 1 } });
      expect(kingStates).toHaveLength(2);
      for (const state of kingStates) expect(observationEvidence(state).payload).toMatchObject({
        king: { relocated: false }, attackers: { gained: [], lost: [] },
        defenders: { gained: [], lost: [] }, shelter: { gained: [], lost: [] },
        escapes: { gained: [], lost: [] },
      });
    } else {
      const difference = (left: string[], right: string[]) => left.filter(square => !right.includes(square));
      expect(observationEvidence(targets[0]!).payload).toMatchObject({
        legalBefore: prior.legal, legalAfter: next.legal, safeBefore: prior.safe, safeAfter: next.safe,
        legalGained: difference(next.legal, prior.legal), legalLost: difference(prior.legal, next.legal),
        safeGained: difference(next.safe, prior.safe), safeLost: difference(prior.safe, next.safe), moved: false,
      });
      if (prevention) {
        const destination = color === "white" ? "e4" : "e5";
        expect(next.legal).toEqual(prior.legal);
        expect(prior.safe).toContain(destination);
        expect(next.safe).not.toContain(destination);
        // The knight landing remains legal; the advanced pawn can then capture
        // it, and the distant lone king cannot recapture that pawn.
        const clone = Chess.fromSetup({ ...after.toSetup(), turn: color, epSquare: undefined }).unwrap();
        const move = normalizeMove(clone, parseUci(`${makeSquare(square)}${destination}`)!);
        expect(clone.isLegal(move)).toBe(true);
        clone.play(move);
        const pawn = [...clone.board.pawn.intersect(clone.board[opposite(color)])][0]!;
        const capture = normalizeMove(clone, parseUci(`${makeSquare(pawn)}${destination}`)!);
        expect(clone.isLegal(capture)).toBe(true);
        clone.play(capture);
        expect(clone.board.knight.intersect(clone.board[color]).size()).toBe(0);
        expect(kingAttacks(clone.board.kingOf(color)!).has(parseSquare(destination)!)).toBe(false);
      }
    }
  });

  it.each(RULE_STATE_CITED_SOURCES)("$sourceId closes only its legal omission arm", async source => {
    const subject = source.cases[0]!.proposition.subject;
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => evidenceDigest(value.subject) === evidenceDigest(subject))!;
    expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: source.cases.filter(row => row.arm === "semantic_negative")
      .map(row => ({ id: row.proposition.case.id })) });
    expect(profile.positive.disposition).toBe("present");
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    const value = byId.get(source.cases[0]!.proposition.case.id)!;
    const other = byId.get(source.cases[1]!.proposition.case.id)!;
    for (const edit of [{ input: other.input }, { expectation: { kind: "omits" }, arm: "semantic_negative" },
      { operation: { id: "runtime.semantic.transition_edge", version: 1 } },
      { subject: { kind: "event", projection: { id: "rules.king.event.zone_state", version: 1 } } }]) {
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("keeps king-state omission required rather than inventing a negative", () => {
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => value.subject.projection.id === "rules.king.event.zone_state")!;
    expect(profile.semanticNegative.disposition).toBe("required");
    expect(rows.some(row => row.proposition.subject.projection.id === "rules.king.event.zone_state")).toBe(false);
  });

  it("retains all 175 predecessor records unchanged and adds exactly sixteen grounded cases", () => {
    const ids = new Set(rows.map(row => row.proposition.case.id));
    const later = new Set([...PAWN_DYNAMICS_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...ATTACK_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id))]);
    expect(raw.filter(value => ids.has(value.id as string))).toHaveLength(16);
    expect(raw.filter(value => !ids.has(value.id as string) && !later.has(value.id as string))).toHaveLength(175);
    expect(evidenceDigest(raw.filter(value => !ids.has(value.id as string) && !later.has(value.id as string))))
      .toBe("023aec4205ffb8ee6820962db6f6f079d70168c24a37b9e24353b3655287a0f0");
  });
});
