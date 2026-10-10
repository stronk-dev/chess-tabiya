import { describe, expect, it } from "vitest";
import { DrillApi, type ClassroomDetail } from "./api.js";

function detail(): ClassroomDetail {
  const membership: ClassroomDetail["membership"] = { classroomId: "class/one", learnerId: "teacher", handle: "coach", memberRole: "teacher", state: "active", invitedBy: null, invitedAt: "2026-10-10T12:00:00.000Z", joinedAt: "2026-10-10T12:00:00.000Z", leftAt: null };
  return { classroom: { id: membership.classroomId, ownerLearnerId: "teacher", name: "Class one", createdAt: membership.invitedAt, archivedAt: null }, membership, members: [membership], assignments: [], submissions: [], upcomingSessions: [] };
}

describe("classroom detail HTTP admission", () => {
  it("accepts an empty classroom and requests the encoded exact identity", async () => {
    const value = detail();
    const api = new DrillApi("", async input => {
      expect(String(input)).toBe("/classrooms/class%2Fone");
      return Response.json(value);
    });
    expect(await api.classroom("class/one")).toEqual(value);
  });

  it.each(["root", "membership", "member", "assignment", "submission", "session", "duplicate assignment", "missing collection"])("rejects %s before returning the HTTP detail", async kind => {
    const value = structuredClone({ ...detail() });
    const assignment = { id: "assignment", classroomId: value.classroom.id, packId: "pack", assignedBy: "teacher", note: null, dueAt: null, createdAt: value.classroom.createdAt, withdrawnAt: null };
    if (kind === "root") value.classroom = { ...value.classroom, id: "other" };
    if (kind === "membership") value.membership = { ...value.membership, classroomId: "other" };
    if (kind === "member") value.members = [{ ...value.membership, classroomId: "other" }];
    if (kind === "assignment") value.assignments = [{ ...assignment, classroomId: "other" }];
    if (kind === "submission") value.submissions = [{ assignmentId: "absent", learnerId: "former-member", runId: "run", grantedLearnerIds: [], submittedAt: value.classroom.createdAt, accessExpiresAt: value.classroom.createdAt, withdrawnAt: null }];
    if (kind === "session") value.upcomingSessions = [{ id: "session", runId: "run", kind: "academy", title: "Session", classroomId: "other", createdBy: "teacher", createdAt: value.classroom.createdAt, boardControl: "host_directed", rotationCursor: 0 }];
    if (kind === "duplicate assignment") value.assignments = [assignment, assignment];
    const body: unknown = kind === "missing collection" ? { ...value, submissions: undefined } : value;
    const api = new DrillApi("", async () => Response.json(body));
    await expect(api.classroom("class/one")).rejects.toThrow("Classroom detail does not match");
  });

  it("does not reject historical submissions just because the learner left the roster", async () => {
    const value = structuredClone({ ...detail() });
    value.assignments = [{ id: "assignment", classroomId: value.classroom.id, packId: "pack", assignedBy: "teacher", note: null, dueAt: null, createdAt: value.classroom.createdAt, withdrawnAt: null }];
    value.submissions = [{ assignmentId: "assignment", learnerId: "former-member", runId: "run", grantedLearnerIds: [], submittedAt: value.classroom.createdAt, accessExpiresAt: value.classroom.createdAt, withdrawnAt: null }];
    const api = new DrillApi("", async () => Response.json(value));
    expect(await api.classroom("class/one")).toEqual(value);
  });
});
