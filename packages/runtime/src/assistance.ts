import type { DrillRun, RunSessionKind } from "./types.js";
import type { WorkflowContextId } from "./presets.js";

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

export type AssistancePermission = "free" | "locked_off" | "sight" | "evidence";
export interface AssistanceContext {
  readonly sessionKind: RunSessionKind;
  readonly workflowContext: WorkflowContextId;
  readonly deliveryOpen: boolean;
  readonly role: "solo" | "host" | "participant" | "spectator";
  readonly seatedInContest: boolean;
  readonly reviewing: boolean;
}

export function permittedAssistance(context: AssistanceContext): Readonly<Record<keyof Omit<AssistanceConfig, "version">, AssistancePermission>> {
  const mayRequestSplit = context.deliveryOpen && !context.seatedInContest &&
    (context.role === "solo" || context.role === "host" || context.reviewing);
  return Object.freeze({ markers: "free", guided: "free", humanSplit: mayRequestSplit ? "free" : "locked_off", corpus: mayRequestSplit ? "free" : "locked_off", voice: "free", spoken: "free", boardLighting: mayRequestSplit ? "evidence" : "sight", arrows: mayRequestSplit ? "evidence" : "sight", ambient: "free" });
}

export function reviewingGrant(input: {
  readonly run: DrillRun;
  readonly grantMintedBySubmission: boolean;
  readonly liveSessionOpen: boolean;
}): boolean {
  return input.grantMintedBySubmission && !input.liveSessionOpen &&
    input.run.events.some((event) => event.type === "outcome.reached");
}
