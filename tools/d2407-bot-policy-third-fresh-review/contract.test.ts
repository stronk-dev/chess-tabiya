// DISPOSABLE third fresh independent review harness — D2407-D2411. Not production code.
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
  makeExactLegalMoveMap,
  parseBotOpponentPlyRequest,
  profileAvailability,
  projectBotPolicyDecisionRecord,
  resolveBotProfile,
  saveReloadEnvelope,
  type BotOperationRootAuthority,
  type BotPolicyEventEnvelope,
  type BotRootIdentity,
  type Sha,
} from "../d1970-bot-policy-author-repair/contract.js";
import {
  makeProviderDelivery,
  type TypedProviderResult,
} from "../d2056-provider-exchange-author-repair/shared-provider-contract.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const sha = (value: string): Sha => `sha256:${value.padEnd(64, "0").slice(0, 64)}`;
const identity: BotRootIdentity = {
  runId: "run-review",
  branchId: "main",
  nodeId: "node-1",
  preCommitEventHeadDigest: sha("head"),
  beforeFenDigest: digest(START_FEN),
  historyDigest: digest([]),
};

const authority = (): BotOperationRootAuthority => makeBotRootAuthority({
  identity,
  beforeFen: START_FEN,
  startFen: START_FEN,
  historyUci: [],
  seed: 7,
});

const baselineDecision = () => {
  const root = authority();
  const moves = exactLegalMoves(root.beforeFen).map((move) => move.uci);
  const legal = makeExactLegalMoveMap(root, moves);
  const profile = resolveBotProfile("human-baseline.1400@1");
  const payload = {
    request: {
      position: { kind: "history_conditioned" as const, startFen: root.startFen, historyUci: root.historyUci },
      requestedModel: { id: BOT_MAIA_MODEL_ID, version: BOT_MAIA_SOURCE_VERSION },
      band: 1400,
      temperature: 0.8,
      topP: 0.92,
      requestedWidth: 20,
      timeoutMs: 400,
    },
    appliedBand: 1400,
    temperature: 0.8,
    topP: 0.92,
    requestedWidth: 20,
    returnedWidth: 3,
    returnedProbabilityMass: 1,
    coverage: "bounded_top_k" as const,
    candidates: [
      { moveUci: "a2a3", probability: 0.5 },
      { moveUci: "a2a4", probability: 0.3 },
      { moveUci: "b2b3", probability: 0.2 },
    ],
  };
  const delivery = makeProviderDelivery({
    operation: "maia.policy_page@1",
    provider: "maia",
    endpoint: { kind: "uci_supervisor", engineId: "maia-5m" },
    requestedIdentity: { request: payload.request },
    actualIdentity: {
      id: "maia-5m",
      kind: "opponent",
      name: "Maia3",
      version: BOT_MAIA_SOURCE_VERSION,
      modelId: BOT_MAIA_MODEL_ID,
      containerDigest: sha("container"),
      seedHonored: false,
      eloHonored: true,
      optionImageDigest: sha("options"),
    },
    normalizedRequestDigest: sha("request"),
    responseDigest: sha("response"),
    payload,
  });
  const maia: TypedProviderResult<"maia.policy_page@1"> = Object.freeze({
    kind: "success",
    operation: "maia.policy_page@1",
    normalizedRequestDigest: sha("request"),
    delivery,
  });
  const source = deriveBotSourceView({
    root,
    legal,
    classifiers: compileLegalBoardClassifiers(root, legal),
    profile,
    maia,
  });
  if (source.kind !== "ready") throw new Error("expected ready bot source");
  const decision = projectBotPolicyDecisionRecord(compileBotPolicyExecution({ source: source.source, profile }));
  return { root, profile, decision };
};

const committedEnvelope = (): BotPolicyEventEnvelope => {
  const { root, profile, decision } = baselineDecision();
  const request = parseBotOpponentPlyRequest({
    requestId: "botreq_1234567890abcdef",
    expectedNodeId: identity.nodeId,
    expectedBranchId: identity.branchId,
    expectedEventHeadDigest: identity.preCommitEventHeadDigest,
  });
  const begun = beginBotOperation({
    request,
    root: root.identity,
    writerLeaseDigest: sha("lease"),
    profile,
    seed: root.seed,
  });
  if (begun.kind !== "proceed") throw new Error("expected new operation");
  const committed = commitBotOperation({
    request,
    currentRoot: root,
    decision,
    writerLeaseDigest: sha("lease"),
    preProviderOperandDigest: begun.preProviderOperandDigest,
    eventSequence: 2,
    timingMs: { total: 30, maia: 20, guard: 0, composition: 10 },
  });
  if (committed.kind !== "committed") throw new Error("expected committed operation");
  return committed.envelope;
};

