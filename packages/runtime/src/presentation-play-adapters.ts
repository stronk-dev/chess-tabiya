// rfc/evidence-presentation.md Checkpoint B / rfc/module-registration.md A5 — the play-seat
// modules' exact pair-keyed presentation adapters and their registered fact renderers:
// `module.sight_on_request@1`, `module.threat_radar@1`, `module.blunder_prevention@1`,
// `module.structure_nudge@1`, `module.theory_breadcrumb@1` and `module.compare_coach@1`.
//
// Every renderer is a fixed template over the parsed, retained operands (§3.10a). Sentences use
// learner vocabulary only (play-composition §5.1): chess notation, registered labels and the
// declared convention's label — never an id, enum, detector name or evaluation of a move. A
// component never selects: every adapter renders exactly the one admitted evidence item it is given.
//
// This file imports only types from `presentation-contract.ts`; the registry injects its kit.

import type { Color, Role, SquareName } from "chessops/types";

import type { DeclaredEvidence, EvidenceForm, VersionedEvidenceId } from "./evidence-contract.js";
import type { AdapterSpec, ComponentValue, ConventionReceipt, PresentationKit, RelationOverlayOperand } from "./presentation-contract.js";
import { factRenderer, listPhrase, otherSide, pieceOn, pieceSchema, plural, s, side, type SchemaPiece } from "./presentation-schema.js";
import { hintSentence, type HintDisclosurePayload } from "./hint-horizon.js";
import { HINT_FAMILIES, HINT_RELATIONS, HINT_RUNGS, hintDisclosureProjectionId, type HintFamily, type HintRelation, type HintRung } from "./hint-registry.js";

/**
 * rfc/hint-distance.md §3/§4: the Guided Hint disclosure operands. The adapter retains exactly the
 * packet's own bytes (a lower rung carries no higher field) and renders the one canonical sentence.
 */
