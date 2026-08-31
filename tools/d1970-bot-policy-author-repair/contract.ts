// DISPOSABLE D1970-D1976 / D2087-D2096 authoring contract. Not production code.
import { createHash } from "node:crypto";

import {
  assertProviderDelivery,
  type MaiaPolicyPage,
  type ProviderDelivery,
  type ProviderEvidenceDelivery,
  type ProviderScore,
  type StockfishLegalRootTable,
  type TypedProviderResult,
} from "../d2056-provider-exchange-author-repair/shared-provider-contract.js";
import { exactLegalMoves, type ExactLegalMove } from "../../packages/runtime/src/legal-moves.js";

export type { MaiaPolicyPage, ProviderDelivery, ProviderEvidenceDelivery, StockfishLegalRootTable, TypedProviderResult };

export const BOT_PROFILE_FAMILIES = Object.freeze(["human-baseline", "guarded-human", "pawn-forward"] as const);
export const BOT_MODEL_BANDS = Object.freeze([1000, 1400, 1800, 2200] as const);
export const BOT_MAIA_SOURCE_VERSION = "1e13597c42d4858b7cfd7cfdae01e297263364b2" as const;
export const BOT_MAIA_MODEL_ID = "maia3-5m@b6559de2398d7140b985f28fd2c19fb5e47ddabe" as const;
export type BotProfileFamily = (typeof BOT_PROFILE_FAMILIES)[number];
export type BotModelBand = (typeof BOT_MODEL_BANDS)[number];
export type BotProfileId = `${BotProfileFamily}.${BotModelBand}@1`;
export type Sha = `sha256:${string}`;
export const BOT_LAYER_IDS = Object.freeze(["sampler.maia_reconstruction@1", "guard.severe_error@1", "trait.pawn_preference@1"] as const);
export const BOT_CLASSIFIER_IDS = Object.freeze(["pawn_move@1"] as const);
export const BOT_FEATURE_IDS = Object.freeze(["rules.exchange.predicate.legal_exchange@1", "rules.tactic.event.fork_allowed@1"] as const);
export const BOT_DEGRADATION_REASONS = Object.freeze([
  "returned_mass_below_profile_floor", "guard_unavailable", "guard_deadline", "guard_source_failure",
  "guard_mate_domain", "guard_mixed_domain", "guard_candidate_mismatch", "empty_after_mask",
  "candidate_features_unavailable", "guard_dependency_abstained",
] as const);
export type BotLayerId = (typeof BOT_LAYER_IDS)[number];
export type BotClassifierId = (typeof BOT_CLASSIFIER_IDS)[number];
export type FeatureId = (typeof BOT_FEATURE_IDS)[number];
export type BotDegradationReason = (typeof BOT_DEGRADATION_REASONS)[number];

