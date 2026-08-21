import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { commitMove, createRun } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { SQLiteRunStorage } from "./storage.js";
import { RunService } from "./service.js";
import { ClassroomService } from "./classroom.js";
import { IdentityService } from "./identity.js";
import type { PackRegistry } from "./pack-registry.js";
import { createRestHandler } from "./rest.js";

const AT = "2026-08-22T10:00:00.000Z";
const EXPIRES = "2026-09-21T10:00:00.000Z";

function drillRun(id: string, packId = "pack-a") {
  return createRun({
    id,
    packId,
    packDigest: `sha256:${"7".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    seed: 1,
    createdAt: AT,
  });
}

describe("teacher-surface consent storage", () => {
  it("keeps enrollment separate from run access and revokes only submission-minted grants", () => {
    let now = AT;
    const storage = new SQLiteRunStorage(":memory:", { now: () => now, onMigration: () => {} });
    const teacher = storage.createLearner({ id: "teacher", handle: "teacher", passwordHash: "!", createdAt: AT });
    const learner = storage.createLearner({ id: "learner", handle: "learner", passwordHash: "!", createdAt: AT });
    const independent = storage.createLearner({ id: "independent", handle: "independent", passwordHash: "!", createdAt: AT });
    const run = drillRun("run-a");
    storage.create(run, { writerId: "writer", learnerId: learner.id });

    storage.createClassroom({ id: "class-a", ownerLearnerId: teacher.id, name: "Study group", createdAt: AT, archivedAt: null });
    storage.inviteClassroomMember({ classroomId: "class-a", learnerId: learner.id, memberRole: "learner", state: "invited", invitedBy: teacher.id, invitedAt: AT });
    storage.setClassroomMemberState("class-a", learner.id, "active", AT);
    expect(storage.runRole(run.id, teacher.id)).toBeUndefined();

    storage.grantRole(run.id, independent.id, "spectator", { writerId: "writer", learnerId: learner.id }, AT);
    storage.createAssignment({ id: "assignment-a", classroomId: "class-a", packId: "pack-a", assignedBy: teacher.id, note: "Compare both plans", dueAt: null, createdAt: AT, withdrawnAt: null });
    const submitted = storage.submitAssignment({ assignmentId: "assignment-a", learnerId: learner.id, runId: run.id, grantedLearnerIds: [], submittedAt: AT, accessExpiresAt: EXPIRES, withdrawnAt: null }, [teacher.id]);
    expect(submitted.grantedLearnerIds).toEqual([teacher.id]);
    expect(storage.runRole(run.id, teacher.id)).toBe("spectator");
    expect(storage.grantMintedBySubmission(run.id, teacher.id)).toBe(true);

    storage.withdrawAssignmentSubmission("assignment-a", learner.id, run.id, AT);
    expect(storage.runRole(run.id, teacher.id)).toBeUndefined();
    expect(storage.runRole(run.id, independent.id)).toBe("spectator");
    storage.close();
  });

  it("treats an expired classroom grant as absent on every public storage read", () => {
    let now = AT;
    const storage = new SQLiteRunStorage(":memory:", { now: () => now, onMigration: () => {} });
    const teacher = storage.createLearner({ id: "teacher", handle: "teacher", passwordHash: "!", createdAt: AT });
    const learner = storage.createLearner({ id: "learner", handle: "learner", passwordHash: "!", createdAt: AT });
    const run = drillRun("run-expiry");
    storage.create(run, { writerId: "writer", learnerId: learner.id });
    storage.createClassroom({ id: "class-a", ownerLearnerId: teacher.id, name: "Study group", createdAt: AT, archivedAt: null });
    storage.createAssignment({ id: "assignment-a", classroomId: "class-a", packId: "pack-a", assignedBy: teacher.id, note: null, dueAt: null, createdAt: AT, withdrawnAt: null });
    storage.submitAssignment({ assignmentId: "assignment-a", learnerId: learner.id, runId: run.id, grantedLearnerIds: [], submittedAt: AT, accessExpiresAt: EXPIRES, withdrawnAt: null }, [teacher.id]);

    now = "2026-09-22T10:00:00.000Z";
    expect(storage.runRole(run.id, teacher.id)).toBeUndefined();
    expect(storage.grants(run.id).map((grant) => grant.learnerId)).not.toContain(teacher.id);
    expect(storage.list(teacher.id, 10, 0)).toEqual([]);
    expect(storage.grantMintedBySubmission(run.id, teacher.id)).toBe(false);
    storage.close();
  });

  it("projects review consent after an outcome and lets an open live session close it", () => {
    const storage = new SQLiteRunStorage(":memory:", { now: () => AT, onMigration: () => {} });
    const teacher = storage.createLearner({ id: "teacher", handle: "teacher", passwordHash: "!", createdAt: AT });
    const learner = storage.createLearner({ id: "learner", handle: "learner", passwordHash: "!", createdAt: AT });
    const terminalStart = createRun({
      id: "terminal-run", packId: "pack-a", packDigest: `sha256:${"7".repeat(64)}`,
      startFen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", seed: 1, createdAt: AT,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    });
    const terminal = commitMove(terminalStart, "g6g7", { at: AT }).run;
    storage.create(terminal, { writerId: "writer", learnerId: learner.id });
    storage.createClassroom({ id: "class-a", ownerLearnerId: teacher.id, name: "Study group", createdAt: AT, archivedAt: null });
    storage.createAssignment({ id: "assignment-a", classroomId: "class-a", packId: "pack-a", assignedBy: teacher.id, note: null, dueAt: null, createdAt: AT, withdrawnAt: null });
    storage.submitAssignment({ assignmentId: "assignment-a", learnerId: learner.id, runId: terminal.id, grantedLearnerIds: [], submittedAt: AT, accessExpiresAt: EXPIRES, withdrawnAt: null }, [teacher.id]);
    const service = new RunService(storage);
    const teacherPrincipal = { learnerId: teacher.id, handle: teacher.handle };
    expect(service.graph(terminal.id, teacherPrincipal).viewer).toMatchObject({ role: "spectator", reviewing: true, seatedInContest: false });

    storage.createLiveSession({ id: "review-session", runId: terminal.id, kind: "academy", title: "Review", boardControl: "host_directed", createdBy: learner.id, at: AT });
    expect(service.graph(terminal.id, teacherPrincipal).viewer.reviewing).toBe(false);
    storage.closeLiveSession("review-session", learner.id, AT);
    expect(service.graph(terminal.id, teacherPrincipal).viewer.reviewing).toBe(true);

    const promotionStart = createRun({
      id: "promotion-run", packId: "pack-a", packDigest: `sha256:${"7".repeat(64)}`,
      startFen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", seed: 2, createdAt: AT,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    });
    const promotion = commitMove(promotionStart, "g6g7", { at: AT }).run;
    storage.create(promotion, { writerId: "promotion-writer", learnerId: learner.id });
    storage.submitAssignment({ assignmentId: "assignment-a", learnerId: learner.id, runId: promotion.id, grantedLearnerIds: [], submittedAt: AT, accessExpiresAt: EXPIRES, withdrawnAt: null }, [teacher.id]);
    storage.createLiveSession({ id: "promotion-session", runId: promotion.id, kind: "academy", title: "Promotion", boardControl: "host_directed", createdBy: learner.id, at: AT });
    storage.createSessionJoinToken({ id: "promotion-link", tokenHash: "promotion-hash", scope: "session_join", sessionId: "promotion-session", matchSlot: null, invitedRole: "participant", invitedHandle: teacher.handle, expiresAt: EXPIRES, usesRemaining: 1, createdBy: learner.id, createdAt: AT, revokedAt: null });
    expect(storage.redeemSessionJoinToken("promotion-hash", teacher.id, teacher.handle, AT)).toBeDefined();
    expect(storage.grants(promotion.id).find((grant) => grant.learnerId === teacher.id)).toMatchObject({ role: "participant", expiresAt: EXPIRES });
    expect(storage.grantMintedBySubmission(promotion.id, teacher.id)).toBe(false);
    storage.close();
  });

  it("keeps enrollment powerless across the authenticated classroom routes", async () => {
    const storage = new SQLiteRunStorage(":memory:", { now: () => AT, onMigration: () => {} });
    const identity = new IdentityService(storage, {
      cookieSecure: false,
      derive: (password, salt) => Promise.resolve(createHash("sha256").update(salt).update(password).digest()),
    });
    const teacher = await identity.register({ handle: "teacher-route", password: "correct horse battery staple" });
    const learner = await identity.register({ handle: "learner-route", password: "correct horse battery staple" });
    const packs = { get: (id: string) => id === "pack-a" ? ({ document: { id } }) : undefined } as unknown as PackRegistry;
    const classrooms = new ClassroomService(storage, packs, () => AT);
    const runs = new RunService(storage);
    const handler = createRestHandler(runs, undefined, undefined, identity, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, classrooms);
    const call = (method: string, path: string, session: typeof teacher, body?: unknown) => handler(new Request(`http://tabiya.test${path}`, {
      method,
      headers: { cookie: session.cookie.split(";", 1)[0]!, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }));

    const created = await call("POST", "/classrooms", teacher, { name: "Route class" });
    expect(created.status).toBe(201);
    const classroomId = ((await created.json()) as { classroom: { id: string } }).classroom.id;
    expect((await call("POST", `/classrooms/${classroomId}/members`, teacher, { op: "invite", handle: "learner-route", role: "learner" })).status).toBe(201);
    const run = drillRun("route-run");
    storage.create(run, { writerId: "writer", learnerId: learner.learner.id });
    expect((await call("GET", `/runs/${run.id}/graph`, teacher)).status).toBe(404);

    expect((await call("POST", `/classrooms/${classroomId}/members`, learner, { op: "accept" })).status).toBe(200);
    const assignmentResponse = await call("POST", `/classrooms/${classroomId}/assignments`, teacher, { packId: "pack-a", note: "Compare the structures" });
    expect(assignmentResponse.status).toBe(201);
    const assignmentId = ((await assignmentResponse.json()) as { assignment: { id: string } }).assignment.id;
    expect((await call("POST", `/assignments/${assignmentId}/submissions`, learner, { runId: run.id })).status).toBe(201);
    expect((await call("GET", `/runs/${run.id}/graph`, teacher)).status).toBe(200);
    expect((await call("POST", `/assignments/${assignmentId}/submissions`, learner, { op: "withdraw", runId: run.id })).status).toBe(200);
    expect((await call("GET", `/runs/${run.id}/graph`, teacher)).status).toBe(404);
    storage.close();
  });

  it("bounds a match seat to the lifetime of the open session", () => {
    const storage = new SQLiteRunStorage(":memory:", { now: () => AT, onMigration: () => {} });
    const host = storage.createLearner({ id: "host", handle: "host", passwordHash: "!", createdAt: AT });
    const guest = storage.createLearner({ id: "guest", handle: "guest", passwordHash: "!", createdAt: AT });
    const run = drillRun("match-run", "match-pack");
    storage.create(run, { writerId: "writer", learnerId: host.id });
    storage.createLiveSession({ id: "match-session", runId: run.id, kind: "match", title: "Match", boardControl: "match", createdBy: host.id, at: AT, matchPlayers: { whiteLearnerId: host.id, blackLearnerId: guest.id } });
    const service = new RunService(storage);
    const principal = { learnerId: host.id, handle: host.handle };
    expect(service.graph(run.id, principal).viewer.seatedInContest).toBe(true);
    storage.closeLiveSession("match-session", host.id, AT);
    expect(service.graph(run.id, principal).viewer.seatedInContest).toBe(false);
    storage.close();
  });

  it("revokes classroom-minted grants before either side of account deletion", () => {
    const storage = new SQLiteRunStorage(":memory:", { now: () => AT, onMigration: () => {} });
    const owner = storage.createLearner({ id: "owner", handle: "owner", passwordHash: "!", createdAt: AT });
    const coTeacher = storage.createLearner({ id: "co-teacher", handle: "co-teacher", passwordHash: "!", createdAt: AT });
    const learner = storage.createLearner({ id: "deleting-learner", handle: "deleting-learner", passwordHash: "!", createdAt: AT });
    const run = drillRun("account-delete-run");
    storage.create(run, { writerId: "writer", learnerId: learner.id });
    storage.createClassroom({ id: "account-class", ownerLearnerId: owner.id, name: "Account class", createdAt: AT, archivedAt: null });
    storage.inviteClassroomMember({ classroomId: "account-class", learnerId: coTeacher.id, memberRole: "teacher", state: "invited", invitedBy: owner.id, invitedAt: AT });
    storage.setClassroomMemberState("account-class", coTeacher.id, "active", AT);
    storage.inviteClassroomMember({ classroomId: "account-class", learnerId: learner.id, memberRole: "learner", state: "invited", invitedBy: owner.id, invitedAt: AT });
    storage.setClassroomMemberState("account-class", learner.id, "active", AT);
    storage.createAssignment({ id: "account-assignment", classroomId: "account-class", packId: "pack-a", assignedBy: owner.id, note: null, dueAt: null, createdAt: AT, withdrawnAt: null });
    storage.submitAssignment({ assignmentId: "account-assignment", learnerId: learner.id, runId: run.id, grantedLearnerIds: [], submittedAt: AT, accessExpiresAt: EXPIRES, withdrawnAt: null }, [owner.id, coTeacher.id]);
    expect(storage.runRole(run.id, coTeacher.id)).toBe("spectator");

    storage.deleteLearner(owner.id, AT);
    expect(storage.runRole(run.id, coTeacher.id)).toBeUndefined();

    const ownerTwo = storage.createLearner({ id: "owner-two", handle: "owner-two", passwordHash: "!", createdAt: AT });
    const runTwo = drillRun("learner-delete-run");
    storage.create(runTwo, { writerId: "writer-two", learnerId: learner.id });
    storage.createClassroom({ id: "learner-delete-class", ownerLearnerId: ownerTwo.id, name: "Learner delete class", createdAt: AT, archivedAt: null });
    storage.inviteClassroomMember({ classroomId: "learner-delete-class", learnerId: learner.id, memberRole: "learner", state: "invited", invitedBy: ownerTwo.id, invitedAt: AT });
    storage.setClassroomMemberState("learner-delete-class", learner.id, "active", AT);
    storage.createAssignment({ id: "learner-delete-assignment", classroomId: "learner-delete-class", packId: "pack-a", assignedBy: ownerTwo.id, note: null, dueAt: null, createdAt: AT, withdrawnAt: null });
    storage.submitAssignment({ assignmentId: "learner-delete-assignment", learnerId: learner.id, runId: runTwo.id, grantedLearnerIds: [], submittedAt: AT, accessExpiresAt: EXPIRES, withdrawnAt: null }, [ownerTwo.id]);
    storage.deleteLearner(learner.id, AT);
    expect(storage.runRole(runTwo.id, ownerTwo.id)).toBeUndefined();
    storage.close();
  });

  it("pins every run-grant reader and writer and forbids learner cascades", () => {
    const source = readFileSync(new URL("./storage.ts", import.meta.url), "utf8");
    const references = source.match(/\brun_grants\b/g)?.length ?? 0;
    const inserts = source.match(/INSERT(?: OR IGNORE)? INTO run_grants/g)?.length ?? 0;
    const roleUpdates = source.match(/UPDATE run_grants SET\s+(?:\n\s+)?role/g)?.length ?? 0;
    const deletes = source.match(/DELETE FROM run_grants/g)?.length ?? 0;
    const definitions = source.match(/CREATE TABLE run_grants|CREATE INDEX run_grants|columns\("run_grants"\)|ALTER TABLE run_grants/g)?.length ?? 0;
    expect({ references, readers: references - inserts - roleUpdates - deletes - definitions, writers: inserts + roleUpdates })
      .toEqual({ references: 31, readers: 10, writers: 13 });

    const classroomMigration = source.slice(
      source.lastIndexOf("#addClassroomTables"),
      source.indexOf("#insertLegacy", source.lastIndexOf("#addClassroomTables")),
    );
    expect(classroomMigration).not.toMatch(/(?:classrooms|classroom_members|assignments|assignment_submissions)[\s\S]*REFERENCES learners\(id\)/);
  });
});
