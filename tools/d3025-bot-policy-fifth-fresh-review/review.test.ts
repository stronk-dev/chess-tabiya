// DISPOSABLE fifth bot-policy fresh review — D3025-D3031. Not production code.
import { readFileSync } from "node:fs";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import {
  BOT_MAIA_MODEL_ID,
  BOT_MAIA_SOURCE_VERSION,
  assertPersistedProviderInput,
  beginBotOperation,
  commitBotOperation,
  compileBotPolicyExecution,
  compileLegalBoardClassifiers,
  deriveBotSourceView,
  digest,
  makeBotRootAuthority,
  makeExactLegalMoveMap,
  parseBotOpponentPlyRequest,
  parseBotPolicyEventEnvelope,
  profileAvailability,
  projectBotPolicyDecisionRecord,
  resolveBotProfile,
  type BotOperationRootAuthority,
  type BotPolicyEventEnvelope,
  type BotProfileReference,
  type BotRootIdentity,
  type RegisteredBotProviderInput,
  type Sha,
} from "../d1970-bot-policy-author-repair/contract.js";
import {
  assertProviderDelivery,
  makeProviderDelivery,
  type MaiaPolicyPage,
  type StockfishLegalRootTable,
  type TypedProviderResult,
} from "../d2056-provider-exchange-author-repair/shared-provider-contract.js";
import {
  ExchangeAuthority,
  ProviderRegistry,
} from "../d2846-provider-health-seventh-author-repair/contract.js";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const sha = (value: string): Sha => `sha256:${value.padEnd(64, "0").slice(0, 64)}`;

const makeRoot = (): BotOperationRootAuthority => {
  const identity: BotRootIdentity = {
    runId: "run-fifth-review",
    branchId: "main",
    nodeId: "node-1",
    preCommitEventHeadDigest: sha("head"),
    beforeFenDigest: digest(START_FEN),
    historyDigest: digest([]),
  };
  return makeBotRootAuthority({
    identity,
    beforeFen: START_FEN,
    startFen: START_FEN,
    historyUci: [],
    seed: 7,
  });
};

const makeMaiaResult = (
  root: BotOperationRootAuthority,
): TypedProviderResult<"maia.policy_page@1"> => {
  const candidates = [
    { moveUci: "a2a3", probability: 0.5 },
    { moveUci: "a2a4", probability: 0.3 },
    { moveUci: "b2b3", probability: 0.2 },
  ];
  const request = {
    position: {
      kind: "history_conditioned" as const,
      startFen: root.startFen,
      historyUci: root.historyUci,
    },
    requestedModel: { id: BOT_MAIA_MODEL_ID, version: BOT_MAIA_SOURCE_VERSION },
    band: 1400,
    temperature: 0.8,
    topP: 0.92,
    requestedWidth: 20,
    timeoutMs: 400,
  };
  const payload: MaiaPolicyPage = {
    request,
    appliedBand: 1400,
    temperature: 0.8,
    topP: 0.92,
    requestedWidth: 20,
    returnedWidth: candidates.length,
    returnedProbabilityMass: 1,
    coverage: "bounded_top_k",
    candidates,
  };
  const delivery = makeProviderDelivery({
    operation: "maia.policy_page@1",
    provider: "maia",
    endpoint: { kind: "uci_supervisor", engineId: "maia-5m" },
    requestedIdentity: { request },
    actualIdentity: {
      id: "maia-5m",
      kind: "opponent",
      name: "Maia3",
      version: BOT_MAIA_SOURCE_VERSION,
      modelId: BOT_MAIA_MODEL_ID,
      containerDigest: sha("maia-container"),
      seedHonored: false,
      eloHonored: true,
      optionImageDigest: sha("maia-options"),
    },
    normalizedRequestDigest: sha("maia-request"),
    responseDigest: sha("maia-response"),
    payload,
  });
  return Object.freeze({
    kind: "success",
    operation: "maia.policy_page@1",
    normalizedRequestDigest: sha("maia-request"),
    delivery,
  });
};

