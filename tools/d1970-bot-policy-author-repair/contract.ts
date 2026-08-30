// Disposable D1970-D1976 authoring contract. This specifies the RFC; it is not production code.
import { createHash } from "node:crypto";

export const BOT_PROFILE_IDS = Object.freeze(["human-baseline@1", "guarded-human@1", "pawn-forward@1"] as const);
export const BOT_LAYER_IDS = Object.freeze(["guard.severe_error@1", "trait.pawn_preference@1", "sampler.maia_reconstruction@1"] as const);
export const BOT_CLASSIFIER_IDS = Object.freeze(["pawn_move@1"] as const);
export const BOT_FEATURE_IDS = Object.freeze(["rules.exchange.predicate.legal_exchange@1", "rules.tactic.event.fork_allowed@1"] as const);
export const BOT_DEGRADATION_REASONS = Object.freeze([
  "returned_mass_below_profile_floor", "guard_unavailable", "guard_deadline", "guard_mixed_domain",
  "guard_candidate_mismatch", "candidate_features_unavailable",
] as const);

type ProfileId = (typeof BOT_PROFILE_IDS)[number];
type LayerId = (typeof BOT_LAYER_IDS)[number];
type ClassifierId = (typeof BOT_CLASSIFIER_IDS)[number];
type FeatureId = (typeof BOT_FEATURE_IDS)[number];
type DegradationReason = (typeof BOT_DEGRADATION_REASONS)[number];
type ProviderOperationId = "maia.policy_page@1" | "stockfish.legal_root_table@1";

export interface BotRootIdentity {
  readonly runId: string;
  readonly branchId: string;
  readonly nodeId: string;
  readonly eventHeadDigest: `sha256:${string}`;
  readonly beforeFenDigest: `sha256:${string}`;
  readonly historyDigest: `sha256:${string}`;
}

export interface MaiaPolicyPage {
  readonly coverage: "bounded_top_k";
  readonly returnedProbabilityMass: number;
  readonly candidates: readonly Readonly<{ moveUci: string; mass: number }>[];
}

export interface StockfishLegalRootTable {
  readonly coverage: "all_legal";
  readonly rows: readonly Readonly<{ moveUci: string; score: number }>[];
}

export interface ProviderEvidenceDelivery<T, K extends ProviderOperationId> {
  readonly operation: K;
  readonly root: BotRootIdentity;
  readonly requestDigest: `sha256:${string}`;
  readonly payloadDigest: `sha256:${string}`;
  readonly payload: T;
}

const PROVIDER_DELIVERIES = new WeakSet<object>();
const POPULATION_RECEIPTS = new WeakSet<object>();
const SOURCE_VIEWS = new WeakSet<object>();
const POLICY_RECORDS = new WeakSet<object>();

const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  return JSON.stringify(value);
};
const digest = (value: unknown): `sha256:${string}` => `sha256:${createHash("sha256").update(stable(value)).digest("hex")}`;
const moves = (rows: readonly Readonly<{ moveUci: string }>[]): readonly string[] => [...new Set(rows.map((row) => row.moveUci))].sort();
const sameSet = (left: readonly string[], right: readonly string[]): boolean => stable([...left].sort()) === stable([...right].sort());

export function admitProviderDelivery<T, K extends ProviderOperationId>(input: ProviderEvidenceDelivery<T, K>): ProviderEvidenceDelivery<T, K> {
  const value = Object.freeze({ ...input, root: Object.freeze({ ...input.root }), payload: Object.freeze(input.payload) });
  PROVIDER_DELIVERIES.add(value);
  return value;
}

export interface CandidatePopulationReceipt {
  readonly scope: "events_and_readings";
  readonly root: BotRootIdentity;
  readonly legalMoves: readonly string[];
  readonly rows: readonly Readonly<{ moveUci: string; features: readonly Readonly<{ id: FeatureId; value: boolean | number | string }>[] }>[];
  readonly digest: `sha256:${string}`;
}

