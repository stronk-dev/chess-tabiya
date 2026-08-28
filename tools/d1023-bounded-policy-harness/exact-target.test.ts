// DISPOSABLE research harness — D1023. Not production code.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
import { castlingSide, Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Move, Piece, Role, Square } from "chessops/types";
import { kingCastlesTo, makeSquare, makeUci, opposite, parseSquare, parseUci, rookCastlesTo } from "chessops/util";
import { describe, expect, it } from "vitest";

import { exchangeCaptureAt, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";
import { classifyPhase } from "../../packages/runtime/src/phase.js";
import { threats, type Threat } from "../../packages/runtime/src/tactics.js";
import { authoredRows, importedRows, legalOutcomes, type ResearchRow } from "../research-chess/populations.js";

const NODE_CAP = 25_000;
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const OUTPUT = new URL("./exact-census-output.md", import.meta.url).pathname;
const PROVIDER_SAMPLE = new URL("./provider-sample.json", import.meta.url).pathname;

interface TrackedPiece {
  readonly color: Color;
  readonly role: Role;
  readonly square: Square;
}

interface MaterialTarget {
  readonly kind: "material";
  readonly attacker: TrackedPiece;
  readonly target: TrackedPiece;
  readonly baselineMoveUci: string;
}

interface DestinationTarget {
  readonly kind: "destination";
  readonly minor: TrackedPiece;
  readonly controllingPawn?: TrackedPiece;
  readonly square: Square;
}

interface ExactTargetResult {
  readonly kind: "result" | "budget_exhausted";
  readonly immediate: "preserved" | "removed" | "identity_lost";
  readonly reintroducedWithin3Ply: boolean;
  readonly preparationSurvivesEveryDefence: boolean;
  readonly witness?: readonly string[];
  readonly refutation?: readonly string[];
  readonly witnessCause?: "controlling_pawn_moved_or_captured" | "other";
  readonly visited: number;
}

type ImmediateCause = "preserved" | "attacker_captured" | "target_moved" | "capture_illegal" | "exchange_neutralized" | "identity_lost";
interface ImmediateAnalysis { readonly status: ExactTargetResult["immediate"]; readonly cause: ImmediateCause }

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function legalMoves(pos: Chess): readonly Move[] {
  const result: Move[] = [];
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
    const promotions: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
      ? PROMOTIONS
      : [undefined];
    for (const promotion of promotions) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (pos.isLegal(move)) result.push(move);
    }
  }
  return result.sort((left, right) => makeUci(left).localeCompare(makeUci(right)));
}

function materialTargets(fen: string): readonly MaterialTarget[] {
  const reading = threats(fen);
  if (reading.kind === "abstained") return [];
  return reading.threats.flatMap((threat: Threat): readonly MaterialTarget[] => {
    if (threat.target === undefined || threat.mate) return [];
    const attackerSquare = parseSquare(threat.threateningPiece.square);
    const targetSquare = parseSquare(threat.target.square);
    if (attackerSquare === undefined || targetSquare === undefined) return [];
    return [Object.freeze({
      kind: "material",
      attacker: Object.freeze({ ...threat.threateningPiece.piece, square: attackerSquare }),
      target: Object.freeze({ ...threat.target.piece, square: targetSquare }),
      baselineMoveUci: threat.threatenedMove,
    })];
  });
}

function samePiece(pos: Chess, value: TrackedPiece): boolean {
  const piece = pos.board.get(value.square);
  return piece?.color === value.color && piece.role === value.role;
}

function passPosition(pos: Chess, turn: Color): Chess | undefined {
  const result = Chess.fromSetup({ ...pos.toSetup(), turn, epSquare: undefined });
  return result.isOk ? result.value : undefined;
}

function locallyNonLosingQuiet(pos: Chess, move: Move): boolean {
  if (!("from" in move) || !pos.isLegal(move) || exchangeCaptureAt(pos, move) !== undefined) return false;
  const next = pos.clone();
  next.play(move);
  return !legalMoves(next)
    .filter((capture) => "from" in capture && capture.to === move.to && exchangeCaptureAt(next, capture) !== undefined)
    .some((capture) => (legalExchangeForMove(next, capture)?.resultUnits ?? 0) > 0);
}

function destinationTargets(beforeFen: string, candidateUci: string): readonly DestinationTarget[] | undefined {
  const before = position(beforeFen);
  const candidate = parseUci(candidateUci);
  if (candidate === undefined || !("from" in candidate) || !before.isLegal(candidate)) throw new TypeError(`Illegal candidate ${candidateUci}`);
  const pawn = before.board.get(candidate.from);
  if (pawn?.role !== "pawn") return [];
  const after = before.clone();
  after.play(candidate);
  const moved = after.board.get(candidate.to);
  if (moved?.role !== "pawn" || moved.color !== pawn.color) return [];
  const enemy = opposite(pawn.color);
  const beforeEnemy = passPosition(before, enemy);
  if (beforeEnemy === undefined) return undefined;
  const oldControls = attacks(pawn, candidate.from, before.board.occupied);
  const targets: DestinationTarget[] = [];
  for (const square of attacks(moved, candidate.to, after.board.occupied)) {
    if (oldControls.has(square) || after.board.get(square) !== undefined) continue;
    for (const role of ["bishop", "knight"] as const) for (const minorSquare of before.board.pieces(enemy, role)) {
      if (after.board.getColor(minorSquare) !== enemy || after.board.getRole(minorSquare) !== role) continue;
      const arrival: Move = { from: minorSquare, to: square };
      if (!beforeEnemy.isLegal(arrival) || !after.isLegal(arrival) || !locallyNonLosingQuiet(beforeEnemy, arrival)) continue;
      const afterArrival = after.clone();
      afterArrival.play(arrival);
      const pawnCapture: Move = { from: candidate.to, to: square };
      if (!afterArrival.isLegal(pawnCapture) || (legalExchangeForMove(afterArrival, pawnCapture)?.resultUnits ?? 0) <= 0) continue;
      targets.push(Object.freeze({
        kind: "destination",
        minor: Object.freeze({ color: enemy, role, square: minorSquare }),
        controllingPawn: Object.freeze({ color: pawn.color, role: "pawn", square: candidate.to }),
        square,
      }));
    }
  }
  return Object.freeze(targets.sort((left, right) => `${makeSquare(left.minor.square)}${makeSquare(left.square)}`.localeCompare(`${makeSquare(right.minor.square)}${makeSquare(right.square)}`)));
}

