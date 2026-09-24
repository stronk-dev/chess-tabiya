/**
 * The operation-keyed provider protocol types (rfc/provider-exchange-and-execution.md §§3–8).
 *
 * Every map is keyed by the one closed `ProviderOperationId` union; there is no open `Record` in a
 * requested or actual identity. Runtime identity rows live in `provider-protocol.ts`.
 */
import type {
  EngineBinaryDigest,
  EngineContainerDigest,
  EngineOptionImageDigest,
  ProviderCacheIdentity,
  ProviderCommandsDigest,
  ProviderRequestDigest,
  ProviderResponseDigest,
} from "./provider-digest.js";

export type ProviderOperationId =
  | "stockfish.legal_root_table@1"
  | "stockfish.position_evaluation@1"
  | "maia.policy_page@1"
  | "syzygy.position@1"
  | "lichess_explorer.position_page@1";

export type ProviderOperationProviderMap = {
  readonly "stockfish.legal_root_table@1": "stockfish";
  readonly "stockfish.position_evaluation@1": "stockfish";
  readonly "maia.policy_page@1": "maia";
  readonly "syzygy.position@1": "syzygy";
  readonly "lichess_explorer.position_page@1": "lichess_explorer";
};

export type ProviderEndpointMap = {
  readonly "stockfish.legal_root_table@1": Readonly<{ kind: "uci_supervisor"; engineId: "stockfish-analysis" }>;
  readonly "stockfish.position_evaluation@1": Readonly<{ kind: "uci_supervisor"; engineId: "stockfish-analysis" }>;
  readonly "maia.policy_page@1": Readonly<{ kind: "uci_supervisor"; engineId: "maia-5m" }>;
  readonly "syzygy.position@1": Readonly<{ kind: "https"; origin: "https://tablebase.lichess.org"; path: "/standard" }>;
  readonly "lichess_explorer.position_page@1": Readonly<{ kind: "https"; origin: "https://explorer.lichess.org"; path: "/lichess" }>;
};

export type ProviderResponseParserIdMap = {
  readonly "stockfish.legal_root_table@1": "parse.stockfish_legal_root_table@1";
  readonly "stockfish.position_evaluation@1": "parse.stockfish_position_evaluation@1";
  readonly "maia.policy_page@1": "parse.maia_policy_page@1";
  readonly "syzygy.position@1": "parse.syzygy_position@1";
  readonly "lichess_explorer.position_page@1": "parse.lichess_explorer_position_page@1";
};

// ---------------------------------------------------------------------------------------------
// §5 Stockfish
// ---------------------------------------------------------------------------------------------

export interface StockfishCommandIdentity {
  readonly commands: readonly string[];
  readonly commandsDigest: ProviderCommandsDigest;
}

export interface StockfishLegalRootTableRequest {
  readonly fen: string;
  readonly bound: { readonly kind: "depth"; readonly value: number };
  readonly requestedWidth: "all_legal";
  readonly moveIdentity: "chessops-king-takes-rook@1";
  readonly requestedEngine: { readonly id: string; readonly version: string };
  readonly timeoutMs: number;
}

export type LegalRootScore =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly outcome: "root_mates" | "root_is_mated"; readonly distance: number; readonly unit: "moves" };

export interface StockfishLegalRootTable {
  readonly request: StockfishLegalRootTableRequest;
  readonly scoreFrame: "root_side_to_move";
  readonly rows: readonly {
    readonly moveUci: string;
    readonly reachedDepth: number;
    readonly score: LegalRootScore;
    readonly pv: readonly string[];
  }[];
}

export type FixedBoundPositionScore =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black"; readonly distance: number; readonly unit: "moves" };

export interface StockfishPositionEvaluationRequest {
  readonly fen: string;
  readonly requestedEngine: { readonly id: string; readonly version: string };
  readonly bound:
    | { readonly kind: "movetime"; readonly requestedMs: number }
    | { readonly kind: "depth"; readonly requestedDepth: number }
    | { readonly kind: "nodes"; readonly requestedNodes: number };
  readonly timeoutMs: number;
}

export interface FixedBoundPositionEvaluation {
  readonly fen: string;
  readonly positionKey: string;
  readonly perspective: "white";
  readonly score: FixedBoundPositionScore;
  readonly rawWdl: { readonly subject: "side_to_move"; readonly win: number; readonly draw: number; readonly loss: number };
  readonly engine: { readonly id: string; readonly name: string; readonly version: string };
  readonly bound:
    | { readonly kind: "movetime"; readonly requestedMs: number; readonly reachedDepth: number | null }
    | { readonly kind: "depth"; readonly requestedDepth: number; readonly reachedDepth: number | null }
    | { readonly kind: "nodes"; readonly requestedNodes: number; readonly reachedDepth: number | null };
}

