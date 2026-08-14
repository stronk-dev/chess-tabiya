import type { RunSessionKind } from "./types.js";

export interface AssistanceConfig {
  readonly version: 1;
  readonly markers: "off" | "live";
  readonly guided: "off" | "live";
  readonly humanSplit: "off" | "on_request";
  readonly voice: "authored" | "persona";
}

export const SILENT_ASSISTANCE: AssistanceConfig = Object.freeze({
  version: 1, markers: "off", guided: "off", humanSplit: "off", voice: "authored",
});

export type AssistancePermission = "free" | "locked_off";
export interface AssistanceContext {
  readonly sessionKind: RunSessionKind;
  readonly deliveryOpen: boolean;
  readonly role: "solo" | "host" | "participant" | "spectator";
}

export function permittedAssistance(context: AssistanceContext): Readonly<Record<keyof Omit<AssistanceConfig, "version">, AssistancePermission>> {
  const mayRequestSplit = (context.role === "solo" || context.role === "host") && context.deliveryOpen;
  return Object.freeze({ markers: "free", guided: "free", humanSplit: mayRequestSplit ? "free" : "locked_off", voice: "free" });
}