export function admitCandidatePopulation(input: Omit<CandidatePopulationReceipt, "digest">): CandidatePopulationReceipt {
  if (!sameSet(input.legalMoves, moves(input.rows))) throw new TypeError("candidate packet rows are not set-equal to its legal authority");
  const value = Object.freeze({ ...input, digest: digest(input), legalMoves: Object.freeze([...input.legalMoves]), rows: Object.freeze([...input.rows]) });
  POPULATION_RECEIPTS.add(value);
  return value;
}

export interface BotSourceView {
  readonly root: BotRootIdentity;
  readonly returnedProbabilityMass: number;
  readonly maiaCoverage: "bounded_subset" | "legal_set_equal";
  readonly legalMoves: readonly string[];
  readonly candidates: readonly Readonly<{ moveUci: string; mass: number; score: number }>[];
  readonly sourceDigests: Readonly<{ maia: `sha256:${string}`; stockfish: `sha256:${string}` }>;
}

export function deriveBotSourceView(input: {
  readonly maia: ProviderEvidenceDelivery<MaiaPolicyPage, "maia.policy_page@1">;
  readonly stockfish: ProviderEvidenceDelivery<StockfishLegalRootTable, "stockfish.legal_root_table@1">;
}): BotSourceView {
  if (!PROVIDER_DELIVERIES.has(input.maia) || !PROVIDER_DELIVERIES.has(input.stockfish)) throw new TypeError("unadmitted provider delivery");
  if (stable(input.maia.root) !== stable(input.stockfish.root)) throw new TypeError("provider roots disagree");
  const legalMoves = moves(input.stockfish.payload.rows);
  const maiaMoves = moves(input.maia.payload.candidates);
  const score = new Map(input.stockfish.payload.rows.map((row) => [row.moveUci, row.score]));
  if (input.maia.payload.candidates.some((row) => !score.has(row.moveUci))) throw new TypeError("Maia returned a move outside the legal-root table");
  const value = Object.freeze({
    root: input.maia.root,
    returnedProbabilityMass: input.maia.payload.returnedProbabilityMass,
    maiaCoverage: sameSet(legalMoves, maiaMoves) ? "legal_set_equal" : "bounded_subset",
    legalMoves: Object.freeze(legalMoves),
    candidates: Object.freeze(input.maia.payload.candidates.map((row) => Object.freeze({ ...row, score: score.get(row.moveUci)! }))),
    sourceDigests: Object.freeze({ maia: input.maia.payloadDigest, stockfish: input.stockfish.payloadDigest }),
  });
  SOURCE_VIEWS.add(value);
  return value;
}

export function deriveCandidateFeatureVector(input: {
  readonly packet: CandidatePopulationReceipt;
  readonly stockfish: ProviderEvidenceDelivery<StockfishLegalRootTable, "stockfish.legal_root_table@1">;
}): readonly CandidatePopulationReceipt["rows"][number][] {
  if (!POPULATION_RECEIPTS.has(input.packet) || !PROVIDER_DELIVERIES.has(input.stockfish)) throw new TypeError("unadmitted candidate source");
  if (stable(input.packet.root) !== stable(input.stockfish.root)) throw new TypeError("candidate feature roots disagree");
  if (!sameSet(input.packet.legalMoves, moves(input.stockfish.payload.rows))) throw new TypeError("packet and legal-root sets disagree");
  return input.packet.rows;
}

