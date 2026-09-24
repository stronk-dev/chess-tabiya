// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, SemanticEventSign } from "@chess-tabiya/runtime";

/** Sign of a semantic event (`evidence-contract.ts` SemanticEventSign). */
export const SEMANTIC_EVENT_SIGN_LABELS: LabelVocabulary<SemanticEventSign> = Object.freeze({
  state: { label: "holds" },
  gained: { label: "gained" },
  lost: { label: "lost" },
  preserved: { label: "kept" },
  removed: { label: "removed" },
  avoided: { label: "avoided" },
  enabled: { label: "made possible" },
  threatened: { label: "threatened" },
});