const stable = (value: unknown): string => {
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
export const digest = (value: unknown): Sha => `sha256:${createHash("sha256").update(stable(value)).digest("hex")}`;
const sameSet = (left: readonly string[], right: readonly string[]): boolean =>
  stable([...new Set(left)].sort()) === stable([...new Set(right)].sort());
const normalized = (rows: readonly Readonly<{ moveUci: string; mass: number }>[]) => {
  const total = rows.reduce((sum, row) => sum + row.mass, 0);
  if (!(total > 0)) throw new TypeError("empty distribution");
  return rows.map((row) => Object.freeze({ ...row, mass: row.mass / total }));
};
const unitInterval = (seed: number, identity: string): number => {
  const hex = createHash("sha256").update(`${seed}:${identity}`).digest("hex").slice(0, 13);
  return Number.parseInt(hex, 16) / 0x1_0000_0000_0000;
};

export interface BotProfileReference {
  readonly id: BotProfileId;
  readonly family: BotProfileFamily;
  readonly band: BotModelBand;
  readonly version: 1;
  readonly digest: Sha;
  readonly model: Readonly<{ id: typeof BOT_MAIA_MODEL_ID; version: typeof BOT_MAIA_SOURCE_VERSION }>;
  readonly sampler: Readonly<{ temperature: 0.8; topP: 0.92; requestedWidth: 20; returnedMassFloor: 0.97 }>;
  readonly orderedLayers: readonly BotLayerId[];
}

const profile = (family: BotProfileFamily, band: BotModelBand): BotProfileReference => {
  const declaration = { id: `${family}.${band}@1` as BotProfileId, family, band, version: 1 as const,
    model: { id: BOT_MAIA_MODEL_ID, version: BOT_MAIA_SOURCE_VERSION },
    sampler: { temperature: 0.8 as const, topP: 0.92 as const, requestedWidth: 20 as const, returnedMassFloor: 0.97 as const },
    orderedLayers: family === "human-baseline" ? ["sampler.maia_reconstruction@1" as const]
      : family === "guarded-human" ? ["sampler.maia_reconstruction@1" as const, "guard.severe_error@1" as const]
        : ["sampler.maia_reconstruction@1" as const, "guard.severe_error@1" as const, "trait.pawn_preference@1" as const] };
  return Object.freeze({ ...declaration, model: Object.freeze(declaration.model), sampler: Object.freeze(declaration.sampler), orderedLayers: Object.freeze(declaration.orderedLayers), digest: digest(declaration) });
};

export const BOT_PROFILE_CATALOG = Object.freeze(
  BOT_PROFILE_FAMILIES.flatMap((family) => BOT_MODEL_BANDS.map((band) => profile(family, band))),
);
export const BOT_PROFILE_CATALOG_HEAD = 1 as const;
export const BOT_PROFILE_CATALOG_DIGEST = digest(BOT_PROFILE_CATALOG);

export function resolveBotProfile(id: BotProfileId): BotProfileReference {
  const found = BOT_PROFILE_CATALOG.find((entry) => entry.id === id);
  if (found === undefined) throw new TypeError("unknown bot profile");
  return found;
}

export interface BotRootIdentity {
  readonly runId: string;
  readonly branchId: string;
  readonly nodeId: string;
  readonly preCommitEventHeadDigest: Sha;
  readonly beforeFenDigest: Sha;
  readonly historyDigest: Sha;
}

export interface BotOperationRootAuthority {
  readonly identity: BotRootIdentity;
  readonly beforeFen: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly seed: number;
}

export interface ExactLegalMoveMap {
  readonly root: BotRootIdentity;
  readonly moves: readonly string[];
  readonly digest: Sha;
}

const ROOTS = new WeakSet<object>();
const LEGAL_MAPS = new WeakSet<object>();
const CLASSIFIER_VIEWS = new WeakSet<object>();
const SOURCES = new WeakSet<object>();
const FEATURE_SUBSETS = new WeakSet<object>();
const EXECUTIONS = new WeakSet<object>();
const DECISIONS = new WeakSet<object>();
const PACKETS = new WeakSet<object>();

export function makeBotRootAuthority(input: BotOperationRootAuthority): BotOperationRootAuthority {
  if (digest(input.beforeFen) !== input.identity.beforeFenDigest || digest(input.historyUci) !== input.identity.historyDigest) {
    throw new TypeError("root digest mismatch");
  }
  const value = Object.freeze({ ...input, identity: Object.freeze({ ...input.identity }), historyUci: Object.freeze([...input.historyUci]) });
  ROOTS.add(value);
  return value;
}

export function makeExactLegalMoveMap(root: BotOperationRootAuthority, inputMoves: readonly string[]): ExactLegalMoveMap {
  if (!ROOTS.has(root)) throw new TypeError("unsealed root authority");
  const moves = [...new Set(inputMoves)].sort();
  if (moves.length === 0 || moves.length !== inputMoves.length) throw new TypeError("invalid legal map");
  const value = Object.freeze({ root: root.identity, moves: Object.freeze(moves), digest: digest({ root: root.identity, moves }) });
  LEGAL_MAPS.add(value);
  return value;
}

export interface LegalBoardClassifierView {
  readonly root: BotRootIdentity;
  readonly legalMapDigest: Sha;
  readonly rows: readonly Readonly<{ moveUci: string; role: ExactLegalMove["role"]; promotion: ExactLegalMove["promotion"] | null; classifiers: readonly BotClassifierId[] }>[];
  readonly digest: Sha;
}

export function compileLegalBoardClassifiers(root: BotOperationRootAuthority, legal: ExactLegalMoveMap): LegalBoardClassifierView {
  if (!ROOTS.has(root) || !LEGAL_MAPS.has(legal) || stable(legal.root) !== stable(root.identity)) throw new TypeError("unsealed legal classifier input");
  const exact = exactLegalMoves(root.beforeFen);
  if (!sameSet(exact.map((move) => move.uci), legal.moves)) throw new TypeError("legal classifier population mismatch");
  const rows = Object.freeze(exact.map((move) => Object.freeze({ moveUci: move.uci, role: move.role,
    promotion: move.promotion ?? null, classifiers: Object.freeze(move.role === "pawn" ? ["pawn_move@1" as const] : []) })));
  const body = { root: root.identity, legalMapDigest: legal.digest, rows };
  const value = Object.freeze({ ...body, digest: digest(body) });
  CLASSIFIER_VIEWS.add(value);
  return value;
}

export type BotProviderOperation = "maia.policy_page@1" | "stockfish.legal_root_table@1";
export interface RegisteredBotProviderInput<T, K extends BotProviderOperation> {
  readonly operation: K;
  readonly delivery: ProviderEvidenceDelivery<T, K>;
  readonly deliveryDigest: Sha;
}

const registeredProviderInput = <T, K extends BotProviderOperation>(delivery: ProviderDelivery<T, K>): RegisteredBotProviderInput<T, K> => {
  assertProviderDelivery(delivery.acquisition.operation, delivery);
  return Object.freeze({ operation: delivery.acquisition.operation, delivery, deliveryDigest: digest(delivery) });
};

export function assertPersistedProviderInput<T, K extends BotProviderOperation>(input: RegisteredBotProviderInput<T, K>): void {
  if (input.operation !== input.delivery.acquisition.operation || input.deliveryDigest !== digest(input.delivery)
    || !/^sha256:.{64}$/u.test(input.delivery.acquisition.normalizedRequestDigest)
    || !/^sha256:.{64}$/u.test(input.delivery.acquisition.responseDigest)) {
    throw new TypeError("persisted provider input mismatch");
  }
}

export type BotGuardAbstentionReason =
  | "guard_unavailable" | "guard_deadline" | "guard_source_failure"
  | "guard_mate_domain" | "guard_mixed_domain" | "guard_candidate_mismatch" | "empty_after_mask";

export type BotGuardView =
  | Readonly<{ kind: "not_requested" }>
  | Readonly<{ kind: "applied"; source: RegisteredBotProviderInput<StockfishLegalRootTable, "stockfish.legal_root_table@1">; referenceMoveUci: string;
      referenceCp: number; rows: readonly Readonly<{ moveUci: string;
        sourceScore: Readonly<{ kind: "centipawns"; value: number }>; lossCp: number; admitted: boolean }>[] }>
  | Readonly<{ kind: "abstained"; reason: BotGuardAbstentionReason; source?: RegisteredBotProviderInput<StockfishLegalRootTable, "stockfish.legal_root_table@1">;
      rows: readonly Readonly<{ moveUci: string; sourceScore: ProviderScore }>[] }>;

export interface BotSourceView {
  readonly root: BotOperationRootAuthority;
  readonly legal: ExactLegalMoveMap;
  readonly classifiers: LegalBoardClassifierView;
  readonly maia: RegisteredBotProviderInput<MaiaPolicyPage, "maia.policy_page@1">;
  readonly maiaPage: MaiaPolicyPage;
  readonly coverage: "bounded_subset" | "legal_set_equal";
  readonly guard: BotGuardView;
}

const maiaMatchesRoot = (page: MaiaPolicyPage, root: BotOperationRootAuthority): boolean => {
  const position = page.request.position;
  return position.kind === "history_conditioned"
    ? position.startFen === root.startFen && stable(position.historyUci) === stable(root.historyUci)
    : position.fen === root.beforeFen;
};

export type BotSourceResult =
  | Readonly<{ kind: "ready"; source: BotSourceView }>
  | Readonly<{ kind: "base_provider_unavailable"; reason: "unavailable" | "deadline" | "invalid_response"; retryable: true }>;

export function deriveBotSourceView(input: {
  readonly root: BotOperationRootAuthority;
  readonly legal: ExactLegalMoveMap;
  readonly classifiers: LegalBoardClassifierView;
  readonly profile: BotProfileReference;
  readonly maia: TypedProviderResult<"maia.policy_page@1">;
  readonly stockfish?: TypedProviderResult<"stockfish.legal_root_table@1">;
}): BotSourceResult {
  if (!ROOTS.has(input.root) || !LEGAL_MAPS.has(input.legal) || !CLASSIFIER_VIEWS.has(input.classifiers)
    || input.classifiers.legalMapDigest !== input.legal.digest || stable(input.legal.root) !== stable(input.root.identity)) {
    throw new TypeError("unsealed root/legal authority");
  }
  if (input.maia.kind !== "success") {
    return Object.freeze({ kind: "base_provider_unavailable", reason: input.maia.reason, retryable: true });
  }
  assertProviderDelivery("maia.policy_page@1", input.maia.delivery);
  const page = input.maia.delivery.payload;
  const actual = input.maia.delivery.acquisition.actualIdentity;
  if (!maiaMatchesRoot(page, input.root) || page.appliedBand !== input.profile.band || page.candidates.length === 0
    || page.request.requestedModel.id !== input.profile.model.id || page.request.requestedModel.version !== input.profile.model.version
    || actual.modelId !== input.profile.model.id || actual.version !== input.profile.model.version
    || page.request.temperature !== input.profile.sampler.temperature || page.temperature !== input.profile.sampler.temperature
    || page.request.topP !== input.profile.sampler.topP || page.topP !== input.profile.sampler.topP
    || page.request.requestedWidth !== input.profile.sampler.requestedWidth || page.requestedWidth !== input.profile.sampler.requestedWidth) {
    throw new TypeError("Maia profile/source mismatch");
  }
  const maiaMoves = page.candidates.map((row) => row.moveUci);
  if (new Set(maiaMoves).size !== maiaMoves.length || maiaMoves.some((move) => !input.legal.moves.includes(move))) {
    throw new TypeError("Maia population outside exact legal map");
  }

  let guard: BotGuardView = Object.freeze({ kind: "not_requested" });
  if (input.profile.family !== "human-baseline") {
    if (input.stockfish === undefined) {
      guard = Object.freeze({ kind: "abstained", reason: "guard_unavailable", rows: Object.freeze([]) });
    } else if (input.stockfish.kind !== "success") {
      const reason = input.stockfish.reason === "deadline" ? "guard_deadline" : "guard_source_failure";
      guard = Object.freeze({ kind: "abstained", reason, rows: Object.freeze([]) });
    } else {
      assertProviderDelivery("stockfish.legal_root_table@1", input.stockfish.delivery);
      const table = input.stockfish.delivery.payload;
      const stockMoves = table.rows.map((row) => row.moveUci);
      if (table.request.fen !== input.root.beforeFen || !sameSet(stockMoves, input.legal.moves)) {
        guard = Object.freeze({ kind: "abstained", reason: "guard_candidate_mismatch",
          source: registeredProviderInput(input.stockfish.delivery),
          rows: Object.freeze(table.rows.map((row) => Object.freeze({ moveUci: row.moveUci, sourceScore: row.score }))) });
      } else {
        const cpCount = table.rows.filter((row) => row.score.kind === "centipawns").length;
        if (cpCount !== table.rows.length) {
          guard = Object.freeze({ kind: "abstained", reason: cpCount === 0 ? "guard_mate_domain" : "guard_mixed_domain",
            source: registeredProviderInput(input.stockfish.delivery),
            rows: Object.freeze(table.rows.map((row) => Object.freeze({ moveUci: row.moveUci, sourceScore: row.score }))) });
        } else {
          const cpRows = table.rows as readonly Readonly<{ moveUci: string; score: Readonly<{ kind: "centipawns"; value: number }> }>[];
          const reference = [...cpRows].sort((left, right) => right.score.value - left.score.value || left.moveUci.localeCompare(right.moveUci))[0]!;
          guard = Object.freeze({ kind: "applied", source: registeredProviderInput(input.stockfish.delivery),
            referenceMoveUci: reference.moveUci, referenceCp: reference.score.value,
            rows: Object.freeze(page.candidates.map((candidate) => {
              const row = cpRows.find((item) => item.moveUci === candidate.moveUci)!;
              const lossCp = reference.score.value - row.score.value;
              return Object.freeze({ moveUci: row.moveUci, sourceScore: row.score, lossCp, admitted: lossCp < 250 });
            })) });
        }
      }
    }
  }
  const value = Object.freeze({ root: input.root, legal: input.legal, classifiers: input.classifiers, maia: registeredProviderInput(input.maia.delivery),
    maiaPage: page, coverage: sameSet(maiaMoves, input.legal.moves) ? "legal_set_equal" as const : "bounded_subset" as const, guard });
  SOURCES.add(value);
  return Object.freeze({ kind: "ready", source: value });
}

export interface CandidatePopulationReceipt {
  readonly root: BotRootIdentity;
  readonly legalMoves: readonly string[];
  readonly rows: readonly Readonly<{ moveUci: string; features: readonly Readonly<{ id: FeatureId; value: boolean | number | string; sourceId: string }>[] }>[];
  readonly digest: Sha;
}

export function admitCandidatePopulation(input: Omit<CandidatePopulationReceipt, "digest">): CandidatePopulationReceipt {
  if (!sameSet(input.legalMoves, input.rows.map((row) => row.moveUci))) throw new TypeError("packet is not all-legal set-equal");
  const value = Object.freeze({ ...input, legalMoves: Object.freeze([...input.legalMoves]), rows: Object.freeze([...input.rows]), digest: digest(input) });
  PACKETS.add(value);
  return value;
}

export interface CandidateFeatureSubset {
  readonly packetDigest: Sha;
  readonly legalMapDigest: Sha;
  readonly maiaPopulationDigest: Sha;
  readonly coverage: "bounded_subset" | "legal_set_equal";
  readonly allLegalCount: number;
  readonly retainedCount: number;
  readonly omittedMoves: readonly string[];
  readonly rows: CandidatePopulationReceipt["rows"];
  readonly digest: Sha;
}

export function deriveCandidateFeatureSubset(input: {
  readonly packet: CandidatePopulationReceipt;
  readonly source: BotSourceView;
}): CandidateFeatureSubset {
  if (!PACKETS.has(input.packet) || !SOURCES.has(input.source)) throw new TypeError("unadmitted feature source");
  if (stable(input.packet.root) !== stable(input.source.root.identity) || !sameSet(input.packet.legalMoves, input.source.legal.moves)) {
    throw new TypeError("packet root/legal mismatch");
  }
  const maiaMoves = input.source.maiaPage.candidates.map((row) => row.moveUci);
  const rows = maiaMoves.map((move) => input.packet.rows.find((row) => row.moveUci === move));
  if (rows.some((row) => row === undefined)) throw new TypeError("admitted Maia feature omitted");
  const body = { packetDigest: input.packet.digest, legalMapDigest: input.source.legal.digest,
    maiaPopulationDigest: digest(maiaMoves), coverage: input.source.coverage,
    allLegalCount: input.source.legal.moves.length, retainedCount: rows.length,
    omittedMoves: Object.freeze(input.source.legal.moves.filter((move) => !maiaMoves.includes(move))),
    rows: Object.freeze(rows as CandidatePopulationReceipt["rows"]) };
  const value = Object.freeze({ ...body, digest: digest(body) });
  FEATURE_SUBSETS.add(value);
  return value;
}

export type BotLayerAction = Readonly<{ id: BotLayerId;
  action: "applied" | "abstained" | "degraded"; reason?: BotDegradationReason }>;

export function assertBotLayerAction(value: unknown): asserts value is BotLayerAction {
  if (typeof value !== "object" || value === null) throw new TypeError("invalid bot layer action");
  const row = value as Record<string, unknown>;
  if (!BOT_LAYER_IDS.includes(row.id as BotLayerId)
    || !["applied", "abstained", "degraded"].includes(row.action as string)
    || (row.reason !== undefined && !BOT_DEGRADATION_REASONS.includes(row.reason as BotDegradationReason))) {
    throw new TypeError("invalid bot layer action");
  }
  const valid = row.id === "sampler.maia_reconstruction@1"
    ? row.action === "applied" && row.reason === undefined
      || row.action === "degraded" && row.reason === "returned_mass_below_profile_floor"
    : row.id === "guard.severe_error@1"
      ? row.action === "applied" && row.reason === undefined
        || row.action === "abstained" && typeof row.reason === "string" && row.reason.startsWith("guard_")
        || row.action === "abstained" && row.reason === "empty_after_mask"
      : row.action === "applied" && row.reason === undefined
        || row.action === "abstained" && row.reason === "guard_dependency_abstained";
  if (!valid || Object.keys(row).some((key) => !["id", "action", "reason"].includes(key))) {
    throw new TypeError("invalid bot layer action");
  }
}
export interface BotPolicyExecution {
  readonly source: BotSourceView;
  readonly profile: BotProfileReference;
  readonly layers: readonly BotLayerAction[];
  readonly considered: readonly Readonly<{ moveUci: string; rawMass: number; reconstructedMass: number; finalMass: number;
    guard: Readonly<{ kind: "not_requested" } | { kind: "applied"; sourceScore: ProviderScore; lossCp: number; admitted: boolean } |
      { kind: "abstained"; reason: BotGuardAbstentionReason | "empty_after_mask"; sourceScore?: ProviderScore }>;
    classifiers: readonly BotClassifierId[]; features: CandidatePopulationReceipt["rows"][number]["features"] }>[];
  readonly chosenMoveUci: string;
  readonly featureSubsetDigest?: Sha;
}

const sample = (rows: readonly Readonly<{ moveUci: string; mass: number }>[], seed: number, root: BotRootIdentity): string => {
  const draw = unitInterval(seed, stable(root));
  let cumulative = 0;
  for (const row of rows) {
    cumulative += row.mass;
    if (draw <= cumulative) return row.moveUci;
  }
  return rows.at(-1)!.moveUci;
};

export function compileBotPolicyExecution(input: {
  readonly source: BotSourceView;
  readonly profile: BotProfileReference;
  readonly featureSubset?: CandidateFeatureSubset;
}): BotPolicyExecution {
  if (!SOURCES.has(input.source)) throw new TypeError("unsealed bot source");
  if (resolveBotProfile(input.profile.id).digest !== input.profile.digest) throw new TypeError("uncompiled profile");
  if (input.featureSubset !== undefined && (!FEATURE_SUBSETS.has(input.featureSubset)
    || input.featureSubset.maiaPopulationDigest !== digest(input.source.maiaPage.candidates.map((row) => row.moveUci)))) {
    throw new TypeError("feature population mismatch");
  }
  const transformed = input.source.maiaPage.candidates.map((row) => ({ moveUci: row.moveUci, mass: row.probability ** (1 / input.profile.sampler.temperature) }));
  const ranked = [...transformed].sort((left, right) => right.mass - left.mass || digest([input.source.root.identity, left.moveUci]).localeCompare(digest([input.source.root.identity, right.moveUci])));
  const topP: typeof ranked = [];
  let cumulative = 0;
  for (const row of ranked) {
    if (topP.length === 0 || cumulative + row.mass <= input.profile.sampler.topP) {
      topP.push(row);
      cumulative += row.mass;
    }
  }
  const base = normalized(topP);
  const guardRows = input.source.guard.kind === "applied" ? new Map(input.source.guard.rows.map((row) => [row.moveUci, row])) : new Map();
  let admitted = input.source.guard.kind === "applied" ? base.filter((row) => guardRows.get(row.moveUci)?.admitted) : base;
  let guard = input.source.guard;
  if (admitted.length === 0 && input.source.guard.kind === "applied") {
    guard = Object.freeze({ kind: "abstained", reason: "empty_after_mask", source: input.source.guard.source,
      rows: Object.freeze(input.source.guard.rows.map((row) => ({ moveUci: row.moveUci, sourceScore: row.sourceScore }))) });
    admitted = base;
  }
  const pawnTraitApplied = input.profile.family === "pawn-forward" && guard.kind === "applied";
  const classifierMap = new Map(input.source.classifiers.rows.map((row) => [row.moveUci, row.classifiers] as const));
  const weighted = normalized(admitted.map((row) => ({ ...row, mass: row.mass * (pawnTraitApplied && classifierMap.get(row.moveUci)?.includes("pawn_move@1") ? 4 : 1) })));
  const chosenMoveUci = sample(weighted, input.source.root.seed, input.source.root.identity);
  const featureMap = new Map(input.featureSubset?.rows.map((row) => [row.moveUci, row.features]) ?? []);
  const considered = input.source.maiaPage.candidates.map((row) => {
    const baseRow = base.find((item) => item.moveUci === row.moveUci);
    const finalRow = weighted.find((item) => item.moveUci === row.moveUci);
    const consideredGuard: BotPolicyExecution["considered"][number]["guard"] = (() => {
      if (guard.kind === "not_requested") return Object.freeze({ kind: "not_requested" as const });
      if (guard.kind === "abstained") return Object.freeze({ kind: "abstained" as const, reason: guard.reason,
        sourceScore: guard.rows.find((item) => item.moveUci === row.moveUci)?.sourceScore });
      const guardRow = guard.rows.find((item) => item.moveUci === row.moveUci);
      if (guardRow === undefined) throw new TypeError("applied guard omitted admitted Maia row");
      return Object.freeze({ kind: "applied" as const, sourceScore: guardRow.sourceScore,
        lossCp: guardRow.lossCp, admitted: guardRow.admitted });
    })();
    return Object.freeze({ moveUci: row.moveUci, rawMass: row.probability,
      reconstructedMass: baseRow?.mass ?? 0, finalMass: finalRow?.mass ?? 0,
      guard: consideredGuard,
      classifiers: Object.freeze([...(classifierMap.get(row.moveUci) ?? [])]),
      features: Object.freeze([...(featureMap.get(row.moveUci) ?? [])]) });
  });
  const layers: BotLayerAction[] = [Object.freeze({ id: "sampler.maia_reconstruction@1",
    action: input.source.maiaPage.returnedProbabilityMass < input.profile.sampler.returnedMassFloor ? "degraded" : "applied",
    ...(input.source.maiaPage.returnedProbabilityMass < input.profile.sampler.returnedMassFloor ? { reason: "returned_mass_below_profile_floor" as const } : {}) })];
  if (input.profile.family !== "human-baseline") layers.push(Object.freeze({ id: "guard.severe_error@1",
    action: guard.kind === "applied" ? "applied" : "abstained", ...(guard.kind === "abstained" ? { reason: guard.reason } : {}) }));
  if (input.profile.family === "pawn-forward") layers.push(Object.freeze({ id: "trait.pawn_preference@1",
    action: pawnTraitApplied ? "applied" : "abstained", ...(!pawnTraitApplied ? { reason: "guard_dependency_abstained" } : {}) }));
  if (layers.map((layer) => layer.id).join("\0") !== input.profile.orderedLayers.join("\0")) throw new TypeError("compiled profile layer mismatch");
  const value = Object.freeze({ source: input.source, profile: input.profile, layers: Object.freeze(layers),
    considered: Object.freeze(considered), chosenMoveUci, featureSubsetDigest: input.featureSubset?.digest });
  EXECUTIONS.add(value);
  return value;
}

export interface BotPolicyDecisionRecord {
  readonly root: BotRootIdentity;
  readonly profile: BotProfileReference;
  readonly seed: number;
  readonly sources: Readonly<{ maia: RegisteredBotProviderInput<MaiaPolicyPage, "maia.policy_page@1">;
    stockfish?: RegisteredBotProviderInput<StockfishLegalRootTable, "stockfish.legal_root_table@1">; candidateSubsetDigest?: Sha }>;
  readonly returnedProbabilityMass: number;
  readonly coverage: "bounded_subset" | "legal_set_equal";
  readonly layers: BotPolicyExecution["layers"];
  readonly considered: BotPolicyExecution["considered"];
  readonly chosenMoveUci: string;
  readonly derivationDigest: Sha;
}

export function projectBotPolicyDecisionRecord(execution: BotPolicyExecution): BotPolicyDecisionRecord {
  if (!EXECUTIONS.has(execution)) throw new TypeError("unsealed policy execution");
  const body = { root: execution.source.root.identity, profile: execution.profile, seed: execution.source.root.seed,
    sources: { maia: execution.source.maia,
      ...(execution.source.guard.kind !== "not_requested" && execution.source.guard.source !== undefined ? { stockfish: execution.source.guard.source } : {}),
      ...(execution.featureSubsetDigest !== undefined ? { candidateSubsetDigest: execution.featureSubsetDigest } : {}) },
    returnedProbabilityMass: execution.source.maiaPage.returnedProbabilityMass, coverage: execution.source.coverage,
    layers: execution.layers, considered: execution.considered, chosenMoveUci: execution.chosenMoveUci };
  const value = Object.freeze({ ...body, sources: Object.freeze(body.sources), derivationDigest: digest(body) });
  DECISIONS.add(value);
  return value;
}

export function assertBotPolicyDecisionRecord(value: unknown): asserts value is BotPolicyDecisionRecord {
  if (typeof value !== "object" || value === null || !DECISIONS.has(value)) throw new TypeError("unsealed policy decision");
}

export interface BotOpponentPlyRequest {
  readonly requestId: `botreq_${string}`;
  readonly expectedNodeId: string;
  readonly expectedBranchId: string;
  readonly expectedEventHeadDigest: Sha;
}

export function parseBotOpponentPlyRequest(value: unknown): BotOpponentPlyRequest {
  if (typeof value !== "object" || value === null) throw new TypeError("invalid bot request");
  const request = value as Record<string, unknown>;
  if (typeof request.requestId !== "string" || !/^botreq_[A-Za-z0-9_-]{16,128}$/u.test(request.requestId)
    || typeof request.expectedNodeId !== "string" || typeof request.expectedBranchId !== "string"
    || typeof request.expectedEventHeadDigest !== "string") throw new TypeError("invalid bot request");
  return Object.freeze({ requestId: request.requestId as `botreq_${string}`, expectedNodeId: request.expectedNodeId,
    expectedBranchId: request.expectedBranchId, expectedEventHeadDigest: request.expectedEventHeadDigest as Sha });
}

export interface BotOperationRecord {
  readonly requestId: `botreq_${string}`;
  readonly root: BotRootIdentity;
  readonly writerLeaseDigest: Sha;
  readonly profileDigest: Sha;
  readonly seed: number;
  readonly preProviderOperandDigest: Sha;
  readonly commitOperandDigest: Sha;
  readonly derivationDigest: Sha;
  readonly providerDeliveryDigests: readonly Sha[];
  readonly chosenMoveUci: string;
  readonly committedEventSequence: number;
  readonly operationDigest: Sha;
  readonly timingMs: Readonly<{ total: number; maia: number; guard: number; composition: number }>;
}
export interface BotPolicyEventEnvelope { readonly decision: BotPolicyDecisionRecord; readonly operation: BotOperationRecord }

export function preProviderOperandDigest(input: { request: BotOpponentPlyRequest; root: BotRootIdentity; writerLeaseDigest: Sha; profile: BotProfileReference; seed: number }): Sha {
  return digest({ request: input.request, root: input.root, writerLeaseDigest: input.writerLeaseDigest,
    profile: input.profile, seed: input.seed });
}

export function beginBotOperation(input: { request: BotOpponentPlyRequest; root: BotRootIdentity; writerLeaseDigest: Sha;
  profile: BotProfileReference; seed: number; previous?: BotPolicyEventEnvelope }):
  Readonly<{ kind: "proceed"; preProviderOperandDigest: Sha }> | Readonly<{ kind: "replayed_idempotent"; envelope: BotPolicyEventEnvelope }> |
  Readonly<{ kind: "request_reused_with_different_operands" }> {
  const pre = preProviderOperandDigest(input);
  if (input.previous === undefined) return Object.freeze({ kind: "proceed", preProviderOperandDigest: pre });
  if (input.previous.operation.requestId !== input.request.requestId || input.previous.operation.preProviderOperandDigest !== pre) {
    return Object.freeze({ kind: "request_reused_with_different_operands" });
  }
  return Object.freeze({ kind: "replayed_idempotent", envelope: input.previous });
}

export function commitBotOperation(input: { request: BotOpponentPlyRequest; currentRoot: BotOperationRootAuthority;
  decision: BotPolicyDecisionRecord; writerLeaseDigest: Sha; preProviderOperandDigest: Sha; eventSequence: number;
  timingMs: BotOperationRecord["timingMs"]; existingAtCommit?: BotPolicyEventEnvelope }):
  Readonly<{ kind: "committed"; envelope: BotPolicyEventEnvelope }>
  | Readonly<{ kind: "replayed_concurrent_winner"; envelope: BotPolicyEventEnvelope }>
  | Readonly<{ kind: "concurrent_commit_conflict" }>
  | Readonly<{ kind: "stale_root" }> {
  assertBotPolicyDecisionRecord(input.decision);
  const providerDeliveryDigests = Object.freeze([input.decision.sources.maia.deliveryDigest,
    ...(input.decision.sources.stockfish === undefined ? [] : [input.decision.sources.stockfish.deliveryDigest])]);
  const commitOperandDigest = digest({ preProviderOperandDigest: input.preProviderOperandDigest,
    derivationDigest: input.decision.derivationDigest, providerDeliveryDigests });
  if (input.existingAtCommit !== undefined) {
    const winner = input.existingAtCommit.operation;
    if (winner.requestId === input.request.requestId && winner.preProviderOperandDigest === input.preProviderOperandDigest
      && winner.commitOperandDigest === commitOperandDigest) return Object.freeze({ kind: "replayed_concurrent_winner", envelope: input.existingAtCommit });
    return Object.freeze({ kind: "concurrent_commit_conflict" });
  }
  const root = input.currentRoot.identity;
  if (input.request.expectedNodeId !== root.nodeId || input.request.expectedBranchId !== root.branchId
    || input.request.expectedEventHeadDigest !== root.preCommitEventHeadDigest || stable(root) !== stable(input.decision.root)) {
    return Object.freeze({ kind: "stale_root" });
  }
  const operationImage = { requestId: input.request.requestId, root, writerLeaseDigest: input.writerLeaseDigest,
    profileDigest: input.decision.profile.digest, seed: input.decision.seed, preProviderOperandDigest: input.preProviderOperandDigest,
    commitOperandDigest, derivationDigest: input.decision.derivationDigest, providerDeliveryDigests,
    chosenMoveUci: input.decision.chosenMoveUci, committedEventSequence: input.eventSequence };
  const operation = Object.freeze({ ...operationImage, operationDigest: digest(operationImage), timingMs: Object.freeze({ ...input.timingMs }) });
  const envelope = Object.freeze({ decision: input.decision, operation });
  return Object.freeze({ kind: "committed", envelope });
}

export function saveReloadEnvelope(envelope: BotPolicyEventEnvelope): BotPolicyEventEnvelope {
  const value = JSON.parse(JSON.stringify(envelope)) as BotPolicyEventEnvelope;
  const { operationDigest, timingMs: _timing, ...operationImage } = value.operation;
  if (digest(operationImage) !== operationDigest) throw new TypeError("persisted operation digest mismatch");
  if (value.decision.derivationDigest !== envelope.decision.derivationDigest) throw new TypeError("persisted decision mismatch");
  assertPersistedProviderInput(value.decision.sources.maia);
  if (value.decision.sources.stockfish !== undefined) assertPersistedProviderInput(value.decision.sources.stockfish);
  return Object.freeze({ decision: Object.freeze(value.decision), operation: Object.freeze({ ...value.operation, timingMs: Object.freeze(value.operation.timingMs) }) });
}

export type BotProviderInstanceSnapshot =
  | Readonly<{ instanceId: "maia-inference" | "stockfish-play"; state: "not_configured" }>
  | Readonly<{ instanceId: "maia-inference" | "stockfish-play"; state: "unverified"; generation: string }>
  | Readonly<{ instanceId: "maia-inference" | "stockfish-play"; state: "available" | "degraded_cached_only" | "unavailable"; generation: string }>;
export type BotProviderOperationAvailability =
  | Readonly<{ state: "available" | "requestable_unverified" | "cached_exact_only"; instanceIds: readonly ("maia-inference" | "stockfish-play")[] }>
  | Readonly<{ state: "unavailable"; instanceIds: readonly ("maia-inference" | "stockfish-play")[]; reason: string }>;
export interface BotProviderRegistrySnapshot {
  readonly revision: number;
  readonly instances: readonly BotProviderInstanceSnapshot[];
  readonly operations: readonly Readonly<{ operationId: BotProviderOperation; availability: BotProviderOperationAvailability }>[];
}
export interface BotReleaseReceipt {
  readonly catalogDigest: Sha;
  readonly maiaGeneration: string;
  readonly stockfishGeneration: string | null;
  readonly guardComplete: boolean;
}
export type BotProfileAvailability =
  | Readonly<{ kind: "available"; snapshotRevision: number }>
  | Readonly<{ kind: "unavailable"; reason: "maia_unavailable" | "guard_provider_unavailable" | "release_receipt_missing_or_stale" }>;

export function profileAvailability(profile: BotProfileReference, snapshot: BotProviderRegistrySnapshot, receipt?: BotReleaseReceipt): BotProfileAvailability {
  const maia = snapshot.instances.find((instance) => instance.instanceId === "maia-inference");
  const stockfish = snapshot.instances.find((instance) => instance.instanceId === "stockfish-play");
  const maiaOperation = snapshot.operations.find((operation) => operation.operationId === "maia.policy_page@1");
  const stockfishOperation = snapshot.operations.find((operation) => operation.operationId === "stockfish.legal_root_table@1");
  if (maia === undefined || maiaOperation === undefined || maiaOperation.availability.state === "unavailable") {
    return Object.freeze({ kind: "unavailable", reason: "maia_unavailable" });
  }
  if (profile.family === "human-baseline") return Object.freeze({ kind: "available", snapshotRevision: snapshot.revision });
  if (stockfish === undefined || stockfishOperation === undefined || stockfishOperation.availability.state === "unavailable") {
    return Object.freeze({ kind: "unavailable", reason: "guard_provider_unavailable" });
  }
  if (!("generation" in maia) || !("generation" in stockfish)) {
    return Object.freeze({ kind: "unavailable", reason: "release_receipt_missing_or_stale" });
  }
  if (receipt === undefined || receipt.catalogDigest !== BOT_PROFILE_CATALOG_DIGEST || receipt.maiaGeneration !== maia.generation
    || receipt.stockfishGeneration !== stockfish.generation || !receipt.guardComplete) {
    return Object.freeze({ kind: "unavailable", reason: "release_receipt_missing_or_stale" });
  }
  return Object.freeze({ kind: "available", snapshotRevision: snapshot.revision });
}

export type BotOpponentPlyResult =
  | Readonly<{ kind: "committed" | "replayed_idempotent" | "replayed_concurrent_winner"; status: 200; envelope: BotPolicyEventEnvelope; retryable: false; action: "continue" }>
  | Readonly<{ kind: "stale_root"; status: 409; code: "OPPONENT_STALE_ROOT"; retryable: false; action: "refresh_position" }>
  | Readonly<{ kind: "request_reused_with_different_operands"; status: 409; code: "OPPONENT_REQUEST_REUSED"; retryable: false; action: "issue_new_request" }>
  | Readonly<{ kind: "concurrent_commit_conflict"; status: 409; code: "OPPONENT_CONCURRENT_CONFLICT"; retryable: true; action: "refresh_and_retry" }>
  | Readonly<{ kind: "base_provider_unavailable"; status: 503; code: "OPPONENT_PROVIDER_UNAVAILABLE"; retryable: true; action: "retry_or_change_opponent" }>
  | Readonly<{ kind: "provider_failed"; status: 502; code: "OPPONENT_PROVIDER_FAILED"; retryable: true; action: "retry_or_change_opponent" }>;

export function botOpponentPlyResult(input:
  | Readonly<{ kind: "committed" | "replayed_idempotent" | "replayed_concurrent_winner"; envelope: BotPolicyEventEnvelope }>
  | Readonly<{ kind: "stale_root" | "request_reused_with_different_operands" | "concurrent_commit_conflict" | "base_provider_unavailable" | "provider_failed" }>): BotOpponentPlyResult {
  if (input.kind === "committed" || input.kind === "replayed_idempotent" || input.kind === "replayed_concurrent_winner") {
    return Object.freeze({ ...input, status: 200, retryable: false, action: "continue" });
  }
  switch (input.kind) {
    case "stale_root": return Object.freeze({ kind: input.kind, status: 409, code: "OPPONENT_STALE_ROOT", retryable: false, action: "refresh_position" });
    case "request_reused_with_different_operands": return Object.freeze({ kind: input.kind, status: 409, code: "OPPONENT_REQUEST_REUSED", retryable: false, action: "issue_new_request" });
    case "concurrent_commit_conflict": return Object.freeze({ kind: input.kind, status: 409, code: "OPPONENT_CONCURRENT_CONFLICT", retryable: true, action: "refresh_and_retry" });
    case "base_provider_unavailable": return Object.freeze({ kind: input.kind, status: 503, code: "OPPONENT_PROVIDER_UNAVAILABLE", retryable: true, action: "retry_or_change_opponent" });
    case "provider_failed": return Object.freeze({ kind: input.kind, status: 502, code: "OPPONENT_PROVIDER_FAILED", retryable: true, action: "retry_or_change_opponent" });
  }
}

export function parseBotOpponentPlyResult(value: unknown): BotOpponentPlyResult {
  if (typeof value !== "object" || value === null || !("kind" in value)) throw new TypeError("invalid bot result");
  const result = value as BotOpponentPlyResult;
  const reconstructed = "envelope" in result
    ? botOpponentPlyResult({ kind: result.kind, envelope: result.envelope })
    : botOpponentPlyResult({ kind: result.kind });
  if (stable(result) !== stable(reconstructed)) throw new TypeError("invalid bot result");
  return Object.freeze(result);
}
