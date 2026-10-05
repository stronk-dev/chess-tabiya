import { describe, expect, it } from "vitest";
import {
  BOT_PROFILE_CATALOG, exactLegalMoves, maiaReachedFen,
  type MaiaPolicyPageRequest, type TypedProviderResult,
} from "../../packages/runtime/src/index.js";
import { engineSpelling } from "../../packages/runtime/src/provider-test-fixtures.js";
import { botMaiaSource, botStockfishRequest, botStockfishSource } from "../../apps/server/src/bot-opponent-source.js";
import { compileBotPolicyExecution, projectBotPolicyDecisionRecord, sealBotRootAuthority } from "../../apps/server/src/bot-policy-compiler.js";
import { ProviderExchangeScheduler } from "../../apps/server/src/provider-exchange.js";
import { providerOperationDescriptors } from "../../apps/server/src/provider-operations.js";
import { FakeEngines, stockfishDepthLines } from "../../apps/server/src/provider-exchange.test-support.js";
import { executeCalibrationProfile, prepareCalibrationProfile, replayCalibrationProfile, type CalibrationProfilePlan } from "./profile-arm.js";
import manifest from "./manifest.json";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const OPEN = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
const CASTLE = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
const FEW = "7k/7p/8/8/8/8/8/K7 w - - 0 1";
function root(startFen = OPEN, seed = 42, historyUci: readonly string[] = []) {
  return sealBotRootAuthority({ runId: "research-D3408", branchId: "test-branch", nodeId: "test-node",
    preCommitEventHeadDigest: `sha256:${"a".repeat(64)}`, startFen, historyUci, seed });
}
function scheduler(engines: FakeEngines) {
  return new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines,
    tablebaseFetch: null, explorerFetch: null, explorerToken: null }), maxActive: 1, maxQueued: 1,
    maxRetainedEntries: 1, maxRetainedWeight: 256, retentionTtlMs: 1,
    monotonicNowMs: () => performance.now(), wallNow: () => new Date().toISOString() });
}
async function maia(plan: CalibrationProfilePlan, overrides: Partial<MaiaPolicyPageRequest> = {}) {
  const request = { ...plan.maiaRequest, ...overrides };
  const fen = maiaReachedFen(request.position);
  const moves = exactLegalMoves(fen).slice(0, request.requestedWidth);
  const fake = new FakeEngines();
  fake.maiaOptions = fake.maiaOptions.map((option) => option.name === "MultiPV" ? { ...option, max: 500 } : option);
  fake.respond = () => [...moves.map((move, index) => `info depth 1 multipv ${index + 1} policy ${1 / moves.length} pv ${engineSpelling(fen, move.uci)}`),
    `bestmove ${engineSpelling(fen, moves[0]!.uci)}`];
  return scheduler(fake).get({ operation: "maia.policy_page@1", request }, { id: "D3408-maia", budgetMs: 5000 }, new AbortController().signal);
}
async function guard(plan: CalibrationProfilePlan, severeMove?: string) {
  const fake = new FakeEngines(); fake.version = "18";
  fake.respond = (request) => stockfishDepthLines(request).map((line) => severeMove !== undefined
    && line.endsWith(` pv ${engineSpelling(plan.root.beforeFen, severeMove)}`)
    ? line.replace(/score cp -?\d+/u, "score cp -300") : line);
  const request = botStockfishRequest({ fen: plan.root.beforeFen, requestedEngine: { id: "stockfish-analysis", version: "18" }, timeoutMs: 500 });
  return scheduler(fake).get({ operation: "stockfish.legal_root_table@1", request }, { id: "D3408-guard", budgetMs: 500 }, new AbortController().signal);
}
async function executed(plan: CalibrationProfilePlan) {
  const sources = { maia: await maia(plan), ...(plan.guardRequired ? { stockfish: await guard(plan) } : {}) };
  const result = executeCalibrationProfile(plan, sources);
  if (result.kind !== "executed") throw new Error(`positive source refused: ${JSON.stringify(result)}`);
  const production = compileBotPolicyExecution({ root: plan.root, legal: plan.legal, classifiers: plan.classifiers,
    profile: plan.binding.profile, maia: botMaiaSource(sources.maia),
    ...(sources.stockfish === undefined ? {} : { stockfish: botStockfishSource(sources.stockfish) }) });
  if (production.kind !== "executed") throw new Error("production execution unexpectedly refused");
  expect(result.saved.decision).toEqual(projectBotPolicyDecisionRecord(production.execution));
  expect(replayCalibrationProfile(plan, JSON.parse(JSON.stringify(result.saved)))).toEqual(result.saved.decision);
  return result.saved;
}

