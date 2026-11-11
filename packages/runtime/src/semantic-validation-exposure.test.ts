import { loadSemanticValidationCases } from "./semantic-validation-case-storage.js";
// D3950: independent finite board facts through the current production operation. No calls to
// exchange/control/semantic helpers to produce expected facts. Pass and exchange are conventions,
// not a claim of forced gain or move quality. Deeper capture trees must fail this fixture oracle.
import { resolve } from "node:path";
import { attacks } from "chessops/attacks";
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { NormalMove, Piece, Role, Square } from "chessops/types";
import { makeSquare, makeUci, opposite, parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { evidenceDigest } from "./evidence-contract.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT, SEMANTIC_VALIDATION_RESOLVERS } from "./semantic-validation-authorities.js";
import { EXPOSURE_V2_CITED_SOURCE, EXPOSURE_V2_FIXTURES } from "./semantic-validation-literal-sources.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";
import { SEMANTIC_VALIDATION_PROFILES, semanticValidationVerdict } from "./semantic-validation-registry.js";
import { executeSemanticValidationCase, selectSemanticTargets, subjectSemanticResult } from "./semantic-validation-runner.js";
import { parseSemanticValidationCase } from "./semantic-validation.js";

const source = EXPOSURE_V2_CITED_SOURCE, subject = source.cases[0]!.proposition.subject;
const raw = (loadSemanticValidationCases()).cases;
const byId = new Map(raw.map(row => { const value = parseSemanticValidationCase(row); return [value.id, value] as const; }));
const position = (fen: string) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
const promotions = ["bishop", "knight", "queen", "rook"] as const;
// Independently stated legal-exchange@1 product units. Never engine evaluation or human advice.
const units: Record<Role, number> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
const samePiece = (a: Piece | undefined, b: Piece | undefined) => a !== undefined && b !== undefined
  && a.color === b.color && a.role === b.role && Boolean(a.promoted) === Boolean(b.promoted);

function targetCaptures(chess: Chess, target: Square): NormalMove[] {
  const victim = chess.board.get(target);
  if (victim === undefined || victim.color === chess.turn || victim.role === "king") return [];
  const result: NormalMove[] = [];
  for (const [from, destinations] of chess.allDests()) {
    if (!destinations.has(target)) continue;
    const choices: readonly (Role | undefined)[] = chess.board.getRole(from) === "pawn" && (target < 8 || target >= 56) ? promotions : [undefined];
    for (const promotion of choices) {
      const move = promotion === undefined ? { from, to: target } : { from, to: target, promotion };
      if (chess.isLegal(move)) result.push(move);
    }
  }
  return result.sort((a, b) => makeUci(a).localeCompare(makeUci(b)));
}

function immediateUnits(chess: Chess, move: NormalMove): number {
  const victim = chess.board.get(move.to)!;
  expect(victim.color).not.toBe(chess.turn);
  return units[victim.role] + (move.promotion === undefined ? 0 : units[move.promotion] - units.pawn);
}

function finiteExchange(chess: Chess, move: NormalMove): number {
  const gain = immediateUnits(chess, move), after = chess.clone(); after.play(move);
  const replies = targetCaptures(after, move.to);
  expect(replies.length, "fixture oracle cannot truncate multiple or deeper recapture trees").toBeLessThanOrEqual(1);
  const replyUnits = replies.map(reply => {
    const value = immediateUnits(after, reply), end = after.clone(); end.play(reply);
    expect(targetCaptures(end, move.to), "fixture oracle must reach a genuine capture-tree leaf").toEqual([]);
    return value;
  });
  return gain - Math.max(0, ...replyUnits); // The opponent may stop instead of recapturing.
}

function lostRetainedTargets(before: Chess, after: Chess) {
  const enemy = opposite(before.turn), result: { defender: string; target: Square; piece: Piece }[] = [];
  for (const controller of before.board[enemy]) {
    const piece = before.board.get(controller)!;
    const retained = samePiece(piece, after.board.get(controller));
    for (const target of attacks(piece, controller, before.board.occupied)) {
      if (retained && attacks(piece, controller, after.board.occupied).has(target)) continue;
      const oldTarget = before.board.get(target), nextTarget = after.board.get(target);
      if (!samePiece(oldTarget, nextTarget) || nextTarget!.color !== enemy) continue;
      result.push({ defender: makeSquare(controller), target, piece: nextTarget! });
    }
  }
  return result.sort((a, b) => makeSquare(a.target).localeCompare(makeSquare(b.target)) || a.defender.localeCompare(b.defender));
}

describe("D3950 current exposure canonical authority", () => {
  it.each(EXPOSURE_V2_FIXTURES)("%s has complete independently justified capture outcomes and current authority", async (id, beforeFen, moveUci, afterFen, expected) => {
    const before = position(beforeFen), moved = before.clone(), move = normalizeMove(moved, parseUci(moveUci)!);
    expect(moved.isLegal(move)).toBe(true); moved.play(move);
    expect(makeFen(moved.toSetup())).toBe(afterFen);
    const after = position(afterFen), pass = Chess.fromSetup({ ...after.toSetup(), turn: before.turn, epSquare: undefined });
    expect(pass.isOk).toBe(true);
    const lost = lostRetainedTargets(before, after);
    const outcomes = lost.map(target => ({ ...target, captures: targetCaptures(pass.unwrap(), target.target).map(capture => ({
      uci: makeUci(capture), value: finiteExchange(pass.unwrap(), capture),
    })) }));
    const positive = outcomes.filter(row => row.captures.some(capture => capture.value > 0));
    expect(Object.fromEntries(positive.map(row => [makeSquare(row.target), row.captures.filter(capture => capture.value > 0).map(capture => capture.uci)]))).toEqual(expected);
    if (id.startsWith("no-retained-target")) expect(lost).toHaveLength(0);
    if (id.startsWith("no-capturer")) { expect(lost).toHaveLength(1); expect(outcomes[0]!.captures).toEqual([]); }
    if (id.startsWith("zero-exchange")) expect(outcomes.flatMap(row => row.captures.map(capture => capture.value))).toEqual([0]);
    if (id.startsWith("negative-exchange")) expect(outcomes.flatMap(row => row.captures.map(capture => capture.value))).toEqual([-4]);

    const input = { kind: "edge" as const, beforeFen, moveUci, afterFen };
    const result = subjectSemanticResult(await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.breadth_edge"].invoke(input), subject);
    expect(result.kind).toBe("completed");
    const emitted = selectSemanticTargets(result, subject);
    expect(emitted).toHaveLength(positive.length);
    const targetIdentity = (defender: string, target: string) => `${defender}:${target}`;
    expect(emitted.map(event => {
      const payload = observationEvidence(event).payload as { defender: { square: string }; target: { square: string } };
      return targetIdentity(payload.defender.square, payload.target.square);
    }).sort()).toEqual(positive.map(row => targetIdentity(row.defender, makeSquare(row.target))).sort());
    for (const event of emitted) {
      const payload = observationEvidence(event).payload as { defender: { square: string; piece: Piece }; target: { square: string; piece: Piece }; captures: { captureUci: string; resultUnits: number }[]; controllerEvent: { mode: string; sign: string; color: string }; passConvention: string };
      const independent = positive.find(row => makeSquare(row.target) === payload.target.square && row.defender === payload.defender.square)!;
      expect(independent).toBeDefined();
      expect(payload.defender.piece).toEqual(before.board.get(parseSquare(independent.defender)!));
      expect(payload.target.piece).toEqual(independent.piece);
      expect(Boolean(payload.target.piece.promoted)).toBe(Boolean(before.board.get(independent.target)!.promoted));
      expect(payload.controllerEvent).toMatchObject({ mode: "pseudo", sign: "lost", color: opposite(before.turn) });
      expect(payload.passConvention).toBe("mover-turn-ep-cleared@1");
      expect(payload.captures.map(capture => ({ uci: capture.captureUci, value: capture.resultUnits }))).toEqual(independent.captures.filter(capture => capture.value > 0));
    }
    const value = byId.get(`cited.python-chess.exposure-v2.${id}`);
    expect(value, "missing distinct current-subject canonical authority").toBeDefined();
    expect(value!.version).toBe(1); expect(value!.subject).toEqual(subject); expect(value!.input).toEqual(input);
    const receipt = await executeSemanticValidationCase(value!, SEMANTIC_VALIDATION_RESOLVERS, byId);
    expect(receipt).toMatchObject({ status: "passed", resultKind: "completed", invocations: 1, failure: null, targetCount: positive.length });
    if (positive.length === 0) expect(receipt.otherCount).toBeGreaterThan(0);
  });

  it.each([
    ["r2k4/1B6/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6"],
    ["3k3r/8/8/8/5b2/6N1/6b1/4K2R b - - 0 1", "f4g3"],
  ])("checking/pass-illegal positions remain unavailable, never negative examples: %s", async (beforeFen, moveUci) => {
    const before = position(beforeFen), move = normalizeMove(before, parseUci(moveUci)!);
    expect(before.isLegal(move)).toBe(true); before.play(move);
    expect(before.isCheck()).toBe(true);
    expect(Chess.fromSetup({ ...before.toSetup(), turn: opposite(before.turn), epSquare: undefined }).isErr).toBe(true);
    const result = subjectSemanticResult(await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.breadth_edge"].invoke({ kind: "edge", beforeFen, moveUci, afterFen: makeFen(before.toSetup()) }), subject);
    expect(result).toMatchObject({ kind: "unavailable", reason: "source_predicate_unavailable" });
  });

  it("supplies only positive/negative arms without promoting orientation, population or qualification", () => {
    expect(source.cases).toHaveLength(16);
    for (const arm of ["positive", "semantic_negative"]) expect(source.cases.filter(row => row.arm === arm)).toHaveLength(8);
    const profile = SEMANTIC_VALIDATION_PROFILES.find(row => evidenceDigest(row.subject) === evidenceDigest(subject))!;
    expect(profile.positive).toMatchObject({ disposition: "present", refs: source.cases.filter(row => row.arm === "positive").map(row => ({ id: row.proposition.case.id })) });
    expect(profile.semanticNegative).toMatchObject({ disposition: "present", refs: source.cases.filter(row => row.arm === "semantic_negative").map(row => ({ id: row.proposition.case.id })) });
    expect(profile.orientation.disposition).toBe("required"); expect(profile.importedPopulation.disposition).toBe("required");
    expect(semanticValidationVerdict(subject)?.verdict).toBe("unvalidated");
  });

  it("rejects current authority rebound to a predecessor, other input/expectation/arm or operation", async () => {
    const value = byId.get(source.cases[0]!.proposition.case.id)!; expect(value).toBeDefined();
    for (const edit of [
      { subject: { kind: "event", projection: { id: "derived.tactic.defender_exposure", version: 1 } } },
      { input: source.cases[1]!.input }, { expectation: { kind: "omits" }, arm: "semantic_negative" },
      { expectation: { kind: "emits", minimum: 1, operandMatch: { passConvention: "foreign-convention" } } },
      { operation: { id: "runtime.semantic.local_edge", version: 1 } },
    ]) expect(await executeSemanticValidationCase(parseSemanticValidationCase({ ...value, ...edit }), SEMANTIC_VALIDATION_RESOLVERS, byId))
      .toMatchObject({ status: "failed", invocations: 0, failure: { code: "SEMANTIC_VALIDATION_AUTHORITY_INVALID" } });
  });
});
