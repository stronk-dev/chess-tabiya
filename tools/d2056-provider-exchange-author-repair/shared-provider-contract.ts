// DISPOSABLE executable authority shared by provider consumers during RFC authoring.
// It mirrors provider-exchange-and-execution.md; production implementation replaces it.

export type ProviderOperationId =
  | "maia.policy_page@1"
  | "stockfish.legal_root_table@1";

export type ProviderScore =
  | Readonly<{ kind: "centipawns"; value: number }>
  | Readonly<{
      kind: "mate";
      outcome: "root_mates" | "root_is_mated";
      distance: number;
      unit: "moves";
    }>;

export interface MaiaPolicyPageRequest {
  readonly position:
    | Readonly<{ kind: "history_conditioned"; startFen: string; historyUci: readonly string[] }>
    | Readonly<{ kind: "exact_fen"; fen: string }>;
  readonly requestedModel: Readonly<{ id: string; version: string }>;
  readonly band: number;
  readonly temperature: number;
  readonly topP: number;
  readonly requestedWidth: number;
  readonly timeoutMs: number;
}

export interface MaiaPolicyPage {
  readonly request: MaiaPolicyPageRequest;
  readonly appliedBand: number;
  readonly temperature: number;
  readonly topP: number;
  readonly requestedWidth: number;
  readonly returnedWidth: number;
  readonly returnedProbabilityMass: number;
  readonly coverage: "bounded_top_k";
  readonly candidates: readonly Readonly<{ moveUci: string; probability: number }>[];
}

export interface StockfishLegalRootTableRequest {
  readonly fen: string;
  readonly bound: Readonly<{ kind: "depth"; value: number }>;
  readonly requestedWidth: "all_legal";
  readonly moveIdentity: "chessops-king-takes-rook@1";
  readonly requestedEngine: Readonly<{ id: string; version: string }>;
  readonly timeoutMs: number;
}

export interface StockfishLegalRootTable {
  readonly request: StockfishLegalRootTableRequest;
  readonly scoreFrame: "root_side_to_move";
  readonly rows: readonly Readonly<{
    moveUci: string;
    reachedDepth: number;
    score: ProviderScore;
    pv: readonly string[];
  }>[];
}

export interface ProviderOperationResultMap {
  readonly "maia.policy_page@1": MaiaPolicyPage;
  readonly "stockfish.legal_root_table@1": StockfishLegalRootTable;
}

type ProviderName<K extends ProviderOperationId> =
  K extends "maia.policy_page@1" ? "maia" : "stockfish";

type ProviderEndpoint<K extends ProviderOperationId> = K extends "maia.policy_page@1"
  ? Readonly<{ kind: "uci_supervisor"; engineId: "maia-5m" }>
  : Readonly<{ kind: "uci_supervisor"; engineId: "stockfish-analysis" }>;

type ProviderRequestedIdentity<K extends ProviderOperationId> = K extends "maia.policy_page@1"
  ? Readonly<{ request: MaiaPolicyPageRequest }>
  : Readonly<{ request: StockfishLegalRootTableRequest; command: Readonly<{ commands: readonly string[]; commandsDigest: `sha256:${string}` }> }>;

type ProviderActualIdentity<K extends ProviderOperationId> = K extends "maia.policy_page@1"
  ? Readonly<{ id: string; kind: "opponent"; name: string; version: string; modelId: string;
      containerDigest: `sha256:${string}` | null; seedHonored: boolean; eloHonored: true; optionImageDigest: `sha256:${string}` }>
  : Readonly<{ id: string; name: string; version: string; binaryDigest: `sha256:${string}`; uciOptionsDigest: `sha256:${string}` }>;

export interface ProviderAcquisitionReceipt<K extends ProviderOperationId> {
  readonly operation: K;
  readonly provider: ProviderName<K>;
  readonly endpoint: ProviderEndpoint<K>;
  readonly requestedIdentity: ProviderRequestedIdentity<K>;
  readonly actualIdentity: ProviderActualIdentity<K>;
  readonly generation: number | null;
  readonly requestedAt: string;
  readonly retrievedAt: string;
  readonly normalizedRequestDigest: `sha256:${string}`;
  readonly responseDigest: `sha256:${string}`;
}

export type ProviderDelivery<T, K extends ProviderOperationId> =
  | Readonly<{
      kind: "live";
      servedAt: string;
      cacheIdentity: null;
      acquisition: ProviderAcquisitionReceipt<K>;
      payload: T;
    }>
  | Readonly<{
      kind: "retained_exact";
      servedAt: string;
      cacheIdentity: `provider-cache:${string}`;
      acquisition: ProviderAcquisitionReceipt<K>;
      payload: T;
    }>;

export type ProviderEvidenceDelivery<T, K extends ProviderOperationId> = ProviderDelivery<T, K>;

export type TypedProviderResult<K extends ProviderOperationId> =
  | Readonly<{
      kind: "success";
      operation: K;
      normalizedRequestDigest: `sha256:${string}`;
      delivery: ProviderDelivery<ProviderOperationResultMap[K], K>;
    }>
  | Readonly<{
      kind: "source_failure";
      operation: K;
      normalizedRequestDigest: `sha256:${string}`;
      retryable: true;
      reason: "unavailable" | "deadline" | "invalid_response";
    }>;

const ACQUISITIONS = new WeakSet<object>();
const DELIVERIES = new WeakSet<object>();

export function makeProviderDelivery<K extends ProviderOperationId>(input: {
  readonly operation: K;
  readonly provider: ProviderName<K>;
  readonly endpoint: ProviderEndpoint<K>;
  readonly requestedIdentity: ProviderRequestedIdentity<K>;
  readonly actualIdentity: ProviderActualIdentity<K>;
  readonly normalizedRequestDigest: `sha256:${string}`;
  readonly responseDigest: `sha256:${string}`;
  readonly payload: ProviderOperationResultMap[K];
}): ProviderDelivery<ProviderOperationResultMap[K], K> {
  const acquisition = Object.freeze({
    operation: input.operation,
    provider: input.provider,
    endpoint: Object.freeze({ ...input.endpoint }),
    requestedIdentity: Object.freeze({ ...input.requestedIdentity }),
    actualIdentity: Object.freeze({ ...input.actualIdentity }),
    generation: 1,
    requestedAt: "2026-08-30T10:00:00.000Z",
    retrievedAt: "2026-08-30T10:00:00.010Z",
    normalizedRequestDigest: input.normalizedRequestDigest,
    responseDigest: input.responseDigest,
  }) as ProviderAcquisitionReceipt<K>;
  ACQUISITIONS.add(acquisition);
  const delivery = Object.freeze({
    kind: "live" as const,
    servedAt: "2026-08-30T10:00:00.011Z",
    cacheIdentity: null,
    acquisition,
    payload: Object.freeze(input.payload),
  }) as ProviderDelivery<ProviderOperationResultMap[K], K>;
  DELIVERIES.add(delivery);
  return delivery;
}

export function assertProviderDelivery<T, K extends ProviderOperationId>(
  operation: K,
  value: unknown,
): asserts value is ProviderDelivery<T, K> {
  if (typeof value !== "object" || value === null || !DELIVERIES.has(value)) {
    throw new TypeError("unsealed provider delivery");
  }
  const delivery = value as ProviderDelivery<T, K>;
  if (!ACQUISITIONS.has(delivery.acquisition) || delivery.acquisition.operation !== operation) {
    throw new TypeError("provider operation mismatch");
  }
}
