import { createHash } from "node:crypto";

type FamilyId = "human-baseline" | "guarded-human" | "pawn-forward";
type Band = 1000 | 1400 | 1800 | 2200;

export interface BotProfileContract {
  readonly id: string;
  readonly version: 1;
  readonly family: FamilyId;
  readonly band: Band;
  readonly model: Readonly<{ readonly id: string; readonly engineId: "maia-5m"; readonly modelId: string }>;
  readonly sampler: Readonly<{ readonly id: "sampler.maia_reconstruction@1"; readonly temperature: 0.8; readonly topP: 0.92 }>;
  readonly guard?: Readonly<{
    readonly id: "guard.severe_error@1";
    readonly requestProfile: "stockfish-guard@1";
    readonly thresholdCp: 250;
    readonly dependsOn?: never;
  }>;
  readonly trait?: Readonly<{
    readonly id: "trait.pawn_preference@1";
    readonly classifier: "pawn_move@1";
    readonly multiplier: 4;
    readonly dependsOn: "guard.severe_error@1";
  }>;
  readonly presentation: Readonly<{
    readonly name: string;
    readonly avatarAsset: string;
    readonly decorativeTagline: string;
  }>;
}

export interface ProfileCalibration {
  readonly profileDigest: `sha256:${string}`;
  readonly status: "band_relative";
  readonly measuredLabel: string;
  readonly timeControl: string;
  readonly sourceId: "measurement.bot-exact-digest-calibration@1";
}

export interface BotCardStatement {
  readonly id: string;
  readonly kind: "mechanism" | "measurement" | "absence" | "scope" | "calibration";
  readonly text: string;
  readonly sourceIds: readonly string[];
}

export interface BotCard {
  readonly profileId: string;
  readonly profileDigest: `sha256:${string}`;
  readonly display: BotProfileContract["presentation"];
  readonly band: Band;
  readonly family: FamilyId;
  readonly calibration: "uncalibrated" | "band_relative";
  readonly statements: readonly BotCardStatement[];
}

