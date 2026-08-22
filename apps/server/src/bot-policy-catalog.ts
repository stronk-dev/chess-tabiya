import { createHash } from "node:crypto";

import { canonicalizeJson, type JsonValue } from "@chess-tabiya/schema/drill-pack";

export const BOT_LAYER_KINDS = Object.freeze([
  "human_policy_model",
  "sampler",
  "repertoire",
  "error_guard",
  "controlled_trait",
  "memory",
  "presentation",
] as const);

export type BotLayerKind = (typeof BOT_LAYER_KINDS)[number];
export type BotPolicyInput =
  | "provider.maia.raw_policy"
  | "provider.stockfish.fixed_bound_loss"
  | `evidence.${string}@${number}`;
export type BotPolicyEffect = "base_distribution" | "sample" | "prior" | "mask" | "weight" | "memory" | "presentation" | "delay";

export interface BotMeasurement {
  readonly dossier: string;
  readonly population: string;
  readonly metric: string;
  readonly traitDelta: number;
  readonly expectedLossShiftCp: number;
  readonly severeMassRise: number;
  readonly explorerMatchRetention: number;
}

interface BotLayerBase {
  readonly id: `${string}@${number}`;
  readonly kind: BotLayerKind;
  readonly inputs: readonly BotPolicyInput[];
  readonly effect: BotPolicyEffect;
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
  readonly parameterCitation: string;
  readonly fallback: string;
  readonly abstentions: readonly string[];
  readonly changesStrength: boolean;
  readonly disclosure?: string;
  readonly measurement?: BotMeasurement;
  readonly requiresCompleteVector?: boolean;
  readonly degradedPath?: "base_model";
}

export interface HumanPolicyModelLayer extends BotLayerBase {
  readonly kind: "human_policy_model";
  readonly effect: "base_distribution";
  readonly engineId: string;
  readonly modelId: string;
  readonly band: number;
  readonly historyCapability: "full_history";
}

export interface SamplerLayer extends BotLayerBase {
  readonly kind: "sampler";
  readonly effect: "sample";
  readonly temperature: number;
  readonly topP: number;
  readonly completenessThreshold: number;
}

export interface RepertoireLayer extends BotLayerBase {
  readonly kind: "repertoire";
  readonly effect: "prior";
  readonly bookId: string;
  readonly coveredDepth: number;
}

export interface ErrorGuardLayer extends BotLayerBase {
  readonly kind: "error_guard";
  readonly effect: "mask";
  readonly engineId: string;
  readonly searchBound: Readonly<{ readonly kind: "nodes" | "movetime"; readonly value: number }>;
  readonly thresholdCp: number;
}

export interface ControlledTraitLayer extends BotLayerBase {
  readonly kind: "controlled_trait";
  readonly effect: "weight";
  readonly classifier: string;
  readonly multiplier: number;
}

export interface MemoryLayer extends BotLayerBase {
  readonly kind: "memory";
  readonly effect: "memory";
}

export interface PresentationLayer extends BotLayerBase {
  readonly kind: "presentation";
  readonly effect: "presentation";
  readonly name: string;
  readonly bio: string;
}

export type BotLayerDeclaration =
  | HumanPolicyModelLayer
  | SamplerLayer
  | RepertoireLayer
  | ErrorGuardLayer
  | ControlledTraitLayer
  | MemoryLayer
  | PresentationLayer;

export interface BotProfileDeclaration {
  readonly id: string;
  readonly version: number;
  readonly layers: readonly BotLayerDeclaration[];
  readonly calibration?: Readonly<{
    readonly measuredElo: number;
    readonly timeControl: string;
    readonly citation: string;
  }>;
}

export interface CompiledBotProfile extends BotProfileDeclaration {
  readonly digest: `sha256:${string}`;
  readonly controlledTraits: readonly string[];
}

export interface PolicyMassRow {
  readonly moveUci: string;
  readonly rawMass: number;
  readonly sampledMass: number;
  readonly finalMass: number;
}

const LEARNER_INPUT = /(?:learner|habit|style|rating|run_record|learner_history)/iu;
const REFUSED_PERSONA_CLAIM = /\b(?:human-like|aggressive|solid|tactical|positional|tricky|adaptive|plays like)\b/iu;
const SINGLETON_KINDS = new Set<BotLayerKind>([
  "human_policy_model",
  "sampler",
  "repertoire",
  "error_guard",
  "memory",
  "presentation",
]);

