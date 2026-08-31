import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  BOT_CLASSIFIER_IDS,
  BOT_DEGRADATION_REASONS,
  BOT_LAYER_IDS,
  BOT_MAIA_MODEL_ID,
  BOT_MAIA_SOURCE_VERSION,
  BOT_PROFILE_CATALOG,
  BOT_PROFILE_CATALOG_DIGEST,
  BOT_PROFILE_CATALOG_HEAD,
  admitCandidatePopulation,
  assertBotLayerAction,
  assertBotPolicyDecisionRecord,
  assertPersistedProviderInput,
  beginBotOperation,
  botOpponentPlyResult,
  commitBotOperation,
  compileLegalBoardClassifiers,
  compileBotPolicyExecution,
  deriveBotSourceView,
  deriveCandidateFeatureSubset,
  digest,
  makeBotRootAuthority,
  makeExactLegalMoveMap,
  parseBotOpponentPlyResult,
  parseBotOpponentPlyRequest,
  profileAvailability,
  projectBotPolicyDecisionRecord,
  resolveBotProfile,
  saveReloadEnvelope,
  type BotOperationRootAuthority,
  type BotPolicyEventEnvelope,
  type BotRootIdentity,
  type Sha,
} from "./contract.js";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import { makeProviderDelivery, type ProviderScore, type TypedProviderResult } from
  "../d2056-provider-exchange-author-repair/shared-provider-contract.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const sha = (value: string): Sha => `sha256:${value.padEnd(64, "0").slice(0, 64)}`;
const rootIdentity = (overrides: Partial<BotRootIdentity> = {}): BotRootIdentity => ({
  runId: "run-1", branchId: "main", nodeId: "n-4", preCommitEventHeadDigest: sha("head"),
  beforeFenDigest: digest(START_FEN), historyDigest: digest([]), ...overrides,
});
const root = (overrides: Partial<BotRootIdentity> = {}): BotOperationRootAuthority => makeBotRootAuthority({
  identity: rootIdentity(overrides), beforeFen: START_FEN, startFen: START_FEN,
  historyUci: [], seed: 7,
});
const rootForFen = (beforeFen: string, suffix = "position"): BotOperationRootAuthority => makeBotRootAuthority({
  identity: rootIdentity({ nodeId: `n-${suffix}`, beforeFenDigest: digest(beforeFen), historyDigest: digest([]) }),
  beforeFen, startFen: beforeFen, historyUci: [], seed: 7,
});
const legal = (authority = root()) => makeExactLegalMoveMap(authority, exactLegalMoves(authority.beforeFen).map((move) => move.uci));

type MaiaOverrides = Readonly<{
  requestedModelId?: string;
  requestedModelVersion?: string;
  actualModelId?: string;
  actualModelVersion?: string;
  band?: number;
  temperature?: number;
  topP?: number;
  requestedWidth?: number;
  moves?: readonly string[];
  responseTag?: string;
}>;

const maiaResult = (authority = root(), mass = 0.99, overrides: MaiaOverrides = {}): TypedProviderResult<"maia.policy_page@1"> => {
  const moves = overrides.moves ?? ["a2a3", "a2a4"];
  const temperature = overrides.temperature ?? 0.8;
  const topP = overrides.topP ?? 0.92;
  const requestedWidth = overrides.requestedWidth ?? 20;
  const band = overrides.band ?? 1400;
  const payload = {
    request: { position: { kind: "history_conditioned" as const, startFen: authority.startFen, historyUci: authority.historyUci },
      requestedModel: { id: overrides.requestedModelId ?? BOT_MAIA_MODEL_ID,
        version: overrides.requestedModelVersion ?? BOT_MAIA_SOURCE_VERSION },
      band, temperature, topP, requestedWidth, timeoutMs: 400 }, appliedBand: band, temperature, topP,
    requestedWidth, returnedWidth: moves.length, returnedProbabilityMass: mass,
    coverage: "bounded_top_k" as const,
    candidates: moves.map((moveUci, index) => ({ moveUci, probability: index === 0 ? mass * 0.7 : mass * 0.3 })),
  };
  const delivery = makeProviderDelivery({ operation: "maia.policy_page@1", provider: "maia",
    endpoint: { kind: "uci_supervisor", engineId: "maia-5m" }, requestedIdentity: { request: payload.request },
    actualIdentity: { id: "maia-5m", kind: "opponent", name: "Maia3",
      version: overrides.actualModelVersion ?? BOT_MAIA_SOURCE_VERSION,
      modelId: overrides.actualModelId ?? BOT_MAIA_MODEL_ID,
      containerDigest: sha("maia-container"), seedHonored: false, eloHonored: true, optionImageDigest: sha("maia-options") },
    normalizedRequestDigest: sha("maia-request"), responseDigest: sha(`maia-${mass}-${overrides.responseTag ?? "base"}`), payload });
  return Object.freeze({ kind: "success", operation: "maia.policy_page@1", normalizedRequestDigest: sha("maia-request"), delivery });
};

