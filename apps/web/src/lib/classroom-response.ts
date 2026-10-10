import type { ClassroomDetail } from "./api.js";

/** Bind a detail read to its requested classroom before any child drives UI actions. */
export function assertClassroomDetailIdentity(detail: ClassroomDetail, classroomId: string): void {
  const mismatch = () => { throw new TypeError("Classroom detail does not match the requested classroom"); };
  if (detail.classroom.id !== classroomId || detail.membership.classroomId !== classroomId) mismatch();
  if (!Array.isArray(detail.members) || !Array.isArray(detail.assignments)
    || !Array.isArray(detail.submissions) || !Array.isArray(detail.upcomingSessions)) mismatch();
  if (detail.members.some(member => member.classroomId !== classroomId)
    || detail.assignments.some(assignment => assignment.classroomId !== classroomId)
    || detail.upcomingSessions.some(session => session.classroomId !== classroomId)) mismatch();
  const assignments = new Set(detail.assignments.map(assignment => assignment.id));
  if (assignments.size !== detail.assignments.length
    || detail.submissions.some(submission => !assignments.has(submission.assignmentId))) mismatch();
}
