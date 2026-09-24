/**
 * The shared client selector over live provider health (rfc/provider-health-degradation.md §10,
 * criterion 18). Every control that depends on an optional provider asks this module — never a
 * configuration-presence flag — and renders the returned notice beside itself: a control the
 * deployment cannot serve right now stays in the layout with its reason and, for a runtime state,
 * a retry affordance. It is never removed.
 */
import {
  capabilityModeAvailability,
  capabilityOperationAvailability,
  providerAvailabilityNotice,
  type ApplicationProviderOperationId,
  type ProviderAvailabilityNotice,
  type ProviderHealthSnapshot,
  type RunOpponentMode,
} from "@chess-tabiya/runtime";

import type { Capabilities } from "./api.js";

/** Task-level subjects: ordinary copy names what the learner is doing, never a provider or model. */
export const PROVIDER_SUBJECTS: Readonly<Record<ApplicationProviderOperationId, string>> = Object.freeze({
  "opponent.stockfish_play": "The engine opponent",
  "opponent.maia_inference": "The human-style opponent",
  "evidence.stockfish_analysis": "Engine calculation",
  "evidence.tablebase_probe": "The endgame tablebase",
  "evidence.explorer_query": "Human-game statistics",
  "render.voice": "External voice",
  "render.voice_compare": "External voice",
  "render.voice_story": "External voice",
  "review.reasoning": "The reasoning review",
  "render.speech": "Configured speech",
});

export function operationNotice(capabilities: Pick<Capabilities, "providerHealth"> | undefined, operation: ApplicationProviderOperationId, subject: string = PROVIDER_SUBJECTS[operation]): ProviderAvailabilityNotice {
  return providerAvailabilityNotice(capabilityOperationAvailability(capabilities?.providerHealth, operation), subject);
}

export function modeNotice(capabilities: Pick<Capabilities, "providerHealth"> | undefined, mode: RunOpponentMode, subject = "This opponent"): ProviderAvailabilityNotice {
  return providerAvailabilityNotice(capabilityModeAvailability(capabilities?.providerHealth, mode), subject);
}

/** Whether a control backed by `operation` may issue its ordinary request right now. */
export function operationRequestable(capabilities: Pick<Capabilities, "providerHealth"> | undefined, operation: ApplicationProviderOperationId): boolean {
  return operationNotice(capabilities, operation).requestable;
}

/**
 * Whether the deployment offers the operation at all (it may still be failing right now). Controls
 * use this to choose between "try it" and "retry"; they never use it to disappear.
 */
export function operationConfigured(capabilities: Pick<Capabilities, "providerHealth"> | undefined, operation: ApplicationProviderOperationId): boolean {
  return !operationNotice(capabilities, operation).notConfigured;
}

const STATE_LABELS: Readonly<Record<ProviderHealthSnapshot["state"], string>> = Object.freeze({
  not_configured: "Not configured",
  unverified: "Ready to try",
  recovering: "Recovering",
  available: "Available",
  degraded_cached_only: "Saved responses only",
  unavailable: "Unavailable",
});

const INSTANCE_LABELS: Readonly<Record<ProviderHealthSnapshot["instanceId"], string>> = Object.freeze({
  "stockfish-play": "Engine opponent",
  "stockfish-analysis": "Position calculation",
  "maia-inference": "Human-like opponents",
  "tablebase-primary": "Exact endgame results",
  "explorer-primary": "Human-game statistics",
  "external-voice": "Optional narrated guidance",
  "external-tts": "Spoken guidance",
});

/** Ordinary settings rows: a label and a plain state, no generation or timestamps. */
export function providerRows(capabilities: Pick<Capabilities, "providerHealth">): readonly { readonly id: string; readonly label: string; readonly state: string }[] {
  return capabilities.providerHealth.providers.map((row) => Object.freeze({ id: row.instanceId, label: INSTANCE_LABELS[row.instanceId], state: STATE_LABELS[row.state] }));
}

/** Inspector detail: implementation, generation prefix, reason and outcome times (§10). */
export function providerInspectorRows(capabilities: Pick<Capabilities, "providerHealth">): readonly { readonly id: string; readonly detail: string }[] {
  return capabilities.providerHealth.providers.map((row) => {
    if (row.state === "not_configured") return Object.freeze({ id: row.instanceId, detail: "not configured" });
    const parts: string[] = [row.state, row.implementation, `generation ${row.generation.slice(7, 19)}`];
    if ((row.state === "unavailable" || row.state === "degraded_cached_only") && row.reason !== null) parts.push(`reason ${row.reason}`);
    if (row.state === "recovering") parts.push(`after ${row.priorReason}, 1 of 2 successes`);
    if (row.state === "degraded_cached_only") parts.push(`${row.validExactEntries} saved exact responses`);
    if (row.state !== "unverified") {
      parts.push(`checked ${row.checkedAt}`);
      if (row.lastSuccessAt !== null) parts.push(`last success ${row.lastSuccessAt}`);
      if (row.lastFailureAt !== null) parts.push(`last failure ${row.lastFailureAt}`);
    }
    return Object.freeze({ id: row.instanceId, detail: parts.join(" · ") });
  });
}
