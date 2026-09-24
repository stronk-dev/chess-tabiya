// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";

/** The six deployment provider slots (the capability manifest's provider-health producers). */
export type ProviderId = "opponent" | "judge" | "llm" | "corpus" | "tts" | "tablebase";

/** Provider slot label. */
export const PROVIDER_ID_LABELS: LabelVocabulary<ProviderId> = Object.freeze({
  opponent: { label: "Opponent model" },
  judge: { label: "Engine judge" },
  llm: { label: "External voice" },
  corpus: { label: "Game database" },
  tts: { label: "Speech" },
  tablebase: { label: "Endgame tablebase" },
});
