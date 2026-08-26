import { createHash } from "node:crypto";

import { createRun } from "@chess-tabiya/runtime";
import { ratedOpponentRung, type RatedOpponentBand } from "@chess-tabiya/runtime/rating";
import { afterEach, describe, expect, it } from "vitest";

import { IdentityService } from "./identity.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage, type OpenRatedGameRecord } from "./storage.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AT = "2026-08-22T10:00:00.000Z";
const teacher = Object.freeze({ learnerId: "teacher", handle: "teacher" });
const learnerA = Object.freeze({ learnerId: "learner-a", handle: "alpha" });
const learnerB = Object.freeze({ learnerId: "learner-b", handle: "beta" });
const outsider = Object.freeze({ learnerId: "outsider", handle: "outsider" });

function run(id: string) {
  return createRun({
    id,
    session: { kind: "position", start: { fen: FEN, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1400 } },
    sessionDigest: `sha256:${"b".repeat(64)}`,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 19,
    createdAt: AT,
  });
}

function game(runId: string, learnerId: string, opponentBand: RatedOpponentBand = 1400): OpenRatedGameRecord {
  const rung = ratedOpponentRung(opponentBand)!;
  return Object.freeze({
    runId, learnerId, calibrationId: "maia3-5m-band-ladder-2026-08-16",
    opponentBand, opponentRating: rung.rating, opponentRd: rung.rd,
    learnerSide: "white", startPieceCount: 32,
    engineIdentityDigest: "1e13597c42d4858b7cfd7cfdae01e297263364b2",
    state: "open", startedAt: AT,
  });
}

function addMember(storage: SQLiteRunStorage, learnerId: string) {
  storage.inviteClassroomMember({
    classroomId: "club", learnerId, memberRole: "learner", state: "invited",
    invitedBy: teacher.learnerId, invitedAt: AT,
  });
  storage.setClassroomMemberState("club", learnerId, "active", AT);
}

function addResult(
  storage: SQLiteRunStorage,
  learnerId: string,
  id: string,
  result: "win" | "loss" | "draw",
  opponentBand: RatedOpponentBand = 1400,
) {
  const value = run(id);
  storage.createRatedRun(value, { writerId: `writer-${learnerId}`, learnerId }, "Rated game", game(id, learnerId, opponentBand));
  storage.sealRatedGame({ runId: id, result, terminalReason: "checkmate", plyCount: 30, sealedAt: "2026-08-22T11:00:00.000Z" });
}

