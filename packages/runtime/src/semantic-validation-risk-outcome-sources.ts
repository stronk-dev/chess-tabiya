/** Build/test-only D1716 legal-exchange@1 reference, never a collector or chess judgement.
 * External Chessops supplies legal moves/positions only. Expected risk uses a separate
 * whole-board material minimax over same-landing-square recaptures, with the disclosed
 * optional stop at each node. No production tactics/exchange/lineage output is an oracle.
 */
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import type { Color, NormalMove, Role, Square } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";
import type { SubjectOutcomePopulation } from "./semantic-subject-types.js";
import type { ControlLiteralPopulation } from "./semantic-validation-control-outcome-sources.js";
import { referenceRetainedPieces, retainedReferenceInput } from "./semantic-validation-line-outcome-sources.js";
import { ATTACK_CITED_SOURCES } from "./semantic-validation-literal-sources.js";
import { SLIDER_LITERAL_EXAMPLES } from "./semantic-validation-slider-sources.js";
import { referenceRulesPopulation, type ReferencePopulation } from "./semantic-validation-reference-inputs.js";
import { parseSemanticValidationExpectation, type SemanticMirrorOperandRule, type SemanticValidationCase,
  type SemanticSubjectOutcomesInput, type SemanticValidationExpectation, type SemanticValidationPropositionRecord } from "./semantic-validation.js";

// These are the explicitly declared product convention's units, not engine evaluations.
const units: Readonly<Record<Role, number>> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };
const opposite = (color: Color): Color => color === "white" ? "black" : "white";
const square = (at: number) => `${String.fromCharCode(97 + at % 8)}${1 + Math.floor(at / 8)}`;

function legalMoves(position: Chess): readonly NormalMove[] {
  const moves: NormalMove[] = [];
  for (const [from, destinations] of position.allDests()) for (const to of destinations) {
    const promotions = position.board.get(from)?.role === "pawn" && (to < 8 || to >= 56)
      ? ["bishop", "knight", "queen", "rook"] as const : [undefined];
    for (const promotion of promotions) moves.push({ from, to, ...(promotion === undefined ? {} : { promotion }) });
  }
  return moves;
}

function capturedSquare(position: Chess, move: NormalMove): Square | undefined {
  const mover = position.board.get(move.from), target = position.board.get(move.to);
  if (mover === undefined) throw Error("Legal reference move has no mover");
  if (target !== undefined && target.color !== mover.color) return move.to;
  if (mover.role === "pawn" && move.from % 8 !== move.to % 8 && target === undefined && position.epSquare === move.to) {
    const at = (Math.floor(move.from / 8) * 8 + move.to % 8) as Square, victim = position.board.get(at);
    if (victim?.role !== "pawn" || victim.color === mover.color) throw Error("Missing legal EP victim");
    return at;
  }
  return undefined;
}

function materialBalance(position: Chess, perspective: Color) {
  let balance = 0;
  for (const at of position.board.occupied) {
    const piece = position.board.get(at)!;
    balance += (piece.color === perspective ? 1 : -1) * units[piece.role];
  }
  return balance;
}

// Complete finite tree: each edge captures one piece. Unlike the production incremental
// capture-delta recurrence, this oracle recomputes whole-board balances at every node.
function bestBalance(position: Chess, landing: Square, perspective: Color): number {
  let best = materialBalance(position, perspective); // Optional stop, even in check, by convention.
  for (const move of legalMoves(position)) {
    if (move.to !== landing || capturedSquare(position, move) === undefined) continue;
    const child = position.clone(); child.play(move);
    const value = bestBalance(child, landing, perspective);
    best = position.turn === perspective ? Math.max(best, value) : Math.min(best, value);
  }
  return best;
}

function captureUnits(position: Chess, move: NormalMove): number {
  const perspective = position.turn, baseline = materialBalance(position, perspective);
  const child = position.clone(); child.play(move);
  return bestBalance(child, move.to, perspective) - baseline;
}

export function referenceExchangeUnits(fen: string, moveUci: string): number | undefined {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap(), move = parseUci(moveUci);
  if (move === undefined || !("from" in move) || !position.isLegal(move) || capturedSquare(position, move) === undefined) return undefined;
  return captureUnits(position, move);
}

