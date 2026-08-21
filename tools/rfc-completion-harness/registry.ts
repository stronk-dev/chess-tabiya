// DISPOSABLE research registry — D637/D638. Not product or RFC authority.

export type ActiveReality =
  | "process"
  | "accepted_unbuilt"
  | "accepted_stage1_dirty"
  | "draft_return_for_alignment"
  | "returned_authoring"
  | "draft_blocked"
  | "draft_prerequisites"
  | "draft_process";

export interface ActiveTruthRow {
  readonly rfc: string;
  readonly registerState: "accepted" | "draft" | "returned";
  readonly reality: ActiveReality;
  readonly nextAction: string;
}

export const ACTIVE_TRUTH = Object.freeze([
  { rfc: "0000-rfc-process.md", registerState: "accepted", reality: "process", nextAction: "keep as process authority" },
  { rfc: "teacher-surface.md", registerState: "accepted", reality: "accepted_unbuilt", nextAction: "amend after R15/O11 or implement only if the accepted workflow still holds" },
  { rfc: "graduation-clearance.md", registerState: "accepted", reality: "accepted_unbuilt", nextAction: "after Feedback Stage 1, correct criterion 13 and build a read-only migration plan; D560 gates corpus apply/archive" },
  { rfc: "feedback-delivery.md", registerState: "accepted", reality: "accepted_stage1_dirty", nextAction: "author-correct criterion 20, close the D643 Stage-1 matrix, then land without claiming Stage 2" },
  { rfc: "assistance-controls.md", registerState: "draft", reality: "draft_return_for_alignment", nextAction: "rewrite around modules, presets, workflow identity and the ruled per-kind ceiling after R3" },
  { rfc: "measurement-records.md", registerState: "returned", reality: "returned_authoring", nextAction: "resolve subject/sub-expression and pack-vs-shape questions before acceptance" },
  { rfc: "learner-rating.md", registerState: "draft", reality: "draft_blocked", nextAction: "hold behind R11/R14, campaign rulings and teacher migration order" },
  { rfc: "pack-population-provenance.md", registerState: "draft", reality: "draft_prerequisites", nextAction: "refresh after R4/R6 and settle O5/O6 before consuming a pack lane" },
  { rfc: "shared-resource-registers.md", registerState: "draft", reality: "draft_process", nextAction: "answer Q1/Q2 and refresh stale observations before F1" },
  { rfc: "rfc-lifecycle-completion.md", registerState: "draft", reality: "draft_process", nextAction: "answer Q1-Q3 and absorb the D638 set-equality case" },
] as const satisfies readonly ActiveTruthRow[]);
