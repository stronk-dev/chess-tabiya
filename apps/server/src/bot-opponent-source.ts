/**
 * The bot-policy source join (rfc/bot-policy.md §10 op 7) and the minimal profile-availability
 * snapshot (§4.3).
 *
 * The bot owns no provider acquisition. It asks the ONE shared `ProviderExchangeScheduler` for
 * `maia.policy_page@1` and, for guarded families, `stockfish.legal_root_table@1`; this module turns
 * the typed shared results into the compiler's bot views and back:
 *
 * - `adaptMaiaDelivery` / `adaptStockfishDelivery` read an admitted shared delivery and carry its
 *   exact source identity (normalized request, response, payload and actual-identity digests) into
 *   the view, so the compiler's payload digest binds the provider bytes;
 * - `botSourceResult` maps a typed `TypedProviderResult` to the compiler's closed source result;
 * - `persistBotDeliveries` / `reloadBotSources` are the save/reload boundary: persisted deliveries
 *   re-enter ONLY through the shared operation-specific parser `parsePersistedProviderDelivery`
 *   ([[D3030]]), never as caller or stored JSON trusted by shape.
 *
 * `BotProviderAvailability` projects the provider-health authority
 * (`rfc/provider-health-degradation.md`) — its snapshot, exchange-operation availability and
 * release receipt — into the roster's `BotProviderAvailabilitySnapshot`; it has no configuration
 * input and no private health state.
 */
