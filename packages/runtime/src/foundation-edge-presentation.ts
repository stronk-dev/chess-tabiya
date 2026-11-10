// Accepted evidence-presentation §3.10d. Closed, complete selected-source readouts, no detector.
import { normalizeMove } from "chessops/chess";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";
import { evidenceDigest } from "./evidence-contract.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { factRenderer, pieceOn, s, side, PresentationSchemaError, type Parser } from "./presentation-schema.js";

const anchor = { san: s.san, beforeFen: s.str, moveUci: s.uci, afterFen: s.str };
const memberSign = s.lit("gained", "lost", "membership_changed");
const pawn = s.obj({ color: s.color, square: s.square });
const piece = s.obj({ color: s.color, role: s.role });
const placed = s.obj({ color: s.color, role: s.role, square: s.square });
const squares = s.arr(s.square), files = s.arr(s.file);
const fileState = s.lit("open", "half_open_white", "half_open_black", "closed");
const fileRow = s.obj({ file: s.file, whitePawns: squares, blackPawns: squares, state: fileState });
const cause = s.obj({
  mover: s.obj({ color: s.color, role: s.role, from: s.square, to: s.square, promotion: s.nullable(s.lit("queen", "rook", "bishop", "knight")) }),
  captured: s.nullable(placed),
});
const group = s.obj({ color: s.color, file: s.file, pawns: s.arr(s.square, { min: 1 }), adjacentOccupiedFiles: files, islandFiles: s.arr(s.file, { min: 1 }), isolated: s.bool, doubled: s.bool });
const backward = s.obj({ color: s.color, pawn: s.square, stop: s.square, controllers: s.arr(pawn), supportPawns: s.arr(pawn), aheadAdjacentPawns: s.arr(pawn),
  stopOccupancy: s.union("kind", { empty: s.obj({ kind: s.lit("empty") }), own: s.obj({ kind: s.lit("own"), piece }), enemy: s.obj({ kind: s.lit("enemy"), piece }) }),
  immediatePseudoCapture: s.arr(pawn), halfOpenForColor: s.obj({ color: s.color, value: s.bool }) });
const opposition = s.obj({ fen: s.str, kings: s.obj({ white: s.square, black: s.square }), opposition: s.nullable(s.obj({ color: s.color, sideToMove: s.color,
  form: s.lit("direct", "distant_three", "distant_five"), betweenSquares: s.arr(s.square, { min: 1 }), betweenSquaresEmpty: s.lit(true) })) });
const ray = s.obj({ slider: placed, endpoint: s.square, strictInterior: squares, blockers: s.arr(placed) });
const fileChange = s.obj({ beforeFen: s.str, moveUci: s.uci, afterFen: s.str, file: s.file, sign: s.lit("membership_changed"), before: fileRow, after: fileRow, cause });
const partition = s.obj({ files: s.arr(s.file, { min: 1 }), pawns: s.arr(s.square, { min: 1 }) });

