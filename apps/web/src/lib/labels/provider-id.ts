// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { Capabilities } from "../api.js";

export type ProviderId = keyof Capabilities["providers"];

/** Provider slot in the capability manifest (`api.ts` Capabilities.providers). */
export const PROVIDER_ID_LABELS: LabelVocabulary<ProviderId> = Object.freeze({
  opponent: { label: "Opponent model" },
  judge: { label: "Engine judge" },
  llm: { label: "External voice" },
  corpus: { label: "Game database" },
  tts: { label: "Speech" },
  tablebase: { label: "Endgame tablebase" },
});