// ---------------------------------------------------------------------------------------------
// §6 Maia
// ---------------------------------------------------------------------------------------------

export type MaiaPositionRequest =
  | { readonly kind: "history_conditioned"; readonly startFen: string; readonly historyUci: readonly string[] }
  | { readonly kind: "exact_fen"; readonly fen: string };

export interface MaiaPolicyPageRequest {
  readonly position: MaiaPositionRequest;
  readonly requestedModel: { readonly id: string; readonly version: string };
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
  readonly candidates: readonly { readonly moveUci: string; readonly probability: number }[];
}

// ---------------------------------------------------------------------------------------------
// §7 Syzygy
// ---------------------------------------------------------------------------------------------

export const SYZYGY_TABLEBASE_CATEGORIES = Object.freeze(["win", "syzygy-win", "maybe-win", "cursed-win", "draw", "blessed-loss", "maybe-loss", "syzygy-loss", "loss", "unknown"] as const);
export type SyzygyTablebaseCategory = (typeof SYZYGY_TABLEBASE_CATEGORIES)[number];

export interface SyzygyTablebaseMove {
  readonly uci: string;
  readonly san: string;
  readonly category: SyzygyTablebaseCategory;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
}

/** Structurally the shipped server `TablebasePosition`, validated here with exact move identities. */
export interface SyzygyTablebasePosition {
  readonly category: SyzygyTablebaseCategory;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly moves: readonly SyzygyTablebaseMove[];
}

export interface SyzygyPositionRequest {
  readonly rules: "chess";
  readonly variant: "standard";
  readonly fen: string;
  readonly timeoutMs: number;
}

export interface SyzygyOutsideDomain {
  readonly kind: "outside_domain";
  readonly reason: "piece_count";
  readonly pieceCount: number;
  readonly maximumPieceCount: 7;
}

export interface LiveSyzygyPosition {
  readonly fen: string;
  readonly position: SyzygyTablebasePosition;
}

// ---------------------------------------------------------------------------------------------
// §8 Explorer
// ---------------------------------------------------------------------------------------------

export const EXPLORER_SPEEDS = Object.freeze(["ultraBullet", "bullet", "blitz", "rapid", "classical", "correspondence"] as const);
export type ExplorerSpeed = (typeof EXPLORER_SPEEDS)[number];
export const EXPLORER_RATING_BUCKETS = Object.freeze([0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500] as const);

export type ExplorerHistoryRequest = { readonly kind: "disabled" } | { readonly kind: "requested" };

export interface ExplorerPositionPageRequest {
  readonly rules: "chess";
  readonly setupFamily: "standard_start" | "from_position";
  readonly variant: "standard";
  readonly positionFen4: string;
  readonly requestFen6: string;
  readonly ratingBuckets: readonly number[];
  readonly speeds: readonly ExplorerSpeed[];
  readonly since: string | null;
  readonly until: string | null;
  readonly moveWidth: number;
  readonly history: ExplorerHistoryRequest;
  readonly topWidth: 0;
  readonly recentWidth: 0;
  readonly timeoutMs: number;
}

export interface ExplorerWdlCounts {
  readonly white: number;
  readonly draws: number;
  readonly black: number;
}

export interface ExplorerMoveRow {
  readonly canonicalUci: string;
  readonly canonicalSan: string;
  readonly providerSan: string;
  readonly averageRating: number | null;
  readonly counts: ExplorerWdlCounts;
  readonly played: number;
}

export interface ExplorerHistoryRow {
  readonly period: string;
  readonly counts: ExplorerWdlCounts;
  readonly played: number;
}

export type ExplorerReportedOpening = { readonly kind: "reported"; readonly eco: string; readonly name: string } | { readonly kind: "absent" };
export type ExplorerReportedHistory = { readonly kind: "reported"; readonly rows: readonly ExplorerHistoryRow[] } | { readonly kind: "not_requested" };

