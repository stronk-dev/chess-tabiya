/**
 * The registered roster as `/capabilities` advertises it (rfc/bot-policy.md §8; rfc/bot-roster.md
 * §4, §7): every `bot-profile-catalog@1` member with its exact reference, behaviour digest,
 * grounded card and startability. The projection is generated from the catalog — nothing here
 * lists a profile — and every card is uncalibrated because no exact-behaviour calibration receipt
 * exists in the repository.
 *
 * Startability is the §4.3 join of each profile's provider requirements with the availability the
 * shared provider exchange has actually observed (`BotProviderAvailability`); it never reads a
 * configuration flag. Before any exchange outcome is observed every profile is `conditional`.
 */
import {
  BOT_PROFILE_CATALOG,
  BOT_PROFILE_CATALOG_RESOURCE,
  botProfileStartability,
  type BotProfileReference,
  type BotProfileStartability,
  type BotProviderAvailabilitySnapshot,
} from "@chess-tabiya/runtime";

import { compileBotCard, type BotCard } from "./bot-card.js";

export interface BotRosterRow {
  readonly reference: BotProfileReference;
  readonly behaviorDigest: `sha256:${string}`;
  readonly card: BotCard;
  readonly startable: BotProfileStartability;
}

export interface BotRosterProjection {
  readonly catalog: typeof BOT_PROFILE_CATALOG_RESOURCE;
  /** Advertised as `/capabilities` `policyProfiles.human_common.profiles`. */
  readonly profiles: readonly BotRosterRow[];
}

/** Calibration receipts keyed by exact behaviour digest. None has been measured yet. */
export const BOT_CALIBRATION_RECEIPTS: Readonly<Record<string, unknown>> = Object.freeze({});

/** Nothing observed yet: the state before the first exchange outcome (all profiles conditional). */
export const UNOBSERVED_BOT_AVAILABILITY: BotProviderAvailabilitySnapshot = Object.freeze({ revision: 0, maia: "unverified", stockfish: "unverified" });

export function projectBotRoster(
  availability: BotProviderAvailabilitySnapshot = UNOBSERVED_BOT_AVAILABILITY,
  calibrations: Readonly<Record<string, unknown>> = BOT_CALIBRATION_RECEIPTS,
): BotRosterProjection {
  return Object.freeze({
    catalog: BOT_PROFILE_CATALOG_RESOURCE,
    profiles: Object.freeze(BOT_PROFILE_CATALOG.map((entry) => Object.freeze({
      reference: entry.reference,
      behaviorDigest: entry.behaviorDigest,
      card: compileBotCard(entry, calibrations[entry.behaviorDigest]),
      startable: botProfileStartability(entry, availability),
    }))),
  });
}
