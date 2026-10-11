// D3701: neutral finite geometry and legal capture sets, not detector output as an oracle.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Chess } from "chessops/chess";
import type { Color, Piece, Square } from "chessops/types";
import { makeSquare, opposite, parseSquare } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { positionFromFen } from "./position-cache.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { KING_ZONE_CITED_SOURCE, DISCOVERED_CITED_SOURCE, ATTACK_CITED_SOURCES, RECORDED_CITED_SOURCES } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";

const raw = (JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] }).cases;
const byId = new Map(raw.map(row => { const value = parseSemanticValidationCase(row); return [value.id, value] as const; }));
const rows = ATTACK_CITED_SOURCES.flatMap(source => source.cases);

// No chessops attack helper, structural predicate, loose-piece or exchange helper.
// Raw board geometry includes friendly blockers and pinned geometric attackers.
function attacks(position: Chess, piece: Piece, from: Square, to: Square): boolean {
  if (from === to) return false;
  const dx = to % 8 - from % 8, dy = Math.floor(to / 8) - Math.floor(from / 8);
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (piece.role === "pawn") return ax === 1 && dy === (piece.color === "white" ? 1 : -1);
  if (piece.role === "knight") return ax * ay === 2 && ax + ay === 3;
  if (piece.role === "king") return Math.max(ax, ay) === 1;
  const diagonal = ax === ay, straight = dx === 0 || dy === 0;
  if (!(piece.role === "bishop" ? diagonal : piece.role === "rook" ? straight : diagonal || straight)) return false;
  const step = Math.sign(dx) + 8 * Math.sign(dy);
  for (let square = from + step; square !== to; square += step) if (position.board.occupied.has(square)) return false;
  return true;
}

function contacts(fen: string) {
  const position = positionFromFen(fen);
  return [...position.board].filter(([, piece]) => piece.role !== "pawn").flatMap(([target]) =>
    (["white", "black"] as const).flatMap(color => {
      const attackers = [...position.board].filter(([square, piece]) => piece.color === color && attacks(position, piece, square, target));
      return attackers.length === 0 ? [] : [{ key: `${color}:${makeSquare(target)}`, kind: "direct_attack_count", color, squares: [makeSquare(target)], count: attackers.length }];
    }));
}

