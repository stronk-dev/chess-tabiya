/**
 * The grounded bot-card compiler (rfc/bot-policy.md §7; rfc/bot-roster.md §7). A card is compiled
 * from one exact `bot-profile-catalog@1` member, the registered measurements and an optional
 * calibration receipt for the SAME behaviour digest. It accepts no caller sentence, bio or persona
 * adjective: every statement is a closed template over registered layer/measurement/absence ids,
 * and each statement carries those source ids so it can be traced to a committed artifact.
 */
import {
  BOT_FAMILY_LABELS,
  BOT_LAYER_DECLARATIONS,
  botControlledTraits,
  resolveBotProfileReference,
  type BotCardSourceId,
  type BotCardStatementId,
  type BotClassifierId,
  type BotProfileCatalogEntry,
  type BotProfileFamily,
  type BotProfileId,
} from "@chess-tabiya/runtime";

import { BOT_POLICY_MEASUREMENTS } from "./bot-policy-measurements.js";

// ---------------------------------------------------------------------------------------------
// Calibration receipts (bot-roster §6): three separate verdicts keyed by behaviour digest.

export interface BotCardStatement {
  readonly id: BotCardStatementId;
  readonly text: string;
  readonly sources: readonly BotCardSourceId[];
}

export interface BotCalibrationReceipt {
  readonly behaviorDigest: `sha256:${string}`;
  readonly strength: Readonly<{
    verdict: "calibrated_relative" | "unresolved" | "invalid";
    relativeElo?: number;
    ci95?: readonly [number, number];
    reference: string;
  }>;
  readonly distribution: "human_reference_equivalent" | "controlled_divergence" | "rejected" | "insufficient";
  readonly bandIdentity: "supported" | "refuted" | "insufficient";
  readonly harness: string;
  readonly measuredAt: string;
  readonly games: number;
  readonly timeControl: string;
  readonly humanReferenceScope: string;
}

export type BotCardStrength =
  | Readonly<{ kind: "uncalibrated" }>
  | Readonly<{
      kind: "calibrated";
      verdicts: Readonly<{ strength: BotCalibrationReceipt["strength"]["verdict"]; distribution: BotCalibrationReceipt["distribution"]; bandIdentity: BotCalibrationReceipt["bandIdentity"] }>;
      relativeElo: number | null;
      ci95: readonly [number, number] | null;
      reference: string;
      harness: string;
      measuredAt: string;
      games: number;
      timeControl: string;
      humanReferenceScope: string;
      humanLikeLabelAllowed: boolean;
    }>;

export class BotCardError extends TypeError {
  constructor(message: string) {
    super(`Bot card refused: ${message}`);
    this.name = "BotCardError";
  }
}

function parseCalibration(value: unknown, entry: BotProfileCatalogEntry): BotCalibrationReceipt {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new BotCardError("calibration receipt must be an object");
  const receipt = value as BotCalibrationReceipt;
  if (receipt.behaviorDigest !== entry.behaviorDigest) throw new BotCardError("calibration receipt keys a different behaviour digest");
  if (!["calibrated_relative", "unresolved", "invalid"].includes(receipt.strength?.verdict)) throw new BotCardError("calibration strength verdict is outside the closed vocabulary");
  if (!["human_reference_equivalent", "controlled_divergence", "rejected", "insufficient"].includes(receipt.distribution)) throw new BotCardError("calibration distribution verdict is outside the closed vocabulary");
  if (!["supported", "refuted", "insufficient"].includes(receipt.bandIdentity)) throw new BotCardError("calibration band-identity verdict is outside the closed vocabulary");
  if (receipt.strength.verdict === "calibrated_relative"
    && (typeof receipt.strength.relativeElo !== "number" || receipt.strength.ci95 === undefined || receipt.strength.ci95.length !== 2)) {
    throw new BotCardError("a calibrated relative strength must carry its figure and 95% interval");
  }
  for (const key of ["harness", "measuredAt", "timeControl", "humanReferenceScope"] as const) {
    if (typeof receipt[key] !== "string" || receipt[key].trim() === "") throw new BotCardError(`calibration receipt lacks ${key}`);
  }
  if (!Number.isSafeInteger(receipt.games) || receipt.games < 1) throw new BotCardError("calibration receipt lacks its game count");
  return receipt;
}

