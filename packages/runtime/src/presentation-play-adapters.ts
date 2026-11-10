// rfc/evidence-presentation.md Checkpoint B / rfc/module-registration.md A5 — the play-seat
// modules' exact pair-keyed presentation adapters and their registered fact renderers:
// `module.sight_on_request@1`, `module.threat_radar@2`, `module.blunder_prevention@1`,
// `module.structure_nudge@2`, `module.theory_breadcrumb@2` and `module.compare_coach@1`.
//
// Every renderer is a fixed template over the parsed, retained operands (§3.10a). Sentences use
// learner vocabulary only (play-composition §5.1): chess notation, registered labels and the
// declared convention's label — never an id, enum, detector name or evaluation of a move. A
// component never selects: every adapter renders exactly the one admitted evidence item it is given.
//
// This file imports only types from `presentation-contract.ts`; the registry injects its kit.

import type { Color, Role, SquareName } from "chessops/types";

import type { DeclaredEvidence, EvidenceForm, VersionedEvidenceId } from "./evidence-contract.js";
import { MODULE_CURRENT_IMAGE } from "./evidence-catalog.js";
import type { RecordedComparisonEnginePoint } from "./recorded-comparison-point.js";
import type { RecordedCompareEvalDelta } from "./recorded-comparison-eval.js";
import type { ObjectiveState } from "./types.js";
import type { AdapterSpec, ComponentValue, PresentationKit, RelationOverlayOperand } from "./presentation-contract.js";
import { controlledSquareCount, factRenderer, listPhrase, otherSide, pieceOn, pieceSchema, plural, s, side, PresentationSchemaError, type Parser, type SchemaPiece } from "./presentation-schema.js";
import type { SquareControlReading } from "./square-control.js";
import { hintSentence, type HintDisclosurePayload } from "./hint-horizon.js";
import { HINT_FAMILIES, HINT_RELATIONS, HINT_RUNGS, hintDeclarationRow, type HintFamily, type HintRelation, type HintRung } from "./hint-registry.js";
import { CORPUS_GUARD } from "./population-guard.js";
import { explorerPopulationSummaryWire, type ExplorerPopulationSummary } from "./explorer-summary.js";
import { assertRegisteredShapeFiringWire, registeredShapeFiringOperands } from "./registered-shape-presentation.js";
import { bindFactStatement, bindRelationFactStatement, bindSquareFactStatement } from "./presentation-fact-contract.js";

/**
 * rfc/hint-distance.md §3/§4: the Guided Hint disclosure operands. The adapter retains exactly the
 * packet's own bytes (a lower rung carries no higher field) and renders the one canonical sentence.
 */
const hintShape = s.obj(
  { rung: s.lit(...HINT_RUNGS), family: s.lit(...HINT_FAMILIES), engine: s.str, bound: s.str },
  { squares: s.arr(s.square, { min: 1 }), piece: s.obj({ color: s.color, role: s.role, square: s.square }), relation: s.lit(...HINT_RELATIONS), ply: s.nat, san: s.san, uci: s.uci },
);
type HintOperands = ReturnType<typeof hintShape>;
function hintOperands(payload: HintDisclosurePayload): Readonly<Record<string, unknown>> {
  return {
    rung: payload.rung, family: payload.family, engine: payload.attribution.engine, bound: payload.attribution.bound,
    ...(payload.rung === "pattern" ? {} : { squares: [...payload.targetSquares] }),
    ...(payload.rung === "piece" || payload.rung === "distance" || payload.rung === "move" ? { piece: { color: payload.actor.color, role: payload.actor.role, square: payload.actor.square } } : {}),
    ...(payload.rung === "distance" || payload.rung === "move" ? { relation: payload.relation, ply: payload.occurrencePly } : {}),
    ...(payload.rung === "move" ? { san: payload.firstMove.san, uci: payload.firstMove.uci } : {}),
  };
}
function hintPayloadOf(value: HintOperands): HintDisclosurePayload {
  const need = <T>(field: T | undefined, label: string): T => { if (field === undefined) throw new PresentationSchemaError(`hint operands omit ${label} at rung ${value.rung}`); return field; };
  const base = { family: value.family as HintFamily, attribution: { engine: value.engine, bound: value.bound } };
  const rung = value.rung as HintRung;
  if (rung === "pattern") return { rung, ...base };
  const targetSquares = need(value.squares, "squares");
  if (rung === "square") return { rung, ...base, targetSquares };
  const actor = need(value.piece, "piece");
  if (rung === "piece") return { rung, ...base, targetSquares, actor };
  const relation = need(value.relation, "relation") as HintRelation;
  const occurrencePly = need(value.ply, "ply") === 1 ? 1 : 3;
  if (rung === "distance") return { rung, ...base, targetSquares, actor, relation, occurrencePly };
  return { rung, ...base, targetSquares, actor, relation, occurrencePly, firstMove: { uci: need(value.uci, "uci"), san: need(value.san, "san") } };
}

const hintSchema: Parser<HintOperands> = (value, label) => {
  const parsed = hintShape(value, label);
  if (parsed.ply !== undefined && (parsed.ply !== 1 && parsed.ply !== 3
    || parsed.relation === "root_direct" && parsed.ply !== 1
    || parsed.relation === "root_followup_in_line" && parsed.ply !== 3)) throw new PresentationSchemaError("hint relation and occurrence ply disagree");
  // The same existing redaction that constructs a rung determines its exact retained fields.
  const expected = hintOperands(hintPayloadOf(parsed));
  if (Object.keys(parsed).sort().join(",") !== Object.keys(expected).sort().join(",")) throw new PresentationSchemaError("hint fields exceed their disclosure rung");
  return parsed;
};

const placed = s.obj({ piece: pieceSchema, square: s.square });
const pawnContactShape = s.obj({ contacts: s.nat, locks: s.nat, passed: s.nat, connectedPassedPairs: s.nat,
  directedContacts: s.arr(s.obj({ attacker: placed, target: placed })) });
const pawnContactSchema: typeof pawnContactShape = (value, label) => {
  const parsed = pawnContactShape(value, label);
  if (parsed.contacts !== parsed.directedContacts.length) throw new PresentationSchemaError("Pawn contact count differs from retained directed contacts");
  return parsed;
};
const squareControlShape = s.obj({ colors: s.arr(s.obj({ color: s.color, pseudo: s.nat, legal: s.nullable(s.nat),
  pseudoControls: s.arr(s.obj({ target: s.square, controllers: s.arr(placed) })) }), { min: 1 }) });
const squareControlSchema: typeof squareControlShape = (value, label) => {
  const parsed = squareControlShape(value, label);
  if (parsed.colors.some(color => color.pseudo !== color.pseudoControls.filter(row => row.controllers.length > 0).length)) {
    throw new PresentationSchemaError("Square control count differs from retained target/controller entries");
  }
  return parsed;
};

/** Exact copies used by all current shared-renderer constructors, including Full2 zero readings. */
export function pawnContactCaptionOperands(reading: { readonly contacts: readonly { readonly attacker: PieceAt; readonly target: PieceAt }[];
  readonly locks: readonly unknown[]; readonly passed: readonly { readonly passed: boolean }[]; readonly connectedPassedPairs: readonly unknown[] }) {
  const at = (value: PieceAt) => ({ piece: { color: value.piece.color, role: value.piece.role }, square: value.square });
  return { contacts: reading.contacts.length, locks: reading.locks.length, passed: reading.passed.filter(row => row.passed).length,
    connectedPassedPairs: reading.connectedPassedPairs.length,
    directedContacts: reading.contacts.map(row => ({ attacker: at(row.attacker), target: at(row.target) })) };
}
export function squareControlCaptionOperands(reading: SquareControlReading) {
  return { colors: reading.colors.map(entry => ({ color: entry.color, pseudo: controlledSquareCount(entry.pseudo),
    legal: entry.legal.kind === "available" ? controlledSquareCount(entry.legal.squares) : null,
    pseudoControls: entry.pseudo.map(row => ({ target: row.target, controllers: row.controllers.map(controller => ({
      square: controller.square, piece: { color: controller.piece.color, role: controller.piece.role },
    })) })),
  })) };
}

// ---------------------------------------------------------------------------------------------
// Registered fact renderers
// ---------------------------------------------------------------------------------------------

const STRUCTURAL_KINDS = Object.freeze([
  "pawn_safe_square", "outpost", "backward_pawn", "isolated_pawn", "doubled_pawn", "passed_pawn", "open_file", "half_open_file",
  "line_blockers", "direct_attack_count", "piece_reach_count", "bishop_on_shade", "king_opposition", "piece_count", "king_zone", "piece_distance",
] as const);
type StructuralKind = (typeof STRUCTURAL_KINDS)[number];

