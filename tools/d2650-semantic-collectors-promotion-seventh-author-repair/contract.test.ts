import { describe, expect, test } from "vitest";
import { assertDeclaredEvidence, declareEvidence } from "../../packages/runtime/src/evidence-contract.js";
import { TABLEBASE_CATEGORIES } from "../../apps/server/src/tablebase.js";
import {
  createRecordedTablebaseResultV1Evidence,
  createRulesMobilityReadingLegalMovesV1Evidence,
  createRulesPawnReadingContactsV1Evidence,
  makeSyzygyFailure,
  makeSyzygyLocalDomain,
  makeSyzygySuccess,
  type CanonicalFullFen,
  type ProviderRequestDigest,
} from "./authorities.js";
import {
  assertPromotionRaceGeometryCompletion,
  assertPromotionRaceTablebaseDerivation,
  assertPromotionRaceTablebaseResult,
  createDerivedPawnPromotionRaceTablebaseV1Evidence,
  createLiveTablebaseSource,
  createPromotionRaceNoEvidenceResult,
  createPromotionRaceOutsideDomainResult,
  createPromotionRaceProviderInvocation,
  createPromotionRaceProviderUnavailableResult,
  createPromotionRaceReadingResult,
  createPromotionRaceTablebaseRequest,
  createRecordedTablebaseSource,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
} from "./model.js";

const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const quietFen = "8/8/8/8/8/8/P7/4K2k w - - 0 1" as CanonicalFullFen;
const digest = "sha256:promotion-author" as ProviderRequestDigest;
const raw = (category: string = "win", dtz: unknown = 1, precise: unknown = 0) => ({
  category,
  dtz,
  precise_dtz: precise,
  moves: [],
});

function geometry(fen = raceFen) {
  const contacts = createRulesPawnReadingContactsV1Evidence(fen);
  const completion = derivePromotionRaceGeometry(contacts);
  if (completion.kind !== "completed" || completion.output.kind !== "evidence") throw new Error("expected geometry evidence");
  return { contacts, completion, item: completion.output.item };
}

function request(fen = raceFen) {
  const value = geometry(fen);
  const controller = new AbortController();
  const operation = createPromotionRaceTablebaseRequest(value.completion, { id: "review", budgetMs: 800 }, controller.signal);
  return { ...value, controller, operation, typed: makePromotionRaceSyzygyRequest(operation) };
}

