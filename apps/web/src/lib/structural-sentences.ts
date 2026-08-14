import type { StructuralExpression, StructuralFeature } from "@chess-tabiya/schema/drill-pack";
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

function comparison(value: "atLeast" | "atMost" | "equal", count: number): string {
  return value === "atLeast" ? `at least ${count}` : value === "atMost" ? `at most ${count}` : `exactly ${count}`;
}

function renderFeatureSpec(feature: StructuralFeature): string {
  if (feature.kind === "pawn_safe_square") return `${feature.square} is currently safe from an opposing pawn advancing on its file for ${feature.color}`;
  if (feature.kind === "outpost") return `${feature.square} matches Tabiya's strict outpost detector for ${feature.color}`;
  if (feature.kind === "backward_pawn") return `${feature.color} has a backward pawn on the ${feature.file}-file`;
  if (feature.kind === "isolated_pawn") return `${feature.color} has an isolated pawn on the ${feature.file}-file`;
  if (feature.kind === "doubled_pawn") return `${feature.color} has doubled pawns on the ${feature.file}-file`;
  if (feature.kind === "passed_pawn") return `${feature.color} has a passed pawn on ${feature.square}`;
  if (feature.kind === "open_file") return `the ${feature.file}-file is open`;
  if (feature.kind === "half_open_file") return `the ${feature.file}-file is half-open for ${feature.color}`;
  if (feature.kind === "line_blockers") return `the line ${feature.from}–${feature.to} has ${comparison(feature.comparison, feature.count)} blockers`;
  if (feature.kind === "direct_attack_count") return `${feature.square} has ${comparison(feature.comparison, feature.count)} direct ${feature.color} attackers`;
  if (feature.kind === "piece_reach_count") return `${feature.scope} ${feature.color} ${feature.role} has ${comparison(feature.comparison, feature.count)} attack-reachable squares`;
  if (feature.kind === "named_structure") return `Tabiya's ${feature.id} catalogue detector matches`;
  const exhaustive: never = feature;
  throw new TypeError(`Unhandled structural feature: ${JSON.stringify(exhaustive)}`);
}

export function renderStructuralExpressionSpec(expression: StructuralExpression): string {
  if (expression.kind === "all") return expression.of.map(renderStructuralExpressionSpec).join(" and ");
  if (expression.kind === "any") return expression.of.map(renderStructuralExpressionSpec).join(" or ");
  if (expression.kind === "not") return `not: ${renderStructuralExpressionSpec(expression.of)}`;
  if (expression.kind === "feature") return renderFeatureSpec(expression.feature);
  if (expression.kind === "pieceOnSquare") {
    return expression.piece === null
      ? `${expression.square} is empty`
      : `${expression.square} holds a ${expression.piece.color} ${expression.piece.role}`;
  }
  const exhaustive: never = expression;
  throw new TypeError(`Unhandled structural expression: ${JSON.stringify(exhaustive)}`);
}
