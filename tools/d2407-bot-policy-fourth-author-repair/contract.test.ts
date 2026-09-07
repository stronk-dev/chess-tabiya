// DISPOSABLE fourth bot-policy author repair — D2407-D2411. Not production code.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { reconstructMaiaDistribution } from "../../apps/server/src/bot-policy-catalog.js";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import {
  BOT_MAIA_MODEL_ID,
  BOT_MAIA_SOURCE_VERSION,
  beginBotOperation,
  commitBotOperation,
  compileLegalBoardClassifiers,
  compileBotPolicyExecution,
  deriveBotSourceView,
  digest,
  makeBotRootAuthority,
  makeBotPolicyReplayAuthority,
  makeExactLegalMoveMap,
  parseBotOpponentPlyRequest,
  parseBotPolicyEventEnvelope,
  profileAvailability,
  projectBotPolicyDecisionRecord,
  resolveBotProfile,
  type BotPolicyEventEnvelope,
  type BotRootIdentity,
  type Sha,
} from "../d1970-bot-policy-author-repair/contract.js";
import { makeProviderDelivery, type TypedProviderResult } from
  "../d2056-provider-exchange-author-repair/shared-provider-contract.js";
import {
  ExactCache,
  ExchangeAuthority,
  ProviderRegistry,
  cacheKey,
  compileApplications,
} from "../d2846-provider-health-seventh-author-repair/contract.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const sha = (value: string): Sha => digest(value);
const identity: BotRootIdentity = {
  runId: "run-fourth-author", branchId: "main", nodeId: "node-1",
  preCommitEventHeadDigest: sha("head"), beforeFenDigest: digest(START_FEN), historyDigest: digest([]),
};

type Timing = Readonly<{ requestedAt: string; retrievedAt: string; servedAt: string }>;
const decision = (options: { timing?: Timing; response?: string } = {}) => {
  const root = makeBotRootAuthority({ identity, beforeFen: START_FEN, startFen: START_FEN, historyUci: [], seed: 7 });
  const legal = makeExactLegalMoveMap(root, exactLegalMoves(root.beforeFen).map((move) => move.uci));
  const profile = resolveBotProfile("human-baseline.1400@1");
  const candidates = [
    { moveUci: "a2a3", probability: 0.5 },
    { moveUci: "a2a4", probability: 0.3 },
    { moveUci: "b2b3", probability: 0.2 },
  ];
  const payload = {
    request: { position: { kind: "history_conditioned" as const, startFen: root.startFen, historyUci: root.historyUci },
      requestedModel: { id: BOT_MAIA_MODEL_ID, version: BOT_MAIA_SOURCE_VERSION }, band: 1400,
      temperature: 0.8, topP: 0.92, requestedWidth: 20, timeoutMs: 400 },
    appliedBand: 1400, temperature: 0.8, topP: 0.92, requestedWidth: 20,
    returnedWidth: candidates.length, returnedProbabilityMass: 1, coverage: "bounded_top_k" as const, candidates,
  };
  const delivery = makeProviderDelivery({ operation: "maia.policy_page@1", provider: "maia",
    endpoint: { kind: "uci_supervisor", engineId: "maia-5m" }, requestedIdentity: { request: payload.request },
    actualIdentity: { id: "maia-5m", kind: "opponent", name: "Maia3", version: BOT_MAIA_SOURCE_VERSION,
      modelId: BOT_MAIA_MODEL_ID, containerDigest: sha("container"), seedHonored: false, eloHonored: true,
      optionImageDigest: sha("options") }, normalizedRequestDigest: sha("request"),
    responseDigest: sha(options.response ?? "response"), payload, ...(options.timing === undefined ? {} : { timing: options.timing }) });
  const maia: TypedProviderResult<"maia.policy_page@1"> = Object.freeze({
    kind: "success", operation: "maia.policy_page@1", normalizedRequestDigest: sha("request"), delivery,
  });
  const source = deriveBotSourceView({ root, legal, classifiers: compileLegalBoardClassifiers(root, legal), profile, maia });
  if (source.kind !== "ready") throw new Error("fixture source unavailable");
  const result = projectBotPolicyDecisionRecord(compileBotPolicyExecution({ source: source.source, profile }));
  const replayAuthority = makeBotPolicyReplayAuthority({ root, legal,
    classifiers: compileLegalBoardClassifiers(root, legal), profileId: profile.id, maia });
  return { root, profile, result, replayAuthority };
};

