// DISPOSABLE eighth fresh-review falsifier for the held promotion pair. No production code.
import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import {
  createRecordedTablebaseResultV1Evidence,
  createRulesMobilityReadingLegalMovesV1Evidence,
  createRulesPawnReadingContactsV1Evidence,
  makeSyzygyFailure,
  makeSyzygyLocalDomain,
  makeSyzygySuccess,
  type CanonicalFullFen,
  type ProviderRequestDigest,
} from "../d2650-semantic-collectors-promotion-seventh-author-repair/authorities.js";
import {
  createDerivedPawnPromotionRaceTablebaseV1Evidence,
  createLiveTablebaseSource,
  createPromotionRaceOutsideDomainResult,
  createPromotionRaceProviderInvocation,
  createPromotionRaceProviderUnavailableResult,
  createPromotionRaceTablebaseRequest,
  createRecordedTablebaseSource,
  derivePromotionRaceGeometry,
  makePromotionRaceSyzygyRequest,
} from "../d2650-semantic-collectors-promotion-seventh-author-repair/model.js";

const raceFen = "8/7P/8/8/8/8/p7/4K2k w - - 0 1" as CanonicalFullFen;
const otherFen = "8/7P/8/8/8/8/p7/4K2k b - - 0 1" as CanonicalFullFen;
const digest = "sha256:eighth-review" as ProviderRequestDigest;

const raw = (overrides: Readonly<Record<string, unknown>> = {}) => ({
  category: "win",
  dtz: 1,
  precise_dtz: 0,
  moves: [],
  ...overrides,
});
function operation(fen = raceFen, budgetMs = 800) {
  const contacts = createRulesPawnReadingContactsV1Evidence(fen);
  const geometry = derivePromotionRaceGeometry(contacts);
  if (geometry.kind !== "completed" || geometry.output.kind !== "evidence") {
    throw new Error("expected promotion geometry evidence");
  }
  const request = createPromotionRaceTablebaseRequest(
    geometry,
    { id: "eighth-review", budgetMs },
    new AbortController().signal,
  );
  return {
    geometry,
    item: geometry.output.item,
    request,
    typed: makePromotionRaceSyzygyRequest(request),
  };
}

describe("held promotion collectors eighth fresh review", () => {
  test("D2693 the author model omits the RFC's collector transaction", () => {
    const model = readFileSync("tools/d2650-semantic-collectors-promotion-seventh-author-repair/model.ts", "utf8");
    const rfc = readFileSync("rfc/semantic-collectors.md", "utf8");
    expect(rfc).toContain("collectPromotionRaceTablebase(request, dependencies)");
    expect(model).not.toMatch(/function collectPromotionRaceTablebase/u);
    expect(model).not.toMatch(/recordedLookup|resolveLegalMoves|scheduler\.get/u);
  });

  test("D2694 caller-written malformed request digests become sealed invocation identity", () => {
    const value = operation();
    const malformed = "sha256:not-a-64-character-lowercase-hex-digest" as ProviderRequestDigest;
    const result = makeSyzygySuccess(value.typed, malformed, raw());
    const invocation = createPromotionRaceProviderInvocation(value.typed, result);
    expect(invocation.requestDigest).toBe(malformed);
  });

  test("D2695 local-domain and failure results cross between different FEN requests", () => {
    const left = operation();
    const right = operation(otherFen);

    const domain = makeSyzygyLocalDomain(right.typed, digest, 8);
    const domainInvocation = createPromotionRaceProviderInvocation(left.typed, domain);
    expect(() => createPromotionRaceOutsideDomainResult(left.request, left.item, domainInvocation)).not.toThrow();

    const failure = makeSyzygyFailure(right.typed, digest, "queue_full");
    const failureInvocation = createPromotionRaceProviderInvocation(left.typed, failure);
    expect(() => createPromotionRaceProviderUnavailableResult(left.request, left.item, failureInvocation)).not.toThrow();
  });

  test("D2696 success crosses equal-FEN requests whose normalized timeout differs", () => {
    const short = operation(raceFen, 100);
    const long = operation(raceFen, 800);
    expect(short.typed.request.timeoutMs).toBe(100);
    expect(long.typed.request.timeoutMs).toBe(500);
    const result = makeSyzygySuccess(short.typed, digest, raw());
    expect(() => createPromotionRaceProviderInvocation(long.typed, result)).not.toThrow();
  });

  test("D2697 the recorded source is minted directly from caller tablebase JSON", () => {
    const value = operation();
    const recordedEvidence = createRecordedTablebaseResultV1Evidence(raceFen, raw({ category: "loss", dtz: -7 }));
    expect(recordedEvidence.payload).toHaveProperty("position.category", "loss");
    expect(recordedEvidence.payload).not.toHaveProperty("recordEvidence");
    expect(recordedEvidence.payload).not.toHaveProperty("sourceDigest");

    const source = createRecordedTablebaseSource(recordedEvidence);
    const legalMoves = createRulesMobilityReadingLegalMovesV1Evidence(raceFen);
    const derived = createDerivedPawnPromotionRaceTablebaseV1Evidence({
      request: value.request,
      geometry: value.item,
      legalMoves,
      source,
    });
    expect(derived.output.payload.category).toBe("loss");
  });

  test("D2698 the live source admits provider moves never validated against its FEN", () => {
    const value = operation();
    const result = makeSyzygySuccess(value.typed, digest, raw({
      moves: [{ uci: "a7a9q", san: "Qa9", category: "win", dtz: 1, precise_dtz: 0 }],
    }));
    const invocation = createPromotionRaceProviderInvocation(value.typed, result);
    const source = createLiveTablebaseSource(invocation);
    expect((source as any).evidence.payload.payload.position.moves[0].uci).toBe("a7a9q");
  });

  test("D2699 the typed unavailable geometry arm has no authority or total-result path", () => {
    const unsealedGeometry = {
      kind: "unavailable" as const,
      reason: "input_abstained" as const,
      missing: ["contacts"] as const,
      upstreamReason: "not_collected" as const,
    };
    const request = createPromotionRaceTablebaseRequest(
      unsealedGeometry,
      { id: "eighth-review", budgetMs: 500 },
      new AbortController().signal,
    );
    expect(request.geometry).toBe(unsealedGeometry);

    const model = readFileSync("tools/d2650-semantic-collectors-promotion-seventh-author-repair/model.ts", "utf8");
    expect(model).not.toMatch(/createPromotionRaceInputAbstainedResult/u);
  });

  test("D2700 live evidence is minted by a local adapter instead of the exact provider source factory", () => {
    const model = readFileSync("tools/d2650-semantic-collectors-promotion-seventh-author-repair/model.ts", "utf8");
    expect(model).toMatch(/declareEvidence\(\s*\{ id: "live\.syzygy"/u);
    expect(model).not.toMatch(/sourceFactories\["syzygy\.position@1"\]\.make/u);
  });
});
