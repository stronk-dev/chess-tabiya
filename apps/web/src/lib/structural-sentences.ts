import type { StructuralObservation } from "@chess-tabiya/runtime";

function side(color: "white" | "black" | undefined): string { return color === "white" ? "White" : "Black"; }
function count(value: number | undefined, singular: string, plural = `${singular}s`): string { const actual = value ?? 0; return `${actual} ${actual === 1 ? singular : plural}`; }

export function renderStructuralObservation(observation: StructuralObservation): string {
  if (observation.kind === "backward_pawn") return `Tabiya's backward-pawn detector matches ${side(observation.color)}'s ${observation.file}-file.`;
  if (observation.kind === "isolated_pawn") return `${side(observation.color)} has a pawn on the ${observation.file}-file and none on either adjacent file.`;
  if (observation.kind === "doubled_pawn") return `${side(observation.color)} has at least two pawns on the ${observation.file}-file.`;
  if (observation.kind === "passed_pawn") return `${side(observation.color)}'s pawn on ${observation.squares[0]} has no opposing pawn ahead on its file or an adjacent file.`;
  if (observation.kind === "open_file") return `Neither side has a pawn on the ${observation.file}-file.`;
  if (observation.kind === "half_open_file") return `${side(observation.color)} has no pawn on the ${observation.file}-file; the other side has one.`;
  if (observation.kind === "pawn_safe_square") {
    const pushes = observation.detail?.pushAttackers[0]?.pushes;
    const qualifier = observation.detail?.captureAttackers.length ? " A pawn would need a capture to reach an attacking file; capture availability is not evaluated." : "";
    return pushes === undefined
      ? `While the current pawn files remain, no opposing pawn can attack ${observation.squares[0]} by advancing on its file.${qualifier}`
      : `While the current pawn files remain, an opposing pawn can attack ${observation.squares[0]} after ${count(pushes, "push", "pushes")}.${qualifier}`;
  }
  if (observation.kind === "outpost") return `Tabiya's strict outpost detector matches ${observation.squares[0]} for ${side(observation.color)}: pawn-supported in enemy territory and currently safe from an opposing pawn advancing on its file.`;
  if (observation.kind === "line_blockers") return `The line through ${observation.squares.join("–")} contains ${count(observation.count, "blocker")}.`;
  if (observation.kind === "direct_attack_count") return `${count(observation.count, `${side(observation.color)} piece`)} directly attack ${observation.squares[0]} in the current occupancy; pins are not evaluated.`;
  if (observation.kind === "piece_reach_count") return `${side(observation.color)}'s ${observation.role} on ${observation.squares[0]} has ${count(observation.count, "attack-reachable square")} in the current occupancy; check and pins are not evaluated.`;
  if (observation.kind === "named_structure") return observation.provenanceNote ?? "A Tabiya catalogue structure matches this position.";
  const exhaustive: never = observation.kind;
  throw new TypeError(`Unhandled structural observation: ${String(exhaustive)}`);
}