describe("D3408 frozen profile arms use the production policy and whole-source replay", () => {
  it("joins all twelve manifest profiles to their exact catalogue member and behavior digest", () => {
    const arms = manifest.experiment.arms.filter((arm) => arm.kind === "profile");
    expect(arms).toHaveLength(BOT_PROFILE_CATALOG.length);
    for (const arm of arms) {
      const plan = prepareCalibrationProfile(arm.id, "profile", root(), 5000);
      const entry = BOT_PROFILE_CATALOG.find((member) => member.reference === plan.binding.profile)!;
      expect(`${entry.reference.family}-${entry.reference.band}`).toBe(arm.profile);
      expect(plan.binding.behaviorDigest).toBe(entry.behaviorDigest);
      expect(plan.maiaRequest.band).toBe(arm.band);
      expect(plan.maiaRequest.requestedModel).toEqual(entry.reference.model);
      expect(plan.guardRequired).toBe(entry.reference.orderedLayers.includes("guard.severe_error@1"));
    }
  });
  it("resolves both declared sides of G1/G2, never native controls as a catalogue bot", () => {
    for (const arm of manifest.experiment.arms.filter((item) => item.kind === "layer_contrast")) {
      for (const side of ["left", "right"] as const) {
        const profile = prepareCalibrationProfile(arm.id, side, root(), 5000).binding.profile;
        expect(`${profile.family}-${profile.band}`).toBe(arm[side]);
      }
    }
    for (const id of ["C1", "C2", "N", "unknown"]) expect(() => prepareCalibrationProfile(id, "profile", root(), 5000)).toThrow();
    expect(() => prepareCalibrationProfile("G1", "profile", root(), 5000)).toThrow();
    expect(() => prepareCalibrationProfile("A2", "left", root(), 5000)).toThrow();
  });
  it("A2 caps a >20-legal root at 20 and preserves a complete legal map independently", () => {
    const plan = prepareCalibrationProfile("A2", "profile", root(), 5000);
    expect(plan.legal.moves.length).toBeGreaterThan(20);
    expect(plan.maiaRequest.requestedWidth).toBe(20);
    expect(plan.maiaRequest.temperature).toBe(0.8);
    expect(plan.maiaRequest.topP).toBe(0.92);
  });
  it("caps at exact legality below 20 without claiming all-legal coverage elsewhere", () => {
    const plan = prepareCalibrationProfile("A2", "profile", root(FEW), 5000);
    expect(plan.legal.moves).toHaveLength(3);
    expect(plan.maiaRequest.requestedWidth).toBe(3);
  });
  it.each(manifest.experiment.arms.filter((arm) => arm.kind === "profile").map((arm) => arm.id))("%s uses the exact production transform/draw, save and reconstruction", async (id) => {
    const saved = await executed(prepareCalibrationProfile(id, "profile", root(), 5000));
    expect(saved.decision.returnedWidth).toBe(20);
    expect(saved.decision.maiaCoverage).toBe("bounded_subset");
    expect(saved.decision.layers.map((layer) => layer.id)).toEqual(saved.binding.profile.orderedLayers);
  });
  it("history-conditioned requests reach the played root rather than a detached FEN", async () => {
    const plan = prepareCalibrationProfile("A2", "profile", root(START, 42, ["e2e4", "e7e5"]), 5000);
    expect(plan.root.beforeFen).toBe(OPEN);
    expect(plan.maiaRequest.position).toEqual({ kind: "history_conditioned", startFen: START, historyUci: ["e2e4", "e7e5"] });
    await executed(plan);
  });
  it("retains canonical castling identities through provider parsing, sampler and reload", async () => {
    const plan = prepareCalibrationProfile("A2", "profile", root(CASTLE), 5000);
    expect(plan.legal.moves).toEqual(expect.arrayContaining(["e1a1", "e1h1"]));
    const saved = await executed(plan);
    expect(saved.decision.considered.map((row) => row.moveUci)).toEqual(expect.arrayContaining(["e1a1", "e1h1"]));
  });
  it.each(["full-width", "band", "temperature", "top-p", "root"])("refuses a valid sealed but crossed %s page", async (mode) => {
    const plan = prepareCalibrationProfile("A2", "profile", root(), 5000);
    const overrides: Partial<MaiaPolicyPageRequest> = mode === "full-width" ? { requestedWidth: plan.legal.moves.length }
      : mode === "band" ? { band: 1800 } : mode === "temperature" ? { temperature: 1 }
        : mode === "top-p" ? { topP: 1 } : { position: { kind: "history_conditioned", startFen: START, historyUci: [] } };
    const source = await maia(plan, overrides);
    expect(source.kind).toBe("success"); // The provider page itself is legal; this is consumer identity refusal.
    expect(executeCalibrationProfile(plan, { maia: source }).kind).toBe("provider_failed");
  });
  it("copied plans and roots cannot authorize a sampler/digest substitution", () => {
    const plan = prepareCalibrationProfile("A2", "profile", root(), 5000);
    expect(() => prepareCalibrationProfile("A2", "profile", { ...plan.root }, 5000)).toThrow("unsealed");
    expect(() => executeCalibrationProfile({ ...plan }, { maia: {} as never })).toThrow("forged");
    expect(() => prepareCalibrationProfile("A2", "profile", root(), 0)).toThrow("timeout");
  });
  it("provider failure produces no decision or fallback move", async () => {
    const plan = prepareCalibrationProfile("A2", "profile", root(), 5000);
    const fake = new FakeEngines(); fake.containerCaptured = false;
    const failure = await scheduler(fake).get({ operation: "maia.policy_page@1", request: plan.maiaRequest },
      { id: "D3408-provider-off", budgetMs: 5000 }, new AbortController().signal);
    expect(failure.kind).toBe("source_failure");
    expect(executeCalibrationProfile(plan, { maia: failure }).kind).not.toBe("executed");
  });
  it("a copied delivery cannot become admitted by a typed assertion", async () => {
    const plan = prepareCalibrationProfile("A2", "profile", root(), 5000);
    const source = await maia(plan);
    if (source.kind !== "success") throw new Error("positive source refused");
    const copied = { ...source, delivery: { ...source.delivery } } as TypedProviderResult<"maia.policy_page@1">;
    expect(executeCalibrationProfile(plan, { maia: copied }).kind).toBe("provider_failed");
  });
  it("guard absence is a recorded production abstention and pawn trait never bypasses it", async () => {
    const plan = prepareCalibrationProfile("P2", "profile", root(), 5000);
    const result = executeCalibrationProfile(plan, { maia: await maia(plan) });
    if (result.kind !== "executed") throw new Error("positive source refused");
    expect(result.saved.decision.layers.slice(1).every((layer) => layer.action === "abstained")).toBe(true);
    expect(replayCalibrationProfile(plan, JSON.parse(JSON.stringify(result.saved)))).toEqual(result.saved.decision);
  });
  it("the bridge really removes a severe candidate and applies pawn x4, not just layer labels", async () => {
    const plan = prepareCalibrationProfile("P2", "profile", root(), 5000);
    const page = await maia(plan);
    const baseline = executeCalibrationProfile(plan, { maia: page });
    if (baseline.kind !== "executed") throw new Error("positive base refused");
    const severeMove = baseline.saved.decision.considered.find((row) => row.reconstructedMass > 0)!.moveUci;
    const result = executeCalibrationProfile(plan, { maia: page, stockfish: await guard(plan, severeMove) });
    if (result.kind !== "executed") throw new Error("positive guard refused");
    const removed = result.saved.decision.considered.find((row) => row.moveUci === severeMove)!;
    expect(removed.reconstructedMass).toBeGreaterThan(0);
    expect(removed.finalMass).toBe(0);
    expect(removed.guard.kind).toBe("applied");
    const positive = result.saved.decision.considered.filter((row) => row.finalMass > 0);
    const pawn = positive.find((row) => row.classifiers.includes("pawn_move@1"))!;
    const other = positive.find((row) => !row.classifiers.includes("pawn_move@1"))!;
    expect(pawn).toBeDefined(); expect(other).toBeDefined();
    expect((pawn.finalMass / pawn.reconstructedMass) / (other.finalMass / other.reconstructedMass)).toBeCloseTo(4, 12);
    expect(replayCalibrationProfile(plan, JSON.parse(JSON.stringify(result.saved)))).toEqual(result.saved.decision);
  });
  it.each(["manifest", "arm", "side", "behavior", "sampler", "seed", "decision", "source", "extra"])("reload refuses changed %s authority", async (mode) => {
    const plan = prepareCalibrationProfile("A2", "profile", root(), 5000);
    const saved = JSON.parse(JSON.stringify(await executed(plan)));
    if (mode === "manifest") saved.binding.manifestDigest = `sha256:${"b".repeat(64)}`;
    if (mode === "arm") saved.binding.armId = "A1";
    if (mode === "side") saved.binding.side = "left";
    if (mode === "behavior") saved.binding.behaviorDigest = `sha256:${"b".repeat(64)}`;
    if (mode === "sampler") saved.binding.profile.sampler.requestedWidth = 99;
    if (mode === "seed") saved.decision.seed = 99;
    if (mode === "decision") saved.decision.chosenMoveUci = "a1a8";
    if (mode === "source") saved.sources.maia = {};
    if (mode === "extra") Object.assign(saved, { rawVector: [] });
    expect(() => replayCalibrationProfile(plan, saved)).toThrow();
  });
});
