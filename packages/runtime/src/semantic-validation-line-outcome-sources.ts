/** Build/test-only D1716 independent original-piece reference, never a collector.
 * Decode placement and physical identity without production lineage/ray helpers. The
 * declared full-ray convention counts occupied strict-interior squares, even beyond
 * the first blocker. It is not an attack, pin, move-quality or tactical verdict.
 */
import type { Color, Role, SquareName } from "chessops/types";
import type { StateByFamily, SubjectOutcomePopulation } from "./semantic-subject-types.js";
import { parseSemanticValidationExpectation, semanticLegalSetDigest, type SemanticSubjectOutcomesInput,
  type SemanticMirrorOperandRule, type SemanticMirrorValueRule, type SemanticValidationCase,
  type SemanticValidationExpectation, type SemanticValidationPropositionRecord } from "./semantic-validation.js";
import type { ControlLiteralPopulation } from "./semantic-validation-control-outcome-sources.js";
import { SLIDER_LITERAL_EXAMPLES, SLIDER_LITERAL_SOURCE } from "./semantic-validation-slider-sources.js";
import { referenceRulesPopulation, type ReferencePopulation } from "./semantic-validation-reference-inputs.js";

export interface ReferencePiece { readonly color: Color; readonly role: Role; readonly square: SquareName }
const roles: Readonly<Record<string, Role>> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
const square = (at: number) => `${String.fromCharCode(97 + at % 8)}${1 + Math.floor(at / 8)}` as SquareName;
const index = (name: string) => (Number(name[1]) - 1) * 8 + name.charCodeAt(0) - 97;
const directions = [-1, 0, 1].flatMap(df => [-1, 0, 1].filter(dr => df !== 0 || dr !== 0).map(dr => ({ df, dr }))) as readonly { df: -1 | 0 | 1; dr: -1 | 0 | 1 }[];

export function referencePlacement(fen: string): ReadonlyMap<number, ReferencePiece> {
  const rows = fen.split(" ")[0]!.split("/").reverse(), pieces = new Map<number, ReferencePiece>();
  if (rows.length !== 8) throw Error("Expected eight literal ranks");
  for (const [rank, row] of rows.entries()) {
    let file = 0;
    for (const token of row) {
      if (/^[1-8]$/u.test(token)) file += Number(token);
      else {
        const role = roles[token.toLowerCase()];
        if (role === undefined || file >= 8) throw Error("Invalid literal piece placement");
        const at = 8 * rank + file++;
        pieces.set(at, { color: token === token.toUpperCase() ? "white" : "black", role, square: square(at) });
      }
    }
    if (file !== 8) throw Error("Invalid literal rank width");
  }
  return pieces;
}

/** Root-square keyed physical identities, including captured originals. King-to-own-rook
 * UCI is the canonical castle spelling; both pieces relocate even if stationary/swapped.
 * The successor board authenticates all retained roles/colors and complete membership.
 */
export function referenceRetainedPieces(rootFen: string, afterFen: string, move: string | null) {
  const before = referencePlacement(rootFen), after = referencePlacement(afterFen), relocations = new Map<number, number>();
  let captured: number | undefined, promotion: Role | undefined;
  if (move !== null) {
    const from = index(move.slice(0, 2)), to = index(move.slice(2, 4));
    const mover = before.get(from), target = before.get(to);
    if (mover === undefined) throw Error("Missing original mover");
    if (mover.role === "king" && target?.color === mover.color && target.role === "rook") {
      const rank = Math.floor(from / 8) * 8, right = to > from;
      relocations.set(from, rank + (right ? 6 : 2)); relocations.set(to, rank + (right ? 5 : 3));
    } else {
      relocations.set(from, to);
      if (target !== undefined) {
        if (target.color === mover.color) throw Error("Own-piece capture is not an ordinary move");
        captured = to;
      } else if (mover.role === "pawn" && from % 8 !== to % 8) {
        captured = Math.floor(from / 8) * 8 + to % 8;
        const victim = before.get(captured);
        if (victim?.role !== "pawn" || victim.color === mover.color) throw Error("Missing original EP victim");
      }
      if (move.length === 5) {
        promotion = roles[move[4]!];
        if (mover.role !== "pawn" || promotion === undefined || promotion === "pawn" || promotion === "king") throw Error("Invalid promotion identity");
      }
    }
  }
  const retained = [...before.entries()].map(([at, root]) => {
    if (at === captured) return { root, current: null };
    const destination = relocations.get(at) ?? at, current = after.get(destination);
    const role = move !== null && root.square === move.slice(0, 2) ? promotion ?? root.role : root.role;
    if (current?.color !== root.color || current.role !== role) throw Error("Successor changed or lost a physical original");
    return { root, current };
  });
  const surviving = retained.flatMap(row => row.current === null ? [] : [row.current.square]);
  if (surviving.length !== after.size || new Set(surviving).size !== surviving.length) throw Error("Successor membership is not bijective");
  return retained;
}