const fail = (message: string): never => { throw new PresentationSchemaError(message); };
const same = (a: unknown, b: unknown) => evidenceDigest(a) === evidenceDigest(b);
function change(before: object | null, after: object | null, sign: string): void {
  const expected = before === null ? after === null ? undefined : "gained" : after === null ? "lost" : same(before, after) ? undefined : "membership_changed";
  if (sign !== expected) fail("Source sign crosses its complete original membership");
}
function edge<T extends { readonly san: string; readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }>(parse: Parser<T>, check: (value: T) => void): Parser<T> {
  return (input, label) => {
    const value = parse(input, label), before = positionFromFen(value.beforeFen), raw = parseUci(value.moveUci);
    if (raw === undefined || canonicalFen(before) !== value.beforeFen) return fail("Readout requires its original canonical legal edge");
    const move = normalizeMove(before, raw);
    if (!before.isLegal(move) || makeSan(before, move) !== value.san) return fail("Readout SAN differs from its original legal edge");
    before.play(move);
    if (canonicalFen(before) !== value.afterFen) return fail("Readout after position differs from its original edge");
    check(value); return value;
  };
}
const parseOpposition = edge(s.obj({ ...anchor, subject: s.obj({ white: s.lit("king"), black: s.lit("king") }), sign: memberSign, before: opposition, after: opposition }), value => {
  if (value.before.fen !== value.beforeFen || value.after.fen !== value.afterFen) fail("Opposition snapshots cross their original positions");
  change(value.before.opposition === null ? null : { kings: value.before.kings, opposition: value.before.opposition }, value.after.opposition === null ? null : { kings: value.after.kings, opposition: value.after.opposition }, value.sign);
});
const parseBackward = edge(s.obj({ ...anchor, subject: s.obj({ color: s.color, beforePawn: s.nullable(s.square), afterPawn: s.nullable(s.square) }), sign: memberSign, before: s.nullable(backward), after: s.nullable(backward) }), value => {
  change(value.before, value.after, value.sign);
  if ((value.before?.pawn ?? null) !== value.subject.beforePawn || (value.after?.pawn ?? null) !== value.subject.afterPawn) fail("Backward pawn subject crosses its retained positions");
  for (const row of [value.before, value.after]) if (row !== null) {
    if (row.color !== value.subject.color || row.halfOpenForColor.color === row.color) fail("Backward pawn crosses its color perspective");
    if (row.stopOccupancy.kind !== "empty" && (row.stopOccupancy.piece.color === row.color) !== (row.stopOccupancy.kind === "own")) fail("Stop occupancy crosses its color");
  }
});
const parseGroup = edge(s.obj({ ...anchor, subject: s.obj({ color: s.color, file: s.file }), sign: memberSign, before: s.nullable(group), after: s.nullable(group), cause }), value => {
  change(value.before, value.after, value.sign);
  for (const row of [value.before, value.after]) if (row !== null && (row.color !== value.subject.color || row.file !== value.subject.file)) fail("Pawn group crosses its original color/file");
});
const parseSlider = edge(s.obj({ ...anchor, root: placed, direction: s.obj({ df: s.lit(-1, 0, 1), dr: s.lit(-1, 0, 1) }), sign: memberSign, before: s.nullable(ray), after: s.nullable(ray) }), value => {
  if (value.direction.df === 0 && value.direction.dr === 0) fail("Slider ray requires a signed direction");
  // The actual source compares blockers only, not endpoints/current slider positions.
  change(value.before === null ? null : { blockers: value.before.blockers }, value.after === null ? null : { blockers: value.after.blockers }, value.sign);
  if (value.before !== null && !same(value.root, value.before.slider)) fail("Slider root differs from its original piece");
  for (const row of [value.before, value.after]) if (row !== null && !["bishop", "rook", "queen"].includes(row.slider.role)) fail("Ray lacks a slider");
});
function checkFile(value: ReturnType<typeof fileChange>): void {
  if (value.before.file !== value.file || value.after.file !== value.file || value.before.state === value.after.state) fail("File change crosses its subject or unchanged class");
}
const parseFile = edge(s.obj({ ...anchor, file: s.file, sign: s.lit("membership_changed"), before: fileRow, after: fileRow, cause }), value => checkFile(value));
const parseAccess = edge(s.obj({ ...anchor, file: s.file, piece: s.obj({ color: s.color, role: s.lit("rook", "queen"), square: s.square }), sign: s.lit("gained"), beforeState: fileState, afterState: fileState, fileChange }), value => {
  checkFile(value.fileChange);
  if (value.file !== value.fileChange.file || value.beforeState !== value.fileChange.before.state || value.afterState !== value.fileChange.after.state
    || value.beforeFen !== value.fileChange.beforeFen || value.moveUci !== value.fileChange.moveUci || value.afterFen !== value.fileChange.afterFen || value.piece.square[0] !== value.file) fail("Stationary piece reveal crosses its supporting file change");
});
const parseIslands = edge(s.obj({ ...anchor, color: s.color, sign: s.lit("count_gained", "count_lost", "topology_changed"), beforeCount: s.nat, afterCount: s.nat, before: s.arr(partition), after: s.arr(partition) }), value => {
  if (value.before.length !== value.beforeCount || value.after.length !== value.afterCount) fail("Island counts cross their complete partitions");
  if (same(value.before.map(row => row.files), value.after.map(row => row.files))) fail("Unchanged file partitions are not a topology event");
  if (value.sign !== (value.afterCount > value.beforeCount ? "count_gained" : value.afterCount < value.beforeCount ? "count_lost" : "topology_changed")) fail("Island topology sign crosses its counts");
});