export const BOT_CARD_SOURCES = Object.freeze({
  "policy.maia3-band@1": Object.freeze({ kind: "policy", scope: "full-history human-choice model" }),
  "policy.maia-reconstruction@1": Object.freeze({ kind: "policy", scope: "temperature/top-p sampler" }),
  "measurement.d969-depth8-guard@1": Object.freeze({ kind: "measurement", scope: "279 positions / 804 comparable band cells" }),
  "measurement.r11-pawn-x4@1": Object.freeze({ kind: "measurement", scope: "guarded R11 population" }),
  "absence.opening-book@1": Object.freeze({ kind: "absence", scope: "profile declaration" }),
  "absence.cross-game-memory@1": Object.freeze({ kind: "absence", scope: "profile declaration" }),
  "scope.bot-endgame-unknown@1": Object.freeze({ kind: "scope", scope: "no roster-wide endgame calibration" }),
  "scope.bot-clock-unknown@1": Object.freeze({ kind: "scope", scope: "no clock-conditioned roster calibration" }),
  "absence.exact-digest-calibration@1": Object.freeze({ kind: "absence", scope: "no exact-profile calibration receipt" }),
  "measurement.bot-exact-digest-calibration@1": Object.freeze({ kind: "measurement", scope: "exact profile digest" }),
} as const);

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function profileDigest(profile: BotProfileContract): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(stable(profile)).digest("hex")}`;
}

export function bandAxis(profile: BotProfileContract): Readonly<Record<string, unknown>> {
  return Object.freeze({
    engineId: profile.model.engineId,
    modelId: profile.model.modelId,
    band: profile.band,
  });
}

export function familyAxis(profile: BotProfileContract): Readonly<Record<string, unknown>> {
  return Object.freeze({
    family: profile.family,
    guard: profile.guard === undefined ? null : Object.freeze({
      id: profile.guard.id,
      requestProfile: profile.guard.requestProfile,
      thresholdCp: profile.guard.thresholdCp,
    }),
    trait: profile.trait === undefined ? null : Object.freeze({
      id: profile.trait.id,
      classifier: profile.trait.classifier,
      multiplier: profile.trait.multiplier,
      dependsOn: profile.trait.dependsOn,
    }),
  });
}

function statement(
  id: string,
  kind: BotCardStatement["kind"],
  text: string,
  sourceIds: readonly (keyof typeof BOT_CARD_SOURCES)[],
): BotCardStatement {
  if (sourceIds.length === 0) throw new TypeError(`card statement ${id} has no source`);
  for (const sourceId of sourceIds) {
    if (!(sourceId in BOT_CARD_SOURCES)) throw new TypeError(`unknown card source ${sourceId}`);
  }
  return Object.freeze({ id, kind, text, sourceIds: Object.freeze([...sourceIds]) });
}

function assertProfile(profile: BotProfileContract): void {
  if (!([1000, 1400, 1800, 2200] as const).includes(profile.band)) throw new TypeError("unregistered band");
  if (profile.model.id !== `model.maia3.band-${profile.band}@1`) throw new TypeError("model id does not bind the band");
  if (profile.family === "human-baseline" && (profile.guard !== undefined || profile.trait !== undefined)) throw new TypeError("baseline profile carries a family transform");
  if (profile.family === "guarded-human" && (profile.guard === undefined || profile.trait !== undefined)) throw new TypeError("guarded profile has the wrong family layers");
  if (profile.family === "pawn-forward" && (profile.guard === undefined || profile.trait?.dependsOn !== profile.guard.id)) throw new TypeError("pawn trait is not guard-dependent");
}

export function compileBotCard(input: {
  readonly profile: BotProfileContract;
  readonly calibration?: ProfileCalibration;
}): BotCard {
  assertProfile(input.profile);
  const digest = profileDigest(input.profile);
  if (input.calibration !== undefined && input.calibration.profileDigest !== digest) throw new TypeError("calibration belongs to another profile digest");

  const statements: BotCardStatement[] = [
    statement(
      "human_policy",
      "mechanism",
      `Samples the Maia3 human-choice policy at internal band ${input.profile.band}; this band is not a FIDE, Lichess, or Chess.com rating.`,
      ["policy.maia3-band@1"],
    ),
    statement(
      "sampler",
      "mechanism",
      "Draws from the reconstructed candidate distribution at temperature 0.8 and top-p 0.92.",
      ["policy.maia-reconstruction@1"],
    ),
  ];

  if (input.profile.guard !== undefined) {
    statements.push(statement(
      "guard",
      "mechanism",
      "After Maia supplies candidates, Stockfish 18 at fixed depth 8 removes candidates measured at least 250 centipawns behind the best candidate.",
      ["measurement.d969-depth8-guard@1"],
    ));
    statements.push(statement(
      "guard_abstention",
      "scope",
      "The guard steps aside on unavailable, late, incomplete, bounded, or mixed cp/mate evidence; the unchanged Maia policy is then used.",
      ["measurement.d969-depth8-guard@1"],
    ));
  } else {
    statements.push(statement(
      "no_guard",
      "absence",
      "No engine checks or removes a candidate after Maia supplies the policy.",
      ["policy.maia3-band@1"],
    ));
  }

  if (input.profile.trait !== undefined) {
    statements.push(statement(
      "pawn_trait",
      "measurement",
      "After the guard applies, legal pawn moves receive four times their prior weight; this raised pawn selections by 12.28 percentage points on the measured population.",
      ["measurement.r11-pawn-x4@1", "measurement.d969-depth8-guard@1"],
    ));
  }

  statements.push(
    statement("no_book", "absence", "No opening book is attached to this profile.", ["absence.opening-book@1"]),
    statement("no_memory", "absence", "This profile carries no memory from earlier games.", ["absence.cross-game-memory@1"]),
    statement("endgame_scope", "scope", "Roster-wide endgame behavior has not been calibrated.", ["scope.bot-endgame-unknown@1"]),
    statement("clock_scope", "scope", "Clock-conditioned behavior has not been calibrated.", ["scope.bot-clock-unknown@1"]),
  );

  if (input.calibration === undefined) {
    statements.push(statement(
      "calibration",
      "calibration",
      "Calibration is pending for this exact profile; no human-scale strength number is claimed.",
      ["absence.exact-digest-calibration@1"],
    ));
  } else {
    statements.push(statement(
      "calibration",
      "calibration",
      `${input.calibration.measuredLabel}; measured at ${input.calibration.timeControl}.`,
      [input.calibration.sourceId],
    ));
  }

  return Object.freeze({
    profileId: input.profile.id,
    profileDigest: digest,
    display: input.profile.presentation,
    band: input.profile.band,
    family: input.profile.family,
    calibration: input.calibration === undefined ? "uncalibrated" : "band_relative",
    statements: Object.freeze(statements),
  });
}

export function parseCardCompileInput(value: unknown): { readonly profile: BotProfileContract } {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("card input must be an object");
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.join("\0") !== "profile") throw new TypeError("card input has caller-owned fields");
  return Object.freeze({ profile: record.profile as BotProfileContract });
}
