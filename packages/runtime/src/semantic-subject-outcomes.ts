// Accepted subject-safe-semantic-selection §§4–5. Exact source-owned subjects and complete
// root/played/alternative relations. The sole registered factories mint the returned payloads.
import { normalizeMove } from "chessops/chess";
import type { NormalMove } from "chessops/types";
import { makeSquare, parseUci } from "chessops/util";
import { candidatePlayedRow, readCandidateFoundationSources, type CandidateFoundationPosition,
  type CandidatePopulationReceipt, type CandidateWideScope } from "./candidate-population.js";
import type { DeclaredEvidence } from "./evidence-contract.js";
import { originalPiecePositions } from "./foundation-piece-lineage.js";
import { physicalRayDirectionAllowed } from "./foundation-slider-sources.js";
import { positionFromFen } from "./position-cache.js";
import { readCandidateUnavailableSources } from "./semantic-source-availability.js";
import { BOOLEAN_SUBJECT_RELATIONS, INTEGER_SUBJECT_RELATIONS, SUBJECT_OUTCOME_FAMILIES, type ParametersByFamily,
  type RelationByFamily, type StateByFamily, type SubjectByFamily, type SubjectOutcomeFamily,
  type SubjectOutcomePayload, type SubjectOutcomePopulation } from "./semantic-subject-types.js";

const COLORS = ["white", "black"] as const;
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const ROLES = ["pawn", "knight", "bishop", "rook", "queen", "king"] as const;
const FORMS = ["direct", "distant_three", "distant_five"] as const;
type Cell<F extends SubjectOutcomeFamily> = Readonly<{
  subject: SubjectByFamily[F]; parameters: ParametersByFamily[F]; state: StateByFamily[F];
}>;
interface PositionContext {
  readonly root: CandidateFoundationPosition;
  readonly position: CandidateFoundationPosition;
  readonly moveUci: string | null;
}