const stockfishResult = (authority = root(), scoreFor: (moveUci: string) => ProviderScore = (moveUci) =>
  ({ kind: "centipawns", value: moveUci === "b2b3" ? 100 : moveUci === "a2a4" ? -300 : 0 })):
  TypedProviderResult<"stockfish.legal_root_table@1"> => {
  const moves = exactLegalMoves(authority.beforeFen).map((move) => move.uci);
  const payload = { request: { fen: authority.beforeFen, bound: { kind: "depth" as const, value: 8 },
    requestedWidth: "all_legal" as const, moveIdentity: "chessops-king-takes-rook@1" as const,
    requestedEngine: { id: "stockfish", version: "18" }, timeoutMs: 500 }, scoreFrame: "root_side_to_move" as const,
    rows: moves.map((moveUci) => ({ moveUci, reachedDepth: 8, score: scoreFor(moveUci), pv: [moveUci] })) };
  const delivery = makeProviderDelivery({ operation: "stockfish.legal_root_table@1", provider: "stockfish",
    endpoint: { kind: "uci_supervisor", engineId: "stockfish-analysis" },
    requestedIdentity: { request: payload.request, command: { commands: ["position fen", "go depth 8"], commandsDigest: sha("commands") } },
    actualIdentity: { id: "stockfish-analysis", name: "Stockfish", version: "18", binaryDigest: sha("sf-bin"), uciOptionsDigest: sha("sf-options") },
    normalizedRequestDigest: sha("sf-request"),
    responseDigest: sha(`sf-${digest(payload.rows)}`), payload });
  return Object.freeze({ kind: "success", operation: "stockfish.legal_root_table@1", normalizedRequestDigest: sha("sf-request"), delivery });
};

