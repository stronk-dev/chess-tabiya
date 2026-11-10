import { normalizeMove } from "chessops/chess";
import { makeSquare, parseUci } from "chessops/util";
// Accepted evidence-presentation §3.10e. Whole source operands, explicit overviews/detail doors.
import { evidenceDigest } from "./evidence-contract.js";
import type { LegalExchangeBranch, LegalExchangeResult, LegalExchangeStep } from "./exchange.js";
import { FOUNDATION_VALUE_SCHEMAS as shape } from "./foundation-edge-presentation.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { factRenderer, pieceOn, s, side, PresentationSchemaError, type Parser } from "./presentation-schema.js";

const basis = s.lit("future_file");
const challenge = s.obj({ pawn: shape.pawn, target: s.square, pushes: s.nat });
const reach = s.obj({ pawn: shape.pawn, target: s.square, pushes: s.nat, captures: s.nat });
const candidate = s.obj({ color: s.color, square: s.square, relativeRank: s.lit(4, 5, 6), supportPawns: s.arr(shape.pawn, { min: 1 }), challengers: s.arr(challenge, { max: 0 }) });
const occupied = s.obj({ candidate, occupant: s.obj({ color: s.color, role: s.lit("bishop", "knight", "rook", "queen"), square: s.square }) });
const step: Parser<LegalExchangeStep> = s.obj({ moveUci: s.uci, mover: shape.placed, captured: shape.placed, from: s.square, to: s.square, delta: s.int }, { promotion: s.lit("queen", "rook", "bishop", "knight") });
const branch: Parser<LegalExchangeBranch> = (v, l) => s.obj({ step, continuation: s.arr((v, l) => branch(v, l)), resultUnits: s.int, chosen: s.bool })(v, l);
const exchange: Parser<LegalExchangeResult> = s.obj({ beforeFen: s.str, captureUci: s.uci, landingSquare: s.square, capturer: shape.placed, captured: shape.placed,
  branches: s.arr(branch), chosenLine: s.arr(step), stopDecisions: s.arr(s.obj({ ply: s.nat, color: s.color, stopped: s.bool })), conventionId: s.lit("legal-exchange@1"), resultUnits: s.int });
const rawAdvance = s.obj({ beforeFen: s.str, moveUci: s.uci, afterFen: s.str, pawn: shape.backward,
  advancedPawn: s.obj({ color: s.color, role: s.lit("pawn"), square: s.square }),
  landing: s.obj({ fen: s.str, landingSquare: s.square, captures: s.arr(exchange) }), replies: s.arr(exchange) });
