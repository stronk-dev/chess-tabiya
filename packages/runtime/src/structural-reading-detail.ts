// Accepted D3309/D3654: closed retained facts from the existing structural computation.
// This defines no detector, source issuer, move grade, relevance score or legal forecast.
import type { FileName } from "chessops/types";
import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import type { StructuralObservation } from "./structure.js";
import { PresentationSchemaError, factRenderer, listPhrase, otherSide, plural, s, side, type Parser } from "./presentation-schema.js";

const file: Parser<FileName> = (value, label) => s.file(value, label) as FileName;
const empty = s.arr(s.square, { max: 0 });
const one = s.arr(s.square, { min: 1, max: 1 });
const two = s.arr(s.square, { min: 2, max: 2 });
const pawnSafety = s.obj({ square: s.square, color: s.color, safe: s.bool, basis: s.lit("maximal_pawn_reach@1"),
  pushAttackers: s.arr(s.obj({ square: s.square, pushes: s.nat })),
  captureAttackers: s.arr(s.obj({ square: s.square, captures: s.nat })),
});
const safetyShape = s.obj({ kind: s.lit("pawn_safe_square"), squares: one, color: s.color, detail: pawnSafety });
const safety: typeof safetyShape = (value, label) => {
  const parsed = safetyShape(value, label);
  if (parsed.detail.square !== parsed.squares[0] || parsed.detail.color !== parsed.color) {
    throw new PresentationSchemaError(`${label} pawn-reach detail crosses its square or side`);
  }
  if (parsed.detail.safe !== (parsed.detail.pushAttackers.length === 0 && parsed.detail.captureAttackers.length === 0)) {
    throw new PresentationSchemaError(`${label} pawn-reach safety contradicts its retained routes`);
  }
  return parsed;
};

export const STRUCTURAL_DETAIL_SCHEMAS = Object.freeze({
  backward_pawn: s.obj({ kind: s.lit("backward_pawn"), squares: empty, color: s.color, file }),
  isolated_pawn: s.obj({ kind: s.lit("isolated_pawn"), squares: empty, color: s.color, file }),
  doubled_pawn: s.obj({ kind: s.lit("doubled_pawn"), squares: empty, color: s.color, file }),
  half_open_file: s.obj({ kind: s.lit("half_open_file"), squares: empty, color: s.color, file }),
  open_file: s.obj({ kind: s.lit("open_file"), squares: empty, file }),
  passed_pawn: s.obj({ kind: s.lit("passed_pawn"), squares: one, color: s.color }),
  outpost: s.obj({ kind: s.lit("outpost"), squares: one, color: s.color }),
  pawn_safe_square: safety,
  bishop_on_shade: s.obj({ kind: s.lit("bishop_on_shade"), squares: one, color: s.color, shade: s.lit("light", "dark") }),
  line_blockers: s.obj({ kind: s.lit("line_blockers"), squares: two, count: s.nat }),
  direct_attack_count: s.obj({ kind: s.lit("direct_attack_count"), squares: one, color: s.color, count: s.nat }),
  piece_reach_count: s.obj({ kind: s.lit("piece_reach_count"), squares: one, color: s.color, role: s.lit("knight", "bishop", "rook", "queen"), count: s.nat }),
  king_opposition: s.obj({ kind: s.lit("king_opposition"), squares: two, color: s.color, form: s.lit("direct", "distant") }),
  piece_count: s.obj({ kind: s.lit("piece_count"), squares: empty, color: s.color, role: s.role, count: s.nat }),
  king_zone: s.obj({ kind: s.lit("king_zone"), squares: one, color: s.color, zone: s.lit("edge", "corner") }),
  piece_distance: s.obj({ kind: s.lit("piece_distance"), squares: two, role: s.lit("king"), count: s.nat }),
});
export type StructuralDetailKind = keyof typeof STRUCTURAL_DETAIL_SCHEMAS;
export type StructuralDetailByKind = { readonly [K in StructuralDetailKind]: ReturnType<typeof STRUCTURAL_DETAIL_SCHEMAS[K]> };
export type StructuralDetail = StructuralDetailByKind[StructuralDetailKind];
// Iteration is the existing source population's order, not parser-object insertion order.
export const STRUCTURAL_DETAIL_KINDS = Object.freeze(STRUCTURAL_FEATURE_KINDS.filter(
  (kind): kind is StructuralDetailKind => Object.hasOwn(STRUCTURAL_DETAIL_SCHEMAS, kind),
));
export const STRUCTURAL_DETAIL_FIELDS = Object.freeze({
  backward_pawn: ["kind", "squares", "color", "file"], isolated_pawn: ["kind", "squares", "color", "file"],
  doubled_pawn: ["kind", "squares", "color", "file"], half_open_file: ["kind", "squares", "color", "file"],
  open_file: ["kind", "squares", "file"], passed_pawn: ["kind", "squares", "color"], outpost: ["kind", "squares", "color"],
  pawn_safe_square: ["kind", "squares", "color", "detail"], bishop_on_shade: ["kind", "squares", "color", "shade"],
  line_blockers: ["kind", "squares", "count"], direct_attack_count: ["kind", "squares", "color", "count"],
  piece_reach_count: ["kind", "squares", "color", "role", "count"], king_opposition: ["kind", "squares", "color", "form"],
  piece_count: ["kind", "squares", "color", "role", "count"], king_zone: ["kind", "squares", "color", "zone"],
  piece_distance: ["kind", "squares", "role", "count"],
} as const satisfies { readonly [K in StructuralDetailKind]: readonly (keyof StructuralDetailByKind[K])[] });