const list = (values: readonly string[]) => values.length === 0 ? "none" : values.join(", ");
const placedText = (p: ReturnType<typeof placed>) => pieceOn(p, p.square);
const pawnList = (values: readonly ReturnType<typeof pawn>[]) => list(values.map(p => `${side(p.color)} pawn ${p.square}`));
function oppositionText(value: ReturnType<typeof opposition>): string {
  const kings = `White king ${value.kings.white}, Black king ${value.kings.black}`;
  if (value.opposition === null) return `${kings}; ${side(positionFromFen(value.fen).turn)} to move; no unobstructed opposition`;
  const row = value.opposition;
  const form = { direct: "direct", distant_three: "distant with three intervening squares", distant_five: "distant with five intervening squares" }[row.form];
  return `${kings}; ${side(row.sideToMove)} to move; ${side(row.color)} holds ${form} opposition, with empty intervening squares ${list(row.betweenSquares)}`;
}
function backwardText(row: ReturnType<typeof backward> | null): string {
  if (row === null) return "no backward-pawn subject";
  const occupancy = row.stopOccupancy.kind === "empty" ? "empty" : `${row.stopOccupancy.kind === "own" ? "own" : "opposing"} ${side(row.stopOccupancy.piece.color)} ${row.stopOccupancy.piece.role}`;
  return `${side(row.color)} pawn ${row.pawn}, stop ${row.stop} ${occupancy}; geometric pawn controllers: ${pawnList(row.controllers)}; support pawns: ${pawnList(row.supportPawns)}; ahead adjacent pawns: ${pawnList(row.aheadAdjacentPawns)}; pseudo-capturable enemy pawns: ${pawnList(row.immediatePseudoCapture)}; file half-open for ${side(row.halfOpenForColor.color)}: ${row.halfOpenForColor.value ? "yes" : "no"}`;
}
const groupText = (row: ReturnType<typeof group> | null) => row === null ? "no pawn-file group" : `${side(row.color)} ${row.file}-file pawns, front to rear: ${list(row.pawns)}; adjacent occupied files: ${list(row.adjacentOccupiedFiles)}; island files: ${list(row.islandFiles)}; isolated: ${row.isolated ? "yes" : "no"}; doubled: ${row.doubled ? "yes" : "no"}`;
function causeText(row: ReturnType<typeof cause>): string {
  return `${pieceOn(row.mover, row.mover.from)} moved to ${row.mover.to}; promotion: ${row.mover.promotion ?? "none"}; captured piece: ${row.captured === null ? "none" : placedText(row.captured)}`;
}
const classes = { open: "open", half_open_white: "half-open for White", half_open_black: "half-open for Black", closed: "closed" };
const fileText = (row: ReturnType<typeof fileRow>) => `${row.file}-file ${classes[row.state]}; White pawns: ${list(row.whitePawns)}; Black pawns: ${list(row.blackPawns)}`;
const fileChangeText = (row: ReturnType<typeof fileChange>) => `before: ${fileText(row.before)}; after: ${fileText(row.after)}; ${causeText(row.cause)}`;
const rayText = (row: ReturnType<typeof ray> | null) => row === null ? "no ray" : `${placedText(row.slider)} toward board-edge square ${row.endpoint}; interior squares: ${list(row.strictInterior)}; blockers: ${list(row.blockers.map(placedText))}`;
const partitionsText = (rows: readonly ReturnType<typeof partition>[]) => rows.length === 0 ? "no islands" : rows.map(row => `files ${list(row.files)} with pawns ${list(row.pawns)}`).join("; ");
const membership = { gained: "appeared", lost: "disappeared", membership_changed: "changed membership" };

