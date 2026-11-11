/** Disposable D1716 independent reference preparation, not a production collector.
 * Decode placement and physical identity without production lineage/ray helpers. The
 * declared full-ray convention counts occupied strict-interior squares, even beyond
 * the first blocker. It is not an attack, pin, move-quality or tactical verdict.
 */
import type { Color, Role, SquareName } from "chessops/types";
import type { StateByFamily, SubjectOutcomePopulation } from "../../packages/runtime/src/semantic-subject-types.js";
import { semanticLegalSetDigest, type SemanticSubjectOutcomesInput } from "../../packages/runtime/src/semantic-validation.js";
import type { ControlLiteralPopulation } from "./direct-control-reference.js";

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