const observationSchema = s.obj(
  { kind: s.lit(...STRUCTURAL_KINDS), squares: s.arr(s.square) },
  { color: s.color, role: s.role, file: s.file, count: s.int, shade: s.lit("light", "dark"), form: s.lit("direct", "distant"), zone: s.lit("edge", "corner"), pushes: s.nat, captures: s.nat },
);
type ObservationOperands = ReturnType<typeof observationSchema>;

const need = <T>(value: T | undefined, label: string): T => { if (value === undefined) throw new TypeError(`structural observation omits ${label}`); return value; };

/** The structural-observation template (the shipped sight renderer, in learner vocabulary). */
function observationSentence(o: ObservationOperands): string {
  const color = (): Color => need(o.color, "color");
  const first = o.squares[0] ?? "";
  switch (o.kind as StructuralKind) {
    case "backward_pawn": return `Under the declared pawn-structure convention, ${side(color())}'s pawn on the ${need(o.file, "file")}-file is backward.`;
    case "isolated_pawn": return `${side(color())} has a pawn on the ${need(o.file, "file")}-file and none on either adjacent file.`;
    case "doubled_pawn": return `${side(color())} has at least two pawns on the ${need(o.file, "file")}-file.`;
    case "passed_pawn": return `${side(color())}'s pawn on ${first} has no opposing pawn ahead on its file or an adjacent file.`;
    case "open_file": return `Neither side has a pawn on the ${need(o.file, "file")}-file.`;
    case "half_open_file": return `${side(color())} has no pawn on the ${need(o.file, "file")}-file; the other side has one.`;
    case "pawn_safe_square":
      if (o.pushes !== undefined) return `Under maximal pawn reach, an opposing pawn can reach an attacking square for ${first} after ${plural(o.pushes, "forward step")}; blockers and move legality are not evaluated.`;
      if (o.captures !== undefined) return `Under maximal pawn reach, an opposing pawn can reach an attacking file for ${first} after at least ${plural(o.captures, "capture")}; capture availability and move legality are not asserted.`;
      return `Under maximal pawn reach, no opposing pawn can reach a square from which it attacks ${first}.`;
    case "outpost": return `Under the declared pawn-structure convention, ${first} is an outpost for ${side(color())}: pawn-supported in enemy territory with no opposing pawn able to reach it.`;
    case "line_blockers": return `The line through ${o.squares.join("–")} contains ${plural(need(o.count, "count"), "blocker")}.`;
    case "direct_attack_count": return `${plural(need(o.count, "count"), `${side(color())} piece`)} directly attack ${first} in the current occupancy; pins are not evaluated.`;
    case "piece_reach_count": return `${side(color())}'s ${need(o.role, "role")} on ${first} has ${plural(need(o.count, "count"), "attack-reachable square")} in the current occupancy; check and pins are not evaluated.`;
    case "bishop_on_shade": return `${side(color())}'s bishop on ${first} stands on a ${need(o.shade, "shade")} square.`;
    case "king_opposition": return `${side(color())} has the ${need(o.form, "form")} opposition: kings on ${o.squares.join(" and ")} with ${otherSide(color())} to move.`;
    case "piece_count": return `${side(color())} has ${plural(need(o.count, "count"), o.role ?? "piece")}.`;
    case "king_zone": return `${side(color())}'s king on ${first} stands ${need(o.zone, "zone") === "corner" ? "on a1, a8, h1 or h8" : "on the a-file, the h-file, the first rank or the eighth rank"}.`;
    case "piece_distance": return `The kings on ${o.squares.join(" and ")} stand ${plural(need(o.count, "count"), "king-move")} apart.`;
  }
}

/** Registered structure names (the catalogue's own names); a payload name that disagrees is refused. */
export const STRUCTURE_NAMES = Object.freeze({
  carlsbad: "Carlsbad structure",
  "iqp-white": "White isolated queen's pawn",
  "iqp-black": "Black isolated queen's pawn",
  "maroczy-bind": "Maroczy Bind",
} as const);
type StructureName = keyof typeof STRUCTURE_NAMES;
const namedStructureSchema = s.obj({ id: s.lit(...(Object.keys(STRUCTURE_NAMES) as StructureName[])), name: s.str, squares: s.arr(s.square, { min: 1 }) });
const legalMovesShape = s.obj({ turn: s.color, pieces: s.nat, moves: s.nat, squares: s.arr(s.square) });
const legalMovesSchema: typeof legalMovesShape = (value, label) => {
  const parsed = legalMovesShape(value, label);
  if (new Set(parsed.squares).size !== parsed.squares.length || parsed.pieces !== parsed.squares.length
    || parsed.pieces === 0 && parsed.moves !== 0) throw new PresentationSchemaError(`${label} legal move counts/squares disagree`);
  return parsed;
};

const wings = (rights: { readonly kingside: boolean; readonly queenside: boolean }): string =>
  rights.kingside && rights.queenside ? "kingside and queenside" : rights.kingside ? "kingside only" : rights.queenside ? "queenside only" : "no castling rights";
const WING = s.lit("kingside", "queenside");

const threatSchema = s.obj({ threats: s.arr(s.obj({ piece: pieceSchema, from: s.square, mate: s.bool }, { target: pieceSchema, to: s.square }), { min: 1 }) });
function threatPhrases(value: ReturnType<typeof threatSchema>): readonly string[] {
  return value.threats.map((threat) => threat.mate
    ? `${pieceOn(threat.piece, threat.from)} could deliver mate${threat.to === undefined ? "" : ` on ${threat.to}`}`
    : threat.target !== undefined && threat.to !== undefined
      ? `${pieceOn(threat.piece, threat.from)} could capture ${pieceOn(threat.target, threat.to)}`
      : `${pieceOn(threat.piece, threat.from)} has a threat${threat.to === undefined ? "" : ` on ${threat.to}`}`);
}
const mateSchema = s.obj({ mates: s.arr(s.obj({ piece: pieceSchema, from: s.square, to: s.square, king: s.square }), { min: 1 }) });
const looseSchema = s.obj({ pieces: s.arr(s.obj({ piece: pieceSchema, square: s.square, enPrise: s.bool, loose: s.bool, underDefended: s.bool, capturers: s.arr(s.square), defenders: s.nat }), { min: 1 }) });
const rayKinds = s.lit("absolute_pin", "relative_pin", "skewer", "xray_attack", "xray_defense");
const raySchema = s.obj({ rays: s.arr(s.obj({ kind: rayKinds, slider: pieceSchema, sliderSquare: s.square, blocker: pieceSchema, blockerSquare: s.square, target: pieceSchema, targetSquare: s.square }), { min: 1 }) });
const RAY_VERBS: Readonly<Record<ReturnType<typeof rayKinds>, string>> = Object.freeze({
  absolute_pin: "pins", relative_pin: "pins", skewer: "skewers", xray_attack: "x-rays through", xray_defense: "defends through",
});

const positive: Parser<number> = (value, label) => { const number = s.nat(value, label); if (number === 0) throw new PresentationSchemaError(`${label} must be positive`); return number; };
const finite: Parser<number> = (value, label) => { if (typeof value !== "number" || !Number.isFinite(value)) throw new PresentationSchemaError(`${label} must be finite`); return value; };
const enginePointShape = s.obj({ nodeId: s.str, plyOffset: s.nat,
  whiteScore: s.union("kind", { centipawns: s.obj({ kind: s.lit("centipawns"), value: finite }), mate: s.obj({ kind: s.lit("mate"), side: s.color, distance: positive, unit: s.lit("moves") }) }),
  engineId: s.str, instrument: s.union("origin", {
    provider_delivery: s.obj({ origin: s.lit("provider_delivery"), engineVersion: s.str, generation: positive }),
    offline_engine: s.obj({ origin: s.lit("offline_engine"), engineVersion: s.str, profile: s.obj({ threads: positive, hashMb: positive, multiPv: s.lit(1) }) }),
  }), bound: s.union("kind", { depth: s.obj({ kind: s.lit("depth"), requestedDepth: positive }), movetime: s.obj({ kind: s.lit("movetime"), requestedMs: positive }), nodes: s.obj({ kind: s.lit("nodes"), requestedNodes: positive }) }),
});
const enginePointSchema: Parser<ReturnType<typeof enginePointShape>> = (value, label) => {
  const parsed = enginePointShape(value, label);
  if (parsed.instrument.origin === "offline_engine" && parsed.bound.kind === "nodes") throw new PresentationSchemaError(`${label} offline analysis requires a depth or time budget`);
  return parsed;
};

