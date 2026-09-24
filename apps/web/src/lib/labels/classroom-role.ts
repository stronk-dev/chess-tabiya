// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { ClassroomMember } from "../api.js";

export type ClassroomRole = ClassroomMember["memberRole"];

/** Role in a classroom (`api.ts` ClassroomMember). */
export const CLASSROOM_ROLE_LABELS: LabelVocabulary<ClassroomRole> = Object.freeze({
  teacher: { label: "Teacher" },
  learner: { label: "Learner" },
});