export const FOUNDATION_EDGE_FACT_RENDERERS = {
  "inspector.opposition_change@1": factRenderer(parseOpposition, v => `After ${v.san}, the king-pair relation ${membership[v.sign]}. Before: ${oppositionText(v.before)}. After: ${oppositionText(v.after)}.`),
  "inspector.backward_pawn_change@1": factRenderer(parseBackward, v => `After ${v.san}, ${side(v.subject.color)}'s backward-pawn relation ${membership[v.sign]} (${v.subject.beforePawn ?? "absent"} to ${v.subject.afterPawn ?? "absent"}). Before: ${backwardText(v.before)}. After: ${backwardText(v.after)}.`),
  "inspector.pawn_file_group_change@1": factRenderer(parseGroup, v => `After ${v.san}, ${side(v.subject.color)}'s ${v.subject.file}-file group ${membership[v.sign]}. Before: ${groupText(v.before)}. After: ${groupText(v.after)}. ${causeText(v.cause)}.`),
  "inspector.slider_blocker_change@1": factRenderer(parseSlider, v => `After ${v.san}, the ray from original ${placedText(v.root)} in direction (${v.direction.df}, ${v.direction.dr}) ${membership[v.sign]}. Before: ${rayText(v.before)}. After: ${rayText(v.after)}. The edge square is not a tactical target.`),
  "inspector.file_state_change@1": factRenderer(parseFile, v => `After ${v.san}, the file class changed; ${fileChangeText(v)}.`),
  "inspector.file_access_revealed@1": factRenderer(parseAccess, v => `After ${v.san}, stationary ${placedText(v.piece)} has a changed ${v.file}-file class, ${classes[v.beforeState]} to ${classes[v.afterState]}; supporting change: ${fileChangeText(v.fileChange)}.`),
  "inspector.pawn_island_topology_change@1": factRenderer(parseIslands, v => `After ${v.san}, ${side(v.color)}'s pawn-island ${v.sign === "count_gained" ? "count increased" : v.sign === "count_lost" ? "count decreased" : "topology changed with equal counts"}. Before: ${v.beforeCount}, ${partitionsText(v.before)}. After: ${v.afterCount}, ${partitionsText(v.after)}.`),
} as const;

export const FOUNDATION_EDGE_STATEMENTS = {
  "rules.structural.event.king_opposition@2": ["inspector.opposition_change@1", "unobstructed-opposition@1"],
  "rules.structural.event.backward_pawn@2": ["inspector.backward_pawn_change@1", "backward-pawn@1"],
  "derived.structural.event.pawn_file_group@1": ["inspector.pawn_file_group_change@1", "pawn-file-membership@1"],
  "rules.transition.event.slider_ray@2": ["inspector.slider_blocker_change@1", "physical-slider-membership@1"],
  "derived.activity.event.file_state@1": ["inspector.file_state_change@1", "pawn-file-membership@1"],
  "derived.activity.event.file_access_revealed@1": ["inspector.file_access_revealed@1", "pawn-file-membership@1"],
  "rules.structural.event.pawn_islands@2": ["inspector.pawn_island_topology_change@1", "pawn-island-topology@1"],
} as const;

const oppositionForm = { direct: "direct", distant_three: "distant", distant_five: "distant" } as const;
const directionNames: Readonly<Record<string, string>> = Object.freeze({
  "-1,-1": "southwest", "0,-1": "south", "1,-1": "southeast", "-1,0": "west",
  "1,0": "east", "-1,1": "northwest", "0,1": "north", "1,1": "northeast",
});
const directionName = (direction: { readonly df: number; readonly dr: number }) => directionNames[`${direction.df},${direction.dr}`] ?? fail("Ray direction has no chess label");

/** Ordinary compact captions keep the SAME complete parsed source operands as manual detail.
 * Only the fixed rendered template is shorter; source correspondence never uses a subset. */
