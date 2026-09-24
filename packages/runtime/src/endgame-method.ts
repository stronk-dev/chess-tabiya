import type { Color, Move, Role, Square } from "chessops/types";
import { parseUci } from "chessops/util";

import { positionFromFen } from "./chess.js";
import { endgameSetupMatch, krpkrPlacement, rankFor, type EndgameConventionQuote, type EndgameConventionRef, type EndgameTechnique } from "./endgame-setup.js";

/**
 * Registered, cited and versioned method conventions for `theory.endgame.method_stage@1` ([[D2496]]).
 *
 * A method stage is a retrospective observation over an exact recorded path: "this stage of the
 * named method happened on these edges". It says nothing about whether the stage was best, whether
 * the outcome was preserved, whether the setup could have been reached or forced, or what to play.
 * Home and sources as for the setup conventions (`endgame-setup.ts`).
 */

export type MethodStage =
  | "lucena_bridge_prepared"
  | "lucena_king_excursion_started"
  | "lucena_bridge_interposed"
  | "philidor_pawn_entered_defender_third"
  | "philidor_rear_rank_switch"
  | "philidor_rear_check_delivered"
  | "vancura_pawn_entered_seventh"
  | "vancura_rook_moved_behind";

export interface MethodStageDeclaration {
  readonly stage: MethodStage;
  /** The stage that must already have been observed on the same path; `null` for the first stage. */
  readonly after: MethodStage | null;
  readonly predicate: string;
  readonly quotes: readonly EndgameConventionQuote[];
  readonly operationalization: string | null;
}

export interface EndgameMethodConvention {
  readonly id: string;
  readonly version: number;
  readonly technique: EndgameTechnique;
  /** The setup convention whose positive match must anchor the path. */
  readonly setup: EndgameConventionRef;
  readonly beneficiary: "pawn_side" | "defender";
  readonly sources: readonly string[];
  readonly stages: readonly MethodStageDeclaration[];
}

const q = (source: string, quote: string): EndgameConventionQuote => Object.freeze({ source, quote });

export const ENDGAME_METHOD_CONVENTIONS: readonly EndgameMethodConvention[] = deepFreeze([
  {
    id: "lucena-bridge-method",
    version: 1,
    technique: "lucena",
    setup: { id: "lucena-setup", version: 1 },
    beneficiary: "pawn_side",
    sources: ["wikipedia-lucena"],
    stages: [
      { stage: "lucena_bridge_prepared", after: null, predicate: "The attacking rook moves to the attacker's fourth rank while the pawn is on its seventh rank and the attacking king stays on the promotion square.", quotes: [q("wikipedia-lucena", "It is important that the white rook go initially to the fourth rank if Black uses his most active defense")], operationalization: "Only the fourth-rank bridge is recognized; the source's fifth-rank alternative (\"A bridge can also be built on the fifth rank\") is not a v1 stage." },
      { stage: "lucena_king_excursion_started", after: "lucena_bridge_prepared", predicate: "The attacking king moves off the promotion square.", quotes: [q("wikipedia-lucena", "White would like to move his king and then promote his pawn")], operationalization: null },
      { stage: "lucena_bridge_interposed", after: "lucena_king_excursion_started", predicate: "While in check, the attacker moves the rook so that it blocks the check: afterwards the side is out of check and the attacking king, the attacking rook and the defending rook share one file with the attacking rook between them.", quotes: [q("wikipedia-lucena", "The black rook can no longer check the white king without exchanging rooks, and Black cannot prevent the pawn from queening.")], operationalization: "The bridge is pinned to a same-file interposition between the checking rook and the king." },
    ],
  },
  {
    id: "philidor-third-rank-method",
    version: 1,
    technique: "philidor",
    setup: { id: "philidor-third-rank-setup", version: 1 },
    beneficiary: "defender",
    sources: ["wikipedia-philidor"],
    stages: [
      { stage: "philidor_pawn_entered_defender_third", after: null, predicate: "The attacker's pawn moves from its fifth rank or lower onto its sixth rank (the defender's third rank).", quotes: [q("wikipedia-philidor", "keep his rook on the third rank until the pawn advances to that rank")], operationalization: null },
      { stage: "philidor_rear_rank_switch", after: "philidor_pawn_entered_defender_third", predicate: "The defending rook moves from the defender's third rank to the defender's seventh or eighth rank.", quotes: [q("wikipedia-philidor", "then go to the far end of the board (the seventh or eighth rank) and check the king from behind")], operationalization: null },
      { stage: "philidor_rear_check_delivered", after: "philidor_rear_rank_switch", predicate: "The defending rook moves and gives check from an attacker-relative rank lower than the attacking king's.", quotes: [q("wikipedia-philidor", "then check the opposing king from behind")], operationalization: "\"From behind\" is pinned as the checking rook standing on a lower attacker-relative rank than the attacking king." },
    ],
  },
  {
    id: "vancura-method",
    version: 1,
    technique: "vancura",
    setup: { id: "vancura-setup", version: 1 },
    beneficiary: "defender",
    sources: ["wikipedia-rpvr"],
    stages: [
      { stage: "vancura_pawn_entered_seventh", after: null, predicate: "The attacker's rook pawn moves onto its seventh rank.", quotes: [q("wikipedia-rpvr", "The black rook moves behind the pawn as soon as the pawn moves up to its seventh rank.")], operationalization: null },
      { stage: "vancura_rook_moved_behind", after: "vancura_pawn_entered_seventh", predicate: "The defending rook moves onto the pawn's file on a lower attacker-relative rank than the pawn.", quotes: [q("wikipedia-rpvr", "The black rook moves behind the pawn as soon as the pawn moves up to its seventh rank.")], operationalization: null },
    ],
  },
]);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}

