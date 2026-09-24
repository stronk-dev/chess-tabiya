import type { DrillRun } from "./types.js";
import { contextClamp, pointwiseMin, type ConfigClamp, type WorkflowContextId } from "./presets.js";

export interface AssistanceConfig {
  readonly version: 4;
  readonly markers: "off" | "live";
  readonly guided: "off" | "live";
  readonly humanSplit: "off" | "on_request";
  readonly corpus: "off" | "on_request";
  readonly voice: "authored" | "persona";
  readonly spoken: "off" | "browser" | "provider";
  readonly boardLighting: "off" | "legal" | "sight" | "evidence";
  readonly arrows: "off" | "sight" | "evidence";
  readonly ambient: "off" | "on";
}

export const SILENT_ASSISTANCE: AssistanceConfig = Object.freeze({
  version: 4, markers: "off", guided: "off", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off",
});

/** §3: `"legal"` is the rules floor — a floor and a ceiling in one token, `boardLighting` only. */
export type AssistancePermission = "free" | "locked_off" | "legal" | "sight" | "evidence";
/** §3.2: `sessionKind` is removed — `workflowContext` is derived from it and is the one field read. */
export interface AssistanceContext {
  readonly workflowContext: WorkflowContextId;
  readonly deliveryOpen: boolean;
  readonly role: "solo" | "host" | "participant" | "spectator";
  readonly seatedInContest: boolean;
  readonly reviewing: boolean;
}
export type AssistanceAccess = Omit<AssistanceContext, "workflowContext">;

/** The honesty/access ∩ term (the HEAD `permittedAssistance` body, renamed — rfc/intent-presets.md §3.2). */
export function accessPermission(context: AssistanceAccess): ConfigClamp {
  const mayRequestSplit = context.deliveryOpen && !context.seatedInContest &&
    (context.role === "solo" || context.role === "host" || context.reviewing);
  return Object.freeze({ markers: "free", guided: "free", humanSplit: mayRequestSplit ? "free" : "locked_off", corpus: mayRequestSplit ? "free" : "locked_off", voice: "free", spoken: "free", boardLighting: mayRequestSplit ? "evidence" : "sight", arrows: mayRequestSplit ? "evidence" : "sight", ambient: "free" });
}

/** access ∩ workflow ceiling — pointwise minimum, so the context is finally read (criterion 14). */
export function permittedAssistance(context: AssistanceContext): ConfigClamp {
  return pointwiseMin(accessPermission(context), contextClamp(context.workflowContext));
}

export function reviewingGrant(input: {
  readonly run: DrillRun;
  readonly grantMintedBySubmission: boolean;
  readonly liveSessionOpen: boolean;
}): boolean {
  return input.grantMintedBySubmission && !input.liveSessionOpen &&
    input.run.events.some((event) => event.type === "outcome.reached");
}
