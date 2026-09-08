import type { GraduationEntry } from "@chess-tabiya/schema/drill-pack";

export type EmitterGraduationBlockerId =
  | "mechanical-objective-placeholder"
  | "outcome-ungraded"
  | "start-assessment-absent"
  | "target-elo-authored"
  | "authored-teaching-absent"
  | "opponent-policy-authored"
  | "tablebase-opponent-not-selected"
  | "recorded-play-needs-authoring"
  | "mechanical-objective-needs-grounding";

export type FixedEmitterGraduationBlockerId = Exclude<EmitterGraduationBlockerId,
  "opponent-policy-authored" | "tablebase-opponent-not-selected">;
export type OpponentEmitterGraduationBlockerId = Extract<EmitterGraduationBlockerId,
  "opponent-policy-authored" | "tablebase-opponent-not-selected">;

export interface EmitterGraduationClearancePlan {
  readonly kind: "assessment_grounded" | "pointer_equals" | "objective_graded" | "content_declared";
  readonly instrument: string;
  readonly subject?: string;
  readonly expected?: string | number | boolean | null;
  readonly templateId?: EmitterGraduationBlockerId;
  readonly payloadPointers?: readonly string[];
  readonly captureEmittedPayload?: boolean;
  readonly requireNonEmptyCollection?: boolean;
  readonly deferredSubject?: boolean;
}

export const EMITTER_GRADUATION_BLOCKER_TEMPLATES: Readonly<Record<EmitterGraduationBlockerId, {
  readonly variables: readonly string[];
  readonly statement: string;
}>>;
export const EMITTER_TEMPLATE_IDS: readonly EmitterGraduationBlockerId[];
export const EMITTER_GRADUATION_CLEARANCE_PLANS: Readonly<Record<EmitterGraduationBlockerId, EmitterGraduationClearancePlan>>;

export function emitterGraduationBlocker(id: FixedEmitterGraduationBlockerId): GraduationEntry;
export function emitterGraduationBlocker(id: OpponentEmitterGraduationBlockerId, values: { readonly opponent: string }): GraduationEntry;
