// D3368: the actual shared scheduler/parser, source adapters and bot compiler boundary.
import { BOT_PROFILE_CATALOG, ProviderSealRefused } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";
import { APPLICATION_PROVIDER_BOUNDS } from "./application.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import {
  adaptMaiaDelivery, adaptStockfishDelivery, botMaiaRequest, botMaiaSource,
  botStockfishRequest, botStockfishSource, persistBotDeliveries, reloadBotSources,
} from "./bot-opponent-source.js";
import {
  compileBotClassifierView, compileBotLegalMoveMap, compileBotPolicyExecution,
  sealBotRootAuthority, sealBotPolicyReplayAuthority, BotPolicyAuthorityError,
} from "./bot-policy-compiler.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const entry = BOT_PROFILE_CATALOG.find(row => row.reference.id === "guarded-human.1400@1")!;

async function sources() {
  const engine = new MockProviderEngineClient();
  const { scheduler } = composeProviderTraversalApplication({ engines: engine, tablebaseFetch: null, explorerFetch: null, explorerToken: null, bounds: APPLICATION_PROVIDER_BOUNDS });
  const identity = await engine.start("stockfish-analysis");
  const signal = new AbortController().signal;
  const maia = await scheduler.get({ operation: "maia.policy_page@1", request: botMaiaRequest({ startFen: START, historyUci: [], profile: entry.reference, timeoutMs: 5_000 }) }, { id: "bot-source-test", budgetMs: 5_000 }, signal);
  const stockfish = await scheduler.get({ operation: "stockfish.legal_root_table@1", request: botStockfishRequest({ fen: START, requestedEngine: identity, timeoutMs: 5_000 }) }, { id: "bot-source-test", budgetMs: 5_000 }, signal);
  if (maia.kind !== "success" || stockfish.kind !== "success") throw new Error("expected actual parsed source deliveries");
  return { maia, stockfish, scheduler };
}

function compile(maia: ReturnType<typeof botMaiaSource>, stockfish: ReturnType<typeof botStockfishSource>) {
  const root = sealBotRootAuthority({ runId: "source-run", branchId: "source-branch", nodeId: "source-node", preCommitEventHeadDigest: `sha256:${"a".repeat(64)}`, startFen: START, historyUci: [], seed: 42 });
  const legal = compileBotLegalMoveMap(root);
  return compileBotPolicyExecution({ root, legal, classifiers: compileBotClassifierView(root, legal), profile: entry.reference, maia, stockfish });
}

