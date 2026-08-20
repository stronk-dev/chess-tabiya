// DISPOSABLE research registry — D635. Not production UX authority.
import type { AssistanceProfile } from "../../apps/web/src/lib/assistance-preference.js";
import type { WorkflowId } from "../r3-presentation-harness/workflow-contract.js";

export type CurrentBinding = AssistanceProfile | "inherits_source_run" | "mixed_pack_or_position" | "absent";

export interface WorkflowBindingRow {
  readonly workflow: WorkflowId;
  readonly productEntry: string;
  readonly currentBinding: CurrentBinding;
  readonly currentReality: string;
}

export const WORKFLOW_BINDINGS = Object.freeze([
  { workflow: "just_play", productEntry: "Play → JustPlayStarter", currentBinding: "position", currentReality: "raw silent assistance profile; no named preset" },
  { workflow: "guided_rehearsal", productEntry: "Play → any pack", currentBinding: "pack", currentReality: "all drill families share one raw profile; no Guided Rehearsal identity" },
  { workflow: "learn_position", productEntry: "Learn repertoire gap or Play pack", currentBinding: "mixed_pack_or_position", currentReality: "entry can create a position run or open a pack; no workflow identity survives" },
  { workflow: "review_retry", productEntry: "Review → Story/re-enter or open prior run", currentBinding: "inherits_source_run", currentReality: "re-entry inherits imported/pack/position mechanics; Story bypasses the imported voice preference" },
  { workflow: "analyze_freely", productEntry: "active branch group → Analyze missing evidence", currentBinding: "inherits_source_run", currentReality: "one action inside the source run; no explicit analysis mode/profile" },
  { workflow: "campaign", productEntry: "none", currentBinding: "absent", currentReality: "research/design only; no product route or profile" },
] as const satisfies readonly WorkflowBindingRow[]);