describe("semantic collectors promotion seventh author repair", () => {
  test("D2650 every total arm retains exact immutable asserted operands", () => {
    const value = request();
    const local = makeSyzygyLocalDomain(value.typed, digest, 8);
    const localInvocation = createPromotionRaceProviderInvocation(value.typed, local);
    const outside = createPromotionRaceOutsideDomainResult(value.operation, value.item, localInvocation);
    expect(() => assertPromotionRaceTablebaseResult(outside)).not.toThrow();
    expect(Object.isFrozen(outside)).toBe(true);
    if (local.kind !== "local_domain_result") throw new Error("expected local-domain result");
    expect(Object.isFrozen(local.payload)).toBe(true);

    const failed = makeSyzygyFailure(value.typed, digest, "queue_full");
    const failedInvocation = createPromotionRaceProviderInvocation(value.typed, failed);
    const unavailable = createPromotionRaceProviderUnavailableResult(value.operation, value.item, failedInvocation);
    expect(() => assertPromotionRaceTablebaseResult(unavailable)).not.toThrow();
    expect(unavailable).toMatchObject({ providerReason: "queue_full" });

    const noRace = derivePromotionRaceGeometry(createRulesPawnReadingContactsV1Evidence(quietFen));
    expect(noRace.kind).toBe("completed");
    if (noRace.kind !== "completed") throw new Error("expected completion");
    expect(noRace.output.kind).toBe("no_evidence");
    const noRaceRequest = createPromotionRaceTablebaseRequest(noRace, { id: "review", budgetMs: 500 }, new AbortController().signal);
    const completed = createPromotionRaceNoEvidenceResult(noRaceRequest);
    expect(() => assertPromotionRaceTablebaseResult(completed)).not.toThrow();
    expect(() => createPromotionRaceNoEvidenceResult({ ...noRaceRequest, geometry: { ...noRace } } as never)).toThrow();
  });

  test("D2651 independent exact authorities refuse same-FEN forged geometry and legal maps", () => {
    const value = request();
    const legal = createRulesMobilityReadingLegalMovesV1Evidence(raceFen);
    const recorded = createRecordedTablebaseSource(createRecordedTablebaseResultV1Evidence(raceFen, raw()));
    const derivation = createDerivedPawnPromotionRaceTablebaseV1Evidence({ request: value.operation, geometry: value.item, legalMoves: legal, source: recorded });
    expect(derivation.output.payload.immediatePromotion.map((move) => move.promotion).sort()).toEqual(["bishop", "knight", "queen", "rook"]);

    const forgedLegal = declareEvidence({ id: "rules.mobility", version: 1 }, { id: "rules.mobility.reading.legal_moves", version: 1 }, { ...legal.payload, pieces: [] });
    expect(() => createDerivedPawnPromotionRaceTablebaseV1Evidence({ request: value.operation, geometry: value.item, legalMoves: forgedLegal as never, source: recorded })).toThrow("EXACT_LEGAL_MOVES_VALUE_RECEIPT_MISSING");
    const forgedGeometry = declareEvidence({ id: "derived.pawn", version: 1 }, { id: "derived.pawn.promotion_race_geometry", version: 1 }, { ...value.item.payload, ordering: [] });
    expect(() => createDerivedPawnPromotionRaceTablebaseV1Evidence({ request: value.operation, geometry: forgedGeometry as never, legalMoves: legal, source: recorded })).toThrow();
    expect(() => assertPromotionRaceGeometryCompletion({ ...value.completion })).toThrow("PROMOTION_GEOMETRY_COMPLETION_UNSEALED");
  });

  test("D2652 live parser covers the complete production category domain and rejects invalid values", () => {
    for (const category of TABLEBASE_CATEGORIES) {
      const value = request();
      const result = makeSyzygySuccess(value.typed, digest, raw(category));
      const invocation = createPromotionRaceProviderInvocation(value.typed, result);
      const source = createLiveTablebaseSource(invocation);
      const legal = createRulesMobilityReadingLegalMovesV1Evidence(raceFen);
      const derivation = createDerivedPawnPromotionRaceTablebaseV1Evidence({ request: value.operation, geometry: value.item, legalMoves: legal, source });
      expect(derivation.output.payload.category).toBe(category);
    }
    const value = request();
    expect(() => makeSyzygySuccess(value.typed, digest, raw("mate"))).toThrow();
    expect(() => makeSyzygySuccess(value.typed, digest, raw("win", Number.NaN))).toThrow();
  });

  test("D2653 the executable request and invocation preserve the RFC provider ABI", () => {
    const value = request();
    expect(value.operation).toMatchObject({ geometry: value.completion, providerScope: { id: "review", budgetMs: 800 }, signal: value.controller.signal });
    expect(value.typed).toEqual({ operation: "syzygy.position@1", request: { rules: "chess", variant: "standard", fen: raceFen, timeoutMs: 500 } });
    const rawPosition = raw();
    const result = makeSyzygySuccess(value.typed, digest, rawPosition);
    rawPosition.category = "loss";
    const invocation = createPromotionRaceProviderInvocation(value.typed, result);
    expect(invocation.result).toBe(result);
    expect(invocation.result.kind === "success" && invocation.result.delivery.payload.position.category).toBe("win");
    const crossed = request("8/7P/8/8/8/8/p7/4K2k b - - 0 1" as CanonicalFullFen);
    expect(() => createPromotionRaceProviderInvocation(crossed.typed, result)).toThrow("PROMOTION_PROVIDER_DELIVERY_CROSSED");
  });

  test("D2654 the sole output is declared F1 evidence with an exact value receipt", () => {
    const value = request();
    const legal = createRulesMobilityReadingLegalMovesV1Evidence(raceFen);
    const source = createRecordedTablebaseSource(createRecordedTablebaseResultV1Evidence(raceFen, raw("cursed-win", 5, null)));
    const derivation = createDerivedPawnPromotionRaceTablebaseV1Evidence({ request: value.operation, geometry: value.item, legalMoves: legal, source });
    expect(() => assertDeclaredEvidence(derivation.output)).not.toThrow();
    expect(derivation.output).toMatchObject({ producer: { id: "derived.pawn", version: 1 }, projection: { id: "derived.pawn.promotion_race_tablebase", version: 1 } });
    expect(derivation.valueReceipt).toMatchObject({ factory: "createDerivedPawnPromotionRaceTablebaseV1Evidence", output: derivation.output });
    expect(() => assertPromotionRaceTablebaseDerivation(derivation)).not.toThrow();
    const reading = createPromotionRaceReadingResult(value.operation, derivation);
    expect(() => assertPromotionRaceTablebaseResult(reading)).not.toThrow();
  });
});
