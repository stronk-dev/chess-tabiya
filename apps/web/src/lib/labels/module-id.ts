// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import { MODULE_IDS, MODULE_LABELS, type LabelEntry, type LabelVocabulary, type ModuleId } from "@chess-tabiya/runtime";

export { MODULE_LABELS };

/**
 * The eleven assistance modules (`learner-modules.md` §4). The runtime owns the names as the total
 * `MODULE_LABELS: Record<ModuleId, string>`; this is the same table in `LabelEntry` shape, so a
 * module added without a runtime name is already a compile error there.
 */
export const MODULE_ID_LABELS: LabelVocabulary<ModuleId> = Object.freeze(
  Object.fromEntries(MODULE_IDS.map((id): [ModuleId, LabelEntry] => [id, Object.freeze({ label: MODULE_LABELS[id] })])) as Record<ModuleId, LabelEntry>,
);
