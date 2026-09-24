import { PACK_PHASES } from "@chess-tabiya/schema/drill-pack";

import type { PackSummary, PrincipleSummary, ShapeSummary } from "./api.js";

type RecordValue = Readonly<Record<string, unknown>>;
interface PackDifficulty {
  readonly minOnlineRapid: number;
  readonly maxOnlineRapid: number;
  readonly label: string;
  readonly branchLengthTarget?: number;
}

const PACK_KEYS = Object.freeze(["id", "version", "digest", "title", "mode", "phase", "difficulty", "objectiveSummary", "consequenceHorizon", "concepts", "reviewStatus", "channel"] as const);
const SHAPE_KEYS = Object.freeze(["id", "version", "digest", "name", "phases", "licence", "channel", "usedByPacks"] as const);
const PRINCIPLE_KEYS = Object.freeze(["id", "version", "digest", "name", "statement", "phases", "licence", "usedByPacks"] as const);
const THEORY_PHASES = Object.freeze(["opening", "middlegame", "endgame"] as const);

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as RecordValue;
}

function exact(value: RecordValue, required: readonly string[], label: string, optional: readonly string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${label} has an invalid shape`);
}

function nonempty(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is outside the closed vocabulary`);
  return value as T;
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(`${label} must be a safe integer >= ${minimum}`);
  return Number(value);
}

function digest(value: unknown, label: string): string {
  const parsed = nonempty(value, label);
  if (!/^sha256:[a-f0-9]{64}$/u.test(parsed)) throw new TypeError(`${label} must be a sha256 digest`);
  return parsed;
}

function version(value: unknown, label: string): string {
  const parsed = nonempty(value, label);
  if (!/^\d+\.\d+(?:\.\d+)?$/u.test(parsed)) throw new TypeError(`${label} must be a numeric schema version`);
  return parsed;
}

function strings(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const parsed = value.map((item, index) => nonempty(item, `${label}/${index}`));
  if (new Set(parsed).size !== parsed.length) throw new TypeError(`${label} contains duplicates`);
  return Object.freeze(parsed);
}

function phases(value: unknown, label: string): readonly (typeof THEORY_PHASES)[number][] {
  const parsed = strings(value, label).map((item) => oneOf(item, THEORY_PHASES, label));
  if (parsed.length === 0) throw new TypeError(`${label} must not be empty`);
  return Object.freeze(parsed);
}

function difficulty(value: unknown, label: string): PackDifficulty | null {
  if (value === null) return null;
  const item = record(value, label);
  exact(item, ["minOnlineRapid", "maxOnlineRapid", "label"], label, ["branchLengthTarget"]);
  const minOnlineRapid = integer(item.minOnlineRapid, `${label}/minOnlineRapid`, 100);
  const maxOnlineRapid = integer(item.maxOnlineRapid, `${label}/maxOnlineRapid`, minOnlineRapid);
  const branchLengthTarget = item.branchLengthTarget === undefined ? undefined : integer(item.branchLengthTarget, `${label}/branchLengthTarget`, 1);
  return Object.freeze({ minOnlineRapid, maxOnlineRapid, label: nonempty(item.label, `${label}/label`), ...(branchLengthTarget === undefined ? {} : { branchLengthTarget }) });
}

function horizon(value: unknown, label: string): NonNullable<PackSummary["consequenceHorizon"]> | null {
  if (value === null) return null;
  const item = record(value, label); exact(item, ["kind", "plies"], label);
  return Object.freeze({ kind: oneOf(item.kind, ["declared", "authored"] as const, `${label}/kind`), plies: integer(item.plies, `${label}/plies`, 1) });
}

