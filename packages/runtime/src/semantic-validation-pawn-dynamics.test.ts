// D3691: independent finite pawn operands through the registered production edge.
// No pawn collector/helper is used to construct this test's expected geometry.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Color, Square } from "chessops/types";
import { makeSquare, parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { positionFromFen } from "./position-cache.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { BOUNDED_TARGET_CITED_SOURCE, KING_ZONE_CITED_SOURCE, DISCOVERED_CITED_SOURCE, ATTACK_CITED_SOURCES, PAWN_DYNAMICS_CITED_SOURCE, RECORDED_CITED_SOURCES } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const byId = new Map(raw.map(value => { const parsed = parseSemanticValidationCase(value); return [parsed.id, parsed] as const; }));
const rows = PAWN_DYNAMICS_CITED_SOURCE.cases;
const subject = rows[0]!.proposition.subject;
const rank = (square: Square) => Math.floor(square / 8);
const file = (square: Square) => square % 8;
const attacks = (color: Color, from: Square, to: Square) =>
  rank(to) - rank(from) === (color === "white" ? 1 : -1) && Math.abs(file(to) - file(from)) === 1;

function operands(fen: string) {
  const position = positionFromFen(fen);
  const pawns = [...position.board].filter(([, piece]) => piece.role === "pawn");
  const passed = pawns.filter(([square, piece]) => !pawns.some(([other, enemy]) =>
    enemy.color !== piece.color && Math.abs(file(other) - file(square)) <= 1 &&
    (piece.color === "white" ? rank(other) > rank(square) : rank(other) < rank(square))));
  const protectedPawns = passed.filter(([square, piece]) => pawns.some(([other, friendly]) =>
    friendly.color === piece.color && attacks(piece.color, other, square))).map(([square]) => square);
  const pairs = passed.flatMap(([square, piece], index) => passed.slice(index + 1)
    .filter(([other, friendly]) => friendly.color === piece.color && Math.abs(file(other) - file(square)) === 1)
    .map(([other]) => [square, other] as const));
  const locks = pawns.filter(([square, piece]) => piece.color === "white" &&
    position.board.get(square + 8)?.color === "black" && position.board.get(square + 8)?.role === "pawn")
    .map(([square]) => `${makeSquare(square)}:${makeSquare(square + 8)}`);
  return { position, pawns, passed, protectedPawns, pairs, locks };
}

describe("D3691 finite pawn dynamics qualification", () => {
  it.each(rows)("$proposition.case.id agrees with neutral geometry and the canonical production case", async row => {
    const before = operands(row.input.beforeFen), after = operands(row.input.afterFen);
    const move = parseUci(row.input.moveUci)!;
    if (!("from" in move)) throw new Error("literal case must be a board move");
    const moving = before.position.board.get(move.from)!;
    // Track physical identity when a moved pawn changes address or pair order.
    const previous = (square: Square) => moving.role === "pawn" && square === move.to ? move.from : square;
    const pairKey = (pair: readonly Square[], prior = false) => pair.map(square => makeSquare(prior ? previous(square) : square)).sort().join(":");
    const gainedLocks = after.locks.filter(lock => !before.locks.includes(lock));
    const gainedProtected = after.protectedPawns.filter(square => !before.protectedPawns.includes(previous(square)));
    const priorPairs = before.pairs.map(pair => pairKey(pair));
    const gainedPairs = after.pairs.filter(pair => !priorPairs.includes(pairKey(pair, true)));
    const minors = moving.role !== "pawn" ? [] : [...after.position.board].filter(([square, piece]) =>
      piece.color !== moving.color && ["knight", "bishop"].includes(piece.role) &&
      attacks(moving.color, move.to, square) && !attacks(moving.color, move.from, square));
    const expectedKinds = [
      ...gainedLocks.map(() => "locked_pair_gained"), ...gainedProtected.map(() => "protected_passer_gained"),
      ...gainedPairs.map(() => "connected_passer_pair_gained"), ...minors.map(() => "minor_harassed"),
    ].sort();
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke(row.input);
    expect(result.kind).toBe("completed");
    const targets = selectSemanticTargets(result, subject);
    const payloads = targets.map(observationEvidence).map(value => value.payload as { kind: string; subjects: Record<string, unknown> });
    expect(payloads.map(value => value.kind).sort()).toEqual(expectedKinds);
    if (row.arm === "positive") {
      const expectation = row.proposition.expectation;
      if (expectation.kind !== "emits") throw new Error("positive needs operand match");
      const matched = payloads.find(value => value.kind === expectation.operandMatch!.kind)!;
      expect(matched).toMatchObject(expectation.operandMatch!);
      for (const identity of Object.values(matched.subjects)) {
        if (identity && typeof identity === "object" && "square" in identity && "piece" in identity) {
          const value = identity as { square: string; piece: unknown };
          expect(after.position.board.get(parseSquare(value.square)!)).toEqual(value.piece);
        }
      }
    } else {
      expect(payloads).toEqual([]);
      expect(before.pawns.length).toBeGreaterThan(0);
      expect(after.pawns.length).toBeGreaterThan(0);
      if (row.proposition.case.id.includes("protector-changed")) {
        expect(before.protectedPawns).toContain(move.from);
        expect(after.protectedPawns).toContain(move.to);
        const protectors = (value: ReturnType<typeof operands>, target: Square) => value.pawns
          .filter(([square, piece]) => attacks(piece.color, square, target)).map(([square]) => makeSquare(square));
        expect(protectors(before, move.from)).not.toEqual(protectors(after, move.to));
      }
      if (row.proposition.case.id.includes("pair-reordered")) {
        expect(before.pairs).toHaveLength(1); expect(after.pairs).toHaveLength(1);
        expect(after.pairs[0]!.map(previous)).not.toEqual(before.pairs[0]);
        expect(pairKey(after.pairs[0]!, true)).toBe(pairKey(before.pairs[0]!));
      }
      if (/protector-changed|pair-reordered/.test(row.proposition.case.id)) {
        const advance = selectSemanticTargets(result, { kind: "event", projection: { id: "derived.pawn.event.transitions", version: 1 } });
        expect(advance.map(observationEvidence).map(value => value.payload)).toEqual(expect.arrayContaining([
          expect.objectContaining({ kind: "passed_pawn_advanced" }),
        ]));
      }
    }
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing canonical case ${row.proposition.case.id}`).toBeDefined();
    expect(value!.operation).toEqual(PAWN_DYNAMICS_CITED_SOURCE.operation);
    expect(value!.input).toEqual(row.input);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({
      status: "passed", resultKind: "completed", invocations: 1, failure: null, targetCount: targets.length,
      otherCount: expect.any(Number),
    });
    expect(receipt.otherCount).toBeGreaterThan(0);
  });

  it("closes only its two source-bound arms, retaining candidate-majority/orientation and permission debt", async () => {
    const profile = SEMANTIC_VALIDATION_PROFILES.find(value => value.subject.projection.id === subject.projection.id)!;
    for (const [cell, arm] of [[profile.positive, "positive"], [profile.semanticNegative, "semantic_negative"]] as const) {
      expect(cell).toMatchObject({ disposition: "present", refs: rows.filter(row => row.arm === arm).map(row => ({ id: row.proposition.case.id })) });
    }
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    expect(rows.filter(row => row.arm === "positive")).toHaveLength(10);
    expect(rows.filter(row => row.arm === "semantic_negative")).toHaveLength(12);
    expect(rows.some(row => JSON.stringify(row.proposition).includes("candidate_majority"))).toBe(false);
    const value = byId.get(rows[0]!.proposition.case.id)!;
    const other = byId.get(rows[1]!.proposition.case.id)!;
    for (const edit of [{ input: other.input }, { arm: "semantic_negative", expectation: { kind: "omits" } },
      { operation: { id: "runtime.semantic.structural_edge", version: 1 } },
      { subject: { kind: "event", projection: { id: "rules.king.event.zone_state", version: 1 } } }]) {
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("adds exactly 22 cases and preserves all 191 predecessor records unchanged", () => {
    const ids = new Set(rows.map(row => row.proposition.case.id));
    expect(raw.filter(value => ids.has(value.id as string))).toHaveLength(22);
    const later = new Set([...BOUNDED_TARGET_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...KING_ZONE_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...DISCOVERED_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...RECORDED_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id)), ...ATTACK_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id))]);
    const prior = raw.filter(value => !ids.has(value.id as string) && !later.has(value.id as string));
    expect(prior).toHaveLength(191);
    expect(evidenceDigest(prior)).toBe("822823866a9f9430f9e4438be96e6b17157aab6f05775d4ff199ddc98ba740b9");
  });
});

describe("D3690 complete state-event omission contract conflict", () => {
  it.each([
    { beforeFen: "7k/8/8/8/8/8/8/7K w - - 7 1", moveUci: "h1g1", afterFen: "7k/8/8/8/8/8/8/6K1 b - - 8 1" },
    { beforeFen: "7k/8/8/8/8/8/8/7K b - - 7 1", moveUci: "h8g8", afterFen: "6k1/8/8/8/8/8/8/7K w - - 8 2" },
    { beforeFen: "7k/5Q2/7K/8/8/8/8/8 w - - 0 1", moveUci: "f7g7", afterFen: "7k/6Q1/7K/8/8/8/8/8 b - - 1 1" },
  ])("$moveUci retains zero counts as observations, not omissions", async edge => {
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.local_edge"].invoke({ kind: "edge", ...edge });
    expect(result.kind).toBe("completed");
    const count = (id: string) => selectSemanticTargets(result, { kind: "event", projection: { id, version: 1 } }).map(observationEvidence).map(value => value.payload);
    const pieces = count("rules.structural.event.piece_count");
    expect(pieces).toHaveLength(12);
    expect(pieces).toEqual(expect.arrayContaining([expect.objectContaining({ before: expect.objectContaining({ role: "pawn", count: 0 }), after: expect.objectContaining({ role: "pawn", count: 0 }) })]));
    expect(count("rules.structural.event.pawn_islands")).toEqual([
      expect.objectContaining({ color: "white", before: 0, after: 0 }), expect.objectContaining({ color: "black", before: 0, after: 0 }),
    ]);
    const replies = count("rules.tactic.consequence.reply_breadth");
    expect(replies).toHaveLength(1);
    expect(replies[0]).toMatchObject(edge.moveUci === "f7g7" ? { terminal: true, count: 0, replies: [], check: true } : { terminal: false, count: expect.any(Number) });
    for (const id of ["rules.king.event.zone_state", "rules.structural.event.piece_count", "rules.structural.event.pawn_islands", "rules.tactic.consequence.reply_breadth"]) {
      expect(SEMANTIC_VALIDATION_PROFILES.find(value => value.subject.projection.id === id)!.semanticNegative.disposition).toBe("required");
    }
  });
});