export function retainedReferenceInput(family: "line_blockers" | "loose_piece", row: ControlLiteralPopulation, move: string): SemanticSubjectOutcomesInput {
  const alternatives = row.edges.map(([moveUci, afterFen]) => ({ kind: "edge" as const, beforeFen: row.root, moveUci, afterFen }))
    .sort((a, b) => a.moveUci.localeCompare(b.moveUci));
  const played = alternatives.find(edge => edge.moveUci === move);
  if (played === undefined) throw Error("Missing literal played move");
  return { kind: "subject_outcomes", family, population: { kind: "complete_alternatives", rootFen: row.root,
    played, alternatives, legalSetDigest: semanticLegalSetDigest(row.root, alternatives.map(edge => edge.moveUci)) } };
}

export function referenceLineStates(rootFen: string, afterFen = rootFen, move: string | null = null) {
  const after = referencePlacement(afterFen);
  return referenceRetainedPieces(rootFen, afterFen, move).flatMap(({ root, current }) => directions.map(direction => {
    const subject = { kind: "line_blockers" as const, root, direction }, parameters = {};
    let state: StateByFamily["line_blockers"];
    if (current === null) state = { kind: "removed", at: root.square };
    else {
      const { df, dr } = direction, compatible = current.role === "queen" || current.role === "bishop" && df !== 0 && dr !== 0
        || current.role === "rook" && (df === 0 || dr === 0);
      const path: number[] = [], at = index(current.square);
      for (let f = at % 8 + df, r = Math.floor(at / 8) + dr; f >= 0 && f < 8 && r >= 0 && r < 8; f += df, r += dr) path.push(r * 8 + f);
      const endpoint = path.pop();
      if (!compatible) state = { kind: "inapplicable", reason: "role", current };
      else if (endpoint === undefined) state = { kind: "inapplicable", reason: "border", current };
      else {
        const blockers = path.flatMap(at => after.has(at) ? [after.get(at)!] : []);
        state = { kind: "present", value: blockers.length, ray: { slider: current, endpoint: square(endpoint), strictInterior: path.map(square), blockers } };
      }
    }
    return { subject, parameters, state };
  }));
}
const integerRelation = (root: StateByFamily["line_blockers"], after: StateByFamily["line_blockers"]) =>
  root.kind !== "present" || after.kind !== "present" ? "not_comparable" as const
    : after.value > root.value ? "increase" as const : after.value < root.value ? "decrease" as const : "equal" as const;

export function referenceLinePopulation(row: ControlLiteralPopulation, move: string): SubjectOutcomePopulation<"line_blockers"> {
  const { population } = retainedReferenceInput("line_blockers", row, move), root = referenceLineStates(row.root);
  const played = referenceLineStates(row.root, population.played.afterFen, move);
  const alternatives = population.alternatives.filter(edge => edge.moveUci !== move)
    .map(edge => ({ moveUci: edge.moveUci, states: referenceLineStates(row.root, edge.afterFen, edge.moveUci) }));
  return { family: "line_blockers", beforeFen: row.root, moveUci: move, afterFen: population.played.afterFen,
    actor: row.root.split(" ")[1] === "w" ? "white" : "black", subjects: root.map((origin, at) => ({
      subject: origin.subject, parameters: origin.parameters, root: origin.state, played: played[at]!.state,
      playedRelation: integerRelation(origin.state, played[at]!.state), alternatives: alternatives.map(edge => ({
        moveUci: edge.moveUci, state: edge.states[at]!.state, relation: integerRelation(origin.state, edge.states[at]!.state),
      })),
    })) };
}

