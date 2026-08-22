import type { FileTemplateFeature, SquareTemplateFeature, StructuralExpression, StructuralFeature } from "@chess-tabiya/schema/drill-pack";
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
    const captures = observation.detail?.captureAttackers[0]?.captures;
    if (pushes !== undefined) return `Under maximal pawn-reach geometry, an opposing pawn can reach an attacking square for ${observation.squares[0]} after ${count(pushes, "forward step")}; blockers and move legality are not evaluated.`;
    if (captures !== undefined) return `Under maximal pawn-reach geometry, an opposing pawn can reach an attacking file for ${observation.squares[0]} after at least ${count(captures, "capture")}; capture availability and move legality are not asserted.`;
    return `Under maximal pawn-reach geometry, no opposing pawn can reach a square from which it attacks ${observation.squares[0]}.`;
  }
  if (observation.kind === "outpost") return `Tabiya's strict outpost detector matches ${observation.squares[0]} for ${side(observation.color)}: pawn-supported in enemy territory with no opposing pawn path under maximal pawn-reach geometry.`;
  if (observation.kind === "line_blockers") return `The line through ${observation.squares.join("–")} contains ${count(observation.count, "blocker")}.`;
  if (observation.kind === "direct_attack_count") return `${count(observation.count, `${side(observation.color)} piece`)} directly attack ${observation.squares[0]} in the current occupancy; pins are not evaluated.`;
  if (observation.kind === "piece_reach_count") return `${side(observation.color)}'s ${observation.role} on ${observation.squares[0]} has ${count(observation.count, "attack-reachable square")} in the current occupancy; check and pins are not evaluated.`;
  if (observation.kind === "named_structure") return observation.provenanceNote ?? "A Tabiya catalogue structure matches this position.";
  if (observation.kind === "bishop_on_shade") return `${side(observation.color)}'s bishop on ${observation.squares[0]} stands on a ${observation.shade} square.`;
  if (observation.kind === "pawn_count") return `${side(observation.color)} has ${count(observation.count, "pawn")}.`;
  if (observation.kind === "king_opposition") return `${side(observation.color)} has the ${observation.form} opposition: kings on ${observation.squares.join(" and ")} with ${side(observation.color === "white" ? "black" : "white")} to move.`;
  if (observation.kind === "piece_count") return `${side(observation.color)} has ${count(observation.count, observation.role ?? "piece")}.`;
  if (observation.kind === "king_zone") return `${side(observation.color)}'s king on ${observation.squares[0]} stands ${observation.zone === "corner" ? "on a1, a8, h1 or h8" : "on the a-file, the h-file, the first rank or the eighth rank"}.`;
  if (observation.kind === "piece_distance") return `The kings on ${observation.squares.join(" and ")} stand ${count(observation.count, "king-move")} apart.`;
  const exhaustive: never = observation.kind;
  throw new TypeError(`Unhandled structural observation: ${String(exhaustive)}`);
}

function comparison(value: "atLeast" | "atMost" | "equal", count: number): string {
  return value === "atLeast" ? `at least ${count}` : value === "atMost" ? `at most ${count}` : `exactly ${count}`;
}

function renderFeatureSpec(feature: StructuralFeature): string {
  if (feature.kind === "pawn_safe_square") return `no opposing pawn has a maximal-reach path to attack ${feature.square} for ${feature.color}`;
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
  if (feature.kind === "bishop_on_shade") return `${feature.color} has a bishop on a ${feature.shade} square`;
  if (feature.kind === "pawn_count") {
    if (feature.basis === "count") return `${feature.color} has ${comparison(feature.comparison, feature.count)} pawns`;
    const other = feature.color === "white" ? "black" : "white";
    if (feature.count >= 0) return `${feature.color} has ${comparison(feature.comparison, feature.count)} more pawn${feature.count === 1 ? "" : "s"} than ${other}`;
    const inverse = feature.comparison === "atLeast" ? "atMost" : feature.comparison === "atMost" ? "atLeast" : "equal";
    return `${feature.color} has ${comparison(inverse, Math.abs(feature.count))} fewer pawn${feature.count === -1 ? "" : "s"} than ${other}`;
  }
  if (feature.kind === "king_opposition") return `${feature.color} has the ${feature.form} opposition`;
  if (feature.kind === "piece_count") {
    const noun = `${feature.role}${Math.abs(feature.count) === 1 ? "" : "s"}`;
    if (feature.basis === "count") return `${feature.color} has ${comparison(feature.comparison, feature.count)} ${noun}`;
    const other = feature.color === "white" ? "black" : "white";
    return `${feature.color} has ${comparison(feature.comparison, feature.count)} more ${noun} than ${other}`;
  }
  if (feature.kind === "king_zone") return `${feature.color}'s king stands ${feature.zone === "corner" ? "on a1, a8, h1 or h8" : "on the a-file, the h-file, the first rank or the eighth rank"}`;
  if (feature.kind === "piece_distance") {
    const subject = feature.role === "king" ? `${feature.color}'s king` : `${feature.color}'s nearest ${feature.role}`;
    const target = feature.target.kind === "square" ? feature.target.square : `the nearest ${feature.target.color} ${feature.target.role}`;
    return `${subject} is ${comparison(feature.comparison, feature.count)} ${feature.role}-moves from ${target}`;
  }
  const exhaustive: never = feature;
  throw new TypeError(`Unhandled structural feature: ${JSON.stringify(exhaustive)}`);
}

