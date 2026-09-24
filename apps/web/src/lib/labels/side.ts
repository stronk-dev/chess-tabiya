// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
// The side to move or the side a fact is about. Owned by the runtime.
export { SIDE_LABELS } from "@chess-tabiya/runtime";