export function referenceLineEvents(row: ControlLiteralPopulation, move: string) {
  const { subjects, ...context } = referenceLinePopulation(row, move);
  return subjects.flatMap(({ playedRelation, ...subject }) => playedRelation === "not_comparable" ? []
    : (["increase", "decrease", "equal"] as const).flatMap(alternativeRelation => {
      if (alternativeRelation === playedRelation) return [];
      const supportingMoves = subject.alternatives.filter(edge => edge.relation === alternativeRelation).map(edge => edge.moveUci);
      return supportingMoves.length === 0 ? [] : [{ sign: "avoided" as const, operands: { ...context, ...subject,
        alternativeRelation, supportingMoves, legalAlternatives: subject.alternatives.length, alternativesWithOutcome: supportingMoves.length } }];
    }));
}

// Every literal edge remains a focused absolute input. Source cases retain the same
// original root/direction domains even when distinct examples share a root placement.
export const LINE_OUTCOME_POPULATIONS: readonly ReferencePopulation[] = [
  ...SLIDER_LITERAL_EXAMPLES.map(row => referenceRulesPopulation(row.id, row.partner, row.beforeFen, [row.moveUci])),
  ...(["white", "black"] as const).map(side => {
    const root = SLIDER_LITERAL_EXAMPLES.find(row => row.id === `replacement.${side}`)!;
    return referenceRulesPopulation(`replacement-quiet.${side}`, `replacement-quiet.${side === "white" ? "black" : "white"}`,
      root.beforeFen, [side === "white" ? "a1a2" : "a8a7"]);
  }),
];
const mirrorMove = (move: string) => move.replace(/[1-8]/gu, digit => String(9 - Number(digit)));
const rule = (sourcePath: readonly string[], value: SemanticMirrorValueRule, partnerPath = sourcePath,
  collection: "scalar" | "ordered" | "canonical_set" = "scalar"): SemanticMirrorOperandRule => ({ sourcePath, partnerPath, value, collection });
