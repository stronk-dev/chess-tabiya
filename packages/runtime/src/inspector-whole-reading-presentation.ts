// Accepted D3984. Fixed Full2 presentation over genuine unchanged whole readings, not selection.
import type { Piece, SquareName } from "chessops/types";
import { assertDeclaredEvidence, type DeclaredEvidence } from "./evidence-contract.js";
import type { EvidenceValueRouteResults } from "./internal/evidence-value-routes.js";
import type { ComponentValue, FactStatementOperand, PresentationKit, RelationOverlayOperand } from "./presentation-contract.js";
import { factRenderer, plural, s, side } from "./presentation-schema.js";
import { pawnContactCaptionOperands } from "./presentation-play-adapters.js";

export const INSPECTOR_WHOLE_READING_GEOMETRY = Object.freeze({
  "rules.tactic.reading.loose_piece@1": "none",
  "rules.tactic.reading.ray_classification@1": "square_set",
  "rules.tactic.reading.rook_on_seventh@1": "square_set",
  "rules.tactic.reading.trapped_piece@1": "relation_overlay",
  "rules.tactic.reading.back_rank@1": "relation_overlay",
  "rules.tactic.reading.discovered_latency@1": "relation_overlay",
  "rules.tactic.consequence.threat@1": "none",
  "rules.tactic.consequence.mate_in_one@1": "none",
  "rules.structural.reading.space@1": "square_set",
  "rules.structural.reading.pawn_connectivity@1": "square_set",
  "rules.phase.development@1": "square_set",
  "rules.tactic.reading.promotion_pressure@1": "square_set",
  "rules.mobility.reading.legal_moves@1": "square_set",
  "rules.mobility.reading.piece_destinations@1": "relation_overlay",
  "rules.pawn.reading.contacts@1": "relation_overlay",
  "rules.pawn.reading.candidate_majority@1": "square_set",
  "rules.tactic.reading.defender_duty_set@1": "relation_overlay",
} as const);
export type InspectorWholeReadingRef = keyof typeof INSPECTOR_WHOLE_READING_GEOMETRY;
export function isInspectorWholeReading(ref: string): ref is InspectorWholeReadingRef { return Object.hasOwn(INSPECTOR_WHOLE_READING_GEOMETRY, ref); }

/** The wire receiver has the registered statement, not a source handle. These exact retained
 * operands decide conditional presence only; they cannot issue evidence or reconstruct a source. */