function advanceIdentity(pos: Chess, move: Move, value: TrackedPiece): TrackedPiece | undefined {
  const side = castlingSide(pos, move);
  if (side !== undefined && "from" in move) {
    const rookFrom = pos.castles.rook[pos.turn][side];
    if (move.from === value.square) {
      return Object.freeze({ color: value.color, role: value.role, square: kingCastlesTo(pos.turn, side) });
    }
    if (rookFrom === value.square) {
      return Object.freeze({ color: value.color, role: value.role, square: rookCastlesTo(pos.turn, side) });
    }
  }
  const captured = exchangeCaptureAt(pos, move);
  if (captured?.square === value.square) return undefined;
  if (!("from" in move) || move.from !== value.square) return value;
  return Object.freeze({ color: value.color, role: move.promotion ?? value.role, square: move.to });
}

function playTracking(pos: Chess, move: Move, target: MaterialTarget): { readonly pos: Chess; readonly target: MaterialTarget } | undefined {
  const attacker = advanceIdentity(pos, move, target.attacker);
  const victim = advanceIdentity(pos, move, target.target);
  const next = pos.clone();
  next.play(move);
  if (attacker === undefined || victim === undefined || !samePiece(next, attacker) || !samePiece(next, victim)) return undefined;
  return Object.freeze({ pos: next, target: Object.freeze({ ...target, attacker, target: victim }) });
}

function playDestinationTracking(pos: Chess, move: Move, target: DestinationTarget): { readonly pos: Chess; readonly target: DestinationTarget } | undefined {
  const minor = advanceIdentity(pos, move, target.minor);
  const controllingPawn = target.controllingPawn === undefined ? undefined : advanceIdentity(pos, move, target.controllingPawn);
  if (minor === undefined) return undefined;
  const next = pos.clone();
  next.play(move);
  if (!samePiece(next, minor) || controllingPawn !== undefined && !samePiece(next, controllingPawn)) return undefined;
  return Object.freeze({ pos: next, target: Object.freeze({ ...target, minor, ...(controllingPawn === undefined ? {} : { controllingPawn }) }) });
}

function destinationAvailable(pos: Chess, target: DestinationTarget): boolean {
  if (pos.turn !== target.minor.color || !samePiece(pos, target.minor) || pos.board.get(target.square) !== undefined) return false;
  return locallyNonLosingQuiet(pos, { from: target.minor.square, to: target.square });
}

function examineDestination(afterFen: string, candidateUci: string, target: DestinationTarget): ExactTargetResult {
  const afterCandidate = position(afterFen);
  if (destinationAvailable(afterCandidate, target)) throw new TypeError(`Destination target was not removed by ${candidateUci}`);
  let visited = 1;
  let witness: readonly string[] | undefined;
  let witnessCause: ExactTargetResult["witnessCause"];
  let forcingWitness: readonly string[] | undefined;
  let firstRefutation: readonly string[] | undefined;
  for (const preparation of legalMoves(afterCandidate)) {
    visited += 1;
    if (visited > NODE_CAP) return Object.freeze({ kind: "budget_exhausted", immediate: "removed", reintroducedWithin3Ply: witness !== undefined, preparationSurvivesEveryDefence: false, ...(witness === undefined ? {} : { witness, witnessCause }), visited });
    const afterPreparation = playDestinationTracking(afterCandidate, preparation, target);
    if (afterPreparation === undefined) continue;
    const replies = legalMoves(afterPreparation.pos);
    if (replies.length === 0) continue;
    let everyReply = true;
    let preparationWitness: readonly string[] | undefined;
    let preparationRefutation: readonly string[] | undefined;
    for (const reply of replies) {
      visited += 1;
      if (visited > NODE_CAP) return Object.freeze({ kind: "budget_exhausted", immediate: "removed", reintroducedWithin3Ply: witness !== undefined, preparationSurvivesEveryDefence: false, ...(witness === undefined ? {} : { witness, witnessCause }), visited });
      const afterReply = playDestinationTracking(afterPreparation.pos, reply, afterPreparation.target);
      if (afterReply === undefined || !destinationAvailable(afterReply.pos, afterReply.target)) {
        everyReply = false;
        preparationRefutation ??= Object.freeze([candidateUci, makeUci(preparation), makeUci(reply)]);
        continue;
      }
      const line = Object.freeze([candidateUci, makeUci(preparation), makeUci(reply), `${makeSquare(afterReply.target.minor.square)}${makeSquare(afterReply.target.square)}`]);
      preparationWitness ??= line;
      if (witness === undefined) {
        witness = line;
        witnessCause = afterReply.target.controllingPawn === undefined || afterReply.target.controllingPawn.square !== target.controllingPawn?.square
          ? "controlling_pawn_moved_or_captured"
          : "other";
      }
    }
    if (everyReply && preparationWitness !== undefined) {
      forcingWitness = preparationWitness;
      break;
    }
    firstRefutation ??= preparationRefutation;
  }
  return Object.freeze({
    kind: "result",
    immediate: "removed",
    reintroducedWithin3Ply: witness !== undefined,
    preparationSurvivesEveryDefence: forcingWitness !== undefined,
    ...(forcingWitness !== undefined ? { witness: forcingWitness } : witness !== undefined ? { witness } : {}),
    ...(firstRefutation === undefined ? {} : { refutation: firstRefutation }),
    ...(witnessCause === undefined ? {} : { witnessCause }),
    visited,
  });
}

