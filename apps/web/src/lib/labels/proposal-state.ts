// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { SessionProposal } from "../api.js";

export type ProposalState = SessionProposal["status"];

/** State of a proposed live move (`api.ts` SessionProposal). */
export const PROPOSAL_STATE_LABELS: LabelVocabulary<ProposalState> = Object.freeze({
  open: { label: "Awaiting the host" },
  applied: { label: "Played on the board" },
  declined: { label: "Not taken" },
  stale: { label: "From an earlier position" },
});
