/** Synthetic wire controls, not installed measurements or a calibration instrument. */
import { BOT_PROFILE_CATALOG, type BotProfileId } from "@chess-tabiya/runtime";
import { compileBotCard, type BotCalibrationReceipt } from "../../apps/server/src/bot-card.js";

export function calibrationControlCard(id: BotProfileId, verdict: BotCalibrationReceipt["strength"]["verdict"]) {
  const entry = BOT_PROFILE_CATALOG.find(value => value.reference.id === id);
  if (entry === undefined) throw new TypeError("Calibration control requires a registered profile");
  return compileBotCard(entry, {
    behaviorDigest: entry.behaviorDigest,
    strength: verdict === "calibrated_relative"
      ? { verdict, relativeElo: -12.5, ci95: [-40.1, 15.2], reference: "raw Maia band 1400" }
      : { verdict, reference: "raw Maia band 1400" },
    distribution: "insufficient", bandIdentity: "insufficient", harness: "synthetic calibration control",
    measuredAt: "2026-10-15", games: 800, timeControl: "fixture only", humanReferenceScope: "fixture only",
  } satisfies BotCalibrationReceipt);
}