function renderFileTemplate(feature: FileTemplateFeature): string {
  if (feature.kind === "backward_pawn") return `${feature.color} has a backward pawn`;
  if (feature.kind === "isolated_pawn") return `${feature.color} has an isolated pawn`;
  if (feature.kind === "doubled_pawn") return `${feature.color} has doubled pawns`;
  if (feature.kind === "half_open_file") return `the file is half-open for ${feature.color}`;
  if (feature.kind === "open_file") return "the file is open";
  return renderSquareTemplate(feature);
}

function renderSquareTemplate(feature: SquareTemplateFeature): string {
  if (feature.kind === "pawn_safe_square") return `no opposing pawn has a maximal-reach path to attack the square for ${feature.color}`;
  if (feature.kind === "outpost") return `the square matches Tabiya's strict outpost detector for ${feature.color}`;
  if (feature.kind === "passed_pawn") return `${feature.color} has a passed pawn`;
  if (feature.kind === "direct_attack_count") return `the square has ${comparison(feature.comparison, feature.count)} direct ${feature.color} attackers`;
  if (feature.kind === "piece") return feature.piece === null ? "the square is empty" : `the square holds a ${feature.piece.color} ${feature.piece.role}`;
  const exhaustive: never = feature;
  throw new TypeError(`Unhandled quantified template: ${JSON.stringify(exhaustive)}`);
}

export function renderStructuralExpressionSpec(expression: StructuralExpression): string {
  if (expression.kind === "plan_signature") return `registered plan ${expression.planClassId}`;
  if (expression.kind === "all") return expression.of.map(renderStructuralExpressionSpec).join(" and ");
  if (expression.kind === "any") return expression.of.map(renderStructuralExpressionSpec).join(" or ");
  if (expression.kind === "not") return `not: ${renderStructuralExpressionSpec(expression.of)}`;
  if (expression.kind === "feature") return renderFeatureSpec(expression.feature);
  if (expression.kind === "pieceOnSquare") {
    return expression.piece === null
      ? `${expression.square} is empty`
      : `${expression.square} holds a ${expression.piece.color} ${expression.piece.role}`;
  }
  if (expression.kind === "mirrored") {
    const prefix = expression.axis === "files" ? "with files mirrored (a↔h)" : expression.axis === "colors" ? "with colours reversed and ranks mirrored" : "rotated 180 degrees";
    return `${prefix}: ${renderStructuralExpressionSpec(expression.of)}`;
  }
  if (expression.kind === "quantified") {
    const domain = "files" in expression.over
      ? `file from ${expression.over.files.from} to ${expression.over.files.to}`
      : `square from ${expression.over.squares.files.from}${expression.over.squares.ranks.from} to ${expression.over.squares.files.to}${expression.over.squares.ranks.to}`;
    const instantiated = "files" in expression.over
      ? renderFileTemplate(expression.feature as FileTemplateFeature)
      : renderSquareTemplate(expression.feature as SquareTemplateFeature);
    return `on ${expression.quantifier === "some" ? "some" : "every"} ${domain}, ${instantiated}`;
  }
  const exhaustive: never = expression;
  throw new TypeError(`Unhandled structural expression: ${JSON.stringify(exhaustive)}`);
}
