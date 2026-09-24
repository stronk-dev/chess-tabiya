import type { PublishedBandValue, RatingPublication } from "@chess-tabiya/runtime/rating";

import type { CorpusPopulation, ProgressAttempt, RatedGameHistoryItem, RepertoireGap } from "./api.js";

const STORY_MOMENT_LABELS = Object.freeze({
  irreversibility: "Irreversible change",
  phase_change: "Phase transition",
  human_divergence: "Human-choice split",
  option_collapse: "Options narrowed",
  eval_pivot: "Evaluation shift",
  last_level: "Last level evaluation",
  endgame_entry: "Endgame begins",
  shape_span: "Recognized structure",
  outcome: "Outcome reached",
} as const);

export function storyMomentLabel(kind: keyof typeof STORY_MOMENT_LABELS): string {
  return STORY_MOMENT_LABELS[kind];
}

export function attemptVerdictLabel(verdict: ProgressAttempt["verdict"]): string {
  if (verdict === "stable") return "Objective held";
  if (verdict === "unstable") return "Objective not held";
  return "Objective unresolved";
}

const REPERTOIRE_GAP_STATE_LABELS = Object.freeze({
  open: "No rehearsal yet",
  addressed: "Rehearsal played — choose your answer",
  answered: "Repertoire answer chosen",
} satisfies Record<RepertoireGap["state"], string>);

export function repertoireGapStateLabel(state: RepertoireGap["state"]): string {
  return REPERTOIRE_GAP_STATE_LABELS[state];
}

const RATING_PUBLICATION_STATE_LABELS = Object.freeze({
  provisional: "Still gathering games",
  published: "Measured within the ladder",
  bounded: "Outside the measured ladder",
} satisfies Record<RatingPublication["state"], string>);

export function ratingPublicationStateLabel(state: RatingPublication["state"]): string {
  return RATING_PUBLICATION_STATE_LABELS[state];
}

const RATED_GAME_VOID_REASON_LABELS = Object.freeze({
  rewound: "rewound during play",
  forked: "branched during play",
  assistance: "assistance used",
  engine_changed: "opponent changed",
  calibration_retired: "rating calibration retired",
  abandoned: "game abandoned",
} satisfies Record<NonNullable<RatedGameHistoryItem["voidReason"]>, string>);

export function ratedGameResultLabel(game: Pick<RatedGameHistoryItem, "state" | "voidReason" | "result">): string {
  if (game.state === "voided") {
    return `Not rated${game.voidReason === null ? "" : ` — ${RATED_GAME_VOID_REASON_LABELS[game.voidReason]}`}`;
  }
  if (game.result === "win") return "Won";
  if (game.result === "loss") return "Lost";
  if (game.result === "draw") return "Drawn";
  return "Result pending";
}

export function chessSideLabel(side: "white" | "black"): string {
  return side === "white" ? "White" : "Black";
}

function readableSpeed(speed: string): string {
  if (speed === "ultraBullet") return "ultrabullet";
  return speed.replaceAll("_", " ");
}

export function corpusPopulationLabel(population: CorpusPopulation): string {
  const ratings = population.ratings.length === 0 ? "all rating groups" : `rating groups ${population.ratings.join(", ")}`;
  const speeds = population.speeds.length === 0 ? "all time controls" : population.speeds.map(readableSpeed).join(", ");
  return `Lichess games · ${ratings} · ${speeds} · ${population.since} to ${population.until}`;
}

export function publishedBandLabel(value: PublishedBandValue): string {
  if (value.kind === "below") return `below band ${value.band}`;
  if (value.kind === "above") return `above band ${value.band}`;
  return `band ${Math.round(value.value)}`;
}

export function publishedBandInterval(publication: RatingPublication): string {
  return `${publishedBandLabel(publication.interval[0])} to ${publishedBandLabel(publication.interval[1])}`;
}

/*
 * Return-queue copy (rfc/return-scheduling.md §§3, 4, 7). Frequency orders, it never grades: these
 * sentences may say a position is reached more often, never that it matters more or is better.
 */
const RETRY_VARIANT_LABELS = Object.freeze({
  same_root_new_defense: "Same position, a new defence",
  alternate_plan_class: "Same position, a different plan class",
  related_position_same_idea: "Related position, same idea",
  opposite_side: "Same structure, opposite side",
  different_material_details: "Same outcome, different material details",
} as const);

export function retryVariantLabel(variant: string): string {
  return (RETRY_VARIANT_LABELS as Readonly<Record<string, string>>)[variant] ?? variant;
}

export function dueVariationSentence(schedule: { readonly kind: "blocked" | "varied"; readonly variant: string | null }): string {
  if (schedule.kind === "blocked") return "Repeat the blocked attempt";
  if (schedule.variant === null) return "Varied repetition · the variation is a fresh opponent seed";
  return `Varied repetition · the pack names this variation: ${retryVariantLabel(schedule.variant)}`;
}

/**
 * The fixed explanation that always accompanies the standing word (Discharge D2). The word is
 * derived from the return ladder alone; it says how far apart returns have been held, not how well.
 */
export const RETURN_STANDING_EXPLANATION = "based on how many spaced returns you've held";

export const DUE_FREQUENCY_ORDER_NOTE = "Returns due on the same day list the position reached in more Lichess games at the rehearsal's rating band first. Earlier due dates always come first.";

export function dueFrequencySentence(frequency: { readonly games: number; readonly population: CorpusPopulation } | null): string | undefined {
  if (frequency === null) return undefined;
  return `Position reached in ${frequency.games.toLocaleString("en-US")} games · ${corpusPopulationLabel(frequency.population)}`;
}

export function dueWaitingSentence(waiting: number, intakeLimit: number): string | undefined {
  if (waiting === 0) return undefined;
  return `${waiting} more ${waiting === 1 ? "return is" : "returns are"} waiting. At most ${intakeLimit} are shown at once; the rest keep their place and are served as earlier returns are cleared.`;
}

export function difficultRootRuleSentence(threshold: number): string {
  return `Listed after ${threshold} or more unstable graded attempts at the same starting position. This counts recorded attempts; it is not a rating of you.`;
}

/**
 * Guess-the-move on an imported game (rfc/return-scheduling.md §8). The reference is the move the
 * game actually played; the model rank says how human the guess was and is never a grade.
 */
export function importedGuessSentence(guess: {
  readonly guessUci: string; readonly guessSan: string; readonly playedUci: string; readonly playedSan: string;
  readonly rank: number | null; readonly candidateCount: number;
}): string {
  const played = guess.guessUci === guess.playedUci
    ? `The game continued ${guess.playedSan}, the move you guessed.`
    : `The game continued ${guess.playedSan}. You guessed ${guess.guessSan}.`;
  const model = guess.candidateCount === 0
    ? "The human-move model listed no candidates here."
    : guess.rank === null
      ? `Your guess was not among the ${guess.candidateCount} moves the human-move model listed here.`
      : `The human-move model listed your guess at rank ${guess.rank} of ${guess.candidateCount}.`;
  return `${played} ${model}`;
}

export function difficultRootCountSentence(unstableCount: number): string {
  return `${unstableCount} unstable ${unstableCount === 1 ? "attempt" : "attempts"} recorded`;
}