export function endgameMethodConvention(ref: EndgameConventionRef): EndgameMethodConvention | undefined {
  return ENDGAME_METHOD_CONVENTIONS.find((convention) => convention.id === ref.id && convention.version === ref.version);
}

export interface MethodPathStep { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }

export interface ObservedMethodStage {
  readonly technique: EndgameTechnique;
  readonly stage: MethodStage;
  readonly beneficiary: Color;
  /** Index into the replayed steps of the triggering edge. */
  readonly stepIndex: number;
}

const fileOf = (square: Square): number => square & 7;
const boardRank = (square: Square): number => (square >> 3) + 1;
const opposite = (color: Color): Color => color === "white" ? "black" : "white";

function only(fen: string, color: Color, role: Role): Square | undefined {
  const squares = [...positionFromFen(fen).board.pieces(color, role)];
  return squares.length === 1 ? squares[0] : undefined;
}

function moved(step: MethodPathStep, color: Color, role: Role): boolean {
  const move = parseUci(step.moveUci) as Move | undefined;
  if (move === undefined || !("from" in move)) return false;
  const piece = positionFromFen(step.beforeFen).board.get(move.from);
  return piece?.color === color && piece.role === role;
}

type StagePredicate = (step: MethodPathStep, attacker: Color) => boolean;

