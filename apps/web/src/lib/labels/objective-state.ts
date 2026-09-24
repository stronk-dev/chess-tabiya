// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
// Objective state of a run node (`types.ts` ObjectiveState). Owned by the runtime.
export { OBJECTIVE_STATE_LABELS } from "@chess-tabiya/runtime";