const envelope = (): Readonly<{ envelope: BotPolicyEventEnvelope;
  replayAuthority: ReturnType<typeof makeBotPolicyReplayAuthority> }> => {
  const value = decision();
  const request = parseBotOpponentPlyRequest({ requestId: "botreq_1234567890abcdef", expectedNodeId: identity.nodeId,
    expectedBranchId: identity.branchId, expectedEventHeadDigest: identity.preCommitEventHeadDigest });
  const begun = beginBotOperation({ request, root: value.root.identity, writerLeaseDigest: sha("lease"), profile: value.profile, seed: 7 });
  if (begun.kind !== "proceed") throw new Error("fixture operation replayed");
  const committed = commitBotOperation({ request, currentRoot: value.root, decision: value.result,
    writerLeaseDigest: sha("lease"), preProviderOperandDigest: begun.preProviderOperandDigest, eventSequence: 2,
    timingMs: { total: 30, maia: 20, guard: 0, composition: 10 } });
  if (committed.kind !== "committed") throw new Error("fixture operation did not commit");
  return { envelope: committed.envelope, replayAuthority: value.replayAuthority };
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe("D2407 normalized sampler authority", () => {
  it("executes the real constructor and matches the complete registered distribution", () => {
    const actual = decision().result.considered.map((row) => ({ moveUci: row.moveUci, rawMass: row.rawMass,
      finalMass: row.reconstructedMass }));
    const expected = reconstructMaiaDistribution([
      { moveUci: "a2a3", mass: 0.5 }, { moveUci: "a2a4", mass: 0.3 }, { moveUci: "b2b3", mass: 0.2 },
    ], 0.8, 0.92, (left, right) => digest([identity, left]).localeCompare(digest([identity, right])))
      .rows.map((row) => ({ moveUci: row.moveUci, rawMass: row.rawMass, finalMass: row.finalMass }));
    expect(actual).toEqual(expected);
    expect(actual.find((row) => row.moveUci === "b2b3")?.finalMass).toBe(0);
  });
});

describe("D2408 deterministic source image", () => {
  it("ignores delivery clocks but covers semantic source and payload identity", () => {
    const first = decision({ timing: { requestedAt: "2026-01-01T00:00:00Z", retrievedAt: "2026-01-01T00:00:01Z", servedAt: "2026-01-01T00:00:02Z" } }).result;
    const later = decision({ timing: { requestedAt: "2026-02-01T00:00:00Z", retrievedAt: "2026-02-01T00:00:01Z", servedAt: "2026-02-01T00:00:02Z" } }).result;
    expect(later.sources.maia.deliveryDigest).not.toBe(first.sources.maia.deliveryDigest);
    expect(later.derivationDigest).toBe(first.derivationDigest);
    expect(decision({ response: "different-response" }).result.derivationDigest).not.toBe(first.derivationDigest);
  });
});

describe("D2409 durable unknown-byte parser", () => {
  it("rejects stale digests across every deterministic decision family", () => {
    const { envelope: original, replayAuthority } = envelope();
    const mutations: Array<(value: any) => void> = [
      (value) => { value.decision.root.nodeId = "forged"; },
      (value) => { value.decision.profile.digest = sha("profile"); },
      (value) => { value.decision.seed = 8; },
      (value) => { value.decision.sources.maia.delivery.payload.appliedBand = 1800; },
      (value) => { value.decision.returnedProbabilityMass = 0.5; },
      (value) => { value.decision.coverage = "legal_set_equal"; },
      (value) => { value.decision.layers[0].action = "degraded"; },
      (value) => { value.decision.considered[0].finalMass = 0.01; },
      (value) => { value.decision.chosenMoveUci = value.decision.chosenMoveUci === "a2a3" ? "a2a4" : "a2a3"; },
    ];
    for (const mutate of mutations) {
      const forged = clone(original); mutate(forged);
      expect(() => parseBotPolicyEventEnvelope(forged, replayAuthority)).toThrow();
    }
  });

  it("rejects stale digests across operation families while allowing non-deterministic timing", () => {
    const { envelope: original, replayAuthority } = envelope();
    const mutations: Array<(value: any) => void> = [
      (value) => { value.operation.root.nodeId = "forged"; },
      (value) => { value.operation.writerLeaseDigest = sha("other-lease"); },
      (value) => { value.operation.profileDigest = sha("other-profile"); },
      (value) => { value.operation.seed = 9; },
      (value) => { value.operation.preProviderOperandDigest = sha("pre"); },
      (value) => { value.operation.commitOperandDigest = sha("commit"); },
      (value) => { value.operation.derivationDigest = sha("derivation"); },
      (value) => { value.operation.providerDeliveryDigests = [sha("delivery")]; },
      (value) => { value.operation.chosenMoveUci = "h2h4"; },
      (value) => { value.operation.committedEventSequence = 3; },
      (value) => { value.operation.operationDigest = sha("operation"); },
    ];
    for (const mutate of mutations) {
      const forged = clone(original); mutate(forged);
      expect(() => parseBotPolicyEventEnvelope(forged, replayAuthority)).toThrow();
    }
    const observedLater: any = clone(original);
    observedLater.operation.timingMs.total = 31;
    expect(parseBotPolicyEventEnvelope(observedLater, replayAuthority).operation.timingMs.total).toBe(31);
  });
});

describe("D2410/D2411 shared provider-health roster boundary", () => {
  it("imports the shared types and refuses structural snapshot substitutes", () => {
    const source = readFileSync("tools/d1970-bot-policy-author-repair/contract.ts", "utf8");
    expect(source).toMatch(/type ProviderRegistrySnapshot[\s\S]*d2846-provider-health-seventh-author-repair/u);
    expect(source).not.toMatch(/(?:interface|type) BotProvider(?:InstanceSnapshot|OperationAvailability|RegistrySnapshot)/u);
    expect(() => profileAvailability(resolveBotProfile("human-baseline.1400@1"), {
      revision: 1, generatedAt: new Date(0).toISOString(), instances: [], digest: "forged",
    })).toThrow(/SNAPSHOT_NOT_SEALED/u);
  });

  it("keeps an unrelated exact cache conditional until the current request resolves", () => {
    const registry = new ProviderRegistry([{ instanceId: "maia-inference", implementation: "local_service", generation: "g1" }]);
    const exchange = new ExchangeAuthority();
    const declaration = compileApplications().find((row) => row.operationId === "opponent.maia_inference")!;
    const request = exchange.request("maia.policy_page@1", "local_service", "g1", "old-position-request");
    const delivery = exchange.success(request, "old-position-policy", "old-position-response");
    const cache = new ExactCache<string>(registry);
    cache.put(cacheKey(declaration, request, "old-position-key"), delivery, 1_000, 0);
    registry.failure(request, exchange.failure(request, "network"), 1);
    const snapshot = registry.snapshot(1);
    expect(profileAvailability(resolveBotProfile("human-baseline.1400@1"), snapshot)).toEqual({
      kind: "conditional", snapshotRevision: snapshot.revision, reason: "maia_exact_request_required",
    });
  });
});
