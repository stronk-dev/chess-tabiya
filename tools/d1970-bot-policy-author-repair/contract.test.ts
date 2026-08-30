import { describe, expect, it } from "vitest";

import {
  BOT_PROFILE_CATALOG,
  admitCandidatePopulation,
  assertBotPolicyDecisionRecord,
  beginBotOperation,
  commitBotOperation,
  compileBotPolicyExecution,
  deriveBotSourceView,
  deriveCandidateFeatureSubset,
  digest,
  makeBotRootAuthority,
  makeExactLegalMoveMap,
  parseBotOpponentPlyRequest,
  projectBotPolicyDecisionRecord,
  resolveBotProfile,
  saveReloadEnvelope,
  type BotOperationRootAuthority,
  type BotPolicyEventEnvelope,
  type BotRootIdentity,
  type Sha,
} from "./contract.js";
import { makeProviderDelivery, type ProviderScore, type TypedProviderResult } from
  "../d2056-provider-exchange-author-repair/shared-provider-contract.js";

const sha = (value: string): Sha => `sha256:${value.padEnd(64, "0").slice(0, 64)}`;
const rootIdentity = (overrides: Partial<BotRootIdentity> = {}): BotRootIdentity => ({
  runId: "run-1", branchId: "main", nodeId: "n-4", preCommitEventHeadDigest: sha("head"),
  beforeFenDigest: digest("fen-1"), historyDigest: digest(["e2e4", "e7e5"]), ...overrides,
});
const root = (overrides: Partial<BotRootIdentity> = {}): BotOperationRootAuthority => makeBotRootAuthority({
  identity: rootIdentity(overrides), beforeFen: "fen-1", startFen: "start-fen",
  historyUci: ["e2e4", "e7e5"], seed: 7,
});
const legal = (authority = root()) => makeExactLegalMoveMap(authority, ["a2a3", "a2a4", "b2b3"]);

const maiaResult = (authority = root(), mass = 0.99, moves = ["a2a3", "a2a4"]): TypedProviderResult<"maia.policy_page@1"> => {
  const payload = {
    request: { position: { kind: "history_conditioned" as const, startFen: authority.startFen, historyUci: authority.historyUci },
      requestedModel: { id: "maia2", version: "pinned" }, band: 1400, temperature: 1, topP: 1,
      requestedWidth: 20, timeoutMs: 400 }, appliedBand: 1400, temperature: 1, topP: 1,
    requestedWidth: 20, returnedWidth: moves.length, returnedProbabilityMass: mass,
    coverage: "bounded_top_k" as const,
    candidates: moves.map((moveUci, index) => ({ moveUci, probability: index === 0 ? mass * 0.7 : mass * 0.3 })),
  };
  const delivery = makeProviderDelivery({ operation: "maia.policy_page@1", provider: "maia",
    endpoint: { kind: "uci_supervisor", engineId: "maia-5m" }, requestedIdentity: { request: payload.request },
    actualIdentity: { id: "maia", kind: "opponent", name: "Maia", version: "pinned", modelId: "maia2",
      containerDigest: sha("maia-container"), seedHonored: false, eloHonored: true, optionImageDigest: sha("maia-options") },
    normalizedRequestDigest: sha("maia-request"), responseDigest: sha(`maia-${mass}`), payload });
  return Object.freeze({ kind: "success", operation: "maia.policy_page@1", normalizedRequestDigest: sha("maia-request"), delivery });
};

const stockfishResult = (authority = root(), scores: readonly ProviderScore[] = [
  { kind: "centipawns", value: 0 }, { kind: "centipawns", value: -300 }, { kind: "centipawns", value: 100 },
]): TypedProviderResult<"stockfish.legal_root_table@1"> => {
  const moves = ["a2a3", "a2a4", "b2b3"];
  const payload = { request: { fen: authority.beforeFen, bound: { kind: "depth" as const, value: 8 },
    requestedWidth: "all_legal" as const, moveIdentity: "chessops-king-takes-rook@1" as const,
    requestedEngine: { id: "stockfish", version: "18" }, timeoutMs: 500 }, scoreFrame: "root_side_to_move" as const,
    rows: moves.map((moveUci, index) => ({ moveUci, reachedDepth: 8, score: scores[index]!, pv: [moveUci] })) };
  const delivery = makeProviderDelivery({ operation: "stockfish.legal_root_table@1", provider: "stockfish",
    endpoint: { kind: "uci_supervisor", engineId: "stockfish-analysis" },
    requestedIdentity: { request: payload.request, command: { commands: ["position fen", "go depth 8"], commandsDigest: sha("commands") } },
    actualIdentity: { id: "stockfish-analysis", name: "Stockfish", version: "18", binaryDigest: sha("sf-bin"), uciOptionsDigest: sha("sf-options") },
    normalizedRequestDigest: sha("sf-request"),
    responseDigest: sha(`sf-${scores.map((score) => score.kind).join("-")}`), payload });
  return Object.freeze({ kind: "success", operation: "stockfish.legal_root_table@1", normalizedRequestDigest: sha("sf-request"), delivery });
};