/** Turn cloning is attempted before the domain can be empty. Root EP is cleared when
 * changing the turn; genuine child EP stays, and its victim is not its landing square.
 */
export function referenceRiskCaptures(fen: string, victimColor: Color) {
  const original = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  let clone = original;
  if (original.turn !== opposite(victimColor)) {
    const turned = Chess.fromSetup({ ...original.toSetup(), turn: opposite(victimColor), epSquare: undefined });
    if (!turned.isOk) return undefined;
    clone = turned.value;
  }
  return legalMoves(clone).flatMap(move => {
    const victim = capturedSquare(clone, move);
    return victim === undefined ? [] : [{ moveUci: makeUci(move), victimSquare: square(victim), landingSquare: square(move.to), resultUnits: captureUnits(clone, move) }];
  });
}

export function referenceRiskStates(rootFen: string, afterFen = rootFen, move: string | null = null) {
  const actor: Color = rootFen.split(" ")[1] === "w" ? "white" : "black";
  const captures = referenceRiskCaptures(afterFen, actor);
  if (captures === undefined) return undefined;
  return referenceRetainedPieces(rootFen, afterFen, move).flatMap(({ root, current }) => {
    if (root.color !== actor || root.role === "king") return [];
    if (current === null) throw Error("An own non-king piece cannot disappear in its own legal move");
    return [{ subject: { kind: "loose_piece" as const, root }, parameters: {},
      state: { kind: "present" as const, value: captures.some(capture => capture.victimSquare === current.square && capture.resultUnits > 0), current } }];
  });
}
const relation = (before: boolean, after: boolean) => before ? after ? "true_to_true" : "true_to_false" : after ? "false_to_true" : "false_to_false";

export function referenceRiskPopulation(row: ControlLiteralPopulation, move: string): SubjectOutcomePopulation<"loose_piece"> | undefined {
  const { population } = retainedReferenceInput("loose_piece", row, move), root = referenceRiskStates(row.root);
  const played = referenceRiskStates(row.root, population.played.afterFen, move);
  const alternatives = population.alternatives.filter(edge => edge.moveUci !== move)
    .map(edge => ({ moveUci: edge.moveUci, states: referenceRiskStates(row.root, edge.afterFen, edge.moveUci) }));
  if (root === undefined || played === undefined || alternatives.some(edge => edge.states === undefined)) return undefined;
  return { family: "loose_piece", beforeFen: row.root, moveUci: move, afterFen: population.played.afterFen,
    actor: row.root.split(" ")[1] === "w" ? "white" : "black", subjects: root.map((origin, at) => ({
      subject: origin.subject, parameters: origin.parameters, root: origin.state, played: played[at]!.state,
      playedRelation: relation(origin.state.value, played[at]!.state.value), alternatives: alternatives.map(edge => ({
        moveUci: edge.moveUci, state: edge.states![at]!.state, relation: relation(origin.state.value, edge.states![at]!.state.value),
      })),
    })) };
}

export function referenceRiskEvents(row: ControlLiteralPopulation, move: string) {
  const population = referenceRiskPopulation(row, move);
  if (population === undefined) return undefined;
  const { subjects, ...context } = population;
  return subjects.flatMap(({ playedRelation, ...subject }) => (["false_to_true", "true_to_false", "true_to_true", "false_to_false"] as const).flatMap(alternativeRelation => {
    if (alternativeRelation === playedRelation) return [];
    const supportingMoves = subject.alternatives.filter(edge => edge.relation === alternativeRelation).map(edge => edge.moveUci);
    return supportingMoves.length === 0 ? [] : [{ sign: "avoided" as const, operands: { ...context, ...subject, alternativeRelation,
      supportingMoves, legalAlternatives: subject.alternatives.length, alternativesWithOutcome: supportingMoves.length } }];
  }));
}