describe("D3701 source-bound attack counts and loose omissions", () => {
  it.each(rows)("$proposition.case.id reaches the canonical production operation", async row => {
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing canonical case ${row.proposition.case.id}`).toBeDefined();
    const source = ATTACK_CITED_SOURCES.find(source => source.cases.some(candidate => candidate.proposition.case.id === row.proposition.case.id))!;
    expect(value!.input).toEqual(row.input);
    expect(value!.operation).toEqual(source.operation);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    expect(receipt.otherCount).toBeGreaterThan(0);
    const result = await SEMANTIC_VALIDATION_OPERATIONS[source.operation.id].invoke(row.input);
    const targets = selectSemanticTargets(result, row.proposition.subject);
    const payloads = targets.map(observationEvidence).map(value => value.payload);
    const color: Color = row.proposition.case.id.endsWith(".white") ? "white" : "black";
    if (row.proposition.subject.projection.id === "rules.structural.event.direct_attack_count") {
      const before = new Map(contacts(row.input.beforeFen).map(({ key, ...value }) => [key, value]));
      const after = new Map(contacts(row.input.afterFen).map(({ key, ...value }) => [key, value]));
      const expected = [...new Set([...before.keys(), ...after.keys()])].map(key => ({ family: "direct_attack_count", before: before.get(key) ?? null, after: after.get(key) ?? null }));
      expect(payloads).toHaveLength(expected.length);
      expect(payloads).toEqual(expect.arrayContaining(expected.map(value => expect.objectContaining(value))));
      if (row.arm === "positive") {
        const expectation = row.proposition.expectation;
        expect(expectation.kind).toBe("emits");
        if (expectation.kind !== "emits") throw new Error("positive needs matching operands");
        const matching = payloads.filter(value => {
          const payload = value as { before: unknown; after: unknown };
          return evidenceDigest(payload.before) === evidenceDigest(expectation.operandMatch!.before) &&
            evidenceDigest(payload.after) === evidenceDigest(expectation.operandMatch!.after);
        });
        expect(matching).toHaveLength(1);
        const target = targets[payloads.indexOf(matching[0])];
        const wanted = row.proposition.case.id.includes("gained") ? "gained" : row.proposition.case.id.includes("lost") ? "lost" : "preserved";
        expect(target).toMatchObject({ kind: "event", item: { sign: wanted } });
        if (row.proposition.case.id.includes("pinned.")) {
          const position = positionFromFen(row.input.beforeFen);
          const knight = parseSquare(color === "white" ? "e2" : "e7")!, target = parseSquare(color === "white" ? "c3" : "c6")!;
          expect(attacks(position, position.board.get(knight)!, knight, target)).toBe(true);
          expect(position.isLegal({ from: knight, to: target })).toBe(false);
        }
      } else {
        expect(targets).toEqual([]);
        if (row.proposition.case.id.includes("pawn-target")) {
          const position = positionFromFen(row.input.beforeFen);
          const from = parseSquare(color === "white" ? "c3" : "c6")!, to = parseSquare(color === "white" ? "d4" : "d5")!;
          expect(position.board.get(to)).toMatchObject({ color: opposite(color), role: "pawn" });
          expect(attacks(position, position.board.get(from)!, from, to)).toBe(true);
        }
      }
      return;
    }

    expect(row.arm).toBe("semantic_negative");
    expect(targets).toEqual([]);
    for (const fen of [row.input.beforeFen, row.input.afterFen]) {
      const position = positionFromFen(fen);
      const clone = Chess.fromSetup({ ...position.toSetup(), turn: opposite(color), epSquare: undefined });
      expect(clone.isOk).toBe(true);
      if (clone.isErr) throw clone.error;
      const victims = [...position.board[color]].filter(square => position.board.get(square)?.role !== "king");
      expect(victims.length).toBeGreaterThan(1);
      const captures = [...clone.value.allDests()].flatMap(([from, destinations]) => [...destinations].filter(to => victims.includes(to)).map(to => ({ from, to })));
      expect(captures).toEqual([]);
      if (row.proposition.case.id.includes("pinned-capturer")) {
        const knight = parseSquare(color === "white" ? "e7" : "e2")!, target = parseSquare(color === "white" ? "c6" : "c3")!;
        expect(attacks(position, position.board.get(knight)!, knight, target)).toBe(true);
        expect(clone.value.isLegal({ from: knight, to: target })).toBe(false);
      }
    }
  });

  it.each(ATTACK_CITED_SOURCES)("$sourceId closes only source-bound arms and refuses crossed authority", async source => {
    const subject = source.cases[0]!.proposition.subject;
    const profile = SEMANTIC_VALIDATION_PROFILES.find(profile => evidenceDigest(profile.subject) === evidenceDigest(subject))!;
    for (const [cell, arm] of [[profile.positive, "positive"], [profile.semanticNegative, "semantic_negative"]] as const) {
      const expected = source.cases.filter(row => row.arm === arm);
      if (expected.length) expect(cell).toMatchObject({ disposition: "present", refs: expected.map(row => ({ id: row.proposition.case.id })) });
    }
    expect(profile.orientation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
    const value = byId.get(source.cases[0]!.proposition.case.id)!;
    expect(value).toBeDefined();
    const other = byId.get(source.cases[1]!.proposition.case.id)!;
    const before = value.arm === "positive" ? { arm: "semantic_negative", expectation: { kind: "omits" } } : { arm: "positive", expectation: { kind: "emits", minimum: 1 } };
    for (const edit of [{ input: other.input }, before, { subject: { kind: "event", projection: { id: "rules.king.event.zone_state", version: 1 } } },
      { operation: { id: source.operation.id === "runtime.semantic.local_edge" ? "runtime.semantic.structural_edge" : "runtime.semantic.local_edge", version: 1 } }]) {
      expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
        .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
    }
  });

  it("adds sixteen source-bound cases without rewriting predecessor records", () => {
    const ids = new Set(rows.map(row => row.proposition.case.id));
    expect(raw.filter(value => ids.has(value.id as string))).toHaveLength(16);
    const later = new Set([...KING_ZONE_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...DISCOVERED_CITED_SOURCE.cases.map(row => row.proposition.case.id), ...RECORDED_CITED_SOURCES.flatMap(source => source.cases.map(row => row.proposition.case.id))]);
    const prior = raw.filter(value => !ids.has(value.id as string) && !later.has(value.id as string));
    expect(prior).toHaveLength(213);
    // Filled from the predecessor before this wave's authored source cases are registered.
    expect(evidenceDigest(prior)).toBe("006ad9a360eac9824c82a239e21497973e4768cb1d85927e045664b81a51a375");
  });
});
