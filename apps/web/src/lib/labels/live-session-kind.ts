// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, LiveSessionKind } from "@chess-tabiya/runtime";

/** Kind of live session (`types.ts` LIVE_SESSION_KINDS). */
export const LIVE_SESSION_KIND_LABELS: LabelVocabulary<LiveSessionKind> = Object.freeze({
  academy: { label: "Academy lesson" },
  stream: { label: "Stream session" },
  match: { label: "Match session" },
});

/** The create-button action for each live-session kind; total by the same union. */
export const LIVE_SESSION_CREATE_ACTIONS: Readonly<Record<LiveSessionKind, string>> = Object.freeze({
  academy: "Create academy",
  stream: "Create stream",
  match: "Create match",
});
