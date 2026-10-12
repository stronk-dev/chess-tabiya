// D3720: independent finite board/material checks of the COMPLETE production batch.
// The oracle helpers below use no production target, threat, exchange,
// position-cache or identity helper; production imports are invoked only as SUTs.
// It implements the declared material convention using whole-board balances and
// physical source-piece labels, not the production exchange tree or tracked pair.
// Passing these tests is not a canonical authority receipt or learner admission.
import { Board } from "chessops/board";
import { Chess, castlingSide } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, NormalMove, Role, Square } from "chessops/types";
import { kingCastlesTo, makeSquare, makeUci, opposite, parseUci, rookCastlesTo } from "chessops/util";
import { describe, expect, it } from "vitest";

import { createBoundedTargetBackgroundService, type BoundedTargetBatchCompleted } from "./bounded-target.js";
import { boundedTargetSourceEvidence } from "./evidence-operations.js";
import { SEMANTIC_VALIDATION_OPERATIONS, observationEvidence } from "./semantic-validation-operations.js";

const UNITS: Readonly<Record<Role, number>> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const read = (fen: string) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
const moves = (position: Chess): NormalMove[] => [...position.allDests()].flatMap(([from, destinations]) =>
  [...destinations].flatMap(to => {
    const promotions = position.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? PROMOTIONS : [undefined];
    return promotions.map(promotion => promotion === undefined ? { from, to } : { from, to, promotion }).filter(move => position.isLegal(move));
  })).sort((a, b) => makeUci(a).localeCompare(makeUci(b)));
const balance = (position: Chess, color: Color) => [...position.board].reduce((sum, [, piece]) => sum + (piece.color === color ? 1 : -1) * UNITS[piece.role], 0);
const play = (position: Chess, move: NormalMove) => { const next = position.clone(); next.play(move); return next; };
const capturedSquare = (position: Chess, move: NormalMove): Square | undefined => {
  const occupant = position.board.get(move.to);
  if (occupant?.color === opposite(position.turn)) return move.to;
  if (position.board.getRole(move.from) === "pawn" && move.to === position.epSquare && move.from % 8 !== move.to % 8) return (move.to + (position.turn === "white" ? -8 : 8)) as Square;
  return undefined;
};

// Enumerate capture-on-the-landing continuations; either player may stop. Values
// come from complete board balances at every leaf, not accumulated capture deltas.
function captureValue(position: Chess, move: NormalMove): number {
  if (!position.isLegal(move) || capturedSquare(position, move) === undefined) return Number.NEGATIVE_INFINITY;
  const perspective = position.turn, initial = balance(position, perspective), landing = move.to;
  const minimax = (board: Chess): number => {
    const choices = [balance(board, perspective), ...moves(board)
      .filter(reply => reply.to === landing && capturedSquare(board, reply) !== undefined)
      .map(reply => minimax(play(board, reply)))];
    return board.turn === perspective ? Math.max(...choices) : Math.min(...choices);
  };
  return minimax(play(position, move)) - initial;
}

