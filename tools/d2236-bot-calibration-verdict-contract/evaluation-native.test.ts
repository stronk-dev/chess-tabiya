// Explicit native research controls, never a silently skipped test or calibration verdict.
import { afterAll, describe, expect, it } from "vitest";
import { EngineSupervisor, binaryArtifactProbe } from "../../apps/server/src/engine-supervisor.js";
import { ProviderExchangeScheduler } from "../../apps/server/src/provider-exchange.js";
import { providerOperationDescriptors } from "../../apps/server/src/provider-operations.js";
import { exactLegalMoves, parsePersistedProviderDelivery, type EngineOptionImage } from "../../packages/runtime/src/index.js";
import { digest, type HumanDecision } from "./population.js";
import { OPERATION, TIMEOUT_MS, freshSearchClient, makeHeader, makeRecord, rootRequest, type ResetWitness } from "./evaluation.js";

const command = process.env.BOT_CALIBRATION_SF_CMD ?? process.env.SF_CMD;
if (!command) throw new TypeError("Native research controls require an actual Stockfish 18 binary");
const engines = new EngineSupervisor([{ id: "stockfish-analysis", kind: "judge", command,
  options: { Threads: 1, Hash: 16 } }], { artifactProbe: binaryArtifactProbe });
afterAll(async () => { await engines.shutdown(); });

async function price(fen: string) {
  let reset: ResetWitness | undefined;
  let image: EngineOptionImage | undefined;
  await engines.start("stockfish-analysis");
  const descriptors = providerOperationDescriptors({ engines: freshSearchClient(engines,
    (value) => { reset = value; }, (value) => { image = value; }), tablebaseFetch: null, explorerFetch: null, explorerToken: null });
  const scheduler = new ProviderExchangeScheduler({ descriptors, maxActive: 1, maxQueued: 1,
    maxRetainedEntries: 1, maxRetainedWeight: 256, retentionTtlMs: 1,
    monotonicNowMs: () => performance.now(), wallNow: () => new Date().toISOString() });
  const result = await scheduler.get({ operation: OPERATION, request: rootRequest(fen) }, { id: "D3407-native", budgetMs: TIMEOUT_MS }, new AbortController().signal);
  if (result.kind !== "success" || !reset || !image) throw new Error(`native root refused: ${JSON.stringify(result)}`);
  const header = makeHeader(digest("native controls"), digest("native test"), result.delivery.acquisition.actualIdentity, image);
  const decision: HumanDecision = { gameHash: digest("native"), selectionHash: digest(fen), referenceHalf: 0,
    band: "1400", window: "opening-8-16", ply: 8, fen, moveUci: exactLegalMoves(fen)[0]!.uci };
  const record = makeRecord(header, 0, decision, result.delivery, reset);
  const reloaded = parsePersistedProviderDelivery(OPERATION, JSON.parse(JSON.stringify(record.source)));
  expect(reloaded.payloadReceipt).toEqual(result.delivery.payloadReceipt);
  expect(reloaded.payload.rows.map((row) => row.moveUci).sort()).toEqual(exactLegalMoves(fen).map((move) => move.uci).sort());
  return reloaded;
}
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const CASTLING = "r3k2r/ppp2ppp/2n5/3pp3/3PP3/2N5/PPP2PPP/R3K2R w KQkq - 0 1";
describe("D3407 actual Stockfish 18 reset, complete coverage and score domains", () => {
  it("captures the real engine/artifact and keeps start-position pricing stable across unrelated searches", async () => {
    const first = await price(START);
    await price(CASTLING);
    const repeat = await price(START);
    expect(repeat.payload).toEqual(first.payload);
    expect(first.acquisition.actualIdentity.version).toBe("18");
    expect(first.acquisition.actualIdentity.binaryDigest).toMatch(/^sha256:[a-f0-9]{64}$/u);
  });
  it("normalizes both real castling lines to exact king-takes-rook identities", async () => {
    const result = await price(CASTLING);
    const roots = result.payload.rows.map((row) => row.moveUci);
    expect(roots).toContain("e1h1"); expect(roots).toContain("e1a1");
    expect(roots).not.toContain("e1g1"); expect(roots).not.toContain("e1c1");
  });
  it("retains all four native promotion candidates with no queen-only truncation", async () => {
    const result = await price("7k/P7/8/8/8/8/6K1/8 w - - 0 1");
    expect(result.payload.rows.filter((row) => row.moveUci.startsWith("a7a8")).map((row) => row.moveUci).sort()).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
  });
  it("keeps a real positive-mate root in the mate domain", async () => {
    const result = await price("7k/5Q2/6K1/8/8/8/8/8 w - - 0 1");
    expect(result.payload.rows.some((row) => row.score.kind === "mate" && row.score.outcome === "root_mates")).toBe(true);
  });
  it("retains the forced legal reply and its real negative-mate domain", async () => {
    const result = await price("7k/8/5QK1/8/8/8/8/8 b - - 0 1");
    expect(result.payload.rows).toHaveLength(1);
    expect(result.payload.rows[0]!.score.kind).toBe("mate");
    if (result.payload.rows[0]!.score.kind === "mate") expect(result.payload.rows[0]!.score.outcome).toBe("root_is_mated");
  });
});
