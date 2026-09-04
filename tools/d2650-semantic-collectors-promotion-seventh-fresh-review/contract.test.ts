// DISPOSABLE seventh fresh-review falsifier for the held promotion pair. No production code.
import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  assertPromotionRaceTablebaseResult,
  createDerivedPawnPromotionRaceTablebaseV1Evidence,
  createExactLegalMoveFactoryReceipt,
  createExactLegalMovesEvidence,
  createLiveTablebaseSource,
  createPromotionRaceGeometryEvidence,
  createPromotionRaceGeometryFactoryReceipt,
  createPromotionRaceNoEvidenceResult,
  createPromotionRaceOutsideDomainResult,
  createPromotionRaceProviderInvocation,
  createPromotionRaceProviderUnavailableResult,
  createPromotionRaceTablebaseRequest,
  type CanonicalFullFen,
  type ExactLegalMove,
  type ProviderRequestDigest,
  type PromotionRaceGeometry,
} from "../d2603-semantic-collectors-promotion-sixth-author-repair/model.js";

const fen = "8/P7/8/8/8/8/7p/4K2k w - - 0 1" as CanonicalFullFen;
const digest = "sha256:review" as ProviderRequestDigest;
const moves = Object.freeze([
  Object.freeze({ uci: "a7a8b", from: "a7", to: "a8", role: "pawn", promotion: "bishop" }),
  Object.freeze({ uci: "a7a8n", from: "a7", to: "a8", role: "pawn", promotion: "knight" }),
  Object.freeze({ uci: "a7a8q", from: "a7", to: "a8", role: "pawn", promotion: "queen" }),
  Object.freeze({ uci: "a7a8r", from: "a7", to: "a8", role: "pawn", promotion: "rook" }),
] satisfies readonly ExactLegalMove[]);

function base() {
  const pawn = Object.freeze({ square: "a7", color: "white" as const, role: "pawn" as const });
  const geometry = Object.freeze({ fen, ordering: Object.freeze([Object.freeze({ arrivalPly: 1, pawns: Object.freeze([pawn]) })]) }) satisfies PromotionRaceGeometry;
  const geometryItem = createPromotionRaceGeometryEvidence(createPromotionRaceGeometryFactoryReceipt(geometry), geometry);
  const legalReceipt = createExactLegalMoveFactoryReceipt(fen, moves);
  const legalItem = createExactLegalMovesEvidence(legalReceipt, legalReceipt.map);
  const request = createPromotionRaceTablebaseRequest(fen);
  const invocation = createPromotionRaceProviderInvocation(request, digest, "success");
  const source = createLiveTablebaseSource(fen, { category: "win", dtz: 1, preciseDtz: 0, perspective: "side_to_move" }, invocation);
  return { geometry, geometryItem, legalItem, request, invocation, source };
}

describe("held promotion collectors seventh fresh review", () => {
  test("D2650 result constructors seal arbitrary mutable nested payloads", () => {
    const { request } = base();
    const domainInvocation = createPromotionRaceProviderInvocation(request, digest, "local_domain_result");
    const domain = { pieceCount: 8 };
    const outside = createPromotionRaceOutsideDomainResult(request, domainInvocation, domain);
    domain.pieceCount = 3;
    expect(() => assertPromotionRaceTablebaseResult(outside)).not.toThrow();
    expect((outside as any).source.pieceCount).toBe(3);

    const failureInvocation = createPromotionRaceProviderInvocation(request, digest, "source_failure");
    const failure = { reason: "offline" };
    const unavailable = createPromotionRaceProviderUnavailableResult(request, failureInvocation, failure);
    failure.reason = "invented";
    expect(() => assertPromotionRaceTablebaseResult(unavailable)).not.toThrow();
    expect((unavailable as any).providerFailure.reason).toBe("invented");

    const fakeGeometry = { kind: "forged-no-evidence" };
    const empty = createPromotionRaceNoEvidenceResult(request, fakeGeometry);
    fakeGeometry.kind = "mutated-after-seal";
    expect(() => assertPromotionRaceTablebaseResult(empty)).not.toThrow();
  });

  test("D2651 caller-minted receipts admit a dropped underpromotion and invented geometry", () => {
    const value = base();
    const dropped = Object.freeze(moves.slice(1));
    const legalReceipt = createExactLegalMoveFactoryReceipt(fen, dropped);
    const legalItem = createExactLegalMovesEvidence(legalReceipt, legalReceipt.map);
    const inventedGeometry = Object.freeze({ fen, ordering: Object.freeze([]) }) satisfies PromotionRaceGeometry;
    const geometryItem = createPromotionRaceGeometryEvidence(createPromotionRaceGeometryFactoryReceipt(inventedGeometry), inventedGeometry);
    const result = createDerivedPawnPromotionRaceTablebaseV1Evidence({ request: value.request, geometry: geometryItem, legalMoves: legalItem, source: value.source });
    expect(result.output.payload.immediatePromotion).toHaveLength(3);
    expect(result.output.payload.promotionFirst).toEqual([]);
  });

  test("D2652 source constructors admit values outside the real tablebase parser", () => {
    const value = base();
    const invalidSource = createLiveTablebaseSource(fen, {
      category: "mate" as never,
      dtz: Number.NaN,
      preciseDtz: undefined as never,
      perspective: "white" as never,
    }, value.invocation);
    const result = createDerivedPawnPromotionRaceTablebaseV1Evidence({ request: value.request, geometry: value.geometryItem, legalMoves: value.legalItem, source: invalidSource });
    expect(result.output.payload).toMatchObject({ category: "mate", perspective: "white" });
    expect(Number.isNaN(result.output.payload.dtz)).toBe(true);
  });

  test("D2653 author category vocabulary and request ABI differ from production/RFC authorities", () => {
    const model = readFileSync("tools/d2603-semantic-collectors-promotion-sixth-author-repair/model.ts", "utf8");
    const server = readFileSync("apps/server/src/tablebase.ts", "utf8");
    const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");
    expect(server).toContain('"syzygy-win"');
    expect(server).toContain('"cursed-win"');
    expect(model.match(/export type TablebaseCategory = ([^;]+);/u)?.[1]).toBe('"win" | "draw" | "loss" | "unknown"');
    expect(model).toMatch(/PromotionRaceTablebaseRequest \{\s+readonly fen:[\s\S]*readonly operation:/u);
    expect(rfc).toMatch(/interface PromotionRaceTablebaseRequest \{\s+readonly geometry:[\s\S]*readonly providerScope:[\s\S]*readonly signal:/u);
  });

  test("D2654 the advertised F1 factory emits no DeclaredEvidence identity or authority receipt", () => {
    const value = base();
    const result = createDerivedPawnPromotionRaceTablebaseV1Evidence({ request: value.request, geometry: value.geometryItem, legalMoves: value.legalItem, source: value.source });
    expect(result.output).toEqual({ payload: result.output.payload });
    expect(result.output).not.toHaveProperty("producer");
    expect(result.output).not.toHaveProperty("projection");
    expect(result.output).not.toHaveProperty("receipt");
  });
});