function stateRules(from: readonly string[], to = from): readonly SemanticMirrorOperandRule[] {
  const leaves: readonly (readonly [readonly string[], SemanticMirrorValueRule])[] = [
    [["value"], "identity"], [["at"], "square"], [["reason"], "identity"],
    [["current", "color"], "color"], [["current", "role"], "identity"], [["current", "square"], "square"],
    [["ray", "slider", "color"], "color"], [["ray", "slider", "role"], "identity"], [["ray", "slider", "square"], "square"],
    [["ray", "endpoint"], "square"], [["ray", "strictInterior", "*"], "square"],
    [["ray", "blockers", "*", "color"], "color"], [["ray", "blockers", "*", "role"], "identity"], [["ray", "blockers", "*", "square"], "square"],
  ];
  return [rule([...from, "kind"], "identity", [...to, "kind"]), ...leaves.map(([path, transform]) =>
    rule([...from, ...path], transform, [...to, ...path], "ordered"))];
}
function mirrorRules(row: ReferencePopulation, move: string): readonly SemanticMirrorOperandRule[] {
  const partner = LINE_OUTCOME_POPULATIONS.find(other => other.id === row.partner)!;
  const left = retainedReferenceInput("line_blockers", row, move).population.alternatives.filter(edge => edge.moveUci !== move);
  const right = retainedReferenceInput("line_blockers", partner, mirrorMove(move)).population.alternatives.filter(edge => edge.moveUci !== mirrorMove(move));
  const rules: SemanticMirrorOperandRule[] = [
    { sourcePath: ["beforeFen"], partnerPath: ["beforeFen"], value: "input_before_fen", collection: "scalar" },
    { sourcePath: ["moveUci"], partnerPath: ["moveUci"], value: "input_move_uci", collection: "scalar" },
    { sourcePath: ["afterFen"], partnerPath: ["afterFen"], value: "input_after_fen", collection: "scalar" },
    rule(["family"], "identity"), rule(["actor"], "color"), rule(["subject", "kind"], "identity"),
    rule(["subject", "root", "color"], "color"), rule(["subject", "root", "role"], "identity"), rule(["subject", "root", "square"], "square"),
    rule(["subject", "direction", "df"], "signed_file_delta"), rule(["subject", "direction", "dr"], "signed_rank_delta"),
    ...stateRules(["root"]), ...stateRules(["played"]),
    rule(["alternativeRelation"], "identity"), rule(["legalAlternatives"], "identity"), rule(["alternativesWithOutcome"], "identity"),
    rule(["supportingMoves", "*"], "uci", ["supportingMoves", "*"], "canonical_set"),
  ];
  for (const [at, edge] of left.entries()) {
    const other = right.findIndex(candidate => candidate.moveUci === mirrorMove(edge.moveUci));
    if (other < 0) throw Error("Original-piece source lost a mirrored legal alternative");
    const from = ["alternatives", String(at)], to = ["alternatives", String(other)];
    rules.push(rule([...from, "moveUci"], "uci", [...to, "moveUci"]), rule([...from, "relation"], "identity", [...to, "relation"]),
      ...stateRules([...from, "state"], [...to, "state"]));
  }
  return rules;
}
type SourceCase = { readonly arm: SemanticValidationCase["arm"]; readonly input: SemanticSubjectOutcomesInput;
  readonly proposition: Omit<SemanticValidationPropositionRecord, "factConstraintSha256"> };
const id = (row: string, arm: string) => `cited.literal-board.line-outcome.${row}.${arm}`;
const subject = { kind: "event", projection: { id: "derived.semantic_avoidance.line_blockers", version: 2 } } as const;
const basis = SLIDER_LITERAL_SOURCE;
/** Placement/capture/castling facts are retained from the pinned source. Full physical
 * strict-interior occupancy and root/direction relations remain the disclosed arithmetic
 * convention, not attack legality or a strategic pin. No old sparse proposition is reused.
 */
export const LINE_OUTCOME_LITERAL_SOURCE = {
  sourceId: "python-chess.literal-board.line-outcome", sourceRevision: basis.sourceRevision,
  licence: basis.licence, url: basis.url, text: basis.text,
  operation: { id: "runtime.semantic.subject_outcomes", version: 1 } as const,
  cases: LINE_OUTCOME_POPULATIONS.flatMap(row => {
    const move = row.plays[0]!, input = retainedReferenceInput("line_blockers", row, move), events = referenceLineEvents(row, move);
    const make = (arm: SemanticValidationCase["arm"], expectation: SemanticValidationExpectation): SourceCase => ({
      arm, input, proposition: { subject, case: { id: id(row.id, arm), version: 1 }, factConstraint: [], expectation },
    });
    if (events.length === 0) return [make("semantic_negative", { kind: "omits" })];
    // Parse only the closed JSON expectation vocabulary, never a computed chess reading.
    const exact = parseSemanticValidationExpectation({ kind: "emits_exact", events }, subject);
    if (exact.kind !== "emits_exact") throw Error("Whole source output required");
    return [make("positive", exact),
      make("counterfactual", { kind: "emits", minimum: 1, sign: "avoided", operandMatch: exact.events[0]!.operands }),
      make("orientation", { kind: "mirrors", geometry: "color_and_vertical",
        partnerCase: { kind: "case", id: id(row.partner, "orientation"), version: 1, subject, arm: "orientation" },
        targetEvents: { nonEmpty: true, pairing: "canonical_subject_sign_operands" }, operandRules: mirrorRules(row, move) })];
  }),
};