import {
  BOT_LAYER_DECLARATIONS,
  botEffectiveRequestedWidth,
  exactLegalMoves,
  maiaReachedFen,
  digestProviderActual,
  parsePersistedProviderDelivery,
  serializeProviderDelivery,
  type BotProfileReference,
  type BotProviderAvailabilitySnapshot,
  type BotProviderOperationState,
  type ProviderOperationAvailability,
  type MaiaPolicyPage,
  type MaiaPolicyPageRequest,
  type ProviderDelivery,
  type StockfishLegalRootTable,
  type StockfishLegalRootTableRequest,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";

import type { BotMaiaPolicyPage, BotProviderResult, BotStockfishRootTable } from "./bot-policy-compiler.js";
import type { ProviderRegistry, ProviderReleaseReceipt } from "./provider-health.js";

type MaiaDelivery = ProviderDelivery<MaiaPolicyPage, "maia.policy_page@1">;
type StockfishDelivery = ProviderDelivery<StockfishLegalRootTable, "stockfish.legal_root_table@1">;

// ---------------------------------------------------------------------------------------------
// Requests (the shared request types; the bot adds no private request shape).

export function botMaiaRequest(input: {
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly profile: BotProfileReference;
  readonly timeoutMs: number;
}): MaiaPolicyPageRequest {
  const { profile } = input;
  const position = Object.freeze({ kind: "history_conditioned" as const, startFen: input.startFen, historyUci: Object.freeze([...input.historyUci]) });
  return Object.freeze({
    position,
    requestedModel: Object.freeze({ id: profile.model.id, version: profile.model.version }),
    band: profile.band,
    temperature: profile.sampler.temperature,
    topP: profile.sampler.topP,
    requestedWidth: botEffectiveRequestedWidth(profile.sampler.requestedWidth, exactLegalMoves(maiaReachedFen(position)).length),
    timeoutMs: input.timeoutMs,
  });
}

export function botStockfishRequest(input: {
  readonly fen: string;
  readonly requestedEngine: Readonly<{ id: string; version: string }>;
  readonly timeoutMs: number;
}): StockfishLegalRootTableRequest {
  const bound = BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters.searchBound;
  return Object.freeze({
    fen: input.fen,
    bound: Object.freeze({ kind: "depth", value: bound.value }),
    requestedWidth: "all_legal",
    moveIdentity: "chessops-king-takes-rook@1",
    requestedEngine: Object.freeze({ id: input.requestedEngine.id, version: input.requestedEngine.version }),
    timeoutMs: input.timeoutMs,
  });
}

// ---------------------------------------------------------------------------------------------
// Shared delivery → bot view.

function sourceIdentity(delivery: MaiaDelivery | StockfishDelivery) {
  const acquisition = delivery.acquisition;
  return Object.freeze({
    normalizedRequestDigest: acquisition.normalizedRequestDigest,
    responseDigest: acquisition.responseDigest,
    payloadDigest: delivery.payloadReceipt.payloadDigest,
    actualIdentityDigest: acquisition.operation === "maia.policy_page@1"
      ? digestProviderActual("maia.policy_page@1", "maia", acquisition.actualIdentity as MaiaDelivery["acquisition"]["actualIdentity"])
      : digestProviderActual("stockfish.legal_root_table@1", "stockfish", acquisition.actualIdentity as StockfishDelivery["acquisition"]["actualIdentity"]),
    generation: acquisition.generation,
  });
}

/** The bot view of one admitted shared Maia page. Rows keep Maia's raw policy mass. */
export function adaptMaiaDelivery(delivery: MaiaDelivery): BotMaiaPolicyPage {
  const page = delivery.payload;
  const position = page.request.position;
  if (position.kind !== "history_conditioned") throw new TypeError("bot Maia pages are history-conditioned");
  const actual = delivery.acquisition.actualIdentity;
  return Object.freeze({
    operation: "maia.policy_page@1",
    request: Object.freeze({
      startFen: position.startFen,
      historyUci: Object.freeze([...position.historyUci]),
      band: page.request.band,
      model: Object.freeze({ id: page.request.requestedModel.id, version: page.request.requestedModel.version }),
      temperature: page.request.temperature,
      topP: page.request.topP,
      requestedWidth: page.request.requestedWidth,
    }),
    actual: Object.freeze({ modelId: actual.modelId, version: actual.version }),
    coverage: "bounded_top_k",
    rows: Object.freeze(page.candidates.map((candidate) => Object.freeze({ moveUci: candidate.moveUci, rawMass: candidate.probability }))),
    source: sourceIdentity(delivery),
  });
}

/**
 * The bot view of one admitted shared all-legal root table. Mate rows keep their sign from the root
 * side's perspective (`root_mates` positive), which the guard treats as a whole-guard abstention.
 */
export function adaptStockfishDelivery(delivery: StockfishDelivery): BotStockfishRootTable {
  const table = delivery.payload;
  return Object.freeze({
    operation: "stockfish.legal_root_table@1",
    request: Object.freeze({
      fen: table.request.fen,
      engine: BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters.engine,
      searchBound: Object.freeze({ kind: "depth", value: table.request.bound.value }),
      perspective: "root_side",
    }),
    rows: Object.freeze(table.rows.map((row) => Object.freeze({
      moveUci: row.moveUci,
      depth: row.reachedDepth,
      score: row.score.kind === "centipawns"
        ? Object.freeze({ kind: "centipawns" as const, value: row.score.value })
        : Object.freeze({ kind: "mate" as const, value: row.score.outcome === "root_mates" ? row.score.distance : -row.score.distance }),
    }))),
    source: sourceIdentity(delivery),
  });
}

export type BotSourceFailure = "unavailable" | "deadline" | "invalid_response";

/** The closed map from the exchange's failure reasons to the compiler's source failures. */
export function botSourceFailure(reason: string): BotSourceFailure {
  if (reason === "deadline_exceeded") return "deadline";
  if (reason === "invalid_response" || reason === "identity_mismatch") return "invalid_response";
  return "unavailable";
}

export function botMaiaSource(result: TypedProviderResult<"maia.policy_page@1">): BotProviderResult<BotMaiaPolicyPage> {
  if (result.kind === "success") return Object.freeze({ kind: "success", payload: adaptMaiaDelivery(result.delivery) });
  return Object.freeze({ kind: "failure", reason: result.kind === "source_failure" ? botSourceFailure(result.reason) : "invalid_response" });
}

export function botStockfishSource(result: TypedProviderResult<"stockfish.legal_root_table@1">): BotProviderResult<BotStockfishRootTable> {
  if (result.kind === "success") return Object.freeze({ kind: "success", payload: adaptStockfishDelivery(result.delivery) });
  return Object.freeze({ kind: "failure", reason: result.kind === "source_failure" ? botSourceFailure(result.reason) : "invalid_response" });
}

// ---------------------------------------------------------------------------------------------
// Save/reload boundary for the deliveries a decision was compiled from.

/** A stockfish source that produced no delivery persists only its closed failure. */
export type PersistedBotStockfish = Readonly<Record<string, unknown>>;

export interface PersistedBotDeliveries {
  readonly maia: Readonly<Record<string, unknown>>;
  readonly stockfish?: PersistedBotStockfish;
}

export function persistBotDeliveries(input: {
  readonly maia: MaiaDelivery;
  readonly stockfish?: StockfishDelivery | Readonly<{ failure: BotSourceFailure | "not_delivered" }>;
}): PersistedBotDeliveries {
  const maia = serializeProviderDelivery("maia.policy_page@1", input.maia) as unknown as Readonly<Record<string, unknown>>;
  if (input.stockfish === undefined) return Object.freeze({ maia });
  const stockfish = "failure" in input.stockfish
    ? Object.freeze({ failure: input.stockfish.failure })
    : serializeProviderDelivery("stockfish.legal_root_table@1", input.stockfish) as unknown as Readonly<Record<string, unknown>>;
  return Object.freeze({ maia, stockfish });
}

const STOCKFISH_FAILURES = new Set(["unavailable", "deadline", "invalid_response", "not_delivered"]);

/**
 * Reloads stored delivery bytes through the shared operation-specific parser and re-adapts them.
 * A copied, mutated or cross-operation delivery refuses here, before any decision is compared.
 */
export function reloadBotSources(value: unknown): {
  readonly maia: BotProviderResult<BotMaiaPolicyPage>;
  readonly stockfish?: BotProviderResult<BotStockfishRootTable>;
} {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("stored bot deliveries must be an object");
  const record = value as Readonly<Record<string, unknown>>;
  const keys = Object.keys(record).sort();
  if (!(keys.join(",") === "maia" || keys.join(",") === "maia,stockfish")) throw new TypeError("stored bot deliveries have an invalid shape");
  const maia = parsePersistedProviderDelivery("maia.policy_page@1", record.maia);
  const reloaded = { maia: Object.freeze({ kind: "success" as const, payload: adaptMaiaDelivery(maia) }) };
  if (record.stockfish === undefined) return Object.freeze(reloaded);
  const stored = record.stockfish;
  if (stored !== null && typeof stored === "object" && !Array.isArray(stored) && Object.keys(stored).join(",") === "failure") {
    const failure = (stored as { readonly failure: unknown }).failure;
    if (typeof failure !== "string" || !STOCKFISH_FAILURES.has(failure)) throw new TypeError("stored stockfish failure is outside the closed vocabulary");
    // `not_delivered` never reaches the compiler as a provider result: the guard saw no source.
    return Object.freeze({ ...reloaded, ...(failure === "not_delivered" ? {} : { stockfish: Object.freeze({ kind: "failure" as const, reason: failure as BotSourceFailure }) }) });
  }
  const stockfish = parsePersistedProviderDelivery("stockfish.legal_root_table@1", stored);
  return Object.freeze({ ...reloaded, stockfish: Object.freeze({ kind: "success" as const, payload: adaptStockfishDelivery(stockfish) }) });
}

// ---------------------------------------------------------------------------------------------
// Availability: the provider-health authority's snapshot and release receipt (D3031 / D7).

type ObservedOperation = "maia.policy_page@1" | "stockfish.legal_root_table@1";

/** Projects one provider-health operation availability to the roster's closed per-operation state. */
export function botOperationState(availability: ProviderOperationAvailability): BotProviderOperationState {
  if (availability.state === "available") return "available";
  if (availability.state === "unavailable") return "unavailable";
  // requestable_unverified, recovering, temporarily_blocked and conditional/cached-only: a roster
  // card has no position or request digest with which to prove a hit, so it is at best conditional.
  return "unverified";
}

/**
 * The bot roster's view of provider health (rfc/bot-policy.md §4.3). It defines no bot-private
 * health state: the snapshot, operation availability, release receipt and generation semantics all
 * come from the one `ProviderRegistry`; every shared-exchange outcome the bot observes is settled
 * into that registry (a sealed live delivery heals, a failure opens the serving instance).
 */
export class BotProviderAvailability {
  readonly #health: ProviderRegistry;
  readonly #releaseReceipt: () => ProviderReleaseReceipt | undefined;

  constructor(health: ProviderRegistry, releaseReceipt: () => ProviderReleaseReceipt | undefined = () => undefined) {
    this.#health = health;
    this.#releaseReceipt = releaseReceipt;
  }

  /** Records one real exchange outcome into provider health. */
  observe(_operation: ObservedOperation, result: TypedProviderResult<ObservedOperation>): void {
    this.#health.settleExchange(result);
  }

  snapshot(): BotProviderAvailabilitySnapshot {
    const snapshot = this.#health.snapshot();
    const receipt = this.#releaseReceipt();
    return Object.freeze({
      revision: snapshot.revision,
      maia: botOperationState(this.#health.exchangeOperationAvailability("maia.policy_page@1", snapshot)),
      stockfish: botOperationState(this.#health.exchangeOperationAvailability("stockfish.legal_root_table@1", snapshot)),
      guardReleaseReceipt: receipt === undefined ? "absent" : this.#health.validateReleaseReceipt(receipt) === "valid" ? "valid" : "invalid",
    });
  }
}