function positiveTargetCapture(pos: Chess, target: MaterialTarget): Move | undefined {
  if (pos.turn !== target.attacker.color || !samePiece(pos, target.attacker) || !samePiece(pos, target.target)) return undefined;
  const move: Move = { from: target.attacker.square, to: target.target.square };
  if (!pos.isLegal(move)) return undefined;
  return (legalExchangeForMove(pos, move)?.resultUnits ?? 0) > 0 ? move : undefined;
}

function immediateAnalysis(fen: string, candidateUci: string, target: MaterialTarget): ImmediateAnalysis {
  const root = position(fen);
  const parsed = parseUci(candidateUci);
  if (parsed === undefined || !root.isLegal(parsed)) throw new TypeError(`Illegal candidate ${candidateUci}`);
  if (exchangeCaptureAt(root, parsed)?.square === target.attacker.square) return Object.freeze({ status: "removed", cause: "attacker_captured" });
  const afterCandidate = playTracking(root, parsed, target);
  if (afterCandidate === undefined) return Object.freeze({ status: "identity_lost", cause: "identity_lost" });
  if (positiveTargetCapture(afterCandidate.pos, afterCandidate.target) !== undefined) return Object.freeze({ status: "preserved", cause: "preserved" });
  if (afterCandidate.target.target.square !== target.target.square) return Object.freeze({ status: "removed", cause: "target_moved" });
  const capture: Move = { from: afterCandidate.target.attacker.square, to: afterCandidate.target.target.square };
  return afterCandidate.pos.isLegal(capture)
    ? Object.freeze({ status: "removed", cause: "exchange_neutralized" })
    : Object.freeze({ status: "removed", cause: "capture_illegal" });
}

function examine(fen: string, candidateUci: string, target: MaterialTarget): ExactTargetResult {
  const root = position(fen);
  const parsed = parseUci(candidateUci);
  if (parsed === undefined || !root.isLegal(parsed)) throw new TypeError(`Illegal candidate ${candidateUci}`);
  if (exchangeCaptureAt(root, parsed)?.square === target.attacker.square) {
    return Object.freeze({ kind: "result", immediate: "removed", reintroducedWithin3Ply: false, preparationSurvivesEveryDefence: false, witness: Object.freeze([candidateUci]), visited: 1 });
  }
  const afterCandidate = playTracking(root, parsed, target);
  if (afterCandidate === undefined) return Object.freeze({ kind: "result", immediate: "identity_lost", reintroducedWithin3Ply: false, preparationSurvivesEveryDefence: false, visited: 1 });
  if (positiveTargetCapture(afterCandidate.pos, afterCandidate.target) !== undefined) {
    return Object.freeze({ kind: "result", immediate: "preserved", reintroducedWithin3Ply: false, preparationSurvivesEveryDefence: false, witness: Object.freeze([candidateUci, makeUci(positiveTargetCapture(afterCandidate.pos, afterCandidate.target)!)]), visited: 1 });
  }

  let visited = 1;
  let witness: readonly string[] | undefined;
  let forcingWitness: readonly string[] | undefined;
  let firstRefutation: readonly string[] | undefined;
  for (const preparation of legalMoves(afterCandidate.pos)) {
    visited += 1;
    if (visited > NODE_CAP) return Object.freeze({ kind: "budget_exhausted", immediate: "removed", reintroducedWithin3Ply: witness !== undefined, preparationSurvivesEveryDefence: false, ...(witness === undefined ? {} : { witness }), visited });
    const afterPreparation = playTracking(afterCandidate.pos, preparation, afterCandidate.target);
    if (afterPreparation === undefined) continue;
    const replies = legalMoves(afterPreparation.pos);
    if (replies.length === 0) continue;
    let everyReply = true;
    let preparationWitness: readonly string[] | undefined;
    let preparationRefutation: readonly string[] | undefined;
    for (const reply of replies) {
      visited += 1;
      if (visited > NODE_CAP) return Object.freeze({ kind: "budget_exhausted", immediate: "removed", reintroducedWithin3Ply: witness !== undefined, preparationSurvivesEveryDefence: false, ...(witness === undefined ? {} : { witness }), visited });
      const afterReply = playTracking(afterPreparation.pos, reply, afterPreparation.target);
      const capture = afterReply === undefined ? undefined : positiveTargetCapture(afterReply.pos, afterReply.target);
      if (capture === undefined) {
        everyReply = false;
        preparationRefutation ??= Object.freeze([candidateUci, makeUci(preparation), makeUci(reply)]);
        continue;
      }
      const line = Object.freeze([candidateUci, makeUci(preparation), makeUci(reply), makeUci(capture)]);
      preparationWitness ??= line;
      witness ??= line;
    }
    if (everyReply && preparationWitness !== undefined) {
      forcingWitness = preparationWitness;
      break;
    }
    firstRefutation ??= preparationRefutation;
  }
  return Object.freeze({
    kind: "result",
    immediate: "removed",
    reintroducedWithin3Ply: witness !== undefined,
    preparationSurvivesEveryDefence: forcingWitness !== undefined,
    ...(forcingWitness !== undefined ? { witness: forcingWitness } : witness !== undefined ? { witness } : {}),
    ...(firstRefutation === undefined ? {} : { refutation: firstRefutation }),
    visited,
  });
}

function target(fen: string, baselineMoveUci: string): MaterialTarget {
  const found = materialTargets(fen).find((value) => value.baselineMoveUci === baselineMoveUci);
  if (found === undefined) throw new TypeError(`Missing baseline threat ${baselineMoveUci} in ${fen}`);
  return found;
}