// ---------------------------------------------------------------------------------------------
// Statements.

const pct = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`;

function statement(id: BotCardStatementId, text: string, sources: readonly BotCardSourceId[]): BotCardStatement {
  return Object.freeze({ id, text, sources: Object.freeze([...sources]) });
}

function commonStatements(entry: BotProfileCatalogEntry): BotCardStatement[] {
  const { band, sampler, model } = entry.reference;
  const reconstruction = BOT_POLICY_MEASUREMENTS["measurement.sampler_reconstruction@1"];
  const ladder = BOT_POLICY_MEASUREMENTS["measurement.maia_band_ladder@1"];
  const agreement = Math.abs(reconstruction.reconstructedExpectedLossCp - reconstruction.capturedExpectedLossCp).toFixed(2);
  return [
    statement("card.model_band", `Moves come from the Maia human-move model (${model.id.split("@")[0]}) at model band ${band}. The band is a model setting, not a FIDE, Lichess or Chess.com rating.`, ["catalog.profile"]),
    statement("card.sampler", `Each reply is drawn at random from Maia's move probabilities at temperature ${sampler.temperature} and top-p ${sampler.topP}, from a recorded seed, so a rewound position gets the same reply. This sampler reproduced a captured production sample within ${agreement} cp of expected loss over ${reconstruction.cells} measured positions.`, ["layer.sampler.maia_reconstruction@1", "measurement.sampler_reconstruction@1"]),
    statement("card.band_ladder", `Raw Maia bands ${ladder.bands.join(", ")} scored higher with each step against band ${ladder.reference}, with non-overlapping 95% intervals (${ladder.gamesPerRung.toLocaleString("en-US")} ${ladder.timeControl} games per band). That ladder measured the raw model, not this profile.`, ["measurement.maia_band_ladder@1"]),
  ];
}

function guardStatements(): BotCardStatement[] {
  const layer = BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters;
  const measured = BOT_POLICY_MEASUREMENTS["measurement.guard_depth8@1"];
  return [
    statement("card.guard", `Before each reply Stockfish (${layer.engine}, depth ${layer.searchBound.value}) scores every legal move, and Maia candidates that lose ${layer.thresholdCp} centipawns or more against Stockfish's best move are removed. This is an engine information advantage a human opponent does not have.`, ["layer.guard.severe_error@1"]),
    statement("card.guard_measurement", `In the depth-${layer.searchBound.value} measurement over ${measured.cells} positions, the check removed ${pct(measured.severeRemoved)} of candidate mass losing ${measured.thresholdCp} cp or more and lowered expected loss by ${measured.strengtheningCp.toFixed(2)} cp.`, ["measurement.guard_depth8@1"]),
    statement("card.guard_abstention", `The check stands aside for the whole move when Stockfish is unavailable or later than ${layer.deadlineMs} ms, when any legal move is scored as a mate, or when its move list does not match the position. Maia's probabilities are then used unchanged, and the reply records that the check did not run.`, ["layer.guard.severe_error@1"]),
  ];
}

function pawnStatements(): BotCardStatement[] {
  const layer = BOT_LAYER_DECLARATIONS["trait.pawn_preference@1"].parameters;
  const measured = BOT_POLICY_MEASUREMENTS["measurement.pawn_x4_depth8@1"];
  return [
    statement("card.pawn_trait", `After the Stockfish check, pawn moves are weighted ×${layer.multiplier}. In the depth-8 measurement over ${measured.cells} positions the share of pawn moves rose from ${pct(measured.guardedPawnRate)} to ${pct(measured.traitPawnRate)} (+${(measured.traitDelta * 100).toFixed(1)} points).`, ["layer.trait.pawn_preference@1", "measurement.pawn_x4_depth8@1"]),
    statement("card.pawn_dependency", "The pawn weighting runs only when the Stockfish check ran. When the check stands aside, the weighting is switched off as well and the reply comes from Maia's probabilities unchanged.", ["layer.trait.pawn_preference@1", "layer.guard.severe_error@1"]),
  ];
}

function absenceStatements(): BotCardStatement[] {
  return [
    statement("card.no_book", "No opening book is used.", ["absence.repertoire"]),
    statement("card.no_memory", "Nothing is remembered between games.", ["absence.memory"]),
    statement("card.no_timing", "Replies are not delayed to imitate thinking time, and no clock or time control shapes the choice.", ["absence.timing"]),
    statement("card.endgame_scope", "Middlegame and endgame behaviour is not separately measured: every measured position comes from the first 20 plies of a game.", ["scope.endgame"]),
  ];
}