const ready = (family: "human-baseline" | "guarded-human" | "pawn-forward" = "guarded-human",
  options: { mass?: number; stockfish?: TypedProviderResult<"stockfish.legal_root_table@1">; authority?: BotOperationRootAuthority } = {}) => {
  const authority = options.authority ?? root();
  const profile = resolveBotProfile(`${family}.1400@1`);
  const result = deriveBotSourceView({ root: authority, legal: legal(authority), profile,
    maia: maiaResult(authority, options.mass), ...(options.stockfish !== undefined ? { stockfish: options.stockfish } : {}) });
  if (result.kind !== "ready") throw new Error("expected ready source");
  return { authority, profile, source: result.source };
};

const committedEnvelope = (): { envelope: BotPolicyEventEnvelope; authority: BotOperationRootAuthority; request: ReturnType<typeof parseBotOpponentPlyRequest> } => {
  const value = ready("guarded-human", { stockfish: stockfishResult() });
  const decision = projectBotPolicyDecisionRecord(compileBotPolicyExecution({ source: value.source, profile: value.profile }));
  const request = parseBotOpponentPlyRequest({ requestId: "botreq_1234567890abcdef", expectedNodeId: "n-4",
    expectedBranchId: "main", expectedEventHeadDigest: sha("head") });
  const begun = beginBotOperation({ request, root: value.authority.identity, writerLeaseDigest: sha("lease"), profile: value.profile, seed: 7 });
  if (begun.kind !== "proceed") throw new Error("expected proceed");
  const committed = commitBotOperation({ request, currentRoot: value.authority, decision, writerLeaseDigest: sha("lease"),
    preProviderOperandDigest: begun.preProviderOperandDigest, eventSequence: 22,
    timingMs: { total: 120, maia: 40, guard: 70, composition: 10 } });
  if (committed.kind !== "committed") throw new Error("expected commit");
  return { envelope: committed.envelope, authority: value.authority, request };
};

describe("D2088 immutable family × band roster", () => {
  it("enumerates twelve distinct ids/digests and keeps bands distinct", () => {
    expect(BOT_PROFILE_CATALOG).toHaveLength(12);
    expect(new Set(BOT_PROFILE_CATALOG.map((entry) => entry.id))).toHaveLength(12);
    expect(new Set(BOT_PROFILE_CATALOG.map((entry) => entry.digest))).toHaveLength(12);
    expect(resolveBotProfile("human-baseline.1000@1").digest).not.toBe(resolveBotProfile("human-baseline.1400@1").digest);
  });
});

describe("D2089/D2093 exact shared delivery and independent baseline", () => {
  it("retains acquisition identity and selects baseline with no Stockfish result", () => {
    const value = ready("human-baseline");
    expect(value.source.maia.operation).toBe("maia.policy_page@1");
    expect(value.source.maia.provider).toBe("maia");
    expect(value.source.maia.responseDigest).toBe(sha("maia-0.99"));
    expect(value.source.guard).toEqual({ kind: "not_requested" });
    expect(compileBotPolicyExecution({ source: value.source, profile: value.profile }).chosenMoveUci).toMatch(/^[a-h][1-8][a-h][1-8]/u);
  });

  it("keeps guarded baseline bytes available when optional Stockfish fails", () => {
    const authority = root();
    const failure = Object.freeze({ kind: "source_failure" as const, operation: "stockfish.legal_root_table@1" as const,
      normalizedRequestDigest: sha("sf-request"), retryable: true as const, reason: "deadline" as const });
    const value = ready("guarded-human", { authority, stockfish: failure });
    expect(value.source.guard).toMatchObject({ kind: "abstained", reason: "guard_deadline" });
    expect(compileBotPolicyExecution({ source: value.source, profile: value.profile }).chosenMoveUci).toBeTruthy();
  });
});

describe("D2090/D2095 exact score algebra and all-legal reference", () => {
  it("uses the best legal move outside Maia and masks a severe Maia candidate", () => {
    const authority = root();
    const value = ready("guarded-human", { authority, stockfish: stockfishResult(authority) });
    expect(value.source.guard).toMatchObject({ kind: "applied", referenceMoveUci: "b2b3", referenceCp: 100 });
    const execution = compileBotPolicyExecution({ source: value.source, profile: value.profile });
    expect(execution.considered.find((row) => row.moveUci === "a2a4")?.guard).toMatchObject({ kind: "applied", lossCp: 400, admitted: false });
  });

  it("abstains the whole guard on mate and mixed domains without numeric loss", () => {
    const authority = root();
    const mate: ProviderScore = { kind: "mate", outcome: "root_mates", distance: 2, unit: "moves" };
    const allMate = ready("guarded-human", { authority, stockfish: stockfishResult(authority, [mate, mate, mate]) });
    expect(allMate.source.guard).toMatchObject({ kind: "abstained", reason: "guard_mate_domain" });
    const mixed = ready("guarded-human", { authority, stockfish: stockfishResult(authority, [mate,
      { kind: "centipawns", value: 10 }, { kind: "centipawns", value: 20 }]) });
    const execution = compileBotPolicyExecution({ source: mixed.source, profile: mixed.profile });
    expect(mixed.source.guard).toMatchObject({ kind: "abstained", reason: "guard_mixed_domain" });
    expect(execution.considered.every((row) => row.guard.kind !== "abstained" || !("lossCp" in row.guard))).toBe(true);
  });
});