describe("cohort standing", () => {
  const stores: SQLiteRunStorage[] = [];
  afterEach(() => stores.splice(0).forEach((storage) => storage.close()));

  function setup() {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    for (const principal of [teacher, learnerA, learnerB, outsider]) {
      storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: AT });
    }
    storage.createClassroom({ id: "club", ownerLearnerId: teacher.learnerId, name: "Club", createdAt: AT, archivedAt: null });
    addMember(storage, learnerA.learnerId); addMember(storage, learnerB.learnerId);
    return { storage, service: new RunService(storage, { ratingStorage: storage, classroomStorage: storage }) };
  }

  it("opens empty, requires each learner to publish themselves, and defaults rating off", () => {
    const { service } = setup();
    service.openCohortStanding(teacher, "club", { windowFrom: "2026-08-01T00:00:00.000Z", at: AT });
    expect(service.cohortStanding(teacher, "club").entries).toEqual([]);
    expect(service.publishCohortStanding(learnerA, "club", AT)).toMatchObject({ learnerId: learnerA.learnerId, showRecord: true, showRating: false });
    expect(service.cohortStanding(teacher, "club").entries).toEqual([
      expect.objectContaining({ learnerId: learnerA.learnerId, handle: "alpha", record: expect.objectContaining({ wins: 0, draws: 0, losses: 0, games: 0, points: 0, abandoned: 0 }) }),
    ]);
    expect(() => service.cohortStanding(outsider, "club")).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("orders by sealed results, exposes no run, and never turns a provisional rating into a cell", () => {
    const { storage, service } = setup();
    service.openCohortStanding(teacher, "club", { windowFrom: "2026-08-01T00:00:00.000Z", at: AT });
    addResult(storage, learnerA.learnerId, "a-win", "win");
    addResult(storage, learnerB.learnerId, "b-loss", "loss");
    service.publishCohortStanding(learnerB, "club", AT);
    service.publishCohortStanding(learnerA, "club", AT);
    service.setCohortStandingVisibility(learnerA, "club", "rating", true);

    const view = service.cohortStanding(teacher, "club");
    expect(view.entries.map((entry) => entry.handle)).toEqual(["alpha", "beta"]);
    expect(view.entries[0]).toMatchObject({
      marks: [{ mark: "bronze", band: 1400, calibrationId: expect.any(String), earnedAt: expect.any(String) }],
      record: {
        wins: 1, draws: 0, losses: 0, games: 1, points: 1, abandoned: 0,
        byOpponentBand: [{ opponentBand: 1400, wins: 1, draws: 0, losses: 0, games: 1, points: 1 }],
      },
    });
    expect(view.entries[0]).not.toHaveProperty("rating");
    expect(JSON.stringify(view)).not.toMatch(/a-win|runId|branch|fen|evidence|percentile|zScore|cohortMean|"rank"/iu);
    expect(view.limitation).toMatch(/nobody witnessed/iu);
  });

  it("orders only by results even when published rating points in the opposite direction", () => {
    const { storage, service } = setup();
    service.openCohortStanding(teacher, "club", { windowFrom: "2026-08-01T00:00:00.000Z", at: AT });
    for (let index = 0; index < 120; index += 1) {
      const result = index % 2 === 0 ? "win" : "loss";
      addResult(storage, learnerA.learnerId, `alpha-low-${index}`, result, 1000);
      addResult(storage, learnerB.learnerId, `beta-high-${index}`, result, 2200);
    }
    const alphaRating = storage.learnerRating(learnerA.learnerId)!;
    const betaRating = storage.learnerRating(learnerB.learnerId)!;
    expect(betaRating.rating).toBeGreaterThan(alphaRating.rating);

    for (const learner of [learnerA, learnerB]) {
      service.publishCohortStanding(learner, "club", AT);
      service.setCohortStandingVisibility(learner, "club", "rating", true);
    }
    const entries = service.cohortStanding(teacher, "club").entries;
    expect(entries.map((entry) => entry.handle)).toEqual(["alpha", "beta"]);
    expect(entries.every((entry) => entry.record?.points === 60 && entry.record.games === 120)).toBe(true);
    expect(entries.every((entry) => entry.rating !== undefined)).toBe(true);
  });

  it("keeps rating projection byte-equal across classroom publication and non-membership", () => {
    const { storage, service } = setup();
    service.openCohortStanding(teacher, "club", { windowFrom: "2026-08-01T00:00:00.000Z", at: AT });
    addResult(storage, learnerA.learnerId, "member-result", "draw", 1800);
    addResult(storage, outsider.learnerId, "outsider-result", "draw", 1800);

    const normalizeRating = (learnerId: string) => {
      const { learnerId: _ignored, ...state } = storage.learnerRating(learnerId)!;
      return state;
    };
    const normalizeGame = (learnerId: string) => storage.ratedGames(learnerId).map(({ runId: _run, learnerId: _learner, ...record }) => record);
    expect(normalizeRating(learnerA.learnerId)).toEqual(normalizeRating(outsider.learnerId));
    expect(normalizeGame(learnerA.learnerId)).toEqual(normalizeGame(outsider.learnerId));

    service.publishCohortStanding(learnerA, "club", AT);
    service.setCohortStandingVisibility(learnerA, "club", "rating", true);
    service.cohortStanding(teacher, "club");
    expect(normalizeRating(learnerA.learnerId)).toEqual(normalizeRating(outsider.learnerId));
    expect(normalizeGame(learnerA.learnerId)).toEqual(normalizeGame(outsider.learnerId));
  });

  it("never aggregates entries across classroom boundaries", () => {
    const { storage, service } = setup();
    storage.createClassroom({ id: "other-club", ownerLearnerId: teacher.learnerId, name: "Other club", createdAt: AT, archivedAt: null });
    storage.inviteClassroomMember({ classroomId: "other-club", learnerId: outsider.learnerId, memberRole: "learner", state: "invited", invitedBy: teacher.learnerId, invitedAt: AT });
    storage.setClassroomMemberState("other-club", outsider.learnerId, "active", AT);
    service.openCohortStanding(teacher, "club", { windowFrom: "2026-08-01T00:00:00.000Z", at: AT });
    service.openCohortStanding(teacher, "other-club", { windowFrom: "2026-08-01T00:00:00.000Z", at: AT });
    service.publishCohortStanding(learnerA, "club", AT);
    service.publishCohortStanding(outsider, "other-club", AT);

    expect(service.cohortStanding(teacher, "club").entries.map((entry) => entry.learnerId)).toEqual([learnerA.learnerId]);
    expect(service.cohortStanding(teacher, "other-club").entries.map((entry) => entry.learnerId)).toEqual([outsider.learnerId]);
  });

  it("withdraws immediately and leaving the classroom removes the entry", () => {
    const { storage, service } = setup();
    service.openCohortStanding(teacher, "club", { windowFrom: "2026-08-01T00:00:00.000Z", at: AT });
    service.publishCohortStanding(learnerA, "club", AT);
    service.withdrawCohortStanding(learnerA, "club");
    expect(service.cohortStanding(teacher, "club").entries).toEqual([]);
    service.publishCohortStanding(learnerA, "club", AT);
    storage.setClassroomMemberState("club", learnerA.learnerId, "left", AT);
    expect(service.cohortStanding(teacher, "club").entries).toEqual([]);
  });

  it("allows only an active teacher to configure the standing", () => {
    const { service } = setup();
    expect(() => service.openCohortStanding(learnerA, "club", { windowFrom: AT })).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
    service.openCohortStanding(teacher, "club", { windowFrom: AT });
    expect(() => service.configureCohortStanding(learnerA, "club", { op: "close" })).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("makes self-publication structural at the authenticated route boundary", async () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
    const identity = new IdentityService(storage, {
      cookieSecure: false,
      derive: (password, salt) => Promise.resolve(createHash("sha256").update(salt).update(password).digest()),
    });
    const teacherSession = await identity.register({ handle: "route-teacher", password: "correct horse battery staple" });
    const learnerSession = await identity.register({ handle: "route-learner", password: "correct horse battery staple" });
    storage.createClassroom({ id: "route-club", ownerLearnerId: teacherSession.learner.id, name: "Route club", createdAt: AT, archivedAt: null });
    storage.inviteClassroomMember({
      classroomId: "route-club", learnerId: learnerSession.learner.id, memberRole: "learner",
      state: "invited", invitedBy: teacherSession.learner.id, invitedAt: AT,
    });
    storage.setClassroomMemberState("route-club", learnerSession.learner.id, "active", AT);
    const handler = createRestHandler(
      new RunService(storage, { ratingStorage: storage, classroomStorage: storage }),
      undefined, undefined, identity,
    );
    const call = (session: typeof teacherSession, body: unknown) => handler(new Request("http://tabiya.test/cohorts/route-club/standing", {
      method: "POST",
      headers: { cookie: session.cookie.split(";", 1)[0]!, "content-type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect((await call(teacherSession, { op: "open", windowFrom: "2026-08-01T00:00:00.000Z", at: AT })).status).toBe(201);
    expect((await call(teacherSession, { op: "publish", handle: learnerSession.learner.handle })).status).toBe(400);
    expect((await call(learnerSession, { op: "publish" })).status).toBe(201);
    expect(storage.standingMembers("route-club").map((member) => member.learnerId)).toEqual([learnerSession.learner.id]);
  });
});
