import type { StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";

type RecordValue = Readonly<Record<string, unknown>>;

export type ShapeEntryResponse = ShapeEntryDefinition & {
  readonly channel: "official" | "community";
  readonly publisherHandle?: string;
};

const COLORS = ["white", "black"] as const;
const ROLES = ["pawn", "knight", "bishop", "rook", "queen", "king"] as const;
const COMPARISONS = ["atLeast", "atMost", "equal"] as const;

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as RecordValue;
}

function exact(value: RecordValue, required: readonly string[], label: string, optional: readonly string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${label} has an invalid shape`);
}

function nonempty(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is outside the closed vocabulary`);
  return value as T;
}

function integer(value: unknown, label: string, minimum?: number, maximum?: number): number {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${label} must be a safe integer`);
  const parsed = Number(value);
  if ((minimum !== undefined && parsed < minimum) || (maximum !== undefined && parsed > maximum)) throw new TypeError(`${label} is outside its bounds`);
  return parsed;
}

function id(value: unknown, label: string): string {
  const parsed = nonempty(value, label);
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(parsed)) throw new TypeError(`${label} must be a canonical id`);
  return parsed;
}

function square(value: unknown, label: string): string {
  return oneOf(value, [..."abcdefgh"].flatMap((file) => [..."12345678"].map((rank) => `${file}${rank}`)), label);
}

function file(value: unknown, label: string): string {
  return oneOf(value, [..."abcdefgh"], label);
}

function piece(value: unknown, label: string): void {
  const item = record(value, label); exact(item, ["color", "role"], label);
  oneOf(item.color, COLORS, `${label}/color`); oneOf(item.role, ROLES, `${label}/role`);
}

function countComparison(item: RecordValue, label: string): void {
  oneOf(item.comparison, COMPARISONS, `${label}/comparison`); integer(item.count, `${label}/count`);
}

function structuralFeature(value: unknown, label: string): void {
  const item = record(value, label), kind = nonempty(item.kind, `${label}/kind`);
  if (["pawn_safe_square", "outpost", "passed_pawn"].includes(kind)) {
    exact(item, ["kind", "color", "square"], label); oneOf(item.color, COLORS, `${label}/color`); square(item.square, `${label}/square`); return;
  }
  if (["backward_pawn", "isolated_pawn", "doubled_pawn", "half_open_file"].includes(kind)) {
    exact(item, ["kind", "color", "file"], label); oneOf(item.color, COLORS, `${label}/color`); file(item.file, `${label}/file`); return;
  }
  if (kind === "open_file") { exact(item, ["kind", "file"], label); file(item.file, `${label}/file`); return; }
  if (kind === "line_blockers") {
    exact(item, ["kind", "from", "to", "comparison", "count"], label); square(item.from, `${label}/from`); square(item.to, `${label}/to`); countComparison(item, label); return;
  }
  if (kind === "direct_attack_count") {
    exact(item, ["kind", "square", "color", "comparison", "count"], label); square(item.square, `${label}/square`); oneOf(item.color, COLORS, `${label}/color`); countComparison(item, label); return;
  }
  if (kind === "piece_reach_count") {
    exact(item, ["kind", "color", "role", "scope", "comparison", "count"], label); oneOf(item.color, COLORS, `${label}/color`); oneOf(item.role, ["knight", "bishop", "rook", "queen"] as const, `${label}/role`); oneOf(item.scope, ["any", "every"] as const, `${label}/scope`); countComparison(item, label); return;
  }
  if (kind === "named_structure") { exact(item, ["kind", "id"], label); oneOf(item.id, ["carlsbad", "iqp-white", "iqp-black", "maroczy-bind"] as const, `${label}/id`); return; }
  if (kind === "bishop_on_shade") { exact(item, ["kind", "color", "shade"], label); oneOf(item.color, COLORS, `${label}/color`); oneOf(item.shade, ["light", "dark"] as const, `${label}/shade`); return; }
  if (kind === "pawn_count") {
    exact(item, ["kind", "color", "basis", "comparison", "count"], label); oneOf(item.color, COLORS, `${label}/color`); oneOf(item.basis, ["count", "difference"] as const, `${label}/basis`); countComparison(item, label); return;
  }
  if (kind === "king_opposition") { exact(item, ["kind", "color", "form"], label); oneOf(item.color, COLORS, `${label}/color`); oneOf(item.form, ["direct", "distant"] as const, `${label}/form`); return; }
  if (kind === "piece_count") {
    exact(item, ["kind", "color", "role", "basis", "comparison", "count"], label); oneOf(item.color, COLORS, `${label}/color`); oneOf(item.role, ROLES, `${label}/role`); oneOf(item.basis, ["count", "difference"] as const, `${label}/basis`); countComparison(item, label); return;
  }
  if (kind === "king_zone") { exact(item, ["kind", "color", "zone"], label); oneOf(item.color, COLORS, `${label}/color`); oneOf(item.zone, ["edge", "corner"] as const, `${label}/zone`); return; }
  if (kind === "piece_distance") {
    exact(item, ["kind", "color", "role", "target", "comparison", "count"], label); oneOf(item.color, COLORS, `${label}/color`); oneOf(item.role, ["king", "knight", "bishop", "rook", "queen"] as const, `${label}/role`); countComparison(item, label);
    const target = record(item.target, `${label}/target`), targetKind = oneOf(target.kind, ["square", "piece"] as const, `${label}/target/kind`);
    if (targetKind === "square") { exact(target, ["kind", "square"], `${label}/target`); square(target.square, `${label}/target/square`); }
    else { exact(target, ["kind", "color", "role"], `${label}/target`); oneOf(target.color, COLORS, `${label}/target/color`); oneOf(target.role, ROLES, `${label}/target/role`); }
    return;
  }
  throw new TypeError(`${label}/kind is outside the closed vocabulary`);
}

function fileRange(value: unknown, label: string): void {
  const item = record(value, label); exact(item, ["from", "to"], label); file(item.from, `${label}/from`); file(item.to, `${label}/to`);
}

function fileTemplate(value: unknown, label: string): void {
  const item = record(value, label), kind = oneOf(item.kind, ["backward_pawn", "isolated_pawn", "doubled_pawn", "half_open_file", "open_file"] as const, `${label}/kind`);
  if (kind === "open_file") exact(item, ["kind"], label);
  else { exact(item, ["kind", "color"], label); oneOf(item.color, COLORS, `${label}/color`); }
}

function squareTemplate(value: unknown, label: string): void {
  const item = record(value, label), kind = oneOf(item.kind, ["pawn_safe_square", "outpost", "passed_pawn", "direct_attack_count", "piece"] as const, `${label}/kind`);
  if (kind === "piece") { exact(item, ["kind", "piece"], label); if (item.piece !== null) piece(item.piece, `${label}/piece`); return; }
  if (kind === "direct_attack_count") { exact(item, ["kind", "color", "comparison", "count"], label); oneOf(item.color, COLORS, `${label}/color`); countComparison(item, label); return; }
  exact(item, ["kind", "color"], label); oneOf(item.color, COLORS, `${label}/color`);
}

function structuralExpression(value: unknown, label: string, depth = 0): void {
  if (depth > 64) throw new TypeError(`${label} exceeds the structural-expression depth limit`);
  const item = record(value, label), kind = oneOf(item.kind, ["all", "any", "not", "feature", "pieceOnSquare", "mirrored", "quantified", "plan_signature"] as const, `${label}/kind`);
  if (kind === "all" || kind === "any") {
    exact(item, ["kind", "of"], label); if (!Array.isArray(item.of) || item.of.length === 0) throw new TypeError(`${label}/of must be a non-empty array`); item.of.forEach((child, index) => structuralExpression(child, `${label}/of/${index}`, depth + 1)); return;
  }
  if (kind === "not") { exact(item, ["kind", "of"], label); structuralExpression(item.of, `${label}/of`, depth + 1); return; }
  if (kind === "feature") { exact(item, ["kind", "feature"], label); structuralFeature(item.feature, `${label}/feature`); return; }
  if (kind === "pieceOnSquare") { exact(item, ["kind", "square", "piece"], label); square(item.square, `${label}/square`); if (item.piece !== null) piece(item.piece, `${label}/piece`); return; }
  if (kind === "mirrored") { exact(item, ["kind", "axis", "of"], label); oneOf(item.axis, ["colors", "files", "both"] as const, `${label}/axis`); structuralExpression(item.of, `${label}/of`, depth + 1); return; }
  if (kind === "plan_signature") { exact(item, ["kind", "planClassId"], label); id(item.planClassId, `${label}/planClassId`); return; }
  exact(item, ["kind", "quantifier", "over", "feature"], label); oneOf(item.quantifier, ["some", "every"] as const, `${label}/quantifier`);
  const over = record(item.over, `${label}/over`);
  if ("files" in over) { exact(over, ["files"], `${label}/over`); fileRange(over.files, `${label}/over/files`); fileTemplate(item.feature, `${label}/feature`); return; }
  exact(over, ["squares"], `${label}/over`); const region = record(over.squares, `${label}/over/squares`); exact(region, ["files", "ranks"], `${label}/over/squares`); fileRange(region.files, `${label}/over/squares/files`);
  const ranks = record(region.ranks, `${label}/over/squares/ranks`); exact(ranks, ["from", "to"], `${label}/over/squares/ranks`); integer(ranks.from, `${label}/over/squares/ranks/from`, 1, 8); integer(ranks.to, `${label}/over/squares/ranks/to`, 1, 8); squareTemplate(item.feature, `${label}/feature`);
}

function textArray(value: unknown, label: string, minimum = 0): readonly string[] {
  if (!Array.isArray(value) || value.length < minimum) throw new TypeError(`${label} must contain at least ${minimum} entries`);
  return value.map((entry, index) => nonempty(entry, `${label}/${index}`));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) { for (const child of Object.values(value)) deepFreeze(child); Object.freeze(value); }
  return value;
}

export function parseShapeDocument(value: unknown, requestedShapeId: string): ShapeEntryResponse {
  const item = record(value, "shape"); exact(item, ["id", "version", "name", "phases", "trigger", "plans", "watch", "typicalMistakes", "provenance", "channel"], "shape", ["publisherHandle"]);
  const shapeId = id(item.id, "shape/id"); if (shapeId !== requestedShapeId) throw new TypeError("shape response does not match the requested id");
  const version = nonempty(item.version, "shape/version"); if (!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u.test(version)) throw new TypeError("shape/version must be semantic versioning");
  nonempty(item.name, "shape/name");
  if (!Array.isArray(item.phases) || item.phases.length === 0) throw new TypeError("shape/phases must be a non-empty array");
  const phases = item.phases.map((phase, index) => oneOf(phase, ["opening", "middlegame", "endgame"] as const, `shape/phases/${index}`)); if (new Set(phases).size !== phases.length) throw new TypeError("shape/phases contains duplicates");
  structuralExpression(item.trigger, "shape/trigger");
  if (!Array.isArray(item.plans) || item.plans.length === 0) throw new TypeError("shape/plans must be a non-empty array");
  const planIds = new Set<string>(), sides = new Set<string>();
  item.plans.forEach((raw, index) => {
    const label = `shape/plans/${index}`, plan = record(raw, label); exact(plan, ["id", "side", "label", "description", "success"], label);
    const planId = id(plan.id, `${label}/id`); if (planIds.has(planId)) throw new TypeError("shape/plans contains a duplicate id"); planIds.add(planId);
    sides.add(oneOf(plan.side, COLORS, `${label}/side`)); nonempty(plan.label, `${label}/label`); nonempty(plan.description, `${label}/description`);
    const success = record(plan.success, `${label}/success`); exact(success, ["note", "signature"], `${label}/success`); nonempty(success.note, `${label}/success/note`); if (success.signature !== null) structuralExpression(success.signature, `${label}/success/signature`);
  });
  if (!sides.has("white") || !sides.has("black")) throw new TypeError("shape/plans must include both sides");
  textArray(item.watch, "shape/watch", 1); textArray(item.typicalMistakes, "shape/typicalMistakes", 1);
  const provenance = record(item.provenance, "shape/provenance"); exact(provenance, ["licence", "sources", "attribution"], "shape/provenance"); nonempty(provenance.licence, "shape/provenance/licence"); textArray(provenance.sources, "shape/provenance/sources", 1);
  if (!Array.isArray(provenance.attribution)) throw new TypeError("shape/provenance/attribution must be an array"); provenance.attribution.forEach((raw, index) => { const label = `shape/provenance/attribution/${index}`, row = record(raw, label); exact(row, ["title", "author", "licence"], label, ["url"]); nonempty(row.title, `${label}/title`); nonempty(row.author, `${label}/author`); nonempty(row.licence, `${label}/licence`); if (row.url !== undefined) { const url = nonempty(row.url, `${label}/url`); try { new URL(url); } catch { throw new TypeError(`${label}/url must be an absolute URI`); } } });
  const channel = oneOf(item.channel, ["official", "community"] as const, "shape/channel"); if (item.publisherHandle !== undefined) { nonempty(item.publisherHandle, "shape/publisherHandle"); if (channel === "official") throw new TypeError("official shape cannot name a community publisher"); }
  return deepFreeze(structuredClone(item)) as unknown as ShapeEntryResponse;
}