function conceptLabels(value: unknown, label: string): PackSummary["concepts"] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`);
  const seen = new Set<string>();
  return Object.freeze(value.map((raw, index) => {
    const item = record(raw, `${label}/${index}`); exact(item, ["id", "label", "status"], `${label}/${index}`);
    const id = nonempty(item.id, `${label}/${index}/id`);
    if (seen.has(id)) throw new TypeError(`${label} repeats ${id}`); seen.add(id);
    return Object.freeze({ id, label: nonempty(item.label, `${label}/${index}/label`), status: oneOf(item.status, ["active", "retired", "unregistered"] as const, `${label}/${index}/status`) });
  }));
}

function pack(value: unknown, index: number): PackSummary {
  const label = `packs/${index}`, item = record(value, label); exact(item, PACK_KEYS, label, ["publisherHandle"]);
  const channel = oneOf(item.channel, ["official", "community"] as const, `${label}/channel`);
  const publisherHandle = item.publisherHandle === undefined ? undefined : nonempty(item.publisherHandle, `${label}/publisherHandle`);
  if (channel === "official" && publisherHandle !== undefined) throw new TypeError(`${label} gives official content a community publisher`);
  return Object.freeze({
    id: nonempty(item.id, `${label}/id`), version: version(item.version, `${label}/version`), digest: digest(item.digest, `${label}/digest`),
    title: nonempty(item.title, `${label}/title`), mode: oneOf(item.mode, ["line", "plan", "outcome", "trajectory"] as const, `${label}/mode`),
    phase: item.phase === null ? null : oneOf(item.phase, PACK_PHASES, `${label}/phase`), difficulty: difficulty(item.difficulty, `${label}/difficulty`),
    objectiveSummary: nonempty(item.objectiveSummary, `${label}/objectiveSummary`), consequenceHorizon: horizon(item.consequenceHorizon, `${label}/consequenceHorizon`),
    concepts: conceptLabels(item.concepts, `${label}/concepts`), reviewStatus: oneOf(item.reviewStatus, ["schema_example", "draft", "published"] as const, `${label}/reviewStatus`),
    channel, ...(publisherHandle === undefined ? {} : { publisherHandle }),
  });
}

function orderedUnique<T extends { readonly id: string }>(items: readonly T[], label: string): readonly T[] {
  for (let index = 0; index < items.length; index += 1) {
    if (index > 0 && items[index - 1]!.id >= items[index]!.id) throw new TypeError(`${label} must contain unique ids in ascending order`);
  }
  return Object.freeze(items);
}

export function parsePackCatalog(value: unknown): readonly PackSummary[] {
  if (!Array.isArray(value)) throw new TypeError("pack catalogue must be an array");
  return orderedUnique(value.map(pack), "pack catalogue");
}

export function parseShapeCatalog(value: unknown): readonly ShapeSummary[] {
  const envelope = record(value, "shape catalogue"); exact(envelope, ["shapes"], "shape catalogue");
  if (!Array.isArray(envelope.shapes)) throw new TypeError("shape catalogue entries must be an array");
  return orderedUnique(envelope.shapes.map((value, index) => {
    const label = `shapes/${index}`, item = record(value, label); exact(item, SHAPE_KEYS, label, ["publisherHandle"]);
    const channel = oneOf(item.channel, ["official", "community"] as const, `${label}/channel`);
    const publisherHandle = item.publisherHandle === undefined ? undefined : nonempty(item.publisherHandle, `${label}/publisherHandle`);
    if (channel === "official" && publisherHandle !== undefined) throw new TypeError(`${label} gives official content a community publisher`);
    return Object.freeze({ id: nonempty(item.id, `${label}/id`), version: version(item.version, `${label}/version`), digest: digest(item.digest, `${label}/digest`), name: nonempty(item.name, `${label}/name`), phases: phases(item.phases, `${label}/phases`), licence: nonempty(item.licence, `${label}/licence`), channel, ...(publisherHandle === undefined ? {} : { publisherHandle }), usedByPacks: integer(item.usedByPacks, `${label}/usedByPacks`) });
  }), "shape catalogue");
}

export function parsePrincipleCatalog(value: unknown): readonly PrincipleSummary[] {
  const envelope = record(value, "principle catalogue"); exact(envelope, ["principles"], "principle catalogue");
  if (!Array.isArray(envelope.principles)) throw new TypeError("principle catalogue entries must be an array");
  return orderedUnique(envelope.principles.map((value, index) => {
    const label = `principles/${index}`, item = record(value, label); exact(item, PRINCIPLE_KEYS, label);
    return Object.freeze({ id: nonempty(item.id, `${label}/id`), version: version(item.version, `${label}/version`), digest: digest(item.digest, `${label}/digest`), name: nonempty(item.name, `${label}/name`), statement: nonempty(item.statement, `${label}/statement`), phases: phases(item.phases, `${label}/phases`), licence: nonempty(item.licence, `${label}/licence`), usedByPacks: integer(item.usedByPacks, `${label}/usedByPacks`) });
  }), "principle catalogue");
}
