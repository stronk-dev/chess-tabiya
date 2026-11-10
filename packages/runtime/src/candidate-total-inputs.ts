// Accepted subject-safe-semantic-selection §§3–5.1. Existing total source facts for an owned
// root/child position. No new evidence issuer, alternative enumerator or strategic judgement.
import type { StructuralFeature } from "@chess-tabiya/schema/drill-pack";
import { normalizeMove } from "chessops/chess";
import type { Color, NormalMove, Role } from "chessops/types";
import { makeSquare, parseUci } from "chessops/util";
import { assertDeclaredEvidence, evidenceValueReceipt, type DeclaredEvidence } from "./evidence-contract.js";
import type { SliderIdentity } from "./foundation-slider-sources.js";
import { positionFromFen } from "./position-cache.js";
import type { SquareControlReading } from "./square-control.js";
import type { StructuralObservation } from "./structure.js";
import { originalPiecePositions } from "./foundation-piece-lineage.js";
import { evidenceFactorySymbol, invokeEvidenceValueRoute, readLocalReadingInvocation,
  readMoverPieceRiskInvocation, readStructuralPopulationInvocation, readStructuralPredicateInvocation } from "./internal/evidence-value-routes.js";

type MoverPieceRiskFactoryResult = Parameters<typeof readMoverPieceRiskInvocation>[0];
type TotalFeature = Extract<StructuralFeature, { kind: "king_zone" | "passed_pawn" }>;
type PredicateSource<K extends TotalFeature["kind"]> = DeclaredEvidence<{
  readonly fen: string; readonly feature: Extract<TotalFeature, { kind: K }>; readonly matched: boolean;
}>;
type AnyPredicateSource = DeclaredEvidence<{ readonly fen: string; readonly feature: StructuralFeature; readonly matched: boolean }>;
export type TotalPieceCountSource = DeclaredEvidence<StructuralObservation & {
  readonly kind: "piece_count"; readonly color: Color; readonly role: Role; readonly count: number;
}>;
type PawnIdentity = SliderIdentity & { readonly role: "pawn" };
type PawnLineage =
  | { readonly kind: "present"; readonly root: PawnIdentity; readonly current: PawnIdentity }
  | { readonly kind: "promoted"; readonly root: PawnIdentity; readonly current: SliderIdentity }
  | { readonly kind: "removed"; readonly root: PawnIdentity };
export type CandidatePassedPawnInput =
  | (Extract<PawnLineage, { kind: "present" }> & { readonly source: PredicateSource<"passed_pawn"> })
  | Exclude<PawnLineage, { kind: "present" }>;
export interface CandidateTotalInputs {
  readonly control: DeclaredEvidence<SquareControlReading>;
  readonly counts: readonly TotalPieceCountSource[];
  readonly kingZones: readonly [PredicateSource<"king_zone">, PredicateSource<"king_zone">, PredicateSource<"king_zone">, PredicateSource<"king_zone">];
  /** Complete original pawn domain in root-square order, including removed/promoted subjects. */
  readonly pawns: readonly CandidatePassedPawnInput[];
}

const COLORS = ["white", "black"] as const;
const ROLES = ["pawn", "knight", "bishop", "rook", "queen", "king"] as const;
const KING_FEATURES = [
  { kind: "king_zone", color: "white", zone: "edge" },
  { kind: "king_zone", color: "white", zone: "corner" },
  { kind: "king_zone", color: "black", zone: "edge" },
  { kind: "king_zone", color: "black", zone: "corner" },
] as const;

function predicate(fen: string, feature: Extract<TotalFeature, { kind: "king_zone" }>): PredicateSource<"king_zone">;
function predicate(fen: string, feature: Extract<TotalFeature, { kind: "passed_pawn" }>): PredicateSource<"passed_pawn">;
function predicate(fen: string, feature: TotalFeature): PredicateSource<TotalFeature["kind"]> {
  const route = feature.kind === "king_zone" ? "rules.structural.predicate.king_zone@1" : "rules.structural.predicate.passed_pawn@1";
  const source = invokeEvidenceValueRoute(route, { fen, feature });
  assertPredicate(source, fen, feature);
  return source;
}

function assertPredicate(source: AnyPredicateSource, fen: string, feature: TotalFeature): asserts source is PredicateSource<TotalFeature["kind"]> {
  assertDeclaredEvidence(source);
  const route = `rules.structural.predicate.${feature.kind}@1`, original = readStructuralPredicateInvocation(source);
  const expected = Object.entries(feature), actual = original.feature;
  if (`${source.projection.id}@${source.projection.version}` !== route || evidenceValueReceipt(source).factory !== evidenceFactorySymbol(route)
    || original.fen !== fen || source.payload.fen !== fen || original.sources.length !== 0
    || typeof source.payload.matched !== "boolean" || source.payload.feature !== actual
    || Object.keys(actual).length !== expected.length
    || expected.some(([key, value]) => Reflect.get(actual, key) !== value)) {
    throw new TypeError("Candidate total predicate crosses its original position/subject/parameters");
  }
}

