// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { VoteTally } from "../api.js";

export type VoteWindowState = VoteTally["window"]["state"];

/** State of a live vote window (`api.ts` VoteTally). */
export const VOTE_WINDOW_STATE_LABELS: LabelVocabulary<VoteWindowState> = Object.freeze({
  open: { label: "Voting open" },
  closed: { label: "Voting closed" },
  stale: { label: "Position changed" },
});