describe("bot shared source authority", () => {
  it("accepts retained-exact deliveries without changing the source view or decision", async () => {
    const { maia, stockfish, scheduler } = await sources();
    const retained = await scheduler.get({ operation: "maia.policy_page@1", request: botMaiaRequest({ startFen: START, historyUci: [], profile: entry.reference, timeoutMs: 5_000 }) }, { id: "bot-source-retained", budgetMs: 5_000 }, new AbortController().signal);
    expect(retained.kind).toBe("success");
    if (retained.kind !== "success") throw new Error("expected retained source");
    expect(retained.delivery.kind).toBe("retained_exact");
    expect(botMaiaSource(retained)).toEqual(botMaiaSource(maia));
    expect(compile(botMaiaSource(retained), botStockfishSource(stockfish))).toEqual(compile(botMaiaSource(maia), botStockfishSource(stockfish)));
  });

  it("returns typed invalid-response for a genuine exact-FEN Maia page instead of using it as history", async () => {
    const { scheduler } = await sources();
    const request = { ...botMaiaRequest({ startFen: START, historyUci: [], profile: entry.reference, timeoutMs: 5_000 }), position: { kind: "exact_fen" as const, fen: START } };
    const result = await scheduler.get({ operation: "maia.policy_page@1", request }, { id: "bot-source-kind", budgetMs: 5_000 }, new AbortController().signal);
    expect(result.kind).toBe("success");
    expect(botMaiaSource(result)).toEqual({ kind: "failure", reason: "invalid_response" });
  });

  it("accepts live deliveries and reconstructs the same decision from persisted source bytes", async () => {
    const { maia, stockfish } = await sources();
    const live = compile(botMaiaSource(maia), botStockfishSource(stockfish));
    expect(live.kind).toBe("executed");
    const restored = reloadBotSources(JSON.parse(JSON.stringify(persistBotDeliveries({ maia: maia.delivery, stockfish: stockfish.delivery }))));
    expect(compile(restored.maia, restored.stockfish!)).toEqual(live);
  });

  it.each(["spread", "json", "bare", "crossed"] as const)("refuses %s delivery before either adapter reads source bytes", async kind => {
    const { maia, stockfish } = await sources();
    const copy = (value: unknown, crossed: unknown): unknown => kind === "spread" ? { ...(value as object) } : kind === "json" ? JSON.parse(JSON.stringify(value)) : kind === "bare" ? (value as { payload: unknown }).payload : crossed;
    expect(() => adaptMaiaDelivery(copy(maia.delivery, stockfish.delivery) as never)).toThrow(ProviderSealRefused);
    expect(() => adaptStockfishDelivery(copy(stockfish.delivery, maia.delivery) as never)).toThrow(ProviderSealRefused);
    expect(botMaiaSource({ ...maia, delivery: copy(maia.delivery, stockfish.delivery) as never })).toEqual({ kind: "failure", reason: "invalid_response" });
    expect(botStockfishSource({ ...stockfish, delivery: copy(stockfish.delivery, maia.delivery) as never })).toEqual({ kind: "failure", reason: "invalid_response" });
  });

  it.each(["spread", "json", "changed"] as const)("refuses %s adapted Maia views as typed no-move, and Stockfish views as whole-guard abstention", async kind => {
    const { maia, stockfish } = await sources();
    const base = botMaiaSource(maia);
    const guard = botStockfishSource(stockfish);
    if (base.kind !== "success" || guard.kind !== "success") throw new Error("expected adapted sources");
    const fakeBase = kind === "json" ? JSON.parse(JSON.stringify(base.payload)) : { ...base.payload, ...(kind === "changed" ? { rows: [{ moveUci: "e2e4", rawMass: 1 }] } : {}) };
    expect(compile({ kind: "success", payload: fakeBase }, guard)).toEqual({ kind: "provider_failed", reason: "invalid_response", retryable: true });
    const fakeGuard = kind === "json" ? JSON.parse(JSON.stringify(guard.payload)) : { ...guard.payload, ...(kind === "changed" ? { rows: guard.payload.rows.map(row => ({ ...row, score: { kind: "centipawns", value: row.moveUci === "e2e4" ? 1000 : -1000 } })) } : {}) };
    const result = compile(base, { kind: "success", payload: fakeGuard });
    expect(result.kind).toBe("executed");
    if (result.kind === "executed") expect(result.execution.derivation.layers[1]).toEqual({ id: "guard.severe_error@1", action: "abstained", reason: "guard_source_failure" });
    expect(Object.isFrozen(base.payload.rows)).toBe(true);
    expect(Object.isFrozen(guard.payload.rows[0]!.score)).toBe(true);
  });

  it("cannot mint a replay authority with copied provider views", async () => {
    const { maia, stockfish } = await sources();
    const base = botMaiaSource(maia);
    const guard = botStockfishSource(stockfish);
    if (base.kind !== "success" || guard.kind !== "success") throw new Error("expected adapted sources");
    const root = sealBotRootAuthority({ runId: "replay-run", branchId: "replay-branch", nodeId: "replay-node", preCommitEventHeadDigest: `sha256:${"a".repeat(64)}`, startFen: START, historyUci: [], seed: 42 });
    const legal = compileBotLegalMoveMap(root);
    const authority = { root, legal, classifiers: compileBotClassifierView(root, legal), profile: entry.reference, maia: base, stockfish: guard };
    expect(() => sealBotPolicyReplayAuthority(authority)).not.toThrow();
    expect(() => sealBotPolicyReplayAuthority({ ...authority, maia: { ...base, payload: { ...base.payload } } })).toThrow(BotPolicyAuthorityError);
    expect(() => sealBotPolicyReplayAuthority({ ...authority, stockfish: { ...guard, payload: { ...guard.payload } } })).toThrow(BotPolicyAuthorityError);
  });
});
