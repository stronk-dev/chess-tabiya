// rfc/hint-distance.md §1–§3 — the pure value computations behind the two Guided Hint factories.
//
// `evidence-factories.ts` is the only caller: the horizon factory mints `derived.hint.horizon.<family>@1`
// from exactly one sealed searched line and one sealed family source, and the disclosure factory mints
// `derived.hint.disclosure.<family>.<rung>@1` from exactly one sealed horizon. Because the payload is
// computed here from sealed inputs — never supplied by a caller — a literal, spread, JSON or
// double-asserted occurrence cannot become a learner packet ([[D1640]]).
//
// Hypothetical-line semantics stay separately typed: every edge below is replayed from the searched
// principal variation, and nothing here reads a recorded run projection (recorded-semantic-path D7).

import { normalizeMove } from "chessops/chess";
import { makeSan } from "chessops/san";
import { makeSquare, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./position-cache.js";
import { HINT_SCAN_PLIES, hintDeclarationRow, type HintFamily, type HintRelation, type HintRung } from "./hint-registry.js";
import type { ForcedMateAfterMoveProof } from "./mate-proof.js";
import type { FixedBoundPrincipalVariation, ProviderEvidenceDelivery } from "./provider-types.js";
import type { DiscoveredExecutedEvent, DoubleAttackEvent, ForkSurvivalResult, LoosePieceEvent, MateInOneReading, PromotionPressureReading } from "./tactics.js";

export type HintSide = "white" | "black";
export type HintRole = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
export interface HintPieceIdentity { readonly color: HintSide; readonly role: HintRole; readonly square: string }

export interface HintSearchIdentity {
  readonly fen: string;
  readonly engine: { readonly id: string; readonly name: string; readonly version: string };
  readonly bound: FixedBoundPrincipalVariation["bound"];
  readonly scannedPlies: number;
  readonly normalizedRequestDigest: string;
  readonly responseDigest: string;
}

/** §1: the operator-only occurrence. Descriptive output of the horizon factory, never a caller input. */
export interface HintHorizonOccurrence {
  readonly family: HintFamily;
  readonly sourceRole: "reading" | "predicate" | "event";
  readonly source: { readonly projection: string; readonly status: string };
  readonly relation: HintRelation;
  readonly occurrencePly: 1 | 3;
  readonly rootSide: HintSide;
  readonly edgeSide: HintSide;
  readonly signOrStatus: string;
  readonly actor: HintPieceIdentity;
  readonly targetSquares: readonly string[];
  readonly firstMove: { readonly uci: string; readonly san: string };
  readonly search: HintSearchIdentity;
}

export interface HintAttribution {
  readonly engine: string;
  readonly bound: string;
}

/** §3: five byte-level packets. A lower packet physically lacks every higher field. */
export type HintDisclosurePayload =
  | { readonly rung: "pattern"; readonly family: HintFamily; readonly attribution: HintAttribution }
  | { readonly rung: "square"; readonly family: HintFamily; readonly attribution: HintAttribution; readonly targetSquares: readonly string[] }
  | { readonly rung: "piece"; readonly family: HintFamily; readonly attribution: HintAttribution; readonly targetSquares: readonly string[]; readonly actor: HintPieceIdentity }
  | { readonly rung: "distance"; readonly family: HintFamily; readonly attribution: HintAttribution; readonly targetSquares: readonly string[]; readonly actor: HintPieceIdentity; readonly relation: HintRelation; readonly occurrencePly: 1 | 3 }
  | { readonly rung: "move"; readonly family: HintFamily; readonly attribution: HintAttribution; readonly targetSquares: readonly string[]; readonly actor: HintPieceIdentity; readonly relation: HintRelation; readonly occurrencePly: 1 | 3; readonly firstMove: { readonly uci: string; readonly san: string } };

interface SearchedEdge {
  readonly ply: number;
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly mover: HintSide;
  readonly piece: { readonly role: HintRole; readonly from: string };
}

/** Thrown by the horizon computation when the sealed inputs are not one coherent edge. */
export class HintHorizonMismatch extends TypeError {
  constructor(message: string) {
    super(`HINT_HORIZON_IDENTITY: ${message}`);
    this.name = "HintHorizonMismatch";
  }
}

const canonical = (fen: string): string => canonicalFen(positionFromFen(fen));
const record = (value: unknown): Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Readonly<Record<string, unknown>> : {};

/** Replays the searched line (at most the four-ply scan ceiling); every move must be legal in sequence. */
export function searchedEdges(line: FixedBoundPrincipalVariation): { readonly rootFen: string; readonly rootSide: HintSide; readonly edges: readonly SearchedEdge[]; readonly firstSan: string | undefined } {
  const position = positionFromFen(line.fen);
  const rootFen = canonicalFen(position);
  const rootSide = position.turn;
  const edges: SearchedEdge[] = [];
  let firstSan: string | undefined;
  for (const [index, uci] of line.movesUci.slice(0, HINT_SCAN_PLIES).entries()) {
    const parsed = parseUci(uci);
    if (parsed === undefined || !("from" in parsed)) throw new HintHorizonMismatch(`searched move ${uci} is not a board move`);
    const move = normalizeMove(position, parsed);
    if (!("from" in move) || !position.isLegal(move)) throw new HintHorizonMismatch(`searched move ${uci} is illegal at ply ${index + 1}`);
    const piece = position.board.get(move.from)!;
    const beforeFen = canonicalFen(position);
    if (index === 0) firstSan = makeSan(position, move);
    const mover = position.turn;
    position.play(move);
    edges.push(Object.freeze({ ply: index + 1, beforeFen, moveUci: uci, afterFen: canonicalFen(position), mover, piece: Object.freeze({ role: piece.role, from: makeSquare(move.from) }) }));
  }
  return Object.freeze({ rootFen, rootSide, edges: Object.freeze(edges), firstSan });
}

function kingSquare(fen: string, color: HintSide): string {
  const square = positionFromFen(fen).board.kingOf(color);
  if (square === undefined) throw new HintHorizonMismatch(`no ${color} king after the searched edge`);
  return makeSquare(square);
}

function anchoredEdge(edge: SearchedEdge, beforeFen: unknown, moveUci: unknown, afterFen?: unknown): void {
  if (typeof beforeFen !== "string" || canonical(beforeFen) !== edge.beforeFen || moveUci !== edge.moveUci || (afterFen !== undefined && (typeof afterFen !== "string" || canonical(afterFen) !== edge.afterFen))) {
    throw new HintHorizonMismatch(`the family source is not evaluated at searched ply ${edge.ply}`);
  }
}

const sorted = (values: readonly string[]): readonly string[] => Object.freeze([...new Set(values)].sort());

interface FamilyMatch { readonly status: string; readonly actor: HintPieceIdentity; readonly targets: readonly string[] }

/**
 * Family/status/sign admission at one exact edge (§1 table). Returns undefined for a correctly
 * anchored source whose status is not admitted (e.g. `loose_piece:gained`, non-persistent promotion);
 * throws for a source that belongs to a different edge.
 */
function familyMatch(family: HintFamily, edge: SearchedEdge, source: unknown): FamilyMatch | undefined {
  const mover: HintPieceIdentity = Object.freeze({ color: edge.mover, role: edge.piece.role, square: edge.piece.from });
  switch (family) {
    case "mate_in_one": {
      const reading = source as MateInOneReading;
      if (typeof reading.fen !== "string" || canonical(reading.fen) !== edge.beforeFen) throw new HintHorizonMismatch("the mate reading is not the searched edge's before position");
      const mate = reading.mates.find((candidate) => candidate.moveUci === edge.moveUci);
      return mate === undefined ? undefined : Object.freeze({ status: "exact", actor: mover, targets: sorted([mate.matedKing.square]) });
    }
    case "forced_mate": {
      const proof = source as ForcedMateAfterMoveProof;
      anchoredEdge(edge, proof.beforeFen, proof.candidate, proof.afterFen);
      if (proof.proofStatus !== "proved" || proof.attacker !== edge.mover) return undefined;
      return Object.freeze({ status: "proved", actor: mover, targets: sorted([kingSquare(edge.afterFen, edge.mover === "white" ? "black" : "white")]) });
    }
    case "double_attack": {
      const event = source as DoubleAttackEvent;
      anchoredEdge(edge, event.beforeFen, event.moveUci, event.afterFen);
      if (event.mover.piece.color !== edge.mover) return undefined;
      return Object.freeze({ status: "gained", actor: mover, targets: sorted(event.targets.map((target) => target.square)) });
    }
    case "fork_survives_reply": {
      const result = source as ForkSurvivalResult;
      anchoredEdge(edge, result.doubleAttack.beforeFen, result.doubleAttack.moveUci, result.doubleAttack.afterFen);
      if (!result.matched || result.doubleAttack.mover.piece.color !== edge.mover) return undefined;
      return Object.freeze({ status: "matched", actor: mover, targets: sorted(result.doubleAttack.targets.map((target) => target.square)) });
    }
    case "discovered_executed": {
      const event = source as DiscoveredExecutedEvent;
      anchoredEdge(edge, event.beforeFen, event.moveUci, event.afterFen);
      if (event.screen.piece.color !== edge.mover) return undefined;
      return Object.freeze({ status: "gained", actor: mover, targets: sorted([event.target.square]) });
    }
    case "loose_piece": {
      const event = source as LoosePieceEvent;
      anchoredEdge(edge, event.beforeFen, event.moveUci, event.afterFen);
      // §1: only `lost` for a mover-owned previously en-prise piece; gained/preserved are refused.
      if (event.sign !== "lost" || event.mover.color !== edge.mover || !event.before.enPrise || event.after.enPrise || event.after.piece.occupant.color !== edge.mover) return undefined;
      return Object.freeze({ status: "lost", actor: mover, targets: sorted([event.before.piece.square]) });
    }
    case "promotion_pressure": {
      const reading = source as PromotionPressureReading;
      if (typeof reading.fen !== "string" || canonical(reading.fen) !== edge.afterFen) throw new HintHorizonMismatch("the promotion reading is not the searched edge's after position");
      const pawn = [...reading.pawns]
        .filter((candidate) => candidate.pawn.piece.color === edge.mover
          && candidate.passAvailability.kind === "available" && candidate.passAvailability.value
          && candidate.replyPersistence.kind === "available" && candidate.replyPersistence.value)
        .sort((left, right) => left.pawn.square.localeCompare(right.pawn.square))[0];
      if (pawn === undefined) return undefined;
      return Object.freeze({ status: "available:true|available:true", actor: Object.freeze({ color: edge.mover, role: "pawn" as const, square: pawn.pawn.square }), targets: sorted([pawn.promotionSquare]) });
    }
  }
}

/**
 * The horizon value: one family source joined to one searched edge. Only the root side's own ply 1
 * or 3 is admissible (§2); an opponent-line edge is refused before any status is read.
 */
export function hintHorizonOccurrence(family: HintFamily, delivery: ProviderEvidenceDelivery<FixedBoundPrincipalVariation, "stockfish.principal_variation@1">, source: unknown, ply: 1 | 3): HintHorizonOccurrence | undefined {
  const line = delivery.payload;
  const replay = searchedEdges(line);
  const edge = replay.edges[ply - 1];
  if (edge === undefined) throw new HintHorizonMismatch(`the searched line has no ply ${ply}`);
  if (edge.mover !== replay.rootSide) throw new HintHorizonMismatch("an opponent-line edge cannot carry a root hint");
  const match = familyMatch(family, edge, record(source) === source ? source : {});
  if (match === undefined) return undefined;
  const row = hintDeclarationRow(family);
  const acquisition = delivery.acquisition as unknown as { readonly normalizedRequestDigest: string; readonly responseDigest: string };
  return Object.freeze({
    family,
    sourceRole: row.role,
    source: Object.freeze({ projection: `${row.source.id}@${row.source.version}`, status: row.status }),
    relation: ply === 1 ? "root_direct" as const : "root_followup_in_line" as const,
    occurrencePly: ply,
    rootSide: replay.rootSide,
    edgeSide: edge.mover,
    signOrStatus: match.status,
    actor: match.actor,
    targetSquares: match.targets,
    firstMove: Object.freeze({ uci: replay.edges[0]!.moveUci, san: replay.firstSan! }),
    search: Object.freeze({
      fen: replay.rootFen,
      engine: Object.freeze({ id: line.engine.id, name: line.engine.name, version: line.engine.version }),
      bound: line.bound,
      scannedPlies: replay.edges.length,
      normalizedRequestDigest: acquisition.normalizedRequestDigest,
      responseDigest: acquisition.responseDigest,
    }),
  });
}

function boundLabel(bound: FixedBoundPrincipalVariation["bound"]): string {
  switch (bound.kind) {
    case "depth": return `depth ${bound.requestedDepth}`;
    case "movetime": return `${bound.requestedMs} ms`;
    case "nodes": return `${bound.requestedNodes} nodes`;
  }
}

/** §3: the redacted rung packet. Each arm is built field by field; nothing is spread from the horizon. */
export function hintDisclosurePayload(horizon: HintHorizonOccurrence, rung: HintRung): HintDisclosurePayload {
  const attribution: HintAttribution = Object.freeze({ engine: `${horizon.search.engine.name} ${horizon.search.engine.version}`, bound: boundLabel(horizon.search.bound) });
  const family = horizon.family;
  const targetSquares = Object.freeze([...horizon.targetSquares]);
  const actor = Object.freeze({ color: horizon.actor.color, role: horizon.actor.role, square: horizon.actor.square });
  switch (rung) {
    case "pattern": return Object.freeze({ rung, family, attribution });
    case "square": return Object.freeze({ rung, family, attribution, targetSquares });
    case "piece": return Object.freeze({ rung, family, attribution, targetSquares, actor });
    case "distance": return Object.freeze({ rung, family, attribution, targetSquares, actor, relation: horizon.relation, occurrencePly: horizon.occurrencePly });
    case "move": return Object.freeze({ rung, family, attribution, targetSquares, actor, relation: horizon.relation, occurrencePly: horizon.occurrencePly, firstMove: Object.freeze({ uci: horizon.firstMove.uci, san: horizon.firstMove.san }) });
  }
}