export type ExplorerPositionPageDomainResult =
  | {
      readonly kind: "zero_population";
      readonly totals: { readonly white: 0; readonly draws: 0; readonly black: 0; readonly total: 0 };
      readonly moves: readonly [];
      readonly listed: 0;
      readonly unlisted: 0;
      readonly averageRating: null;
      readonly opening: ExplorerReportedOpening;
      readonly history: ExplorerReportedHistory;
    }
  | {
      readonly kind: "population";
      readonly totals: ExplorerWdlCounts & { readonly total: number };
      readonly moves: readonly ExplorerMoveRow[];
      readonly listed: number;
      readonly unlisted: number;
      readonly averageRating: number | null;
      readonly opening: ExplorerReportedOpening;
      readonly history: ExplorerReportedHistory;
    };

export interface ExplorerPositionPage {
  readonly request: ExplorerPositionPageRequest;
  readonly source: { readonly status: number; readonly etag: string | null };
  readonly result: ExplorerPositionPageDomainResult;
}

// ---------------------------------------------------------------------------------------------
// Operation maps
// ---------------------------------------------------------------------------------------------

export interface ProviderOperationRequestMap {
  readonly "stockfish.legal_root_table@1": StockfishLegalRootTableRequest;
  readonly "stockfish.position_evaluation@1": StockfishPositionEvaluationRequest;
  readonly "maia.policy_page@1": MaiaPolicyPageRequest;
  readonly "syzygy.position@1": SyzygyPositionRequest;
  readonly "lichess_explorer.position_page@1": ExplorerPositionPageRequest;
}

export interface ProviderOperationResultMap {
  readonly "stockfish.legal_root_table@1": StockfishLegalRootTable;
  readonly "stockfish.position_evaluation@1": FixedBoundPositionEvaluation;
  readonly "maia.policy_page@1": MaiaPolicyPage;
  readonly "syzygy.position@1": LiveSyzygyPosition;
  readonly "lichess_explorer.position_page@1": ExplorerPositionPage;
}

export interface ProviderOperationLocalResultMap {
  readonly "stockfish.legal_root_table@1": never;
  readonly "stockfish.position_evaluation@1": never;
  readonly "maia.policy_page@1": never;
  readonly "syzygy.position@1": SyzygyOutsideDomain;
  readonly "lichess_explorer.position_page@1": never;
}

export type ProviderRequestedIdentityMap = {
  readonly "stockfish.legal_root_table@1": Readonly<{ request: StockfishLegalRootTableRequest; command: StockfishCommandIdentity }>;
  readonly "stockfish.position_evaluation@1": Readonly<{ request: StockfishPositionEvaluationRequest; command: StockfishCommandIdentity }>;
  readonly "maia.policy_page@1": Readonly<{ request: MaiaPolicyPageRequest }>;
  readonly "syzygy.position@1": Readonly<{ request: SyzygyPositionRequest }>;
  readonly "lichess_explorer.position_page@1": Readonly<{ request: ExplorerPositionPageRequest }>;
};

export type StockfishActualIdentity = Readonly<{
  id: string;
  name: string;
  version: string;
  binaryDigest: EngineBinaryDigest;
  uciOptionsDigest: EngineOptionImageDigest;
}>;

export type MaiaActualIdentity = Readonly<{
  id: string;
  kind: "opponent";
  name: string;
  version: string;
  modelId: string;
  containerDigest: EngineContainerDigest;
  seedHonored: boolean;
  eloHonored: true;
  optionImageDigest: EngineOptionImageDigest;
}>;

export type ProviderActualIdentityMap = {
  readonly "stockfish.legal_root_table@1": StockfishActualIdentity;
  readonly "stockfish.position_evaluation@1": StockfishActualIdentity;
  readonly "maia.policy_page@1": MaiaActualIdentity;
  readonly "syzygy.position@1": Readonly<{ source: "lichess_syzygy"; endpoint: ProviderEndpointMap["syzygy.position@1"]; apiVersion: "standard-v1" }>;
  readonly "lichess_explorer.position_page@1": Readonly<{ source: "lichess_explorer"; endpoint: ProviderEndpointMap["lichess_explorer.position_page@1"]; apiVersion: "lichess-v1" }>;
};

export interface ProviderHttpResponseMetadata {
  readonly statusCode: 200;
  readonly headers: { readonly etag: string | null };
}

export type ProviderTransportMetadataMap = {
  readonly "stockfish.legal_root_table@1": null;
  readonly "stockfish.position_evaluation@1": null;
  readonly "maia.policy_page@1": null;
  readonly "syzygy.position@1": ProviderHttpResponseMetadata;
  readonly "lichess_explorer.position_page@1": ProviderHttpResponseMetadata;
};

