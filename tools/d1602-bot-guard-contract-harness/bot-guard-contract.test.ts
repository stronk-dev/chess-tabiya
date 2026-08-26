import { describe, expect, it } from "vitest";

import {
  applyGuard,
  BOT_TRAIT_CLASSIFIERS,
  classifyBotTraits,
  compileGuardReceipt,
  composeGuardedPawnTrait,
  makeGuardRequest,
  STOCKFISH_GUARD_PROFILE,
  type GuardProviderResult,
  type GuardReceipt,
  type TraitView,
} from "./bot-guard-contract.js";

const ROOT = "r3k2r/ppp2ppp/2n5/8/8/2N5/PPP2PPP/R3K2R w KQkq - 0 1";
const MOVES = ["a2a3", "c3b5", "e1g1"] as const;

function request() {
  return makeGuardRequest({ fen: ROOT, history: ["e2e4", "e7e5"], candidateMoves: MOVES });
}

function complete(rows: GuardProviderResult extends infer _ ? readonly { moveUci: string; score: { kind: "cp"; value: number; bound: "exact" } }[] : never) {
  return { state: "complete" as const, elapsedMs: 91, rows };
}

describe("sealed whole-set bot guard receipt", () => {
  it("pins the dedicated request and derives loss internally in root-side cp", () => {
    const asked = request();
    expect(STOCKFISH_GUARD_PROFILE).toMatchObject({
      id: "stockfish-guard@1",
      engineVersion: "18",
      threads: 1,
      hashMb: 16,
      clearHashBeforeRequest: true,
      multiPv: "candidate_count",
      searchMoves: "exact_candidate_set",
      bound: { kind: "depth", value: 8 },
      scorePerspective: "root_side",
      scoreRows: "final_only",
    });
    const receipt = compileGuardReceipt(asked, complete([
      { moveUci: "a2a3", score: { kind: "cp", value: 34, bound: "exact" } },
      { moveUci: "c3b5", score: { kind: "cp", value: -260, bound: "exact" } },
      { moveUci: "e1g1", score: { kind: "cp", value: 20, bound: "exact" } },
    ]));
    expect(receipt).toMatchObject({ state: "applied", lossesCp: { a2a3: 0, c3b5: 294, e1h1: 14 } });
    expect(applyGuard({ receipt, request: asked, thresholdCp: 250 })).toEqual({
      state: "applied",
      admittedMoves: ["a2a3", "e1h1"],
    });
  });

  it.each([
    ["provider unavailable", { state: "provider_unavailable" as const }, "provider_unavailable"],
    ["deadline", { state: "deadline_exceeded" as const, elapsedMs: 501 }, "deadline_exceeded"],
    ["missing row", complete([
      { moveUci: "a2a3", score: { kind: "cp", value: 1, bound: "exact" } },
      { moveUci: "c3b5", score: { kind: "cp", value: 0, bound: "exact" } },
    ]), "missing_row"],
    ["duplicate row", complete([
      { moveUci: "a2a3", score: { kind: "cp", value: 1, bound: "exact" } },
      { moveUci: "a2a3", score: { kind: "cp", value: 0, bound: "exact" } },
      { moveUci: "e1g1", score: { kind: "cp", value: 0, bound: "exact" } },
    ]), "duplicate_row"],
  ])("abstains the whole guard on %s", (_label, provider, reason) => {
    const asked = request();
    const receipt = compileGuardReceipt(asked, provider);
    expect(applyGuard({ receipt, request: asked, thresholdCp: 250 })).toMatchObject({ state: "abstained", reason });
  });

  it("abstains on mixed domains and bounded rows instead of coercing them", () => {
    const asked = request();
    const mixed = compileGuardReceipt(asked, {
      state: "complete",
      elapsedMs: 10,
      rows: [
        { moveUci: "a2a3", score: { kind: "cp", value: 1, bound: "exact" } },
        { moveUci: "c3b5", score: { kind: "mate", plies: 3, bound: "exact" } },
        { moveUci: "e1g1", score: { kind: "cp", value: 0, bound: "exact" } },
      ],
    });
    const bounded = compileGuardReceipt(asked, {
      state: "complete",
      elapsedMs: 10,
      rows: [
        { moveUci: "a2a3", score: { kind: "cp", value: 1, bound: "lower" } },
        { moveUci: "c3b5", score: { kind: "cp", value: 0, bound: "exact" } },
        { moveUci: "e1g1", score: { kind: "cp", value: 0, bound: "exact" } },
      ],
    });
    expect(mixed).toMatchObject({ state: "abstained", reason: "mixed_score_domain" });
    expect(bounded).toMatchObject({ state: "abstained", reason: "bounded_row" });
  });

  it("rejects forged receipts and refuses a receipt for another history", () => {
    const asked = request();
    const forged = {
      state: "applied",
      root: asked.root,
      candidateMoves: asked.candidateMoves,
      profile: asked.profile,
      lossesCp: { a2a3: 0, c3b5: 0, e1h1: 0 },
    } as unknown as GuardReceipt;
    expect(() => applyGuard({ receipt: forged, request: asked, thresholdCp: 250 })).toThrow(/unsealed/u);

    const receipt = compileGuardReceipt(asked, complete([
      { moveUci: "a2a3", score: { kind: "cp", value: 1, bound: "exact" } },
      { moveUci: "c3b5", score: { kind: "cp", value: 0, bound: "exact" } },
      { moveUci: "e1g1", score: { kind: "cp", value: 0, bound: "exact" } },
    ]));
    const other = makeGuardRequest({ fen: ROOT, history: ["d2d4"], candidateMoves: MOVES });
    expect(applyGuard({ receipt, request: other, thresholdCp: 250 })).toMatchObject({ state: "abstained", reason: "root_mismatch" });
  });
});

