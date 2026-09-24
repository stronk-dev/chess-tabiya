// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { RunRole } from "../api.js";

/** Role granted on a shared run (`api.ts` RunRole). */
export const GRANT_ROLE_LABELS: LabelVocabulary<RunRole> = Object.freeze({
  host: { label: "Host" },
  participant: { label: "Participant" },
  spectator: { label: "Spectator" },
});