interface Labelled { readonly position: Chess; readonly labels: ReadonlyMap<Square, Square>; }
function labelled(position: Chess): Labelled { return { position, labels: new Map([...position.board].map(([square]) => [square, square])) }; }
function step(state: Labelled, move: NormalMove): Labelled {
  const labels = new Map(state.labels), id = labels.get(move.from)!;
  const side = castlingSide(state.position, move);
  labels.delete(move.from);
  if (side !== undefined) {
    const rookFrom = state.position.castles.rook[state.position.turn][side]!;
    const rook = state.labels.get(rookFrom)!;
    labels.delete(rookFrom);
    labels.set(kingCastlesTo(state.position.turn, side), id);
    labels.set(rookCastlesTo(state.position.turn, side), rook);
  } else {
    const captured = capturedSquare(state.position, move);
    if (captured !== undefined) labels.delete(captured);
    labels.set(move.to, id);
  }
  const position = play(state.position, move);
  expect([...labels.keys()].sort((a, b) => a - b)).toEqual([...position.board.occupied]);
  return { position, labels };
}
const address = (state: Labelled, id: Square) => [...state.labels].find(([, original]) => original === id)?.[0];
interface Target { readonly move: NormalMove; readonly attacker: Square; readonly victim: Square; readonly units: number; }
function available(state: Labelled, target: Target): boolean {
  const from = address(state, target.attacker), to = address(state, target.victim);
  if (from === undefined || to === undefined || state.position.board.get(from)?.color !== state.position.turn) return false;
  const promotes = state.position.board.getRole(from) === "pawn" && (to < 8 || to >= 56);
  const move = promotes ? { from, to, promotion: target.move.promotion ?? "queen" as const } : { from, to };
  return captureValue(state.position, move) > 0;
}
function targets(source: Chess): Target[] {
  // Literal threat@1 pass convention, deliberately independent of threatPassAnchor.
  const setup = source.toSetup();
  const passed = Chess.fromSetup({ ...setup, turn: opposite(source.turn), epSquare: undefined }).unwrap();
  return moves(passed).flatMap(move => {
    const victim = capturedSquare(passed, move), units = captureValue(passed, move);
    return victim === undefined || units <= 0 ? [] : [{ move, attacker: move.from, victim, units }];
  });
}

function returnOutcome(root: Labelled, candidate: NormalMove, target: Target) {
  const after = step(root, candidate);
  if (address(after, target.attacker) === undefined) return { kind: "not_reintroduced", visited: 1 };
  let visited = 1, existential = false;
  for (const preparation of moves(after.position)) {
    visited += 1;
    const prepared = step(after, preparation);
    if (address(prepared, target.attacker) === undefined || address(prepared, target.victim) === undefined) continue;
    const replies = moves(prepared.position);
    if (replies.length === 0) continue; // Terminal is never vacuous all-defences proof.
    const outcomes = replies.map(reply => { visited += 1; return available(step(prepared, reply), target); });
    if (outcomes.every(Boolean)) return { kind: "survives_every_defence", visited };
    existential ||= outcomes.some(Boolean);
  }
  return { kind: existential ? "reintroduced" : "not_reintroduced", visited };
}

function mirror(fen: string): string {
  const setup = parseFen(fen).unwrap(), board = Board.empty();
  for (const [square, piece] of setup.board) board.set((square ^ 56) as Square, { ...piece, color: opposite(piece.color) });
  return makeFen({ ...setup, board, turn: opposite(setup.turn) });
}
const FIXTURES = [
  { id: "mixed-removals", fen: "8/4n3/n1p4r/7k/1B6/8/8/4K3 b - - 0 1", expectedTargets: 1 },
  { id: "moving-knight", fen: "8/8/8/7k/n7/8/2B5/4K3 b - - 0 1", expectedTargets: 1 },
  // c6-c5 blocks Bxe7. Bxc5+ restores the diagonal while the check means
  // every legal reply leaves the original knight available to that bishop.
  { id: "checked-reply-universal", fen: "8/4n3/2p5/8/1B6/8/8/K5k1 b - - 0 1", expectedTargets: 1 },
  // Same diagonal restoration, but Bxc5 is mate. Zero legal replies must
  // not become a vacuous "survives every defence" or an existential witness.
  { id: "terminal-preparation", fen: "8/4n3/2p5/8/1B5R/3B1K2/8/6k1 b - - 0 1", expectedTargets: 1 },
  { id: "defended-equal-exchange", fen: "8/4n2r/n1p5/7k/1B6/8/8/4K3 b - - 0 1", expectedTargets: 0 },
  { id: "blocked-diagonal", fen: "8/4n3/n6r/2p4k/1B6/8/8/4K3 b - - 0 1", expectedTargets: 0 },
  { id: "every-candidate-preserves", fen: "7k/7n/8/5B2/8/8/8/K6R b - - 0 1", expectedTargets: 2 },
].flatMap(row => [{ ...row, id: `${row.id}.black` }, { ...row, id: `${row.id}.white`, fen: mirror(row.fen) }]);