export interface ProviderExecutionCapture<K extends ProviderOperationId> {
  readonly endpoint: ProviderEndpointMap[K];
  readonly actualIdentity: ProviderActualIdentityMap[K];
  readonly generation: number | null;
  readonly contentEncoding: "uci-utf8" | "http-body";
  readonly transport: ProviderTransportMetadataMap[K];
  readonly responseBytes: Uint8Array;
}

export type ProviderAcquisitionReceipt<K extends ProviderOperationId = ProviderOperationId> = K extends ProviderOperationId
  ? Readonly<{
      operation: K;
      provider: ProviderOperationProviderMap[K];
      endpoint: ProviderEndpointMap[K];
      requestedIdentity: ProviderRequestedIdentityMap[K];
      actualIdentity: ProviderActualIdentityMap[K];
      generation: number | null;
      requestedAt: string;
      retrievedAt: string;
      normalizedRequestDigest: ProviderRequestDigest;
      responseDigest: ProviderResponseDigest;
    }>
  : never;

export interface ProviderParsedPayloadReceipt<K extends ProviderOperationId> {
  readonly operation: K;
  readonly parser: ProviderResponseParserIdMap[K];
  readonly parserImplementationDigest: `sha256:${string}`;
  readonly responseDigest: ProviderResponseDigest;
  readonly payloadDigest: `sha256:${string}`;
}

export type ProviderDelivery<T, K extends ProviderOperationId> =
  | {
      readonly kind: "live";
      readonly servedAt: string;
      readonly cacheIdentity: null;
      readonly acquisition: ProviderAcquisitionReceipt<K>;
      readonly payload: T;
      readonly payloadReceipt: ProviderParsedPayloadReceipt<K>;
    }
  | {
      readonly kind: "retained_exact";
      readonly servedAt: string;
      readonly cacheIdentity: ProviderCacheIdentity;
      readonly acquisition: ProviderAcquisitionReceipt<K>;
      readonly payload: T;
      readonly payloadReceipt: ProviderParsedPayloadReceipt<K>;
    };

/** The exact payload sealed by every live provider source projection. */
export type ProviderEvidenceDelivery<T, K extends ProviderOperationId> = ProviderDelivery<T, K>;

export type TypedProviderRequest<K extends ProviderOperationId = ProviderOperationId> = K extends ProviderOperationId
  ? Readonly<{ operation: K; request: ProviderOperationRequestMap[K] }>
  : never;

export const PROVIDER_SOURCE_FAILURE_REASONS = Object.freeze(["provider_unavailable", "deadline_exceeded", "queue_full", "cancelled", "invalid_response", "identity_mismatch"] as const);
export type ProviderSourceFailureReason = (typeof PROVIDER_SOURCE_FAILURE_REASONS)[number];

export type ProviderSourceFailure<K extends ProviderOperationId> = Readonly<{
  kind: "source_failure";
  operation: K;
  normalizedRequestDigest: ProviderRequestDigest;
  failedAt: string;
  reason: ProviderSourceFailureReason;
  providerDetail?: string;
}>;

export type ProviderSuccess<K extends ProviderOperationId> = K extends ProviderOperationId
  ? Readonly<{ kind: "success"; operation: K; normalizedRequestDigest: ProviderRequestDigest; delivery: ProviderDelivery<ProviderOperationResultMap[K], K> }>
  : never;

export type ProviderLocalDomainResult<K extends ProviderOperationId> = K extends ProviderOperationId
  ? [ProviderOperationLocalResultMap[K]] extends [never]
    ? never
    : Readonly<{ kind: "local_domain_result"; operation: K; normalizedRequestDigest: ProviderRequestDigest; observedAt: string; payload: ProviderOperationLocalResultMap[K] }>
  : never;

export type TypedProviderResult<K extends ProviderOperationId = ProviderOperationId> = K extends ProviderOperationId
  ? ProviderSuccess<K> | ProviderLocalDomainResult<K> | ProviderSourceFailure<K>
  : never;

export interface ProviderPendingIdentity {
  readonly operation: ProviderOperationId;
  readonly normalizedRequestDigest: ProviderRequestDigest;
}

export interface ProviderRetainedIdentity {
  readonly pending: ProviderPendingIdentity;
  readonly actualIdentityDigest: import("./provider-digest.js").ProviderActualDigest;
  readonly generation: number | null;
}

export interface ProviderRequestDigestImage<K extends ProviderOperationId = ProviderOperationId> {
  readonly operation: K;
  readonly provider: ProviderOperationProviderMap[K];
  readonly requestedIdentity: ProviderRequestedIdentityMap[K];
}
