// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, ModuleSeatClass } from "@chess-tabiya/runtime";

/** Where an assistance module is seated (`module-contract.ts` ModuleSeatClass). */
export const SEAT_CLASS_LABELS: LabelVocabulary<ModuleSeatClass> = Object.freeze({
  board_input: { label: "On the board" },
  board_adjacent: { label: "Beside the board" },
  rail: { label: "In the side rail" },
  timeline: { label: "On the timeline" },
  explicit_surface: { label: "On its own screen" },
});
