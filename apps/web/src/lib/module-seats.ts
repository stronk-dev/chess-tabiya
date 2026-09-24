// rfc/module-registration.md §2.6/§3 + rfc/play-composition.md §4 — the play seats, as a pure model.
// A seat exists only when the FINALIZED assistance composed its module with an effect at a play
// timing (intent-presets Checkpoint B); `blunder_prevention` owns the one board-adjacent head slot;
// every other seat is a rail seat in the companion region. At most one seat is expanded; expanding
// one collapses the previous. On-request seats carry no count before a request: the row is the door.
// Guided Hint's seat is owned by the hint-distance lane and is not modelled here.

import { MODULE_LABELS, MODULE_POLICIES, type CompiledAssistanceEffect, type ModuleId, type PresentedEvidenceItem } from "@chess-tabiya/runtime";

import type { ParsedModulePacket } from "./module-query-response.js";

/** The held staged move of the §2.7 protocol, as the head slot renders it (move is SAN, never UCI). */
export type StagedCue =
  | { readonly state: "checking"; readonly move: string }
  | { readonly state: "warning"; readonly move: string; readonly packet: ParsedModulePacket }
  | { readonly state: "unavailable"; readonly move: string };

/** The seat order of the companion region: the head slot first, then the rail seats (§3). */
export const PLAY_SEAT_MODULES = Object.freeze([
  "blunder_prevention", "postcommit_nudge", "sight_on_request", "threat_radar", "structure_nudge", "theory_breadcrumb", "compare_coach",
] as const satisfies readonly ModuleId[]);
export type PlaySeatModule = (typeof PLAY_SEAT_MODULES)[number];

const PLAY_TIMINGS = new Set(["pre_commit", "at_commit", "post_commit", "checkpoint"]);

export interface SeatDeclaration {
  readonly module: PlaySeatModule;
  readonly label: string;
  readonly headSlot: boolean;
  /** True when the module's play timing is proactive (it may fill without a request). */
  readonly proactive: boolean;
  /** The module's one learner action sentence, from the policy table. */
  readonly learnerAction: string;
  readonly emptySilent: boolean;
}

/** The seats the compiled assistance composes, in seat order. */
export function composedSeats(compiled: { readonly modules: readonly ModuleId[]; readonly effects: readonly CompiledAssistanceEffect[] } | undefined): readonly SeatDeclaration[] {
  if (compiled === undefined) return Object.freeze([]);
  return Object.freeze(PLAY_SEAT_MODULES.flatMap((module) => {
    if (!compiled.modules.includes(module)) return [];
    const effects = compiled.effects.filter((effect) => effect.moduleId === module && PLAY_TIMINGS.has(effect.timing) && effect.subSurface === undefined);
    if (effects.length === 0) return [];
    const policy = MODULE_POLICIES.find((entry) => entry.id === module)!;
    return [Object.freeze({
      module,
      label: MODULE_LABELS[module],
      headSlot: module === "blunder_prevention",
      proactive: effects.some((effect) => effect.arm === "proactive"),
      learnerAction: policy.learnerAction,
      emptySilent: policy.emptyBehavior.kind === "silent",
    })];
  }));
}

/** Whether one compiled effect exists (the exact gate a delivery is bound to). */
export function effectActive(compiled: { readonly effects: readonly CompiledAssistanceEffect[] } | undefined, module: ModuleId, timing: CompiledAssistanceEffect["timing"]): boolean {
  return compiled?.effects.some((effect) => effect.moduleId === module && effect.timing === timing && effect.subSurface === undefined) === true;
}

/** The count badge: distinct delivered facts; null before any request (the row is only a door). */
export function seatBadge(packet: ParsedModulePacket | undefined): number | null {
  if (packet === undefined) return null;
  return new Set(packet.items.map((item: PresentedEvidenceItem) => item.evidenceRef === null ? item.componentDigest : `${item.evidenceRef.projection.id}#${item.evidenceRef.evidenceDigest}`)).size;
}

/** One-expanded protocol (play-composition §4.1): expanding one collapses the previous. */
export function toggleExpanded(current: PlaySeatModule | undefined, module: PlaySeatModule): PlaySeatModule | undefined {
  return current === module ? undefined : module;
}

const SOURCE_REASON_SENTENCES: Readonly<Record<string, string>> = Object.freeze({
  artifact_missing: "the cited catalogue is not installed in this deployment",
  artifact_invalid: "the cited catalogue failed its integrity check",
  digest_mismatch: "the cited catalogue failed its integrity check",
  invalid_turn_clone: "the position cannot be viewed with the other side to move",
  pass_while_in_check: "the one-move threat convention is not computed while in check",
  trapped_while_in_check: "the trapped-piece convention is not computed while in check",
  input_abstained: "an input it depends on is missing",
});

/** Learner sentences for the sources a packet could not consult (never the raw reason id). */
export function unavailableSentences(packet: ParsedModulePacket | undefined): readonly string[] {
  if (packet === undefined) return Object.freeze([]);
  return Object.freeze([...new Set(packet.unavailable.map((entry) => SOURCE_REASON_SENTENCES[entry.reason] ?? "a source was unavailable"))].map((reason) => `Not consulted: ${reason}.`));
}
