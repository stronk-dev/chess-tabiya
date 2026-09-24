// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, ProducerDeclaration } from "@chess-tabiya/runtime";

export type AvailabilityMode = ProducerDeclaration["availability"];

/** Where a producer's evidence comes from (`evidence-contract.ts` AvailabilityMode). */
export const AVAILABILITY_MODE_LABELS: LabelVocabulary<AvailabilityMode> = Object.freeze({
  local: { label: "computed on this device" },
  recorded: { label: "read from the record" },
  provider: { label: "from a connected service" },
  build_time: { label: "prepared in advance" },
});