export function inspectorWholeReadingGeometryRequired(ref: InspectorWholeReadingRef, statement: FactStatementOperand): boolean {
  const r = statement.operands as Readonly<Record<string, unknown>>;
  const invalid = (): never => { throw new TypeError("Inspector whole statement crosses its registered source renderer"); };
  const objects = (value: unknown): readonly Readonly<Record<string, unknown>>[] => Array.isArray(value) ? value : invalid();
  if (statement.rendererId === "inspector.whole_population@1") {
    if (r.sourceProjection !== ref || r.state !== "empty" && r.state !== "not_evaluated") return invalid();
    return false;
  }
  const renderer: Readonly<Record<InspectorWholeReadingRef, string>> = {
    "rules.tactic.reading.loose_piece@1": "play.loose_pieces@1", "rules.tactic.reading.ray_classification@1": "play.rays@1",
    "rules.tactic.reading.rook_on_seventh@1": "play.rook_on_seventh@1", "rules.tactic.reading.trapped_piece@1": "play.trapped_pieces@1",
    "rules.tactic.reading.back_rank@1": "play.back_rank@1", "rules.tactic.reading.discovered_latency@1": "inspector.discovered_latency@1",
    "rules.tactic.consequence.threat@1": "play.threats@1", "rules.tactic.consequence.mate_in_one@1": "play.mate_in_one@1",
    "rules.structural.reading.space@1": "play.space@1", "rules.structural.reading.pawn_connectivity@1": "play.pawn_connectivity@1",
    "rules.phase.development@1": "inspector.development@1", "rules.tactic.reading.promotion_pressure@1": "inspector.promotion_pressure@1",
    "rules.mobility.reading.legal_moves@1": "play.legal_moves@1", "rules.mobility.reading.piece_destinations@1": "inspector.piece_destination_states@1",
    "rules.pawn.reading.contacts@1": "play.pawn_contacts@1", "rules.pawn.reading.candidate_majority@1": "inspector.candidate_majority@1",
    "rules.tactic.reading.defender_duty_set@1": "inspector.duty_set@1",
  };
  if (statement.rendererId !== renderer[ref]) return invalid();
  switch (ref) {
    case "rules.tactic.reading.loose_piece@1": case "rules.tactic.consequence.threat@1": case "rules.tactic.consequence.mate_in_one@1": return false;
    case "rules.tactic.reading.ray_classification@1": return objects(r.rays).length > 0;
    case "rules.tactic.reading.rook_on_seventh@1": return objects(r.rooks).length > 0;
    case "rules.tactic.reading.trapped_piece@1": return objects(r.pieces).some(piece => objects(piece.attackers).length > 0);
    case "rules.tactic.reading.back_rank@1": return objects(r.kings).some(king => objects(king.heavy).some(piece => piece.square !== piece.target));
    case "rules.tactic.reading.discovered_latency@1": return objects(r.screens).length > 0;
    case "rules.structural.reading.space@1": return objects(r.totals).some(color => Number(color.total) > 0);
    case "rules.structural.reading.pawn_connectivity@1": return objects(r.colors).some(color => Number(color.islands) > 0);
    case "rules.phase.development@1": return objects(r.white).length + objects(r.black).length > 0;
    case "rules.tactic.reading.promotion_pressure@1": return objects(r.pawns).length > 0;
    case "rules.mobility.reading.legal_moves@1": return Number(r.pieces) > 0;
    case "rules.mobility.reading.piece_destinations@1": return objects(r.colors).some(color => color.kind === "available" && Number(color.legal) > 0);
    case "rules.pawn.reading.contacts@1": return Number(r.contacts) > 0;
    case "rules.pawn.reading.candidate_majority@1": return objects(r.candidates).length > 0;
    case "rules.tactic.reading.defender_duty_set@1": return Number(r.duties) > 0;
  }
}

