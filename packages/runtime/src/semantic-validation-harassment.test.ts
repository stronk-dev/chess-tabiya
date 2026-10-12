// D3717: independent legal replay, integer diagonal occupancy and literal role scope.
// Never use pressureLines, harassmentPressureSequence or collector output as the oracle.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Square } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { BOUNDED_TARGET_CITED_SOURCE, RECORDED_CITED_SOURCES } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { executeSemanticValidationCase, selectSemanticTargets } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";

const raw = JSON.parse(readFileSync(resolve(SEMANTIC_VALIDATION_REPOSITORY_ROOT, "packages/runtime/src/semantic-validation-cases.json"), "utf8")) as { cases: Record<string, unknown>[] };
const byId = new Map(raw.cases.map(row => { const value = parseSemanticValidationCase(row); return [value.id, value] as const; }));
const source = RECORDED_CITED_SOURCES.find(source => source.sourceId === "python-chess.recorded.pressure")!;
const position = (fen: string) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
const identity = (board: Chess, square: Square) => ({ square: makeSquare(square), piece: board.board.get(square)! });
const values = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0 } as const;

// This is the retained pressure convention's finite role scope, not an evaluation
// or pin/forced-move judgement. Count every square strictly between the endpoints.
function lines(board: Chess, from: Square) {
  const slider = board.board.get(from)!;
  return [...board.board].flatMap(([to, target]) => {
    if (target.color === slider.color || !["rook", "queen"].includes(target.role)) return [];
    const dx = to % 8 - from % 8, dy = Math.floor(to / 8) - Math.floor(from / 8);
    if (dx === 0 || Math.abs(dx) !== Math.abs(dy)) return [];
    const occupied: Square[] = [];
    const step = Math.sign(dx) + 8 * Math.sign(dy);
    for (let at = from + step; at !== to; at += step) if (board.board.has(at as Square)) occupied.push(at as Square);
    if (occupied.length !== 1) return [];
    const at = occupied[0]!, screen = board.board.get(at)!;
    if (screen.color === slider.color || screen.role === "king" || values[screen.role] >= values[target.role]) return [];
    return [{ slider: identity(board, from), screen: identity(board, at), target: identity(board, to) }];
  });
}

describe("D3717 independent recorded bishop harassment pressure", () => {
  it.each(source.cases)("$proposition.case.id checks exact pressure and a completed real path", async row => {
    const [first, reply] = row.input.edges;
    expect(row.input.edges).toHaveLength(2);
    const before = position(first!.beforeFen), pushed = position(first!.afterFen), after = position(reply!.afterFen);
    const push = parseUci(first!.moveUci)!, retreat = parseUci(reply!.moveUci)!;
    if (!("from" in push) || !("from" in retreat)) throw new Error("ordinary moves required");
    expect(before.isLegal(push)).toBe(true);
    const replay = before.clone(); replay.play(push); expect(makeFen(replay.toSetup())).toBe(first!.afterFen);
    expect(first!.afterFen).toBe(reply!.beforeFen); expect(replay.isLegal(retreat)).toBe(true);
    replay.play(retreat); expect(makeFen(replay.toSetup())).toBe(reply!.afterFen);
    const pawn = before.board.get(push.from)!;
    expect(pawn.role).toBe("pawn"); expect(pushed.board.get(push.to)).toEqual(pawn);
    const minor = pushed.board.get(retreat.from)!;
    const pawnAttacks = (at: Square, target: Square) => Math.abs(target % 8 - at % 8) === 1
      && Math.floor(target / 8) - Math.floor(at / 8) === (pawn.color === "white" ? 1 : -1);
    expect(pawnAttacks(push.to, retreat.from)).toBe(true);
    expect(pawnAttacks(push.from, retreat.from)).toBe(false);
    expect(minor.color).toBe(opposite(pawn.color)); expect(after.board.get(retreat.to)).toEqual(minor);
    const retained = minor.role !== "bishop" ? [] : lines(pushed, retreat.from).flatMap(left =>
      lines(after, retreat.to).filter(right => evidenceDigest(right.screen) === evidenceDigest(left.screen)
        && evidenceDigest(right.target) === evidenceDigest(left.target)).map(right => ({ before: left, after: right })));
    expect(retained).toHaveLength(row.arm === "positive" ? 1 : 0);
    const value = byId.get(row.proposition.case.id);
    expect(value, `missing canonical case ${row.proposition.case.id}`).toBeDefined();
    expect(value!.input).toEqual(row.input); expect(value!.operation).toEqual(source.operation);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null });
    const result = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.recorded_path"].invoke(row.input);
    const targets = selectSemanticTargets(result, row.proposition.subject);
    expect(targets).toHaveLength(retained.length);
    if (retained.length > 0) {
      const payload = observationEvidence(targets[0]!).payload as { anchors: unknown[]; nodes: { fen: string }[] };
      expect(payload).toMatchObject({ kind: "harassment_pressure_retained", pawn: identity(pushed, push.to),
        minor: { before: identity(pushed, retreat.from), after: identity(after, retreat.to) }, pressure: retained[0], conventionId: "pressure-line@1" });
      expect(payload.nodes.map(node => node.fen)).toEqual([first!.beforeFen, first!.afterFen, reply!.afterFen]);
      expect(payload.anchors).toHaveLength(2);
    }
  });

  it("retains every canonical predecessor byte and registers exactly eighteen new cases", () => {
    const added = new Set(source.cases.map(row => row.proposition.case.id));
    const prior = raw.cases.filter(row => !added.has(row.id as string) && !BOUNDED_TARGET_CITED_SOURCE.cases.some(value => value.proposition.case.id === row.id));
    expect(prior).toHaveLength(289);
    expect(evidenceDigest(prior)).toBe("961d7271b56f50a74bf4da58f20f3c16495688635a3a3a15ed6499bbf6ef82c9");
    expect(raw.cases.filter(row => added.has(row.id as string))).toHaveLength(18);
    expect(source.cases.filter(row => row.arm === "positive")).toHaveLength(4);
    expect(source.cases.filter(row => row.arm === "semantic_negative")).toHaveLength(14);
  });
});
