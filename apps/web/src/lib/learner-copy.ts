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

function signedPawns(centipawns: number): string {
  const pawns = centipawns / 100;
  return `${pawns >= 0 ? "+" : "−"}${Math.abs(pawns).toFixed(2)}`;
}

export function recordedEvaluationTrajectory(beforeCentipawns: number, afterCentipawns: number): string {
  return `Recorded evaluation from White's side: ${signedPawns(beforeCentipawns)} → ${signedPawns(afterCentipawns)} pawns`;
}

type StoryResult = "1-0" | "0-1" | "1/2-1/2" | "*" | "win" | "loss" | "draw";
type StoryOutcome = {
  readonly kind: "board_terminal" | "recorded_result" | "unfinished";
  readonly result?: StoryResult;
};

export function storyOutcomeLabel(side: "white" | "black", outcome: StoryOutcome): string {
  const result = outcome.result;
  if (outcome.kind === "unfinished" || result === undefined || result === "*") {
    return "Game unfinished · no final result recorded";
  }
  const context = outcome.kind === "recorded_result" ? "recorded PGN result" : "board-terminal result";
  if (result === "draw" || result === "1/2-1/2") return `Game drawn · ${context}`;
  const learnerWon = result === "win" || (side === "white" ? result === "1-0" : result === "0-1");
  return `${learnerWon ? "You won" : "You lost"} · ${context}`;
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