/** Called only after the factory has computed the original observation from its own FEN. */
export function structuralDetail<K extends StructuralDetailKind>(kind: K, observation: StructuralObservation): StructuralDetailByKind[K] {
  if (observation.kind !== kind) throw new PresentationSchemaError("Detailed structural source crosses its literal kind");
  const retained = Object.fromEntries(STRUCTURAL_DETAIL_FIELDS[kind].map(key => [key, observation[key]]));
  return STRUCTURAL_DETAIL_SCHEMAS[kind](retained, `structural ${kind}`) as StructuralDetailByKind[K];
}

const safetyText = (value: StructuralDetailByKind["pawn_safe_square"]): string => {
  const detail = value.detail;
  const pushes = detail.pushAttackers.map(entry => `${entry.square}: ${plural(entry.pushes, "push", "pushes")}`);
  const captures = detail.captureAttackers.map(entry => `${entry.square}: ${plural(entry.captures, "capture")}`);
  return `Pawn-reach reading for ${side(value.color)} on ${value.squares[0]}: ${detail.safe ? "no opposing pawn reach" : "opposing pawn reach is present"} in the geometric model. Push routes: ${pushes.length === 0 ? "none" : listPhrase(pushes)}. Capture routes: ${captures.length === 0 ? "none" : listPhrase(captures)}. This model ignores blockers, capture availability, turn order and move legality.`;
};

export const STRUCTURAL_DETAIL_RENDERERS = Object.freeze({
  "consumer.structural_detail.backward_pawn@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.backward_pawn, value => `${side(value.color)} has a backward-pawn observation on the ${value.file}-file under the declared pawn-structure convention.`),
  "consumer.structural_detail.isolated_pawn@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.isolated_pawn, value => `${side(value.color)} has an isolated pawn on the ${value.file}-file.`),
  "consumer.structural_detail.doubled_pawn@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.doubled_pawn, value => `${side(value.color)} has doubled pawns on the ${value.file}-file.`),
  "consumer.structural_detail.half_open_file@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.half_open_file, value => `The ${value.file}-file is half-open for ${side(value.color)}: no ${side(value.color)} pawn and at least one ${otherSide(value.color)} pawn.`),
  "consumer.structural_detail.open_file@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.open_file, value => `The ${value.file}-file is open: neither side has a pawn on it.`),
  "consumer.structural_detail.passed_pawn@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.passed_pawn, value => `${side(value.color)} has a passed pawn on ${value.squares[0]} under the ahead-and-adjacent-file test. This does not guarantee promotion.`),
  "consumer.structural_detail.outpost@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.outpost, value => `${side(value.color)} has a strict pawn-supported outpost on ${value.squares[0]} under the rank-and-pawn-reach convention. This does not establish permanence, strategic value or legal occupation.`),
  "consumer.structural_detail.pawn_safe_square@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.pawn_safe_square, safetyText),
  "consumer.structural_detail.bishop_on_shade@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.bishop_on_shade, value => `${side(value.color)}'s bishop on ${value.squares[0]} stands on a ${value.shade} square.`),
  "consumer.structural_detail.line_blockers@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.line_blockers, value => `The line from ${value.squares[0]} to ${value.squares[1]} has ${plural(value.count, "interior blocker")}.`),
  "consumer.structural_detail.direct_attack_count@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.direct_attack_count, value => `${side(value.color)} has ${plural(value.count, "geometric attack")} on ${value.squares[0]}; pins and check legality are not applied.`),
  "consumer.structural_detail.piece_reach_count@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.piece_reach_count, value => `${side(value.color)}'s ${value.role} on ${value.squares[0]} reaches ${plural(value.count, "square")} geometrically, excluding its own occupied squares. This is not a legal-move forecast.`),
  "consumer.structural_detail.king_opposition@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.king_opposition, value => `${side(value.color)} has ${value.form} king opposition between ${value.squares[0]} and ${value.squares[1]} under the turn-dependent convention.`),
  "consumer.structural_detail.piece_count@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.piece_count, value => `${side(value.color)} has ${plural(value.count, value.role)}.`),
  "consumer.structural_detail.king_zone@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.king_zone, value => `${side(value.color)}'s king on ${value.squares[0]} is ${value.zone === "corner" ? "in a corner" : "on the edge of the board"}.`),
  "consumer.structural_detail.piece_distance@2": factRenderer(STRUCTURAL_DETAIL_SCHEMAS.piece_distance, value => `The kings on ${value.squares[0]} and ${value.squares[1]} are ${plural(value.count, "king step")} apart on an empty board. This is not a legal-move forecast.`),
});