const makeStockfishResult = (
  root: BotOperationRootAuthority,
  duplicateFirst = false,
): TypedProviderResult<"stockfish.legal_root_table@1"> => {
  const moves = exactLegalMoves(root.beforeFen).map((move) => move.uci);
  const request = {
    fen: root.beforeFen,
    bound: { kind: "depth" as const, value: 8 },
    requestedWidth: "all_legal" as const,
    moveIdentity: "chessops-king-takes-rook@1" as const,
    requestedEngine: { id: "stockfish", version: "18" },
    timeoutMs: 500,
  };
  const row = (moveUci: string) => ({
    moveUci,
    reachedDepth: 8,
    score: { kind: "centipawns" as const, value: moveUci === "b2b3" ? 100 : 0 },
    pv: [moveUci],
  });
  const rows = [...moves.map(row), ...(duplicateFirst ? [row(moves[0]!)] : [])];
  const payload: StockfishLegalRootTable = {
    request,
    scoreFrame: "root_side_to_move",
    rows,
  };
  const delivery = makeProviderDelivery({
    operation: "stockfish.legal_root_table@1",
    provider: "stockfish",
    endpoint: { kind: "uci_supervisor", engineId: "stockfish-analysis" },
    requestedIdentity: {
      request,
      command: { commands: ["position fen", "go depth 8"], commandsDigest: sha("commands") },
    },
    actualIdentity: {
      id: "stockfish-analysis",
      name: "Stockfish",
      version: "18",
      binaryDigest: sha("stockfish-binary"),
      uciOptionsDigest: sha("stockfish-options"),
    },
    normalizedRequestDigest: sha("stockfish-request"),
    responseDigest: sha("stockfish-response"),
    payload,
  });
  return Object.freeze({
    kind: "success",
    operation: "stockfish.legal_root_table@1",
    normalizedRequestDigest: sha("stockfish-request"),
    delivery,
  });
};

