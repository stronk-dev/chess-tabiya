import {
  type OpponentSelection,
} from "@chess-tabiya/runtime";
import { RATED_OPPONENT_CALIBRATION } from "@chess-tabiya/runtime/rating";
import { afterEach, describe, expect, it } from "vitest";

import type { EngineHealth, EngineIdentity, EngineRequest } from "./engine-supervisor.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { OpponentSelector, type SelectorEngineClient } from "./opponent-selector.js";
import { RunService, type CreateRatedGameRequest } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { createRestHandler } from "./rest.js";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AT = "2026-08-22T14:00:00.000Z";
const principal = Object.freeze({ learnerId: "learner-a", handle: "a" });
const lease = Object.freeze({ writerId: "writer-a", learnerId: "learner-a" });

const calibratedIdentity: EngineIdentity = Object.freeze({
  id: RATED_OPPONENT_CALIBRATION.engine.id,
  kind: "opponent",
  name: RATED_OPPONENT_CALIBRATION.engine.name,
  version: "rated-fixture",
  modelId: RATED_OPPONENT_CALIBRATION.engine.modelId,
  containerDigest: RATED_OPPONENT_CALIBRATION.engine.containerDigest,
  seedHonored: false,
  eloHonored: true,
});

class RatedEngineClient implements SelectorEngineClient {
  constructor(private readonly identity: EngineIdentity = calibratedIdentity) {}
  async execute(_engineId: string, _request: EngineRequest): Promise<readonly string[]> { return ["bestmove e7e5"]; }
  health(engineId: string): EngineHealth {
    return {
      id: engineId,
      status: "ready",
      restartCount: 0,
      identity: this.identity,
      bandOption: "Elo",
      options: [
        { name: "Elo", type: "spin", default: "1400", min: 1000, max: 2400 },
        { name: "SelfElo", type: "spin", default: "1400", min: 1000, max: 2400 },
        { name: "OppoElo", type: "spin", default: "1400", min: 1000, max: 2400 },
      ],
    };
  }
}

function request(id: string, overrides: Partial<CreateRatedGameRequest> = {}): CreateRatedGameRequest {
  return {
    id,
    start: { fen: INITIAL_FEN },
    side: "white",
    band: 1400,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    seed: 17,
    createdAt: AT,
    ...overrides,
  };
}

function selection(moveUci: string, overrides: Partial<OpponentSelection["engine"]> = {}): OpponentSelection {
  return Object.freeze({
    moveUci,
    policyModeApplied: "human_common",
    engine: Object.freeze({
      id: calibratedIdentity.id,
      name: calibratedIdentity.name,
      version: calibratedIdentity.version,
      modelId: calibratedIdentity.modelId!,
      containerDigest: calibratedIdentity.containerDigest!,
      seedHonored: calibratedIdentity.seedHonored,
      eloHonored: true,
      eloApplied: 1400,
      ...overrides,
    }),
  });
}

function setup(identity: EngineIdentity = calibratedIdentity) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
  storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: AT });
  const queue = new EvidenceJobQueue({
    async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; },
  });
  const selector = new OpponentSelector(new RatedEngineClient(identity));
  const service = new RunService(storage, { opponentSelector: selector, evidenceQueue: queue, ratingStorage: storage });
  return { storage, service };
}