/** Mechanical original-edge/context consistency, not a backward-pawn detector or move grade. */
export function assertFoundationAdvanceEdge(v: { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string;
  readonly pawn: ReturnType<typeof shape.backward>; readonly advancedPawn: { readonly color: "white" | "black"; readonly role: "pawn"; readonly square: string };
  readonly landingFen: string; readonly landingSquare: string }): void {
  const before = positionFromFen(v.beforeFen), raw = parseUci(v.moveUci);
  const fail = (): never => { throw new PresentationSchemaError("Advance source crosses its original edge, pawn or landing context"); };
  if (canonicalFen(before) !== v.beforeFen || raw === undefined || !("from" in raw)) return fail();
  const move = normalizeMove(before, raw);
  if (!("from" in move) || !before.isLegal(move) || move.promotion !== undefined) return fail();
  const piece = before.board.get(move.from), from = makeSquare(move.from), to = makeSquare(move.to);
  if (piece?.role !== "pawn" || piece.color !== v.pawn.color || v.pawn.pawn !== from || v.pawn.stop !== to
    || move.to - move.from !== (piece.color === "white" ? 8 : -8) || before.board.get(move.to) !== undefined
    || v.pawn.stopOccupancy.kind !== "empty" || v.advancedPawn.color !== piece.color || v.advancedPawn.square !== to
    || v.landingSquare !== to || v.landingFen !== v.afterFen) return fail();
  before.play(move);
  if (canonicalFen(before) !== v.afterFen) return fail();
}
const advance: Parser<ReturnType<typeof rawAdvance>> = (value, label) => {
  const v = rawAdvance(value, label);
  assertFoundationAdvanceEdge({ ...v, landingFen: v.landing.fen, landingSquare: v.landing.landingSquare });
  const replies = v.landing.captures.filter(row => row.capturer.role === "pawn" && row.capturer.color !== v.pawn.color
    && row.captured.color === v.pawn.color && row.captured.role === "pawn" && row.captured.square === v.pawn.stop);
  if (evidenceDigest(replies) !== evidenceDigest(v.replies) || v.landing.captures.some(row => row.beforeFen !== v.afterFen
    || row.landingSquare !== v.landing.landingSquare)) throw new PresentationSchemaError("Advance source crosses its complete original landing/reply population");
  return v;
};
const canonical = <T extends { readonly fen: string }>(parse: Parser<T>): Parser<T> => (v, l) => {
  const result = parse(v, l);
  if (canonicalFen(positionFromFen(result.fen)) !== result.fen) throw new PresentationSchemaError("Snapshot differs from its original canonical position");
  return result;
};
export const FOUNDATION_SNAPSHOT_SCHEMAS = Object.freeze({
  king_opposition: canonical(shape.opposition),
  backward_pawns: canonical(s.obj({ fen: s.str, pawnDomain: s.arr(shape.pawn), pawns: s.arr(shape.backward) })),
  pawn_file_groups: canonical(s.obj({ fen: s.str, groups: s.arr(shape.group) })),
  file_states: canonical(s.obj({ fen: s.str, files: s.arr(shape.fileRow, { min: 8, max: 8 }) })),
  future_file_challenges: canonical(s.obj({ fen: s.str, pawnDomain: s.arr(shape.pawn), challenges: s.arr(challenge) })),
  capture_migration_reaches: canonical(s.obj({ fen: s.str, pawnDomain: s.arr(shape.pawn), reaches: s.arr(reach) })),
  outpost_candidates: canonical(s.obj({ fen: s.str, basis, candidates: s.arr(candidate) })),
  occupied_outposts: canonical(s.obj({ fen: s.str, basis, occupied: s.arr(occupied) })),
  backward_pawn_advance: advance,
});
export const FOUNDATION_SNAPSHOT_STATEMENTS = Object.freeze({
  "rules.structural.reading.king_opposition@3": ["inspector.snapshot.king_opposition@1", "unobstructed-opposition@1"],
  "rules.structural.reading.backward_pawn@3": ["inspector.snapshot.backward_pawns@1", "backward-pawn@1"],
  "derived.structural.reading.pawn_file_group@1": ["inspector.snapshot.pawn_file_groups@1", "pawn-file-membership@1"],
  "derived.activity.reading.file_state@1": ["inspector.snapshot.file_states@1", "piece-geometry@1"],
  "derived.square.reading.future_file_challenge@1": ["inspector.snapshot.future_file_challenges@1", "future-file-challenge@1"],
  "derived.square.reading.capture_migration_reach@1": ["inspector.snapshot.capture_migration_reaches@1", "capture-migration-reach@1"],
  "derived.structural.reading.outpost_candidate@1": ["inspector.snapshot.outpost_candidates@1", "outpost-candidate@1"],
  "derived.structural.reading.occupied_outpost@1": ["inspector.snapshot.occupied_outposts@1", "outpost-candidate@1"],
  "derived.pawn.consequence.backward_pawn_legal_advance@1": ["inspector.snapshot.backward_pawn_advance@1", "legal-exchange@1"],
} as const);
const overview = "Overview of the complete source. Open details for every recorded member.";
const hypothetical = "Hypothetical geometry; ignores occupancy, turn, king safety and legal paths.";
export const FOUNDATION_SNAPSHOT_FACT_RENDERERS = {
  "inspector.snapshot.king_opposition@1": factRenderer(FOUNDATION_SNAPSHOT_SCHEMAS.king_opposition, v => {
    const turn = side(positionFromFen(v.fen).turn);
    return `White king ${v.kings.white}; Black king ${v.kings.black}; ${turn} to move. ${v.opposition === null ? "No unobstructed opposition under the declared definition." : `${side(v.opposition.color)} holds ${v.opposition.form === "direct" ? "direct" : v.opposition.form === "distant_three" ? "three-square distant" : "five-square distant"} opposition; ${side(v.opposition.sideToMove)} to move; between squares: ${v.opposition.betweenSquares.join(", ")}; all empty: ${v.opposition.betweenSquaresEmpty ? "yes" : "no"}.`}`;
  }),
  "inspector.snapshot.backward_pawns@1": factRenderer(FOUNDATION_SNAPSHOT_SCHEMAS.backward_pawns, v => `${overview} Pawn domain: ${v.pawnDomain.length}; qualifying backward pawns: ${v.pawns.length}. The declared definition establishes neither weakness nor a legal advance.`),
  "inspector.snapshot.pawn_file_groups@1": factRenderer(FOUNDATION_SNAPSHOT_SCHEMAS.pawn_file_groups, v => `${overview} Nonempty color/file groups: ${v.groups.length}. Details retain ordered pawns, adjacent and island files, isolated and doubled flags.`),
  "inspector.snapshot.file_states@1": factRenderer(FOUNDATION_SNAPSHOT_SCHEMAS.file_states, v => `${overview} File rows: ${v.files.length}; open: ${v.files.filter(f => f.state === "open").length}; half-open for White: ${v.files.filter(f => f.state === "half_open_white").length}; half-open for Black: ${v.files.filter(f => f.state === "half_open_black").length}; closed: ${v.files.filter(f => f.state === "closed").length}.`),
  "inspector.snapshot.future_file_challenges@1": factRenderer(FOUNDATION_SNAPSHOT_SCHEMAS.future_file_challenges, v => `${overview} Root pawns: ${v.pawnDomain.length}; same-file challenge rows: ${v.challenges.length}, including zero geometric pushes. ${hypothetical} Pushes count single-rank geometric steps, not legal double-push moves.`),
  "inspector.snapshot.capture_migration_reaches@1": factRenderer(FOUNDATION_SNAPSHOT_SCHEMAS.capture_migration_reaches, v => `${overview} Root pawns: ${v.pawnDomain.length}; distinct capture/push count rows: ${v.reaches.length}. ${hypothetical} Victims are not established; this is not same-file-only reach.`),
  "inspector.snapshot.outpost_candidates@1": factRenderer(FOUNDATION_SNAPSHOT_SCHEMAS.outpost_candidates, v => `${overview} Candidates: ${v.candidates.length}, under the same-file future-challenge definition. Relative ranks four to six, own pawn support and no opposing same-file challenge; occupancy is irrelevant and capture-migration-only reach is not an exclusion. This establishes neither safety, permanence nor value.`),
  "inspector.snapshot.occupied_outposts@1": factRenderer(FOUNDATION_SNAPSHOT_SCHEMAS.occupied_outposts, v => `${overview} Occupied candidates: ${v.occupied.length}, under the same-file future-challenge definition. Each retains its candidate and actual same-color bishop, knight, rook or queen. This establishes neither arrival, survival nor value.`),
  "inspector.snapshot.backward_pawn_advance@1": factRenderer(advance, v => `${overview} ${pieceOn(v.advancedPawn, v.advancedPawn.square)} after the selected advance from ${v.pawn.pawn}. Complete landing captures: ${v.landing.captures.length}; immediate legal opposing-pawn capture options: ${v.replies.length}. These are calculated options, not observed replies, safe play or a forced exchange. Details retain every exchange alternative and declared units.`),
} as const;
/** Existing public payload correspondence only. Source issuance/access is checked by its owner. */
export function assertFoundationSnapshotPayloadRef(payload: unknown, reference: string): void {
  if (`sha256:${evidenceDigest(payload)}` !== reference) throw new PresentationSchemaError("Readout differs from its complete original source/view reference");
}