const seeds = [
  { id: "capture", root: "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1", plays: ["c4d5", "h1g1", "d2d4"] },
  { id: "defended-profit", root: "7k/8/8/4p3/3Q4/2P5/8/7K w - - 0 1", plays: ["d4d3", "h1g1"] },
  { id: "unprofitable", root: "7k/8/8/4q3/3P4/2P5/8/7K w - - 0 1", plays: ["d4d5", "c3c4"] },
  { id: "zero", root: "7k/8/8/4p3/3P4/2P5/8/7K w - - 0 1", plays: ["d4d5", "h1g1"] },
  { id: "pin", root: "4k3/4n3/2N5/8/8/8/7P/4R2K w - - 7 1", plays: ["h2h3", "c6b4"] },
  { id: "unpin", root: "5k2/4n3/2N5/8/8/8/7P/4R2K w - - 7 1", plays: ["h2h3", "c6b4"] },
  { id: "ep-double-push", root: "7k/8/8/8/3p4/8/4P3/7K w - - 0 1", plays: ["e2e4", "e2e3", "h1g1"] },
  { id: "ep-pinned", root: "3k4/8/8/8/3p4/8/4P3/3R3K w - - 0 1", plays: ["e2e4", "h1g1"] },
  { id: "capture-promotion", root: "7k/8/8/8/8/8/2p5/3R3K w - - 0 1", plays: ["d1d2", "h1g1"] },
  { id: "promotion", root: "7r/P7/7k/8/8/8/8/7K w - - 0 1", plays: ["a7a8b", "a7a8n", "a7a8q", "a7a8r"] },
  { id: "uniform-true", root: "7k/8/8/8/8/p1n5/P7/7K w - - 0 1", plays: ["h1g1"] },
  { id: "uniform-false", root: "7k/8/8/8/8/8/P7/1N5K w - - 0 1", plays: ["h1g1"] },
  { id: "empty", root: "7k/8/8/8/8/8/8/7K w - - 0 1", plays: ["h1g1"] },
  { id: "invalid-empty", root: "7k/8/8/8/8/8/4r3/4K3 w - - 0 1", plays: ["e1e2", "e1f1"] },
  { id: "invalid-own-piece", root: "7k/8/8/8/8/8/P3r3/4K3 w - - 0 1", plays: ["e1e2"] },
  { id: "decline-min", root: "7k/6b1/8/4p3/3P4/8/8/3R3K w - - 0 1", plays: ["h1g1", "d4d5"] },
  { id: "decline-max", root: "7k/6b1/8/4q3/3P4/2P5/8/3R3K w - - 0 1", plays: ["h1g1", "d4d5"] },
  { id: "decline-profit", root: "7k/6q1/8/4p3/3Q4/2P5/8/3R3K w - - 0 1", plays: ["h1h2", "d4d3"] },
] as const;
const mirrorMove = (move: string) => move.replace(/[1-8]/gu, digit => String(9 - Number(digit)));
function mirroredInput(root: string) {
  const [board, turn, rights, ep, half, full] = root.split(" ");
  const swap = (text: string) => [...text].map(char => char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()).join("");
  return [swap(board!.split("/").reverse().join("/")), turn === "w" ? "b" : "w", swap(rights!), mirrorMove(ep!), half, full].join(" ");
}
export const RISK_OUTCOME_POPULATIONS: readonly ReferencePopulation[] = [
  ...seeds.flatMap(row => [referenceRulesPopulation(`${row.id}.white`, `${row.id}.black`, row.root, row.plays),
    referenceRulesPopulation(`${row.id}.black`, `${row.id}.white`, mirroredInput(row.root), row.plays.map(mirrorMove))]),
  ...SLIDER_LITERAL_EXAMPLES.filter(row => /^(castle-|stationary-|crossing\.)/u.test(row.id))
    .map(row => referenceRulesPopulation(row.id, row.partner, row.beforeFen, [row.moveUci])),
];
const rule = (sourcePath: readonly string[], value: "identity" | "color" | "square" | "uci", partnerPath = sourcePath):
  SemanticMirrorOperandRule => ({ sourcePath, partnerPath, value, collection: "scalar" });