describe("D3720 independent complete bounded material populations", () => {
  it.each(FIXTURES)("$id checks every target, candidate, immediate cause and bounded return", async fixture => {
    const source = read(fixture.fen), expected = targets(source), candidates = moves(source), root = labelled(source);
    expect(source.isCheck()).toBe(false);
    expect(expected).toHaveLength(fixture.expectedTargets);
    expect(candidates.length).toBeGreaterThan(0);
    const service = createBoundedTargetBackgroundService();
    let result: BoundedTargetBatchCompleted;
    try {
      const response = await service.submit({ kind: "source_position_batch", ...boundedTargetSourceEvidence(fixture.fen) }, new AbortController().signal);
      expect(response.kind).toBe("completed");
      if (response.kind !== "completed") throw new Error(`unexpected batch ${response.kind}`);
      result = response;
    } finally { await service.close(); }
    expect(result.targets.map(row => row.target.payload.captureUci)).toEqual(expected.map(row => makeUci(row.move)));
    let batchVisited = 0;
    for (const [index, row] of result.targets.entries()) {
      const target = expected[index]!;
      const attackerPiece = source.board.get(target.attacker)!, victimPiece = source.board.get(target.victim)!;
      expect(row.target.payload).toMatchObject({
        attacker: { square: makeSquare(target.attacker), color: attackerPiece.color, role: attackerPiece.role },
        victim: { square: makeSquare(target.victim), color: victimPiece.color, role: victimPiece.role },
        exchange: { payload: { resultUnits: target.units } },
      });
      expect(row.candidates.map(value => value.kind === "abstained" ? value.candidateUci : value.immediate.payload.candidateUci)).toEqual(candidates.map(makeUci));
      for (const [candidateIndex, actual] of row.candidates.entries()) {
        const candidate = candidates[candidateIndex]!, next = step(root, candidate);
        const preserved = available(next, target);
        expect(actual.kind).toBe(preserved ? "preserved" : "removed");
        if (actual.kind === "abstained") throw new Error("finite case unexpectedly lost identity");
        expect(actual.immediate.payload.afterFen).toBe(makeFen(next.position.toSetup()));
        const attacker = address(next, target.attacker), victim = address(next, target.victim)!;
        const capture = attacker === undefined ? undefined : { from: attacker, to: victim };
        if (preserved) {
          expect(actual.immediate.payload.outcome).toEqual({ result: "preserved", cause: "preserved", postCandidateExchange: {
            convention: "legal-exchange-for-move@1", captureUci: makeUci(capture!), resultUnits: captureValue(next.position, capture!), result: "positive",
          } });
          batchVisited += 1; expect("boundedReturn" in actual).toBe(false); continue;
        }
        const cause = attacker === undefined ? "attacker_captured" : victim !== target.victim ? "target_moved"
          : capture !== undefined && next.position.isLegal(capture) ? "exchange_neutralized" : "capture_illegal";
        expect(actual.immediate.payload.outcome).toEqual({ result: "removed", cause, postCandidateExchange: cause === "exchange_neutralized" ? {
          convention: "legal-exchange-for-move@1", captureUci: makeUci(capture!), resultUnits: captureValue(next.position, capture!), result: "non_positive",
        } : null });
        if (actual.kind !== "removed" || actual.boundedReturn.kind !== "evidence") throw new Error("finite case needs a complete return");
        const returned = returnOutcome(root, candidate, target);
        expect(actual.boundedReturn.item.payload).toMatchObject({ horizonPlies: 3, visitedPositions: returned.visited, outcome: { kind: returned.kind } });
        if (fixture.id.startsWith("checked-reply-universal") && ["c6c5", "c3c4"].includes(makeUci(candidate))) expect(returned.kind).toBe("survives_every_defence");
        if (fixture.id.startsWith("terminal-preparation") && ["c6c5", "c3c4"].includes(makeUci(candidate))) {
          const preparation = parseUci(fixture.id.endsWith("black") ? "b4c5" : "b5c4")!;
          if (!("from" in preparation)) throw new Error("literal preparation must move a piece");
          const terminal = step(next, preparation);
          expect(terminal.position.isCheck()).toBe(true);
          expect(moves(terminal.position)).toEqual([]);
          // Other preparations have mixed permitting/refuting replies. The
          // terminal preparation itself cannot supply either quantifier.
          expect(returned.kind).toBe("reintroduced");
          const outcome = actual.boundedReturn.item.payload.outcome;
          if (outcome.kind === "not_reintroduced") throw new Error("expected a nonterminal witness");
          expect(outcome.witness[1]).not.toBe(makeUci(preparation));
        }
        batchVisited += returned.visited;
        const outcome = actual.boundedReturn.item.payload.outcome;
        const checkLine = (line: readonly string[]) => line.slice(0, 3).reduce((state, uci) => {
          const move = parseUci(uci);
          expect(move !== undefined && "from" in move && state.position.isLegal(move)).toBe(true);
          if (move === undefined || !("from" in move)) throw new Error("invalid witness");
          return step(state, move);
        }, root);
        if (outcome.kind !== "not_reintroduced") {
          const witness = checkLine(outcome.witness);
          expect(available(witness, target)).toBe(true);
          const last = parseUci(outcome.witness[3])!;
          expect(witness.position.isLegal(last)).toBe(true);
          if (!("from" in last)) throw new Error("witness capture must move the original attacker");
          expect(witness.labels.get(last.from)).toBe(target.attacker);
          expect(witness.labels.get(last.to)).toBe(target.victim);
          expect(captureValue(witness.position, last)).toBeGreaterThan(0);
          if (outcome.kind === "survives_every_defence") {
            const preparation = checkLine(outcome.witness.slice(0, 2));
            const defences = moves(preparation.position);
            expect(defences.length).toBeGreaterThan(0);
            expect(defences.map(reply => available(step(preparation, reply), target))).toEqual(defences.map(() => true));
          }
        }
        if (outcome.kind === "reintroduced") {
          expect(outcome.firstRefutation.slice(0, 2)).toEqual(outcome.witness.slice(0, 2));
          expect(available(checkLine(outcome.firstRefutation), target)).toBe(false);
        }
        if (outcome.kind === "not_reintroduced" && outcome.firstRefutation !== null) expect(available(checkLine(outcome.firstRefutation), target)).toBe(false);
      }
    }
    expect(result.visitedPositions).toBe(batchVisited);
    // The registered operation runs the real service independently; none of its
    // three result adapters may drop/add candidates or reinterpret a zero target.
    const operation = await SEMANTIC_VALIDATION_OPERATIONS["runtime.semantic.bounded_target_batch"].invoke({ kind: "bounded_target_source", sourceFen: fixture.fen });
    expect(operation.kind).toBe("completed");
    if (operation.kind !== "completed") throw new Error("finite operation unavailable");
    const payloads = (id: string) => operation.observations.map(observationEvidence).filter(item => item.projection.id === id).map(item => item.payload);
    expect(payloads("derived.bounded_target.named_material_target")).toEqual(result.targets.map(row => row.target.payload));
    expect(payloads("derived.bounded_target.immediate")).toEqual(result.targets.flatMap(row => row.candidates.flatMap(candidate => candidate.kind === "abstained" ? [] : [candidate.immediate.payload])));
    expect(payloads("derived.bounded_target.bounded_return")).toEqual(result.targets.flatMap(row => row.candidates.flatMap(candidate => candidate.kind === "removed" && candidate.boundedReturn.kind === "evidence" ? [candidate.boundedReturn.item.payload] : [])));
  });
});
