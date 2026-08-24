import type { PublishedBandValue, RatingPublication } from "@chess-tabiya/runtime/rating";

import type { CorpusPopulation, ProgressAttempt } from "./api.js";

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

function signedPawns(centipawns: number): string {
  const pawns = centipawns / 100;
  return `${pawns >= 0 ? "+" : "−"}${Math.abs(pawns).toFixed(2)}`;
}

export function recordedEvaluationTrajectory(beforeCentipawns: number, afterCentipawns: number): string {
  return `Recorded evaluation from White's side: ${signedPawns(beforeCentipawns)} → ${signedPawns(afterCentipawns)} pawns`;
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