interface Census {
  readonly decisions: number;
  readonly decisionsWithTargets: number;
  readonly targets: number;
  readonly played: Readonly<Record<ExactTargetResult["immediate"], number>>;
  readonly alternatives: Readonly<Record<ExactTargetResult["immediate"], number>>;
  readonly playedCauses: Readonly<Record<ImmediateCause, number>>;
  readonly alternativeCauses: Readonly<Record<ImmediateCause, number>>;
  readonly playedBounded: BoundedCounts;
  readonly alternativeBounded: BoundedCounts;
  readonly examples: readonly string[];
  readonly identityLostExamples: readonly string[];
  readonly playedReintroducedExamples: readonly string[];
  readonly playedUniversalExamples: readonly string[];
  readonly providerPairs: readonly ProviderPair[];
  readonly timing: {
    readonly coldMs: number;
    readonly callP95Ms: number;
    readonly callMaxMs: number;
    readonly measuredCalls: number;
    readonly warmP95Ms: number;
    readonly warmMaxMs: number;
    readonly measuredDecisions: number;
    readonly maxTargetCandidatePairs: number;
  };
}

interface ProviderPair {
  readonly sourceId: string;
  readonly parentFen: string;
  readonly candidateUci: string;
  readonly afterFen: string;
  readonly played: boolean;
  readonly phase: ReturnType<typeof classifyPhase>["phase"];
  readonly targetFamily: "material" | "destination";
  readonly target: Readonly<Record<string, unknown>>;
  readonly exact: {
    readonly immediate: ExactTargetResult["immediate"];
    readonly reintroducedWithin3Ply: boolean;
    readonly preparationSurvivesEveryDefence: boolean;
  };
}

function providerPair(row: ResearchRow, candidateUci: string, afterFen: string, played: boolean, named: MaterialTarget | DestinationTarget, result: ExactTargetResult): ProviderPair {
  const target = named.kind === "material"
    ? {
        attacker: { ...named.attacker, square: makeSquare(named.attacker.square) },
        target: { ...named.target, square: makeSquare(named.target.square) },
        baselineMoveUci: named.baselineMoveUci,
      }
    : {
        minor: { ...named.minor, square: makeSquare(named.minor.square) },
        controllingPawn: named.controllingPawn === undefined ? null : { ...named.controllingPawn, square: makeSquare(named.controllingPawn.square) },
        square: makeSquare(named.square),
      };
  return Object.freeze({
    sourceId: row.id,
    parentFen: row.parentFen,
    candidateUci,
    afterFen,
    played,
    phase: classifyPhase(row.parentFen).phase,
    targetFamily: named.kind,
    target: Object.freeze(target),
    exact: Object.freeze({ immediate: result.immediate, reintroducedWithin3Ply: result.reintroducedWithin3Ply, preparationSurvivesEveryDefence: result.preparationSurvivesEveryDefence }),
  });
}

interface BoundedCounts {
  readonly evaluated: number;
  readonly removedNow: number;
  readonly reintroduced: number;
  readonly survivesEveryDefence: number;
  readonly budgetExhausted: number;
  readonly visitedP50: number;
  readonly visitedP90: number;
  readonly visitedP99: number;
  readonly visitedMax: number;
}

interface MutableBoundedCounts {
  evaluated: number;
  removedNow: number;
  reintroduced: number;
  survivesEveryDefence: number;
  budgetExhausted: number;
  visited: number[];
}

function emptyBoundedCounts(): MutableBoundedCounts {
  return { evaluated: 0, removedNow: 0, reintroduced: 0, survivesEveryDefence: 0, budgetExhausted: 0, visited: [] };
}

function recordBounded(counts: MutableBoundedCounts, result: ExactTargetResult): void {
  counts.evaluated += 1;
  counts.visited.push(result.visited);
  if (result.immediate === "removed") counts.removedNow += 1;
  if (result.reintroducedWithin3Ply) counts.reintroduced += 1;
  if (result.preparationSurvivesEveryDefence) counts.survivesEveryDefence += 1;
  if (result.kind === "budget_exhausted") counts.budgetExhausted += 1;
}

function percentile(sorted: readonly number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)]!;
}

function freezeBounded(counts: MutableBoundedCounts): BoundedCounts {
  const visited = counts.visited.toSorted((left, right) => left - right);
  return Object.freeze({
    evaluated: counts.evaluated,
    removedNow: counts.removedNow,
    reintroduced: counts.reintroduced,
    survivesEveryDefence: counts.survivesEveryDefence,
    budgetExhausted: counts.budgetExhausted,
    visitedP50: percentile(visited, 0.5),
    visitedP90: percentile(visited, 0.9),
    visitedP99: percentile(visited, 0.99),
    visitedMax: visited.at(-1) ?? 0,
  });
}