/** One closed finite declaration table. No caller supplies a subject, state reader or resolver. */
const READERS: { readonly [F in SubjectOutcomeFamily]: (context: PositionContext) => readonly Cell<F>[] } = {
  backward_pawn: ({ position }) => position.totals.pawns.map(pawn => ({
    subject: { kind: "backward_pawn", color: pawn.root.color, rootSquare: pawn.root.square }, parameters: {},
    state: pawn.kind === "removed" ? { kind: "removed", at: pawn.root.square }
      : pawn.kind === "promoted" ? { kind: "promoted", current: pawn.current }
      : { kind: "present", value: position.common[3].payload.pawns.some(row => row.color === pawn.current.color && row.pawn === pawn.current.square) },
  })),
  doubled_pawn: ({ position }) => COLORS.flatMap(color => FILES.map(file => ({
    subject: { kind: "doubled_pawn", color, file }, parameters: {},
    state: { kind: "present", value: position.common[4].payload.groups.find(row => row.color === color && row.file === file)?.doubled ?? false },
  }))),
  isolated_pawn: ({ position }) => COLORS.flatMap(color => FILES.map(file => ({
    subject: { kind: "isolated_pawn", color, file }, parameters: {},
    state: { kind: "present", value: position.common[4].payload.groups.find(row => row.color === color && row.file === file)?.isolated ?? false },
  }))),
  half_open_file: ({ position }) => COLORS.flatMap(color => FILES.map(file => {
    const row = position.common[5].payload.files.find(value => value.file === file);
    if (row === undefined) throw new TypeError("Complete file source lost a declared file");
    return { subject: { kind: "half_open_file" as const, color, file }, parameters: {},
      state: { kind: "present" as const, value: row.state === `half_open_${color}` } };
  })),
  open_file: ({ position }) => FILES.map(file => {
    const row = position.common[5].payload.files.find(value => value.file === file);
    if (row === undefined) throw new TypeError("Complete file source lost a declared file");
    return { subject: { kind: "open_file" as const, file }, parameters: {}, state: { kind: "present" as const, value: row.state === "open" } };
  }),
  king_opposition: ({ root, position }) => COLORS.flatMap(holder => FORMS.map(form => ({
    subject: { kind: "king_opposition", whiteRootSquare: root.common[2].payload.kings.white, blackRootSquare: root.common[2].payload.kings.black },
    parameters: { holder, form }, state: { kind: "present", value: position.common[2].payload.opposition?.color === holder && position.common[2].payload.opposition?.form === form },
  }))),
  king_zone: ({ root, position }) => COLORS.flatMap((color, index) => (["edge", "corner"] as const).map((zone, offset) => ({
    subject: { kind: "king_zone", color, rootSquare: root.common[2].payload.kings[color] }, parameters: { zone },
    state: { kind: "present", value: position.totals.kingZones[index * 2 + offset]!.payload.matched },
  }))),
  passed_pawn: ({ position }) => position.totals.pawns.map(pawn => ({
    subject: { kind: "passed_pawn", color: pawn.root.color, rootSquare: pawn.root.square }, parameters: {},
    state: pawn.kind === "removed" ? { kind: "removed", at: pawn.root.square }
      : pawn.kind === "promoted" ? { kind: "promoted", current: pawn.current }
      : { kind: "present", value: pawn.source.payload.matched },
  })),
  piece_count: ({ position }) => COLORS.flatMap(color => ROLES.map(role => {
    const source = position.totals.counts.find(row => row.payload.color === color && row.payload.role === role);
    if (source === undefined) throw new TypeError("Complete piece source lost a declared color/role");
    return { subject: { kind: "piece_count" as const, color, role }, parameters: {}, state: { kind: "present" as const, value: source.payload.count } };
  })),
  direct_attack_count: ({ position }) => COLORS.flatMap(color => {
    const row = position.totals.control.payload.colors.find(value => value.color === color);
    if (row === undefined) throw new TypeError("Complete control source lost a declared color");
    return row.pseudo.map(square => ({ subject: { kind: "direct_attack_count" as const, color, square: square.target }, parameters: {},
      state: { kind: "present" as const, value: square.controllers.length } }));
  }),
  loose_piece: ({ position }) => {
    if (position.risk.kind !== "available") throw new TypeError("Unavailable risk cannot become a boolean state");
    return position.risk.value.payload.pieces.map(row => ({ subject: { kind: "loose_piece", root: row.root }, parameters: {},
      state: { kind: "present", value: row.state.enPrise, current: row.current } }));
  },
  pawn_islands: ({ position }) => COLORS.map(color => {
    const row = position.common[1].payload.colors.find(value => value.color === color);
    if (row === undefined) throw new TypeError("Complete connectivity lost a declared color");
    return { subject: { kind: "pawn_islands" as const, color }, parameters: {}, state: { kind: "present" as const, value: row.islandCount } };
  }),
  line_blockers: ({ root, position, moveUci }) => {
    const before = positionFromFen(root.common[0].payload.fen), after = positionFromFen(position.common[0].payload.fen);
    let move: NormalMove | null = null;
    if (moveUci !== null) {
      const parsed = parseUci(moveUci);
      if (parsed === undefined || !("from" in parsed)) throw new TypeError("Ray subject lost its original board move");
      const normalized = normalizeMove(before, parsed);
      if (!("from" in normalized)) throw new TypeError("Ray subject lost its physical board move");
      move = normalized;
    }
    const physical = originalPiecePositions(before, after, move);
    return root.rays.payload.rows.map(row => {
      const subject: SubjectByFamily["line_blockers"] = { kind: "line_blockers", root: row.piece, direction: row.direction };
      const current = physical.find(piece => piece.root.square === row.piece.square)?.current;
      if (current === undefined) throw new TypeError("Ray subject lost an original physical piece");
      if (current === null) return { subject, parameters: {}, state: { kind: "removed", at: row.piece.square } };
      const actual = position.rays.payload.rows.find(value => value.piece.square === current.square && value.piece.color === current.color
        && value.piece.role === current.role && value.direction.df === row.direction.df && value.direction.dr === row.direction.dr);
      if (actual === undefined) throw new TypeError("Ray source lost a complete current piece/direction row");
      const state: StateByFamily["line_blockers"] = actual.ray === null
        ? { kind: "inapplicable", reason: physicalRayDirectionAllowed(current.role, row.direction.df, row.direction.dr) ? "border" : "role", current }
        : { kind: "present", value: actual.ray.blockers.length, ray: actual.ray };
      return { subject, parameters: {}, state };
    });
  },
};

/** Literal original vector for a position; repetitions and complete collection order stay intact. */
function familyInputs(family: SubjectOutcomeFamily, position: CandidateFoundationPosition): readonly DeclaredEvidence<unknown>[] | null {
  switch (family) {
    case "backward_pawn": return [position.common[3]];
    case "doubled_pawn": case "isolated_pawn": return [position.common[4]];
    case "half_open_file": case "open_file": return [position.common[5]];
    case "king_opposition": return [position.common[2]];
    case "king_zone": return position.totals.kingZones;
    case "passed_pawn": return position.totals.pawns.flatMap(pawn => pawn.kind === "present" ? [pawn.source] : []);
    case "piece_count": return position.totals.counts;
    case "direct_attack_count": return [position.totals.control];
    case "line_blockers": return [position.rays];
    case "loose_piece": return position.risk.kind === "available" ? [position.risk.value] : null;
    case "pawn_islands": return [position.common[1]];
  }
}

function relation<F extends SubjectOutcomeFamily>(family: F, root: StateByFamily[F], current: StateByFamily[F]): RelationByFamily[F] | null {
  if (root.kind !== "present" || current.kind !== "present") return null;
  const numeric = family === "line_blockers" || family === "piece_count" || family === "direct_attack_count" || family === "pawn_islands";
  if (numeric) {
    if (typeof root.value !== "number" || typeof current.value !== "number") throw new TypeError("Integer subject cannot consume a boolean state");
    return (current.value > root.value ? "increase" : current.value < root.value ? "decrease" : "equal") as RelationByFamily[F];
  }
  if (typeof root.value !== "boolean" || typeof current.value !== "boolean") throw new TypeError("Boolean subject cannot consume an integer state");
  return (root.value ? current.value ? "true_to_true" : "true_to_false" : current.value ? "false_to_true" : "false_to_false") as RelationByFamily[F];
}

