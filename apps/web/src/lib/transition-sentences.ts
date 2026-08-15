import type { TransitionObservation } from "@chess-tabiya/runtime";
import type { TransitionFeature } from "@chess-tabiya/schema/drill-pack";

export function renderTransitionObservation(observation: TransitionObservation): string {
  if (observation.kind === "move_irreversibility") {
    if (observation.subkind === "castled") return `${observation.color} castled.`;
    if (observation.subkind === "last_of_role") return `${observation.color} lost its last piece of one role.`;
    if (observation.subkind === "pawn_break") return `${observation.color} created or resolved pawn contact.`;
    if (observation.subkind === "clock_zeroed") return "The move was a pawn move or capture, so the halfmove clock resets.";
    const exhaustive: never = observation.subkind;
    throw new TypeError(`Unhandled irreversibility observation: ${String(exhaustive)}`);
  }
  const count = observation.count;
  let noun: string;
  if (observation.kind === "attacked_squares_changed") noun = "enemy-occupied square";
  else if (observation.kind === "defended_squares_changed") noun = "friendly-occupied square";
  else if (observation.kind === "slider_lines_changed") noun = "slider line";
  else if (observation.kind === "escape_squares_changed") noun = "geometric destination square";
  else if (observation.kind === "defended_duties_changed") noun = "piece crossing the two-defensive-duties threshold";
  else {
    const exhaustive: never = observation;
    throw new TypeError(`Unhandled transition observation: ${JSON.stringify(exhaustive)}`);
  }
  return `${observation.color} ${observation.direction} ${count} ${noun}${count === 1 ? "" : "s"}. ${observation.provenanceNote}`;
}

export function renderTransitionSpec(feature: TransitionFeature): string {
  if (feature.kind === "move_irreversibility") return `The committed move has Tabiya's ${feature.subkind.replaceAll("_", " ")} irreversibility property.`;
  const comparison = feature.comparison === "atLeast" ? "at least" : feature.comparison === "atMost" ? "at most" : "exactly";
  if (feature.kind === "attacked_squares_changed") return `${feature.color} ${feature.direction} ${comparison} ${feature.count} attacks on enemy-occupied squares.`;
  if (feature.kind === "defended_squares_changed") return `${feature.color} ${feature.direction} ${comparison} ${feature.count} defences of friendly-occupied squares.`;
  if (feature.kind === "slider_lines_changed") return `${feature.color} ${feature.direction} ${comparison} ${feature.count} slider lines.`;
  if (feature.kind === "escape_squares_changed") return `${feature.color} ${feature.direction} ${comparison} ${feature.count} geometric destination squares.`;
  if (feature.kind === "defended_duties_changed") return `${feature.color} ${feature.direction} ${comparison} ${feature.count} two-duty threshold crossings.`;
  const exhaustive: never = feature;
  throw new TypeError(`Unhandled transition feature: ${JSON.stringify(exhaustive)}`);
}