describe("rated-game service", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => stores.splice(0).forEach((storage) => storage.close()));

  it("admits only measured rungs, calibrated engine bytes, and the full-material regime", async () => {
    const good = setup(); stores.push(good.storage);
    const run = await good.service.createRatedGame(request("rated-good"), lease);
    expect(run).toMatchObject({ sessionKind: "position", feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1400 } });
    expect(good.storage.ratedGame(run.id)).toMatchObject({ state: "open", opponentBand: 1400, startPieceCount: 32 });
    expect(() => good.service.guidanceAccess(run.id, principal, run.nodes[0]!.id)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
    expect(() => good.service.reveal(run.id, principal, lease.writerId, AT)).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));
    expect(() => good.service.analysis(run.id, principal, lease.writerId, { nodeIds: [run.nodes[0]!.id], kind: "eval" })).toThrow(expect.objectContaining({ code: "ASSISTANCE_WITHHELD" }));

    await expect(good.service.createRatedGame(request("rated-band", { band: 1600 }), lease)).rejects.toMatchObject({ code: "RATING_BAND_NOT_ON_LADDER" });
    await expect(good.service.createRatedGame(request("rated-material", { start: { fen: "7k/8/8/8/8/8/8/K7 w - - 0 1" } }), lease)).rejects.toMatchObject({ code: "RATING_MATERIAL_OUT_OF_RANGE" });

    const wrong = setup({ ...calibratedIdentity, containerDigest: "wrong-digest" }); stores.push(wrong.storage);
    await expect(wrong.service.createRatedGame(request("rated-wrong-engine"), lease)).rejects.toMatchObject({ code: "RATING_OPPONENT_UNCALIBRATED" });
    expect(wrong.storage.read("rated-wrong-engine")).toBeUndefined();
  });

  it("binds the authenticated POST /rated-games contract", async () => {
    const { storage, service } = setup(); stores.push(storage);
    const response = await createRestHandler(service)(new Request("http://server.test/rated-games", {
      method: "POST",
      headers: { "content-type": "application/json", "x-writer-id": "legacy-writer" },
      body: JSON.stringify(request("rated-rest")),
    }));
    expect(response.status).toBe(201);
    expect(storage.ratedGame("rated-rest")).toMatchObject({ learnerId: "__legacy", state: "open" });
    const rating = await createRestHandler(service)(new Request("http://server.test/rating"));
    expect(rating.status).toBe(200);
    expect(await rating.json()).not.toHaveProperty("rating");
  });

  it("voids immediately on a fork and does not remove the playable run", async () => {
    const { storage, service } = setup(); stores.push(storage);
    const run = await service.createRatedGame(request("rated-fork"), lease);
    service.fork(run.id, principal, lease.writerId, run.nodes[0]!.id, { at: AT });
    expect(storage.ratedGame(run.id)).toMatchObject({ state: "voided", voidReason: "forked" });
    expect(storage.read(run.id)?.run.branches).toHaveLength(2);
  });

  it("seals only a rules-terminal game and records the exact terminal cause", async () => {
    const { storage, service } = setup(); stores.push(storage);
    const run = await service.createRatedGame(request("rated-mate"), lease);
    service.move(run.id, principal, lease.writerId, "f2f3", { at: AT });
    service.opponentPly(run.id, principal, lease.writerId, selection("e7e5"), { at: AT });
    service.move(run.id, principal, lease.writerId, "g2g4", { at: AT });
    service.opponentPly(run.id, principal, lease.writerId, selection("d8h4"), { at: AT });

    expect(storage.ratedGame(run.id)).toMatchObject({
      state: "sealed",
      result: "loss",
      terminalReason: "checkmate",
      plyCount: 4,
    });
    expect(service.rating(principal)).toMatchObject({
      rating: { state: "provisional", ratedGames: 1 },
      internal: { calibrationId: RATED_OPPONENT_CALIBRATION.id, periodNo: 0 },
    });
    expect(service.ratingHistory(principal)).toMatchObject({
      periods: [expect.objectContaining({ periodNo: 0, games: 1 })],
      games: [expect.objectContaining({ runId: run.id, state: "sealed" })],
    });
  });

  it("voids when any applied opponent identity departs from the calibration", async () => {
    const { storage, service } = setup(); stores.push(storage);
    const run = await service.createRatedGame(request("rated-engine-drift"), lease);
    service.move(run.id, principal, lease.writerId, "e2e4", { at: AT });
    service.opponentPly(run.id, principal, lease.writerId, selection("e7e5", { containerDigest: "changed" }), { at: AT });
    expect(storage.ratedGame(run.id)).toMatchObject({ state: "voided", voidReason: "engine_changed" });
  });
});
