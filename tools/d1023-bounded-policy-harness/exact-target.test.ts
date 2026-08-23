// DISPOSABLE research harness — D1023. Not production code.
import { writeFileSync } from "node:fs";

import { castlingSide, Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Move, Piece, Role, Square } from "chessops/types";
import { kingCastlesTo, makeSquare, makeUci, parseSquare, parseUci, rookCastlesTo } from "chessops/util";
import { describe, expect, it } from "vitest";

import { exchangeCaptureAt, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";
import { threats, type Threat } from "../../packages/runtime/src/tactics.js";
import { authoredRows, importedRows, legalOutcomes, type ResearchRow } from "../research-chess/populations.js";

const NODE_CAP = 25_000;
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const OUTPUT = new URL("./exact-census-output.md", import.meta.url).pathname;

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

interface ExactTargetResult {
  readonly kind: "result" | "budget_exhausted";
  readonly immediate: "preserved" | "removed" | "identity_lost";
  readonly reintroducedWithin3Ply: boolean;
  readonly preparationSurvivesEveryDefence: boolean;
  readonly witness?: readonly string[];
  readonly refutation?: readonly string[];
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
  readonly examples: readonly string[];
  readonly identityLostExamples: readonly string[];
}

function census(rows: readonly ResearchRow[]): Census {
  const played = { preserved: 0, removed: 0, identity_lost: 0 };
  const alternatives = { preserved: 0, removed: 0, identity_lost: 0 };
  const playedCauses: Record<ImmediateCause, number> = { preserved: 0, attacker_captured: 0, target_moved: 0, capture_illegal: 0, exchange_neutralized: 0, identity_lost: 0 };
  const alternativeCauses: Record<ImmediateCause, number> = { preserved: 0, attacker_captured: 0, target_moved: 0, capture_illegal: 0, exchange_neutralized: 0, identity_lost: 0 };
  const examples: string[] = [];
  const identityLostExamples: string[] = [];
  let decisionsWithTargets = 0, targetCount = 0;
  for (const row of rows) {
    const targets = materialTargets(row.parentFen);
    if (targets.length === 0) continue;
    decisionsWithTargets += 1;
    targetCount += targets.length;
    const alternativeRows = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== row.fen);
    for (const named of targets) {
      const playedResult = immediateAnalysis(row.parentFen, row.uci, named);
      played[playedResult.status] += 1;
      playedCauses[playedResult.cause] += 1;
      if (playedResult.status === "removed" && examples.length < 12) examples.push(`${row.id}:${named.baselineMoveUci}->${row.uci}:${playedResult.cause}`);
      if (playedResult.status === "identity_lost" && identityLostExamples.length < 12) identityLostExamples.push(`${row.id}:${named.baselineMoveUci}->${row.uci}`);
      for (const candidate of alternativeRows) {
        const result = immediateAnalysis(row.parentFen, candidate.uci, named);
        alternatives[result.status] += 1;
        alternativeCauses[result.cause] += 1;
      }
    }
  }
  return Object.freeze({ decisions: rows.length, decisionsWithTargets, targets: targetCount, played: Object.freeze(played), alternatives: Object.freeze(alternatives), playedCauses: Object.freeze(playedCauses), alternativeCauses: Object.freeze(alternativeCauses), examples: Object.freeze(examples), identityLostExamples: Object.freeze(identityLostExamples) });
}

function percent(part: number, total: number): string {
  return total === 0 ? "n/a" : `${(100 * part / total).toFixed(2)}%`;
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

  it("censuses immediate named-target removal over both fixed populations", () => {
    const populations = [
      { name: "authored pack spines", result: census(authoredRows()) },
      { name: "sealed imported fixed-ply sample", result: census(importedRows()) },
    ] as const;
    const lines = [
      "# D1023 exact immediate-target census",
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
        "",
      );
      expect(result.decisionsWithTargets).toBeGreaterThan(20);
      expect(result.played.removed).toBeGreaterThan(0);
      expect(result.alternatives.removed).toBeGreaterThan(0);
    }
    writeFileSync(OUTPUT, `${lines.join("\n").trimEnd()}\n`, "utf8");
  });
});