export interface BotPolicyDerivation {
  readonly root: BotRootIdentity;
  readonly profileId: ProfileId;
  readonly profileVersion: 1;
  readonly profileDigest: `sha256:${string}`;
  readonly seed: number;
  readonly sourceDigests: Readonly<{ maia: `sha256:${string}`; stockfish: `sha256:${string}` }>;
  readonly returnedProbabilityMass: number;
  readonly maiaCoverage: BotSourceView["maiaCoverage"];
  readonly layers: readonly Readonly<{ id: LayerId; action: "applied" | "abstained" | "fallthrough"; reason?: DegradationReason }>[];
  readonly considered: readonly Readonly<{
    moveUci: string;
    rawMass: number;
    finalMass: number;
    guardLossCp: number;
    classifiers: readonly ClassifierId[];
    features: readonly Readonly<{ id: FeatureId; value: boolean | number | string }>[];
  }>[];
  readonly chosenMoveUci: string;
}

export interface BotPolicyDecisionRecord extends BotPolicyDerivation {
  readonly derivationDigest: `sha256:${string}`;
}

export function projectBotPolicyDecisionRecord(input: {
  readonly source: BotSourceView;
  readonly profileId: ProfileId;
  readonly profileDigest: `sha256:${string}`;
  readonly seed: number;
  readonly chosenMoveUci: string;
  readonly layers: BotPolicyDerivation["layers"];
  readonly classifiers: ReadonlyMap<string, readonly ClassifierId[]>;
  readonly features?: readonly CandidatePopulationReceipt["rows"][number][];
}): BotPolicyDecisionRecord {
  if (!SOURCE_VIEWS.has(input.source)) throw new TypeError("unsealed bot source view");
  if (!(BOT_PROFILE_IDS as readonly string[]).includes(input.profileId)) throw new TypeError("unknown bot profile id");
  for (const layer of input.layers) {
    if (!(BOT_LAYER_IDS as readonly string[]).includes(layer.id)) throw new TypeError("unknown bot layer id");
    if (layer.reason !== undefined && !(BOT_DEGRADATION_REASONS as readonly string[]).includes(layer.reason)) throw new TypeError("unknown bot degradation reason");
  }
  for (const ids of input.classifiers.values()) {
    if (ids.some((id) => !(BOT_CLASSIFIER_IDS as readonly string[]).includes(id))) throw new TypeError("unknown bot classifier id");
  }
  for (const row of input.features ?? []) {
    if (row.features.some((feature) => !(BOT_FEATURE_IDS as readonly string[]).includes(feature.id))) throw new TypeError("unknown bot feature id");
  }
  const sourceMoves = moves(input.source.candidates);
  if (!sourceMoves.includes(input.chosenMoveUci)) throw new TypeError("chosen move is outside admitted candidates");
  if (input.features !== undefined && !sameSet(sourceMoves, moves(input.features))) throw new TypeError("feature rows are not set-equal to considered candidates");
  const features = new Map((input.features ?? []).map((row) => [row.moveUci, row.features]));
  const best = Math.max(...input.source.candidates.map((row) => row.score));
  const considered = input.source.candidates.map((row) => Object.freeze({
    moveUci: row.moveUci,
    rawMass: row.mass,
    finalMass: row.mass,
    guardLossCp: best - row.score,
    classifiers: Object.freeze([...(input.classifiers.get(row.moveUci) ?? [])]),
    features: Object.freeze([...(features.get(row.moveUci) ?? [])]),
  }));
  if (!sameSet(sourceMoves, moves(considered))) throw new TypeError("considered rows differ from admitted candidates");
  const derivation: BotPolicyDerivation = Object.freeze({
    root: input.source.root, profileId: input.profileId, profileVersion: 1, profileDigest: input.profileDigest, seed: input.seed,
    sourceDigests: input.source.sourceDigests, returnedProbabilityMass: input.source.returnedProbabilityMass,
    maiaCoverage: input.source.maiaCoverage, layers: Object.freeze([...input.layers]), considered: Object.freeze(considered),
    chosenMoveUci: input.chosenMoveUci,
  });
  const value = Object.freeze({ ...derivation, derivationDigest: digest(derivation) });
  POLICY_RECORDS.add(value);
  return value;
}