function fail(message: string): never {
  throw new TypeError(`Bot policy compilation failed: ${message}`);
}

function digest(value: JsonValue): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function assertLayer(layer: BotLayerDeclaration): void {
  const structural = layer as BotLayerBase;
  if (!/^[-a-z0-9_.]+@[1-9][0-9]*$/u.test(layer.id)) fail(`invalid layer identity ${layer.id}`);
  if (layer.parameterCitation.trim() === "") fail(`${layer.id} has parameters without a population citation`);
  if (structural.effect === "delay") fail(`${structural.id} declares a refused delay effect`);
  if (layer.kind === "memory") fail(`${layer.id} is a memory instance; v1 reserves the interface only`);
  if (layer.inputs.some((input) => LEARNER_INPUT.test(input))) fail(`${layer.id} reads learner-derived input`);
  if (layer.requiresCompleteVector === true && layer.degradedPath !== "base_model") {
    fail(`${layer.id} requires a complete vector without the recorded base-model degraded path`);
  }
  if (layer.kind === "sampler") {
    if (!(layer.temperature > 0)) fail(`${layer.id} temperature must be greater than zero`);
    if (!(layer.topP > 0 && layer.topP <= 1)) fail(`${layer.id} topP must be in (0, 1]`);
    if (!(layer.completenessThreshold > 0 && layer.completenessThreshold <= 1)) {
      fail(`${layer.id} completeness threshold must be in (0, 1]`);
    }
  }
  if (layer.kind === "error_guard") {
    const disclosure = layer.disclosure ?? "";
    for (const literal of [layer.engineId, layer.searchBound.kind, String(layer.searchBound.value), String(layer.thresholdCp)]) {
      if (!disclosure.includes(literal)) fail(`${layer.id} disclosure omits ${literal}`);
    }
  }
  if (layer.kind === "controlled_trait") {
    const measured = layer.measurement;
    if (measured === undefined || measured.dossier.trim() === "" || measured.population.trim() === "") {
      fail(`${layer.id} has no cited passing measurement`);
    }
    if (
      measured.traitDelta < 0.1
      || Math.abs(measured.expectedLossShiftCp) > 35
      || measured.severeMassRise > 0.01
      || measured.explorerMatchRetention < 0.9
    ) {
      fail(`${layer.id} does not clear the controlled-trait gate`);
    }
  }
  if (layer.kind === "presentation" && REFUSED_PERSONA_CLAIM.test(`${layer.name} ${layer.bio}`)) {
    fail(`${layer.id} asserts an unmeasured persona trait`);
  }
}

export function compileBotProfile(profile: BotProfileDeclaration): CompiledBotProfile {
  if (!/^[-a-z0-9_.]+$/u.test(profile.id) || !Number.isSafeInteger(profile.version) || profile.version < 1) {
    fail(`invalid profile identity ${profile.id}@${profile.version}`);
  }
  const ids = new Set<string>();
  const authorities = new Map<BotLayerKind, string>();
  for (const layer of profile.layers) {
    assertLayer(layer);
    if (ids.has(layer.id)) fail(`duplicate layer ${layer.id}`);
    ids.add(layer.id);
    if (SINGLETON_KINDS.has(layer.kind)) {
      const prior = authorities.get(layer.kind);
      if (prior !== undefined) fail(`${prior} and ${layer.id} claim the same ${layer.kind} authority`);
      authorities.set(layer.kind, layer.id);
    }
  }
  for (const required of ["human_policy_model", "sampler", "presentation"] as const) {
    if (!authorities.has(required)) fail(`profile has no ${required} layer`);
  }
  const serializable = {
    id: profile.id,
    version: profile.version,
    layers: profile.layers,
    ...(profile.calibration === undefined ? {} : { calibration: profile.calibration }),
  } as unknown as JsonValue;
  return Object.freeze({
    ...profile,
    layers: Object.freeze([...profile.layers]),
    ...(profile.calibration === undefined ? {} : { calibration: Object.freeze({ ...profile.calibration }) }),
    digest: digest(serializable),
    controlledTraits: Object.freeze(profile.layers.flatMap((layer) => layer.kind === "controlled_trait" ? [layer.classifier] : [])),
  });
}