const PREDICATES: Readonly<Record<MethodStage, StagePredicate>> = Object.freeze({
  lucena_bridge_prepared: (step, attacker) => {
    const rook = only(step.afterFen, attacker, "rook");
    const pawn = only(step.afterFen, attacker, "pawn");
    const king = only(step.afterFen, attacker, "king");
    if (rook === undefined || pawn === undefined || king === undefined || !moved(step, attacker, "rook")) return false;
    const promotion = ((attacker === "white" ? 7 : 0) * 8 + fileOf(pawn)) as Square;
    return rankFor(attacker, rook) === 4 && rankFor(attacker, pawn) === 7 && king === promotion;
  },
  lucena_king_excursion_started: (step, attacker) => {
    const pawn = only(step.beforeFen, attacker, "pawn");
    if (pawn === undefined || !moved(step, attacker, "king")) return false;
    const promotion = ((attacker === "white" ? 7 : 0) * 8 + fileOf(pawn)) as Square;
    return only(step.beforeFen, attacker, "king") === promotion && only(step.afterFen, attacker, "king") !== promotion;
  },
  lucena_bridge_interposed: (step, attacker) => {
    if (!positionFromFen(step.beforeFen).isCheck() || positionFromFen(step.afterFen).isCheck() || !moved(step, attacker, "rook")) return false;
    const king = only(step.afterFen, attacker, "king");
    const rook = only(step.afterFen, attacker, "rook");
    const enemy = only(step.afterFen, opposite(attacker), "rook");
    if (king === undefined || rook === undefined || enemy === undefined) return false;
    if (fileOf(king) !== fileOf(rook) || fileOf(rook) !== fileOf(enemy)) return false;
    return boardRank(rook) > Math.min(boardRank(king), boardRank(enemy)) && boardRank(rook) < Math.max(boardRank(king), boardRank(enemy));
  },
  philidor_pawn_entered_defender_third: (step, attacker) => {
    const before = only(step.beforeFen, attacker, "pawn");
    const after = only(step.afterFen, attacker, "pawn");
    return moved(step, attacker, "pawn") && before !== undefined && after !== undefined && rankFor(attacker, before) <= 5 && rankFor(attacker, after) === 6;
  },
  philidor_rear_rank_switch: (step, attacker) => {
    const defender = opposite(attacker);
    const before = only(step.beforeFen, defender, "rook");
    const after = only(step.afterFen, defender, "rook");
    return moved(step, defender, "rook") && before !== undefined && after !== undefined && rankFor(defender, before) === 3 && rankFor(defender, after) >= 7;
  },
  philidor_rear_check_delivered: (step, attacker) => {
    const defender = opposite(attacker);
    const rook = only(step.afterFen, defender, "rook");
    const king = only(step.afterFen, attacker, "king");
    return moved(step, defender, "rook") && rook !== undefined && king !== undefined && positionFromFen(step.afterFen).isCheck() && rankFor(attacker, rook) < rankFor(attacker, king);
  },
  vancura_pawn_entered_seventh: (step, attacker) => {
    const before = only(step.beforeFen, attacker, "pawn");
    const after = only(step.afterFen, attacker, "pawn");
    return moved(step, attacker, "pawn") && before !== undefined && after !== undefined && rankFor(attacker, before) <= 6 && rankFor(attacker, after) === 7;
  },
  vancura_rook_moved_behind: (step, attacker) => {
    const defender = opposite(attacker);
    const rook = only(step.afterFen, defender, "rook");
    const pawn = only(step.afterFen, attacker, "pawn");
    return moved(step, defender, "rook") && rook !== undefined && pawn !== undefined && fileOf(rook) === fileOf(pawn) && rankFor(attacker, rook) < rankFor(attacker, pawn);
  },
});

/**
 * Replays one registered method convention over exact contiguous steps whose first before-FEN is a
 * positive match of the convention's setup. Each stage fires at most once and only after its
 * prerequisite stage; the replay stops at the first step that leaves exact KRPKR material or
 * changes the pawn side (captures and promotion end the method's domain).
 */
export function replayEndgameMethod(convention: EndgameMethodConvention, steps: readonly MethodPathStep[]): readonly ObservedMethodStage[] {
  if (steps.length === 0) return Object.freeze([]);
  const setup = endgameSetupMatch(steps[0]!.beforeFen, convention.setup);
  if (setup.kind !== "matched") throw new TypeError(`Method replay requires a ${convention.setup.id}@${convention.setup.version} setup at the path start`);
  const attacker = setup.value.operands.attacker;
  const beneficiary = convention.beneficiary === "pawn_side" ? attacker : opposite(attacker);
  const observed: ObservedMethodStage[] = [];
  const seen = new Set<MethodStage>();
  for (const [index, step] of steps.entries()) {
    const after = krpkrPlacement(positionFromFen(step.afterFen));
    if (after === null || after.attacker !== attacker) break;
    for (const declared of convention.stages) {
      if (seen.has(declared.stage) || (declared.after !== null && !seen.has(declared.after))) continue;
      if (!PREDICATES[declared.stage](step, attacker)) continue;
      seen.add(declared.stage);
      observed.push(Object.freeze({ technique: convention.technique, stage: declared.stage, beneficiary, stepIndex: index }));
      break;
    }
  }
  return Object.freeze(observed);
}
