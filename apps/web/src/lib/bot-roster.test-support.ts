import { BOT_FAMILY_LABELS, BOT_PROFILE_CATALOG, botControlledTraits, type BotProfileStartability } from "@chess-tabiya/runtime";

import type { BotRosterRow } from "./api.js";

/** A structurally valid `/capabilities` roster for web fixtures; the server compiles the real cards. */
export function botRosterFixture(startable: BotProfileStartability = { kind: "available" }): readonly BotRosterRow[] {
  return BOT_PROFILE_CATALOG.map((entry) => ({
    reference: entry.reference,
    behaviorDigest: entry.behaviorDigest,
    card: {
      profileId: entry.reference.id,
      profileDigest: entry.reference.digest,
      behaviorDigest: entry.behaviorDigest,
      family: entry.reference.family,
      band: entry.reference.band,
      title: `${BOT_FAMILY_LABELS[entry.reference.family]} · band ${entry.reference.band}`,
      controlledTraits: botControlledTraits(entry),
      statements: [{ id: "card.calibration", text: "Uncalibrated: no strength number is shown until games measure this exact profile.", sources: ["calibration.absent"] }],
      strength: { kind: "uncalibrated" },
      decorative: null,
    },
    startable,
  }));
}