const ready = (family: "human-baseline" | "guarded-human" | "pawn-forward" = "guarded-human",
  options: { mass?: number; maia?: TypedProviderResult<"maia.policy_page@1">;
    stockfish?: TypedProviderResult<"stockfish.legal_root_table@1">; authority?: BotOperationRootAuthority } = {}) => {
  const authority = options.authority ?? root();
  const profile = resolveBotProfile(`${family}.1400@1`);
  const legalMap = legal(authority);
  const classifiers = compileLegalBoardClassifiers(authority, legalMap);
  const result = deriveBotSourceView({ root: authority, legal: legalMap, classifiers, profile,
    maia: options.maia ?? maiaResult(authority, options.mass), ...(options.stockfish !== undefined ? { stockfish: options.stockfish } : {}) });
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
    expect(value.source.maia.delivery.acquisition.provider).toBe("maia");
    expect(value.source.maia.delivery.acquisition.responseDigest).toBe(sha("maia-0.99-base"));
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
    const allMate = ready("guarded-human", { authority, stockfish: stockfishResult(authority, () => mate) });
    expect(allMate.source.guard).toMatchObject({ kind: "abstained", reason: "guard_mate_domain" });
    const mixed = ready("guarded-human", { authority, stockfish: stockfishResult(authority, (moveUci) => moveUci === "a2a3"
      ? mate : { kind: "centipawns", value: moveUci === "b2b3" ? 20 : 10 }) });
    const execution = compileBotPolicyExecution({ source: mixed.source, profile: mixed.profile });
    expect(mixed.source.guard).toMatchObject({ kind: "abstained", reason: "guard_mixed_domain" });
    expect(execution.considered.every((row) => row.guard.kind !== "abstained" || !("lossCp" in row.guard))).toBe(true);
  });

  it("records empty-after-mask as abstained in both the layer and every considered row", () => {
    const authority = root();
    const value = ready("guarded-human", { authority, stockfish: stockfishResult(authority, (moveUci) =>
      ({ kind: "centipawns", value: moveUci === "b2b3" ? 500 : 0 })) });
    const execution = compileBotPolicyExecution({ source: value.source, profile: value.profile });
    expect(execution.layers).toContainEqual({ id: "guard.severe_error@1", action: "abstained", reason: "empty_after_mask" });
    expect(execution.considered.every((row) => row.guard.kind === "abstained" && row.guard.reason === "empty_after_mask")).toBe(true);
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
    const legalMoves = exactLegalMoves(authority.beforeFen).map((move) => move.uci);
    const packet = admitCandidatePopulation({ root: authority.identity, legalMoves,
      rows: legalMoves.map((moveUci) => ({ moveUci,
        features: [{ id: "rules.exchange.predicate.legal_exchange@1" as const, value: false, sourceId: `source:${moveUci}` }] })) });
    const subset = deriveCandidateFeatureSubset({ packet, source: value.source });
    expect(subset.rows.map((row) => row.moveUci)).toEqual(["a2a3", "a2a4"]);
    expect(subset.omittedMoves).toHaveLength(18);
    expect(subset.allLegalCount).toBe(20);
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
    const legalMap = legal(authority);
    const unavailable = Object.freeze({ kind: "source_failure" as const, operation: "maia.policy_page@1" as const,
      normalizedRequestDigest: sha("maia-request"), retryable: true as const, reason: "unavailable" as const });
    expect(deriveBotSourceView({ root: authority, legal: legalMap, classifiers: compileLegalBoardClassifiers(authority, legalMap),
      profile: resolveBotProfile("human-baseline.1400@1"), maia: unavailable }))
      .toEqual({ kind: "base_provider_unavailable", reason: "unavailable", retryable: true });
  });
});

describe("D2219 exact sampler declaration and captured positive control", () => {
  it("pins one model/sampler/layer declaration for every profile identity", () => {
    expect(BOT_PROFILE_CATALOG_HEAD).toBe(1);
    expect(BOT_PROFILE_CATALOG_DIGEST).toBe(digest(BOT_PROFILE_CATALOG));
    for (const profile of BOT_PROFILE_CATALOG) {
      expect(profile.model).toEqual({ id: BOT_MAIA_MODEL_ID, version: BOT_MAIA_SOURCE_VERSION });
      expect(profile.sampler).toEqual({ temperature: 0.8, topP: 0.92, requestedWidth: 20, returnedMassFloor: 0.97 });
      expect(profile.orderedLayers).toEqual(profile.family === "human-baseline"
        ? ["sampler.maia_reconstruction@1"]
        : profile.family === "guarded-human"
          ? ["sampler.maia_reconstruction@1", "guard.severe_error@1"]
          : ["sampler.maia_reconstruction@1", "guard.severe_error@1", "trait.pawn_preference@1"]);
    }
  });

  it("runs the committed 837-cell captured-production positive control", () => {
    const artifact = JSON.parse(readFileSync("planning/platform-alignment/bot-policy/results.json", "utf8")) as {
      parameters: { productionTemperature: number; productionTopP: number };
      population: { cells: number };
      summary: Record<string, { expectedLossCp: number; severe250: number }>;
    };
    const captured = artifact.summary.current_sample!;
    const reconstructed = artifact.summary.production_sampler!;
    const raw = artifact.summary.maia_raw_policy!;
    expect(artifact.population.cells).toBe(837);
    expect([artifact.parameters.productionTemperature, artifact.parameters.productionTopP]).toEqual([0.8, 0.92]);
    expect(Math.abs(reconstructed.expectedLossCp - captured.expectedLossCp)).toBeLessThan(0.3);
    expect(Math.abs(reconstructed.severe250 - captured.severe250)).toBeLessThan(0.0005);
    expect(Math.abs(raw.expectedLossCp - captured.expectedLossCp)).toBeGreaterThan(30);
  });

  it.each([
    ["temperature", { temperature: 1 }],
    ["top-p", { topP: 1 }],
    ["requested model id", { requestedModelId: "maia-other" }],
    ["requested model version", { requestedModelVersion: "other" }],
    ["actual model version", { actualModelVersion: "other" }],
    ["band", { band: 1800 }],
    ["width", { requestedWidth: 8 }],
  ] as const)("refuses a mismatched %s", (_name, overrides) => {
    const authority = root();
    expect(() => ready("human-baseline", { authority, maia: maiaResult(authority, 0.99, overrides) })).toThrow(/profile\/source mismatch/u);
  });
});