const author = readFileSync("tools/d1970-bot-policy-author-repair/contract.ts", "utf8");
const sharedProvider = readFileSync("tools/d2056-provider-exchange-author-repair/shared-provider-contract.ts", "utf8");
const providerHealth = readFileSync("rfc/provider-health-degradation.md", "utf8");
const rfc = readFileSync("rfc/bot-policy.md", "utf8");

describe("D2407-D2411 third fresh bot-policy review", () => {
  it("D2407: author top-p differs from the normalized declared reconstruction", () => {
    const authorDecision = baselineDecision().decision;
    const production = reconstructMaiaDistribution([
      { moveUci: "a2a3", mass: 0.5 },
      { moveUci: "a2a4", mass: 0.3 },
      { moveUci: "b2b3", mass: 0.2 },
    ], 0.8, 0.92);
    const authorThird = authorDecision.considered.find((row) => row.moveUci === "b2b3")!;
    const declaredThird = production.rows.find((row) => row.moveUci === "b2b3")!;
    expect(authorThird.reconstructedMass).toBeGreaterThan(0);
    expect(declaredThird.finalMass).toBe(0);
    expect(author).toMatch(/const transformed[\s\S]*cumulative \+ row\.mass <= input\.profile\.sampler\.topP[\s\S]*const base = normalized\(topP\)/u);
  });

  it("D2408: deterministic derivation hashes the timestamp-bearing complete delivery", () => {
    expect(sharedProvider).toMatch(/requestedAt: string;[\s\S]*retrievedAt: string/u);
    expect(sharedProvider).toMatch(/kind: "live";[\s\S]*servedAt: string/u);
    expect(author).toMatch(/const body = \{ root:[\s\S]*sources: \{ maia: execution\.source\.maia/u);
    expect(author).toMatch(/derivationDigest: digest\(body\)/u);
    expect(rfc).toMatch(/deterministic decision deliberately contains no[\s\S]*delivery timestamps/u);
  });

  it("D2409: a forged durable decision survives save/reload with the old digest", () => {
    const envelope = committedEnvelope();
    const forgedMove = envelope.decision.chosenMoveUci === "a2a3" ? "a2a4" : "a2a3";
    const forged = {
      ...envelope,
      decision: { ...envelope.decision, chosenMoveUci: forgedMove },
    } as BotPolicyEventEnvelope;
    const reloaded = saveReloadEnvelope(forged);
    expect(reloaded.decision.chosenMoveUci).toBe(forgedMove);
    expect(reloaded.decision.derivationDigest).toBe(envelope.decision.derivationDigest);
    expect(reloaded.operation.chosenMoveUci).not.toBe(reloaded.decision.chosenMoveUci);
  });

  it("D2410: author contract declares a reduced bot-private provider-health model", () => {
    for (const copied of [
      "BotProviderInstanceSnapshot",
      "BotProviderOperationAvailability",
      "BotProviderRegistrySnapshot",
      "BotReleaseReceipt",
    ]) expect(author).toContain(`export ${copied === "BotReleaseReceipt" || copied === "BotProviderRegistrySnapshot" ? "interface" : "type"} ${copied}`);
    expect(rfc).toMatch(/imports its\s+exact `ProviderRegistrySnapshot`[\s\S]*defines no parallel health enum/u);
  });

  it("D2411: request-specific cache state is presented as general availability", () => {
    const result = profileAvailability(resolveBotProfile("human-baseline.1400@1"), {
      revision: 9,
      instances: [{ instanceId: "maia-inference", state: "degraded_cached_only", generation: "maia-g1" }],
      operations: [{
        operationId: "maia.policy_page@1",
        availability: { state: "cached_exact_only", instanceIds: ["maia-inference"] },
      }],
    });
    expect(result).toEqual({ kind: "available", snapshotRevision: 9 });
    expect(providerHealth).toMatch(/instance-global state never claims that a cached entry applies to the current request/u);
    expect(providerHealth).toMatch(/clients may not turn it into a generally enabled\s+feature/u);
    expect(author.slice(author.indexOf("export function profileAvailability"))).not.toMatch(/normalizedRequestDigest|cacheIdentity|requestDigest/u);
  });
});