export function compileBotPolicyCatalog(profiles: readonly BotProfileDeclaration[]): readonly CompiledBotProfile[] {
  const compiled = profiles.map(compileBotProfile);
  const keys = new Set<string>();
  for (const profile of compiled) {
    const key = `${profile.id}@${profile.version}`;
    if (keys.has(key)) fail(`duplicate profile ${key}`);
    keys.add(key);
  }
  return Object.freeze(compiled.sort((left, right) => left.id.localeCompare(right.id) || left.version - right.version));
}

// D970 keeps the concrete band/profile roster closed until the accepted RFC pins it.
export const BOT_POLICY_PROFILES = compileBotPolicyCatalog([]);

export function botPolicyProfile(id: string, version: number): CompiledBotProfile | undefined {
  return BOT_POLICY_PROFILES.find((profile) => profile.id === id && profile.version === version);
}

function normalize(rows: readonly Readonly<{ readonly moveUci: string; readonly mass: number }>[]): readonly Readonly<{ readonly moveUci: string; readonly mass: number }>[] {
  const admitted = rows.filter((row) => Number.isFinite(row.mass) && row.mass > 0);
  const total = admitted.reduce((sum, row) => sum + row.mass, 0);
  if (total <= 0) return Object.freeze([]);
  return Object.freeze(admitted.map((row) => Object.freeze({ moveUci: row.moveUci, mass: row.mass / total })));
}

/** Reconstructs Maia's tempered, top-p-truncated played distribution from raw policy mass. */
export function reconstructMaiaDistribution(
  rows: readonly Readonly<{ readonly moveUci: string; readonly mass: number }>[],
  temperature: number,
  topP: number,
  compareEqualMass: (leftUci: string, rightUci: string) => number = (left, right) => left.localeCompare(right),
): Readonly<{ readonly completeness: number; readonly rows: readonly PolicyMassRow[] }> {
  if (!(temperature > 0)) fail("sampler temperature must be greater than zero");
  if (!(topP > 0 && topP <= 1)) fail("sampler topP must be in (0, 1]");
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.moveUci)) fail(`sampler received duplicate move ${row.moveUci}`);
    if (!Number.isFinite(row.mass) || row.mass < 0 || row.mass > 1) fail(`sampler received invalid mass for ${row.moveUci}`);
    seen.add(row.moveUci);
  }
  const completeness = rows.reduce((sum, row) => sum + row.mass, 0);
  const tempered = [...normalize(rows.map((row) => ({ moveUci: row.moveUci, mass: Math.pow(row.mass, 1 / temperature) })))]
    .sort((left, right) => right.mass - left.mass || compareEqualMass(left.moveUci, right.moveUci));
  const kept: Array<Readonly<{ readonly moveUci: string; readonly mass: number }>> = [];
  let cumulative = 0;
  for (const row of tempered) {
    cumulative += row.mass;
    if (topP >= 1 || cumulative <= topP || kept.length === 0) kept.push(row);
  }
  const final = normalize(kept);
  const sampledByMove = new Map(tempered.map((row) => [row.moveUci, row.mass]));
  const finalByMove = new Map(final.map((row) => [row.moveUci, row.mass]));
  return Object.freeze({
    completeness,
    rows: Object.freeze(rows.map((row) => Object.freeze({
      moveUci: row.moveUci,
      rawMass: row.mass,
      sampledMass: sampledByMove.get(row.moveUci) ?? 0,
      finalMass: finalByMove.get(row.moveUci) ?? 0,
    }))),
  });
}

export function applyPolicyMultiplier(
  rows: readonly PolicyMassRow[],
  multiplier: (moveUci: string) => number,
): readonly PolicyMassRow[] {
  const weighted = normalize(rows.map((row) => ({ moveUci: row.moveUci, mass: row.finalMass * multiplier(row.moveUci) })));
  const byMove = new Map(weighted.map((row) => [row.moveUci, row.mass]));
  return Object.freeze(rows.map((row) => Object.freeze({ ...row, finalMass: byMove.get(row.moveUci) ?? 0 })));
}

export function drawPolicyMove(rows: readonly PolicyMassRow[], unit: number): string | undefined {
  if (!(unit >= 0 && unit < 1)) fail("draw unit must be in [0, 1)");
  const positive = rows.filter((row) => row.finalMass > 0);
  const total = positive.reduce((sum, row) => sum + row.finalMass, 0);
  if (total <= 0) return undefined;
  let cursor = unit * total;
  for (const row of positive) {
    cursor -= row.finalMass;
    if (cursor < 0) return row.moveUci;
  }
  return positive.at(-1)?.moveUci;
}
