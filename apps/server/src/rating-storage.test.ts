import { createRun } from "@chess-tabiya/runtime";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import {
  SQLiteRunStorage,
  type OpenRatedGameRecord,
} from "./storage.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AT = "2026-08-22T12:00:00.000Z";
const LATER = "2026-08-22T12:30:00.000Z";

function ratedRun(id: string) {
  return createRun({
    id,
    session: {
      kind: "position",
      start: { fen: FEN, side: "white" },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common", targetElo: 1400 },
    },
    sessionDigest: `sha256:${"a".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    seed: 7,
    createdAt: AT,
  });
}

function declaration(runId: string, learnerId: string, overrides: Partial<OpenRatedGameRecord> = {}): OpenRatedGameRecord {
  return Object.freeze({
    runId,
    learnerId,
    calibrationId: "maia3-5m-band-ladder-2026-08-16",
    opponentBand: 1400,
    opponentRating: 1500,
    opponentRd: 24.1,
    learnerSide: "white",
    startPieceCount: 32,
    engineIdentityDigest: "1e13597c42d4858b7cfd7cfdae01e297263364b2",
    state: "open",
    startedAt: AT,
    ...overrides,
  });
}

describe("rated-game storage", () => {
  it("creates the run, grant, and open rating declaration atomically", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    storage.createLearner({ id: "learner-a", handle: "a", passwordHash: "!", createdAt: AT });
    const run = ratedRun("rated-a");

    storage.createRatedRun(run, { writerId: "writer-a", learnerId: "learner-a" }, "Rated game", declaration(run.id, "learner-a"));

    expect(storage.read(run.id)?.run.id).toBe(run.id);
    expect(storage.runRole(run.id, "learner-a")).toBe("host");
    expect(storage.ratedGame(run.id)).toEqual({
      ...declaration(run.id, "learner-a"),
      voidReason: null,
      result: null,
      terminalReason: null,
      plyCount: null,
      periodNo: null,
      sealedAt: null,
    });
    expect(storage.ratedGames("someone-else")).toEqual([]);
    expect(storage.learnerRating("learner-a")).toMatchObject({
      rating: 1500,
      rd: 350,
      volatility: 0.06,
      ratedGames: 0,
      periodNo: 0,
    });
    expect(storage.ratingPeriods("learner-a")).toEqual([
      expect.objectContaining({ periodNo: 0, games: 0, closedAt: null, ratingBefore: 1500 }),
    ]);
    storage.close();
  });

  it("rolls the run back when its rating declaration cannot be inserted", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    storage.createLearner({ id: "learner-a", handle: "a", passwordHash: "!", createdAt: AT });
    const run = ratedRun("rated-owner-mismatch");

    expect(() => storage.createRatedRun(
      run,
      { writerId: "writer-a", learnerId: "learner-a" },
      "Rated game",
      declaration(run.id, "other-learner"),
    )).toThrow(/does not match its run owner/u);
    expect(storage.read(run.id)).toBeUndefined();
    expect(storage.ratedGame(run.id)).toBeUndefined();
    storage.close();
  });

  it("seals once, remains idempotent for the same terminal fact, and refuses rewriting history", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    storage.createLearner({ id: "learner-a", handle: "a", passwordHash: "!", createdAt: AT });
    const run = ratedRun("rated-sealed");
    storage.createRatedRun(run, { writerId: "writer-a", learnerId: "learner-a" }, "Rated game", declaration(run.id, "learner-a"));
    const terminal = { runId: run.id, result: "win" as const, terminalReason: "checkmate" as const, plyCount: 47, sealedAt: LATER };

    expect(storage.sealRatedGame(terminal)).toMatchObject({ state: "sealed", result: "win", terminalReason: "checkmate", plyCount: 47 });
    expect(storage.sealRatedGame(terminal)).toMatchObject({ state: "sealed", result: "win" });
    expect(() => storage.voidRatedGame(run.id, "rewound", LATER)).toThrowError(expect.objectContaining({ code: "RATED_GAME_CLOSED" }));
    expect(() => storage.sealRatedGame({ ...terminal, result: "loss" })).toThrow(/already sealed or voided/u);
    expect(storage.learnerRating("learner-a")).toMatchObject({ ratedGames: 1, periodNo: 0 });
    expect(storage.ratingPeriods("learner-a")[0]).toMatchObject({ games: 1, closedAt: null });
    expect(storage.learnerMarks("learner-a")).toEqual([
      expect.objectContaining({ mark: "bronze", runId: run.id, earnedAt: LATER }),
    ]);
    storage.close();
  });

  it("closes a twelve-game period with one Glicko update and opens the next period", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    storage.createLearner({ id: "learner-a", handle: "a", passwordHash: "!", createdAt: AT });
    for (let index = 0; index < 12; index += 1) {
      const run = ratedRun(`rated-period-${index}`);
      storage.createRatedRun(run, { writerId: "writer-a", learnerId: "learner-a" }, "Rated game", declaration(run.id, "learner-a"));
      storage.sealRatedGame({
        runId: run.id,
        result: "loss",
        terminalReason: "checkmate",
        plyCount: 20 + index,
        sealedAt: `2026-08-22T14:${String(index).padStart(2, "0")}:00.000Z`,
      });
    }

    const rating = storage.learnerRating("learner-a")!;
    expect(rating).toMatchObject({ ratedGames: 12, periodNo: 1 });
    expect(rating.rating).toBeLessThan(1500);
    expect(rating.rd).toBeLessThan(350);
    expect(storage.ratingPeriods("learner-a")).toEqual([
      expect.objectContaining({ periodNo: 0, games: 12, closedAt: "2026-08-22T14:11:00.000Z", ratingAfter: rating.rating }),
      expect.objectContaining({ periodNo: 1, games: 0, closedAt: null, ratingBefore: rating.rating }),
    ]);
    expect(storage.ratedGames("learner-a").every((game) => game.periodNo === 0)).toBe(true);
    storage.close();
  });

  it("voids once with a named reason and never converts a void into a result", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    storage.createLearner({ id: "learner-a", handle: "a", passwordHash: "!", createdAt: AT });
    const run = ratedRun("rated-voided");
    storage.createRatedRun(run, { writerId: "writer-a", learnerId: "learner-a" }, "Rated game", declaration(run.id, "learner-a"));

    expect(storage.voidRatedGame(run.id, "forked", LATER)).toMatchObject({ state: "voided", voidReason: "forked", sealedAt: LATER });
    expect(storage.voidRatedGame(run.id, "forked", "2026-08-22T13:00:00.000Z")).toMatchObject({ state: "voided", voidReason: "forked", sealedAt: LATER });
    expect(() => storage.voidRatedGame(run.id, "rewound", LATER)).toThrowError(expect.objectContaining({ code: "RATED_GAME_CLOSED" }));
    expect(() => storage.sealRatedGame({ runId: run.id, result: "draw", terminalReason: "stalemate", plyCount: 70, sealedAt: LATER })).toThrow(/already sealed or voided/u);
    expect(storage.learnerRating("learner-a")).toMatchObject({ voidedGames: 1, abandonedGames: 0 });
    storage.close();
  });

  it("permits at most one rated result for every generated seal/void action sequence", () => {
    fc.assert(fc.property(
      fc.array(fc.constantFrom("seal_win", "seal_loss", "seal_draw", "void_fork", "void_rewind", "void_abandon"), { minLength: 1, maxLength: 30 }),
      (actions) => {
        const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
        storage.createLearner({ id: "learner-a", handle: "a", passwordHash: "!", createdAt: AT });
        const run = ratedRun("rated-generated");
        storage.createRatedRun(run, { writerId: "writer-a", learnerId: "learner-a" }, "Rated game", declaration(run.id, "learner-a"));
        for (const action of actions) {
          try {
            if (action.startsWith("seal_")) {
              const result = action.slice("seal_".length) as "win" | "loss" | "draw";
              storage.sealRatedGame({ runId: run.id, result, terminalReason: result === "draw" ? "stalemate" : "checkmate", plyCount: 42, sealedAt: LATER });
            } else {
              const reason = action === "void_fork" ? "forked" : action === "void_rewind" ? "rewound" : "abandoned";
              storage.voidRatedGame(run.id, reason, LATER);
            }
          } catch {
            // Conflicting later actions must refuse; the final record is the property under test.
          }
        }
        const records = storage.ratedGames("learner-a");
        expect(records).toHaveLength(1);
        expect(records[0]!.state).not.toBe("open");
        expect(records.filter((record) => record.state === "sealed")).toHaveLength(records[0]!.state === "sealed" ? 1 : 0);
        expect(storage.learnerRating("learner-a")!.ratedGames).toBe(records[0]!.state === "sealed" ? 1 : 0);
        storage.close();
      },
    ), { numRuns: 250 });
  });

  it("expires open games after thirty days and counts abandonment separately", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    storage.createLearner({ id: "learner-a", handle: "a", passwordHash: "!", createdAt: AT });
    const run = ratedRun("rated-abandoned");
    storage.createRatedRun(run, { writerId: "writer-a", learnerId: "learner-a" }, "Rated game", declaration(run.id, "learner-a"));

    expect(storage.expireRatedGames("2026-09-20T13:59:59.999Z")).toEqual([]);
    expect(storage.expireRatedGames("2026-09-21T14:00:00.000Z")).toEqual([
      expect.objectContaining({ runId: run.id, state: "voided", voidReason: "abandoned" }),
    ]);
    expect(storage.learnerRating("learner-a")).toMatchObject({ voidedGames: 1, abandonedGames: 1 });
    expect(storage.expireRatedGames("2026-10-22T14:00:00.000Z")).toEqual([]);
    storage.close();
  });
});