/** Freeze the closed calculated cells as well as their nested identities. Existing sealed input
 * values stay original; this produces no source handle or alternative authority. */
function immutablePopulation<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) immutablePopulation(child);
    if (!Object.isFrozen(value)) Object.freeze(value);
  }
  return value;
}

export type ComputedSubjectOutcomes<F extends SubjectOutcomeFamily> =
  | { readonly kind: "available"; readonly payloads: readonly SubjectOutcomePayload<F>[]; readonly inputs: readonly DeclaredEvidence<unknown>[]; readonly population: SubjectOutcomePopulation<F> }
  | { readonly kind: "unavailable"; readonly reason: "counterfactual_population_incomplete" };

/** The only input is an original wide receipt and its exact played member. All alternatives,
 * subjects, parameters, support, states and denominators come from that owner. */
export function computeSubjectOutcomes<F extends SubjectOutcomeFamily>(family: F, receipt: CandidatePopulationReceipt<CandidateWideScope>, moveUci: string): ComputedSubjectOutcomes<F> {
  if (!SUBJECT_OUTCOME_FAMILIES.includes(family)) throw new TypeError("Unknown exact subject-outcome family");
  const frame = readCandidateFoundationSources(receipt), played = candidatePlayedRow(receipt, moveUci);
  const playedIndex = frame.candidates.findIndex(row => row.row === played);
  if (playedIndex < 0) throw new TypeError("Subject outcomes lost the original played row");
  const positions = [frame.root, ...frame.candidates.map(row => row.position)];
  const vectors = positions.map(position => familyInputs(family, position));
  // Authenticate the exact failure image as well as the required total vectors. Known legacy
  // event failures do not erase independent totals; unaccounted or unknown outcomes refuse.
  readCandidateUnavailableSources(receipt);
  if (vectors.some(vector => vector === null)) {
    return Object.freeze({ kind: "unavailable", reason: "counterfactual_population_incomplete" });
  }
  const inputs = Object.freeze([...positions.map(position => position.common[0]), ...vectors.flatMap(vector => vector!)]);
  const reader = READERS[family];
  const root = reader({ root: frame.root, position: frame.root, moveUci: null });
  const columns = frame.candidates.map(row => reader({ root: frame.root, position: row.position, moveUci: row.move.uci }));
  if (columns.some(column => column.length !== root.length)) throw new TypeError("Subject outcome domain changed across an original legal alternative");
  const payloads: SubjectOutcomePayload<F>[] = [];
  const subjects: SubjectOutcomePopulation<F>["subjects"][number][] = [];
  const numeric = family === "line_blockers" || family === "piece_count" || family === "direct_attack_count" || family === "pawn_islands";
  const relations = numeric ? INTEGER_SUBJECT_RELATIONS : BOOLEAN_SUBJECT_RELATIONS;
  for (const [index, origin] of root.entries()) {
    const states = columns.map(column => {
      const cell = column[index]!;
      // These are closed typed descriptors, never JSON subject IDs or caller-supplied state.
      if (JSON.stringify(cell.subject) !== JSON.stringify(origin.subject) || JSON.stringify(cell.parameters) !== JSON.stringify(origin.parameters)) throw new TypeError("Subject outcome crossed original subject/parameter order");
      return cell.state;
    });
    const playedState = states[playedIndex]!, playedRelation = relation(family, origin.state, playedState);

    const alternatives = Object.freeze(frame.candidates.flatMap((row, at) => {
      if (at === playedIndex) return [];
      const state = states[at]!;
      return [Object.freeze({ moveUci: row.move.uci, state, relation: relation(family, origin.state, state) ?? "not_comparable" as const })];
    }));
    const cell = immutablePopulation({ subject: origin.subject, parameters: origin.parameters, root: origin.state, played: playedState, playedRelation: playedRelation ?? "not_comparable" as const, alternatives });
    subjects.push(cell);
    if (playedRelation === null) continue;
    for (const alternativeRelation of relations) {
      if (alternativeRelation === playedRelation) continue;
      const supportingMoves = Object.freeze(alternatives.filter(row => row.relation === alternativeRelation).map(row => row.moveUci));
      if (supportingMoves.length === 0) continue;
      payloads.push(Object.freeze({ beforeFen: receipt.packet.beforeFen, moveUci: played.moveUci, afterFen: played.afterFen,
        actor: receipt.legalMovesInput.payload.turn, family, subject: origin.subject, parameters: origin.parameters,
        root: origin.state, played: playedState, alternativeRelation: alternativeRelation as RelationByFamily[F], alternatives,
        supportingMoves, legalAlternatives: alternatives.length, alternativesWithOutcome: supportingMoves.length,
      }));
    }
  }
  const population: SubjectOutcomePopulation<F> = Object.freeze({ family, beforeFen: receipt.packet.beforeFen,
    moveUci: played.moveUci, afterFen: played.afterFen, actor: receipt.legalMovesInput.payload.turn, subjects: Object.freeze(subjects) });
  return Object.freeze({ kind: "available", payloads: Object.freeze(payloads), inputs, population });
}
