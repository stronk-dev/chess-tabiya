/**
 * The registered roster as `/capabilities` advertises it (rfc/bot-policy.md §8; rfc/bot-roster.md
 * §4, §7): every `bot-profile-catalog@1` member with its exact reference, behaviour digest,
 * grounded card and startability. The projection is generated from the catalog — nothing here
 * lists a profile — and every card is uncalibrated because no exact-behaviour calibration receipt
 * exists in the repository.
 *
 * Startability is honest rather than optimistic: no profile can start a game until the profile
 * reference and decision envelope can persist (run lane 0.18) and the shared provider/health
 * authorities exist, so every row reports those named blockers and the Play picker does not list
 * the roster as selectable.
 */
import {
  BOT_PROFILE_CATALOG,
  BOT_PROFILE_CATALOG_RESOURCE,
  BOT_ROSTER_BLOCKERS,
  type BotProfileReference,
  type BotRosterBlocker,
} from "@chess-tabiya/runtime";

import { compileBotCard, type BotCard } from "./bot-card.js";

export type BotProfileStartability = Readonly<{ kind: "not_startable"; blockedBy: readonly BotRosterBlocker[] }>;

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

const NOT_STARTABLE: BotProfileStartability = Object.freeze({ kind: "not_startable", blockedBy: BOT_ROSTER_BLOCKERS });

/** Calibration receipts keyed by exact behaviour digest. None has been measured yet. */
export const BOT_CALIBRATION_RECEIPTS: Readonly<Record<string, unknown>> = Object.freeze({});

export function projectBotRoster(calibrations: Readonly<Record<string, unknown>> = BOT_CALIBRATION_RECEIPTS): BotRosterProjection {
  return Object.freeze({
    catalog: BOT_PROFILE_CATALOG_RESOURCE,
    profiles: Object.freeze(BOT_PROFILE_CATALOG.map((entry) => Object.freeze({
      reference: entry.reference,
      behaviorDigest: entry.behaviorDigest,
      card: compileBotCard(entry, calibrations[entry.behaviorDigest]),
      startable: NOT_STARTABLE,
    }))),
  });
}
