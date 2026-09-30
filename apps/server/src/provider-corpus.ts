/** Built-in learner Explorer acquisition. The shared exchange owns parsing, receipts and retention. */
import {
  PROVIDER_RESPONSE_PARSERS, ProviderResponseInvalid, normalizeProviderRequest, providerSourceEvidence, transposeKey,
  type DeclaredEvidence, type ExplorerPositionPage, type ExplorerPositionPageRequest, type ProviderEvidenceDelivery, type ProviderSourceFailure,
} from "@chess-tabiya/runtime";
import type { CorpusQuery, CorpusRequestOptions, CorpusResult, CorpusSource } from "./corpus.js";
import { ProviderSourceUnavailable, type ProviderExchangeScheduler, type ProviderOperationDescriptor } from "./provider-exchange.js";
import { ProviderHttpError, ProviderUnavailableError, classifyProviderError, type ProviderRegistry } from "./provider-health.js";
import { ExplorerPositionPageOperation, type ProviderFetch } from "./provider-operations.js";

const OPERATION = "lichess_explorer.position_page@1";
const START_FEN4 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";

/** Existing interactive request width/history, passed through the sole refuse-only normalizer. */
export function corpusPageRequest(query: CorpusQuery, timeoutMs = 4_000): ExplorerPositionPageRequest {
  if (query.source !== "lichess-explorer") throw new TypeError("Expected Lichess corpus population");
  const positionFen4 = transposeKey(query.fen);
  return normalizeProviderRequest(OPERATION, {
    rules: "chess", setupFamily: positionFen4 === START_FEN4 ? "standard_start" : "from_position", variant: "standard",
    positionFen4, requestFen6: `${positionFen4} 0 1`, ratingBuckets: query.ratings, speeds: query.speeds,
    since: query.since, until: query.until, moveWidth: 12, history: { kind: "requested" }, topWidth: 0, recentWidth: 0, timeoutMs,
  }).request;
}

/** Health admission belongs to NEW descriptor execution, not retained lookup or each waiter. */
export function healthAdmittedExplorerOperation(fetcher: ProviderFetch, token: string | null, health: ProviderRegistry): ProviderOperationDescriptor<typeof OPERATION> {
  const descriptor = ExplorerPositionPageOperation(fetcher, token);
  return Object.freeze<ProviderOperationDescriptor<typeof OPERATION>>({
    ...descriptor,
    async execute(identity, context) {
      let httpError: ProviderHttpError | undefined;
      let protocolFailure = false;
      const admitted = ExplorerPositionPageOperation(async (url, init) => {
        try {
          const response = await fetcher(url, init);
          if (response.status !== 200) throw new ProviderHttpError(response.status, response.headers.get("retry-after"), `Explorer HTTP ${response.status}`);
          return response;
        } catch (error) {
          if (error instanceof ProviderHttpError) httpError = error;
          throw error;
        }
      }, token);
      try {
        return await health.run("evidence.explorer_query", async ({ signal, remainingMs }) => {
          if (context.signal.aborted || signal.aborted) throw Object.assign(new Error("Explorer exchange cancelled"), { name: "AbortError" });
          const capture = await admitted.execute(identity, { ...context, signal, remainingMs: Math.min(context.remainingMs, remainingMs) });
          PROVIDER_RESPONSE_PARSERS[OPERATION].parse(capture, identity);
          return capture;
        }, (error) => {
          protocolFailure = httpError === undefined && (error instanceof ProviderResponseInvalid || error instanceof ProviderSourceUnavailable && error.reason === "invalid_response");
          return protocolFailure ? { kind: "failure", reason: "protocol" } : classifyProviderError(httpError ?? error);
        }, { signal: context.signal, deadlineMonotonic: health.monotonicNow() + context.remainingMs });
      } catch (error) {
        if (error instanceof ProviderUnavailableError) throw new ProviderSourceUnavailable(protocolFailure ? "invalid_response" : "provider_unavailable", "Explorer provider health refused the exchange");
        throw error;
      }
    },
  });
}

export type ExplorerPageAcquisition = ProviderSourceFailure<typeof OPERATION> | Readonly<{ kind: "caller_expired" }> | Readonly<{
  kind: "page";
  evidence: DeclaredEvidence<ProviderEvidenceDelivery<ExplorerPositionPage, typeof OPERATION>>;
}>;

export class ExchangeCorpusSource implements CorpusSource {
  constructor(private readonly options: {
    readonly scheduler: Pick<ProviderExchangeScheduler, "get">;
    readonly monotonicNowMs: () => number;
    readonly timeoutMs?: number;
  }) {}

  /** Full sealed acquisition remains available for the RFC's separately declared narrow views. */
  async page(query: CorpusQuery, options: CorpusRequestOptions = {}): Promise<ExplorerPageAcquisition> {
    const timeoutMs = this.options.timeoutMs ?? 4_000;
    const request = corpusPageRequest(query, timeoutMs);
    const remaining = options.deadlineMonotonic === undefined ? timeoutMs : Math.min(timeoutMs, Math.floor(options.deadlineMonotonic - this.options.monotonicNowMs()));
    // Local refusal has no forged provider receipt, timestamp or exchange digest.
    if (remaining <= 0) return Object.freeze({ kind: "caller_expired" });
    const result = await this.options.scheduler.get({ operation: OPERATION, request }, { id: "learner:explorer", budgetMs: remaining }, options.signal ?? new AbortController().signal);
    if (result.kind === "source_failure") return result;
    if (result.kind !== "success") throw new TypeError("Explorer has no local-domain result");
    return Object.freeze({ kind: "page", evidence: providerSourceEvidence(OPERATION, result.delivery) });
  }

  /** Compatibility output only. No sample floor, parser, request cache, node identity or chess judgement. */
  async stats(query: CorpusQuery, options: CorpusRequestOptions = {}): Promise<CorpusResult> {
    // Retain the population asked of even if the caller mutates its input while awaiting I/O.
    const captured = Object.freeze({ ...query, ratings: Object.freeze([...query.ratings]), speeds: Object.freeze([...query.speeds]) });
    const acquired = await this.page(captured, options);
    if (acquired.kind !== "page") return Object.freeze({
      kind: "abstention", reason: "source_unavailable", detail: acquired.kind === "caller_expired" ? "Explorer caller deadline exceeded" : `Explorer exchange ${acquired.reason}`,
      population: Object.freeze({ source: "lichess-explorer", ratings: captured.ratings, speeds: captured.speeds, since: captured.since, until: captured.until }),
    });
    const page = acquired.evidence.payload.payload;
    const { request, result } = page;
    const months = result.history.kind === "reported" ? result.history.rows.filter((row) => row.played > 0).map((row) => row.period).sort() : [];
    const newest = months.at(-1);
    return Object.freeze({
      kind: "stats", ...result.totals,
      moves: Object.freeze(result.moves.map((row) => Object.freeze({
        san: row.canonicalSan, uci: row.canonicalUci, playedCount: row.played,
        sharePct: result.totals.total === 0 ? 0 : Math.round(row.played / result.totals.total * 1_000) / 10,
        ...row.counts,
      })).sort((a, b) => b.playedCount - a.playedCount || a.san.localeCompare(b.san))),
      recency: newest === undefined ? Object.freeze({ kind: "absent" }) : Object.freeze({ kind: "month", lastPlayedMonth: newest }),
      population: Object.freeze({ source: "lichess-explorer", ratings: request.ratingBuckets as CorpusQuery["ratings"], speeds: request.speeds, since: request.since!, until: request.until! }),
    });
  }
}