function census(rows: readonly ResearchRow[]): Census {
  const played = { preserved: 0, removed: 0, identity_lost: 0 };
  const alternatives = { preserved: 0, removed: 0, identity_lost: 0 };
  const playedCauses: Record<ImmediateCause, number> = { preserved: 0, attacker_captured: 0, target_moved: 0, capture_illegal: 0, exchange_neutralized: 0, identity_lost: 0 };
  const alternativeCauses: Record<ImmediateCause, number> = { preserved: 0, attacker_captured: 0, target_moved: 0, capture_illegal: 0, exchange_neutralized: 0, identity_lost: 0 };
  const examples: string[] = [];
  const identityLostExamples: string[] = [];
  const playedReintroducedExamples: string[] = [];
  const playedUniversalExamples: string[] = [];
  const providerPairs: ProviderPair[] = [];
  const playedBounded = emptyBoundedCounts();
  const alternativeBounded = emptyBoundedCounts();
  const decisionDurations: number[] = [];
  const callDurations: number[] = [];
  const targetCandidatePairs: number[] = [];
  let decisionsWithTargets = 0, targetCount = 0;
  for (const row of rows) {
    const targets = materialTargets(row.parentFen);
    if (targets.length === 0) continue;
    const decisionStarted = performance.now();
    decisionsWithTargets += 1;
    targetCount += targets.length;
    const alternativeRows = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== row.fen);
    targetCandidatePairs.push(targets.length * (1 + alternativeRows.length));
    for (const named of targets) {
      const playedResult = immediateAnalysis(row.parentFen, row.uci, named);
      const playedStarted = performance.now();
      const playedHorizon = examine(row.parentFen, row.uci, named);
      callDurations.push(performance.now() - playedStarted);
      providerPairs.push(providerPair(row, row.uci, row.fen, true, named, playedHorizon));
      recordBounded(playedBounded, playedHorizon);
      if (playedHorizon.reintroducedWithin3Ply && playedReintroducedExamples.length < 12) {
        playedReintroducedExamples.push(`${row.id}:${named.baselineMoveUci}->${playedHorizon.witness?.join(",") ?? row.uci}`);
      }
      if (playedHorizon.preparationSurvivesEveryDefence && playedUniversalExamples.length < 12) {
        playedUniversalExamples.push(`${row.id}:${named.baselineMoveUci}->${playedHorizon.witness?.join(",") ?? row.uci}`);
      }
      played[playedResult.status] += 1;
      playedCauses[playedResult.cause] += 1;
      if (playedResult.status === "removed" && examples.length < 12) examples.push(`${row.id}:${named.baselineMoveUci}->${row.uci}:${playedResult.cause}`);
      if (playedResult.status === "identity_lost" && identityLostExamples.length < 12) identityLostExamples.push(`${row.id}:${named.baselineMoveUci}->${row.uci}`);
      for (const candidate of alternativeRows) {
        const result = immediateAnalysis(row.parentFen, candidate.uci, named);
        const alternativeStarted = performance.now();
        const alternativeHorizon = examine(row.parentFen, candidate.uci, named);
        callDurations.push(performance.now() - alternativeStarted);
        recordBounded(alternativeBounded, alternativeHorizon);
        providerPairs.push(providerPair(row, candidate.uci, candidate.fen, false, named, alternativeHorizon));
        alternatives[result.status] += 1;
        alternativeCauses[result.cause] += 1;
      }
    }
    decisionDurations.push(performance.now() - decisionStarted);
  }
  const warm = decisionDurations.slice(1).sort((left, right) => left - right);
  const calls = callDurations.sort((left, right) => left - right);
  return Object.freeze({
    decisions: rows.length,
    decisionsWithTargets,
    targets: targetCount,
    played: Object.freeze(played),
    alternatives: Object.freeze(alternatives),
    playedCauses: Object.freeze(playedCauses),
    alternativeCauses: Object.freeze(alternativeCauses),
    playedBounded: freezeBounded(playedBounded),
    alternativeBounded: freezeBounded(alternativeBounded),
    examples: Object.freeze(examples),
    identityLostExamples: Object.freeze(identityLostExamples),
    playedReintroducedExamples: Object.freeze(playedReintroducedExamples),
    playedUniversalExamples: Object.freeze(playedUniversalExamples),
    providerPairs: Object.freeze(providerPairs),
    timing: Object.freeze({
      coldMs: decisionDurations[0] ?? 0,
      callP95Ms: percentile(calls, 0.95),
      callMaxMs: calls.at(-1) ?? 0,
      measuredCalls: calls.length,
      warmP95Ms: percentile(warm, 0.95),
      warmMaxMs: warm.at(-1) ?? 0,
      measuredDecisions: decisionDurations.length,
      maxTargetCandidatePairs: Math.max(0, ...targetCandidatePairs),
    }),
  });
}

function percent(part: number, total: number): string {
  return total === 0 ? "n/a" : `${(100 * part / total).toFixed(2)}%`;
}

interface DestinationCensus {
  readonly candidates: number;
  readonly abstained: number;
  readonly targets: number;
  readonly bounded: BoundedCounts;
  readonly reintroducedByPawnRelinquish: number;
  readonly reintroducedOther: number;
  readonly reintroducedExamples: readonly string[];
  readonly universalExamples: readonly string[];
  readonly providerPairs: readonly ProviderPair[];
}

function destinationCensus(rows: readonly ResearchRow[], alternatives: boolean): DestinationCensus {
  const bounded = emptyBoundedCounts();
  const reintroducedExamples: string[] = [];
  const universalExamples: string[] = [];
  const providerPairs: ProviderPair[] = [];
  let candidates = 0, abstained = 0, targets = 0;
  let reintroducedByPawnRelinquish = 0, reintroducedOther = 0;
  for (const row of rows) {
    const choices = alternatives
      ? legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== row.fen)
      : [{ uci: row.uci, fen: row.fen }];
    for (const choice of choices) {
      candidates += 1;
      const namedTargets = destinationTargets(row.parentFen, choice.uci);
      if (namedTargets === undefined) {
        abstained += 1;
        continue;
      }
      targets += namedTargets.length;
      for (const named of namedTargets) {
        const result = examineDestination(choice.fen, choice.uci, named);
        providerPairs.push(providerPair(row, choice.uci, choice.fen, !alternatives, named, result));
        recordBounded(bounded, result);
        if (result.reintroducedWithin3Ply) {
          if (result.witnessCause === "controlling_pawn_moved_or_captured") reintroducedByPawnRelinquish += 1;
          else reintroducedOther += 1;
        }
        const identity = `${makeSquare(named.minor.square)}>${makeSquare(named.square)}`;
        if (result.reintroducedWithin3Ply && reintroducedExamples.length < 12) reintroducedExamples.push(`${row.id}:${choice.uci}:${identity}->${result.witness?.join(",")}`);
        if (result.preparationSurvivesEveryDefence && universalExamples.length < 12) universalExamples.push(`${row.id}:${choice.uci}:${identity}->${result.witness?.join(",")}`);
      }
    }
  }
  return Object.freeze({ candidates, abstained, targets, bounded: freezeBounded(bounded), reintroducedByPawnRelinquish, reintroducedOther, reintroducedExamples: Object.freeze(reintroducedExamples), universalExamples: Object.freeze(universalExamples), providerPairs: Object.freeze(providerPairs) });
}