export const PLAY_FACT_RENDERERS = Object.freeze({
  "compare.engine_point@2": factRenderer(enginePointSchema, value => {
    const score = value.whiteScore.kind === "centipawns" ? `${value.whiteScore.value >= 0 ? "+" : ""}${value.whiteScore.value} centipawns for White`
      : `${side(value.whiteScore.side)} mating in ${plural(value.whiteScore.distance, "move")}`;
    const bound = value.bound.kind === "depth" ? `requested depth ${value.bound.requestedDepth}` : value.bound.kind === "movetime" ? `requested ${value.bound.requestedMs} ms` : `requested ${value.bound.requestedNodes} search nodes`;
    const origin = value.instrument.origin === "provider_delivery" ? `recorded engine job, generation ${value.instrument.generation}`
      : `recorded offline analysis, ${value.instrument.profile.threads} threads and ${value.instrument.profile.hashMb} MB hash`;
    return `After ${plural(value.plyOffset, "move")} by either side from the fork: ${score} (${value.engineId} ${value.instrument.engineVersion}; ${origin}; ${bound}). An engine reading at this budget, not move advice.`;
  }),
  "compare.recorded_delta@2": factRenderer(s.obj({ before: s.int, after: s.int, delta: s.int, plyOffset: s.nat,
    frame: s.lit("recorded_cp_numbers"), comparability: s.lit("provider_not_established") }), value => {
    if (!Number.isSafeInteger(value.after - value.before) || value.delta !== value.after - value.before) throw new PresentationSchemaError("recorded difference does not match its operands");
    return `After ${plural(value.plyOffset, "move")} by either side from the fork, the recorded numbers differ by ${value.delta >= 0 ? "+" : ""}${value.delta} centipawns (${value.before} to ${value.after}). Whether the engine runs are comparable is not established; this is not a move grade.`;
  }),
  "play.explorer_summary@1": factRenderer(s.obj({ total: s.nat, white: s.nat, draws: s.nat, black: s.nat, ratings: s.arr(s.nat), speeds: s.arr(s.str), since: s.nullable(s.str), until: s.nullable(s.str), opening: s.nullable(s.str), disclosure: s.lit(CORPUS_GUARD) }), (value) =>
    `Lichess Explorer: ${plural(value.total, "game")} in rating bands ${value.ratings.join(", ")} (${value.speeds.join(", ")}; ${value.since ?? "all dates"} to ${value.until ?? "now"}). White won ${value.white}, ${value.draws} drawn, Black won ${value.black}.${value.opening === null ? "" : ` Reported opening: ${value.opening}.`} ${value.disclosure}`),
  "play.structural_observation@1": factRenderer(observationSchema, observationSentence),
  "play.named_structure@1": factRenderer(namedStructureSchema, (value) => {
    if (STRUCTURE_NAMES[value.id] !== value.name) throw new TypeError("named structure name disagrees with the registered catalogue name");
    return `Recognized pawn structure: ${value.name} (pawns on ${listPhrase(value.squares)}).`;
  }),
  "play.castling_rights@1": factRenderer(s.obj({ white: s.obj({ kingside: s.bool, queenside: s.bool }), black: s.obj({ kingside: s.bool, queenside: s.bool }) }), (value) =>
    `Castling rights: White ${wings(value.white)}; Black ${wings(value.black)}.`),
  "play.castling_legality@1": factRenderer(s.obj({ color: s.color, wing: WING, legalNow: s.bool, inCheck: s.bool, blocked: s.arr(s.square), attacked: s.arr(s.square) }), (value) => {
    if (value.legalNow) return `${side(value.color)} can castle ${value.wing} now.`;
    const reasons = [
      ...(value.inCheck ? ["the king is in check"] : []),
      ...(value.blocked.length > 0 ? [`${listPhrase(value.blocked)} ${value.blocked.length === 1 ? "is" : "are"} occupied`] : []),
      ...(value.attacked.length > 0 ? [`${listPhrase(value.attacked)} ${value.attacked.length === 1 ? "is" : "are"} attacked`] : []),
    ];
    return `${side(value.color)} cannot castle ${value.wing} now${reasons.length === 0 ? "" : `: ${listPhrase(reasons)}`}.`;
  }),
  "play.rook_on_seventh@1": factRenderer(s.obj({ rooks: s.arr(s.obj({ color: s.color, square: s.square, king: s.nullable(s.square), pawns: s.arr(s.square) }), { min: 1 }) }), (value) =>
    value.rooks.map((rook) => `${side(rook.color)}'s rook on ${rook.square} stands on the seventh rank${rook.king === null ? "" : `, with ${otherSide(rook.color)}'s king on ${rook.king} on the back rank`}${rook.pawns.length === 0 ? "" : ` and ${otherSide(rook.color)} pawns on ${listPhrase(rook.pawns)}`}.`).join(" ")),
  "play.legal_moves@1": factRenderer(legalMovesSchema, (value) =>
    `${side(value.turn)} has ${plural(value.moves, "legal move")} spread over ${plural(value.pieces, "piece")}.`),
  "play.pawn_contacts@1": factRenderer(pawnContactSchema, (value) =>
    `Pawn contacts: ${plural(value.contacts, "attacking contact")}, ${plural(value.locks, "locked pair")}, ${plural(value.passed, "passed pawn")} and ${plural(value.connectedPassedPairs, "connected passed pair")}.`),
  "play.square_control@1": factRenderer(squareControlSchema, (value) =>
    `Square control: ${value.colors.map((entry) => `${side(entry.color)} attacks ${plural(entry.pseudo, "square")}${entry.legal === null ? "" : ` (${entry.legal} with legal moves)`}`).join("; ")}.`),
  "play.threats@1": factRenderer(threatSchema, (value) => {
    const mover = value.threats[0]!.piece.color;
    return `If ${side(mover)} could move now: ${listPhrase(threatPhrases(value))}. Only immediate threats are shown; this is not a forced continuation.`;
  }),
  // The at-commit cue has a 20-word ceiling. It keeps the same immediate hypothetical
  // threat, but not the expanded rail card's explanatory frame. No threat is selected here.
  "play.staged_threats@1": factRenderer(threatSchema, (value) =>
    `If ${side(value.threats[0]!.piece.color)} moves next: ${listPhrase(threatPhrases(value))}.`),
  "play.mate_in_one@1": factRenderer(mateSchema, (value) =>
    `${listPhrase(value.mates.map((mate) => `${pieceOn(mate.piece, mate.from)} can deliver mate on ${mate.to}`))} (the king on ${value.mates[0]!.king} has no escape).`),
  "play.loose_pieces@1": factRenderer(looseSchema, (value) => value.pieces.map((entry) => {
    const state = entry.enPrise ? "can be captured at a material loss" : entry.loose ? "has no defender" : "has fewer defenders than attackers";
    return `${pieceOn(entry.piece, entry.square)} ${state}${entry.capturers.length === 0 ? "" : ` (attacked from ${listPhrase(entry.capturers)})`}.`;
  }).join(" ")),
  "play.back_rank@1": factRenderer(s.obj({ kings: s.arr(s.obj({ color: s.color, king: s.square, blockedEscapes: s.arr(s.square), attackedEscapes: s.arr(s.square), heavy: s.arr(s.obj({ piece: pieceSchema, square: s.square, target: s.square })) }), { min: 1 }) }), (value) =>
    value.kings.map((king) => `${side(king.color)}'s king on ${king.king} has no free escape off the back rank${king.blockedEscapes.length === 0 ? "" : ` (${listPhrase(king.blockedEscapes)} blocked by its own pieces)`}${king.attackedEscapes.length === 0 ? "" : `${king.blockedEscapes.length === 0 ? " (" : "; "}${listPhrase(king.attackedEscapes)} attacked${king.blockedEscapes.length === 0 ? ")" : ""}`}${king.blockedEscapes.length > 0 && king.attackedEscapes.length > 0 ? ")" : ""}${king.heavy.length === 0 ? "" : `, and ${listPhrase(king.heavy.map((piece) => `${pieceOn(piece.piece, piece.square)} ${piece.square === piece.target ? "already occupies" : "can reach"} ${piece.target}`))}`}.`).join(" ")),
  "play.trapped_pieces@1": factRenderer(s.obj({ pieces: s.arr(s.obj({ piece: pieceSchema, square: s.square, attackers: s.arr(s.square), moves: s.nat }), { min: 1 }) }), (value) =>
    value.pieces.map((entry) => `${pieceOn(entry.piece, entry.square)} is trapped under the declared convention: ${entry.moves === 0 ? "it has no legal move" : `each of its ${plural(entry.moves, "move")} loses material`}${entry.attackers.length === 0 ? "" : `, and it is attacked from ${listPhrase(entry.attackers)}`}.`).join(" ")),
  "play.rays@1": factRenderer(raySchema, (value) =>
    value.rays.map((ray) => `${pieceOn(ray.slider, ray.sliderSquare)} ${RAY_VERBS[ray.kind]} ${pieceOn(ray.blocker, ray.blockerSquare)} to ${pieceOn(ray.target, ray.targetSquare)}.`).join(" ")),
  "play.defender_exposure@1": factRenderer(s.obj({ defender: pieceSchema, defenderSquare: s.square, target: pieceSchema, targetSquare: s.square }), (value) =>
    `After this move, ${pieceOn(value.defender, value.defenderSquare)} no longer defends ${pieceOn(value.target, value.targetSquare)}.`),
  "play.space@1": factRenderer(s.obj({ totals: s.arr(s.obj({ color: s.color, total: s.nat }), { min: 2, max: 2 }), zones: s.arr(s.obj({ zone: s.lit("queenside", "central", "kingside"), white: s.nat, black: s.nat }), { min: 1 }) }), (value) =>
    `Space under the declared convention: ${value.totals.map((entry) => `${side(entry.color)} ${entry.total}`).join(", ")} (${value.zones.map((zone) => `${zone.zone === "central" ? "centre" : zone.zone} ${zone.white}–${zone.black}`).join(", ")}).`),
  "play.pawn_connectivity@1": factRenderer(s.obj({ colors: s.arr(s.obj({ color: s.color, islands: s.nat, connectedPairs: s.nat, chains: s.nat }), { min: 1 }) }), (value) =>
    value.colors.map((entry) => `${side(entry.color)} has ${plural(entry.islands, "pawn island")}, ${plural(entry.connectedPairs, "connected pawn pair")} and ${plural(entry.chains, "pawn chain")}.`).join(" ")),
  "play.phase@1": factRenderer(s.obj({ phase: s.lit("opening", "middlegame", "endgame", "unclear") }), (value) =>
    value.phase === "unclear" ? "The game phase is not clear from this position." : `Current position: ${value.phase[0]!.toUpperCase()}${value.phase.slice(1)}.`),
  "play.endgame_type@1": factRenderer(s.obj({ label: s.nullable(s.str) }), (value) =>
    value.label === null ? "Endgame; the material is outside the declared endgame convention." : `${value.label} under the declared endgame convention.`),
  "play.endgame_setup@1": factRenderer(s.obj({ technique: s.str, name: s.str }), (value) =>
    `The pieces match the ${value.name} setup in the cited endgame convention (geometry only; not an outcome or advice).`),
  "play.shape@1": factRenderer(s.obj({ title: s.str }), (value) => `Recognized position pattern: ${value.title}. Named plans for this structure are general to the kind of position, not advice for this one.`),
  "play.shape_entry@1": factRenderer(s.obj({ entryId: s.str, title: s.str }), (value) => `Recognized position pattern: ${value.title}. Named plans for this structure are general to the kind of position, not advice for this one.`),
  "play.opening@1": factRenderer(s.obj({ eco: s.str, name: s.str }), (value) => `Opening in the cited catalogue: ${value.eco} ${value.name}.`),
  "play.authored_claim@1": factRenderer(s.obj({ text: s.str }), (value) => `The pack author wrote: “${value.text}”`),
  "play.compare_structure@1": factRenderer(s.obj({ observation: observationSchema }), (value) => `On this attempt after the fork: ${observationSentence(value.observation)}`),
  "play.compare_route@1": factRenderer(s.obj({ piece: s.str, squares: s.arr(s.square, { min: 2 }) }), (value) => `On this attempt the ${value.piece} travelled ${value.squares.join(" → ")}.`),
  "play.recorded_fork@1": factRenderer(s.obj({ sharedPly: s.nat }), (value) => `The lines share the first ${plural(value.sharedPly, "move")} by either side, then separate.`),
  "play.checkpoint_hit@1": factRenderer(s.obj({ plyOffset: s.nat }), (value) => value.plyOffset === 0
    ? "This line reached a checkpoint where the lines separate."
    : `This line reached a checkpoint after ${plural(value.plyOffset, "move")} by either side.`),
  "play.guided_hint@1": factRenderer(hintSchema, (value) => hintSentence(hintPayloadOf(value))),
  "play.objective_transition@1": factRenderer(s.obj({ from: s.lit("active", "preserved", "degraded", "failed", "achieved", "transitioned"), to: s.lit("active", "preserved", "degraded", "failed", "achieved", "transitioned") }), (value) =>
    `The rehearsal goal changed from ${OBJECTIVE_WORDS[value.from]} to ${OBJECTIVE_WORDS[value.to]}.`),
});

const OBJECTIVE_WORDS = Object.freeze({ active: "in progress", preserved: "held", degraded: "weakened", failed: "missed", achieved: "reached", transitioned: "the next phase" } as const);

/** Registered magnitude quantities for the play seats' magnitudes. */
export const PLAY_MAGNITUDE_QUANTITIES: Readonly<Record<string, { readonly label: string }>> = Object.freeze({
  "derived.compare.engine_trajectory@1": { label: "Stored engine evaluation on this attempt" },
  "derived.compare.eval_delta@1": { label: "Stored engine evaluation change on this attempt" },
});

// ---------------------------------------------------------------------------------------------
// Payload shapes the adapters read (types only; the manifest's typed payloads)
// ---------------------------------------------------------------------------------------------

interface PieceAt { readonly square: SquareName; readonly piece: SchemaPiece }
interface Occupant { readonly square: SquareName; readonly occupant: SchemaPiece }

const piece = (value: { readonly color: Color; readonly role: Role }): SchemaPiece => ({ color: value.color, role: value.role });
const toSquare = (uci: string): SquareName => uci.slice(2, 4) as SquareName;
const fromSquare = (uci: string): SquareName => uci.slice(0, 2) as SquareName;

// ---------------------------------------------------------------------------------------------
// Adapter factory
// ---------------------------------------------------------------------------------------------

const V1 = (id: string, version = 1): VersionedEvidenceId => Object.freeze({ id, version });
const MODULE = (id: string): VersionedEvidenceId => MODULE_CURRENT_IMAGE.find(row => row.moduleId === id)!.consumer;

type Construct = (evidence: DeclaredEvidence<unknown>) => ComponentValue | readonly ComponentValue[];

export function playAdapterSpecs(kit: PresentationKit): readonly AdapterSpec[] {
  const specs: AdapterSpec[] = [];
  const add = (module: string, projection: VersionedEvidenceId, component: AdapterSpec["component"], forms: readonly EvidenceForm[], sourceOperands: readonly string[], assertions: AdapterSpec["assertions"], construct: Construct, composition?: AdapterSpec["composition"], validateWireComponent?: AdapterSpec["validateWireComponent"], validateWireComposition?: AdapterSpec["validateWireComposition"]) => {
    const hasText = component === "fact_statement" || component === "square_set"
      || composition?.members.some(member => member.component === "fact_statement" || member.component === "square_set");
    if (hasText && validateWireComponent === undefined) throw new TypeError(`Play fact/caption adapter omits received validation: ${module} × ${projection.id}`);
    specs.push({ consumer: MODULE(module), projection, component, forms, sourceOperands, assertions, construct, ...(composition === undefined ? {} : { composition }), ...(validateWireComponent === undefined ? {} : { validateWireComponent }), ...(validateWireComposition === undefined ? {} : { validateWireComposition }) });
  };
  const SQUARE_FORMS: readonly EvidenceForm[] = ["list", "lit_squares", "panel", "piece_halo"];

  // --- sight_on_request: the shipped sight renderer, one fact per gesture (module-registration §4.2)
  for (const kind of STRUCTURAL_KINDS) {
    const caption = bindSquareFactStatement(kit, "play.structural_observation@1", "declared_convention",
      kind === "backward_pawn" || kind === "outpost" ? "pawn-structure@1" : "board-rules@1", value => value.squares, "blue");
    const assertKind = (actual: StructuralKind): void => {
      if (actual !== kind) throw new TypeError("Structural caption crosses its declared source kind");
    };
    add("sight_on_request", V1(`rules.structural.reading.${kind}`), "square_set", SQUARE_FORMS, ["kind", "squares"], ["copied_byte_equal", "mechanical_transform"], (evidence) => {
      const observation = evidence.payload as { readonly kind: StructuralKind; readonly squares: readonly SquareName[]; readonly color?: Color; readonly role?: Role; readonly file?: string; readonly count?: number; readonly shade?: "light" | "dark"; readonly form?: "direct" | "distant"; readonly zone?: "edge" | "corner"; readonly detail?: { readonly pushAttackers: readonly { readonly pushes: number }[]; readonly captureAttackers: readonly { readonly captures: number }[] } };
      assertKind(observation.kind);
      const pushes = observation.detail?.pushAttackers[0]?.pushes;
      const captures = observation.detail?.captureAttackers[0]?.captures;
      const operands = {
        kind: observation.kind, squares: [...observation.squares],
        ...(observation.color === undefined ? {} : { color: observation.color }), ...(observation.role === undefined ? {} : { role: observation.role }),
        ...(observation.file === undefined ? {} : { file: observation.file }), ...(observation.count === undefined ? {} : { count: observation.count }),
        ...(observation.shade === undefined ? {} : { shade: observation.shade }), ...(observation.form === undefined ? {} : { form: observation.form }),
        ...(observation.zone === undefined ? {} : { zone: observation.zone }),
        ...(pushes === undefined ? {} : { pushes }), ...(pushes === undefined && captures !== undefined ? { captures } : {}),
      };
      return caption.square(evidence, operands);
    }, undefined, (component, evidence) => {
      caption.validateWireComponent(component, evidence);
      if (component.id === "square_set" && component.operand.caption.rendererId === "play.structural_observation@1") assertKind(component.operand.caption.operands.kind);
    });
  }
  const namedStructure = bindSquareFactStatement(kit, "play.named_structure@1", "declared_convention", "structure-catalogue@1", value => value.squares, "blue");
  const namedStructureOperands = (evidence: DeclaredEvidence<unknown>) => {
    const match = evidence.payload as { readonly id: StructureName; readonly name: string; readonly squares: readonly SquareName[] };
    return { id: match.id, name: match.name, squares: [...match.squares] };
  };
  add("sight_on_request", V1("rules.structural.reading.named_structure", 2), "square_set", ["list", "lit_squares", "panel", "piece_halo", "sentence"], ["id", "name", "squares"], ["copied_byte_equal"], (evidence) => {
    const operands = namedStructureOperands(evidence);
    return [namedStructure.square(evidence, operands), namedStructure.statement(operands)];
  }, { id: "named_structure_board", members: [{ component: "square_set", forms: SQUARE_FORMS }, { component: "fact_statement", forms: ["sentence"] }] }, namedStructure.validateWireComponent);
  const castlingRights = bindFactStatement(kit.fact, "play.castling_rights@1", "declared_convention", "board-rules@1");
  add("sight_on_request", V1("rules.castling.reading.rights"), "fact_statement", ["list", "panel"], ["white", "black"], ["copied_byte_equal"], (evidence) => {
    const rights = evidence.payload as { readonly white: { readonly kingside: boolean; readonly queenside: boolean }; readonly black: { readonly kingside: boolean; readonly queenside: boolean } };
    return castlingRights.statement({ white: { ...rights.white }, black: { ...rights.black } });
  }, undefined, castlingRights.validateWireComponent);
  const castlingLegality = bindFactStatement(kit.fact, "play.castling_legality@1", "declared_convention", "board-rules@1");
  add("sight_on_request", V1("rules.castling.reading.legality"), "fact_statement", ["list", "panel"], ["color", "wing", "legalNow", "inCheck", "blockedSquares", "attackedSquares"], ["copied_byte_equal"], (evidence) => {
    const issue = evidence.payload as { readonly color: Color; readonly wing: "kingside" | "queenside"; readonly legalNow: boolean; readonly inCheck: boolean; readonly blockedSquares: readonly SquareName[]; readonly attackedSquares: readonly SquareName[] };
    return castlingLegality.statement({ color: issue.color, wing: issue.wing, legalNow: issue.legalNow, inCheck: issue.inCheck, blocked: [...issue.blockedSquares], attacked: [...issue.attackedSquares] });
  }, undefined, castlingLegality.validateWireComponent);
  const rookOnSeventh = bindSquareFactStatement(kit, "play.rook_on_seventh@1", "declared_convention", "board-rules@1",
    value => value.rooks.flatMap(rook => [rook.square, ...(rook.king === null ? [] : [rook.king]), ...rook.pawns]), "blue");
  add("sight_on_request", V1("rules.tactic.reading.rook_on_seventh"), "square_set", SQUARE_FORMS, ["rooks"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly rooks: readonly { readonly rook: PieceAt; readonly enemyKingOnBackRank: PieceAt | null; readonly enemyPawnsOnSeventh: readonly PieceAt[] }[] };
    const rooks = reading.rooks.map((rook) => ({ color: rook.rook.piece.color, square: rook.rook.square, king: rook.enemyKingOnBackRank?.square ?? null, pawns: rook.enemyPawnsOnSeventh.map((pawn) => pawn.square) }));
    return rookOnSeventh.square(evidence, { rooks });
  }, undefined, rookOnSeventh.validateWireComponent);
  const legalMoves = bindSquareFactStatement(kit, "play.legal_moves@1", "declared_convention", "board-rules@1", value => value.squares, "blue");
  add("sight_on_request", V1("rules.mobility.reading.legal_moves"), "square_set", SQUARE_FORMS, ["turn", "pieces"], ["mechanical_transform"], (evidence) => {
    const map = evidence.payload as { readonly turn: Color; readonly pieces: readonly { readonly piece: { readonly square: SquareName }; readonly moves: readonly unknown[] }[] };
    const movable = map.pieces.filter((entry) => entry.moves.length > 0);
    return legalMoves.square(evidence, { turn: map.turn, pieces: movable.length, moves: movable.reduce((sum, entry) => sum + entry.moves.length, 0), squares: [...new Set(movable.map(entry => entry.piece.square))] });
  }, undefined, legalMoves.validateWireComponent);
  const relationWithStatement = (id: string, relationForms: readonly EvidenceForm[], statementForms: readonly EvidenceForm[]): AdapterSpec["composition"] =>
    ({ id, members: [{ component: "relation_overlay", forms: relationForms }, { component: "fact_statement", forms: statementForms }] });
  const pawnContacts = bindFactStatement(kit.fact, "play.pawn_contacts@1", "declared_convention", "board-rules@1");
  const pawnContactOverlay = bindRelationFactStatement<"play.pawn_contacts@1">(kit, pawnContacts,
    { answerDistance: "fact", relation: "attacks", sign: "state" }, value => ({
      nodes: value.directedContacts.flatMap(contact => [
        { square: contact.attacker.square, ...contact.attacker.piece, emphasis: "source" as const },
        { square: contact.target.square, ...contact.target.piece, emphasis: "target" as const },
      ]), endpoints: value.directedContacts.map(contact => ({ from: contact.attacker.square, to: contact.target.square })),
    }));
  add("sight_on_request", V1("rules.pawn.reading.contacts"), "relation_overlay", ["arrows", "list", "lit_squares", "panel", "piece_halo"], ["contacts", "locks", "passed", "connectedPassedPairs"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly contacts: readonly { readonly attacker: PieceAt; readonly target: PieceAt }[]; readonly locks: readonly unknown[]; readonly passed: readonly { readonly passed: boolean }[]; readonly connectedPassedPairs: readonly unknown[] };
    if (reading.contacts.length === 0) throw new TypeError("a pawn-contact overlay needs at least one contact; the operation offers only witnessed readings");
    return pawnContactOverlay.components(evidence, pawnContactCaptionOperands(reading));
  }, relationWithStatement("pawn_contacts_overlay", ["arrows", "lit_squares", "panel", "piece_halo"], ["list"]), pawnContactOverlay.validateWireComponent, pawnContactOverlay.validateWireComposition);
  const squareControl = bindFactStatement(kit.fact, "play.square_control@1", "declared_convention", "piece-geometry@1");
  const squareControlOverlay = bindRelationFactStatement<"play.square_control@1">(kit, squareControl,
    { answerDistance: "fact", relation: "controls", sign: "state" }, value => {
    const nodes: RelationOverlayOperand["nodes"][number][] = [];
    const edges: Pick<RelationOverlayOperand["edges"][number], "from" | "to">[] = [];
    for (const entry of value.colors) for (const controlled of entry.pseudoControls) {
      nodes.push({ square: controlled.target, emphasis: "target" });
      for (const controller of controlled.controllers) {
        nodes.push({ square: controller.square, role: controller.piece.role, color: controller.piece.color, emphasis: "source" });
        edges.push({ from: controller.square, to: controlled.target });
      }
    }
    const controllerNodes = nodes.filter((node) => node.emphasis === "source");
    const ordered = [...controllerNodes, ...nodes.filter((node) => node.emphasis !== "source")];
    return { nodes: ordered, endpoints: edges.filter(edge => edge.from !== edge.to) };
  });
  add("sight_on_request", V1("rules.square.reading.control"), "relation_overlay", ["arrows", "list", "lit_squares", "panel", "piece_halo"], ["colors"], ["mechanical_transform"], evidence =>
    squareControlOverlay.components(evidence, squareControlCaptionOperands(evidence.payload as SquareControlReading)),
  relationWithStatement("square_control_overlay", ["arrows", "lit_squares", "panel", "piece_halo"], ["list"]), squareControlOverlay.validateWireComponent, squareControlOverlay.validateWireComposition);

  // --- threat_radar and blunder_prevention: opponent resources, rendered as fact statements
  // (their bindings serve list/panel) or relation overlays where the binding admits arrows.
  const threatConstruct = (renderer: "play.threats@1" | "play.staged_threats@1") => {
    const bound = bindFactStatement(kit.fact, renderer, "declared_convention", "threat-convention@1");
    const construct: Construct = evidence => {
      const result = evidence.payload as { readonly kind: "threats" | "abstained"; readonly threats: readonly { readonly threateningPiece: PieceAt; readonly target?: PieceAt; readonly threatenedMove: string; readonly mate: boolean }[] };
      return bound.statement({ threats: result.threats.map((threat) => ({ piece: piece(threat.threateningPiece.piece), from: threat.threateningPiece.square, mate: threat.mate, ...(threat.target === undefined ? {} : { target: piece(threat.target.piece) }), to: toSquare(threat.threatenedMove) })) });
    };
    return { construct, validateWireComponent: bound.validateWireComponent };
  };
  const mate = bindFactStatement(kit.fact, "play.mate_in_one@1", "declared_convention", "board-rules@1");
  const mateConstruct: Construct = (evidence) => {
    const reading = evidence.payload as { readonly mates: readonly { readonly moveUci: string; readonly mover: { readonly piece: SchemaPiece; readonly from: SquareName; readonly to: SquareName }; readonly matedKing: { readonly square: SquareName } }[] };
    return mate.statement({ mates: reading.mates.map((mate) => ({ piece: piece(mate.mover.piece), from: mate.mover.from, to: mate.mover.to, king: mate.matedKing.square })) });
  };
  const loose = bindFactStatement(kit.fact, "play.loose_pieces@1", "declared_convention", "threat-convention@1");
  const looseConstruct: Construct = (evidence) => {
    const reading = evidence.payload as { readonly pieces: readonly { readonly piece: Occupant; readonly legalCapturers: readonly { readonly square: SquareName }[]; readonly defenders: readonly unknown[]; readonly enPrise: boolean; readonly loose: boolean; readonly underDefended: boolean }[] };
    const flagged = reading.pieces.filter((entry) => entry.enPrise); // only a piece capturable at a material gain is a concrete exposure
    return loose.statement({ pieces: flagged.map((entry) => ({ piece: piece(entry.piece.occupant), square: entry.piece.square, enPrise: entry.enPrise, loose: entry.loose, underDefended: entry.underDefended, capturers: entry.legalCapturers.map((capturer) => capturer.square), defenders: entry.defenders.length })) });
  };
  for (const module of ["threat_radar", "blunder_prevention"] as const) {
    const threat = threatConstruct(module === "blunder_prevention" ? "play.staged_threats@1" : "play.threats@1");
    add(module, V1("rules.tactic.consequence.threat"), "fact_statement", ["list", "panel"], ["threats"], ["mechanical_transform"], threat.construct, undefined, threat.validateWireComponent);
    add(module, V1("rules.tactic.consequence.mate_in_one"), "fact_statement", ["list", "panel"], ["mates"], ["mechanical_transform"], mateConstruct, undefined, mate.validateWireComponent);
    add(module, V1("rules.tactic.reading.loose_piece"), "fact_statement", ["list", "panel"], ["pieces"], ["mechanical_transform"], looseConstruct, undefined, loose.validateWireComponent);
  }
  const backRank = bindFactStatement(kit.fact, "play.back_rank@1", "declared_convention", "threat-convention@1");
  const backRankOverlay = bindRelationFactStatement<"play.back_rank@1">(kit, backRank,
    { answerDistance: "threat", relation: "moves_to", sign: "state", convention: "threat-convention@1" }, value => {
      const endpoints = value.kings.flatMap(entry => entry.heavy.filter(heavy => heavy.square !== heavy.target).map(heavy => ({ from: heavy.square, to: heavy.target })));
      if (endpoints.length === 0) throw new PresentationSchemaError("a back-rank overlay needs an accessing heavy piece; the operation offers only witnessed readings");
      return { nodes: value.kings.flatMap(entry => [
        { square: entry.king, role: "king" as const, color: entry.color, emphasis: "target" as const },
        ...entry.heavy.flatMap(heavy => [{ square: heavy.square, ...heavy.piece, emphasis: "source" as const }, { square: heavy.target, emphasis: "target" as const }]),
      ]), endpoints };
    });
  add("threat_radar", V1("rules.tactic.reading.back_rank"), "relation_overlay", ["arrows", "list", "lit_squares", "panel", "piece_halo"], ["susceptible"], ["mechanical_transform", "retained_convention"], (evidence) => {
    const reading = evidence.payload as { readonly susceptible: readonly { readonly color: Color; readonly kingSquare: SquareName; readonly escapes: readonly { readonly square: SquareName; readonly blockedByOwn?: unknown; readonly attackedBy: readonly unknown[] }[]; readonly accessingHeavyPieces: readonly { readonly square: SquareName; readonly piece: SchemaPiece; readonly fileTarget: SquareName }[] }[] };
    return backRankOverlay.components(evidence, { kings: reading.susceptible.map((entry) => ({ color: entry.color, king: entry.kingSquare, blockedEscapes: entry.escapes.filter((escape) => escape.blockedByOwn !== undefined).map((escape) => escape.square), attackedEscapes: entry.escapes.filter((escape) => escape.blockedByOwn === undefined && escape.attackedBy.length > 0).map((escape) => escape.square), heavy: entry.accessingHeavyPieces.map((heavy) => ({ piece: piece(heavy.piece), square: heavy.square, target: heavy.fileTarget })) })) });
  }, relationWithStatement("back_rank_overlay", ["arrows", "lit_squares", "panel", "piece_halo"], ["list"]), backRankOverlay.validateWireComponent, backRankOverlay.validateWireComposition);
  const trappedPieces = bindFactStatement(kit.fact, "play.trapped_pieces@1", "declared_convention", "threat-convention@1");
  const trappedOverlay = bindRelationFactStatement<"play.trapped_pieces@1">(kit, trappedPieces,
    { answerDistance: "threat", relation: "attacks", sign: "state", convention: "threat-convention@1" }, value => ({
      nodes: value.pieces.flatMap(entry => [{ square: entry.square, ...entry.piece, emphasis: "target" as const },
        ...entry.attackers.map(square => ({ square, emphasis: "source" as const }))]),
      endpoints: value.pieces.flatMap(entry => entry.attackers.map(from => ({ from, to: entry.square }))),
    }));
  add("threat_radar", V1("rules.tactic.reading.trapped_piece"), "relation_overlay", ["arrows", "list", "lit_squares", "panel", "piece_halo"], ["pieces"], ["mechanical_transform", "retained_convention"], (evidence) => {
    const reading = evidence.payload as { readonly kind: "pieces" | "abstained"; readonly pieces: readonly { readonly piece: Occupant; readonly attackers: readonly { readonly moveUci: string }[]; readonly moves: readonly unknown[] }[] };
    return trappedOverlay.components(evidence, { pieces: reading.pieces.map((entry) => ({ piece: piece(entry.piece.occupant), square: entry.piece.square, attackers: entry.attackers.map((attacker) => fromSquare(attacker.moveUci)), moves: entry.moves.length })) });
  }, relationWithStatement("trapped_piece_overlay", ["arrows", "lit_squares", "panel", "piece_halo"], ["list"]), trappedOverlay.validateWireComponent, trappedOverlay.validateWireComposition);
  const raysCaption = bindSquareFactStatement(kit, "play.rays@1", "declared_convention", "threat-convention@1",
    value => value.rays.flatMap(ray => [ray.sliderSquare, ray.blockerSquare, ray.targetSquare]), "red");
  add("threat_radar", V1("rules.tactic.reading.ray_classification"), "square_set", SQUARE_FORMS, ["rays"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly rays: readonly { readonly slider: PieceAt; readonly blocker: Occupant; readonly target: Occupant; readonly kind: "absolute_pin" | "relative_pin" | "skewer" | "xray_attack" | "xray_defense" }[] };
    const rays = reading.rays.map((ray) => ({ kind: ray.kind, slider: piece(ray.slider.piece), sliderSquare: ray.slider.square, blocker: piece(ray.blocker.occupant), blockerSquare: ray.blocker.square, target: piece(ray.target.occupant), targetSquare: ray.target.square }));
    return raysCaption.square(evidence, { rays });
  }, undefined, raysCaption.validateWireComponent);
  const defenderExposure = bindFactStatement(kit.fact, "play.defender_exposure@1", "declared_convention", "piece-geometry@1");
  const defenderOverlay = bindRelationFactStatement<"play.defender_exposure@1">(kit, defenderExposure,
    { answerDistance: "fact", relation: "defends", sign: "lost" }, value => ({
      nodes: [{ square: value.defenderSquare, ...value.defender, emphasis: "source" as const },
        { square: value.targetSquare, ...value.target, emphasis: "target" as const }],
      endpoints: [{ from: value.defenderSquare, to: value.targetSquare }],
    }));
  add("threat_radar", V1("derived.tactic.defender_exposure", 2), "relation_overlay", ["arrows", "list", "lit_squares", "panel"], ["defender", "target"], ["mechanical_transform"], (evidence) => {
    const exposure = evidence.payload as { readonly kind: "available" | "unavailable"; readonly defender?: PieceAt; readonly target?: PieceAt };
    if (exposure.kind !== "available" || exposure.defender === undefined || exposure.target === undefined) throw new TypeError("an unavailable defender exposure is an abstention, never a relation");
    return defenderOverlay.components(evidence, { defender: piece(exposure.defender.piece), defenderSquare: exposure.defender.square, target: piece(exposure.target.piece), targetSquare: exposure.target.square });
  }, relationWithStatement("defender_exposure_overlay", ["arrows", "lit_squares", "panel"], ["list"]), defenderOverlay.validateWireComponent, defenderOverlay.validateWireComposition);

  // --- structure_nudge: what kind of position this is (module-registration §4.6)
  add("structure_nudge", V1("rules.structural.reading.named_structure", 2), "fact_statement", ["list", "panel"], ["id", "name", "squares"], ["copied_byte_equal"], (evidence) => namedStructure.statement(namedStructureOperands(evidence)), undefined, namedStructure.validateWireComponent);
  const space = bindFactStatement(kit.fact, "play.space@1", "declared_convention", "pawn-structure@1");
  add("structure_nudge", V1("rules.structural.reading.space"), "fact_statement", ["list", "panel"], ["colors", "differentials"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly colors: readonly { readonly color: Color; readonly total: number }[]; readonly differentials: readonly { readonly zone: "queenside" | "central" | "kingside"; readonly white: number; readonly black: number }[] };
    return space.statement({ totals: reading.colors.map((entry) => ({ color: entry.color, total: entry.total })), zones: reading.differentials.map((zone) => ({ zone: zone.zone, white: zone.white, black: zone.black })) });
  }, undefined, space.validateWireComponent);
  const pawnConnectivity = bindFactStatement(kit.fact, "play.pawn_connectivity@1", "declared_convention", "board-rules@1");
  add("structure_nudge", V1("rules.structural.reading.pawn_connectivity"), "fact_statement", ["list", "panel"], ["colors"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly colors: readonly { readonly color: Color; readonly islandCount: number; readonly connectedPawnPairs: readonly unknown[]; readonly chains: readonly unknown[] }[] };
    return pawnConnectivity.statement({ colors: reading.colors.map((entry) => ({ color: entry.color, islands: entry.islandCount, connectedPairs: entry.connectedPawnPairs.length, chains: entry.chains.length })) });
  }, undefined, pawnConnectivity.validateWireComponent);
  const phase = bindFactStatement(kit.fact, "play.phase@1", "declared_convention", "phase-bands@1");
  add("structure_nudge", V1("rules.phase.reading", 2), "fact_statement", ["panel"], ["phase", "decision"], ["copied_byte_equal"], (evidence) =>
    phase.statement({ phase: (evidence.payload as { readonly phase: "opening" | "middlegame" | "endgame" | "unclear" }).phase }), undefined, phase.validateWireComponent);
  const endgame = bindFactStatement(kit.fact, "play.endgame_type@1", "declared_convention", "endgame-convention@1");
  add("structure_nudge", V1("rules.endgame.classification"), "fact_statement", ["panel"], ["type"], ["copied_byte_equal"], (evidence) =>
    endgame.statement({ label: (evidence.payload as { readonly type: { readonly label: string } | null }).type?.label ?? null }), undefined, endgame.validateWireComponent);
  const setup = bindFactStatement(kit.fact, "play.endgame_setup@1", "declared_convention", "endgame-convention@1");
  const setupName = (technique: string): string => SETUP_NAMES[technique] ?? "registered endgame";
  add("structure_nudge", V1("theory.endgame.setup_match"), "fact_statement", ["panel"], ["technique", "convention"], ["copied_byte_equal"], (evidence) => {
    const match = evidence.payload as { readonly technique: string; readonly convention: { readonly id: string } };
    return setup.statement({ technique: match.technique, name: setupName(match.technique) });
  }, undefined, component => {
    setup.validateWireComponent(component);
    if (component.id === "fact_statement" && component.operand.rendererId === "play.endgame_setup@1"
      && component.operand.operands.name !== setupName(component.operand.operands.technique)) throw new TypeError("Setup name disagrees with its registered technique");
  });
  const shape = bindFactStatement(kit.fact, "inspector.registered_shape_firing@2", "declared_convention", "shape-catalogue@1");
  add("structure_nudge", V1("theory.shapes.firing", 3), "fact_statement", ["panel", "timeline_marker"],
    ["entryId", "firstNodeId", "lastNodeId", "openEnded", "authority"], ["copied_byte_equal", "retained_convention"],
    evidence => shape.statement(registeredShapeFiringOperands(evidence)), undefined, assertRegisteredShapeFiringWire);

  // --- theory_breadcrumb: cited or authored theory for this position (module-registration §4.7)
  const explorer = bindFactStatement(kit.fact, "play.explorer_summary@1", "declared_convention", "explorer-population@1");
  add("theory_breadcrumb", V1("derived.explorer.population_summary"), "fact_statement", ["list", "panel", "sentence"], ["position", "totals", "opening", "disclosure"], ["copied_byte_equal", "mechanical_transform"], (evidence) => {
    const summary = explorerPopulationSummaryWire(evidence as DeclaredEvidence<ExplorerPopulationSummary>);
    return explorer.statement({ total: summary.totals.total, white: summary.totals.white, draws: summary.totals.draws, black: summary.totals.black, ratings: summary.position.population.ratingBuckets, speeds: summary.position.population.speeds, since: summary.position.population.since, until: summary.position.population.until, opening: summary.opening.kind === "reported" ? `${summary.opening.eco} ${summary.opening.name}` : null, disclosure: summary.disclosure.statement });
  }, undefined, explorer.validateWireComponent);
  add("theory_breadcrumb", V1("theory.shapes.firing", 3), "fact_statement", ["panel", "sentence"],
    ["entryId", "firstNodeId", "lastNodeId", "openEnded", "authority"], ["copied_byte_equal", "retained_convention"],
    evidence => shape.statement(registeredShapeFiringOperands(evidence)), undefined, assertRegisteredShapeFiringWire);
  const opening = bindFactStatement(kit.fact, "play.opening@1", "declared_convention", "opening-catalogue@1");
  add("theory_breadcrumb", V1("theory.opening.current_endpoint"), "fact_statement", ["list", "panel", "sentence"], ["eco", "name"], ["copied_byte_equal"], (evidence) => {
    const endpoint = evidence.payload as { readonly eco: string; readonly name: string };
    return opening.statement({ eco: endpoint.eco, name: endpoint.name });
  }, undefined, opening.validateWireComponent);
  const authoredClaim = bindFactStatement(kit.fact, "play.authored_claim@1", "declared_convention", "authored-claim@1");
  add("theory_breadcrumb", V1("pack.authored.claim"), "fact_statement", ["panel", "sentence"], ["text"], ["authored_text_copied"], (evidence) =>
    authoredClaim.statement({ text: (evidence.payload as { readonly text: string }).text }), undefined, authoredClaim.validateWireComponent);

  // --- compare_coach: the smallest recorded difference between two attempts (§4.9)
  const enginePoint = bindFactStatement(kit.fact, "compare.engine_point@2", "declared_convention", "recorded-comparison@1");
  add("compare_coach", V1("derived.compare.engine_trajectory", 2), "fact_statement", ["list", "panel"], ["nodeId", "plyOffset", "whiteScore", "engineId", "instrument", "bound"], ["copied_byte_equal", "retained_convention"], evidence =>
    enginePoint.statement(evidence.payload as RecordedComparisonEnginePoint), undefined, enginePoint.validateWireComponent);
  const evalDelta = bindFactStatement(kit.fact, "compare.recorded_delta@2", "recorded_run", "recorded-comparison@1");
  add("compare_coach", V1("derived.compare.eval_delta", 2), "fact_statement", ["list", "panel", "sentence"], ["before", "after", "delta", "plyOffset", "frame", "comparability"], ["copied_byte_equal"], evidence =>
    evalDelta.statement(evidence.payload as RecordedCompareEvalDelta), undefined, evalDelta.validateWireComponent);
  const comparedStructure = bindFactStatement(kit.fact, "play.compare_structure@1", "declared_convention", "pawn-structure@1");
  add("compare_coach", V1("derived.compare.structure_delta", 2), "fact_statement", ["list", "panel", "sentence"], ["observation", "namedStructure"], ["copied_byte_equal"], (evidence) => {
    const named = (evidence.payload as { readonly namedStructure: { readonly id: StructureName; readonly name: string } | null }).namedStructure;
    const observation = (evidence.payload as { readonly observation: { readonly kind: StructuralKind } & Readonly<Record<string, unknown>> }).observation;
    if (named !== null) return namedStructure.statement(namedStructureSchema({ ...named, squares: observation.squares }, "Compared named structure"));
    const { detail: _detail, provenanceNote: _note, ...rest } = observation as Readonly<Record<string, unknown>>;
    return comparedStructure.statement({ observation: observationSchema(rest, "Compared structure") });
  }, undefined, component => {
    if (component.id !== "fact_statement") return;
    // This existing source has two declared rendering arms, not an arbitrary renderer choice.
    if (component.operand.rendererId === "play.named_structure@1") namedStructure.assertOperand(component.operand);
    else comparedStructure.assertOperand(component.operand);
  });
  const pieceRoute = bindFactStatement(kit.fact, "play.compare_route@1", "recorded_run", "recorded-comparison@1");
  add("compare_coach", V1("derived.compare.piece_route", 2), "fact_statement", ["list", "panel"], ["pieceId", "squares"], ["copied_byte_equal"], (evidence) => {
    const route = evidence.payload as { readonly pieceId: string; readonly squares: readonly SquareName[] };
    return pieceRoute.statement({ piece: route.pieceId.replace(/^(White|Black) /u, (match) => match.toLowerCase()), squares: [...route.squares] });
  }, undefined, pieceRoute.validateWireComponent);
  const recordedFork = bindFactStatement(kit.fact, "play.recorded_fork@1", "recorded_run", "recorded-run@1");
  add("compare_coach", V1("run.record.fork"), "fact_statement", ["list", "panel", "sentence"], ["sharedPly"], ["copied_byte_equal"], (evidence) =>
    recordedFork.statement({ sharedPly: (evidence.payload as { readonly sharedPly: number }).sharedPly }), undefined, recordedFork.validateWireComponent);
  const checkpoint = bindFactStatement(kit.fact, "play.checkpoint_hit@1", "recorded_run", "recorded-run@1");
  add("compare_coach", V1("run.record.checkpoint_hit"), "fact_statement", ["panel", "sentence"], ["plyOffset"], ["copied_byte_equal"], (evidence) =>
    checkpoint.statement({ plyOffset: (evidence.payload as { readonly plyOffset: number }).plyOffset }), undefined, checkpoint.validateWireComponent);
  const objective = bindFactStatement(kit.fact, "play.objective_transition@1", "recorded_run", "recorded-run@1");
  add("compare_coach", V1("run.record.objective_transition"), "fact_statement", ["panel", "sentence"], ["from", "to"], ["copied_byte_equal"], (evidence) => {
    const transition = evidence.payload as { readonly from: ObjectiveState; readonly to: ObjectiveState };
    return objective.statement({ from: transition.from, to: transition.to });
  }, undefined, objective.validateWireComponent);
  const consequence = bindFactStatement(kit.fact, "story.consequence@1", "recorded_run", "recorded-run@1");
  add("compare_coach", V1("run.record.consequence"), "fact_statement", ["panel", "sentence"], ["terminal", "outcome", "plies", "objectiveState"], ["copied_byte_equal"], (evidence) => {
    const value = evidence.payload as { readonly terminal: boolean; readonly outcome?: "win" | "loss" | "draw"; readonly plies?: number; readonly objectiveState?: ObjectiveState };
    return consequence.statement(value.terminal ? { terminal: true, outcome: value.outcome! } : { terminal: false, plies: value.plies!, objectiveState: value.objectiveState! });
  }, undefined, consequence.validateWireComponent);

  // --- guided_hint: one adapter per family x rung disclosure (rfc/hint-distance.md §3, §4). The
  // learner surface is the Guided Hint seat's closed delivery receipt; this adapter is the same
  // canonical sentence for any consumer that presents the admitted disclosure.
  const hintSources = (rung: HintRung): readonly string[] => ["rung", "family", "attribution", ...(rung === "pattern" ? [] : ["targetSquares"]), ...(["piece", "distance", "move"].includes(rung) ? ["actor"] : []), ...(["distance", "move"].includes(rung) ? ["relation", "occurrencePly"] : []), ...(rung === "move" ? ["firstMove"] : [])];
  for (const family of HINT_FAMILIES) {
    const projection = (rung: HintRung) => hintDeclarationRow(family).disclosures[rung];
    const hintContract = (rung: HintRung) => {
      const bound = bindSquareFactStatement(kit, "play.guided_hint@1", "declared_convention", "guided-hint@1", value => {
        if (value.squares === undefined || value.rung !== "square" && value.rung !== "piece" && value.rung !== "distance") throw new TypeError("Expected square-disclosing hint rung");
        if (value.rung === "square") return value.squares;
        if (value.piece === undefined) throw new TypeError("Expected disclosed actor");
        return [value.piece.square, ...value.squares];
      }, "yellow");
      const payloadOf = (evidence: DeclaredEvidence<unknown>): HintDisclosurePayload => {
        const payload = evidence.payload as HintDisclosurePayload;
        if (payload.family !== family || payload.rung !== rung) throw new TypeError("Hint crosses its declared family or rung");
        return payload;
      };
      const operandsOf = (evidence: DeclaredEvidence<unknown>) => hintSchema(hintOperands(payloadOf(evidence)), "Guided Hint");
      const validateWireComponent: NonNullable<AdapterSpec["validateWireComponent"]> = (component, evidence) => {
        bound.validateWireComponent(component, evidence);
        const text = component.id === "fact_statement" ? component.operand : component.id === "square_set" ? component.operand.caption : undefined;
        if (text?.rendererId === "play.guided_hint@1" && (text.operands.family !== family || text.operands.rung !== rung)) throw new TypeError("Hint crosses its declared family or rung");
      };
      return { bound, operandsOf, payloadOf, operand: (evidence: DeclaredEvidence<unknown>) => bound.operand(operandsOf(evidence)),
        statement: (evidence: DeclaredEvidence<unknown>) => bound.statement(operandsOf(evidence)),
        square: (evidence: DeclaredEvidence<unknown>) => bound.square(evidence, operandsOf(evidence)), validateWireComponent };
    };
    const pattern = hintContract("pattern");
    // pattern: the family sentence alone (no board coordinate).
    add("guided_hint", projection("pattern"), "fact_statement", ["sentence"], hintSources("pattern"), ["copied_byte_equal"], pattern.statement, undefined, pattern.validateWireComponent);
    // square / piece / distance: the disclosed squares (plus the actor's halo), captioned by the sentence.
    for (const rung of ["square", "piece", "distance"] as const) {
      const hint = hintContract(rung);
      const squareForms: readonly EvidenceForm[] = rung === "square" ? ["lit_squares"] : ["lit_squares", "piece_halo"];
      add("guided_hint", projection(rung), "square_set", [...squareForms, "sentence"], hintSources(rung), ["copied_byte_equal", "mechanical_transform"], (evidence) => {
        return [hint.square(evidence), hint.statement(evidence)];
      }, { id: `guided_hint_${rung}_marks`, members: [{ component: "square_set", forms: squareForms }, { component: "fact_statement", forms: ["sentence"] }] }, hint.validateWireComponent);
    }
    const moveHint = hintContract("move");
    const moveOverlay = bindRelationFactStatement<"play.guided_hint@1">(kit, moveHint.bound,
      { answerDistance: "move", relation: "moves_to", sign: "state" }, value => {
      if (value.rung !== "move" || value.piece === undefined || value.squares === undefined || value.uci === undefined) {
        throw new PresentationSchemaError("Move relation requires its exact disclosed actor, targets and UCI");
      }
      const from = fromSquare(value.uci), to = toSquare(value.uci);
      const nodes = [
        { square: value.piece.square, role: value.piece.role, color: value.piece.color, emphasis: "source" as const },
        ...(from === value.piece.square ? [] : [{ square: from, emphasis: "context" as const }]),
        { square: to, emphasis: "context" as const },
        ...value.squares.map(square => ({ square, emphasis: "target" as const })),
      ];
      return { nodes, endpoints: [{ from, to }] };
    }, moveHint.validateWireComponent);
    // move: the actor, targets and exact retained first-move arrow, captioned by the sentence.
    add("guided_hint", projection("move"), "relation_overlay", ["arrows", "lit_squares", "piece_halo", "sentence"], hintSources("move"), ["copied_byte_equal", "mechanical_transform"], evidence =>
      moveOverlay.components(evidence, moveHint.operandsOf(evidence)),
    relationWithStatement(`guided_hint_move_overlay`, ["arrows", "lit_squares", "piece_halo"], ["sentence"]), moveOverlay.validateWireComponent, moveOverlay.validateWireComposition);
  }

  return Object.freeze(specs);
}

/** The registered endgame-setup technique names (endgame-setup.ts conventions). */
const SETUP_NAMES: Readonly<Record<string, string>> = Object.freeze({ lucena: "Lucena position", philidor: "Philidor position", vancura: "Vančura position" });