const empty = <const R extends string>(ref: R) => s.obj({ sourceProjection: s.lit(ref), state: s.lit("empty"), count: s.lit(0) });
const population = s.union("sourceProjection", {
  "rules.tactic.reading.loose_piece@1": s.obj({ sourceProjection: s.lit("rules.tactic.reading.loose_piece@1"), state: s.lit("empty"), count: s.lit(0), piecesExamined: s.nat }),
  "rules.tactic.reading.ray_classification@1": empty("rules.tactic.reading.ray_classification@1"),
  "rules.tactic.reading.rook_on_seventh@1": empty("rules.tactic.reading.rook_on_seventh@1"),
  "rules.tactic.reading.trapped_piece@1": s.union("state", {
    empty: empty("rules.tactic.reading.trapped_piece@1"),
    not_evaluated: s.obj({ sourceProjection: s.lit("rules.tactic.reading.trapped_piece@1"), state: s.lit("not_evaluated"), reason: s.lit("trapped_while_in_check") }),
  }),
  "rules.tactic.reading.back_rank@1": empty("rules.tactic.reading.back_rank@1"),
  "rules.tactic.reading.discovered_latency@1": empty("rules.tactic.reading.discovered_latency@1"),
  "rules.tactic.consequence.threat@1": s.union("state", {
    empty: empty("rules.tactic.consequence.threat@1"),
    not_evaluated: s.obj({ sourceProjection: s.lit("rules.tactic.consequence.threat@1"), state: s.lit("not_evaluated"), reason: s.lit("pass_while_in_check") }),
  }),
  "rules.tactic.consequence.mate_in_one@1": empty("rules.tactic.consequence.mate_in_one@1"),
  "rules.tactic.reading.promotion_pressure@1": empty("rules.tactic.reading.promotion_pressure@1"),
  "rules.pawn.reading.candidate_majority@1": empty("rules.pawn.reading.candidate_majority@1"),
});
const populationLabels = Object.freeze({
  "rules.tactic.reading.loose_piece@1": "flagged loose pieces under the declared local-exchange/defence convention",
  "rules.tactic.reading.ray_classification@1": "named ray relations under the declared pin/skewer/x-ray convention",
  "rules.tactic.reading.rook_on_seventh@1": "rooks on their relative seventh rank",
  "rules.tactic.reading.trapped_piece@1": "trapped pieces under the declared local-exchange convention",
  "rules.tactic.reading.back_rank@1": "back-rank entries under the declared back-rank convention",
  "rules.tactic.reading.discovered_latency@1": "screens under the declared discovered-attack convention",
  "rules.tactic.consequence.threat@1": "pass-threats under the declared pass-turn convention",
  "rules.tactic.consequence.mate_in_one@1": "immediate legal mating moves",
  "rules.tactic.reading.promotion_pressure@1": "pawns under the declared promotion-pressure convention",
  "rules.pawn.reading.candidate_majority@1": "candidate passers under the declared pawn-structure convention",
});
const destination = s.union("kind", {
  available: s.obj({ color: s.color, kind: s.lit("available"), pieces: s.nat, legal: s.nat, localNonLosing: s.nat }),
  unavailable: s.obj({ color: s.color, kind: s.lit("unavailable"), reason: s.lit("invalid_turn_clone") }),
});
const destinationBase = s.obj({ colors: s.arr(destination, { min: 2, max: 2 }) });
const destinations: typeof destinationBase = (value, label) => {
  const parsed = destinationBase(value, label);
  if (new Set(parsed.colors.map(row => row.color)).size !== 2 || parsed.colors.some(row => row.kind === "available" && row.localNonLosing > row.legal)) throw new TypeError("Inspector destination counts/colors cross their source grammar");
  return parsed;
};
export const INSPECTOR_WHOLE_FACT_RENDERERS = Object.freeze({
  "inspector.whole_population@1": factRenderer(population, value => value.state === "not_evaluated"
    ? `${value.sourceProjection === "rules.tactic.consequence.threat@1" ? "The pass-threat calculation" : "The trapping calculation"} was not evaluated because the side to move is in check. This is not a zero result.`
    : `This reading contains 0 ${populationLabels[value.sourceProjection]}.${"piecesExamined" in value ? ` It examined ${plural(value.piecesExamined, "piece")}.` : ""}`),
  "inspector.piece_destination_states@1": factRenderer(destinations, value => value.colors.map(row => row.kind === "unavailable"
    ? `${side(row.color)}: turn-clone destinations are unavailable.`
    : `${side(row.color)}: ${plural(row.legal, "legal destination")} over ${plural(row.pieces, "piece")}; ${row.localNonLosing} locally non-losing under the declared local-exchange convention.`).join(" ")),
});

type Payload<R extends InspectorWholeReadingRef> = EvidenceValueRouteResults[R] extends DeclaredEvidence<infer P> ? P : never;
function read<R extends InspectorWholeReadingRef>(evidence: DeclaredEvidence<unknown>, ref: R): Payload<R> {
  assertDeclaredEvidence(evidence);
  if (`${evidence.projection.id}@${evidence.projection.version}` !== ref) throw new TypeError("Whole reading crosses its exact source");
  return evidence.payload as Payload<R>;
}
const piece = (value: Piece) => ({ color: value.color, role: value.role });
const at = (value: { readonly square: SquareName; readonly piece: Piece }) => ({ square: value.square, piece: piece(value.piece) });
const occupied = (value: { readonly square: SquareName; readonly occupant: Piece }) => ({ square: value.square, piece: piece(value.occupant) });
type Node = RelationOverlayOperand["nodes"][number];
type Edge = RelationOverlayOperand["edges"][number];
const node = (value: ReturnType<typeof at>, emphasis: Node["emphasis"]): Node => ({ square: value.square, role: value.piece.role, color: value.piece.color, emphasis });
const from = (move: string): SquareName => s.square(s.uci(move, "recorded witness move").slice(0, 2), "witness origin");

