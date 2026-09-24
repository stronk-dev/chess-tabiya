// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { SessionInvitation } from "../api.js";

export type InvitationState = SessionInvitation["state"];

/** State of a live-session invitation (`api.ts` SessionInvitation). */
export const INVITATION_STATE_LABELS: LabelVocabulary<InvitationState> = Object.freeze({
  open: { label: "Waiting for a response" },
  accepted: { label: "Joined" },
  revoked: { label: "No longer available" },
});
