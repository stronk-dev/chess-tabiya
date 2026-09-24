// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";

export type ThemeMode = "light" | "dark";

/** Resolved light or dark appearance. */
export const THEME_MODE_LABELS: LabelVocabulary<ThemeMode> = Object.freeze({
  light: { label: "light" },
  dark: { label: "dark" },
});