/** No source filtering: every genuine reading produces its original owned statement bundle. */
export function inspectorWholeReadingComponents(evidence: DeclaredEvidence<unknown>, kit: PresentationKit): readonly ComponentValue[] {
  assertDeclaredEvidence(evidence);
  const ref = `${evidence.projection.id}@${evidence.projection.version}`;
  if (!isInspectorWholeReading(ref)) throw new TypeError("Unsupported exact whole Inspector reading");
  const fact = (id: Parameters<PresentationKit["fact"]>[0], convention: Parameters<PresentationKit["fact"]>[2], operands: unknown) => kit.fact(id, "declared_convention", convention, operands as never);
  const text = (caption: FactStatementOperand): ComponentValue => ({ id: "fact_statement", operand: caption });
  const zero = (extra: object = {}, convention: Parameters<PresentationKit["fact"]>[2] = "threat-convention@1") => fact("inspector.whole_population@1", convention, { sourceProjection: ref, state: "empty", count: 0, ...extra });
  const squares = (caption: FactStatementOperand, values: readonly SquareName[], brush: "blue" | "red" = "blue"): readonly ComponentValue[] =>
    values.length === 0 ? [text(caption)] : [text(caption), kit.squareSet(evidence, values, brush, caption)];
  const relation = (caption: FactStatementOperand, nodes: readonly Node[], edges: readonly Edge[], answerDistance: RelationOverlayOperand["answerDistance"], convention?: Parameters<PresentationKit["declared"]>[1]): readonly ComponentValue[] => {
    const uniqueNodes = new Map<SquareName, Node>(), uniqueEdges = new Map<string, Edge>();
    for (const value of nodes) if (!uniqueNodes.has(value.square)) uniqueNodes.set(value.square, value);
    for (const edge of edges) if (edge.from !== edge.to) {
      const key = `${edge.from}${edge.to}${edge.relation}${edge.sign}`;
      if (!uniqueEdges.has(key)) uniqueEdges.set(key, edge);
    }
    return uniqueEdges.size === 0 ? [text(caption)] : [text(caption), { id: "relation_overlay", operand: {
      nodes: [...uniqueNodes.values()], edges: [...uniqueEdges.values()], owner: { factRef: kit.factRef(evidence) }, answerDistance,
      ...(convention === undefined ? {} : { convention: kit.declared(evidence, convention) }),
    } }];
  };
  switch (ref) {
    case "rules.tactic.reading.loose_piece@1": {
      const r = read(evidence, ref), flagged = r.pieces.filter(p => p.enPrise || p.loose || p.underDefended);
      return [text(flagged.length === 0 ? zero({ piecesExamined: r.pieces.length }) : fact("play.loose_pieces@1", "threat-convention@1", { pieces: flagged.map(p => ({ piece: piece(p.piece.occupant), square: p.piece.square, enPrise: p.enPrise, loose: p.loose, underDefended: p.underDefended, capturers: p.legalCapturers.map(c => c.square), defenders: p.defenders.length })) }))];
    }
    case "rules.tactic.reading.ray_classification@1": {
      const r = read(evidence, ref);
      const caption = r.rays.length === 0 ? zero() : fact("play.rays@1", "threat-convention@1", { rays: r.rays.map(ray => ({ kind: ray.kind, slider: piece(ray.slider.piece), sliderSquare: ray.slider.square, blocker: piece(ray.blocker.occupant), blockerSquare: ray.blocker.square, target: piece(ray.target.occupant), targetSquare: ray.target.square })) });
      return squares(caption, r.rays.flatMap(ray => [ray.slider.square, ray.blocker.square, ray.target.square]), "red");
    }
    case "rules.tactic.reading.rook_on_seventh@1": {
      const r = read(evidence, ref);
      return squares(r.rooks.length === 0 ? zero({}, "board-rules@1") : fact("play.rook_on_seventh@1", "board-rules@1", { rooks: r.rooks.map(rook => ({ color: rook.rook.piece.color, square: rook.rook.square, king: rook.enemyKingOnBackRank?.square ?? null, pawns: rook.enemyPawnsOnSeventh.map(p => p.square) })) }), r.rooks.flatMap(rook => [rook.rook.square, ...(rook.enemyKingOnBackRank === null ? [] : [rook.enemyKingOnBackRank.square]), ...rook.enemyPawnsOnSeventh.map(p => p.square)]));
    }
    case "rules.tactic.reading.trapped_piece@1": {
      const r = read(evidence, ref);
      if (r.kind === "abstained") return [text(fact("inspector.whole_population@1", "threat-convention@1", { sourceProjection: ref, state: "not_evaluated", reason: r.reason }))];
      const caption = r.pieces.length === 0 ? zero() : fact("play.trapped_pieces@1", "threat-convention@1", { pieces: r.pieces.map(p => ({ piece: piece(p.piece.occupant), square: p.piece.square, attackers: p.attackers.map(a => from(a.moveUci)), moves: p.moves.length })) });
      return relation(caption, r.pieces.flatMap(p => [node(occupied(p.piece), "target"), ...p.attackers.map(a => ({ square: from(a.moveUci), emphasis: "source" as const }))]), r.pieces.flatMap(p => p.attackers.map(a => ({ from: from(a.moveUci), to: p.piece.square, relation: "attacks" as const, sign: "state" as const }))), "threat", "threat-convention@1");
    }
    case "rules.tactic.reading.back_rank@1": {
      const r = read(evidence, ref);
      const caption = r.susceptible.length === 0 ? zero() : fact("play.back_rank@1", "threat-convention@1", { kings: r.susceptible.map(k => ({ color: k.color, king: k.kingSquare, blockedEscapes: k.escapes.filter(e => e.blockedByOwn !== undefined).map(e => e.square), attackedEscapes: k.escapes.filter(e => e.blockedByOwn === undefined && e.attackedBy.length > 0).map(e => e.square), heavy: k.accessingHeavyPieces.map(h => ({ piece: piece(h.piece), square: h.square, target: h.fileTarget })) })) });
      return relation(caption, r.susceptible.flatMap(k => [{ square: k.kingSquare, role: "king" as const, color: k.color, emphasis: "target" as const }, ...k.accessingHeavyPieces.flatMap(h => [{ square: h.square, role: h.piece.role, color: h.piece.color, emphasis: "source" as const }, { square: h.fileTarget, emphasis: "target" as const }])]), r.susceptible.flatMap(k => k.accessingHeavyPieces.map(h => ({ from: h.square, to: h.fileTarget, relation: "moves_to" as const, sign: "state" as const }))), "threat", "threat-convention@1");
    }
    case "rules.tactic.reading.discovered_latency@1": {
      const r = read(evidence, ref);
      const caption = r.screens.length === 0 ? zero() : fact("inspector.discovered_latency@1", "threat-convention@1", { screens: r.screens.map(p => ({ screen: at(p.screen), slider: at(p.slider), target: occupied(p.target), check: p.discoveredCheck })) });
      return relation(caption, r.screens.flatMap(p => [node(at(p.screen), "screen"), node(occupied(p.target), "target"), node(at(p.slider), "context")]), r.screens.map(p => ({ from: p.screen.square, to: p.target.square, relation: "closes_ray", sign: "state" })), "threat", "threat-convention@1");
    }
    case "rules.tactic.consequence.threat@1": {
      const r = read(evidence, ref);
      if (r.kind === "abstained") return [text(fact("inspector.whole_population@1", "threat-convention@1", { sourceProjection: ref, state: "not_evaluated", reason: r.reason }))];
      return [text(r.threats.length === 0 ? zero() : fact("play.threats@1", "threat-convention@1", { threats: r.threats.map(t => ({ piece: piece(t.threateningPiece.piece), from: t.threateningPiece.square, mate: t.mate, ...(t.target === undefined ? {} : { target: piece(t.target.piece) }), to: s.square(s.uci(t.threatenedMove, "threat move").slice(2, 4), "threat destination") })) }))];
    }
    case "rules.tactic.consequence.mate_in_one@1": {
      const r = read(evidence, ref);
      return [text(r.mates.length === 0 ? zero({}, "board-rules@1") : fact("play.mate_in_one@1", "board-rules@1", { mates: r.mates.map(m => ({ piece: piece(m.mover.piece), from: m.mover.from, to: m.mover.to, king: m.matedKing.square })) }))];
    }
    case "rules.structural.reading.space@1": {
      const r = read(evidence, ref);
      return squares(fact("play.space@1", "pawn-structure@1", { totals: r.colors.map(c => ({ color: c.color, total: c.total })), zones: r.differentials.map(z => ({ zone: z.zone, white: z.white, black: z.black })) }), r.colors.flatMap(c => c.zones.flatMap(z => z.squares)));
    }
    case "rules.structural.reading.pawn_connectivity@1": {
      const r = read(evidence, ref);
      return squares(fact("play.pawn_connectivity@1", "board-rules@1", { colors: r.colors.map(c => ({ color: c.color, islands: c.islandCount, connectedPairs: c.connectedPawnPairs.length, chains: c.chains.length })) }), r.colors.flatMap(c => c.islands.flatMap(i => i.squares)));
    }
    case "rules.phase.development@1": {
      const r = read(evidence, ref);
      const units = (color: "white" | "black") => r.undeveloped[color].map(p => ({ square: p.square, piece: { color, role: p.role } }));
      const white = units("white"), black = units("black");
      return squares(fact("inspector.development@1", "board-rules@1", { white, black }), [...white, ...black].map(p => p.square));
    }
    case "rules.tactic.reading.promotion_pressure@1": {
      const r = read(evidence, ref);
      return squares(r.pawns.length === 0 ? zero({}, "board-rules@1") : fact("inspector.promotion_pressure@1", "board-rules@1", { pawns: r.pawns.map(p => ({ pawn: at(p.pawn), promotion: p.promotionSquare, distance: p.distance, blockers: p.blockers.length })) }), r.pawns.flatMap(p => [p.pawn.square, p.promotionSquare]));
    }
    case "rules.mobility.reading.legal_moves@1": {
      const r = read(evidence, ref), movable = r.pieces.filter(p => p.moves.length > 0);
      const footprint = [...new Set(movable.map(p => p.piece.square))];
      return squares(fact("play.legal_moves@1", "board-rules@1", { turn: r.turn, pieces: movable.length, moves: movable.reduce((n, p) => n + p.moves.length, 0), squares: footprint }), footprint);
    }
    case "rules.mobility.reading.piece_destinations@1": {
      const r = read(evidence, ref), available = r.colors.filter(c => c.kind === "available");
      const caption = fact("inspector.piece_destination_states@1", "piece-geometry@1", { colors: r.colors.map(c => c.kind === "unavailable" ? { color: c.color, kind: c.kind, reason: c.reason }
        : { color: c.color, kind: c.kind, pieces: c.pieces.length, legal: c.pieces.reduce((n, p) => n + p.legal.length, 0), localNonLosing: c.pieces.reduce((n, p) => n + p.localNonLosing.length, 0) }) });
      const nodes = available.flatMap(c => c.pieces.flatMap(p => p.legal.flatMap(target => [node(occupied(p.piece), "source"), { square: target, emphasis: "target" as const }])));
      return relation(caption, [...nodes.filter(n => n.role !== undefined), ...nodes.filter(n => n.role === undefined)], available.flatMap(c => c.pieces.flatMap(p => p.legal.map(to => ({ from: p.piece.square, to, relation: "moves_to" as const, sign: "state" as const })))), "fact", "piece-geometry@1");
    }
    case "rules.pawn.reading.contacts@1": {
      const r = read(evidence, ref);
      return relation(fact("play.pawn_contacts@1", "board-rules@1", pawnContactCaptionOperands(r)), r.contacts.flatMap(p => [node(at(p.attacker), "source"), node(at(p.target), "target")]), r.contacts.map(p => ({ from: p.attacker.square, to: p.target.square, relation: "attacks", sign: "state" })), "fact");
    }
    case "rules.pawn.reading.candidate_majority@1": {
      const r = read(evidence, ref);
      return squares(r.candidates.length === 0 ? zero({}, "pawn-structure@1") : fact("inspector.candidate_majority@1", "pawn-structure@1", { candidates: r.candidates.map(p => ({ pawn: at(p.pawn), supports: p.supportCount, blockers: p.blockerCount })) }), r.candidates.map(p => p.pawn.square));
    }
    case "rules.tactic.reading.defender_duty_set@1": {
      const r = read(evidence, ref), nodes = r.duties.flatMap(d => [node(at(d.defender), "source"), node(at(d.target), "target")]);
      return relation(fact("inspector.duty_set@1", "piece-geometry@1", { duties: r.duties.length, defenders: new Set(r.duties.map(d => d.defender.square)).size }), [...nodes.filter(n => n.emphasis === "source"), ...nodes.filter(n => n.emphasis !== "source")], r.duties.map(d => ({ from: d.defender.square, to: d.target.square, relation: "defends", sign: "state" })), "fact");
    }
  }
}