const hintSchema = s.obj(
  { rung: s.lit(...HINT_RUNGS), family: s.lit(...HINT_FAMILIES), engine: s.str, bound: s.str },
  { squares: s.arr(s.square, { min: 1 }), piece: s.obj({ color: s.color, role: s.role, square: s.square }), relation: s.lit(...HINT_RELATIONS), ply: s.nat, san: s.san },
);
function hintOperands(payload: HintDisclosurePayload): Readonly<Record<string, unknown>> {
  return {
    rung: payload.rung, family: payload.family, engine: payload.attribution.engine, bound: payload.attribution.bound,
    ...(payload.rung === "pattern" ? {} : { squares: [...payload.targetSquares] }),
    ...(payload.rung === "piece" || payload.rung === "distance" || payload.rung === "move" ? { piece: { color: payload.actor.color, role: payload.actor.role, square: payload.actor.square } } : {}),
    ...(payload.rung === "distance" || payload.rung === "move" ? { relation: payload.relation, ply: payload.occurrencePly } : {}),
    ...(payload.rung === "move" ? { san: payload.firstMove.san } : {}),
  };
}
function hintPayloadOf(value: ReturnType<typeof hintSchema>): HintDisclosurePayload {
  const need = <T>(field: T | undefined, label: string): T => { if (field === undefined) throw new TypeError(`hint operands omit ${label} at rung ${value.rung}`); return field; };
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
  return { rung, ...base, targetSquares, actor, relation, occurrencePly, firstMove: { uci: "", san: need(value.san, "san") } };
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

const wings = (rights: { readonly kingside: boolean; readonly queenside: boolean }): string =>
  rights.kingside && rights.queenside ? "kingside and queenside" : rights.kingside ? "kingside only" : rights.queenside ? "queenside only" : "no castling rights";
const WING = s.lit("kingside", "queenside");

const threatSchema = s.obj({ threats: s.arr(s.obj({ piece: pieceSchema, from: s.square, mate: s.bool }, { target: pieceSchema, to: s.square }), { min: 1 }) });
const mateSchema = s.obj({ mates: s.arr(s.obj({ piece: pieceSchema, from: s.square, to: s.square, king: s.square }), { min: 1 }) });
const looseSchema = s.obj({ pieces: s.arr(s.obj({ piece: pieceSchema, square: s.square, enPrise: s.bool, loose: s.bool, underDefended: s.bool, capturers: s.arr(s.square), defenders: s.nat }), { min: 1 }) });
const rayKinds = s.lit("absolute_pin", "relative_pin", "skewer", "xray_attack", "xray_defense");
const raySchema = s.obj({ rays: s.arr(s.obj({ kind: rayKinds, slider: pieceSchema, sliderSquare: s.square, blocker: pieceSchema, blockerSquare: s.square, target: pieceSchema, targetSquare: s.square }), { min: 1 }) });
const RAY_VERBS: Readonly<Record<ReturnType<typeof rayKinds>, string>> = Object.freeze({
  absolute_pin: "pins", relative_pin: "pins", skewer: "skewers", xray_attack: "x-rays through", xray_defense: "defends through",
});

export const PLAY_FACT_RENDERERS = Object.freeze({
  "play.structural_observation@1": factRenderer(observationSchema, observationSentence),
  "play.named_structure@1": factRenderer(namedStructureSchema, (value) => {
    if (STRUCTURE_NAMES[value.id] !== value.name) throw new TypeError("named structure name disagrees with the registered catalogue name");
    return `The pawn structure matches the ${value.name} in the declared structure catalogue (pawns on ${listPhrase(value.squares)}).`;
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
  "play.legal_moves@1": factRenderer(s.obj({ turn: s.color, pieces: s.nat, moves: s.nat }), (value) =>
    `${side(value.turn)} has ${plural(value.moves, "legal move")} spread over ${plural(value.pieces, "piece")}.`),
  "play.pawn_contacts@1": factRenderer(s.obj({ contacts: s.nat, locks: s.nat, passed: s.nat, connectedPassedPairs: s.nat }), (value) =>
    `Pawn contacts: ${plural(value.contacts, "attacking contact")}, ${plural(value.locks, "locked pair")}, ${plural(value.passed, "passed pawn")} and ${plural(value.connectedPassedPairs, "connected passed pair")}.`),
  "play.square_control@1": factRenderer(s.obj({ colors: s.arr(s.obj({ color: s.color, pseudo: s.nat, legal: s.nullable(s.nat) }), { min: 1 }) }), (value) =>
    `Square control: ${value.colors.map((entry) => `${side(entry.color)} attacks ${plural(entry.pseudo, "square")}${entry.legal === null ? "" : ` (${entry.legal} with legal moves)`}`).join("; ")}.`),
  "play.threats@1": factRenderer(threatSchema, (value) => {
    const mover = value.threats[0]!.piece.color;
    const phrases = value.threats.map((threat) => threat.mate
      ? `${pieceOn(threat.piece, threat.from)} could deliver mate${threat.to === undefined ? "" : ` on ${threat.to}`}`
      : threat.target !== undefined && threat.to !== undefined
        ? `${pieceOn(threat.piece, threat.from)} could capture ${pieceOn(threat.target, threat.to)}`
        : `${pieceOn(threat.piece, threat.from)} has a threat${threat.to === undefined ? "" : ` on ${threat.to}`}`);
    return `If it were ${side(mover)}'s move (declared one-move threat convention): ${listPhrase(phrases)}.`;
  }),
  "play.mate_in_one@1": factRenderer(mateSchema, (value) =>
    `${listPhrase(value.mates.map((mate) => `${pieceOn(mate.piece, mate.from)} can deliver mate on ${mate.to}`))} (the king on ${value.mates[0]!.king} has no escape).`),
  "play.loose_pieces@1": factRenderer(looseSchema, (value) => value.pieces.map((entry) => {
    const state = entry.enPrise ? "can be captured at a material loss" : entry.loose ? "has no defender" : "has fewer defenders than attackers";
    return `${pieceOn(entry.piece, entry.square)} ${state}${entry.capturers.length === 0 ? "" : ` (attacked from ${listPhrase(entry.capturers)})`}.`;
  }).join(" ")),
  "play.back_rank@1": factRenderer(s.obj({ kings: s.arr(s.obj({ color: s.color, king: s.square, blockedEscapes: s.arr(s.square), attackedEscapes: s.arr(s.square), heavy: s.arr(s.obj({ piece: pieceSchema, square: s.square, target: s.square })) }), { min: 1 }) }), (value) =>
    value.kings.map((king) => `${side(king.color)}'s king on ${king.king} has no free escape off the back rank${king.blockedEscapes.length === 0 ? "" : ` (${listPhrase(king.blockedEscapes)} blocked by its own pieces)`}${king.attackedEscapes.length === 0 ? "" : `${king.blockedEscapes.length === 0 ? " (" : "; "}${listPhrase(king.attackedEscapes)} attacked${king.blockedEscapes.length === 0 ? ")" : ""}`}${king.blockedEscapes.length > 0 && king.attackedEscapes.length > 0 ? ")" : ""}${king.heavy.length === 0 ? "" : `, and ${listPhrase(king.heavy.map((piece) => `${pieceOn(piece.piece, piece.square)} can reach ${piece.target}`))}`}.`).join(" ")),
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
    value.phase === "unclear" ? "The declared game-phase convention does not classify this position." : `Game phase under the declared convention: ${value.phase}.`),
  "play.endgame_type@1": factRenderer(s.obj({ label: s.nullable(s.str) }), (value) =>
    value.label === null ? "Endgame; the material is outside the declared endgame convention." : `${value.label} under the declared endgame convention.`),
  "play.endgame_setup@1": factRenderer(s.obj({ technique: s.str, name: s.str }), (value) =>
    `The pieces match the ${value.name} setup in the cited endgame convention (geometry only; not an outcome or advice).`),
  "play.shape@1": factRenderer(s.obj({ title: s.str }), (value) => `Recognized position pattern: ${value.title}. Named plans for this structure are general to the kind of position, not advice for this one.`),
  "play.opening@1": factRenderer(s.obj({ eco: s.str, name: s.str }), (value) => `Opening in the cited catalogue: ${value.eco} ${value.name}.`),
  "play.authored_claim@1": factRenderer(s.obj({ text: s.str }), (value) => `The pack author wrote: “${value.text}”`),
  "play.compare_structure@1": factRenderer(s.obj({ observation: observationSchema }), (value) => `On this attempt after the fork: ${observationSentence(value.observation)}`),
  "play.compare_route@1": factRenderer(s.obj({ piece: s.str, squares: s.arr(s.square, { min: 2 }) }), (value) => `On this attempt the ${value.piece} travelled ${value.squares.join(" → ")}.`),
  "play.recorded_fork@1": factRenderer(s.obj({ sharedPly: s.nat }), (value) => `The attempts share the first ${plural(value.sharedPly, "ply", "plies")} and part at this fork.`),
  "play.checkpoint_hit@1": factRenderer(s.obj({ plyOffset: s.nat }), (value) => `This attempt reached a checkpoint ${plural(value.plyOffset, "ply", "plies")} after the fork.`),
  "play.guided_hint@1": factRenderer(hintSchema, (value) => hintSentence(hintPayloadOf(value))),
  "play.objective_transition@1": factRenderer(s.obj({ from: s.lit("active", "preserved", "degraded", "failed", "achieved", "transitioned"), to: s.lit("active", "preserved", "degraded", "failed", "achieved", "transitioned") }), (value) =>
    `On this attempt the objective went from ${OBJECTIVE_WORDS[value.from]} to ${OBJECTIVE_WORDS[value.to]}.`),
});

const OBJECTIVE_WORDS = Object.freeze({ active: "in progress", preserved: "preserved", degraded: "degraded", failed: "failed", achieved: "achieved", transitioned: "transitioned" } as const);

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
const MODULE = (id: string): VersionedEvidenceId => V1(`module.${id}`);

type Construct = (evidence: DeclaredEvidence<unknown>) => ComponentValue | readonly ComponentValue[];

export function playAdapterSpecs(kit: PresentationKit): readonly AdapterSpec[] {
  const fact = (rendererId: Parameters<PresentationKit["fact"]>[0], convention: Parameters<PresentationKit["fact"]>[2], operands: unknown, binding: "recorded_run" | "declared_convention" = "declared_convention") =>
    kit.fact(rendererId, binding, convention, operands as never);
  const statement = (rendererId: Parameters<PresentationKit["fact"]>[0], convention: Parameters<PresentationKit["fact"]>[2], operands: unknown, binding: "recorded_run" | "declared_convention" = "declared_convention"): ComponentValue =>
    ({ id: "fact_statement", operand: fact(rendererId, convention, operands, binding) });
  const relation = (evidence: DeclaredEvidence<unknown>, nodes: RelationOverlayOperand["nodes"], edges: RelationOverlayOperand["edges"], answerDistance: RelationOverlayOperand["answerDistance"], convention?: ConventionReceipt): ComponentValue => {
    const unique = new Map<string, RelationOverlayOperand["nodes"][number]>();
    for (const node of nodes) if (!unique.has(node.square)) unique.set(node.square, node);
    const edgeKeys = new Set<string>();
    const kept = edges.filter((edge) => { const key = `${edge.from}${edge.to}${edge.relation}${edge.sign}`; if (edgeKeys.has(key)) return false; edgeKeys.add(key); return true; });
    return { id: "relation_overlay", operand: { nodes: [...unique.values()], edges: kept, owner: { factRef: kit.factRef(evidence) }, answerDistance, ...(convention === undefined ? {} : { convention }) } };
  };
  const specs: AdapterSpec[] = [];
  const add = (module: string, projection: VersionedEvidenceId, component: AdapterSpec["component"], forms: readonly EvidenceForm[], sourceOperands: readonly string[], assertions: AdapterSpec["assertions"], construct: Construct, composition?: AdapterSpec["composition"]) =>
    specs.push({ consumer: MODULE(module), projection, component, forms, sourceOperands, assertions, construct, ...(composition === undefined ? {} : { composition }) });
  const SQUARE_FORMS: readonly EvidenceForm[] = ["list", "lit_squares", "panel", "piece_halo"];

  // --- sight_on_request: the shipped sight renderer, one fact per gesture (module-registration §4.2)
  for (const kind of STRUCTURAL_KINDS) {
    add("sight_on_request", V1(`rules.structural.reading.${kind}`), "square_set", SQUARE_FORMS, ["kind", "squares"], ["copied_byte_equal", "mechanical_transform"], (evidence) => {
      const observation = evidence.payload as { readonly kind: StructuralKind; readonly squares: readonly SquareName[]; readonly color?: Color; readonly role?: Role; readonly file?: string; readonly count?: number; readonly shade?: "light" | "dark"; readonly form?: "direct" | "distant"; readonly zone?: "edge" | "corner"; readonly detail?: { readonly pushAttackers: readonly { readonly pushes: number }[]; readonly captureAttackers: readonly { readonly captures: number }[] } };
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
      return kit.squareSet(evidence, observation.squares, "blue", fact("play.structural_observation@1", kind === "backward_pawn" || kind === "outpost" ? "pawn-structure@1" : "board-rules@1", operands));
    });
  }
  const namedStructureCaption = (evidence: DeclaredEvidence<unknown>) => {
    const match = evidence.payload as { readonly id: StructureName; readonly name: string; readonly squares: readonly SquareName[] };
    return fact("play.named_structure@1", "structure-catalogue@1", { id: match.id, name: match.name, squares: [...match.squares] });
  };
  add("sight_on_request", V1("rules.structural.reading.named_structure", 2), "square_set", ["list", "lit_squares", "panel", "piece_halo", "sentence"], ["id", "name", "squares"], ["copied_byte_equal"], (evidence) => {
    const caption = namedStructureCaption(evidence);
    const match = evidence.payload as { readonly squares: readonly SquareName[] };
    return [kit.squareSet(evidence, match.squares, "blue", caption), { id: "fact_statement", operand: caption }];
  }, { id: "named_structure_board", members: [{ component: "square_set", forms: SQUARE_FORMS }, { component: "fact_statement", forms: ["sentence"] }] });
  add("sight_on_request", V1("rules.castling.reading.rights"), "fact_statement", ["list", "panel"], ["white", "black"], ["copied_byte_equal"], (evidence) => {
    const rights = evidence.payload as { readonly white: { readonly kingside: boolean; readonly queenside: boolean }; readonly black: { readonly kingside: boolean; readonly queenside: boolean } };
    return statement("play.castling_rights@1", "board-rules@1", { white: { ...rights.white }, black: { ...rights.black } });
  });
  add("sight_on_request", V1("rules.castling.reading.legality"), "fact_statement", ["list", "panel"], ["color", "wing", "legalNow", "inCheck", "blockedSquares", "attackedSquares"], ["copied_byte_equal"], (evidence) => {
    const issue = evidence.payload as { readonly color: Color; readonly wing: "kingside" | "queenside"; readonly legalNow: boolean; readonly inCheck: boolean; readonly blockedSquares: readonly SquareName[]; readonly attackedSquares: readonly SquareName[] };
    return statement("play.castling_legality@1", "board-rules@1", { color: issue.color, wing: issue.wing, legalNow: issue.legalNow, inCheck: issue.inCheck, blocked: [...issue.blockedSquares], attacked: [...issue.attackedSquares] });
  });
  add("sight_on_request", V1("rules.tactic.reading.rook_on_seventh"), "square_set", SQUARE_FORMS, ["rooks"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly rooks: readonly { readonly rook: PieceAt; readonly enemyKingOnBackRank: PieceAt | null; readonly enemyPawnsOnSeventh: readonly PieceAt[] }[] };
    const rooks = reading.rooks.map((rook) => ({ color: rook.rook.piece.color, square: rook.rook.square, king: rook.enemyKingOnBackRank?.square ?? null, pawns: rook.enemyPawnsOnSeventh.map((pawn) => pawn.square) }));
    return kit.squareSet(evidence, reading.rooks.flatMap((rook) => [rook.rook.square, ...(rook.enemyKingOnBackRank === null ? [] : [rook.enemyKingOnBackRank.square]), ...rook.enemyPawnsOnSeventh.map((pawn) => pawn.square)]), "blue", fact("play.rook_on_seventh@1", "board-rules@1", { rooks }));
  });
  add("sight_on_request", V1("rules.mobility.reading.legal_moves"), "square_set", SQUARE_FORMS, ["turn", "pieces"], ["mechanical_transform"], (evidence) => {
    const map = evidence.payload as { readonly turn: Color; readonly pieces: readonly { readonly piece: { readonly square: SquareName }; readonly moves: readonly unknown[] }[] };
    const movable = map.pieces.filter((entry) => entry.moves.length > 0);
    return kit.squareSet(evidence, movable.map((entry) => entry.piece.square), "blue", fact("play.legal_moves@1", "board-rules@1", { turn: map.turn, pieces: movable.length, moves: movable.reduce((sum, entry) => sum + entry.moves.length, 0) }));
  });
  const relationWithStatement = (id: string, relationForms: readonly EvidenceForm[], statementForms: readonly EvidenceForm[]): AdapterSpec["composition"] =>
    ({ id, members: [{ component: "relation_overlay", forms: relationForms }, { component: "fact_statement", forms: statementForms }] });
  add("sight_on_request", V1("rules.pawn.reading.contacts"), "relation_overlay", ["arrows", "list", "lit_squares", "panel", "piece_halo"], ["contacts", "locks", "passed", "connectedPassedPairs"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly contacts: readonly { readonly attacker: PieceAt; readonly target: PieceAt }[]; readonly locks: readonly unknown[]; readonly passed: readonly { readonly passed: boolean }[]; readonly connectedPassedPairs: readonly unknown[] };
    const contactNodes = reading.contacts.flatMap((contact) => [{ square: contact.attacker.square, role: contact.attacker.piece.role, color: contact.attacker.piece.color, emphasis: "source" as const }, { square: contact.target.square, role: contact.target.piece.role, color: contact.target.piece.color, emphasis: "target" as const }]);
    const summary = statement("play.pawn_contacts@1", "board-rules@1", { contacts: reading.contacts.length, locks: reading.locks.length, passed: reading.passed.filter((entry) => entry.passed).length, connectedPassedPairs: reading.connectedPassedPairs.length });
    if (contactNodes.length === 0) throw new TypeError("a pawn-contact overlay needs at least one contact; the operation offers only witnessed readings");
    return [relation(evidence, contactNodes, reading.contacts.map((contact) => ({ from: contact.attacker.square, to: contact.target.square, relation: "attacks" as const, sign: "state" as const })), "fact"), summary];
  }, relationWithStatement("pawn_contacts_overlay", ["arrows", "lit_squares", "panel", "piece_halo"], ["list"]));
  add("sight_on_request", V1("rules.square.reading.control"), "relation_overlay", ["arrows", "list", "lit_squares", "panel", "piece_halo"], ["colors"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly colors: readonly { readonly color: Color; readonly pseudo: readonly { readonly target: SquareName; readonly controllers: readonly { readonly square: SquareName; readonly piece: SchemaPiece }[] }[]; readonly legal: { readonly kind: "available" | "unavailable"; readonly squares: readonly unknown[] } }[] };
    const nodes: RelationOverlayOperand["nodes"][number][] = [];
    const edges: RelationOverlayOperand["edges"][number][] = [];
    for (const entry of reading.colors) for (const controlled of entry.pseudo) {
      nodes.push({ square: controlled.target, emphasis: "target" });
      for (const controller of controlled.controllers) {
        nodes.push({ square: controller.square, role: controller.piece.role, color: controller.piece.color, emphasis: "source" });
        edges.push({ from: controller.square, to: controlled.target, relation: "controls", sign: "state" });
      }
    }
    const controllerNodes = nodes.filter((node) => node.emphasis === "source");
    const ordered = [...controllerNodes, ...nodes.filter((node) => node.emphasis !== "source")];
    const summary = statement("play.square_control@1", "piece-geometry@1", { colors: reading.colors.map((entry) => ({ color: entry.color, pseudo: entry.pseudo.length, legal: entry.legal.kind === "available" ? entry.legal.squares.length : null })) });
    return [relation(evidence, ordered, edges.filter((edge) => edge.from !== edge.to), "fact"), summary];
  }, relationWithStatement("square_control_overlay", ["arrows", "lit_squares", "panel", "piece_halo"], ["list"]));

  // --- threat_radar and blunder_prevention: opponent resources, rendered as fact statements
  // (their bindings serve list/panel) or relation overlays where the binding admits arrows.
  const threatConstruct: Construct = (evidence) => {
    const result = evidence.payload as { readonly kind: "threats" | "abstained"; readonly threats: readonly { readonly threateningPiece: PieceAt; readonly target?: PieceAt; readonly threatenedMove: string; readonly mate: boolean }[] };
    return statement("play.threats@1", "threat-convention@1", { threats: result.threats.map((threat) => ({ piece: piece(threat.threateningPiece.piece), from: threat.threateningPiece.square, mate: threat.mate, ...(threat.target === undefined ? {} : { target: piece(threat.target.piece) }), to: toSquare(threat.threatenedMove) })) });
  };
  const mateConstruct: Construct = (evidence) => {
    const reading = evidence.payload as { readonly mates: readonly { readonly moveUci: string; readonly mover: { readonly piece: SchemaPiece; readonly from: SquareName; readonly to: SquareName }; readonly matedKing: { readonly square: SquareName } }[] };
    return statement("play.mate_in_one@1", "board-rules@1", { mates: reading.mates.map((mate) => ({ piece: piece(mate.mover.piece), from: mate.mover.from, to: mate.mover.to, king: mate.matedKing.square })) });
  };
  const looseConstruct: Construct = (evidence) => {
    const reading = evidence.payload as { readonly pieces: readonly { readonly piece: Occupant; readonly legalCapturers: readonly { readonly square: SquareName }[]; readonly defenders: readonly unknown[]; readonly enPrise: boolean; readonly loose: boolean; readonly underDefended: boolean }[] };
    const flagged = reading.pieces.filter((entry) => entry.enPrise); // only a piece capturable at a material gain is a concrete exposure
    return statement("play.loose_pieces@1", "threat-convention@1", { pieces: flagged.map((entry) => ({ piece: piece(entry.piece.occupant), square: entry.piece.square, enPrise: entry.enPrise, loose: entry.loose, underDefended: entry.underDefended, capturers: entry.legalCapturers.map((capturer) => capturer.square), defenders: entry.defenders.length })) });
  };
  for (const module of ["threat_radar", "blunder_prevention"] as const) {
    add(module, V1("rules.tactic.consequence.threat"), "fact_statement", ["list", "panel"], ["threats"], ["mechanical_transform"], threatConstruct);
    add(module, V1("rules.tactic.consequence.mate_in_one"), "fact_statement", ["list", "panel"], ["mates"], ["mechanical_transform"], mateConstruct);
    add(module, V1("rules.tactic.reading.loose_piece"), "fact_statement", ["list", "panel"], ["pieces"], ["mechanical_transform"], looseConstruct);
  }
  add("threat_radar", V1("rules.tactic.reading.back_rank"), "relation_overlay", ["arrows", "list", "lit_squares", "panel", "piece_halo"], ["susceptible"], ["mechanical_transform", "retained_convention"], (evidence) => {
    const reading = evidence.payload as { readonly susceptible: readonly { readonly color: Color; readonly kingSquare: SquareName; readonly escapes: readonly { readonly square: SquareName; readonly blockedByOwn?: unknown; readonly attackedBy: readonly unknown[] }[]; readonly accessingHeavyPieces: readonly { readonly square: SquareName; readonly piece: SchemaPiece; readonly fileTarget: SquareName }[] }[] };
    const nodes = reading.susceptible.flatMap((entry) => [
      { square: entry.kingSquare, role: "king" as const, color: entry.color, emphasis: "target" as const },
      ...entry.accessingHeavyPieces.flatMap((heavy) => [{ square: heavy.square, role: heavy.piece.role, color: heavy.piece.color, emphasis: "source" as const }, { square: heavy.fileTarget, emphasis: "target" as const }]),
    ]);
    const edges = reading.susceptible.flatMap((entry) => entry.accessingHeavyPieces.filter((heavy) => heavy.square !== heavy.fileTarget).map((heavy) => ({ from: heavy.square, to: heavy.fileTarget, relation: "moves_to" as const, sign: "state" as const })));
    const summary = statement("play.back_rank@1", "threat-convention@1", { kings: reading.susceptible.map((entry) => ({ color: entry.color, king: entry.kingSquare, blockedEscapes: entry.escapes.filter((escape) => escape.blockedByOwn !== undefined).map((escape) => escape.square), attackedEscapes: entry.escapes.filter((escape) => escape.blockedByOwn === undefined && escape.attackedBy.length > 0).map((escape) => escape.square), heavy: entry.accessingHeavyPieces.map((heavy) => ({ piece: piece(heavy.piece), square: heavy.square, target: heavy.fileTarget })) })) });
    if (edges.length === 0) throw new TypeError("a back-rank overlay needs an accessing heavy piece; the operation offers only witnessed readings");
    return [relation(evidence, nodes, edges, "threat", kit.declared(evidence, "threat-convention@1")), summary];
  }, relationWithStatement("back_rank_overlay", ["arrows", "lit_squares", "panel", "piece_halo"], ["list"]));
  add("threat_radar", V1("rules.tactic.reading.trapped_piece"), "relation_overlay", ["arrows", "list", "lit_squares", "panel", "piece_halo"], ["pieces"], ["mechanical_transform", "retained_convention"], (evidence) => {
    const reading = evidence.payload as { readonly kind: "pieces" | "abstained"; readonly pieces: readonly { readonly piece: Occupant; readonly attackers: readonly { readonly moveUci: string }[]; readonly moves: readonly unknown[] }[] };
    const nodes = reading.pieces.flatMap((entry) => [{ square: entry.piece.square, role: entry.piece.occupant.role, color: entry.piece.occupant.color, emphasis: "target" as const }, ...entry.attackers.map((attacker) => ({ square: fromSquare(attacker.moveUci), emphasis: "source" as const }))]);
    const edges = reading.pieces.flatMap((entry) => entry.attackers.map((attacker) => ({ from: fromSquare(attacker.moveUci), to: entry.piece.square, relation: "attacks" as const, sign: "state" as const })));
    const summary = statement("play.trapped_pieces@1", "threat-convention@1", { pieces: reading.pieces.map((entry) => ({ piece: piece(entry.piece.occupant), square: entry.piece.square, attackers: entry.attackers.map((attacker) => fromSquare(attacker.moveUci)), moves: entry.moves.length })) });
    return [relation(evidence, nodes, edges, "threat", kit.declared(evidence, "threat-convention@1")), summary];
  }, relationWithStatement("trapped_piece_overlay", ["arrows", "lit_squares", "panel", "piece_halo"], ["list"]));
  add("threat_radar", V1("rules.tactic.reading.ray_classification"), "square_set", SQUARE_FORMS, ["rays"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly rays: readonly { readonly slider: PieceAt; readonly blocker: Occupant; readonly target: Occupant; readonly kind: "absolute_pin" | "relative_pin" | "skewer" | "xray_attack" | "xray_defense" }[] };
    const rays = reading.rays.map((ray) => ({ kind: ray.kind, slider: piece(ray.slider.piece), sliderSquare: ray.slider.square, blocker: piece(ray.blocker.occupant), blockerSquare: ray.blocker.square, target: piece(ray.target.occupant), targetSquare: ray.target.square }));
    return kit.squareSet(evidence, reading.rays.flatMap((ray) => [ray.slider.square, ray.blocker.square, ray.target.square]), "red", fact("play.rays@1", "threat-convention@1", { rays }));
  });
  add("threat_radar", V1("derived.tactic.defender_exposure"), "relation_overlay", ["arrows", "list", "lit_squares", "panel"], ["defender", "target"], ["mechanical_transform"], (evidence) => {
    const exposure = evidence.payload as { readonly kind: "available" | "unavailable"; readonly defender?: PieceAt; readonly target?: PieceAt };
    if (exposure.kind !== "available" || exposure.defender === undefined || exposure.target === undefined) throw new TypeError("an unavailable defender exposure is an abstention, never a relation");
    const nodes = [{ square: exposure.defender.square, role: exposure.defender.piece.role, color: exposure.defender.piece.color, emphasis: "source" as const }, { square: exposure.target.square, role: exposure.target.piece.role, color: exposure.target.piece.color, emphasis: "target" as const }];
    return [relation(evidence, nodes, [{ from: exposure.defender.square, to: exposure.target.square, relation: "defends", sign: "lost" }], "fact"), statement("play.defender_exposure@1", "piece-geometry@1", { defender: piece(exposure.defender.piece), defenderSquare: exposure.defender.square, target: piece(exposure.target.piece), targetSquare: exposure.target.square })];
  }, relationWithStatement("defender_exposure_overlay", ["arrows", "lit_squares", "panel"], ["list"]));

  // --- structure_nudge: what kind of position this is (module-registration §4.6)
  add("structure_nudge", V1("rules.structural.reading.named_structure", 2), "fact_statement", ["list", "panel"], ["id", "name", "squares"], ["copied_byte_equal"], (evidence) => ({ id: "fact_statement", operand: namedStructureCaption(evidence) }));
  add("structure_nudge", V1("rules.structural.reading.space"), "fact_statement", ["list", "panel"], ["colors", "differentials"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly colors: readonly { readonly color: Color; readonly total: number }[]; readonly differentials: readonly { readonly zone: "queenside" | "central" | "kingside"; readonly white: number; readonly black: number }[] };
    return statement("play.space@1", "pawn-structure@1", { totals: reading.colors.map((entry) => ({ color: entry.color, total: entry.total })), zones: reading.differentials.map((zone) => ({ zone: zone.zone, white: zone.white, black: zone.black })) });
  });
  add("structure_nudge", V1("rules.structural.reading.pawn_connectivity"), "fact_statement", ["list", "panel"], ["colors"], ["mechanical_transform"], (evidence) => {
    const reading = evidence.payload as { readonly colors: readonly { readonly color: Color; readonly islandCount: number; readonly connectedPawnPairs: readonly unknown[]; readonly chains: readonly unknown[] }[] };
    return statement("play.pawn_connectivity@1", "board-rules@1", { colors: reading.colors.map((entry) => ({ color: entry.color, islands: entry.islandCount, connectedPairs: entry.connectedPawnPairs.length, chains: entry.chains.length })) });
  });
  add("structure_nudge", V1("rules.phase.reading", 2), "fact_statement", ["panel"], ["phase", "decision"], ["copied_byte_equal"], (evidence) =>
    statement("play.phase@1", "phase-bands@1", { phase: (evidence.payload as { readonly phase: "opening" | "middlegame" | "endgame" | "unclear" }).phase }));
  add("structure_nudge", V1("rules.endgame.classification"), "fact_statement", ["panel"], ["type"], ["copied_byte_equal"], (evidence) =>
    statement("play.endgame_type@1", "endgame-convention@1", { label: (evidence.payload as { readonly type: { readonly label: string } | null }).type?.label ?? null }));
  add("structure_nudge", V1("theory.endgame.setup_match"), "fact_statement", ["panel"], ["technique", "convention"], ["copied_byte_equal"], (evidence) => {
    const match = evidence.payload as { readonly technique: string; readonly convention: { readonly id: string } };
    return statement("play.endgame_setup@1", "endgame-convention@1", { technique: match.technique, name: SETUP_NAMES[match.technique] ?? "registered endgame" });
  });
  const shapeTitle = (entryId: string): string => entryId.split("-").map((word, index) => index === 0 ? `${word.slice(0, 1).toUpperCase()}${word.slice(1)}` : word).join(" ");
  add("structure_nudge", V1("theory.shapes.firing"), "fact_statement", ["panel", "timeline_marker"], ["entryId"], ["mechanical_transform"], (evidence) =>
    statement("play.shape@1", "shape-catalogue@1", { title: shapeTitle((evidence.payload as { readonly entryId: string }).entryId) }));

  // --- theory_breadcrumb: cited or authored theory for this position (module-registration §4.7)
  add("theory_breadcrumb", V1("theory.shapes.firing"), "fact_statement", ["panel", "sentence"], ["entryId"], ["mechanical_transform"], (evidence) =>
    statement("play.shape@1", "shape-catalogue@1", { title: shapeTitle((evidence.payload as { readonly entryId: string }).entryId) }));
  add("theory_breadcrumb", V1("theory.opening.current_endpoint"), "fact_statement", ["list", "panel", "sentence"], ["eco", "name"], ["copied_byte_equal"], (evidence) => {
    const endpoint = evidence.payload as { readonly eco: string; readonly name: string };
    return statement("play.opening@1", "opening-catalogue@1", { eco: endpoint.eco, name: endpoint.name });
  });
  add("theory_breadcrumb", V1("pack.authored.claim"), "fact_statement", ["panel", "sentence"], ["text"], ["authored_text_copied"], (evidence) =>
    statement("play.authored_claim@1", "authored-claim@1", { text: (evidence.payload as { readonly text: string }).text }));

  // --- compare_coach: the smallest recorded difference between two attempts (§4.9)
  const compareScore = (evidence: DeclaredEvidence<unknown>, value: number, unit: "centipawn" | "mate_in"): ComponentValue => ({
    id: "magnitude",
    operand: { value, unit: { kind: unit }, convention: kit.convention(evidence, { kind: "recorded_search", engine: null, depth: null }, "white"), saturated: false },
  });
  add("compare_coach", V1("derived.compare.engine_trajectory"), "magnitude", ["list", "panel"], ["score", "plyOffset"], ["copied_byte_equal", "retained_convention"], (evidence) => {
    const entry = evidence.payload as { readonly score: { readonly kind: "cp"; readonly value: number } | { readonly kind: "mate"; readonly movesTo: number } };
    return entry.score.kind === "cp" ? compareScore(evidence, entry.score.value, "centipawn") : compareScore(evidence, entry.score.movesTo, "mate_in");
  });
  add("compare_coach", V1("derived.compare.eval_delta"), "magnitude", ["list", "panel", "sentence"], ["delta", "plyOffset"], ["copied_byte_equal", "retained_convention"], (evidence) =>
    compareScore(evidence, (evidence.payload as { readonly delta: number }).delta, "centipawn"));
  add("compare_coach", V1("derived.compare.structure_delta"), "fact_statement", ["list", "panel", "sentence"], ["observation"], ["copied_byte_equal"], (evidence) => {
    const observation = (evidence.payload as { readonly observation: { readonly kind: StructuralKind } & Readonly<Record<string, unknown>> }).observation;
    const { detail: _detail, provenanceNote: _note, ...rest } = observation as Readonly<Record<string, unknown>>;
    return statement("play.compare_structure@1", "pawn-structure@1", { observation: rest });
  });
  add("compare_coach", V1("derived.compare.piece_route"), "fact_statement", ["list", "panel"], ["pieceId", "squares"], ["copied_byte_equal"], (evidence) => {
    const route = evidence.payload as { readonly pieceId: string; readonly squares: readonly SquareName[] };
    return statement("play.compare_route@1", "recorded-comparison@1", { piece: route.pieceId.replace(/^(White|Black) /u, (match) => match.toLowerCase()), squares: [...route.squares] }, "recorded_run");
  });
  add("compare_coach", V1("run.record.fork"), "fact_statement", ["list", "panel", "sentence"], ["sharedPly"], ["copied_byte_equal"], (evidence) =>
    statement("play.recorded_fork@1", "recorded-run@1", { sharedPly: (evidence.payload as { readonly sharedPly: number }).sharedPly }, "recorded_run"));
  add("compare_coach", V1("run.record.checkpoint_hit"), "fact_statement", ["panel", "sentence"], ["plyOffset"], ["copied_byte_equal"], (evidence) =>
    statement("play.checkpoint_hit@1", "recorded-run@1", { plyOffset: (evidence.payload as { readonly plyOffset: number }).plyOffset }, "recorded_run"));
  add("compare_coach", V1("run.record.objective_transition"), "fact_statement", ["panel", "sentence"], ["from", "to"], ["copied_byte_equal"], (evidence) => {
    const transition = evidence.payload as { readonly from: string; readonly to: string };
    return statement("play.objective_transition@1", "recorded-run@1", { from: transition.from, to: transition.to }, "recorded_run");
  });
  add("compare_coach", V1("run.record.consequence"), "fact_statement", ["panel", "sentence"], ["terminal", "outcome", "plies", "objectiveState"], ["copied_byte_equal"], (evidence) => {
    const value = evidence.payload as { readonly terminal: boolean; readonly outcome?: "win" | "loss" | "draw"; readonly plies?: number; readonly objectiveState?: string };
    return { id: "fact_statement", operand: kit.fact("story.consequence@1", "recorded_run", "recorded-run@1", (value.terminal ? { terminal: true, outcome: value.outcome! } : { terminal: false, plies: value.plies!, objectiveState: value.objectiveState! }) as never) };
  });

  // --- guided_hint: one adapter per family x rung disclosure (rfc/hint-distance.md §3, §4). The
  // learner surface is the Guided Hint seat's closed delivery receipt; this adapter is the same
  // canonical sentence for any consumer that presents the admitted disclosure.
  const hintSources = (rung: HintRung): readonly string[] => ["rung", "family", "attribution", ...(rung === "pattern" ? [] : ["targetSquares"]), ...(["piece", "distance", "move"].includes(rung) ? ["actor"] : []), ...(["distance", "move"].includes(rung) ? ["relation", "occurrencePly"] : []), ...(rung === "move" ? ["firstMove"] : [])];
  const hintSentenceOf = (evidence: DeclaredEvidence<unknown>) => statement("play.guided_hint@1", "guided-hint@1", hintOperands(evidence.payload as HintDisclosurePayload));
  for (const family of HINT_FAMILIES) {
    const projection = (rung: HintRung) => V1(hintDisclosureProjectionId(family, rung));
    // pattern: the family sentence alone (no board coordinate).
    add("guided_hint", projection("pattern"), "fact_statement", ["sentence"], hintSources("pattern"), ["copied_byte_equal"], hintSentenceOf);
    // square / piece / distance: the disclosed squares (plus the actor's halo), captioned by the sentence.
    for (const rung of ["square", "piece", "distance"] as const) {
      const squareForms: readonly EvidenceForm[] = rung === "square" ? ["lit_squares"] : ["lit_squares", "piece_halo"];
      add("guided_hint", projection(rung), "square_set", [...squareForms, "sentence"], hintSources(rung), ["copied_byte_equal", "mechanical_transform"], (evidence) => {
        const payload = evidence.payload as Extract<HintDisclosurePayload, { readonly rung: "square" | "piece" | "distance" }>;
        const caption = fact("play.guided_hint@1", "guided-hint@1", hintOperands(payload));
        const squares = payload.rung === "square" ? payload.targetSquares : [payload.actor.square, ...payload.targetSquares];
        return [kit.squareSet(evidence, squares as readonly SquareName[], "yellow", caption), hintSentenceOf(evidence)];
      }, { id: `guided_hint_${rung}_marks`, members: [{ component: "square_set", forms: squareForms }, { component: "fact_statement", forms: ["sentence"] }] });
    }
    // move: the actor, targets and the one first-move arrow, captioned by the sentence.
    add("guided_hint", projection("move"), "relation_overlay", ["arrows", "lit_squares", "piece_halo", "sentence"], hintSources("move"), ["copied_byte_equal", "mechanical_transform"], (evidence) => {
      const payload = evidence.payload as Extract<HintDisclosurePayload, { readonly rung: "move" }>;
      const from = fromSquare(payload.firstMove.uci);
      const to = toSquare(payload.firstMove.uci);
      const nodes = [
        { square: payload.actor.square as SquareName, role: payload.actor.role, color: payload.actor.color, emphasis: "source" as const },
        ...(from === payload.actor.square ? [] : [{ square: from, emphasis: "context" as const }]),
        { square: to, emphasis: "context" as const },
        ...payload.targetSquares.map((square) => ({ square: square as SquareName, emphasis: "target" as const })),
      ];
      return [relation(evidence, nodes, [{ from, to, relation: "moves_to" as const, sign: "state" as const }], "move"), hintSentenceOf(evidence)];
    }, relationWithStatement(`guided_hint_move_overlay`, ["arrows", "lit_squares", "piece_halo"], ["sentence"]));
  }

  return Object.freeze(specs);
}

/** The registered endgame-setup technique names (endgame-setup.ts conventions). */
const SETUP_NAMES: Readonly<Record<string, string>> = Object.freeze({ lucena: "Lucena position", philidor: "Philidor position", vancura: "Vančura position" });