describe("D2220 exact legal-board pawn classifier", () => {
  const classified = (fen: string, suffix: string) => {
    const authority = rootForFen(fen, suffix);
    const legalMap = legal(authority);
    return compileLegalBoardClassifiers(authority, legalMap).rows;
  };

  it("covers both colours, captures, en-passant, and all promotion identities", () => {
    const white = classified(START_FEN, "white").filter((row) => row.classifiers.includes("pawn_move@1"));
    const black = classified("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1", "black")
      .filter((row) => row.classifiers.includes("pawn_move@1"));
    expect(white).toHaveLength(16);
    expect(black).toHaveLength(16);
    expect(white.map((row) => row.moveUci)).toContain("h2h4");
    expect(black.map((row) => row.moveUci)).toContain("h7h5");

    const capture = classified("4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1", "capture");
    expect(capture.find((row) => row.moveUci === "e4d5")?.classifiers).toEqual(["pawn_move@1"]);
    const enPassant = classified("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "en-passant");
    expect(enPassant.find((row) => row.moveUci === "e5d6")?.classifiers).toEqual(["pawn_move@1"]);
    const promotions = classified("4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "promotion")
      .filter((row) => row.moveUci.startsWith("a7a8"));
    expect(promotions.map((row) => row.moveUci).sort()).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
    expect(promotions.every((row) => row.classifiers.includes("pawn_move@1"))).toBe(true);
  });

  it("keeps every non-pawn legal move, including castling, as a hard negative", () => {
    const rows = classified("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "castling");
    expect(rows.some((row) => row.moveUci === "e1h1" || row.moveUci === "e1g1")).toBe(true);
    expect(rows.filter((row) => row.role !== "pawn").every((row) => row.classifiers.length === 0)).toBe(true);
  });
});

describe("D2221 retained provider delivery authority", () => {
  it("persists the exact admitted deliveries through decision save/reload", () => {
    const { envelope } = committedEnvelope();
    const reloaded = saveReloadEnvelope(envelope);
    expect(reloaded.decision.sources.maia.delivery).toEqual(envelope.decision.sources.maia.delivery);
    expect(reloaded.decision.sources.stockfish?.delivery).toEqual(envelope.decision.sources.stockfish?.delivery);
    expect(reloaded.operation.providerDeliveryDigests).toEqual([
      envelope.decision.sources.maia.deliveryDigest,
      envelope.decision.sources.stockfish?.deliveryDigest,
    ]);
  });

  it("rejects a copied or mutated delivery that no longer matches its receipt digest", () => {
    const input = ready("human-baseline").source.maia;
    const tampered = JSON.parse(JSON.stringify(input)) as typeof input;
    (tampered.delivery.payload.candidates[0] as { probability: number }).probability = 0.01;
    expect(() => assertPersistedProviderInput(tampered)).toThrow(/persisted provider input mismatch/u);
  });
});

describe("D2222 provider-health joined roster availability", () => {
  const snapshot = (maia: "available" | "requestable_unverified" | "cached_exact_only" | "unavailable",
    stockfish?: "available" | "requestable_unverified" | "cached_exact_only" | "unavailable") => ({
    revision: 9,
    instances: [
      { instanceId: "maia-inference" as const, generation: "maia-g1", state: maia === "requestable_unverified" ? "unverified" as const
        : maia === "cached_exact_only" ? "degraded_cached_only" as const : maia },
      ...(stockfish === undefined ? [] : [{ instanceId: "stockfish-play" as const, generation: "sf-g1",
        state: stockfish === "requestable_unverified" ? "unverified" as const
          : stockfish === "cached_exact_only" ? "degraded_cached_only" as const : stockfish }]),
    ],
    operations: [
      { operationId: "maia.policy_page@1" as const, availability: maia === "unavailable"
        ? { state: "unavailable" as const, instanceIds: ["maia-inference" as const], reason: "provider_off" }
        : { state: maia, instanceIds: ["maia-inference" as const] } },
      ...(stockfish === undefined ? [] : [{ operationId: "stockfish.legal_root_table@1" as const,
        availability: stockfish === "unavailable"
          ? { state: "unavailable" as const, instanceIds: ["stockfish-play" as const], reason: "provider_off" }
          : { state: stockfish, instanceIds: ["stockfish-play" as const] } }]),
    ],
  });
  const receipt = { catalogDigest: BOT_PROFILE_CATALOG_DIGEST, maiaGeneration: "maia-g1",
    stockfishGeneration: "sf-g1", guardComplete: true } as const;

  it("keeps baseline independent and requires a matching guard release receipt", () => {
    expect(profileAvailability(resolveBotProfile("human-baseline.1400@1"), snapshot("available"))).toEqual({ kind: "available", snapshotRevision: 9 });
    expect(profileAvailability(resolveBotProfile("human-baseline.1400@1"), snapshot("requestable_unverified")))
      .toEqual({ kind: "available", snapshotRevision: 9 });
    expect(profileAvailability(resolveBotProfile("human-baseline.1400@1"), snapshot("cached_exact_only")))
      .toEqual({ kind: "available", snapshotRevision: 9 });
    expect(profileAvailability(resolveBotProfile("guarded-human.1400@1"), snapshot("available")))
      .toEqual({ kind: "unavailable", reason: "guard_provider_unavailable" });
    expect(profileAvailability(resolveBotProfile("guarded-human.1400@1"), snapshot("available", "available")))
      .toEqual({ kind: "unavailable", reason: "release_receipt_missing_or_stale" });
    expect(profileAvailability(resolveBotProfile("guarded-human.1400@1"), snapshot("available", "available"), receipt))
      .toEqual({ kind: "available", snapshotRevision: 9 });
    expect(profileAvailability(resolveBotProfile("guarded-human.1400@1"), snapshot("available", "available"),
      { ...receipt, stockfishGeneration: "sf-stale" })).toEqual({ kind: "unavailable", reason: "release_receipt_missing_or_stale" });
  });
});

describe("D2223 closed opponent-ply result protocol", () => {
  it("maps and parses every public status/error/action arm", () => {
    const { envelope } = committedEnvelope();
    const inputs = [
      { kind: "committed" as const, envelope },
      { kind: "replayed_idempotent" as const, envelope },
      { kind: "replayed_concurrent_winner" as const, envelope },
      { kind: "stale_root" as const },
      { kind: "request_reused_with_different_operands" as const },
      { kind: "concurrent_commit_conflict" as const },
      { kind: "base_provider_unavailable" as const },
      { kind: "provider_failed" as const },
    ];
    const results = inputs.map((input) => botOpponentPlyResult(input));
    expect(results.map((result) => result.status)).toEqual([200, 200, 200, 409, 409, 409, 503, 502]);
    for (const result of results) expect(parseBotOpponentPlyResult(JSON.parse(JSON.stringify(result)))).toEqual(result);
    const tampered = { ...results[3], status: 200 };
    expect(() => parseBotOpponentPlyResult(tampered)).toThrow(/invalid bot result/u);
  });
});

describe("D2224/D2225 registered catalog and closed decision grammar", () => {
  it("has one exact shared catalog authority and no undeclared enum members", () => {
    expect(BOT_PROFILE_CATALOG.map((profile) => profile.id)).toEqual([
      "human-baseline.1000@1", "human-baseline.1400@1", "human-baseline.1800@1", "human-baseline.2200@1",
      "guarded-human.1000@1", "guarded-human.1400@1", "guarded-human.1800@1", "guarded-human.2200@1",
      "pawn-forward.1000@1", "pawn-forward.1400@1", "pawn-forward.1800@1", "pawn-forward.2200@1",
    ]);
    expect(BOT_LAYER_IDS).toEqual(["sampler.maia_reconstruction@1", "guard.severe_error@1", "trait.pawn_preference@1"]);
    expect(BOT_CLASSIFIER_IDS).toEqual(["pawn_move@1"]);
    expect(BOT_DEGRADATION_REASONS).toContain("guard_dependency_abstained");
  });

  it("rejects unknown and semantically impossible layer actions", () => {
    expect(() => assertBotLayerAction({ id: "trait.unknown@1", action: "applied" })).toThrow(/invalid bot layer action/u);
    expect(() => assertBotLayerAction({ id: "trait.pawn_preference@1", action: "degraded", reason: "guard_dependency_abstained" }))
      .toThrow(/invalid bot layer action/u);
    expect(() => assertBotLayerAction({ id: "sampler.maia_reconstruction@1", action: "applied", reason: "returned_mass_below_profile_floor" }))
      .toThrow(/invalid bot layer action/u);
  });
});

describe("D2226 pre-provider retry and serialized concurrent commit", () => {
  it("replays an exact prior request before providers regardless of later provider state", () => {
    const { envelope, authority, request } = committedEnvelope();
    const profile = resolveBotProfile("guarded-human.1400@1");
    expect(beginBotOperation({ request, root: authority.identity, writerLeaseDigest: sha("lease"), profile, seed: 7, previous: envelope }))
      .toEqual({ kind: "replayed_idempotent", envelope });
    expect(profileAvailability(profile, { revision: 10, instances: [
      { instanceId: "maia-inference", generation: "later", state: "unavailable" },
      { instanceId: "stockfish-play", generation: "later", state: "unavailable" },
    ], operations: [
      { operationId: "maia.policy_page@1", availability: { state: "unavailable", instanceIds: ["maia-inference"], reason: "provider_off" } },
      { operationId: "stockfish.legal_root_table@1", availability: { state: "unavailable", instanceIds: ["stockfish-play"], reason: "provider_off" } },
    ] })).toEqual({ kind: "unavailable", reason: "maia_unavailable" });
  });

  it("replays a byte-identical concurrent winner and conflicts on changed delivered bytes", () => {
    const { envelope, authority, request } = committedEnvelope();
    const rootAfterWinner = root({ nodeId: "n-5", preCommitEventHeadDigest: sha("advanced-head") });
    const same = commitBotOperation({ request, currentRoot: rootAfterWinner, decision: envelope.decision,
      writerLeaseDigest: sha("lease"), preProviderOperandDigest: envelope.operation.preProviderOperandDigest,
      eventSequence: 23, timingMs: { total: 121, maia: 41, guard: 70, composition: 10 }, existingAtCommit: envelope });
    expect(same).toEqual({ kind: "replayed_concurrent_winner", envelope });

    const changedReady = ready("guarded-human", { authority, stockfish: stockfishResult(authority),
      maia: maiaResult(authority, 0.99, { responseTag: "changed-provider-bytes" }) });
    const changedDecision = projectBotPolicyDecisionRecord(compileBotPolicyExecution({ source: changedReady.source, profile: changedReady.profile }));
    const changed = commitBotOperation({ request, currentRoot: rootAfterWinner, decision: changedDecision,
      writerLeaseDigest: sha("lease"), preProviderOperandDigest: envelope.operation.preProviderOperandDigest,
      eventSequence: 23, timingMs: { total: 121, maia: 41, guard: 70, composition: 10 }, existingAtCommit: envelope });
    expect(changed).toEqual({ kind: "concurrent_commit_conflict" });
  });
});