describe("registered board-derived trait dependency", () => {
  it("keeps the classifier registry set-equal and classifies hard board boundaries", () => {
    expect(Object.keys(BOT_TRAIT_CLASSIFIERS)).toEqual(["pawn_move@1"]);
    expect(new Set(Object.values(BOT_TRAIT_CLASSIFIERS))).toEqual(new Set(["pawn_move"]));

    const view = classifyBotTraits({ fen: ROOT, candidateMoves: MOVES });
    expect(view.byMove).toEqual({ a2a3: ["pawn_move"], c3b5: [], e1h1: [] });

    const promotion = classifyBotTraits({
      fen: "7k/P7/8/8/8/8/8/7K w - - 0 1",
      candidateMoves: ["a7a8q"],
    });
    const capture = classifyBotTraits({
      fen: "7k/8/8/8/8/1p6/P7/7K w - - 0 1",
      candidateMoves: ["a2b3"],
    });
    expect(promotion.byMove.a7a8q).toEqual(["pawn_move"]);
    expect(capture.byMove.a2b3).toEqual(["pawn_move"]);
  });

  it("applies pawn weighting only after guard success", () => {
    const asked = request();
    const traits = classifyBotTraits({ fen: ROOT, candidateMoves: MOVES });
    const baseMasses = { a2a3: 0.25, c3b5: 0.25, e1h1: 0.5 };
    const receipt = compileGuardReceipt(asked, complete([
      { moveUci: "a2a3", score: { kind: "cp", value: 20, bound: "exact" } },
      { moveUci: "c3b5", score: { kind: "cp", value: -300, bound: "exact" } },
      { moveUci: "e1g1", score: { kind: "cp", value: 10, bound: "exact" } },
    ]));
    const applied = composeGuardedPawnTrait({
      baseMasses,
      guard: applyGuard({ receipt, request: asked, thresholdCp: 250 }),
      traits,
      multiplier: 4,
    });
    expect(applied).toMatchObject({
      masses: { a2a3: 2 / 3, c3b5: 0, e1h1: 1 / 3 },
      guard: { action: "applied" },
      trait: { action: "applied" },
    });

    for (const provider of [
      { state: "provider_unavailable" as const },
      { state: "deadline_exceeded" as const, elapsedMs: 501 },
    ]) {
      const abstained = applyGuard({ receipt: compileGuardReceipt(asked, provider), request: asked, thresholdCp: 250 });
      expect(composeGuardedPawnTrait({ baseMasses, guard: abstained, traits, multiplier: 4 })).toEqual({
        masses: baseMasses,
        guard: { action: "abstained", reason: provider.state },
        trait: { action: "abstained", reason: "guard_dependency_unmet" },
      });
    }
  });

  it("records empty-mask dependency failure and rejects caller-forged trait values", () => {
    const asked = request();
    const receipt = compileGuardReceipt(asked, complete([
      { moveUci: "a2a3", score: { kind: "cp", value: 1, bound: "exact" } },
      { moveUci: "c3b5", score: { kind: "cp", value: 0, bound: "exact" } },
      { moveUci: "e1g1", score: { kind: "cp", value: 0, bound: "exact" } },
    ]));
    const empty = applyGuard({ receipt, request: asked, thresholdCp: 0 });
    const traits = classifyBotTraits({ fen: ROOT, candidateMoves: MOVES });
    expect(composeGuardedPawnTrait({
      baseMasses: { a2a3: 0.25, c3b5: 0.25, e1h1: 0.5 },
      guard: empty,
      traits,
      multiplier: 4,
    })).toMatchObject({
      guard: { action: "abstained", reason: "empty_after_mask" },
      trait: { action: "abstained", reason: "guard_dependency_unmet" },
    });

    const forged = { ...traits, byMove: { ...traits.byMove, c3b5: ["pawn_move"] } } as unknown as TraitView;
    expect(() => composeGuardedPawnTrait({
      baseMasses: { a2a3: 0.25, c3b5: 0.25, e1h1: 0.5 },
      guard: empty,
      traits: forged,
      multiplier: 4,
    })).toThrow(/unsealed/u);
  });
});
