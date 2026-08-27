import { randomUUID } from "node:crypto";

import type { Principal } from "./authorization.js";
import { ServerError } from "./errors.js";
import type { PackRegistry } from "./pack-registry.js";
import type {
  AssignmentRecord,
  ClassroomMemberRecord,
  ClassroomMemberRole,
  ClassroomRecord,
  ClassroomStorage,
  RunStorage,
} from "./storage.js";

type TeacherStorage = RunStorage & ClassroomStorage;

function unavailable(): ServerError {
  return new ServerError("INVALID_REQUEST", "Classroom or assignment is unavailable");
}

export class ClassroomService {
  constructor(
    private readonly storage: TeacherStorage,
    private readonly packs: PackRegistry,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  create(principal: Principal, name: string): ClassroomRecord & {
    readonly memberRole: "teacher";
    readonly memberState: "active";
  } {
    const owned = this.storage.classroomsFor(principal.learnerId)
      .filter((classroom) => classroom.ownerLearnerId === principal.learnerId && classroom.archivedAt === null);
    if (owned.length >= 50) throw new ServerError("INVALID_REQUEST", "A learner may own at most 50 classrooms");
    const at = this.now();
    const classroom = Object.freeze({
      id: `classroom-${randomUUID()}`,
      ownerLearnerId: principal.learnerId,
      name,
      createdAt: at,
      archivedAt: null,
    });
    this.storage.createClassroom(classroom);
    return Object.freeze({ ...classroom, memberRole: "teacher", memberState: "active" });
  }

  list(principal: Principal) {
    return Object.freeze(this.storage.classroomsFor(principal.learnerId).map((classroom) => {
      const membership = this.storage.classroomMember(classroom.id, principal.learnerId)!;
      return Object.freeze({ ...classroom, memberRole: membership.memberRole, memberState: membership.state });
    }));
  }

  detail(id: string, principal: Principal) {
    const membership = this.readMember(id, principal.learnerId);
    const classroom = this.storage.classroom(id);
    if (classroom === undefined) throw unavailable();
    const assignments = this.storage.assignmentsForClassroom(id);
    const submissions = membership.memberRole === "teacher"
      ? assignments.flatMap((assignment) => this.storage.assignmentSubmissions(assignment.id).map((submission) => Object.freeze({
          ...submission,
          access: this.storage.runRole(submission.runId, principal.learnerId) !== undefined
            ? "available" as const
            : "revoked_or_expired" as const,
        })))
      : [];
    return Object.freeze({
      classroom,
      membership,
      members: this.storage.classroomMembers(id),
      assignments,
      submissions: Object.freeze(submissions),
      upcomingSessions: this.storage.classroomLiveSessions(id),
    });
  }

  archive(id: string, principal: Principal): void {
    const classroom = this.storage.classroom(id);
    if (classroom === undefined || classroom.ownerLearnerId !== principal.learnerId) throw unavailable();
    this.storage.archiveClassroom(id, this.now());
  }

  invite(id: string, principal: Principal, handle: string, role: ClassroomMemberRole): ClassroomMemberRecord {
    this.teacher(id, principal.learnerId);
    const members = this.storage.classroomMembers(id);
    if (members.filter((member) => member.state !== "left").length >= 200) {
      throw new ServerError("INVALID_REQUEST", "A classroom may have at most 200 members");
    }
    if (members.filter((member) => member.state === "invited").length >= 20) {
      throw new ServerError("INVALID_REQUEST", "A classroom may have at most 20 outstanding invitations");
    }
    const learner = this.storage.learnerByHandle(handle.toLowerCase());
    if (learner === undefined) throw new ServerError("INVALID_REQUEST", "Learner handle is unavailable");
    const at = this.now();
    this.storage.inviteClassroomMember({
      classroomId: id,
      learnerId: learner.id,
      memberRole: role,
      state: "invited",
      invitedBy: principal.learnerId,
      invitedAt: at,
    });
    return this.storage.classroomMember(id, learner.id)!;
  }

  respond(id: string, principal: Principal, op: "accept" | "decline" | "leave"): void {
    const member = this.member(id, principal.learnerId, true);
    if (op === "accept") {
      if (member.state !== "invited") throw unavailable();
      this.storage.setClassroomMemberState(id, principal.learnerId, "active", this.now());
    } else {
      if (op === "decline" && member.state !== "invited") throw unavailable();
      this.storage.setClassroomMemberState(id, principal.learnerId, "left", this.now());
    }
  }

  remove(id: string, principal: Principal, handle: string): void {
    this.teacher(id, principal.learnerId);
    const learner = this.storage.learnerByHandle(handle.toLowerCase());
    if (learner === undefined) throw unavailable();
    const target = this.member(id, learner.id);
    if (target.learnerId === principal.learnerId) throw new ServerError("INVALID_REQUEST", "Use leave to remove yourself");
    this.storage.setClassroomMemberState(id, learner.id, "left", this.now());
  }

  assign(id: string, principal: Principal, input: { packId: string; note?: string; dueAt?: string }): AssignmentRecord {
    this.teacher(id, principal.learnerId);
    if (this.packs.get(input.packId) === undefined) throw new ServerError("INVALID_REQUEST", "Pack is not registered");
    const assignment = Object.freeze({
      id: `assignment-${randomUUID()}`,
      classroomId: id,
      packId: input.packId,
      assignedBy: principal.learnerId,
      note: input.note ?? null,
      dueAt: input.dueAt ?? null,
      createdAt: this.now(),
      withdrawnAt: null,
    });
    this.storage.createAssignment(assignment);
    return assignment;
  }

  withdrawAssignment(id: string, principal: Principal): void {
    const assignment = this.assignmentForMember(id, principal.learnerId);
    const classroom = this.storage.classroom(assignment.classroomId)!;
    if (assignment.assignedBy !== principal.learnerId && classroom.ownerLearnerId !== principal.learnerId) throw unavailable();
    this.storage.withdrawAssignment(id, this.now());
  }

  assignments(principal: Principal) {
    const submissions = this.storage.assignmentSubmissionsForLearner(principal.learnerId);
    return Object.freeze(this.storage.assignmentsForLearner(principal.learnerId).map((assignment) => {
      const classroom = this.storage.classroom(assignment.classroomId)!;
      const assigner = this.storage.learnerById(assignment.assignedBy);
      const teacherHandles = this.storage.classroomMembers(assignment.classroomId)
        .filter((member) => member.memberRole === "teacher" && member.state === "active")
        .map((member) => member.handle)
        .sort((left, right) => left.localeCompare(right));
      return Object.freeze({
        ...assignment,
        classroomName: classroom.name,
        assignedByHandle: assigner?.handle ?? "deleted",
        teacherHandles: Object.freeze(teacherHandles),
        submissions: Object.freeze(submissions.filter((submission) => submission.assignmentId === assignment.id).map((submission) => Object.freeze({
          ...submission,
          grantedTeacherHandles: Object.freeze(submission.grantedLearnerIds.flatMap((teacherId) => {
            if (this.storage.runRole(submission.runId, teacherId) === undefined) return [];
            const teacher = this.storage.learnerById(teacherId);
            return teacher === undefined ? [] : [teacher.handle];
          }).sort((left, right) => left.localeCompare(right))),
        }))),
      });
    }));
  }

  submit(id: string, principal: Principal, runId: string, expiresInDays = 90) {
    if (!Number.isSafeInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 90) {
      throw new ServerError("INVALID_REQUEST", "expiresInDays must be between 1 and 90");
    }
    const assignment = this.assignmentForMember(id, principal.learnerId);
    if (assignment.withdrawnAt !== null) throw unavailable();
    const member = this.member(assignment.classroomId, principal.learnerId);
    if (member.memberRole !== "learner" || member.state !== "active") throw unavailable();
    if (this.storage.runRole(runId, principal.learnerId) !== "host") throw new ServerError("INVALID_REQUEST", "Only a hosted run may be submitted");
    const run = this.storage.read(runId)?.run;
    if (run === undefined || run.packId !== assignment.packId) throw new ServerError("INVALID_REQUEST", "Run does not match the assignment pack");
    const at = this.now();
    const expiresAt = new Date(Date.parse(at) + expiresInDays * 86_400_000).toISOString();
    const teachers = this.storage.classroomMembers(assignment.classroomId)
      .filter((candidate) => candidate.memberRole === "teacher" && candidate.state === "active")
      .map((candidate) => candidate.learnerId);
    return this.storage.submitAssignment({
      assignmentId: id,
      learnerId: principal.learnerId,
      runId,
      grantedLearnerIds: [],
      submittedAt: at,
      accessExpiresAt: expiresAt,
      withdrawnAt: null,
    }, teachers);
  }

  withdrawSubmission(id: string, principal: Principal, runId: string): void {
    const assignment = this.assignmentForMember(id, principal.learnerId);
    const member = this.member(assignment.classroomId, principal.learnerId);
    if (member.memberRole !== "learner") throw unavailable();
    this.storage.withdrawAssignmentSubmission(id, principal.learnerId, runId, this.now());
  }

  #memberRecord(id: string, learnerId: string, allowInvited = false, allowArchived = false): ClassroomMemberRecord {
    const classroom = this.storage.classroom(id);
    const membership = this.storage.classroomMember(id, learnerId);
    if (classroom === undefined || (!allowArchived && classroom.archivedAt !== null) || membership === undefined ||
      (membership.state !== "active" && !(allowInvited && membership.state === "invited"))) throw unavailable();
    return membership;
  }

  private readMember(id: string, learnerId: string): ClassroomMemberRecord {
    return this.#memberRecord(id, learnerId, false, true);
  }

  private member(id: string, learnerId: string, allowInvited = false): ClassroomMemberRecord {
    return this.#memberRecord(id, learnerId, allowInvited);
  }

  private teacher(id: string, learnerId: string): ClassroomMemberRecord {
    const membership = this.member(id, learnerId);
    if (membership.memberRole !== "teacher") throw unavailable();
    return membership;
  }

  private assignmentForMember(id: string, learnerId: string): AssignmentRecord {
    const assignment = this.storage.assignment(id);
    if (assignment === undefined) throw unavailable();
    this.member(assignment.classroomId, learnerId);
    return assignment;
  }
}
