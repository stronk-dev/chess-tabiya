// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { ClassroomMember } from "../api.js";

export type ClassroomState = ClassroomMember["state"];

/** Membership state in a classroom (`api.ts` ClassroomMember). */
export const CLASSROOM_STATE_LABELS: LabelVocabulary<ClassroomState> = Object.freeze({
  invited: { label: "Invitation waiting" },
  active: { label: "Active" },
  left: { label: "Left classroom" },
});