function calibrationStatement(strength: BotCardStrength): BotCardStatement {
  if (strength.kind === "uncalibrated") {
    return statement("card.calibration", "Uncalibrated: no strength number is shown until games measure this exact profile.", ["calibration.absent"]);
  }
  const figure = strength.relativeElo === null || strength.ci95 === null
    ? `strength ${strength.verdicts.strength}`
    : `${strength.relativeElo >= 0 ? "+" : ""}${strength.relativeElo.toFixed(1)} Elo against ${strength.reference} (95% CI ${strength.ci95[0].toFixed(1)} to ${strength.ci95[1].toFixed(1)})`;
  return statement("card.calibration", `Measured ${figure} by ${strength.harness} on ${strength.measuredAt} over ${strength.games.toLocaleString("en-US")} games, ${strength.timeControl}; distribution ${strength.verdicts.distribution}, band identity ${strength.verdicts.bandIdentity}.`, ["calibration.receipt"]);
}

export interface BotCard {
  readonly profileId: BotProfileId;
  readonly profileDigest: `sha256:${string}`;
  readonly behaviorDigest: `sha256:${string}`;
  readonly family: BotProfileFamily;
  readonly band: number;
  readonly title: string;
  readonly controlledTraits: readonly BotClassifierId[];
  readonly statements: readonly BotCardStatement[];
  readonly strength: BotCardStrength;
  /** Owner-authored decorative identity (D1610); none is registered, so this slot is empty. */
  readonly decorative: null;
}

/**
 * Compiles one card. `entry` must BE the catalog member (object identity after re-resolution), so a
 * structurally similar or mutated profile refuses; a calibration receipt for another behaviour
 * digest refuses.
 */
export function compileBotCard(entry: BotProfileCatalogEntry, calibration?: unknown): BotCard {
  let resolved: BotProfileCatalogEntry;
  try {
    resolved = resolveBotProfileReference(entry.reference);
  } catch (cause) {
    throw new BotCardError(`profile is not a catalog member (${(cause as Error).message})`);
  }
  if (resolved !== entry) throw new BotCardError("profile is a copy, not the catalog member");
  const receipt = calibration === undefined ? undefined : parseCalibration(calibration, entry);
  const strength: BotCardStrength = receipt === undefined
    ? Object.freeze({ kind: "uncalibrated" })
    : Object.freeze({
        kind: "calibrated",
        verdicts: Object.freeze({ strength: receipt.strength.verdict, distribution: receipt.distribution, bandIdentity: receipt.bandIdentity }),
        relativeElo: receipt.strength.verdict === "calibrated_relative" ? receipt.strength.relativeElo ?? null : null,
        ci95: receipt.strength.verdict === "calibrated_relative" && receipt.strength.ci95 !== undefined ? Object.freeze([receipt.strength.ci95[0], receipt.strength.ci95[1]] as const) : null,
        reference: receipt.strength.reference,
        harness: receipt.harness,
        measuredAt: receipt.measuredAt,
        games: receipt.games,
        timeControl: receipt.timeControl,
        humanReferenceScope: receipt.humanReferenceScope,
        humanLikeLabelAllowed: receipt.strength.verdict === "calibrated_relative"
          && receipt.distribution === "human_reference_equivalent"
          && receipt.bandIdentity === "supported",
      });
  const layers = entry.reference.orderedLayers;
  const statements = [
    ...commonStatements(entry),
    ...(layers.includes("guard.severe_error@1") ? guardStatements() : []),
    ...(layers.includes("trait.pawn_preference@1") ? pawnStatements() : []),
    ...absenceStatements(),
    calibrationStatement(strength),
  ];
  return Object.freeze({
    profileId: entry.reference.id,
    profileDigest: entry.reference.digest,
    behaviorDigest: entry.behaviorDigest,
    family: entry.reference.family,
    band: entry.reference.band,
    title: `${BOT_FAMILY_LABELS[entry.reference.family]} · band ${entry.reference.band}`,
    controlledTraits: botControlledTraits(entry),
    statements: Object.freeze(statements),
    strength,
    decorative: null,
  });
}
