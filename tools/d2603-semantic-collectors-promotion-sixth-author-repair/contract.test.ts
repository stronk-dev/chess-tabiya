import { describe, expect, test } from "vitest";
import {
  assertPromotionRaceTablebaseResult,
  createDerivedPawnPromotionRaceTablebaseV1Evidence,
  createExactLegalMoveFactoryReceipt,
  createExactLegalMovesEvidence,
  createLiveTablebaseSource,
  createPromotionRaceGeometryEvidence,
  createPromotionRaceGeometryFactoryReceipt,
  createPromotionRaceOutsideDomainResult,
  createPromotionRaceProviderInvocation,
  createPromotionRaceProviderUnavailableResult,
  createPromotionRaceReadingResult,
  createPromotionRaceTablebaseRequest,
  type CanonicalFullFen,
  type ExactLegalMove,
  type PawnIdentity,
  type ProviderRequestDigest,
  type PromotionRaceGeometry,
} from "./model.js";

const fenA = "8/P7/8/8/8/8/7p/4K2k w - - 0 1" as CanonicalFullFen;
const fenB = "8/P7/8/8/8/8/7p/4K2k b - - 0 1" as CanonicalFullFen;
const digest = "sha256:a" as ProviderRequestDigest;
const whitePawn = Object.freeze({ square: "a7", color: "white", role: "pawn" }) satisfies PawnIdentity;
const blackPawn = Object.freeze({ square: "h2", color: "black", role: "pawn" }) satisfies PawnIdentity;
const promotionMoves = Object.freeze([
  Object.freeze({ uci: "a7a8b", from: "a7", to: "a8", role: "pawn", promotion: "bishop" }),
  Object.freeze({ uci: "a7a8n", from: "a7", to: "a8", role: "pawn", promotion: "knight" }),
  Object.freeze({ uci: "a7a8q", from: "a7", to: "a8", role: "pawn", promotion: "queen" }),
  Object.freeze({ uci: "a7a8r", from: "a7", to: "a8", role: "pawn", promotion: "rook" }),
] satisfies readonly ExactLegalMove[]);

const fixture = (fen = fenA) => {
  const geometry = Object.freeze({
    fen,
    ordering: Object.freeze([Object.freeze({ arrivalPly: 1, pawns: Object.freeze([whitePawn, blackPawn]) })]),
  }) satisfies PromotionRaceGeometry;
  const geometryReceipt = createPromotionRaceGeometryFactoryReceipt(geometry);
  const geometryItem = createPromotionRaceGeometryEvidence(geometryReceipt, geometry);
  const legalReceipt = createExactLegalMoveFactoryReceipt(fen, promotionMoves);
  const legalItem = createExactLegalMovesEvidence(legalReceipt, legalReceipt.map);
  const request = createPromotionRaceTablebaseRequest(fen);
  const invocation = createPromotionRaceProviderInvocation(request, digest, "success");
  const source = createLiveTablebaseSource(fen, { category: "win", dtz: 1, preciseDtz: 0, perspective: "side_to_move" }, invocation);
  const derivation = createDerivedPawnPromotionRaceTablebaseV1Evidence({ request, geometry: geometryItem, legalMoves: legalItem, source });
  return { geometry, geometryReceipt, geometryItem, legalReceipt, legalItem, request, invocation, source, derivation };
};

describe("semantic collectors promotion sixth author repair", () => {
  test("D2604 one registered factory owns the exact reading and every outcome field", () => {
    const { derivation, source } = fixture();
    expect(derivation.output.payload).toMatchObject({ category: "win", dtz: 1, preciseDtz: 0, perspective: "side_to_move" });
    expect(derivation.output.payload.source).toBe(source);
  });

  test("D2605 total results reject plain, spread, serialized and crossed arms", () => {
    const first = fixture();
    const second = fixture(fenB);
    const reading = createPromotionRaceReadingResult(first.request, first.derivation);
    expect(() => assertPromotionRaceTablebaseResult(reading)).not.toThrow();
    for (const forged of [{ ...reading }, structuredClone(reading), JSON.parse(JSON.stringify(reading))]) {
      expect(() => assertPromotionRaceTablebaseResult(forged)).toThrow("PROMOTION_RESULT_UNSEALED");
    }
    expect(() => createPromotionRaceReadingResult(second.request, first.derivation)).toThrow("READING_RESULT_CROSSING");
    const domainInvocation = createPromotionRaceProviderInvocation(first.request, digest, "local_domain_result");
    expect(() => createPromotionRaceOutsideDomainResult(second.request, domainInvocation, Object.freeze({ pieceCount: 8 }))).toThrow("DOMAIN_RESULT_CROSSING");
    const failureInvocation = createPromotionRaceProviderInvocation(first.request, digest, "source_failure");
    expect(() => createPromotionRaceProviderUnavailableResult(second.request, failureInvocation, Object.freeze({ reason: "offline" }))).toThrow("PROVIDER_RESULT_CROSSING");
  });

  test("D2606 category, DTZ, precise DTZ, FEN and perspective are exact source projections", () => {
    const item = fixture().derivation.output.payload;
    expect(item).toMatchObject({ fen: fenA, category: "win", dtz: 1, preciseDtz: 0, perspective: "side_to_move" });
    const crossed = fixture(fenB);
    expect(() => createDerivedPawnPromotionRaceTablebaseV1Evidence({ ...crossed.derivation, request: createPromotionRaceTablebaseRequest(fenA) })).toThrow("PROMOTION_INPUT_FEN_MISMATCH");
  });

  test("D2607 exact legal map refuses dropped, added, reordered, rebuilt and cross-FEN inputs", () => {
    const value = fixture();
    const changed = [
      value.legalReceipt.map.moves.slice(1),
      [...value.legalReceipt.map.moves, Object.freeze({ uci: "h2h1q", from: "h2", to: "h1", role: "pawn", promotion: "queen" as const })],
      [...value.legalReceipt.map.moves].reverse(),
      value.legalReceipt.map.moves.map((move) => Object.freeze({ ...move })),
    ];
    for (const moves of changed) {
      expect(() => createExactLegalMovesEvidence(value.legalReceipt, Object.freeze({ fen: fenA, moves: Object.freeze(moves) }))).toThrow("LEGAL_MAP_FACTORY_MISMATCH");
    }
    const other = fixture(fenB);
    expect(() => createDerivedPawnPromotionRaceTablebaseV1Evidence({ ...value.derivation, legalMoves: other.legalItem })).toThrow("PROMOTION_INPUT_FEN_MISMATCH");
  });

  test("D2607 every tied pawn and underpromotion survives by object identity", () => {
    const output = fixture().derivation.output.payload;
    expect(output.immediatePromotion).toHaveLength(4);
    for (const move of promotionMoves) expect(output.immediatePromotion).toContain(move);
    expect(output.promotionFirst).toEqual([whitePawn, blackPawn]);
    expect(output.promotionFirst[0]).toBe(whitePawn);
    expect(output.promotionFirst[1]).toBe(blackPawn);
  });
});