function stateRules(from: readonly string[], to = from): readonly SemanticMirrorOperandRule[] {
  return [rule([...from, "kind"], "identity", [...to, "kind"]), rule([...from, "value"], "identity", [...to, "value"]),
    rule([...from, "current", "color"], "color", [...to, "current", "color"]), rule([...from, "current", "role"], "identity", [...to, "current", "role"]),
    rule([...from, "current", "square"], "square", [...to, "current", "square"])];
}
function mirrorRules(row: ReferencePopulation, move: string): readonly SemanticMirrorOperandRule[] {
  const partner = RISK_OUTCOME_POPULATIONS.find(other => other.id === row.partner)!;
  const left = retainedReferenceInput("loose_piece", row, move).population.alternatives.filter(edge => edge.moveUci !== move);
  const right = retainedReferenceInput("loose_piece", partner, mirrorMove(move)).population.alternatives.filter(edge => edge.moveUci !== mirrorMove(move));
  const rules: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    rule(["family"], "identity"), rule(["actor"], "color"), rule(["subject", "kind"], "identity"),
    rule(["subject", "root", "color"], "color"), rule(["subject", "root", "role"], "identity"), rule(["subject", "root", "square"], "square"),
    ...stateRules(["root"]), ...stateRules(["played"]), rule(["alternativeRelation"], "identity"),
    rule(["legalAlternatives"], "identity"), rule(["alternativesWithOutcome"], "identity"),
    { sourcePath: ["supportingMoves", "*"], partnerPath: ["supportingMoves", "*"], value: "uci", collection: "canonical_set" },
  ];
  for (const [at, edge] of left.entries()) {
    const other = right.findIndex(candidate => candidate.moveUci === mirrorMove(edge.moveUci));
    if (other < 0) throw Error("Original risk source lost a mirrored legal alternative");
    const from = ["alternatives", String(at)], to = ["alternatives", String(other)];
    rules.push(rule([...from, "moveUci"], "uci", [...to, "moveUci"]), rule([...from, "relation"], "identity", [...to, "relation"]),
      ...stateRules([...from, "state"], [...to, "state"]));
  }
  return rules;
}
type SourceCase = { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticSubjectOutcomesInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> };
const id = (row: string, arm: string) => `cited.literal-board.risk-outcome.${row}.${arm}`;
const subject = { kind: "event", projection: { id: "derived.semantic_avoidance.loose_piece", version: 2 } } as const;
const basis = ATTACK_CITED_SOURCES.find(source => source.sourceId === "python-chess.loose-omission");
if (basis === undefined) throw Error("Pinned capture legality source is missing");
/** The pinned geometric/legal-move excerpt grounds legal capture membership. The units,
 * same-square exchange minimax and optional stops remain disclosed legal-exchange@1,
 * not strategic or forced-gain truth. New original-subject propositions have new IDs.
 */
export const RISK_OUTCOME_LITERAL_SOURCE = {
  sourceId: "python-chess.literal-board.risk-outcome", sourceRevision: basis.sourceRevision,
  licence: basis.licence, url: basis.url, text: basis.text,
  operation: { id: "runtime.semantic.subject_outcomes", version: 1 } as const,
  cases: RISK_OUTCOME_POPULATIONS.flatMap(row => {
    const move = row.plays[0]!, input = retainedReferenceInput("loose_piece", row, move), events = referenceRiskEvents(row, move);
    // An unavailable turn clone is not an available semantic omission. Focused proofs
    // retain those inputs; they cannot silently discharge the canonical negative arm.
    if (events === undefined) return [];
    const make = (arm: SemanticValidationCase["arm"], expectation: SemanticValidationExpectation): SourceCase => ({
      arm, input, proposition: { subject, case: { id: id(row.id, arm), version: 1 }, factConstraint: [], expectation },
    });
    if (events.length === 0) return [make("semantic_negative", { kind: "omits" })];
    const exact = parseSemanticValidationExpectation({ kind: "emits_exact", events }, subject);
    if (exact.kind !== "emits_exact") throw Error("Whole risk source output required");
    return [make("positive", exact), make("counterfactual", { kind: "emits", minimum: 1, sign: "avoided", operandMatch: exact.events[0]!.operands }),
      make("orientation", { kind: "mirrors", geometry: "color_and_vertical",
        partnerCase: { kind: "case", id: id(row.partner, "orientation"), version: 1, subject, arm: "orientation" },
        targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(row, move) })];
  }),
};