export const FOUNDATION_COMPACT_FACT_RENDERERS = {
  "play.opposition_change@1": factRenderer(parseOpposition, v => {
    const before = v.before.opposition, after = v.after.opposition;
    return after === null ? `After ${v.san}, ${side(before!.color)}'s opposition ended.`
      : before === null ? `After ${v.san}, ${side(after.color)} has ${oppositionForm[after.form]} opposition.`
      : before.color !== after.color ? `After ${v.san}, opposition passed from ${side(before.color)} to ${side(after.color)}.`
      : `After ${v.san}, ${side(after.color)}'s ${oppositionForm[after.form]} opposition changed.`;
  }),
  "play.backward_pawn_change@1": factRenderer(parseBackward, v => {
    const at = v.subject.beforePawn === null ? v.subject.afterPawn : v.subject.afterPawn === null || v.subject.beforePawn === v.subject.afterPawn
      ? v.subject.beforePawn : `${v.subject.beforePawn} to ${v.subject.afterPawn}`;
    return `After ${v.san}, ${side(v.subject.color)}'s pawn ${at}: the backward-pawn relation ${v.sign === "membership_changed" ? "changed" : membership[v.sign]}.`;
  }),
  "play.pawn_file_group_change@1": factRenderer(parseGroup, v => {
    if (v.before === null || v.after === null) return `After ${v.san}, ${side(v.subject.color)}'s ${v.subject.file}-file pawn group ${v.before === null ? "appeared" : "disappeared"}.`;
    const flags = (["isolated", "doubled"] as const).flatMap(flag => {
      const before = v.before![flag], after = v.after![flag];
      return before === after ? [] : [after ? `became ${flag}` : `are no longer ${flag}`];
    });
    return flags.length === 0 ? `After ${v.san}, ${side(v.subject.color)}'s ${v.subject.file}-file pawn group changed.`
      : `After ${v.san}, ${side(v.subject.color)}'s ${v.subject.file}-file pawns ${flags.join(" and ")}.`;
  }),
  "play.slider_blocker_change@1": factRenderer(parseSlider, v => {
    const action = v.before === null ? "ray appeared" : v.after === null ? "ray ended" : "ray blockers changed";
    return `After ${v.san}, the original ${side(v.root.color)} ${v.root.role} on ${v.root.square}: its ${directionName(v.direction)} ${action}.`;
  }),
  "play.file_state_change@1": factRenderer(parseFile, v => `After ${v.san}, the ${v.file}-file became ${classes[v.after.state]}.`),
  "play.file_access_revealed@1": factRenderer(parseAccess, v => `After ${v.san}, the ${v.file}-file became ${classes[v.afterState]} for the stationary ${placedText(v.piece)}.`),
  "play.pawn_island_topology_change@1": factRenderer(parseIslands, v => v.beforeCount === v.afterCount
    ? `After ${v.san}, ${side(v.color)}'s pawn-island files changed.`
    : `After ${v.san}, ${side(v.color)}'s pawn-island count changed from ${v.beforeCount} to ${v.afterCount}.`),
} as const;

export const FOUNDATION_COMPACT_STATEMENTS = {
  "rules.structural.event.king_opposition@2": ["play.opposition_change@1", "unobstructed-opposition@1"],
  "rules.structural.event.backward_pawn@2": ["play.backward_pawn_change@1", "backward-pawn@1"],
  "derived.structural.event.pawn_file_group@1": ["play.pawn_file_group_change@1", "pawn-file-membership@1"],
  "rules.transition.event.slider_ray@2": ["play.slider_blocker_change@1", "physical-slider-membership@1"],
  "derived.activity.event.file_state@1": ["play.file_state_change@1", "pawn-file-membership@1"],
  "derived.activity.event.file_access_revealed@1": ["play.file_access_revealed@1", "pawn-file-membership@1"],
  "rules.structural.event.pawn_islands@2": ["play.pawn_island_topology_change@1", "pawn-island-topology@1"],
} as const;

/** Correspondence to the existing source ref, not an authenticity/access check. */
export function assertFoundationEdgePayloadRef(operands: unknown, originalDigest: string): void {
  if (operands === null || typeof operands !== "object" || Array.isArray(operands)) return fail("Missing complete edge operands");
  const { san: _san, ...payload } = operands as Record<string, unknown>;
  if (`sha256:${evidenceDigest(payload)}` !== originalDigest) fail("Structural readout differs from its original complete source reference");
}

// Shared closed source shapes; these exports do not admit a new consumer or reinterpret a value.
export const FOUNDATION_VALUE_SCHEMAS = Object.freeze({ opposition, backward, group, fileRow, pawn, placed });