export function assertBotPolicyDecisionRecord(value: unknown): asserts value is BotPolicyDecisionRecord {
  if (typeof value !== "object" || value === null || !POLICY_RECORDS.has(value)) throw new TypeError("unsealed bot policy decision record");
}

export type BotPolicySelectionResult =
  | Readonly<{ kind: "selected"; record: BotPolicyDecisionRecord }>
  | Readonly<{ kind: "base_provider_unavailable"; reason: "unavailable" | "failed"; retryable: true }>;

export function selectFromBase(input: Readonly<{ kind: "delivered"; source: BotSourceView; record: BotPolicyDecisionRecord }> | Readonly<{ kind: "unavailable" | "failed" }>): BotPolicySelectionResult {
  if (input.kind !== "delivered") return Object.freeze({ kind: "base_provider_unavailable", reason: input.kind, retryable: true });
  assertBotPolicyDecisionRecord(input.record);
  return Object.freeze({ kind: "selected", record: input.record });
}

export interface BotOpponentPlyRequest {
  readonly requestId: `botreq_${string}`;
  readonly expectedNodeId: string;
  readonly expectedBranchId: string;
  readonly expectedEventHeadDigest: `sha256:${string}`;
}

export interface BotOperationReceipt {
  readonly requestId: BotOpponentPlyRequest["requestId"];
  readonly root: BotRootIdentity;
  readonly writerLeaseDigest: `sha256:${string}`;
  readonly profileDigest: `sha256:${string}`;
  readonly derivationDigest: `sha256:${string}`;
  readonly providerReceiptDigests: readonly `sha256:${string}`[];
  readonly timingMs: Readonly<{ total: number; maia: number; guard: number; composition: number }>;
  readonly committedEventHeadDigest: `sha256:${string}`;
}

export type BotCommitOutcome =
  | Readonly<{ kind: "committed" | "replayed_idempotent"; receipt: BotOperationReceipt }>
  | Readonly<{ kind: "stale_root" }>
  | Readonly<{ kind: "request_reused_with_different_operands" }>;

export function commitAfterProvider(input: {
  readonly request: BotOpponentPlyRequest;
  readonly currentRoot: BotRootIdentity;
  readonly record: BotPolicyDecisionRecord;
  readonly writerLeaseDigest: `sha256:${string}`;
  readonly timingMs: BotOperationReceipt["timingMs"];
  readonly previous?: BotOperationReceipt;
}): BotCommitOutcome {
  assertBotPolicyDecisionRecord(input.record);
  const requestOperandDigest = digest({ request: input.request, root: input.record.root, profileDigest: input.record.profileDigest });
  if (input.previous !== undefined) {
    const priorOperandDigest = digest({ request: input.request, root: input.previous.root, profileDigest: input.previous.profileDigest });
    return requestOperandDigest === priorOperandDigest
      ? Object.freeze({ kind: "replayed_idempotent", receipt: input.previous })
      : Object.freeze({ kind: "request_reused_with_different_operands" });
  }
  if (input.request.expectedNodeId !== input.currentRoot.nodeId
    || input.request.expectedBranchId !== input.currentRoot.branchId
    || input.request.expectedEventHeadDigest !== input.currentRoot.eventHeadDigest
    || stable(input.currentRoot) !== stable(input.record.root)) return Object.freeze({ kind: "stale_root" });
  const receipt: BotOperationReceipt = Object.freeze({
    requestId: input.request.requestId, root: input.currentRoot, writerLeaseDigest: input.writerLeaseDigest,
    profileDigest: input.record.profileDigest, derivationDigest: input.record.derivationDigest,
    providerReceiptDigests: Object.freeze([input.record.sourceDigests.maia, input.record.sourceDigests.stockfish]),
    timingMs: Object.freeze({ ...input.timingMs }), committedEventHeadDigest: digest({ prior: input.currentRoot.eventHeadDigest, move: input.record.chosenMoveUci }),
  });
  return Object.freeze({ kind: "committed", receipt });
}