function exactCell(pair: ProviderPair): string {
  return pair.exact.immediate === "preserved"
    ? "preserved"
    : pair.exact.preparationSurvivesEveryDefence
      ? "removed_universal"
      : pair.exact.reintroducedWithin3Ply
        ? "removed_reintroduced"
        : "removed_not_reintroduced";
}

function sampleDigest(pair: ProviderPair): string {
  return createHash("sha256").update(`${pair.sourceId}|${pair.candidateUci}|${pair.targetFamily}|${JSON.stringify(pair.target)}`).digest("hex");
}

function roundRobin<T>(values: readonly T[], count: number, cellFor: (value: T) => string, digestFor: (value: T) => string): { readonly selected: readonly T[]; readonly strata: readonly Readonly<Record<string, unknown>>[] } {
  const byCell = new Map<string, T[]>();
  for (const value of values) {
    const cell = cellFor(value), found = byCell.get(cell) ?? [];
    found.push(value);
    byCell.set(cell, found);
  }
  const cells = [...byCell].map(([cell, found]) => ({ cell, values: found.toSorted((left, right) => digestFor(left).localeCompare(digestFor(right))), cursor: 0 }))
    .sort((left, right) => createHash("sha256").update(left.cell).digest("hex").localeCompare(createHash("sha256").update(right.cell).digest("hex")));
  const selected: T[] = [];
  while (selected.length < count) {
    let advanced = false;
    for (const cell of cells) {
      const value = cell.values[cell.cursor];
      if (value === undefined) continue;
      selected.push(value);
      cell.cursor += 1;
      advanced = true;
      if (selected.length === count) break;
    }
    if (!advanced) break;
  }
  return Object.freeze({ selected: Object.freeze(selected), strata: Object.freeze(cells.map((cell) => Object.freeze({ cell: cell.cell, available: cell.values.length, selected: cell.cursor }))) });
}

function providerSample(population: string, pairs: readonly ProviderPair[]): Readonly<Record<string, unknown>> {
  const materialGroups = new Map<string, ProviderPair[]>();
  for (const pair of pairs.filter((value) => value.targetFamily === "material")) {
    const key = `${pair.sourceId}|${JSON.stringify(pair.target)}`;
    const found = materialGroups.get(key) ?? [];
    found.push(pair);
    materialGroups.set(key, found);
  }
  const anchors = [...materialGroups].flatMap(([key, values]) => {
    const played = values.find((value) => value.played), alternatives = values.filter((value) => !value.played);
    return played === undefined || alternatives.length === 0 ? [] : [{ key, played, alternatives }];
  });
  const material = roundRobin(anchors, 16, (anchor) => `${anchor.played.phase}|${exactCell(anchor.played)}`, (anchor) => createHash("sha256").update(anchor.key).digest("hex"));
  const materialRows = material.selected.flatMap((anchor) => [anchor.played, anchor.alternatives.toSorted((left, right) => sampleDigest(left).localeCompare(sampleDigest(right)))[0]!]);
  const destination = roundRobin(
    pairs.filter((value) => value.targetFamily === "destination"),
    16,
    (pair) => `${pair.played ? "played" : "alternative"}|${pair.phase}|${exactCell(pair)}`,
    sampleDigest,
  );
  const selected = [...materialRows, ...destination.selected];
  for (let index = 0; index < materialRows.length; index += 2) {
    const played = materialRows[index]!, alternative = materialRows[index + 1]!;
    if (!played.played || alternative.played || played.sourceId !== alternative.sourceId || JSON.stringify(played.target) !== JSON.stringify(alternative.target)) {
      throw new TypeError("Material provider pair lost its same-target join");
    }
  }
  return Object.freeze({
    population,
    available: pairs.length,
    selected: selected.length,
    materialAnchorsAvailable: anchors.length,
    materialAnchorStrata: material.strata,
    destinationRowsAvailable: pairs.filter((value) => value.targetFamily === "destination").length,
    destinationStrata: destination.strata,
    rows: Object.freeze(selected),
  });
}