describe("D2091 compiler-owned transforms and sample", () => {
  it("projects only a sealed execution and derives layers/weights/move itself", () => {
    const authority = root();
    const value = ready("pawn-forward", { authority, stockfish: stockfishResult(authority) });
    const execution = compileBotPolicyExecution({ source: value.source, profile: value.profile });
    expect(execution.layers).toContainEqual({ id: "trait.pawn_preference@1", action: "applied" });
    expect(execution.considered.some((row) => row.finalMass !== row.rawMass)).toBe(true);
    expect(execution.considered.some((row) => row.moveUci === execution.chosenMoveUci)).toBe(true);
    const decision = projectBotPolicyDecisionRecord(execution);
    expect(() => projectBotPolicyDecisionRecord({ ...execution })).toThrow(/unsealed/u);
    expect(() => assertBotPolicyDecisionRecord({ ...decision })).toThrow(/unsealed/u);
  });
});

describe("D2092/D2087 parsed idempotency and durable non-circular envelope", () => {
  it("refuses invalid ids and distinguishes writer/seed operands", () => {
    expect(() => parseBotOpponentPlyRequest({ requestId: "botreq_123", expectedNodeId: "n", expectedBranchId: "b", expectedEventHeadDigest: sha("h") })).toThrow(/invalid/u);
    const { envelope, authority, request } = committedEnvelope();
    const profile = resolveBotProfile("guarded-human.1400@1");
    expect(beginBotOperation({ request, root: authority.identity, writerLeaseDigest: sha("lease"), profile, seed: 7, previous: envelope }).kind).toBe("replayed_idempotent");
    expect(beginBotOperation({ request, root: authority.identity, writerLeaseDigest: sha("other-lease"), profile, seed: 7, previous: envelope }).kind).toBe("request_reused_with_different_operands");
    expect(beginBotOperation({ request, root: authority.identity, writerLeaseDigest: sha("lease"), profile, seed: 8, previous: envelope }).kind).toBe("request_reused_with_different_operands");
  });

  it("survives save/reload byte-identically and has no resulting-head self reference", () => {
    const { envelope } = committedEnvelope();
    const reloaded = saveReloadEnvelope(envelope);
    expect(reloaded).toEqual(envelope);
    expect(reloaded.operation).not.toHaveProperty("committedEventHeadDigest");
    expect(reloaded.operation.preProviderOperandDigest).toBeTruthy();
    expect(reloaded.operation.commitOperandDigest).toBeTruthy();
  });
});

describe("D2094 bounded-Maia Stage-B intersection", () => {
  it("retains only admitted Maia rows while preserving all-legal coverage", () => {
    const authority = root();
    const value = ready("human-baseline", { authority });
    const packet = admitCandidatePopulation({ root: authority.identity, legalMoves: ["a2a3", "a2a4", "b2b3"],
      rows: ["a2a3", "a2a4", "b2b3"].map((moveUci) => ({ moveUci,
        features: [{ id: "rules.exchange.predicate.legal_exchange@1" as const, value: false, sourceId: `source:${moveUci}` }] })) });
    const subset = deriveCandidateFeatureSubset({ packet, source: value.source });
    expect(subset.rows.map((row) => row.moveUci)).toEqual(["a2a3", "a2a4"]);
    expect(subset.omittedMoves).toEqual(["b2b3"]);
    expect(subset.allLegalCount).toBe(3);
    const execution = compileBotPolicyExecution({ source: value.source, profile: value.profile, featureSubset: subset });
    expect(execution.considered.every((row) => row.features.length === 1)).toBe(true);
    expect(() => deriveCandidateFeatureSubset({ packet: { ...packet }, source: value.source })).toThrow(/unadmitted/u);
  });
});

describe("D2096 honest below-floor behavior and base failure", () => {
  it("runs the same seeded sampler over a low-mass delivered page and records degradation", () => {
    const value = ready("human-baseline", { mass: 0.8 });
    const first = compileBotPolicyExecution({ source: value.source, profile: value.profile });
    const second = compileBotPolicyExecution({ source: value.source, profile: value.profile });
    expect(first.chosenMoveUci).toBe(second.chosenMoveUci);
    expect(first.layers[0]).toEqual({ id: "sampler.maia_reconstruction@1", action: "degraded", reason: "returned_mass_below_profile_floor" });
  });

  it("returns a typed no-move result when Maia is unavailable", () => {
    const authority = root();
    const unavailable = Object.freeze({ kind: "source_failure" as const, operation: "maia.policy_page@1" as const,
      normalizedRequestDigest: sha("maia-request"), retryable: true as const, reason: "unavailable" as const });
    expect(deriveBotSourceView({ root: authority, legal: legal(authority), profile: resolveBotProfile("human-baseline.1400@1"), maia: unavailable }))
      .toEqual({ kind: "base_provider_unavailable", reason: "unavailable", retryable: true });
  });
});