function assertCounts(items: readonly DeclaredEvidence<StructuralObservation>[], fen: string): asserts items is readonly TotalPieceCountSource[] {
  readStructuralPopulationInvocation(items, "rules.structural.reading.piece_count@1", fen);
  const seen = new Set<string>();
  if (items.length !== 12) throw new TypeError("Candidate piece counts require all twelve original slots");
  for (const { payload } of items) {
    const key = `${payload.color}:${payload.role}`;
    if (payload.kind !== "piece_count" || !COLORS.includes(payload.color as Color) || !ROLES.includes(payload.role as Role)
      || !Number.isSafeInteger(payload.count) || payload.count! < 0 || seen.has(key)) {
      throw new TypeError("Candidate piece counts lost a complete color/role slot");
    }
    seen.add(key);
  }
}

/** The actual original risk invocation already authenticates the full legal edge (even when
 * evaluation is unavailable). Follow physical pawn identities, never role occupancy alone. */
function pawnLineage(risk: MoverPieceRiskFactoryResult): readonly PawnLineage[] {
  const original = readMoverPieceRiskInvocation(risk);
  const root = positionFromFen(original.root.payload.fen), current = positionFromFen(original.position.payload.fen);
  let move: NormalMove | null = null;
  if (original.moveUci !== null) {
    const parsed = parseUci(original.moveUci);
    if (parsed === undefined || !("from" in parsed)) throw new TypeError("Original pawn lineage requires its board move");
    const normalized = normalizeMove(root, parsed);
    if (!("from" in normalized)) throw new TypeError("Original pawn lineage requires its physical board move");
    move = normalized;
  }
  return Object.freeze(originalPiecePositions(root, current, move).flatMap((row): readonly PawnLineage[] => {
    if (row.root.role !== "pawn") return [];
    const identity: PawnIdentity = Object.freeze({ ...row.root, role: "pawn" });
    if (row.current === null) return [Object.freeze({ kind: "removed", root: identity })];
    if (row.current.role === "pawn") return [Object.freeze({ kind: "present", root: identity,
      current: Object.freeze({ ...row.current, role: "pawn" }) })];
    return [Object.freeze({ kind: "promoted", root: identity, current: row.current })];
  }));
}

function sameIdentity(left: SliderIdentity, right: SliderIdentity): boolean {
  return left.color === right.color && left.role === right.role && left.square === right.square;
}

/** Collect only registered source values, retaining original collection order and explicit false.
 * The supplied control source is the SAME one already retained by the child reading compiler. */
export function collectCandidateTotalInputs(risk: MoverPieceRiskFactoryResult, control: DeclaredEvidence<SquareControlReading>): CandidateTotalInputs {
  const fen = readMoverPieceRiskInvocation(risk).position.payload.fen;
  const counts = invokeEvidenceValueRoute("rules.structural.reading.piece_count@1", { fen });
  assertCounts(counts, fen);
  const pawns = Object.freeze(pawnLineage(risk).map(row => row.kind !== "present" ? row : Object.freeze({ ...row,
    source: predicate(fen, { kind: "passed_pawn", color: row.current.color, square: row.current.square }),
  })));
  return Object.freeze({ control, counts, pawns,
    kingZones: Object.freeze([predicate(fen, KING_FEATURES[0]), predicate(fen, KING_FEATURES[1]),
      predicate(fen, KING_FEATURES[2]), predicate(fen, KING_FEATURES[3])] as const),
  });
}

/** Nonminting admission for the exact finite complements captured by the existing owner. */
export function assertCandidateTotalInputs(value: CandidateTotalInputs, risk: MoverPieceRiskFactoryResult): void {
  const fen = readMoverPieceRiskInvocation(risk).position.payload.fen;
  const control = value.control, invocation = readLocalReadingInvocation(control);
  if (control.projection.id !== "rules.square.reading.control" || control.projection.version !== 1
    || evidenceValueReceipt(control).factory !== evidenceFactorySymbol("rules.square.reading.control@1")
    || invocation.kind !== "fen" || invocation.fen !== fen || control.payload.fen !== fen
    || control.payload.colors.length !== 2 || control.payload.colors.some((row, index) => row.color !== COLORS[index]
      || row.pseudo.length !== 64 || row.pseudo.some((square, at) => square.target !== makeSquare(at)))) {
    throw new TypeError("Candidate square control is not its original complete position source");
  }
  assertCounts(value.counts, fen);
  if (value.kingZones.length !== 4) throw new TypeError("Candidate king zones require all four original total predicates");
  value.kingZones.forEach((source, index) => assertPredicate(source, fen, KING_FEATURES[index]!));
  const expected = pawnLineage(risk);
  if (value.pawns.length !== expected.length) throw new TypeError("Candidate passed-pawn inputs lost the original pawn domain");
  value.pawns.forEach((row, index) => {
    const subject = expected[index]!;
    if (row.kind !== subject.kind || !sameIdentity(row.root, subject.root)
      || row.kind !== "removed" && (subject.kind === "removed" || !sameIdentity(row.current, subject.current))) {
      throw new TypeError("Candidate passed-pawn inputs cross original pawn lifecycle/order");
    }
    if (row.kind === "present") assertPredicate(row.source, fen, { kind: "passed_pawn", color: row.current.color, square: row.current.square });
    else if (Object.hasOwn(row, "source")) throw new TypeError("Removed/promoted pawns cannot acquire a false passed predicate");
  });
}