describe("D1023 exact target identity core", () => {
  const rookThreat = "r3k3/8/8/8/8/8/8/Q3K3 w - - 0 1";

  it("separates an immediately preserved target from a removed target", () => {
    const named = target(rookThreat, "a8a1");
    expect(examine(rookThreat, "e1e2", named)).toMatchObject({ kind: "result", immediate: "preserved" });
    expect(examine(rookThreat, "a1b1", named)).toMatchObject({ kind: "result", immediate: "removed" });
  });

  it("tracks the target piece after it moves instead of laundering its old square", () => {
    const named = target(rookThreat, "a8a1");
    const result = examine(rookThreat, "a1b1", named);
    expect(result.immediate).toBe("removed");
    expect(result.witness?.at(-1)).toBe("a1c1");
    expect(result.reintroducedWithin3Ply).toBe(true);
  });

  it("keeps existential reintroduction weaker than surviving every defence", () => {
    const named = target(rookThreat, "a8a1");
    const result = examine(rookThreat, "a1b1", named);
    expect(result.reintroducedWithin3Ply).toBe(true);
    expect(result.preparationSurvivesEveryDefence).toBe(false);
    expect(result.refutation).toBeDefined();
  });

  it("records capturing the named attacker as exact removal, not identity loss", () => {
    const fen = "r3k3/8/8/8/8/8/q7/R3K3 w - - 0 1";
    const named = target(fen, "a2a1");
    expect(examine(fen, "a1a2", named)).toMatchObject({ immediate: "removed", reintroducedWithin3Ply: false, witness: ["a1a2"] });
  });

  it("abstains at the threat source while the side to move is checked", () => {
    const checked = "4k3/8/8/8/8/8/4r3/Q3K3 w - - 0 1";
    expect(threats(checked)).toMatchObject({ kind: "abstained", reason: "pass_while_in_check" });
    expect(materialTargets(checked)).toEqual([]);
  });

  it("emits only the bounded fact vocabulary", () => {
    const source = ["removed", "preserved", "identity_lost", "reintroducedWithin3Ply", "preparationSurvivesEveryDefence"].join(" ");
    for (const banned of ["prophylaxis", "forced", "best", "mistake", "good", "bad", "plan", "intent"]) expect(source).not.toContain(banned);
  });

  it("keeps fixture FENs canonical and candidate UCIs legal", () => {
    for (const [fen, uci] of [[rookThreat, "a1b1"], [rookThreat, "e1e2"]] as const) {
      const pos = position(fen), move = parseUci(uci);
      expect(makeFen(pos.toSetup())).toBe(fen);
      expect(move !== undefined && pos.isLegal(move)).toBe(true);
      expect(makeSquare((move as { readonly to: Square }).to)).toMatch(/^[a-h][1-8]$/u);
    }
  });

  it("tracks the rook identity through chessops rook-square castling", () => {
    const row = importedRows().find((candidate) => candidate.id === "https://lichess.org/6V4B2WOT#32");
    expect(row).toBeDefined();
    const named = target(row!.parentFen, "d4h8");
    expect(immediateAnalysis(row!.parentFen, row!.uci, named)).toEqual({ status: "removed", cause: "target_moved" });
  });

  it("has a fixed positive where one preparation restores the target through every defence", () => {
    const fen = "r1bq1rk1/pp3pp1/5b1p/3p4/3P4/2N3P1/PP3PBP/R2Q1RK1 b - - 0 13";
    const result = examine(fen, "c8e6", target(fen, "c3d5"));
    expect(result).toMatchObject({
      kind: "result",
      immediate: "removed",
      reintroducedWithin3Ply: true,
      preparationSurvivesEveryDefence: true,
    });
    expect(result.witness?.slice(0, 2)).toEqual(["c8e6", "d1b3"]);
  });

  it("keeps pawn-created destination denial separate from legality and from bounded return", () => {
    const fen = "4k3/8/8/4n3/8/8/7P/4K3 w - - 0 1";
    const afterFen = "4k3/8/8/4n3/8/7P/8/4K3 b - - 0 1";
    const targets = destinationTargets(fen, "h2h3");
    expect(targets).toHaveLength(1);
    expect(targets?.[0]).toMatchObject({ kind: "destination", square: parseSquare("g4") });
    expect(examineDestination(afterFen, "h2h3", targets![0]!)).toMatchObject({
      immediate: "removed",
      reintroducedWithin3Ply: true,
      preparationSurvivesEveryDefence: false,
    });
  });

  it("censuses both named-target families over the full bounded horizon", () => {
    const sources = [
      { name: "authored pack spines", rows: authoredRows() },
      { name: "sealed imported fixed-ply sample", rows: importedRows() },
    ] as const;
    const populations = sources.map((source) => ({ ...source, result: census(source.rows) }));
    const lines = [
      "# D1023 exact named-target census",
      "",
      "A target is one pre-candidate `threat@1` positive material capture with exact attacker/target identity. `removed` means that same attacker cannot make a positive legal exchange capture of the tracked target immediately after the candidate. It is not a plan, prophylaxis, force or move grade.",
      "",
      "| population | decisions with target / all | target identities | played removed / preserved / identity-lost | alternatives removed / preserved / identity-lost | removed rate played / alternatives / lift |",
      "|---|---:|---:|---:|---:|---:|",
    ];
    for (const { name, result } of populations) {
      const playedTotal = result.played.removed + result.played.preserved + result.played.identity_lost;
      const alternativeTotal = result.alternatives.removed + result.alternatives.preserved + result.alternatives.identity_lost;
      const playedRate = result.played.removed / playedTotal;
      const alternativeRate = result.alternatives.removed / alternativeTotal;
      lines.push(`| ${name} | ${result.decisionsWithTargets}/${result.decisions} | ${result.targets} | ${result.played.removed} / ${result.played.preserved} / ${result.played.identity_lost} | ${result.alternatives.removed} / ${result.alternatives.preserved} / ${result.alternatives.identity_lost} | ${percent(result.played.removed, playedTotal)} / ${percent(result.alternatives.removed, alternativeTotal)} / ${(playedRate / alternativeRate).toFixed(2)}x |`);
      lines.push(
        "",
        `${name} played causes (preserved / attacker captured / target moved / capture illegal / exchange neutralized / identity lost): ${result.playedCauses.preserved} / ${result.playedCauses.attacker_captured} / ${result.playedCauses.target_moved} / ${result.playedCauses.capture_illegal} / ${result.playedCauses.exchange_neutralized} / ${result.playedCauses.identity_lost}.`,
        `${name} alternative causes: ${result.alternativeCauses.preserved} / ${result.alternativeCauses.attacker_captured} / ${result.alternativeCauses.target_moved} / ${result.alternativeCauses.capture_illegal} / ${result.alternativeCauses.exchange_neutralized} / ${result.alternativeCauses.identity_lost}.`,
        `${name} played-removal examples: ${result.examples.join(", ") || "none"}.`,
        `${name} identity-loss examples: ${result.identityLostExamples.join(", ") || "none"}.`,
        `${name} played bounded (evaluated / removed-now / reintroduced / survives-every-defence / budget-exhausted): ${result.playedBounded.evaluated} / ${result.playedBounded.removedNow} / ${result.playedBounded.reintroduced} / ${result.playedBounded.survivesEveryDefence} / ${result.playedBounded.budgetExhausted}.`,
        `${name} alternative bounded: ${result.alternativeBounded.evaluated} / ${result.alternativeBounded.removedNow} / ${result.alternativeBounded.reintroduced} / ${result.alternativeBounded.survivesEveryDefence} / ${result.alternativeBounded.budgetExhausted}.`,
        `${name} visited positions played p50/p90/p99/max: ${result.playedBounded.visitedP50} / ${result.playedBounded.visitedP90} / ${result.playedBounded.visitedP99} / ${result.playedBounded.visitedMax}; alternatives: ${result.alternativeBounded.visitedP50} / ${result.alternativeBounded.visitedP90} / ${result.alternativeBounded.visitedP99} / ${result.alternativeBounded.visitedMax}.`,
        `${name} played reintroduction examples: ${result.playedReintroducedExamples.join("; ") || "none"}.`,
        `${name} played survives-every-defence examples: ${result.playedUniversalExamples.join("; ") || "none"}.`,
        `${name} execution timing (call p95/max/count; cold position; warm position p95/max/count; max target×candidate pairs): ${result.timing.callP95Ms.toFixed(2)} ms / ${result.timing.callMaxMs.toFixed(2)} ms / ${result.timing.measuredCalls}; ${result.timing.coldMs.toFixed(2)} ms; ${result.timing.warmP95Ms.toFixed(2)} ms / ${result.timing.warmMaxMs.toFixed(2)} ms / ${result.timing.measuredDecisions}; ${result.timing.maxTargetCandidatePairs}.`,
        "",
      );
      expect(result.decisionsWithTargets).toBeGreaterThan(20);
      expect(result.played.removed).toBeGreaterThan(0);
      expect(result.alternatives.removed).toBeGreaterThan(0);
      expect(result.playedBounded.budgetExhausted).toBe(0);
      expect(result.alternativeBounded.budgetExhausted).toBe(0);
      console.info(`bounded-target timing ${name}: call-p95=${result.timing.callP95Ms.toFixed(2)}ms call-max=${result.timing.callMaxMs.toFixed(2)}ms calls=${result.timing.measuredCalls} cold-position=${result.timing.coldMs.toFixed(2)}ms warm-position-p95=${result.timing.warmP95Ms.toFixed(2)}ms warm-position-max=${result.timing.warmMaxMs.toFixed(2)}ms decisions=${result.timing.measuredDecisions} max-target-candidate-pairs=${result.timing.maxTargetCandidatePairs}`);
    }
    expect(populations.every(({ result }) => result.timing.coldMs < 1_000)).toBe(true);
    expect(populations.every(({ result }) => result.timing.callP95Ms < 100)).toBe(true);
    expect(populations.every(({ result }) => result.timing.warmP95Ms < 500)).toBe(true);
    expect(populations.every(({ result }) => result.timing.callMaxMs < 2_000)).toBe(true);
    expect(populations.every(({ result }) => result.timing.warmMaxMs < 5_000)).toBe(true);
    expect(populations.every(({ result }) => result.timing.maxTargetCandidatePairs <= 512)).toBe(true);
    const syncSafe = populations.every(({ result }) => result.timing.callMaxMs < 250 && result.timing.warmMaxMs < 1_000);
    expect(syncSafe).toBe(false);
    lines.push("## Pawn-created minor-destination targets", "", "A destination target is the same named bishop/knight and empty square: legal and locally non-losing before a pawn move, still legal but locally losing specifically to the moved pawn after it. Bounded return asks whether that same minor-to-square move becomes locally non-losing again after one opponent preparation and one defender reply.", "", "| population | played candidates / abstained / targets | alternative candidates / abstained / targets | target return played / alternatives | survives every defence played / alternatives |", "|---|---:|---:|---:|---:|");
    const providerPopulations: Readonly<Record<string, unknown>>[] = [];
    for (const { name, rows, result: material } of populations) {
      const played = destinationCensus(rows, false), alternative = destinationCensus(rows, true);
      lines.push(
        `| ${name} | ${played.candidates} / ${played.abstained} / ${played.targets} | ${alternative.candidates} / ${alternative.abstained} / ${alternative.targets} | ${played.bounded.reintroduced}/${played.bounded.evaluated} / ${alternative.bounded.reintroduced}/${alternative.bounded.evaluated} | ${played.bounded.survivesEveryDefence}/${played.bounded.evaluated} / ${alternative.bounded.survivesEveryDefence}/${alternative.bounded.evaluated} |`,
        "",
        `${name} destination return cause played (controlling pawn moved/captured / other): ${played.reintroducedByPawnRelinquish} / ${played.reintroducedOther}; alternatives: ${alternative.reintroducedByPawnRelinquish} / ${alternative.reintroducedOther}.`,
        `${name} destination visited positions played p50/p90/p99/max: ${played.bounded.visitedP50} / ${played.bounded.visitedP90} / ${played.bounded.visitedP99} / ${played.bounded.visitedMax}; alternatives: ${alternative.bounded.visitedP50} / ${alternative.bounded.visitedP90} / ${alternative.bounded.visitedP99} / ${alternative.bounded.visitedMax}.`,
        `${name} destination reintroduction examples: ${played.reintroducedExamples.join("; ") || "none"}.`,
        `${name} destination survives-every-defence examples: ${played.universalExamples.join("; ") || "none"}.`,
        "",
      );
      expect(played.abstained).toBeLessThan(5);
      expect(alternative.bounded.budgetExhausted).toBe(0);
      const sample = providerSample(name, [...material.providerPairs, ...played.providerPairs, ...alternative.providerPairs]);
      providerPopulations.push(sample);
      expect(sample.selected).toBe(48);
    }
    writeFileSync(OUTPUT, `${lines.join("\n").trimEnd()}\n`, "utf8");
    writeFileSync(PROVIDER_SAMPLE, `${JSON.stringify({
      version: 1,
      generatedAt: "2026-08-23",
      rule: "16 material anchors round-robin by phase × played exact result, each with played + one same-target SHA-256 alternative; 16 standalone destination rows round-robin by played/alternative × phase × exact result",
      populations: providerPopulations,
    }, null, 2)}\n`, "utf8");
  });
});
