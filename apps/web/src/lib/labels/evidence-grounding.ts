// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
// Declared grounding class of a projection (`evidence-contract.ts`). Owned by the runtime.
export { GROUNDING_LABELS } from "@chess-tabiya/runtime";