const buildEnvelope = (): Readonly<{
  envelope: BotPolicyEventEnvelope;
  root: BotOperationRootAuthority;
  profile: BotProfileReference;
  request: ReturnType<typeof parseBotOpponentPlyRequest>;
}> => {
  const root = makeRoot();
  const legal = makeExactLegalMoveMap(
    root,
    exactLegalMoves(root.beforeFen).map((move) => move.uci),
  );
  const profile = resolveBotProfile("human-baseline.1400@1");
  const result = deriveBotSourceView({
    root,
    legal,
    classifiers: compileLegalBoardClassifiers(root, legal),
    profile,
    maia: makeMaiaResult(root),
  });
  if (result.kind !== "ready") throw new Error("Maia fixture unavailable");
  const decision = projectBotPolicyDecisionRecord(
    compileBotPolicyExecution({ source: result.source, profile }),
  );
  const request = parseBotOpponentPlyRequest({
    requestId: "botreq_1234567890abcdef",
    expectedNodeId: root.identity.nodeId,
    expectedBranchId: root.identity.branchId,
    expectedEventHeadDigest: root.identity.preCommitEventHeadDigest,
  });
  const begun = beginBotOperation({
    request,
    root: root.identity,
    writerLeaseDigest: sha("lease"),
    profile,
    seed: root.seed,
  });
  if (begun.kind !== "proceed") throw new Error("operation fixture replayed");
  const committed = commitBotOperation({
    request,
    currentRoot: root,
    decision,
    writerLeaseDigest: sha("lease"),
    preProviderOperandDigest: begun.preProviderOperandDigest,
    eventSequence: 2,
    timingMs: { total: 30, maia: 20, guard: 0, composition: 10 },
  });
  if (committed.kind !== "committed") throw new Error("operation fixture did not commit");
  return { envelope: committed.envelope, root, profile, request };
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const semanticProviderInput = (source: RegisteredBotProviderInput<unknown, any>): unknown => {
  const { servedAt: _servedAt, acquisition, ...delivery } = source.delivery;
  const { requestedAt: _requestedAt, retrievedAt: _retrievedAt, ...semanticAcquisition } = acquisition;
  return {
    operation: source.operation,
    delivery: { ...delivery, acquisition: semanticAcquisition },
  };
};

const rehashAttackerEnvelope = (envelope: any): void => {
  const decision = envelope.decision;
  decision.derivationDigest = digest({
    root: decision.root,
    profile: decision.profile,
    seed: decision.seed,
    sources: {
      maia: semanticProviderInput(decision.sources.maia),
      ...(decision.sources.stockfish === undefined
        ? {}
        : { stockfish: semanticProviderInput(decision.sources.stockfish) }),
      ...(decision.sources.candidateSubsetDigest === undefined
        ? {}
        : { candidateSubsetDigest: decision.sources.candidateSubsetDigest }),
    },
    returnedProbabilityMass: decision.returnedProbabilityMass,
    coverage: decision.coverage,
    layers: decision.layers,
    considered: decision.considered,
    chosenMoveUci: decision.chosenMoveUci,
  });
  const operation = envelope.operation;
  operation.derivationDigest = decision.derivationDigest;
  operation.chosenMoveUci = decision.chosenMoveUci;
  operation.commitOperandDigest = digest({
    preProviderOperandDigest: operation.preProviderOperandDigest,
    derivationDigest: operation.derivationDigest,
    providerDeliveryDigests: operation.providerDeliveryDigests,
  });
  const { operationDigest: _operationDigest, timingMs: _timingMs, ...operationImage } = operation;
  operation.operationDigest = digest(operationImage);
};

describe("bot policy fifth fresh independent review", () => {
  it("D3025 keeps a genuine profile id/digest while substituting its family and layer semantics", () => {
    const root = makeRoot();
    const legal = makeExactLegalMoveMap(
      root,
      exactLegalMoves(root.beforeFen).map((move) => move.uci),
    );
    const baseline = resolveBotProfile("human-baseline.1400@1");
    const substituted = Object.freeze({
      ...baseline,
      family: "guarded-human",
      orderedLayers: Object.freeze([
        "sampler.maia_reconstruction@1",
        "guard.severe_error@1",
      ]),
    }) as unknown as BotProfileReference;
    const result = deriveBotSourceView({
      root,
      legal,
      classifiers: compileLegalBoardClassifiers(root, legal),
      profile: substituted,
      maia: makeMaiaResult(root),
    });
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    const execution = compileBotPolicyExecution({ source: result.source, profile: substituted });
    expect(execution.profile.id).toBe("human-baseline.1400@1");
    expect(execution.profile.family).toBe("guarded-human");
    expect(execution.layers).toContainEqual({
      id: "guard.severe_error@1",
      action: "abstained",
      reason: "guard_unavailable",
    });
  });

  it("D3026 accepts a coordinated durable rewrite that selects a sampler-excluded move", () => {
    const forged: any = clone(buildEnvelope().envelope);
    const excluded = forged.decision.considered.find((row: any) => row.finalMass === 0);
    expect(excluded).toBeDefined();
    for (const row of forged.decision.considered) row.finalMass = row === excluded ? 1 : 0;
    forged.decision.chosenMoveUci = excluded.moveUci;
    rehashAttackerEnvelope(forged);
    const parsed = parseBotPolicyEventEnvelope(forged);
    expect(parsed.decision.chosenMoveUci).toBe(excluded.moveUci);
    expect(parsed.decision.considered.find((row) => row.moveUci === excluded.moveUci)?.reconstructedMass).toBe(0);
  });

  it("D3027 replays a structurally invalid prior envelope without invoking the durable parser", () => {
    const fixture = buildEnvelope();
    const forged: any = clone(fixture.envelope);
    forged.decision.chosenMoveUci = "h2h4";
    expect(() => parseBotPolicyEventEnvelope(forged)).toThrow();
    const replayed = beginBotOperation({
      request: fixture.request,
      root: fixture.root.identity,
      writerLeaseDigest: sha("lease"),
      profile: fixture.profile,
      seed: fixture.root.seed,
      previous: forged,
    });
    expect(replayed.kind).toBe("replayed_idempotent");
    if (replayed.kind === "replayed_idempotent") {
      expect(replayed.envelope.decision.chosenMoveUci).toBe("h2h4");
    }
  });

  it("D3028 accepts extra request fields, empty roots and a non-digest event head", () => {
    expect(parseBotOpponentPlyRequest({
      requestId: "botreq_1234567890abcdef",
      expectedNodeId: "",
      expectedBranchId: "",
      expectedEventHeadDigest: "not-a-digest",
      suppliedFen: START_FEN,
    })).toEqual({
      requestId: "botreq_1234567890abcdef",
      expectedNodeId: "",
      expectedBranchId: "",
      expectedEventHeadDigest: "not-a-digest",
    });
  });

  it("D3029 admits a duplicate all-legal Stockfish row and silently selects its first value", () => {
    const root = makeRoot();
    const legal = makeExactLegalMoveMap(
      root,
      exactLegalMoves(root.beforeFen).map((move) => move.uci),
    );
    const result = deriveBotSourceView({
      root,
      legal,
      classifiers: compileLegalBoardClassifiers(root, legal),
      profile: resolveBotProfile("guarded-human.1400@1"),
      maia: makeMaiaResult(root),
      stockfish: makeStockfishResult(root, true),
    });
    expect(result.kind).toBe("ready");
    if (result.kind === "ready") expect(result.source.guard.kind).toBe("applied");
  });

  it("D3030 turns invalid unsealed provider bytes into persisted source authority", () => {
    const input: any = clone(buildEnvelope().envelope.decision.sources.maia);
    input.delivery.acquisition.provider = "stockfish";
    input.deliveryDigest = digest(input.delivery);
    expect(() => assertProviderDelivery("maia.policy_page@1", input.delivery)).toThrow(/unsealed/u);
    expect(() => assertPersistedProviderInput<MaiaPolicyPage, "maia.policy_page@1">(input)).not.toThrow();
  });

  it("D3031 uses a caller-substituted family and an obsolete health checkpoint for roster availability", () => {
    const registry = new ProviderRegistry([
      { instanceId: "maia-inference", implementation: "local_service", generation: "g1" },
    ]);
    const exchange = new ExchangeAuthority();
    const request = exchange.request("maia.policy_page@1", "local_service", "g1", "request");
    registry.success(request, exchange.success(request, "policy", "response"), 1);
    const snapshot = registry.snapshot(1);
    const guarded = resolveBotProfile("guarded-human.1400@1");
    expect(profileAvailability(guarded, snapshot)).toMatchObject({
      kind: "unavailable",
      reason: "guard_provider_unavailable",
    });
    const substituted = { ...guarded, family: "human-baseline" } as unknown as BotProfileReference;
    expect(profileAvailability(substituted, snapshot)).toMatchObject({ kind: "available" });

    const source = readFileSync("tools/d1970-bot-policy-author-repair/contract.ts", "utf8");
    expect(source).toContain("d2846-provider-health-seventh-author-repair");
    expect(source).not.toContain("d2942-provider-health-eleventh-author-repair");
  });

  it("D3032 fails the repository compiler contract hidden by the private author config", () => {
    const config = ts.readConfigFile("tsconfig.base.json", ts.sys.readFile);
    if (config.error !== undefined) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".");
    const program = ts.createProgram({
      rootNames: ["tools/d1970-bot-policy-author-repair/contract.ts"],
      options: { ...parsed.options, noEmit: true },
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    expect(diagnostics.map((diagnostic) => diagnostic.code)).toEqual(expect.arrayContaining([2322, 2375]));

    const authorConfig = JSON.parse(
      readFileSync("tools/d1970-bot-policy-author-repair/tsconfig.contract.json", "utf8"),
    ) as { extends?: string; compilerOptions?: { exactOptionalPropertyTypes?: boolean } };
    expect(authorConfig.extends).toBeUndefined();
    expect(authorConfig.compilerOptions?.exactOptionalPropertyTypes).toBeUndefined();
  });
});
